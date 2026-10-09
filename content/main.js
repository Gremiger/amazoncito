export function isArgentina(doc) {
  return /Argentina/i.test(doc.querySelector("#glow-ingress-line2")?.textContent ?? "");
}

const path = location.pathname;
if (isArgentina(document)) {
  if (/\/(dp|gp\/product)\//.test(path)) (await import("./product.js")).default();
  else if (/\/(gp\/cart|cart)\b/.test(path)) (await import("./cart.js")).default();
  else (await import("./listing.js")).default();
}
