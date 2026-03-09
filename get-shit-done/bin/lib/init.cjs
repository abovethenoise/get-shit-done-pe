/**
 * Init — Compound init commands for workflow bootstrapping
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig, pathExistsInternal, generateSlugInternal, toPosixPath, findCapabilityInternal, findFeatureInternal, output, error } = require('./core.cjs');

function cmdInitResume(cwd, raw) {
  const config = loadConfig(cwd);

  let interruptedAgentId = null;
  try {
    interruptedAgentId = fs.readFileSync(path.join(cwd, '.planning', 'current-agent-id.txt'), 'utf-8').trim();
  } catch {}

  output({
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    project_path: '.planning/PROJECT.md',
    has_interrupted_agent: !!interruptedAgentId,
    interrupted_agent_id: interruptedAgentId,
    commit_docs: config.commit_docs,
  }, raw);
}

function cmdInitProject(cwd, raw) {
  const config = loadConfig(cwd);

  let codeExists = false;
  try {
    const files = execSync('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.c" -o -name "*.cpp" -o -name "*.cs" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    codeExists = files.trim().length > 0;
  } catch {}

  const hasPackageFile = pathExistsInternal(cwd, 'package.json') ||
                         pathExistsInternal(cwd, 'requirements.txt') ||
                         pathExistsInternal(cwd, 'Cargo.toml') ||
                         pathExistsInternal(cwd, 'go.mod') ||
                         pathExistsInternal(cwd, 'Package.swift') ||
                         pathExistsInternal(cwd, 'pyproject.toml') ||
                         pathExistsInternal(cwd, 'Gemfile');

  codeExists = codeExists || hasPackageFile;

  const planningExists = pathExistsInternal(cwd, '.planning');
  const projectExists = pathExistsInternal(cwd, '.planning/PROJECT.md');

  let partialRun = { has_partial: false, completed_sections: [], next_section: null };
  const initStatePath = path.join(cwd, '.planning', 'init-state.json');
  try {
    const stateContent = fs.readFileSync(initStatePath, 'utf-8');
    const stateData = JSON.parse(stateContent);
    if (stateData.completed_sections && stateData.completed_sections.length > 0) {
      partialRun.has_partial = true;
      partialRun.completed_sections = stateData.completed_sections;
      partialRun.mode = stateData.mode || null;

      const allSections = stateData.mode === 'existing'
        ? ['scan', 'validation', 'gap_fill', 'design_style', 'project_md', 'capability_map', 'doc_tiers', 'roadmap_md', 'state_md']
        : ['goals', 'tech_stack', 'architecture', 'design_style', 'project_md', 'capability_map', 'doc_tiers', 'roadmap_md', 'state_md'];

      const completed = new Set(stateData.completed_sections);
      partialRun.next_section = allSections.find(s => !completed.has(s)) || null;
    }
  } catch {}

  let detectedMode;
  if (!codeExists && !planningExists) {
    detectedMode = 'new';
  } else if (codeExists && !projectExists) {
    detectedMode = 'existing';
  } else if (projectExists) {
    detectedMode = partialRun.has_partial ? (partialRun.mode || 'ambiguous') : 'ambiguous';
  } else {
    detectedMode = 'ambiguous';
  }

  let projectContext = null;
  if (projectExists) {
    try {
      projectContext = fs.readFileSync(path.join(cwd, '.planning', 'PROJECT.md'), 'utf-8').substring(0, 2000);
    } catch {}
  }

  output({
    detected_mode: detectedMode,
    planning_exists: planningExists,
    code_exists: codeExists,
    project_exists: projectExists,
    partial_run: partialRun,
    project_context: projectContext,
    commit_docs: config.commit_docs,
    has_git: pathExistsInternal(cwd, '.git'),
  }, raw);
}

function cmdInitFramingDiscovery(cwd, lens, capability, feature, raw) {
  if (!lens) {
    error('lens required for init framing-discovery (debug|new|enhance|refactor)');
  }

  const validLenses = ['debug', 'new', 'enhance', 'refactor'];
  if (!validLenses.includes(lens)) {
    error(`Invalid lens: ${lens}. Must be one of: ${validLenses.join(', ')}`);
  }

  const config = loadConfig(cwd);

  const gsdRoot = path.join(__dirname, '..', '..');
  const anchorQuestionsPath = toPosixPath(path.join('get-shit-done', 'framings', lens, 'anchor-questions.md'));
  const anchorQuestionsExists = fs.existsSync(path.join(gsdRoot, 'framings', lens, 'anchor-questions.md'));
  const framingLensesPath = toPosixPath(path.join('get-shit-done', 'references', 'framing-lenses.md'));
  const framingLensesExists = fs.existsSync(path.join(gsdRoot, 'references', 'framing-lenses.md'));
  const briefTemplatePath = toPosixPath(path.join('get-shit-done', 'templates', 'discovery-brief.md'));

  let capabilityInfo = null;
  let capabilityStatus = null;
  let briefPath = null;
  if (capability) {
    const capResult = findCapabilityInternal(cwd, capability);
    if (capResult.found) {
      capabilityInfo = {
        slug: capability,
        path: toPosixPath(path.join('.planning', 'capabilities', capability, 'CAPABILITY.md')),
        directory: toPosixPath(path.join('.planning', 'capabilities', capability)),
      };
      briefPath = toPosixPath(path.join('.planning', 'capabilities', capability, 'BRIEF.md'));
      try {
        const capContent = fs.readFileSync(path.join(cwd, '.planning', 'capabilities', capability, 'CAPABILITY.md'), 'utf-8');
        const statusMatch = capContent.match(/^status:\s*(.+)$/m);
        capabilityStatus = statusMatch ? statusMatch[1].trim() : 'exploring';
      } catch {
        capabilityStatus = 'exploring';
      }
    }
  }

  // Feature resolution — features are now top-level
  let featureInfo = null;
  if (feature) {
    const featResult = findFeatureInternal(cwd, feature);
    if (featResult && featResult.found) {
      featureInfo = {
        slug: feature,
        path: toPosixPath(path.join('.planning', 'features', feature, 'FEATURE.md')),
        directory: toPosixPath(path.join('.planning', 'features', feature)),
      };
    }
  }

  let capabilityList = [];
  const capDir = path.join(cwd, '.planning', 'capabilities');
  try {
    const entries = fs.readdirSync(capDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();
    for (const slug of entries) {
      const capPath = path.join(capDir, slug, 'CAPABILITY.md');
      let name = slug;
      let status = 'exploring';
      try {
        const content = fs.readFileSync(capPath, 'utf-8');
        const nameMatch = content.match(/^name:\s*["']?(.+?)["']?\s*$/m);
        if (nameMatch) name = nameMatch[1];
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        if (statusMatch) status = statusMatch[1].trim();
      } catch {}
      capabilityList.push({ slug, name, status });
    }
  } catch {}

  const mvuSlots = {
    debug: ['symptom', 'reproduction_path', 'hypothesis'],
    new: ['problem', 'who', 'done_criteria', 'constraints'],
    enhance: ['current_behavior', 'desired_behavior', 'delta'],
    refactor: ['current_design', 'target_design', 'breakage'],
  };

  output({
    lens,
    mvu_slots: mvuSlots[lens],
    anchor_questions_path: anchorQuestionsPath,
    anchor_questions_exists: anchorQuestionsExists,
    framing_lenses_path: framingLensesPath,
    framing_lenses_exists: framingLensesExists,
    brief_template_path: briefTemplatePath,
    capability: capabilityInfo,
    capability_status: capabilityStatus,
    brief_path: briefPath,
    feature: featureInfo,
    feature_slug: feature || null,
    feature_dir: featureInfo ? featureInfo.directory : null,
    capability_list: capabilityList,
    capability_count: capabilityList.length,
    commit_docs: config.commit_docs,
    planning_exists: pathExistsInternal(cwd, '.planning'),
    capabilities_exist: pathExistsInternal(cwd, '.planning/capabilities'),
    state_path: '.planning/STATE.md',
  }, raw);
}

function cmdInitDiscussCapability(cwd, raw) {
  const config = loadConfig(cwd);

  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
  const capabilities = [];
  try {
    const entries = fs.readdirSync(capabilitiesDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    for (const slug of entries) {
      const capPath = path.join(capabilitiesDir, slug, 'CAPABILITY.md');
      try {
        const content = fs.readFileSync(capPath, 'utf-8');
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const nameMatch = content.match(/^name:\s*["']?(.+?)["']?\s*$/m);
        capabilities.push({
          slug,
          name: nameMatch ? nameMatch[1] : slug,
          status: statusMatch ? statusMatch[1].trim() : 'unknown',
        });
      } catch { /* skip dirs without CAPABILITY.md */ }
    }
  } catch { /* no capabilities dir */ }

  output({
    commit_docs: config.commit_docs,
    capability_list: capabilities,
    capability_count: capabilities.length,
    capabilities_dir: '.planning/capabilities',
    planning_exists: pathExistsInternal(cwd, '.planning'),
    capabilities_dir_exists: pathExistsInternal(cwd, '.planning/capabilities'),
  }, raw);
}

