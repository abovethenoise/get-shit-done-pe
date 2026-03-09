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
  const capPath = path.join(capDir, 'CAPABILITY.md');

  fs.mkdirSync(capDir, { recursive: true });

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
    if (!content) continue;

    const fm = extractFrontmatter(content);
    capabilities.push({
      slug,
      status: fm.status || 'unknown',
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

  output({
    slug: capResult.slug,
    status: fm.status || 'unknown',
  }, raw);
}

/** Validate capability contract completeness */
function cmdCapabilityValidate(cwd, slug, raw) {
  const capResult = findCapabilityInternal(cwd, slug);
  if (!capResult.found) {
    error("Capability '" + slug + "' not found");
  }

  const content = safeReadFile(capResult.capability_path) || '';
  const errors = [];
  const warnings = [];

  const requiredSections = ['## Contract', '### Receives', '### Returns', '### Rules'];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push({ type: 'missing_section', section, message: `Contract section '${section}' not found` });
    }
  }

  // Check for placeholder content in required sections
  if (content.includes('{typed inputs}') || content.includes('{typed outputs}')) {
    warnings.push({ type: 'placeholder_content', message: 'Contract still contains placeholder text' });
  }

  const optionalSections = ['## Failure Behavior', '## Constraints', '## Context'];
  for (const section of optionalSections) {
    if (!content.includes(section)) {
      warnings.push({ type: 'missing_optional', section, message: `Optional section '${section}' not found` });
    }
  }

  output({
    passed: errors.length === 0,
    slug,
    errors,
    warnings,
  }, raw);
}

module.exports = {
  cmdCapabilityCreate,
  cmdCapabilityList,
  cmdCapabilityStatus,
  cmdCapabilityValidate,
};
