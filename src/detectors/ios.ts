import fs from 'fs';
import path from 'path';
import type { IOSInfo } from '../types.js';

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

function listDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function extractSwiftToolsVersion(packageSwift: string): string | null {
  const match = /swift-tools-version:\s*([\d.]+)/.exec(packageSwift);
  return match?.[1] ?? null;
}

function extractDeploymentTarget(content: string): string | null {
  const patterns = [
    /\.macOS\s*\(\s*[".]([^".)]+)[".]/,
    /\.iOS\s*\(\s*[".]([^".)]+)[".]/,
    /IPHONEOS_DEPLOYMENT_TARGET\s*=\s*([\d.]+)/,
    /deploymentTarget\s*=\s*"([\d.]+)"/,
    /\.init\s*\(\s*["']?([\d.]+)["']?\s*\)/,
  ];
  for (const p of patterns) {
    const match = p.exec(content);
    if (match?.[1]) return match[1];
  }
  return null;
}

type UIFramework = IOSInfo['uiFramework'];

function scanSwiftImports(rootDir: string, maxFiles = 50): { swiftUI: boolean; uiKit: boolean; foundationModels: boolean; coreML: boolean; coreData: boolean; swiftData: boolean } {
  const result = { swiftUI: false, uiKit: false, foundationModels: false, coreML: false, coreData: false, swiftData: false };

  function scanDir(dir: string, depth: number, count: { n: number }): void {
    if (depth > 4 || count.n >= maxFiles) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (count.n >= maxFiles) break;
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.swift')) {
          count.n++;
          const content = readFileSafe(fullPath)?.slice(0, 1000) ?? '';
          if (content.includes('import SwiftUI')) result.swiftUI = true;
          if (content.includes('import UIKit')) result.uiKit = true;
          if (content.includes('import FoundationModels')) result.foundationModels = true;
          if (content.includes('import CoreML')) result.coreML = true;
          if (content.includes('import CoreData')) result.coreData = true;
          if (content.includes('import SwiftData')) result.swiftData = true;
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'build') {
          scanDir(fullPath, depth + 1, count);
        }
      }
    } catch { /* ignore */ }
  }

  scanDir(rootDir, 0, { n: 0 });
  return result;
}

function detectUIFramework(imports: ReturnType<typeof scanSwiftImports>, packageSwift: string): UIFramework {
  const hasSwiftUI = imports.swiftUI || packageSwift.includes('SwiftUI');
  const hasUIKit = imports.uiKit || packageSwift.includes('UIKit');

  if (hasSwiftUI && hasUIKit) return 'both';
  if (hasSwiftUI) return 'swiftui';
  return 'uikit';
}

function detectPackageManager(rootDir: string): IOSInfo['packageManager'] {
  if (exists(path.join(rootDir, 'Tuist'))) return 'tuist';
  if (exists(path.join(rootDir, 'Podfile'))) return 'cocoapods';
  if (exists(path.join(rootDir, 'Package.swift'))) return 'spm';
  return null;
}

function detectPersistence(imports: ReturnType<typeof scanSwiftImports>, packageSwift: string): string | null {
  if (imports.swiftData || packageSwift.includes('SwiftData')) return 'swiftdata';
  if (imports.coreData || packageSwift.includes('CoreData')) return 'core-data';
  if (packageSwift.includes('realm') || packageSwift.includes('Realm')) return 'realm';
  return null;
}

function detectArchitecture(rootDir: string, packageSwift: string): string | null {
  const combined = packageSwift;

  if (combined.includes('ComposableArchitecture') || combined.includes('TCA')) return 'tca';

  function scanForPatterns(dir: string): string | null {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries.slice(0, 30)) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.swift')) {
          const content = readFileSafe(fullPath) ?? '';
          if (/class\s+\w+ViewModel/.test(content)) return 'mvvm';
          if (/protocol\s+\w+Interactor/.test(content) || /protocol\s+\w+Router/.test(content)) return 'viper';
          if (/class\s+\w+UseCase/.test(content)) return 'clean';
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const result = scanForPatterns(fullPath);
          if (result) return result;
        }
      }
    } catch { /* ignore */ }
    return null;
  }

  const srcDir = path.join(rootDir, 'Sources');
  return exists(srcDir) ? scanForPatterns(srcDir) : null;
}

export function detectIOS(rootDir: string): IOSInfo | null {
  const packageSwift = readFileSafe(path.join(rootDir, 'Package.swift'));
  const entries = listDir(rootDir);
  const hasXcodeProj = entries.some(e => e.endsWith('.xcodeproj') || e.endsWith('.xcworkspace'));
  const hasPodfile = exists(path.join(rootDir, 'Podfile'));
  const hasTuist = exists(path.join(rootDir, 'Tuist'));

  if (!packageSwift && !hasXcodeProj && !hasPodfile && !hasTuist) {
    return null;
  }

  const swiftVersion = packageSwift ? extractSwiftToolsVersion(packageSwift) : null;

  const pbxprojContent = (() => {
    const xcodeproj = entries.find(e => e.endsWith('.xcodeproj'));
    if (!xcodeproj) return null;
    return readFileSafe(path.join(rootDir, xcodeproj, 'project.pbxproj'));
  })();

  const deploymentTarget = extractDeploymentTarget(
    (packageSwift ?? '') + (pbxprojContent ?? '')
  );

  const imports = scanSwiftImports(rootDir);
  const uiFramework = detectUIFramework(imports, packageSwift ?? '');
  const packageManager = detectPackageManager(rootDir);
  const persistence = detectPersistence(imports, packageSwift ?? '');
  const architecture = detectArchitecture(rootDir, packageSwift ?? '');

  return {
    swiftVersion,
    deploymentTarget,
    uiFramework,
    packageManager,
    persistence,
    architecture,
    hasFoundationModels: imports.foundationModels,
    hasCoreML: imports.coreML,
  };
}
