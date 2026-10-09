import { findCards, parseListingCard, priceAnchor } from "../lib/parse.js";
import { getFee, learnFromPrices } from "./fetcher.js";
import { renderBadge } from "./badge.js";
import { getSettings, setSetting, getRates, withAmazonRate } from "./store.js";
import { pageCurrency } from "../lib/currency.js";

export default async function runListing() {
  const settings = await getSettings();
  const rates = await getRates();
  const currency = pageCurrency(document.cookie);
  const ctx = {
    settings, rates, variant: "card",
    onToggleArs: async (v) => { await setSetting("mostrarArs", v); location.reload(); },
  };

  const place = (card, node) => {
    card.querySelector("[data-amzar-badge]")?.remove();
    const anchor = priceAnchor(card);
    if (anchor) anchor.after(node); else card.append(node);
  };

  const load = async (card) => {
    const info = parseListingCard(card);
    place(card, renderBadge(document, { status: "loading" }, ctx));
    let result;
    try { result = await getFee(info.asin, settings, currency); }
    catch (e) { result = { status: e?.status ?? "error" }; }
    // Tarjeta en ARS con el total ya guardado en USD: de ahí sale la cotización de Amazon.
    if (info.price?.currency === "ARS" && result.fee?.currency === "USD") await learnFromPrices(info.price.amount, result.fee.price);
    const eligible = result.eligible || info.freeEligible;
    const c = { ...ctx, rates: await withAmazonRate(ctx.rates) };
    place(card, renderBadge(document, { ...result, eligible, asin: info.asin }, c));
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); load(e.target); }
  }, { rootMargin: "200px" });

  const scan = () => {
    for (const card of findCards(document)) {
      if (card.dataset.amzar) continue;
      card.dataset.amzar = "1";
      if (settings.modoListado === "hover") {
        card.addEventListener("mouseenter", () => load(card), { once: true });
      } else io.observe(card);
    }
  };

  scan();
  let pending = false;
  const ownChange = (m) =>
    m.target.closest?.("[data-amzar-badge]") || [...m.addedNodes].every((n) => n.dataset?.amzarBadge);
  new MutationObserver((muts) => {
    if (pending || muts.every(ownChange)) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
}
