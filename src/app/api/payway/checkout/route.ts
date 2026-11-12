import { NextRequest, NextResponse } from "next/server";

const PAYWAY_SANDBOX_API = "https://developers.decidir.com/api/v1/checkout-payment-button/link";
const PAYWAY_SANDBOX_WEB = "https://developers.decidir.com/web/checkout";
const PAYWAY_PRODUCTION_API = "https://ventasonline.payway.com.ar/api/v1/checkout-payment-button/link";
const PAYWAY_PRODUCTION_WEB = "https://live.decidir.com/web/checkout";
const PAYWAY_TEMPLATE_ID = 1;
const MAX_AMOUNT = 100_000_000;
const CHECKOUT_VERSION = "simple-v8-user-installments";
const MIPYME_3_COEF = 1.0912;
const MIPYME_6_COEF = 1.1870;


const PAUSED_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagos suspendidos · BARPRAN</title></head><body style="font-family:Arial,sans-serif;max-width:620px;margin:12vh auto;padding:24px"><h1>Pagos online temporalmente suspendidos</h1><p>Por seguridad, el pago online no está disponible.</p><p>Contactanos por <a href="https://wa.me/5491170586143">WhatsApp</a>.</p></body></html>`;

function blocked(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function pause() {
  return new NextResponse(PAUSED_HTML, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "3600",
      "X-Barpran-Payment-Status": "paused",
    },
  });
}

// Limitación compartida en Redis (no memoria local serverless).
// Falla cerrada: si Redis no responde, no se crea un checkout.
async function checkRateLimit(request: NextRequest): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  const ip = request.headers.get("x-nf-client-connection-ip")
    ?? request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip || ip.length > 100) return false;
  const { createHash } = await import("node:crypto");
  const fingerprint = createHash("sha256").update(ip).digest("hex");
  const bucket = Math.floor(Date.now() / 600000);
  const key = `barpran:payway:attempts:${fingerprint}:${bucket}`;
  try {
    const response = await fetch(`${url.replace(/\\/$/, "")}/multi-exec`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, "1200"]]),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return false;
    const values: unknown = await response.json();
    if (!Array.isArray(values)) return false;
    const count = (values[0] as { result?: unknown } | undefined)?.result;
    const expires = (values[1] as { result?: unknown } | undefined)?.result;
    return typeof count === "number" && count <= 5 && expires === 1;
  } catch {
    return false;
  }
}

async function verifyTurnstile(request: NextRequest, token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
    return result.success === true
      && (result.hostname === "barpran.com.ar" || result.hostname === "www.barpran.com.ar")
      && result.action === "payway_checkout";
  } catch {
    return false;
  }
}

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

function positiveCoefficient(value?: string) {
  if (!value) return null;
  const coefficient = Number(value.replace(",", "."));
  return Number.isFinite(coefficient) && coefficient > 1 ? coefficient : null;
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
  // Kill switch: nunca habilitar en producción sin validar todo el circuito.
  if (process.env.PAYWAY_CHECKOUT_ENABLED !== "true") return pause();
  // Protecciones obligatorias: fail-closed si falta cualquier clave.
  if (!process.env.TURNSTILE_SECRET_KEY || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return pause();
  // No consumir recursos externos ante formularios enviados desde otros sitios.
  const origin = request.headers.get("origin");
  if (origin) {
    let source: string;
    try { source = new URL(origin).hostname.toLowerCase(); } catch { return blocked(403, "Origen no permitido"); }
    if (source !== "barpran.com.ar" && source !== "www.barpran.com.ar") return blocked(403, "Origen no permitido");
  }
  if (!(await checkRateLimit(request))) return blocked(429, "Demasiados intentos. Contactá a BARPRAN.");
  const formData = await request.formData();
  const challenge = clean(formData.get("cf-turnstile-response"));
  if (!(await verifyTurnstile(request, challenge))) return blocked(403, "Verificación de seguridad inválida.");


  const montoRaw = clean(formData.get("monto") ?? formData.get("amount"));
  const concepto = clean(
    formData.get("concepto") ?? formData.get("descripcion") ?? formData.get("description")
  );
  const cuotasRaw = clean(formData.get("cuotas"));

  if (!concepto || concepto.length > 120) {
    return checkoutError(request, "datos");
  }

  const cashPrice = parseArgentineAmount(montoRaw);
  if (!Number.isFinite(cashPrice) || cashPrice <= 0 || cashPrice > MAX_AMOUNT) {
    return checkoutError(request, "monto");
  }

  const installments = Number(cuotasRaw || "1");
  if (![1, 3, 6].includes(installments)) {
    return checkoutError(request, "cuotas");
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

  let coefficient = 1;
  if (installments === 3) {
    coefficient =
      positiveCoefficient(process.env.PAYWAY_COEF_3_PROD) ??
      positiveCoefficient(process.env.NEXT_PUBLIC_PAYWAY_COEF_3_PROD) ??
      MIPYME_3_COEF;
  }
  if (installments === 6) {
    coefficient =
      positiveCoefficient(process.env.PAYWAY_COEF_6_PROD) ??
      positiveCoefficient(process.env.NEXT_PUBLIC_PAYWAY_COEF_6_PROD) ??
      MIPYME_6_COEF;
  }

  const totalPrice = Number((cashPrice * coefficient).toFixed(2));
  if (!Number.isFinite(totalPrice) || totalPrice <= 0 || totalPrice > MAX_AMOUNT) {
    return checkoutError(request, "monto");
  }

  const baseUrl = getBaseUrl(request);
  const successUrl = new URL("/tienda/compra-exitosa", baseUrl);
  successUrl.searchParams.set("monto", totalPrice.toFixed(2));
  successUrl.searchParams.set("montoContado", cashPrice.toFixed(2));
  successUrl.searchParams.set("cuotas", String(installments));
  successUrl.searchParams.set("concepto", concepto.slice(0, 120));

  const cancelUrl = `${baseUrl}/tienda/cancelada`;
  const notificationsUrl = `${baseUrl}/api/payway/notificaciones`;

  const payload = {
    origin_platform: "SDK-Node",
    payment_description: `${concepto} | ${installments === 1 ? "1 pago" : `${installments} cuotas MiPyME`}`.slice(0, 250),
    currency: "ARS",
    total_price: totalPrice,
    site: siteId,
    success_url: successUrl.toString(),
    cancel_url: cancelUrl,
    notifications_url: notificationsUrl,
    template_id: PAYWAY_TEMPLATE_ID,
    installments: [installments],
    plan_gobierno: installments > 1,
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
        apikey: privateKey ?? "",
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
            version: CHECKOUT_VERSION,
            environment: production ? "production" : "sandbox",
            status: response.status,
            response: data,
            cashPrice,
            totalPrice,
            installments,
            coefficient,
            plan_gobierno: installments > 1,
            template_id: PAYWAY_TEMPLATE_ID,
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
