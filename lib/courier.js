// Régimen courier (Decreto 1065/2024 y 604/2026, fuentes no oficiales): editar acá si cambia.
export const COURIER = Object.freeze({ maxFob: 3000, franquicia: 400, maxUnits: 3 });

const r2 = (n) => Math.round(n * 100) / 100;

export function courierNote(usdFob) {
  if (usdFob == null) return null;
  if (usdFob > COURIER.maxFob) return "max";
  if (usdFob > COURIER.franquicia) return "franquicia";
  return null;
}

export function courierCart(items) {
  const fob = r2(items.reduce((s, i) => s + (i.usdPrice ?? 0) * i.qty, 0));
  return {
    fob,
    note: courierNote(fob),
    overUnits: items.filter((i) => i.qty > COURIER.maxUnits).map((i) => i.asin),
  };
}
