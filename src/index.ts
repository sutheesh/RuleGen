import fs from 'fs';
import path from 'path';
import { scan, hashContext, readLastHash, writeHash } from './core/scanner.js';
import { mergeWithExisting } from './core/merger.js';
import { formatClaude } from './formatters/claude.js';
import { formatCursor } from './formatters/cursor.js';
import { formatCopilot } from './formatters/copilot.js';
import { formatWindsurf } from './formatters/windsurf.js';
import { formatCodex } from './formatters/codex.js';
import { installGitHook, isInGitRepo } from './hooks/installer.js';

interface CLIOptions {
  agent: string;
  dryRun: boolean;
  postinstall: boolean;
  hook: boolean;
  ci: boolean;
  silent: boolean;
  rootDir: string;
  output: string | null;
}

function parseArgs(argv: string[]): CLIOptions {
  const args = argv.slice(2);
  const opts: CLIOptions = {
    agent: 'claude',
    dryRun: false,
    postinstall: false,
    hook: false,
    ci: false,
    silent: false,
    rootDir: process.cwd(),
    output: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--agent':
        opts.agent = args[++i] ?? 'claude';
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--postinstall':
        opts.postinstall = true;
        opts.silent = true;
        break;
      case '--hook':
        opts.hook = true;
        opts.silent = true;
        break;
      case '--ci':
        opts.ci = true;
        break;
      case '--silent':
        opts.silent = true;
        break;
      case '--output':
        opts.output = args[++i] ?? null;
        break;
      case '--version':
      case '-v':
        process.stdout.write('1.0.0\n');
        process.exit(0);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return opts;
}

function printHelp(): void {
  process.stdout.write(`
rulegen — Auto-generate AI coding rules from your codebase

Usage:
  rulegen [options]

Options:
  --agent <name>    Agent to generate for: claude (default), cursor, copilot, windsurf, codex, all
  --dry-run         Print output without writing files
  --silent          Suppress all output
  --output <dir>    Output directory (default: current directory)
  --version         Show version
  --help            Show this help

Examples:
  rulegen                    Generate CLAUDE.md
  rulegen --agent cursor     Generate .cursorrules
  rulegen --agent copilot    Generate .github/copilot-instructions.md
  rulegen --agent windsurf   Generate .windsurfrules
  rulegen --agent codex      Generate AGENTS.md
  rulegen --agent all        Generate all formats
  rulegen --dry-run          Preview output
`.trim() + '\n');
}

function getOutputPath(agent: string, rootDir: string): string {
  const paths: Record<string, string> = {
    claude: 'CLAUDE.md',
    cursor: '.cursorrules',
    copilot: '.github/copilot-instructions.md',
    windsurf: '.windsurfrules',
    codex: 'AGENTS.md',
  };
  return path.join(rootDir, paths[agent] ?? 'CLAUDE.md');
}

function generateContent(agent: string, context: ReturnType<typeof scan>): string {
  switch (agent) {
    case 'cursor':   return formatCursor(context);
    case 'copilot':  return formatCopilot(context);
    case 'windsurf': return formatWindsurf(context);
    case 'codex':    return formatCodex(context);
    case 'claude':
    default:
      return formatClaude(context);
  }
}

function writeOutput(outputPath: string, content: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const merged = mergeWithExisting(content, outputPath);
  fs.writeFileSync(outputPath, merged, 'utf-8');
}

function detectProjectName(rootDir: string): string {
  return path.basename(rootDir);
}

function summarize(context: ReturnType<typeof scan>): string {
  const parts: string[] = [];

  const primary = context.frameworks[0] ?? context.languages[0];
  if (primary) parts.push(primary.name);

  const secondary = context.frameworks[1] ?? context.languages[1];
  if (secondary) parts.push(secondary.name);

  if (context.testRunner) parts.push(context.testRunner.name);

  return parts.join(' + ') || 'project detected';
}

function resolvePostinstallRoot(): string {
  // npm sets INIT_CWD to the directory where `npm install` was run.
  // process.cwd() inside postinstall is node_modules/rulegen/ — wrong target.
  const initCwd = process.env['INIT_CWD'];
  if (initCwd) return initCwd;
  // Fallback: walk up from __dirname until we find a package.json that isn't ours
  let dir = path.dirname(new URL(import.meta.url).pathname);
  for (let i = 0; i < 6; i++) {
    const pkgPath = path.join(dir, 'package.json');
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
      if (pkg.name !== 'rulegen') return dir;
    } catch { /* keep walking */ }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function isSelfInstall(projectRoot: string): boolean {
  // Avoid running postinstall when `npm install` is run inside the RuleGen repo itself
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')) as { name?: string };
    return pkg.name === 'rulegen';
  } catch {
    return false;
  }
}

async function run(): Promise<void> {
  const opts = parseArgs(process.argv);
  const rootDir = opts.output ? path.resolve(opts.output) : process.cwd();

  if (opts.postinstall) {
    const projectRoot = resolvePostinstallRoot();

    // Skip when `npm install` is run inside the RuleGen dev repo itself
    if (isSelfInstall(projectRoot)) process.exit(0);

    if (!isInGitRepo(projectRoot)) {
      process.exit(0);
    }

    try {
      const context = scan(projectRoot);
      const hash = hashContext(context);
      const lastHash = readLastHash(projectRoot);

      const claudePath = path.join(projectRoot, 'CLAUDE.md');
      const needsGeneration = !fs.existsSync(claudePath) || hash !== lastHash;

      if (needsGeneration) {
        const content = generateContent('claude', context);
        writeOutput(claudePath, content);
        writeHash(projectRoot, hash);

        if (!opts.silent) {
          process.stdout.write(`✓ RuleGen: generated CLAUDE.md (${summarize(context)} detected)\n`);
        }
      }

      installGitHook(projectRoot);
    } catch {
      // Never fail postinstall
    }
    process.exit(0);
  }

  if (opts.hook) {
    try {
      const context = scan(rootDir);
      const hash = hashContext(context);
      const lastHash = readLastHash(rootDir);

      if (hash !== lastHash) {
        const agents = ['claude'];
        for (const agent of agents) {
          const outputPath = getOutputPath(agent, rootDir);
          const content = generateContent(agent, context);
          writeOutput(outputPath, content);
        }
        writeHash(rootDir, hash);
      }
    } catch {
      // Never fail git hook
    }
    process.exit(0);
  }

  const context = scan(rootDir);

  const agents = opts.agent === 'all'
    ? ['claude', 'cursor', 'copilot', 'windsurf', 'codex']
    : [opts.agent];

  for (const agent of agents) {
    const outputPath = getOutputPath(agent, rootDir);
    const content = generateContent(agent, context);

    if (opts.dryRun) {
      process.stdout.write(`\n--- ${path.basename(outputPath)} ---\n`);
      process.stdout.write(content + '\n');
    } else {
      writeOutput(outputPath, content);
      if (!opts.silent) {
        process.stdout.write(`✓ Generated ${path.basename(outputPath)} for ${detectProjectName(rootDir)}\n`);
      }
    }
  }

  if (!opts.dryRun) {
    writeHash(rootDir, hashContext(context));
  }
}

run().catch(err => {
  process.stderr.write(`rulegen error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
