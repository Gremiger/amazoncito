import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture, docFrom } from "./helpers.js";
import { detectArgentina, glowText } from "../lib/parse.js";

test("encabezado anónimo 'Argentina'", () => {
  assert.equal(detectArgentina(loadFixture("search-usd.html")), true);
});
test("dirección guardada (Río Cuarto) + envío 'to Argentina'", () => {
  const doc = docFrom(`<span id="glow-ingress-line1">Deliver to Santiago</span><span id="glow-ingress-line2">Río Cuarto 5800‌</span>
    <div data-cy="delivery-recipe">Delivery Tue, Oct 20 to Argentina</div>`);
  assert.equal(detectArgentina(doc), true);
  assert.equal(glowText(doc), "Río Cuarto 5800");
});
test("dirección de EE. UU. sin mención a Argentina", () => {
  const doc = docFrom(`<span id="glow-ingress-line2">New York 10001</span><div>FREE delivery Tomorrow</div>`);
  assert.equal(detectArgentina(doc), false);
});
