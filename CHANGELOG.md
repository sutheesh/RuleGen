# Changelog

All notable changes to RuleGen are documented here.

## [1.0.0] - 2024-04-19

### Added
- Core scanner engine with 11 detectors for the JS/TS ecosystem
- Detectors: language, framework, package-manager, linter, formatter, test-runner, build-tool, structure, typescript-config, monorepo, git-conventions, dependencies
- Formatters: CLAUDE.md (claude) and .cursorrules (cursor)
- CLI: `rulegen`, `rulegen --agent`, `rulegen --dry-run`, `rulegen --agent all`
- Auto-bootstrap via npm `postinstall` hook
- Git pre-commit hook auto-installation
- Incremental updates via SHA-256 content hashing
- Custom rules preservation via `<!-- rulegen:auto -->` markers
- Test fixtures: nextjs-app, react-vite, express-api, monorepo, empty
- 80%+ test coverage
- Zero runtime dependencies
