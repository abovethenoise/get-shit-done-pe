# Quality Trace Report: scope-fluid-pipeline

**Reviewer:** gsd-universal-quality-reviewer
**Subject:** pipeline-execution/scope-fluid-pipeline
**Lens:** refactor
**Date:** 2026-03-05

---

## Phase 1: Quality Standards

Evaluating a markdown-based meta-prompting framework refactor (consolidation of 6 pipeline stages to 4, deletion of 2 workflow files, reference updates across 22 files) for:

- **Structural Parsimony (KISS/DRY):** Does the refactored structure reduce maintenance burden, not just move it?
- **Earned Abstractions:** Are new patterns justified by actual simplification?
- **Functional Integrity:** Do structural changes risk regressions (orphaned references, model mismatches)?
- **Robustness:** Are edge cases handled (context exhaustion, missing artifacts)?
- **TC-06 Compliance:** Net line reduction verified (hard constraint).

---

## Phase 2: Trace Against Code

### Finding 1: Duplicate "Human checkpoint" statement in doc stage

**Category:** Bloat

**Verdict:** not met (proven)

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:327` -- `**Human checkpoint within doc stage:** doc.md surfaces documentation changes for user confirmation before writing to .documentation/.`
- `get-shit-done/workflows/framing-pipeline.md:329` -- `**Human checkpoint within doc stage:** doc.md Q&A for documentation approval. This is the second and final human gate in the pipeline.`
- Reasoning: These two consecutive lines describe the same checkpoint. The first says "surfaces changes for user confirmation," the second says "Q&A for documentation approval." They are not two separate gates -- the Q&A IS the confirmation. This is redundant content that adds confusion about whether there are one or two checkpoints within doc.
- Context: The key_constraints section at line 440 clarifies there are exactly two human gates total (review Q&A + doc Q&A), confirming these are one gate described twice.

---

### Finding 2: Misplaced section numbering -- "2e" is a peer concept under "2"

**Category:** KISS

**Verdict:** not met (suspected)

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:134` -- `### 2e. Feature-Scope Branch (Linear Pipeline)`
- Reasoning: Section 2 is titled "Capability-Scope Branch (DAG Wave Orchestration)" and subsections 2a-2d describe capability-scope steps. Section 2e describes the feature-scope branch, which is the peer alternative to capability scope, not a sub-step of it. Nesting the feature path under the capability heading creates a misleading hierarchy. A model parsing this document could misinterpret feature-scope as a sub-step of capability-scope logic.
- Context: The inputs section (line 26-27) correctly treats scope as a top-level fork. The process section inconsistently nests one branch under the other.

---

### Finding 3: Four framing_context blocks with repeated boilerplate fields

**Category:** DRY

