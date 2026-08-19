import { NextRequest, NextResponse } from "next/server";
import { SHOP_PRODUCTS } from "@/lib/content";

const PAYWAY_CHECKOUT_API = "https://developers.decidir.com/api/v1/checkout-payment-button/link";
const PAYWAY_CHECKOUT_WEB = "https://developers.decidir.com/web/checkout";
const SITE_URL = "https://www.barpran.com.ar";

function priceToNumber(price: string) {
  const normalized = price.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function checkoutError(producto: string, code: string) {
  const url = new URL("/tienda/checkout", SITE_URL);
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
  if (!product) return checkoutError(producto || SHOP_PRODUCTS[0].id, "datos");

  if (!marca || !modelo || !anio || !motor || !combustible || !whatsapp) {
    return checkoutError(product.id, "datos");
  }

  const publicKey = process.env.NEXT_PUBLIC_PAYWAY_PUBLIC_KEY_TEST;
  const privateKey = process.env.PAYWAY_PRIVATE_KEY_TEST;
  const siteId = process.env.PAYWAY_SITE_ID_TEST;
  const templateId = process.env.PAYWAY_TEMPLATE_ID_TEST;

  if (!publicKey || !privateKey || !siteId || !templateId) {
    return checkoutError(product.id, "config");
  }

  const payload = {
    origin_platform: "BARPRAN-NEXTJS",
    payment_description: `${product.nombre} | ${marca} ${modelo} ${anio} ${motor} ${combustible}`.slice(0, 250),
    currency: "ARS",
    total_price: priceToNumber(product.precio),
    site: siteId,
    success_url: `${SITE_URL}/tienda/compra-exitosa?producto=${encodeURIComponent(product.id)}`,
    cancel_url: `${SITE_URL}/tienda/checkout?producto=${encodeURIComponent(product.id)}&cancelado=1`,
    notifications_url: `${SITE_URL}/api/payway/notificaciones`,
    template_id: Number(templateId),
    installments: [1],
    plan_gobierno: false,
    public_apikey: publicKey,
    auth_3ds: true,
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

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      console.error("Payway checkout error", response.status, data);
      return checkoutError(product.id, "payway");
    }

    const paymentId = data.payment_id ?? data.id ?? data.paymentId;
    const directUrl = data.url ?? data.checkout_url ?? data.redirect_url;

    if (typeof directUrl === "string" && directUrl.startsWith("http")) {
      return NextResponse.redirect(directUrl, 303);
    }

    if (paymentId !== undefined && paymentId !== null) {
      return NextResponse.redirect(`${PAYWAY_CHECKOUT_WEB}/${encodeURIComponent(String(paymentId))}`, 303);
    }

    console.error("Payway checkout response without payment id", data);
    return checkoutError(product.id, "payway");
  } catch (error) {
    console.error("Payway checkout request failed", error);
    return checkoutError(product.id, "payway");
  }
}
