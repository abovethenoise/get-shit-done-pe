/**
 * GSD Tools Tests - core.cjs
 *
 * Tests for the foundational module's exports including regressions
 * for known bugs (REG-01: loadConfig model_overrides, REG-02: getRoadmapPhaseInternal export).
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  loadConfig,
  resolveModelInternal,
  generateSlugInternal,
  safeReadFile,
  pathExistsInternal,
  findCapabilityInternal,
  findFeatureInternal,
  listAllFeaturesInternal,
} = require('../get-shit-done/bin/lib/core.cjs');

// ─── loadConfig ────────────────────────────────────────────────────────────────

describe('loadConfig', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(obj) {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify(obj, null, 2)
    );
  }

  test('returns defaults when config.json is missing', () => {
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'balanced');
    assert.strictEqual(config.commit_docs, true);
    assert.strictEqual(config.research, true);
    assert.strictEqual(config.plan_checker, true);
    assert.strictEqual(config.brave_search, false);
    assert.strictEqual(config.parallelization, true);
  });

  test('reads model_profile from config.json', () => {
    writeConfig({ model_profile: 'quality' });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'quality');
  });

  test('reads nested config keys', () => {
    writeConfig({ planning: { commit_docs: false } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.commit_docs, false);
  });

  test('reads branching_strategy from git section', () => {
    writeConfig({ git: { branching_strategy: 'per-phase' } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.branching_strategy, 'per-phase');
  });

  // Bug: loadConfig previously omitted model_overrides from return value
  test('returns model_overrides when present (REG-01)', () => {
    writeConfig({ model_overrides: { 'gsd-executor': 'opus' } });
    const config = loadConfig(tmpDir);
    assert.deepStrictEqual(config.model_overrides, { 'gsd-executor': 'opus' });
  });

  test('returns model_overrides as null when not in config', () => {
    writeConfig({ model_profile: 'balanced' });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_overrides, null);
  });

  test('returns defaults when config.json contains invalid JSON', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      'not valid json {{{{'
    );
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'balanced');
    assert.strictEqual(config.commit_docs, true);
  });

  test('handles parallelization as boolean', () => {
    writeConfig({ parallelization: false });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, false);
  });

  test('handles parallelization as object with enabled field', () => {
    writeConfig({ parallelization: { enabled: false } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.parallelization, false);
  });

  test('prefers top-level keys over nested keys', () => {
    writeConfig({ commit_docs: false, planning: { commit_docs: true } });
    const config = loadConfig(tmpDir);
    assert.strictEqual(config.commit_docs, false);
  });
});

// ─── resolveModelInternal ──────────────────────────────────────────────────────

describe('resolveModelInternal', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(obj) {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify(obj, null, 2)
    );
  }

  describe('model profile structural validation', () => {
    test('all known agents resolve to a valid string for each profile', () => {
      const knownAgents = ['gsd-planner', 'gsd-executor', 'gsd-phase-researcher', 'gsd-codebase-mapper'];
      const profiles = ['quality', 'balanced', 'budget'];
      const validValues = ['inherit', 'sonnet', 'haiku', 'opus'];

      for (const profile of profiles) {
        writeConfig({ model_profile: profile });
        for (const agent of knownAgents) {
          const result = resolveModelInternal(tmpDir, agent);
          assert.ok(
            validValues.includes(result),
            `profile=${profile} agent=${agent} returned unexpected value: ${result}`
          );
        }
      }
    });
  });

  describe('override precedence', () => {
    test('per-agent override takes precedence over profile', () => {
      writeConfig({
        model_profile: 'balanced',
        model_overrides: { 'gsd-executor': 'haiku' },
      });
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-executor'), 'haiku');
    });

    test('opus override resolves to opus', () => {
      writeConfig({
        model_overrides: { 'gsd-planner': 'opus' },
      });
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'opus');
    });

    test('agents not in override fall back to default sonnet', () => {
      writeConfig({
        model_profile: 'quality',
        model_overrides: { 'gsd-executor': 'haiku' },
      });
      // gsd-planner not overridden, v2 defaults to sonnet (role-based resolution is primary path)
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'sonnet');
    });
  });

  describe('edge cases', () => {
    test('returns sonnet for unknown agent type', () => {
      writeConfig({ model_profile: 'balanced' });
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-nonexistent'), 'sonnet');
    });

    test('defaults to sonnet when model_profile missing', () => {
      writeConfig({});
      // v2 defaults to sonnet for all agents (role-based resolution is primary path)
      assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-planner'), 'sonnet');
    });
  });
});

// ─── escapeRegex ───────────────────────────────────────────────────────────────

// ─── generateSlugInternal ──────────────────────────────────────────────────────

describe('generateSlugInternal', () => {
  test('converts text to lowercase kebab-case', () => {
    assert.strictEqual(generateSlugInternal('Hello World'), 'hello-world');
  });

  test('removes special characters', () => {
    assert.strictEqual(generateSlugInternal('core.cjs Tests!'), 'core-cjs-tests');
  });

  test('trims leading and trailing hyphens', () => {
    assert.strictEqual(generateSlugInternal('---hello---'), 'hello');
  });

  test('returns null for null input', () => {
    assert.strictEqual(generateSlugInternal(null), null);
  });

  test('returns null for empty string', () => {
    assert.strictEqual(generateSlugInternal(''), null);
  });
});

// ─── safeReadFile ──────────────────────────────────────────────────────────────

describe('safeReadFile', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('reads existing file', () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'hello world');
    assert.strictEqual(safeReadFile(filePath), 'hello world');
  });

  test('returns null for missing file', () => {
    assert.strictEqual(safeReadFile('/nonexistent/path/file.txt'), null);
  });
});

// ─── pathExistsInternal ────────────────────────────────────────────────────────

describe('pathExistsInternal', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns true for existing path', () => {
    assert.strictEqual(pathExistsInternal(tmpDir, '.planning'), true);
  });

  test('returns false for non-existing path', () => {
    assert.strictEqual(pathExistsInternal(tmpDir, 'nonexistent'), false);
  });

  test('handles absolute paths', () => {
    assert.strictEqual(pathExistsInternal(tmpDir, tmpDir), true);
  });
});


// ─── generateSlugInternal (hardening) ──────────────────────────────────────────

describe('generateSlugInternal (hardening)', () => {
  test('returns empty string for unicode-only input that sanitizes to empty', () => {
    const result = generateSlugInternal('\u{1F600}\u{1F601}');
    assert.strictEqual(result, '');
  });

  test('returns empty string for slash-containing input', () => {
    assert.strictEqual(generateSlugInternal('foo/bar'), '');
    assert.strictEqual(generateSlugInternal('foo\\bar'), '');
  });

  test('returns empty string for path separator only', () => {
    assert.strictEqual(generateSlugInternal('/'), '');
    assert.strictEqual(generateSlugInternal('\\'), '');
  });

  test('still handles normal slugification correctly', () => {
    assert.strictEqual(generateSlugInternal('Hello World'), 'hello-world');
    assert.strictEqual(generateSlugInternal('my-capability'), 'my-capability');
  });
});

// ─── findCapabilityInternal ───────────────────────────────────────────────────

describe('findCapabilityInternal', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    fs.mkdirSync(path.join(tmpDir, '.planning', 'capabilities'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns found when CAPABILITY.md exists', () => {
    const capDir = path.join(tmpDir, '.planning', 'capabilities', 'auth');
    fs.mkdirSync(capDir, { recursive: true });
    fs.writeFileSync(path.join(capDir, 'CAPABILITY.md'), '# Auth');
    const result = findCapabilityInternal(tmpDir, 'auth');
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.slug, 'auth');
    assert.ok(result.directory.endsWith('auth'));
    assert.ok(result.capability_path.endsWith('CAPABILITY.md'));
  });

  test('returns not found when capability does not exist', () => {
    const result = findCapabilityInternal(tmpDir, 'nonexistent');
    assert.strictEqual(result.found, false);
  });

  test('returns not found when directory exists but CAPABILITY.md is missing (partial creation)', () => {
    const capDir = path.join(tmpDir, '.planning', 'capabilities', 'auth');
    fs.mkdirSync(capDir, { recursive: true });
    // No CAPABILITY.md file
    const result = findCapabilityInternal(tmpDir, 'auth');
    assert.strictEqual(result.found, false);
    assert.strictEqual(result.reason, 'no_capability_file');
  });

  test('returns not found with empty_slug reason for empty-after-sanitization input', () => {
    const result = findCapabilityInternal(tmpDir, '\u{1F600}');
    assert.strictEqual(result.found, false);
    assert.strictEqual(result.reason, 'empty_slug');
  });

  test('returns not found for slash-containing input', () => {
    const result = findCapabilityInternal(tmpDir, 'foo/bar');
    assert.strictEqual(result.found, false);
    assert.strictEqual(result.reason, 'empty_slug');
  });

  test('slugifies input before lookup', () => {
    const capDir = path.join(tmpDir, '.planning', 'capabilities', 'my-capability');
    fs.mkdirSync(capDir, { recursive: true });
    fs.writeFileSync(path.join(capDir, 'CAPABILITY.md'), '# My Capability');
    const result = findCapabilityInternal(tmpDir, 'My Capability');
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.slug, 'my-capability');
  });
});

// ─── findFeatureInternal ──────────────────────────────────────────────────────

describe('findFeatureInternal', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    // Set up top-level features dir
    fs.mkdirSync(path.join(tmpDir, '.planning', 'features'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns found when FEATURE.md exists', () => {
    const featDir = path.join(tmpDir, '.planning', 'features', 'login');
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'FEATURE.md'), '# Login');
    const result = findFeatureInternal(tmpDir, 'login');
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.slug, 'login');
    assert.ok(result.feature_path.endsWith('FEATURE.md'));
  });

  test('returns not found for missing feature', () => {
    const result = findFeatureInternal(tmpDir, 'nonexistent');
    assert.strictEqual(result.found, false);
  });

  test('returns not found when feature dir exists but FEATURE.md is missing', () => {
    const featDir = path.join(tmpDir, '.planning', 'features', 'login');
    fs.mkdirSync(featDir, { recursive: true });
    // No FEATURE.md
    const result = findFeatureInternal(tmpDir, 'login');
    assert.strictEqual(result.found, false);
    assert.strictEqual(result.reason, 'no_feature_file');
  });

  test('slugifies feature input before lookup', () => {
    const featDir = path.join(tmpDir, '.planning', 'features', 'user-login');
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'FEATURE.md'), '# User Login');
    const result = findFeatureInternal(tmpDir, 'User Login');
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.slug, 'user-login');
  });
});

// ─── listAllFeaturesInternal ──────────────────────────────────────────────────

describe('listAllFeaturesInternal', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    fs.mkdirSync(path.join(tmpDir, '.planning', 'features'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns empty array when features dir is empty', () => {
    const result = listAllFeaturesInternal(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test('returns empty array when no .planning dir', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-core-test-'));
    const result = listAllFeaturesInternal(emptyDir);
    assert.deepStrictEqual(result, []);
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  test('excludes feature dirs without FEATURE.md', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'features', 'orphan-dir'), { recursive: true });
    // No FEATURE.md inside
    const result = listAllFeaturesInternal(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test('returns composes from frontmatter', () => {
    const featDir = path.join(tmpDir, '.planning', 'features', 'login');
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'FEATURE.md'), [
      '---',
      'name: Login',
      'composes:',
      '  - auth',
      '  - database',
      '---',
      '# Login Feature',
    ].join('\n'));
    const result = listAllFeaturesInternal(tmpDir);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].feature_slug, 'login');
    assert.deepStrictEqual(result[0].composes, ['auth', 'database']);
  });

  test('returns empty composes when field missing', () => {
    const featDir = path.join(tmpDir, '.planning', 'features', 'signup');
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'FEATURE.md'), [
      '---',
      'name: Signup',
      '---',
      '# Signup',
    ].join('\n'));
    const result = listAllFeaturesInternal(tmpDir);
    assert.strictEqual(result.length, 1);
    assert.deepStrictEqual(result[0].composes, []);
  });

  test('returns empty composes when composes is empty list', () => {
    const featDir = path.join(tmpDir, '.planning', 'features', 'profile');
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'FEATURE.md'), [
      '---',
      'name: Profile',
      'composes: []',
      '---',
      '# Profile',
    ].join('\n'));
    const result = listAllFeaturesInternal(tmpDir);
    assert.strictEqual(result.length, 1);
    assert.deepStrictEqual(result[0].composes, []);
  });

  test('returns multiple features sorted by slug', () => {
    for (const slug of ['beta', 'alpha']) {
      const featDir = path.join(tmpDir, '.planning', 'features', slug);
      fs.mkdirSync(featDir, { recursive: true });
      fs.writeFileSync(path.join(featDir, 'FEATURE.md'), `---\nname: ${slug}\n---\n# ${slug}`);
    }
    const result = listAllFeaturesInternal(tmpDir);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].feature_slug, 'alpha');
    assert.strictEqual(result[1].feature_slug, 'beta');
  });
});
