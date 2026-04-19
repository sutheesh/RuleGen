import type { ProjectContext, CommandInfo, DependencyInfo } from '../types.js';

function titleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildHeader(context: ProjectContext): string {
  const name = context.structure.rootName || 'Project';
  const stackParts: string[] = [];

  const primaryLang = context.languages[0];
  if (primaryLang) stackParts.push(primaryLang.name);

  const primaryFramework = context.frameworks[0];
  if (primaryFramework) stackParts.push(primaryFramework.name);

  const subtitle = stackParts.length > 0 ? ` — ${stackParts.join(' + ')}` : '';
  return `# ${name}${subtitle}`;
}

function buildStackSection(context: ProjectContext): string {
  const lines: string[] = ['## Stack'];

  const langLines = context.languages.map(l => {
    const ver = l.version ? ` ${l.version}` : '';
    return `- **${l.name}**${ver}`;
  });
  if (langLines.length > 0) lines.push(...langLines);

  const fwLines = context.frameworks.map(fw => {
    const ver = fw.version ? ` ${fw.version}` : '';
    return `- **${fw.name}**${ver}`;
  });
  if (fwLines.length > 0) lines.push(...fwLines);

  if (context.packageManager) {
    lines.push(`- Package manager: **${context.packageManager}**`);
  }

  if (context.monorepo) {
    lines.push(`- Monorepo: **${context.monorepo.tool}**`);
    if (context.monorepo.packages.length > 0) {
      lines.push(`  - Packages: ${context.monorepo.packages.join(', ')}`);
    }
  }

  const keyUIDeps = context.keyDependencies.filter(d => ['ui', 'state', 'orm', 'auth'].includes(d.category));
  if (keyUIDeps.length > 0) {
    lines.push('');
    lines.push('### Key Dependencies');
    const byCategory: Record<string, DependencyInfo[]> = {};
    for (const dep of keyUIDeps) {
      if (!byCategory[dep.category]) byCategory[dep.category] = [];
      byCategory[dep.category]!.push(dep);
    }
    for (const [cat, deps] of Object.entries(byCategory)) {
      lines.push(`- **${titleCase(cat)}**: ${deps.map(d => d.name).join(', ')}`);
    }
  }

  return lines.join('\n');
}

function buildCommandsSection(context: ProjectContext): string {
  if (context.commands.length === 0) return '';

  const lines: string[] = ['## Commands'];

  const priority = ['dev', 'start', 'build', 'test', 'lint', 'format', 'typecheck', 'type-check', 'check', 'e2e'];
  const sorted = [...context.commands].sort((a, b) => {
    const ai = priority.indexOf(a.name);
    const bi = priority.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });

  for (const cmd of sorted.slice(0, 12)) {
    lines.push(`- \`${cmd.command}\` — ${cmd.name}`);
  }

  return lines.join('\n');
}

function buildCodeStyleSection(context: ProjectContext): string {
  const style = context.codeStyle;
  const linter = context.linter;
  const formatter = context.formatter;

  const hasAnyStyle = style.indentation ?? style.semicolons ?? style.quotes ??
    style.maxLineLength ?? linter ?? formatter;

  if (!hasAnyStyle) return '';

  const lines: string[] = ['## Code Style'];

  if (linter) {
    lines.push(`- Linter: **${linter.name}** (\`${linter.configFile}\`)`);
  }

  if (formatter) {
    lines.push(`- Formatter: **${formatter.name}** (\`${formatter.configFile}\`)`);
  }

  if (style.indentation) {
    lines.push(`- Indentation: ${style.indentation.size} ${style.indentation.style}`);
  }

  if (style.semicolons !== null) {
    lines.push(`- Semicolons: ${style.semicolons ? 'required' : 'omit'}`);
  }

  if (style.quotes !== null) {
    lines.push(`- Quotes: ${style.quotes}`);
  }

  if (style.trailingComma !== null) {
    lines.push(`- Trailing comma: ${style.trailingComma ? 'yes' : 'no'}`);
  }

  if (style.maxLineLength !== null) {
    lines.push(`- Max line length: ${style.maxLineLength}`);
  }

  if (style.importOrder) {
    lines.push(`- Import order: ${style.importOrder}`);
  }

  if (style.noAny) {
    lines.push('- Avoid `any` types (TypeScript strict)');
  }

  if (style.customRules.length > 0) {
    lines.push('');
    lines.push('### Additional Rules');
    for (const rule of style.customRules.slice(0, 8)) {
      lines.push(`- \`${rule}\``);
    }
  }

  return lines.join('\n');
}

