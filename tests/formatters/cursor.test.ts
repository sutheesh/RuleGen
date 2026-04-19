import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { scan } from '../../src/core/scanner.js';
import { formatCursor } from '../../src/formatters/cursor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('formatCursor', () => {
  it('generates plain text for .cursorrules', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCursor(context);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(50);
  });

  it('mentions TypeScript usage rule', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCursor(context);
    expect(output.toLowerCase()).toContain('typescript');
  });

  it('mentions Next.js App Router convention', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCursor(context);
    expect(output).toContain('Next.js');
  });

  it('includes formatter rule when Prettier detected', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCursor(context);
    expect(output).toContain('Prettier');
  });

  it('includes linter rule when ESLint detected', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCursor(context);
    expect(output).toContain('ESLint');
  });

  it('includes test runner info', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCursor(context);
    expect(output).toContain('Vitest');
  });

  it('handles empty project without crashing', () => {
    const context = scan(path.join(fixtures, 'empty'));
    const output = formatCursor(context);
    expect(typeof output).toBe('string');
  });

  it('does not include markdown headers', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCursor(context);
    expect(output).not.toMatch(/^##\s/m);
  });
});
