import { mergeSettings } from "../lib/settings.js";
import { raceWithLate } from "../lib/late.js";

export async function getSettings() {
  return mergeSettings(await chrome.storage.sync.get(null));
}
export const setSetting = (key, value) => chrome.storage.sync.set({ [key]: value });
const RATES_WAIT_MS = 1500;
// Nunca bloquear los badges por la cotización: si tarda, se sigue sin la línea ARS y, cuando llega,
// se avisa por `onLate` para completar lo ya dibujado.
export const getRates = (onLate = () => {}) =>
  raceWithLate(chrome.runtime.sendMessage({ type: "rates" }), RATES_WAIT_MS, onLate);
export async function withAmazonRate(rates) {
  const amazon = await localGet("amazonRate");
  return amazon ? { ...(rates ?? {}), amazon } : rates;
}
export async function localGet(key) { return (await chrome.storage.local.get(key))[key]; }
export const localSet = (key, value) => chrome.storage.local.set({ [key]: value });