**Verdict:** met (justified)

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:150-165` -- Plan framing_context
- `get-shit-done/workflows/framing-pipeline.md:185-199` -- Execute framing_context
- `get-shit-done/workflows/framing-pipeline.md:235-256` -- Review framing_context
- `get-shit-done/workflows/framing-pipeline.md:305-324` -- Doc framing_context
- Reasoning: Each block repeats 7 identical header fields (Brief path, Primary lens, Secondary lens, Anchor questions, Capability, Feature, Feature dir) but carries stage-specific lens guidance unique to each stage. In a meta-prompting context where these are prompt templates passed to different downstream workflows, DRY extraction would require a templating layer that does not exist and would add complexity. The repetition is the simpler approach for prompt engineering. The FEATURE.md requirement FN-06 at line 164 says "Lens available from brief frontmatter, referenced where useful by stages, not force-injected as large context blocks" -- the current implementation does inject full context blocks, but each contains stage-specific guidance that justifies the block's existence.
- Context: This is a known DRY cost accepted in the prior research-overhaul documentation at `.documentation/modules/plan-workflow.md:81`.

---

### Finding 4: Orphaned references to deleted workflows in README and .documentation/

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `README.md:27` -- `all 4 lens commands now accept capability slugs and route to capability-orchestrator for fan-out`
- `.documentation/flows/pipeline-execution/scope-aware-routing.md:42-43` -- `invokes capability-orchestrator.md with CAPABILITY_SLUG and LENS`
- `.documentation/modules/pipeline-execution-scope-aware-routing.md:34` -- `Step 4: Invoke capability-orchestrator.md`
- `.documentation/modules/pipeline-execution-scope-aware-routing.md:61` -- `get-shit-done/workflows/capability-orchestrator.md -- receives CAPABILITY_SLUG`
- `.documentation/modules/research-workflow.md:11` -- `Located at get-shit-done/workflows/research-workflow.md`
- `.documentation/modules/framing-pipeline-workflow.md:13` -- `Stage 1 (Research) rewritten from @research-workflow.md delegation`
- Reasoning: The refactor plan (04-PLAN.md) scoped cleanup to `commands/`, `get-shit-done/`, `agents/`, and `templates/` directories. README.md and `.documentation/` were not scoped, leaving stale references to deleted files. While .documentation/ is generated content that would be updated by the doc stage, README.md is an authored file that now contains incorrect information about routing to a file that no longer exists. TC-06 scope says "zero references to deleted workflows in any live source file" but the enforcement grep only checked `commands/`, `get-shit-done/workflows/`, `get-shit-done/templates/`, and `agents/`.
- Context: FN-09 states "No orphaned references to deleted files." The README and .documentation/ references are orphaned.

---

### Finding 5: Agent role_type corrections verified correct

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `agents/gsd-review-enduser.md:5` -- `role_type: executor`
- `agents/gsd-review-functional.md:5` -- `role_type: executor`
- `agents/gsd-review-technical.md:5` -- `role_type: executor`
- `agents/gsd-review-quality.md:5` -- `role_type: executor`
- `agents/gsd-planner.md:6` -- `role_type: judge`
- `agents/gsd-review-synthesizer.md:5` -- `role_type: judge`
- `agents/gsd-research-synthesizer.md:5` -- `role_type: judge`
- Reasoning: All 18 agents now align with ROLE_MODEL_MAP (executor->sonnet, judge->inherit/Opus). The 4 reviewer agents do work (read code, produce trace files) and correctly map to executor/sonnet. The planner synthesizes research and makes architectural decisions, correctly mapping to judge/Opus. Synthesizers remain judge. This matches TC-08.
- Context: The workflow Task() calls in review.md use `model="sonnet"` for reviewers and `model="inherit"` for synthesizer, consistent with the role_type assignments.

---

### Finding 6: Zero orphaned references in live source directories

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- Grep for `capability-orchestrator` and `research-workflow` across `commands/`, `get-shit-done/`, `agents/` returned zero matches.
- Reasoning: All 7 command files, plan.md workflow, and structure.md template have been updated to reference `framing-pipeline.md` instead of deleted workflows. FN-09 requirement satisfied for the scoped directories.
- Context: The remaining references in README.md and .documentation/ are outside the scoped cleanup (see Finding 4).

---

### Finding 7: TC-06 net line reduction verified

**Category:** KISS

**Verdict:** met

**Evidence:**
- `04-SUMMARY.md:135` -- `**TOTAL** | **3465** | **3133** | **-332**`
- Actual line counts verified: framing-pipeline.md (448), progress.md (197), review.md (207), doc.md (220), execute.md (218), plan.md (390).
- Reasoning: The consolidation achieved a net reduction of 332 lines across 22 modified files. The two deleted files (capability-orchestrator.md at 156 lines, research-workflow.md at 224 lines) account for 380 lines of deletion, with 48 lines of net growth across remaining files. This satisfies TC-06's hard constraint that this is a consolidation, not expansion.
- Context: Growth files are progress.md (+43 for focus-aware routing), review.md (+14 for scope-fluid artifact collection), doc.md (+16 for scope-fluid artifact collection), execute.md (+2), review command (+19 for capability-scope routing).

---

### Finding 8: Scope-fluid artifact collection duplicated between framing-pipeline and workflows

**Category:** DRY

**Verdict:** met (justified)

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:223-225` -- `Scope-fluid artifact collection: Feature scope: SUMMARY.md and FEATURE.md from the single feature directory. Capability scope: SUMMARY.md and FEATURE.md from ALL feature directories.`
- `get-shit-done/workflows/review.md:43-56` -- `## 3. Locate Artifacts (Scope-Fluid)` with detailed feature/capability scope logic
- `get-shit-done/workflows/doc.md:42-55` -- `## 3. Locate Artifacts (Scope-Fluid)` with detailed feature/capability scope logic
- Reasoning: framing-pipeline.md describes the scope-fluid concept at orchestrator level (what artifacts to collect). review.md and doc.md implement the actual collection logic with scanning, deduplication, and ground-truth framing. The pipeline describes intent; the workflows describe implementation. This is appropriate separation of concerns, not duplication.

