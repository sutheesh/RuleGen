import fs from 'fs';
import path from 'path';
import type { DirectoryStructure } from '../types.js';

function exists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
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

function detectLayout(rootDir: string, entries: string[]): DirectoryStructure['layout'] {
  const srcDir = path.join(rootDir, 'src');
  const appDir = path.join(rootDir, 'app');

  const checkDir = exists(srcDir) ? srcDir : exists(appDir) ? appDir : null;
  if (!checkDir) return 'flat';

  const subEntries = listDir(checkDir);

  const featureIndicators = ['features', 'modules', 'pages', 'views', 'screens'];
  const layerIndicators = ['components', 'services', 'hooks', 'utils', 'helpers', 'models', 'stores', 'controllers', 'repositories'];

  const hasFeature = featureIndicators.some(d => subEntries.includes(d));
  const hasLayer = layerIndicators.some(d => subEntries.includes(d));

  if (hasFeature && !hasLayer) return 'feature-based';
  if (hasLayer && !hasFeature) return 'layer-based';
  if (hasFeature && hasLayer) return 'feature-based';

  if (entries.some(e => ['index.ts', 'index.js', 'main.ts', 'main.js', 'App.tsx', 'app.ts'].includes(e))) {
    return 'flat';
  }

  return 'unknown';
}

function hasCollocatedTests(rootDir: string): boolean {
  const srcDir = path.join(rootDir, 'src');
  if (!exists(srcDir)) return false;

  function check(dir: string, depth = 0): boolean {
    if (depth > 3) return false;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) return true;
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__tests__') {
          if (check(path.join(dir, entry.name), depth + 1)) return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  return check(srcDir);
}

export function detectStructure(rootDir: string): DirectoryStructure {
  const entries = listDir(rootDir);

  const hasSrc = entries.includes('src') && isDirectory(path.join(rootDir, 'src'));
  const hasApp = entries.includes('app') && isDirectory(path.join(rootDir, 'app'));
  const hasLib = entries.includes('lib') && isDirectory(path.join(rootDir, 'lib'));
  const hasPackages = entries.includes('packages') && isDirectory(path.join(rootDir, 'packages'));

  const testDirNames = ['tests', '__tests__', 'test', 'spec', 'e2e'];
  const testDirs = testDirNames.filter(d => entries.includes(d) && isDirectory(path.join(rootDir, d)));

  const configDirNames = ['.github', '.vscode', '.husky', '.changeset', '.storybook'];
  const configDirs = configDirNames.filter(d => entries.includes(d) && isDirectory(path.join(rootDir, d)));

  const platformDirNames = ['android', 'ios', 'web', 'desktop', 'mobile'];
  const platformDirs = platformDirNames.filter(d => entries.includes(d) && isDirectory(path.join(rootDir, d)));

  const rootName = path.basename(rootDir);

  return {
    rootName,
    hasSrc,
    hasApp,
    hasLib,
    hasPackages,
    testDirs,
    configDirs,
    platformDirs,
    layout: detectLayout(rootDir, entries),
    collocatedTests: hasCollocatedTests(rootDir),
  };
}
