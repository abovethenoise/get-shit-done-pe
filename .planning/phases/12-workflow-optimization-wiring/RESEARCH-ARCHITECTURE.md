# Phase 12: Workflow Optimization & Wiring — Architecture Research

**Researched:** 2026-03-01
**Lens:** V2 Flow Architecture — What exists, what needs to change
**Confidence:** HIGH (based on direct file reads of all surviving artifacts)

---

## Summary

This document is a complete inventory of every command, workflow, agent, and CLI route in the current codebase, annotated with v1/v2 status and what each artifact needs to become. The goal is a precise map of what Phase 12 must rewire.

**The core problem in one sentence:** The 4 framing commands drive discovery correctly, but the post-discovery pipeline (`framing-pipeline.md`) invokes stage workflows (`plan.md`, `execute.md`, `review.md`, `doc.md`) that still initialize via v1 phase-scoped CLI routes (`init plan-phase`, `init execute-phase`, `init review-phase`, `init doc-phase`), which produce phase-directory paths rather than feature-directory paths. Two of those routes already return error messages. The v2 init routes (`init plan-feature`, `init execute-feature`) exist in the CLI but nothing calls them.

**Primary recommendation:** Rewrite `plan.md`, `execute.md`, `review.md`, and `doc.md` to call `init plan-feature` / `init execute-feature` / `init feature-op` instead of their v1 equivalents. The CLI is already v2-ready — only the workflow files are broken.

---

## Command Inventory

| Command File | Invokes CLI Route | Invokes Workflow | v1/v2 Status | Notes |
|---|---|---|---|---|
| `init.md` | `init project` | `init-project.md` | **V2** | Full new/brownfield detect/branch. Missing: STATE.md + ROADMAP.md creation during init (B2 blocker). |
| `debug.md` | `init framing-discovery debug` (via workflow) | `framing-discovery.md` -> `framing-pipeline.md` | **V2 entry, V1 pipeline** | Command is v2. Pipeline downstream is broken (see framing-pipeline entry). |
| `new.md` | `init framing-discovery new` (via workflow) | `framing-discovery.md` -> `framing-pipeline.md` | **V2 entry, V1 pipeline** | Same as debug. |
| `enhance.md` | `init framing-discovery enhance` (via workflow) | `framing-discovery.md` -> `framing-pipeline.md` | **V2 entry, V1 pipeline** | Same as debug. |
| `refactor.md` | `init framing-discovery refactor` (via workflow) | `framing-discovery.md` -> `framing-pipeline.md` | **V2 entry, V1 pipeline** | Same as debug. |
| `discuss-capability.md` | `init discuss-capability`, `capability-list` | `discuss-capability.md` | **V2** | Writes to `.documentation/capabilities/` (v2 path). Works correctly. |
| `discuss-feature.md` | `init discuss-feature`, `feature-list` | `discuss-feature.md` | **V2** | Writes to `.planning/capabilities/{cap}/features/{feat}/`. Works correctly. |
| `progress.md` | `init progress` | `progress.md` | **MIXED** | init progress scans `.planning/phases/` — will return empty for v2 projects. Route logic references phase dirs, CONTEXT.md checks, `/gsd:execute {phase}` routing. Needs v2 rewrite. |
| `resume-work.md` | `init resume` | `resume-work.md` | **MIXED** | Reads STATE.md correctly, but routing logic offers `/gsd:execute {phase}` and checks `.planning/phases/` for PLAN files. Needs v2 routing updates. |

**Missing commands (required by CMD-01):** `status`, `plan`, `review` — none of these exist as slash commands. The 11-command surface in CMD-01 includes them but they were never created.

---

## Workflow Inventory

