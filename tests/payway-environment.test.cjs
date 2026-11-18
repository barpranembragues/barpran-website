const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const checkout = fs.readFileSync("src/app/api/payway/checkout/route.ts", "utf8");

test("production Payway environment is selected from Netlify deployment context", () => {
  assert.match(checkout, /process\.env\.CONTEXT === "production"/);
  assert.match(checkout, /const production = isProductionDeployment\(\)/);
  assert.doesNotMatch(checkout, /isProductionHost/);
});

test("live checkout requires secure official origin", () => {
  assert.match(checkout, /isProductionDeployment\(\) && !origin/);
  assert.match(checkout, /source\.protocol !== "https:"/);
  assert.match(checkout, /source\.hostname\.toLowerCase\(\) !== "barpran\.com\.ar"/);
});

test("security controls remain enabled and fail closed", () => {
  assert.match(checkout, /PAYWAY_CHECKOUT_ENABLED !== "true"/);
  assert.match(checkout, /verifyTurnstile\(request, challenge\)/);
  assert.match(checkout, /checkRateLimit\(request\)/);
  assert.match(checkout, /UPSTASH_REDIS_REST_TOKEN/);
  assert.match(checkout, /TURNSTILE_SECRET_KEY/);
});
