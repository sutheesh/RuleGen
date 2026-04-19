# RuleGen Swift Package Plugin

Auto-generates AI coding rules (CLAUDE.md, .cursorrules) on every `swift build`. Identical workflow to SwiftLint — add as a dependency, build, done.

## Installation

In your `Package.swift`:

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyApp",
    dependencies: [
        .package(url: "https://github.com/sutheesh/rulegen-swift", from: "1.0.0"),
    ],
    targets: [
        .target(
            name: "MyApp",
            plugins: [
                .plugin(name: "RuleGenPlugin", package: "rulegen-swift"),
            ]
        ),
    ]
)
```

Then run:

```bash
swift build
```

`CLAUDE.md` appears in your package root automatically. Every subsequent `swift build` updates it if your config files changed.

## How it works

1. SPM downloads the pre-built `rulegen-cli` binary (macOS arm64 + x86_64, no Node.js required)
2. The plugin runs as a pre-build command before compilation
3. `rulegen-cli` scans `Package.swift`, `.swiftlint.yml`, imports, etc.
4. Writes `CLAUDE.md` to your package root

## What it generates

For a SwiftUI + TCA project:

```markdown
# MyApp — Swift + SwiftUI

## Stack
- **Swift** 5.9
- **SwiftUI**
- Package manager: **spm**

## iOS / Swift
- Swift tools version: 5.9
- Deployment target: iOS 17
- UI: **SwiftUI**
- Package manager: **Swift Package Manager**
- Architecture: **TCA**

## Code Style
- Linter: **SwiftLint** (`.swiftlint.yml`)

## Testing
- Runner: **Swift Testing**
- Command: `swift test`
```

## Requirements

- Swift 5.9+ (Xcode 15+)
- macOS 13+ (arm64 or x86_64)

## Generate other formats

If you also want `.cursorrules` or `copilot-instructions.md`, run manually:

```bash
# After first build installs the binary
.build/artifacts/rulegen-swift/rulegen-cli/rulegen-cli --agent cursor
```
