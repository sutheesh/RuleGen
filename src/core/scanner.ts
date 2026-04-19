import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { ProjectContext, Platform, CodeStyleRules } from '../types.js';
import { detectLanguages } from '../detectors/language.js';
import { detectFrameworks } from '../detectors/framework.js';
import { detectPackageManager } from '../detectors/package-manager.js';
import { detectLinter } from '../detectors/linter.js';
import { detectFormatter } from '../detectors/formatter.js';
import { detectTestRunner, getTestPattern, getTestLocation } from '../detectors/test-runner.js';
import { detectBuildCommands, detectBuildTool } from '../detectors/build-tool.js';
import { detectStructure } from '../detectors/structure.js';
import { detectTypeScriptConfig } from '../detectors/typescript-config.js';
import { detectMonorepo } from '../detectors/monorepo.js';
import { detectGitConventions } from '../detectors/git-conventions.js';
import { detectKeyDependencies } from '../detectors/dependencies.js';
import { detectAndroid } from '../detectors/android.js';
import { detectIOS } from '../detectors/ios.js';
import { detectCrossPlatform } from '../detectors/cross-platform.js';

function exists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function detectPlatforms(
  rootDir: string,
  languages: ReturnType<typeof detectLanguages>,
  frameworks: ReturnType<typeof detectFrameworks>,
  crossPlatform: ReturnType<typeof detectCrossPlatform>,
): Platform[] {
  const platforms = new Set<Platform>();
  const languageNames = languages.map(l => l.name);
  const frameworkNames = frameworks.map(f => f.name);

  if (crossPlatform !== null || frameworkNames.includes('React Native') || frameworkNames.includes('Expo')) {
    platforms.add('cross-platform');
  }

  if (languageNames.includes('Swift') || exists(path.join(rootDir, 'Package.swift')) ||
    exists(path.join(rootDir, 'Podfile')) || exists(path.join(rootDir, 'Tuist'))) {
    platforms.add('ios');
  }

  if (languageNames.includes('Kotlin') || languageNames.includes('Java')) {
    if (exists(path.join(rootDir, 'android')) || exists(path.join(rootDir, 'app')) ||
      exists(path.join(rootDir, 'app', 'src', 'main', 'AndroidManifest.xml'))) {
      platforms.add('android');
    } else {
      platforms.add('server');
    }
  }

  if (frameworkNames.some(f => ['Next.js', 'Nuxt', 'SvelteKit', 'Angular', 'Vue', 'React', 'Astro', 'Remix'].includes(f))) {
    platforms.add('web');
  }

  if (frameworkNames.some(f => ['Express', 'Fastify', 'NestJS', 'Hono', 'Vapor', 'Spring Boot', 'Ktor', 'FastAPI', 'Django', 'Flask'].includes(f))) {
    platforms.add('server');
  }

  if (frameworkNames.includes('Electron')) {
    platforms.add('desktop');
  }

  if (languageNames.includes('Rust') || languageNames.includes('Go') || languageNames.includes('Python') || languageNames.includes('Ruby')) {
    if (platforms.size === 0) platforms.add('server');
  }

  if (platforms.size === 0 && (languageNames.includes('TypeScript') || languageNames.includes('JavaScript'))) {
    platforms.add('web');
  }

  return [...platforms];
}

function buildCodeStyle(linter: ReturnType<typeof detectLinter>, formatter: ReturnType<typeof detectFormatter>): CodeStyleRules {
  const style: CodeStyleRules = {
    indentation: null,
    semicolons: null,
    quotes: null,
    trailingComma: null,
    maxLineLength: null,
    namingConvention: null,
    importOrder: null,
    noAny: null,
    preferConst: null,
    preferFunctional: null,
    customRules: [],
  };

  if (formatter) {
    if (formatter.options.useTabs !== null) {
      style.indentation = {
        style: formatter.options.useTabs ? 'tabs' : 'spaces',
        size: formatter.options.tabWidth ?? 2,
      };
    } else if (formatter.options.tabWidth !== null) {
      style.indentation = { style: 'spaces', size: formatter.options.tabWidth };
    }

    if (formatter.options.semi !== null) style.semicolons = formatter.options.semi;
    if (formatter.options.singleQuote !== null) style.quotes = formatter.options.singleQuote ? 'single' : 'double';
    if (formatter.options.trailingComma !== null) style.trailingComma = formatter.options.trailingComma !== 'none';
    if (formatter.options.printWidth !== null) style.maxLineLength = formatter.options.printWidth;
  }

  if (linter) {
    if (style.maxLineLength === null && linter.rules.maxLineLength !== null) {
      style.maxLineLength = linter.rules.maxLineLength;
    }
    if (linter.rules.noAny !== null) style.noAny = linter.rules.noAny;
    if (linter.rules.importOrder !== null) style.importOrder = linter.rules.importOrder;
    if (linter.rules.namingConvention !== null) style.namingConvention = linter.rules.namingConvention;
    style.customRules = [...(style.customRules ?? []), ...linter.rules.customRules];
  }

  return style;
}

export function scan(rootDir: string): ProjectContext {
  const languages = detectLanguages(rootDir);
  const frameworks = detectFrameworks(rootDir);
  const crossPlatform = detectCrossPlatform(rootDir);
  const platforms = detectPlatforms(rootDir, languages, frameworks, crossPlatform);
  const packageManager = detectPackageManager(rootDir);
  const linter = detectLinter(rootDir);
  const formatter = detectFormatter(rootDir);
  const testRunner = detectTestRunner(rootDir);
  const testPattern = testRunner ? getTestPattern(rootDir, testRunner.name) : null;
  const testLocation = getTestLocation(rootDir);
  const commands = detectBuildCommands(rootDir);
  const buildTool = detectBuildTool(rootDir);
  const structure = detectStructure(rootDir);
  const typescriptConfig = detectTypeScriptConfig(rootDir);
  const monorepo = detectMonorepo(rootDir);
  const gitConventions = detectGitConventions(rootDir);
  const keyDependencies = detectKeyDependencies(rootDir);
  const codeStyle = buildCodeStyle(linter, formatter);

  return {
    languages,
    frameworks,
    platforms,
    packageManager,
    commands,
    buildTool,
    linter,
    formatter,
    codeStyle,
    structure,
    monorepo,
    keyDependencies,
    testRunner,
    testPattern,
    testLocation,
    typescriptConfig,
    gitConventions,
    android: platforms.includes('android') ? detectAndroid(rootDir) : null,
    ios: platforms.includes('ios') ? detectIOS(rootDir) : null,
  };
}

export function hashContext(context: ProjectContext): string {
  const content = JSON.stringify(context, null, 0);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

const CACHE_DIR = '.rulegen';
const HASH_FILE = 'last-hash';

export function readLastHash(rootDir: string): string | null {
  try {
    return fs.readFileSync(path.join(rootDir, CACHE_DIR, HASH_FILE), 'utf-8').trim();
  } catch {
    return null;
  }
}

export function writeHash(rootDir: string, hash: string): void {
  try {
    const dir = path.join(rootDir, CACHE_DIR);
    if (!exists(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, HASH_FILE), hash, 'utf-8');
  } catch {
    // ignore — best effort
  }
}
