import PackagePlugin

/// RuleGen SPM build plugin.
///
/// Runs automatically on every `swift build`. Scans the package directory
/// and writes CLAUDE.md (and optionally .cursorrules) to the package root.
/// Works identically to the SwiftLint SPM plugin — no init command, no config.
///
/// Add to your Package.swift:
///
///   dependencies: [
///     .package(url: "https://github.com/sutheesh/rulegen-swift", from: "1.0.0"),
///   ],
///   targets: [
///     .target(
///       name: "MyApp",
///       plugins: [.plugin(name: "RuleGenPlugin", package: "rulegen-swift")]
///     ),
///   ]
@main
struct RuleGenPlugin: BuildToolPlugin {
    func createBuildCommands(context: PluginContext, target: Target) throws -> [Command] {
        let tool = try context.tool(named: "rulegen-cli")

        // Write rules files to the package root so CLAUDE.md appears next to Package.swift.
        // The plugin work directory is inside .build/ and is not committed.
        let packageRoot = context.package.directory.string

        // outputFilesDirectory must be inside pluginWorkDirectory (SPM sandbox rule).
        // We use it as a stamp location — the actual output (CLAUDE.md) goes to packageRoot.
        let outputDir = context.pluginWorkDirectory

        return [
            .prebuildCommand(
                displayName: "RuleGen: Generating AI coding rules",
                executable: tool.path,
                arguments: [
                    "--output", packageRoot,
                    "--silent",
                ],
                outputFilesDirectory: outputDir
            ),
        ]
    }
}
