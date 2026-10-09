import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DOMParser } from "linkedom";
import { enoughHtml } from "../lib/stream.js";
import { resultFromDoc } from "../content/fetcher.js";

const raw = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const parse = (html) => new DOMParser().parseFromString(html, "text/html");

// Simula la lectura en streaming por chunks de 16 KB y devuelve dónde corta.
function cutPoint(html) {
  for (let n = 16 * 1024; n < html.length; n += 16 * 1024) if (enoughHtml(html.slice(0, n))) return n;
  return html.length;
}

for (const fx of ["product-usd-paid-shipping.html", "product-usd-eligible-under99.html", "product-usd-free-shipping.html", "product-usd-no-ship.html", "product-ars.html"]) {
  test(`corte temprano conserva el resultado (${fx})`, () => {
    const html = raw(fx);
    const n = cutPoint(html);
    assert.ok(n < html.length * 0.6, `no cortó temprano: ${n} de ${html.length}`);
    assert.deepEqual(resultFromDoc(parse(html.slice(0, n))), resultFromDoc(parse(html)));
  });
}

test("no corta con la tabla abierta ni sin el bloque de entrega", () => {
  const html = raw("product-usd-eligible-under99.html");
  const table = html.indexOf("a-lineitem");
  assert.equal(enoughHtml(html.slice(0, table + 100)), null);
  const del = html.indexOf("mir-layout-DELIVERY_BLOCK");
  assert.equal(enoughHtml(html.slice(0, del + 100)), null);
});

test("página sin tabla ni aviso no corta (se lee completa)", () => {
  assert.equal(enoughHtml("<html><body>" + "x".repeat(900_000)), null);
});
