import fs from 'fs';

const AUTO_START_MARKER = '<!-- rulegen:auto -->';
const AUTO_END_MARKER = '<!-- rulegen:end -->';
const CUSTOM_START_MARKER = '<!-- rulegen:custom -->';

export function mergeWithExisting(newContent: string, existingPath: string): string {
  let existing: string | null = null;
  try {
    existing = fs.readFileSync(existingPath, 'utf-8');
  } catch {
    return wrapAutoContent(newContent);
  }

  if (!existing.includes(AUTO_START_MARKER)) {
    return wrapAutoContent(newContent);
  }

  const autoStart = existing.indexOf(AUTO_START_MARKER);
  const autoEnd = existing.indexOf(AUTO_END_MARKER);

  if (autoStart === -1 || autoEnd === -1) {
    return wrapAutoContent(newContent);
  }

  const before = existing.slice(0, autoStart).trimEnd();
  const after = existing.slice(autoEnd + AUTO_END_MARKER.length).trimStart();

  const parts: string[] = [];

  if (before) parts.push(before);
  parts.push(`${AUTO_START_MARKER}\n${newContent.trim()}\n${AUTO_END_MARKER}`);
  if (after) parts.push(after);

  return parts.join('\n\n');
}

export function extractCustomContent(existingPath: string): string | null {
  try {
    const content = fs.readFileSync(existingPath, 'utf-8');
    const start = content.indexOf(CUSTOM_START_MARKER);
    if (start === -1) return null;
    return content.slice(start + CUSTOM_START_MARKER.length).trim();
  } catch {
    return null;
  }
}

function wrapAutoContent(content: string): string {
  return `${AUTO_START_MARKER}\n${content.trim()}\n${AUTO_END_MARKER}`;
}
