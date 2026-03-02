/**
 * GSD Tools Tests - Verify
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// -------------------------------------------------------------------------
// verify artifacts command
// -------------------------------------------------------------------------

describe('verify artifacts command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-test'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  function writePlanWithArtifacts(tmpDir, artifactsYaml) {
    // parseMustHavesBlock expects 4-space indent for block name, 6-space for items, 8-space for keys
    const content = [
      '---',
      'phase: 01-test',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [src/app.js]',
      'autonomous: true',
      'must_haves:',
      '    artifacts:',
      ...artifactsYaml.map(line => `      ${line}`),
      '---',
      '',
      '<tasks>',
      '<task type="auto">',
      '  <name>Task 1: Do thing</name>',
      '  <files>src/app.js</files>',
      '  <action>Do it</action>',
      '  <verify><automated>echo ok</automated></verify>',
      '  <done>Done</done>',
      '</task>',
      '</tasks>',
    ].join('\n');
    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, content);
  }

  test('passes when all artifacts exist and match criteria', () => {
    writePlanWithArtifacts(tmpDir, [
      '- path: "src/app.js"',
      '  min_lines: 2',
      '  contains: "export"',
    ]);
    fs.writeFileSync(path.join(tmpDir, 'src', 'app.js'), 'const x = 1;\nexport default x;\nconst y = 2;\n');

    const result = runGsdTools('verify artifacts .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_passed, true, `Expected all_passed true: ${JSON.stringify(output)}`);
  });

  test('reports missing artifact file', () => {
    writePlanWithArtifacts(tmpDir, [
      '- path: "src/nonexistent.js"',
    ]);

    const result = runGsdTools('verify artifacts .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_passed, false, 'Expected all_passed false');
    assert.ok(
      output.artifacts[0].issues.some(i => i.includes('File not found')),
      `Expected "File not found" in issues: ${JSON.stringify(output.artifacts[0].issues)}`
    );
  });

  test('reports insufficient line count', () => {
    writePlanWithArtifacts(tmpDir, [
      '- path: "src/app.js"',
      '  min_lines: 10',
    ]);
    fs.writeFileSync(path.join(tmpDir, 'src', 'app.js'), 'const x = 1;\n');

    const result = runGsdTools('verify artifacts .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_passed, false, 'Expected all_passed false');
    assert.ok(
      output.artifacts[0].issues.some(i => i.includes('Only') && i.includes('lines, need 10')),
      `Expected line count issue: ${JSON.stringify(output.artifacts[0].issues)}`
    );
  });

  test('reports missing pattern', () => {
    writePlanWithArtifacts(tmpDir, [
      '- path: "src/app.js"',
      '  contains: "module.exports"',
    ]);
    fs.writeFileSync(path.join(tmpDir, 'src', 'app.js'), 'const x = 1;\n');

    const result = runGsdTools('verify artifacts .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_passed, false, 'Expected all_passed false');
    assert.ok(
      output.artifacts[0].issues.some(i => i.includes('Missing pattern')),
      `Expected "Missing pattern" in issues: ${JSON.stringify(output.artifacts[0].issues)}`
    );
  });

  test('reports missing export', () => {
    writePlanWithArtifacts(tmpDir, [
      '- path: "src/app.js"',
      '  exports:',
      '    - GET',
    ]);
    fs.writeFileSync(path.join(tmpDir, 'src', 'app.js'), 'const x = 1;\nexport const POST = () => {};\n');

    const result = runGsdTools('verify artifacts .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_passed, false, 'Expected all_passed false');
    assert.ok(
      output.artifacts[0].issues.some(i => i.includes('Missing export')),
      `Expected "Missing export" in issues: ${JSON.stringify(output.artifacts[0].issues)}`
    );
  });

  test('returns error when no artifacts in frontmatter', () => {
    const content = [
      '---',
      'phase: 01-test',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [src/app.js]',
      'autonomous: true',
      'must_haves:',
      '  truths:',
      '    - "something is true"',
      '---',
      '',
      '<tasks></tasks>',
    ].join('\n');
    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, content);

    const result = runGsdTools('verify artifacts .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.error, `Expected error field: ${JSON.stringify(output)}`);
    assert.ok(
      output.error.includes('No must_haves.artifacts'),
      `Expected "No must_haves.artifacts" in error: ${output.error}`
    );
  });
});

// -------------------------------------------------------------------------
// verify key-links command
// -------------------------------------------------------------------------

describe('verify key-links command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-test'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  function writePlanWithKeyLinks(tmpDir, keyLinksYaml) {
    // parseMustHavesBlock expects 4-space indent for block name, 6-space for items, 8-space for keys
    const content = [
      '---',
      'phase: 01-test',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [src/a.js]',
      'autonomous: true',
      'must_haves:',
      '    key_links:',
      ...keyLinksYaml.map(line => `      ${line}`),
      '---',
      '',
      '<tasks>',
      '<task type="auto">',
      '  <name>Task 1: Do thing</name>',
      '  <files>src/a.js</files>',
      '  <action>Do it</action>',
      '  <verify><automated>echo ok</automated></verify>',
      '  <done>Done</done>',
      '</task>',
      '</tasks>',
    ].join('\n');
    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, content);
  }

  test('verifies link when pattern found in source', () => {
    writePlanWithKeyLinks(tmpDir, [
      '- from: "src/a.js"',
      '  to: "src/b.js"',
      '  pattern: "import.*b"',
    ]);
    fs.writeFileSync(path.join(tmpDir, 'src', 'a.js'), "import { x } from './b';\n");
    fs.writeFileSync(path.join(tmpDir, 'src', 'b.js'), 'exports.x = 1;\n');

    const result = runGsdTools('verify key-links .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_verified, true, `Expected all_verified true: ${JSON.stringify(output)}`);
  });

  test('verifies link when pattern found in target', () => {
    writePlanWithKeyLinks(tmpDir, [
      '- from: "src/a.js"',
      '  to: "src/b.js"',
      '  pattern: "exports\\.targetFunc"',
    ]);
    // pattern NOT in source, but found in target
    fs.writeFileSync(path.join(tmpDir, 'src', 'a.js'), 'const x = 1;\n');
    fs.writeFileSync(path.join(tmpDir, 'src', 'b.js'), 'exports.targetFunc = () => {};\n');

    const result = runGsdTools('verify key-links .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_verified, true, `Expected verified via target: ${JSON.stringify(output)}`);
    assert.ok(
      output.links[0].detail.includes('target'),
      `Expected detail about target: ${output.links[0].detail}`
    );
  });

  test('fails when pattern not found in source or target', () => {
    writePlanWithKeyLinks(tmpDir, [
      '- from: "src/a.js"',
      '  to: "src/b.js"',
      '  pattern: "missingPattern"',
    ]);
    fs.writeFileSync(path.join(tmpDir, 'src', 'a.js'), 'const x = 1;\n');
    fs.writeFileSync(path.join(tmpDir, 'src', 'b.js'), 'const y = 2;\n');

    const result = runGsdTools('verify key-links .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_verified, false, `Expected all_verified false: ${JSON.stringify(output)}`);
    assert.strictEqual(output.links[0].verified, false, 'link should not be verified');
  });

  test('verifies link without pattern using string inclusion', () => {
    writePlanWithKeyLinks(tmpDir, [
      '- from: "src/a.js"',
      '  to: "src/b.js"',
    ]);
    // source file contains the 'to' value as a string
    fs.writeFileSync(path.join(tmpDir, 'src', 'a.js'), "const b = require('./src/b.js');\n");
    fs.writeFileSync(path.join(tmpDir, 'src', 'b.js'), 'module.exports = {};\n');

    const result = runGsdTools('verify key-links .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.all_verified, true, `Expected all_verified true: ${JSON.stringify(output)}`);
    assert.ok(
      output.links[0].detail.includes('Target referenced in source'),
      `Expected "Target referenced in source" in detail: ${output.links[0].detail}`
    );
  });

  test('reports source file not found', () => {
    writePlanWithKeyLinks(tmpDir, [
      '- from: "src/nonexistent.js"',
      '  to: "src/b.js"',
      '  pattern: "something"',
    ]);
    fs.writeFileSync(path.join(tmpDir, 'src', 'b.js'), 'module.exports = {};\n');

    const result = runGsdTools('verify key-links .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(
      output.links[0].detail.includes('Source file not found'),
      `Expected "Source file not found" in detail: ${output.links[0].detail}`
    );
  });

  test('returns error when no key_links in frontmatter', () => {
    const content = [
      '---',
      'phase: 01-test',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'depends_on: []',
      'files_modified: [src/a.js]',
      'autonomous: true',
      'must_haves:',
      '  truths:',
      '    - "something is true"',
      '---',
      '',
      '<tasks></tasks>',
    ].join('\n');
    const planPath = path.join(tmpDir, '.planning', 'phases', '01-test', '01-01-PLAN.md');
    fs.writeFileSync(planPath, content);

    const result = runGsdTools('verify key-links .planning/phases/01-test/01-01-PLAN.md', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.error, `Expected error field: ${JSON.stringify(output)}`);
    assert.ok(
      output.error.includes('No must_haves.key_links'),
      `Expected "No must_haves.key_links" in error: ${output.error}`
    );
  });
});
