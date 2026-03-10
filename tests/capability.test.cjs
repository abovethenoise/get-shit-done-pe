/**
 * GSD Tools Tests - capability.cjs
 *
 * Tests for capability lifecycle commands: create, list, status.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createTmpDir() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-cap-test-'));
  fs.mkdirSync(path.join(tmp, '.planning', 'capabilities'), { recursive: true });
  return tmp;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// Mock output/error to capture results instead of exiting
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

// ─── capability.cjs tests ─────────────────────────────────────────────────────

const {
  cmdCapabilityCreate,
  cmdCapabilityList,
  cmdCapabilityStatus,
} = require('../get-shit-done/bin/lib/capability.cjs');

describe('cmdCapabilityCreate', () => {
  let tmp;
  beforeEach(() => { tmp = createTmpDir(); });
  afterEach(() => { cleanup(tmp); });

  test('creates capability directory and CAPABILITY.md', () => {
    const res = captureOutput(() => cmdCapabilityCreate(tmp, 'Auth System', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.created, true);
    assert.strictEqual(res.data.slug, 'auth-system');

    const capDir = path.join(tmp, '.planning', 'capabilities', 'auth-system');
    assert.ok(fs.existsSync(capDir), 'capability dir exists');
    assert.ok(fs.existsSync(path.join(capDir, 'CAPABILITY.md')), 'CAPABILITY.md exists');
  });

  test('CAPABILITY.md has correct frontmatter', () => {
    captureOutput(() => cmdCapabilityCreate(tmp, 'Auth System', false));
    const content = fs.readFileSync(
      path.join(tmp, '.planning', 'capabilities', 'auth-system', 'CAPABILITY.md'), 'utf-8'
    );
    assert.ok(content.includes('type: capability'), 'has type');
    assert.ok(content.includes('status: exploring'), 'has status');
    assert.ok(content.includes('# Auth System'), 'has title');
  });

  test('errors on duplicate capability', () => {
    captureOutput(() => cmdCapabilityCreate(tmp, 'Auth System', false));
    const res = captureOutput(() => cmdCapabilityCreate(tmp, 'Auth System', false));
    assert.strictEqual(res.error, true);
    assert.ok(res.message.includes("already exists"), 'shows already exists error');
  });

  test('errors on empty name', () => {
    const res = captureOutput(() => cmdCapabilityCreate(tmp, '', false));
    assert.strictEqual(res.error, true);
  });

  test('errors on null name', () => {
    const res = captureOutput(() => cmdCapabilityCreate(tmp, null, false));
    assert.strictEqual(res.error, true);
  });

  test('errors on name that produces empty slug (slash)', () => {
    const res = captureOutput(() => cmdCapabilityCreate(tmp, '///', false));
    assert.strictEqual(res.error, true);
    assert.ok(res.message.includes('empty slug'), 'mentions empty slug');
  });

  test('handles partial creation (dir exists, no CAPABILITY.md)', () => {
    const capDir = path.join(tmp, '.planning', 'capabilities', 'auth-system');
    fs.mkdirSync(capDir, { recursive: true });
    // No CAPABILITY.md — partial creation
    const res = captureOutput(() => cmdCapabilityCreate(tmp, 'Auth System', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.created, true);
    assert.ok(fs.existsSync(path.join(capDir, 'CAPABILITY.md')));
  });
});

describe('cmdCapabilityList', () => {
  let tmp;
  beforeEach(() => { tmp = createTmpDir(); });
  afterEach(() => { cleanup(tmp); });

  test('returns empty array when no capabilities', () => {
    const res = captureOutput(() => cmdCapabilityList(tmp, false));
    assert.strictEqual(res.error, false);
    assert.deepStrictEqual(res.data.capabilities, []);
  });

  test('returns capabilities with status and feature count', () => {
    captureOutput(() => cmdCapabilityCreate(tmp, 'Auth', false));
    captureOutput(() => cmdCapabilityCreate(tmp, 'Payments', false));
    const res = captureOutput(() => cmdCapabilityList(tmp, false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.capabilities.length, 2);
    const slugs = res.data.capabilities.map(c => c.slug).sort();
    assert.deepStrictEqual(slugs, ['auth', 'payments']);
    // Each should have status
    for (const cap of res.data.capabilities) {
      assert.ok('status' in cap, 'has status');
    }
  });
});

describe('cmdCapabilityStatus', () => {
  let tmp;
  beforeEach(() => { tmp = createTmpDir(); });
  afterEach(() => { cleanup(tmp); });

  test('returns capability status', () => {
    captureOutput(() => cmdCapabilityCreate(tmp, 'Auth', false));
    const res = captureOutput(() => cmdCapabilityStatus(tmp, 'auth', false));
    assert.strictEqual(res.error, false);
    assert.strictEqual(res.data.slug, 'auth');
    assert.strictEqual(res.data.status, 'exploring');
  });

  test('errors on non-existent capability', () => {
    const res = captureOutput(() => cmdCapabilityStatus(tmp, 'nonexistent', false));
    assert.strictEqual(res.error, true);
  });
});
