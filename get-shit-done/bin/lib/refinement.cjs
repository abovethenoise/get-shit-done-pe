/**
 * Refinement — CLI commands and utilities for refinement artifact lifecycle
 */

const fs = require('fs');
const path = require('path');
const { output, error, safeReadFile } = require('./core.cjs');

// ─── Shared Helpers ─────────────────────────────────────────────────────────

function guardPath(value, label) {
  if (!value) error(`${label} value missing`);
  if (value.includes('..')) error(`Invalid ${label}: contains ".." segment`);
}

function clearFindings(findingsDir) {
  if (!fs.existsSync(findingsDir)) return;
  for (const f of fs.readdirSync(findingsDir).filter(f => f.startsWith('FINDING-') && f.endsWith('.md'))) {
    fs.unlinkSync(path.join(findingsDir, f));
  }
}

const matrixKeyFn = row => {
  const keys = Object.keys(row);
  return keys.length >= 2 ? `${row[keys[0]]}|${row[keys[1]]}` : null;
};
const graphKeyFn = row => (row['From'] && row['To']) ? `${row['From']}|${row['To']}` : null;

// ─── Utility Functions ──────────────────────────────────────────────────────

/**
 * Parse a pipe-delimited markdown table into an array of row objects.
 * Returns [] if no table found or content is empty.
 */