| Workflow File | CLI Routes Called | v1/v2 Status | What Breaks |
|---|---|---|---|
| `framing-discovery.md` | `init framing-discovery <lens> <cap>` | **V2** | Resolves to capability, produces BRIEF.md at `.planning/capabilities/{slug}/BRIEF.md`. Correct. |
| `framing-pipeline.md` | None directly — delegates to stage workflows | **V1 PIPELINE** | Passes `CAPABILITY_SLUG` to all stages. Stage 1 research calls `research-workflow.md` with `capability_path` + `feature_path: null`. Stages 3-6 invoke `plan.md`, `execute.md`, `review.md`, `doc.md` — ALL of which call v1 init routes internally. Pipeline completion updates capability status, not feature status. No feature decomposition step. |
| `plan.md` | `init plan-phase "$PHASE"` | **V1** | Hardcoded v1 route. Route returns error message in current CLI (`init phase-op has been removed`). Plans written to `{phase_dir}`. Passes `phase_number` to planner, not `cap/feature`. |
| `execute.md` | `init execute-phase "${PHASE_ARG}"` | **V1** | Uses v1 route. Returns phase-dir paths. Calls `phase-plan-index` with phase number. `phase complete` marks phase done. Roadmap update uses `roadmap update-plan-progress`. All phase-scoped. |
| `execute-plan.md` | `init execute-phase "${PHASE}"` | **V1** | Same issue. Uses phase paths. Calls `state advance-plan`, `roadmap update-plan-progress`. |
| `review.md` | `init review-phase "${PHASE}" --raw` | **V1 BROKEN** | This route returns an error: `"init review-phase has been removed. Use v2 framing commands instead."` Review workflow cannot initialize. |
| `doc.md` | `init doc-phase "${PHASE}" --raw` | **V1 BROKEN** | This route returns an error: `"init doc-phase has been removed. Use v2 framing commands instead."` Doc workflow cannot initialize. |
| `research-workflow.md` | None (delegates to gather-synthesize pattern) | **V2** | Accepts `capability_path` and `feature_path` as optional inputs. Already framing-aware. Works correctly when called from framing-pipeline. |
| `gather-synthesize.md` | None (pattern only) | **V2** | Pure orchestration pattern. No CLI calls. Fully v2. |
| `init-project.md` | `init project`, `capability-create`, `commit` | **V2** | Handles detect/branch/converge. Missing: does not write STATE.md or ROADMAP.md (B2 blocker). |
| `discuss-capability.md` | `init discuss-capability`, `capability-list`, `commit` | **V2** | Writes to `.documentation/capabilities/{slug}.md`. Works. |
| `discuss-feature.md` | `init discuss-feature`, `commit` | **V2** | Writes to `.planning/capabilities/{cap}/features/{feat}/`. Works. |
| `resume-work.md` | `init resume` | **MIXED** | Checks `.planning/phases/` for PLAN/SUMMARY files. Routes to `/gsd:execute {phase}`. v2 projects have no phases dir — resume routing will fail to find work. |
| `progress.md` | `init progress`, `roadmap analyze`, `state-snapshot`, `summary-extract`, `progress bar` | **MIXED** | `init progress` scans `.planning/phases/` — returns empty for v2 projects. Route B references CONTEXT.md in phase dir. Route A references PLAN/SUMMARY in phase dir. |

---

## Agent Inventory

