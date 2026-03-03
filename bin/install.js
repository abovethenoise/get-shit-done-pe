#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');
const { runValidation } = require('../scripts/validate-install');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// CLAUDE.md delimiters
const CLAUDE_MD_START = '<!-- GSD-PE:START -->';
const CLAUDE_MD_END = '<!-- GSD-PE:END -->';

// Get version from package.json
const pkg = require('../package.json');

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');

const banner = '\n' +
  cyan + '   ██████╗ ███████╗██████╗\n' +
  '  ██╔════╝ ██╔════╝██╔══██╗\n' +
  '  ██║  ███╗███████╗██║  ██║\n' +
  '  ██║   ██║╚════██║██║  ██║\n' +
  '  ╚██████╔╝███████║██████╔╝\n' +
  '   ╚═════╝ ╚══════╝╚═════╝' + reset + '\n' +
  '\n' +
  '  get-shit-done-pe ' + dim + 'v' + pkg.version + reset + '\n' +
  '  Product management insight for Claude Code.\n' +
  '  by abovethenoise — built on GSD by TÂCHES.\n';

// Parse --config-dir argument
function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    // Error if --config-dir is provided without a value or next arg is another flag
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  // Also handle --config-dir=value format
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    const value = configDirArg.split('=')[1];
    if (!value) {
      console.error(`  ${yellow}--config-dir requires a non-empty path${reset}`);
      process.exit(1);
    }
    return value;
  }
  return null;
}
const ccWarnings = [];
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');
const forceStatusline = args.includes('--force-statusline');

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx get-shit-done-pe [options]\n\n  ${yellow}Options:${reset}\n    ${cyan}-g, --global${reset}              Install globally (to config directory)\n    ${cyan}-l, --local${reset}               Install locally (to current directory)\n    ${cyan}-u, --uninstall${reset}           Uninstall GSD (remove all GSD files)\n    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory\n    ${cyan}-h, --help${reset}                Show this help message\n    ${cyan}--force-statusline${reset}        Replace existing statusline config\n\n  ${yellow}Examples:${reset}\n    ${dim}# Interactive install (prompts for location)${reset}\n    npx get-shit-done-pe\n\n    ${dim}# Install globally${reset}\n    npx get-shit-done-pe --global\n\n    ${dim}# Install to custom config directory${reset}\n    npx get-shit-done-pe --global --config-dir ~/.claude-work\n\n    ${dim}# Install to current project only${reset}\n    npx get-shit-done-pe --local\n\n    ${dim}# Uninstall GSD globally${reset}\n    npx get-shit-done-pe --global --uninstall\n\n  ${yellow}Notes:${reset}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over the CLAUDE_CONFIG_DIR environment variable.\n`);
  process.exit(0);
}

/**
 * Expand ~ to home directory (shell doesn't expand in env vars passed to node)
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Get the global config directory for Claude Code
 * @param {string|null} explicitDir - Explicit directory from --config-dir flag
 */
function getGlobalDir(explicitDir = null) {
  if (explicitDir) {
    return expandTilde(explicitDir);
  }
  if (process.env.CLAUDE_CONFIG_DIR) {
    return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.claude');
}

/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 */
function buildHookCommand(configDir, hookName) {
  const hooksPath = configDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
}

/**
 * Read and parse settings.json, returning empty object if it doesn't exist
 */
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json with proper formatting
 */
function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

/**
 * Get commit attribution setting for Claude Code
 * @returns {null|undefined|string} null = remove, undefined = keep default, string = custom
 */
function getCommitAttribution() {
  const settings = readSettings(path.join(getGlobalDir(explicitConfigDir), 'settings.json'));
  if (!settings.attribution || settings.attribution.commit === undefined) {
    return undefined;
  } else if (settings.attribution.commit === '') {
    return null;
  } else {
    return settings.attribution.commit;
  }
}

/**
 * Process Co-Authored-By lines based on attribution setting
 * @param {string} content - File content to process
 * @param {null|undefined|string} attribution - null=remove, undefined=keep, string=replace
 * @returns {string} Processed content
 */
function processAttribution(content, attribution) {
  if (attribution === null) {
    // Remove Co-Authored-By lines and the preceding blank line
    return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, '');
  }
  if (attribution === undefined) {
    return content;
  }
  // Replace with custom attribution (escape $ to prevent backreference injection)
  const safeAttribution = attribution.replace(/\$/g, '$$$$');
  return content.replace(/Co-Authored-By:.*$/gim, `Co-Authored-By: ${safeAttribution}`);
}

