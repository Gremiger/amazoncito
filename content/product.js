import { resultFromDoc, putFee } from "./fetcher.js";
import { renderBadge } from "./badge.js";
import { getSettings, setSetting, getRates } from "./store.js";
import { freeShippingGap } from "../lib/calc.js";
import { fmtUsd } from "../lib/format.js";

const ANCHORS = ["#corePriceDisplay_desktop_feature_div", "#corePrice_feature_div", "#apex_desktop", "#price"];

export default async function runProduct() {
  const asin = document.querySelector("#ASIN, input[name='ASIN']")?.value ?? location.pathname.match(/\/(?:dp|product)\/([A-Z0-9]{10})/)?.[1];
  const result = resultFromDoc(document);
  if (result.status !== "ok") return; // Amazon ya muestra "no envía"; nada que agregar
  if (asin) await putFee(asin, result);
  const settings = await getSettings();
  const rates = await getRates().catch(() => null);
  const ctx = {
    settings, rates, variant: "box",
    onToggleArs: async (v) => { await setSetting("mostrarArs", v); location.reload(); },
  };
  const box = renderBadge(document, { ...result, asin }, ctx);
  if (result.eligible && result.fee.price < 99) {
    const p = document.createElement("div");
    p.className = "amzar-muted";
    p.textContent = `Con este ítem te faltan ${fmtUsd(freeShippingGap(result.fee.price))} en ítems elegibles para envío gratis.`;
    box.append(p);
  }
  const anchor = ANCHORS.map((s) => document.querySelector(s)).find(Boolean);
  (anchor ?? document.querySelector("#centerCol") ?? document.body).after(box);
}
