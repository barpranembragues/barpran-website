import { NextRequest, NextResponse } from "next/server";

// Payway may POST notifications here, but a notification is NOT an
// authenticated payment approval. Do not log customer or card-related data.
// Payments must be reconciled independently against Payway's official records.
export async function POST(request: NextRequest) {
  const size = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(size) || size > 16_384) {
    return NextResponse.json({ received: false }, { status: 413 });
  }

  // Acknowledge delivery without trusting or acting on the payload.
  // No order state, balance, stock, or fulfilment action occurs here.
  try {
    await request.text();
    return NextResponse.json(
      { received: true, verified: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "payway-notifications", verification: "not-configured" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
