import { normalizeFee } from "./currency.js";

// Clave de orden: total en USD (aproximado si vino en ARS). Lo que no tiene total va al final.
export function sortKey(result, rates) {
  if (result?.status !== "ok") return Infinity;
  return normalizeFee(result.fee, rates).usd?.total ?? Infinity;
}

// Ubica `sorted` en las posiciones que ocupaban `slots` (pueden estar en contenedores distintos).
export function placeInOrder(slots, sorted) {
  const marks = slots.map((s) => {
    const m = s.ownerDocument.createComment("amzar");
    s.before(m);
    return m;
  });
  marks.forEach((m, i) => m.replaceWith(sorted[i]));
}

// "Lugar" de cada tarjeta: su ancestro más alto que no contiene otras tarjetas (en búsqueda es la
// tarjeta; en más vendidos y ofertas, el div que la envuelve). Solo se devuelven los lugares cuyo
// padre tiene la forma más común, para no mezclar carruseles o widgets con la grilla principal.
export function slotsFor(cards) {
  const others = (el, card) => cards.some((c) => c !== card && el.contains(c));
  const slots = cards.map((card) => {
    let slot = card;
    while (slot.parentElement && !others(slot.parentElement, card)) slot = slot.parentElement;
    return { slot, card };
  });
  const shape = ({ slot }) => slot.parentElement ? `${slot.parentElement.tagName}.${slot.parentElement.className}` : "";
  const counts = new Map();
  for (const s of slots) counts.set(shape(s), (counts.get(shape(s)) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  return slots.filter((s) => shape(s) === top);
}
