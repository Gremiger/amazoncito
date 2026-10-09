# Amazoncito

Extensión para Arc/Chrome. En amazon.com con entrega a Argentina muestra en listados,
ficha y carrito el total (precio + envío + importación estimada) en USD, y debajo lo
que costaría pagando en pesos con percepciones (perfil Río Cuarto, Córdoba: Ganancias
30 %, IIBB 0 %; editable en Opciones). Destaca los ítems con envío gratis desde USD 99.

Funciona con Amazon en USD o en ARS. En ARS muestra el total en pesos de Amazon y un USD
aproximado con la cotización que usa Amazon (la aprende al ver un mismo producto en ambas
monedas; mientras tanto usa el oficial). También avisa si se supera la franquicia de USD 400
o el tope courier de USD 3.000 por envío (constantes en `lib/courier.js`).

## Instalar
1. `arc://extensions` → Developer mode → Load unpacked → esta carpeta.
2. En Amazon: ubicación Argentina, moneda USD o ARS.

## Desarrollo
`npm install && npm test`

## Si Amazon pide captcha
Opciones → Listados → "Solo al pasar el mouse".
