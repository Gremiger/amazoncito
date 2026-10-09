import { parseCart } from "../lib/parse.js";
import { getFee } from "./fetcher.js";
import { getSettings, getRates } from "./store.js";
import { freeShippingGap, arsBreakdown, summarizeCart, FREE_THRESHOLD } from "../lib/calc.js";
import { fmtUsd, fmtArs } from "../lib/format.js";

const ANCHORS = ["#sc-buy-box", "#gutterCartViewForm", "#sc-active-cart"];

export default async function runCart() {
  const settings = await getSettings();
  const rates = await getRates();
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
    const results = await Promise.all(items.map((i) => getFee(i.asin, settings).catch((e) => ({ status: e?.status ?? "error" }))));
    if (mine !== token) return; // llegó un render más nuevo
    const s = summarizeCart(items, results);
    box.textContent = "";
    box.hidden = s.kind === "none";
    if (s.kind === "none") return;
    if (s.kind === "currency") {
      const a = line("amzar-warn", "Cambiá la moneda de Amazon a USD");
      box.append(a);
      return;
    }
    if (s.kind === "empty") {
      box.append(line("amzar-muted", results.some((r) => r.status === "captcha")
        ? "Amazon pidió captcha — no se pudo calcular el total"
        : "No se pudo calcular el total a AR"));
      return;
    }
    const bar = line("amzar-progress", "");
    const fill = document.createElement("div");
    fill.style.width = `${Math.min(100, (s.eligibleSubtotal / FREE_THRESHOLD) * 100)}%`;
    bar.append(fill);
    box.append(
      line("amzar-total", s.reached
        ? "Envío gratis alcanzado ✓"
        : `Te faltan ${fmtUsd(freeShippingGap(s.eligibleSubtotal))} en ítems elegibles para envío gratis`),
      bar,
      line("amzar-total", `Total estimado a AR: ${fmtUsd(s.total)}`),
    );
    if (settings.mostrarArs && rates) {
      if (rates.mep) box.append(line("amzar-ars", `Con dólares propios (MEP): ${fmtArs(s.total * rates.mep.venta)}`));
      box.append(line("amzar-ars", `En pesos (${settings.perfil}): ${fmtArs(arsBreakdown(s.total, rates.venta, settings).total)}`));
    }
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
