import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture, docFrom } from "./helpers.js";
import { resultFromDoc } from "../content/fetcher.js";

test("resultFromDoc", () => {
  assert.equal(resultFromDoc(loadFixture("product-usd-paid-shipping.html")).status, "ok");
  assert.equal(resultFromDoc(loadFixture("product-usd-eligible-under99.html")).eligible, true);
  assert.equal(resultFromDoc(loadFixture("product-usd-no-ship.html")).status, "noship");
  assert.equal(resultFromDoc(docFrom(`<form action="/errors/validateCaptcha"></form>`)).status, "captcha");
  assert.equal(resultFromDoc(docFrom(`<p>nada</p>`)).status, "unknown");
});

import { shouldCache } from "../content/fetcher.js";

test("no se cachea un resultado en moneda distinta de USD", () => {
  assert.equal(shouldCache({ status: "ok", fee: { currency: "ARS" } }), false);
  assert.equal(shouldCache({ status: "ok", fee: { currency: "USD" } }), true);
  assert.equal(shouldCache({ status: "noship" }), true);
  assert.equal(shouldCache({ status: "unknown" }), false);
  assert.equal(shouldCache({ status: "captcha" }), false);
});
