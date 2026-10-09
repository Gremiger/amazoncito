import { findCards, parseListingCard, priceAnchor } from "../lib/parse.js";
import { slotsFor, sortKey, placeInOrder } from "../lib/sort.js";
import { getFee, learnFromPrices } from "./fetcher.js";
import { renderBadge } from "./badge.js";
import { getSettings, setSetting, getRates, withAmazonRate } from "./store.js";
import { pageCurrency } from "../lib/currency.js";

// Contenedor visible de la tarjeta en grillas que la envuelven (más vendidos, ofertas).
const cellOf = (card) => card.closest('#gridItemRoot, [class*="GridItem-module__container"]') ?? card;

export default async function runListing() {
  const settings = await getSettings();
  const currency = pageCurrency(document.cookie);
  const ctx = {
    settings, rates: null, variant: "card",
    onToggleArs: async (v) => { await setSetting("mostrarArs", v); location.reload(); },
  };
  const loaded = new Map(); // card → { result, eligible, asin }
  const loading = new Map(); // card → Promise

  const place = (card, node) => {
    card.querySelector("[data-amzar-badge]")?.remove();
    const anchor = priceAnchor(card);
    if (anchor) anchor.after(node); else card.append(node);
  };

  const render = async (card) => {
    const state = loaded.get(card);
    const c = { ...ctx, rates: await withAmazonRate(ctx.rates) };
    place(card, renderBadge(document, state, c));
    const cell = cellOf(card);
    const noship = state.status === "noship";
    cell.classList.toggle("amzar-dim", noship && settings.noEnvia === "atenuar");
    cell.classList.toggle("amzar-hidden", noship && settings.noEnvia === "ocultar");
  };

  const load = (card) => {
    if (!loading.has(card)) loading.set(card, (async () => {
      const info = parseListingCard(card);
      place(card, renderBadge(document, { status: "loading" }, ctx));
      let result;
      try { result = await getFee(info.asin, settings, currency); }
      catch (e) { result = { status: e?.status ?? "error" }; }
      // Tarjeta en ARS con el total ya guardado en USD: de ahí sale la cotización de Amazon.
      if (info.price?.currency === "ARS" && result.fee?.currency === "USD") await learnFromPrices(info.price.amount, result.fee.price);
      loaded.set(card, { ...result, eligible: result.eligible || info.freeEligible, asin: info.asin });
      await render(card);
    })());
    return loading.get(card);
  };

  // Si la cotización llega tarde, completar los badges ya dibujados.
  ctx.rates = await getRates((late) => {
    ctx.rates = late;
    for (const card of loaded.keys()) if (card.isConnected) render(card);
  });

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); load(e.target); }
  }, { rootMargin: "200px" });

  // Botón para ordenar por total; un segundo click vuelve al orden de Amazon.
  let original = null;
  const sortButton = document.createElement("button");
  sortButton.type = "button";
  sortButton.className = "amzar-sort";
  sortButton.dataset.amzarBadge = "1";
  sortButton.textContent = "Ordenar por total a AR";
  sortButton.addEventListener("click", async () => {
    const slots = slotsFor(findCards(document));
    if (original) {
      placeInOrder(slots.map((s) => s.slot), original.filter((s) => s.isConnected));
      original = null;
      sortButton.textContent = "Ordenar por total a AR";
      return;
    }
    sortButton.disabled = true;
    let done = 0;
    await Promise.all(slots.map(async ({ card }) => {
      await load(card);
      sortButton.textContent = `Calculando ${++done}/${slots.length}…`;
    }));
    const rates = await withAmazonRate(ctx.rates);
    const sorted = [...slots].sort((a, b) => sortKey(loaded.get(a.card), rates) - sortKey(loaded.get(b.card), rates));
    original = slots.map((s) => s.slot);
    placeInOrder(original, sorted.map((s) => s.slot));
    sortButton.disabled = false;
    sortButton.textContent = "Volver al orden de Amazon";
  });

  const scan = () => {
    const cards = findCards(document);
    for (const card of cards) {
      if (card.dataset.amzar) continue;
      card.dataset.amzar = "1";
      if (settings.modoListado === "hover") {
        card.addEventListener("mouseenter", () => load(card), { once: true });
      } else io.observe(card);
    }
    if (cards.length > 1 && !sortButton.isConnected) {
      const first = slotsFor(cards)[0]?.slot.parentElement;
      first?.before(sortButton);
      original = null;
      sortButton.textContent = "Ordenar por total a AR";
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
