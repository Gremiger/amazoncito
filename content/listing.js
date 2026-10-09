import { findCards, parseListingCard, priceAnchor } from "../lib/parse.js";
import { getFee } from "./fetcher.js";
import { renderBadge } from "./badge.js";
import { getSettings, setSetting, getRates } from "./store.js";

export default async function runListing() {
  const settings = await getSettings();
  const rates = await getRates();
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
    try { result = await getFee(info.asin, settings); }
    catch (e) { result = { status: e?.status ?? "error" }; }
    const eligible = result.eligible || info.freeEligible;
    place(card, renderBadge(document, { ...result, eligible, asin: info.asin }, ctx));
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
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
}
