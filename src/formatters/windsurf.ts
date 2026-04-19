import type { ProjectContext } from '../types.js';

// Windsurf reads .windsurfrules as plain text injected into every AI request.
// Hard limit: 6000 characters. Rules are applied in order — put the most
// important ones first. Be concise: one rule per line, no markdown headers.

const MAX_CHARS = 6000;

function rule(text: string): string {
  return text;
}

function buildRules(context: ProjectContext): string[] {
  const rules: string[] = [];
  const langs = context.languages.map(l => l.name);
  const fws = context.frameworks.map(f => f.name);
  const ts = context.typescriptConfig;

  // Stack identity — first so Windsurf always has context
  const stackParts = [...fws.slice(0, 2), ...langs.slice(0, 1)].join(', ');
  if (stackParts) rules.push(rule(`This is a ${stackParts} project.`));

  if (context.packageManager) {
    rules.push(rule(`Use ${context.packageManager} as the package manager. Never use npm/yarn/pnpm interchangeably.`));
  }

  // TypeScript
  if (langs.includes('TypeScript')) {
    rules.push(rule('Use TypeScript for all new files.'));
    if (ts?.strict) rules.push(rule('Never use `any`. Use `unknown` for unknown types, then narrow.'));
    if (ts?.pathAliases && Object.keys(ts.pathAliases).length > 0) {
      rules.push(rule(`Use path aliases: ${Object.keys(ts.pathAliases).join(', ')}`));
    }
  }

  // Framework-specific
  if (fws.includes('Next.js')) {
    rules.push(rule("Server Components by default. Add 'use client' only for browser APIs or hooks."));
    rules.push(rule('Fetch data in Server Components. Use loading.tsx and error.tsx for streaming.'));
  }
  if (fws.includes('React') || fws.includes('Next.js') || fws.includes('Remix')) {
    rules.push(rule('Use functional components only. No class components.'));
    rules.push(rule('Prefer named exports for components.'));
  }
  if (fws.includes('Express') || fws.includes('Fastify') || fws.includes('NestJS')) {
    rules.push(rule('Use async/await throughout. No callbacks.'));
  }

  // Android
  if (context.android) {
    const a = context.android;
    if (a.uiFramework === 'compose' || a.uiFramework === 'both') {
      rules.push(rule('Use Jetpack Compose for all new UI. No new XML layouts.'));
      rules.push(rule('Hoist state to ViewModels. Composables must be stateless.'));
    }
    if (a.di === 'hilt') rules.push(rule('Use Hilt for DI. Annotate ViewModels with @HiltViewModel.'));
    if (a.architecture) rules.push(rule(`Architecture: ${a.architecture.toUpperCase()}. Keep layers separate.`));
  }

  // iOS
  if (context.ios) {
    const ios = context.ios;
    if (ios.uiFramework === 'swiftui' || ios.uiFramework === 'both') {
      rules.push(rule('Use SwiftUI for all new views.'));
      rules.push(rule('Use @State for local state, @StateObject for owned models, @ObservedObject for injected.'));
      rules.push(rule('Use async/await with .task {} modifier instead of Combine.'));
    }
    if (ios.architecture === 'tca') {
      rules.push(rule('TCA architecture: define State, Action, and Reducer for every feature.'));
    }
  }

  // Code style
  if (context.linter) {
    rules.push(rule(`Fix all ${context.linter.name} errors before suggesting code.`));
  }
  if (context.formatter) {
    rules.push(rule(`Format with ${context.formatter.name}. Match its style exactly.`));
  }
  const style = context.codeStyle;
  if (style.semicolons !== null) rules.push(rule(style.semicolons ? 'Always include semicolons.' : 'No semicolons.'));
  if (style.quotes !== null) rules.push(rule(`Use ${style.quotes} quotes.`));
  if (style.trailingComma !== null) rules.push(rule(style.trailingComma ? 'Trailing commas in multi-line expressions.' : 'No trailing commas.'));
  if (style.maxLineLength) rules.push(rule(`Max line length: ${style.maxLineLength} characters.`));
  if (style.importOrder) rules.push(rule('Sort imports: built-ins → external → internal → relative.'));

  // Testing
  if (context.testRunner) {
    rules.push(rule(`Use ${context.testRunner.name} for all tests.`));
    if (context.testRunner.command) rules.push(rule(`Run tests: ${context.testRunner.command}`));
    if (context.testLocation === 'colocated') rules.push(rule('Place test files next to source files.'));
    else if (context.testLocation) rules.push(rule(`Tests in ${context.testLocation}`));
  }

  // Key commands
  const keyCommands = context.commands.filter(c =>
    ['dev', 'build', 'test', 'lint', 'typecheck'].includes(c.name)
  );
  for (const cmd of keyCommands.slice(0, 5)) {
    rules.push(rule(`${cmd.name}: \`${cmd.command}\``));
  }

  // Dependencies
  const networking = context.keyDependencies.find(d => d.category === 'networking');
  const state = context.keyDependencies.find(d => d.category === 'state');
  const orm = context.keyDependencies.find(d => d.category === 'orm');
  if (networking) rules.push(rule(`Use ${networking.name} for data fetching.`));
  if (state) rules.push(rule(`State management: ${state.name}.`));
  if (orm) rules.push(rule(`Database: ${orm.name}.`));

  // Git
  if (context.gitConventions?.usesConventionalCommits) {
    rules.push(rule('Commits: type(scope): description — feat/fix/docs/chore/refactor/test/perf'));
  }

  return rules;
}

export function formatWindsurf(context: ProjectContext): string {
  const rules = buildRules(context);
  const output = rules.join('\n');

  // Enforce 6000 char limit — truncate at last complete line within budget
  if (output.length <= MAX_CHARS) return output;

  const truncated = output.slice(0, MAX_CHARS);
  const lastNewline = truncated.lastIndexOf('\n');
  return truncated.slice(0, lastNewline);
}
