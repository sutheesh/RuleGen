# RuleGen Gradle Plugin

Auto-generates AI coding rules (CLAUDE.md) on every `./gradlew build`. Works like lint — zero config, runs automatically.

## Installation

In your root `build.gradle.kts`:

```kotlin
plugins {
    id("io.github.sutheesh.rulegen") version "1.0.0"
}
```

That's it. Run `./gradlew build` and `CLAUDE.md` appears in your project root.

## How it works

1. Plugin registers a `ruleGen` task
2. `preBuild` depends on `ruleGen` — runs automatically before every build
3. Binary resolution priority:
   - Cached binary in `.gradle/rulegen/` (fastest)
   - `npx rulegen` if Node.js is installed
   - Downloads binary from GitHub releases and caches it
4. Incremental — only re-runs when `build.gradle.kts`, `detekt.yml`, `.editorconfig`, etc. change

## What it generates for Android + Compose

```markdown
# MyApp — Kotlin + Jetpack Compose

## Stack
- **Kotlin**
- **Jetpack Compose**
- Package manager: **gradle**

## Android
- SDK: compileSdk 34, targetSdk 34, minSdk 26
- UI: **Jetpack Compose**
- DI: **hilt**
- Database: **room**
- Networking: **retrofit**
- Architecture: **MVVM**
- Modules: :app, :core:ui, :core:network, :feature:home

### Compose Guidelines
- Use `@Composable` functions for UI
- Hoist state to the nearest common ancestor
- Inject ViewModels via `hiltViewModel()`

## Testing
- Runner: **JUnit**
- Command: `./gradlew test`
```

## Run manually

```bash
./gradlew ruleGen          # Generate CLAUDE.md
./gradlew ruleGen --info   # See what was detected
```

## Requirements

- Gradle 8.0+
- JVM 17+
