import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectCrossPlatform } from '../../src/detectors/cross-platform.js';

let tmpDir: string;
beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rulegen-xp-')); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

describe('detectCrossPlatform', () => {
  it('returns null for plain JS project', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ dependencies: { react: '^18' } }));
    expect(detectCrossPlatform(tmpDir)).toBeNull();
  });

  it('detects React Native from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { 'react-native': '0.73.0', react: '18.0.0' },
    }));
    const result = detectCrossPlatform(tmpDir);
    expect(result?.framework).toBe('react-native');
    expect(result?.hasiOS).toBe(false);
    expect(result?.hasAndroid).toBe(false);
  });

  it('detects Expo from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { expo: '~50.0.0', 'react-native': '0.73.0' },
    }));
    const result = detectCrossPlatform(tmpDir);
    expect(result?.framework).toBe('expo');
  });

  it('detects React Native with ios/ and android/ dirs', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { 'react-native': '0.73.0' },
    }));
    fs.mkdirSync(path.join(tmpDir, 'ios'));
    fs.mkdirSync(path.join(tmpDir, 'android'));
    const result = detectCrossPlatform(tmpDir);
    expect(result?.hasiOS).toBe(true);
    expect(result?.hasAndroid).toBe(true);
  });

  it('detects react-native-web as hasWeb', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { 'react-native': '0.73.0', 'react-native-web': '0.19.0' },
    }));
    const result = detectCrossPlatform(tmpDir);
    expect(result?.hasWeb).toBe(true);
  });

  it('detects Flutter from pubspec.yaml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pubspec.yaml'), 'name: myapp\nflutter:\n  uses-material-design: true\n');
    const result = detectCrossPlatform(tmpDir);
    expect(result?.framework).toBe('flutter');
  });

  it('detects Flutter with platform dirs', () => {
    fs.writeFileSync(path.join(tmpDir, 'pubspec.yaml'), 'flutter:\n');
    fs.mkdirSync(path.join(tmpDir, 'ios'));
    fs.mkdirSync(path.join(tmpDir, 'android'));
    fs.mkdirSync(path.join(tmpDir, 'web'));
    fs.mkdirSync(path.join(tmpDir, 'macos'));
    const result = detectCrossPlatform(tmpDir);
    expect(result?.hasiOS).toBe(true);
    expect(result?.hasAndroid).toBe(true);
    expect(result?.hasWeb).toBe(true);
    expect(result?.hasDesktop).toBe(true);
  });

  it('detects KMP from build.gradle.kts with multiplatform', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle.kts'),
      'plugins { kotlin("multiplatform") }\nkotlin { iosArm64(); android() }\n');
    const result = detectCrossPlatform(tmpDir);
    expect(result?.framework).toBe('kmp');
    expect(result?.hasiOS).toBe(true);
    expect(result?.hasAndroid).toBe(true);
  });

  it('returns null for empty project', () => {
    expect(detectCrossPlatform(tmpDir)).toBeNull();
  });
});
