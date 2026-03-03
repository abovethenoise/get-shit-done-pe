/**
 * Init — Compound init commands for workflow bootstrapping
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig, resolveModelInternal, resolveModelFromRole, pathExistsInternal, generateSlugInternal, getMilestoneInfo, toPosixPath, findCapabilityInternal, findFeatureInternal, output, error } = require('./core.cjs');

function detectBriefAndDesign(cwd, capInfo, capDir) {
  const result = { has_brief: false };
  if (capInfo?.found) {
    const briefFull = path.join(capInfo.directory, 'BRIEF.md');
    if (fs.existsSync(briefFull)) {
      result.has_brief = true;
      result.brief_path = toPosixPath(path.join(capDir, 'BRIEF.md'));
    }
  }
  const designFull = path.join(cwd, '.planning', 'DESIGN.md');
  if (fs.existsSync(designFull)) {
    result.design_path = '.planning/DESIGN.md';
  }
  return result;
}

function cmdInitResume(cwd, raw) {
  const config = loadConfig(cwd);

  // Check for interrupted agent
  let interruptedAgentId = null;
  try {
    interruptedAgentId = fs.readFileSync(path.join(cwd, '.planning', 'current-agent-id.txt'), 'utf-8').trim();
  } catch {}

  const result = {
    // File existence
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),

    // File paths
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    project_path: '.planning/PROJECT.md',

    // Agent state
    has_interrupted_agent: !!interruptedAgentId,
    interrupted_agent_id: interruptedAgentId,

    // Config
    commit_docs: config.commit_docs,
  };

  output(result, raw);
}

function cmdInitProject(cwd, raw) {
  const config = loadConfig(cwd);

  // Detect code presence
  let codeExists = false;
  try {
    const files = execSync('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.c" -o -name "*.cpp" -o -name "*.cs" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    codeExists = files.trim().length > 0;
  } catch {}

  // Also check for package files as code indicators
  const hasPackageFile = pathExistsInternal(cwd, 'package.json') ||
                         pathExistsInternal(cwd, 'requirements.txt') ||
                         pathExistsInternal(cwd, 'Cargo.toml') ||
                         pathExistsInternal(cwd, 'go.mod') ||
                         pathExistsInternal(cwd, 'Package.swift') ||
                         pathExistsInternal(cwd, 'pyproject.toml') ||
                         pathExistsInternal(cwd, 'Gemfile');

  codeExists = codeExists || hasPackageFile;

  // Detect planning existence
  const planningExists = pathExistsInternal(cwd, '.planning');
  const projectExists = pathExistsInternal(cwd, '.planning/PROJECT.md');

  // Detect partial run
  let partialRun = { has_partial: false, completed_sections: [], next_section: null };
  const initStatePath = path.join(cwd, '.planning', 'init-state.json');
  try {
    const stateContent = fs.readFileSync(initStatePath, 'utf-8');
    const stateData = JSON.parse(stateContent);
    if (stateData.completed_sections && stateData.completed_sections.length > 0) {
      partialRun.has_partial = true;
      partialRun.completed_sections = stateData.completed_sections;
      partialRun.mode = stateData.mode || null;

      // Determine next section based on mode
      const allSections = stateData.mode === 'existing'
        ? ['scan', 'validation', 'gap_fill', 'design_style', 'project_md', 'capability_map', 'documentation', 'roadmap_md', 'state_md']
        : ['goals', 'tech_stack', 'architecture', 'design_style', 'project_md', 'capability_map', 'documentation', 'roadmap_md', 'state_md'];

      const completed = new Set(stateData.completed_sections);
      partialRun.next_section = allSections.find(s => !completed.has(s)) || null;
    }
  } catch {}

  // Auto-detect mode
  let detectedMode;
  if (!codeExists && !planningExists) {
    detectedMode = 'new';
  } else if (codeExists && !projectExists) {
    detectedMode = 'existing';
  } else if (projectExists) {
    // PROJECT.md already exists -- could be partial run or re-init
    detectedMode = partialRun.has_partial ? (partialRun.mode || 'ambiguous') : 'ambiguous';
  } else {
    detectedMode = 'ambiguous';
  }

  // Project context for existing projects
  let projectContext = null;
  if (projectExists) {
    try {
      projectContext = fs.readFileSync(path.join(cwd, '.planning', 'PROJECT.md'), 'utf-8').substring(0, 2000);
    } catch {}
  }

  const result = {
    // Detection
    detected_mode: detectedMode,
    planning_exists: planningExists,
    code_exists: codeExists,
    project_exists: projectExists,

    // Partial run state
    partial_run: partialRun,

    // Project context (truncated for existing)
    project_context: projectContext,

    // Config
    commit_docs: config.commit_docs,

    // Git state
    has_git: pathExistsInternal(cwd, '.git'),
  };

  output(result, raw);
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

  // Resolve framing question file path
  const gsdRoot = path.join(__dirname, '..', '..');
  const anchorQuestionsPath = toPosixPath(path.join('get-shit-done', 'framings', lens, 'anchor-questions.md'));
  const anchorQuestionsExists = fs.existsSync(path.join(gsdRoot, 'framings', lens, 'anchor-questions.md'));

  // Framing lenses reference
  const framingLensesPath = toPosixPath(path.join('get-shit-done', 'references', 'framing-lenses.md'));
  const framingLensesExists = fs.existsSync(path.join(gsdRoot, 'references', 'framing-lenses.md'));

  // Discovery brief template path
  const briefTemplatePath = toPosixPath(path.join('get-shit-done', 'templates', 'discovery-brief.md'));

  // Capability resolution -- if a capability slug was provided, look it up
  let capabilityInfo = null;
  let capabilityStatus = null;
  let briefPath = null;
  if (capability) {
    const capResult = require('./core.cjs').findCapabilityInternal(cwd, capability);
    if (capResult.found) {
      capabilityInfo = {
        slug: capability,
        path: toPosixPath(path.join('.planning', 'capabilities', capability, 'CAPABILITY.md')),
        directory: toPosixPath(path.join('.planning', 'capabilities', capability)),
      };
      briefPath = toPosixPath(path.join('.planning', 'capabilities', capability, 'BRIEF.md'));

      // Read status from CAPABILITY.md frontmatter
      try {
        const capContent = fs.readFileSync(path.join(cwd, '.planning', 'capabilities', capability, 'CAPABILITY.md'), 'utf-8');
        const statusMatch = capContent.match(/^status:\s*(.+)$/m);
        capabilityStatus = statusMatch ? statusMatch[1].trim() : 'exploring';
      } catch {
        capabilityStatus = 'exploring';
      }
    }
  }

  // Feature resolution -- if a feature slug was provided, look it up
  let featureInfo = null;
  if (feature && capability) {
    const featResult = findFeatureInternal(cwd, capability, feature);
    if (featResult && featResult.found) {
      featureInfo = {
        slug: feature,
        path: toPosixPath(path.join('.planning', 'capabilities', capability, 'features', feature, 'FEATURE.md')),
        directory: toPosixPath(path.join('.planning', 'capabilities', capability, 'features', feature)),
      };
    }
  }

  // List all capabilities for fuzzy resolution
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

  // MVU slot definitions per lens
  const mvuSlots = {
    debug: ['symptom', 'reproduction_path', 'hypothesis'],
    new: ['problem', 'who', 'done_criteria', 'constraints'],
    enhance: ['current_behavior', 'desired_behavior', 'delta'],
    refactor: ['current_design', 'target_design', 'breakage'],
  };

  const result = {
    // Lens info
    lens,
    mvu_slots: mvuSlots[lens],

    // Framing file paths
    anchor_questions_path: anchorQuestionsPath,
    anchor_questions_exists: anchorQuestionsExists,
    framing_lenses_path: framingLensesPath,
    framing_lenses_exists: framingLensesExists,
    brief_template_path: briefTemplatePath,

    // Capability context (null if not resolved yet)
    capability: capabilityInfo,
    capability_status: capabilityStatus,
    brief_path: briefPath,

    // Feature context (null if not resolved yet)
    feature: featureInfo,
    feature_slug: feature || null,
    feature_dir: featureInfo ? featureInfo.directory : null,

    // Capability list for fuzzy resolution
    capability_list: capabilityList,
    capability_count: capabilityList.length,

    // Config
    commit_docs: config.commit_docs,

    // File existence
    planning_exists: pathExistsInternal(cwd, '.planning'),
    capabilities_exist: pathExistsInternal(cwd, '.planning/capabilities'),

    // File paths
    state_path: '.planning/STATE.md',
  };

  output(result, raw);
}

function cmdInitDiscussCapability(cwd, raw) {
  const config = loadConfig(cwd);

  // Get capability list for fuzzy matching
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

  // Documentation capabilities directory
  const docCapDir = path.join(cwd, '.documentation', 'capabilities');
  let docCapabilities = [];
  try {
    docCapabilities = fs.readdirSync(docCapDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  } catch { /* no doc capabilities dir */ }

  const result = {
    // Config
    commit_docs: config.commit_docs,

    // Capability inventory (for fuzzy matching)
    capability_list: capabilities,
    capability_count: capabilities.length,

    // Documentation capabilities
    doc_capabilities: docCapabilities,

    // Paths
    capabilities_dir: '.planning/capabilities',
    documentation_dir: '.documentation',
    doc_capabilities_dir: '.documentation/capabilities',

    // File existence
    planning_exists: pathExistsInternal(cwd, '.planning'),
    documentation_exists: pathExistsInternal(cwd, '.documentation'),
    capabilities_dir_exists: pathExistsInternal(cwd, '.planning/capabilities'),
    doc_capabilities_dir_exists: pathExistsInternal(cwd, '.documentation/capabilities'),
  };

  output(result, raw);
}

