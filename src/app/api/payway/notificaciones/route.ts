import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    console.log("Payway notification", payload);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Payway notification error", error);
    return NextResponse.json({ received: false }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "payway-notifications" });
}
