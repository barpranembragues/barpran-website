import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

// ONLY FOR A DEPLOY PREVIEW. Never call Payway or accept card details.
// Protected by a random staging-only secret in Netlify's Deploy Preview context.
function rejected() {
  return NextResponse.json({ error: "not_available" }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
function authorized(request: NextRequest) {
  const expected = process.env.PAYWAY_TEST_ACCESS_TOKEN;
  const candidate = request.headers.get("x-barpran-test-token");
  if (!expected || expected.length < 32 || !candidate || candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}
export async function POST(request: NextRequest) {
  if (!request.nextUrl.hostname.endsWith(".netlify.app")) return rejected();
  if (process.env.PAYWAY_CHECKOUT_ENABLED === "true" || !authorized(request)) return rejected();
  if (Number(request.headers.get("content-length") ?? "0") > 1024) return rejected();

  let input: { check?: string };
  try { input = await request.json() as { check?: string }; } catch { return rejected(); }
  if (!["redis", "turnstile-success", "turnstile-fail", "turnstile-replay"].includes(input.check ?? "")) return rejected();

  if (input.check === "redis") {
    const base = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!base || !token) return NextResponse.json({ check: "redis", ok: false, error: "configuration_missing" }, { status: 503 });
    const key = "barpran:security-staging:" + createHash("sha256").update(request.headers.get("x-barpran-test-token") ?? "").digest("hex").slice(0, 12);
    try {
      const response = await fetch(base.replace(/[/]$/, "") + "/multi-exec", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, "60"]]),
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      const result: unknown = await response.json();
      const arr = Array.isArray(result) ? result : [];
      const count = (arr[0] as { result?: unknown } | undefined)?.result;
      const expiry = (arr[1] as { result?: unknown } | undefined)?.result;
      return NextResponse.json({ check: "redis", ok: response.ok && typeof count === "number" && expiry === 1, counted: typeof count === "number" }, { headers: { "Cache-Control": "no-store" } });
    } catch { return NextResponse.json({ check: "redis", ok: false }, { status: 503 }); }
  }
  const secrets: Record<string, string> = {
    "turnstile-success": "1x0000000000000000000000000000000AA",
    "turnstile-fail": "2x0000000000000000000000000000000AA",
    "turnstile-replay": "3x0000000000000000000000000000000AA",
  };
  const expectedSuccess = input.check === "turnstile-success";
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secrets[input.check ?? ""], response: "XXXX.DUMMY.TOKEN.XXXX" }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const result = await response.json() as { success?: boolean; "error-codes"?: string[] };
    const ok = response.ok && result.success === expectedSuccess;
    return NextResponse.json({ check: input.check, ok, accepted: result.success === true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ check: input.check, ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
