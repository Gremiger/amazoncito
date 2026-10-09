import { test } from "node:test";
import assert from "node:assert/strict";
import { isFresh, chooseRates, pickOficial, feeKey, FEE_TTL_MS } from "../lib/cache.js";

test("feeKey por moneda", () => assert.equal(feeKey("B0X", "ARS"), "fee:B0X:ARS"));
test("isFresh", () => {
  assert.equal(isFresh({ at: 0 }, FEE_TTL_MS - 1, FEE_TTL_MS), true);
  assert.equal(isFresh({ at: 0 }, FEE_TTL_MS + 1, FEE_TTL_MS), false);
  assert.equal(isFresh(undefined, 0, FEE_TTL_MS), false);
});
test("pickOficial", () => {
  assert.deepEqual(pickOficial({ casa: "oficial", venta: 1540, fechaActualizacion: "2026-10-09T12:00:00.000Z" }),
    { venta: 1540, fecha: "2026-10-09T12:00:00.000Z" });
  assert.equal(pickOficial({ error: "x" }), null);
});
test("chooseRates: fetch ok gana", () => {
  assert.deepEqual(chooseRates({ venta: 1, fecha: "a", at: 0 }, { venta: 2, fecha: "b" }, 0), { venta: 2, fecha: "b", stale: false });
});
test("chooseRates: fetch falla → cache vieja marcada stale", () => {
  assert.deepEqual(chooseRates({ venta: 1, fecha: "a", at: 0 }, null, 0), { venta: 1, fecha: "a", stale: true });
});
test("chooseRates: nada → null", () => assert.equal(chooseRates(undefined, null, 0), null));

import { shouldFetchRates, RATES_RETRY_MS } from "../lib/cache.js";

test("shouldFetchRates: espera tras un fallo reciente", () => {
  assert.equal(shouldFetchRates(undefined, 0), true);
  assert.equal(shouldFetchRates(1000, 1000 + RATES_RETRY_MS - 1), false);
  assert.equal(shouldFetchRates(1000, 1000 + RATES_RETRY_MS + 1), true);
});

import { combineRates } from "../lib/cache.js";

test("combineRates agrega MEP si está", () => {
  assert.deepEqual(combineRates({ venta: 1540, fecha: "a", stale: false }, { venta: 1540.5, fecha: "b" }),
    { venta: 1540, fecha: "a", stale: false, mep: { venta: 1540.5, fecha: "b" } });
  assert.deepEqual(combineRates({ venta: 1540, fecha: "a", stale: true }, null), { venta: 1540, fecha: "a", stale: true });
  assert.equal(combineRates(null, { venta: 1, fecha: "b" }), null);
});
