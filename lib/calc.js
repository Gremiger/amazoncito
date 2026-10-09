import { normalizeFee } from "./currency.js";
import { courierCart } from "./courier.js";

export const FREE_THRESHOLD = 99;
const r2 = (n) => Math.round(n * 100) / 100;

export function arsBreakdown(usd, oficialVenta, { percepcionGanancias, percepcionIibb }) {
  const base = usd * oficialVenta;
  const oficial = Math.round(base);
  const ganancias = Math.round((base * percepcionGanancias) / 100);
  const iibb = Math.round((base * percepcionIibb) / 100);
  return { oficial, ganancias, iibb, total: oficial + ganancias + iibb };
}

export const freeShippingTotal = (fee) => r2(fee.total - fee.shipping);

export const freeShippingGap = (subtotalUsd, threshold = FREE_THRESHOLD) =>
  Math.max(0, r2(threshold - subtotalUsd));

// Resumen del carrito en USD (aproximado si Amazon está en ARS) y, si todo vino en ARS, también en pesos de Amazon.
export function summarizeCart(items, results, rates) {
  if (!items.length) return { kind: "none" };
  let total = 0, totalArs = 0, eligibleSubtotal = 0, missing = 0, foreign = false, approx = false, allArs = true;
  const courierItems = [];
  items.forEach((it, i) => {
    const r = results[i];
    if (r?.status !== "ok") { missing++; return; }
    const n = normalizeFee(r.fee, rates);
    if (!n.usd) { foreign = true; return; }
    approx ||= n.approx;
    if (n.currency !== "ARS") allArs = false;
    const freeShip = r.eligible ? n.usd.shipping : 0; // se descuenta si se llega a 99
    total += n.usd.total * it.qty;
    totalArs += n.total * it.qty;
    courierItems.push({ asin: it.asin, usdPrice: n.usd.price, qty: it.qty, freeShip, freeShipArs: r.eligible ? n.shipping : 0 });
    if (r.eligible) eligibleSubtotal += n.usd.price * it.qty;
  });
  if (foreign) return { kind: "currency" };
  if (missing === items.length) return { kind: "empty" };
  const reached = eligibleSubtotal >= FREE_THRESHOLD;
  if (reached) {
    for (const c of courierItems) { total -= c.freeShip * c.qty; totalArs -= c.freeShipArs * c.qty; }
  }
  return {
    kind: "ok",
    total: r2(total),
    totalArs: allArs ? Math.round(totalArs) : null,
    approx,
    eligibleSubtotal: r2(eligibleSubtotal),
    reached,
    missing,
    courier: courierCart(courierItems),
  };
}
