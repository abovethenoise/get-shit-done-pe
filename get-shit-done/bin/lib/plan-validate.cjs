/**
 * Plan Validate — Deterministic validation that plan tasks trace to real requirements
 *
 * Four rules:
 *   1. Orphan task (ERROR) — task has no REQ references
 *   2. Phantom reference (ERROR) — task references REQ ID not in source file
 *   3. Cross-layer mixing (ERROR) — task mixes EU and TC layers (must bridge through FN)
 *   4. Uncovered REQ (WARNING) — REQ in source file has no task in any plan
 */

const path = require('path');
const { output, error, safeReadFile } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');

/**
 * Extract REQ IDs from a requirements source file (FEATURE.md or REQUIREMENTS.md).
 * Looks for table rows where the first column matches an ID pattern like EU-01, FN-01, TC-01, PLAN-01, REQS-03.
 */
function parseReqSource(content) {
  const ids = new Set();
  const regex = /^\|\s*([A-Z]+-\d+)\s*\|/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

/**
 * Extract tasks from PLAN.md content.
 * Supports v2 format (<task>/<title>/<reqs>) and v1 fallback (<name>, frontmatter requirements).
 */
function parsePlanTasks(content, filename) {
  const fm = extractFrontmatter(content);
  const tasks = [];

  // Extract <task> blocks
  const taskRegex = /<task[^>]*>([\s\S]*?)<\/task>/g;
  let taskMatch;
  while ((taskMatch = taskRegex.exec(content)) !== null) {
    const block = taskMatch[1];

    // v2: <title>, v1 fallback: <name>
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/) || block.match(/<name>([\s\S]*?)<\/name>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled task';

    // v2: <reqs> tag
    const reqsMatch = block.match(/<reqs>([\s\S]*?)<\/reqs>/);
    let reqIds = [];
    if (reqsMatch) {
      reqIds = reqsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }

    tasks.push({ title, reqIds, plan: filename });
  }

  // v1 fallback: if no tasks found via XML but frontmatter has requirements
  if (tasks.length === 0 && fm.requirements) {
    const fmReqs = Array.isArray(fm.requirements)
      ? fm.requirements.map(r => String(r).trim())
      : String(fm.requirements).split(',').map(s => s.trim());
    // Create a single synthetic task from frontmatter requirements
    if (fmReqs.length > 0 && fmReqs[0]) {
      tasks.push({ title: 'Plan-level requirements', reqIds: fmReqs, plan: filename });
    }
  }

  return tasks;
}

/**
 * Determine the layer prefix of a REQ ID.
 * Returns 'EU', 'FN', 'TC' for layered IDs, or null for project-level IDs (PLAN, REQS, etc).
 */
function getLayerPrefix(reqId) {
  const match = reqId.match(/^(EU|FN|TC)-\d+$/);
  return match ? match[1] : null;
}

/**
 * Main validation function.
 *
 * @param {string} cwd - working directory root
 * @param {string} reqSourcePath - path to FEATURE.md or REQUIREMENTS.md (relative to cwd)
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

  // 1. Parse REQ source
  const reqFullPath = path.isAbsolute(reqSourcePath) ? reqSourcePath : path.join(cwd, reqSourcePath);
  const reqContent = safeReadFile(reqFullPath);
  if (!reqContent) {
    error(`Cannot read requirements source: ${reqSourcePath}`);
  }
  const validReqIds = parseReqSource(reqContent);

  if (validReqIds.size === 0) {
    error(`No REQ IDs found in ${reqSourcePath}. Expected table rows with | ID | pattern.`);
  }

  // 2. Parse all plans
  const allTasks = [];
  for (const planPath of planPaths) {
    const fullPath = path.isAbsolute(planPath) ? planPath : path.join(cwd, planPath);
    const planContent = safeReadFile(fullPath);
    if (!planContent) {
      error(`Cannot read plan file: ${planPath}`);
    }
    const filename = path.basename(planPath);
    const tasks = parsePlanTasks(planContent, filename);
    allTasks.push(...tasks);
  }

  // 3. Run 4 validation rules
  const errors = [];
  const warnings = [];
  const coveredReqs = new Set();

  for (const task of allTasks) {
    // Rule 1: Orphan task — no REQ references
    if (task.reqIds.length === 0) {
      errors.push({
        type: 'orphan_task',
        task: task.title,
        plan: task.plan,
        message: 'Task has no REQ references',
      });
      continue; // No IDs to check for other rules
    }

    // Rule 2: Phantom reference — ID not in validReqIds
    for (const id of task.reqIds) {
      if (!validReqIds.has(id)) {
        errors.push({
          type: 'phantom_reference',
          req: id,
          task: task.title,
          plan: task.plan,
          message: `REQ ID ${id} not found in ${reqSourcePath}`,
        });
      } else {
        coveredReqs.add(id);
      }
    }

    // Rule 3: Cross-layer mixing — EU + TC in same task (only for layered IDs)
    const layers = new Set();
    for (const id of task.reqIds) {
      const layer = getLayerPrefix(id);
      if (layer) layers.add(layer);
    }
    if (layers.has('EU') && layers.has('TC')) {
      errors.push({
        type: 'cross_layer_mixing',
        task: task.title,
        plan: task.plan,
        reqs: task.reqIds,
        message: 'Task mixes EU and TC layers — must bridge through FN',
      });
    }
  }

  // Rule 4: Uncovered REQ — ID in source not referenced by any task
  for (const id of validReqIds) {
    if (!coveredReqs.has(id)) {
      warnings.push({
        type: 'uncovered_req',
        req: id,
        message: `REQ ${id} in ${reqSourcePath} has no task in any plan`,
      });
    }
  }

  // 4. Output
  output({
    passed: errors.length === 0,
    errors,
    warnings,
    summary: {
      total_tasks: allTasks.length,
      total_reqs: validReqIds.size,
      covered: coveredReqs.size,
      uncovered: validReqIds.size - coveredReqs.size,
      errors: errors.length,
      warnings: warnings.length,
    },
  }, raw);
}

module.exports = { cmdPlanValidate, parseReqSource, parsePlanTasks };
