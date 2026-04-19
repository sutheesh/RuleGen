#!/usr/bin/env node

// src/index.ts
import fs19 from "fs";
import path18 from "path";

// src/core/scanner.ts
import fs16 from "fs";
import path16 from "path";
import crypto from "crypto";

// src/detectors/language.ts
import fs from "fs";
import path from "path";
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function extractNodeVersion(rootDir) {
  const nvmrc = readFileSafe(path.join(rootDir, ".nvmrc"));
  if (nvmrc) return nvmrc.trim().replace(/^v/, "");
  const nodeVersion = readFileSafe(path.join(rootDir, ".node-version"));
  if (nodeVersion) return nodeVersion.trim().replace(/^v/, "");
  const pkg = readFileSafe(path.join(rootDir, "package.json"));
  if (pkg) {
    const parsed = parseJsonSafe(pkg);
    if (parsed?.engines?.node) {
      const match = /[\d.]+/.exec(parsed.engines.node);
      return match?.[0] ?? null;
    }
  }
  return null;
}
function extractPythonVersion(rootDir) {
  const pyproject = readFileSafe(path.join(rootDir, "pyproject.toml"));
  if (pyproject) {
    const match = /requires-python\s*=\s*["']([^"']+)["']/.exec(pyproject);
    if (match?.[1]) return match[1].replace(/[^0-9.]/g, "");
  }
  const setup = readFileSafe(path.join(rootDir, "setup.py"));
  if (setup) {
    const match = /python_requires\s*=\s*["']([^"']+)["']/.exec(setup);
    if (match?.[1]) return match[1].replace(/[^0-9.]/g, "");
  }
  return null;
}
function extractRustEdition(rootDir) {
  const cargo = readFileSafe(path.join(rootDir, "Cargo.toml"));
  if (!cargo) return null;
  const parsed = parseCargoToml(cargo);
  return parsed?.package?.edition ?? null;
}
function parseCargoToml(content) {
  const result = { package: {} };
  const editionMatch = /edition\s*=\s*"(\d+)"/.exec(content);
  if (editionMatch?.[1] && result.package) {
    result.package.edition = editionMatch[1];
  }
  return result;
}
function extractGoVersion(rootDir) {
  const goMod = readFileSafe(path.join(rootDir, "go.mod"));
  if (!goMod) return null;
  const match = /^go\s+([\d.]+)/m.exec(goMod);
  return match?.[1] ?? null;
}
function extractSwiftVersion(rootDir) {
  const packageSwift = readFileSafe(path.join(rootDir, "Package.swift"));
  if (!packageSwift) return null;
  const match = /swift-tools-version:\s*([\d.]+)/.exec(packageSwift);
  return match?.[1] ?? null;
}
function detectLanguages(rootDir) {
  const languages = [];
  if (exists(path.join(rootDir, "tsconfig.json"))) {
    languages.push({
      name: "TypeScript",
      version: null,
      configFile: "tsconfig.json"
    });
  } else if (exists(path.join(rootDir, "package.json"))) {
    languages.push({
      name: "JavaScript",
      version: extractNodeVersion(rootDir),
      configFile: "package.json"
    });
  }
  if (exists(path.join(rootDir, "package.json")) && !languages.find((l) => l.name === "TypeScript")) {
    const nodeVersion = extractNodeVersion(rootDir);
    if (nodeVersion && !languages.find((l) => l.name === "JavaScript")) {
      languages.push({
        name: "JavaScript",
        version: nodeVersion,
        configFile: "package.json"
      });
    }
  }
  if (exists(path.join(rootDir, "Cargo.toml"))) {
    languages.push({
      name: "Rust",
      version: extractRustEdition(rootDir),
      configFile: "Cargo.toml"
    });
  }
  if (exists(path.join(rootDir, "go.mod"))) {
    languages.push({
      name: "Go",
      version: extractGoVersion(rootDir),
      configFile: "go.mod"
    });
  }
  const hasPyproject = exists(path.join(rootDir, "pyproject.toml"));
  const hasSetupPy = exists(path.join(rootDir, "setup.py"));
  const hasRequirements = exists(path.join(rootDir, "requirements.txt"));
  if (hasPyproject || hasSetupPy || hasRequirements) {
    languages.push({
      name: "Python",
      version: extractPythonVersion(rootDir),
      configFile: hasPyproject ? "pyproject.toml" : hasSetupPy ? "setup.py" : "requirements.txt"
    });
  }
  if (exists(path.join(rootDir, "Package.swift"))) {
    languages.push({
      name: "Swift",
      version: extractSwiftVersion(rootDir),
      configFile: "Package.swift"
    });
  }
  const hasGradle = exists(path.join(rootDir, "build.gradle.kts")) || exists(path.join(rootDir, "build.gradle"));
  if (hasGradle) {
    const gradleFile = exists(path.join(rootDir, "build.gradle.kts")) ? "build.gradle.kts" : "build.gradle";
    const content = readFileSafe(path.join(rootDir, gradleFile)) ?? "";
    const isKotlin = content.includes("kotlin(") || gradleFile.endsWith(".kts");
    languages.push({
      name: isKotlin ? "Kotlin" : "Java",
      version: null,
      configFile: gradleFile
    });
  }
  if (exists(path.join(rootDir, "Gemfile"))) {
    languages.push({ name: "Ruby", version: null, configFile: "Gemfile" });
  }
  const csprojFiles = fs.readdirSync(rootDir).filter((f) => f.endsWith(".csproj"));
  if (csprojFiles.length > 0 && csprojFiles[0]) {
    languages.push({ name: "C#", version: null, configFile: csprojFiles[0] });
  }
  return languages;
}

