import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { scan, hashContext } from '../../src/core/scanner.js';
import { formatClaude } from '../../src/formatters/claude.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('full scan integration', () => {
  it('scans nextjs-app and produces complete context', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));

    expect(context.languages.length).toBeGreaterThan(0);
    expect(context.frameworks.length).toBeGreaterThan(0);
    expect(context.packageManager).toBe('pnpm');
    expect(context.linter?.name).toBe('ESLint');
    expect(context.formatter?.name).toBe('Prettier');
    expect(context.testRunner?.name).toBe('Vitest');
    expect(context.typescriptConfig?.strict).toBe(true);
    expect(context.commands.length).toBeGreaterThan(0);
  });

  it('scans express-api and produces complete context', () => {
    const context = scan(path.join(fixtures, 'express-api'));

    expect(context.frameworks.find(f => f.name === 'Express')).toBeDefined();
    expect(context.testRunner?.name).toBe('Jest');
    expect(context.packageManager).toBe('npm');
  });

  it('scans monorepo and detects turborepo', () => {
    const context = scan(path.join(fixtures, 'monorepo'));

    expect(context.monorepo).toBeDefined();
    expect(context.monorepo?.tool).toBe('turborepo');
  });

  it('scan of empty project does not throw', () => {
    expect(() => scan(path.join(fixtures, 'empty'))).not.toThrow();
  });

  it('produces identical hash for identical scan', () => {
    const context1 = scan(path.join(fixtures, 'nextjs-app'));
    const context2 = scan(path.join(fixtures, 'nextjs-app'));
    expect(hashContext(context1)).toBe(hashContext(context2));
  });

  it('produces different hashes for different projects', () => {
    const ctx1 = scan(path.join(fixtures, 'nextjs-app'));
    const ctx2 = scan(path.join(fixtures, 'express-api'));
    expect(hashContext(ctx1)).not.toBe(hashContext(ctx2));
  });

  it('generates CLAUDE.md with substantial content for nextjs-app', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);

    expect(output.length).toBeGreaterThan(500);
    expect(output).toContain('Next.js');
    expect(output).toContain('TypeScript');
    expect(output).toContain('Vitest');
    expect(output).toContain('ESLint');
    expect(output).toContain('Prettier');
  });

  it('detects key dependencies in nextjs-app', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const depNames = context.keyDependencies.map(d => d.name);
    expect(depNames).toContain('Prisma');
    expect(depNames).toContain('NextAuth');
    expect(depNames).toContain('Zustand');
    expect(depNames).toContain('Tanstack Query');
  });

  it('detects platforms correctly for nextjs-app', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    expect(context.platforms).toContain('web');
  });
});
