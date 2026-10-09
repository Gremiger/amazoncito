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

export function summarizeCart(items, results) {
  if (!items.length) return { kind: "none" };
  let total = 0, eligibleSubtotal = 0, eligibleShipping = 0, missing = 0, foreign = false;
  items.forEach((it, i) => {
    const r = results[i];
    if (r?.status !== "ok") { missing++; return; }
    if (r.fee.currency !== "USD") { foreign = true; return; }
    total += r.fee.total * it.qty;
    if (r.eligible) {
      eligibleSubtotal += (it.price ?? r.fee.price) * it.qty;
      eligibleShipping += r.fee.shipping * it.qty;
    }
  });
  if (foreign) return { kind: "currency" };
  if (missing === items.length) return { kind: "empty" };
  const reached = eligibleSubtotal >= FREE_THRESHOLD;
  if (reached) total -= eligibleShipping;
  return { kind: "ok", total: r2(total), eligibleSubtotal: r2(eligibleSubtotal), reached, missing };
}
