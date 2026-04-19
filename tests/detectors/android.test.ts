import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectAndroid } from '../../src/detectors/android.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectAndroid', () => {
  it('detects Android project from build.gradle.kts', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android).not.toBeNull();
  });

  it('reads compileSdk', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.compileSdk).toBe(34);
  });

  it('reads minSdk', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.minSdk).toBe(26);
  });

  it('reads targetSdk', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.targetSdk).toBe(34);
  });

  it('detects Jetpack Compose UI framework', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.uiFramework).toBe('compose');
  });

  it('detects Hilt as DI', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.di).toBe('hilt');
  });

  it('detects Room as database', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.database).toBe('room');
  });

  it('detects Retrofit as networking', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.networking).toBe('retrofit');
  });

  it('detects MVVM architecture from ViewModel usage', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.architecture).toBe('mvvm');
  });

  it('lists modules from settings.gradle.kts', () => {
    const android = detectAndroid(path.join(fixtures, 'android-compose'));
    expect(android?.modules).toContain(':app');
    expect(android?.modules.length).toBeGreaterThan(1);
  });

  it('returns null for non-Android project', () => {
    const android = detectAndroid(path.join(fixtures, 'nextjs-app'));
    expect(android).toBeNull();
  });

  it('returns null for empty project', () => {
    const android = detectAndroid(path.join(fixtures, 'empty'));
    expect(android).toBeNull();
  });
});