function cmdInitDiscussFeature(cwd, raw) {
  const config = loadConfig(cwd);

  // Get capability list with nested features for fuzzy matching
  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
  const capabilities = [];
  const allFeatures = [];
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

        // Get features for this capability
        const featuresDir = path.join(capabilitiesDir, slug, 'features');
        const features = [];
        try {
          const featEntries = fs.readdirSync(featuresDir, { withFileTypes: true })
            .filter(e => e.isDirectory())
            .map(e => e.name)
            .sort();

          for (const featSlug of featEntries) {
            const featPath = path.join(featuresDir, featSlug, 'FEATURE.md');
            try {
              const featContent = fs.readFileSync(featPath, 'utf-8');
              const featStatusMatch = featContent.match(/^status:\s*(.+)$/m);
              const featNameMatch = featContent.match(/^name:\s*["']?(.+?)["']?\s*$/m);
              const feat = {
                slug: featSlug,
                name: featNameMatch ? featNameMatch[1] : featSlug,
                status: featStatusMatch ? featStatusMatch[1].trim() : 'unknown',
                capability: slug,
                full_path: `${slug}/${featSlug}`,
              };
              features.push(feat);
              allFeatures.push(feat);
            } catch { /* skip */ }
          }
        } catch { /* no features dir */ }

        capabilities.push({
          slug,
          name: nameMatch ? nameMatch[1] : slug,
          status: statusMatch ? statusMatch[1].trim() : 'unknown',
          features,
          feature_count: features.length,
        });
      } catch { /* skip */ }
    }
  } catch { /* no capabilities dir */ }

  const result = {
    // Config
    commit_docs: config.commit_docs,

    // Capability inventory
    capability_list: capabilities,
    capability_count: capabilities.length,

    // Feature inventory (flattened for fuzzy matching)
    feature_list: allFeatures,
    feature_count: allFeatures.length,

    // Paths
    capabilities_dir: '.planning/capabilities',
    documentation_dir: '.documentation',

    // File existence
    planning_exists: pathExistsInternal(cwd, '.planning'),
    capabilities_dir_exists: pathExistsInternal(cwd, '.planning/capabilities'),
  };

  output(result, raw);
}

