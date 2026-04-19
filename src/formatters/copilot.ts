import type { ProjectContext } from '../types.js';

// GitHub Copilot reads copilot-instructions.md from .github/
// Rules are written as markdown. Copilot injects them into every chat/completion
// in the repo. Keep rules imperative and specific — Copilot works best with
// concrete dos/don'ts rather than descriptive prose.

function buildStack(context: ProjectContext): string[] {
  const lines: string[] = [];

  const langs = context.languages.map(l => l.name);
  const fws = context.frameworks.map(f => f.name);

  if (langs.length > 0 || fws.length > 0) {
    const stack = [...fws.slice(0, 3), ...langs].slice(0, 4).join(', ');
    lines.push(`This is a **${stack}** project.`);
  }

  if (context.packageManager) {
    lines.push(`Package manager: **${context.packageManager}**. Always use it — never mix package managers.`);
  }

  if (context.monorepo) {
    lines.push(`Monorepo managed with **${context.monorepo.tool}**.`);
  }

  return lines;
}

function buildLanguageRules(context: ProjectContext): string[] {
  const lines: string[] = [];
  const langs = context.languages.map(l => l.name);
  const fws = context.frameworks.map(f => f.name);
  const ts = context.typescriptConfig;

  if (langs.includes('TypeScript')) {
    lines.push('Use TypeScript for all new files. Do not use `.js` files in the source tree.');
    if (ts?.strict) {
      lines.push('TypeScript strict mode is on. Never use `any`. Prefer `unknown` when the type is truly unknown.');
    }
    if (ts?.pathAliases && Object.keys(ts.pathAliases).length > 0) {
      const aliases = Object.keys(ts.pathAliases).join(', ');
      lines.push(`Use path aliases for imports: ${aliases}`);
    }
  }

  if (fws.includes('Next.js')) {
    lines.push("Next.js App Router: components are Server Components by default. Add `'use client'` only when you need browser APIs or React hooks.");
    lines.push('Fetch data in Server Components using `async/await`. Use `loading.tsx` and `error.tsx` for streaming UI.');
  }

  if (fws.includes('React') || fws.includes('Next.js') || fws.includes('Remix')) {
    lines.push('Use functional components. Never write class components.');
    lines.push('Prefer named exports for components.');
  }

  if (fws.includes('Express') || fws.includes('Fastify') || fws.includes('NestJS')) {
    lines.push('This is a Node.js server project. Prefer `async/await` over callbacks.');
  }

  if (context.android) {
    const a = context.android;
    if (a.uiFramework === 'compose' || a.uiFramework === 'both') {
      lines.push('Use Jetpack Compose for all new UI. Do not write new XML layouts.');
      lines.push('Follow unidirectional data flow: ViewModel holds state, Composables are stateless.');
    }
    if (a.di === 'hilt') lines.push('Use Hilt for dependency injection. Annotate ViewModels with `@HiltViewModel`.');
    if (a.database === 'room') lines.push('Use Room for local persistence. Define entities, DAOs, and the database class separately.');
  }

  if (context.ios) {
    const ios = context.ios;
    if (ios.uiFramework === 'swiftui' || ios.uiFramework === 'both') {
      lines.push('Use SwiftUI for all new views.');
      lines.push('Use `@State` for local state, `@StateObject` for owned view models, `@ObservedObject` for injected ones.');
      lines.push("Prefer `async`/`await` with `.task {}` modifier over Combine for async work.");
    }
    if (ios.architecture === 'tca') {
      lines.push('This project uses The Composable Architecture (TCA). Define `State`, `Action`, and `Reducer` for every feature.');
    }
  }

  return lines;
}

