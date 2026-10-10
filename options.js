import { DEFAULTS, mergeSettings } from "./lib/settings.js";
import { isNewer, DOWNLOAD_URL, HOWTO_URL } from "./lib/update.js";
import { hasHostPermissions, requestHostPermissions } from "./lib/permissions.js";

const permisos = document.getElementById("permisos");
permisos.hidden = await hasHostPermissions();
document.getElementById("otorgar").addEventListener("click", async () => {
  if (await requestHostPermissions()) permisos.hidden = true;
});

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

const current = chrome.runtime.getManifest().version;
const latest = await chrome.runtime.sendMessage({ type: "latestRelease" }).catch(() => null);
const v = document.getElementById("version");
v.textContent = `Versión ${current}`;
if (latest && isNewer(latest.version, current)) {
  v.append(" — hay una nueva: ");
  const a = document.createElement("a");
  a.href = DOWNLOAD_URL; a.textContent = `descargar ${latest.version}`; a.target = "_blank";
  const h = document.createElement("a");
  h.href = HOWTO_URL; h.textContent = "cómo actualizar"; h.target = "_blank";
  v.append(a, " · ", h);
}
