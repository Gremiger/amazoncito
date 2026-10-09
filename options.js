import { DEFAULTS, mergeSettings } from "./lib/settings.js";

const s = mergeSettings(await chrome.storage.sync.get(null));
for (const key of Object.keys(DEFAULTS)) {
  const el = document.getElementById(key);
  if (!el) continue;
  if (el.type === "checkbox") el.checked = s[key]; else el.value = s[key];
  el.addEventListener("change", async () => {
    const v = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value) : el.value;
    await chrome.storage.sync.set({ [key]: v });
    const p = document.getElementById("saved"); p.hidden = false; setTimeout(() => (p.hidden = true), 1200);
  });
}
