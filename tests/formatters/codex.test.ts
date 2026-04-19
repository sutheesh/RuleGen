import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { scan } from '../../src/core/scanner.js';
import { formatCodex } from '../../src/formatters/codex.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('formatCodex', () => {
  it('generates markdown output', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCodex(context);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(50);
  });

  it('uses ## section headings', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCodex(context);
    expect(output).toMatch(/^## /m);
  });

  it('includes TypeScript rule', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCodex(context);
    expect(output.toLowerCase()).toContain('typescript');
  });

  it('includes Next.js App Router rule', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCodex(context);
    expect(output).toContain('App Router');
  });

  it('includes formatter when Prettier detected', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCodex(context);
    expect(output).toContain('Prettier');
  });

  it('includes test runner when Vitest detected', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCodex(context);
    expect(output).toContain('Vitest');
  });

  it('includes Jetpack Compose rules for Android projects', () => {
    const context = scan(path.join(fixtures, 'android-compose'));
    const output = formatCodex(context);
    expect(output).toContain('Jetpack Compose');
  });

  it('includes SwiftUI rules for iOS projects', () => {
    const context = scan(path.join(fixtures, 'ios-swiftui'));
    const output = formatCodex(context);
    expect(output).toContain('SwiftUI');
  });

  it('handles empty project without crashing', () => {
    const context = scan(path.join(fixtures, 'empty'));
    const output = formatCodex(context);
    expect(typeof output).toBe('string');
  });

  it('formats bullet points correctly', () => {
    const context = scan(path.join(fixtures, 'nextjs-app'));
    const output = formatCodex(context);
    expect(output).toMatch(/^- /m);
  });
});
