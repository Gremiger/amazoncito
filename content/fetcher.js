import { parseFeeDetails, isNoShip, isCaptcha, parseFreeShippingEligible } from "../lib/parse.js";
import { createQueue } from "../lib/queue.js";
import { feeKey, isFresh, FEE_TTL_MS } from "../lib/cache.js";
import { localGet, localSet } from "./store.js";

const CAPTCHA_PAUSE_MS = 5 * 60 * 1000;
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
      return new DOMParser().parseFromString(await res.text(), "text/html");
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

export async function putFee(asin, result) {
  if (result.status === "ok" || result.status === "noship") await localSet(feeKey(asin), { at: Date.now(), result });
}

export async function getFee(asin, { concurrencia }) {
  const cached = await localGet(feeKey(asin));
  if (isFresh(cached, Date.now(), FEE_TTL_MS)) return cached.result;
  queue ??= createQueue({ concurrency: concurrencia });
  if (queue.pausedUntil > Date.now()) return { status: "captcha" };
  return queue.run(asin, async () => {
    const result = resultFromDoc(await fetchDoc(asin));
    if (result.status === "captcha") queue.pause(CAPTCHA_PAUSE_MS);
    await putFee(asin, result);
    return result;
  });
}
