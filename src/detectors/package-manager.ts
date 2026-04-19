import fs from 'fs';
import path from 'path';

function exists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export function detectPackageManager(rootDir: string): string | null {
  if (exists(path.join(rootDir, 'bun.lockb')) || exists(path.join(rootDir, 'bun.lock'))) {
    return 'bun';
  }

  if (exists(path.join(rootDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  if (exists(path.join(rootDir, 'yarn.lock'))) {
    return 'yarn';
  }

  if (exists(path.join(rootDir, 'package-lock.json'))) {
    return 'npm';
  }

  if (exists(path.join(rootDir, 'Cargo.lock'))) {
    return 'cargo';
  }

  if (exists(path.join(rootDir, 'go.sum'))) {
    return 'go';
  }

  if (exists(path.join(rootDir, 'poetry.lock'))) {
    return 'poetry';
  }

  if (exists(path.join(rootDir, 'Pipfile.lock'))) {
    return 'pipenv';
  }

  if (exists(path.join(rootDir, 'pyproject.toml')) || exists(path.join(rootDir, 'requirements.txt'))) {
    return 'pip';
  }

  if (exists(path.join(rootDir, 'Package.resolved'))) {
    return 'spm';
  }

  if (exists(path.join(rootDir, 'Podfile.lock'))) {
    return 'cocoapods';
  }

  if (exists(path.join(rootDir, 'build.gradle.kts')) || exists(path.join(rootDir, 'build.gradle'))) {
    return 'gradle';
  }

  if (exists(path.join(rootDir, 'package.json'))) {
    return 'npm';
  }

  return null;
}
