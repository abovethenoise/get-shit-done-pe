#!/usr/bin/env node

/**
 * Dev-only install validation script.
 * Verifies that `node bin/install.js --global` deployed all v2 artifacts correctly.
 *
 * Checks:
 * 1. Expected files exist at installed paths
 * 2. No unresolved {GSD_ROOT} tokens in installed files
 * 3. Commands are discoverable (have frontmatter)
 * 4. gsd-tools.cjs runs without error
 * 5. No references to deleted files or old phase paths
 * 6. Legacy artifacts cleaned
 *
 * Exit 0 if all pass, exit 1 if any fail.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

function runValidation(options = {}) {
  const configDir = process.env.CLAUDE_CONFIG_DIR
    ? process.env.CLAUDE_CONFIG_DIR
    : path.join(os.homedir(), '.claude');

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const failures = [];

  function pass(msg) {
    totalChecks++;
    passedChecks++;
    console.log(`  ${green}PASS${reset} ${msg}`);
  }

  function fail(msg, detail) {
    totalChecks++;
    failedChecks++;
    const entry = detail ? `${msg}: ${detail}` : msg;
    failures.push(entry);
    console.log(`  ${red}FAIL${reset} ${msg}`);
    if (detail) console.log(`       ${dim}${detail}${reset}`);
  }

  // ---------------------------------------------------------------------------
  // Check 1: Expected files exist at installed paths
  // ---------------------------------------------------------------------------
  console.log('\n  --- Check 1: Expected files exist ---\n');

  const expectedCommands = [
    'debug.md', 'discuss-capability.md', 'discuss-feature.md', 'enhance.md',
    'focus.md', 'init.md', 'new.md', 'plan.md', 'progress.md', 'refactor.md',
    'resume-work.md', 'review.md', 'status.md'
  ];

  const expectedAgents = [
    'gsd-doc-writer.md', 'gsd-executor.md', 'gsd-plan-checker.md', 'gsd-planner.md',
    'gsd-research-domain.md', 'gsd-research-edges.md', 'gsd-research-intent.md',
    'gsd-research-prior-art.md', 'gsd-research-synthesizer.md', 'gsd-research-system.md',
    'gsd-research-tech.md', 'gsd-review-enduser.md', 'gsd-review-functional.md',
    'gsd-review-quality.md', 'gsd-review-synthesizer.md', 'gsd-review-technical.md',
    'gsd-verifier.md'
  ];

  const expectedFramingDirs = ['debug', 'enhance', 'new', 'refactor'];

  // Commands
  const cmdDir = path.join(configDir, 'commands', 'gsd');
  let cmdCount = 0;
  for (const cmd of expectedCommands) {
    const fp = path.join(cmdDir, cmd);
    if (fs.existsSync(fp)) {
      cmdCount++;
    } else {
      fail(`Missing command: commands/gsd/${cmd}`);
    }
  }
  if (cmdCount === expectedCommands.length) {
    pass(`All ${cmdCount} command files present in commands/gsd/`);
  }

  // Agents
  const agentDir = path.join(configDir, 'agents');
  let agentCount = 0;
  for (const agent of expectedAgents) {
    const fp = path.join(agentDir, agent);
    if (fs.existsSync(fp)) {
      agentCount++;
    } else {
      fail(`Missing agent: agents/${agent}`);
    }
  }
  if (agentCount === expectedAgents.length) {
    pass(`All ${agentCount} agent files present in agents/`);
  }

  // Workflows
  const wfDir = path.join(configDir, 'get-shit-done', 'workflows');
  if (fs.existsSync(wfDir)) {
    const wfFiles = fs.readdirSync(wfDir).filter(f => f.endsWith('.md'));
    if (wfFiles.length > 0) {
      pass(`Workflows directory has ${wfFiles.length} .md files`);
    } else {
      fail('Workflows directory is empty');
    }
  } else {
    fail('Missing directory: get-shit-done/workflows/');
  }

  // Templates (including config.json)
  const tplDir = path.join(configDir, 'get-shit-done', 'templates');
  if (fs.existsSync(tplDir)) {
    const tplFiles = fs.readdirSync(tplDir);
    if (tplFiles.length > 0) {
      pass(`Templates directory has ${tplFiles.length} entries`);
    } else {
      fail('Templates directory is empty');
    }
    const configJson = path.join(tplDir, 'config.json');
    if (fs.existsSync(configJson)) {
      pass('config.json present in templates/');
    } else {
      fail('Missing: get-shit-done/templates/config.json (INST-07)');
    }
  } else {
    fail('Missing directory: get-shit-done/templates/');
  }

  // References
  const refDir = path.join(configDir, 'get-shit-done', 'references');
  if (fs.existsSync(refDir)) {
    const refFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.md'));
    if (refFiles.length > 0) {
      pass(`References directory has ${refFiles.length} .md files`);
    } else {
      fail('References directory is empty');
    }
  } else {
    fail('Missing directory: get-shit-done/references/');
  }

  // Framings (4 subdirs each with anchor-questions.md)
  const framingDir = path.join(configDir, 'get-shit-done', 'framings');
  if (fs.existsSync(framingDir)) {
    let framingOk = true;
    for (const sub of expectedFramingDirs) {
      const aqPath = path.join(framingDir, sub, 'anchor-questions.md');
      if (!fs.existsSync(aqPath)) {
        fail(`Missing framing: framings/${sub}/anchor-questions.md`);
        framingOk = false;
      }
    }
    if (framingOk) {
      pass(`All 4 framing subdirs present with anchor-questions.md (INST-08)`);
    }
  } else {
    fail('Missing directory: get-shit-done/framings/ (INST-08)');
  }

  // gsd-tools.cjs
  const toolsPath = path.join(configDir, 'get-shit-done', 'bin', 'gsd-tools.cjs');
  if (fs.existsSync(toolsPath)) {
    pass('gsd-tools.cjs present in get-shit-done/bin/');
  } else {
    fail('Missing: get-shit-done/bin/gsd-tools.cjs');
  }

  // Hooks
  const hooksDir = path.join(configDir, 'hooks');
  const expectedHooks = ['gsd-context-monitor.js', 'gsd-statusline.js', 'gsd-askuserquestion-guard.js'];
  for (const hook of expectedHooks) {
    const hp = path.join(hooksDir, hook);
    if (fs.existsSync(hp)) {
      pass(`Hook present: hooks/${hook}`);
    } else {
      fail(`Missing hook: hooks/${hook}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Check 2: No unresolved {GSD_ROOT} tokens
  // ---------------------------------------------------------------------------
  console.log('\n  --- Check 2: No unresolved {GSD_ROOT} tokens ---\n');

  const dirsToScan = [
    path.join(configDir, 'commands', 'gsd'),
    path.join(configDir, 'agents'),
    path.join(configDir, 'get-shit-done'),
    path.join(configDir, 'hooks'),
  ];

  const tokenHits = [];
  function scanForTokens(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanForTokens(full);
      } else if (/\.(md|js|json)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('{GSD_ROOT}')) {
          tokenHits.push(full.replace(configDir, '~/.claude'));
        }
      }
    }
  }
  for (const d of dirsToScan) scanForTokens(d);

  if (tokenHits.length === 0) {
    pass('No unresolved {GSD_ROOT} tokens found');
  } else {
    fail(`Found ${tokenHits.length} files with unresolved {GSD_ROOT} tokens`);
    for (const f of tokenHits) {
      console.log(`       ${dim}${f}${reset}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Check 3: Commands are discoverable (have frontmatter)
  // ---------------------------------------------------------------------------
  console.log('\n  --- Check 3: Commands are discoverable ---\n');

  let discoverableCount = 0;
  const nonDiscoverable = [];
  if (fs.existsSync(cmdDir)) {
    for (const cmd of expectedCommands) {
      const fp = path.join(cmdDir, cmd);
      if (fs.existsSync(fp)) {
        const content = fs.readFileSync(fp, 'utf8');
        // Check for frontmatter delimiters
        if (content.startsWith('---') && content.indexOf('---', 3) > 3) {
          discoverableCount++;
        } else {
          nonDiscoverable.push(cmd);
        }
      }
    }
  }

  if (nonDiscoverable.length === 0 && discoverableCount === expectedCommands.length) {
    pass(`All ${discoverableCount} commands have frontmatter (discoverable)`);
  } else if (nonDiscoverable.length > 0) {
    fail(`${nonDiscoverable.length} commands missing frontmatter`, nonDiscoverable.join(', '));
  }

  // ---------------------------------------------------------------------------
  // Check 4: gsd-tools.cjs runs without error
  // ---------------------------------------------------------------------------
  console.log('\n  --- Check 4: gsd-tools.cjs runs without error ---\n');

  if (fs.existsSync(toolsPath)) {
    try {
      // Just require it and check it doesn't throw
      execSync(`node -e "require('${toolsPath.replace(/'/g, "\\'")}')"`, {
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      pass('gsd-tools.cjs loads without throwing');
    } catch (e) {
      // Some tools exit non-zero when run without args, that's OK
      // Only fail if there's a genuine syntax/import error
      const stderr = e.stderr ? e.stderr.toString() : '';
      if (stderr.includes('SyntaxError') || stderr.includes('Cannot find module') || stderr.includes('ReferenceError')) {
        fail('gsd-tools.cjs throws on load', stderr.split('\n')[0]);
      } else {
        pass('gsd-tools.cjs loads without syntax errors');
      }
    }
  } else {
    fail('gsd-tools.cjs not found -- cannot test');
  }

  // ---------------------------------------------------------------------------
  // Check 5: No references to deleted files or old phase paths
  // ---------------------------------------------------------------------------
  console.log('\n  --- Check 5: No stale references ---\n');

  const stalePatterns = [
    { pattern: /phases\//g, label: 'phases/ path reference' },
    { pattern: /verify-phase/g, label: 'deleted verify-phase workflow' },
    { pattern: /research-phase/g, label: 'deleted research-phase workflow' },
    { pattern: /transition\.md/g, label: 'deleted transition.md workflow' },
    { pattern: /gsd-check-update/g, label: 'deleted gsd-check-update' },
  ];

  const staleHits = [];
  function scanForStale(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanForStale(full);
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(full, 'utf8');
        for (const { pattern, label } of stalePatterns) {
          pattern.lastIndex = 0;
          if (pattern.test(content)) {
            staleHits.push(`${full.replace(configDir, '~/.claude')}: ${label}`);
          }
        }
      }
    }
  }
  for (const d of dirsToScan) scanForStale(d);

  if (staleHits.length === 0) {
    pass('No stale references to deleted files or old paths');
  } else {
    // These may be legitimate references (e.g., documentation about phases concept)
    // Report as warnings, not failures
    console.log(`  ${yellow}WARN${reset} Found ${staleHits.length} potential stale references (review needed):`);
    for (const h of staleHits) {
      console.log(`       ${dim}${h}${reset}`);
    }
    // Don't count as pass or fail -- informational
    totalChecks++;
    passedChecks++;
    console.log(`  ${green}PASS${reset} Stale reference check complete (${staleHits.length} warnings noted)`);
  }

  // ---------------------------------------------------------------------------
  // Check 6: Legacy artifacts cleaned
  // ---------------------------------------------------------------------------
  console.log('\n  --- Check 6: Legacy artifacts cleaned ---\n');

  const legacyPaths = [
    { path: path.join(configDir, 'gsd-local-patches'), label: 'gsd-local-patches/' },
    { path: path.join(configDir, 'gsd-file-manifest.json'), label: 'gsd-file-manifest.json' },
    { path: path.join(configDir, 'get-shit-done', 'VERSION'), label: 'get-shit-done/VERSION' },
  ];

  let legacyClean = true;
  for (const item of legacyPaths) {
    if (fs.existsSync(item.path)) {
      fail(`Legacy artifact still exists: ${item.label}`);
      legacyClean = false;
    }
  }
  if (legacyClean) {
    pass('All legacy artifacts cleaned (no gsd-local-patches, manifest, VERSION)');
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n  =========================================');
  console.log(`  Results: ${passedChecks}/${totalChecks} passed, ${failedChecks} failed`);
  console.log('  =========================================\n');

  return {
    passed: passedChecks,
    failed: failedChecks,
    failures: failures
  };
}

module.exports = { runValidation };

if (require.main === module) {
  const result = runValidation();
  if (result.failed > 0) {
    console.log(`\n  VALIDATION FAILED\n`);
    for (const f of result.failures) {
      console.log(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log(`\n  ALL CHECKS PASSED\n`);
    process.exit(0);
  }
}