function buildCodeStyleRules(context: ProjectContext): string[] {
  const lines: string[] = [];
  const style = context.codeStyle;

  if (context.linter) {
    lines.push(`Follow **${context.linter.name}** rules (\`${context.linter.configFile}\`). Fix all linter errors before suggesting code.`);
  }

  if (context.formatter) {
    lines.push(`Code is formatted with **${context.formatter.name}**. Match its style exactly.`);
  }

  if (style.semicolons !== null) {
    lines.push(style.semicolons ? 'Always include semicolons.' : 'No semicolons.');
  }
  if (style.quotes !== null) {
    lines.push(`Use ${style.quotes} quotes.`);
  }
  if (style.trailingComma !== null) {
    lines.push(style.trailingComma ? 'Use trailing commas in multi-line expressions.' : 'No trailing commas.');
  }
  if (style.indentation) {
    lines.push(`Indent with ${style.indentation.size} ${style.indentation.style}.`);
  }
  if (style.maxLineLength) {
    lines.push(`Keep lines under ${style.maxLineLength} characters.`);
  }
  if (style.importOrder) {
    lines.push('Sort imports: Node built-ins → external packages → internal modules → relative imports.');
  }

  return lines;
}

function buildTestingRules(context: ProjectContext): string[] {
  const lines: string[] = [];
  if (!context.testRunner) return lines;

  lines.push(`Use **${context.testRunner.name}** for all tests. Do not introduce a second test framework.`);
  if (context.testRunner.command) {
    lines.push(`Run tests with: \`${context.testRunner.command}\``);
  }
  if (context.testLocation === 'colocated') {
    lines.push('Place test files next to the source files they test.');
  } else if (context.testLocation) {
    lines.push(`Tests live in \`${context.testLocation}\`.`);
  }
  if (context.testPattern) {
    lines.push(`Test file pattern: \`${context.testPattern}\``);
  }

  return lines;
}

function buildCommandRules(context: ProjectContext): string[] {
  const keyNames = ['dev', 'build', 'test', 'lint', 'typecheck', 'type-check', 'check', 'format'];
  const key = context.commands.filter(c => keyNames.includes(c.name));
  if (key.length === 0) return [];

  return [
    'Key commands:',
    ...key.map(c => `- \`${c.command}\``),
  ];
}

function buildDependencyRules(context: ProjectContext): string[] {
  const lines: string[] = [];

  const networking = context.keyDependencies.filter(d => d.category === 'networking');
  const state = context.keyDependencies.filter(d => d.category === 'state');
  const orm = context.keyDependencies.filter(d => d.category === 'orm');
  const auth = context.keyDependencies.filter(d => d.category === 'auth');

  if (networking.length > 0) lines.push(`Use **${networking.map(d => d.name).join(' / ')}** for data fetching. Do not use \`fetch\` directly in components.`);
  if (state.length > 0) lines.push(`State management: **${state.map(d => d.name).join(', ')}**. Do not introduce additional state libraries.`);
  if (orm.length > 0) lines.push(`Database access via **${orm.map(d => d.name).join(', ')}**. Do not write raw SQL unless necessary.`);
  if (auth.length > 0) lines.push(`Authentication via **${auth.map(d => d.name).join(', ')}**. Do not roll custom auth.`);

  return lines;
}

function buildGitRules(context: ProjectContext): string[] {
  if (!context.gitConventions?.usesConventionalCommits) return [];
  return [
    'Commit messages must follow Conventional Commits: `type(scope): description`',
    'Types: `feat` · `fix` · `docs` · `chore` · `refactor` · `test` · `perf`',
  ];
}

export function formatCopilot(context: ProjectContext): string {
  const sections: Array<{ heading: string; rules: string[] }> = [
    { heading: 'Project', rules: buildStack(context) },
    { heading: 'Language & Framework', rules: buildLanguageRules(context) },
    { heading: 'Code Style', rules: buildCodeStyleRules(context) },
    { heading: 'Testing', rules: buildTestingRules(context) },
    { heading: 'Commands', rules: buildCommandRules(context) },
    { heading: 'Libraries', rules: buildDependencyRules(context) },
    { heading: 'Git', rules: buildGitRules(context) },
  ].filter(s => s.rules.length > 0);

  const lines: string[] = [];
  for (const section of sections) {
    lines.push(`## ${section.heading}`);
    lines.push('');
    for (const rule of section.rules) {
      const isBullet = !rule.startsWith('-') && !rule.endsWith(':');
      lines.push(isBullet ? `- ${rule}` : rule);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