| Agent | Input Expectations | Output | v1/v2 Assumptions |
|---|---|---|---|
| `gsd-planner.md` | `<files_to_read>` block with STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT.md at `{feature_dir}/CONTEXT.md` or `{phase_dir}/{nn}-CONTEXT.md`, RESEARCH.md at same. | PLAN.md files at `{feature_dir}/{nn}-PLAN.md` or `{phase_dir}/{nn}-PLAN.md` | **V2-AWARE** — artifact_contract documents both feature_dir and phase_dir paths. PLAN.md frontmatter uses `phase` field (v1 label). Planner expects REQUIREMENTS.md at `.planning/REQUIREMENTS.md` (top-level) — in v2 model, requirements live in FEATURE.md (3-layer EU/FN/TC). Mismatch. |
| `gsd-executor.md` | PLAN.md, STATE.md, config.json, CLAUDE.md | Per-task commits, SUMMARY.md, STATE.md updates | **MIXED** — artifact_contract lists both `{feature_dir}/{nn}-PLAN.md` and `{phase_dir}/{nn}-PLAN.md`. Uses `gsd-tools state advance-plan`, `roadmap update-plan-progress` — both phase-scoped. SUMMARY.md written to feature_dir if PLAN is there, but STATE/ROADMAP updates assume phase structure. |
| `gsd-plan-checker.md` | Plans, ROADMAP, REQUIREMENTS, CONTEXT, RESEARCH | VERIFICATION PASSED or ISSUES FOUND | **MIXED** — reads phase goal from ROADMAP (v1 concept). Needs to validate against FEATURE.md requirements in v2. |
| `gsd-verifier.md` | Phase dir, phase goal from ROADMAP.md, phase_req_ids | VERIFICATION.md | **V1** — verifies against phase goal and ROADMAP-sourced requirement IDs. In v2, should verify against FEATURE.md 3-layer requirements. |
| `gsd-doc-writer.md` | Phase artifacts, SUMMARY files, .documentation/ gate docs | Module docs, flow docs | **MIXED** — reads phase SUMMARY files. Writes to `.documentation/modules/` and `.documentation/flows/`. Doc output paths are v2. Input discovery is v1. |
| `gsd-research-domain.md` | Subject, context payload (PROJECT, STATE, ROADMAP, optionally CAPABILITY.md, FEATURE.md, brief) | `{output_dir}/research/domain-truth-findings.md` | **V2** — already accepts optional capability/feature context. Framing-aware. |
| `gsd-research-system.md` | Same as domain | `existing-system-findings.md` | **V2** |
| `gsd-research-intent.md` | Same as domain | `user-intent-findings.md` | **V2** |
| `gsd-research-tech.md` | Same as domain | `tech-constraints-findings.md` | **V2** |
| `gsd-research-edges.md` | Same as domain | `edge-cases-findings.md` | **V2** |
| `gsd-research-prior-art.md` | Same as domain | `prior-art-findings.md` | **V2** |
| `gsd-research-synthesizer.md` | 6 gatherer output files + manifest | `{output_dir}/RESEARCH.md` | **V2** |
| `gsd-review-enduser.md` | Context payload + key files list | `{phase_dir}/review/enduser-trace.md` | **V1 output path** — writes to phase_dir/review/. In v2 should write to feature_dir/review/. |
| `gsd-review-functional.md` | Same | `functional-trace.md` | **V1 output path** |
| `gsd-review-technical.md` | Same | `technical-trace.md` | **V1 output path** |
| `gsd-review-quality.md` | Same | `quality-trace.md` | **V1 output path** |
| `gsd-review-synthesizer.md` | 4 trace files | `{phase_dir}/review/synthesis.md` | **V1 output path** |

---

## CLI Route Map

### init routes (compound context bootstrapping)

| Route | Args | Returns | v1/v2 Status |
|---|---|---|---|
| `init execute-phase <phase>` | phase number | phase_dir, plans[], executor_model, verifier_model, phase_req_ids, branch_name | **V1** — phase-scoped. Called by `execute.md` and `execute-plan.md`. Still functional. |
| `init plan-phase` | (removed) | ERROR: "init phase-op has been removed" | **DEAD** — returns error. Called by `plan.md`. Plan workflow broken. |
| `init review-phase` | (removed) | ERROR: "init review-phase has been removed" | **DEAD** — returns error. Called by `review.md`. Review workflow broken. |
| `init doc-phase` | (removed) | ERROR: "init doc-phase has been removed" | **DEAD** — returns error. Called by `doc.md`. Doc workflow broken. |
| `init project` | none | detected_mode, code_exists, partial_run, planning_exists | **V2** — used by `init-project.md`. |
| `init framing-discovery <lens> [cap]` | lens, optional cap slug | lens, mvu_slots, anchor_questions_path, capability_list, brief_path, commit_docs | **V2** — used by all 4 framing commands. |
| `init discuss-capability` | none | capability_list, documentation_dir, capabilities_dir | **V2** — used by `discuss-capability.md`. |
| `init discuss-feature` | none | capability_list, feature_list (flattened), capabilities_dir | **V2** — used by `discuss-feature.md`. |
| `init resume` | none | state_exists, has_interrupted_agent, planning_exists | **V2** — used by `resume-work.md`. |
| `init progress` | none | phases[] (scans .planning/phases/), current_phase, next_phase | **V1 data** — scans phases dir. Returns empty for v2 projects. Used by `progress.md`. |
| `init plan-feature <cap> <feat>` | cap slug, feat slug | capability_dir, feature_dir, has_research, has_plans, plans[], planner_model, checker_model | **V2 READY** — exists, not called by any workflow. |
| `init execute-feature <cap> <feat>` | cap slug, feat slug | capability_dir, feature_dir, plans[], executor_model, verifier_model | **V2 READY** — exists, not called by any workflow. |
| `init feature-op <cap> <feat> <op>` | cap slug, feat slug, operation | capability_dir, feature_dir, has_research, has_plans, brave_search | **V2 READY** — exists, not called by any workflow. |
| `init feature-progress` | none | capabilities[] with nested features[], plan/summary counts | **V2 READY** — exists, not called by any workflow. |

