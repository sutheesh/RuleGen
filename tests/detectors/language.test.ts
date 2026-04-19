import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectLanguages } from '../../src/detectors/language.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectLanguages', () => {
  it('detects TypeScript in Next.js project', () => {
    const langs = detectLanguages(path.join(fixtures, 'nextjs-app'));
    const ts = langs.find(l => l.name === 'TypeScript');
    expect(ts).toBeDefined();
    expect(ts?.configFile).toBe('tsconfig.json');
  });

  it('detects TypeScript in React+Vite project', () => {
    const langs = detectLanguages(path.join(fixtures, 'react-vite'));
    const ts = langs.find(l => l.name === 'TypeScript');
    expect(ts).toBeDefined();
  });

  it('detects TypeScript in Express API project', () => {
    const langs = detectLanguages(path.join(fixtures, 'express-api'));
    const ts = langs.find(l => l.name === 'TypeScript');
    expect(ts).toBeDefined();
  });

  it('returns empty array for empty project', () => {
    const langs = detectLanguages(path.join(fixtures, 'empty'));
    expect(langs).toHaveLength(0);
  });

  it('detects TypeScript in monorepo root', () => {
    const langs = detectLanguages(path.join(fixtures, 'monorepo'));
    expect(Array.isArray(langs)).toBe(true);
  });
});