// ─── v2 Capability/Feature init functions ────────────────────────────────────

function cmdInitPlanFeature(cwd, capSlug, featSlug, raw) {
  if (!capSlug || !featSlug) {
    error('capability slug and feature slug required for init plan-feature');
  }

  const config = loadConfig(cwd);
  const capInfo = findCapabilityInternal(cwd, capSlug);
  const featInfo = findFeatureInternal(cwd, capSlug, featSlug);

  const result = {
    // Models
    researcher_model: resolveModelFromRole(cwd, path.join(cwd, '..', 'agents', 'gsd-researcher.md')),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    checker_model: resolveModelInternal(cwd, 'gsd-plan-checker'),

    // Workflow flags
    research_enabled: config.research,
    plan_checker_enabled: config.plan_checker,
    commit_docs: config.commit_docs,

    // Capability info
    capability_found: !!capInfo?.found,
    capability_slug: capSlug,
    capability_dir: capInfo?.found ? toPosixPath(path.relative(cwd, capInfo.directory)) : null,

    // Feature info
    feature_found: !!featInfo?.found,
    feature_slug: featSlug,
    feature_dir: featInfo?.found ? toPosixPath(path.relative(cwd, featInfo.directory)) : null,

    // Existing artifacts
    has_research: false,
    has_context: false,
    has_brief: false,
    has_plans: false,
    plan_count: 0,
    plans: [],
    summaries: [],

    // Environment
    planning_exists: pathExistsInternal(cwd, '.planning'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),

    // File paths
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    requirements_path: '.planning/REQUIREMENTS.md',
  };

  // BRIEF.md + DESIGN.md detection
  Object.assign(result, detectBriefAndDesign(cwd, capInfo, result.capability_dir));

  // Populate artifacts from feature directory
  if (featInfo?.found) {
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

      // Legacy context path (backward compat)
      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) {
        result.context_path = toPosixPath(path.join(result.feature_dir, contextFile));
        result.legacy_context_path = result.context_path;
      }
      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_path = toPosixPath(path.join(result.feature_dir, researchFile));
      }
    } catch {}
  }

  output(result, raw);
}

