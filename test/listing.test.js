import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./helpers.js";
import { parseListingCard, findCards } from "../lib/parse.js";

const doc = loadFixture("search-usd.html");

test("encuentra tarjetas de búsqueda sin anidadas", () => {
  const cards = findCards(doc);
  assert.ok(cards.length >= 10, `solo ${cards.length}`);
  for (const c of cards) assert.equal(cards.some((o) => o !== c && o.contains(c)), false);
});

test("tarjeta elegible a envío gratis", () => {
  const card = findCards(doc).find((c) => c.getAttribute("data-asin") === "B0CFQ5T5F6");
  assert.deepEqual(parseListingCard(card), { asin: "B0CFQ5T5F6", price: { amount: 9.99, currency: "USD" }, freeEligible: true });
});

test("tarjeta con envío pago", () => {
  const card = findCards(doc).find((c) => c.getAttribute("data-asin") === "B0CG1LGWR6");
  const r = parseListingCard(card);
  assert.equal(r.freeEligible, false);
  assert.equal(r.price.amount, 8.99);
});
