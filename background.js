import { pickOficial, chooseRates, combineRates, isFresh, shouldFetchRates, RATES_TTL_MS, FEE_TTL_MS } from "./lib/cache.js";

async function fetchRate(casa) {
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${casa}`, { signal: AbortSignal.timeout(5_000) });
    if (res.ok) return pickOficial(await res.json());
  } catch { /* se usa la cache */ }
  return null;
}

async function getRates() {
  const { rates, mep, ratesFailAt } = await chrome.storage.local.get(["rates", "mep", "ratesFailAt"]);
  const now = Date.now();
  if (isFresh(rates, now, RATES_TTL_MS)) {
    let m = mep;
    if (!isFresh(mep, now, RATES_TTL_MS) && shouldFetchRates(ratesFailAt, now)) {
      m = (await fetchRate("bolsa")) ?? mep;
      if (m && m !== mep) await chrome.storage.local.set({ mep: { ...m, at: now } });
    }
    return combineRates({ venta: rates.venta, fecha: rates.fecha, stale: false }, m);
  }
  if (!shouldFetchRates(ratesFailAt, now)) return combineRates(chooseRates(rates, null, now), mep);
  const [oficial, bolsa] = await Promise.all([fetchRate("oficial"), fetchRate("bolsa")]);
  if (oficial) await chrome.storage.local.set({ rates: { ...oficial, at: now }, ratesFailAt: 0 });
  else await chrome.storage.local.set({ ratesFailAt: now });
  if (bolsa) await chrome.storage.local.set({ mep: { ...bolsa, at: now } });
  return combineRates(chooseRates(rates, oficial, now), bolsa ?? mep);
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
