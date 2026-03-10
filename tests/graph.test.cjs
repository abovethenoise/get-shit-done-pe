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
  const { depends_on, ...rest } = fields;
  const fm = { name: rest.name || slug, status: rest.status || 'exploring', ...rest };
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    lines.push(`${k}: ${v}`);
  }
  if (depends_on) {
    lines.push('depends_on:');
    for (const d of depends_on) lines.push(`  - ${d}`);
  }
  lines.push('---', `# ${slug}`);
  fs.writeFileSync(path.join(dir, 'CAPABILITY.md'), lines.join('\n'));
}

function writeFullCap(tmpDir, slug, status, uiFacing = false) {
  const dir = path.join(tmpDir, '.planning', 'capabilities', slug);
  fs.mkdirSync(dir, { recursive: true });
  const lines = [
    '---', `name: ${slug}`, `status: ${status}`, `ui_facing: ${uiFacing}`, '---',
    `# ${slug}`, '## Contract', '### Receives', 'Input',
    '### Returns', 'Output', '### Rules', '- Rule',
  ];
  if (uiFacing) {
    lines.push('## Design References', '| Element | Design System Entry | Usage |', '|---------|-------------------|-------|', '| button | Components.primary-button | main CTA |');
  }
  fs.writeFileSync(path.join(dir, 'CAPABILITY.md'), lines.join('\n'));
}

function writeUiCapNoDesignRefs(tmpDir, slug, status) {
  const dir = path.join(tmpDir, '.planning', 'capabilities', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'CAPABILITY.md'), [
    '---', `name: ${slug}`, `status: ${status}`, 'ui_facing: true', '---',
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

  test('returns error for unknown slug', () => {
    const result = runQuery(tmpDir, ['upstream', 'nonexistent']);
    assert.strictEqual(result.upstream_capabilities.length, 0);
    assert.ok(result.error);
  });

  test('returns type field for feature upstream', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['upstream', 'login']);
    assert.strictEqual(result.type, 'feature');
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

// ─── ui_facing support ───────────────────────────────────────────────────────

describe('ui_facing node attribute', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('buildGraph propagates ui_facing from frontmatter', () => {
    writeCap(tmpDir, 'button', { status: 'verified', ui_facing: true });
    writeCap(tmpDir, 'auth', { status: 'verified' });

    const graph = buildGraph(tmpDir);
    const button = graph.nodes.find(n => n.slug === 'button');
    const auth = graph.nodes.find(n => n.slug === 'auth');
    assert.strictEqual(button.ui_facing, true);
    assert.strictEqual(auth.ui_facing, false);
  });

  test('querySequence includes has_ui for features composing ui_facing caps', () => {
    writeFullCap(tmpDir, 'button', 'verified', true);
    writeFullCap(tmpDir, 'auth', 'verified', false);
    writeFeat(tmpDir, 'login-form', ['button', 'auth']);
    writeFeat(tmpDir, 'api-auth', ['auth']);

    const result = runQuery(tmpDir, ['sequence']);
    const loginForm = result.executable.find(f => f.slug === 'login-form');
    const apiAuth = result.executable.find(f => f.slug === 'api-auth');
    assert.strictEqual(loginForm.has_ui, true);
    assert.strictEqual(apiAuth.has_ui, false);
  });

  test('queryWaves includes has_ui', () => {
    writeFullCap(tmpDir, 'button', 'verified', true);
    writeFullCap(tmpDir, 'auth', 'verified', false);
    writeFeat(tmpDir, 'login-form', ['button', 'auth']);
    writeFeat(tmpDir, 'api-auth', ['auth']);

    const result = runQuery(tmpDir, ['waves', '--scope', 'login-form,api-auth']);
    const loginForm = result.wave_1.find(f => f.slug === 'login-form');
    const apiAuth = result.wave_1.find(f => f.slug === 'api-auth');
    assert.strictEqual(loginForm.has_ui, true);
    assert.strictEqual(apiAuth.has_ui, false);
  });

  test('queryUpstream includes ui_facing per cap', () => {
    writeFullCap(tmpDir, 'button', 'verified', true);
    writeFullCap(tmpDir, 'auth', 'verified', false);
    writeFeat(tmpDir, 'login-form', ['button', 'auth']);

    const result = runQuery(tmpDir, ['upstream', 'login-form']);
    const button = result.upstream_capabilities.find(c => c.cap === 'button');
    const auth = result.upstream_capabilities.find(c => c.cap === 'auth');
    assert.strictEqual(button.ui_facing, true);
    assert.strictEqual(auth.ui_facing, false);
  });
});

describe('validateCapContract with ui_facing', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('ui_facing cap with Design References passes contract check', () => {
    writeFullCap(tmpDir, 'button', 'verified', true);
    writeFeat(tmpDir, 'form', ['button']);

    const result = runQuery(tmpDir, ['upstream', 'form']);
    const button = result.upstream_capabilities.find(c => c.cap === 'button');
    assert.strictEqual(button.contract_complete, true);
    assert.deepStrictEqual(button.missing, []);
  });

  test('ui_facing cap WITHOUT Design References fails contract check', () => {
    writeUiCapNoDesignRefs(tmpDir, 'button', 'verified');
    writeFeat(tmpDir, 'form', ['button']);

    const result = runQuery(tmpDir, ['upstream', 'form']);
    const button = result.upstream_capabilities.find(c => c.cap === 'button');
    assert.strictEqual(button.contract_complete, false);
    assert.ok(button.missing.includes('## Design References'));
  });

  test('non-ui_facing cap does not require Design References', () => {
    writeFullCap(tmpDir, 'auth', 'verified', false);
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['upstream', 'login']);
    const auth = result.upstream_capabilities.find(c => c.cap === 'auth');
    assert.strictEqual(auth.contract_complete, true);
    assert.deepStrictEqual(auth.missing, []);
  });

  test('upstream-gaps flags ui_facing cap missing Design References', () => {
    writeUiCapNoDesignRefs(tmpDir, 'button', 'verified');
    writeFeat(tmpDir, 'form', ['button']);

    const result = runQuery(tmpDir, ['upstream-gaps', 'form']);
    assert.strictEqual(result.has_gaps, true);
    assert.strictEqual(result.gaps.length, 1);
    assert.strictEqual(result.gaps[0].cap, 'button');
    assert.ok(result.gaps[0].missing.includes('## Design References'));
  });
});