### Other routes (abbreviated — all functional)

| Route | Used By | Status |
|---|---|---|
| `capability-create <name>` | `init-project.md`, `discuss-capability.md` | **V2** |
| `capability-list` | `discuss-capability.md`, `framing-discovery.md` | **V2** |
| `capability-status <slug>` | Not called by any workflow | **V2** |
| `feature-create <cap> <feat>` | Not called by any workflow | **V2** |
| `feature-list [cap]` | Not called by any workflow | **V2** |
| `feature-status <cap> <feat>` | Not called by any workflow | **V2** |
| `state advance-plan` | `execute-plan.md` | **V1 concept** — advances plan counter in phase-scoped STATE.md |
| `state add-decision / add-blocker / record-session` | `execute-plan.md` | **V2 compatible** — writes to STATE.md directly |
| `roadmap update-plan-progress <N>` | `execute-plan.md`, `execute.md` | **V1** — scans phase dir for PLAN/SUMMARY counts. In v2, feature dir serves this role. |
| `roadmap analyze` | `progress.md` | **V1** — analyzes .planning/phases/ dirs |
| `roadmap get-phase <N>` | `plan.md` | **V1** — looks up phase by number |
| `phase complete <N>` | `execute.md` | **V1** — marks phase done in ROADMAP.md |
| `phase-plan-index <N>` | `execute.md` | **V1** — indexes plans in phase dir by wave |
| `plan-validate <req-source> <plan-files>` | `plan.md` | **MIXED** — validates REQ IDs. req-source can be FEATURE.md or REQUIREMENTS.md (the logic already handles both) |
| `commit <msg> --files` | All workflows | **V2** |
| `template fill <type>` | Various | **MIXED** — templates are v2 aware |

---

## framing-pipeline.md Data Flow

```
/gsd:new <slug>
    |
    v
commands/gsd/new.md
  - sets LENS=new
  - resolves CAPABILITY_SLUG from $ARGUMENTS
    |
    v
workflows/framing-discovery.md
  - INIT: "gsd-tools init framing-discovery new <cap>"
    -> returns: anchor_questions_path, mvu_slots, capability_list, brief_path
  - Fuzzy resolve cap slug
  - Status check (CAPABILITY.md frontmatter)
  - Scaffold BRIEF.md at .planning/capabilities/{slug}/BRIEF.md
  - Q&A loop with MVU tracking
  - Write completed BRIEF.md
    |
    | passes: BRIEF_PATH, LENS, CAPABILITY_SLUG, CAPABILITY_NAME
    v
workflows/framing-pipeline.md
  - Read brief, extract completion signal
  - Set LENS_METADATA from framing-lenses.md
  - Display banner: "6 stages: research -> requirements -> plan -> execute -> review -> reflect"

  STAGE 1: Research
    - Calls research-workflow.md
    - Passes: subject=CAPABILITY_NAME, capability_path=.planning/capabilities/{slug}/CAPABILITY.md,
              feature_path=null, output_dir=.planning/capabilities/{slug}
    - Spawns 6 gatherers in parallel
    - Produces: .planning/capabilities/{slug}/RESEARCH.md       [V2 PATH - CORRECT]

  STAGE 2: Requirements
    - Generates inline from brief
    - Writes to .planning/capabilities/{slug}/REQUIREMENTS.md   [V2 PATH - CORRECT]
    - User review Q&A

  STAGE 3: Plan
    - Calls @plan.md
    - plan.md calls: "gsd-tools init plan-phase" ← BROKEN (route removed)
    - If plan-phase worked, would set phase_dir to .planning/phases/... ← WRONG PATH
    - Plans written to phase dir, not .planning/capabilities/{slug}/ ← WRONG
    - Planner told "Phase X" not "Feature Y of Cap Z" ← WRONG CONTEXT

  STAGE 4: Execute
    - Calls @execute.md
    - execute.md calls: "gsd-tools init execute-phase ${PHASE_ARG}" ← V1 ROUTE
    - Works (route still functional), but uses phase paths
    - spawn gsd-executor with phase_dir context ← WRONG DIR

  STAGE 5: Review
    - Calls @review.md
    - review.md calls: "gsd-tools init review-phase" ← BROKEN (route removed, returns error)
    - REVIEW STAGE COMPLETELY BROKEN

  STAGE 6: Reflect (Doc)
    - Calls @doc.md
    - doc.md calls: "gsd-tools init doc-phase" ← BROKEN (route removed, returns error)
    - DOC STAGE COMPLETELY BROKEN

    |
    v
  Pipeline completion
    - Updates capability status to "complete"   ← needs feature-level tracking instead
```

