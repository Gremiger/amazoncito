import { test } from "node:test";
import assert from "node:assert/strict";
import { arsBreakdown, freeShippingTotal, freeShippingGap } from "../lib/calc.js";
import { fmtUsd, fmtArs } from "../lib/format.js";
import { DEFAULTS, mergeSettings } from "../lib/settings.js";

test("ARS con percepciones Córdoba (30 % + 0 %)", () => {
  assert.deepEqual(arsBreakdown(503, 1540, { percepcionGanancias: 30, percepcionIibb: 0 }),
    { oficial: 774620, ganancias: 232386, iibb: 0, total: 1007006 });
});
test("ARS con IIBB", () => {
  assert.equal(arsBreakdown(100, 1000, { percepcionGanancias: 30, percepcionIibb: 2 }).total, 132000);
});
test("total con envío gratis", () => {
  assert.equal(freeShippingTotal({ price: 9.99, shipping: 26.94, importCharges: 7.76, total: 44.69 }), 17.75);
});
test("brecha a 99", () => {
  assert.equal(freeShippingGap(9.99), 89.01);
  assert.equal(freeShippingGap(150), 0);
});
test("formatos", () => {
  assert.equal(fmtUsd(503), "USD 503,00");
  assert.equal(fmtUsd(1234.5), "USD 1.234,50");
  assert.equal(fmtArs(1007006.4), "ARS 1.007.006");
});
test("settings: defaults y merge", () => {
  assert.equal(DEFAULTS.percepcionGanancias, 30);
  assert.equal(DEFAULTS.percepcionIibb, 0);
  assert.equal(DEFAULTS.mostrarArs, true);
  assert.equal(mergeSettings(undefined).concurrencia, 3);
  assert.equal(mergeSettings({ percepcionIibb: 2, junk: 1 }).percepcionIibb, 2);
  assert.equal("junk" in mergeSettings({ junk: 1 }), false);
});