---

### Finding 9: Remediation loop in framing-pipeline vs review.md potential conflict

**Category:** Functional Integrity

**Verdict:** not met (suspected)

**Evidence:**
- `get-shit-done/workflows/framing-pipeline.md:264-280` -- Section 5a describes remediation loop: "Feed accepted findings to planner... Execute remediation plans... Re-review... REMEDIATION_COUNTER >= 2: stop"
- `get-shit-done/workflows/review.md:150-154` -- Step 9 describes re-review loop: "re_review_cycle < max_re_review_cycles (2)... re-spawn only affected reviewers... Always re-run synthesizer"
- Reasoning: Both files describe a remediation/re-review loop with a max of 2 cycles, but the logic differs. framing-pipeline.md describes a full plan+execute+re-review cycle (remediation plans created, executed, then re-reviewed). review.md describes re-spawning reviewers after fixes are made within the same review session. These could be complementary (review.md handles within-review iterations, framing-pipeline handles cross-stage remediation), but neither document references the other's loop. A model executing the pipeline could trigger both loops, resulting in up to 4 remediation cycles instead of the intended 2.
- Context: FN-03 specifies "Re-review at execution scope level (max 2 cycles)." If both loops fire, the max is exceeded.

---

### Finding 10: Progress workflow anti-pattern guard references dead code

**Category:** KISS

**Verdict:** met (not actionable)

**Evidence:**
- `get-shit-done/workflows/progress.md:101` -- `Parse ROADMAP.md directly for focus groups. Do NOT use focus_groups from init (dead code -- never populated).`
- Reasoning: The comment explicitly flags `focus_groups` from the init CLI call as dead code and instructs to parse ROADMAP.md directly. The comment is a workaround for a CLI output that returns unpopulated data. While the dead code exists in the CLI tool (not in scope of this refactor), the workflow correctly works around it. The comment prevents future regressions by explaining why direct ROADMAP.md parsing is used.
- Context: This is pre-existing behavior documented rather than introduced by this refactor.

---

## Summary

| Finding | Category | Verdict |
|---------|----------|---------|
| 1. Duplicate human checkpoint statement | Bloat | not met |
| 2. Misplaced section numbering (2e) | KISS | not met (suspected) |
| 3. Repeated framing_context boilerplate | DRY | met (justified) |
| 4. Orphaned refs in README/.documentation | DRY | not met |
| 5. Agent role_type corrections | Functional Integrity | met |
| 6. Zero orphaned refs in live source dirs | Functional Integrity | met |
| 7. TC-06 net line reduction | KISS | met |
| 8. Scope-fluid collection duplication | DRY | met (justified) |
| 9. Remediation loop dual definition | Functional Integrity | not met (suspected) |
| 10. Progress dead code comment | KISS | met |

**Overall:** 6 met, 2 not met (proven), 2 not met (suspected). The consolidation achieves its stated goal (line reduction, file deletion, reference cleanup in scoped directories). The proven issues are: (1) a duplicate statement in framing-pipeline.md and (2) orphaned references in README.md and .documentation/ that were excluded from the cleanup scope. The suspected issues warrant attention: section numbering hierarchy could mislead models, and the dual remediation loop definitions risk exceeding the intended max cycle count.
