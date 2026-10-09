import { mergeSettings } from "../lib/settings.js";

export async function getSettings() {
  return mergeSettings(await chrome.storage.sync.get(null));
}
export const setSetting = (key, value) => chrome.storage.sync.set({ [key]: value });
const RATES_WAIT_MS = 1500;
// Nunca bloquear los badges por la cotización: si tarda, se sigue sin la línea ARS.
export const getRates = () => Promise.race([
  chrome.runtime.sendMessage({ type: "rates" }).catch(() => null),
  new Promise((r) => setTimeout(() => r(null), RATES_WAIT_MS)),
]);
export async function localGet(key) { return (await chrome.storage.local.get(key))[key]; }
export const localSet = (key, value) => chrome.storage.local.set({ [key]: value });
