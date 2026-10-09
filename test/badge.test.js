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
test("otra moneda (EUR) pide cambiar a USD o ARS", () => {
  const t = renderBadge(doc, { status: "ok", fee: { ...fee, currency: "EUR" } }, ctx).textContent;
  assert.match(t, /Cambiá la moneda de Amazon a USD o ARS/);
});
test("estados", () => {
  assert.match(renderBadge(doc, { status: "loading" }, ctx).textContent, /Calculando/);
  assert.match(renderBadge(doc, { status: "noship" }, ctx).textContent, /No envía a Argentina/);
  assert.match(renderBadge(doc, { status: "unknown", asin: "B0X" }, ctx).textContent, /Ver total/);
  assert.match(renderBadge(doc, { status: "captcha" }, ctx).textContent, /captcha/i);
});
test("cotización vieja indica fecha", () => {
  const t = renderBadge(doc, { status: "ok", fee }, { ...ctx, rates: { venta: 1540, fecha: "2026-10-09T02:00:00Z", stale: true } }).textContent;
  assert.match(t, /cotización del 08\/10/); // 23:00 del 08/10 en Argentina
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

const arsFee = { price: 589918.5, shipping: 40490.55, importCharges: 132390.45, total: 762799.5, currency: "ARS" };
const arsRates = { venta: 1540, fecha: "2026-10-09", stale: false, mep: { venta: 1540.5 }, amazon: { venta: 1516.5 } };

test("ARS: total en pesos de Amazon, USD aproximado, MEP y percepciones", () => {
  const t = renderBadge(doc, { status: "ok", fee: arsFee }, { ...ctx, rates: arsRates }).textContent;
  assert.match(t, /Total a AR: ARS 762\.800/);
  assert.match(t, /≈ USD 503,00 \(cambio Amazon\)/);
  assert.match(t, /Con dólares propios \(MEP\): ≈ ARS 774\.872/);
  assert.match(t, /En pesos \(Córdoba\): ARS 991\.640/);
});
test("ARS sin cotización de Amazon aclara que usa el oficial", () => {
  const t = renderBadge(doc, { status: "ok", fee: arsFee }, { ...ctx, rates: { venta: 1540, fecha: "x", stale: false } }).textContent;
  assert.match(t, /≈ USD 495,32 \(al oficial\)/);
});
test("ARS sin cotizaciones igual muestra pesos con percepciones", () => {
  const t = renderBadge(doc, { status: "ok", fee: arsFee }, { ...ctx, rates: null }).textContent;
  assert.match(t, /En pesos \(Córdoba\): ARS 991\.640/);
});
test("courier: supera tope de USD 3.000", () => {
  const t = renderBadge(doc, { status: "ok", fee: { ...fee, price: 3200, total: 3900 } }, ctx).textContent;
  assert.match(t, /Supera el tope courier \(USD 3\.000 por envío\)/);
});
test("courier: supera franquicia de USD 400", () => {
  const t = renderBadge(doc, { status: "ok", fee: { ...fee, price: 450, total: 560 } }, ctx).textContent;
  assert.match(t, /Supera la franquicia de USD 400/);
  assert.doesNotMatch(renderBadge(doc, { status: "ok", fee }, ctx).textContent, /franquicia|tope courier/);
});
test("pesos ocultos: botón para volver a verlos", () => {
  const b = renderBadge(doc, { status: "ok", fee }, { ...ctx, settings: { ...DEFAULTS, mostrarArs: false } });
  assert.match(b.textContent, /ver pesos/);
});
test("estado throttled", () => {
  assert.match(renderBadge(doc, { status: "throttled" }, ctx).textContent, /Amazon está limitando pedidos/);
});
