export const REPO = "Gremiger/amazoncito";
export const DOWNLOAD_URL = `https://github.com/${REPO}/releases/latest/download/amazoncito.zip`;
export const HOWTO_URL = `https://github.com/${REPO}#actualizar`;
export const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;
export const UPDATE_TTL_MS = 24 * 60 * 60 * 1000;

const parts = (v) => String(v).replace(/^v/, "").split(".").map(Number);

export function isNewer(latest, current) {
  const a = parts(latest), b = parts(current);
  if (a.length !== 3 || a.some(Number.isNaN)) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

// Respuesta de GitHub "releases/latest" → { version, url } (sin borradores ni prereleases).
export function pickLatest(json) {
  if (!json?.tag_name || json.draft || json.prerelease) return null;
  return { version: json.tag_name.replace(/^v/, ""), url: json.html_url };
}

export function updateToShow(latest, current, dismissed) {
  if (!latest || !isNewer(latest.version, current) || latest.version === dismissed) return null;
  return latest;
}
