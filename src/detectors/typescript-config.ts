import fs from 'fs';
import path from 'path';
import type { TypeScriptConfig } from '../types.js';

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

function stripJsonComments(content: string): string {
  return content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseJsonSafe<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    try {
      return JSON.parse(stripJsonComments(content)) as T;
    } catch {
      return null;
    }
  }
}

interface TsConfig {
  compilerOptions?: {
    strict?: boolean;
    strictNullChecks?: boolean;
    noImplicitAny?: boolean;
    target?: string;
    paths?: Record<string, string[]>;
    baseUrl?: string;
    moduleResolution?: string;
  };
  extends?: string;
}

export function detectTypeScriptConfig(rootDir: string): TypeScriptConfig | null {
  if (!exists(path.join(rootDir, 'tsconfig.json'))) return null;

  const content = readFileSafe(path.join(rootDir, 'tsconfig.json'));
  if (!content) return null;

  const parsed = parseJsonSafe<TsConfig>(content);
  if (!parsed) return null;

  const opts = parsed.compilerOptions ?? {};

  const strict = opts.strict ?? false;
  const strictNullChecks = opts.strictNullChecks ?? strict;
  const noImplicitAny = opts.noImplicitAny ?? strict;

  return {
    strict,
    strictNullChecks,
    noImplicitAny,
    target: opts.target ?? null,
    pathAliases: opts.paths ?? {},
    baseUrl: opts.baseUrl ?? null,
    moduleResolution: opts.moduleResolution ?? null,
  };
}
