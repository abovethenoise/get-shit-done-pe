/**
 * Capability — Capability lifecycle commands (create, list, status)
 */

const fs = require('fs');
const path = require('path');
const { generateSlugInternal, findCapabilityInternal, safeReadFile, output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const { fillTemplate } = require('./template.cjs');

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdCapabilityCreate(cwd, name, raw) {
  if (!name) { error('capability name required'); }

  const slug = generateSlugInternal(name);
  if (!slug) { error('name produces empty slug after sanitization'); }

  const capResult = findCapabilityInternal(cwd, slug);
  if (capResult.found) {
    error("Capability '" + slug + "' already exists");
  }

  const capDir = path.join(cwd, '.planning', 'capabilities', slug);
  const featuresDir = path.join(capDir, 'features');
  const capPath = path.join(capDir, 'CAPABILITY.md');

  // Handle partial creation: dir exists but no CAPABILITY.md
  if (capResult.reason === 'no_capability_file') {
    // Dir exists, just needs the file. Ensure features dir exists too.
    fs.mkdirSync(featuresDir, { recursive: true });
  } else {
    // Create fresh
    fs.mkdirSync(featuresDir, { recursive: true });
  }

  const today = new Date().toISOString().split('T')[0];
  const content = fillTemplate('capability', { name, slug, date: today });
  fs.writeFileSync(capPath, content, 'utf-8');

  output({
    created: true,
    slug,
    path: path.relative(cwd, capDir),
    capability_path: path.relative(cwd, capPath),
  }, raw);
}

function cmdCapabilityList(cwd, raw) {
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');

  if (!fs.existsSync(capabilitiesDir)) {
    output({ capabilities: [] }, raw);
    return;
  }

  const entries = fs.readdirSync(capabilitiesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  const capabilities = [];
  for (const slug of entries) {
    const capPath = path.join(capabilitiesDir, slug, 'CAPABILITY.md');
    const content = safeReadFile(capPath);
    if (!content) continue; // Skip dirs without CAPABILITY.md

    const fm = extractFrontmatter(content);
    const featuresDir = path.join(capabilitiesDir, slug, 'features');
    let featureCount = 0;
    try {
      const featEntries = fs.readdirSync(featuresDir, { withFileTypes: true });
      featureCount = featEntries.filter(e => e.isDirectory() && fs.existsSync(path.join(featuresDir, e.name, 'FEATURE.md'))).length;
    } catch { /* no features dir */ }

    capabilities.push({
      slug,
      status: fm.status || 'unknown',
      feature_count: featureCount,
    });
  }

  output({ capabilities }, raw);
}

function cmdCapabilityStatus(cwd, slug, raw) {
  const capResult = findCapabilityInternal(cwd, slug);
  if (!capResult.found) {
    error("Capability '" + slug + "' not found");
  }

  const content = safeReadFile(capResult.capability_path);
  const fm = extractFrontmatter(content || '');

  const featuresDir = path.join(capResult.directory, 'features');
  const features = [];
  try {
    const featEntries = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    for (const featSlug of featEntries) {
      const featPath = path.join(featuresDir, featSlug, 'FEATURE.md');
      const featContent = safeReadFile(featPath);
      if (!featContent) continue;
      const featFm = extractFrontmatter(featContent);
      features.push({
        slug: featSlug,
        status: featFm.status || 'unknown',
      });
    }
  } catch { /* no features dir */ }

  output({
    slug: capResult.slug,
    status: fm.status || 'unknown',
    features,
    feature_count: features.length,
  }, raw);
}

module.exports = {
  cmdCapabilityCreate,
  cmdCapabilityList,
  cmdCapabilityStatus,
};
