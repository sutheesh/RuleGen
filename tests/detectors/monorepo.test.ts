import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectMonorepo } from '../../src/detectors/monorepo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

let tmpDir: string;
beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rulegen-mono-')); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

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

  it('detects pnpm-workspaces from pnpm-workspace.yaml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n  - "apps/*"\n  - "packages/*"\n');
    fs.mkdirSync(path.join(tmpDir, 'apps', 'web'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'apps', 'web', 'package.json'), '{"name":"web"}');
    const monorepo = detectMonorepo(tmpDir);
    expect(monorepo?.tool).toBe('pnpm-workspaces');
    expect(monorepo?.configFile).toBe('pnpm-workspace.yaml');
  });

  it('detects lerna monorepo from lerna.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'lerna.json'), JSON.stringify({ packages: ['packages/*'], version: '0.0.0' }));
    fs.mkdirSync(path.join(tmpDir, 'packages', 'core'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'packages', 'core', 'package.json'), '{"name":"core"}');
    const monorepo = detectMonorepo(tmpDir);
    expect(monorepo?.tool).toBe('lerna');
    expect(monorepo?.configFile).toBe('lerna.json');
  });

  it('detects npm workspaces from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }));
    fs.mkdirSync(path.join(tmpDir, 'packages', 'lib'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'packages', 'lib', 'package.json'), '{"name":"lib"}');
    const monorepo = detectMonorepo(tmpDir);
    expect(monorepo?.tool).toBe('npm-workspaces');
  });

  it('detects yarn workspaces from package.json with yarn.lock', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ workspaces: ['packages/*'] }));
    fs.writeFileSync(path.join(tmpDir, 'yarn.lock'), '');
    const monorepo = detectMonorepo(tmpDir);
    expect(monorepo?.tool).toBe('yarn-workspaces');
  });
});
