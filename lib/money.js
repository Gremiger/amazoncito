// Amazon usa formato en-US en montos aun con UI en español: "1,234.56".
export function parseMoney(text) {
  if (!text) return null;
  const t = String(text).replace(/ /g, " ").trim();
  const num = t.match(/\d[\d,]*(?:\.\d+)?/);
  if (!num) return null;
  const currency = detectCurrency(t);
  return { amount: Number(num[0].replace(/,/g, "")), currency };
}

const CURRENCY_PATTERNS = [
  ["ARS", /ARS/i],
  ["BRL", /R\$|BRL/],
  ["CAD", /CA?\$|CAD/],
  ["AUD", /AU?\$|AUD/],
  ["MXN", /MX\$|MXN/],
  ["EUR", /€|EUR/],
  ["GBP", /£|GBP/],
  ["JPY", /¥|JPY/],
];

function detectCurrency(t) {
  for (const [code, re] of CURRENCY_PATTERNS) if (re.test(t)) return code;
  const code = t.match(/\b[A-Z]{3}\b/)?.[0];
  return code && code !== "USD" ? code : "USD";
}
