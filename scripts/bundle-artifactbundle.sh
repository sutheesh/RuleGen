#!/usr/bin/env bash
# Creates the SPM artifact bundle from pre-built macOS binaries.
# Must be run AFTER build-binaries.sh on both macOS arm64 and x64 runners.
# The GitHub Actions release workflow runs this automatically.
#
# Output: dist/rulegen-macos.artifactbundle.zip
# Usage: ./scripts/bundle-artifactbundle.sh

set -euo pipefail

VERSION=$(node -p "require('./package.json').version")
BUNDLE_NAME="rulegen-macos.artifactbundle"
BUNDLE_DIR="dist/$BUNDLE_NAME"
OUT="dist"

ARM64_BIN="dist/binaries/rulegen-macos-arm64"
X64_BIN="dist/binaries/rulegen-macos-x64"

if [[ ! -f "$ARM64_BIN" || ! -f "$X64_BIN" ]]; then
  echo "Error: Missing binaries. Run build-binaries.sh on both macOS arm64 and x64 first."
  exit 1
fi

# Clean and create bundle structure
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR/bin/rulegen-arm64-apple-macosx"
mkdir -p "$BUNDLE_DIR/bin/rulegen-x86_64-apple-macosx"

# Copy binaries
cp "$ARM64_BIN" "$BUNDLE_DIR/bin/rulegen-arm64-apple-macosx/rulegen-cli"
cp "$X64_BIN"   "$BUNDLE_DIR/bin/rulegen-x86_64-apple-macosx/rulegen-cli"
chmod +x "$BUNDLE_DIR/bin/rulegen-arm64-apple-macosx/rulegen-cli"
chmod +x "$BUNDLE_DIR/bin/rulegen-x86_64-apple-macosx/rulegen-cli"

# Write info.json (SPM artifact bundle manifest)
cat > "$BUNDLE_DIR/info.json" << EOF
{
  "schemaVersion": "1.0",
  "artifacts": {
    "rulegen-cli": {
      "version": "$VERSION",
      "type": "executable",
      "variants": [
        {
          "path": "bin/rulegen-arm64-apple-macosx/rulegen-cli",
          "supportedTriples": ["arm64-apple-macosx"]
        },
        {
          "path": "bin/rulegen-x86_64-apple-macosx/rulegen-cli",
          "supportedTriples": ["x86_64-apple-macosx"]
        }
      ]
    }
  }
}
EOF

# Zip the bundle
cd dist
zip -r "$BUNDLE_NAME.zip" "$BUNDLE_NAME/"
cd ..

# Compute SHA256 checksum (needed for Package.swift binaryTarget)
CHECKSUM=$(shasum -a 256 "$OUT/$BUNDLE_NAME.zip" | awk '{print $1}')
echo "$CHECKSUM" > "$OUT/$BUNDLE_NAME.zip.sha256"

echo "Created: $OUT/$BUNDLE_NAME.zip"
echo "SHA256:  $CHECKSUM"
echo ""
echo "Update platforms/swift/Package.swift with this checksum:"
echo "  checksum: \"$CHECKSUM\""