/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @param {string} pathPrefix - Path prefix for file references
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix) {
  // Clean install: remove existing destination to prevent orphaned files
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const attribution = getCommitAttribution();

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix);
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      const gsdRootRegex = /\{GSD_ROOT\}\//g;
      content = content.replace(gsdRootRegex, pathPrefix);
      content = processAttribution(content, attribution);
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Clean up orphaned files from previous GSD versions
 */
function cleanupOrphanedFiles(configDir) {
  const orphanedFiles = [
    'hooks/gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
  ];

  for (const relPath of orphanedFiles) {
    const fullPath = path.join(configDir, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

/**
 * Clean up orphaned hook registrations from settings.json
 */
function cleanupOrphanedHooks(settings) {
  const orphanedHookPatterns = [
    'gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
    'gsd-intel-index.js',  // Removed in v1.9.2
    'gsd-intel-session.js',  // Removed in v1.9.2
    'gsd-intel-prune.js',  // Removed in v1.9.2
    'gsd-check-update',  // cc orphan — removed in pe
  ];

  let cleanedHooks = false;

  // Check all hook event types (Stop, SessionStart, etc.)
  if (settings.hooks) {
    for (const eventType of Object.keys(settings.hooks)) {
      const hookEntries = settings.hooks[eventType];
      if (Array.isArray(hookEntries)) {
        // Filter out entries that contain orphaned hooks
        const filtered = hookEntries.filter(entry => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            const hasOrphaned = entry.hooks.some(h =>
              h.command && orphanedHookPatterns.some(pattern => h.command.includes(pattern))
            );
            if (hasOrphaned) {
              cleanedHooks = true;
              return false;
            }
          }
          return true;
        });
        settings.hooks[eventType] = filtered;
      }
    }
  }

  // Orphaned hooks cleaned silently

  // Fix #330: Update statusLine if it points to old GSD statusline.js path
  if (settings.statusLine && settings.statusLine.command &&
      /hooks[\/\\]statusline\.js/.test(settings.statusLine.command)) {
    settings.statusLine.command = settings.statusLine.command.replace(
      /hooks([\/\\])statusline\.js/,
      'hooks$1gsd-statusline.js'
    );
    // Statusline path updated silently
  }

  return settings;
}

/**
 * Detect and remove get-shit-done-cc artifacts before pe install
 * @param {string} configDir - The target config directory (~/.claude or explicit)
 * @returns {{ ccWarnings: string[] }}
 */
function replaceCc(configDir) {
  // 1. Detect cc global install
  let ccInstalled = false;
  try {
    execSync('npm list -g get-shit-done-cc --depth=0', { stdio: 'pipe' });
    ccInstalled = true;
  } catch (e) {
    ccInstalled = false; // exit 1 = not installed
  }

  // 2. Uninstall upstream package (best-effort)
  if (ccInstalled) {
    try {
      execSync('npm uninstall -g get-shit-done-cc', { stdio: 'pipe' });
    } catch (e) {
      ccWarnings.push('cc uninstall failed — manual cleanup may be needed');
    }
  }

  // 3. Remnant file scan — run unconditionally
  // Remove gsd:* commands (files named gsd:*)
  const commandsDir = path.join(configDir, 'commands');
  if (fs.existsSync(commandsDir)) {
    for (const entry of fs.readdirSync(commandsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.startsWith('gsd:')) {
        fs.unlinkSync(path.join(commandsDir, entry.name));
      }
    }
  }

  // Remove gsd-* agents (files named gsd-*.md at agents/ level only, not subdirs)
  const agentsDir = path.join(configDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.startsWith('gsd-')) {
        fs.unlinkSync(path.join(agentsDir, entry.name));
      }
    }
  }

  // Remove get-shit-done/ directory (cc artifact — pe uses same name, will be freshly installed)
  const gsdDir = path.join(configDir, 'get-shit-done');
  if (fs.existsSync(gsdDir)) {
    fs.rmSync(gsdDir, { recursive: true });
  }

  // Remove hooks/dist/ (cc build artifact)
  const hooksDist = path.join(configDir, 'hooks', 'dist');
  if (fs.existsSync(hooksDist)) {
    fs.rmSync(hooksDist, { recursive: true });
  }

  return { ccWarnings };
}