function parseMarkdownTable(content) {
  if (!content) return [];

  const lines = content.split('\n');
  let headerIdx = -1;

  // Find header row (first row with |)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('|') && lines[i].trim().startsWith('|')) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const parseRow = (line) =>
    line.split('|').slice(1, -1).map(cell => cell.trim());

  const columns = parseRow(lines[headerIdx]);
  if (columns.length === 0) return [];

  // Skip separator row
  let dataStart = headerIdx + 1;
  if (dataStart < lines.length && lines[dataStart].includes('---')) {
    dataStart++;
  }

  const rows = [];
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) break;
    const cells = parseRow(lines[i]);
    if (cells.length === 0) continue;

    const row = {};
    for (let j = 0; j < columns.length; j++) {
      row[columns[j]] = cells[j] || '';
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Compute added/removed/changed between two Maps with string keys.
 */
function diffMaps(oldMap, newMap) {
  const added = [];
  const removed = [];
  const changed = [];

  for (const [key, value] of newMap) {
    if (!oldMap.has(key)) {
      added.push({ key, value });
    } else if (JSON.stringify(oldMap.get(key)) !== JSON.stringify(value)) {
      changed.push({ key, old: oldMap.get(key), new: value });
    }
  }

  for (const [key, value] of oldMap) {
    if (!newMap.has(key)) {
      removed.push({ key, value });
    }
  }

  return { added, removed, changed };
}

/**
 * Snapshot all FINDING-*.md files from a directory into a Map keyed by finding ID.
 */
function snapshotFindings(findingsDir) {
  const result = new Map();
  if (!fs.existsSync(findingsDir)) return result;

  const files = fs.readdirSync(findingsDir)
    .filter(f => f.startsWith('FINDING-') && f.endsWith('.md'))
    .sort();

  for (const file of files) {
    const id = file.replace('.md', '');
    const content = safeReadFile(path.join(findingsDir, file));
    if (!content) continue;

    // Extract key fields from frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let severity = '', type = '', recommendation = '', summary = '';

    if (fmMatch) {
      const fm = fmMatch[1];
      const typeMatch = fm.match(/^type:\s*(.+)$/m);
      const sevMatch = fm.match(/^severity:\s*(.+)$/m);
      if (typeMatch) type = typeMatch[1].trim();
      if (sevMatch) severity = sevMatch[1].trim();
    }

    // Extract summary from ## Summary section
    const sumMatch = content.match(/## Summary\n+([\s\S]*?)(?=\n## |$)/);
    if (sumMatch) summary = sumMatch[1].trim();

    // Extract recommendation from ## Recommendation section
    const recMatch = content.match(/## Recommendation\n+([\s\S]*?)(?=\n## |$)/);
    if (recMatch) recommendation = recMatch[1].trim();

    result.set(id, { severity, type, recommendation, summary });
  }

  return result;
}

/**
 * Read a file, parse as markdown table, return Map keyed by keyFn(row).
 */
function snapshotTable(filePath, keyFn) {
  const result = new Map();
  const content = safeReadFile(filePath);
  if (!content) return result;

  const rows = parseMarkdownTable(content);
  for (const row of rows) {
    const key = keyFn(row);
    if (key) result.set(key, row);
  }

  return result;
}

// ─── CLI Commands ───────────────────────────────────────────────────────────

/**
 * Create refinement directory structure and snapshot existing state.
 */
function cmdRefinementInit(cwd, raw) {
  const refDir = path.join(cwd, '.planning', 'refinement');
  const findingsDir = path.join(refDir, 'findings');
  const pairsDir = path.join(refDir, 'pairs');

  // Create directory structure
  fs.mkdirSync(findingsDir, { recursive: true });
  fs.mkdirSync(pairsDir, { recursive: true });

  // Snapshot existing state for delta computation
  const recommendations = safeReadFile(path.join(refDir, 'RECOMMENDATIONS.md'));
  const findings = snapshotFindings(findingsDir);
  const matrix = snapshotTable(path.join(refDir, 'matrix.md'), matrixKeyFn);
  const dependencyGraph = snapshotTable(path.join(refDir, 'dependency-graph.md'), graphKeyFn);

  // Clear existing findings to prevent orphans
  clearFindings(findingsDir);

  // Serialize Maps as [key, value] arrays
  const snapshot = {
    recommendations,
    findings: Array.from(findings.entries()),
    matrix: Array.from(matrix.entries()),
    dependencyGraph: Array.from(dependencyGraph.entries()),
  };

  output(snapshot, raw);
}

/**
 * Write a named artifact to the refinement directory.
 */
function cmdRefinementWrite(cwd, args, raw) {
  const typeIdx = args.indexOf('--type');
  const contentFileIdx = args.indexOf('--content-file');
  const nameIdx = args.indexOf('--name');

  const type = typeIdx !== -1 ? args[typeIdx + 1] : null;
  const contentFile = contentFileIdx !== -1 ? args[contentFileIdx + 1] : null;
  const name = nameIdx !== -1 ? args[nameIdx + 1] : null;

  if (!type) error('--type required (matrix|dependency-graph|finding|delta|checkpoint|recommendations)');

  const refDir = path.join(cwd, '.planning', 'refinement');

  // For checkpoint type, we just need --name
  if (type === 'checkpoint') {
    guardPath(name, '--name');
    const pairsDir = path.join(refDir, 'pairs');
    fs.mkdirSync(pairsDir, { recursive: true });
    const filePath = path.join(pairsDir, `${name}.complete`);
    fs.writeFileSync(filePath, '', 'utf-8');
    output({ written: true, type, path: path.relative(cwd, filePath) }, raw);
    return;
  }

  guardPath(contentFile, '--content-file');

  const content = safeReadFile(path.resolve(cwd, contentFile));
  if (content === null) error(`Cannot read content file: ${contentFile}`);

  let destPath;
  switch (type) {
    case 'matrix':
      destPath = path.join(refDir, 'matrix.md');
      break;
    case 'dependency-graph':
      destPath = path.join(refDir, 'dependency-graph.md');
      break;
    case 'finding': {
      // Extract ID from content frontmatter or first heading
      const idMatch = content.match(/id:\s*(FINDING-\d+)/) || content.match(/# (FINDING-\d+)/);
      const id = idMatch ? idMatch[1] : `FINDING-${Date.now()}`;
      fs.mkdirSync(path.join(refDir, 'findings'), { recursive: true });
      destPath = path.join(refDir, 'findings', `${id}.md`);
      break;
    }
    case 'delta':
      destPath = path.join(refDir, 'DELTA.md');
      break;
    case 'recommendations':
      destPath = path.join(refDir, 'RECOMMENDATIONS.md');
      break;
    default:
      error(`Unknown type: ${type}. Expected matrix|dependency-graph|finding|delta|checkpoint|recommendations`);
  }

  fs.writeFileSync(destPath, content, 'utf-8');
  output({ written: true, type, path: path.relative(cwd, destPath) }, raw);
}

/**
 * Write aggregated scan output to .planning/refinement/.
 */
function cmdRefinementReport(cwd, args, raw) {
  const matrixFileIdx = args.indexOf('--matrix-file');
  const graphFileIdx = args.indexOf('--dependency-graph-file');
  const findingsDirIdx = args.indexOf('--findings-dir');

  const refDir = path.join(cwd, '.planning', 'refinement');
  if (!fs.existsSync(refDir)) {
    error('.planning/refinement/ does not exist. Run refinement-init first.');
  }

  const result = { written: { matrix: false, dependencyGraph: false, findings: 0 } };

  // Write matrix
  if (matrixFileIdx !== -1) {
    const matrixFile = args[matrixFileIdx + 1];
    guardPath(matrixFile, '--matrix-file');
    const content = safeReadFile(path.resolve(cwd, matrixFile));
    if (content === null) error(`Cannot read matrix file: ${matrixFile}`);
    fs.writeFileSync(path.join(refDir, 'matrix.md'), content, 'utf-8');
    result.written.matrix = true;
  }

  // Write dependency graph
  if (graphFileIdx !== -1) {
    const graphFile = args[graphFileIdx + 1];
    guardPath(graphFile, '--dependency-graph-file');
    const content = safeReadFile(path.resolve(cwd, graphFile));
    if (content === null) error(`Cannot read dependency-graph file: ${graphFile}`);
    fs.writeFileSync(path.join(refDir, 'dependency-graph.md'), content, 'utf-8');
    result.written.dependencyGraph = true;
  }

  // Write findings
  if (findingsDirIdx !== -1) {
    const srcDir = args[findingsDirIdx + 1];
    guardPath(srcDir, '--findings-dir');
    const srcPath = path.resolve(cwd, srcDir);

    // Clear existing findings
    const destFindingsDir = path.join(refDir, 'findings');
    fs.mkdirSync(destFindingsDir, { recursive: true });
    clearFindings(destFindingsDir);

    // Copy new findings
    if (fs.existsSync(srcPath)) {
      const files = fs.readdirSync(srcPath)
        .filter(f => f.startsWith('FINDING-') && f.endsWith('.md'))
        .sort();
      for (const f of files) {
        const content = safeReadFile(path.join(srcPath, f));
        if (content) {
          fs.writeFileSync(path.join(destFindingsDir, f), content, 'utf-8');
          result.written.findings++;
        }
      }
    }
  }

  output(result, raw);
}

/**
 * Render a delta section as markdown table.
 */
function renderDeltaTable(heading, columns, rows) {
  if (rows.length === 0) return `### ${heading}\n\nNo changes.\n`;

  const header = `| ${columns.join(' | ')} |`;
  const sep = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
  return `### ${heading}\n\n${header}\n${sep}\n${body}\n`;
}

/**
 * Compare pre-scan snapshot to current artifacts and write DELTA.md.
 */
function cmdRefinementDelta(cwd, args, raw) {
  const snapshotFileIdx = args.indexOf('--snapshot-file');
  if (snapshotFileIdx === -1) error('--snapshot-file required');

  const snapshotFile = args[snapshotFileIdx + 1];
  const snapshotContent = safeReadFile(path.resolve(cwd, snapshotFile));
  if (!snapshotContent) error(`Cannot read snapshot file: ${snapshotFile}`);

  const snapshotRaw = JSON.parse(snapshotContent);

  // Deserialize Maps from [key, value] arrays
  const snapshot = {
    recommendations: snapshotRaw.recommendations,
    findings: new Map(snapshotRaw.findings || []),
    matrix: new Map(snapshotRaw.matrix || []),
    dependencyGraph: new Map(snapshotRaw.dependencyGraph || []),
  };

  // First run check: no prior state
  if (snapshot.recommendations === null && snapshot.findings.size === 0) {
    output({ delta: false, reason: 'first_run' }, raw);
    return;
  }

  const refDir = path.join(cwd, '.planning', 'refinement');

  // Read current state
  const currentFindings = snapshotFindings(path.join(refDir, 'findings'));
  const currentMatrix = snapshotTable(path.join(refDir, 'matrix.md'), matrixKeyFn);
  const currentGraph = snapshotTable(path.join(refDir, 'dependency-graph.md'), graphKeyFn);

  // Compute diffs
  const findingsDiff = diffMaps(snapshot.findings, currentFindings);
  const matrixDiff = diffMaps(snapshot.matrix, currentMatrix);
  const graphDiff = diffMaps(snapshot.dependencyGraph, currentGraph);

  // Render DELTA.md
  const sections = [];
  sections.push('# Refinement Delta\n\n*Compared to previous run*\n');

  // Findings section
  sections.push('## Findings\n');
  sections.push(renderDeltaTable('Added',
    ['ID', 'Type', 'Severity', 'Summary'],
    findingsDiff.added.map(e => [e.key, e.value.type, e.value.severity, e.value.summary])
  ));
  sections.push(renderDeltaTable('Resolved',
    ['ID', 'Type', 'Severity', 'Summary'],
    findingsDiff.removed.map(e => [e.key, e.value.type, e.value.severity, e.value.summary])
  ));
  sections.push(renderDeltaTable('Changed',
    ['ID', 'Field', 'Previous', 'Current'],
    findingsDiff.changed.flatMap(e => {
      const diffs = [];
      for (const field of Object.keys(e.new)) {
        if (JSON.stringify(e.old[field]) !== JSON.stringify(e.new[field])) {
          diffs.push([e.key, field, String(e.old[field] || ''), String(e.new[field] || '')]);
        }
      }
      return diffs;
    })
  ));

  // Matrix changes
  sections.push('## Matrix Changes\n');
  const matrixRows = [
    ...matrixDiff.added.map(e => [e.key, '(new)', JSON.stringify(e.value)]),
    ...matrixDiff.removed.map(e => [e.key, JSON.stringify(e.value), '(removed)']),
    ...matrixDiff.changed.map(e => [e.key, JSON.stringify(e.old), JSON.stringify(e.new)]),
  ];
  if (matrixRows.length === 0) {
    sections.push('No changes.\n');
  } else {
    sections.push(renderDeltaTable('', ['Pair', 'Previous', 'Current'], matrixRows));
  }

  // Dependency graph changes
  sections.push('## Dependency Graph Changes\n');
  const graphRows = [
    ...graphDiff.added.map(e => ['added', e.value['From'] || e.key.split('|')[0], e.value['To'] || e.key.split('|')[1], '', JSON.stringify(e.value)]),
    ...graphDiff.removed.map(e => ['removed', e.value['From'] || e.key.split('|')[0], e.value['To'] || e.key.split('|')[1], JSON.stringify(e.value), '']),
    ...graphDiff.changed.map(e => ['changed', e.old['From'] || e.key.split('|')[0], e.old['To'] || e.key.split('|')[1], JSON.stringify(e.old), JSON.stringify(e.new)]),
  ];
  if (graphRows.length === 0) {
    sections.push('No changes.\n');
  } else {
    sections.push(renderDeltaTable('', ['Change', 'From', 'To', 'Previous', 'Current'], graphRows));
  }

  const deltaContent = sections.join('\n');
  fs.writeFileSync(path.join(refDir, 'DELTA.md'), deltaContent, 'utf-8');

  output({
    delta: true,
    findings: { added: findingsDiff.added.length, resolved: findingsDiff.removed.length, changed: findingsDiff.changed.length },
    matrix: { changed: matrixDiff.added.length + matrixDiff.removed.length + matrixDiff.changed.length },
    graph: { changed: graphDiff.added.length + graphDiff.removed.length + graphDiff.changed.length },
  }, raw);
}

// ─── Changeset Constants ────────────────────────────────────────────────────

const CHANGESET_TYPES = ['ACCEPT', 'MODIFY', 'REJECT', 'RESEARCH_NEEDED', 'ASSUMPTION_OVERRIDE', 'USER_INITIATED'];
const TYPE_ORDER = Object.fromEntries(CHANGESET_TYPES.map((t, i) => [t, i]));

/**
 * Write CHANGESET.md from JSON input.
 */
function cmdChangesetWrite(cwd, args, raw) {
  const contentFileIdx = args.indexOf('--content-file');
  const isCheckpoint = args.includes('--checkpoint');

  const contentFile = contentFileIdx !== -1 ? args[contentFileIdx + 1] : null;
  guardPath(contentFile, '--content-file');

  const jsonContent = safeReadFile(path.resolve(cwd, contentFile));
  if (!jsonContent) error(`Cannot read content file: ${contentFile}`);

  const data = JSON.parse(jsonContent);
  if (!data.entries || !Array.isArray(data.entries)) error('Invalid JSON: entries array required');

  // Validate entries
  for (const entry of data.entries) {
    if (!entry.id || !entry.topic || !entry.type || !entry.capabilities || !entry.action || !entry.reasoning) {
      error(`Invalid entry ${entry.id || '?'}: missing required fields (id, topic, type, capabilities, action, reasoning)`);
    }
    if (!CHANGESET_TYPES.includes(entry.type)) {
      error(`Invalid entry ${entry.id}: unknown type '${entry.type}'. Expected: ${CHANGESET_TYPES.join(', ')}`);
    }
  }

  // Sort: by type order, then severity within type group
  const SEVERITY_ORDER = { critical: 0, high: 0, major: 1, medium: 1, minor: 2, low: 2, info: 3 };
  const sorted = [...data.entries].sort((a, b) => {
    const typeOrd = (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99);
    if (typeOrd !== 0) return typeOrd;
    return (SEVERITY_ORDER[(a.severity || '').toLowerCase()] ?? 99) - (SEVERITY_ORDER[(b.severity || '').toLowerCase()] ?? 99);
  });

  // Compute counts
  const counts = {};
  for (const t of CHANGESET_TYPES) counts[t.toLowerCase()] = 0;
  for (const e of sorted) counts[e.type.toLowerCase()]++;

  const today = new Date().toISOString().split('T')[0];
  const status = isCheckpoint ? 'partial' : 'complete';

  // Render frontmatter
  const lines = [];
  lines.push('---');
  lines.push(`date: ${today}`);
  lines.push(`status: ${status}`);
  lines.push(`source: ${data.source || '.planning/refinement/RECOMMENDATIONS.md'}`);
  lines.push(`total_items: ${sorted.length}`);
  lines.push('counts:');
  for (const t of CHANGESET_TYPES) {
    lines.push(`  ${t.toLowerCase()}: ${counts[t.toLowerCase()]}`);
  }
  lines.push('---');
  lines.push('');

  // Render body
  lines.push('# Refinement Change Set');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Type | Count |');
  lines.push('|------|-------|');
  for (const t of CHANGESET_TYPES) {
    lines.push(`| ${t} | ${counts[t.toLowerCase()]} |`);
  }
  lines.push('');
  lines.push('## Entries');
  lines.push('');

  for (const entry of sorted) {
    lines.push(`### ${entry.id}: ${entry.topic}`);
    lines.push(`- **Type:** ${entry.type}`);
    lines.push(`- **Source:** ${entry.source || entry.source_finding || 'user-initiated'}`);
    lines.push(`- **Capabilities:** ${Array.isArray(entry.capabilities) ? entry.capabilities.join(', ') : entry.capabilities}`);
    lines.push(`- **Action:** ${entry.action}`);
    lines.push(`- **Reasoning:** ${entry.reasoning}`);
    lines.push('');
  }

  const refDir = path.join(cwd, '.planning', 'refinement');
  fs.mkdirSync(refDir, { recursive: true });
  const destPath = path.join(refDir, 'CHANGESET.md');
  fs.writeFileSync(destPath, lines.join('\n'), 'utf-8');

  output({ written: true, path: '.planning/refinement/CHANGESET.md', status, total: sorted.length }, raw);
}

/**
 * Parse CHANGESET.md and return JSON for change-application consumption.
 */
function cmdChangesetParse(cwd, raw) {
  const changesetPath = path.join(cwd, '.planning', 'refinement', 'CHANGESET.md');
  const content = safeReadFile(changesetPath);
  if (!content) error('CHANGESET.md not found. Run refinement-qa first.');

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const meta = {};
  if (fmMatch) {
    const fm = fmMatch[1];
    const dateMatch = fm.match(/^date:\s*(.+)$/m);
    const statusMatch = fm.match(/^status:\s*(.+)$/m);
    const sourceMatch = fm.match(/^source:\s*(.+)$/m);
    const totalMatch = fm.match(/^total_items:\s*(\d+)$/m);

    if (dateMatch) meta.date = dateMatch[1].trim();
    if (statusMatch) meta.status = statusMatch[1].trim();
    if (sourceMatch) meta.source = sourceMatch[1].trim();
    if (totalMatch) meta.total = parseInt(totalMatch[1], 10);

    // Parse counts
    const countsSection = fm.match(/counts:\n((?:\s+\w+:\s*\d+\n?)+)/);
    if (countsSection) {
      meta.counts = {};
      const countLines = countsSection[1].trim().split('\n');
      for (const line of countLines) {
        const m = line.match(/^\s+(\w+):\s*(\d+)/);
        if (m) meta.counts[m[1]] = parseInt(m[2], 10);
      }
    }
  }

  // Refuse partial
  if (meta.status === 'partial') {
    error('CHANGESET.md is partial (incomplete Q&A session). Cannot parse for execution. Complete the Q&A session first.');
  }

  // Parse entries
  const entries = [];
  const entryBlocks = content.split(/^### CS-/m).slice(1);

  for (const block of entryBlocks) {
    const idMatch = block.match(/^(\d+):\s*(.+)/);
    if (!idMatch) continue;

    const id = `CS-${idMatch[1]}`;
    const topic = idMatch[2].trim();

    const typeMatch = block.match(/- \*\*Type:\*\*\s*(.+)/);
    const sourceMatch = block.match(/- \*\*Source:\*\*\s*(.+)/);
    const capsMatch = block.match(/- \*\*Capabilities:\*\*\s*(.+)/);
    const actionMatch = block.match(/- \*\*Action:\*\*\s*(.+)/);
    const reasonMatch = block.match(/- \*\*Reasoning:\*\*\s*(.+)/);

    entries.push({
      id,
      topic,
      type: typeMatch ? typeMatch[1].trim() : '',
      source: sourceMatch ? sourceMatch[1].trim() : '',
      capabilities: capsMatch ? capsMatch[1].trim().split(', ').map(s => s.trim()) : [],
      action: actionMatch ? actionMatch[1].trim() : '',
      reasoning: reasonMatch ? reasonMatch[1].trim() : '',
    });
  }

  output({ meta, entries }, raw);
}

module.exports = {
  cmdRefinementInit,
  cmdRefinementWrite,
  cmdRefinementReport,
  cmdRefinementDelta,
  cmdChangesetWrite,
  cmdChangesetParse,
  parseMarkdownTable,
  diffMaps,
  snapshotFindings,
  snapshotTable,
};
