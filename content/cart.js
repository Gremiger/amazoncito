import { parseCart } from "../lib/parse.js";
import { getFee } from "./fetcher.js";
import { getSettings, getRates, withAmazonRate } from "./store.js";
import { pageCurrency } from "../lib/currency.js";
import { COURIER } from "../lib/courier.js";
import { freeShippingGap, arsBreakdown, summarizeCart, FREE_THRESHOLD } from "../lib/calc.js";
import { fmtUsd, fmtArs } from "../lib/format.js";

const ANCHORS = ["#sc-buy-box", "#gutterCartViewForm", "#sc-active-cart"];

export default async function runCart() {
  const settings = await getSettings();
  const rates = await getRates();
  const currency = pageCurrency(document.cookie);
  const box = document.createElement("div");
  box.className = "amzar amzar-box";
  box.dataset.amzarBadge = "1";
  (ANCHORS.map((s) => document.querySelector(s)).find(Boolean) ?? document.body).prepend(box);

  let token = 0;
  const line = (cls, txt) => {
    const d = document.createElement("div");
    d.className = cls;
    d.textContent = txt;
    return d;
  };

  const render = async () => {
    const mine = ++token;
    const items = parseCart(document);
    const results = await Promise.all(items.map((i) => getFee(i.asin, settings, currency).catch((e) => ({ status: e?.status ?? "error" }))));
    if (mine !== token) return; // llegó un render más nuevo
    const r = await withAmazonRate(rates);
    const s = summarizeCart(items, results, r);
    box.textContent = "";
    box.hidden = s.kind === "none";
    if (s.kind === "none") return;
    if (s.kind === "currency") {
      box.append(line("amzar-warn", "Cambiá la moneda de Amazon a USD o ARS"));
      return;
    }
    if (s.kind === "empty") {
      box.append(line("amzar-muted", results.some((x) => x.status === "captcha" || x.status === "throttled")
        ? "Amazon está limitando pedidos — no se pudo calcular el total"
        : "No se pudo calcular el total a AR"));
      return;
    }
    const approx = s.approx ? "≈ " : "";
    const bar = line("amzar-progress", "");
    const fill = document.createElement("div");
    fill.style.width = `${Math.min(100, (s.eligibleSubtotal / FREE_THRESHOLD) * 100)}%`;
    bar.append(fill);
    box.append(
      line("amzar-total", s.reached
        ? "Envío gratis alcanzado ✓"
        : `Te faltan ${approx}${fmtUsd(freeShippingGap(s.eligibleSubtotal))} en ítems elegibles para envío gratis`),
      bar,
      line("amzar-total", s.totalArs != null
        ? `Total estimado a AR: ${fmtArs(s.totalArs)}`
        : `Total estimado a AR: ${fmtUsd(s.total)}`),
    );
    if (s.totalArs != null) box.append(line("amzar-muted", `≈ ${fmtUsd(s.total)}`));
    if (settings.mostrarArs) {
      if (r?.mep) box.append(line("amzar-ars", `Con dólares propios (MEP): ${approx}${fmtArs(s.total * r.mep.venta)}`));
      const pesos = s.totalArs != null ? arsBreakdown(s.totalArs, 1, settings) : r?.venta ? arsBreakdown(s.total, r.venta, settings) : null;
      if (pesos) box.append(line("amzar-ars", `En pesos (${settings.perfil}): ${fmtArs(pesos.total)}`));
    }
    if (s.courier.note === "max") box.append(line("amzar-warn", `Supera el tope courier: ${approx}${fmtUsd(s.courier.fob)} de USD ${COURIER.maxFob.toLocaleString("es-AR")} por envío`));
    else if (s.courier.note === "franquicia") box.append(line("amzar-muted", `Supera la franquicia de USD ${COURIER.franquicia}: la importación incluye aranceles`));
    if (s.courier.overUnits.length) box.append(line("amzar-warn", `Más de ${COURIER.maxUnits} unidades de un mismo producto: el courier no lo admite`));
    box.append(line("amzar-muted", "Estimado: Amazon recalcula envío e importación en el checkout." +
      (s.missing ? ` ${s.missing} ítem(s) sin dato.` : "")));
  };

  box.textContent = "Calculando total a AR…";
  await render();
  // El carrito se actualiza por AJAX al cambiar cantidades.
  const cart = document.querySelector("#sc-active-cart");
  if (cart) {
    let t;
    new MutationObserver((muts) => {
      if (muts.every((m) => box.contains(m.target))) return; // cambios propios
      clearTimeout(t); t = setTimeout(render, 600);
    })
      .observe(cart, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-quantity"] });
  }
}