function cmdInitDiscussFeature(cwd, raw) {
  const config = loadConfig(cwd);

  // Features are now top-level
  const featuresDir = path.join(cwd, '.planning', 'features');
  const allFeatures = [];
  try {
    const entries = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    for (const slug of entries) {
      const featPath = path.join(featuresDir, slug, 'FEATURE.md');
      try {
        const content = fs.readFileSync(featPath, 'utf-8');
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const { extractFrontmatter } = require('./frontmatter.cjs');
        const fm = extractFrontmatter(content);
        allFeatures.push({
          slug,
          status: statusMatch ? statusMatch[1].trim() : 'unknown',
          composes: fm.composes || [],
        });
      } catch { /* skip */ }
    }
  } catch { /* no features dir */ }

  // Also list capabilities for reference
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
  const capabilities = [];
  try {
    const entries = fs.readdirSync(capabilitiesDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    for (const slug of entries) {
      const capPath = path.join(capabilitiesDir, slug, 'CAPABILITY.md');
      try {
        const content = fs.readFileSync(capPath, 'utf-8');
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const nameMatch = content.match(/^name:\s*["']?(.+?)["']?\s*$/m);
        capabilities.push({
          slug,
          name: nameMatch ? nameMatch[1] : slug,
          status: statusMatch ? statusMatch[1].trim() : 'unknown',
        });
      } catch { /* skip */ }
    }
  } catch { /* no capabilities dir */ }

  output({
    commit_docs: config.commit_docs,
    capability_list: capabilities,
    capability_count: capabilities.length,
    feature_list: allFeatures,
    feature_count: allFeatures.length,
    features_dir: '.planning/features',
    capabilities_dir: '.planning/capabilities',
    planning_exists: pathExistsInternal(cwd, '.planning'),
    features_dir_exists: pathExistsInternal(cwd, '.planning/features'),
  }, raw);
}

// ─── v2 Feature init functions ─────────────────────────────────────────────

function cmdInitPlanFeature(cwd, featSlug, raw) {
  if (!featSlug) {
    error('feature slug required for init plan-feature');
  }

  const config = loadConfig(cwd);
  const featInfo = findFeatureInternal(cwd, featSlug);

  const result = {
    research_enabled: config.research,
    plan_checker_enabled: config.plan_checker,
    commit_docs: config.commit_docs,

    feature_found: !!featInfo?.found,
    feature_slug: featSlug,
    feature_dir: featInfo?.found ? toPosixPath(path.relative(cwd, featInfo.directory)) : null,

    has_research: false,
    has_context: false,
    has_plans: false,
    plan_count: 0,
    plans: [],
    summaries: [],

    planning_exists: pathExistsInternal(cwd, '.planning'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),

    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
  };

  // Load composes[] and resolve composed capabilities
  if (featInfo?.found) {
    const { extractFrontmatter } = require('./frontmatter.cjs');
    const { safeReadFile } = require('./core.cjs');
    const content = safeReadFile(featInfo.feature_path) || '';
    const fm = extractFrontmatter(content);
    result.composes = fm.composes || [];
    result.feature_type = fm.type || 'feature';

    const featDirFull = featInfo.directory;
    try {
      const files = fs.readdirSync(featDirFull);
      const plans = files.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
      const summaries = files.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();
      result.has_research = files.some(f => f === 'RESEARCH.md' || f.endsWith('-RESEARCH.md'));
      result.has_context = files.some(f => f === 'CONTEXT.md' || f.endsWith('-CONTEXT.md'));
      result.has_plans = plans.length > 0;
      result.plan_count = plans.length;
      result.plans = plans;
      result.summaries = summaries;

      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_path = toPosixPath(path.join(result.feature_dir, researchFile));
      }
    } catch {}
  }

  output(result, raw);
}

function cmdInitExecuteFeature(cwd, featSlug, raw) {
  if (!featSlug) {
    error('feature slug required for init execute-feature');
  }

  const config = loadConfig(cwd);
  const featInfo = findFeatureInternal(cwd, featSlug);

  const result = {
    commit_docs: config.commit_docs,
    parallelization: config.parallelization,
    verifier_enabled: config.verifier,

    feature_found: !!featInfo?.found,
    feature_slug: featSlug,
    feature_dir: featInfo?.found ? toPosixPath(path.relative(cwd, featInfo.directory)) : null,

    plans: [],
    summaries: [],
    incomplete_plans: [],
    plan_count: 0,
    incomplete_count: 0,

    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    config_exists: pathExistsInternal(cwd, '.planning/config.json'),

    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    config_path: '.planning/config.json',
  };

  if (featInfo?.found) {
    try {
      const files = fs.readdirSync(featInfo.directory);
      const plans = files.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
      const summaries = files.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();
      const completedIds = new Set(summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')));
      const incomplete = plans.filter(p => !completedIds.has(p.replace('-PLAN.md', '').replace('PLAN.md', '')));

      result.plans = plans;
      result.summaries = summaries;
      result.incomplete_plans = incomplete;
      result.plan_count = plans.length;
      result.incomplete_count = incomplete.length;
    } catch {}
  }

  output(result, raw);
}

function cmdInitFeatureOp(cwd, featSlug, op, raw) {
  if (!featSlug) {
    error('feature slug required for init feature-op');
  }

  const config = loadConfig(cwd);
  const featInfo = findFeatureInternal(cwd, featSlug);

  const result = {
    commit_docs: config.commit_docs,
    brave_search: config.brave_search,
    operation: op || null,

    feature_found: !!featInfo?.found,
    feature_slug: featSlug,
    feature_dir: featInfo?.found ? toPosixPath(path.relative(cwd, featInfo.directory)) : null,

    has_research: false,
    has_context: false,
    has_plans: false,
    plan_count: 0,

    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),

    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
  };

  if (featInfo?.found) {
    try {
      const files = fs.readdirSync(featInfo.directory);
      const plans = files.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      result.has_research = files.some(f => f === 'RESEARCH.md' || f.endsWith('-RESEARCH.md'));
      result.has_context = files.some(f => f === 'CONTEXT.md' || f.endsWith('-CONTEXT.md'));
      result.has_plans = plans.length > 0;
      result.plan_count = plans.length;

      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_path = toPosixPath(path.join(result.feature_dir, researchFile));
      }
    } catch {}
  }

  output(result, raw);
}

function cmdInitFeatureProgress(cwd, raw) {
  const config = loadConfig(cwd);

  // Scan capabilities
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
  const capabilities = [];
  try {
    const entries = fs.readdirSync(capabilitiesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();
    for (const capSlug of dirs) {
      const capPath = path.join(capabilitiesDir, capSlug);
      const capFiles = fs.readdirSync(capPath);
      capabilities.push({
        slug: capSlug,
        has_capability_md: capFiles.some(f => f === 'CAPABILITY.md'),
      });
    }
  } catch {}

  // Scan features (now top-level)
  const featuresDir = path.join(cwd, '.planning', 'features');
  const features = [];
  let totalPlans = 0;
  let totalSummaries = 0;
  try {
    const entries = fs.readdirSync(featuresDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();
    for (const featSlug of dirs) {
      const featPath = path.join(featuresDir, featSlug);
      const featFiles = fs.readdirSync(featPath);
      const plans = featFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = featFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                     plans.length > 0 ? 'in_progress' : 'pending';

      totalPlans += plans.length;
      totalSummaries += summaries.length;

      features.push({
        slug: featSlug,
        status,
        plan_count: plans.length,
        summary_count: summaries.length,
      });
    }
  } catch {}

  output({
    commit_docs: config.commit_docs,
    capabilities,
    capability_count: capabilities.length,
    features,
    feature_count: features.length,
    total_plans: totalPlans,
    total_summaries: totalSummaries,
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    project_path: '.planning/PROJECT.md',
  }, raw);
}

module.exports = {
  cmdInitResume,
  cmdInitProject,
  cmdInitFramingDiscovery,
  cmdInitDiscussCapability,
  cmdInitDiscussFeature,
  cmdInitPlanFeature,
  cmdInitExecuteFeature,
  cmdInitFeatureOp,
  cmdInitFeatureProgress,
};
