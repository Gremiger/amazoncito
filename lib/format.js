const usd = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ars = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export const fmtUsd = (n) => `USD ${usd.format(n)}`;
export const fmtArs = (n) => `ARS ${ars.format(Math.round(n))}`;

const dayMonth = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit" });
export function fmtDayMonthAr(iso) {
  const parts = Object.fromEntries(dayMonth.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.day.padStart(2, "0")}/${parts.month.padStart(2, "0")}`;
}
