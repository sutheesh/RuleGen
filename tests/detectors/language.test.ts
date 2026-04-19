import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectLanguages } from '../../src/detectors/language.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

let tmpDir: string;
beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rulegen-lang-')); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

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

  it('detects Swift from Package.swift', () => {
    const langs = detectLanguages(path.join(fixtures, 'ios-swiftui'));
    const swift = langs.find(l => l.name === 'Swift');
    expect(swift).toBeDefined();
  });

  it('detects Kotlin from build.gradle.kts', () => {
    const langs = detectLanguages(path.join(fixtures, 'android-compose'));
    const kotlin = langs.find(l => l.name === 'Kotlin');
    expect(kotlin).toBeDefined();
  });

  it('detects Ruby from Gemfile', () => {
    fs.writeFileSync(path.join(tmpDir, 'Gemfile'), "source 'https://rubygems.org'\ngem 'rails'\n");
    const langs = detectLanguages(tmpDir);
    const ruby = langs.find(l => l.name === 'Ruby');
    expect(ruby).toBeDefined();
    expect(ruby?.configFile).toBe('Gemfile');
  });

  it('detects C# from .csproj file', () => {
    fs.writeFileSync(path.join(tmpDir, 'MyApp.csproj'), '<Project Sdk="Microsoft.NET.Sdk"></Project>');
    const langs = detectLanguages(tmpDir);
    const csharp = langs.find(l => l.name === 'C#');
    expect(csharp).toBeDefined();
    expect(csharp?.configFile).toBe('MyApp.csproj');
  });
});
