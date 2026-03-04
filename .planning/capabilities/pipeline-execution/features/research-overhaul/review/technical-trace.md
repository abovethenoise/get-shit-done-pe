---
reviewer: gsd-review-technical
feature: pipeline-execution/research-overhaul
lens: enhance
date: 2026-03-04
---

# Technical Trace Report: research-overhaul

## Phase 1: Requirements Internalization

TC requirements in scope and their technical specs:

| ID | Spec Summary |
|----|-------------|
| TC-01 | Task() block structure for gatherer spawns: model="sonnet" for gatherers, model="inherit" for synthesizer, subagent_type matches registered names, all 7 calls in main context, file-based result checking |
| TC-02 | Double-research prevention: framing-pipeline writes RESEARCH.md with lens frontmatter; plan.md Step 5 lens-aware reuse check detects match and skips re-run |
| TC-03 | Skip gate removal: --skip-research deleted from workflow text, research_enabled config gate removed from plan.md, has_research binary check replaced by lens-aware logic (FN-03) |
| TC-04 | Audit classification criteria: Cat-1 = parallel spawn behind delegation (fix), Cat-2 = sequential handoff (document), Cat-3 = @ref inside Task() or required_reading (correct, no action) |
| TC-05 | Task() block structure for reviewer spawns: same pattern as TC-01; quality subagent_type="gsd-universal-quality-reviewer", agent file="agents/gsd-review-quality.md"; re-review uses same Task() blocks for affected dimensions only |

---

## Phase 2: Trace Against Code

### TC-01: Task() block structure for gatherer spawns

**Verdict:** met (proven)

**Evidence:**

plan.md Step 5 — 6 gatherer Task() blocks:

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:93-134` — All 6 gatherers present with explicit `Task()` calls. Each specifies `prompt`, `subagent_type`, `model`, `description`.
  - `model="sonnet"` confirmed for all 6: lines 96, 103, 110, 117, 124, 131.
  - `subagent_type` values: `"gsd-research-domain"`, `"gsd-research-system"`, `"gsd-research-intent"`, `"gsd-research-tech"`, `"gsd-research-edges"`, `"gsd-research-prior-art"` — all match registered agent files in `/Users/philliphall/.claude/agents/`.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:152-157` — Synthesizer Task() block:
  ```
  subagent_type="gsd-research-synthesizer",
  model="inherit",
  ```
  `model="inherit"` confirmed. `subagent_type="gsd-research-synthesizer"` confirmed.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:136-141` — File-based result checking after spawn:
  ```bash
  for f in domain-truth existing-system user-intent tech-constraints edge-cases prior-art; do
    test -f "${feature_dir}/research/${f}-findings.md" && test -s "${feature_dir}/research/${f}-findings.md" && echo "${f}: OK" || echo "${f}: FAILED"
  done
  ```
  Orchestrator uses `test -f` / `test -s` checks, not return values. Matches spec constraint.

- All 7 Task() calls (6 gatherers + 1 synthesizer) appear in the main workflow context (plan.md Step 5). No gatherer spawns subagents — they write to files and the orchestrator checks existence.

framing-pipeline.md Stage 2 (spawn block):

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:108-148` — Identical 6+1 Task() structure. Same `model="sonnet"` for gatherers, same `subagent_type` values, same file-based check at lines 152-155.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:167-172` — Synthesizer with `model="inherit"`, `subagent_type="gsd-research-synthesizer"`.

Reasoning: All TC-01 constraints satisfied in both callers. Model parameters, subagent_type names, call location (main context), and file-based result checking all match spec.

**Spec-vs-reality gap:** None.

---

### TC-02: Double-research prevention

**Verdict:** met (proven)

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:163-172` — framing-pipeline Stage 1 synthesizer Task() prompt includes:
  ```
  IMPORTANT: Begin RESEARCH.md with YAML frontmatter:
  ---
  lens: {LENS}
  secondary_lens: {SECONDARY_LENS or null}
  subject: {CAPABILITY_NAME}/{FEATURE_SLUG}
  date: {ISO date today}
  ---
  ```
  Stage 1 writes RESEARCH.md with lens frontmatter as required.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:57-73` — plan.md Step 5 lens-aware reuse check:
  ```
  If RESEARCH.md exists: Read its YAML frontmatter. Extract `lens` and `secondary_lens` fields.
  - If `lens` matches current `LENS` AND `secondary_lens` matches current `SECONDARY_LENS` (or both are absent/null): Reuse existing RESEARCH.md. Skip to Step 6.
  - If lens mismatch: Re-run research. Log reason: "Existing research used {frontmatter_lens}, current work uses {LENS}. Re-running."
  - If RESEARCH.md exists but has no frontmatter or no `lens` field: Treat as stale. Re-run research.
  ```
  Mechanism: if framing-pipeline Stage 1 wrote RESEARCH.md with matching lens, plan.md Step 5 detects the match and skips re-run. This satisfies double-research prevention.

- Edge case (lens pivot) per spec: if framing-pipeline pivots lens, RESEARCH.md frontmatter won't match, and plan.md correctly re-runs. This is handled by the mismatch branch at line 72.

Reasoning: The combination of framing-pipeline writing frontmatter (FN-04) and plan.md reading frontmatter (FN-03) creates the double-research prevention without any additional mechanism. Matches spec constraint exactly.

**Spec-vs-reality gap:** None.

---

### TC-03: Skip gate removal scope

**Verdict:** met (proven)

**Evidence:**

`--skip-research` removal:

- Grep of `skip.research|research_enabled|has_research` against plan.md returns only one match: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:166` — `"Do NOT offer "skip research" as an option."` This is the failure path instruction prohibiting skip, not a skip gate. No `--skip-research` flag exists in the workflow text.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:31` — `Extract flags: \`--research\`, \`--skip-verify\`.` The `--skip-research` flag is absent from parsed flags. Only `--research` and `--skip-verify` remain.

