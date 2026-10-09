import { test } from "node:test";
import assert from "node:assert/strict";
import { courierNote, courierCart, COURIER } from "../lib/courier.js";

test("constantes del régimen", () => {
  assert.deepEqual(COURIER, { maxFob: 3000, franquicia: 400, maxUnits: 3 });
});
test("courierNote por precio del ítem", () => {
  assert.equal(courierNote(399.99), null);
  assert.equal(courierNote(400.01), "franquicia");
  assert.equal(courierNote(3000.01), "max");
  assert.equal(courierNote(null), null);
});
test("courierCart suma precios y controla unidades", () => {
  assert.deepEqual(courierCart([{ asin: "A", usdPrice: 9.99, qty: 4 }, { asin: "B", usdPrice: 389, qty: 1 }]),
    { fob: 428.96, note: "franquicia", overUnits: ["A"] });
  assert.deepEqual(courierCart([{ asin: "A", usdPrice: 1600, qty: 2 }]), { fob: 3200, note: "max", overUnits: [] });
  assert.deepEqual(courierCart([{ asin: "A", usdPrice: null, qty: 1 }]), { fob: 0, note: null, overUnits: [] });
});
