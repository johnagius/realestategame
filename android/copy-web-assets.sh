#!/bin/bash
# Copies the web game files into the Android assets folder for APK packaging.
# Run this before building the APK.
#
# Usage: cd android && ./copy-web-assets.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_SRC="$SCRIPT_DIR/.."
ASSETS_DIR="$SCRIPT_DIR/app/src/main/assets/web"

echo "Copying web game files to Android assets..."

# Clean previous copy
rm -rf "$ASSETS_DIR"
mkdir -p "$ASSETS_DIR"

# Copy game files
cp "$WEB_SRC/index.html" "$ASSETS_DIR/"
cp -r "$WEB_SRC/css" "$ASSETS_DIR/"
cp -r "$WEB_SRC/js" "$ASSETS_DIR/"
cp -r "$WEB_SRC/assets" "$ASSETS_DIR/"
cp "$WEB_SRC/manifest.json" "$ASSETS_DIR/"

# Skip service worker — not needed in native app
# Skip simulate.js — test-only file
rm -f "$ASSETS_DIR/js/simulate.js"

echo "Done. Web assets copied to: $ASSETS_DIR"
echo ""
echo "Files:"
find "$ASSETS_DIR" -type f | sort | while read f; do
    echo "  ${f#$ASSETS_DIR/}"
done
