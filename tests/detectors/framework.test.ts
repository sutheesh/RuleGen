import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectFrameworks } from '../../src/detectors/framework.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectFrameworks', () => {
  it('detects Next.js in nextjs-app fixture', () => {
    const fws = detectFrameworks(path.join(fixtures, 'nextjs-app'));
    const next = fws.find(f => f.name === 'Next.js');
    expect(next).toBeDefined();
    expect(next?.detectedFrom).toBe('package.json');
  });

  it('detects React in nextjs-app fixture', () => {
    const fws = detectFrameworks(path.join(fixtures, 'nextjs-app'));
    const react = fws.find(f => f.name === 'React');
    expect(react).toBeDefined();
  });

  it('detects React and Vite in react-vite fixture', () => {
    const fws = detectFrameworks(path.join(fixtures, 'react-vite'));
    const react = fws.find(f => f.name === 'React');
    const vite = fws.find(f => f.name === 'Vite');
    expect(react).toBeDefined();
    expect(vite).toBeDefined();
  });

  it('detects Express in express-api fixture', () => {
    const fws = detectFrameworks(path.join(fixtures, 'express-api'));
    const express = fws.find(f => f.name === 'Express');
    expect(express).toBeDefined();
  });

  it('returns empty array for empty project', () => {
    const fws = detectFrameworks(path.join(fixtures, 'empty'));
    expect(fws).toHaveLength(0);
  });

  it('does not duplicate frameworks', () => {
    const fws = detectFrameworks(path.join(fixtures, 'nextjs-app'));
    const names = fws.map(f => f.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  });

  it('includes version info from package.json', () => {
    const fws = detectFrameworks(path.join(fixtures, 'nextjs-app'));
    const next = fws.find(f => f.name === 'Next.js');
    expect(next?.version).toBe('14.2.0');
  });
});
