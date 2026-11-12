import { NextResponse } from "next/server";

/**
 * BARPRAN — PAUSA PREVENTIVA DE PAGOS ONLINE
 * Incidente de intentos masivos de pago, 12/11/2026.
 * No crear ni redirigir a enlaces de pago de Payway desde esta ruta.
 * Para reactivar, restaurar la integración únicamente después de implementar
 * validación server-side de Turnstile y rate limiting.
 */
export async function POST() {
  return new NextResponse(
    `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pagos temporalmente suspendidos · BARPRAN</title></head>
<body style="font-family:Arial,sans-serif;max-width:620px;margin:12vh auto;padding:24px;color:#222">
<h1>Pagos online temporalmente suspendidos</h1>
<p>Estamos realizando tareas de seguridad. Por el momento no se pueden iniciar pagos con Payway desde BARPRAN.</p>
<p>Para seguir con tu compra, comunicate por <a href="https://wa.me/5491170586143">WhatsApp</a>.</p>
<p>BARPRAN · Balcarce 84, Ramos Mejía.</p>
</body></html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "3600",
        "X-Barpran-Payment-Status": "paused",
      },
    }
  );
}
