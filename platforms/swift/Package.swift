// swift-tools-version: 5.9
// RuleGen SPM Plugin — https://github.com/sutheesh/rulegen-swift
//
// Works exactly like SwiftLint: add it to your Package.swift and
// every `swift build` auto-generates CLAUDE.md, .cursorrules, etc.
//
// Usage in your Package.swift:
//   dependencies: [
//     .package(url: "https://github.com/sutheesh/rulegen-swift", from: "1.0.0"),
//   ],
//   targets: [
//     .target(
//       name: "MyApp",
//       plugins: [.plugin(name: "RuleGenPlugin", package: "rulegen-swift")]
//     ),
//   ]

import PackageDescription

let package = Package(
    name: "rulegen-swift",
    products: [
        .plugin(name: "RuleGenPlugin", targets: ["RuleGenPlugin"]),
    ],
    targets: [
        // The Swift plugin — runs on every swift build
        .plugin(
            name: "RuleGenPlugin",
            capability: .buildTool(),
            dependencies: ["rulegen-cli"]
        ),

        // Pre-built standalone binary — no Node.js required on the developer's machine.
        // The binary is compiled from the TypeScript engine and uploaded to GitHub releases.
        // Update url + checksum on each release via the release workflow.
        .binaryTarget(
            name: "rulegen-cli",
            url: "https://github.com/sutheesh/rulegen/releases/download/v1.0.0/rulegen-macos.artifactbundle.zip",
            checksum: "PLACEHOLDER_CHECKSUM_UPDATED_BY_RELEASE_WORKFLOW"
        ),
    ]
)
