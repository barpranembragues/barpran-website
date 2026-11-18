const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const checkout = fs.readFileSync("src/app/api/payway/checkout/route.ts", "utf8");

test("production checkout is selected using strict public host", () => {
  assert.match(checkout, /const host = request\.headers\.get\("host"\)/);
  assert.match(checkout, /host === "barpran\.com\.ar"/);
  assert.match(checkout, /host === "www\.barpran\.com\.ar"/);
  assert.match(checkout, /const production = isOfficialHost\(request\)/);
  assert.doesNotMatch(checkout, /isProductionDeployment/);
});

test("rejects unsupported host and HTTPS origin", () => {
  assert.match(checkout, /!isOfficialHost\(request\) && !isPreviewHost && !isLocalHost/);
  assert.match(checkout, /isOfficialHost\(request\) && !origin/);
  assert.match(checkout, /source\.protocol !== "https:"/);
});

test("rate limits, CAPTCHA verification and kill switch stay enabled", () => {
  assert.match(checkout, /PAYWAY_CHECKOUT_ENABLED !== "true"/);
  assert.match(checkout, /verifyTurnstile\(request, challenge\)/);
  assert.match(checkout, /checkRateLimit\(request\)/);
  assert.match(checkout, /TURNSTILE_SECRET_KEY/);
  assert.match(checkout, /UPSTASH_REDIS_REST_TOKEN/);
});