// ─── cap-to-cap depends_on ────────────────────────────────────────────────────

describe('cap-to-cap depends_on', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('buildGraph creates cap→cap edges from depends_on[]', () => {
    writeCap(tmpDir, 'database', { status: 'verified' });
    writeCap(tmpDir, 'auth', { status: 'verified', depends_on: ['database'] });

    const graph = buildGraph(tmpDir);
    const depEdges = graph.edges.filter(e => e.type === 'depends_on');
    assert.strictEqual(depEdges.length, 1);
    assert.strictEqual(depEdges[0].from, 'cap:auth');
    assert.strictEqual(depEdges[0].to, 'cap:database');
  });

  test('buildGraph stores depends_on on capability nodes', () => {
    writeCap(tmpDir, 'database', { status: 'verified' });
    writeCap(tmpDir, 'auth', { status: 'verified', depends_on: ['database'] });

    const graph = buildGraph(tmpDir);
    const authNode = graph.nodes.find(n => n.slug === 'auth');
    assert.deepStrictEqual(authNode.depends_on, ['database']);
    const dbNode = graph.nodes.find(n => n.slug === 'database');
    assert.deepStrictEqual(dbNode.depends_on, []);
  });

  test('queryUpstream for a capability returns upstream caps with status/readiness/contract', () => {
    writeFullCap(tmpDir, 'database', 'verified');
    writeCap(tmpDir, 'cache', { status: 'exploring' });
    writeCap(tmpDir, 'auth', { status: 'specified', depends_on: ['database', 'cache'] });

    const result = runQuery(tmpDir, ['upstream', 'auth']);
    assert.strictEqual(result.type, 'capability');
    assert.strictEqual(result.upstream_capabilities.length, 2);

    const db = result.upstream_capabilities.find(c => c.cap === 'database');
    assert.strictEqual(db.ready, true);
    assert.strictEqual(db.contract_complete, true);

    const cache = result.upstream_capabilities.find(c => c.cap === 'cache');
    assert.strictEqual(cache.ready, false);
    assert.strictEqual(cache.contract_complete, false);
  });

  test('queryUpstream for a capability with no depends_on returns empty upstream', () => {
    writeCap(tmpDir, 'standalone', { status: 'verified' });

    const result = runQuery(tmpDir, ['upstream', 'standalone']);
    assert.strictEqual(result.type, 'capability');
    assert.strictEqual(result.upstream_capabilities.length, 0);
  });

  test('queryUpstreamGaps for a capability with unready upstream returns gaps', () => {
    writeFullCap(tmpDir, 'database', 'verified');
    writeFullCap(tmpDir, 'cache', 'in-progress');
    writeCap(tmpDir, 'auth', { status: 'specified', depends_on: ['database', 'cache'] });

    const result = runQuery(tmpDir, ['upstream-gaps', 'auth']);
    assert.strictEqual(result.has_gaps, true);
    assert.strictEqual(result.gaps.length, 1);
    assert.strictEqual(result.gaps[0].cap, 'cache');
    assert.strictEqual(result.gaps[0].ready, false);
  });

  test('orphan detection still works — caps with no downstream features are orphans', () => {
    writeCap(tmpDir, 'database', { status: 'verified' });
    writeCap(tmpDir, 'auth', { status: 'verified', depends_on: ['database'] });
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['sequence']);
    // database is composed by nothing directly (only depended on by auth)
    assert.ok(result.orphans.capabilities.includes('database'));
    // auth is composed by login — not orphan
    assert.ok(!result.orphans.capabilities.includes('auth'));
  });
});

