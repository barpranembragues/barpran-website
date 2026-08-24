import { NextRequest, NextResponse } from "next/server";

const PAYWAY_SANDBOX_API = "https://developers.decidir.com/api/v1/checkout-payment-button/link";
const PAYWAY_SANDBOX_WEB = "https://developers.decidir.com/web/checkout";
const PAYWAY_PRODUCTION_API = "https://ventasonline.payway.com.ar/api/v1/checkout-payment-button/link";
const PAYWAY_PRODUCTION_WEB = "https://live.decidir.com/web/checkout";
const MAX_AMOUNT = 100_000_000;
const CHECKOUT_VERSION = "simple-v7-current-payway-sdk";
const PAYWAY_STANDARD_TEMPLATE_ID = 1;

// IDs históricos informados por el Portal Payway de BARPRAN.
// Se prueban primero para conservar compatibilidad con la cuenta del comercio.
const PAYWAY_TEMPLATE_ID_PROD = Number(process.env.PAYWAY_TEMPLATE_ID_PROD ?? "40982");
const PAYWAY_TEMPLATE_ID_TEST = Number(process.env.PAYWAY_TEMPLATE_ID_TEST ?? "91375");

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

function installmentsParameterRequired(data: unknown) {
  if (!data || typeof data !== "object") return false;

  const response = data as {
    validation_errors?: Array<{ code?: string; param?: string }>;
  };

  return Boolean(
    response.validation_errors?.some(
      (error) => error?.code === "param_required" && error?.param === "installments"
    )
  );
}

async function createPaywayCheckout(
  checkoutApi: string,
  privateKey: string,
  xSource: string,
  payload: Record<string, unknown>
) {
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

  return { response, data };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const montoRaw = clean(formData.get("monto") ?? formData.get("amount"));
  const concepto = clean(
    formData.get("concepto") ??
      formData.get("descripcion") ??
      formData.get("description")
  );

  if (!concepto || concepto.length > 120) {
    return checkoutError(request, "datos");
  }

  const amount = parseArgentineAmount(montoRaw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return checkoutError(request, "monto");
  }

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
  const configuredTemplateId = production ? PAYWAY_TEMPLATE_ID_PROD : PAYWAY_TEMPLATE_ID_TEST;
  const checkoutApi = production ? PAYWAY_PRODUCTION_API : PAYWAY_SANDBOX_API;
  const checkoutWeb = production ? PAYWAY_PRODUCTION_WEB : PAYWAY_SANDBOX_WEB;

  if (
    !publicKey ||
    !privateKey ||
    !siteId ||
    !Number.isFinite(configuredTemplateId) ||
    configuredTemplateId <= 0
  ) {
    console.error("Payway config missing", {
      environment: production ? "production" : "sandbox",
      publicKey: Boolean(publicKey),
      privateKey: Boolean(privateKey),
      siteId: Boolean(siteId),
      templateId: Number.isFinite(configuredTemplateId) && configuredTemplateId > 0,
    });
    return checkoutError(request, "config");
  }

  const baseUrl = getBaseUrl(request);
  const successUrl = new URL("/tienda/compra-exitosa", baseUrl);
  successUrl.searchParams.set("monto", amount.toFixed(2));
  successUrl.searchParams.set("concepto", concepto.slice(0, 120));

  const cancelUrl = `${baseUrl}/tienda/cancelada`;
  const notificationsUrl = `${baseUrl}/api/payway/notificaciones`;

  const buildPayload = (templateId: number, installments: number[]) => ({
    origin_platform: "SDK-Node",
    payment_description: concepto.slice(0, 250),
    currency: "ARS",
    total_price: Number(amount.toFixed(2)),
    site: siteId,
    success_url: successUrl.toString(),
    cancel_url: cancelUrl,
    notifications_url: notificationsUrl,
    template_id: templateId,
    installments,
    plan_gobierno: false,
    public_apikey: publicKey,
    auth_3ds: false,
    // id_payment_method se omite deliberadamente: el SDK oficial indica que así
    // Payway ofrece todos los medios de pago habilitados para el comercio.
  });

  try {
    const xSource = Buffer.from(
      JSON.stringify({ service: "SDK-NODE", grouper: "BARPRAN", developer: "BARPRAN" })
    ).toString("base64");

    let usedTemplateId = configuredTemplateId;
    let requestedInstallments = [1, 3, 6];
    let attempt = await createPaywayCheckout(
      checkoutApi,
      privateKey,
      xSource,
      buildPayload(usedTemplateId, requestedInstallments)
    );

    // Compatibilidad con cuentas/plantillas que aceptan una sola opción por request.
    if (!attempt.response.ok && installmentsParameterRequired(attempt.data)) {
      requestedInstallments = [1];
      attempt = await createPaywayCheckout(
        checkoutApi,
        privateKey,
        xSource,
        buildPayload(usedTemplateId, requestedInstallments)
      );
    }

    // El SDK oficial actual documenta template_id 1 para checkout estándar sin Cybersource.
    // Si la plantilla histórica del portal falla, reintentamos con el template actual.
    if (!attempt.response.ok && configuredTemplateId !== PAYWAY_STANDARD_TEMPLATE_ID) {
      usedTemplateId = PAYWAY_STANDARD_TEMPLATE_ID;
      requestedInstallments = [1, 3, 6];
      attempt = await createPaywayCheckout(
        checkoutApi,
        privateKey,
        xSource,
        buildPayload(usedTemplateId, requestedInstallments)
      );

      if (!attempt.response.ok && installmentsParameterRequired(attempt.data)) {
        requestedInstallments = [1];
        attempt = await createPaywayCheckout(
          checkoutApi,
          privateKey,
          xSource,
          buildPayload(usedTemplateId, requestedInstallments)
        );
      }
    }

    const { response, data } = attempt;

    if (!response.ok || !data) {
      console.error(
        "Payway checkout error FULL",
        JSON.stringify(
          {
            version: CHECKOUT_VERSION,
            environment: production ? "production" : "sandbox",
            status: response.status,
            response: data,
            amount,
            installments: requestedInstallments,
            template_id: usedTemplateId,
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
