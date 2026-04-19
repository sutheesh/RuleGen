import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectLinter } from '../../src/detectors/linter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectLinter', () => {
  it('detects ESLint in nextjs-app', () => {
    const linter = detectLinter(path.join(fixtures, 'nextjs-app'));
    expect(linter?.name).toBe('ESLint');
    expect(linter?.configFile).toBe('.eslintrc.json');
  });

  it('extracts no-any rule from ESLint config', () => {
    const linter = detectLinter(path.join(fixtures, 'nextjs-app'));
    expect(linter?.rules.noAny).toBe(true);
  });

  it('extracts max line length from ESLint config', () => {
    const linter = detectLinter(path.join(fixtures, 'nextjs-app'));
    expect(linter?.rules.maxLineLength).toBe(100);
  });

  it('detects import ordering rule', () => {
    const linter = detectLinter(path.join(fixtures, 'nextjs-app'));
    expect(linter?.rules.importOrder).toBe('enforced');
  });

  it('returns null for react-vite with no linter config file', () => {
    const linter = detectLinter(path.join(fixtures, 'react-vite'));
    expect(linter).toBeNull();
  });

  it('returns null for empty project', () => {
    const linter = detectLinter(path.join(fixtures, 'empty'));
    expect(linter).toBeNull();
  });
});
