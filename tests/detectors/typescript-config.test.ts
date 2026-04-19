import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectTypeScriptConfig } from '../../src/detectors/typescript-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectTypeScriptConfig', () => {
  it('detects strict mode in nextjs-app', () => {
    const ts = detectTypeScriptConfig(path.join(fixtures, 'nextjs-app'));
    expect(ts?.strict).toBe(true);
  });

  it('detects path aliases in nextjs-app', () => {
    const ts = detectTypeScriptConfig(path.join(fixtures, 'nextjs-app'));
    expect(ts?.pathAliases).toBeDefined();
    expect(Object.keys(ts?.pathAliases ?? {}).length).toBeGreaterThan(0);
  });

  it('detects target in nextjs-app', () => {
    const ts = detectTypeScriptConfig(path.join(fixtures, 'nextjs-app'));
    expect(ts?.target).toBe('ES2017');
  });

  it('detects strict mode in react-vite', () => {
    const ts = detectTypeScriptConfig(path.join(fixtures, 'react-vite'));
    expect(ts?.strict).toBe(true);
  });

  it('returns null for empty project', () => {
    const ts = detectTypeScriptConfig(path.join(fixtures, 'empty'));
    expect(ts).toBeNull();
  });

  it('derives strictNullChecks from strict: true', () => {
    const ts = detectTypeScriptConfig(path.join(fixtures, 'nextjs-app'));
    expect(ts?.strictNullChecks).toBe(true);
  });
});
