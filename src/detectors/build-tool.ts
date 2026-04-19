import fs from 'fs';
import path from 'path';
import type { CommandInfo } from '../types.js';

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function exists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseJsonSafe<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

interface PackageJson {
  scripts?: Record<string, string>;
}

const KNOWN_SCRIPTS = ['dev', 'start', 'build', 'test', 'lint', 'format', 'typecheck', 'type-check',
  'check', 'clean', 'deploy', 'preview', 'storybook', 'docker', 'e2e', 'coverage'];

function commandFromScript(scriptName: string, scriptValue: string, pm: string): string {
  const runner = pm === 'yarn' ? 'yarn' : pm === 'bun' ? 'bun run' : pm === 'pnpm' ? 'pnpm' : 'npm run';
  return `${runner} ${scriptName}`;
}

function detectPackageManagerFromRoot(rootDir: string): string {
  if (exists(path.join(rootDir, 'bun.lockb')) || exists(path.join(rootDir, 'bun.lock'))) return 'bun';
  if (exists(path.join(rootDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (exists(path.join(rootDir, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function extractPackageJsonCommands(rootDir: string): CommandInfo[] {
  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (!pkgContent) return [];

  const pkg = parseJsonSafe<PackageJson>(pkgContent);
  if (!pkg?.scripts) return [];

  const pm = detectPackageManagerFromRoot(rootDir);
  const commands: CommandInfo[] = [];

  for (const [name, value] of Object.entries(pkg.scripts)) {
    const canonicalName = KNOWN_SCRIPTS.find(k => name === k || name === k.replace('-', ''))
      ?? (name.includes(':') ? name.split(':')[0] ?? name : name);

    commands.push({
      name: canonicalName,
      command: commandFromScript(name, value, pm),
      source: 'package.json',
    });
  }

  return commands;
}

function extractMakefileCommands(rootDir: string): CommandInfo[] {
  const content = readFileSafe(path.join(rootDir, 'Makefile'));
  if (!content) return [];

  const commands: CommandInfo[] = [];
  const targets = content.matchAll(/^([a-zA-Z][a-zA-Z0-9_-]*):/gm);

  for (const match of targets) {
    const target = match[1];
    if (!target || target.startsWith('.')) continue;
    commands.push({ name: target, command: `make ${target}`, source: 'Makefile' });
  }

  return commands;
}

function extractGradleCommands(rootDir: string): CommandInfo[] {
  const commands: CommandInfo[] = [];

  if (!exists(path.join(rootDir, 'build.gradle.kts')) && !exists(path.join(rootDir, 'build.gradle'))) {
    return commands;
  }

  const commonTasks = [
    { name: 'build', command: './gradlew build', source: 'build.gradle.kts' },
    { name: 'test', command: './gradlew test', source: 'build.gradle.kts' },
    { name: 'clean', command: './gradlew clean', source: 'build.gradle.kts' },
    { name: 'assemble', command: './gradlew assembleDebug', source: 'build.gradle.kts' },
    { name: 'lint', command: './gradlew lint', source: 'build.gradle.kts' },
  ];

  return commonTasks;
}

function extractJustfileCommands(rootDir: string): CommandInfo[] {
  const content = readFileSafe(path.join(rootDir, 'justfile')) ??
    readFileSafe(path.join(rootDir, 'Justfile'));
  if (!content) return [];

  const commands: CommandInfo[] = [];
  const targets = content.matchAll(/^([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+[^:]*)?:/gm);

  for (const match of targets) {
    const target = match[1];
    if (!target) continue;
    commands.push({ name: target, command: `just ${target}`, source: 'justfile' });
  }

  return commands;
}

function extractTaskfileCommands(rootDir: string): CommandInfo[] {
  const content = readFileSafe(path.join(rootDir, 'Taskfile.yml')) ??
    readFileSafe(path.join(rootDir, 'taskfile.yml')) ??
    readFileSafe(path.join(rootDir, 'Taskfile.yaml'));
  if (!content) return [];

  const commands: CommandInfo[] = [];
  const taskMatches = content.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9_-]*):/gm);

  for (const match of taskMatches) {
    const name = match[1];
    if (!name) continue;
    commands.push({ name, command: `task ${name}`, source: 'Taskfile.yml' });
  }

  return commands;
}

function deduplicateCommands(commands: CommandInfo[]): CommandInfo[] {
  const seen = new Set<string>();
  const result: CommandInfo[] = [];
  const priority = ['package.json', 'Makefile', 'justfile', 'Taskfile.yml', 'build.gradle.kts'];

  const sorted = [...commands].sort((a, b) => {
    return priority.indexOf(a.source) - priority.indexOf(b.source);
  });

  for (const cmd of sorted) {
    if (!seen.has(cmd.name)) {
      seen.add(cmd.name);
      result.push(cmd);
    }
  }

  return result;
}

export function detectBuildCommands(rootDir: string): CommandInfo[] {
  const all = [
    ...extractPackageJsonCommands(rootDir),
    ...extractMakefileCommands(rootDir),
    ...extractGradleCommands(rootDir),
    ...extractJustfileCommands(rootDir),
    ...extractTaskfileCommands(rootDir),
  ];

  return deduplicateCommands(all);
}

export function detectBuildTool(rootDir: string): string | null {
  if (exists(path.join(rootDir, 'turbo.json'))) return 'Turborepo';
  if (exists(path.join(rootDir, 'nx.json'))) return 'Nx';
  if (exists(path.join(rootDir, 'build.gradle.kts')) || exists(path.join(rootDir, 'build.gradle'))) return 'Gradle';
  if (exists(path.join(rootDir, 'Makefile'))) return 'Make';
  if (exists(path.join(rootDir, 'justfile')) || exists(path.join(rootDir, 'Justfile'))) return 'Just';
  if (exists(path.join(rootDir, 'Taskfile.yml'))) return 'Task';
  if (exists(path.join(rootDir, 'vite.config.ts')) || exists(path.join(rootDir, 'vite.config.js'))) return 'Vite';
  if (exists(path.join(rootDir, 'webpack.config.js')) || exists(path.join(rootDir, 'webpack.config.ts'))) return 'Webpack';
  if (exists(path.join(rootDir, 'rollup.config.js')) || exists(path.join(rootDir, 'rollup.config.ts'))) return 'Rollup';
  if (exists(path.join(rootDir, 'esbuild.config.js'))) return 'esbuild';
  return null;
}
