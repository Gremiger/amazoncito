import { detectArgentina, glowText } from "../lib/parse.js";
import { localGet, localSet } from "./store.js";

// Páginas sin texto de envío (p. ej. el carrito) se reconocen por la ubicación ya vista con Argentina.
async function isArgentina(doc) {
  const glow = glowText(doc);
  if (detectArgentina(doc)) {
    if (glow) await localSet("arGlow", glow);
    return true;
  }
  return !!glow && glow === (await localGet("arGlow"));
}

const path = location.pathname;
if (await isArgentina(document)) {
  if (/\/(dp|gp\/product)\//.test(path)) (await import("./product.js")).default();
  else if (/\/(gp\/cart|cart)\b/.test(path)) (await import("./cart.js")).default();
  else (await import("./listing.js")).default();
}
