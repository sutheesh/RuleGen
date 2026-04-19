import fs from 'fs';
import path from 'path';
import type { AndroidInfo } from '../types.js';

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

function extractSdkInt(content: string, key: string): number | null {
  const patterns = [
    new RegExp(`${key}\\s*=\\s*(\\d+)`),
    new RegExp(`${key}\\s*\\(\\s*(\\d+)\\s*\\)`),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(content);
    if (match?.[1]) return parseInt(match[1], 10);
  }
  return null;
}

function extractVersion(content: string, pattern: RegExp): string | null {
  const match = pattern.exec(content);
  return match?.[1] ?? null;
}

function detectUIFramework(content: string, rootDir: string): AndroidInfo['uiFramework'] {
  const hasCompose = content.includes('compose-bom') ||
    content.includes('compose.ui') ||
    content.includes('androidx.compose') ||
    content.includes('"compose"') ||
    content.includes("'compose'");

  const layoutDir = path.join(rootDir, 'app', 'src', 'main', 'res', 'layout');
  const hasXmlLayouts = exists(layoutDir) && fs.readdirSync(layoutDir).some(f => f.endsWith('.xml'));

  if (hasCompose && hasXmlLayouts) return 'both';
  if (hasCompose) return 'compose';
  return 'xml';
}

function detectDI(content: string): string | null {
  if (content.includes('hilt-android') || content.includes('com.google.dagger:hilt')) return 'hilt';
  if (content.includes('dagger') && !content.includes('hilt')) return 'dagger';
  if (content.includes('koin')) return 'koin';
  return null;
}

function detectDatabase(content: string): string | null {
  if (content.includes('room-runtime') || content.includes('androidx.room')) return 'room';
  if (content.includes('sqldelight')) return 'sqldelight';
  if (content.includes('realm')) return 'realm';
  return null;
}

function detectNetworking(content: string): string | null {
  if (content.includes('retrofit')) return 'retrofit';
  if (content.includes('ktor-client')) return 'ktor';
  if (content.includes('okhttp')) return 'okhttp';
  return null;
}

function detectArchitecture(content: string, rootDir: string): string | null {
  const srcDirs = [
    path.join(rootDir, 'app', 'src', 'main', 'java'),
    path.join(rootDir, 'app', 'src', 'main', 'kotlin'),
  ];

  const patterns: Record<string, RegExp> = {
    mvvm: /ViewModel|LiveData|StateFlow/,
    mvi: /Intent|Reducer|Store|UiState/,
    clean: /UseCase|Repository|Domain/,
  };

  const allContent = [content];
  for (const dir of srcDirs) {
    if (exists(dir)) {
      allContent.push(scanKotlinFiles(dir, 3));
    }
  }
  const combined = allContent.join('\n');

  for (const [arch, pattern] of Object.entries(patterns)) {
    if (pattern.test(combined)) return arch;
  }
  return null;
}

function scanKotlinFiles(dir: string, maxDepth: number, depth = 0): string {
  if (depth > maxDepth) return '';
  const parts: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries.slice(0, 20)) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && (entry.name.endsWith('.kt') || entry.name.endsWith('.java'))) {
        const content = readFileSafe(fullPath);
        if (content) parts.push(content.slice(0, 500));
      } else if (entry.isDirectory()) {
        parts.push(scanKotlinFiles(fullPath, maxDepth, depth + 1));
      }
    }
  } catch { /* ignore */ }
  return parts.join('\n');
}

function detectModules(rootDir: string): string[] {
  const settingsContent = readFileSafe(path.join(rootDir, 'settings.gradle.kts')) ??
    readFileSafe(path.join(rootDir, 'settings.gradle')) ?? '';

  const modules: string[] = [];
  const includeMatches = settingsContent.matchAll(/include\s*\(\s*["']([^"']+)["']\s*\)/g);
  for (const match of includeMatches) {
    if (match[1]) modules.push(match[1]);
  }

  if (modules.length === 0) {
    const includeMatches2 = settingsContent.matchAll(/include\s+"([^"]+)"/g);
    for (const match of includeMatches2) {
      if (match[1]) modules.push(match[1]);
    }
  }

  return modules;
}

export function detectAndroid(rootDir: string): AndroidInfo | null {
  const gradleKts = readFileSafe(path.join(rootDir, 'build.gradle.kts'));
  const gradle = readFileSafe(path.join(rootDir, 'build.gradle'));
  const appGradleKts = readFileSafe(path.join(rootDir, 'app', 'build.gradle.kts'));
  const appGradle = readFileSafe(path.join(rootDir, 'app', 'build.gradle'));

  const rootContent = gradleKts ?? gradle ?? '';
  const appContent = appGradleKts ?? appGradle ?? '';
  const combined = rootContent + '\n' + appContent;

  if (!combined.includes('android') && !combined.includes('com.android')) {
    if (!exists(path.join(rootDir, 'app', 'src', 'main', 'AndroidManifest.xml'))) {
      return null;
    }
  }

  const minSdk = extractSdkInt(appContent || combined, 'minSdk') ??
    extractSdkInt(combined, 'minSdkVersion');
  const targetSdk = extractSdkInt(appContent || combined, 'targetSdk') ??
    extractSdkInt(combined, 'targetSdkVersion');
  const compileSdk = extractSdkInt(appContent || combined, 'compileSdk') ??
    extractSdkInt(combined, 'compileSdkVersion');

  const agpVersion = extractVersion(combined,
    /com\.android\.tools\.build[:\s]+gradle[:\s]+"([^"]+)"/);
  const kotlinVersion = extractVersion(combined,
    /kotlin[_-]version\s*=\s*["']([^"']+)["']/) ??
    extractVersion(combined, /org\.jetbrains\.kotlin[^:]*:([^"'\s]+)/);

  return {
    minSdk,
    targetSdk,
    compileSdk,
    agpVersion,
    kotlinVersion,
    uiFramework: detectUIFramework(combined, rootDir),
    di: detectDI(combined),
    database: detectDatabase(combined),
    networking: detectNetworking(combined),
    architecture: detectArchitecture(combined, rootDir),
    modules: detectModules(rootDir),
  };
}
