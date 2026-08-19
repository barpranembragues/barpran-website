import { NextRequest, NextResponse } from "next/server";

const PAYWAY_SANDBOX_API = "https://developers.decidir.com/api/v1/checkout-payment-button/link";
const PAYWAY_SANDBOX_WEB = "https://developers.decidir.com/web/checkout";
const PAYWAY_PRODUCTION_API = "https://ventasonline.payway.com.ar/api/v1/checkout-payment-button/link";
const PAYWAY_PRODUCTION_WEB = "https://live.decidir.com/web/checkout";
const PAYWAY_TEMPLATE_ID = 1;
const MAX_AMOUNT = 100_000_000;

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseArgentineAmount(value: string) {
  const compact = value.replace(/\s/g, "").replace(/\$/g, "").replace(/[^0-9.,]/g, "");
  if (!compact) return Number.NaN;

  if (compact.includes(",")) {
    const parts = compact.split(",");
    if (parts.length !== 2 || parts[1].length > 2) return Number.NaN;
    const whole = parts[0].replace(/\./g, "");
    const decimals = parts[1] || "0";
    return Number(`${whole}.${decimals}`);
  }

  const dotParts = compact.split(".");
  if (dotParts.length === 2 && dotParts[1].length > 0 && dotParts[1].length <= 2) {
    return Number(`${dotParts[0]}.${dotParts[1]}`);
  }

  return Number(compact.replace(/\./g, ""));
}

function getRequestHost(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  return host.split(":")[0].toLowerCase();
}

function isProductionHost(request: NextRequest) {
  const host = getRequestHost(request);
  return host === "barpran.com.ar" || host === "www.barpran.com.ar";
}

function getBaseUrl(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");

  if (host) return `${protocol}://${host}`;
  return request.nextUrl.origin;
}

function checkoutError(request: NextRequest, code: string) {
  const url = new URL("/tienda", getBaseUrl(request));
  url.searchParams.set("error", code);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const montoRaw = clean(formData.get("monto"));
  const concepto = clean(formData.get("concepto"));
  const nombre = clean(formData.get("nombre"));
  const whatsapp = clean(formData.get("whatsapp"));
  const vehiculo = clean(formData.get("vehiculo"));
  const referencia = clean(formData.get("referencia"));
  const confirmado = clean(formData.get("confirmado"));

  if (!concepto || !nombre || !whatsapp) {
    return checkoutError(request, "datos");
  }

  if (confirmado !== "si") {
    return checkoutError(request, "confirmar");
  }

  const totalPrice = parseArgentineAmount(montoRaw);
  if (!Number.isFinite(totalPrice) || totalPrice <= 0 || totalPrice > MAX_AMOUNT) {
    return checkoutError(request, "monto");
  }

  const whatsappDigits = whatsapp.replace(/\D/g, "");
  if (whatsappDigits.length < 8 || concepto.length > 120 || nombre.length > 100) {
    return checkoutError(request, "datos");
  }

  // Protección deliberada: solo el dominio oficial de BARPRAN usa credenciales reales.
  // Deploy Previews y cualquier otro hostname continúan siempre en Sandbox.
  const production = isProductionHost(request);
  const publicKey = production
    ? process.env.NEXT_PUBLIC_PAYWAY_PUBLIC_KEY_PROD
    : process.env.NEXT_PUBLIC_PAYWAY_PUBLIC_KEY_TEST;
  const privateKey = production
    ? process.env.PAYWAY_PRIVATE_KEY_PROD
    : process.env.PAYWAY_PRIVATE_KEY_TEST;
  const siteId = production
    ? process.env.PAYWAY_SITE_ID_PROD
    : process.env.PAYWAY_SITE_ID_TEST;
  const checkoutApi = production ? PAYWAY_PRODUCTION_API : PAYWAY_SANDBOX_API;
  const checkoutWeb = production ? PAYWAY_PRODUCTION_WEB : PAYWAY_SANDBOX_WEB;

  if (!publicKey || !privateKey || !siteId) {
    console.error("Payway config missing", {
      environment: production ? "production" : "sandbox",
      publicKey: Boolean(publicKey),
      privateKey: Boolean(privateKey),
      siteId: Boolean(siteId),
    });
    return checkoutError(request, "config");
  }

  const baseUrl = getBaseUrl(request);
  const successUrl = new URL("/tienda/compra-exitosa", baseUrl);
  successUrl.searchParams.set("monto", totalPrice.toFixed(2));
  successUrl.searchParams.set("concepto", concepto.slice(0, 120));
  if (referencia) successUrl.searchParams.set("referencia", referencia.slice(0, 60));

  const cancelUrl = `${baseUrl}/tienda/cancelada`;
  const notificationsUrl = `${baseUrl}/api/payway/notificaciones`;

  const descriptionParts = [concepto];
  if (vehiculo) descriptionParts.push(vehiculo);
  if (referencia) descriptionParts.push(`Ref ${referencia}`);

  const payload = {
    origin_platform: "BARPRAN-NEXTJS",
    payment_description: descriptionParts.join(" | ").slice(0, 250),
    currency: "ARS",
    total_price: Number(totalPrice.toFixed(2)),
    site: siteId,
    success_url: successUrl.toString(),
    cancel_url: cancelUrl,
    notifications_url: notificationsUrl,
    template_id: PAYWAY_TEMPLATE_ID,
    installments: [1],
    plan_gobierno: false,
    public_apikey: publicKey,
    auth_3ds: false,
  };

  try {
    const xSource = Buffer.from(
      JSON.stringify({ service: "SDK-NODE", grouper: "BARPRAN", developer: "BARPRAN" })
    ).toString("base64");

    const response = await fetch(checkoutApi, {
      method: "POST",
      headers: {
        apikey: privateKey,
        "Content-Type": "application/json",
        "X-Source": xSource,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    if (!response.ok || !data) {
      console.error(
        "Payway checkout error FULL",
        JSON.stringify(
          {
            environment: production ? "production" : "sandbox",
            status: response.status,
            response: data,
            amount: totalPrice,
            template_id: PAYWAY_TEMPLATE_ID,
            cancel_url: cancelUrl,
          },
          null,
          2
        )
      );
      return checkoutError(request, "payway");
    }

    const result = data as Record<string, unknown>;
    const paymentId = result.payment_id ?? result.id ?? result.paymentId;
    const directUrl = result.url ?? result.checkout_url ?? result.redirect_url ?? result.payment_link;

    if (typeof directUrl === "string" && directUrl.startsWith("http")) {
      return NextResponse.redirect(directUrl, 303);
    }

    if (paymentId !== undefined && paymentId !== null) {
      return NextResponse.redirect(`${checkoutWeb}/${encodeURIComponent(String(paymentId))}`, 303);
    }

    console.error("Payway checkout response without payment id", JSON.stringify(data, null, 2));
    return checkoutError(request, "payway");
  } catch (error) {
    console.error("Payway checkout request failed", error);
    return checkoutError(request, "payway");
  }
}
