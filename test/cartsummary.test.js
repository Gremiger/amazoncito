import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeCart } from "../lib/calc.js";

const ok = (price, shipping, total, eligible, currency = "USD") =>
  ({ status: "ok", eligible, fee: { price, shipping, importCharges: total - price - shipping, total, currency } });
const rates = { venta: 1540, amazon: { venta: 1500 } };

test("suma totales y brecha a 99", () => {
  const s = summarizeCart([{ asin: "A", qty: 2 }, { asin: "B", qty: 1 }], [ok(9.99, 26.94, 44.69, true), ok(389, 26.7, 503, false)], rates);
  assert.equal(s.kind, "ok");
  assert.equal(s.total, 592.38);
  assert.equal(s.totalArs, null);
  assert.equal(s.eligibleSubtotal, 19.98);
  assert.equal(s.reached, false);
  assert.equal(s.approx, false);
  assert.deepEqual(s.courier, { fob: 408.98, note: "franquicia", overUnits: [] });
});
test("alcanzado descuenta envío de elegibles", () => {
  const s = summarizeCart([{ asin: "A", qty: 10 }], [ok(9.99, 26.94, 44.69, true)], rates);
  assert.equal(s.reached, true);
  assert.equal(s.total, 177.5);
  assert.deepEqual(s.courier.overUnits, ["A"]);
});
test("ARS: total en pesos de Amazon y USD aproximado", () => {
  const s = summarizeCart([{ asin: "A", qty: 2 }], [ok(15000, 40000, 67000, false, "ARS")], rates);
  assert.equal(s.kind, "ok");
  assert.equal(s.totalArs, 134000);
  assert.equal(s.total, 89.34);
  assert.equal(s.approx, true);
});
test("otra moneda → kind currency", () => {
  assert.equal(summarizeCart([{ asin: "A", qty: 1 }], [ok(1, 1, 3, false, "EUR")], rates).kind, "currency");
});
test("sin ningún dato → kind empty", () => {
  assert.equal(summarizeCart([{ asin: "A", qty: 1 }], [{ status: "captcha" }], rates).kind, "empty");
});
test("carrito vacío → kind none", () => {
  assert.equal(summarizeCart([], [], rates).kind, "none");
});
