/**
 * GSD Tools Tests - graph.cjs
 *
 * Tests for dependency graph build and query functions.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { buildGraph, cmdGraphQuery } = require('../get-shit-done/bin/lib/graph.cjs');

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function setupProject(tmpDir) {
  fs.mkdirSync(path.join(tmpDir, '.planning', 'capabilities'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.planning', 'features'), { recursive: true });
}

function writeCap(tmpDir, slug, fields = {}) {
  const dir = path.join(tmpDir, '.planning', 'capabilities', slug);
  fs.mkdirSync(dir, { recursive: true });
  const fm = { name: fields.name || slug, status: fields.status || 'exploring', ...fields };
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push('---', `# ${slug}`);
  fs.writeFileSync(path.join(dir, 'CAPABILITY.md'), lines.join('\n'));
}

function writeFullCap(tmpDir, slug, status) {
  const dir = path.join(tmpDir, '.planning', 'capabilities', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'CAPABILITY.md'), [
    '---', `name: ${slug}`, `status: ${status}`, '---',
    `# ${slug}`, '## Contract', '### Receives', 'Input',
    '### Returns', 'Output', '### Rules', '- Rule',
  ].join('\n'));
}

function writeFeat(tmpDir, slug, composes = [], fields = {}) {
  const dir = path.join(tmpDir, '.planning', 'features', slug);
  fs.mkdirSync(dir, { recursive: true });
  const lines = ['---', `name: ${fields.name || slug}`, `status: ${fields.status || 'draft'}`];
  if (composes.length > 0) {
    lines.push('composes:');
    for (const c of composes) {
      lines.push(`  - ${c}`);
    }
  }
  lines.push('---', `# ${slug}`);
  fs.writeFileSync(path.join(dir, 'FEATURE.md'), lines.join('\n'));
}

/** Capture JSON output from cmdGraphQuery (intercepts stdout + process.exit) */
function runQuery(tmpDir, args) {
  let captured = null;
  const origWrite = process.stdout.write;
  const origExit = process.exit;
  process.stdout.write = (data) => { captured = data; };
  process.exit = () => { throw new Error('EXIT'); };

  try {
    cmdGraphQuery(tmpDir, args, false);
  } catch (e) {
    if (e.message !== 'EXIT') throw e;
  } finally {
    process.stdout.write = origWrite;
    process.exit = origExit;
  }

  return JSON.parse(captured);
}

// ─── buildGraph ───────────────────────────────────────────────────────────────

describe('buildGraph', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('empty project (no .planning/) returns empty graph', () => {
    const graph = buildGraph(tmpDir);
    assert.deepStrictEqual(graph.nodes, []);
    assert.deepStrictEqual(graph.edges, []);
  });

  test('caps only produces nodes, no edges', () => {
    setupProject(tmpDir);
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeCap(tmpDir, 'database', { status: 'exploring' });

    const graph = buildGraph(tmpDir);
    assert.strictEqual(graph.nodes.length, 2);
    assert.strictEqual(graph.edges.length, 0);
    assert.ok(graph.nodes.find(n => n.id === 'cap:auth'));
    assert.ok(graph.nodes.find(n => n.id === 'cap:database'));
  });

  test('features only produces nodes + edges to missing caps', () => {
    setupProject(tmpDir);
    writeFeat(tmpDir, 'login', ['auth', 'database']);

    const graph = buildGraph(tmpDir);
    const featureNodes = graph.nodes.filter(n => n.type === 'feature');
    assert.strictEqual(featureNodes.length, 1);
    assert.strictEqual(graph.edges.length, 2);
    assert.ok(graph.edges.find(e => e.to === 'cap:auth'));
    assert.ok(graph.edges.find(e => e.to === 'cap:database'));
  });

  test('features + caps produces full graph', () => {
    setupProject(tmpDir);
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeCap(tmpDir, 'database', { status: 'verified' });
    writeFeat(tmpDir, 'login', ['auth', 'database']);
    writeFeat(tmpDir, 'signup', ['auth']);

    const graph = buildGraph(tmpDir);
    assert.strictEqual(graph.nodes.length, 4); // 2 caps + 2 feats
    assert.strictEqual(graph.edges.length, 3); // login->auth, login->database, signup->auth
  });

  test('feature with empty composes produces no edges', () => {
    setupProject(tmpDir);
    writeFeat(tmpDir, 'orphan', []);

    const graph = buildGraph(tmpDir);
    assert.strictEqual(graph.nodes.length, 1);
    assert.strictEqual(graph.edges.length, 0);
  });
});

// ─── querySequence (via cmdGraphQuery) ────────────────────────────────────────

