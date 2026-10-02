import { NextResponse } from "next/server";
import { readCatalog } from "@/lib/mercadolibre";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const catalog = await readCatalog();
    return NextResponse.json(catalog, { status: catalog.status === "ready" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    // No secrets, upstream payloads, or unverifiable prices reach the browser.
    return NextResponse.json({ items: [], updatedAt: null, status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "15" } });
  }
}
