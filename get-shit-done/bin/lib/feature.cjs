/**
 * Feature — Feature lifecycle commands (create, list, status)
 */

const fs = require('fs');
const path = require('path');
const { generateSlugInternal, findFeatureInternal, findCapabilityInternal, safeReadFile, output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const { fillTemplate } = require('./template.cjs');

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdFeatureCreate(cwd, name, raw) {
  if (!name) { error('feature name required'); }

  const slug = generateSlugInternal(name);
  if (!slug) { error('name produces empty slug after sanitization'); }

  const featResult = findFeatureInternal(cwd, slug);
  if (featResult.found) {
    error("Feature '" + slug + "' already exists");
  }

  const featDir = path.join(cwd, '.planning', 'features', slug);
  const featPath = path.join(featDir, 'FEATURE.md');

  if (featResult.reason === 'no_feature_file') {
    // Dir exists, just write the file
  } else {
    fs.mkdirSync(featDir, { recursive: true });
  }

  const today = new Date().toISOString().split('T')[0];
  const content = fillTemplate('feature', { name, slug, date: today });
  fs.writeFileSync(featPath, content, 'utf-8');

  output({
    created: true,
    slug,
    path: path.relative(cwd, featDir),
    feature_path: path.relative(cwd, featPath),
  }, raw);
}

function cmdFeatureList(cwd, raw) {
  const featuresDir = path.join(cwd, '.planning', 'features');
  const features = [];

  try {
    const entries = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    for (const slug of entries) {
      const featPath = path.join(featuresDir, slug, 'FEATURE.md');
      const content = safeReadFile(featPath);
      if (!content) continue;
      const fm = extractFrontmatter(content);
      features.push({
        slug,
        status: fm.status || 'unknown',
        composes: fm.composes || [],
      });
    }
  } catch { /* no features dir */ }

  output({ features }, raw);
}

function cmdFeatureStatus(cwd, featureSlug, raw) {
  if (!featureSlug) { error('feature slug required'); }

  const featResult = findFeatureInternal(cwd, featureSlug);
  if (!featResult.found) {
    error("Feature '" + featureSlug + "' not found");
  }

  const content = safeReadFile(featResult.feature_path) || '';
  const fm = extractFrontmatter(content);
  const composes = fm.composes || [];

  // Validate composed capabilities exist and check their status
  const composedStatus = [];
  for (const capSlug of composes) {
    const capResult = findCapabilityInternal(cwd, capSlug);
    if (!capResult.found) {
      composedStatus.push({ slug: capSlug, exists: false, status: null });
    } else {
      const capContent = safeReadFile(capResult.capability_path) || '';
      const capFm = extractFrontmatter(capContent);
      composedStatus.push({ slug: capSlug, exists: true, status: capFm.status || 'unknown' });
    }
  }

  output({
    slug: featResult.slug,
    status: fm.status || 'unknown',
    composes,
    composed_capabilities: composedStatus,
  }, raw);
}

/** Validate feature: all composed capabilities exist and are contracted+verified */
function cmdFeatureValidate(cwd, featureSlug, raw) {
  if (!featureSlug) { error('feature slug required'); }

  const featResult = findFeatureInternal(cwd, featureSlug);
  if (!featResult.found) {
    error("Feature '" + featureSlug + "' not found");
  }

  const content = safeReadFile(featResult.feature_path) || '';
  const fm = extractFrontmatter(content);
  const composes = fm.composes || [];

  const errors = [];
  const warnings = [];

  for (const capSlug of composes) {
    const capResult = findCapabilityInternal(cwd, capSlug);
    if (!capResult.found) {
      errors.push({ type: 'missing_capability', slug: capSlug, message: `Capability '${capSlug}' does not exist` });
      continue;
    }
    const capContent = safeReadFile(capResult.capability_path) || '';
    const capFm = extractFrontmatter(capContent);
    const status = capFm.status || 'planning';

    if (status === 'planning' || status === 'exploring') {
      errors.push({ type: 'capability_not_contracted', slug: capSlug, status, message: `Capability '${capSlug}' has status '${status}' — must be contracted or verified` });
    }

    // Check contract completeness
    if (capContent) {
      if (!capContent.includes('## Contract')) {
        errors.push({ type: 'missing_contract', slug: capSlug, message: `Capability '${capSlug}' has no Contract section` });
      } else {
        if (!capContent.includes('### Receives')) warnings.push({ type: 'incomplete_contract', slug: capSlug, message: `Capability '${capSlug}' missing Receives section` });
        if (!capContent.includes('### Returns')) warnings.push({ type: 'incomplete_contract', slug: capSlug, message: `Capability '${capSlug}' missing Returns section` });
        if (!capContent.includes('### Rules')) warnings.push({ type: 'incomplete_contract', slug: capSlug, message: `Capability '${capSlug}' missing Rules section` });
      }
    }
  }

  output({
    passed: errors.length === 0,
    slug: featureSlug,
    composes,
    errors,
    warnings,
  }, raw);
}

/** Gate check: are all composed capabilities ready for feature planning? */
function cmdGateCheck(cwd, featureSlug, raw) {
  if (!featureSlug) { error('feature slug required'); }

  const featResult = findFeatureInternal(cwd, featureSlug);
  if (!featResult.found) {
    error("Feature '" + featureSlug + "' not found");
  }

  const content = safeReadFile(featResult.feature_path) || '';
  const fm = extractFrontmatter(content);
  const composes = fm.composes || [];

  const blockers = [];
  const ready = [];

  if (composes.length === 0) {
    blockers.push({ slug: '_self', reason: 'composes[] is empty — assign capabilities before planning' });
  }

  for (const capSlug of composes) {
    const capResult = findCapabilityInternal(cwd, capSlug);
    if (!capResult.found) {
      blockers.push({ slug: capSlug, reason: 'does_not_exist' });
      continue;
    }
    const capContent = safeReadFile(capResult.capability_path) || '';
    const capFm = extractFrontmatter(capContent);
    const status = capFm.status || 'planning';

    if (status === 'verified' || status === 'complete') {
      ready.push({ slug: capSlug, status });
    } else {
      blockers.push({ slug: capSlug, reason: `status is '${status}', needs 'verified' or 'complete'` });
    }
  }

  output({
    gate_passed: blockers.length === 0,
    slug: featureSlug,
    composes,
    ready,
    blockers,
  }, raw);
}

module.exports = {
  cmdFeatureCreate,
  cmdFeatureList,
  cmdFeatureStatus,
  cmdFeatureValidate,
  cmdGateCheck,
};
