import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectMonorepo } from '../../src/detectors/monorepo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectMonorepo', () => {
  it('detects turborepo in monorepo fixture', () => {
    const monorepo = detectMonorepo(path.join(fixtures, 'monorepo'));
    expect(monorepo?.tool).toBe('turborepo');
    expect(monorepo?.configFile).toBe('turbo.json');
  });

  it('lists packages in monorepo', () => {
    const monorepo = detectMonorepo(path.join(fixtures, 'monorepo'));
    expect(monorepo?.packages.length).toBeGreaterThan(0);
  });

  it('returns null for non-monorepo project', () => {
    const monorepo = detectMonorepo(path.join(fixtures, 'nextjs-app'));
    expect(monorepo).toBeNull();
  });

  it('returns null for empty project', () => {
    const monorepo = detectMonorepo(path.join(fixtures, 'empty'));
    expect(monorepo).toBeNull();
  });
});
