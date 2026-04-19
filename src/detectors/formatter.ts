import fs from 'fs';
import path from 'path';
import type { FormatterInfo, FormatterOptions } from '../types.js';

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function exists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseJsonSafe<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

interface PrettierConfig {
  semi?: boolean;
  singleQuote?: boolean;
  tabWidth?: number;
  useTabs?: boolean;
  trailingComma?: string;
  printWidth?: number;
}

function parsePrettierConfig(content: string, isJson: boolean): FormatterOptions {
  const opts: FormatterOptions = {
    semi: null,
    singleQuote: null,
    tabWidth: null,
    useTabs: null,
    trailingComma: null,
    printWidth: null,
  };

  if (isJson) {
    const parsed = parseJsonSafe<PrettierConfig>(content);
    if (parsed) {
      if (parsed.semi !== undefined) opts.semi = parsed.semi;
      if (parsed.singleQuote !== undefined) opts.singleQuote = parsed.singleQuote;
      if (parsed.tabWidth !== undefined) opts.tabWidth = parsed.tabWidth;
      if (parsed.useTabs !== undefined) opts.useTabs = parsed.useTabs;
      if (parsed.trailingComma !== undefined) opts.trailingComma = parsed.trailingComma;
      if (parsed.printWidth !== undefined) opts.printWidth = parsed.printWidth;
    }
  } else {
    const semiMatch = /semi:\s*(true|false)/.exec(content);
    if (semiMatch?.[1]) opts.semi = semiMatch[1] === 'true';

    const sqMatch = /singleQuote:\s*(true|false)/.exec(content);
    if (sqMatch?.[1]) opts.singleQuote = sqMatch[1] === 'true';

    const tabMatch = /tabWidth:\s*(\d+)/.exec(content);
    if (tabMatch?.[1]) opts.tabWidth = parseInt(tabMatch[1], 10);

    const trailMatch = /trailingComma:\s*["']?(\w+)["']?/.exec(content);
    if (trailMatch?.[1]) opts.trailingComma = trailMatch[1];

    const printMatch = /printWidth:\s*(\d+)/.exec(content);
    if (printMatch?.[1]) opts.printWidth = parseInt(printMatch[1], 10);
  }

  return opts;
}

function parseEditorConfig(content: string): FormatterOptions {
  const opts: FormatterOptions = {
    semi: null,
    singleQuote: null,
    tabWidth: null,
    useTabs: null,
    trailingComma: null,
    printWidth: null,
  };

  const indentStyle = /indent_style\s*=\s*(\w+)/.exec(content);
  if (indentStyle?.[1]) opts.useTabs = indentStyle[1] === 'tab';

  const indentSize = /indent_size\s*=\s*(\d+)/.exec(content);
  if (indentSize?.[1]) opts.tabWidth = parseInt(indentSize[1], 10);

  const maxLine = /max_line_length\s*=\s*(\d+)/.exec(content);
  if (maxLine?.[1]) opts.printWidth = parseInt(maxLine[1], 10);

  return opts;
}

export function detectFormatter(rootDir: string): FormatterInfo | null {
  const prettierFiles = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.mjs',
    '.prettierrc.yaml',
    '.prettierrc.yml',
    'prettier.config.js',
    'prettier.config.cjs',
    'prettier.config.mjs',
    'prettier.config.ts',
  ];

  for (const pf of prettierFiles) {
    const content = readFileSafe(path.join(rootDir, pf));
    if (content) {
      const isJson = pf.endsWith('.json') || pf === '.prettierrc';
      return {
        name: 'Prettier',
        configFile: pf,
        options: parsePrettierConfig(content, isJson),
      };
    }
  }

  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (pkgContent) {
    const pkg = parseJsonSafe<{ prettier?: PrettierConfig; devDependencies?: Record<string, string>; dependencies?: Record<string, string> }>(pkgContent);
    if (pkg?.prettier) {
      return {
        name: 'Prettier',
        configFile: 'package.json',
        options: {
          semi: pkg.prettier.semi ?? null,
          singleQuote: pkg.prettier.singleQuote ?? null,
          tabWidth: pkg.prettier.tabWidth ?? null,
          useTabs: pkg.prettier.useTabs ?? null,
          trailingComma: pkg.prettier.trailingComma ?? null,
          printWidth: pkg.prettier.printWidth ?? null,
        },
      };
    }

    const allDeps = { ...pkg?.dependencies, ...pkg?.devDependencies };
    if ('prettier' in allDeps) {
      return {
        name: 'Prettier',
        configFile: 'package.json',
        options: { semi: null, singleQuote: null, tabWidth: null, useTabs: null, trailingComma: null, printWidth: null },
      };
    }
  }

  const biomeFiles = ['biome.json', 'biome.jsonc'];
  for (const bf of biomeFiles) {
    const content = readFileSafe(path.join(rootDir, bf));
    if (content) {
      interface BiomeConfig {
        formatter?: { lineWidth?: number; indentWidth?: number; indentStyle?: string };
      }
      const parsed = parseJsonSafe<BiomeConfig>(content);
      return {
        name: 'Biome',
        configFile: bf,
        options: {
          semi: null,
          singleQuote: null,
          tabWidth: parsed?.formatter?.indentWidth ?? null,
          useTabs: parsed?.formatter?.indentStyle === 'tab',
          trailingComma: null,
          printWidth: parsed?.formatter?.lineWidth ?? null,
        },
      };
    }
  }

  const pyproject = readFileSafe(path.join(rootDir, 'pyproject.toml'));
  if (pyproject?.includes('[tool.black]')) {
    const lineMatch = /line-length\s*=\s*(\d+)/.exec(pyproject);
    return {
      name: 'Black',
      configFile: 'pyproject.toml',
      options: {
        semi: null,
        singleQuote: null,
        tabWidth: null,
        useTabs: null,
        trailingComma: null,
        printWidth: lineMatch?.[1] ? parseInt(lineMatch[1], 10) : null,
      },
    };
  }

  if (exists(path.join(rootDir, '.editorconfig'))) {
    const content = readFileSafe(path.join(rootDir, '.editorconfig')) ?? '';
    return {
      name: 'EditorConfig',
      configFile: '.editorconfig',
      options: parseEditorConfig(content),
    };
  }

  return null;
}
