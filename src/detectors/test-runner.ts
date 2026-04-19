import fs from 'fs';
import path from 'path';
import type { TestRunnerInfo } from '../types.js';

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
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

function getAllDeps(pkg: PackageJson): Record<string, string> {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

function hasTestFilesInDir(dir: string, depth = 0): boolean {
  if (depth > 2) return false;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) return true;
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        if (hasTestFilesInDir(path.join(dir, entry.name), depth + 1)) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export function detectTestRunner(rootDir: string): TestRunnerInfo | null {
  if (exists(path.join(rootDir, 'vitest.config.ts')) || exists(path.join(rootDir, 'vitest.config.js')) ||
    exists(path.join(rootDir, 'vitest.config.mts')) || exists(path.join(rootDir, 'vitest.config.mjs'))) {
    const configFile = ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts', 'vitest.config.mjs']
      .find(f => exists(path.join(rootDir, f))) ?? 'vitest.config.ts';
    return { name: 'Vitest', configFile, command: 'vitest' };
  }

  const jestConfigs = ['jest.config.ts', 'jest.config.js', 'jest.config.cjs', 'jest.config.mjs'];
  for (const jc of jestConfigs) {
    if (exists(path.join(rootDir, jc))) {
      return { name: 'Jest', configFile: jc, command: 'jest' };
    }
  }

  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (pkgContent) {
    const pkg = parseJsonSafe<PackageJson & { jest?: unknown }>(pkgContent);
    if (pkg) {
      const deps = getAllDeps(pkg);

      if ('vitest' in deps) return { name: 'Vitest', configFile: null, command: 'vitest' };

      if ('jest' in deps || '@jest/core' in deps) {
        return { name: 'Jest', configFile: pkg.jest ? 'package.json' : null, command: 'jest' };
      }

      if ('@playwright/test' in deps) {
        const playwrightCfg = ['playwright.config.ts', 'playwright.config.js']
          .find(f => exists(path.join(rootDir, f))) ?? null;
        return { name: 'Playwright', configFile: playwrightCfg, command: 'playwright test' };
      }

      if ('cypress' in deps) {
        const cypressCfg = ['cypress.config.ts', 'cypress.config.js']
          .find(f => exists(path.join(rootDir, f))) ?? null;
        return { name: 'Cypress', configFile: cypressCfg, command: 'cypress run' };
      }
    }
  }

  if (exists(path.join(rootDir, 'playwright.config.ts')) || exists(path.join(rootDir, 'playwright.config.js'))) {
    const configFile = exists(path.join(rootDir, 'playwright.config.ts'))
      ? 'playwright.config.ts' : 'playwright.config.js';
    return { name: 'Playwright', configFile, command: 'playwright test' };
  }

  const pyproject = readFileSafe(path.join(rootDir, 'pyproject.toml'));
  if (pyproject?.includes('[tool.pytest') || exists(path.join(rootDir, 'pytest.ini')) || exists(path.join(rootDir, 'conftest.py'))) {
    const cfgFile = pyproject?.includes('[tool.pytest') ? 'pyproject.toml' :
      exists(path.join(rootDir, 'pytest.ini')) ? 'pytest.ini' : null;
    return { name: 'pytest', configFile: cfgFile, command: 'pytest' };
  }

  if (exists(path.join(rootDir, 'go.mod'))) {
    return { name: 'Go test', configFile: null, command: 'go test ./...' };
  }

  if (exists(path.join(rootDir, 'Cargo.toml'))) {
    return { name: 'cargo test', configFile: 'Cargo.toml', command: 'cargo test' };
  }

  let rootEntries: string[] = [];
  try { rootEntries = fs.readdirSync(rootDir); } catch { /* ignore */ }
  const xcodeProj = rootEntries.find(f => f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'));
  if (xcodeProj) {
    return { name: 'XCTest', configFile: xcodeProj, command: 'xcodebuild test' };
  }

  if (exists(path.join(rootDir, 'Package.swift'))) {
    return { name: 'Swift Testing', configFile: 'Package.swift', command: 'swift test' };
  }

  const gradleFile = exists(path.join(rootDir, 'build.gradle.kts')) ? 'build.gradle.kts' :
    exists(path.join(rootDir, 'build.gradle')) ? 'build.gradle' : null;
  if (gradleFile) {
    return { name: 'JUnit', configFile: gradleFile, command: './gradlew test' };
  }

  return null;
}

export function getTestPattern(_rootDir: string, runner: string): string | null {
  if (runner === 'Vitest' || runner === 'Jest') return '**/*.{test,spec}.{ts,tsx,js,jsx}';
  if (runner === 'pytest') return 'test_*.py | *_test.py';
  if (runner === 'Go test') return '*_test.go';
  if (runner === 'cargo test') return '#[cfg(test)]';
  if (runner === 'XCTest' || runner === 'Swift Testing') return '**/*Tests.swift';
  if (runner === 'Playwright') return '**/*.spec.ts';
  if (runner === 'Cypress') return 'cypress/e2e/**/*.cy.ts';
  return null;
}

export function getTestLocation(rootDir: string): string | null {
  if (exists(path.join(rootDir, '__tests__'))) return '__tests__/';
  if (exists(path.join(rootDir, 'tests'))) return 'tests/';
  if (exists(path.join(rootDir, 'test'))) return 'test/';
  if (exists(path.join(rootDir, 'spec'))) return 'spec/';

  const srcDir = path.join(rootDir, 'src');
  if (exists(srcDir) && hasTestFilesInDir(srcDir)) return 'colocated';

  return null;
}