// ─── Test helper: write feature artifacts ──────────────────────────────────────

function writeFeatureArtifacts(tmpDir, slug, artifacts = {}) {
  const dir = path.join(tmpDir, '.planning', 'features', slug);
  fs.mkdirSync(dir, { recursive: true });
  if (artifacts.plan) {
    fs.writeFileSync(path.join(dir, '01-PLAN.md'), '# Plan');
  }
  if (artifacts.summary) {
    fs.writeFileSync(path.join(dir, '01-SUMMARY.md'), '# Summary');
  }
  if (artifacts.review) {
    fs.mkdirSync(path.join(dir, 'review'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'review', 'review.md'), '# Review');
  }
  if (artifacts.doc) {
    fs.mkdirSync(path.join(dir, 'review'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'doc-report.md'), '# Doc Report');
  }
}

// ─── queryRouteCheck ──────────────────────────────────────────────────────────

describe('graph-query route-check', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('simple: linear chain (cap exploring → cap specified → feat)', () => {
    writeCap(tmpDir, 'database', { status: 'exploring' });
    writeCap(tmpDir, 'auth', { status: 'specified', depends_on: ['database'] });
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['route-check']);
    assert.strictEqual(result.complexity, 'simple');
    assert.ok(result.chain.length >= 2);
    // Topo order: database before auth (database is upstream)
    const dbIdx = result.chain.findIndex(c => c.slug === 'database');
    const authIdx = result.chain.findIndex(c => c.slug === 'auth');
    assert.ok(dbIdx < authIdx || dbIdx === -1 || authIdx === -1);
  });

  test('simple: all ready, feat has PLAN', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeatureArtifacts(tmpDir, 'login', { plan: true });

    const result = runQuery(tmpDir, ['route-check']);
    assert.strictEqual(result.complexity, 'simple');
    const loginItem = result.chain.find(c => c.slug === 'login');
    assert.ok(loginItem);
    assert.strictEqual(loginItem.stage, 'execute');
  });

  test('simple: nothing to do (all complete)', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeatureArtifacts(tmpDir, 'login', { plan: true, summary: true, review: true, doc: true });

    const result = runQuery(tmpDir, ['route-check']);
    assert.strictEqual(result.complexity, 'simple');
    assert.deepStrictEqual(result.chain, []);
  });

  test('complex: shared contention (2 feats, 1 unverified cap)', () => {
    writeCap(tmpDir, 'auth', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']);

    const result = runQuery(tmpDir, ['route-check']);
    assert.ok(result.signals.includes('shared_cap_contention'));
  });

  test('complex: 3+ unready upstream', () => {
    writeCap(tmpDir, 'database', { status: 'exploring' });
    writeCap(tmpDir, 'cache', { status: 'exploring' });
    writeCap(tmpDir, 'auth', { status: 'exploring', depends_on: ['database', 'cache'] });
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['route-check']);
    assert.ok(result.signals.includes('high_unready_upstream'));
  });

  test('complex: deep + branching', () => {
    // Create a deep chain: d→c→b→a, plus a separate branch e→f
    writeCap(tmpDir, 'cap-d', { status: 'exploring' });
    writeCap(tmpDir, 'cap-c', { status: 'exploring', depends_on: ['cap-d'] });
    writeCap(tmpDir, 'cap-b', { status: 'exploring', depends_on: ['cap-c'] });
    writeCap(tmpDir, 'cap-a', { status: 'exploring', depends_on: ['cap-b'] });
    writeCap(tmpDir, 'cap-e', { status: 'exploring' });
    writeFeat(tmpDir, 'feat-main', ['cap-a']);
    writeFeat(tmpDir, 'feat-side', ['cap-e']);

    const result = runQuery(tmpDir, ['route-check']);
    assert.ok(result.signals.includes('deep_branching'));
  });

  test('complex: branching shared caps', () => {
    writeCap(tmpDir, 'shared', { status: 'exploring' });
    writeCap(tmpDir, 'isolated', { status: 'exploring' });
    writeFeat(tmpDir, 'feat-a', ['shared']);
    writeFeat(tmpDir, 'feat-b', ['shared']);
    writeFeat(tmpDir, 'feat-c', ['isolated']); // disjoint branch

    const result = runQuery(tmpDir, ['route-check']);
    assert.ok(result.signals.includes('branching_shared_caps'));
  });

  test('feature stage: plan/execute/review/doc/complete', () => {
    writeFullCap(tmpDir, 'auth', 'verified');

    // plan stage (no PLAN yet)
    writeFeat(tmpDir, 'feat-plan', ['auth'], { status: 'specified' });

    // execute stage (has PLAN, no SUMMARY)
    writeFeat(tmpDir, 'feat-exec', ['auth'], { status: 'specified' });
    writeFeatureArtifacts(tmpDir, 'feat-exec', { plan: true });

    // review stage (has SUMMARY, no review/)
    writeFeat(tmpDir, 'feat-review', ['auth'], { status: 'specified' });
    writeFeatureArtifacts(tmpDir, 'feat-review', { plan: true, summary: true });

    // doc stage (has review/, no doc-report)
    writeFeat(tmpDir, 'feat-doc', ['auth'], { status: 'specified' });
    writeFeatureArtifacts(tmpDir, 'feat-doc', { plan: true, summary: true, review: true });

    // complete stage
    writeFeat(tmpDir, 'feat-done', ['auth'], { status: 'specified' });
    writeFeatureArtifacts(tmpDir, 'feat-done', { plan: true, summary: true, review: true, doc: true });

    const result = runQuery(tmpDir, ['route-check']);
    const findStage = (slug) => {
      const item = result.chain.find(c => c.slug === slug);
      return item ? item.stage : null;
    };

    assert.strictEqual(findStage('feat-plan'), 'plan');
    assert.strictEqual(findStage('feat-exec'), 'execute');
    assert.strictEqual(findStage('feat-review'), 'review');
    assert.strictEqual(findStage('feat-doc'), 'doc');
    // feat-done should not appear in chain (complete)
    assert.strictEqual(findStage('feat-done'), null);
  });

  test('cap stage: exploring/specified/verified', () => {
    writeCap(tmpDir, 'cap-exp', { status: 'exploring' });
    writeCap(tmpDir, 'cap-spec', { status: 'specified' });
    writeFullCap(tmpDir, 'cap-ver', 'verified');
    writeFeat(tmpDir, 'feat', ['cap-exp', 'cap-spec', 'cap-ver']);

    const result = runQuery(tmpDir, ['route-check']);
    const findStage = (slug) => {
      const item = result.chain.find(c => c.slug === slug);
      return item ? item.stage : null;
    };

    assert.strictEqual(findStage('cap-exp'), 'discuss');
    assert.strictEqual(findStage('cap-spec'), 'plan');
    // cap-ver is complete, not in chain
    assert.strictEqual(findStage('cap-ver'), null);
  });

  test('scoped query filters to scope + upstream', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeCap(tmpDir, 'payments', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'checkout', ['payments']);

    const result = runQuery(tmpDir, ['route-check', '--scope', 'login']);
    // Should only include login and its upstream (auth — but auth is complete)
    // checkout and payments should be excluded
    const slugs = result.chain.map(c => c.slug);
    assert.ok(!slugs.includes('checkout'));
    assert.ok(!slugs.includes('payments'));
  });

  test('suggested_scope non-empty on complex', () => {
    writeCap(tmpDir, 'auth', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']);

    const result = runQuery(tmpDir, ['route-check']);
    if (result.complexity === 'complex') {
      assert.ok(result.suggested_scope.length > 0);
    }
  });

  test('suggested_scope empty on simple', () => {
    writeCap(tmpDir, 'auth', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['route-check']);
    assert.strictEqual(result.complexity, 'simple');
    assert.deepStrictEqual(result.suggested_scope, []);
  });

  test('transitive unready (feat→cap→cap chain)', () => {
    writeCap(tmpDir, 'database', { status: 'exploring' });
    writeCap(tmpDir, 'cache', { status: 'exploring' });
    writeCap(tmpDir, 'auth', { status: 'exploring', depends_on: ['database', 'cache'] });
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['route-check']);
    // All 3 caps should be in chain (all unready, all reachable)
    const slugs = result.chain.map(c => c.slug);
    assert.ok(slugs.includes('database'));
    assert.ok(slugs.includes('cache'));
    assert.ok(slugs.includes('auth'));
  });

  test('cycle detection', () => {
    // Create a cycle: a depends on b, b depends on a
    writeCap(tmpDir, 'cap-a', { status: 'exploring', depends_on: ['cap-b'] });
    writeCap(tmpDir, 'cap-b', { status: 'exploring', depends_on: ['cap-a'] });
    writeFeat(tmpDir, 'feat', ['cap-a']);

    const result = runQuery(tmpDir, ['route-check']);
    assert.ok(result.signals.includes('cycle'));
  });
});

