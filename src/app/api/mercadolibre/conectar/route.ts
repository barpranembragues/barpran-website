import { NextRequest, NextResponse } from "next/server";
import { adminAuthorized, createAuthorization, integrationConfigured, origin, redis } from "@/lib/mercadolibre";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!integrationConfigured()) return NextResponse.json({ error: "Conexión no configurada." }, { status: 503 });
  if (request.headers.get("origin") !== origin()) return NextResponse.json({ error: "Origen inválido." }, { status: 403 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096) return new NextResponse(null, { status: 413 });
    const attempts = await redis<number>("EVAL", "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end return n", 1, "barpran:ml:v1:auth-rate");
    if (attempts > 20) return new NextResponse(null, { status: 429, headers: { "Retry-After": "60" } });
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new NextResponse(null, { status: 415 });
    const text = await request.text();
    if (text.length > 4096) return new NextResponse(null, { status: 413 });
    const form = new URLSearchParams(text);
    if (!adminAuthorized(String(form.get("clave") || ""))) {
      return NextResponse.redirect(origin() + "/tienda/conectar-mercadolibre?estado=clave", 303);
    }
    const auth = await createAuthorization();
    const response = NextResponse.redirect(auth.url, 303);
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set("barpran-ml-state", auth.state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/mercadolibre/callback", maxAge: 600 });
    return response;
  } catch {
    return NextResponse.redirect(origin() + "/tienda/conectar-mercadolibre?estado=error", 303);
  }
}