// src/detectors/framework.ts
import fs2 from "fs";
import path2 from "path";
function readFileSafe2(filePath) {
  try {
    return fs2.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists2(filePath) {
  try {
    fs2.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe2(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function getAllDeps(pkg) {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}
var JS_FRAMEWORKS = [
  { name: "Next.js", packages: ["next"], configFiles: ["next.config.js", "next.config.ts", "next.config.mjs"] },
  { name: "Nuxt", packages: ["nuxt", "nuxt3"], configFiles: ["nuxt.config.ts", "nuxt.config.js"] },
  { name: "SvelteKit", packages: ["@sveltejs/kit"], configFiles: ["svelte.config.js", "svelte.config.ts"] },
  { name: "Svelte", packages: ["svelte"] },
  { name: "Remix", packages: ["@remix-run/react", "@remix-run/node"] },
  { name: "Astro", packages: ["astro"], configFiles: ["astro.config.mjs", "astro.config.ts"] },
  { name: "Angular", packages: ["@angular/core", "@angular/common"] },
  { name: "Vue", packages: ["vue"] },
  { name: "React", packages: ["react", "react-dom"] },
  { name: "NestJS", packages: ["@nestjs/core", "@nestjs/common"] },
  { name: "Fastify", packages: ["fastify"] },
  { name: "Express", packages: ["express"] },
  { name: "Hono", packages: ["hono"] },
  { name: "Vite", packages: ["vite"], configFiles: ["vite.config.ts", "vite.config.js"] },
  { name: "Electron", packages: ["electron"] },
  { name: "Expo", packages: ["expo"] },
  { name: "React Native", packages: ["react-native"] }
];
var PYTHON_FRAMEWORKS = [
  { name: "FastAPI", packages: ["fastapi"] },
  { name: "Django", packages: ["django", "Django"] },
  { name: "Flask", packages: ["flask", "Flask"] },
  { name: "Starlette", packages: ["starlette"] }
];
function detectJsFrameworks(rootDir) {
  const pkgContent = readFileSafe2(path2.join(rootDir, "package.json"));
  if (!pkgContent) return [];
  const pkg = parseJsonSafe2(pkgContent);
  if (!pkg) return [];
  const deps = getAllDeps(pkg);
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  for (const fw of JS_FRAMEWORKS) {
    if (seen.has(fw.name)) continue;
    const matchedPkg = fw.packages.find((p) => p in deps);
    const hasConfig = fw.configFiles?.some((cf) => exists2(path2.join(rootDir, cf)));
    if (matchedPkg ?? hasConfig) {
      seen.add(fw.name);
      const version = matchedPkg ? deps[matchedPkg] ?? null : null;
      const detectedFrom = matchedPkg ? "package.json" : fw.configFiles?.find((cf) => exists2(path2.join(rootDir, cf))) ?? "package.json";
      results.push({
        name: fw.name,
        version: version?.replace(/^[\^~]/, "") ?? null,
        detectedFrom
      });
    }
  }
  return results;
}
function detectPythonFrameworks(rootDir) {
  const results = [];
  const pyproject = readFileSafe2(path2.join(rootDir, "pyproject.toml"));
  const requirements = readFileSafe2(path2.join(rootDir, "requirements.txt"));
  const setupPy = readFileSafe2(path2.join(rootDir, "setup.py"));
  const combined = [pyproject, requirements, setupPy].filter(Boolean).join("\n");
  for (const fw of PYTHON_FRAMEWORKS) {
    if (fw.packages.some((p) => new RegExp(`\\b${p}\\b`, "i").exec(combined) !== null)) {
      let version = null;
      const versionMatch = new RegExp(`${fw.packages[0]}[>=<~!]*([\\d.]+)`, "i").exec(combined);
      if (versionMatch?.[1]) version = versionMatch[1];
      results.push({
        name: fw.name,
        version,
        detectedFrom: pyproject ? "pyproject.toml" : requirements ? "requirements.txt" : "setup.py"
      });
    }
  }
  return results;
}
function detectSwiftFrameworks(rootDir) {
  const packageSwift = readFileSafe2(path2.join(rootDir, "Package.swift"));
  if (!packageSwift) return [];
  const results = [];
  if (packageSwift.includes("SwiftUI") || scanSwiftFiles(rootDir, "import SwiftUI")) {
    results.push({ name: "SwiftUI", version: null, detectedFrom: "imports" });
  }
  if (packageSwift.includes("UIKit") || scanSwiftFiles(rootDir, "import UIKit")) {
    results.push({ name: "UIKit", version: null, detectedFrom: "imports" });
  }
  if (packageSwift.includes("Vapor") || packageSwift.includes("vapor/vapor")) {
    results.push({ name: "Vapor", version: null, detectedFrom: "Package.swift" });
  }
  return results;
}
function detectKotlinFrameworks(rootDir) {
  const results = [];
  const gradleKts = readFileSafe2(path2.join(rootDir, "build.gradle.kts"));
  const gradle = readFileSafe2(path2.join(rootDir, "build.gradle"));
  const content = gradleKts ?? gradle ?? "";
  if (content.includes("compose") || content.includes("androidx.compose")) {
    results.push({ name: "Jetpack Compose", version: null, detectedFrom: "build.gradle.kts" });
  }
  if (content.includes("spring-boot") || content.includes("org.springframework.boot")) {
    results.push({ name: "Spring Boot", version: null, detectedFrom: "build.gradle.kts" });
  }
  if (content.includes("ktor")) {
    results.push({ name: "Ktor", version: null, detectedFrom: "build.gradle.kts" });
  }
  return results;
}
function scanSwiftFiles(rootDir, searchFor) {
  try {
    const files = fs2.readdirSync(rootDir).filter((f) => f.endsWith(".swift")).slice(0, 10);
    for (const file of files) {
      const content = readFileSafe2(path2.join(rootDir, file));
      if (content?.includes(searchFor)) return true;
    }
    const sources = path2.join(rootDir, "Sources");
    if (exists2(sources)) {
      return scanSwiftFilesRecursive(sources, searchFor, 0);
    }
  } catch {
  }
  return false;
}
function scanSwiftFilesRecursive(dir, searchFor, depth) {
  if (depth > 3) return false;
  try {
    const entries = fs2.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path2.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (scanSwiftFilesRecursive(fullPath, searchFor, depth + 1)) return true;
      } else if (entry.name.endsWith(".swift")) {
        const content = readFileSafe2(fullPath);
        if (content?.includes(searchFor)) return true;
      }
    }
  } catch {
  }
  return false;
}
function detectFrameworks(rootDir) {
  const all = [
    ...detectJsFrameworks(rootDir),
    ...detectPythonFrameworks(rootDir),
    ...detectSwiftFrameworks(rootDir),
    ...detectKotlinFrameworks(rootDir)
  ];
  const seen = /* @__PURE__ */ new Set();
  return all.filter((fw) => {
    if (seen.has(fw.name)) return false;
    seen.add(fw.name);
    return true;
  });
}

// src/detectors/package-manager.ts
import fs3 from "fs";
import path3 from "path";
function exists3(filePath) {
  try {
    fs3.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function detectPackageManager(rootDir) {
  if (exists3(path3.join(rootDir, "bun.lockb")) || exists3(path3.join(rootDir, "bun.lock"))) {
    return "bun";
  }
  if (exists3(path3.join(rootDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (exists3(path3.join(rootDir, "yarn.lock"))) {
    return "yarn";
  }
  if (exists3(path3.join(rootDir, "package-lock.json"))) {
    return "npm";
  }
  if (exists3(path3.join(rootDir, "Cargo.lock"))) {
    return "cargo";
  }
  if (exists3(path3.join(rootDir, "go.sum"))) {
    return "go";
  }
  if (exists3(path3.join(rootDir, "poetry.lock"))) {
    return "poetry";
  }
  if (exists3(path3.join(rootDir, "Pipfile.lock"))) {
    return "pipenv";
  }
  if (exists3(path3.join(rootDir, "pyproject.toml")) || exists3(path3.join(rootDir, "requirements.txt"))) {
    return "pip";
  }
  if (exists3(path3.join(rootDir, "Package.resolved"))) {
    return "spm";
  }
  if (exists3(path3.join(rootDir, "Podfile.lock"))) {
    return "cocoapods";
  }
  if (exists3(path3.join(rootDir, "build.gradle.kts")) || exists3(path3.join(rootDir, "build.gradle"))) {
    return "gradle";
  }
  if (exists3(path3.join(rootDir, "package.json"))) {
    return "npm";
  }
  return null;
}

// src/detectors/linter.ts
import fs4 from "fs";
import path4 from "path";
function readFileSafe3(filePath) {
  try {
    return fs4.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists4(filePath) {
  try {
    fs4.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe3(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function parseEslintRules(content, isJson) {
  const rules = {
    noAny: null,
    noUnusedVars: null,
    importOrder: null,
    namingConvention: null,
    maxLineLength: null,
    customRules: []
  };
  if (isJson) {
    const parsed = parseJsonSafe3(content);
    if (parsed?.rules) {
      const r = parsed.rules;
      if ("@typescript-eslint/no-explicit-any" in r || "no-explicit-any" in r) {
        const val = r["@typescript-eslint/no-explicit-any"] ?? r["no-explicit-any"];
        rules.noAny = val !== "off" && val !== 0;
      }
      if ("@typescript-eslint/no-unused-vars" in r || "no-unused-vars" in r) {
        const val = r["@typescript-eslint/no-unused-vars"] ?? r["no-unused-vars"];
        rules.noUnusedVars = val !== "off" && val !== 0;
      }
      if ("import/order" in r || "import-x/order" in r) {
        rules.importOrder = "enforced";
      }
      if ("max-len" in r) {
        const val = r["max-len"];
        if (typeof val === "number") rules.maxLineLength = val;
        else if (Array.isArray(val) && typeof val[1] === "number") rules.maxLineLength = val[1];
        else if (Array.isArray(val) && typeof val[1] === "object" && val[1] !== null) {
          const obj = val[1];
          if (typeof obj["code"] === "number") rules.maxLineLength = obj["code"];
        }
      }
      const customRuleKeys = Object.keys(parsed.rules).filter((k) => {
        const knownRules = [
          "@typescript-eslint/no-explicit-any",
          "no-explicit-any",
          "@typescript-eslint/no-unused-vars",
          "no-unused-vars",
          "import/order",
          "import-x/order",
          "max-len"
        ];
        return !knownRules.includes(k) && parsed.rules[k] !== "off" && parsed.rules[k] !== 0;
      });
      rules.customRules = customRuleKeys.slice(0, 10);
    }
  } else {
    if (/no-explicit-any/.test(content)) rules.noAny = true;
    if (/no-unused-vars/.test(content)) rules.noUnusedVars = true;
    if (/import\/order/.test(content)) rules.importOrder = "enforced";
    const maxLenMatch = /max-len.*?(\d{2,3})/.exec(content);
    if (maxLenMatch?.[1]) rules.maxLineLength = parseInt(maxLenMatch[1], 10);
  }
  return rules;
}
function parseBiomeRules(content) {
  const rules = {
    noAny: null,
    noUnusedVars: null,
    importOrder: null,
    namingConvention: null,
    maxLineLength: null,
    customRules: []
  };
  const parsed = parseJsonSafe3(content);
  if (parsed) {
    if (parsed.formatter?.lineWidth) rules.maxLineLength = parsed.formatter.lineWidth;
    if (parsed.linter?.rules?.suspicious?.noExplicitAny) {
      rules.noAny = parsed.linter.rules.suspicious.noExplicitAny !== "off";
    }
    if (parsed.linter?.rules?.correctness?.noUnusedVariables) {
      rules.noUnusedVars = parsed.linter.rules.correctness.noUnusedVariables !== "off";
    }
    if (parsed.organizeImports?.enabled !== false) {
      rules.importOrder = "enforced";
    }
  }
  return rules;
}
function findEslintConfig(rootDir) {
  const configs = [
    ".eslintrc.json",
    ".eslintrc.js",
    ".eslintrc.cjs",
    ".eslintrc.yaml",
    ".eslintrc.yml",
    ".eslintrc",
    "eslint.config.js",
    "eslint.config.ts",
    "eslint.config.mjs",
    "eslint.config.cjs"
  ];
  for (const cfg of configs) {
    const fullPath = path4.join(rootDir, cfg);
    const content = readFileSafe3(fullPath);
    if (content) return { file: cfg, content };
  }
  const pkgContent = readFileSafe3(path4.join(rootDir, "package.json"));
  if (pkgContent) {
    const pkg = parseJsonSafe3(pkgContent);
    if (pkg?.eslintConfig) {
      return { file: "package.json", content: JSON.stringify({ rules: pkg.eslintConfig.rules }) };
    }
  }
  return null;
}
function detectLinter(rootDir) {
  const eslint = findEslintConfig(rootDir);
  if (eslint) {
    const isJson = eslint.file.endsWith(".json") || eslint.file === ".eslintrc" || eslint.file === "package.json";
    return {
      name: "ESLint",
      configFile: eslint.file,
      rules: parseEslintRules(eslint.content, isJson)
    };
  }
  const biomeFiles = ["biome.json", "biome.jsonc"];
  for (const bf of biomeFiles) {
    const content = readFileSafe3(path4.join(rootDir, bf));
    if (content) {
      return {
        name: "Biome",
        configFile: bf,
        rules: parseBiomeRules(content)
      };
    }
  }
  if (exists4(path4.join(rootDir, ".swiftlint.yml"))) {
    const content = readFileSafe3(path4.join(rootDir, ".swiftlint.yml")) ?? "";
    const maxLineMatch = /line_length:\s*(\d+)/.exec(content);
    return {
      name: "SwiftLint",
      configFile: ".swiftlint.yml",
      rules: {
        noAny: null,
        noUnusedVars: null,
        importOrder: /sorted_imports/.test(content) ? "enforced" : null,
        namingConvention: null,
        maxLineLength: maxLineMatch?.[1] ? parseInt(maxLineMatch[1], 10) : null,
        customRules: []
      }
    };
  }
  if (exists4(path4.join(rootDir, "detekt.yml"))) {
    return {
      name: "Detekt",
      configFile: "detekt.yml",
      rules: {
        noAny: null,
        noUnusedVars: null,
        importOrder: null,
        namingConvention: null,
        maxLineLength: null,
        customRules: []
      }
    };
  }
  const rustfmtFiles = ["rustfmt.toml", ".rustfmt.toml"];
  for (const rf of rustfmtFiles) {
    if (exists4(path4.join(rootDir, rf))) {
      return {
        name: "rustfmt",
        configFile: rf,
        rules: {
          noAny: null,
          noUnusedVars: null,
          importOrder: null,
          namingConvention: null,
          maxLineLength: null,
          customRules: []
        }
      };
    }
  }
  const pyproject = readFileSafe3(path4.join(rootDir, "pyproject.toml"));
  if (pyproject) {
    if (pyproject.includes("[tool.ruff]")) {
      const maxLineMatch = /line-length\s*=\s*(\d+)/.exec(pyproject);
      return {
        name: "Ruff",
        configFile: "pyproject.toml",
        rules: {
          noAny: null,
          noUnusedVars: null,
          importOrder: /isort/.test(pyproject) ? "enforced" : null,
          namingConvention: null,
          maxLineLength: maxLineMatch?.[1] ? parseInt(maxLineMatch[1], 10) : null,
          customRules: []
        }
      };
    }
    if (pyproject.includes("[tool.flake8]") || exists4(path4.join(rootDir, ".flake8"))) {
      return {
        name: "Flake8",
        configFile: pyproject.includes("[tool.flake8]") ? "pyproject.toml" : ".flake8",
        rules: {
          noAny: null,
          noUnusedVars: null,
          importOrder: null,
          namingConvention: null,
          maxLineLength: null,
          customRules: []
        }
      };
    }
  }
  if (exists4(path4.join(rootDir, ".golangci.yml")) || exists4(path4.join(rootDir, ".golangci.yaml"))) {
    const configFile = exists4(path4.join(rootDir, ".golangci.yml")) ? ".golangci.yml" : ".golangci.yaml";
    return {
      name: "golangci-lint",
      configFile,
      rules: {
        noAny: null,
        noUnusedVars: null,
        importOrder: null,
        namingConvention: null,
        maxLineLength: null,
        customRules: []
      }
    };
  }
  return null;
}

// src/detectors/formatter.ts
import fs5 from "fs";
import path5 from "path";
function readFileSafe4(filePath) {
  try {
    return fs5.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists5(filePath) {
  try {
    fs5.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe4(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function parsePrettierConfig(content, isJson) {
  const opts = {
    semi: null,
    singleQuote: null,
    tabWidth: null,
    useTabs: null,
    trailingComma: null,
    printWidth: null
  };
  if (isJson) {
    const parsed = parseJsonSafe4(content);
    if (parsed) {
      if (parsed.semi !== void 0) opts.semi = parsed.semi;
      if (parsed.singleQuote !== void 0) opts.singleQuote = parsed.singleQuote;
      if (parsed.tabWidth !== void 0) opts.tabWidth = parsed.tabWidth;
      if (parsed.useTabs !== void 0) opts.useTabs = parsed.useTabs;
      if (parsed.trailingComma !== void 0) opts.trailingComma = parsed.trailingComma;
      if (parsed.printWidth !== void 0) opts.printWidth = parsed.printWidth;
    }
  } else {
    const semiMatch = /semi:\s*(true|false)/.exec(content);
    if (semiMatch?.[1]) opts.semi = semiMatch[1] === "true";
    const sqMatch = /singleQuote:\s*(true|false)/.exec(content);
    if (sqMatch?.[1]) opts.singleQuote = sqMatch[1] === "true";
    const tabMatch = /tabWidth:\s*(\d+)/.exec(content);
    if (tabMatch?.[1]) opts.tabWidth = parseInt(tabMatch[1], 10);
    const trailMatch = /trailingComma:\s*["']?(\w+)["']?/.exec(content);
    if (trailMatch?.[1]) opts.trailingComma = trailMatch[1];
    const printMatch = /printWidth:\s*(\d+)/.exec(content);
    if (printMatch?.[1]) opts.printWidth = parseInt(printMatch[1], 10);
  }
  return opts;
}
function parseEditorConfig(content) {
  const opts = {
    semi: null,
    singleQuote: null,
    tabWidth: null,
    useTabs: null,
    trailingComma: null,
    printWidth: null
  };
  const indentStyle = /indent_style\s*=\s*(\w+)/.exec(content);
  if (indentStyle?.[1]) opts.useTabs = indentStyle[1] === "tab";
  const indentSize = /indent_size\s*=\s*(\d+)/.exec(content);
  if (indentSize?.[1]) opts.tabWidth = parseInt(indentSize[1], 10);
  const maxLine = /max_line_length\s*=\s*(\d+)/.exec(content);
  if (maxLine?.[1]) opts.printWidth = parseInt(maxLine[1], 10);
  return opts;
}
function detectFormatter(rootDir) {
  const prettierFiles = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    ".prettierrc.cjs",
    ".prettierrc.mjs",
    ".prettierrc.yaml",
    ".prettierrc.yml",
    "prettier.config.js",
    "prettier.config.cjs",
    "prettier.config.mjs",
    "prettier.config.ts"
  ];
  for (const pf of prettierFiles) {
    const content = readFileSafe4(path5.join(rootDir, pf));
    if (content) {
      const isJson = pf.endsWith(".json") || pf === ".prettierrc";
      return {
        name: "Prettier",
        configFile: pf,
        options: parsePrettierConfig(content, isJson)
      };
    }
  }
  const pkgContent = readFileSafe4(path5.join(rootDir, "package.json"));
  if (pkgContent) {
    const pkg = parseJsonSafe4(pkgContent);
    if (pkg?.prettier) {
      return {
        name: "Prettier",
        configFile: "package.json",
        options: {
          semi: pkg.prettier.semi ?? null,
          singleQuote: pkg.prettier.singleQuote ?? null,
          tabWidth: pkg.prettier.tabWidth ?? null,
          useTabs: pkg.prettier.useTabs ?? null,
          trailingComma: pkg.prettier.trailingComma ?? null,
          printWidth: pkg.prettier.printWidth ?? null
        }
      };
    }
    const allDeps = { ...pkg?.dependencies, ...pkg?.devDependencies };
    if ("prettier" in allDeps) {
      return {
        name: "Prettier",
        configFile: "package.json",
        options: { semi: null, singleQuote: null, tabWidth: null, useTabs: null, trailingComma: null, printWidth: null }
      };
    }
  }
  const biomeFiles = ["biome.json", "biome.jsonc"];
  for (const bf of biomeFiles) {
    const content = readFileSafe4(path5.join(rootDir, bf));
    if (content) {
      const parsed = parseJsonSafe4(content);
      return {
        name: "Biome",
        configFile: bf,
        options: {
          semi: null,
          singleQuote: null,
          tabWidth: parsed?.formatter?.indentWidth ?? null,
          useTabs: parsed?.formatter?.indentStyle === "tab",
          trailingComma: null,
          printWidth: parsed?.formatter?.lineWidth ?? null
        }
      };
    }
  }
  const pyproject = readFileSafe4(path5.join(rootDir, "pyproject.toml"));
  if (pyproject?.includes("[tool.black]")) {
    const lineMatch = /line-length\s*=\s*(\d+)/.exec(pyproject);
    return {
      name: "Black",
      configFile: "pyproject.toml",
      options: {
        semi: null,
        singleQuote: null,
        tabWidth: null,
        useTabs: null,
        trailingComma: null,
        printWidth: lineMatch?.[1] ? parseInt(lineMatch[1], 10) : null
      }
    };
  }
  if (exists5(path5.join(rootDir, ".editorconfig"))) {
    const content = readFileSafe4(path5.join(rootDir, ".editorconfig")) ?? "";
    return {
      name: "EditorConfig",
      configFile: ".editorconfig",
      options: parseEditorConfig(content)
    };
  }
  return null;
}

// src/detectors/test-runner.ts
import fs6 from "fs";
import path6 from "path";
function readFileSafe5(filePath) {
  try {
    return fs6.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists6(filePath) {
  try {
    fs6.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe5(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function getAllDeps2(pkg) {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}
function hasTestFilesInDir(dir, depth = 0) {
  if (depth > 2) return false;
  try {
    const entries = fs6.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) return true;
      if (entry.isDirectory() && entry.name !== "node_modules") {
        if (hasTestFilesInDir(path6.join(dir, entry.name), depth + 1)) return true;
      }
    }
  } catch {
  }
  return false;
}
function detectTestRunner(rootDir) {
  if (exists6(path6.join(rootDir, "vitest.config.ts")) || exists6(path6.join(rootDir, "vitest.config.js")) || exists6(path6.join(rootDir, "vitest.config.mts")) || exists6(path6.join(rootDir, "vitest.config.mjs"))) {
    const configFile = ["vitest.config.ts", "vitest.config.js", "vitest.config.mts", "vitest.config.mjs"].find((f) => exists6(path6.join(rootDir, f))) ?? "vitest.config.ts";
    return { name: "Vitest", configFile, command: "vitest" };
  }
  const jestConfigs = ["jest.config.ts", "jest.config.js", "jest.config.cjs", "jest.config.mjs"];
  for (const jc of jestConfigs) {
    if (exists6(path6.join(rootDir, jc))) {
      return { name: "Jest", configFile: jc, command: "jest" };
    }
  }
  const pkgContent = readFileSafe5(path6.join(rootDir, "package.json"));
  if (pkgContent) {
    const pkg = parseJsonSafe5(pkgContent);
    if (pkg) {
      const deps = getAllDeps2(pkg);
      if ("vitest" in deps) return { name: "Vitest", configFile: null, command: "vitest" };
      if ("jest" in deps || "@jest/core" in deps) {
        return { name: "Jest", configFile: pkg.jest ? "package.json" : null, command: "jest" };
      }
      if ("@playwright/test" in deps) {
        const playwrightCfg = ["playwright.config.ts", "playwright.config.js"].find((f) => exists6(path6.join(rootDir, f))) ?? null;
        return { name: "Playwright", configFile: playwrightCfg, command: "playwright test" };
      }
      if ("cypress" in deps) {
        const cypressCfg = ["cypress.config.ts", "cypress.config.js"].find((f) => exists6(path6.join(rootDir, f))) ?? null;
        return { name: "Cypress", configFile: cypressCfg, command: "cypress run" };
      }
    }
  }
  if (exists6(path6.join(rootDir, "playwright.config.ts")) || exists6(path6.join(rootDir, "playwright.config.js"))) {
    const configFile = exists6(path6.join(rootDir, "playwright.config.ts")) ? "playwright.config.ts" : "playwright.config.js";
    return { name: "Playwright", configFile, command: "playwright test" };
  }
  const pyproject = readFileSafe5(path6.join(rootDir, "pyproject.toml"));
  if (pyproject?.includes("[tool.pytest") || exists6(path6.join(rootDir, "pytest.ini")) || exists6(path6.join(rootDir, "conftest.py"))) {
    const cfgFile = pyproject?.includes("[tool.pytest") ? "pyproject.toml" : exists6(path6.join(rootDir, "pytest.ini")) ? "pytest.ini" : null;
    return { name: "pytest", configFile: cfgFile, command: "pytest" };
  }
  if (exists6(path6.join(rootDir, "go.mod"))) {
    return { name: "Go test", configFile: null, command: "go test ./..." };
  }
  if (exists6(path6.join(rootDir, "Cargo.toml"))) {
    return { name: "cargo test", configFile: "Cargo.toml", command: "cargo test" };
  }
  const xcodeProj = fs6.readdirSync(rootDir).find((f) => f.endsWith(".xcodeproj") || f.endsWith(".xcworkspace"));
  if (xcodeProj) {
    return { name: "XCTest", configFile: xcodeProj, command: "xcodebuild test" };
  }
  if (exists6(path6.join(rootDir, "Package.swift"))) {
    return { name: "Swift Testing", configFile: "Package.swift", command: "swift test" };
  }
  const gradleFile = exists6(path6.join(rootDir, "build.gradle.kts")) ? "build.gradle.kts" : exists6(path6.join(rootDir, "build.gradle")) ? "build.gradle" : null;
  if (gradleFile) {
    return { name: "JUnit", configFile: gradleFile, command: "./gradlew test" };
  }
  return null;
}
function getTestPattern(_rootDir, runner) {
  if (runner === "Vitest" || runner === "Jest") return "**/*.{test,spec}.{ts,tsx,js,jsx}";
  if (runner === "pytest") return "test_*.py | *_test.py";
  if (runner === "Go test") return "*_test.go";
  if (runner === "cargo test") return "#[cfg(test)]";
  if (runner === "XCTest" || runner === "Swift Testing") return "**/*Tests.swift";
  if (runner === "Playwright") return "**/*.spec.ts";
  if (runner === "Cypress") return "cypress/e2e/**/*.cy.ts";
  return null;
}
function getTestLocation(rootDir) {
  if (exists6(path6.join(rootDir, "__tests__"))) return "__tests__/";
  if (exists6(path6.join(rootDir, "tests"))) return "tests/";
  if (exists6(path6.join(rootDir, "test"))) return "test/";
  if (exists6(path6.join(rootDir, "spec"))) return "spec/";
  const srcDir = path6.join(rootDir, "src");
  if (exists6(srcDir) && hasTestFilesInDir(srcDir)) return "colocated";
  return null;
}

// src/detectors/build-tool.ts
import fs7 from "fs";
import path7 from "path";
function readFileSafe6(filePath) {
  try {
    return fs7.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists7(filePath) {
  try {
    fs7.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe6(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
var KNOWN_SCRIPTS = [
  "dev",
  "start",
  "build",
  "test",
  "lint",
  "format",
  "typecheck",
  "type-check",
  "check",
  "clean",
  "deploy",
  "preview",
  "storybook",
  "docker",
  "e2e",
  "coverage"
];
function commandFromScript(scriptName, scriptValue, pm) {
  const runner = pm === "yarn" ? "yarn" : pm === "bun" ? "bun run" : pm === "pnpm" ? "pnpm" : "npm run";
  return `${runner} ${scriptName}`;
}
function detectPackageManagerFromRoot(rootDir) {
  if (exists7(path7.join(rootDir, "bun.lockb")) || exists7(path7.join(rootDir, "bun.lock"))) return "bun";
  if (exists7(path7.join(rootDir, "pnpm-lock.yaml"))) return "pnpm";
  if (exists7(path7.join(rootDir, "yarn.lock"))) return "yarn";
  return "npm";
}
function extractPackageJsonCommands(rootDir) {
  const pkgContent = readFileSafe6(path7.join(rootDir, "package.json"));
  if (!pkgContent) return [];
  const pkg = parseJsonSafe6(pkgContent);
  if (!pkg?.scripts) return [];
  const pm = detectPackageManagerFromRoot(rootDir);
  const commands = [];
  for (const [name, value] of Object.entries(pkg.scripts)) {
    const canonicalName = KNOWN_SCRIPTS.find((k) => name === k || name === k.replace("-", "")) ?? (name.includes(":") ? name.split(":")[0] ?? name : name);
    commands.push({
      name: canonicalName,
      command: commandFromScript(name, value, pm),
      source: "package.json"
    });
  }
  return commands;
}
function extractMakefileCommands(rootDir) {
  const content = readFileSafe6(path7.join(rootDir, "Makefile"));
  if (!content) return [];
  const commands = [];
  const targets = content.matchAll(/^([a-zA-Z][a-zA-Z0-9_-]*):/gm);
  for (const match of targets) {
    const target = match[1];
    if (!target || target.startsWith(".")) continue;
    commands.push({ name: target, command: `make ${target}`, source: "Makefile" });
  }
  return commands;
}
function extractGradleCommands(rootDir) {
  const commands = [];
  if (!exists7(path7.join(rootDir, "build.gradle.kts")) && !exists7(path7.join(rootDir, "build.gradle"))) {
    return commands;
  }
  const commonTasks = [
    { name: "build", command: "./gradlew build", source: "build.gradle.kts" },
    { name: "test", command: "./gradlew test", source: "build.gradle.kts" },
    { name: "clean", command: "./gradlew clean", source: "build.gradle.kts" },
    { name: "assemble", command: "./gradlew assembleDebug", source: "build.gradle.kts" },
    { name: "lint", command: "./gradlew lint", source: "build.gradle.kts" }
  ];
  return commonTasks;
}
function extractJustfileCommands(rootDir) {
  const content = readFileSafe6(path7.join(rootDir, "justfile")) ?? readFileSafe6(path7.join(rootDir, "Justfile"));
  if (!content) return [];
  const commands = [];
  const targets = content.matchAll(/^([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+[^:]*)?:/gm);
  for (const match of targets) {
    const target = match[1];
    if (!target) continue;
    commands.push({ name: target, command: `just ${target}`, source: "justfile" });
  }
  return commands;
}
function extractTaskfileCommands(rootDir) {
  const content = readFileSafe6(path7.join(rootDir, "Taskfile.yml")) ?? readFileSafe6(path7.join(rootDir, "taskfile.yml")) ?? readFileSafe6(path7.join(rootDir, "Taskfile.yaml"));
  if (!content) return [];
  const commands = [];
  const taskMatches = content.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9_-]*):/gm);
  for (const match of taskMatches) {
    const name = match[1];
    if (!name) continue;
    commands.push({ name, command: `task ${name}`, source: "Taskfile.yml" });
  }
  return commands;
}
function deduplicateCommands(commands) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  const priority = ["package.json", "Makefile", "justfile", "Taskfile.yml", "build.gradle.kts"];
  const sorted = [...commands].sort((a, b) => {
    return priority.indexOf(a.source) - priority.indexOf(b.source);
  });
  for (const cmd of sorted) {
    if (!seen.has(cmd.name)) {
      seen.add(cmd.name);
      result.push(cmd);
    }
  }
  return result;
}
function detectBuildCommands(rootDir) {
  const all = [
    ...extractPackageJsonCommands(rootDir),
    ...extractMakefileCommands(rootDir),
    ...extractGradleCommands(rootDir),
    ...extractJustfileCommands(rootDir),
    ...extractTaskfileCommands(rootDir)
  ];
  return deduplicateCommands(all);
}
function detectBuildTool(rootDir) {
  if (exists7(path7.join(rootDir, "turbo.json"))) return "Turborepo";
  if (exists7(path7.join(rootDir, "nx.json"))) return "Nx";
  if (exists7(path7.join(rootDir, "build.gradle.kts")) || exists7(path7.join(rootDir, "build.gradle"))) return "Gradle";
  if (exists7(path7.join(rootDir, "Makefile"))) return "Make";
  if (exists7(path7.join(rootDir, "justfile")) || exists7(path7.join(rootDir, "Justfile"))) return "Just";
  if (exists7(path7.join(rootDir, "Taskfile.yml"))) return "Task";
  if (exists7(path7.join(rootDir, "vite.config.ts")) || exists7(path7.join(rootDir, "vite.config.js"))) return "Vite";
  if (exists7(path7.join(rootDir, "webpack.config.js")) || exists7(path7.join(rootDir, "webpack.config.ts"))) return "Webpack";
  if (exists7(path7.join(rootDir, "rollup.config.js")) || exists7(path7.join(rootDir, "rollup.config.ts"))) return "Rollup";
  if (exists7(path7.join(rootDir, "esbuild.config.js"))) return "esbuild";
  return null;
}

// src/detectors/structure.ts
import fs8 from "fs";
import path8 from "path";
function exists8(filePath) {
  try {
    fs8.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function isDirectory(filePath) {
  try {
    return fs8.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}
function listDir(dir) {
  try {
    return fs8.readdirSync(dir);
  } catch {
    return [];
  }
}
function detectLayout(rootDir, entries) {
  const srcDir = path8.join(rootDir, "src");
  const appDir = path8.join(rootDir, "app");
  const checkDir = exists8(srcDir) ? srcDir : exists8(appDir) ? appDir : null;
  if (!checkDir) return "flat";
  const subEntries = listDir(checkDir);
  const featureIndicators = ["features", "modules", "pages", "views", "screens"];
  const layerIndicators = ["components", "services", "hooks", "utils", "helpers", "models", "stores", "controllers", "repositories"];
  const hasFeature = featureIndicators.some((d) => subEntries.includes(d));
  const hasLayer = layerIndicators.some((d) => subEntries.includes(d));
  if (hasFeature && !hasLayer) return "feature-based";
  if (hasLayer && !hasFeature) return "layer-based";
  if (hasFeature && hasLayer) return "feature-based";
  if (entries.some((e) => ["index.ts", "index.js", "main.ts", "main.js", "App.tsx", "app.ts"].includes(e))) {
    return "flat";
  }
  return "unknown";
}
function hasCollocatedTests(rootDir) {
  const srcDir = path8.join(rootDir, "src");
  if (!exists8(srcDir)) return false;
  function check(dir, depth = 0) {
    if (depth > 3) return false;
    try {
      const entries = fs8.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) return true;
        if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "__tests__") {
          if (check(path8.join(dir, entry.name), depth + 1)) return true;
        }
      }
    } catch {
    }
    return false;
  }
  return check(srcDir);
}
function detectStructure(rootDir) {
  const entries = listDir(rootDir);
  const hasSrc = entries.includes("src") && isDirectory(path8.join(rootDir, "src"));
  const hasApp = entries.includes("app") && isDirectory(path8.join(rootDir, "app"));
  const hasLib = entries.includes("lib") && isDirectory(path8.join(rootDir, "lib"));
  const hasPackages = entries.includes("packages") && isDirectory(path8.join(rootDir, "packages"));
  const testDirNames = ["tests", "__tests__", "test", "spec", "e2e"];
  const testDirs = testDirNames.filter((d) => entries.includes(d) && isDirectory(path8.join(rootDir, d)));
  const configDirNames = [".github", ".vscode", ".husky", ".changeset", ".storybook"];
  const configDirs = configDirNames.filter((d) => entries.includes(d) && isDirectory(path8.join(rootDir, d)));
  const platformDirNames = ["android", "ios", "web", "desktop", "mobile"];
  const platformDirs = platformDirNames.filter((d) => entries.includes(d) && isDirectory(path8.join(rootDir, d)));
  const rootName = path8.basename(rootDir);
  return {
    rootName,
    hasSrc,
    hasApp,
    hasLib,
    hasPackages,
    testDirs,
    configDirs,
    platformDirs,
    layout: detectLayout(rootDir, entries),
    collocatedTests: hasCollocatedTests(rootDir)
  };
}

// src/detectors/typescript-config.ts
import fs9 from "fs";
import path9 from "path";
function readFileSafe7(filePath) {
  try {
    return fs9.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists9(filePath) {
  try {
    fs9.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function stripJsonComments(content) {
  return content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}
function parseJsonSafe7(content) {
  try {
    return JSON.parse(content);
  } catch {
    try {
      return JSON.parse(stripJsonComments(content));
    } catch {
      return null;
    }
  }
}
function detectTypeScriptConfig(rootDir) {
  if (!exists9(path9.join(rootDir, "tsconfig.json"))) return null;
  const content = readFileSafe7(path9.join(rootDir, "tsconfig.json"));
  if (!content) return null;
  const parsed = parseJsonSafe7(content);
  if (!parsed) return null;
  const opts = parsed.compilerOptions ?? {};
  const strict = opts.strict ?? false;
  const strictNullChecks = opts.strictNullChecks ?? strict;
  const noImplicitAny = opts.noImplicitAny ?? strict;
  return {
    strict,
    strictNullChecks,
    noImplicitAny,
    target: opts.target ?? null,
    pathAliases: opts.paths ?? {},
    baseUrl: opts.baseUrl ?? null,
    moduleResolution: opts.moduleResolution ?? null
  };
}

// src/detectors/monorepo.ts
import fs10 from "fs";
import path10 from "path";
function readFileSafe8(filePath) {
  try {
    return fs10.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists10(filePath) {
  try {
    fs10.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe8(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function resolveWorkspacePackages(rootDir, patterns) {
  const packages = [];
  for (const pattern of patterns) {
    const cleanPattern = pattern.replace(/\/\*$/, "");
    const workspaceDir = path10.join(rootDir, cleanPattern);
    try {
      const stat = fs10.statSync(workspaceDir);
      if (stat.isDirectory()) {
        const entries = fs10.readdirSync(workspaceDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            packages.push(`${cleanPattern}/${entry.name}`);
          }
        }
      }
    } catch {
      packages.push(cleanPattern);
    }
  }
  return packages;
}
function detectMonorepo(rootDir) {
  if (exists10(path10.join(rootDir, "turbo.json"))) {
    const pkgContent2 = readFileSafe8(path10.join(rootDir, "package.json"));
    const pkg = pkgContent2 ? parseJsonSafe8(pkgContent2) : null;
    const workspacePatterns = pkg?.workspaces ? Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages : ["apps/*", "packages/*"];
    return {
      tool: "turborepo",
      packages: resolveWorkspacePackages(rootDir, workspacePatterns),
      configFile: "turbo.json"
    };
  }
  if (exists10(path10.join(rootDir, "nx.json"))) {
    return {
      tool: "nx",
      packages: resolveWorkspacePackages(rootDir, ["apps/*", "libs/*"]),
      configFile: "nx.json"
    };
  }
  if (exists10(path10.join(rootDir, "lerna.json"))) {
    const lernaContent = readFileSafe8(path10.join(rootDir, "lerna.json"));
    const lerna = lernaContent ? parseJsonSafe8(lernaContent) : null;
    const patterns = lerna?.packages ?? ["packages/*"];
    return {
      tool: "lerna",
      packages: resolveWorkspacePackages(rootDir, patterns),
      configFile: "lerna.json"
    };
  }
  if (exists10(path10.join(rootDir, "pnpm-workspace.yaml"))) {
    const content = readFileSafe8(path10.join(rootDir, "pnpm-workspace.yaml")) ?? "";
    const patterns = [];
    const matches = content.matchAll(/^\s*-\s+["']?([^"'\n]+)["']?/gm);
    for (const match of matches) {
      if (match[1]) patterns.push(match[1].trim());
    }
    return {
      tool: "pnpm-workspaces",
      packages: resolveWorkspacePackages(rootDir, patterns.length > 0 ? patterns : ["packages/*"]),
      configFile: "pnpm-workspace.yaml"
    };
  }
  const pkgContent = readFileSafe8(path10.join(rootDir, "package.json"));
  if (pkgContent) {
    const pkg = parseJsonSafe8(pkgContent);
    if (pkg?.workspaces) {
      const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages;
      const isYarn = exists10(path10.join(rootDir, "yarn.lock"));
      return {
        tool: isYarn ? "yarn-workspaces" : "npm-workspaces",
        packages: resolveWorkspacePackages(rootDir, patterns),
        configFile: "package.json"
      };
    }
  }
  return null;
}

// src/detectors/git-conventions.ts
import fs11 from "fs";
import path11 from "path";
import { execSync } from "child_process";
function exists11(filePath) {
  try {
    fs11.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function getRecentCommits(rootDir) {
  try {
    const output = execSync("git log --oneline -20 2>/dev/null", {
      cwd: rootDir,
      encoding: "utf-8",
      timeout: 3e3,
      stdio: ["ignore", "pipe", "ignore"]
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
var CONVENTIONAL_PREFIXES = /^[a-f0-9]+ (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?:/;
var ISSUE_REF = /#\d+/;
var SCOPE_PATTERN = /^[a-f0-9]+ \w+\(([^)]+)\):/;
function detectGitConventions(rootDir) {
  const commits = getRecentCommits(rootDir);
  if (commits.length === 0) return null;
  const usesConventionalCommits = commits.filter((c) => CONVENTIONAL_PREFIXES.test(c)).length >= Math.ceil(commits.length * 0.5);
  const usesIssueRefs = commits.some((c) => ISSUE_REF.test(c));
  const usesScopes = commits.some((c) => SCOPE_PATTERN.test(c));
  const hasPRTemplate = exists11(path11.join(rootDir, ".github", "PULL_REQUEST_TEMPLATE.md")) || exists11(path11.join(rootDir, ".github", "pull_request_template.md")) || exists11(path11.join(rootDir, "PULL_REQUEST_TEMPLATE.md"));
  return {
    usesConventionalCommits,
    usesIssueRefs,
    usesScopes,
    exampleCommits: commits.slice(0, 3).map((c) => c.replace(/^[a-f0-9]+ /, "")),
    hasPRTemplate
  };
}

// src/detectors/dependencies.ts
import fs12 from "fs";
import path12 from "path";
function readFileSafe9(filePath) {
  try {
    return fs12.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function parseJsonSafe9(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
var KEY_DEPS = [
  { name: "Prisma", packages: ["prisma", "@prisma/client"], category: "orm" },
  { name: "Drizzle", packages: ["drizzle-orm"], category: "orm" },
  { name: "TypeORM", packages: ["typeorm"], category: "orm" },
  { name: "Mongoose", packages: ["mongoose"], category: "orm" },
  { name: "Sequelize", packages: ["sequelize"], category: "orm" },
  { name: "NextAuth", packages: ["next-auth", "@auth/core"], category: "auth" },
  { name: "Clerk", packages: ["@clerk/nextjs", "@clerk/clerk-react"], category: "auth" },
  { name: "Auth.js", packages: ["@auth/core"], category: "auth" },
  { name: "Lucia", packages: ["lucia"], category: "auth" },
  { name: "Supabase", packages: ["@supabase/supabase-js"], category: "auth" },
  { name: "Redux Toolkit", packages: ["@reduxjs/toolkit"], category: "state" },
  { name: "Zustand", packages: ["zustand"], category: "state" },
  { name: "Jotai", packages: ["jotai"], category: "state" },
  { name: "Recoil", packages: ["recoil"], category: "state" },
  { name: "MobX", packages: ["mobx"], category: "state" },
  { name: "XState", packages: ["xstate"], category: "state" },
  { name: "shadcn/ui", packages: ["@shadcn/ui"], category: "ui" },
  { name: "Radix UI", packages: ["@radix-ui/react-dialog", "@radix-ui/react-select"], category: "ui" },
  { name: "Material UI", packages: ["@mui/material"], category: "ui" },
  { name: "Tailwind CSS", packages: ["tailwindcss"], category: "ui" },
  { name: "Chakra UI", packages: ["@chakra-ui/react"], category: "ui" },
  { name: "Ant Design", packages: ["antd"], category: "ui" },
  { name: "Tanstack Query", packages: ["@tanstack/react-query", "react-query"], category: "networking" },
  { name: "SWR", packages: ["swr"], category: "networking" },
  { name: "Axios", packages: ["axios"], category: "networking" },
  { name: "tRPC", packages: ["@trpc/client", "@trpc/server"], category: "networking" },
  { name: "Apollo Client", packages: ["@apollo/client"], category: "networking" },
  { name: "GraphQL", packages: ["graphql"], category: "networking" },
  { name: "Zod", packages: ["zod"], category: "other" },
  { name: "React Hook Form", packages: ["react-hook-form"], category: "other" },
  { name: "date-fns", packages: ["date-fns"], category: "other" },
  { name: "dayjs", packages: ["dayjs"], category: "other" },
  { name: "lodash", packages: ["lodash", "lodash-es"], category: "other" }
];
function detectKeyDependencies(rootDir) {
  const pkgContent = readFileSafe9(path12.join(rootDir, "package.json"));
  if (!pkgContent) return [];
  const pkg = parseJsonSafe9(pkgContent);
  if (!pkg) return [];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  for (const dep of KEY_DEPS) {
    if (seen.has(dep.name)) continue;
    const matchedPkg = dep.packages.find((p) => p in allDeps);
    if (matchedPkg) {
      seen.add(dep.name);
      const rawVersion = allDeps[matchedPkg];
      results.push({
        name: dep.name,
        version: rawVersion?.replace(/^[\^~]/, "") ?? null,
        category: dep.category
      });
    }
  }
  return results;
}

// src/detectors/android.ts
import fs13 from "fs";
import path13 from "path";
function readFileSafe10(filePath) {
  try {
    return fs13.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists12(filePath) {
  try {
    fs13.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function extractSdkInt(content, key) {
  const patterns = [
    new RegExp(`${key}\\s*=\\s*(\\d+)`),
    new RegExp(`${key}\\s*\\(\\s*(\\d+)\\s*\\)`)
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(content);
    if (match?.[1]) return parseInt(match[1], 10);
  }
  return null;
}
function extractVersion(content, pattern) {
  const match = pattern.exec(content);
  return match?.[1] ?? null;
}
function detectUIFramework(content, rootDir) {
  const hasCompose = content.includes("compose-bom") || content.includes("compose.ui") || content.includes("androidx.compose") || content.includes('"compose"') || content.includes("'compose'");
  const layoutDir = path13.join(rootDir, "app", "src", "main", "res", "layout");
  const hasXmlLayouts = exists12(layoutDir) && fs13.readdirSync(layoutDir).some((f) => f.endsWith(".xml"));
  if (hasCompose && hasXmlLayouts) return "both";
  if (hasCompose) return "compose";
  return "xml";
}
function detectDI(content) {
  if (content.includes("hilt-android") || content.includes("com.google.dagger:hilt")) return "hilt";
  if (content.includes("dagger") && !content.includes("hilt")) return "dagger";
  if (content.includes("koin")) return "koin";
  return null;
}
function detectDatabase(content) {
  if (content.includes("room-runtime") || content.includes("androidx.room")) return "room";
  if (content.includes("sqldelight")) return "sqldelight";
  if (content.includes("realm")) return "realm";
  return null;
}
function detectNetworking(content) {
  if (content.includes("retrofit")) return "retrofit";
  if (content.includes("ktor-client")) return "ktor";
  if (content.includes("okhttp")) return "okhttp";
  return null;
}
function detectArchitecture(content, rootDir) {
  const srcDirs = [
    path13.join(rootDir, "app", "src", "main", "java"),
    path13.join(rootDir, "app", "src", "main", "kotlin")
  ];
  const patterns = {
    mvvm: /ViewModel|LiveData|StateFlow/,
    mvi: /Intent|Reducer|Store|UiState/,
    clean: /UseCase|Repository|Domain/
  };
  const allContent = [content];
  for (const dir of srcDirs) {
    if (exists12(dir)) {
      allContent.push(scanKotlinFiles(dir, 3));
    }
  }
  const combined = allContent.join("\n");
  for (const [arch, pattern] of Object.entries(patterns)) {
    if (pattern.test(combined)) return arch;
  }
  return null;
}
function scanKotlinFiles(dir, maxDepth, depth = 0) {
  if (depth > maxDepth) return "";
  const parts = [];
  try {
    const entries = fs13.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries.slice(0, 20)) {
      const fullPath = path13.join(dir, entry.name);
      if (entry.isFile() && (entry.name.endsWith(".kt") || entry.name.endsWith(".java"))) {
        const content = readFileSafe10(fullPath);
        if (content) parts.push(content.slice(0, 500));
      } else if (entry.isDirectory()) {
        parts.push(scanKotlinFiles(fullPath, maxDepth, depth + 1));
      }
    }
  } catch {
  }
  return parts.join("\n");
}
function detectModules(rootDir) {
  const settingsContent = readFileSafe10(path13.join(rootDir, "settings.gradle.kts")) ?? readFileSafe10(path13.join(rootDir, "settings.gradle")) ?? "";
  const modules = [];
  const includeMatches = settingsContent.matchAll(/include\s*\(\s*["']([^"']+)["']\s*\)/g);
  for (const match of includeMatches) {
    if (match[1]) modules.push(match[1]);
  }
  if (modules.length === 0) {
    const includeMatches2 = settingsContent.matchAll(/include\s+"([^"]+)"/g);
    for (const match of includeMatches2) {
      if (match[1]) modules.push(match[1]);
    }
  }
  return modules;
}
function detectAndroid(rootDir) {
  const gradleKts = readFileSafe10(path13.join(rootDir, "build.gradle.kts"));
  const gradle = readFileSafe10(path13.join(rootDir, "build.gradle"));
  const appGradleKts = readFileSafe10(path13.join(rootDir, "app", "build.gradle.kts"));
  const appGradle = readFileSafe10(path13.join(rootDir, "app", "build.gradle"));
  const rootContent = gradleKts ?? gradle ?? "";
  const appContent = appGradleKts ?? appGradle ?? "";
  const combined = rootContent + "\n" + appContent;
  if (!combined.includes("android") && !combined.includes("com.android")) {
    if (!exists12(path13.join(rootDir, "app", "src", "main", "AndroidManifest.xml"))) {
      return null;
    }
  }
  const minSdk = extractSdkInt(appContent || combined, "minSdk") ?? extractSdkInt(combined, "minSdkVersion");
  const targetSdk = extractSdkInt(appContent || combined, "targetSdk") ?? extractSdkInt(combined, "targetSdkVersion");
  const compileSdk = extractSdkInt(appContent || combined, "compileSdk") ?? extractSdkInt(combined, "compileSdkVersion");
  const agpVersion = extractVersion(
    combined,
    /com\.android\.tools\.build[:\s]+gradle[:\s]+"([^"]+)"/
  );
  const kotlinVersion = extractVersion(
    combined,
    /kotlin[_-]version\s*=\s*["']([^"']+)["']/
  ) ?? extractVersion(combined, /org\.jetbrains\.kotlin[^:]*:([^"'\s]+)/);
  return {
    minSdk,
    targetSdk,
    compileSdk,
    agpVersion,
    kotlinVersion,
    uiFramework: detectUIFramework(combined, rootDir),
    di: detectDI(combined),
    database: detectDatabase(combined),
    networking: detectNetworking(combined),
    architecture: detectArchitecture(combined, rootDir),
    modules: detectModules(rootDir)
  };
}

// src/detectors/ios.ts
import fs14 from "fs";
import path14 from "path";
function readFileSafe11(filePath) {
  try {
    return fs14.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists13(filePath) {
  try {
    fs14.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function listDir2(dir) {
  try {
    return fs14.readdirSync(dir);
  } catch {
    return [];
  }
}
function extractSwiftToolsVersion(packageSwift) {
  const match = /swift-tools-version:\s*([\d.]+)/.exec(packageSwift);
  return match?.[1] ?? null;
}
function extractDeploymentTarget(content) {
  const patterns = [
    /\.macOS\s*\(\s*[".]([^".)]+)[".]/,
    /\.iOS\s*\(\s*[".]([^".)]+)[".]/,
    /IPHONEOS_DEPLOYMENT_TARGET\s*=\s*([\d.]+)/,
    /deploymentTarget\s*=\s*"([\d.]+)"/,
    /\.init\s*\(\s*["']?([\d.]+)["']?\s*\)/
  ];
  for (const p of patterns) {
    const match = p.exec(content);
    if (match?.[1]) return match[1];
  }
  return null;
}
function scanSwiftImports(rootDir, maxFiles = 50) {
  const result = { swiftUI: false, uiKit: false, foundationModels: false, coreML: false, coreData: false, swiftData: false };
  function scanDir(dir, depth, count) {
    if (depth > 4 || count.n >= maxFiles) return;
    try {
      const entries = fs14.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (count.n >= maxFiles) break;
        const fullPath = path14.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".swift")) {
          count.n++;
          const content = readFileSafe11(fullPath)?.slice(0, 1e3) ?? "";
          if (content.includes("import SwiftUI")) result.swiftUI = true;
          if (content.includes("import UIKit")) result.uiKit = true;
          if (content.includes("import FoundationModels")) result.foundationModels = true;
          if (content.includes("import CoreML")) result.coreML = true;
          if (content.includes("import CoreData")) result.coreData = true;
          if (content.includes("import SwiftData")) result.swiftData = true;
        } else if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "build") {
          scanDir(fullPath, depth + 1, count);
        }
      }
    } catch {
    }
  }
  scanDir(rootDir, 0, { n: 0 });
  return result;
}
function detectUIFramework2(imports, packageSwift) {
  const hasSwiftUI = imports.swiftUI || packageSwift.includes("SwiftUI");
  const hasUIKit = imports.uiKit || packageSwift.includes("UIKit");
  if (hasSwiftUI && hasUIKit) return "both";
  if (hasSwiftUI) return "swiftui";
  return "uikit";
}
function detectPackageManager2(rootDir) {
  if (exists13(path14.join(rootDir, "Tuist"))) return "tuist";
  if (exists13(path14.join(rootDir, "Podfile"))) return "cocoapods";
  if (exists13(path14.join(rootDir, "Package.swift"))) return "spm";
  return null;
}
function detectPersistence(imports, packageSwift) {
  if (imports.swiftData || packageSwift.includes("SwiftData")) return "swiftdata";
  if (imports.coreData || packageSwift.includes("CoreData")) return "core-data";
  if (packageSwift.includes("realm") || packageSwift.includes("Realm")) return "realm";
  return null;
}
function detectArchitecture2(rootDir, packageSwift) {
  const combined = packageSwift;
  if (combined.includes("ComposableArchitecture") || combined.includes("TCA")) return "tca";
  function scanForPatterns(dir) {
    try {
      const entries = fs14.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries.slice(0, 30)) {
        const fullPath = path14.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".swift")) {
          const content = readFileSafe11(fullPath) ?? "";
          if (/class\s+\w+ViewModel/.test(content)) return "mvvm";
          if (/protocol\s+\w+Interactor/.test(content) || /protocol\s+\w+Router/.test(content)) return "viper";
          if (/class\s+\w+UseCase/.test(content)) return "clean";
        } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const result = scanForPatterns(fullPath);
          if (result) return result;
        }
      }
    } catch {
    }
    return null;
  }
  const srcDir = path14.join(rootDir, "Sources");
  return exists13(srcDir) ? scanForPatterns(srcDir) : null;
}
function detectIOS(rootDir) {
  const packageSwift = readFileSafe11(path14.join(rootDir, "Package.swift"));
  const entries = listDir2(rootDir);
  const hasXcodeProj = entries.some((e) => e.endsWith(".xcodeproj") || e.endsWith(".xcworkspace"));
  const hasPodfile = exists13(path14.join(rootDir, "Podfile"));
  const hasTuist = exists13(path14.join(rootDir, "Tuist"));
  if (!packageSwift && !hasXcodeProj && !hasPodfile && !hasTuist) {
    return null;
  }
  const swiftVersion = packageSwift ? extractSwiftToolsVersion(packageSwift) : null;
  const pbxprojContent = (() => {
    const xcodeproj = entries.find((e) => e.endsWith(".xcodeproj"));
    if (!xcodeproj) return null;
    return readFileSafe11(path14.join(rootDir, xcodeproj, "project.pbxproj"));
  })();
  const deploymentTarget = extractDeploymentTarget(
    (packageSwift ?? "") + (pbxprojContent ?? "")
  );
  const imports = scanSwiftImports(rootDir);
  const uiFramework = detectUIFramework2(imports, packageSwift ?? "");
  const packageManager = detectPackageManager2(rootDir);
  const persistence = detectPersistence(imports, packageSwift ?? "");
  const architecture = detectArchitecture2(rootDir, packageSwift ?? "");
  return {
    swiftVersion,
    deploymentTarget,
    uiFramework,
    packageManager,
    persistence,
    architecture,
    hasFoundationModels: imports.foundationModels,
    hasCoreML: imports.coreML
  };
}

// src/detectors/cross-platform.ts
import fs15 from "fs";
import path15 from "path";
function readFileSafe12(filePath) {
  try {
    return fs15.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}
function exists14(filePath) {
  try {
    fs15.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function parseJsonSafe10(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function detectReactNative(rootDir) {
  const pkgContent = readFileSafe12(path15.join(rootDir, "package.json"));
  if (!pkgContent) return null;
  const pkg = parseJsonSafe10(pkgContent);
  if (!pkg) return null;
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const isExpo = "expo" in deps;
  const isRN = "react-native" in deps;
  if (!isRN && !isExpo) return null;
  const hasiOS = exists14(path15.join(rootDir, "ios"));
  const hasAndroid = exists14(path15.join(rootDir, "android"));
  const hasWeb = "react-native-web" in deps || "expo-router" in deps;
  return {
    framework: isExpo ? "expo" : "react-native",
    hasiOS,
    hasAndroid,
    hasWeb,
    hasDesktop: false
  };
}
function detectFlutter(rootDir) {
  const pubspec = readFileSafe12(path15.join(rootDir, "pubspec.yaml"));
  if (!pubspec || !pubspec.includes("flutter:")) return null;
  return {
    framework: "flutter",
    hasiOS: exists14(path15.join(rootDir, "ios")),
    hasAndroid: exists14(path15.join(rootDir, "android")),
    hasWeb: exists14(path15.join(rootDir, "web")),
    hasDesktop: exists14(path15.join(rootDir, "macos")) || exists14(path15.join(rootDir, "windows")) || exists14(path15.join(rootDir, "linux"))
  };
}
function detectKMP(rootDir) {
  const gradleContent = readFileSafe12(path15.join(rootDir, "build.gradle.kts")) ?? readFileSafe12(path15.join(rootDir, "build.gradle")) ?? "";
  const settingsContent = readFileSafe12(path15.join(rootDir, "settings.gradle.kts")) ?? readFileSafe12(path15.join(rootDir, "settings.gradle")) ?? "";
  const combined = gradleContent + settingsContent;
  if (!combined.includes("multiplatform") && !combined.includes('kotlin("multiplatform")') && !combined.includes('id("org.jetbrains.kotlin.multiplatform")')) {
    return null;
  }
  return {
    framework: "kmp",
    hasiOS: combined.includes("iosArm64") || combined.includes("iosSimulatorArm64") || combined.includes("ios()"),
    hasAndroid: combined.includes("android()") || combined.includes("androidTarget()"),
    hasWeb: combined.includes("js(") || combined.includes("wasmJs("),
    hasDesktop: combined.includes("jvm(") || combined.includes("mingwX64") || combined.includes("macosArm64")
  };
}
function detectCrossPlatform(rootDir) {
  return detectReactNative(rootDir) ?? detectFlutter(rootDir) ?? detectKMP(rootDir);
}

// src/core/scanner.ts
function exists15(filePath) {
  try {
    fs16.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function detectPlatforms(rootDir, languages, frameworks, crossPlatform) {
  const platforms = /* @__PURE__ */ new Set();
  const languageNames = languages.map((l) => l.name);
  const frameworkNames = frameworks.map((f) => f.name);
  if (crossPlatform !== null || frameworkNames.includes("React Native") || frameworkNames.includes("Expo")) {
    platforms.add("cross-platform");
  }
  if (languageNames.includes("Swift") || exists15(path16.join(rootDir, "Package.swift")) || exists15(path16.join(rootDir, "Podfile")) || exists15(path16.join(rootDir, "Tuist"))) {
    platforms.add("ios");
  }
  if (languageNames.includes("Kotlin") || languageNames.includes("Java")) {
    if (exists15(path16.join(rootDir, "android")) || exists15(path16.join(rootDir, "app")) || exists15(path16.join(rootDir, "app", "src", "main", "AndroidManifest.xml"))) {
      platforms.add("android");
    } else {
      platforms.add("server");
    }
  }
  if (frameworkNames.some((f) => ["Next.js", "Nuxt", "SvelteKit", "Angular", "Vue", "React", "Astro", "Remix"].includes(f))) {
    platforms.add("web");
  }
  if (frameworkNames.some((f) => ["Express", "Fastify", "NestJS", "Hono", "Vapor", "Spring Boot", "Ktor", "FastAPI", "Django", "Flask"].includes(f))) {
    platforms.add("server");
  }
  if (frameworkNames.includes("Electron")) {
    platforms.add("desktop");
  }
  if (languageNames.includes("Rust") || languageNames.includes("Go") || languageNames.includes("Python") || languageNames.includes("Ruby")) {
    if (platforms.size === 0) platforms.add("server");
  }
  if (platforms.size === 0 && (languageNames.includes("TypeScript") || languageNames.includes("JavaScript"))) {
    platforms.add("web");
  }
  return [...platforms];
}
function buildCodeStyle(linter, formatter) {
  const style = {
    indentation: null,
    semicolons: null,
    quotes: null,
    trailingComma: null,
    maxLineLength: null,
    namingConvention: null,
    importOrder: null,
    noAny: null,
    preferConst: null,
    preferFunctional: null,
    customRules: []
  };
  if (formatter) {
    if (formatter.options.useTabs !== null) {
      style.indentation = {
        style: formatter.options.useTabs ? "tabs" : "spaces",
        size: formatter.options.tabWidth ?? 2
      };
    } else if (formatter.options.tabWidth !== null) {
      style.indentation = { style: "spaces", size: formatter.options.tabWidth };
    }
    if (formatter.options.semi !== null) style.semicolons = formatter.options.semi;
    if (formatter.options.singleQuote !== null) style.quotes = formatter.options.singleQuote ? "single" : "double";
    if (formatter.options.trailingComma !== null) style.trailingComma = formatter.options.trailingComma !== "none";
    if (formatter.options.printWidth !== null) style.maxLineLength = formatter.options.printWidth;
  }
  if (linter) {
    if (style.maxLineLength === null && linter.rules.maxLineLength !== null) {
      style.maxLineLength = linter.rules.maxLineLength;
    }
    if (linter.rules.noAny !== null) style.noAny = linter.rules.noAny;
    if (linter.rules.importOrder !== null) style.importOrder = linter.rules.importOrder;
    if (linter.rules.namingConvention !== null) style.namingConvention = linter.rules.namingConvention;
    style.customRules = [...style.customRules ?? [], ...linter.rules.customRules];
  }
  return style;
}
function scan(rootDir) {
  const languages = detectLanguages(rootDir);
  const frameworks = detectFrameworks(rootDir);
  const crossPlatform = detectCrossPlatform(rootDir);
  const platforms = detectPlatforms(rootDir, languages, frameworks, crossPlatform);
  const packageManager = detectPackageManager(rootDir);
  const linter = detectLinter(rootDir);
  const formatter = detectFormatter(rootDir);
  const testRunner = detectTestRunner(rootDir);
  const testPattern = testRunner ? getTestPattern(rootDir, testRunner.name) : null;
  const testLocation = getTestLocation(rootDir);
  const commands = detectBuildCommands(rootDir);
  const buildTool = detectBuildTool(rootDir);
  const structure = detectStructure(rootDir);
  const typescriptConfig = detectTypeScriptConfig(rootDir);
  const monorepo = detectMonorepo(rootDir);
  const gitConventions = detectGitConventions(rootDir);
  const keyDependencies = detectKeyDependencies(rootDir);
  const codeStyle = buildCodeStyle(linter, formatter);
  return {
    languages,
    frameworks,
    platforms,
    packageManager,
    commands,
    buildTool,
    linter,
    formatter,
    codeStyle,
    structure,
    monorepo,
    keyDependencies,
    testRunner,
    testPattern,
    testLocation,
    typescriptConfig,
    gitConventions,
    android: platforms.includes("android") ? detectAndroid(rootDir) : null,
    ios: platforms.includes("ios") ? detectIOS(rootDir) : null
  };
}
function hashContext(context) {
  const content = JSON.stringify(context, null, 0);
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}
var CACHE_DIR = ".rulegen";
var HASH_FILE = "last-hash";
function readLastHash(rootDir) {
  try {
    return fs16.readFileSync(path16.join(rootDir, CACHE_DIR, HASH_FILE), "utf-8").trim();
  } catch {
    return null;
  }
}
function writeHash(rootDir, hash) {
  try {
    const dir = path16.join(rootDir, CACHE_DIR);
    if (!exists15(dir)) fs16.mkdirSync(dir, { recursive: true });
    fs16.writeFileSync(path16.join(dir, HASH_FILE), hash, "utf-8");
  } catch {
  }
}

// src/core/merger.ts
import fs17 from "fs";
var AUTO_START_MARKER = "<!-- rulegen:auto -->";
var AUTO_END_MARKER = "<!-- rulegen:end -->";
function mergeWithExisting(newContent, existingPath) {
  let existing = null;
  try {
    existing = fs17.readFileSync(existingPath, "utf-8");
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
  const parts = [];
  if (before) parts.push(before);
  parts.push(`${AUTO_START_MARKER}
${newContent.trim()}
${AUTO_END_MARKER}`);
  if (after) parts.push(after);
  return parts.join("\n\n");
}
function wrapAutoContent(content) {
  return `${AUTO_START_MARKER}
${content.trim()}
${AUTO_END_MARKER}`;
}

// src/formatters/claude.ts
function titleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function buildHeader(context) {
  const name = context.structure.rootName || "Project";
  const stackParts = [];
  const primaryLang = context.languages[0];
  if (primaryLang) stackParts.push(primaryLang.name);
  const primaryFramework = context.frameworks[0];
  if (primaryFramework) stackParts.push(primaryFramework.name);
  const subtitle = stackParts.length > 0 ? ` \u2014 ${stackParts.join(" + ")}` : "";
  return `# ${name}${subtitle}`;
}
function buildStackSection(context) {
  const lines = ["## Stack"];
  const langLines = context.languages.map((l) => {
    const ver = l.version ? ` ${l.version}` : "";
    return `- **${l.name}**${ver}`;
  });
  if (langLines.length > 0) lines.push(...langLines);
  const fwLines = context.frameworks.map((fw) => {
    const ver = fw.version ? ` ${fw.version}` : "";
    return `- **${fw.name}**${ver}`;
  });
  if (fwLines.length > 0) lines.push(...fwLines);
  if (context.packageManager) {
    lines.push(`- Package manager: **${context.packageManager}**`);
  }
  if (context.monorepo) {
    lines.push(`- Monorepo: **${context.monorepo.tool}**`);
    if (context.monorepo.packages.length > 0) {
      lines.push(`  - Packages: ${context.monorepo.packages.join(", ")}`);
    }
  }
  const keyUIDeps = context.keyDependencies.filter((d) => ["ui", "state", "orm", "auth"].includes(d.category));
  if (keyUIDeps.length > 0) {
    lines.push("");
    lines.push("### Key Dependencies");
    const byCategory = {};
    for (const dep of keyUIDeps) {
      if (!byCategory[dep.category]) byCategory[dep.category] = [];
      byCategory[dep.category].push(dep);
    }
    for (const [cat, deps] of Object.entries(byCategory)) {
      lines.push(`- **${titleCase(cat)}**: ${deps.map((d) => d.name).join(", ")}`);
    }
  }
  return lines.join("\n");
}
function buildCommandsSection(context) {
  if (context.commands.length === 0) return "";
  const lines = ["## Commands"];
  const priority = ["dev", "start", "build", "test", "lint", "format", "typecheck", "type-check", "check", "e2e"];
  const sorted = [...context.commands].sort((a, b) => {
    const ai = priority.indexOf(a.name);
    const bi = priority.indexOf(b.name);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
  for (const cmd of sorted.slice(0, 12)) {
    lines.push(`- \`${cmd.command}\` \u2014 ${cmd.name}`);
  }
  return lines.join("\n");
}
function buildCodeStyleSection(context) {
  const style = context.codeStyle;
  const linter = context.linter;
  const formatter = context.formatter;
  const hasAnyStyle = style.indentation ?? style.semicolons ?? style.quotes ?? style.maxLineLength ?? linter ?? formatter;
  if (!hasAnyStyle) return "";
  const lines = ["## Code Style"];
  if (linter) {
    lines.push(`- Linter: **${linter.name}** (\`${linter.configFile}\`)`);
  }
  if (formatter) {
    lines.push(`- Formatter: **${formatter.name}** (\`${formatter.configFile}\`)`);
  }
  if (style.indentation) {
    lines.push(`- Indentation: ${style.indentation.size} ${style.indentation.style}`);
  }
  if (style.semicolons !== null) {
    lines.push(`- Semicolons: ${style.semicolons ? "required" : "omit"}`);
  }
  if (style.quotes !== null) {
    lines.push(`- Quotes: ${style.quotes}`);
  }
  if (style.trailingComma !== null) {
    lines.push(`- Trailing comma: ${style.trailingComma ? "yes" : "no"}`);
  }
  if (style.maxLineLength !== null) {
    lines.push(`- Max line length: ${style.maxLineLength}`);
  }
  if (style.importOrder) {
    lines.push(`- Import order: ${style.importOrder}`);
  }
  if (style.noAny) {
    lines.push("- Avoid `any` types (TypeScript strict)");
  }
  if (style.customRules.length > 0) {
    lines.push("");
    lines.push("### Additional Rules");
    for (const rule of style.customRules.slice(0, 8)) {
      lines.push(`- \`${rule}\``);
    }
  }
  return lines.join("\n");
}
function buildTypeScriptSection(context) {
  const ts = context.typescriptConfig;
  if (!ts) return "";
  const lines = ["## TypeScript"];
  if (ts.strict) lines.push("- Strict mode: **enabled**");
  if (ts.noImplicitAny) lines.push("- No implicit any");
  if (ts.strictNullChecks) lines.push("- Strict null checks");
  if (ts.target) lines.push(`- Target: \`${ts.target}\``);
  if (ts.moduleResolution) lines.push(`- Module resolution: \`${ts.moduleResolution}\``);
  if (ts.baseUrl) lines.push(`- Base URL: \`${ts.baseUrl}\``);
  const aliases = Object.entries(ts.pathAliases);
  if (aliases.length > 0) {
    lines.push("- Path aliases:");
    for (const [alias, targets] of aliases.slice(0, 5)) {
      lines.push(`  - \`${alias}\` \u2192 \`${targets[0] ?? ""}\``);
    }
  }
  return lines.join("\n");
}
function buildTestingSection(context) {
  const runner = context.testRunner;
  if (!runner) return "";
  const lines = ["## Testing"];
  lines.push(`- Runner: **${runner.name}**`);
  if (runner.command) lines.push(`- Command: \`${runner.command}\``);
  if (context.testPattern) lines.push(`- Pattern: \`${context.testPattern}\``);
  if (context.testLocation) {
    lines.push(`- Location: ${context.testLocation === "colocated" ? "colocated with source files" : `\`${context.testLocation}\``}`);
  }
  return lines.join("\n");
}
function buildArchitectureSection(context) {
  const structure = context.structure;
  const lines = ["## Architecture"];
  const dirs = [];
  if (structure.hasSrc) dirs.push("`src/`");
  if (structure.hasApp) dirs.push("`app/`");
  if (structure.hasLib) dirs.push("`lib/`");
  if (structure.hasPackages) dirs.push("`packages/`");
  if (dirs.length > 0) {
    lines.push(`- Source: ${dirs.join(", ")}`);
  }
  if (structure.layout !== "unknown") {
    lines.push(`- Layout: ${structure.layout}`);
  }
  if (structure.testDirs.length > 0) {
    lines.push(`- Tests: ${structure.testDirs.map((d) => `\`${d}/\``).join(", ")}`);
  }
  if (structure.collocatedTests) {
    lines.push("- Tests colocated with source files");
  }
  if (structure.platformDirs.length > 0) {
    lines.push(`- Platform dirs: ${structure.platformDirs.map((d) => `\`${d}/\``).join(", ")}`);
  }
  if (lines.length === 1) return "";
  return lines.join("\n");
}
function buildGitSection(context) {
  const git = context.gitConventions;
  if (!git) return "";
  const lines = ["## Git Conventions"];
  if (git.usesConventionalCommits) {
    lines.push("- Commits follow **Conventional Commits** format");
    lines.push("  - Format: `type(scope): description`");
    lines.push("  - Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`");
    if (git.usesScopes) lines.push("  - Scopes are used (e.g., `feat(auth):`)");
  }
  if (git.usesIssueRefs) {
    lines.push("- Issue references included in commits (e.g., `#123`)");
  }
  if (git.hasPRTemplate) {
    lines.push("- Pull request template exists at `.github/PULL_REQUEST_TEMPLATE.md`");
  }
  if (git.exampleCommits.length > 0 && git.usesConventionalCommits) {
    lines.push("");
    lines.push("### Example Commits");
    for (const commit of git.exampleCommits) {
      lines.push(`- \`${commit}\``);
    }
  }
  if (lines.length === 1) return "";
  return lines.join("\n");
}
function buildAndroidSection(context) {
  const android = context.android;
  if (!android) return "";
  const lines = ["## Android"];
  const sdkParts = [];
  if (android.compileSdk) sdkParts.push(`compileSdk ${android.compileSdk}`);
  if (android.targetSdk) sdkParts.push(`targetSdk ${android.targetSdk}`);
  if (android.minSdk) sdkParts.push(`minSdk ${android.minSdk}`);
  if (sdkParts.length > 0) lines.push(`- SDK: ${sdkParts.join(", ")}`);
  if (android.kotlinVersion) lines.push(`- Kotlin: ${android.kotlinVersion}`);
  if (android.agpVersion) lines.push(`- AGP: ${android.agpVersion}`);
  const ui = android.uiFramework === "compose" ? "Jetpack Compose" : android.uiFramework === "xml" ? "XML layouts" : "Jetpack Compose + XML layouts";
  lines.push(`- UI: **${ui}**`);
  if (android.di) lines.push(`- DI: **${android.di}**`);
  if (android.database) lines.push(`- Database: **${android.database}**`);
  if (android.networking) lines.push(`- Networking: **${android.networking}**`);
  if (android.architecture) lines.push(`- Architecture: **${android.architecture.toUpperCase()}**`);
  if (android.modules.length > 0) {
    lines.push(`- Modules: ${android.modules.join(", ")}`);
  }
  if (android.uiFramework === "compose" || android.uiFramework === "both") {
    lines.push("");
    lines.push("### Compose Guidelines");
    lines.push("- Use `@Composable` functions for UI");
    lines.push("- Hoist state to the nearest common ancestor");
    lines.push("- Prefer `remember` + `mutableStateOf` for local UI state");
    if (android.di === "hilt") lines.push("- Inject ViewModels via `hiltViewModel()`");
  }
  return lines.join("\n");
}
function buildIOSSection(context) {
  const ios = context.ios;
  if (!ios) return "";
  const lines = ["## iOS / Swift"];
  if (ios.swiftVersion) lines.push(`- Swift tools version: ${ios.swiftVersion}`);
  if (ios.deploymentTarget) lines.push(`- Deployment target: iOS ${ios.deploymentTarget}`);
  const ui = ios.uiFramework === "swiftui" ? "SwiftUI" : ios.uiFramework === "uikit" ? "UIKit" : "SwiftUI + UIKit";
  lines.push(`- UI: **${ui}**`);
  if (ios.packageManager) {
    const pmNames = { spm: "Swift Package Manager", cocoapods: "CocoaPods", tuist: "Tuist" };
    lines.push(`- Package manager: **${pmNames[ios.packageManager] ?? ios.packageManager}**`);
  }
  if (ios.persistence) lines.push(`- Persistence: **${ios.persistence}**`);
  if (ios.architecture) lines.push(`- Architecture: **${ios.architecture.toUpperCase()}**`);
  if (ios.hasFoundationModels) lines.push("- Uses **Foundation Models** (on-device AI)");
  if (ios.hasCoreML) lines.push("- Uses **Core ML**");
  if (ios.uiFramework === "swiftui" || ios.uiFramework === "both") {
    lines.push("");
    lines.push("### SwiftUI Guidelines");
    lines.push("- Use `@State` for local view state, `@StateObject` for owned ObservableObjects");
    lines.push("- Use `@EnvironmentObject` for dependency injection across the view hierarchy");
    lines.push("- Prefer `async`/`await` with `.task {}` modifier over Combine for async work");
  }
  return lines.join("\n");
}
function formatClaude(context) {
  const sections = [
    buildHeader(context),
    buildStackSection(context),
    buildCommandsSection(context),
    buildCodeStyleSection(context),
    buildTypeScriptSection(context),
    buildTestingSection(context),
    buildArchitectureSection(context),
    buildAndroidSection(context),
    buildIOSSection(context),
    buildGitSection(context)
  ].filter(Boolean);
  return sections.join("\n\n");
}

// src/formatters/cursor.ts
function buildLanguageRules(context) {
  const rules = [];
  const langs = context.languages.map((l) => l.name);
  const fws = context.frameworks.map((f) => f.name);
  if (langs.includes("TypeScript") || langs.includes("JavaScript")) {
    rules.push("Use TypeScript for all new files.");
    const ts = context.typescriptConfig;
    if (ts?.strict) {
      rules.push("TypeScript strict mode is enabled. Never use `any` type. Use proper type annotations.");
    }
    if (ts?.pathAliases && Object.keys(ts.pathAliases).length > 0) {
      const aliases = Object.keys(ts.pathAliases).join(", ");
      rules.push(`Use TypeScript path aliases for imports: ${aliases}`);
    }
  }
  if (fws.includes("React") || fws.includes("Next.js") || fws.includes("Remix")) {
    rules.push("Use functional components and React hooks. Avoid class components.");
    rules.push("Prefer named exports over default exports for components.");
  }
  if (fws.includes("Next.js")) {
    rules.push("Use Next.js App Router conventions. Server components by default, add 'use client' only when needed.");
  }
  return rules;
}
function buildStyleRules(context) {
  const rules = [];
  const style = context.codeStyle;
  if (context.linter) {
    rules.push(`Follow ${context.linter.name} rules defined in \`${context.linter.configFile}\`.`);
  }
  if (context.formatter) {
    rules.push(`Code is formatted with ${context.formatter.name}. Run formatter before committing.`);
  }
  if (style.semicolons !== null) {
    rules.push(style.semicolons ? "Always include semicolons." : "No semicolons.");
  }
  if (style.quotes !== null) {
    rules.push(`Use ${style.quotes} quotes for strings.`);
  }
  if (style.trailingComma !== null) {
    rules.push(style.trailingComma ? "Use trailing commas in multi-line structures." : "No trailing commas.");
  }
  if (style.indentation) {
    rules.push(`Indent with ${style.indentation.size} ${style.indentation.style}.`);
  }
  if (style.maxLineLength) {
    rules.push(`Keep lines under ${style.maxLineLength} characters.`);
  }
  if (style.importOrder) {
    rules.push("Sort imports: external packages first, then internal modules, then relative imports.");
  }
  return rules;
}
function buildTestingRules(context) {
  const rules = [];
  if (!context.testRunner) return rules;
  rules.push(`Use ${context.testRunner.name} for all tests.`);
  if (context.testRunner.command) {
    rules.push(`Run tests with: \`${context.testRunner.command}\``);
  }
  if (context.testPattern) {
    rules.push(`Test files follow pattern: \`${context.testPattern}\``);
  }
  if (context.testLocation === "colocated") {
    rules.push("Place test files next to the source files they test.");
  } else if (context.testLocation) {
    rules.push(`Tests live in \`${context.testLocation}\``);
  }
  return rules;
}
function buildCommandRules(context) {
  const rules = [];
  if (context.commands.length === 0) return rules;
  const keyCommands = context.commands.filter(
    (c) => ["dev", "build", "test", "lint", "typecheck", "type-check", "check"].includes(c.name)
  );
  if (keyCommands.length > 0) {
    rules.push("Key commands:");
    for (const cmd of keyCommands) {
      rules.push(`  ${cmd.command} (${cmd.name})`);
    }
  }
  return rules;
}
function buildArchitectureRules(context) {
  const rules = [];
  if (context.structure.layout === "feature-based") {
    rules.push("This project uses feature-based architecture. Group related files by feature, not by file type.");
  } else if (context.structure.layout === "layer-based") {
    rules.push("This project uses layer-based architecture (components/, services/, hooks/, etc.).");
  }
  if (context.monorepo) {
    rules.push(`This is a ${context.monorepo.tool} monorepo with packages: ${context.monorepo.packages.join(", ")}.`);
  }
  const networking = context.keyDependencies.filter((d) => d.category === "networking");
  if (networking.length > 0) {
    rules.push(`Use ${networking.map((d) => d.name).join(" or ")} for data fetching.`);
  }
  const state = context.keyDependencies.filter((d) => d.category === "state");
  if (state.length > 0) {
    rules.push(`State management: ${state.map((d) => d.name).join(", ")}`);
  }
  return rules;
}
function buildGitRules(context) {
  const rules = [];
  const git = context.gitConventions;
  if (git?.usesConventionalCommits) {
    rules.push("Follow Conventional Commits: feat|fix|docs|chore|refactor|test|perf(scope): description");
  }
  return rules;
}
function formatCursor(context) {
  const sections = [];
  const allRules = [
    ...buildLanguageRules(context),
    "",
    ...buildStyleRules(context),
    "",
    ...buildTestingRules(context),
    "",
    ...buildCommandRules(context),
    "",
    ...buildArchitectureRules(context),
    "",
    ...buildGitRules(context)
  ];
  const cleaned = allRules.reduce((acc, rule) => {
    if (rule === "" && acc[acc.length - 1] === "") return acc;
    acc.push(rule);
    return acc;
  }, []);
  sections.push(cleaned.join("\n").trim());
  return sections.join("\n");
}

// src/hooks/installer.ts
import fs18 from "fs";
import path17 from "path";
import { execSync as execSync2 } from "child_process";

// src/hooks/hook-script.ts
function getHookScript(hookType, npxPath) {
  return `#!/bin/sh
# .git/hooks/${hookType}
# Auto-generated by RuleGen \u2014 do not edit manually
# https://github.com/sutheesh/rulegen

# Run RuleGen scan (< 2 seconds, local only, no network)
${npxPath} rulegen --hook 2>/dev/null || true

# Stage any updated rules files
git add -f CLAUDE.md .cursorrules .github/copilot-instructions.md .windsurfrules AGENTS.md 2>/dev/null || true

# Always exit 0 \u2014 never block a commit because of rules generation
exit 0
`;
}

// src/hooks/installer.ts
function findGitRoot(startDir) {
  try {
    const result = execSync2("git rev-parse --show-toplevel 2>/dev/null", {
      cwd: startDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3e3
    });
    return result.trim();
  } catch {
    return null;
  }
}
function findNpx() {
  try {
    execSync2("npx --version", { stdio: "ignore", timeout: 2e3 });
    return "npx";
  } catch {
    return "npx";
  }
}
function installGitHook(projectDir, hookType = "pre-commit") {
  const gitRoot = findGitRoot(projectDir);
  if (!gitRoot) return false;
  const hooksDir = path17.join(gitRoot, ".git", "hooks");
  const hookPath = path17.join(hooksDir, hookType);
  try {
    if (fs18.existsSync(hookPath)) {
      const existing = fs18.readFileSync(hookPath, "utf-8");
      if (existing.includes("rulegen")) return true;
      const backupPath = `${hookPath}.pre-rulegen`;
      fs18.copyFileSync(hookPath, backupPath);
      const combined = existing.trimEnd() + "\n\n# RuleGen hook\n" + getHookScript(hookType, findNpx()).split("\n").slice(5).join("\n");
      fs18.writeFileSync(hookPath, combined, { mode: 493 });
      return true;
    }
    if (!fs18.existsSync(hooksDir)) {
      fs18.mkdirSync(hooksDir, { recursive: true });
    }
    fs18.writeFileSync(hookPath, getHookScript(hookType, findNpx()), { mode: 493 });
    return true;
  } catch {
    return false;
  }
}
function isInGitRepo(projectDir) {
  return findGitRoot(projectDir) !== null;
}

// src/index.ts
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    agent: "claude",
    dryRun: false,
    postinstall: false,
    hook: false,
    ci: false,
    silent: false,
    rootDir: process.cwd(),
    output: null
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--agent":
        opts.agent = args[++i] ?? "claude";
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--postinstall":
        opts.postinstall = true;
        opts.silent = true;
        break;
      case "--hook":
        opts.hook = true;
        opts.silent = true;
        break;
      case "--ci":
        opts.ci = true;
        break;
      case "--silent":
        opts.silent = true;
        break;
      case "--output":
        opts.output = args[++i] ?? null;
        break;
      case "--version":
      case "-v":
        process.stdout.write("1.0.0\n");
        process.exit(0);
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }
  return opts;
}
function printHelp() {
  process.stdout.write(`
rulegen \u2014 Auto-generate AI coding rules from your codebase

Usage:
  rulegen [options]

Options:
  --agent <name>    Agent to generate for: claude (default), cursor, all
  --dry-run         Print output without writing files
  --silent          Suppress all output
  --output <dir>    Output directory (default: current directory)
  --version         Show version
  --help            Show this help

Examples:
  rulegen                    Generate CLAUDE.md
  rulegen --agent cursor     Generate .cursorrules
  rulegen --agent all        Generate all formats
  rulegen --dry-run          Preview output
`.trim() + "\n");
}
function getOutputPath(agent, rootDir) {
  const paths = {
    claude: "CLAUDE.md",
    cursor: ".cursorrules",
    copilot: ".github/copilot-instructions.md",
    windsurf: ".windsurfrules",
    codex: "AGENTS.md"
  };
  return path18.join(rootDir, paths[agent] ?? "CLAUDE.md");
}
function generateContent(agent, context) {
  switch (agent) {
    case "cursor":
      return formatCursor(context);
    case "claude":
    default:
      return formatClaude(context);
  }
}
function writeOutput(outputPath, content) {
  const dir = path18.dirname(outputPath);
  if (!fs19.existsSync(dir)) fs19.mkdirSync(dir, { recursive: true });
  const merged = mergeWithExisting(content, outputPath);
  fs19.writeFileSync(outputPath, merged, "utf-8");
}
function detectProjectName(rootDir) {
  return path18.basename(rootDir);
}
function summarize(context) {
  const parts = [];
  const primary = context.frameworks[0] ?? context.languages[0];
  if (primary) parts.push(primary.name);
  const secondary = context.frameworks[1] ?? context.languages[1];
  if (secondary) parts.push(secondary.name);
  if (context.testRunner) parts.push(context.testRunner.name);
  return parts.join(" + ") || "project detected";
}
function resolvePostinstallRoot() {
  const initCwd = process.env["INIT_CWD"];
  if (initCwd) return initCwd;
  let dir = path18.dirname(new URL(import.meta.url).pathname);
  for (let i = 0; i < 6; i++) {
    const pkgPath = path18.join(dir, "package.json");
    try {
      const pkg = JSON.parse(fs19.readFileSync(pkgPath, "utf-8"));
      if (pkg.name !== "rulegen") return dir;
    } catch {
    }
    dir = path18.dirname(dir);
  }
  return process.cwd();
}
function isSelfInstall(projectRoot) {
  try {
    const pkg = JSON.parse(fs19.readFileSync(path18.join(projectRoot, "package.json"), "utf-8"));
    return pkg.name === "rulegen";
  } catch {
    return false;
  }
}
async function run() {
  const opts = parseArgs(process.argv);
  const rootDir = opts.output ? path18.resolve(opts.output) : process.cwd();
  if (opts.postinstall) {
    const projectRoot = resolvePostinstallRoot();
    if (isSelfInstall(projectRoot)) process.exit(0);
    if (!isInGitRepo(projectRoot)) {
      process.exit(0);
    }
    try {
      const context2 = scan(projectRoot);
      const hash = hashContext(context2);
      const lastHash = readLastHash(projectRoot);
      const claudePath = path18.join(projectRoot, "CLAUDE.md");
      const needsGeneration = !fs19.existsSync(claudePath) || hash !== lastHash;
      if (needsGeneration) {
        const content = generateContent("claude", context2);
        writeOutput(claudePath, content);
        writeHash(projectRoot, hash);
        if (!opts.silent) {
          process.stdout.write(`\u2713 RuleGen: generated CLAUDE.md (${summarize(context2)} detected)
`);
        }
      }
      installGitHook(projectRoot);
    } catch {
    }
    process.exit(0);
  }
  if (opts.hook) {
    try {
      const context2 = scan(rootDir);
      const hash = hashContext(context2);
      const lastHash = readLastHash(rootDir);
      if (hash !== lastHash) {
        const agents2 = ["claude"];
        for (const agent of agents2) {
          const outputPath = getOutputPath(agent, rootDir);
          const content = generateContent(agent, context2);
          writeOutput(outputPath, content);
        }
        writeHash(rootDir, hash);
      }
    } catch {
    }
    process.exit(0);
  }
  const context = scan(rootDir);
  const agents = opts.agent === "all" ? ["claude", "cursor"] : [opts.agent];
  for (const agent of agents) {
    const outputPath = getOutputPath(agent, rootDir);
    const content = generateContent(agent, context);
    if (opts.dryRun) {
      process.stdout.write(`
--- ${path18.basename(outputPath)} ---
`);
      process.stdout.write(content + "\n");
    } else {
      writeOutput(outputPath, content);
      if (!opts.silent) {
        process.stdout.write(`\u2713 Generated ${path18.basename(outputPath)} for ${detectProjectName(rootDir)}
`);
      }
    }
  }
  if (!opts.dryRun) {
    writeHash(rootDir, hashContext(context));
  }
}
run().catch((err) => {
  process.stderr.write(`rulegen error: ${err instanceof Error ? err.message : String(err)}
`);
  process.exit(1);
});
//# sourceMappingURL=index.js.map