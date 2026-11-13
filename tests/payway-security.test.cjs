const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const checkout = fs.readFileSync("src/app/api/payway/checkout/route.ts", "utf8");
const shop = fs.readFileSync("src/app/tienda/route.ts", "utf8");
const diag = fs.readFileSync("src/app/api/payway/security-diagnostics/route.ts", "utf8");

test("payment kill switch rejects before any other operation", () => {
  const start = checkout.indexOf("export async function POST(");
  assert.ok(start >= 0);
  const firstGuard = checkout.indexOf('process.env.PAYWAY_CHECKOUT_ENABLED !== "true"', start);
  const apiCall = checkout.indexOf("await fetch(checkoutApi", start);
  assert.ok(firstGuard > start && firstGuard < apiCall);
  assert.match(checkout.slice(firstGuard, firstGuard + 180), /return pause\(\)/);
});

test("the storefront remains suspended unless all required credentials exist", () => {
  assert.match(shop, /process\.env\.PAYWAY_CHECKOUT_ENABLED === "true"/);
  for (const envName of ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
    assert.ok(shop.includes(envName));
    assert.ok(checkout.includes(envName));
  }
});
test("Turnstile is verified server-side with hostname and action checks", () => {
  assert.match(checkout, /turnstile\/v0\/siteverify/);
  assert.match(checkout, /result\.success === true/);
  assert.match(checkout, /result\.hostname === "barpran\.com\.ar"/);
  assert.match(checkout, /result\.action === "payway_checkout"/);
});
test("rate limiting uses shared redis and fails closed", () => {
  assert.match(checkout, /UPSTASH_REDIS_REST_URL/);
  assert.match(checkout, /UPSTASH_REDIS_REST_TOKEN/);
  assert.match(checkout, /\/multi-exec/);
  assert.match(checkout, /count <= 5/);
  assert.match(checkout, /if \(!response\.ok\) return false/);
});
test("preview diagnostics cannot initiate Payway or be called from production", () => {
  assert.match(diag, /hostname\.endsWith\("\.netlify\.app"\)/);
  assert.match(diag, /PAYWAY_TEST_ACCESS_TOKEN/);
  assert.match(diag, /timingSafeEqual/);
  assert.ok(!diag.includes("ventasonline.payway.com.ar"));
  assert.ok(!diag.includes("developers.decidir.com/api/v1/checkout"));
  assert.ok(!diag.includes("PAYWAY_PRIVATE_KEY_PROD"));
});
