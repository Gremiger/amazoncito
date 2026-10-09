const usd = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ars = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export const fmtUsd = (n) => `USD ${usd.format(n)}`;
export const fmtArs = (n) => `ARS ${ars.format(Math.round(n))}`;