### Where the pipeline breaks (B1 blocker)

```
WORKING:
  /gsd:new|debug|enhance|refactor  ->  framing-discovery  ->  framing-pipeline init
  framing-pipeline Stage 1 (research)    -> V2 paths, works
  framing-pipeline Stage 2 (requirements) -> V2 paths, works

BROKEN:
  framing-pipeline Stage 3 (plan)         -> calls init plan-phase -> ERROR
  framing-pipeline Stage 4 (execute)      -> calls init execute-phase -> V1 paths
  framing-pipeline Stage 5 (review)       -> calls init review-phase -> ERROR
  framing-pipeline Stage 6 (doc/reflect)  -> calls init doc-phase -> ERROR

MISSING:
  Capability -> feature decomposition (B3 blocker)
  STATE.md + ROADMAP.md creation in init (B2 blocker)
  /gsd:plan, /gsd:review, /gsd:status commands (CMD-01)
  Capability orchestrator (thin wrapper that runs pipeline per feature)
```

---

## What's V2-Ready, What Needs Rewiring, What's Missing

### V2-Ready (no changes needed)

| Artifact | Why |
|---|---|
| `commands/gsd/init.md` | Calls v2 init-project workflow correctly |
| `commands/gsd/debug|new|enhance|refactor.md` | Correct v2 framing entry points |
| `commands/gsd/discuss-capability.md` | Correct v2 workflow calls |
| `commands/gsd/discuss-feature.md` | Correct v2 workflow calls |
| `workflows/framing-discovery.md` | Full v2 capability resolution + brief production |
| `workflows/init-project.md` | Full detect/branch/converge (minus STATE/ROADMAP creation) |
| `workflows/discuss-capability.md` | Correct v2 capability paths |
| `workflows/discuss-feature.md` | Correct v2 feature paths |
| `workflows/research-workflow.md` | Already accepts cap/feature context, framing-aware |
| `workflows/gather-synthesize.md` | Pure pattern, no path assumptions |
| `agents/gsd-research-*.md` (all 6 + synthesizer) | Accept cap/feature context, fully v2 |
| `bin/lib/init.cjs` `cmdInitPlanFeature` | V2 route exists, ready to be called |
| `bin/lib/init.cjs` `cmdInitExecuteFeature` | V2 route exists, ready to be called |
| `bin/lib/init.cjs` `cmdInitFeatureOp` | V2 route exists, ready to be called |
| `bin/lib/init.cjs` `cmdInitFeatureProgress` | V2 route exists, ready to be called |

### Needs Rewiring (existing files need changes)

