# Amazoncito

Extensión de navegador (Manifest V3, Chrome/Arc/Brave/Edge y Firefox/Zen) que en amazon.com muestra el costo real de
traer cada producto a Argentina: precio + envío AmazonGlobal + cargos de importación, y su equivalente
en pesos (MEP y oficial con percepciones Ganancias + IIBB). Se distribuye desde GitHub Releases
(`Gremiger/amazoncito`), no desde las tiendas: `.zip` para "Cargar descomprimida" en Chromium y `.xpi`
firmado para Firefox.

JS plano con ES modules, sin build ni bundler. Única devDependency: `linkedom` (DOM para los tests).

## Comandos

```sh
npm test                          # node --test (todo test/*.test.js)
node --test test/parse.test.js    # un solo archivo
npm run pack                      # dist/amazoncito-<version>.zip (Chromium)
npm run pack:firefox              # dist/amazoncito-firefox-<version>.zip (web-ext, para firmar en AMO)
```

Para probar a mano: en Chromium, `chrome://extensions` → modo desarrollador → "Cargar descomprimida"
sobre la raíz del repo; en Firefox, `npx web-ext run`. Siempre con amazon.com y entrega en Argentina.

## Arquitectura

- `content/boot.js`: único content script declarado. Hace `import()` dinámico de `content/main.js`
  (por eso `lib/*.js` y `content/*.js` están en `web_accessible_resources`).
- `content/main.js`: solo actúa si la ubicación de entrega es Argentina (`detectArgentina`, o el texto
  `#glow-ingress-line2` ya visto y guardado en `arGlow`). Rutea por URL:
  `/dp/` o `/gp/product/` → `product.js`, `/cart` → `cart.js`, resto → `listing.js`.
- `content/listing.js`: busca tarjetas (`findCards`), pide la ficha de cada ASIN y pinta el badge;
  botón "ordenar por total"; atenúa/oculta los que no envían.
- `content/fetcher.js`: `getFee(asin)` hace `fetch('/dp/<asin>')` con cookies, lee el stream solo
  hasta tener la tabla "Shipping & Fee Details" (`lib/stream.js`, ~250 KB de ~2 MB) y la parsea.
  Cola con concurrencia configurable (`lib/queue.js`). Captcha o 503/429 → pausa compartida entre
  pestañas vía `pausedUntil` en storage. Cache por `fee:<asin>:<moneda>` 24 h.
- `content/badge.js`: renderiza el badge (DOM puro, testeable con linkedom).
- `content/store.js`: wrappers de `chrome.storage` y mensajes al background.
- `background.js` (service worker): cotizaciones de dolarapi.com (oficial + bolsa/MEP, cache 1 h,
  reintento cada 10 min si falla), último release de GitHub (1 vez por día) y limpieza de `fee:*` viejos.
  Se habla por `chrome.runtime.sendMessage({type: "rates" | "latestRelease"})`.
- `lib/`: lógica pura sin `chrome.*` ni `document` global → todo lo testeable vive acá.
  `parse.js` (scraping de Amazon), `calc.js` (pesos, envío gratis USD 99, resumen del carrito),
  `courier.js` (franquicia USD 400 / tope USD 3000), `currency.js` (USD/ARS, cotización aprendida de
  Amazon), `settings.js` (DEFAULTS + validación), `update.js` (aviso de versión nueva).
- `options.html/js` (`options_ui`, abre en pestaña): opciones y botón para otorgar permisos de sitio; settings en `chrome.storage.sync`, caches en `storage.local`.

## Convenciones

- Código, comentarios y UI en español rioplatense. Commits en inglés con prefijos `feat:`, `fix:`,
  `perf:`, `docs:`, `chore:`; los cambios entran por PR a `main`.
- Lógica nueva va a `lib/` como función pura con su test en `test/<modulo>.test.js`. Lo que toca
  `chrome.*` queda en `content/` o `background.js` y se mantiene delgado.
- Los parsers se testean contra HTML real de Amazon en `test/fixtures/` (`loadFixture` en
  `test/helpers.js`); `docFrom(html)` para fragmentos sintéticos. Si Amazon cambia el markup, agregar
  o actualizar un fixture antes de tocar `lib/parse.js`.
- Amazon puede estar en inglés o español y en USD o ARS: los regex de `parse.js` cubren ambos idiomas
  y `parseMoney` asume formato en-US ("1,234.56") en ambos casos.
- Valores normativos (régimen courier, umbral de envío gratis) están centralizados en
  `lib/courier.js` y `lib/calc.js`; cambiarlos ahí.
- Nada de servidores ni analíticas (ver `store/privacy-policy.md`). Nuevos hosts requieren tocar
  `host_permissions` en `manifest.json` y la política de privacidad.

## Release

1. Subir `version` en `manifest.json` (la leen `pack.sh`, web-ext y el aviso de actualización;
   Mozilla no acepta dos veces la misma).
2. `npm run pack` y `npm run pack:firefox`.
3. Subir el zip de Firefox a AMO como "unlisted" y bajar el `.xpi` firmado.
4. Crear el release en GitHub con `amazoncito.zip` y `amazoncito.xpi`, con esos nombres exactos: el
   README y el aviso apuntan a `releases/latest/download/amazoncito.{zip,xpi}`.

`package.json` no lleva versión; la fuente de verdad es `manifest.json`.

## Firefox / Zen

Un solo `manifest.json` sirve para los dos navegadores:
- `background` declara `service_worker` (Chrome) y `scripts` (Firefox, que no tiene service workers
  en extensiones); cada navegador usa la suya.
  Chrome marca `scripts` como error: `scripts/pack.sh` lo saca del zip de Chromium. Cargando el repo
  descomprimido en Chrome la advertencia aparece igual y es inofensiva.
- `browser_specific_settings.gecko`: id `amazoncito@gremiger`, Firefox ≥ 142,
  `data_collection_permissions: none`.
- En Firefox MV3 los `host_permissions` pueden quedar sin otorgar: `lib/permissions.js` lo detecta,
  `background.js` abre las Opciones al instalar y ahí está el botón "Dar acceso".
- `downloadUrl()` en `lib/update.js` elige `.xpi` o `.zip` según la URL de la extensión
  (`moz-extension:`), para el aviso de versión nueva.
- Se usa siempre `chrome.*` (Firefox lo acepta), no `browser.*`.

Se distribuye como `.xpi` firmado por Mozilla (AMO, "unlisted"), se instala permanente.
`npx web-ext lint` valida y `npx web-ext run` la abre en un Firefox limpio.

## Otros

- `docs/superpowers/`: spec y plan originales del diseño.
- `store/`: textos, capturas y opciones de ícono para la ficha de tienda (no van en el zip).
