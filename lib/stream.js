// En /dp/ lo que usamos (tabla "Shipping & Fee Details", bloque de entrega o aviso de "no envía")
// está en los primeros ~250 KB de páginas de ~2 MB. Esto decide cuándo se puede dejar de leer.
const DELIVERY = "mir-layout-DELIVERY_BLOCK";
const DELIVERY_MARGIN = 8 * 1024; // el bloque mide ~1,8 KB

export function enoughHtml(text) {
  if (/cannot be shipped to your selected delivery location|no se puede enviar a la ubicaci[oó]n/i.test(text)) return "noship";
  const table = text.indexOf("a-lineitem");
  if (table < 0 || text.indexOf("</table>", table) < 0) return null;
  const del = text.indexOf(DELIVERY);
  if (del < 0 || text.length < del + DELIVERY_MARGIN) return null;
  return "fee";
}
