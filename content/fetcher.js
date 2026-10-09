import { parseFeeDetails, isNoShip, isCaptcha, parseFreeShippingEligible } from "../lib/parse.js";
import { createQueue } from "../lib/queue.js";
import { feeKey, isFresh, FEE_TTL_MS } from "../lib/cache.js";
import { learnAmazonRate } from "../lib/currency.js";
import { localGet, localSet } from "./store.js";

const CAPTCHA_PAUSE_MS = 5 * 60 * 1000;
const THROTTLE_PAUSE_MS = 2 * 60 * 1000;

// 503/429 sin captcha: Amazon está limitando pedidos; se pausa igual que con captcha.
export const classifyResponse = (status) => (status === 503 || status === 429 ? "throttled" : "ok");
let queue = null;

export function resultFromDoc(doc) {
  if (isCaptcha(doc)) return { status: "captcha" };
  const fee = parseFeeDetails(doc);
  if (fee) return { status: "ok", fee, eligible: parseFreeShippingEligible(doc) };
  if (isNoShip(doc)) return { status: "noship" };
  return { status: "unknown" };
}

async function fetchDoc(asin) {
  let lastErr;
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(`/dp/${asin}`, { credentials: "include", signal: AbortSignal.timeout(15_000) });
      if (classifyResponse(res.status) === "throttled") return null;
      return new DOMParser().parseFromString(await res.text(), "text/html");
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// Se cachea solo en USD/ARS (las dos monedas soportadas) o "no envía".
export const shouldCache = (result) =>
  result.status === "noship" || (result.status === "ok" && ["USD", "ARS"].includes(result.fee.currency));

export async function putFee(asin, result, currency) {
  if (!shouldCache(result)) return;
  await localSet(feeKey(asin, result.fee?.currency ?? currency), { at: Date.now(), result });
  if (result.status === "ok") await learnRate(asin, result.fee);
}

// Mismo producto visto en USD y en ARS → cotización que usa Amazon.
async function learnRate(asin, fee) {
  const other = await localGet(feeKey(asin, fee.currency === "ARS" ? "USD" : "ARS"));
  if (!other || other.result.status !== "ok" || !isFresh(other, Date.now(), FEE_TTL_MS)) return;
  const [ars, usd] = fee.currency === "ARS" ? [fee, other.result.fee] : [other.result.fee, fee];
  await learnFromPrices(ars.price, usd.price);
}

export async function learnFromPrices(arsAmount, usdAmount) {
  const venta = learnAmazonRate(arsAmount, usdAmount, null);
  if (venta) await localSet("amazonRate", { venta, at: Date.now() });
}

async function cachedFee(asin, currency) {
  const now = Date.now();
  for (const cur of [currency, currency === "ARS" ? "USD" : "ARS"]) {
    const entry = await localGet(feeKey(asin, cur));
    if (isFresh(entry, now, FEE_TTL_MS)) return entry.result;
  }
  return null;
}

class PauseError extends Error {
  constructor(status) { super(status); this.status = status; }
}

export async function getFee(asin, { concurrencia }, currency = "USD") {
  const cached = await cachedFee(asin, currency);
  if (cached) return cached;
  // La pausa se comparte entre pestañas: otra página de resultados no debe reintentar enseguida.
  const pause = await localGet("pausedUntil");
  if (pause && pause.until > Date.now()) return { status: pause.status };
  queue ??= createQueue({ concurrency: concurrencia });
  return queue.run(asin, async () => {
    const doc = await fetchDoc(asin);
    const result = doc ? resultFromDoc(doc) : { status: "throttled" };
    if (result.status === "captcha" || result.status === "throttled") {
      const ms = result.status === "captcha" ? CAPTCHA_PAUSE_MS : THROTTLE_PAUSE_MS;
      queue.pause(ms, new PauseError(result.status));
      await localSet("pausedUntil", { until: Date.now() + ms, status: result.status });
    }
    await putFee(asin, result, currency);
    return result;
  });
}
