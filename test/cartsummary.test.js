import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeCart } from "../lib/calc.js";

const ok = (price, shipping, total, eligible, currency = "USD") =>
  ({ status: "ok", eligible, fee: { price, shipping, importCharges: total - price - shipping, total, currency } });

test("suma totales y brecha a 99", () => {
  const s = summarizeCart([{ qty: 2, price: 9.99 }, { qty: 1, price: 389 }], [ok(9.99, 26.94, 44.69, true), ok(389, 26.7, 503, false)]);
  assert.deepEqual(s, { kind: "ok", total: 592.38, eligibleSubtotal: 19.98, reached: false, missing: 0 });
});
test("alcanzado descuenta envío de elegibles", () => {
  const s = summarizeCart([{ qty: 10, price: 9.99 }], [ok(9.99, 26.94, 44.69, true)]);
  assert.equal(s.reached, true);
  assert.equal(s.total, 177.5);
});
test("moneda ARS → kind currency", () => {
  assert.equal(summarizeCart([{ qty: 1, price: 1 }], [ok(1, 1, 3, false, "ARS")]).kind, "currency");
});
test("sin ningún dato → kind empty", () => {
  assert.equal(summarizeCart([{ qty: 1, price: 1 }], [{ status: "captcha" }]).kind, "empty");
});
test("carrito vacío → kind none", () => {
  assert.equal(summarizeCart([], []).kind, "none");
});