/**
 * Write pe content to CLAUDE.md using delimiters for safe future removal
 * @param {string} configDir - The target config directory
 * @param {string} peContent - The content to write between delimiters
 */
function writeClaudeMd(configDir, peContent) {
  const claudeMdPath = path.join(configDir, 'CLAUDE.md');
  const block = `\n${CLAUDE_MD_START}\n${peContent}\n${CLAUDE_MD_END}\n`;

  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, block);
    return;
  }

  let existing = fs.readFileSync(claudeMdPath, 'utf8');
  const startIdx = existing.indexOf(CLAUDE_MD_START);
  const endIdx = existing.indexOf(CLAUDE_MD_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Replace existing delimited block
    existing = existing.slice(0, startIdx) + block.trimStart() + existing.slice(endIdx + CLAUDE_MD_END.length);
  } else {
    // Append new delimited block
    existing = existing.trimEnd() + '\n' + block;
  }

  fs.writeFileSync(claudeMdPath, existing);
}

/**
 * Strip GSD-PE delimited content from CLAUDE.md
 * @param {string} configDir - The target config directory
 * @returns {{ stripped: boolean, warned: boolean }}
 */
function stripClaudeMd(configDir) {
  const claudeMdPath = path.join(configDir, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    return { stripped: false, warned: false };
  }

  const content = fs.readFileSync(claudeMdPath, 'utf8');
  const startIdx = content.indexOf(CLAUDE_MD_START);
  const endIdx = content.indexOf(CLAUDE_MD_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = content.slice(0, startIdx).trimEnd();
    const after = content.slice(endIdx + CLAUDE_MD_END.length).trimStart();
    const newContent = [before, after].filter(Boolean).join('\n') + '\n';
    fs.writeFileSync(claudeMdPath, newContent);
    return { stripped: true, warned: false };
  }

  // No delimiters — warn, don't touch
  return { stripped: false, warned: true };
}

/**
 * Uninstall GSD from the specified directory
 * Removes only GSD-specific files/directories, preserves user content
 * @param {boolean} isGlobal - Whether to uninstall from global or local
 */
