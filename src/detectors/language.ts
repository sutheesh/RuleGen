import fs from 'fs';
import path from 'path';
import type { LanguageInfo } from '../types.js';

interface PackageJson {
  engines?: { node?: string };
}

interface CargoToml {
  package?: { edition?: string };
}

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

function extractNodeVersion(rootDir: string): string | null {
  const nvmrc = readFileSafe(path.join(rootDir, '.nvmrc'));
  if (nvmrc) return nvmrc.trim().replace(/^v/, '');

  const nodeVersion = readFileSafe(path.join(rootDir, '.node-version'));
  if (nodeVersion) return nodeVersion.trim().replace(/^v/, '');

  const pkg = readFileSafe(path.join(rootDir, 'package.json'));
  if (pkg) {
    const parsed = parseJsonSafe<PackageJson>(pkg);
    if (parsed?.engines?.node) {
      const match = /[\d.]+/.exec(parsed.engines.node);
      return match?.[0] ?? null;
    }
  }

  return null;
}

function extractPythonVersion(rootDir: string): string | null {
  const pyproject = readFileSafe(path.join(rootDir, 'pyproject.toml'));
  if (pyproject) {
    const match = /requires-python\s*=\s*["']([^"']+)["']/.exec(pyproject);
    if (match?.[1]) return match[1].replace(/[^0-9.]/g, '');
  }

  const setup = readFileSafe(path.join(rootDir, 'setup.py'));
  if (setup) {
    const match = /python_requires\s*=\s*["']([^"']+)["']/.exec(setup);
    if (match?.[1]) return match[1].replace(/[^0-9.]/g, '');
  }

  return null;
}

function extractRustEdition(rootDir: string): string | null {
  const cargo = readFileSafe(path.join(rootDir, 'Cargo.toml'));
  if (!cargo) return null;

  const parsed = parseCargoToml(cargo);
  return parsed?.package?.edition ?? null;
}

function parseCargoToml(content: string): CargoToml {
  const result: CargoToml = { package: {} };
  const editionMatch = /edition\s*=\s*"(\d+)"/.exec(content);
  if (editionMatch?.[1] && result.package) {
    result.package.edition = editionMatch[1];
  }
  return result;
}

function extractGoVersion(rootDir: string): string | null {
  const goMod = readFileSafe(path.join(rootDir, 'go.mod'));
  if (!goMod) return null;

  const match = /^go\s+([\d.]+)/m.exec(goMod);
  return match?.[1] ?? null;
}

function extractSwiftVersion(rootDir: string): string | null {
  const packageSwift = readFileSafe(path.join(rootDir, 'Package.swift'));
  if (!packageSwift) return null;

  const match = /swift-tools-version:\s*([\d.]+)/.exec(packageSwift);
  return match?.[1] ?? null;
}

export function detectLanguages(rootDir: string): LanguageInfo[] {
  const languages: LanguageInfo[] = [];

  if (exists(path.join(rootDir, 'tsconfig.json'))) {
    languages.push({
      name: 'TypeScript',
      version: null,
      configFile: 'tsconfig.json',
    });
  } else if (exists(path.join(rootDir, 'package.json'))) {
    languages.push({
      name: 'JavaScript',
      version: extractNodeVersion(rootDir),
      configFile: 'package.json',
    });
  }

  if (exists(path.join(rootDir, 'package.json')) && !languages.find(l => l.name === 'TypeScript')) {
    const nodeVersion = extractNodeVersion(rootDir);
    if (nodeVersion && !languages.find(l => l.name === 'JavaScript')) {
      languages.push({
        name: 'JavaScript',
        version: nodeVersion,
        configFile: 'package.json',
      });
    }
  }

  if (exists(path.join(rootDir, 'Cargo.toml'))) {
    languages.push({
      name: 'Rust',
      version: extractRustEdition(rootDir),
      configFile: 'Cargo.toml',
    });
  }

  if (exists(path.join(rootDir, 'go.mod'))) {
    languages.push({
      name: 'Go',
      version: extractGoVersion(rootDir),
      configFile: 'go.mod',
    });
  }

  const hasPyproject = exists(path.join(rootDir, 'pyproject.toml'));
  const hasSetupPy = exists(path.join(rootDir, 'setup.py'));
  const hasRequirements = exists(path.join(rootDir, 'requirements.txt'));

  if (hasPyproject || hasSetupPy || hasRequirements) {
    languages.push({
      name: 'Python',
      version: extractPythonVersion(rootDir),
      configFile: hasPyproject ? 'pyproject.toml' : hasSetupPy ? 'setup.py' : 'requirements.txt',
    });
  }

  if (exists(path.join(rootDir, 'Package.swift'))) {
    languages.push({
      name: 'Swift',
      version: extractSwiftVersion(rootDir),
      configFile: 'Package.swift',
    });
  }

  const hasGradle = exists(path.join(rootDir, 'build.gradle.kts')) || exists(path.join(rootDir, 'build.gradle'));
  if (hasGradle) {
    const gradleFile = exists(path.join(rootDir, 'build.gradle.kts')) ? 'build.gradle.kts' : 'build.gradle';
    const content = readFileSafe(path.join(rootDir, gradleFile)) ?? '';
    const isKotlin = content.includes('kotlin(') || gradleFile.endsWith('.kts');
    languages.push({
      name: isKotlin ? 'Kotlin' : 'Java',
      version: null,
      configFile: gradleFile,
    });
  }

  if (exists(path.join(rootDir, 'Gemfile'))) {
    languages.push({ name: 'Ruby', version: null, configFile: 'Gemfile' });
  }

  const csprojFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.csproj'));
  if (csprojFiles.length > 0 && csprojFiles[0]) {
    languages.push({ name: 'C#', version: null, configFile: csprojFiles[0] });
  }

  return languages;
}
