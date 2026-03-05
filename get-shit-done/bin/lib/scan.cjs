/**
 * Scan — Landscape scan CLI commands for cross-capability coherence analysis
 */

const fs = require('fs');
const path = require('path');
const { output, error, safeReadFile } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');

// ─── Finding Card Schema Constants ──────────────────────────────────────────

const FINDING_TYPES = ['CONFLICT', 'GAP', 'OVERLAP', 'DEPENDS_ON', 'ASSUMPTION_MISMATCH', 'ALIGNMENT'];
const SEVERITY_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const FINDING_FIELDS = ['id', 'type', 'severity', 'confidence', 'affected_capabilities', 'doc_sources', 'summary', 'recommendation', 'root_cause'];

// ─── Commands ───────────────────────────────────────────────────────────────

function cmdScanDiscover(cwd, raw) {
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
  const documentationDir = path.join(cwd, '.documentation', 'capabilities');

  if (!fs.existsSync(capabilitiesDir)) {
    output({ capabilities: [], gap_findings: [] }, raw);
    return;
  }

  const entries = fs.readdirSync(capabilitiesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  const capabilities = [];
  const gapFindings = [];

  for (const slug of entries) {
    const capPath = path.join(capabilitiesDir, slug, 'CAPABILITY.md');
    const featuresDir = path.join(capabilitiesDir, slug, 'features');
    const docPath = path.join(documentationDir, `${slug}.md`);

    const capContent = safeReadFile(capPath);
    const docContent = safeReadFile(docPath);

    // Load features
    const features = [];
    if (fs.existsSync(featuresDir)) {
      const featEntries = fs.readdirSync(featuresDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .sort();

      for (const featSlug of featEntries) {
        const featPath = path.join(featuresDir, featSlug, 'FEATURE.md');
        const featContent = safeReadFile(featPath);
        features.push({
          slug: featSlug,
          path: path.relative(cwd, featPath),
          content: featContent,
        });
      }
    }

    // Compute completeness
    let completeness;
    if (capContent && features.length > 0) {
      completeness = 'full';
    } else if (capContent) {
      completeness = 'partial';
    } else {
      completeness = 'none';
    }

    capabilities.push({
      slug,
      artifacts: {
        capability: capContent ? { path: path.relative(cwd, capPath), content: capContent } : null,
        features,
        documentation: docContent ? { path: path.relative(cwd, docPath), content: docContent } : null,
      },
      completeness,
    });

    // GAP finding for directories without CAPABILITY.md
    if (completeness === 'none') {
      gapFindings.push({
        id: 'FINDING-XXX',
        type: 'GAP',
        severity: 'HIGH',
        confidence: 'HIGH',
        affected_capabilities: [slug],
        doc_sources: [],
        summary: `Capability directory '${slug}' exists with no specification (no CAPABILITY.md)`,
        recommendation: `Create CAPABILITY.md for '${slug}' or remove the directory if it was created in error`,
        root_cause: null,
      });
    }
  }

  output({ capabilities, gap_findings: gapFindings }, raw);
}

function cmdScanPairs(cwd, raw) {
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');

  if (!fs.existsSync(capabilitiesDir)) {
    output({ tier: 'small', capability_count: 0, pairs: [], total_pairs: 0 }, raw);
    return;
  }

  const slugs = fs.readdirSync(capabilitiesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  const count = slugs.length;
  let tier = 'small';
  if (count > 20) {
    tier = 'medium';
    process.stderr.write('Warning: Medium/large tier pair filtering not yet implemented. Falling back to full pairwise.\n');
  }

  const pairs = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push({ a: slugs[i], b: slugs[j] });
    }
  }

  output({ tier, capability_count: count, pairs, total_pairs: pairs.length }, raw);
}

function cmdScanCheckpoint(cwd, args, raw) {
  // Parse args
  const pairIdx = args.indexOf('--pair');
  const actionIdx = args.indexOf('--action');
  const outputDirIdx = args.indexOf('--output-dir');

  const pair = pairIdx !== -1 ? args[pairIdx + 1] : null;
  const action = actionIdx !== -1 ? args[actionIdx + 1] : null;
  const outputDir = outputDirIdx !== -1 ? args[outputDirIdx + 1] : '.planning/refinement';

  if (!action) {
    error('--action required (read|write|list)');
  }

  const pairsDir = path.join(cwd, outputDir, 'pairs');

  switch (action) {
    case 'write': {
      if (!pair) error('--pair required for write action');
      fs.mkdirSync(pairsDir, { recursive: true });
      const filePath = path.join(pairsDir, `${pair}.complete`);
      fs.writeFileSync(filePath, '', 'utf-8');
      output({ written: true, pair, path: path.relative(cwd, filePath) }, raw);
      break;
    }
    case 'read': {
      if (!pair) error('--pair required for read action');
      const filePath = path.join(pairsDir, `${pair}.complete`);
      output({ completed: fs.existsSync(filePath) }, raw);
      break;
    }
    case 'list': {
      if (!fs.existsSync(pairsDir)) {
        output({ completed_pairs: [] }, raw);
        return;
      }
      const completedPairs = fs.readdirSync(pairsDir)
        .filter(f => f.endsWith('.complete'))
        .map(f => f.replace('.complete', ''))
        .sort();
      output({ completed_pairs: completedPairs }, raw);
      break;
    }
    default:
      error(`Unknown action: ${action}. Expected read|write|list`);
  }
}

module.exports = {
  cmdScanDiscover,
  cmdScanPairs,
  cmdScanCheckpoint,
  FINDING_TYPES,
  SEVERITY_LEVELS,
  CONFIDENCE_LEVELS,
  FINDING_FIELDS,
};