function uninstall(isGlobal) {
  const targetDir = isGlobal
    ? getGlobalDir(explicitConfigDir)
    : path.join(process.cwd(), '.claude');

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  console.log(`  Uninstalling GSD from ${cyan}Claude Code${reset} at ${cyan}${locationLabel}${reset}\n`);

  if (!fs.existsSync(targetDir)) {
    console.log(`  ${yellow}⚠${reset} Directory does not exist: ${locationLabel}`);
    console.log(`  Nothing to uninstall.\n`);
    return;
  }

  let removedCount = 0;

  // 1. Remove commands/gsd/ directory
  const gsdCommandsDir = path.join(targetDir, 'commands', 'gsd');
  if (fs.existsSync(gsdCommandsDir)) {
    fs.rmSync(gsdCommandsDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed commands/gsd/`);
  }

  // 2. Remove get-shit-done directory
  const gsdDir = path.join(targetDir, 'get-shit-done');
  if (fs.existsSync(gsdDir)) {
    fs.rmSync(gsdDir, { recursive: true });
    removedCount++;
    console.log(`  ${green}✓${reset} Removed get-shit-done/`);
  }

  // 3. Remove GSD agents (gsd-*.md files only)
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir);
    let agentCount = 0;
    for (const file of files) {
      if (file.startsWith('gsd-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        agentCount++;
      }
    }
    if (agentCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${agentCount} GSD agents`);
    }
  }

  // 4. Remove GSD hooks
  const hooksDir = path.join(targetDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const gsdHooks = ['gsd-statusline.js', 'gsd-context-monitor.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js'];
    let hookCount = 0;
    for (const hook of gsdHooks) {
      const hookPath = path.join(hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath);
        hookCount++;
      }
    }
    if (hookCount > 0) {
      removedCount++;
      console.log(`  ${green}✓${reset} Removed ${hookCount} GSD hooks`);
    }
  }

  // 5. Remove GSD package.json (CommonJS mode marker)
  const pkgJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const content = fs.readFileSync(pkgJsonPath, 'utf8').trim();
      if (content === '{"type":"commonjs"}') {
        fs.unlinkSync(pkgJsonPath);
        removedCount++;
        console.log(`  ${green}✓${reset} Removed GSD package.json`);
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  // 6. Clean up settings.json (remove GSD hooks and statusline)
  const settingsPath = path.join(targetDir, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    let settings = readSettings(settingsPath);
    let settingsModified = false;

    // Remove GSD statusline if it references our hook
    if (settings.statusLine && settings.statusLine.command &&
        settings.statusLine.command.includes('gsd-statusline')) {
      delete settings.statusLine;
      settingsModified = true;
      console.log(`  ${green}✓${reset} Removed GSD statusline from settings`);
    }

    // Remove GSD hooks from SessionStart
    if (settings.hooks && settings.hooks.SessionStart) {
      const before = settings.hooks.SessionStart.length;
      settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
        if (entry.hooks && Array.isArray(entry.hooks)) {
          const hasGsdHook = entry.hooks.some(h =>
            h.command && (
              h.command.includes('gsd-statusline') ||
              h.command.includes('gsd-auto-update')
            )
          );
          return !hasGsdHook;
        }
        return true;
      });
      if (settings.hooks.SessionStart.length < before) {
        settingsModified = true;
        console.log(`  ${green}✓${reset} Removed GSD hooks from settings`);
      }
      if (settings.hooks.SessionStart.length === 0) {
        delete settings.hooks.SessionStart;
      }
    }

    // Remove GSD hooks from PostToolUse
    if (settings.hooks && settings.hooks.PostToolUse) {
      const before = settings.hooks.PostToolUse.length;
      settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(entry => {
        if (entry.hooks && Array.isArray(entry.hooks)) {
          const hasGsdHook = entry.hooks.some(h =>
            h.command && (
              h.command.includes('gsd-context-monitor') ||
              h.command.includes('gsd-askuserquestion-guard')
            )
          );
          return !hasGsdHook;
        }
        return true;
      });
      if (settings.hooks.PostToolUse.length < before) {
        settingsModified = true;
        console.log(`  ${green}✓${reset} Removed context monitor hook from settings`);
      }
      if (settings.hooks.PostToolUse.length === 0) {
        delete settings.hooks.PostToolUse;
      }
    }

    // Clean up empty hooks object
    if (settings.hooks && Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }

    if (settingsModified) {
      writeSettings(settingsPath, settings);
      removedCount++;
    }
  }

  // Strip GSD-PE content from CLAUDE.md
  const claudeResult = stripClaudeMd(targetDir);
  if (claudeResult.stripped) {
    removedCount++;
    console.log(`  ${green}✓${reset} Removed GSD content from CLAUDE.md`);
  } else if (claudeResult.warned) {
    console.log(`  ${yellow}⚠${reset} Cannot safely remove GSD content from CLAUDE.md — please remove manually`);
  }

  if (removedCount === 0) {
    console.log(`  ${yellow}⚠${reset} No GSD files found to remove.`);
  }

  console.log(`
  ${green}Done!${reset} GSD has been uninstalled from Claude Code.
  Your other files and settings have been preserved.
`);
}

