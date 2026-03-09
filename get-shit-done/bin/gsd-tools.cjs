#!/usr/bin/env node

/**
 * GSD Tools — CLI utility for GSD workflow operations
 *
 * Replaces repetitive inline bash patterns across ~50 GSD command/workflow/agent files.
 * Centralizes: config parsing, git commits, state progression.
 *
 * Usage: node gsd-tools.cjs <command> [args] [--raw]
 *
 * Atomic Commands:
 *   state load                         Load project config + state
 *   state json                         Output STATE.md frontmatter as JSON
 *   state update <field> <value>       Update a STATE.md field
 *   state get [section]                Get STATE.md content or section
 *   state patch --field val ...        Batch update STATE.md fields
 *   commit <message> [--files f1 f2]   Commit planning docs
 *   summary-extract <path> [--fields]  Extract structured data from SUMMARY.md
 *   state-snapshot                     Structured parse of STATE.md
 *
 * Progress:
 *   progress [json|table|bar]          Render progress in various formats
 *
 * Frontmatter:
 *   frontmatter get <file> [--field k] Extract frontmatter as JSON
 *
 * Verification Suite:
 *   verify artifacts <plan-file>       Check must_haves.artifacts
 *   verify key-links <plan-file>       Check must_haves.key_links
 *
 * Template:
 *   template fill <type> [--fields]    Fill a template with variables
 *
 * State Progression:
 *   state advance-plan                 Increment plan counter
 *   state record-metric --target X     Record execution metrics
 *   state update-progress              Recalculate progress bar
 *   state add-decision --summary "..."  Add decision to STATE.md
 *   state add-blocker --text "..."     Add blocker
 *   state record-session               Update session continuity
 *
 * Config:
 *   config-get <key>                   Get config value
 *   config-set <key> <value>           Set config value
 *
 * Compound Commands (workflow-specific initialization):
 *   init resume                        All context for resume-work workflow
 *   init project                       All context for init-project workflow
 *   init discuss-capability             All context for discuss-capability workflow
 *   init discuss-feature                All context for discuss-feature workflow
 *   init framing-discovery <lens> [cap] All context for framing-discovery workflow
 *   init plan-feature <feat>            All context for plan workflow
 *   init execute-feature <feat>        All context for execute workflow
 *   init feature-op <feat> [op]        All context for feature operations
 *   init feature-progress              All context for progress workflow
 *
 * Slug Resolution:
 *   slug-resolve <input> [--type cap|feat|auto]  3-tier slug resolution
 *
 * Capability/Feature CRUD:
 *   capability-create <slug>           Create capability directory
 *   capability-list                    List all capabilities
 *   capability-status <slug>           Get capability status
 *   capability-validate <slug>         Validate capability contract completeness
 *   feature-create <slug>              Create feature directory
 *   feature-list                       List all features
 *   feature-status <feat>              Get feature status + composed capabilities
 *   feature-validate <feat>            Validate feature composes[] integrity
 *   gate-check <feat>                  Check if all composed capabilities are ready
 *
 * Scan:
 *   scan-discover                      Discover all capabilities with contents and completeness
 *   scan-pairs                         Enumerate all unique capability pairs with tier detection
 *   scan-checkpoint --pair P --action A  Read/write/list pair checkpoint markers
 *
 * Refinement:
 *   refinement-init                    Create refinement dir + snapshot existing state
 *   refinement-write --type T --content-file P  Write artifact to refinement dir
 *   refinement-report --matrix-file --dependency-graph-file --findings-dir  Write scan output
 *   refinement-delta --snapshot-file P  Compare snapshot to current state, write DELTA.md
 *   changeset-write --content-file P [--checkpoint]  Write CHANGESET.md from JSON
 *   changeset-parse                                   Parse CHANGESET.md to JSON
 */

const fs = require('fs');
const path = require('path');
const { error } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');

const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');
const { cmdPlanValidate } = require('./lib/plan-validate.cjs');

