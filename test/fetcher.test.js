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

test("se cachea USD, ARS y no-envía; no otras monedas ni errores", () => {
  assert.equal(shouldCache({ status: "ok", fee: { currency: "ARS" } }), true);
  assert.equal(shouldCache({ status: "ok", fee: { currency: "EUR" } }), false);
  assert.equal(shouldCache({ status: "ok", fee: { currency: "USD" } }), true);
  assert.equal(shouldCache({ status: "noship" }), true);
  assert.equal(shouldCache({ status: "unknown" }), false);
  assert.equal(shouldCache({ status: "captcha" }), false);
});

import { classifyResponse } from "../content/fetcher.js";

test("classifyResponse: 503 y 429 son límite de pedidos", () => {
  assert.equal(classifyResponse(503), "throttled");
  assert.equal(classifyResponse(429), "throttled");
  assert.equal(classifyResponse(200), "ok");
  assert.equal(classifyResponse(404), "ok");
});

import { retryDelay } from "../content/fetcher.js";

test("retryDelay: reintenta al terminar la pausa solo captcha y límite", () => {
  assert.equal(retryDelay({ status: "captcha" }, { until: 10_000 }, 4_000), 6_000);
  assert.equal(retryDelay({ status: "throttled" }, null, 4_000), 1_000);
  assert.equal(retryDelay({ status: "ok" }, { until: 10_000 }, 4_000), null);
  assert.equal(retryDelay({ status: "error" }, null, 4_000), null);
});
