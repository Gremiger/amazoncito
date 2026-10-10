<p align="center"><img src="icons/icon.svg" width="96" alt="Amazoncito"></p>

# Amazoncito

Extensión para Chrome, Arc, Brave, Edge, Firefox y Zen que te muestra en **amazon.com** cuánto te cuesta
de verdad traer cada producto a Argentina, sin tener que abrirlo uno por uno.

![Listado con totales](store/screenshots/1-listado.png)

## Qué hace

- **Total a Argentina** en cada producto (búsquedas, más vendidos, ofertas y la ficha): precio +
  envío AmazonGlobal + cargos de importación estimados por Amazon.
- **En pesos**, de dos formas: pagando con dólares propios (MEP) y pagando en pesos con
  percepciones (Ganancias 30 % + Ingresos Brutos de tu provincia).
- **Envío gratis desde USD 99**: etiqueta verde en los productos elegibles y cuánto costarían con
  ese envío.
- **Ordenar por total**: botón arriba de los resultados. El más barato en Amazon no siempre es el
  más barato puesto en Argentina.
- **Productos que no envían a Argentina**: se atenúan (o se ocultan, desde Opciones).
- **Avisos del régimen courier**: si superás la franquicia de USD 400 o el tope de USD 3.000 por envío.
- **Carrito**: cuánto te falta para el envío gratis y el total estimado del pedido.
- Funciona con Amazon en **dólares o en pesos**.

| Ordenado por total | Ficha del producto |
|---|---|
| ![Ordenado](store/screenshots/2-ordenado.png) | ![Ficha](store/screenshots/3-ficha.png) |

## Instalación

### Chrome, Arc, Brave y Edge

1. **Descargá** [amazoncito.zip](https://github.com/Gremiger/amazoncito/releases/latest/download/amazoncito.zip).
2. **Descomprimilo** en una carpeta que no vayas a borrar (por ejemplo, `Documentos/amazoncito`).
   ⚠️ El navegador la usa desde ahí: si la borrás o la movés, la extensión deja de funcionar.
3. **Abrí la página de extensiones** de tu navegador:
   - Chrome: `chrome://extensions`
   - Arc: `arc://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
4. **Activá el "Modo de desarrollador"** (Developer mode), arriba a la derecha (en Edge, abajo a
   la izquierda).
5. Tocá **"Cargar descomprimida"** (Load unpacked) y elegí la carpeta del paso 2 (la que tiene
   el archivo `manifest.json` adentro).
6. Entrá a [amazon.com](https://www.amazon.com) con la **ubicación de entrega en Argentina**
   (arriba a la izquierda, "Deliver to"). Listo.

> El navegador puede mostrar un aviso sobre extensiones en modo desarrollador: es normal en las
> extensiones que no vienen de la tienda.

### Firefox y Zen

1. **Descargá** [amazoncito.zip](https://github.com/Gremiger/amazoncito/releases/latest/download/amazoncito.zip)
   y descomprimilo en una carpeta que no vayas a borrar.
2. Abrí `about:debugging#/runtime/this-firefox` y tocá **"Cargar complemento temporal…"**
   (Load Temporary Add-on). Elegí el archivo `manifest.json` de la carpeta.
3. Si se abren las Opciones con el aviso **"necesita acceso a amazon.com"**, tocá **"Dar acceso"**.
4. Entrá a [amazon.com](https://www.amazon.com) con la **ubicación de entrega en Argentina**.

> ⚠️ Firefox borra los complementos temporales al cerrarse: hay que repetir el paso 2 cada vez que
> abrís el navegador. Para que quede instalada de forma permanente, la extensión tiene que estar
> firmada por Mozilla (ver [Desarrollo](#desarrollo)).

## Configuración

Desde la página de extensiones → Amazoncito → **Detalles** → **Opciones de la extensión**:

- **Percepción IIBB**: viene en 0 % (Córdoba). Si sos de otra provincia, poné la que ves en el
  resumen de tu tarjeta.
- **Perfil**: el nombre que aparece en la línea "En pesos (…)".
- Mostrar u ocultar los pesos, qué hacer con los productos que no envían, y más.

## Actualizar

Cuando haya una versión nueva:

1. Descargá de nuevo [amazoncito.zip](https://github.com/Gremiger/amazoncito/releases/latest/download/amazoncito.zip).
2. Reemplazá el contenido de tu carpeta con el del zip nuevo.
3. En la página de extensiones, tocá el ícono de recargar (↻) de Amazoncito.

Las versiones y sus cambios están en [Releases](https://github.com/Gremiger/amazoncito/releases).

## Si algo no anda

- **No aparece nada**: revisá que la ubicación de entrega de Amazon sea Argentina y recargá la página.
- **"Amazon pidió captcha"**: resolvé el captcha en cualquier página de Amazon. Si se repite,
  en Opciones → Listados elegí "Solo al pasar el mouse".
- **"Cambiá la moneda de Amazon a USD o ARS"**: Amazon está en otra moneda (euros, reales…).

## Privacidad

No hay servidores, cuentas ni analíticas: todo queda en tu navegador. Ver la
[política de privacidad](store/privacy-policy.md).

Los montos son estimaciones basadas en lo que informa Amazon; el valor final lo define Amazon en
el checkout y tu banco en el resumen.

Amazoncito no está afiliado a Amazon.com, Inc.

## Licencia

[MIT](LICENSE): podés usarla, modificarla y compartirla libremente, manteniendo el aviso de autoría.

## Desarrollo

```sh
npm install
npm test          # tests con node --test y fixtures reales de Amazon
npm run pack      # arma dist/amazoncito-<versión>.zip
npm run pack:firefox  # arma dist/amazoncito-firefox-<versión>.zip para firmar en AMO
```

Para Firefox: `npx web-ext lint` valida la extensión y `npx web-ext run` la abre en un Firefox
limpio. Para instalarla de forma permanente hay que firmarla en [addons.mozilla.org](https://addons.mozilla.org/developers/)
(puede ser "unlisted", sin publicarla en la tienda): `npx web-ext sign --channel=unlisted` con las claves
de la API de AMO, y se instala el `.xpi` resultante arrastrándolo al navegador.

Para publicar una versión nueva: subir `version` en `manifest.json`, `npm run pack` y crear el
release con el zip renombrado a `amazoncito.zip` (así el link de descarga siempre apunta al último).