// ─── CLI Router ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Optional cwd override for sandboxed subagents running outside project root.
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  const command = args[0];

  if (!command) {
    error('Usage: gsd-tools <command> [args] [--raw] [--cwd <path>]\nCommands: state, commit, verify, frontmatter, template, config-get, config-set, init, plan-validate, progress, summary-extract, state-snapshot, slug-resolve, capability-create, capability-list, capability-status, capability-validate, feature-create, feature-list, feature-status, feature-validate, gate-check, graph-build, graph-query');
  }

  switch (command) {
    case 'state': {
      const subcommand = args[1];
      if (subcommand === 'json') {
        state.cmdStateJson(cwd, raw);
      } else if (subcommand === 'update') {
        state.cmdStateUpdate(cwd, args[2], args[3]);
      } else if (subcommand === 'get' && args[2] === 'active-focus') {
        state.cmdStateGetActiveFocus(cwd, raw);
      } else if (subcommand === 'get') {
        state.cmdStateGet(cwd, args[2], raw);
      } else if (subcommand === 'patch') {
        const patches = {};
        for (let i = 2; i < args.length; i += 2) {
          const key = args[i].replace(/^--/, '');
          const value = args[i + 1];
          if (key && value !== undefined) {
            patches[key] = value;
          }
        }
        state.cmdStatePatch(cwd, patches, raw);
      } else if (subcommand === 'advance-plan') {
        state.cmdStateAdvancePlan(cwd, raw);
      } else if (subcommand === 'record-metric') {
        const targetIdx = args.indexOf('--target');
        const planIdx = args.indexOf('--plan');
        const durationIdx = args.indexOf('--duration');
        const tasksIdx = args.indexOf('--tasks');
        const filesIdx = args.indexOf('--files');
        state.cmdStateRecordMetric(cwd, {
          target: targetIdx !== -1 ? args[targetIdx + 1] : null,
          plan: planIdx !== -1 ? args[planIdx + 1] : null,
          duration: durationIdx !== -1 ? args[durationIdx + 1] : null,
          tasks: tasksIdx !== -1 ? args[tasksIdx + 1] : null,
          files: filesIdx !== -1 ? args[filesIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'update-progress') {
        state.cmdStateUpdateProgress(cwd, raw);
      } else if (subcommand === 'add-decision') {
        const targetIdx = args.indexOf('--target');
        const summaryIdx = args.indexOf('--summary');
        const summaryFileIdx = args.indexOf('--summary-file');
        const rationaleIdx = args.indexOf('--rationale');
        const rationaleFileIdx = args.indexOf('--rationale-file');
        state.cmdStateAddDecision(cwd, {
          target: targetIdx !== -1 ? args[targetIdx + 1] : null,
          summary: summaryIdx !== -1 ? args[summaryIdx + 1] : null,
          summary_file: summaryFileIdx !== -1 ? args[summaryFileIdx + 1] : null,
          rationale: rationaleIdx !== -1 ? args[rationaleIdx + 1] : '',
          rationale_file: rationaleFileIdx !== -1 ? args[rationaleFileIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'add-blocker') {
        const textIdx = args.indexOf('--text');
        const textFileIdx = args.indexOf('--text-file');
        state.cmdStateAddBlocker(cwd, {
          text: textIdx !== -1 ? args[textIdx + 1] : null,
          text_file: textFileIdx !== -1 ? args[textFileIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'record-session') {
        const stoppedIdx = args.indexOf('--stopped-at');
        const resumeIdx = args.indexOf('--resume-file');
        state.cmdStateRecordSession(cwd, {
          stopped_at: stoppedIdx !== -1 ? args[stoppedIdx + 1] : null,
          resume_file: resumeIdx !== -1 ? args[resumeIdx + 1] : 'None',
        }, raw);
      } else {
        state.cmdStateLoad(cwd, raw);
      }
      break;
    }

    case 'commit': {
      const amend = args.includes('--amend');
      const message = args[1];
      // Parse --files flag (collect args after --files, stopping at other flags)
      const filesIndex = args.indexOf('--files');
      const files = filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
      commands.cmdCommit(cwd, message, files, raw, amend);
      break;
    }

    case 'template': {
      const subcommand = args[1];
      if (subcommand === 'fill') {
        const templateType = args[2];
        const nameIdx = args.indexOf('--name');
        const slugIdx = args.indexOf('--slug');
        const lensIdx = args.indexOf('--lens');
        const fieldsIdx = args.indexOf('--fields');
        const fields = fieldsIdx !== -1 ? JSON.parse(args[fieldsIdx + 1]) : {};
        template.cmdTemplateFill(cwd, templateType, {
          name: nameIdx !== -1 ? args[nameIdx + 1] : (fields.capability || fields.feature || null),
          slug: slugIdx !== -1 ? args[slugIdx + 1] : null,
          lens: lensIdx !== -1 ? args[lensIdx + 1] : (fields.lens || null),
        }, raw);
      } else {
        error('Unknown template subcommand. Available: fill');
      }
      break;
    }

    case 'frontmatter': {
      const subcommand = args[1];
      const file = args[2];
      if (subcommand === 'get') {
        const fieldIdx = args.indexOf('--field');
        frontmatter.cmdFrontmatterGet(cwd, file, fieldIdx !== -1 ? args[fieldIdx + 1] : null, raw);
      } else {
        error('Unknown frontmatter subcommand. Available: get');
      }
      break;
    }

    case 'verify': {
      const subcommand = args[1];
      if (subcommand === 'artifacts') {
        verify.cmdVerifyArtifacts(cwd, args[2], raw);
      } else if (subcommand === 'key-links') {
        verify.cmdVerifyKeyLinks(cwd, args[2], raw);
      } else {
        error('Unknown verify subcommand. Available: artifacts, key-links');
      }
      break;
    }

    case 'config-set': {
      config.cmdConfigSet(cwd, args[1], args[2], raw);
      break;
    }

    case 'config-get': {
      config.cmdConfigGet(cwd, args[1], raw);
      break;
    }

    case 'progress': {
      const subcommand = args[1] || 'json';
      commands.cmdProgressRender(cwd, subcommand, raw);
      break;
    }

    case 'init': {
      const workflow = args[1];
      switch (workflow) {
        case 'resume':
          init.cmdInitResume(cwd, raw);
          break;
        case 'project':
          init.cmdInitProject(cwd, raw);
          break;
        case 'framing-discovery': {
          const fdLens = args[2];
          const fdCap = args[3];
          let fdFeat = null;
          const featIdx = args.indexOf('--feature');
          if (featIdx !== -1 && args[featIdx + 1]) {
            fdFeat = args[featIdx + 1];
          }
          init.cmdInitFramingDiscovery(cwd, fdLens, fdCap, fdFeat, raw);
          break;
        }
        case 'discuss-capability':
          init.cmdInitDiscussCapability(cwd, raw);
          break;
        case 'discuss-feature':
          init.cmdInitDiscussFeature(cwd, raw);
          break;
        // v2 capability/feature init commands
        case 'plan-feature':
          init.cmdInitPlanFeature(cwd, args[2], raw);
          break;
        case 'execute-feature':
          init.cmdInitExecuteFeature(cwd, args[2], raw);
          break;
        case 'feature-op':
          init.cmdInitFeatureOp(cwd, args[2], args[3], raw);
          break;
        case 'feature-progress':
          init.cmdInitFeatureProgress(cwd, raw);
          break;
        default:
          error(`Unknown init workflow: ${workflow}\nAvailable: resume, project, framing-discovery, discuss-capability, discuss-feature, plan-feature, execute-feature, feature-op, feature-progress`);
      }
      break;
    }

    case 'state-snapshot': {
      state.cmdStateSnapshot(cwd, raw);
      break;
    }

    case 'summary-extract': {
      const summaryPath = args[1];
      const fieldsIndex = args.indexOf('--fields');
      const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
      commands.cmdSummaryExtract(cwd, summaryPath, fields, raw);
      break;
    }

    // ─── Plan validation ─────────────────────────────────────────────────────
    case 'plan-validate': {
      const reqSource = args[1];
      const planFiles = args.slice(2).filter(a => a !== '--raw');
      cmdPlanValidate(cwd, reqSource, planFiles, raw);
      break;
    }

    // ─── Slug resolution ─────────────────────────────────────────────────────
    case 'slug-resolve': {
      const { resolveSlugInternal, output: coreOutput } = require('./lib/core.cjs');
      const input = args[1];
      const typeIdx = args.indexOf('--type');
      const typeHint = typeIdx !== -1 ? args[typeIdx + 1] : 'auto';
      const result = resolveSlugInternal(cwd, input, typeHint === 'auto' ? null : typeHint);
      coreOutput(result, raw);
      break;
    }

    // ─── Capability flat-verb commands ──────────────────────────────────────
    case 'capability-create': {
      const { cmdCapabilityCreate } = require('./lib/capability.cjs');
      cmdCapabilityCreate(cwd, args[1], raw);
      break;
    }
    case 'capability-list': {
      const { cmdCapabilityList } = require('./lib/capability.cjs');
      cmdCapabilityList(cwd, raw);
      break;
    }
    case 'capability-status': {
      const { cmdCapabilityStatus } = require('./lib/capability.cjs');
      cmdCapabilityStatus(cwd, args[1], raw);
      break;
    }

    // ─── Feature flat-verb commands ─────────────────────────────────────────
    case 'feature-create': {
      const { cmdFeatureCreate } = require('./lib/feature.cjs');
      cmdFeatureCreate(cwd, args[1], raw);
      break;
    }
    case 'feature-list': {
      const { cmdFeatureList } = require('./lib/feature.cjs');
      cmdFeatureList(cwd, raw);
      break;
    }
    case 'feature-status': {
      const { cmdFeatureStatus } = require('./lib/feature.cjs');
      cmdFeatureStatus(cwd, args[1], raw);
      break;
    }
    case 'feature-validate': {
      const { cmdFeatureValidate } = require('./lib/feature.cjs');
      cmdFeatureValidate(cwd, args[1], raw);
      break;
    }
    case 'gate-check': {
      const { cmdGateCheck } = require('./lib/feature.cjs');
      cmdGateCheck(cwd, args[1], raw);
      break;
    }
    case 'capability-validate': {
      const { cmdCapabilityValidate } = require('./lib/capability.cjs');
      cmdCapabilityValidate(cwd, args[1], raw);
      break;
    }

    // ─── Scan commands ──────────────────────────────────────────────────────
    case 'scan-discover': {
      const { cmdScanDiscover } = require('./lib/scan.cjs');
      cmdScanDiscover(cwd, raw);
      break;
    }
    case 'scan-pairs': {
      const { cmdScanPairs } = require('./lib/scan.cjs');
      cmdScanPairs(cwd, raw);
      break;
    }
    case 'scan-checkpoint': {
      const { cmdScanCheckpoint } = require('./lib/scan.cjs');
      cmdScanCheckpoint(cwd, args.slice(1), raw);
      break;
    }

    // ─── Refinement commands ────────────────────────────────────────────────
    case 'refinement-init': {
      const { cmdRefinementInit } = require('./lib/refinement.cjs');
      cmdRefinementInit(cwd, raw);
      break;
    }
    case 'refinement-write': {
      const { cmdRefinementWrite } = require('./lib/refinement.cjs');
      cmdRefinementWrite(cwd, args.slice(1), raw);
      break;
    }
    case 'refinement-report': {
      const { cmdRefinementReport } = require('./lib/refinement.cjs');
      cmdRefinementReport(cwd, args.slice(1), raw);
      break;
    }
    case 'refinement-delta': {
      const { cmdRefinementDelta } = require('./lib/refinement.cjs');
      cmdRefinementDelta(cwd, args.slice(1), raw);
      break;
    }
    case 'changeset-write': {
      const { cmdChangesetWrite } = require('./lib/refinement.cjs');
      cmdChangesetWrite(cwd, args.slice(1), raw);
      break;
    }
    case 'changeset-parse': {
      const { cmdChangesetParse } = require('./lib/refinement.cjs');
      cmdChangesetParse(cwd, raw);
      break;
    }

    // ─── Graph commands ──────────────────────────────────────────────────────
    case 'graph-build': {
      const { cmdGraphBuild } = require('./lib/graph.cjs');
      cmdGraphBuild(cwd, raw);
      break;
    }
    case 'graph-query': {
      const { cmdGraphQuery } = require('./lib/graph.cjs');
      cmdGraphQuery(cwd, args.slice(1), raw);
      break;
    }

    default:
      error(`Unknown command: ${command}`);
  }
}

main();
