import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectFormatter } from '../../src/detectors/formatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectFormatter', () => {
  it('detects Prettier in nextjs-app', () => {
    const fmt = detectFormatter(path.join(fixtures, 'nextjs-app'));
    expect(fmt?.name).toBe('Prettier');
    expect(fmt?.configFile).toBe('.prettierrc.json');
  });

  it('extracts semicolons setting from .prettierrc.json', () => {
    const fmt = detectFormatter(path.join(fixtures, 'nextjs-app'));
    expect(fmt?.options.semi).toBe(true);
  });

  it('extracts single quote setting', () => {
    const fmt = detectFormatter(path.join(fixtures, 'nextjs-app'));
    expect(fmt?.options.singleQuote).toBe(true);
  });

  it('extracts tab width', () => {
    const fmt = detectFormatter(path.join(fixtures, 'nextjs-app'));
    expect(fmt?.options.tabWidth).toBe(2);
  });

  it('extracts print width', () => {
    const fmt = detectFormatter(path.join(fixtures, 'nextjs-app'));
    expect(fmt?.options.printWidth).toBe(100);
  });

  it('returns null for empty project', () => {
    const fmt = detectFormatter(path.join(fixtures, 'empty'));
    expect(fmt).toBeNull();
  });

  it('detects Prettier from devDependencies when no config file exists', () => {
    const fmt = detectFormatter(path.join(fixtures, 'react-vite'));
    expect(fmt).toBeNull();
  });
});
