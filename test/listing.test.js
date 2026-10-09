import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./helpers.js";
import { parseListingCard, findCards, priceAnchor } from "../lib/parse.js";

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

test("más vendidos: tarjetas con precio p13n-sc-price", () => {
  const cards = findCards(loadFixture("bestsellers-usd.html"));
  assert.ok(cards.length >= 25, `solo ${cards.length}`);
  const r = parseListingCard(cards.find((c) => c.getAttribute("data-asin") === "B0GVTPKJVT"));
  assert.deepEqual(r.price, { amount: 154.99, currency: "USD" });
});

test("ofertas: tarjetas de producto con precio de oferta", () => {
  const cards = findCards(loadFixture("deals-usd.html"));
  assert.ok(cards.length >= 8, `solo ${cards.length}`);
  const r = parseListingCard(cards.find((c) => c.getAttribute("data-asin") === "B0GPFHCYK7"));
  assert.deepEqual(r.price, { amount: 99.99, currency: "USD" });
});

test("priceAnchor: elemento de precio dentro de la tarjeta", () => {
  const card = findCards(loadFixture("bestsellers-usd.html"))[0];
  const anchor = priceAnchor(card);
  assert.ok(anchor && card.contains(anchor) && anchor !== card);
  assert.match(anchor.textContent, /\$\d/);
});

test("patrocinados: link /sspa/click sin /dp/ literal", () => {
  const card = findCards(doc).find((c) => c.getAttribute("data-asin") === "B0CSYG2CP3");
  assert.ok(card, "la tarjeta patrocinada no se detectó");
  assert.equal(parseListingCard(card).asin, "B0CSYG2CP3");
});
test("tarjeta elegible con montos en ARS", async () => {
  const { docFrom } = await import("./helpers.js");
  const d = docFrom(`<div data-asin="B0X"><span class="a-price"><span class="a-offscreen">ARS 15,149.83</span></span>
    <a href="/dp/B0X">x</a><div data-cy="delivery-recipe">FREE delivery Wed, Oct 21 to Argentina on ARS 150,133.50 of eligible items</div></div>`);
  assert.equal(parseListingCard(findCards(d)[0]).freeEligible, true);
});
