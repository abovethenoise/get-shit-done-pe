/**
 * Feature — Feature lifecycle commands (create, list, status)
 */

const fs = require('fs');
const path = require('path');
const { generateSlugInternal, findCapabilityInternal, findFeatureInternal, safeReadFile, output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const { fillTemplate } = require('./template.cjs');

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdFeatureCreate(cwd, capSlug, name, raw) {
  if (!capSlug) { error('capability slug required'); }
  if (!name) { error('feature name required'); }

  // Validate parent capability exists
  const capResult = findCapabilityInternal(cwd, capSlug);
  if (!capResult.found) {
    error("Capability '" + capSlug + "' does not exist");
  }

  const slug = generateSlugInternal(name);
  if (!slug) { error('name produces empty slug after sanitization'); }

  // Check if feature already exists
  const featResult = findFeatureInternal(cwd, capSlug, slug);
  if (featResult.found) {
    error("Feature '" + slug + "' already exists under capability '" + capSlug + "'");
  }

  const featDir = path.join(capResult.directory, 'features', slug);
  const featPath = path.join(featDir, 'FEATURE.md');

  // Handle partial creation: dir exists but no FEATURE.md
  if (featResult.reason === 'no_feature_file') {
    // Dir exists, just write the file
  } else {
    fs.mkdirSync(featDir, { recursive: true });
  }

  const today = new Date().toISOString().split('T')[0];
  const content = fillTemplate('feature', { name, slug, capability: capSlug, date: today });
  fs.writeFileSync(featPath, content, 'utf-8');

  output({
    created: true,
    slug,
    capability_slug: capSlug,
    path: path.relative(cwd, featDir),
    feature_path: path.relative(cwd, featPath),
  }, raw);
}

function cmdFeatureList(cwd, capSlug, raw) {
  if (!capSlug) { error('capability slug required'); }

  const capResult = findCapabilityInternal(cwd, capSlug);
  if (!capResult.found) {
    error("Capability '" + capSlug + "' not found");
  }

  const featuresDir = path.join(capResult.directory, 'features');
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
        capability: capSlug,
      });
    }
  } catch { /* no features dir */ }

  output({ features }, raw);
}

function cmdFeatureStatus(cwd, capSlug, featureSlug, raw) {
  if (!capSlug) { error('capability slug required'); }
  if (!featureSlug) { error('feature slug required'); }

  const featResult = findFeatureInternal(cwd, capSlug, featureSlug);
  if (!featResult.found) {
    if (featResult.reason === 'capability_not_found') {
      error("Capability '" + capSlug + "' not found");
    }
    error("Feature '" + featureSlug + "' not found under capability '" + capSlug + "'");
  }

  const content = safeReadFile(featResult.feature_path) || '';
  const fm = extractFrontmatter(content);

  // Count requirements per layer by grep patterns
  const euCount = (content.match(/### EU-\d+/g) || []).length;
  const fnCount = (content.match(/### FN-\d+/g) || []).length;
  const tcCount = (content.match(/### TC-\d+/g) || []).length;

  output({
    slug: featResult.slug,
    status: fm.status || 'unknown',
    capability: capSlug,
    req_counts: { eu: euCount, fn: fnCount, tc: tcCount },
  }, raw);
}

module.exports = {
  cmdFeatureCreate,
  cmdFeatureList,
  cmdFeatureStatus,
};
