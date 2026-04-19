import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getHookScript } from './hook-script.js';

function findGitRoot(startDir: string): string | null {
  try {
    const result = execSync('git rev-parse --show-toplevel 2>/dev/null', {
      cwd: startDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000,
    });
    return result.trim();
  } catch {
    return null;
  }
}

function findNpx(): string {
  try {
    execSync('npx --version', { stdio: 'ignore', timeout: 2000 });
    return 'npx';
  } catch {
    return 'npx';
  }
}

export function installGitHook(projectDir: string, hookType: 'pre-commit' | 'pre-push' = 'pre-commit'): boolean {
  const gitRoot = findGitRoot(projectDir);
  if (!gitRoot) return false;

  const hooksDir = path.join(gitRoot, '.git', 'hooks');
  const hookPath = path.join(hooksDir, hookType);

  try {
    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, 'utf-8');
      if (existing.includes('rulegen')) return true;

      const backupPath = `${hookPath}.pre-rulegen`;
      fs.copyFileSync(hookPath, backupPath);

      const combined = existing.trimEnd() + '\n\n# RuleGen hook\n' +
        getHookScript(hookType, findNpx()).split('\n').slice(5).join('\n');
      fs.writeFileSync(hookPath, combined, { mode: 0o755 });
      return true;
    }

    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    fs.writeFileSync(hookPath, getHookScript(hookType, findNpx()), { mode: 0o755 });
    return true;
  } catch {
    return false;
  }
}

export function isInGitRepo(projectDir: string): boolean {
  return findGitRoot(projectDir) !== null;
}
