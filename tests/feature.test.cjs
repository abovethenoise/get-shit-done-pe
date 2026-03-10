/**
 * GSD Tools Tests - feature.cjs
 *
 * Tests for feature lifecycle commands: create, list, status.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createTmpDir() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-feat-test-'));
  fs.mkdirSync(path.join(tmp, '.planning', 'features'), { recursive: true });
  fs.mkdirSync(path.join(tmp, '.planning', 'capabilities'), { recursive: true });
  return tmp;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function captureOutput(fn) {
  let result = null;
  let exitCode = null;
  const origWrite = process.stdout.write;
  const origExit = process.exit;
  const origErrWrite = process.stderr.write;
  let errMsg = '';

  process.stdout.write = (data) => { result = data; };
  process.stderr.write = (data) => { errMsg += data; };
  process.exit = (code) => {
    exitCode = code;
    throw new Error('EXIT_' + code);
  };

  try {
    fn();
  } catch (e) {
    if (!e.message.startsWith('EXIT_')) throw e;
  } finally {
    process.stdout.write = origWrite;
    process.stderr.write = origErrWrite;
    process.exit = origExit;
  }

  if (exitCode === 1) return { error: true, message: errMsg };
  return { error: false, data: result ? JSON.parse(result) : null };
}

const {
  cmdFeatureCreate,
  cmdFeatureList,
  cmdFeatureStatus,
  cmdFeatureValidate,
  cmdGateCheck,
} = require('../get-shit-done/bin/lib/feature.cjs');

describe('cmdFeatureCreate', () => {
  let tmp;
  beforeEach(() => { tmp = createTmpDir(); });
  afterEach(() => { cleanup(tmp); });

  test('creates feature directory and FEATURE.md', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, 'Login', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.created, true);
    assert.strictEqual(res.data.slug, 'login');

    const featDir = path.join(tmp, '.planning', 'features', 'login');
    assert.ok(fs.existsSync(featDir), 'feature dir exists');
    assert.ok(fs.existsSync(path.join(featDir, 'FEATURE.md')), 'FEATURE.md exists');
  });

  test('FEATURE.md has correct frontmatter', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'Login', false));
    const content = fs.readFileSync(
      path.join(tmp, '.planning', 'features', 'login', 'FEATURE.md'), 'utf-8'
    );
    assert.ok(content.includes('type: feature'), 'has type');
    assert.ok(content.includes('composes:'), 'has composes');
    assert.ok(content.includes('status: planning'), 'has status');
    assert.ok(content.includes('# Login'), 'has title');
  });

  test('errors on duplicate feature', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'Login', false));
    const res = captureOutput(() => cmdFeatureCreate(tmp, 'Login', false));
    assert.strictEqual(res.error, true);
    assert.ok(res.message.includes('already exists'), 'shows already exists error');
  });

  test('errors on empty feature name', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, '', false));
    assert.strictEqual(res.error, true);
  });

  test('errors on null feature name', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, null, false));
    assert.strictEqual(res.error, true);
  });
});

describe('cmdFeatureList', () => {
  let tmp;
  beforeEach(() => { tmp = createTmpDir(); });
  afterEach(() => { cleanup(tmp); });

  test('returns empty array when no features', () => {
    const res = captureOutput(() => cmdFeatureList(tmp, false));
    assert.strictEqual(res.error, false);
    assert.deepStrictEqual(res.data.features, []);
  });

  test('returns features with status and composes', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'Login', false));
    captureOutput(() => cmdFeatureCreate(tmp, 'Signup', false));
    const res = captureOutput(() => cmdFeatureList(tmp, false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.features.length, 2);
    const slugs = res.data.features.map(f => f.slug).sort();
    assert.deepStrictEqual(slugs, ['login', 'signup']);
    for (const feat of res.data.features) {
      assert.ok('status' in feat, 'has status');
      assert.ok('composes' in feat, 'has composes');
    }
  });
});

describe('cmdFeatureStatus', () => {
  let tmp;
  beforeEach(() => {
    tmp = createTmpDir();
    captureOutput(() => cmdFeatureCreate(tmp, 'Login', false));
  });
  afterEach(() => { cleanup(tmp); });

  test('returns feature status with composes', () => {
    const res = captureOutput(() => cmdFeatureStatus(tmp, 'login', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.slug, 'login');
    assert.strictEqual(res.data.status, 'planning');
    assert.ok(Array.isArray(res.data.composes), 'has composes array');
  });

  test('errors on non-existent feature', () => {
    const res = captureOutput(() => cmdFeatureStatus(tmp, 'nonexistent', false));
    assert.strictEqual(res.error, true);
  });
});

describe('cmdFeatureValidate', () => {
  let tmp;
  beforeEach(() => { tmp = createTmpDir(); });
  afterEach(() => { cleanup(tmp); });

  test('empty composes[] passes validation with no warnings', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'Standalone', false));
    const res = captureOutput(() => cmdFeatureValidate(tmp, 'standalone', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.passed, true);
    const emptyComposesWarnings = res.data.warnings.filter(w => w.type === 'empty_composes');
    assert.strictEqual(emptyComposesWarnings.length, 0, 'no empty_composes warning');
  });
});

describe('cmdGateCheck', () => {
  let tmp;
  beforeEach(() => { tmp = createTmpDir(); });
  afterEach(() => { cleanup(tmp); });

  test('empty composes[] blocks gate with clear message', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'Standalone', false));
    const res = captureOutput(() => cmdGateCheck(tmp, 'standalone', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.gate_passed, false);
    assert.strictEqual(res.data.blockers.length, 1);
    assert.strictEqual(res.data.blockers[0].slug, '_self');
    assert.ok(res.data.blockers[0].reason.includes('composes[]'), 'blocker mentions composes[]');
  });
});
