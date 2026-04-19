# RuleGen

**Auto-generate AI coding rules from your codebase. Like SwiftLint for AI agents.**

[![npm version](https://img.shields.io/npm/v/rulegen.svg)](https://www.npmjs.com/package/rulegen)
[![CI](https://github.com/sutheesh/rulegen/actions/workflows/ci.yml/badge.svg)](https://github.com/sutheesh/rulegen/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/rulegen.svg)](https://www.npmjs.com/package/rulegen)

RuleGen scans your project's existing config files and writes a rules file for your AI coding agent — `CLAUDE.md`, `.cursorrules`, `copilot-instructions.md`, and more. **No init command. No config. No interaction.** Add it as a dependency and the rules file appears on the next build or commit, exactly the way SwiftLint works.

```
Day 1:  Add rulegen to your project
           ↓
        First build / commit / install
           ↓
        CLAUDE.md appears in your repo  ← this just happens
           ↓
Day 2+: Every build keeps it up to date
           ↓
        You never think about it again
```

---

## Table of Contents

- [JavaScript / TypeScript (npm)](#javascript--typescript)
- [iOS / Swift (Swift Package Manager)](#ios--swift-spm)
- [Android / Kotlin (Gradle)](#android--kotlin-gradle)
- [Python (pip)](#python-pip)
- [Any Project (Homebrew)](#any-project-homebrew)
- [What It Detects](#what-it-detects)
- [Supported AI Agents](#supported-ai-agents)
- [Example Outputs](#example-outputs)
- [Configuration](#configuration)
- [CLI Reference](#cli-reference)
- [CI Integration](#ci-integration)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## JavaScript / TypeScript

Works with npm, yarn, pnpm, and bun. Generates `CLAUDE.md` on `npm install` and keeps it updated on every `git commit` via a pre-commit hook.

### Install

```bash
npm install -D rulegen
# or
yarn add -D rulegen
# or
pnpm add -D rulegen
# or
bun add -d rulegen
```

That's it. After install completes, `CLAUDE.md` is already in your project root.

### What happens automatically

```
npm install -D rulegen
    ↓
postinstall script runs
    ↓
RuleGen scans your project (< 2 seconds)
    ↓  reads: package.json, tsconfig.json, .eslintrc.*, .prettierrc.*,
    ↓         vitest.config.ts, turbo.json, pnpm-workspace.yaml, ...
    ↓
CLAUDE.md written to your project root
Git pre-commit hook installed (.git/hooks/pre-commit)
    ↓
Every subsequent git commit:
  - Re-scans if config files changed
  - Updates CLAUDE.md if needed
  - Stages the updated file automatically
  - Never blocks the commit (always exits 0)
```

### Example: Next.js project

After `npm install -D rulegen` in a Next.js + Prisma + Vitest project:

```markdown
# my-app — TypeScript + Next.js

## Stack
- **TypeScript**
- **Next.js** 14.2.0
- **React** 18.3.0
- Package manager: **pnpm**

### Key Dependencies
- **Orm**: Prisma
- **Auth**: NextAuth
- **State**: Zustand
- **Ui**: Tailwind CSS

## Commands
- `pnpm dev` — dev
- `pnpm build` — build
- `pnpm test` — test
- `pnpm lint` — lint
- `pnpm typecheck` — typecheck

## Code Style
- Linter: **ESLint** (`.eslintrc.json`)
- Formatter: **Prettier** (`.prettierrc.json`)
- Semicolons: required
- Quotes: single
- Max line length: 100
- Import order: enforced
- Avoid `any` types (TypeScript strict)

## TypeScript
- Strict mode: **enabled**
- Target: `ES2017`
- Path aliases:
  - `@/*` → `./src/*`
  - `@/components/*` → `./src/components/*`

## Testing
- Runner: **Vitest**
- Command: `vitest`
- Pattern: `**/*.{test,spec}.{ts,tsx,js,jsx}`

## Architecture
- Source: `src/`, `app/`
- Layout: layer-based
```

### Run manually

```bash
npx rulegen                  # Regenerate CLAUDE.md
npx rulegen --agent cursor   # Generate .cursorrules instead
npx rulegen --agent all      # Generate all formats
npx rulegen --dry-run        # Preview without writing
```

### Monorepo support

Works out of the box with Turborepo, Nx, pnpm workspaces. Run from the monorepo root — RuleGen detects the workspace structure and includes it in the rules.

```bash
# In a Turborepo project:
pnpm add -D rulegen  # install at root
# CLAUDE.md is generated for the monorepo root
# Each workspace package can also have rulegen installed separately
```

---

## iOS / Swift (SPM)

Works exactly like SwiftLint. Add it to `Package.swift` once — every `swift build` auto-generates `CLAUDE.md`. No init, no config, no Node.js required on your machine. The plugin downloads and caches a pre-built standalone binary.

### Install

**Step 1** — Add the package dependency to your `Package.swift`:

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [
        .iOS(.v17),
    ],
    dependencies: [
        // Add this line:
        .package(url: "https://github.com/sutheesh/rulegen-swift", from: "1.0.0"),
    ],
    targets: [
        .target(
            name: "MyApp",
            dependencies: [...],
            // Add this:
            plugins: [
                .plugin(name: "RuleGenPlugin", package: "rulegen-swift"),
            ]
        ),
    ]
)
```

**Step 2** — Build:

```bash
swift build
```

`CLAUDE.md` appears in your package root. Every `swift build` after that keeps it current.

### Xcode project (without Package.swift)

If your project uses `.xcodeproj` without SPM, add via Xcode:

1. **File → Add Package Dependencies**
2. Enter: `https://github.com/sutheesh/rulegen-swift`
3. Select **RuleGenPlugin** and add it to your app target
4. Build → `CLAUDE.md` appears next to your `.xcodeproj`

### What happens on every swift build

```
swift build
    ↓
SPM resolves dependencies (first time: downloads rulegen-cli binary, ~5 MB)
    ↓
RuleGenPlugin.swift runs as a .prebuildCommand
    ↓  reads: Package.swift, .swiftlint.yml, Sources/**/*.swift (imports only)
    ↓
CLAUDE.md written to your package root
```

The binary is a standalone macOS executable — no Node.js, no npm, no runtime needed. It supports both Apple Silicon (arm64) and Intel (x86_64) via a fat binary.

### Example: SwiftUI + TCA project

```markdown
# MyApp — Swift + SwiftUI

## Stack
- **Swift** 5.9
- **SwiftUI**
- Package manager: **Swift Package Manager**

## iOS / Swift
- Swift tools version: 5.9
- Deployment target: iOS 17
- UI: **SwiftUI**
- Package manager: **Swift Package Manager**
- Persistence: **swiftdata**
- Architecture: **TCA**

### SwiftUI Guidelines
- Use `@State` for local view state, `@StateObject` for owned ObservableObjects
- Use `@EnvironmentObject` for dependency injection across the view hierarchy
- Prefer `async`/`await` with `.task {}` modifier over Combine for async work

## Code Style
- Linter: **SwiftLint** (`.swiftlint.yml`)
- Import order: enforced
- Max line length: 120

## Testing
- Runner: **Swift Testing**
- Command: `swift test`
```

### Generate other formats

```bash
# After first build, the binary is cached at:
# .build/artifacts/rulegen-swift/rulegen-cli/rulegen-cli

.build/artifacts/rulegen-swift/rulegen-cli/rulegen-cli --agent cursor
# → .cursorrules

.build/artifacts/rulegen-swift/rulegen-cli/rulegen-cli --agent all
# → all formats
```

### Requirements

- Swift 5.9+ (Xcode 15 or later)
- macOS 13+ (Ventura or later)
- Works on Apple Silicon and Intel

---

## Android / Kotlin (Gradle)

Works as a Gradle plugin. Adds a `ruleGen` task that runs before every `./gradlew build`. Zero config — one line in `build.gradle.kts`.

### Install

**Step 1** — Add to your **root** `build.gradle.kts`:

```kotlin
plugins {
    // Your existing plugins:
    id("com.android.application") version "8.3.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false

    // Add this:
    id("io.github.sutheesh.rulegen") version "1.0.0" apply false
}
```

**Step 2** — Apply to your **app** module's `build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")

    // Add this:
    id("io.github.sutheesh.rulegen")
}
```

**Step 3** — Build:

```bash
./gradlew build
```

`CLAUDE.md` appears in your project root. Every build keeps it current.

### Alternatively — root-only apply

If you want `CLAUDE.md` generated for the whole project without touching app modules:

```kotlin
// root build.gradle.kts
plugins {
    id("io.github.sutheesh.rulegen") version "1.0.0"
}
```

### What happens on every ./gradlew build

```
./gradlew build
    ↓
ruleGen task runs (registered by plugin, wired into preBuild)
    ↓
Binary resolution (in order):
  1. .gradle/rulegen/rulegen  (cached binary — instant)
  2. npx rulegen             (if Node.js is installed)
  3. Download from GitHub releases → cache in .gradle/rulegen/
    ↓  reads: build.gradle.kts, settings.gradle.kts, detekt.yml,
    ↓         .editorconfig, gradle.properties, libs.versions.toml
    ↓
CLAUDE.md written to project root
Incremental: skips re-run if none of the config files changed
```

### Example: Android Compose + Hilt + Room

```markdown
# MyComposeApp — Kotlin + Jetpack Compose

## Stack
- **Kotlin**
- **Jetpack Compose**
- Package manager: **gradle**

## Commands
- `./gradlew build` — build
- `./gradlew test` — test
- `./gradlew assembleDebug` — assemble
- `./gradlew lint` — lint

## Android
- SDK: compileSdk 34, targetSdk 34, minSdk 26
- UI: **Jetpack Compose**
- DI: **hilt**
- Database: **room**
- Networking: **retrofit**
- Architecture: **MVVM**
- Modules: :app, :core:ui, :core:network, :feature:home, :feature:profile

### Compose Guidelines
- Use `@Composable` functions for UI
- Hoist state to the nearest common ancestor
- Prefer `remember` + `mutableStateOf` for local UI state
- Inject ViewModels via `hiltViewModel()`

## Testing
- Runner: **JUnit**
- Command: `./gradlew test`
```

### Run manually

```bash
./gradlew ruleGen            # Run RuleGen only
./gradlew ruleGen --info     # See what was detected
```

### Requirements

- Gradle 8.0+
- JVM 17+
- No Node.js required (binary auto-downloaded if npx not available)

---

## Python (pip)

Generates `CLAUDE.md` when installed as a dev dependency. Works with pre-commit hooks for automatic updates on every commit.

### Install

```bash
pip install rulegen --dev
# or with uv:
uv add --dev rulegen
# or in pyproject.toml:
```

```toml
# pyproject.toml
[project.optional-dependencies]
dev = ["rulegen"]
```

Then run once to generate:

```bash
rulegen
# → CLAUDE.md appears
```

### Pre-commit hook (automatic updates)

Add to `.pre-commit-config.yaml` for automatic updates on every commit:

```yaml
repos:
  - repo: https://github.com/sutheesh/rulegen
    rev: v1.0.0
    hooks:
      - id: rulegen
```

```bash
pre-commit install   # install the hook
```

Now every `git commit` auto-updates `CLAUDE.md`.

### Example: FastAPI + pytest project

```markdown
# my-api — Python + FastAPI

## Stack
- **Python** ≥3.11
- **FastAPI**
- Package manager: **pip**

## Commands
- `pytest` — test
- `ruff check .` — lint
- `black .` — format

## Code Style
- Linter: **Ruff** (`pyproject.toml`)
- Formatter: **Black** (`pyproject.toml`)
- Max line length: 88
- Import order: enforced (isort)

## Testing
- Runner: **pytest**
- Command: `pytest`
- Pattern: `test_*.py | *_test.py`
```

### Requirements

- Python 3.9+
- The pip package bundles the standalone binary — no Node.js required

---

## Any Project (Homebrew)

Install globally on macOS. Works in any repo regardless of language.

### Install

```bash
brew install sutheesh/tap/rulegen
```

### Generate rules in any repo

```bash
cd my-project
rulegen          # → CLAUDE.md
rulegen --agent cursor   # → .cursorrules
rulegen --agent all      # → all formats
```

### Install git hook globally

```bash
# Auto-update rules on every commit in every repo:
rulegen --install-hook --global
```

Or per-repo:

```bash
cd my-project
rulegen --install-hook
```

### Update

```bash
brew upgrade sutheesh/tap/rulegen
```

---

## What It Detects

RuleGen reads your existing config files — no source code parsing, no AI calls, no network. Everything runs offline in under 2 seconds.

### JavaScript / TypeScript

| Category | Config Files Read |
|----------|------------------|
| Language | `tsconfig.json`, `package.json` |
| Framework | `package.json` deps → Next.js, React, Vue, Svelte, Angular, Nuxt, Remix, Astro, Express, Fastify, NestJS, Hono |
| Package manager | `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb` |
| Linter | `.eslintrc.json`, `.eslintrc.js`, `eslint.config.*`, `biome.json` |
| Formatter | `.prettierrc.*`, `prettier.config.*`, `biome.json`, `.editorconfig` |
| Test runner | `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `cypress.config.*` |
| TypeScript | `tsconfig.json` — strict, noImplicitAny, paths, target, moduleResolution |
| Monorepo | `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, `lerna.json`, workspaces in `package.json` |
| Build scripts | All scripts from `package.json`, `Makefile`, `justfile`, `Taskfile.yml` |
| Key deps | Prisma, Drizzle, Mongoose · NextAuth, Clerk, Supabase · Zustand, Redux, Jotai · shadcn/ui, MUI, Tailwind · Tanstack Query, SWR, tRPC, Axios |
| Git | Last 20 commits → Conventional Commits, issue refs, scopes |

### Android / Kotlin

| Category | Config Files Read |
|----------|------------------|
| SDK versions | `app/build.gradle.kts` → `compileSdk`, `targetSdk`, `minSdk` |
| Kotlin version | `build.gradle.kts` → `kotlin_version`, `kotlinOptions.jvmTarget` |
| AGP version | `build.gradle.kts` → `com.android.tools.build:gradle` |
| UI framework | `dependencies` block → `compose-bom` / `compose.ui` = Compose; `res/layout/*.xml` = XML |
| DI | `hilt-android` → Hilt; `dagger` → Dagger; `koin` → Koin |
| Database | `room-runtime` → Room; `sqldelight` → SQLDelight; `realm` → Realm |
| Networking | `retrofit` → Retrofit; `ktor-client` → Ktor |
| Architecture | Scans `.kt` files for `ViewModel`, `UseCase`, `Repository` patterns |
| Modules | `settings.gradle.kts` → all `include(":module")` declarations |

### iOS / Swift

| Category | Config Files Read |
|----------|------------------|
| Swift version | `Package.swift` → `swift-tools-version` |
| Deployment target | `Package.swift` `.iOS(.v17)` or `project.pbxproj` |
| Package manager | `Package.swift` → SPM; `Podfile` → CocoaPods; `Tuist/` → Tuist |
| UI framework | Scans first 50 `.swift` files for `import SwiftUI` / `import UIKit` |
| Persistence | `import SwiftData` → SwiftData; `import CoreData` → Core Data |
| Architecture | `Package.swift` deps → TCA (ComposableArchitecture); scans for `ViewModel`, `UseCase` |
| AI features | `import FoundationModels`, `import CoreML` |
| Linter | `.swiftlint.yml` — line length, sorted imports, disabled rules |

### Other Languages

| Language | Config Files |
|----------|-------------|
| **Python** | `pyproject.toml`, `requirements.txt`, `setup.py` → framework (FastAPI/Django/Flask), linter (Ruff/Flake8), formatter (Black) |
| **Rust** | `Cargo.toml` → edition, features; `rustfmt.toml` |
| **Go** | `go.mod` → version; `.golangci.yml` |
| **Ruby** | `Gemfile`; `.rubocop.yml` |

---

## Supported AI Agents

| Agent | Output File | Format |
|-------|-------------|--------|
| **Claude** (default) | `CLAUDE.md` | Structured markdown with sections |
| **Cursor** | `.cursorrules` | Plain text instructions |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Markdown |
| **Windsurf** | `.windsurfrules` | Plain text |
| **Codex** | `AGENTS.md` | Markdown |

Generate for a specific agent or all at once:

```bash
npx rulegen                   # CLAUDE.md (default)
npx rulegen --agent cursor    # .cursorrules
npx rulegen --agent copilot   # .github/copilot-instructions.md
npx rulegen --agent windsurf  # .windsurfrules
npx rulegen --agent codex     # AGENTS.md
npx rulegen --agent all       # all of the above
```

---

## Example Outputs

### Next.js + TypeScript + Prisma

<details>
<summary>CLAUDE.md</summary>

```markdown
# my-nextjs-app — TypeScript + Next.js

## Stack
- **TypeScript**
- **Next.js** 14.2.0
- **React** 18.3.0
- Package manager: **pnpm**

### Key Dependencies
- **Orm**: Prisma
- **Auth**: NextAuth
- **State**: Zustand
- **Ui**: Tailwind CSS

## Commands
- `pnpm dev` — dev
- `pnpm build` — build
- `pnpm test` — test
- `pnpm lint` — lint
- `pnpm typecheck` — typecheck

## Code Style
- Linter: **ESLint** (`.eslintrc.json`)
- Formatter: **Prettier** (`.prettierrc.json`)
- Indentation: 2 spaces
- Semicolons: required
- Quotes: single
- Trailing comma: yes
- Max line length: 100
- Import order: enforced
- Avoid `any` types (TypeScript strict)

## TypeScript
- Strict mode: **enabled**
- No implicit any
- Strict null checks
- Target: `ES2017`
- Module resolution: `bundler`
- Path aliases:
  - `@/*` → `./src/*`

## Testing
- Runner: **Vitest**
- Command: `vitest`
- Pattern: `**/*.{test,spec}.{ts,tsx,js,jsx}`

## Architecture
- Source: `src/`, `app/`
- Layout: layer-based

## Git Conventions
- Commits follow **Conventional Commits** format
  - Format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`
```

</details>

### Android Compose + Hilt + Room

<details>
<summary>CLAUDE.md</summary>

```markdown
# MyComposeApp — Kotlin + Jetpack Compose

## Stack
- **Kotlin**
- **Jetpack Compose**
- Package manager: **gradle**

## Commands
- `./gradlew build` — build
- `./gradlew test` — test
- `./gradlew assembleDebug` — assemble
- `./gradlew lint` — lint

## Android
- SDK: compileSdk 34, targetSdk 34, minSdk 26
- UI: **Jetpack Compose**
- DI: **hilt**
- Database: **room**
- Networking: **retrofit**
- Architecture: **MVVM**
- Modules: :app, :core:ui, :core:network, :feature:home, :feature:profile

### Compose Guidelines
- Use `@Composable` functions for UI
- Hoist state to the nearest common ancestor
- Prefer `remember` + `mutableStateOf` for local UI state
- Inject ViewModels via `hiltViewModel()`

## Testing
- Runner: **JUnit**
- Command: `./gradlew test`
```

</details>

### iOS SwiftUI + TCA + SwiftData

<details>
<summary>CLAUDE.md</summary>

```markdown
# MySwiftUIApp — Swift + SwiftUI

## Stack
- **Swift** 5.9
- **SwiftUI**
- Package manager: **Swift Package Manager**

## iOS / Swift
- Swift tools version: 5.9
- Deployment target: iOS 17
- UI: **SwiftUI**
- Package manager: **Swift Package Manager**
- Persistence: **swiftdata**
- Architecture: **TCA**

### SwiftUI Guidelines
- Use `@State` for local view state, `@StateObject` for owned ObservableObjects
- Use `@EnvironmentObject` for dependency injection across the view hierarchy
- Prefer `async`/`await` with `.task {}` modifier over Combine for async work

## Code Style
- Linter: **SwiftLint** (`.swiftlint.yml`)
- Import order: enforced
- Max line length: 120

## Testing
- Runner: **Swift Testing**
- Command: `swift test`
- Pattern: `**/*Tests.swift`
```

</details>

---

## Configuration

RuleGen is zero-config. If you want to customize, create `.rulegenrc.json`:

```json
{
  "agents": ["claude", "cursor"],
  "hook": "pre-commit",
  "exclude": ["vendor/", "generated/", "*.pb.swift"],
  "custom": {
    "Security": "Never log sensitive data. Use environment variables for all secrets. Never commit .env files.",
    "API Conventions": "All REST routes use kebab-case. Responses follow JSON:API spec v1.1.",
    "Error Handling": "All async functions must have try/catch. Log errors to Sentry, not console."
  }
}
```

**`agents`** — which rule files to generate (default: `["claude"]`)

**`hook`** — git hook type: `"pre-commit"` (default), `"pre-push"`, or `"none"`

**`exclude`** — paths to skip during scanning

**`custom`** — your own rules, written as section heading → description. These are preserved in a separate `<!-- rulegen:custom -->` block that RuleGen never overwrites when it regenerates.

---

## Custom Rules Are Preserved

RuleGen wraps auto-generated content in markers:

```markdown
<!-- rulegen:auto -->
# MyApp — TypeScript + Next.js
...auto-generated content...
<!-- rulegen:end -->

<!-- rulegen:custom -->
## Our Team Conventions
- Always use feature flags for new API endpoints
- PRs require two approvals before merge
```

When RuleGen regenerates, it only replaces everything between `<!-- rulegen:auto -->` and `<!-- rulegen:end -->`. Your custom section stays untouched.

---

## CLI Reference

```
Usage: rulegen [options]

Options:
  --agent <name>    Which agent to generate for:
                      claude     → CLAUDE.md (default)
                      cursor     → .cursorrules
                      copilot    → .github/copilot-instructions.md
                      windsurf   → .windsurfrules
                      codex      → AGENTS.md
                      all        → all of the above

  --dry-run         Print what would be generated without writing files
  --silent          Suppress all stdout output
  --output <dir>    Write files to this directory instead of cwd
  --version         Print version and exit
  --help            Show this help
```

---

## CI Integration

Verify rules are kept up to date in CI:

```yaml
# .github/workflows/rulegen.yml
name: RuleGen Check

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate rules
        run: npx rulegen --silent

      - name: Verify rules are committed
        run: |
          if ! git diff --exit-code CLAUDE.md; then
            echo "CLAUDE.md is out of date. Run 'npx rulegen' and commit the result."
            exit 1
          fi
```

---

## Architecture

```
Your project files (config only — no source ASTs)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Detectors  (src/detectors/)                        │
│                                                     │
│  language.ts        → TypeScript, Swift, Kotlin...  │
│  framework.ts       → Next.js, SwiftUI, Compose...  │
│  package-manager.ts → pnpm, yarn, bun, gradle...    │
│  linter.ts          → ESLint, SwiftLint, Ruff...    │
│  formatter.ts       → Prettier, Black, Biome...     │
│  test-runner.ts     → Vitest, Jest, pytest, XCTest  │
│  typescript-config  → strict, paths, target...      │
│  monorepo.ts        → Turborepo, Nx, pnpm-ws...     │
│  android.ts         → SDK, Compose, Hilt, Room...   │
│  ios.ts             → SwiftUI, TCA, SwiftData...    │
│  cross-platform.ts  → React Native, Flutter, KMP    │
│  git-conventions.ts → Conventional Commits...       │
└───────────────────────┬─────────────────────────────┘
                        │  ProjectContext
                        ▼
┌─────────────────────────────────────────────────────┐
│  Scanner  (src/core/scanner.ts)                     │
│  Orchestrates all detectors                         │
│  SHA-256 hashes context → skip if unchanged         │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Formatters  (src/formatters/)                      │
│                                                     │
│  claude.ts   → CLAUDE.md                            │
│  cursor.ts   → .cursorrules                         │
│  copilot.ts  → copilot-instructions.md              │
│  windsurf.ts → .windsurfrules                       │
│  codex.ts    → AGENTS.md                            │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
                  Output file(s)
                  written to project root
```

**Key constraints:**
- **< 2 seconds** — reads config files only, never parses source ASTs
- **Zero network calls** — runs fully offline
- **No AI / LLM** — deterministic, reproducible output
- **Zero runtime dependencies** — Node built-ins only
- **Idempotent** — same project always produces same output

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

To add a new detector:

```bash
# 1. Create the detector
touch src/detectors/my-detector.ts

# 2. Wire it into the scanner
# Edit src/core/scanner.ts

# 3. Add a fixture
mkdir tests/fixtures/my-scenario

# 4. Write tests (minimum 3 cases: detected / not detected / edge case)
touch tests/detectors/my-detector.test.ts

# 5. Run
npm test
```

---

## License

MIT — see [LICENSE](LICENSE).
