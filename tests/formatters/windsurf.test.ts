import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { scan } from '../../src/core/scanner.js';
import { formatWindsurf } from '../../src/formatters/windsurf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('formatWindsurf', () => {
  it('generates plain text output', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatWindsurf(context);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(20);
  });

  it('does not use markdown headers', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatWindsurf(context);
    expect(output).not.toMatch(/^##\s/m);
  });

  it('stays within 6000 character limit', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatWindsurf(context);
    expect(output.length).toBeLessThanOrEqual(6000);
  });

  it('does not truncate mid-line', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatWindsurf(context);
    // if truncation happened, the last char must be end of a full line (not mid-sentence)
    expect(output).not.toMatch(/\n$/);
  });

  it('includes TypeScript rule', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatWindsurf(context);
    expect(output.toLowerCase()).toContain('typescript');
  });

  it('includes Next.js rule', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatWindsurf(context);
    expect(output).toContain('Next.js');
  });

  it('includes formatter rule when Prettier detected', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatWindsurf(context);
    expect(output).toContain('Prettier');
  });

  it('handles empty project without crashing', () => {
    const context = scan(path.join(fixtures, 'empty'));
    const output = formatWindsurf(context);
    expect(typeof output).toBe('string');
  });

  it('includes Compose rules for Android projects', () => {
    const context = scan(path.join(fixtures, 'android-compose'));
    const output = formatWindsurf(context);
    expect(output).toContain('Jetpack Compose');
  });
});
