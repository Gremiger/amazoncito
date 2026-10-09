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

export const FREE_99_RE = /(over|m[aá]s de|superiores a)\s*(US)?\$\s?99\b|\$99 of eligible/i;

export function parseFreeShippingEligible(doc) {
  const block = doc.querySelector("#mir-layout-DELIVERY_BLOCK, #deliveryBlockMessage");
  return FREE_99_RE.test(text(block));
}
