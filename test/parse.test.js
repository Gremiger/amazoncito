import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture, docFrom } from "./helpers.js";
import { parseFeeDetails, isNoShip, isCaptcha, parseFreeShippingEligible } from "../lib/parse.js";

test("ficha USD con envío pago (B0DX68TWW4)", () => {
  const fee = parseFeeDetails(loadFixture("product-usd-paid-shipping.html"));
  assert.deepEqual(fee, { price: 389, shipping: 26.7, importCharges: 87.3, total: 503, currency: "USD" });
});
test("ficha con envío gratis propio", () => {
  const fee = parseFeeDetails(loadFixture("product-usd-free-shipping.html"));
  assert.deepEqual(fee, { price: 289.99, shipping: 0, importCharges: 66.44, total: 356.43, currency: "USD" });
});
test("ficha elegible < 99", () => {
  const doc = loadFixture("product-usd-eligible-under99.html");
  assert.deepEqual(parseFeeDetails(doc), { price: 9.99, shipping: 26.94, importCharges: 7.76, total: 44.69, currency: "USD" });
  assert.equal(parseFreeShippingEligible(doc), true);
});
test("ficha no elegible", () => {
  assert.equal(parseFreeShippingEligible(loadFixture("product-usd-paid-shipping.html")), false);
});
test("ficha en ARS", () => {
  const fee = parseFeeDetails(loadFixture("product-ars.html"));
  assert.equal(fee.currency, "ARS");
  assert.equal(fee.total, 762799.5);
});
test("no envía a Argentina", () => {
  const doc = loadFixture("product-usd-no-ship.html");
  assert.equal(parseFeeDetails(doc), null);
  assert.equal(isNoShip(doc), true);
  assert.equal(isNoShip(loadFixture("product-usd-paid-shipping.html")), false);
});
test("total ausente → suma", () => {
  const doc = docFrom(`<div id="a-popover-NEW_0"><table class="a-lineitem">
    <tr><td>Price</td><td></td><td>$10.00</td></tr>
    <tr><td>AmazonGlobal Shipping</td><td></td><td>$5.00</td></tr>
    <tr><td>Estimated Import Charges</td><td></td><td>$2.50</td></tr></table></div>`);
  assert.equal(parseFeeDetails(doc).total, 17.5);
});
test("labels en español", () => {
  const doc = docFrom(`<div id="a-popover-1"><table class="a-lineitem">
    <tr><td>Precio</td><td></td><td>US$10.00</td></tr>
    <tr><td>Envío AmazonGlobal</td><td></td><td>US$5.00</td></tr>
    <tr><td>Cargos de importación estimados</td><td></td><td>US$2.00</td></tr>
    <tr><td>Total</td><td></td><td>US$17.00</td></tr></table></div>`);
  assert.deepEqual(parseFeeDetails(doc), { price: 10, shipping: 5, importCharges: 2, total: 17, currency: "USD" });
});
test("precio 99.99 en la tarjeta no implica elegibilidad", () => {
  const doc = docFrom(`<div id="mir-layout-DELIVERY_BLOCK">$26.10 delivery. Price US$99.99</div>`);
  assert.equal(parseFreeShippingEligible(doc), false);
});
test("captcha", () => {
  assert.equal(isCaptcha(docFrom(`<form action="/errors/validateCaptcha"></form>`)), true);
  assert.equal(isCaptcha(loadFixture("product-usd-paid-shipping.html")), false);
});
test("elegibilidad con montos en ARS", () => {
  assert.equal(parseFreeShippingEligible(docFrom(`<div id="mir-layout-DELIVERY_BLOCK">FREE delivery Wednesday, October 21 to Argentina on eligible orders over ARS 150,133.50</div>`)), true);
});
