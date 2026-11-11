#!/bin/sh
# Arma el .zip para Chromium solo con los archivos de la extensión.
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./manifest.json').version")
OUT="$PWD/dist/amazoncito-$VERSION.zip"
mkdir -p dist
rm -f "$OUT"
zip -qr "$OUT" manifest.json LICENSE background.js options.html options.js content lib icons -x '*.DS_Store' 'icons/*.svg'
# background.scripts es solo para Firefox: Chrome lo marca como error en la página de extensiones.
TMP=$(mktemp -d)
node -e "const m=require('./manifest.json'); delete m.background.scripts; process.stdout.write(JSON.stringify(m, null, 2) + '\n')" > "$TMP/manifest.json"
(cd "$TMP" && zip -q "$OUT" manifest.json)
rm -rf "$TMP"
echo "$OUT ($(du -h "$OUT" | cut -f1))"
