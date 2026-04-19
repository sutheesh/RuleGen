import fs from 'fs';
import path from 'path';
import type { LinterInfo, LinterRules } from '../types.js';

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

interface EslintConfig {
  rules?: Record<string, unknown>;
}

function parseEslintRules(content: string, isJson: boolean): LinterRules {
  const rules: LinterRules = {
    noAny: null,
    noUnusedVars: null,
    importOrder: null,
    namingConvention: null,
    maxLineLength: null,
    customRules: [],
  };

  if (isJson) {
    const parsed = parseJsonSafe<EslintConfig>(content);
    if (parsed?.rules) {
      const r = parsed.rules;

      if ('@typescript-eslint/no-explicit-any' in r || 'no-explicit-any' in r) {
        const val = r['@typescript-eslint/no-explicit-any'] ?? r['no-explicit-any'];
        rules.noAny = val !== 'off' && val !== 0;
      }

      if ('@typescript-eslint/no-unused-vars' in r || 'no-unused-vars' in r) {
        const val = r['@typescript-eslint/no-unused-vars'] ?? r['no-unused-vars'];
        rules.noUnusedVars = val !== 'off' && val !== 0;
      }

      if ('import/order' in r || 'import-x/order' in r) {
        rules.importOrder = 'enforced';
      }

      if ('max-len' in r) {
        const val = r['max-len'];
        if (typeof val === 'number') rules.maxLineLength = val;
        else if (Array.isArray(val) && typeof val[1] === 'number') rules.maxLineLength = val[1];
        else if (Array.isArray(val) && typeof val[1] === 'object' && val[1] !== null) {
          const obj = val[1] as Record<string, unknown>;
          if (typeof obj['code'] === 'number') rules.maxLineLength = obj['code'];
        }
      }

      const customRuleKeys = Object.keys(parsed.rules).filter(k => {
        const knownRules = ['@typescript-eslint/no-explicit-any', 'no-explicit-any',
          '@typescript-eslint/no-unused-vars', 'no-unused-vars', 'import/order',
          'import-x/order', 'max-len'];
        return !knownRules.includes(k) && parsed.rules![k] !== 'off' && parsed.rules![k] !== 0;
      });
      rules.customRules = customRuleKeys.slice(0, 10);
    }
  } else {
    if (/no-explicit-any/.test(content)) rules.noAny = true;
    if (/no-unused-vars/.test(content)) rules.noUnusedVars = true;
    if (/import\/order/.test(content)) rules.importOrder = 'enforced';
    const maxLenMatch = /max-len.*?(\d{2,3})/.exec(content);
    if (maxLenMatch?.[1]) rules.maxLineLength = parseInt(maxLenMatch[1], 10);
  }

  return rules;
}

function parseBiomeRules(content: string): LinterRules {
  const rules: LinterRules = {
    noAny: null,
    noUnusedVars: null,
    importOrder: null,
    namingConvention: null,
    maxLineLength: null,
    customRules: [],
  };

  interface BiomeConfig {
    formatter?: { lineWidth?: number };
    linter?: { rules?: { suspicious?: { noExplicitAny?: string }; correctness?: { noUnusedVariables?: string } } };
    organizeImports?: { enabled?: boolean };
  }

  const parsed = parseJsonSafe<BiomeConfig>(content);
  if (parsed) {
    if (parsed.formatter?.lineWidth) rules.maxLineLength = parsed.formatter.lineWidth;
    if (parsed.linter?.rules?.suspicious?.noExplicitAny) {
      rules.noAny = parsed.linter.rules.suspicious.noExplicitAny !== 'off';
    }
    if (parsed.linter?.rules?.correctness?.noUnusedVariables) {
      rules.noUnusedVars = parsed.linter.rules.correctness.noUnusedVariables !== 'off';
    }
    if (parsed.organizeImports?.enabled !== false) {
      rules.importOrder = 'enforced';
    }
  }

  return rules;
}

