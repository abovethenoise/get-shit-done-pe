/**
 * Scan — Landscape scan CLI commands for cross-capability coherence analysis
 */

const fs = require('fs');
const path = require('path');
const { output, error, safeReadFile } = require('./core.cjs');
// ─── Helpers ────────────────────────────────────────────────────────────────

/** List sorted subdirectory names. Sorting ensures deterministic pair enumeration order for checkpoint resumability. */
function listDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
}

// ─── Commands ───────────────────────────────────────────────────────────────

/** Scan .planning/capabilities/ to build full capability inventory with artifacts and completeness classification. */
function cmdScanDiscover(cwd, raw) {
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
  const documentationDir = path.join(cwd, '.documentation', 'capabilities');

  if (!fs.existsSync(capabilitiesDir)) {
    output({ capabilities: [], gap_findings: [] }, raw);
    return;
  }

  const entries = listDirs(capabilitiesDir);

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
      const featEntries = listDirs(featuresDir);

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

    // Compute completeness: CAPABILITY.md is the anchor — directories without it are orphaned (completeness 'none'), not 'partial'.
    let completeness;
    if (capContent && features.length > 0 && docContent) {
      completeness = 'full';
    } else if (capContent || features.length > 0 || docContent) {
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

/** Generate all unique capability pairs for pairwise analysis. Classifies project tier by capability count. */
function cmdScanPairs(cwd, raw) {
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');

  if (!fs.existsSync(capabilitiesDir)) {
    output({ tier: 'small', capability_count: 0, pairs: [], total_pairs: 0 }, raw);
    return;
  }

  const slugs = listDirs(capabilitiesDir);

  const count = slugs.length;
  let tier = 'small';
  if (count > 50) tier = 'large';
  else if (count > 20) tier = 'medium';

  const pairs = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push({ a: slugs[i], b: slugs[j] });
    }
  }

  output({ tier, capability_count: count, pairs, total_pairs: pairs.length }, raw);
}

/**
 * Manage checkpoint state for resumable scanning.
 * @param {string[]} args - CLI args: --action {read|write|list} [--pair A__B] [--output-dir path]
 *   --action: read (check if pair complete), write (mark pair complete), list (all completed pairs)
 *   --pair: capability pair key using double-underscore separator (e.g., "auth__payments")
 *   --output-dir: base directory for checkpoint files (default: .planning/refinement)
 */
function cmdScanCheckpoint(cwd, args, raw) {
  // Parse args
  const pairIdx = args.indexOf('--pair');
  const actionIdx = args.indexOf('--action');
  const outputDirIdx = args.indexOf('--output-dir');

  const pair = pairIdx !== -1 ? args[pairIdx + 1] : null;
  const action = actionIdx !== -1 ? args[actionIdx + 1] : null;
  const outputDir = outputDirIdx !== -1 ? args[outputDirIdx + 1] : '.planning/refinement';

  if (pair && pair.includes('..')) error('Invalid --pair: contains ".." segment');
  if (outputDir && outputDir.includes('..')) error('Invalid --output-dir: contains ".." segment');

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
};
