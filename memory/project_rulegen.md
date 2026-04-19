---
name: RuleGen project context
description: RuleGen Phase 1 implementation — zero-config AI rules file generator
type: project
---

RuleGen Phase 1 is fully implemented at `/Users/sutheeshsukumaran/Developer/Open_contri/RuleGen`.

**Why:** Auto-generate CLAUDE.md / .cursorrules / copilot-instructions.md from any codebase using only config file parsing — no AI, no network, < 2s.

**How to apply:** Next phases are mobile detectors (android.ts, ios.ts), platform wrappers (Swift SPM plugin, Gradle plugin), more formatters (copilot, windsurf, codex), and GitHub Actions CI.

**Phase 1 status (complete):**
- 12 detectors in `src/detectors/`
- 2 formatters: CLAUDE.md and .cursorrules
- CLI with `--agent`, `--dry-run`, `--postinstall`, `--hook` flags
- Git hook auto-installer
- 5 test fixtures: nextjs-app, react-vite, express-api, monorepo, empty
- 78 tests passing, TypeScript strict mode, zero runtime deps
- Builds to `dist/index.js` via tsup