| Artifact | What to Change | Complexity |
|---|---|---|
| `workflows/plan.md` | Replace `init plan-phase` with `init plan-feature <cap> <feat>`. Replace phase_dir paths with feature_dir paths. Replace ROADMAP phase lookup with FEATURE.md reading. Replace `--prd` path-build with feature dir. Update planner context block (feature not phase). | Medium |
| `workflows/execute.md` | Replace `init execute-phase` with `init execute-feature <cap> <feat>`. Replace `phase-plan-index` with feature-dir equivalent. Replace `phase complete` with feature status update. Replace `roadmap update-plan-progress` with feature tracking. | Medium |
| `workflows/execute-plan.md` | Replace `init execute-phase` with feature-scoped equivalent. Update STATE update calls to track feature not phase. Update `roadmap update-plan-progress` for feature context. | Medium |
| `workflows/review.md` | Full rewrite of init call. Replace `init review-phase` with `init feature-op <cap> <feat> review`. Update all phase_dir references to feature_dir. Update output paths for trace files. | Medium |
| `workflows/doc.md` | Full rewrite of init call. Replace `init doc-phase` with `init feature-op <cap> <feat> doc`. Update phase_dir references. Output paths (.documentation/) are already v2. | Medium |
| `workflows/framing-pipeline.md` | Add Stage 0 (capability → feature decomposition). Pass feature slug alongside cap slug to all stages. Update completion to track feature status. Decide: pipeline runs per capability (orchestrating features) or per feature directly. Per CONTEXT.md decision: pipeline runs per feature, capability orchestrator is a thin wrapper that calls pipeline per feature. | Medium |
| `workflows/progress.md` | Replace `init progress` (phase-scanning) with `init feature-progress`. Rewrite route logic to navigate capabilities/features instead of phases. | Medium |
| `workflows/resume-work.md` | Update check_incomplete_work to scan feature dirs for PLAN without SUMMARY. Update routing to offer `/gsd:plan <cap/feat>` not `/gsd:execute <phase>`. | Small |
| `agents/gsd-planner.md` | Update artifact_contract: reads FEATURE.md for requirements (EU/FN/TC), not top-level REQUIREMENTS.md. PLAN.md written to feature_dir. | Small |
| `agents/gsd-executor.md` | Update STATE update calls to be feature-scoped. STATE.md tracks active cap/feature. | Small |
| `agents/gsd-verifier.md` | Update to read FEATURE.md 3-layer requirements instead of phase REQUIREMENTS.md. Produce VERIFICATION.md in feature_dir. | Small |
| `agents/gsd-plan-checker.md` | Read FEATURE.md requirements instead of phase-level REQUIREMENTS.md for validation. | Small |
| `agents/gsd-doc-writer.md` | Input: feature SUMMARY files (already reads whatever is passed). Output: .documentation/ structure (already v2). Update to receive feature context not phase context. | Small |
| `agents/gsd-review-*.md` (4 reviewers) | Output path: feature_dir/review/ instead of phase_dir/review/. | Small |

### Missing Entirely (must be created)

| Missing Artifact | Purpose | How to Build |
|---|---|---|
| Capability orchestrator workflow | Reads CAPABILITY.md feature list, calls framing-pipeline per feature in priority order | New workflow file. Thin. Follows same pattern as execute.md wave orchestration but for features. |
| STATE.md + ROADMAP.md bootstrap in init | B2 blocker. init-project.md never creates these. | Add Step 3f to new-project flow and Step 4g to existing-project flow in `init-project.md`. Write STATE.md with active_capability, active_feature fields. Write simplified ROADMAP.md (focus group model per CONTEXT.md). |
| `/gsd:plan` command | CMD-01 requires it. User entry point to plan a capability or feature directly (after-start flow). | New command file. Calls plan.md with cap/feat context. 3-tier slug resolution. |
| `/gsd:review` command | CMD-01 requires it. | New command file. Calls review.md with cap/feat context. |
| `/gsd:status` command | CMD-01 requires it. Status of capabilities/features. | New command file. Calls feature-progress or discuss-capability listing. |
| Slug resolution logic (3-tier) | Per CONTEXT.md: exact match -> wildcard -> LLM interpret. Currently framing-discovery.md does only 1+2 tier for capabilities only. | Extend framing-discovery step 2 to handle feature slugs. Extract as reusable pattern. Also needed in new `/gsd:plan` and `/gsd:review` commands. |
| Focus group model in STATE.md | CONTEXT.md: STATE.md tracks active focus group, active capability + feature. ROADMAP.md simplified. | New fields in STATE.md template. `/gsd:focus` command. |
| Capability decomposition step in framing-pipeline | Before plan stage, if pipeline is given a capability (not a feature), decompose to features and plan each. | Insert as Stage 0 in framing-pipeline.md or in the capability orchestrator. |
| `init feature-progress` used by progress.md | The route exists but progress.md doesn't call it | Wire progress.md to call `init feature-progress` instead of `init progress` |