// ─── queryExecutePreflight ────────────────────────────────────────────────────

describe('graph-query execute-preflight', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-graph-test-'));
    setupProject(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('feature with no plan', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFeat(tmpDir, 'login', ['auth']);

    const result = runQuery(tmpDir, ['execute-preflight', 'login']);
    assert.strictEqual(result.ready, false);
    assert.strictEqual(result.reason, 'no_plan');
    assert.ok(result.route);
  });

  test('feature with stale plan', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFeat(tmpDir, 'login', ['auth']);

    // Create plan first (older)
    const featDir = path.join(tmpDir, '.planning', 'features', 'login');
    const planPath = path.join(featDir, '01-PLAN.md');
    const earlier = new Date(Date.now() - 5000);
    fs.writeFileSync(planPath, '# Plan');
    fs.utimesSync(planPath, earlier, earlier);

    // Touch FEATURE.md to make it newer
    const featPath = path.join(featDir, 'FEATURE.md');
    const now = new Date();
    fs.utimesSync(featPath, now, now);

    const result = runQuery(tmpDir, ['execute-preflight', 'login']);
    assert.strictEqual(result.ready, false);
    assert.strictEqual(result.reason, 'stale_plan');
  });

  test('feature with upstream gaps', () => {
    writeCap(tmpDir, 'auth', { status: 'exploring' });
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeatureArtifacts(tmpDir, 'login', { plan: true });

    // Make plan newer than FEATURE.md
    const featDir = path.join(tmpDir, '.planning', 'features', 'login');
    const planPath = path.join(featDir, '01-PLAN.md');
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(planPath, later, later);

    const result = runQuery(tmpDir, ['execute-preflight', 'login']);
    assert.strictEqual(result.ready, false);
    assert.strictEqual(result.reason, 'upstream_gaps');
    assert.ok(result.gaps.length > 0);
  });

  test('feature ready (plan exists, fresh, upstream clear)', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeatureArtifacts(tmpDir, 'login', { plan: true });

    // Make plan newer than FEATURE.md
    const featDir = path.join(tmpDir, '.planning', 'features', 'login');
    const planPath = path.join(featDir, '01-PLAN.md');
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(planPath, later, later);

    const result = runQuery(tmpDir, ['execute-preflight', 'login']);
    assert.strictEqual(result.ready, true);
  });

  test('capability preflight aggregates features', () => {
    writeFullCap(tmpDir, 'auth', 'verified');
    writeFeat(tmpDir, 'login', ['auth']);
    writeFeat(tmpDir, 'signup', ['auth']);
    writeFeatureArtifacts(tmpDir, 'login', { plan: true });
    // signup has no plan

    // Make login plan newer
    const loginDir = path.join(tmpDir, '.planning', 'features', 'login');
    const planPath = path.join(loginDir, '01-PLAN.md');
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(planPath, later, later);

    const result = runQuery(tmpDir, ['execute-preflight', 'auth']);
    assert.strictEqual(result.ready, false);
    assert.ok(result.features);
    assert.strictEqual(result.features.length, 2);
    const loginResult = result.features.find(f => f.slug === 'login');
    const signupResult = result.features.find(f => f.slug === 'signup');
    assert.strictEqual(loginResult.ready, true);
    assert.strictEqual(signupResult.ready, false);
    assert.strictEqual(signupResult.reason, 'no_plan');
  });

  test('unknown slug', () => {
    const result = runQuery(tmpDir, ['execute-preflight', 'nonexistent']);
    assert.strictEqual(result.ready, false);
    assert.strictEqual(result.reason, 'not_found');
  });
});
