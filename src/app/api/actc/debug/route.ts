import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") || "https://www.actc.org.ar/tc/pilotos/2026/agustin-canapino_10691.html";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });
    const html = await response.text();
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].slice(0, 40).map((m) => m[0]);
    const metas = [...html.matchAll(/<meta\b[^>]*(?:image|og:|twitter:)[^>]*>/gi)].slice(0, 30).map((m) => m[0]);
    const backgrounds = [...html.matchAll(/url\(([^)]+)\)/gi)].slice(0, 30).map((m) => m[0]);

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      length: html.length,
      hasCanapino: /canapino/i.test(html),
      hasPilotos: /pilotos/i.test(html),
      imgs,
      metas,
      backgrounds,
      start: html.slice(0, 3000),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
