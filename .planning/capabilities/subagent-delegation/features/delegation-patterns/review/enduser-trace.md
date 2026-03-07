# End-User Trace Report: delegation-patterns

**Feature:** subagent-delegation/delegation-patterns
**Lens:** enhance
**Date:** 2026-03-07

---

## Phase 1: Internalize Requirements

### EU-01: AI agents follow delegation instructions reliably

Acceptance Criteria:
1. A single `delegation.md` reference doc exists in `get-shit-done/references/`
2. The doc defines model routing rules, delegation shapes, and when-to-delegate heuristics
3. The 3 source docs (model-profiles.md, model-profile-resolution.md, gather-synthesize.md) are replaced by the consolidated doc
4. Total line count of the consolidated doc is less than the combined 337 lines of the 3 source docs

"Met" means: all four acceptance criteria are satisfied with cited evidence.

### FN-01: Model routing rules

"Met" means: delegation.md maps executor->sonnet, judge->inherit, quick->haiku, no role_type->error, and "opus" is never a valid model parameter value.

### FN-02: Gather-synthesize delegation shape

"Met" means: delegation.md documents parallel gatherer spawning (model=sonnet), wait-for-all, retry-once with >50% abort, synthesizer (model=inherit) after gather, gatherers receive paths not content.

### FN-03: Single delegation shape

"Met" means: delegation.md documents spawning 1 subagent with model per role_type, orchestrator waits then processes, distinct from gather-synthesize.

### TC-01: Net line reduction

"Met" means: consolidated doc is strictly fewer than 337 lines.

### TC-02: Agent frontmatter consistency

"Met" means: all 20 agent files have both `role_type` and `model` in YAML frontmatter.

---

## Phase 2: Trace Against Code

### EU-01: AI agents follow delegation instructions reliably

**Verdict:** not met

**Evidence:**

AC-1 (delegation.md exists): MET
- `get-shit-done/references/delegation.md:1` -- File exists, 149 lines.

AC-2 (doc defines routing rules, shapes, heuristics): MET
- `delegation.md:6-27` -- Model Routing section with role_type->model table and resolution steps.
- `delegation.md:29-76` -- Gather-Synthesize Shape section.
- `delegation.md:78-108` -- Single Delegation Shape section.
- `delegation.md:110-125` -- When to Delegate heuristics.

AC-3 (3 source docs replaced): NOT MET
- `model-profiles.md` -- confirmed deleted (glob returns no files).
- `model-profile-resolution.md` -- confirmed deleted (glob returns no files).
- `gather-synthesize.md` -- NOT replaced. Still exists at `get-shit-done/workflows/gather-synthesize.md` as a 76-line stub. The AC says the 3 source docs are "replaced by the consolidated doc." The stub was reduced and now cross-references delegation.md, but it was not replaced -- it still exists as a standalone file. This is a spec deviation. The implementation chose to keep gather-synthesize.md as a context-assembly-only document, which may be a reasonable engineering decision, but the AC explicitly lists it among the 3 docs to be replaced.

AC-4 (line count < 337): MET
- `delegation.md` is 149 lines. Even counting the remaining `gather-synthesize.md` stub (76 lines), the total is 225, which is less than 337.

**Reasoning:** AC-3 is not met. The requirement explicitly names gather-synthesize.md as one of the 3 source docs to be "replaced by the consolidated doc." The file still exists. The implementation reinterpreted "replaced" as "reduced to a stub that cross-references delegation.md" -- this is a unilateral spec change.

**Cross-layer observations:** The stub approach may be architecturally sound (separating context assembly from delegation patterns), but that is an engineering judgment, not an end-user verdict.

---

### FN-01: Model routing rules

**Verdict:** not met

**Evidence:**

- `delegation.md:11-15` -- Table maps executor->sonnet, judge->inherit, quick->haiku. MET.
- `delegation.md:24-25` -- `"3. If neither exists: error. All agents must have at least role_type."` MET (no role_type -> error).
- `delegation.md:18` -- `"opus is a valid model value but prefer inherit for flexibility."` NOT MET. The spec states: "'opus' is never a valid model parameter value; use 'inherit' instead." The doc contradicts the spec by saying opus IS valid.

**Reasoning:** The spec says opus is never valid. The doc says it is valid but not preferred. This directly contradicts FN-01. The MEMORY.md notes this as a known finding ("opus is now valid model value since v1.0.64"), suggesting a deliberate divergence from the original spec based on platform changes. However, since the spec was not formally amended, the requirement as written is not met.

