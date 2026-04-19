export interface ProjectContext {
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  platforms: Platform[];
  packageManager: string | null;
  commands: CommandInfo[];
  buildTool: string | null;
  linter: LinterInfo | null;
  formatter: FormatterInfo | null;
  codeStyle: CodeStyleRules;
  structure: DirectoryStructure;
  monorepo: MonorepoInfo | null;
  keyDependencies: DependencyInfo[];
  testRunner: TestRunnerInfo | null;
  testPattern: string | null;
  testLocation: string | null;
  typescriptConfig: TypeScriptConfig | null;
  gitConventions: GitConventions | null;
  android: AndroidInfo | null;
  ios: IOSInfo | null;
}

export type Platform = 'web' | 'ios' | 'android' | 'server' | 'desktop' | 'cross-platform';

export interface LanguageInfo {
  name: string;
  version: string | null;
  configFile: string;
}

export interface FrameworkInfo {
  name: string;
  version: string | null;
  detectedFrom: string;
}

export interface CommandInfo {
  name: string;
  command: string;
  source: string;
}

export interface LinterInfo {
  name: string;
  configFile: string;
  rules: LinterRules;
}

export interface LinterRules {
  noAny: boolean | null;
  noUnusedVars: boolean | null;
  importOrder: string | null;
  namingConvention: string | null;
  maxLineLength: number | null;
  customRules: string[];
}

export interface FormatterInfo {
  name: string;
  configFile: string;
  options: FormatterOptions;
}

export interface FormatterOptions {
  semi: boolean | null;
  singleQuote: boolean | null;
  tabWidth: number | null;
  useTabs: boolean | null;
  trailingComma: string | null;
  printWidth: number | null;
}

export interface CodeStyleRules {
  indentation: { style: 'spaces' | 'tabs'; size: number } | null;
  semicolons: boolean | null;
  quotes: 'single' | 'double' | null;
  trailingComma: boolean | null;
  maxLineLength: number | null;
  namingConvention: string | null;
  importOrder: string | null;
  noAny: boolean | null;
  preferConst: boolean | null;
  preferFunctional: boolean | null;
  customRules: string[];
}

export interface DirectoryStructure {
  rootName: string;
  hasSrc: boolean;
  hasApp: boolean;
  hasLib: boolean;
  hasPackages: boolean;
  testDirs: string[];
  configDirs: string[];
  platformDirs: string[];
  layout: 'feature-based' | 'layer-based' | 'flat' | 'unknown';
  collocatedTests: boolean;
}

export interface MonorepoInfo {
  tool: 'turborepo' | 'nx' | 'lerna' | 'pnpm-workspaces' | 'npm-workspaces' | 'yarn-workspaces';
  packages: string[];
  configFile: string;
}

export interface DependencyInfo {
  name: string;
  version: string | null;
  category: 'orm' | 'auth' | 'state' | 'ui' | 'networking' | 'testing' | 'other';
}

export interface TestRunnerInfo {
  name: string;
  configFile: string | null;
  command: string | null;
}

export interface TypeScriptConfig {
  strict: boolean;
  strictNullChecks: boolean;
  noImplicitAny: boolean;
  target: string | null;
  pathAliases: Record<string, string[]>;
  baseUrl: string | null;
  moduleResolution: string | null;
}

export interface GitConventions {
  usesConventionalCommits: boolean;
  usesIssueRefs: boolean;
  usesScopes: boolean;
  exampleCommits: string[];
  hasPRTemplate: boolean;
}

export interface AndroidInfo {
  minSdk: number | null;
  targetSdk: number | null;
  compileSdk: number | null;
  agpVersion: string | null;
  kotlinVersion: string | null;
  uiFramework: 'compose' | 'xml' | 'both';
  di: string | null;
  database: string | null;
  networking: string | null;
  architecture: string | null;
  modules: string[];
}

export interface IOSInfo {
  swiftVersion: string | null;
  deploymentTarget: string | null;
  uiFramework: 'swiftui' | 'uikit' | 'both';
  packageManager: 'spm' | 'cocoapods' | 'tuist' | null;
  persistence: string | null;
  architecture: string | null;
  hasFoundationModels: boolean;
  hasCoreML: boolean;
}

export interface RuleGenConfig {
  agents: string[];
  hook: 'pre-commit' | 'pre-push' | 'none';
  exclude: string[];
  custom: Record<string, string>;
  silent: boolean;
}

export interface ScanResult {
  context: ProjectContext;
  changed: boolean;
  previousHash: string | null;
  currentHash: string;
}
