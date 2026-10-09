import { test } from "node:test";
import assert from "node:assert/strict";
import { pageCurrency, learnAmazonRate, normalizeFee } from "../lib/currency.js";

test("pageCurrency desde la cookie i18n-prefs", () => {
  assert.equal(pageCurrency("session-id=1; i18n-prefs=ARS; x=2"), "ARS");
  assert.equal(pageCurrency("i18n-prefs=USD"), "USD");
  assert.equal(pageCurrency("otra=1"), "USD");
});

test("learnAmazonRate: ARS / USD dentro de un rango razonable", () => {
  assert.equal(learnAmazonRate(2062424.84, 1359.99, 1540), 1516.5);
  assert.equal(learnAmazonRate(10, 1359.99, 1540), null);
  assert.equal(learnAmazonRate(2062424.84, 0, 1540), null);
});

const arsFee = { price: 589918.5, shipping: 40490.55, importCharges: 132390.45, total: 762799.5, currency: "ARS" };

test("normalizeFee USD queda igual y no es aproximado", () => {
  const usd = { price: 389, shipping: 26.7, importCharges: 87.3, total: 503, currency: "USD" };
  assert.deepEqual(normalizeFee(usd, { venta: 1540 }), { ...usd, usd, approx: false, rateSource: null });
});

test("normalizeFee ARS usa la cotización aprendida de Amazon", () => {
  const n = normalizeFee(arsFee, { venta: 1540, amazon: { venta: 1516.5 } });
  assert.equal(n.approx, true);
  assert.equal(n.rateSource, "amazon");
  assert.equal(n.usd.total, 503);
  assert.equal(n.usd.price, 389);
});

test("normalizeFee ARS sin cotización de Amazon usa el oficial", () => {
  const n = normalizeFee(arsFee, { venta: 1540 });
  assert.equal(n.rateSource, "oficial");
  assert.equal(n.usd.total, 495.32);
});

test("normalizeFee ARS sin ninguna cotización → usd null", () => {
  assert.equal(normalizeFee(arsFee, null).usd, null);
});

test("normalizeFee otra moneda → usd null", () => {
  assert.equal(normalizeFee({ ...arsFee, currency: "EUR" }, { venta: 1540 }).usd, null);
});

import { toPageCurrency } from "../lib/currency.js";

const usdFee = { price: 289.99, shipping: 26.48, importCharges: 66.46, total: 382.93, currency: "USD" };

test("toPageCurrency: USD cacheado se muestra en ARS con la cotización de Amazon", () => {
  const f = toPageCurrency(usdFee, "ARS", { amazon: { venta: 1516.5 } });
  assert.equal(f.currency, "ARS");
  assert.ok(Math.abs(f.total - 580713.35) < 0.02, String(f.total));
  assert.ok(Math.abs(f.price - 439769.84) < 0.02, String(f.price));
});
test("toPageCurrency: sin cotización de Amazon o misma moneda, queda igual", () => {
  assert.equal(toPageCurrency(usdFee, "ARS", { venta: 1540 }), usdFee);
  assert.equal(toPageCurrency(usdFee, "USD", { amazon: { venta: 1516.5 } }), usdFee);
});
