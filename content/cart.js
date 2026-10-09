import { parseCart } from "../lib/parse.js";
import { getFee } from "./fetcher.js";
import { getSettings, getRates } from "./store.js";
import { freeShippingGap, arsBreakdown, FREE_THRESHOLD } from "../lib/calc.js";
import { fmtUsd, fmtArs } from "../lib/format.js";

const ANCHORS = ["#sc-buy-box", "#gutterCartViewForm", "#sc-active-cart"];

export default async function runCart() {
  const settings = await getSettings();
  const rates = await getRates().catch(() => null);
  const box = document.createElement("div");
  box.className = "amzar amzar-box";
  box.dataset.amzarBadge = "1";
  (ANCHORS.map((s) => document.querySelector(s)).find(Boolean) ?? document.body).prepend(box);

  const render = async () => {
    box.textContent = "Calculando total a AR…";
    const items = parseCart(document);
    const results = await Promise.all(items.map((i) => getFee(i.asin, settings).catch(() => ({ status: "error" }))));
    let eligibleSubtotal = 0, total = 0, missing = 0, eligibleShipping = 0;
    items.forEach((it, idx) => {
      const r = results[idx];
      if (r.status !== "ok" || r.fee.currency !== "USD") { missing++; return; }
      total += r.fee.total * it.qty;
      if (r.eligible) { eligibleSubtotal += (it.price ?? r.fee.price) * it.qty; eligibleShipping += r.fee.shipping * it.qty; }
    });
    const reached = eligibleSubtotal >= FREE_THRESHOLD;
    if (reached) total -= eligibleShipping;
    box.textContent = "";
    const head = document.createElement("div");
    head.className = "amzar-total";
    head.textContent = reached
      ? "Envío gratis alcanzado ✓"
      : `Te faltan ${fmtUsd(freeShippingGap(eligibleSubtotal))} en ítems elegibles para envío gratis`;
    const bar = document.createElement("div");
    bar.className = "amzar-progress";
    const fill = document.createElement("div");
    fill.style.width = `${Math.min(100, (eligibleSubtotal / FREE_THRESHOLD) * 100)}%`;
    bar.append(fill);
    const tot = document.createElement("div");
    tot.className = "amzar-total";
    tot.textContent = `Total estimado a AR: ${fmtUsd(total)}`;
    box.append(head, bar, tot);
    if (settings.mostrarArs && rates) {
      const ars = document.createElement("div");
      ars.className = "amzar-ars";
      ars.textContent = `En pesos (${settings.perfil}): ${fmtArs(arsBreakdown(total, rates.venta, settings).total)}`;
      box.append(ars);
    }
    const note = document.createElement("div");
    note.className = "amzar-muted";
    note.textContent = "Estimado: Amazon recalcula envío e importación en el checkout." + (missing ? ` ${missing} ítem(s) sin dato.` : "");
    box.append(note);
  };

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