`research_enabled` gate removal:

- Grep of `research_enabled` against plan.md: zero matches. The config gate is not present in workflow text. Consistent with spec constraint that the config field may remain in config.json but the gate (conditional branch in plan.md) is removed.

`has_research` replacement:

- Grep of `has_research` against plan.md: zero matches. The binary check is gone. Replaced by the lens-aware frontmatter comparison logic in Step 5 (lines 63-73), which is FN-03 logic.

Reasoning: All three removal targets confirmed absent. The failure-path prohibition on "skip research" at line 166 is additive hardening, not a gate. TC-03 scope constraints are satisfied.

**Spec-vs-reality gap:** None. Spec noted that framing-pipeline.md had no skip gates — confirmed: grep of framing-pipeline.md for `skip.research|research_enabled|has_research` returns zero matches.

---

### TC-04: Workflow audit classification criteria

**Verdict:** met (proven)

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:259-303` — The `@workflow.md` audit is documented in the FEATURE.md Decisions section. Contains a Classification Table enumerating all instances with Category and Disposition.

- Classification criteria applied:
  - Cat-1 (parallel spawn = bug): 3 instances identified — plan.md line 60, framing-pipeline.md line 86, research-workflow.md line 152. All 3 have "FIX" dispositions referencing specific plan steps.
  - Cat-2 (sequential handoff = document): 7 instances identified — framing-pipeline.md lines 169/202/244/286, capability-orchestrator.md line 95, framing-discovery.md line 259, review.md line 120, init-project.md line 341. All marked "Document only."
  - Cat-3 (context reference = correct): 12+ instances in required_reading blocks and Task() prompt context. All marked "No action."

- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:263` — Header claims "17 instances (across 8 files)" but the classification table contains 22 rows (counting multi-reference rows like execute.md at 73-75 as 1 row). The 17 vs 22 discrepancy is a count artifact: the header counts unique `@reference` tokens (some rows have multiple references in one cell), the table rows count workflow locations.

Reasoning: The classification criteria from TC-04 are correctly applied — Cat-1/2/3 assignments in the table match the spec definitions. The count discrepancy in the header (17 vs 22 rows) does not affect classification correctness.

**Spec-vs-reality gap:** None on classification logic. Minor documentation inconsistency: header states "17 instances" but table has 22 rows. The discrepancy arises because some rows bundle multiple `@references` (e.g., execute.md row covers 3 file references; framing-pipeline.md required_reading row covers 3 files). This is a presentation inconsistency, not a logic error.

**Cross-layer observations:** TC-04 spec states the downstream output is "a Decisions entry in FEATURE.md." The implementation delivers this in the `@workflow.md Audit Results (FN-05, TC-04)` section of FEATURE.md rather than a `## Decisions` entry. The content is present and traceable; only the section placement differs from what "Decisions entry" implies.

