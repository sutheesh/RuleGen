import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectIOS } from '../../src/detectors/ios.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, '../fixtures');

describe('detectIOS', () => {
  it('detects iOS project from Package.swift', () => {
    const ios = detectIOS(path.join(fixtures, 'ios-swiftui'));
    expect(ios).not.toBeNull();
  });

  it('reads swift tools version', () => {
    const ios = detectIOS(path.join(fixtures, 'ios-swiftui'));
    expect(ios?.swiftVersion).toBe('5.9');
  });

  it('detects SwiftUI framework from imports', () => {
    const ios = detectIOS(path.join(fixtures, 'ios-swiftui'));
    expect(ios?.uiFramework).toBe('swiftui');
  });

  it('detects SPM as package manager', () => {
    const ios = detectIOS(path.join(fixtures, 'ios-swiftui'));
    expect(ios?.packageManager).toBe('spm');
  });

  it('detects TCA architecture from ComposableArchitecture dependency', () => {
    const ios = detectIOS(path.join(fixtures, 'ios-swiftui'));
    expect(ios?.architecture).toBe('tca');
  });

  it('detects SwiftData persistence from imports', () => {
    const ios = detectIOS(path.join(fixtures, 'ios-swiftui'));
    expect(ios?.persistence).toBe('swiftdata');
  });

  it('returns null for non-iOS project', () => {
    const ios = detectIOS(path.join(fixtures, 'nextjs-app'));
    expect(ios).toBeNull();
  });

  it('returns null for empty project', () => {
    const ios = detectIOS(path.join(fixtures, 'empty'));
    expect(ios).toBeNull();
  });

  it('hasFoundationModels defaults to false when not used', () => {
    const ios = detectIOS(path.join(fixtures, 'ios-swiftui'));
    expect(ios?.hasFoundationModels).toBe(false);
  });
});
