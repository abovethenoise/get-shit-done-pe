/**
 * Template — Template selection and fill operations
 */

const fs = require('fs');
const path = require('path');
const { generateSlugInternal, output, error } = require('./core.cjs');

function cmdTemplateFill(cwd, templateType, options, raw) {
  if (!templateType) { error('template type required: capability, feature, or discovery-brief'); }

  const today = new Date().toISOString().split('T')[0];

  switch (templateType) {
    case 'capability': {
      const capSlug = options.slug || generateSlugInternal(options.name || '');
      if (!capSlug) { error('--name or --slug required for capability template'); return; }
      const capDir = path.join(cwd, '.planning', 'capabilities', capSlug);
      fs.mkdirSync(capDir, { recursive: true });
      const capContent = fillTemplate('capability', {
        name: options.name || capSlug,
        slug: capSlug,
        date: today,
      });
      const capPath = path.join(capDir, 'CAPABILITY.md');
      if (fs.existsSync(capPath)) {
        output({ error: 'File already exists', path: path.relative(cwd, capPath) }, raw);
        return;
      }
      fs.writeFileSync(capPath, capContent, 'utf-8');
      output({ created: true, path: path.relative(cwd, capPath), template: 'capability' }, raw, path.relative(cwd, capPath));
      return;
    }
    case 'feature': {
      const featSlug = options.slug || generateSlugInternal(options.name || '');
      if (!featSlug) { error('--name or --slug required for feature template'); return; }
      const featDir = path.join(cwd, '.planning', 'features', featSlug);
      fs.mkdirSync(featDir, { recursive: true });
      const featContent = fillTemplate('feature', {
        name: options.name || featSlug,
        slug: featSlug,
        date: today,
      });
      const featPath = path.join(featDir, 'FEATURE.md');
      if (fs.existsSync(featPath)) {
        output({ error: 'File already exists', path: path.relative(cwd, featPath) }, raw);
        return;
      }
      fs.writeFileSync(featPath, featContent, 'utf-8');
      output({ created: true, path: path.relative(cwd, featPath), template: 'feature' }, raw, path.relative(cwd, featPath));
      return;
    }
    case 'discovery-brief': {
      const briefCapSlug = options.slug || generateSlugInternal(options.name || '');
      if (!briefCapSlug) { error('--name or --slug required for discovery-brief template'); return; }
      const briefLens = options.lens || '';
      const briefDir = path.join(cwd, '.planning', 'capabilities', briefCapSlug);
      fs.mkdirSync(briefDir, { recursive: true });
      const briefContent = fillTemplate('discovery-brief', {
        name: options.name || briefCapSlug,
        slug: briefCapSlug,
        date: today,
        lens: briefLens,
      });
      const briefPath = path.join(briefDir, 'BRIEF.md');
      if (fs.existsSync(briefPath)) {
        output({ error: 'File already exists', path: path.relative(cwd, briefPath) }, raw);
        return;
      }
      fs.writeFileSync(briefPath, briefContent, 'utf-8');
      output({ created: true, path: path.relative(cwd, briefPath), template: 'discovery-brief' }, raw, path.relative(cwd, briefPath));
      return;
    }
    default:
      error(`Unknown template type: ${templateType}. Available: capability, feature, discovery-brief`);
      return;
  }
}

// ─── fillTemplate — Single source of truth for capability/feature content ────

/**
 * Generate filled template content (frontmatter + body) for a given type.
 * Returns the content string. Does NOT write to disk or call output().
 *
 * @param {string} type - 'capability', 'feature', or 'discovery-brief'
 * @param {object} options - { name, slug, date, lens (for discovery-brief) }
 * @returns {string} Full markdown content with frontmatter
 */
function fillTemplate(type, options) {
  const { name, slug, date } = options;

  switch (type) {
    case 'capability': {
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'capability.md');
      let content = fs.readFileSync(templatePath, 'utf-8');
      content = content.replace(/\{date\}/g, date);
      content = content.replace(/\{capability\}/g, name);
      content = content.replace(/\{slug\}/g, slug);
      return content;
    }
    case 'feature': {
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'feature.md');
      let content = fs.readFileSync(templatePath, 'utf-8');
      content = content.replace(/\{date\}/g, date);
      content = content.replace(/\{feature\}/g, name);
      content = content.replace(/\{slug\}/g, slug);
      return content;
    }
    case 'discovery-brief': {
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'discovery-brief.md');
      let content = fs.readFileSync(templatePath, 'utf-8');
      content = content.replace(/\{date\}/g, date);
      content = content.replace(/\{capability\}/g, name);
      content = content.replace(/\{lens\}/g, options.lens || '');
      return content;
    }
    default:
      throw new Error(`fillTemplate: unknown type '${type}'. Available: capability, feature, discovery-brief`);
  }
}

module.exports = { cmdTemplateFill, fillTemplate };
