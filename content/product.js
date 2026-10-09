import { resultFromDoc, putFee } from "./fetcher.js";
import { renderBadge } from "./badge.js";
import { getSettings, setSetting, getRates, withAmazonRate, getUpdate, dismissUpdate } from "./store.js";
import { renderUpdateBanner } from "./update-banner.js";
import { pageCurrency, normalizeFee } from "../lib/currency.js";
import { freeShippingGap } from "../lib/calc.js";
import { fmtUsd } from "../lib/format.js";

const ANCHORS = ["#corePriceDisplay_desktop_feature_div", "#corePrice_feature_div", "#apex_desktop", "#price"];

const currentAsin = () =>
  document.querySelector("#ASIN, input[name='ASIN']")?.value ?? location.pathname.match(/\/(?:dp|product)\/([A-Z0-9]{10})/)?.[1];

export default async function runProduct() {
  const settings = await getSettings();
  const ctx = {
    settings, rates: null, variant: "box",
    onToggleArs: async (v) => { await setSetting("mostrarArs", v); location.reload(); },
  };
  let box = null;
  let lastKey = null;

  const render = async () => {
    const asin = currentAsin();
    const result = resultFromDoc(document);
    const key = `${asin}|${JSON.stringify(result)}`;
    if (key === lastKey) return;
    lastKey = key;
    box?.remove();
    box = null;
    if (result.status !== "ok") return; // Amazon ya muestra "no envía"; nada que agregar
    if (asin) await putFee(asin, result, pageCurrency(document.cookie));
    const c = { ...ctx, rates: await withAmazonRate(ctx.rates) };
    box = renderBadge(document, { ...result, asin }, c);
    const usdPrice = normalizeFee(result.fee, c.rates).usd?.price;
    if (result.eligible && usdPrice != null && usdPrice < 99) {
      const p = document.createElement("div");
      p.className = "amzar-muted";
      p.textContent = `Con este ítem te faltan ${result.fee.currency === "ARS" ? "≈ " : ""}${fmtUsd(freeShippingGap(usdPrice))} en ítems elegibles para envío gratis.`;
      box.append(p);
    }
    const anchor = ANCHORS.map((s) => document.querySelector(s)).find(Boolean);
    (anchor ?? document.querySelector("#centerCol") ?? document.body).after(box);
  };

  ctx.rates = await getRates((late) => { ctx.rates = late; lastKey = null; render(); });
  await render();
  const update = await getUpdate().catch(() => null);
  if (update) document.querySelector("#centerCol, #ppd")?.prepend(renderUpdateBanner(document, update, dismissUpdate));
  // Al elegir otra variante Amazon reemplaza precio y popover por AJAX, sin recargar.
  let t;
  new MutationObserver((muts) => {
    if (box && muts.every((m) => box.contains(m.target))) return;
    clearTimeout(t);
    t = setTimeout(render, 400);
  }).observe(document.querySelector("#dp-container, #dp") ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["value"] });
}
