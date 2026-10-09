import { parseMoney } from "./money.js";

const ROWS = [
  ["price", /^(price|precio)/i],
  ["shipping", /(shipping|env[ií]o)/i],
  ["importCharges", /(import)/i],
  ["total", /^total/i],
];

const text = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

export function parseFeeDetails(doc) {
  const table = doc.querySelector('[id^="a-popover-"] table.a-lineitem');
  if (!table) return null;
  const out = {};
  let currency = null;
  for (const tr of table.querySelectorAll("tr")) {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 2) continue;
    const label = text(tds[0]);
    const money = parseMoney(text(tds[tds.length - 1]));
    if (!label || !money) continue;
    const row = ROWS.find(([, re]) => re.test(label));
    if (!row || row[0] in out) continue;
    out[row[0]] = money.amount;
    currency ??= money.currency;
  }
  if (out.price == null) return null;
  const shipping = out.shipping ?? 0;
  const importCharges = out.importCharges ?? 0;
  const total = out.total ?? Math.round((out.price + shipping + importCharges) * 100) / 100;
  return { price: out.price, shipping, importCharges, total, currency };
}

const bodyText = (doc) => doc.body?.textContent ?? "";

export function isNoShip(doc) {
  return /cannot be shipped to your selected delivery location|no se puede enviar a la ubicaci[oó]n/i.test(bodyText(doc));
}

export function isCaptcha(doc) {
  return !!doc.querySelector('form[action*="validateCaptcha"]') ||
    /Enter the characters you see below|Introduce los caracteres que ves/i.test(bodyText(doc));
}

// El umbral es USD 99, pero Amazon lo muestra en la moneda elegida ("$99" o "ARS 150,133.50").
const AMOUNT = String.raw`(?:(?:US)?\$\s?99\b|ARS\s?[\d,.]+)`;
export const FREE_99_RE = new RegExp(String.raw`(?:over|m[aá]s de|superiores a)\s*${AMOUNT}|${AMOUNT}\s+(?:of|en) (?:eligible|art[ií]culos elegibles)`, "i");

export function parseFreeShippingEligible(doc) {
  const block = doc.querySelector("#mir-layout-DELIVERY_BLOCK, #deliveryBlockMessage");
  return FREE_99_RE.test(text(block));
}

// Búsqueda y ofertas usan .a-price; más vendidos / novedades usan una clase ofuscada *p13n-sc-price*.
const PRICE_SELECTOR = '.a-price, [class*="p13n-sc-price"]';

// Los patrocinados enlazan vía /sspa/click?…url=%2F…%2Fdp%2F… (sin "/dp/" literal).
const PRODUCT_LINK_SELECTOR = 'a[href*="/dp/"], a[href*="%2Fdp%2F"], a[href*="/sspa/click"]';

const CARD_SELECTOR = [
  '[data-component-type="s-search-result"][data-asin]',
  'div[data-asin]:not([data-asin=""])',
].join(",");

export function findCards(root) {
  const all = [...root.querySelectorAll(CARD_SELECTOR)].filter(
    (el) => el.getAttribute("data-asin") && el.querySelector(PRICE_SELECTOR) && el.querySelector(PRODUCT_LINK_SELECTOR),
  );
  // Quedarse con la tarjeta más externa: Amazon anida elementos con data-asin.
  return all.filter((el) => !all.some((o) => o !== el && o.contains(el)));
}

export function parseListingCard(el) {
  return {
    asin: el.getAttribute("data-asin"),
    price: parseMoney(text(el.querySelector(".a-price .a-offscreen") ?? el.querySelector('[class*="p13n-sc-price"]'))),
    freeEligible: FREE_99_RE.test(text(el.querySelector('[data-cy="delivery-recipe"]')) || text(el)),
  };
}

export function parseCart(doc) {
  const scope = doc.querySelector("#sc-active-cart") ?? doc;
  return [...scope.querySelectorAll("[data-asin][data-quantity]")]
    .filter((el) => el.getAttribute("data-asin"))
    .map((el) => {
      const attr = el.getAttribute("data-price");
      const price = attr ? Number(attr) : parseMoney(text(el.querySelector(".sc-product-price, .a-price .a-offscreen")))?.amount ?? null;
      return { asin: el.getAttribute("data-asin"), qty: Number(el.getAttribute("data-quantity")) || 1, price };
    });
}

// Texto de la ubicación del encabezado, sin caracteres invisibles (Amazon agrega ‌).
export const glowText = (doc) => text(doc.querySelector("#glow-ingress-line2")).replace(/[​-‍﻿]/g, "").trim();

// Con una dirección guardada el encabezado muestra la ciudad ("Río Cuarto 5800"), no el país:
// se usa también el texto de envío de la página ("to Argentina", "Charges to Argentina").
export function detectArgentina(doc) {
  return /Argentina/i.test(glowText(doc)) || /\b(to|a) Argentina/i.test(bodyText(doc));
}

// Dónde insertar el badge: después del bloque de precio, siempre dentro de la tarjeta.
export function priceAnchor(card) {
  const recipe = card.querySelector('[data-cy="price-recipe"]');
  if (recipe) return recipe;
  const parent = card.querySelector(PRICE_SELECTOR)?.parentElement;
  return parent && parent !== card ? parent : null;
}
