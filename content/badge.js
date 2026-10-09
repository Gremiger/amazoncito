import { arsBreakdown, freeShippingTotal, FREE_THRESHOLD } from "../lib/calc.js";
import { fmtUsd, fmtArs } from "../lib/format.js";

function el(doc, tag, cls, txt) {
  const e = doc.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

function arsLine(doc, fee, { settings, rates, onToggleArs }) {
  if (!settings.mostrarArs || !rates) return null;
  const b = arsBreakdown(fee.total, rates.venta, settings);
  const line = el(doc, "div", "amzar-ars", `En pesos (${settings.perfil}): ${fmtArs(b.total)}`);
  line.title = [
    `Oficial ${rates.venta}: ${fmtArs(b.oficial)}`,
    `Percepción Ganancias ${settings.percepcionGanancias}%: ${fmtArs(b.ganancias)}`,
    `Percepción IIBB ${settings.percepcionIibb}%: ${fmtArs(b.iibb)}`,
    "Pagando con dólares propios no hay percepciones.",
  ].join("\n");
  if (rates.stale && rates.fecha) {
    const d = new Date(rates.fecha);
    const dd = String(d.getUTCDate()).padStart(2, "0"), mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    line.append(el(doc, "span", "amzar-muted", ` (cotización del ${dd}/${mm})`));
  }
  const btn = el(doc, "button", "amzar-toggle", "ocultar");
  btn.type = "button";
  btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); onToggleArs?.(false); });
  line.append(btn);
  return line;
}

function breakdownTable(doc, fee) {
  const t = el(doc, "table");
  for (const [k, v] of [["Precio", fee.price], ["Envío", fee.shipping], ["Importación (est.)", fee.importCharges]]) {
    const tr = el(doc, "tr");
    tr.append(el(doc, "td", null, k), el(doc, "td", null, fmtUsd(v)));
    t.append(tr);
  }
  return t;
}

export function renderBadge(doc, state, ctx) {
  const root = el(doc, "div", ctx.variant === "box" ? "amzar amzar-box" : "amzar");
  root.dataset.amzarBadge = "1";
  switch (state.status) {
    case "loading": root.append(el(doc, "div", "amzar-muted", "Calculando total a AR…")); return root;
    case "noship": root.append(el(doc, "div", "amzar-warn", "No envía a Argentina")); return root;
    case "captcha": root.append(el(doc, "div", "amzar-warn", "Amazon pidió captcha — pausado 5 min")); return root;
    case "unknown":
    case "error": {
      const a = el(doc, "a", "amzar-muted", "Ver total");
      a.href = `/dp/${state.asin ?? ""}`;
      root.append(a);
      return root;
    }
  }
  const { fee, eligible } = state;
  if (fee.currency !== "USD") {
    const a = el(doc, "a", "amzar-warn", "Cambiá la moneda de Amazon a USD");
    a.href = "/customer-preferences/edit?ie=UTF8&preferencesReturnUrl=%2F";
    root.append(a);
    return root;
  }
  if (ctx.variant === "box") root.append(breakdownTable(doc, fee));
  root.append(el(doc, "div", "amzar-total", `Total a AR: ${fmtUsd(fee.total)}`));
  const ars = arsLine(doc, fee, ctx);
  if (ars) root.append(ars);
  if (eligible) {
    root.append(el(doc, "div", "amzar-free", "Envío gratis ≥ USD 99"));
    if (fee.price >= FREE_THRESHOLD) root.append(el(doc, "div", "amzar-muted", "Este solo ya llega a 99"));
    else if (fee.shipping > 0) root.append(el(doc, "div", "amzar-muted", `Con envío gratis: ${fmtUsd(freeShippingTotal(fee))}`));
  }
  return root;
}
