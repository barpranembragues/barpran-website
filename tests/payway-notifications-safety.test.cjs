const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const webhook = fs.readFileSync("src/app/api/payway/notificaciones/route.ts", "utf8");
const success = fs.readFileSync("src/app/tienda/compra-exitosa/page.tsx", "utf8");

test("incoming notifications are never logged or counted as verified", () => {
  assert.doesNotMatch(webhook, /console\.log\(/);
  assert.match(webhook, /verified: false/);
  assert.doesNotMatch(webhook, /status: "approved"/);
});
test("webhook limits payload size", () => {
  assert.match(webhook, /16_384/);
  assert.match(webhook, /status: 413/);
});
test("return page clearly states verification is pending", () => {
  assert.match(success, /Pago pendiente de verificación/);
  assert.match(success, /no confirma que el pago haya sido aprobado/);
  assert.doesNotMatch(success, />Pago recibido<\/h1>/);
});