function buildTypeScriptSection(context: ProjectContext): string {
  const ts = context.typescriptConfig;
  if (!ts) return '';

  const lines: string[] = ['## TypeScript'];

  if (ts.strict) lines.push('- Strict mode: **enabled**');
  if (ts.noImplicitAny) lines.push('- No implicit any');
  if (ts.strictNullChecks) lines.push('- Strict null checks');
  if (ts.target) lines.push(`- Target: \`${ts.target}\``);
  if (ts.moduleResolution) lines.push(`- Module resolution: \`${ts.moduleResolution}\``);

  if (ts.baseUrl) lines.push(`- Base URL: \`${ts.baseUrl}\``);

  const aliases = Object.entries(ts.pathAliases);
  if (aliases.length > 0) {
    lines.push('- Path aliases:');
    for (const [alias, targets] of aliases.slice(0, 5)) {
      lines.push(`  - \`${alias}\` → \`${targets[0] ?? ''}\``);
    }
  }

  return lines.join('\n');
}

function buildTestingSection(context: ProjectContext): string {
  const runner = context.testRunner;
  if (!runner) return '';

  const lines: string[] = ['## Testing'];

  lines.push(`- Runner: **${runner.name}**`);
  if (runner.command) lines.push(`- Command: \`${runner.command}\``);
  if (context.testPattern) lines.push(`- Pattern: \`${context.testPattern}\``);
  if (context.testLocation) {
    lines.push(`- Location: ${context.testLocation === 'colocated' ? 'colocated with source files' : `\`${context.testLocation}\``}`);
  }

  return lines.join('\n');
}

function buildArchitectureSection(context: ProjectContext): string {
  const structure = context.structure;
  const lines: string[] = ['## Architecture'];

  const dirs: string[] = [];
  if (structure.hasSrc) dirs.push('`src/`');
  if (structure.hasApp) dirs.push('`app/`');
  if (structure.hasLib) dirs.push('`lib/`');
  if (structure.hasPackages) dirs.push('`packages/`');

  if (dirs.length > 0) {
    lines.push(`- Source: ${dirs.join(', ')}`);
  }

  if (structure.layout !== 'unknown') {
    lines.push(`- Layout: ${structure.layout}`);
  }

  if (structure.testDirs.length > 0) {
    lines.push(`- Tests: ${structure.testDirs.map(d => `\`${d}/\``).join(', ')}`);
  }

  if (structure.collocatedTests) {
    lines.push('- Tests colocated with source files');
  }

  if (structure.platformDirs.length > 0) {
    lines.push(`- Platform dirs: ${structure.platformDirs.map(d => `\`${d}/\``).join(', ')}`);
  }

  if (lines.length === 1) return '';
  return lines.join('\n');
}

function buildGitSection(context: ProjectContext): string {
  const git = context.gitConventions;
  if (!git) return '';

  const lines: string[] = ['## Git Conventions'];

  if (git.usesConventionalCommits) {
    lines.push('- Commits follow **Conventional Commits** format');
    lines.push('  - Format: `type(scope): description`');
    lines.push('  - Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`');
    if (git.usesScopes) lines.push('  - Scopes are used (e.g., `feat(auth):`)');
  }

  if (git.usesIssueRefs) {
    lines.push('- Issue references included in commits (e.g., `#123`)');
  }

  if (git.hasPRTemplate) {
    lines.push('- Pull request template exists at `.github/PULL_REQUEST_TEMPLATE.md`');
  }

  if (git.exampleCommits.length > 0 && git.usesConventionalCommits) {
    lines.push('');
    lines.push('### Example Commits');
    for (const commit of git.exampleCommits) {
      lines.push(`- \`${commit}\``);
    }
  }

  if (lines.length === 1) return '';
  return lines.join('\n');
}