/**
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Scan installed directories for unresolved {GSD_ROOT} tokens
 * @param {string[]} dirs - Directories to scan
 * @returns {string[]} Files containing unresolved tokens
 */
function validateNoUnresolvedTokens(dirs) {
  const failures = [];
  function scan(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('{GSD_ROOT}')) failures.push(full);
      }
    }
  }
  for (const dir of dirs) {
    scan(dir);
  }
  return failures;
}

/**
 * Install to the specified directory for Claude Code
 * @param {boolean} isGlobal - Whether to install globally or locally
 */
function install(isGlobal) {
  const src = path.join(__dirname, '..');

  const targetDir = isGlobal
    ? getGlobalDir(explicitConfigDir)
    : path.join(process.cwd(), '.claude');

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  // Path prefix for file references in markdown content
  const pathPrefix = isGlobal
    ? `${targetDir.replace(/\\/g, '/')}/`
    : './.claude/';

  // Track installation failures
  const failures = [];

  // Detect and remove any prior cc installation
  replaceCc(targetDir);

  // Clean up orphaned files from previous versions
  cleanupOrphanedFiles(targetDir);

  // Install commands/gsd/
  const commandsDir = path.join(targetDir, 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  const gsdSrc = path.join(src, 'commands', 'gsd');
  const gsdDest = path.join(commandsDir, 'gsd');
  copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix);
  if (!verifyInstalled(gsdDest, 'commands/gsd')) {
    failures.push('commands/gsd');
  }

  // Copy get-shit-done skill with path replacement
  const skillSrc = path.join(src, 'get-shit-done');
  const skillDest = path.join(targetDir, 'get-shit-done');
  copyWithPathReplacement(skillSrc, skillDest, pathPrefix);
  if (!verifyInstalled(skillDest, 'get-shit-done')) {
    failures.push('get-shit-done');
  }

  // Copy agents to agents directory
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetDir, 'agents');
    fs.mkdirSync(agentsDest, { recursive: true });

    // Remove old GSD agents (gsd-*.md) before copying new ones
    if (fs.existsSync(agentsDest)) {
      for (const file of fs.readdirSync(agentsDest)) {
        if (file.startsWith('gsd-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(agentsDest, file));
        }
      }
    }

    // Copy new agents
    const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
    const attribution = getCommitAttribution();
    for (const entry of agentEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
        const gsdRootRegex = /\{GSD_ROOT\}\//g;
        content = content.replace(gsdRootRegex, pathPrefix);
        content = processAttribution(content, attribution);
        fs.writeFileSync(path.join(agentsDest, entry.name), content);
      }
    }
    if (!verifyInstalled(agentsDest, 'agents')) {
      failures.push('agents');
    }
  }

  // Write package.json to force CommonJS mode for GSD scripts
  const pkgJsonDest = path.join(targetDir, 'package.json');
  fs.writeFileSync(pkgJsonDest, '{"type":"commonjs"}\n');

  // Copy hooks
  const hooksSrc = path.join(src, 'hooks');
  if (fs.existsSync(hooksSrc)) {
    const hooksDest = path.join(targetDir, 'hooks');
    fs.mkdirSync(hooksDest, { recursive: true });
    const hookFiles = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js', 'gsd-auto-update.js'];
    for (const hookFile of hookFiles) {
      const srcFile = path.join(hooksSrc, hookFile);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(hooksDest, hookFile));
      }
    }
    if (verifyInstalled(hooksDest, 'hooks')) {
      // hooks installed successfully
    } else {
      failures.push('hooks');
    }
  }

  // Clean up legacy v1 artifacts
  const legacyCleanup = [
    path.join(targetDir, 'gsd-local-patches'),
    path.join(targetDir, 'gsd-file-manifest.json'),
    path.join(targetDir, 'get-shit-done', 'VERSION'),
  ];
  for (const p of legacyCleanup) {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
    }
  }

  if (failures.length > 0) {
    return { ok: false, step: failures[0], reason: 'directory missing or empty after copy' };
  }

  // Validate no unresolved {GSD_ROOT} tokens in installed files
  const tokenFailures = validateNoUnresolvedTokens([
    path.join(targetDir, 'commands', 'gsd'),
    path.join(targetDir, 'agents'),
    path.join(targetDir, 'get-shit-done'),
    path.join(targetDir, 'hooks'),
  ]);
  if (tokenFailures.length > 0) {
    return { ok: false, step: 'token replacement', reason: `unresolved {GSD_ROOT} in ${tokenFailures[0]}` };
  }

  // Initialize auto-update cache with current version
  const cacheDir = path.join(os.homedir(), '.claude', 'get-shit-done');
  const cachePath = path.join(cacheDir, '.update-check');
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    // Only write if missing or currentVersion is absent (don't reset lastCheck on re-install)
    let cacheData = {};
    if (fs.existsSync(cachePath)) {
      try { cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch (e) {}
    }
    cacheData.currentVersion = pkg.version;
    // Only reset lastCheck if missing (force check on fresh install)
    if (!cacheData.lastCheck) {
      cacheData.lastCheck = new Date(0).toISOString(); // epoch = always check
    }
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2) + '\n');
  } catch (e) {
    // Silent — cache init failure must not block install
  }

  // Configure statusline and hooks in settings.json
  try {
    const settingsPath = path.join(targetDir, 'settings.json');
    const settings = cleanupOrphanedHooks(readSettings(settingsPath));
    const statuslineCommand = isGlobal
      ? buildHookCommand(targetDir, 'gsd-statusline.js')
      : 'node .claude/hooks/gsd-statusline.js';
    const contextMonitorCommand = isGlobal
      ? buildHookCommand(targetDir, 'gsd-context-monitor.js')
      : 'node .claude/hooks/gsd-context-monitor.js';
    const askUserQuestionGuardCommand = isGlobal
      ? buildHookCommand(targetDir, 'gsd-askuserquestion-guard.js')
      : 'node .claude/hooks/gsd-askuserquestion-guard.js';
    const autoUpdateCommand = isGlobal
      ? buildHookCommand(targetDir, 'gsd-auto-update.js')
      : 'node .claude/hooks/gsd-auto-update.js';

    // Configure SessionStart hook
    if (!settings.hooks) {
      settings.hooks = {};
    }
    if (!settings.hooks.SessionStart) {
      settings.hooks.SessionStart = [];
    }

    // Clean up orphaned gsd-check-update hook (deleted predecessor to gsd-auto-update)
    settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
      if (entry.hooks && Array.isArray(entry.hooks)) {
        return !entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'));
      }
      return true;
    });

    // Configure SessionStart hook for auto-update
    const hasAutoUpdateHook = settings.hooks.SessionStart.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-auto-update'))
    );

    if (!hasAutoUpdateHook) {
      settings.hooks.SessionStart.push({
        hooks: [
          {
            type: 'command',
            command: autoUpdateCommand
          }
        ]
      });
    }

    // Configure PostToolUse hook for context window monitoring
    if (!settings.hooks.PostToolUse) {
      settings.hooks.PostToolUse = [];
    }

    const hasContextMonitorHook = settings.hooks.PostToolUse.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-context-monitor'))
    );

    if (!hasContextMonitorHook) {
      settings.hooks.PostToolUse.push({
        hooks: [
          {
            type: 'command',
            command: contextMonitorCommand
          }
        ]
      });
    }

    // Configure PostToolUse hook for AskUserQuestion empty-response guard
    const hasAskGuardHook = settings.hooks.PostToolUse.some(entry =>
      entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-askuserquestion-guard'))
    );

    if (!hasAskGuardHook) {
      settings.hooks.PostToolUse.push({
        matcher: 'AskUserQuestion',
        hooks: [
          {
            type: 'command',
            command: askUserQuestionGuardCommand
          }
        ]
      });
    }

    // Write pe attribution block to CLAUDE.md with delimiters
    const peClaudeMdContent = `# GSD — Get Shit Done\n\nInstalled by get-shit-done-pe. Run \`/gsd:new\` in a blank directory to get started.`;
    writeClaudeMd(targetDir, peClaudeMdContent);

    return { ok: true, settingsPath, settings, statuslineCommand };
  } catch (e) {
    return { ok: false, step: 'settings.json update', reason: e.message };
  }
}

