import { mergeSettings } from "../lib/settings.js";

export async function getSettings() {
  return mergeSettings(await chrome.storage.sync.get(null));
}
export const setSetting = (key, value) => chrome.storage.sync.set({ [key]: value });
export const getRates = () => chrome.runtime.sendMessage({ type: "rates" });
export async function localGet(key) { return (await chrome.storage.local.get(key))[key]; }
export const localSet = (key, value) => chrome.storage.local.set({ [key]: value });
