import { test } from "node:test";
import assert from "node:assert/strict";
import { sortKey, placeInOrder } from "../lib/sort.js";

const ok = (total, currency = "USD") => ({ status: "ok", fee: { price: 1, shipping: 0, importCharges: 0, total, currency } });

test("sortKey: total en USD; ARS convertido; sin dato al final", () => {
  assert.equal(sortKey(ok(44.69), null), 44.69);
  assert.equal(sortKey(ok(1500, "ARS"), { venta: 1540, amazon: { venta: 1500 } }), 1);
  assert.equal(sortKey({ status: "noship" }, null), Infinity);
  assert.equal(sortKey({ status: "unknown" }, null), Infinity);
  assert.equal(sortKey(ok(10, "EUR"), null), Infinity);
});

test("placeInOrder: reacomoda entre filas y deja el banner en su lugar", async () => {
  const { docFrom } = await import("./helpers.js");
  const doc = docFrom(`<div id="r1"><i id="banner"></i><b id="A"></b><b id="B"></b></div><div id="r2"><b id="C"></b><b id="D"></b></div>`);
  const ids = ["A", "B", "C", "D"].map((id) => doc.getElementById(id));
  const [a, b, c, d] = ids;
  placeInOrder(ids, [d, c, b, a]);
  const order = (row) => [...doc.getElementById(row).children].map((e) => e.id).join(",");
  assert.equal(order("r1"), "banner,D,C");
  assert.equal(order("r2"), "B,A");
});

import { loadFixture } from "./helpers.js";
import { findCards } from "../lib/parse.js";
import { slotsFor } from "../lib/sort.js";

for (const fx of ["search-usd.html", "bestsellers-usd.html", "deals-usd.html"]) {
  test(`slotsFor (${fx}): un lugar por tarjeta, con padres de la misma forma`, () => {
    const doc = loadFixture(fx);
    const cards = findCards(doc);
    const slots = slotsFor(cards);
    assert.ok(slots.length >= Math.min(8, cards.length), `solo ${slots.length} de ${cards.length}`);
    const shapes = new Set(slots.map(({ slot }) => slot.parentElement.tagName + "." + slot.parentElement.className));
    assert.equal(shapes.size, 1);
    for (const { slot, card } of slots) {
      assert.ok(slot.contains(card));
      assert.equal(cards.filter((c) => slot.contains(c)).length, 1);
      assert.ok(cards.filter((c) => slot.parentElement.contains(c)).length > 1, "el lugar no es el más alto exclusivo");
    }
  });
}