/**
 * Apply statusline config, then print completion message
 */
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline) {
  if (shouldInstallStatusline) {
    settings.statusLine = {
      type: 'command',
      command: statuslineCommand
    };
    // Statusline configured silently
  }

  writeSettings(settingsPath, settings);

  console.log(`\n  Installed successfully.\n  Start a new Claude Code session and try /gsd:init\n`);
}

/**
 * Handle statusline configuration with optional prompt
 */
function handleStatusline(settings, isInteractive, callback) {
  const hasExisting = settings.statusLine != null;

  if (!hasExisting) {
    callback(true);
    return;
  }

  if (forceStatusline) {
    callback(true);
    return;
  }

  if (!isInteractive) {
    callback(false);
    return;
  }

  const existingCmd = settings.statusLine.command || settings.statusLine.url || '(custom)';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`
  ${yellow}⚠${reset} Existing statusline detected\n
  Your current statusline:
    ${dim}command: ${existingCmd}${reset}

  GSD includes a statusline showing:
    • Model name
    • Current task (from todo list)
    • Context window usage (color-coded)

  ${cyan}1${reset}) Keep existing
  ${cyan}2${reset}) Replace with GSD statusline
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    callback(choice === '2');
  });
}

/**
 * Prompt for install location
 */
function promptLocation() {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
    runInstall(true, false);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  const globalPath = getGlobalDir(explicitConfigDir).replace(os.homedir(), '~');

  console.log(`  ${yellow}Where would you like to install?${reset}\n\n  ${cyan}1${reset}) Global ${dim}(${globalPath})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(./.claude)${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    const isGlobal = choice !== '2';
    runInstall(isGlobal, true);
  });
}

