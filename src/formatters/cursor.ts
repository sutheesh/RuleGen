import type { ProjectContext } from '../types.js';

function buildLanguageRules(context: ProjectContext): string[] {
  const rules: string[] = [];

  const langs = context.languages.map(l => l.name);
  const fws = context.frameworks.map(f => f.name);

  if (langs.includes('TypeScript') || langs.includes('JavaScript')) {
    rules.push('Use TypeScript for all new files.');

    const ts = context.typescriptConfig;
    if (ts?.strict) {
      rules.push('TypeScript strict mode is enabled. Never use `any` type. Use proper type annotations.');
    }
    if (ts?.pathAliases && Object.keys(ts.pathAliases).length > 0) {
      const aliases = Object.keys(ts.pathAliases).join(', ');
      rules.push(`Use TypeScript path aliases for imports: ${aliases}`);
    }
  }

  if (fws.includes('React') || fws.includes('Next.js') || fws.includes('Remix')) {
    rules.push('Use functional components and React hooks. Avoid class components.');
    rules.push('Prefer named exports over default exports for components.');
  }

  if (fws.includes('Next.js')) {
    rules.push("Use Next.js App Router conventions. Server components by default, add 'use client' only when needed.");
  }

  return rules;
}

function buildStyleRules(context: ProjectContext): string[] {
  const rules: string[] = [];
  const style = context.codeStyle;

  if (context.linter) {
    rules.push(`Follow ${context.linter.name} rules defined in \`${context.linter.configFile}\`.`);
  }

  if (context.formatter) {
    rules.push(`Code is formatted with ${context.formatter.name}. Run formatter before committing.`);
  }

  if (style.semicolons !== null) {
    rules.push(style.semicolons ? 'Always include semicolons.' : 'No semicolons.');
  }

  if (style.quotes !== null) {
    rules.push(`Use ${style.quotes} quotes for strings.`);
  }

  if (style.trailingComma !== null) {
    rules.push(style.trailingComma ? 'Use trailing commas in multi-line structures.' : 'No trailing commas.');
  }

  if (style.indentation) {
    rules.push(`Indent with ${style.indentation.size} ${style.indentation.style}.`);
  }

  if (style.maxLineLength) {
    rules.push(`Keep lines under ${style.maxLineLength} characters.`);
  }

  if (style.importOrder) {
    rules.push('Sort imports: external packages first, then internal modules, then relative imports.');
  }

  return rules;
}

function buildTestingRules(context: ProjectContext): string[] {
  const rules: string[] = [];

  if (!context.testRunner) return rules;

  rules.push(`Use ${context.testRunner.name} for all tests.`);

  if (context.testRunner.command) {
    rules.push(`Run tests with: \`${context.testRunner.command}\``);
  }

  if (context.testPattern) {
    rules.push(`Test files follow pattern: \`${context.testPattern}\``);
  }

  if (context.testLocation === 'colocated') {
    rules.push('Place test files next to the source files they test.');
  } else if (context.testLocation) {
    rules.push(`Tests live in \`${context.testLocation}\``);
  }

  return rules;
}

function buildCommandRules(context: ProjectContext): string[] {
  const rules: string[] = [];

  if (context.commands.length === 0) return rules;

  const keyCommands = context.commands.filter(c =>
    ['dev', 'build', 'test', 'lint', 'typecheck', 'type-check', 'check'].includes(c.name)
  );

  if (keyCommands.length > 0) {
    rules.push('Key commands:');
    for (const cmd of keyCommands) {
      rules.push(`  ${cmd.command} (${cmd.name})`);
    }
  }

  return rules;
}

function buildArchitectureRules(context: ProjectContext): string[] {
  const rules: string[] = [];

  if (context.structure.layout === 'feature-based') {
    rules.push('This project uses feature-based architecture. Group related files by feature, not by file type.');
  } else if (context.structure.layout === 'layer-based') {
    rules.push('This project uses layer-based architecture (components/, services/, hooks/, etc.).');
  }

  if (context.monorepo) {
    rules.push(`This is a ${context.monorepo.tool} monorepo with packages: ${context.monorepo.packages.join(', ')}.`);
  }

  const networking = context.keyDependencies.filter(d => d.category === 'networking');
  if (networking.length > 0) {
    rules.push(`Use ${networking.map(d => d.name).join(' or ')} for data fetching.`);
  }

  const state = context.keyDependencies.filter(d => d.category === 'state');
  if (state.length > 0) {
    rules.push(`State management: ${state.map(d => d.name).join(', ')}`);
  }

  return rules;
}

function buildGitRules(context: ProjectContext): string[] {
  const rules: string[] = [];
  const git = context.gitConventions;

  if (git?.usesConventionalCommits) {
    rules.push('Follow Conventional Commits: feat|fix|docs|chore|refactor|test|perf(scope): description');
  }

  return rules;
}

export function formatCursor(context: ProjectContext): string {
  const sections: string[] = [];

  const allRules = [
    ...buildLanguageRules(context),
    '',
    ...buildStyleRules(context),
    '',
    ...buildTestingRules(context),
    '',
    ...buildCommandRules(context),
    '',
    ...buildArchitectureRules(context),
    '',
    ...buildGitRules(context),
  ];

  const cleaned = allRules.reduce<string[]>((acc, rule) => {
    if (rule === '' && acc[acc.length - 1] === '') return acc;
    acc.push(rule);
    return acc;
  }, []);

  sections.push(cleaned.join('\n').trim());

  return sections.join('\n');
}
