import { NextRequest, NextResponse } from "next/server";
import { integrationConfigured, recordNotification, validNotification } from "@/lib/mercadolibre";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!integrationConfigured()) return new NextResponse(null, { status: 503 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 16_384) return new NextResponse(null, { status: 413 });
    const text = await request.text();
    if (text.length > 16_384) return new NextResponse(null, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(text); } catch { return new NextResponse(null, { status: 400 }); }
    if (!body || typeof body !== "object" || !validNotification(body as Record<string, unknown>)) {
      return new NextResponse(null, { status: 200 });
    }
    await recordNotification();
    return new NextResponse(null, { status: 200 });
  } catch {
    // Ask Mercado Libre to retry when a hint cannot be persisted.
    return new NextResponse(null, { status: 503, headers: { "Retry-After": "15" } });
  }
}
