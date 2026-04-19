import fs from 'fs';
import path from 'path';
import type { FrameworkInfo } from '../types.js';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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

function getAllDeps(pkg: PackageJson): Record<string, string> {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

const JS_FRAMEWORKS: Array<{
  name: string;
  packages: string[];
  configFiles?: string[];
}> = [
  { name: 'Next.js', packages: ['next'], configFiles: ['next.config.js', 'next.config.ts', 'next.config.mjs'] },
  { name: 'Nuxt', packages: ['nuxt', 'nuxt3'], configFiles: ['nuxt.config.ts', 'nuxt.config.js'] },
  { name: 'SvelteKit', packages: ['@sveltejs/kit'], configFiles: ['svelte.config.js', 'svelte.config.ts'] },
  { name: 'Svelte', packages: ['svelte'] },
  { name: 'Remix', packages: ['@remix-run/react', '@remix-run/node'] },
  { name: 'Astro', packages: ['astro'], configFiles: ['astro.config.mjs', 'astro.config.ts'] },
  { name: 'Angular', packages: ['@angular/core', '@angular/common'] },
  { name: 'Vue', packages: ['vue'] },
  { name: 'React', packages: ['react', 'react-dom'] },
  { name: 'NestJS', packages: ['@nestjs/core', '@nestjs/common'] },
  { name: 'Fastify', packages: ['fastify'] },
  { name: 'Express', packages: ['express'] },
  { name: 'Hono', packages: ['hono'] },
  { name: 'Vite', packages: ['vite'], configFiles: ['vite.config.ts', 'vite.config.js'] },
  { name: 'Electron', packages: ['electron'] },
  { name: 'Expo', packages: ['expo'] },
  { name: 'React Native', packages: ['react-native'] },
];

const PYTHON_FRAMEWORKS: Array<{ name: string; packages: string[] }> = [
  { name: 'FastAPI', packages: ['fastapi'] },
  { name: 'Django', packages: ['django', 'Django'] },
  { name: 'Flask', packages: ['flask', 'Flask'] },
  { name: 'Starlette', packages: ['starlette'] },
];

function detectJsFrameworks(rootDir: string): FrameworkInfo[] {
  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (!pkgContent) return [];

  const pkg = parseJsonSafe<PackageJson>(pkgContent);
  if (!pkg) return [];

  const deps = getAllDeps(pkg);
  const results: FrameworkInfo[] = [];
  const seen = new Set<string>();

  for (const fw of JS_FRAMEWORKS) {
    if (seen.has(fw.name)) continue;

    const matchedPkg = fw.packages.find(p => p in deps);
    const hasConfig = fw.configFiles?.some(cf => exists(path.join(rootDir, cf)));

    if (matchedPkg ?? hasConfig) {
      seen.add(fw.name);
      const version = matchedPkg ? (deps[matchedPkg] ?? null) : null;
      const detectedFrom = matchedPkg
        ? 'package.json'
        : (fw.configFiles?.find(cf => exists(path.join(rootDir, cf))) ?? 'package.json');

      results.push({
        name: fw.name,
        version: version?.replace(/^[\^~]/, '') ?? null,
        detectedFrom,
      });
    }
  }

  return results;
}

function detectPythonFrameworks(rootDir: string): FrameworkInfo[] {
  const results: FrameworkInfo[] = [];

  const pyproject = readFileSafe(path.join(rootDir, 'pyproject.toml'));
  const requirements = readFileSafe(path.join(rootDir, 'requirements.txt'));
  const setupPy = readFileSafe(path.join(rootDir, 'setup.py'));
  const combined = [pyproject, requirements, setupPy].filter(Boolean).join('\n');

  for (const fw of PYTHON_FRAMEWORKS) {
    if (fw.packages.some(p => new RegExp(`\\b${p}\\b`, 'i').exec(combined) !== null)) {
      let version: string | null = null;
      const versionMatch = new RegExp(`${fw.packages[0]}[>=<~!]*([\\d.]+)`, 'i').exec(combined);
      if (versionMatch?.[1]) version = versionMatch[1];

      results.push({
        name: fw.name,
        version,
        detectedFrom: pyproject ? 'pyproject.toml' : requirements ? 'requirements.txt' : 'setup.py',
      });
    }
  }

  return results;
}

function detectSwiftFrameworks(rootDir: string): FrameworkInfo[] {
  const packageSwift = readFileSafe(path.join(rootDir, 'Package.swift'));
  if (!packageSwift) return [];

  const results: FrameworkInfo[] = [];

  if (packageSwift.includes('SwiftUI') || scanSwiftFiles(rootDir, 'import SwiftUI')) {
    results.push({ name: 'SwiftUI', version: null, detectedFrom: 'imports' });
  }
  if (packageSwift.includes('UIKit') || scanSwiftFiles(rootDir, 'import UIKit')) {
    results.push({ name: 'UIKit', version: null, detectedFrom: 'imports' });
  }
  if (packageSwift.includes('Vapor') || packageSwift.includes('vapor/vapor')) {
    results.push({ name: 'Vapor', version: null, detectedFrom: 'Package.swift' });
  }

  return results;
}

function detectKotlinFrameworks(rootDir: string): FrameworkInfo[] {
  const results: FrameworkInfo[] = [];
  const gradleKts = readFileSafe(path.join(rootDir, 'build.gradle.kts'));
  const gradle = readFileSafe(path.join(rootDir, 'build.gradle'));
  const content = (gradleKts ?? gradle) ?? '';

  if (content.includes('compose') || content.includes('androidx.compose')) {
    results.push({ name: 'Jetpack Compose', version: null, detectedFrom: 'build.gradle.kts' });
  }
  if (content.includes('spring-boot') || content.includes('org.springframework.boot')) {
    results.push({ name: 'Spring Boot', version: null, detectedFrom: 'build.gradle.kts' });
  }
  if (content.includes('ktor')) {
    results.push({ name: 'Ktor', version: null, detectedFrom: 'build.gradle.kts' });
  }

  return results;
}

function scanSwiftFiles(rootDir: string, searchFor: string): boolean {
  try {
    const files = fs.readdirSync(rootDir)
      .filter(f => f.endsWith('.swift'))
      .slice(0, 10);

    for (const file of files) {
      const content = readFileSafe(path.join(rootDir, file));
      if (content?.includes(searchFor)) return true;
    }

    const sources = path.join(rootDir, 'Sources');
    if (exists(sources)) {
      return scanSwiftFilesRecursive(sources, searchFor, 0);
    }
  } catch {
    // ignore
  }
  return false;
}

function scanSwiftFilesRecursive(dir: string, searchFor: string, depth: number): boolean {
  if (depth > 3) return false;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (scanSwiftFilesRecursive(fullPath, searchFor, depth + 1)) return true;
      } else if (entry.name.endsWith('.swift')) {
        const content = readFileSafe(fullPath);
        if (content?.includes(searchFor)) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export function detectFrameworks(rootDir: string): FrameworkInfo[] {
  const all = [
    ...detectJsFrameworks(rootDir),
    ...detectPythonFrameworks(rootDir),
    ...detectSwiftFrameworks(rootDir),
    ...detectKotlinFrameworks(rootDir),
  ];

  const seen = new Set<string>();
  return all.filter(fw => {
    if (seen.has(fw.name)) return false;
    seen.add(fw.name);
    return true;
  });
}
