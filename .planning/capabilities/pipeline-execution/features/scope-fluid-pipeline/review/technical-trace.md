# Technical Trace Report: scope-fluid-pipeline

**Reviewer:** gsd-review-technical
**Subject:** pipeline-execution/scope-fluid-pipeline
**Lens:** refactor
**Date:** 2026-03-05

---

## Phase 1: Internalize Requirements

| TC ID | Requirement | Key Technical Expectation |
|-------|-------------|---------------------------|
| TC-01 | Delete capability-orchestrator.md | File deleted; DAG logic preserved in framing-pipeline.md |
| TC-02 | Delete research-workflow.md | File deleted; research owned by plan.md with 6 gatherers + synthesizer |
| TC-03 | Remove framing-pipeline Stage 2 (requirements generation) | No requirements auto-generation stage; pipeline receives pre-written requirements |
| TC-04 | Remove per-feature review/doc loops | Review and doc run once at execution scope, not per-feature |
| TC-05 | Relax review/doc command scope constraints | /gsd:review and /gsd:doc accept both capability and feature scope |
| TC-06 | No net line increase | Total lines across modified files must not increase |
| TC-07 | CLI smoke test pass | All CLI routes return valid JSON, no crashes |
| TC-08 | Correct role-to-model mapping | ROLE_MODEL_MAP alignment: executor->sonnet, judge->inherit, quick->haiku |

---

## Phase 2: Trace Against Code

### TC-01: Delete capability-orchestrator.md

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/capability-orchestrator.md` -- file does not exist on disk (confirmed via `ls`, returns "No such file or directory")
- `get-shit-done/workflows/framing-pipeline.md:82-132` -- `## 2. Capability-Scope Branch (DAG Wave Orchestration)` section contains DAG logic: feature DAG construction from CAPABILITY.md features table (Section 2a), cycle detection with AskUserQuestion resolution (Section 2b), topological sort into waves (Section 2c), and wave-ordered plan+execute per feature (Section 2d)
- `get-shit-done/workflows/framing-pipeline.md:99-107` -- Cycle detection: `"If a cycle is found ... Display: 'Circular dependency detected: A -> B -> A' ... Use AskUserQuestion"` -- preserves the cycle detection and user resolution pattern
- No orphaned references in live source files: `commands/`, `get-shit-done/`, `agents/` directories contain zero matches for "capability-orchestrator"
- Reasoning: DAG wave ordering, cycle detection, and user resolution are all present in framing-pipeline.md Section 2. Deletion is complete with no orphaned references in live files.

**Spec-vs-reality gap:** None.

**Cross-layer observations:** `.documentation/` files (scope-aware-routing.md, framing-pipeline-workflow.md, doc-writer-overhaul module) still reference "capability-orchestrator.md". These are generated docs from previous features, not live source. They will be stale until the doc stage runs for this feature or a future cleanup.

---

### TC-02: Delete research-workflow.md

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/research-workflow.md` -- file does not exist on disk (confirmed via `ls`, returns "No such file or directory")
- `get-shit-done/workflows/plan.md:58-158` -- Step 5 "Handle Research" contains the full 6-gatherer + 1-synthesizer pattern: domain-truth, existing-system, user-intent, tech-constraints, edge-cases, prior-art gatherers spawned via parallel Task() calls, then synthesizer Task() call
- `get-shit-done/workflows/plan.md:91-134` -- All 6 gatherers use `model="sonnet"`, synthesizer at line 156 uses `model="inherit"` -- consistent with gather-synthesize pattern
- `get-shit-done/workflows/plan.md:64-74` -- Lens-aware reuse check for RESEARCH.md preserved
- No orphaned references in live source files: `commands/`, `get-shit-done/`, `agents/` directories contain zero matches for "research-workflow"
- Reasoning: 6 parallel gatherers + synthesizer pattern is fully preserved inside plan.md Step 5. RESEARCH.md output format is maintained via synthesizer prompt.

**Spec-vs-reality gap:** None.

**Cross-layer observations:** `.documentation/modules/research-workflow.md` and `.documentation/modules/plan-workflow.md` still reference "research-workflow.md". Same stale-docs observation as TC-01.

---

### TC-03: Remove framing-pipeline Stage 2 (requirements generation)

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:1-2` -- Purpose statement: `"Pipeline stages: plan -> execute -> review -> doc"` -- 4 stages, no requirements generation stage
- `get-shit-done/workflows/framing-pipeline.md:72` -- `"Running 4 stages: plan -> execute -> review -> doc"`
- `get-shit-done/workflows/framing-pipeline.md:140-168` -- Stage 1 is Plan (Section 3); no "Stage 2: Requirements" section exists between Stage 1 (Plan) and Stage 2 (Execute at Section 4)
- `get-shit-done/workflows/framing-pipeline.md:436` -- `"Requirements come from discuss-feature upstream. Pipeline receives pre-written requirements in FEATURE.md."`
- No grep match for "requirements.*generation" or "auto-generat.*requirements" in framing-pipeline.md
- Reasoning: The pipeline has exactly 4 stages. Requirements generation is explicitly documented as coming from upstream discussion, not auto-generated within the pipeline.