/**
 * Run the install and finalize
 */
function runInstall(isGlobal, isInteractive) {
  const result = install(isGlobal);

  if (!result.ok) {
    console.log(`\n  Install failed: ${result.step} — ${result.reason}\n`);
    process.exit(1);
  }

  // Auto-validation (suppress validation's per-check console output)
  let validationResult;
  const origLog = console.log;
  const origError = console.error;
  try {
    console.log = () => {};
    console.error = () => {};
    validationResult = runValidation();
  } catch (e) {
    validationResult = { failed: 1, failures: [`validation error: ${e.message}`] };
  } finally {
    console.log = origLog;
    console.error = origError;
  }

  if (validationResult.failed > 0) {
    const firstFailure = validationResult.failures[0] || 'unknown check failed';
    console.log(`\n  Install failed: post-install validation — ${firstFailure}\n`);
    process.exit(1);
  }

  handleStatusline(result.settings, isInteractive, (shouldInstallStatusline) => {
    finishInstall(
      result.settingsPath,
      result.settings,
      result.statuslineCommand,
      shouldInstallStatusline
    );
  });
}

// Main logic
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (explicitConfigDir && hasLocal) {
  console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
  process.exit(1);
} else if (hasUninstall) {
  if (!hasGlobal && !hasLocal) {
    console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
    process.exit(1);
  }
  uninstall(hasGlobal);
} else if (hasGlobal || hasLocal) {
  runInstall(hasGlobal, false);
} else {
  // Interactive
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
    runInstall(true, false);
  } else {
    promptLocation();
  }
}
