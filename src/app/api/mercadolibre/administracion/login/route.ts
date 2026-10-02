import { NextRequest, NextResponse } from "next/server";
import { adminAuthorized, createAdminSession, origin, redis } from "@/lib/mercadolibre";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const destination = origin() + "/gestion-mercadolibre";
  if (request.headers.get("origin") !== origin()) return new NextResponse(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new NextResponse(null, { status: 415 });
  if (Number(request.headers.get("content-length") || 0) > 4096) return new NextResponse(null, { status: 413 });
  try {
    const attempts = await redis<number>("EVAL", "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end return n", 1, "barpran:ml:v1:management-auth-rate");
    if (attempts > 10) return new NextResponse(null, { status: 429, headers: { "Retry-After": "60" } });
    const text = await request.text();
    if (text.length > 4096) return new NextResponse(null, { status: 413 });
    if (!adminAuthorized(new URLSearchParams(text).get("clave") || "")) return NextResponse.redirect(destination + "?estado=clave", 303);
    const session = await createAdminSession();
    const response = NextResponse.redirect(destination, 303);
    response.cookies.set("__Host-barpran-ml-admin", session, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 3600 });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch { return NextResponse.redirect(destination + "?estado=error", 303); }
}
