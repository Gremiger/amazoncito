# Política de privacidad de Amazoncito

Última actualización: 9 de octubre de 2026

Amazoncito es una extensión de navegador que muestra, en amazon.com, el costo total de traer un
producto a Argentina. **No recolecta, vende ni comparte datos personales.** No tiene servidores
propios, no usa analíticas ni publicidad y no requiere cuenta.

## Qué datos guarda y dónde

Todo queda en tu navegador, en el almacenamiento de la extensión (`chrome.storage`):

- **Totales de productos ya vistos:** código ASIN, precio, envío, cargos de importación y si es
  elegible para envío gratis. Se usan como caché y se borran solos a las 24 horas.
- **Cotizaciones del dólar** (oficial y MEP) y la cotización que usa Amazon para pasar de USD a ARS,
  calculada a partir de los precios que ya viste.
- **El texto de la ubicación de entrega** que muestra Amazon en el encabezado (por ejemplo,
  "Río Cuarto 5800"), para reconocer que tu dirección es de Argentina.
- **Tus preferencias** (percepciones, mostrar pesos, etc.). Estas se guardan en `chrome.storage.sync`,
  por lo que el navegador puede sincronizarlas entre tus dispositivos con tu cuenta de Google/Chrome.

Podés borrar todo desinstalando la extensión.

## Conexiones que hace

- **amazon.com:** para leer la página de cada producto que estás viendo y obtener el costo de envío e
  importación a Argentina. El pedido lo hace tu navegador, igual que si abrieras el producto, con tu
  sesión de Amazon. La extensión no lee ni guarda tu nombre, dirección completa, pedidos ni datos de pago.
- **dolarapi.com:** para obtener la cotización del dólar oficial y MEP. No se envía ningún dato tuyo.

## Afiliación

Amazoncito no está afiliado, patrocinado ni respaldado por Amazon.com, Inc. "Amazon" es una marca de
Amazon.com, Inc. o sus afiliadas.

## Contacto

[COMPLETAR: email de contacto]