---

### TC-05: Task() block structure for reviewer spawns

**Verdict:** met (proven)

**Evidence:**

Step 4 — 4 reviewer Task() blocks:

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:64-91` — All 4 reviewers present with explicit `Task()` calls. Each specifies `prompt`, `subagent_type`, `model`, `description`.
  - `model="sonnet"` for all 4 reviewers: lines 68, 75, 82, 89.
  - `subagent_type` values: `"gsd-review-enduser"`, `"gsd-review-functional"`, `"gsd-review-technical"`, `"gsd-universal-quality-reviewer"`.

- Quality reviewer subagent_type:
  - `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:87` — `subagent_type="gsd-universal-quality-reviewer"` — matches TC-05 constraint.
  - `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:86` — `prompt="First, read {GSD_ROOT}/agents/gsd-review-quality.md for your role.` — agent file `gsd-review-quality.md` confirmed to exist at `/Users/philliphall/.claude/agents/gsd-review-quality.md`. Name mismatch between subagent_type and file name is documented as expected in TC-05.

Step 6 — Synthesizer Task() block:

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:107-113` — Synthesizer block:
  ```
  subagent_type="gsd-review-synthesizer",
  model="inherit",
  ```
  `model="inherit"` confirmed. Matches TC-05 constraint for judge role.

Re-review loop (Step 9):

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:140` — `re-spawn only affected reviewers using the same Task() blocks from Step 4 (same prompt structure, same subagent_types). Always re-run synthesizer via Step 6 Task() block after affected reviewers complete.`
  Re-review uses same Task() blocks for affected dimensions only — matches TC-05 constraint.

`@gather-synthesize.md` delegation removal:

- TC-05 / FN-06 require removal of `@gather-synthesize.md` as a delegation target. The `required_reading` block at `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:6` still contains `@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md`. Per the audit table in FEATURE.md (line 282), this is classified as Cat-3 (context ref in required_reading = correct usage). The spec for FN-06 states "The `@gather-synthesize.md` required_reading reference is removed" but the audit classification says this specific instance is a correct Cat-3 usage. This is a contradiction between FN-06 prose and TC-04 classification output.

Reasoning: All Task() structural constraints from TC-05 are met. The `@gather-synthesize.md` required_reading retention is in tension with FN-06 prose but is consistent with TC-04's Cat-3 classification. TC-05 itself does not specify removal of the required_reading reference — only FN-06 does. TC-05 verdict is met. The FN-06 contradiction is flagged as a cross-layer observation.

**Spec-vs-reality gap:** The `@gather-synthesize.md` required_reading line persists in review.md at line 6. FN-06 says to remove it; TC-04 audit classifies it as Cat-3 (correct usage). The implementation follows the TC-04 audit classification over the FN-06 prose. The spec is internally inconsistent on this point.

**Cross-layer observations:** FN-06 states "The `@gather-synthesize.md` required_reading reference is removed." The TC-04 audit table classifies `review.md line 6 @gather-synthesize.md` as Cat-3 (correct usage, no action). These two requirements contradict. The implementation kept the required_reading (consistent with TC-04 classification). FN reviewer should evaluate whether this is an acceptable resolution.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | plan.md:93-134 — 6 gatherer Task() blocks, model="sonnet"; plan.md:154-156 — synthesizer model="inherit"; plan.md:136-141 — file-based checks |
| TC-02 | met | framing-pipeline.md:163-172 — synthesizer writes lens frontmatter; plan.md:57-73 — lens-aware reuse check reuses matching RESEARCH.md |
| TC-03 | met | plan.md:31 — --skip-research absent from flag list; plan.md grep — research_enabled/has_research zero matches; plan.md:166 — skip not offered as failure option |
| TC-04 | met | FEATURE.md:259-303 — audit table with 22 rows, 3 Cat-1 (fixed), 7 Cat-2 (documented), 12+ Cat-3 (no action); classification criteria match spec definitions |
| TC-05 | met | review.md:64-91 — 4 reviewer Task() blocks, model="sonnet"; review.md:87 — subagent_type="gsd-universal-quality-reviewer"; review.md:107-113 — synthesizer model="inherit"; review.md:140 — re-review uses same Task() blocks |
