# amazon-ar — Diseño

Fecha: 2026-10-09

## Objetivo

Extensión de navegador (Arc / Chromium, Manifest V3) para amazon.com que, cuando la
ubicación de entrega es **Argentina**, muestra en cada producto el **costo total de
traerlo** (precio + AmazonGlobal Shipping + Estimated Import Charges) sin tener que
abrir el popover "Details", y destaca el umbral de **envío gratis a partir de USD 99**.

### Criterios de éxito

- En listados (búsqueda, categoría, más vendidos, ofertas) cada tarjeta visible muestra
  "Total USD X" con el valor exacto que Amazon da en la ficha del producto.
- En la ficha del producto aparece un recuadro con el total, sin clicks.
- En el carrito se ve el progreso hacia USD 99 y un total estimado del pedido.
- El dato principal es USD (el usuario paga con tarjeta usando dólares propios).
  Secundario y ocultable: equivalente en ARS al dólar oficial y con percepciones.
- Fuera de Argentina la extensión no hace nada.

### Fuera de alcance (YAGNI)

- Otros marketplaces (amazon.es, .co.uk…). Solo amazon.com.
- Historial de precios (ya lo cubre Keepa).
- Calcular impuestos aduaneros propios: se usa la estimación de Amazon.
- Publicación en Chrome Web Store: se carga como "unpacked".

## Hallazgos (exploración 2026-10-09)

- Con ubicación Argentina, las tarjetas de listado traen precio y texto de envío
  ("Entrega GRATIS…", "Entrega por $X…", o nada) pero **no** los cargos de importación.
- La ficha `/dp/{ASIN}` trae en su HTML el popover precargado `#a-popover-NEW_0` con
  `table.a-lineitem`: filas Price / AmazonGlobal Shipping / Estimated Import Charges /
  Total. Un `fetch` same-origin con cookies lo devuelve completo: ~1,9 s, ~2,4 MB.
- La moneda mostrada depende de la preferencia del usuario (USD en su cuenta; ARS en
  un navegador limpio). El idioma también varía (labels en inglés o español).
- dolarapi.com: `/v1/dolares/oficial` (venta 1540) y `/v1/dolares/tarjeta`
  (venta 2002 = oficial × 1,30, es decir solo la percepción de Ganancias 30 %).

## Arquitectura

Repositorio propio en `/Users/gremiger/Documents/Personal/coding/amazon-ar`.
JS plano, sin build. Tests con `node --test`.

| Archivo | Responsabilidad |
|---|---|
| `manifest.json` | MV3. `host_permissions`: `https://www.amazon.com/*`, `https://dolarapi.com/*`. `permissions`: `storage`. Content scripts por patrón de URL. |
| `lib/parse.js` | Puro. `parseFeeDetails(doc)` → `{price, shipping, importCharges, total, currency}` o `null`. `parseMoney(text)` → `{amount, currency}` (soporta `$389.00`, `USD 389.00`, `ARS 589,918.50`). `parseFreeShippingEligible(doc)` → boolean. `isCaptcha(doc)` → boolean. |
| `lib/calc.js` | Puro. `toArs(usd, rates, cfg)` → `{oficial, conPercepciones}`. `freeShippingGap(subtotalUsd)` → USD faltantes para 99 (0 si ya llega). |
| `lib/format.js` | Puro. Formato de montos (`USD 503,00`, `ARS 774.620`). |
| `background.js` | Service worker: solo cotizaciones (dolarapi.com, caché 1 h) y poda de caché al iniciar. **No parsea HTML**: los service workers MV3 no tienen `DOMParser`. |
| `content/fetcher.js` | Cola de fetch same-origin de `/dp/{ASIN}` (concurrencia configurable, default 3, por pestaña), dedup de pedidos en vuelo, parseo con `DOMParser` vía `lib/parse.js`, caché compartida en `chrome.storage.local`. |
| `content/common.js` | Detecta Argentina (`#glow-ingress-line2`), lee configuración, helpers de badge/estilos. |
| `content/listing.js` | `IntersectionObserver` sobre tarjetas `[data-component-type="s-search-result"]` y equivalentes de otras grillas; pide datos y pinta badge. `MutationObserver` para resultados cargados dinámicamente. |
| `content/product.js` | Ficha: parsea el popover del DOM ya presente (sin fetch) y pinta un recuadro bajo el precio. Guarda el resultado en la caché. |
| `content/cart.js` | Carrito: subtotal, barra de progreso a USD 99, total estimado sumando la caché por ASIN × cantidad; ítems sin dato en caché se piden al background. |
| `content/styles.css` | Estilos de badges/recuadros (respetan fondo claro de Amazon). |
| `options.html` + `options.js` | Configuración. |

### Flujo de datos

