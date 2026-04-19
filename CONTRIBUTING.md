# Contributing to RuleGen

## Setup

```bash
git clone https://github.com/sutheesh/rulegen
cd rulegen
npm install
npm run build
npm test
```

## Adding a Detector

1. Create `src/detectors/your-detector.ts` exporting a `detectYourThing(rootDir: string)` function
2. Add it to `src/core/scanner.ts`
3. Add the result to `ProjectContext` in `src/types.ts`
4. Create `tests/detectors/your-detector.test.ts` with at least 3 cases: detected, not detected, edge case
5. Add a fixture under `tests/fixtures/` if the existing ones don't cover your case

## Adding a Formatter

1. Create `src/formatters/your-agent.ts` exporting `formatYourAgent(context: ProjectContext): string`
2. Register it in `src/index.ts`
3. Create `tests/formatters/your-agent.test.ts`

## Test Fixtures

Fixtures are minimal fake project directories. They contain only the config files a real project would have — no source code. Keep them small. Each fixture tests a distinct scenario.

## Code Style

- TypeScript strict mode
- No `any`
- No runtime dependencies — Node built-ins only
- Zero comments unless the why is non-obvious
- Run `npm run lint` and `npm run typecheck` before submitting

## Performance

The full scan must complete in under 2 seconds. Never parse ASTs. Read only config files and the first few lines of source files. Use synchronous `fs` operations.

## Testing

```bash
npm test              # Run all tests
npm run test:coverage # With coverage report
npm run test:watch    # Watch mode
```

Coverage target: 80%+ lines.

## Pull Requests

- One PR per feature/fix
- All tests must pass
- No new runtime dependencies
- Update CHANGELOG.md
