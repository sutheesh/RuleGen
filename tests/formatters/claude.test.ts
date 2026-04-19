import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { scan } from '../../src/core/scanner.js';
import { formatClaude } from '../../src/formatters/claude.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('formatClaude', () => {
  it('generates CLAUDE.md for Next.js project', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);

    expect(output).toContain('Next.js');
    expect(output).toContain('TypeScript');
  });

  it('includes stack section', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);
    expect(output).toContain('## Stack');
  });

  it('includes commands section when scripts exist', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);
    expect(output).toContain('## Commands');
    expect(output).toMatch(/pnpm dev|npm run dev|yarn dev/);
  });

  it('includes code style section when linter/formatter detected', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);
    expect(output).toContain('## Code Style');
    expect(output).toContain('ESLint');
    expect(output).toContain('Prettier');
  });

  it('includes testing section when test runner detected', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);
    expect(output).toContain('## Testing');
    expect(output).toContain('Vitest');
  });

  it('includes TypeScript section for TypeScript projects', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);
    expect(output).toContain('## TypeScript');
  });

  it('generates valid markdown output', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatClaude(context);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(100);
    expect(output.startsWith('#')).toBe(true);
  });

  it('handles empty project gracefully', () => {
    const context = scan(path.join(fixtures, 'empty'));
    const output = formatClaude(context);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes Express in express-api output', () => {
    const context = scan(path.join(fixtures, 'express-api'));
    const output = formatClaude(context);
    expect(output).toContain('Express');
  });

  it('mentions Jest in express-api testing section', () => {
    const context = scan(path.join(fixtures, 'express-api'));
    const output = formatClaude(context);
    expect(output).toContain('Jest');
  });
});
