#!/bin/bash
# tests/measure-bundle.sh — Bundle size measurement for VAL-04
#
# Measures the total gzipped size of all clone-authored source files.
# This is an automated metric for VAL-04: "Bundle size ≤180 kB gzipped
# (≤20% larger than original ~150 kB baseline)".
#
# What IS measured:
#   - All .js files under src/          (clone-authored JavaScript modules)
#   - All .css files under src/styles/   (clone-authored CSS files)
#
# What is NOT measured:
#   - index.html           (shell HTML, minimal)
#   - CDN dependencies      (Tailwind CSS, pdf.js, pdf-lib, @noble/hashes, Google Fonts)
#   - tests/ directory
#   - .planning/ directory
#   - node_modules/        (does not exist — project is CDN-based)
#
# Output: JSON line to stdout with keys:
#   total_raw_bytes   — sum of all .js + .css raw bytes
#   total_gzip_bytes  — sum of all .js + .css gzip bytes
#   css_raw_bytes     — all .css raw bytes
#   css_gzip_bytes    — all .css gzip bytes
#   js_raw_bytes      — all .js raw bytes
#   js_gzip_bytes     — all .js gzip bytes
#   pass              — boolean: true if total_gzip_bytes ≤ 180000
#
# Exit codes: 0 on success (JSON reports pass/fail verdict).
#             Non-zero only if measurement fails entirely (missing src/, no gzip, etc.).

set -euo pipefail

THRESHOLD=180000

# --- JS measurement ---
JS_RAW=0
JS_GZIP=0
if [ -d src ]; then
  JS_RAW=$(find src/ -name "*.js" -type f -exec cat {} + 2>/dev/null | wc -c)
  JS_GZIP=$(find src/ -name "*.js" -type f -exec cat {} + 2>/dev/null | gzip -c | wc -c)
fi

# --- CSS measurement ---
CSS_RAW=0
CSS_GZIP=0
if [ -d src/styles ]; then
  CSS_RAW=$(find src/styles/ -name "*.css" -type f -exec cat {} + 2>/dev/null | wc -c)
  CSS_GZIP=$(find src/styles/ -name "*.css" -type f -exec cat {} + 2>/dev/null | gzip -c | wc -c)
fi

# --- Totals ---
TOTAL_RAW=$((JS_RAW + CSS_RAW))
TOTAL_GZIP=$((JS_GZIP + CSS_GZIP))

# --- Verdict ---
PASS="false"
if [ "$TOTAL_GZIP" -le "$THRESHOLD" ]; then
  PASS="true"
fi

# --- JSON output via python3 for reliable formatting ---
PY_PASS="False"
if [ "$PASS" = "true" ]; then
  PY_PASS="True"
fi

python3 -c "
import json
print(json.dumps({
    'total_raw_bytes': $TOTAL_RAW,
    'total_gzip_bytes': $TOTAL_GZIP,
    'css_raw_bytes': $CSS_RAW,
    'css_gzip_bytes': $CSS_GZIP,
    'js_raw_bytes': $JS_RAW,
    'js_gzip_bytes': $JS_GZIP,
    'pass': ${PY_PASS}
}))
"
