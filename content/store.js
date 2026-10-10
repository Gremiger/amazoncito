import { mergeSettings } from "../lib/settings.js";
import { raceWithLate } from "../lib/late.js";
import { updateToShow, downloadUrl } from "../lib/update.js";

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

// Versión nueva publicada que la persona todavía no ocultó, o null.
export async function getUpdate() {
  const latest = await chrome.runtime.sendMessage({ type: "latestRelease" }).catch(() => null);
  const update = updateToShow(latest, chrome.runtime.getManifest().version, await localGet("updateDismissed"));
  return update && { ...update, download: downloadUrl(chrome.runtime.getURL("")) };
}
export const dismissUpdate = (version) => localSet("updateDismissed", version);
