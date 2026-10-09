import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./helpers.js";
import { parseCart } from "../lib/parse.js";

// Fixture sintético con la estructura conocida del carrito de Amazon
// (#sc-active-cart > .sc-list-item[data-asin][data-quantity]); validar con un carrito real.
const EXPECTED = [
  { asin: "B0CFQ5T5F6", qty: 2, price: 9.99 },
  { asin: "B0DX68TWW4", qty: 1, price: 389 },
];

test("parseCart lee ítems activos, ignora guardados y anidados", () => {
  const items = parseCart(loadFixture("cart-synthetic.html"));
  assert.deepEqual(items, EXPECTED);
});
