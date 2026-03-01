/**
 * Template — Template selection and fill operations
 */

const fs = require('fs');
const path = require('path');
const { normalizePhaseName, findPhaseInternal, generateSlugInternal, output, error } = require('./core.cjs');
const { reconstructFrontmatter } = require('./frontmatter.cjs');

function cmdTemplateFill(cwd, templateType, options, raw) {
  if (!templateType) { error('template type required: summary, plan, or verification'); }
  if (!options.phase) { error('--phase required'); }

  const phaseInfo = findPhaseInternal(cwd, options.phase);
  if (!phaseInfo || !phaseInfo.found) { output({ error: 'Phase not found', phase: options.phase }, raw); return; }

  const padded = normalizePhaseName(options.phase);
  const today = new Date().toISOString().split('T')[0];
  const phaseName = options.name || phaseInfo.phase_name || 'Unnamed';
  const phaseSlug = phaseInfo.phase_slug || generateSlugInternal(phaseName);
  const phaseId = `${padded}-${phaseSlug}`;
  const planNum = (options.plan || '01').padStart(2, '0');
  const fields = options.fields || {};

  let frontmatter, body, fileName;

  switch (templateType) {
    case 'summary': {
      frontmatter = {
        phase: phaseId,
        plan: planNum,
        subsystem: '[primary category]',
        tags: [],
        provides: [],
        affects: [],
        'tech-stack': { added: [], patterns: [] },
        'key-files': { created: [], modified: [] },
        'key-decisions': [],
        'patterns-established': [],
        duration: '[X]min',
        completed: today,
        ...fields,
      };
      body = [
        `# Phase ${options.phase}: ${phaseName} Summary`,
        '',
        '**[Substantive one-liner describing outcome]**',
        '',
        '## Performance',
        '- **Duration:** [time]',
        '- **Tasks:** [count completed]',
        '- **Files modified:** [count]',
        '',
        '## Accomplishments',
        '- [Key outcome 1]',
        '- [Key outcome 2]',
        '',
        '## Task Commits',
        '1. **Task 1: [task name]** - `hash`',
        '',
        '## Files Created/Modified',
        '- `path/to/file.ts` - What it does',
        '',
        '## Decisions & Unplanned Changes',
        '[Key decisions or "None - followed plan as specified"]',
        '',
        '## Next Phase Readiness',
        '[What\'s ready for next phase]',
      ].join('\n');
      fileName = `${padded}-${planNum}-SUMMARY.md`;
      break;
    }
    case 'plan': {
      const planType = options.type || 'execute';
      const wave = parseInt(options.wave) || 1;
      frontmatter = {
        phase: phaseId,
        plan: planNum,
        type: planType,
        wave,
        depends_on: [],
        files_modified: [],
        autonomous: true,
        user_setup: [],
        must_haves: { truths: [], artifacts: [], key_links: [] },
        ...fields,
      };
      body = [
        `# Phase ${options.phase} Plan ${planNum}: [Title]`,
        '',
        '## Objective',
        '- **What:** [What this plan builds]',
        '- **Why:** [Why it matters for the phase goal]',
        '- **Output:** [Concrete deliverable]',
        '',
        '## Context',
        '@.planning/PROJECT.md',
        '@.planning/ROADMAP.md',
        '@.planning/STATE.md',
        '',
        '## Tasks',
        '',
        '<task type="code">',
        '  <name>[Task name]</name>',
        '  <files>[file paths]</files>',
        '  <action>[What to do]</action>',
        '  <verify>[How to verify]</verify>',
        '  <done>[Definition of done]</done>',
        '</task>',
        '',
        '## Verification',
        '[How to verify this plan achieved its objective]',
        '',
        '## Success Criteria',
        '- [ ] [Criterion 1]',
        '- [ ] [Criterion 2]',
      ].join('\n');
      fileName = `${padded}-${planNum}-PLAN.md`;
      break;
    }
    case 'verification': {
      frontmatter = {
        phase: phaseId,
        verified: new Date().toISOString(),
        status: 'pending',
        score: '0/0 must-haves verified',
        ...fields,
      };
      body = [
        `# Phase ${options.phase}: ${phaseName} — Verification`,
        '',
        '## Observable Truths',
        '| # | Truth | Status | Evidence |',
        '|---|-------|--------|----------|',
        '| 1 | [Truth] | pending | |',
        '',
        '## Required Artifacts',
        '| Artifact | Expected | Status | Details |',
        '|----------|----------|--------|---------|',
        '| [path] | [what] | pending | |',
        '',
        '## Key Link Verification',
        '| From | To | Via | Status | Details |',
        '|------|----|----|--------|---------|',
        '| [source] | [target] | [connection] | pending | |',
        '',
        '## Requirements Coverage',
        '| Requirement | Status | Blocking Issue |',
        '|-------------|--------|----------------|',
        '| [req] | pending | |',
        '',
        '## Result',
        '[Pending verification]',
      ].join('\n');
      fileName = `${padded}-VERIFICATION.md`;
      break;
    }
    case 'capability': {
      const capSlug = options.slug || generateSlugInternal(options.name || '');
      if (!capSlug) { error('--name or --slug required for capability template'); return; }
      const capDir = path.join(cwd, '.planning', 'capabilities', capSlug);
      fs.mkdirSync(path.join(capDir, 'features'), { recursive: true });
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
      const featCapSlug = options.capability;
      if (!featCapSlug) { error('--capability required for feature template'); return; }
      const featSlug = options.slug || generateSlugInternal(options.name || '');
      if (!featSlug) { error('--name or --slug required for feature template'); return; }
      const featDir = path.join(cwd, '.planning', 'capabilities', featCapSlug, 'features', featSlug);
      fs.mkdirSync(featDir, { recursive: true });
      const featContent = fillTemplate('feature', {
        name: options.name || featSlug,
        slug: featSlug,
        capability: featCapSlug,
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
      error(`Unknown template type: ${templateType}. Available: summary, plan, verification, capability, feature, discovery-brief`);
      return;
  }

  const fullContent = `---\n${reconstructFrontmatter(frontmatter)}\n---\n\n${body}\n`;
  const outPath = path.join(cwd, phaseInfo.directory, fileName);

  if (fs.existsSync(outPath)) {
    output({ error: 'File already exists', path: path.relative(cwd, outPath) }, raw);
    return;
  }

  fs.writeFileSync(outPath, fullContent, 'utf-8');
  const relPath = path.relative(cwd, outPath);
  output({ created: true, path: relPath, template: templateType }, raw, relPath);
}

// ─── fillTemplate — Single source of truth for capability/feature content ────

/**
 * Generate filled template content (frontmatter + body) for a given type.
 * Returns the content string. Does NOT write to disk or call output().
 *
 * @param {string} type - 'capability' or 'feature'
 * @param {object} options - { name, slug, date, capability (for features) }
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
      content = content.replace(/\{slug\}/g, options.capability || slug);
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