**Cross-layer observations:** gsd-planner has `role_type: judge` but `model: sonnet` (`~/.claude/agents/gsd-planner.md:9`). This contradicts the routing rule that judge->inherit. This is a TC-02/FN-01 cross-concern but worth flagging here because an orchestrator following delegation.md's rules would expect judge agents to use inherit.

---

### FN-02: Gather-synthesize delegation shape

**Verdict:** met

**Evidence:**

- `delegation.md:33-34` -- `"Spawn N gatherers in parallel, wait for all, synthesize results into one output."`
- `delegation.md:38` -- `"2. Spawn N gatherers in parallel (model=sonnet)."`
- `delegation.md:39-41` -- `"3. Wait for all gatherers to complete. 4. Retry failed gatherers once. 5. If >50% failed: abort."`
- `delegation.md:42` -- `"6. Spawn 1 synthesizer (model=inherit) with gatherer outputs."`
- `delegation.md:71` -- `"Pass file PATHS to agents, not file content."`
- `delegation.md:73` -- `"Gatherers are model=sonnet (executor). Synthesizer is model=inherit (judge)."`

**Reasoning:** All sub-behaviors specified in FN-02 are documented in delegation.md.

---

### FN-03: Single delegation shape

**Verdict:** met

**Evidence:**

- `delegation.md:82` -- `"Spawn 1 subagent for a scoped task, wait for completion, process the result."`
- `delegation.md:87` -- `"2. Spawn 1 subagent via Task tool with model per role_type."`
- `delegation.md:88-89` -- `"3. Wait for completion. 4. Process result (commit, verify, report)."`
- `delegation.md:78-108` -- Entire section is structurally distinct from gather-synthesize (no parallel phase, no synthesis phase).

**Reasoning:** All sub-behaviors specified in FN-03 are documented. The shape is clearly distinct from gather-synthesize.

---

### TC-01: Net line reduction

**Verdict:** met

**Evidence:**

- `delegation.md` = 149 lines (verified via `wc -l`).
- Source docs combined = 337 lines (per spec).
- 149 < 337. Even including the gather-synthesize.md stub (76 lines), 225 < 337.

**Reasoning:** Strictly fewer lines than 337 regardless of how you count.

---

### TC-02: Agent frontmatter consistency

**Verdict:** met

**Evidence:**

All 20 agent files in `~/.claude/agents/` have both `role_type` and `model` in YAML frontmatter. Verified by reading frontmatter of all 20 files:

| Agent | role_type | model |
|-------|-----------|-------|
| gsd-coherence-synthesizer | judge | inherit |
| gsd-doc-explorer | executor | sonnet |
| gsd-doc-synthesizer | judge | inherit |
| gsd-doc-writer | executor | sonnet |
| gsd-executor | executor | sonnet |
| gsd-plan-checker | judge | inherit |
| gsd-planner | judge | sonnet |
| gsd-research-domain | executor | sonnet |
| gsd-research-edges | executor | sonnet |
| gsd-research-intent | executor | sonnet |
| gsd-research-prior-art | executor | sonnet |
| gsd-research-synthesizer | judge | inherit |
| gsd-research-system | executor | sonnet |
| gsd-research-tech | executor | sonnet |
| gsd-review-enduser | executor | sonnet |
| gsd-review-functional | executor | sonnet |
| gsd-review-quality | executor | sonnet |
| gsd-review-synthesizer | judge | inherit |
| gsd-review-technical | executor | sonnet |
| gsd-verifier | judge | inherit |

All 20 have both fields. TC-02 is met.

**Cross-layer observations:** gsd-planner has role_type=judge but model=sonnet, which breaks the FN-01 mapping rule (judge->inherit). TC-02 only requires both fields are present, so this is met, but it is a cross-layer concern for FN-01.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | not met | gather-synthesize.md still exists (76-line stub), not "replaced" per AC-3 |
| FN-01 | not met | delegation.md:18 says "opus is a valid model value" -- spec says opus is never valid |
| FN-02 | met | delegation.md:33-74 documents all required behaviors |
| FN-03 | met | delegation.md:78-108 documents single delegation shape |
| TC-01 | met | 149 lines < 337 lines |
| TC-02 | met | All 20 agents have role_type + model in frontmatter |
