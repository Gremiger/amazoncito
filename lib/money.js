// Amazon usa formato en-US en montos aun con UI en español: "1,234.56".
export function parseMoney(text) {
  if (!text) return null;
  const t = String(text).replace(/ /g, " ").trim();
  const num = t.match(/\d[\d,]*(?:\.\d+)?/);
  if (!num) return null;
  const currency = /ARS/i.test(t) ? "ARS" : "USD";
  return { amount: Number(num[0].replace(/,/g, "")), currency };
}
