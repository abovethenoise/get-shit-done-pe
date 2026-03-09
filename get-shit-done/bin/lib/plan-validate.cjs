/**
 * Plan Validate — Deterministic validation that plan tasks trace to requirements
 *
 * Branches on target type:
 *   Capability: every contract section (Receives, Returns, Rules, Failure Behavior) addressed by at least one task
 *   Feature: every flow step addressed by at least one task + gate check (all composed caps verified)
 */

const path = require('path');
const { output, error, safeReadFile, findCapabilityInternal, findFeatureInternal } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');

/**
 * Extract tasks from PLAN.md content.
 * Supports v2 format (<task>/<title>/<reqs>) and v1 fallback.
 */
function parsePlanTasks(content, filename) {
  const fm = extractFrontmatter(content);
  const tasks = [];

  const taskRegex = /<task[^>]*>([\s\S]*?)<\/task>/g;
  let taskMatch;
  while ((taskMatch = taskRegex.exec(content)) !== null) {
    const block = taskMatch[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/) || block.match(/<name>([\s\S]*?)<\/name>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled task';
    const reqsMatch = block.match(/<reqs>([\s\S]*?)<\/reqs>/);
    let reqIds = [];
    if (reqsMatch) {
      reqIds = reqsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    tasks.push({ title, reqIds, plan: filename });
  }

  if (tasks.length === 0 && fm.requirements) {
    const fmReqs = Array.isArray(fm.requirements)
      ? fm.requirements.map(r => String(r).trim())
      : String(fm.requirements).split(',').map(s => s.trim());
    if (fmReqs.length > 0 && fmReqs[0]) {
      tasks.push({ title: 'Plan-level requirements', reqIds: fmReqs, plan: filename });
    }
  }

  return tasks;
}

/** Validate capability plan: tasks cover contract sections */
function validateCapabilityPlan(cwd, capSlug, allTasks) {
  const capResult = findCapabilityInternal(cwd, capSlug);
  if (!capResult.found) {
    return { passed: false, errors: [{ type: 'missing_capability', message: `Capability '${capSlug}' not found` }], warnings: [] };
  }

  const content = safeReadFile(capResult.capability_path) || '';
  const errors = [];
  const warnings = [];

  // Check contract sections are addressed
  const contractSections = ['Receives', 'Returns', 'Rules', 'Failure Behavior'];
  for (const section of contractSections) {
    const sectionExists = content.includes(`### ${section}`) || content.includes(`## ${section}`);
    if (!sectionExists) {
      warnings.push({ type: 'missing_contract_section', section, message: `Contract section '${section}' not in CAPABILITY.md` });
      continue;
    }
    // Check if any task references this section
    const sectionRef = section.toLowerCase().replace(/\s+/g, '[_\\s-]');
    const hasTask = allTasks.some(t =>
      t.reqIds.some(r => r.toLowerCase().includes(section.toLowerCase())) ||
      t.title.toLowerCase().includes(section.toLowerCase())
    );
    if (!hasTask) {
      warnings.push({ type: 'uncovered_section', section, message: `No task addresses contract section '${section}'` });
    }
  }

  // Check for scope bleed: UX/orchestration tasks in a capability plan
  for (const task of allTasks) {
    const title = task.title.toLowerCase();
    if (title.includes('user interface') || title.includes('orchestrat') || title.includes('compose') || title.includes('wire up')) {
      errors.push({ type: 'scope_bleed', task: task.title, plan: task.plan, message: 'Capability plan contains UX/orchestration task — extract to feature level' });
    }
  }

  // Check ui_facing capabilities have at least one design/UI task
  const fm = extractFrontmatter(content);
  if (fm && (fm.ui_facing === true || fm.ui_facing === 'true')) {
    const hasDesignTask = allTasks.some(t =>
      t.title.toLowerCase().includes('design') ||
      t.title.toLowerCase().includes('ui') ||
      t.title.toLowerCase().includes('component') ||
      t.reqIds.some(r => r.toLowerCase().includes('design'))
    );
    if (!hasDesignTask) {
      warnings.push({ type: 'ui_facing_no_design_task', message: 'ui_facing capability has no task referencing design/UI work' });
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    summary: { total_tasks: allTasks.length, contract_sections: contractSections.length },
  };
}

/** Validate feature plan: tasks cover flow steps + gate check */
function validateFeaturePlan(cwd, featSlug, allTasks) {
  const featResult = findFeatureInternal(cwd, featSlug);
  if (!featResult.found) {
    return { passed: false, errors: [{ type: 'missing_feature', message: `Feature '${featSlug}' not found` }], warnings: [] };
  }

  const content = safeReadFile(featResult.feature_path) || '';
  const fm = extractFrontmatter(content);
  const composes = fm.composes || [];
  const errors = [];
  const warnings = [];

  // Gate check: all composed capabilities must be verified
  for (const capSlug of composes) {
    const capResult = findCapabilityInternal(cwd, capSlug);
    if (!capResult.found) {
      errors.push({ type: 'missing_composed_capability', slug: capSlug, message: `Composed capability '${capSlug}' does not exist` });
      continue;
    }
    const capContent = safeReadFile(capResult.capability_path) || '';
    const capFm = extractFrontmatter(capContent);
    const status = capFm.status || 'planning';
    if (status !== 'verified' && status !== 'complete') {
      errors.push({ type: 'gate_blocked', slug: capSlug, status, message: `Capability '${capSlug}' has status '${status}' — must be verified before feature planning` });
    }
  }

  // Check for scope bleed: implementation tasks in a feature plan
  for (const task of allTasks) {
    const title = task.title.toLowerCase();
    if (title.includes('implement') || title.includes('algorithm') || title.includes('data structure')) {
      warnings.push({ type: 'scope_bleed', task: task.title, plan: task.plan, message: 'Feature plan contains implementation task — should be in capability plan' });
    }
  }

  if (allTasks.length === 0) {
    warnings.push({ type: 'no_tasks', message: 'No tasks found in plan files' });
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    summary: { total_tasks: allTasks.length, composes: composes.length },
  };
}

/**
 * Main validation function.
 * @param {string} cwd - working directory root
 * @param {string} reqSourcePath - path to FEATURE.md or CAPABILITY.md (relative to cwd)
 * @param {string[]} planPaths - array of PLAN.md file paths (relative to cwd)
 * @param {boolean} raw - if true, output JSON
 */
function cmdPlanValidate(cwd, reqSourcePath, planPaths, raw) {
  if (!reqSourcePath) {
    error('Usage: gsd-tools plan-validate <req-source> <plan1> [plan2...] [--raw]');
  }
  if (!planPaths || planPaths.length === 0) {
    error('At least one plan file path is required');
  }

  // Detect type from source file
  const reqFullPath = path.isAbsolute(reqSourcePath) ? reqSourcePath : path.join(cwd, reqSourcePath);
  const reqContent = safeReadFile(reqFullPath);
  if (!reqContent) {
    error(`Cannot read requirements source: ${reqSourcePath}`);
  }

  const fm = extractFrontmatter(reqContent);
  const targetType = fm.type || (reqSourcePath.includes('CAPABILITY.md') ? 'capability' : 'feature');

  // Parse all plans
  const allTasks = [];
  for (const planPath of planPaths) {
    const fullPath = path.isAbsolute(planPath) ? planPath : path.join(cwd, planPath);
    const planContent = safeReadFile(fullPath);
    if (!planContent) {
      error(`Cannot read plan file: ${planPath}`);
    }
    allTasks.push(...parsePlanTasks(planContent, path.basename(planPath)));
  }

  // Branch on type
  let result;
  if (targetType === 'capability') {
    const slug = fm.name ? fm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : path.basename(path.dirname(reqFullPath));
    result = validateCapabilityPlan(cwd, slug, allTasks);
  } else {
    // Extract slug from path or frontmatter
    const slug = path.basename(path.dirname(reqFullPath));
    result = validateFeaturePlan(cwd, slug, allTasks);
  }

  result.target_type = targetType;
  output(result, raw);
}

module.exports = { cmdPlanValidate, parsePlanTasks };
