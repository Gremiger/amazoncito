import { test } from "node:test";
import assert from "node:assert/strict";
import { docFrom } from "./helpers.js";
import { renderBadge } from "../content/badge.js";
import { DEFAULTS } from "../lib/settings.js";

const doc = docFrom("");
const ctx = { settings: DEFAULTS, rates: { venta: 1540, fecha: "2026-10-09", stale: false }, onToggleArs() {}, variant: "card" };
const fee = { price: 389, shipping: 26.7, importCharges: 87.3, total: 503, currency: "USD" };

test("ok: total USD y ARS Córdoba", () => {
  const t = renderBadge(doc, { status: "ok", fee, eligible: false }, ctx).textContent;
  assert.match(t, /Total a AR: USD 503,00/);
  assert.match(t, /En pesos \(Córdoba\): ARS 1\.007\.006/);
  assert.doesNotMatch(t, /Envío gratis/);
});
test("elegible < 99 muestra con envío gratis", () => {
  const f = { price: 9.99, shipping: 26.94, importCharges: 7.76, total: 44.69, currency: "USD" };
  const t = renderBadge(doc, { status: "ok", fee: f, eligible: true }, ctx).textContent;
  assert.match(t, /Envío gratis ≥ USD 99/);
  assert.match(t, /Con envío gratis: USD 17,75/);
});
test("elegible ≥ 99", () => {
  const t = renderBadge(doc, { status: "ok", fee: { ...fee, shipping: 0, total: 476.3 }, eligible: true }, ctx).textContent;
  assert.match(t, /Este solo ya llega a 99/);
});
test("sin ARS si mostrarArs=false o sin rates", () => {
  assert.doesNotMatch(renderBadge(doc, { status: "ok", fee }, { ...ctx, settings: { ...DEFAULTS, mostrarArs: false } }).textContent, /En pesos/);
  assert.doesNotMatch(renderBadge(doc, { status: "ok", fee }, { ...ctx, rates: null }).textContent, /En pesos/);
});
test("moneda ARS", () => {
  const t = renderBadge(doc, { status: "ok", fee: { ...fee, currency: "ARS" } }, ctx).textContent;
  assert.match(t, /Cambiá la moneda de Amazon a USD/);
});
test("estados", () => {
  assert.match(renderBadge(doc, { status: "loading" }, ctx).textContent, /Calculando/);
  assert.match(renderBadge(doc, { status: "noship" }, ctx).textContent, /No envía a Argentina/);
  assert.match(renderBadge(doc, { status: "unknown", asin: "B0X" }, ctx).textContent, /Ver total/);
  assert.match(renderBadge(doc, { status: "captcha" }, ctx).textContent, /captcha/i);
});
test("cotización vieja indica fecha", () => {
  const t = renderBadge(doc, { status: "ok", fee }, { ...ctx, rates: { venta: 1540, fecha: "2026-10-08T12:00:00Z", stale: true } }).textContent;
  assert.match(t, /cotización del 08\/10/);
});

test("MEP: línea con dólares propios antes de pesos con percepciones", () => {
  const rates = { venta: 1540, fecha: "2026-10-09", stale: false, mep: { venta: 1540.5, fecha: "2026-10-09" } };
  const t = renderBadge(doc, { status: "ok", fee }, { ...ctx, rates }).textContent;
  assert.match(t, /Con dólares propios \(MEP\): ARS 774\.872/);
  assert.ok(t.indexOf("MEP") < t.indexOf("En pesos (Córdoba)"));
});
test("sin MEP solo muestra pesos con percepciones", () => {
  const t = renderBadge(doc, { status: "ok", fee }, ctx).textContent;
  assert.doesNotMatch(t, /MEP/);
  assert.match(t, /En pesos \(Córdoba\)/);
});