describe('graph-query sequence', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('executable vs blocked features', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeCap(tmpDir, 'payments', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'checkout', ['auth', 'payments']);

    const result = runQuery(tmpDir, ['sequence']);
    assert.ok(result.executable.find(f => f.slug === 'login'));
    assert.ok(result.blocked.find(f => f.slug === 'checkout'));
    assert.strictEqual(result.blocked[0].blockers[0].cap, 'payments');
  });

  test('orphan detection', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeCap(tmpDir, 'unused-cap', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'orphan-feat', []);

    const result = runQuery(tmpDir, ['sequence']);
    assert.ok(result.orphans.capabilities.includes('unused-cap'));
    assert.ok(result.orphans.features.includes('orphan-feat'));
  });

  test('branch identification', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeCap(tmpDir, 'payments', { status: 'verified' });
    writeCap(tmpDir, 'reporting', { status: 'verified' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']); // same branch as login
    writeFeat(tmpDir, 'reports', ['reporting']); // different branch

    const result = runQuery(tmpDir, ['sequence']);
    assert.strictEqual(result.branches.length, 2);
  });

  test('critical path ordering', () => {
    writeCap(tmpDir, 'auth', { status: 'exploring' });
    writeCap(tmpDir, 'database', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']);
    writeFeat(tmpDir, 'profile', ['auth', 'database']);

    const result = runQuery(tmpDir, ['sequence']);
    // auth blocks 3 features, database blocks 1 -> auth is first in critical path
    assert.strictEqual(result.critical_path[0].cap, 'auth');
    assert.strictEqual(result.critical_path[0].unblocks, 3);
  });
});

// ─── queryCoupling ────────────────────────────────────────────────────────────

describe('graph-query coupling', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('detects shared capabilities', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']);

    const result = runQuery(tmpDir, ['coupling']);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shared_cap, 'auth');
    assert.deepStrictEqual(result[0].features.sort(), ['login', 'signup']);
  });
});

// ─── queryWaves ───────────────────────────────────────────────────────────────

describe('graph-query waves', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('scoped wave ordering', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeCap(tmpDir, 'payments', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'checkout', ['payments']);
    writeFeat(tmpDir, 'unscoped', ['auth']);

    const result = runQuery(tmpDir, ['waves', '--scope', 'login,checkout']);
    assert.ok(result.wave_1.find(f => f.slug === 'login'));
    assert.ok(result.blocked.find(f => f.slug === 'checkout'));
    assert.ok(!result.wave_1.find(f => f.slug === 'unscoped'));
  });

  test('coordinate flags in wave 1', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']);

    const result = runQuery(tmpDir, ['waves', '--scope', 'login,signup']);
    assert.strictEqual(result.coordinate_flags.length, 1);
    assert.strictEqual(result.coordinate_flags[0].shared_cap, 'auth');
  });
});

// ─── queryDownstream ──────────────────────────────────────────────────────────

describe('graph-query downstream', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns features composing a capability', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']);
    writeFeat(tmpDir, 'standalone', []);

    const result = runQuery(tmpDir, ['downstream', 'auth']);
    assert.strictEqual(result.cap, 'auth');
    assert.deepStrictEqual(result.downstream_features.sort(), ['login', 'signup']);
  });
});

// ─── queryUpstream ───────────────────────────────────────────────────────────

describe('graph-query upstream', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns upstream caps with status, readiness, and contract completeness', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeCap(tmpDir, 'db', { status: 'in-progress' });
    writeFeat(tmpDir, 'login', ['auth', 'db']);

    const result = runQuery(tmpDir, ['upstream', 'login']);
    assert.strictEqual(result.slug, 'login');
    assert.strictEqual(result.upstream_capabilities.length, 2);

    const auth = result.upstream_capabilities.find(c => c.cap === 'auth');
    assert.strictEqual(auth.ready, true);
    assert.strictEqual(auth.contract_complete, false);
    assert.ok(auth.missing.length > 0);

    const db = result.upstream_capabilities.find(c => c.cap === 'db');
    assert.strictEqual(db.ready, false);
    assert.strictEqual(db.contract_complete, false);
  });

  test('contract_complete true when all required sections present', () => {
    writeFullCap(tmpDir, 'payments', 'verified');
    writeFeat(tmpDir, 'checkout', ['payments']);

    const result = runQuery(tmpDir, ['upstream', 'checkout']);
    const payments = result.upstream_capabilities[0];
    assert.strictEqual(payments.contract_complete, true);
    assert.deepStrictEqual(payments.missing, []);
    assert.strictEqual(payments.ready, true);
  });

  test('returns error for unknown feature slug', () => {
    const result = runQuery(tmpDir, ['upstream', 'nonexistent']);
    assert.strictEqual(result.upstream_capabilities.length, 0);
    assert.ok(result.error);
  });
});