```
tarjeta visible → listing.js → fetcher.js
                                 ├─ caché fresca (storage.local) → dato
                                 └─ cola fetch /dp/ASIN → parse.js → guarda caché → dato
cotización ← background (msg "rates")
dato + cotización → calc.js / format.js → badge
```

Los módulos de `lib/` son ES modules; los content scripts (clásicos) los cargan con
`import(chrome.runtime.getURL("lib/…"))`, declarados en `web_accessible_resources`.

## Cálculo y configuración

- **USD (principal):** `total` del popover tal cual. Si falta la fila Total, se suma
  price + shipping + importCharges.
- **ARS (secundario, ocultable):**
  - `oficial = totalUsd × oficial.venta`
  - `conPercepciones = totalUsd × oficial.venta × (1 + ganancias% + iibb%)`
- **Configuración (`chrome.storage.sync`), defaults:**
  - `mostrarArs`: true (se ve en un tooltip/línea chica, no compite con USD)
  - `percepcionGanancias`: 30
  - `percepcionIibb`: 0 (depende de la provincia; el usuario la ajusta)
  - `concurrencia`: 3
  - `modoListado`: `"auto"` (fetch al hacerse visible) | `"hover"` (solo al pasar el
    mouse / click en "Calcular total") — válvula de escape ante captchas.
- **Cotización:** dolarapi.com `/v1/dolares/oficial`, caché 1 h en `chrome.storage.local`.
  Si falla, se usa la última guardada y se indica la fecha; sin ninguna, se omite ARS.

### Moneda distinta de USD

Si `parseFeeDetails` devuelve `currency !== "USD"`, el badge muestra
"Cambiá la moneda de Amazon a USD" con link a la preferencia de moneda. No se
reconvierte (la tasa de Amazon no es la del usuario).

## Envío gratis USD 99

- `parseFreeShippingEligible(doc)`: busca en la ficha el mensaje de envío gratis
  AmazonGlobal para pedidos que superan USD 99 (texto en inglés o español). El patrón
  exacto se fija con fixtures reales en la implementación.
- **Listado:** ítems elegibles llevan una etiqueta verde destacada "Envío gratis ≥ USD 99".
  Si el precio del ítem solo ya supera 99, el badge lo dice ("Este solo ya llega").
- **Ficha:** el recuadro indica elegibilidad y cuánto falta para 99 con este ítem.
- **Carrito:** barra de progreso con el subtotal de ítems elegibles: "Te faltan USD X
  para envío gratis" / "Envío gratis alcanzado". Total estimado del carrito como suma
  de totales por ítem (aclarado como estimado: con envío consolidado Amazon recalcula
  en checkout).

## UI

- **Badge de listado** (bajo el precio de la tarjeta):
  `Total a AR: USD 503,00` en negrita; debajo, chico y gris si `mostrarArs`:
  `≈ ARS 774.620 · c/percep. ARS 1.007.006`. Estados: cargando ("Calculando…"),
  error ("Ver total" — link a la ficha), no envía ("No envía a Argentina", si la ficha
  no tiene popover ni texto de envío), moneda.
- **Ficha:** recuadro con desglose (precio / envío / importación / total), ARS y
  elegibilidad 99.
- **Carrito:** barra de progreso + total estimado arriba del subtotal.
- Clic en "ARS" del badge alterna mostrar/ocultar (persistente, `mostrarArs`).

## Errores y robustez

- Fetch con timeout 15 s; 1 reintento. Respuesta con captcha
  (`/errors/validateCaptcha` o form de captcha en el HTML) → se pausa la cola 5 min, se
  marca en badges "Amazon pidió captcha — pausado" y se sugiere `modoListado: hover`.
- Caché por ASIN 24 h en `chrome.storage.local` (clave `fee:{ASIN}`), con poda de
  entradas vencidas al iniciar el service worker.
- Deduplicación: el mismo ASIN pedido varias veces comparte una sola promesa en vuelo.
- Selectores frágiles centralizados en `lib/parse.js` / `content/common.js`; si un
  parse devuelve `null`, el badge cae a "Ver total".

## Testing

- `node --test` sobre `lib/*.js` (módulos ES puros). `parse.js` recibe un `Document`;
  en los tests se construye con `linkedom` (única devDependency), en el navegador con
  `DOMParser`.
- Fixtures reales en `test/fixtures/`: ficha con USD, ficha con ARS, ficha sin envío a
  Argentina, ficha elegible a envío gratis, página de búsqueda, carrito. Capturados
  con un navegador con ubicación Argentina.
- Prueba manual: cargar unpacked en Arc, recorrer búsqueda → ficha → carrito, y
  comprobar el ejemplo B0DX68TWW4 (USD 389 + 26,70 + 87,30 = 503,00).