---

## V1 Remnants in Workflows (terminology / dead references)

| Location | V1 Reference | What to Replace With |
|---|---|---|
| `plan.md` Step 1 | `init plan-phase "$PHASE"` | `init plan-feature <cap> <feat>` |
| `plan.md` Step 2 | "phase number", "--prd", phase_dir | "feature slug", feature_dir |
| `plan.md` Step 3 | `roadmap get-phase "${PHASE}"` | Read FEATURE.md directly |
| `plan.md` Step 8 | "Phase {phase_number}" in planner prompt | "Feature {feat_slug} of capability {cap_slug}" |
| `plan.md` Step 14 | "Execute Phase ${PHASE}" | "Execute Feature {feat}" |
| `plan.md` throughout | "phase" / "PHASE" variables | "feature" / "FEATURE" + "capability" / "CAPABILITY" |
| `execute.md` Step init | `init execute-phase "${PHASE_ARG}"` | `init execute-feature <cap> <feat>` |
| `execute.md` Step discover | `phase-plan-index "${PHASE_NUMBER}"` | feature-dir PLAN file scan |
| `execute.md` Step verify_phase_goal | "Phase goal from ROADMAP.md" | Feature goal from FEATURE.md |
| `execute.md` Step update_roadmap | `phase complete "${PHASE_NUMBER}"` | feature status update |
| `execute-plan.md` Step init | `init execute-phase "${PHASE}"` | `init execute-feature <cap> <feat>` |
| `execute-plan.md` Step update_current_position | `state advance-plan` | feature-scoped tracking |
| `execute-plan.md` Step update_roadmap | `roadmap update-plan-progress "${PHASE}"` | feature status update |
| `review.md` Step 1 | `init review-phase "${PHASE}"` | `init feature-op <cap> <feat> review` |
| `review.md` throughout | phase_dir, `${PHASE}` | feature_dir, cap/feat slugs |
| `doc.md` Step 1 | `init doc-phase "${PHASE}"` | `init feature-op <cap> <feat> doc` |
| `doc.md` throughout | phase_dir | feature_dir |
| `progress.md` | `init progress` + `.planning/phases/` scanning | `init feature-progress` + cap/feature traversal |
| `resume-work.md` | `ls .planning/phases/*/.continue-here*.md` | `ls .planning/capabilities/*/*/features/*/.continue-here*.md` |
| `resume-work.md` | `/gsd:execute {phase}` routing | `/gsd:plan <feature>` / `/gsd:execute-feature` routing |

---

## Key Insight: The CLI is Already V2-Ready

The most important finding: `init plan-feature`, `init execute-feature`, `init feature-op`, and `init feature-progress` ALL EXIST in `bin/lib/init.cjs` and return the right data shapes. They just aren't called by anything yet.

The work is entirely in the workflow files and a few agent files. No CLI changes required for the core wiring. The v2 routes return:

```
init plan-feature <cap> <feat>:
  -> capability_dir: .planning/capabilities/<cap>
  -> feature_dir: .planning/capabilities/<cap>/features/<feat>
  -> has_research, has_plans, has_context, plans[], planner_model, checker_model

init execute-feature <cap> <feat>:
  -> capability_dir, feature_dir
  -> plans[], incomplete_plans[], plan_count
  -> executor_model, verifier_model

init feature-op <cap> <feat> <op>:
  -> capability_dir, feature_dir
  -> has_research, has_context, has_plans, brave_search
  -> context_path, research_path (if exist)
```

The plan: point each broken workflow at its v2 route and replace phase_dir with feature_dir throughout.

---

## Sources

All findings based on direct file reads (2026-03-01):

- `/Users/philliphall/get-shit-done-pe/commands/gsd/*.md` — all 9 command files
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/*.md` — all 11 workflow files
- `/Users/philliphall/get-shit-done-pe/agents/gsd-*.md` — all 17 agent files
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` — router
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs` — all init handlers
- `.planning/phases/12-workflow-optimization-wiring/12-CONTEXT.md` — Phase 12 decisions
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`

**Confidence:** HIGH. Every claim above traced to a specific line in a specific file. No inference from training data.
