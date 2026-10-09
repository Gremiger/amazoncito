import { arsBreakdown, FREE_THRESHOLD } from "../lib/calc.js";
import { fmtUsd, fmtArs, fmtDayMonthAr } from "../lib/format.js";
import { normalizeFee } from "../lib/currency.js";
import { courierNote, COURIER } from "../lib/courier.js";

function el(doc, tag, cls, txt) {
  const e = doc.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

function toggleButton(doc, label, value, onToggleArs) {
  const btn = el(doc, "button", "amzar-toggle", label);
  btn.type = "button";
  btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); onToggleArs?.(value); });
  return btn;
}

// Líneas en pesos: con dólares propios (MEP) y pagando en pesos con percepciones.
function arsLines(doc, n, { settings, rates, onToggleArs }) {
  if (!settings.mostrarArs) {
    const wrap = el(doc, "div", "amzar-muted");
    wrap.append(toggleButton(doc, "ver pesos", true, onToggleArs));
    return wrap;
  }
  const isArs = n.currency === "ARS";
  if (!isArs && !rates?.venta) return null;
  const wrap = el(doc, "div");
  if (rates?.mep && n.usd) {
    wrap.append(el(doc, "div", "amzar-ars",
      `Con dólares propios (MEP): ${n.approx ? "≈ " : ""}${fmtArs(n.usd.total * rates.mep.venta)}`));
  }
  // En ARS Amazon ya cobra en pesos: las percepciones van sobre ese monto.
  const b = isArs ? arsBreakdown(n.total, 1, settings) : arsBreakdown(n.total, rates.venta, settings);
  const line = el(doc, "div", "amzar-ars", `En pesos (${settings.perfil}): ${fmtArs(b.total)}`);
  line.title = [
    isArs ? `Total de Amazon: ${fmtArs(b.oficial)}` : `Oficial ${rates.venta}: ${fmtArs(b.oficial)}`,
    `Percepción Ganancias ${settings.percepcionGanancias}%: ${fmtArs(b.ganancias)}`,
    `Percepción IIBB ${settings.percepcionIibb}%: ${fmtArs(b.iibb)}`,
    "Pagando con dólares propios no hay percepciones.",
  ].join("\n");
  if (!isArs && rates.stale && rates.fecha) {
    line.append(el(doc, "span", "amzar-muted", ` (cotización del ${fmtDayMonthAr(rates.fecha)})`));
  }
  line.append(toggleButton(doc, "ocultar", false, onToggleArs));
  wrap.append(line);
  return wrap;
}

function breakdownTable(doc, n, fmt) {
  const t = el(doc, "table");
  for (const [k, v] of [["Precio", n.price], ["Envío", n.shipping], ["Importación (est.)", n.importCharges]]) {
    const tr = el(doc, "tr");
    tr.append(el(doc, "td", null, k), el(doc, "td", null, fmt(v)));
    t.append(tr);
  }
  return t;
}

const COURIER_TEXT = {
  max: ["amzar-warn", `Supera el tope courier (USD ${COURIER.maxFob.toLocaleString("es-AR")} por envío)`],
  franquicia: ["amzar-muted", `Supera la franquicia de USD ${COURIER.franquicia}: la importación incluye aranceles`],
};

export function renderBadge(doc, state, ctx) {
  const root = el(doc, "div", ctx.variant === "box" ? "amzar amzar-box" : "amzar");
  root.dataset.amzarBadge = "1";
  switch (state.status) {
    case "loading": root.append(el(doc, "div", "amzar-muted", "Calculando total a AR…")); return root;
    case "noship": root.append(el(doc, "div", "amzar-warn", "No envía a Argentina")); return root;
    case "captcha": root.append(el(doc, "div", "amzar-warn", "Amazon pidió captcha — pausado 5 min (si se repite: Opciones → Listados → Solo al pasar el mouse)")); return root;
    case "throttled": root.append(el(doc, "div", "amzar-warn", "Amazon está limitando pedidos — reintento en 2 min")); return root;
    case "unknown":
    case "error": {
      const a = el(doc, "a", "amzar-muted", "Ver total");
      a.href = `/dp/${state.asin ?? ""}`;
      root.append(a);
      return root;
    }
  }
  const n = normalizeFee(state.fee, ctx.rates);
  if (n.currency !== "USD" && n.currency !== "ARS") {
    const a = el(doc, "a", "amzar-warn", "Cambiá la moneda de Amazon a USD o ARS");
    a.href = "/customer-preferences/edit?ie=UTF8&preferencesReturnUrl=%2F";
    root.append(a);
    return root;
  }
  const fmt = n.currency === "ARS" ? fmtArs : fmtUsd;
  if (ctx.variant === "box") root.append(breakdownTable(doc, n, fmt));
  root.append(el(doc, "div", "amzar-total", `Total a AR: ${fmt(n.total)}`));
  if (n.currency === "ARS" && n.usd) {
    root.append(el(doc, "div", "amzar-muted",
      `≈ ${fmtUsd(n.usd.total)} (${n.rateSource === "amazon" ? "cambio Amazon" : "al oficial"})`));
  }
  const ars = arsLines(doc, n, ctx);
  if (ars) root.append(ars);
  const usdPrice = n.usd?.price ?? null;
  const note = courierNote(usdPrice);
  if (note) root.append(el(doc, "div", ...COURIER_TEXT[note]));
  if (state.eligible) {
    root.append(el(doc, "div", "amzar-free", "Envío gratis ≥ USD 99"));
    if (usdPrice != null && usdPrice >= FREE_THRESHOLD) root.append(el(doc, "div", "amzar-muted", "Este solo ya llega a 99"));
    else if (n.shipping > 0) root.append(el(doc, "div", "amzar-muted", `Con envío gratis: ${fmt(n.total - n.shipping)}`));
  }
  return root;
}