function buildAndroidSection(context: ProjectContext): string {
  const android = context.android;
  if (!android) return '';

  const lines: string[] = ['## Android'];

  const sdkParts: string[] = [];
  if (android.compileSdk) sdkParts.push(`compileSdk ${android.compileSdk}`);
  if (android.targetSdk) sdkParts.push(`targetSdk ${android.targetSdk}`);
  if (android.minSdk) sdkParts.push(`minSdk ${android.minSdk}`);
  if (sdkParts.length > 0) lines.push(`- SDK: ${sdkParts.join(', ')}`);

  if (android.kotlinVersion) lines.push(`- Kotlin: ${android.kotlinVersion}`);
  if (android.agpVersion) lines.push(`- AGP: ${android.agpVersion}`);

  const ui = android.uiFramework === 'compose' ? 'Jetpack Compose' :
    android.uiFramework === 'xml' ? 'XML layouts' : 'Jetpack Compose + XML layouts';
  lines.push(`- UI: **${ui}**`);

  if (android.di) lines.push(`- DI: **${android.di}**`);
  if (android.database) lines.push(`- Database: **${android.database}**`);
  if (android.networking) lines.push(`- Networking: **${android.networking}**`);
  if (android.architecture) lines.push(`- Architecture: **${android.architecture.toUpperCase()}**`);

  if (android.modules.length > 0) {
    lines.push(`- Modules: ${android.modules.join(', ')}`);
  }

  if (android.uiFramework === 'compose' || android.uiFramework === 'both') {
    lines.push('');
    lines.push('### Compose Guidelines');
    lines.push('- Use `@Composable` functions for UI');
    lines.push('- Hoist state to the nearest common ancestor');
    lines.push('- Prefer `remember` + `mutableStateOf` for local UI state');
    if (android.di === 'hilt') lines.push('- Inject ViewModels via `hiltViewModel()`');
  }

  return lines.join('\n');
}

function buildIOSSection(context: ProjectContext): string {
  const ios = context.ios;
  if (!ios) return '';

  const lines: string[] = ['## iOS / Swift'];

  if (ios.swiftVersion) lines.push(`- Swift tools version: ${ios.swiftVersion}`);
  if (ios.deploymentTarget) lines.push(`- Deployment target: iOS ${ios.deploymentTarget}`);

  const ui = ios.uiFramework === 'swiftui' ? 'SwiftUI' :
    ios.uiFramework === 'uikit' ? 'UIKit' : 'SwiftUI + UIKit';
  lines.push(`- UI: **${ui}**`);

  if (ios.packageManager) {
    const pmNames: Record<string, string> = { spm: 'Swift Package Manager', cocoapods: 'CocoaPods', tuist: 'Tuist' };
    lines.push(`- Package manager: **${pmNames[ios.packageManager] ?? ios.packageManager}**`);
  }

  if (ios.persistence) lines.push(`- Persistence: **${ios.persistence}**`);
  if (ios.architecture) lines.push(`- Architecture: **${ios.architecture.toUpperCase()}**`);
  if (ios.hasFoundationModels) lines.push('- Uses **Foundation Models** (on-device AI)');
  if (ios.hasCoreML) lines.push('- Uses **Core ML**');

  if (ios.uiFramework === 'swiftui' || ios.uiFramework === 'both') {
    lines.push('');
    lines.push('### SwiftUI Guidelines');
    lines.push('- Use `@State` for local view state, `@StateObject` for owned ObservableObjects');
    lines.push('- Use `@EnvironmentObject` for dependency injection across the view hierarchy');
    lines.push('- Prefer `async`/`await` with `.task {}` modifier over Combine for async work');
  }

  return lines.join('\n');
}

export function formatClaude(context: ProjectContext): string {
  const sections = [
    buildHeader(context),
    buildStackSection(context),
    buildCommandsSection(context),
    buildCodeStyleSection(context),
    buildTypeScriptSection(context),
    buildTestingSection(context),
    buildArchitectureSection(context),
    buildAndroidSection(context),
    buildIOSSection(context),
    buildGitSection(context),
  ].filter(Boolean);

  return sections.join('\n\n');
}
