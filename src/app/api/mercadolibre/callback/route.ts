import { NextRequest, NextResponse } from "next/server";
import { finishAuthorization, origin } from "@/lib/mercadolibre";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let status = "error";
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const cookie = request.cookies.get("barpran-ml-state")?.value;
    if (code && state && cookie === state && !request.nextUrl.searchParams.has("error")) {
      await finishAuthorization(code, state);
      status = "conectado";
    }
  } catch { /* Report only a generic outcome; OAuth values must remain private. */ }
  const response = NextResponse.redirect(origin() + "/tienda/conectar-mercadolibre?estado=" + status, 303);
  response.cookies.set("barpran-ml-state", "", { path: "/api/mercadolibre/callback", maxAge: 0, secure: true, httpOnly: true });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