**Spec-vs-reality gap:** None.

---

### TC-04: Remove per-feature review/doc loops

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:129-132` -- Capability scope: `"After ALL waves complete: ... Run Stage 3 (Review) ONCE for the full capability scope ... Run Stage 4 (Doc) ONCE for the full capability scope"`
- `get-shit-done/workflows/framing-pipeline.md:117-128` -- Section 2d executes plan+execute per feature in wave order, then review+doc runs once
- `get-shit-done/workflows/framing-pipeline.md:433` -- Key constraint: `"4 stages: plan -> execute -> review -> doc. Review and doc run once per execution scope."`
- `get-shit-done/workflows/review.md:43-56` -- Step 3 "Locate Artifacts (Scope-Fluid)" handles both feature scope and capability scope, with capability scope scanning all feature directories and building combined artifact list
- `get-shit-done/workflows/doc.md:43-55` -- Same scope-fluid pattern in doc workflow
- Reasoning: Per-feature review/doc loops are eliminated. Both review.md and doc.md handle multi-feature artifact lists natively for capability scope.

**Spec-vs-reality gap:** None.

---

### TC-05: Relax review/doc command scope constraints

**Verdict:** met

**Evidence:**
- `commands/gsd/review.md:34` -- `slug-resolve "$ARGUMENTS"` with no `--type` flag (previously had `--type feature`)
- `commands/gsd/review.md:27` -- Context note: `"Context resolved via gsd-tools slug-resolve (no type hint -- accepts both scopes)."`
- `commands/gsd/review.md:45-47` -- Handles `type is "capability"` with Step 4 (capability-level invocation)
- `commands/gsd/review.md:66-83` -- Step 4 reads CAPABILITY.md features table, filters by SUMMARY.md presence, invokes review.md with `FEATURE_SLUG=null`
- `commands/gsd/doc.md:37-40` -- slug-resolve without `--type` constraint
- `commands/gsd/doc.md:52-53` -- Handles `type is "capability"` with Step 6 (capability-level invocation)
- `get-shit-done/workflows/review.md:14` -- Inputs include `SCOPE: Derived -- "feature" if FEATURE_SLUG provided, "capability" if null/empty`
- `get-shit-done/workflows/doc.md:14` -- Same scope derivation
- Reasoning: Both review and doc commands accept capability scope via slug-resolve without type constraint. The workflows handle scope-fluid artifact collection.

**Spec-vs-reality gap:** None.

---

### TC-06: No net line increase

**Verdict:** met

**Evidence:**
- Verified line counts match 04-SUMMARY.md exactly:
  - `framing-pipeline.md`: 448 lines (confirmed via `wc -l`)
  - `progress.md`: 197 lines (confirmed)
  - `review.md` (workflow): 207 lines (confirmed)
  - `doc.md` (workflow): 220 lines (confirmed)
  - `execute.md`: 218 lines (confirmed)
  - `plan.md` (workflow): 390 lines (confirmed)
  - `review.md` (command): 92 lines (confirmed)
  - `doc.md` (command): 134 lines (confirmed)
  - All agent files match reported counts (confirmed via `wc -l`)
- `capability-orchestrator.md`: 0 lines (deleted, was 156)
- `research-workflow.md`: 0 lines (deleted, was 224)
- 04-SUMMARY.md reports: **-332 net line reduction** (3465 before -> 3133 after)
- Reasoning: Deletions of capability-orchestrator.md (-156) and research-workflow.md (-224) far outweigh additions in progress.md (+43), review.md workflow (+14), doc.md workflow (+16), review.md command (+19), and execute.md (+2). All individual file counts verified independently.

**Spec-vs-reality gap:** None.

---

### TC-07: CLI smoke test pass

**Verdict:** met

**Evidence:**
- `gsd-tools slug-resolve test` -- returns valid JSON: `{"resolved": true, "tier": 2, "type": "feature", ...}`
- `gsd-tools state-snapshot` -- returns valid JSON: `{"current_phase": null, ...}`
- `gsd-tools capability-list` -- returns valid JSON: `{"capabilities": [...]}`
- `gsd-tools feature-list` -- returns expected error for missing arg (not a crash): `"Error: capability slug required"`
- CLI usage output lists all expected routes: state, commit, verify, frontmatter, template, config-get, config-set, init, plan-validate, progress, roadmap, requirements, summary-extract, state-snapshot, slug-resolve, capability-create, capability-list, capability-status, feature-create, feature-list, feature-status
- 04-SUMMARY.md reports: "CLI smoke tests pass (slug-resolve, state-snapshot, capability-list, feature-list, roadmap analyze, etc.)"
- Reasoning: All tested CLI routes return valid JSON or expected error messages. No crashes or unhandled errors observed.

**Spec-vs-reality gap:** None.

---

### TC-08: Correct role-to-model mapping

**Verdict:** met

**Evidence:**

**ROLE_MODEL_MAP reference:**
- `get-shit-done/references/model-profile-resolution.md:10-14` -- `ROLE_MODEL_MAP = { executor: 'sonnet', judge: 'inherit', quick: 'haiku' }`

**Agent role_type values (all 18 agents verified):**

| Agent | role_type | Expected | Status |
|-------|-----------|----------|--------|
| gsd-planner.md | judge | judge | Fixed (was executor) |
| gsd-review-enduser.md | executor | executor | Fixed (was judge) |
| gsd-review-functional.md | executor | executor | Fixed (was judge) |
| gsd-review-technical.md | executor | executor | Fixed (was judge) |
| gsd-review-quality.md | executor | executor | Fixed (was judge) |
| gsd-review-synthesizer.md | judge | judge | Unchanged (correct) |
| gsd-executor.md | executor | executor | Unchanged (correct) |
| gsd-verifier.md | judge | judge | Unchanged (correct) |
| gsd-plan-checker.md | judge | judge | Unchanged (correct) |
| gsd-coherence-synthesizer.md | judge | judge | Unchanged (correct) |
| gsd-doc-writer.md | executor | executor | Unchanged (correct) |
| gsd-research-domain.md | executor | executor | Unchanged (correct) |
| gsd-research-system.md | executor | executor | Unchanged (correct) |
| gsd-research-intent.md | executor | executor | Unchanged (correct) |
| gsd-research-tech.md | executor | executor | Unchanged (correct) |
| gsd-research-edges.md | executor | executor | Unchanged (correct) |
| gsd-research-prior-art.md | executor | executor | Unchanged (correct) |
| gsd-research-synthesizer.md | judge | judge | Unchanged (correct) |

**Workflow Task() model= alignment:**
- `review.md:81,88,95,102` -- 4 reviewers: `model="sonnet"` (executor -> sonnet)
- `review.md:124` -- synthesizer: `model="inherit"` (judge -> inherit)
- `plan.md:97,104,111,118,125,132` -- 6 research gatherers: `model="sonnet"` (executor -> sonnet)
- `plan.md:156` -- research synthesizer: `model="inherit"` (judge -> inherit)
- `plan.md:217` -- planner: `model="{planner_model}"` (dynamic from init, maps to inherit for judge)
- `plan.md:327` -- plan-checker: `model="{checker_model}"` (dynamic from init)
- `doc.md:87,94,101,108,115` -- 5 doc explorers: `model="sonnet"` (executor -> sonnet)
- `doc.md:147` -- doc synthesizer: `model="inherit"` (judge -> inherit)
- `execute.md:65` -- executor: `model="{executor_model}"` (dynamic from init)
- `execute.md:168` -- verifier: `model="{verifier_model}"` (dynamic from init)

- Reasoning: All 5 role_type mismatches corrected (4 reviewers judge->executor, planner executor->judge). All static model= parameters in workflow Task() calls align with ROLE_MODEL_MAP. Dynamic model parameters (`{planner_model}`, `{checker_model}`, `{executor_model}`, `{verifier_model}`) are resolved by the CLI init command which reads the same ROLE_MODEL_MAP.

**Spec-vs-reality gap:** None.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | capability-orchestrator.md deleted; DAG logic in framing-pipeline.md:82-132; zero orphan refs in live source |
| TC-02 | met | research-workflow.md deleted; 6 gatherers + synthesizer in plan.md:58-158; zero orphan refs in live source |
| TC-03 | met | framing-pipeline.md has 4 stages (plan/execute/review/doc); no requirements generation stage; line 436 states requirements from upstream |
| TC-04 | met | framing-pipeline.md:129-132 runs review+doc ONCE per scope; review.md:43-56 and doc.md:43-55 handle scope-fluid artifact collection |
| TC-05 | met | review.md command:34 and doc.md command:37 use slug-resolve without --type constraint; both handle capability scope |
| TC-06 | met | -332 net lines; all 22 file counts independently verified via wc -l |
| TC-07 | met | slug-resolve, state-snapshot, capability-list return valid JSON; all routes listed in CLI usage |
| TC-08 | met | All 18 agents have correct role_type; all workflow Task() model= parameters align with ROLE_MODEL_MAP |

**Cross-layer observation (secondary):** `.documentation/` files from previous features contain stale references to deleted workflows (capability-orchestrator.md, research-workflow.md). These are not live source files and do not affect runtime behavior, but will produce incorrect documentation if referenced. The doc stage for this feature (or a future cleanup) should address these.
