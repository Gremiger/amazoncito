const r2 = (n) => Math.round(n * 100) / 100;

// Moneda en la que Amazon muestra los precios (preferencia del usuario).
export function pageCurrency(cookie) {
  return cookie.match(/(?:^|;\s*)i18n-prefs=([A-Z]{3})/)?.[1] ?? "USD";
}

// Cotización que usa Amazon para pasar de USD a ARS, aprendida de un mismo producto visto en ambas monedas.
export function learnAmazonRate(arsAmount, usdAmount, oficial) {
  if (!(arsAmount > 0) || !(usdAmount > 0)) return null;
  const rate = r2(arsAmount / usdAmount);
  const ref = oficial || rate;
  return rate > ref * 0.5 && rate < ref * 2 ? rate : null;
}

const FIELDS = ["price", "shipping", "importCharges", "total"];

// Agrega `usd` (montos en dólares) a un fee en USD o ARS. En ARS es aproximado.
export function normalizeFee(fee, rates) {
  if (fee.currency === "USD") return { ...fee, usd: fee, approx: false, rateSource: null };
  const amazon = rates?.amazon?.venta;
  const rate = fee.currency === "ARS" ? amazon ?? rates?.venta : null;
  if (!rate) return { ...fee, usd: null, approx: true, rateSource: null };
  const usd = Object.fromEntries(FIELDS.map((k) => [k, r2(fee[k] / rate)]));
  return { ...fee, usd: { ...usd, currency: "USD" }, approx: true, rateSource: amazon ? "amazon" : "oficial" };
}

// Página en ARS con un total guardado en USD: mostrarlo en pesos con la cotización de Amazon.
export function toPageCurrency(fee, pageCur, rates) {
  const rate = rates?.amazon?.venta;
  if (pageCur !== "ARS" || fee.currency !== "USD" || !rate) return fee;
  return { ...Object.fromEntries(FIELDS.map((k) => [k, r2(fee[k] * rate)])), currency: "ARS" };
}
