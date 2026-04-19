import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectFormatter } from '../../src/detectors/formatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

let tmpDir: string;
beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rulegen-fmt-')); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

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

  it('detects Biome from biome.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'biome.json'), JSON.stringify({
      formatter: { lineWidth: 100, indentWidth: 2, indentStyle: 'space' },
    }));
    const fmt = detectFormatter(tmpDir);
    expect(fmt?.name).toBe('Biome');
    expect(fmt?.options.printWidth).toBe(100);
    expect(fmt?.options.tabWidth).toBe(2);
    expect(fmt?.options.useTabs).toBe(false);
  });

  it('detects Biome with tab indentation', () => {
    fs.writeFileSync(path.join(tmpDir, 'biome.json'), JSON.stringify({
      formatter: { indentStyle: 'tab' },
    }));
    const fmt = detectFormatter(tmpDir);
    expect(fmt?.name).toBe('Biome');
    expect(fmt?.options.useTabs).toBe(true);
  });

  it('detects Black from pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[tool.black]\nline-length = 88\n');
    const fmt = detectFormatter(tmpDir);
    expect(fmt?.name).toBe('Black');
    expect(fmt?.options.printWidth).toBe(88);
  });

  it('detects EditorConfig when no other formatter found', () => {
    fs.writeFileSync(path.join(tmpDir, '.editorconfig'), 'indent_style = space\nindent_size = 4\n');
    const fmt = detectFormatter(tmpDir);
    expect(fmt?.name).toBe('EditorConfig');
    expect(fmt?.options.useTabs).toBe(false);
    expect(fmt?.options.tabWidth).toBe(4);
  });

  it('detects Prettier from package.json prettier field', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      prettier: { semi: false, singleQuote: true, tabWidth: 2, printWidth: 120 },
    }));
    const fmt = detectFormatter(tmpDir);
    expect(fmt?.name).toBe('Prettier');
    expect(fmt?.options.semi).toBe(false);
    expect(fmt?.options.printWidth).toBe(120);
  });
});
