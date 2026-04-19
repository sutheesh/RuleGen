import fs from 'fs';
import path from 'path';

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
}

export type CrossPlatformFramework = 'react-native' | 'expo' | 'flutter' | 'kmp' | null;

export interface CrossPlatformInfo {
  framework: CrossPlatformFramework;
  hasiOS: boolean;
  hasAndroid: boolean;
  hasWeb: boolean;
  hasDesktop: boolean;
}

function detectReactNative(rootDir: string): CrossPlatformInfo | null {
  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (!pkgContent) return null;

  const pkg = parseJsonSafe<PackageJson>(pkgContent);
  if (!pkg) return null;

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const isExpo = 'expo' in deps;
  const isRN = 'react-native' in deps;

  if (!isRN && !isExpo) return null;

  const hasiOS = exists(path.join(rootDir, 'ios'));
  const hasAndroid = exists(path.join(rootDir, 'android'));
  const hasWeb = 'react-native-web' in deps || 'expo-router' in deps;

  return {
    framework: isExpo ? 'expo' : 'react-native',
    hasiOS,
    hasAndroid,
    hasWeb,
    hasDesktop: false,
  };
}

function detectFlutter(rootDir: string): CrossPlatformInfo | null {
  const pubspec = readFileSafe(path.join(rootDir, 'pubspec.yaml'));
  if (!pubspec || !pubspec.includes('flutter:')) return null;

  return {
    framework: 'flutter',
    hasiOS: exists(path.join(rootDir, 'ios')),
    hasAndroid: exists(path.join(rootDir, 'android')),
    hasWeb: exists(path.join(rootDir, 'web')),
    hasDesktop: exists(path.join(rootDir, 'macos')) || exists(path.join(rootDir, 'windows')) || exists(path.join(rootDir, 'linux')),
  };
}

function detectKMP(rootDir: string): CrossPlatformInfo | null {
  const gradleContent = readFileSafe(path.join(rootDir, 'build.gradle.kts')) ??
    readFileSafe(path.join(rootDir, 'build.gradle')) ?? '';

  const settingsContent = readFileSafe(path.join(rootDir, 'settings.gradle.kts')) ??
    readFileSafe(path.join(rootDir, 'settings.gradle')) ?? '';

  const combined = gradleContent + settingsContent;

  if (!combined.includes('multiplatform') && !combined.includes('kotlin("multiplatform")') &&
    !combined.includes("id(\"org.jetbrains.kotlin.multiplatform\")")) {
    return null;
  }

  return {
    framework: 'kmp',
    hasiOS: combined.includes('iosArm64') || combined.includes('iosSimulatorArm64') || combined.includes('ios()'),
    hasAndroid: combined.includes('android()') || combined.includes('androidTarget()'),
    hasWeb: combined.includes('js(') || combined.includes('wasmJs('),
    hasDesktop: combined.includes('jvm(') || combined.includes('mingwX64') || combined.includes('macosArm64'),
  };
}

export function detectCrossPlatform(rootDir: string): CrossPlatformInfo | null {
  return detectReactNative(rootDir) ?? detectFlutter(rootDir) ?? detectKMP(rootDir);
}
