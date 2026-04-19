import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectLinter } from '../../src/detectors/linter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

let tmpDir: string;
beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rulegen-lint-')); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

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

  it('detects Ruff from pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'),
      '[tool.ruff]\nline-length = 120\nselect = ["I"]\n');
    const linter = detectLinter(tmpDir);
    expect(linter?.name).toBe('Ruff');
    expect(linter?.rules.maxLineLength).toBe(120);
  });

  it('detects Ruff import order from isort section', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'),
      '[tool.ruff]\n[tool.ruff.isort]\nknown_first_party = ["myapp"]\n');
    const linter = detectLinter(tmpDir);
    expect(linter?.name).toBe('Ruff');
    expect(linter?.rules.importOrder).toBe('enforced');
  });

  it('detects Flake8 from pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[tool.flake8]\nmax-line-length = 79\n');
    const linter = detectLinter(tmpDir);
    expect(linter?.name).toBe('Flake8');
  });

  it('detects golangci-lint from .golangci.yml', () => {
    fs.writeFileSync(path.join(tmpDir, '.golangci.yml'), 'linters:\n  enable:\n    - gofmt\n');
    const linter = detectLinter(tmpDir);
    expect(linter?.name).toBe('golangci-lint');
    expect(linter?.configFile).toBe('.golangci.yml');
  });

  it('detects SwiftLint from ios fixture', () => {
    const linter = detectLinter(path.join(fixtures, 'ios-swiftui'));
    expect(linter?.name).toBe('SwiftLint');
  });

  it('detects Detekt from detekt.yml', () => {
    fs.writeFileSync(path.join(tmpDir, 'detekt.yml'), 'complexity:\n  LongMethod:\n    threshold: 60\n');
    const linter = detectLinter(tmpDir);
    expect(linter?.name).toBe('Detekt');
    expect(linter?.configFile).toBe('detekt.yml');
  });

  it('detects rustfmt from rustfmt.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'rustfmt.toml'), 'max_width = 100\n');
    const linter = detectLinter(tmpDir);
    expect(linter?.name).toBe('rustfmt');
    expect(linter?.configFile).toBe('rustfmt.toml');
  });

  it('detects Flake8 from .flake8 file alongside pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[build-system]\n');
    fs.writeFileSync(path.join(tmpDir, '.flake8'), '[flake8]\nmax-line-length = 79\n');
    const linter = detectLinter(tmpDir);
    expect(linter?.name).toBe('Flake8');
    expect(linter?.configFile).toBe('.flake8');
  });
});
