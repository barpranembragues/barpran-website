import { NextRequest, NextResponse } from "next/server";
import { SHOP_PRODUCTS } from "@/lib/content";

const PAYWAY_CHECKOUT_API = "https://developers.decidir.com/api/v1/checkout-payment-button/link";
const PAYWAY_CHECKOUT_WEB = "https://developers.decidir.com/web/checkout";
const PAYWAY_SANDBOX_TEMPLATE_ID = 1;

function priceToNumber(price: string) {
  const normalized = price.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getBaseUrl(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");

  if (host) return `${protocol}://${host}`;
  return request.nextUrl.origin;
}

function checkoutError(request: NextRequest, producto: string, code: string) {
  const url = new URL("/tienda/checkout", getBaseUrl(request));
  url.searchParams.set("producto", producto);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const producto = clean(formData.get("producto"));
  const marca = clean(formData.get("marca"));
  const modelo = clean(formData.get("modelo"));
  const anio = clean(formData.get("anio"));
  const motor = clean(formData.get("motor"));
  const combustible = clean(formData.get("combustible"));
  const whatsapp = clean(formData.get("whatsapp"));

  const product = SHOP_PRODUCTS.find((item) => item.id === producto);
  if (!product) return checkoutError(request, producto || SHOP_PRODUCTS[0].id, "datos");

  if (!marca || !modelo || !anio || !motor || !combustible || !whatsapp) {
    return checkoutError(request, product.id, "datos");
  }

  const publicKey = process.env.NEXT_PUBLIC_PAYWAY_PUBLIC_KEY_TEST;
  const privateKey = process.env.PAYWAY_PRIVATE_KEY_TEST;
  const siteId = process.env.PAYWAY_SITE_ID_TEST;

  if (!publicKey || !privateKey || !siteId) {
    console.error("Payway config missing", {
      publicKey: Boolean(publicKey),
      privateKey: Boolean(privateKey),
      siteId: Boolean(siteId),
    });
    return checkoutError(request, product.id, "config");
  }

  const baseUrl = getBaseUrl(request);
  const successUrl = `${baseUrl}/tienda/compra-exitosa?producto=${encodeURIComponent(product.id)}`;
  const cancelUrl = `${baseUrl}/tienda/cancelada`;
  const notificationsUrl = `${baseUrl}/api/payway/notificaciones`;

  const payload = {
    origin_platform: "BARPRAN-NEXTJS",
    payment_description: `${product.nombre} | ${marca} ${modelo} ${anio} ${motor} ${combustible}`.slice(0, 250),
    currency: "ARS",
    total_price: priceToNumber(product.precio),
    site: siteId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    notifications_url: notificationsUrl,
    template_id: PAYWAY_SANDBOX_TEMPLATE_ID,
    installments: [1],
    plan_gobierno: false,
    public_apikey: publicKey,
    auth_3ds: false,
  };

  try {
    const xSource = Buffer.from(
      JSON.stringify({ service: "SDK-NODE", grouper: "BARPRAN", developer: "BARPRAN" })
    ).toString("base64");

    const response = await fetch(PAYWAY_CHECKOUT_API, {
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
            status: response.status,
            response: data,
            product: product.id,
            template_id: PAYWAY_SANDBOX_TEMPLATE_ID,
            cancel_url: cancelUrl,
          },
          null,
          2
        )
      );
      return checkoutError(request, product.id, "payway");
    }

    const result = data as Record<string, unknown>;
    const paymentId = result.payment_id ?? result.id ?? result.paymentId;
    const directUrl = result.url ?? result.checkout_url ?? result.redirect_url ?? result.payment_link;

    if (typeof directUrl === "string" && directUrl.startsWith("http")) {
      return NextResponse.redirect(directUrl, 303);
    }

    if (paymentId !== undefined && paymentId !== null) {
      return NextResponse.redirect(`${PAYWAY_CHECKOUT_WEB}/${encodeURIComponent(String(paymentId))}`, 303);
    }

    console.error("Payway checkout response without payment id", JSON.stringify(data, null, 2));
    return checkoutError(request, product.id, "payway");
  } catch (error) {
    console.error("Payway checkout request failed", error);
    return checkoutError(request, product.id, "payway");
  }
}
