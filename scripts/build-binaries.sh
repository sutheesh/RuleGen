#!/usr/bin/env bash
# Build standalone binaries for all platforms using bun.
# Run from the repo root: ./scripts/build-binaries.sh
# Requires: bun >= 1.1

set -euo pipefail

VERSION=$(node -p "require('./package.json').version")
OUT="dist/binaries"
mkdir -p "$OUT"

echo "Building RuleGen v$VERSION binaries..."

# Bundle to a single JS file first (no --compile, just bundle)
bun build src/index.ts \
  --outfile "$OUT/rulegen.js" \
  --target bun \
  --minify \
  --sourcemap=none

echo "  JS bundle: $OUT/rulegen.js ($(du -sh "$OUT/rulegen.js" | cut -f1))"

# Compile to standalone binaries for each platform
# bun build --compile embeds the bun runtime — output is a single executable

targets=(
  "bun-linux-x64:rulegen-linux-x64"
  "bun-linux-arm64:rulegen-linux-arm64"
  "bun-windows-x64:rulegen-windows-x64.exe"
)

for entry in "${targets[@]}"; do
  target="${entry%%:*}"
  name="${entry##*:}"

  echo "  Building $name..."
  bun build src/index.ts \
    --compile \
    --target "$target" \
    --outfile "$OUT/$name" \
    --minify \
    2>&1 | tail -1
done

# macOS binaries — built natively on macOS runner (cross-compile not supported by bun for macOS)
if [[ "$(uname)" == "Darwin" ]]; then
  ARCH=$(uname -m)
  if [[ "$ARCH" == "arm64" ]]; then
    echo "  Building rulegen-macos-arm64 (native)..."
    bun build src/index.ts --compile --outfile "$OUT/rulegen-macos-arm64" --minify
  else
    echo "  Building rulegen-macos-x64 (native)..."
    bun build src/index.ts --compile --outfile "$OUT/rulegen-macos-x64" --minify
  fi
fi

echo ""
echo "Binaries:"
ls -lh "$OUT/"

echo ""
echo "Done. Run ./scripts/bundle-artifactbundle.sh to create the SPM artifact bundle."
