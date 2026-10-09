import { pickOficial, chooseRates, isFresh, shouldFetchRates, RATES_TTL_MS, FEE_TTL_MS } from "./lib/cache.js";

async function getRates() {
  const { rates, ratesFailAt } = await chrome.storage.local.get(["rates", "ratesFailAt"]);
  const now = Date.now();
  if (isFresh(rates, now, RATES_TTL_MS)) return { venta: rates.venta, fecha: rates.fecha, stale: false };
  if (!shouldFetchRates(ratesFailAt, now)) return chooseRates(rates, null, now);
  let fetched = null;
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial", { signal: AbortSignal.timeout(5_000) });
    if (res.ok) fetched = pickOficial(await res.json());
  } catch { /* se usa la cache */ }
  if (fetched) await chrome.storage.local.set({ rates: { ...fetched, at: now }, ratesFailAt: 0 });
  else await chrome.storage.local.set({ ratesFailAt: now });
  return chooseRates(rates, fetched, now);
}

async function pruneFees() {
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const stale = Object.keys(all).filter((k) => k.startsWith("fee:") && !isFresh(all[k], now, FEE_TTL_MS));
  if (stale.length) await chrome.storage.local.remove(stale);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "rates") { getRates().then(sendResponse); return true; }
});
chrome.runtime.onStartup.addListener(pruneFees);
chrome.runtime.onInstalled.addListener(pruneFees);
