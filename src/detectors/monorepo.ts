import fs from 'fs';
import path from 'path';
import type { MonorepoInfo } from '../types.js';

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
  workspaces?: string[] | { packages: string[] };
}

function resolveWorkspacePackages(rootDir: string, patterns: string[]): string[] {
  const packages: string[] = [];
  for (const pattern of patterns) {
    const cleanPattern = pattern.replace(/\/\*$/, '');
    const workspaceDir = path.join(rootDir, cleanPattern);
    try {
      const stat = fs.statSync(workspaceDir);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(workspaceDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            packages.push(`${cleanPattern}/${entry.name}`);
          }
        }
      }
    } catch {
      packages.push(cleanPattern);
    }
  }
  return packages;
}

export function detectMonorepo(rootDir: string): MonorepoInfo | null {
  if (exists(path.join(rootDir, 'turbo.json'))) {
    const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
    const pkg = pkgContent ? parseJsonSafe<PackageJson>(pkgContent) : null;
    const workspacePatterns = pkg?.workspaces
      ? Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages
      : ['apps/*', 'packages/*'];
    return {
      tool: 'turborepo',
      packages: resolveWorkspacePackages(rootDir, workspacePatterns),
      configFile: 'turbo.json',
    };
  }

  if (exists(path.join(rootDir, 'nx.json'))) {
    return {
      tool: 'nx',
      packages: resolveWorkspacePackages(rootDir, ['apps/*', 'libs/*']),
      configFile: 'nx.json',
    };
  }

  if (exists(path.join(rootDir, 'lerna.json'))) {
    const lernaContent = readFileSafe(path.join(rootDir, 'lerna.json'));
    const lerna = lernaContent ? parseJsonSafe<{ packages?: string[] }>(lernaContent) : null;
    const patterns = lerna?.packages ?? ['packages/*'];
    return {
      tool: 'lerna',
      packages: resolveWorkspacePackages(rootDir, patterns),
      configFile: 'lerna.json',
    };
  }

  if (exists(path.join(rootDir, 'pnpm-workspace.yaml'))) {
    const content = readFileSafe(path.join(rootDir, 'pnpm-workspace.yaml')) ?? '';
    const patterns: string[] = [];
    const matches = content.matchAll(/^\s*-\s+["']?([^"'\n]+)["']?/gm);
    for (const match of matches) {
      if (match[1]) patterns.push(match[1].trim());
    }
    return {
      tool: 'pnpm-workspaces',
      packages: resolveWorkspacePackages(rootDir, patterns.length > 0 ? patterns : ['packages/*']),
      configFile: 'pnpm-workspace.yaml',
    };
  }

  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (pkgContent) {
    const pkg = parseJsonSafe<PackageJson>(pkgContent);
    if (pkg?.workspaces) {
      const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages;
      const isYarn = exists(path.join(rootDir, 'yarn.lock'));
      return {
        tool: isYarn ? 'yarn-workspaces' : 'npm-workspaces',
        packages: resolveWorkspacePackages(rootDir, patterns),
        configFile: 'package.json',
      };
    }
  }

  return null;
}
