export const DEFAULTS = Object.freeze({
  mostrarArs: true,
  perfil: "Córdoba",
  percepcionGanancias: 30,
  percepcionIibb: 0,
  concurrencia: 3,
  modoListado: "auto", // "auto" | "hover"
  noEnvia: "atenuar", // "mostrar" | "atenuar" | "ocultar"
});

const NO_ENVIA = ["mostrar", "atenuar", "ocultar"];

export function mergeSettings(stored) {
  const out = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) if (stored && k in stored) out[k] = stored[k];
  const n = out.concurrencia === "" || out.concurrencia == null ? NaN : Number(out.concurrencia);
  out.concurrencia = Number.isFinite(n) ? Math.min(6, Math.max(1, Math.round(n))) : DEFAULTS.concurrencia;
  if (!NO_ENVIA.includes(out.noEnvia)) out.noEnvia = DEFAULTS.noEnvia;
  return out;
}
