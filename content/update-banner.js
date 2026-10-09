import { DOWNLOAD_URL, HOWTO_URL } from "../lib/update.js";

function link(doc, text, href) {
  const a = doc.createElement("a");
  a.textContent = text;
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

export function renderUpdateBanner(doc, { version }, onDismiss) {
  const bar = doc.createElement("div");
  bar.className = "amzar amzar-update";
  bar.dataset.amzarBadge = "1";
  bar.append(`⬆ Hay una versión nueva de Amazoncito (${version}) · `, link(doc, "Descargar", DOWNLOAD_URL), " · ",
    link(doc, "Cómo actualizar", HOWTO_URL));
  const close = doc.createElement("button");
  close.type = "button";
  close.className = "amzar-toggle";
  close.title = "Ocultar hasta la próxima versión";
  close.textContent = "✕";
  close.addEventListener("click", (e) => { e.preventDefault(); bar.remove(); onDismiss?.(version); });
  bar.append(" ", close);
  return bar;
}
