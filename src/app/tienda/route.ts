import html from "@/lib/approved-shop";

export const dynamic = "force-dynamic";

function safeAttribute(value: string) {
  return value.replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character
  );
}

export function GET() {
  // En esta etapa PAYWAY_CHECKOUT_ENABLED permanece "false" en Netlify.
  // No habilitar el formulario sin todas las credenciales y revisión de seguridad.
  const enabled = process.env.PAYWAY_CHECKOUT_ENABLED === "true"
    && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    && Boolean(process.env.TURNSTILE_SECRET_KEY)
    && Boolean(process.env.UPSTASH_REDIS_REST_URL)
    && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!enabled) {
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const widgetKey = safeAttribute(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "");
  const paymentForm = `<form action="/api/payway/checkout" class="payment-form" method="POST" target="_blank">
<label>Monto a abonar (ARS)<input autocomplete="off" inputmode="decimal" maxlength="18" name="monto" placeholder="Ej.: 802.800" required type="text"></label>
<label>Descripción del producto<input maxlength="120" name="concepto" placeholder="Ej.: Kit de embrague Volkswagen Vento 1.8T" required type="text"></label>
<fieldset><legend>Forma de pago</legend><div class="payment-options"><label><input name="cuotas" required type="radio" value="1">1 pago</label><label><input name="cuotas" required type="radio" value="3">3 cuotas</label><label><input name="cuotas" required type="radio" value="6">6 cuotas</label></div></fieldset>
<p>Verificá que sos una persona antes de continuar.</p>
<div class="cf-turnstile" data-sitekey="${widgetKey}" data-action="payway_checkout"></div>
<button class="btn btn-wa" type="submit">Continuar a pago seguro ↗</button>
</form>`;

  const suspendedForm = /<div class="payment-form" role="status" aria-live="polite">[\s\S]*?<\/div>/;
  if (!suspendedForm.test(html)) {
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  const active = html
    .replace(suspendedForm, paymentForm)
    .replace("Seguridad de pagos · BARPRAN", "Pago online · Payway")
    .replace("Tu presupuesto,<br/><em>seguí por WhatsApp.</em>", "Tu presupuesto,<br/><em>listo para pagar.</em>")
    .replace("Los pagos online están pausados temporalmente mientras reforzamos la seguridad.", "Completá el monto acordado con BARPRAN, la descripción y la forma de pago.")
    .replace("Los pagos online están temporalmente suspendidos por tareas de seguridad.", "Si ya tenés un presupuesto, podés abonarlo con Payway.")
    .replace("Consultar estado de pagos ↓", "Pagar presupuesto con Payway ↓")
    .replace("</body>", '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script></body>');
  return new Response(active, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
