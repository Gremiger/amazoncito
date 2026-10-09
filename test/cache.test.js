import { test } from "node:test";
import assert from "node:assert/strict";
import { isFresh, chooseRates, pickOficial, feeKey, FEE_TTL_MS } from "../lib/cache.js";

test("feeKey", () => assert.equal(feeKey("B0X"), "fee:B0X"));
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