// ─── queryUpstreamGaps ───────────────────────────────────────────────────────

describe('graph-query upstream-gaps', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('has_gaps false when all caps verified with complete contracts', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFullCap(tmpDir, 'db', 'complete');
    writeFeat(tmpDir, 'login', ['auth', 'db']);

    const result = runQuery(tmpDir, ['upstream-gaps', 'login']);
    assert.strictEqual(result.has_gaps, false);
    assert.strictEqual(result.gaps.length, 0);
  });

  test('flags gap when cap has non-ready status', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFullCap(tmpDir, 'db', 'in-progress');
    writeFeat(tmpDir, 'login', ['auth', 'db']);

    const result = runQuery(tmpDir, ['upstream-gaps', 'login']);
    assert.strictEqual(result.has_gaps, true);
    assert.strictEqual(result.gaps.length, 1);
    assert.strictEqual(result.gaps[0].cap, 'db');
    assert.strictEqual(result.gaps[0].ready, false);
    assert.strictEqual(result.gaps[0].contract_complete, true);
  });

  test('flags gap when cap is verified but contract incomplete', () => {
    writeCap(tmpDir, 'auth', { status: 'verified' });
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['upstream-gaps', 'login']);
    assert.strictEqual(result.has_gaps, true);
    assert.strictEqual(result.gaps.length, 1);
    assert.strictEqual(result.gaps[0].cap, 'auth');
    assert.strictEqual(result.gaps[0].ready, true);
    assert.strictEqual(result.gaps[0].contract_complete, false);
    assert.ok(result.gaps[0].missing.includes('### Receives'));
  });

  test('mixed: status gap + contract gap + clean cap', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFullCap(tmpDir, 'db', 'in-progress');
    writeCap(tmpDir, 'cache', { status: 'verified' });
    writeFeat(tmpDir, 'dashboard', ['auth', 'db', 'cache']);

    const result = runQuery(tmpDir, ['upstream-gaps', 'dashboard']);
    assert.strictEqual(result.has_gaps, true);
    assert.strictEqual(result.gaps.length, 2);
    const gapSlugs = result.gaps.map(g => g.cap).sort();
    assert.deepStrictEqual(gapSlugs, ['cache', 'db']);

    const db = result.gaps.find(g => g.cap === 'db');
    assert.strictEqual(db.ready, false);
    assert.strictEqual(db.contract_complete, true);

    const cache = result.gaps.find(g => g.cap === 'cache');
    assert.strictEqual(cache.ready, true);
    assert.strictEqual(cache.contract_complete, false);
  });
});

// ─── querySequenceStale ───────────────────────────────────────────────────────

describe('graph-query sequence-stale', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('no .planning/ dir returns not stale', () => {
    const result = runQuery(tmpDir, ['sequence-stale']);
    assert.strictEqual(result.stale, false);
    assert.strictEqual(result.reason, 'no_planning_directory');
  });

  test('no SEQUENCE.md returns stale', () => {
    setupProject(tmpDir);

    const result = runQuery(tmpDir, ['sequence-stale']);
    assert.strictEqual(result.stale, true);
    assert.strictEqual(result.reason, 'no_sequence_file');
  });

  test('fresh SEQUENCE.md returns not stale', () => {
    setupProject(tmpDir);
    writeCap(tmpDir, 'auth', { status: 'verified' });

    const capPath = path.join(tmpDir, '.planning', 'capabilities', 'auth', 'CAPABILITY.md');
    const now = new Date();
    fs.utimesSync(capPath, now, now);
    const seqPath = path.join(tmpDir, '.planning', 'SEQUENCE.md');
    const later = new Date(now.getTime() + 1000);
    fs.writeFileSync(seqPath, '# Sequence');
    fs.utimesSync(seqPath, later, later);

    const result = runQuery(tmpDir, ['sequence-stale']);
    assert.strictEqual(result.stale, false);
    assert.strictEqual(result.reason, 'up_to_date');
  });

  test('modified cap after SEQUENCE.md returns stale', () => {
    setupProject(tmpDir);

    const seqPath = path.join(tmpDir, '.planning', 'SEQUENCE.md');
    const earlier = new Date(Date.now() - 2000);
    fs.writeFileSync(seqPath, '# Sequence');
    fs.utimesSync(seqPath, earlier, earlier);

    writeCap(tmpDir, 'auth', { status: 'verified' });

    const result = runQuery(tmpDir, ['sequence-stale']);
    assert.strictEqual(result.stale, true);
    assert.strictEqual(result.reason, 'planning_files_modified');
  });
});
