import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectPackageManager } from '../../src/detectors/package-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectPackageManager', () => {
  it('detects pnpm from pnpm-lock.yaml', () => {
    const pm = detectPackageManager(path.join(fixtures, 'nextjs-app'));
    expect(pm).toBe('pnpm');
  });

  it('detects npm from package-lock.json', () => {
    const pm = detectPackageManager(path.join(fixtures, 'react-vite'));
    expect(pm).toBe('npm');
  });

  it('detects npm from package-lock.json (express)', () => {
    const pm = detectPackageManager(path.join(fixtures, 'express-api'));
    expect(pm).toBe('npm');
  });

  it('detects pnpm in monorepo', () => {
    const pm = detectPackageManager(path.join(fixtures, 'monorepo'));
    expect(pm).toBe('pnpm');
  });

  it('returns null for empty project', () => {
    const pm = detectPackageManager(path.join(fixtures, 'empty'));
    expect(pm).toBeNull();
  });
});
