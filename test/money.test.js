import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMoney } from "../lib/money.js";

test("USD con símbolo", () => {
  assert.deepEqual(parseMoney(" $389.00 "), { amount: 389, currency: "USD" });
});
test("miles con coma", () => {
  assert.deepEqual(parseMoney("$1,234.56"), { amount: 1234.56, currency: "USD" });
});
test("ARS con nbsp y miles", () => {
  assert.deepEqual(parseMoney("ARS 589,918.50"), { amount: 589918.5, currency: "ARS" });
});
test("US$ y USD", () => {
  assert.deepEqual(parseMoney("US$26.70"), { amount: 26.7, currency: "USD" });
  assert.deepEqual(parseMoney("USD 26.70"), { amount: 26.7, currency: "USD" });
});
test("sin número → null", () => {
  assert.equal(parseMoney("FREE"), null);
  assert.equal(parseMoney(undefined), null);
});

test("otras monedas no se confunden con USD", () => {
  assert.equal(parseMoney("EUR 12.00").currency, "EUR");
  assert.equal(parseMoney("€12.00").currency, "EUR");
  assert.equal(parseMoney("R$ 50.00").currency, "BRL");
  assert.equal(parseMoney("£9.99").currency, "GBP");
  assert.equal(parseMoney("CA$10.00").currency, "CAD");
  assert.equal(parseMoney("$10.00").currency, "USD");
  assert.equal(parseMoney("ARS 1,000.00").currency, "ARS");
});
