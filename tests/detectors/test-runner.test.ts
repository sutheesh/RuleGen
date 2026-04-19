import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectTestRunner, getTestPattern, getTestLocation } from '../../src/detectors/test-runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectTestRunner', () => {
  it('detects Vitest from config file in nextjs-app', () => {
    const runner = detectTestRunner(path.join(fixtures, 'nextjs-app'));
    expect(runner?.name).toBe('Vitest');
    expect(runner?.configFile).toBe('vitest.config.ts');
  });

  it('detects Vitest from devDependencies in react-vite', () => {
    const runner = detectTestRunner(path.join(fixtures, 'react-vite'));
    expect(runner?.name).toBe('Vitest');
  });

  it('detects Jest from config file in express-api', () => {
    const runner = detectTestRunner(path.join(fixtures, 'express-api'));
    expect(runner?.name).toBe('Jest');
    expect(runner?.configFile).toBe('jest.config.ts');
  });

  it('returns null for empty project', () => {
    const runner = detectTestRunner(path.join(fixtures, 'empty'));
    expect(runner).toBeNull();
  });

  it('includes run command', () => {
    const runner = detectTestRunner(path.join(fixtures, 'nextjs-app'));
    expect(runner?.command).toBe('vitest');
  });
});

describe('getTestPattern', () => {
  it('returns correct pattern for Vitest', () => {
    const pattern = getTestPattern('', 'Vitest');
    expect(pattern).toBe('**/*.{test,spec}.{ts,tsx,js,jsx}');
  });

  it('returns correct pattern for Jest', () => {
    const pattern = getTestPattern('', 'Jest');
    expect(pattern).toBe('**/*.{test,spec}.{ts,tsx,js,jsx}');
  });

  it('returns correct pattern for pytest', () => {
    const pattern = getTestPattern('', 'pytest');
    expect(pattern).toBe('test_*.py | *_test.py');
  });

  it('returns null for unknown runner', () => {
    const pattern = getTestPattern('', 'UnknownRunner');
    expect(pattern).toBeNull();
  });
});

describe('getTestLocation', () => {
  it('detects tests/ directory', () => {
    const loc = getTestLocation(path.join(fixtures, 'express-api'));
    expect(loc).toBe('tests/');
  });

  it('returns null for empty project', () => {
    const loc = getTestLocation(path.join(fixtures, 'empty'));
    expect(loc).toBeNull();
  });
});
