#!/bin/sh
# Arma el .zip para la Chrome Web Store solo con los archivos de la extensión.
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./manifest.json').version")
OUT="dist/amazoncito-$VERSION.zip"
mkdir -p dist
rm -f "$OUT"
zip -qr "$OUT" manifest.json LICENSE background.js options.html options.js content lib icons -x '*.DS_Store' 'icons/*.svg'
echo "$OUT ($(du -h "$OUT" | cut -f1))"
