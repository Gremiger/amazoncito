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
