import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { GitConventions } from '../types.js';

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

function getRecentCommits(rootDir: string): string[] {
  try {
    const output = execSync('git log --oneline -20 2>/dev/null', {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const CONVENTIONAL_PREFIXES = /^[a-f0-9]+ (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?:/;
const ISSUE_REF = /#\d+/;
const SCOPE_PATTERN = /^[a-f0-9]+ \w+\(([^)]+)\):/;

export function detectGitConventions(rootDir: string): GitConventions | null {
  const commits = getRecentCommits(rootDir);
  if (commits.length === 0) return null;

  const usesConventionalCommits = commits.filter(c => CONVENTIONAL_PREFIXES.test(c)).length >= Math.ceil(commits.length * 0.5);
  const usesIssueRefs = commits.some(c => ISSUE_REF.test(c));
  const usesScopes = commits.some(c => SCOPE_PATTERN.test(c));

  const hasPRTemplate = exists(path.join(rootDir, '.github', 'PULL_REQUEST_TEMPLATE.md')) ||
    exists(path.join(rootDir, '.github', 'pull_request_template.md')) ||
    exists(path.join(rootDir, 'PULL_REQUEST_TEMPLATE.md'));

  return {
    usesConventionalCommits,
    usesIssueRefs,
    usesScopes,
    exampleCommits: commits.slice(0, 3).map(c => c.replace(/^[a-f0-9]+ /, '')),
    hasPRTemplate,
  };
}
