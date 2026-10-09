export const FEE_TTL_MS = 24 * 60 * 60 * 1000;
export const RATES_TTL_MS = 60 * 60 * 1000;
export const feeKey = (asin) => `fee:${asin}`;

export const isFresh = (entry, now, ttl) => !!entry && now - entry.at < ttl;

export function pickOficial(json) {
  if (!json || typeof json.venta !== "number") return null;
  return { venta: json.venta, fecha: json.fechaActualizacion };
}

export function chooseRates(cached, fetched, _now) {
  if (fetched) return { venta: fetched.venta, fecha: fetched.fecha, stale: false };
  if (cached) return { venta: cached.venta, fecha: cached.fecha, stale: true };
  return null;
}
