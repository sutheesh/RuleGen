import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { mergeWithExisting, extractCustomContent } from '../../src/core/merger.js';

const AUTO_START = '<!-- rulegen:auto -->';
const AUTO_END = '<!-- rulegen:end -->';
const CUSTOM_START = '<!-- rulegen:custom -->';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rulegen-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function tmpFile(name: string, content: string): string {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('mergeWithExisting', () => {
  it('wraps content in markers when file does not exist', () => {
    const result = mergeWithExisting('# Hello', path.join(tmpDir, 'nonexistent.md'));
    expect(result).toBe(`${AUTO_START}\n# Hello\n${AUTO_END}`);
  });

  it('wraps content in markers when file has no markers', () => {
    const p = tmpFile('CLAUDE.md', '# Old content with no markers');
    const result = mergeWithExisting('# New', p);
    expect(result).toBe(`${AUTO_START}\n# New\n${AUTO_END}`);
  });

  it('replaces auto block when markers exist', () => {
    const existing = `${AUTO_START}\n# Old auto content\n${AUTO_END}`;
    const p = tmpFile('CLAUDE.md', existing);
    const result = mergeWithExisting('# New auto content', p);
    expect(result).toBe(`${AUTO_START}\n# New auto content\n${AUTO_END}`);
    expect(result).not.toContain('Old auto content');
  });

  it('preserves custom content after auto block', () => {
    const existing = [
      `${AUTO_START}\n# Old\n${AUTO_END}`,
      `${CUSTOM_START}\n## My Rules\n- Always write tests`,
    ].join('\n\n');
    const p = tmpFile('CLAUDE.md', existing);
    const result = mergeWithExisting('# New', p);
    expect(result).toContain('# New');
    expect(result).toContain('My Rules');
    expect(result).toContain('Always write tests');
    expect(result).not.toContain('Old');
  });

  it('preserves content before auto block', () => {
    const existing = `# Preamble\n\n${AUTO_START}\n# Old\n${AUTO_END}`;
    const p = tmpFile('CLAUDE.md', existing);
    const result = mergeWithExisting('# New', p);
    expect(result).toContain('Preamble');
    expect(result).toContain('# New');
  });

  it('trims whitespace inside auto block', () => {
    const p = tmpFile('CLAUDE.md', `${AUTO_START}\nold\n${AUTO_END}`);
    const result = mergeWithExisting('\n\n  # New  \n\n', p);
    expect(result).toBe(`${AUTO_START}\n# New\n${AUTO_END}`);
  });
});

describe('extractCustomContent', () => {
  it('returns null when file does not exist', () => {
    expect(extractCustomContent(path.join(tmpDir, 'missing.md'))).toBeNull();
  });

  it('returns null when no custom marker in file', () => {
    const p = tmpFile('CLAUDE.md', '# No markers here');
    expect(extractCustomContent(p)).toBeNull();
  });

  it('returns content after custom marker', () => {
    const p = tmpFile('CLAUDE.md', `${AUTO_START}\nauto\n${AUTO_END}\n\n${CUSTOM_START}\n## Team Rules\n- No raw SQL`);
    const result = extractCustomContent(p);
    expect(result).toContain('Team Rules');
    expect(result).toContain('No raw SQL');
  });

  it('trims the extracted content', () => {
    const p = tmpFile('CLAUDE.md', `${CUSTOM_START}\n\n  rule  \n\n`);
    const result = extractCustomContent(p);
    expect(result).toBe('rule');
  });
});