function cmdInitExecuteFeature(cwd, capSlug, featSlug, raw) {
  if (!capSlug || !featSlug) {
    error('capability slug and feature slug required for init execute-feature');
  }

  const config = loadConfig(cwd);
  const capInfo = findCapabilityInternal(cwd, capSlug);
  const featInfo = findFeatureInternal(cwd, capSlug, featSlug);
  const milestone = getMilestoneInfo(cwd);

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),

    // Config flags
    commit_docs: config.commit_docs,
    parallelization: config.parallelization,
    verifier_enabled: config.verifier,

    // Capability info
    capability_found: !!capInfo?.found,
    capability_slug: capSlug,
    capability_dir: capInfo?.found ? toPosixPath(path.relative(cwd, capInfo.directory)) : null,

    // Feature info
    feature_found: !!featInfo?.found,
    feature_slug: featSlug,
    feature_dir: featInfo?.found ? toPosixPath(path.relative(cwd, featInfo.directory)) : null,

    // Plan inventory
    plans: [],
    summaries: [],
    incomplete_plans: [],
    plan_count: 0,
    incomplete_count: 0,

    // Milestone info
    milestone_version: milestone.version,
    milestone_name: milestone.name,

    // File existence
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    config_exists: pathExistsInternal(cwd, '.planning/config.json'),

    // File paths
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    config_path: '.planning/config.json',
  };

  // Populate plan inventory from feature directory
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

function cmdInitFeatureOp(cwd, capSlug, featSlug, op, raw) {
  if (!capSlug || !featSlug) {
    error('capability slug and feature slug required for init feature-op');
  }

  const config = loadConfig(cwd);
  const capInfo = findCapabilityInternal(cwd, capSlug);
  const featInfo = findFeatureInternal(cwd, capSlug, featSlug);

  const result = {
    // Config
    commit_docs: config.commit_docs,
    brave_search: config.brave_search,

    // Operation
    operation: op || null,

    // Capability info
    capability_found: !!capInfo?.found,
    capability_slug: capSlug,
    capability_dir: capInfo?.found ? toPosixPath(path.relative(cwd, capInfo.directory)) : null,

    // Feature info
    feature_found: !!featInfo?.found,
    feature_slug: featSlug,
    feature_dir: featInfo?.found ? toPosixPath(path.relative(cwd, featInfo.directory)) : null,

    // Existing artifacts
    has_research: false,
    has_context: false,
    has_brief: false,
    has_plans: false,
    plan_count: 0,

    // File existence
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),

    // File paths
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    requirements_path: '.planning/REQUIREMENTS.md',
  };

  // BRIEF.md + DESIGN.md detection
  Object.assign(result, detectBriefAndDesign(cwd, capInfo, result.capability_dir));

  // Populate artifacts from feature directory
  if (featInfo?.found) {
    try {
      const files = fs.readdirSync(featInfo.directory);
      const plans = files.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      result.has_research = files.some(f => f === 'RESEARCH.md' || f.endsWith('-RESEARCH.md'));
      result.has_context = files.some(f => f === 'CONTEXT.md' || f.endsWith('-CONTEXT.md'));
      result.has_plans = plans.length > 0;
      result.plan_count = plans.length;

      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) {
        result.context_path = toPosixPath(path.join(result.feature_dir, contextFile));
      }
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
  const milestone = getMilestoneInfo(cwd);

  const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
  const capabilities = [];

  try {
    const entries = fs.readdirSync(capabilitiesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const capSlug of dirs) {
      const capPath = path.join(capabilitiesDir, capSlug);
      const capFiles = fs.readdirSync(capPath);
      const hasCapMd = capFiles.some(f => f === 'CAPABILITY.md');

      const featuresDir = path.join(capPath, 'features');
      const features = [];
      let totalPlans = 0;
      let totalSummaries = 0;

      try {
        const featEntries = fs.readdirSync(featuresDir, { withFileTypes: true });
        const featDirs = featEntries.filter(e => e.isDirectory()).map(e => e.name).sort();

        for (const featSlug of featDirs) {
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

      capabilities.push({
        slug: capSlug,
        has_capability_md: hasCapMd,
        feature_count: features.length,
        features,
        total_plans: totalPlans,
        total_summaries: totalSummaries,
      });
    }
  } catch {}

  const totalPlans = capabilities.reduce((sum, c) => sum + c.total_plans, 0);
  const totalSummaries = capabilities.reduce((sum, c) => sum + c.total_summaries, 0);

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),

    // Config
    commit_docs: config.commit_docs,

    // Milestone
    milestone_version: milestone.version,
    milestone_name: milestone.name,

    // Capability overview
    capabilities,
    capability_count: capabilities.length,
    total_features: capabilities.reduce((sum, c) => sum + c.feature_count, 0),
    total_plans: totalPlans,
    total_summaries: totalSummaries,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),

    // File paths
    state_path: '.planning/STATE.md',
    roadmap_path: '.planning/ROADMAP.md',
    project_path: '.planning/PROJECT.md',
  };

  output(result, raw);
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
