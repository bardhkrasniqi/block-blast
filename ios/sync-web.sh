#!/usr/bin/env bash
# Copy the web game from the repo root into the iOS app bundle (BlockBlast/www).
# Run this whenever you change the web game, then rebuild in Xcode.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
DEST="$HERE/BlockBlast/www"

mkdir -p "$DEST"
rm -rf "$DEST"/*

for f in index.html style.css game.js manifest.json sw.js \
         icon-180.png icon-192.png icon-512.png; do
  cp "$ROOT/$f" "$DEST/"
done

echo "Synced web assets -> $DEST"
