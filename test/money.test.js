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
