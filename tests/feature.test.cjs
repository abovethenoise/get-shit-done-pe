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

// We need capability.cjs too (to create parent capabilities)
const { cmdCapabilityCreate } = require('../get-shit-done/bin/lib/capability.cjs');
const {
  cmdFeatureCreate,
  cmdFeatureList,
  cmdFeatureStatus,
} = require('../get-shit-done/bin/lib/feature.cjs');

describe('cmdFeatureCreate', () => {
  let tmp;
  beforeEach(() => {
    tmp = createTmpDir();
    captureOutput(() => cmdCapabilityCreate(tmp, 'Auth', false));
  });
  afterEach(() => { cleanup(tmp); });

  test('creates feature directory and FEATURE.md', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, 'auth', 'Login', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.created, true);
    assert.strictEqual(res.data.slug, 'login');
    assert.strictEqual(res.data.capability_slug, 'auth');

    const featDir = path.join(tmp, '.planning', 'capabilities', 'auth', 'features', 'login');
    assert.ok(fs.existsSync(featDir), 'feature dir exists');
    assert.ok(fs.existsSync(path.join(featDir, 'FEATURE.md')), 'FEATURE.md exists');
  });

  test('FEATURE.md has correct frontmatter and 3-layer skeleton', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'auth', 'Login', false));
    const content = fs.readFileSync(
      path.join(tmp, '.planning', 'capabilities', 'auth', 'features', 'login', 'FEATURE.md'), 'utf-8'
    );
    assert.ok(content.includes('type: feature'), 'has type');
    assert.ok(content.includes('capability:'), 'has capability ref');
    assert.ok(content.includes('status: planning'), 'has status');
    assert.ok(content.includes('# Login'), 'has title');
    // 3-layer skeleton
    assert.ok(content.includes('EU-01'), 'has EU requirement');
    assert.ok(content.includes('FN-01'), 'has FN requirement');
    assert.ok(content.includes('TC-01'), 'has TC requirement');
    assert.ok(content.includes('## Trace Table'), 'has trace table');
    assert.ok(content.includes('## End-User Requirements'), 'has EU section');
    assert.ok(content.includes('## Functional Requirements'), 'has FN section');
    assert.ok(content.includes('## Technical Specs'), 'has TC section');
  });

  test('errors on missing parent capability', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, 'nonexistent', 'Login', false));
    assert.strictEqual(res.error, true);
    assert.ok(res.message.includes('not found') || res.message.includes('does not exist'),
      'error mentions capability not found');
  });

  test('errors on duplicate feature', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'auth', 'Login', false));
    const res = captureOutput(() => cmdFeatureCreate(tmp, 'auth', 'Login', false));
    assert.strictEqual(res.error, true);
    assert.ok(res.message.includes('already exists'), 'shows already exists error');
  });

  test('errors on empty feature name', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, 'auth', '', false));
    assert.strictEqual(res.error, true);
  });

  test('errors on null feature name', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, 'auth', null, false));
    assert.strictEqual(res.error, true);
  });

  test('errors on empty capability slug', () => {
    const res = captureOutput(() => cmdFeatureCreate(tmp, '', 'Login', false));
    assert.strictEqual(res.error, true);
  });
});

describe('cmdFeatureList', () => {
  let tmp;
  beforeEach(() => {
    tmp = createTmpDir();
    captureOutput(() => cmdCapabilityCreate(tmp, 'Auth', false));
  });
  afterEach(() => { cleanup(tmp); });

  test('returns empty array when no features', () => {
    const res = captureOutput(() => cmdFeatureList(tmp, 'auth', false));
    assert.strictEqual(res.error, false);
    assert.deepStrictEqual(res.data.features, []);
  });

  test('returns features with status and capability', () => {
    captureOutput(() => cmdFeatureCreate(tmp, 'auth', 'Login', false));
    captureOutput(() => cmdFeatureCreate(tmp, 'auth', 'Signup', false));
    const res = captureOutput(() => cmdFeatureList(tmp, 'auth', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.features.length, 2);
    const slugs = res.data.features.map(f => f.slug).sort();
    assert.deepStrictEqual(slugs, ['login', 'signup']);
    for (const feat of res.data.features) {
      assert.ok('status' in feat, 'has status');
      assert.strictEqual(feat.capability, 'auth');
    }
  });

  test('errors on non-existent capability', () => {
    const res = captureOutput(() => cmdFeatureList(tmp, 'nonexistent', false));
    assert.strictEqual(res.error, true);
  });
});

describe('cmdFeatureStatus', () => {
  let tmp;
  beforeEach(() => {
    tmp = createTmpDir();
    captureOutput(() => cmdCapabilityCreate(tmp, 'Auth', false));
    captureOutput(() => cmdFeatureCreate(tmp, 'auth', 'Login', false));
  });
  afterEach(() => { cleanup(tmp); });

  test('returns feature status with requirement counts', () => {
    const res = captureOutput(() => cmdFeatureStatus(tmp, 'auth', 'login', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.slug, 'login');
    assert.strictEqual(res.data.status, 'planning');
    assert.strictEqual(res.data.capability, 'auth');
    assert.ok(res.data.req_counts, 'has req_counts');
    assert.strictEqual(res.data.req_counts.eu, 1);
    assert.strictEqual(res.data.req_counts.fn, 1);
    assert.strictEqual(res.data.req_counts.tc, 1);
  });

  test('errors on non-existent feature', () => {
    const res = captureOutput(() => cmdFeatureStatus(tmp, 'auth', 'nonexistent', false));
    assert.strictEqual(res.error, true);
  });

  test('errors on non-existent capability', () => {
    const res = captureOutput(() => cmdFeatureStatus(tmp, 'nonexistent', 'login', false));
    assert.strictEqual(res.error, true);
  });
});