function findEslintConfig(rootDir: string): { file: string; content: string } | null {
  const configs = [
    '.eslintrc.json',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    '.eslintrc',
    'eslint.config.js',
    'eslint.config.ts',
    'eslint.config.mjs',
    'eslint.config.cjs',
  ];

  for (const cfg of configs) {
    const fullPath = path.join(rootDir, cfg);
    const content = readFileSafe(fullPath);
    if (content) return { file: cfg, content };
  }

  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (pkgContent) {
    const pkg = parseJsonSafe<{ eslintConfig?: unknown }>(pkgContent);
    if (pkg?.eslintConfig) {
      return { file: 'package.json', content: JSON.stringify({ rules: (pkg.eslintConfig as EslintConfig).rules }) };
    }
  }

  return null;
}

export function detectLinter(rootDir: string): LinterInfo | null {
  const eslint = findEslintConfig(rootDir);
  if (eslint) {
    const isJson = eslint.file.endsWith('.json') || eslint.file === '.eslintrc' || eslint.file === 'package.json';
    return {
      name: 'ESLint',
      configFile: eslint.file,
      rules: parseEslintRules(eslint.content, isJson),
    };
  }

  const biomeFiles = ['biome.json', 'biome.jsonc'];
  for (const bf of biomeFiles) {
    const content = readFileSafe(path.join(rootDir, bf));
    if (content) {
      return {
        name: 'Biome',
        configFile: bf,
        rules: parseBiomeRules(content),
      };
    }
  }

  if (exists(path.join(rootDir, '.swiftlint.yml'))) {
    const content = readFileSafe(path.join(rootDir, '.swiftlint.yml')) ?? '';
    const maxLineMatch = /line_length:\s*(\d+)/.exec(content);
    return {
      name: 'SwiftLint',
      configFile: '.swiftlint.yml',
      rules: {
        noAny: null,
        noUnusedVars: null,
        importOrder: /sorted_imports/.test(content) ? 'enforced' : null,
        namingConvention: null,
        maxLineLength: maxLineMatch?.[1] ? parseInt(maxLineMatch[1], 10) : null,
        customRules: [],
      },
    };
  }

  if (exists(path.join(rootDir, 'detekt.yml'))) {
    return {
      name: 'Detekt',
      configFile: 'detekt.yml',
      rules: {
        noAny: null,
        noUnusedVars: null,
        importOrder: null,
        namingConvention: null,
        maxLineLength: null,
        customRules: [],
      },
    };
  }

  const rustfmtFiles = ['rustfmt.toml', '.rustfmt.toml'];
  for (const rf of rustfmtFiles) {
    if (exists(path.join(rootDir, rf))) {
      return {
        name: 'rustfmt',
        configFile: rf,
        rules: {
          noAny: null,
          noUnusedVars: null,
          importOrder: null,
          namingConvention: null,
          maxLineLength: null,
          customRules: [],
        },
      };
    }
  }

  const pyproject = readFileSafe(path.join(rootDir, 'pyproject.toml'));
  if (pyproject) {
    if (pyproject.includes('[tool.ruff]')) {
      const maxLineMatch = /line-length\s*=\s*(\d+)/.exec(pyproject);
      return {
        name: 'Ruff',
        configFile: 'pyproject.toml',
        rules: {
          noAny: null,
          noUnusedVars: null,
          importOrder: /isort/.test(pyproject) ? 'enforced' : null,
          namingConvention: null,
          maxLineLength: maxLineMatch?.[1] ? parseInt(maxLineMatch[1], 10) : null,
          customRules: [],
        },
      };
    }

    if (pyproject.includes('[tool.flake8]') || exists(path.join(rootDir, '.flake8'))) {
      return {
        name: 'Flake8',
        configFile: pyproject.includes('[tool.flake8]') ? 'pyproject.toml' : '.flake8',
        rules: {
          noAny: null,
          noUnusedVars: null,
          importOrder: null,
          namingConvention: null,
          maxLineLength: null,
          customRules: [],
        },
      };
    }
  }

  if (exists(path.join(rootDir, '.golangci.yml')) || exists(path.join(rootDir, '.golangci.yaml'))) {
    const configFile = exists(path.join(rootDir, '.golangci.yml')) ? '.golangci.yml' : '.golangci.yaml';
    return {
      name: 'golangci-lint',
      configFile,
      rules: {
        noAny: null,
        noUnusedVars: null,
        importOrder: null,
        namingConvention: null,
        maxLineLength: null,
        customRules: [],
      },
    };
  }

  return null;
}
