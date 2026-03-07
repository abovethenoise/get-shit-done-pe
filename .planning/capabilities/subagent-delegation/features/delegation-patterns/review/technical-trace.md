# Technical Trace: delegation-patterns

**Reviewer:** gsd-review-technical
**Lens:** enhance
**Date:** 2026-03-07

---

## Phase 1: Internalize Requirements

### TC-01: Net line reduction
- Consolidated doc must be < 337 lines (the combined total of 3 source docs)
- No info loss for v2 patterns
- v1 deprecated content removed if no active consumers
- Source docs: `model-profiles.md`, `model-profile-resolution.md` (deleted), `gather-synthesize.md` (stubbed)
- Output: `delegation.md` (new), `gather-synthesize.md` (reduced)

### TC-02: Agent frontmatter consistency
- All 20 agents must have `role_type` and `model` in YAML frontmatter
- Audit all agent files for `role_type` presence
- Add `role_type` where missing
- Remove v1 fallback path if all agents have `role_type`

---

## Phase 2: Trace Against Code

### TC-01: Net line reduction

**Verdict:** met

**Evidence:**
- `get-shit-done/references/delegation.md` -- 149 lines (verified via `wc -l`)
- `get-shit-done/workflows/gather-synthesize.md` -- 76 lines (verified via `wc -l`)
- Combined new total: 225 lines. Spec threshold: < 337 lines. Net reduction: 112 lines.
- `get-shit-done/references/model-profiles.md` -- confirmed deleted (No such file or directory)
- `get-shit-done/references/model-profile-resolution.md` -- confirmed deleted (No such file or directory)
- Reasoning: Both source docs are deleted. The consolidated `delegation.md` at 149 lines plus the stubbed `gather-synthesize.md` at 76 lines totals 225, well under the 337 threshold.

**v2 pattern preservation check:**
- `delegation.md:11-16` -- Routing table with `executor->sonnet`, `judge->inherit`, `quick->haiku` preserved
- `delegation.md:24` -- `ROLE_MODEL_MAP` reference: `"role_type maps via ROLE_MODEL_MAP -> {executor: 'sonnet', judge: 'inherit', quick: 'haiku'}"` -- matches `core.cjs:18` implementation
- `delegation.md:33-75` -- Gather-synthesize shape fully documented with flow, task call examples, user table, constraints
- `delegation.md:80-107` -- Single delegation shape documented with flow, task call example, user table
- `delegation.md:127-149` -- Anti-patterns section preserved (orchestrator-reads-agent-definition, content passing, inline handling)
- Reasoning: All v2 delegation patterns are present. No info loss detected.

**Dangling reference check:**
- References to deleted files (`model-profiles.md`, `model-profile-resolution.md`) exist only in `.planning/phases/` (historical records) and `.planning/STATE.md` (changelog entries). No active runtime code references the deleted files.
- `gather-synthesize.md:4` -- `"Delegation patterns ... are in @{GSD_ROOT}/get-shit-done/references/delegation.md"` -- correctly points to new file
- `gather-synthesize.md:74` -- `"See @{GSD_ROOT}/get-shit-done/references/delegation.md for the gather-synthesize delegation shape"` -- correctly points to new file

**Spec-vs-reality gap:** None.

---

### TC-02: Agent frontmatter consistency

**Verdict:** met

**Evidence:**
- All 20 agent files in `~/.claude/agents/gsd-*.md` verified to contain both `role_type` and `model` fields in YAML frontmatter.
- Breakdown by model assignment:
  - 14 agents with `model: sonnet` (all `role_type: executor` except `gsd-planner`)
  - 6 agents with `model: inherit` (all `role_type: judge`)
- Every agent has both `role_type` and `model` present -- no missing fields.

**Cross-layer observations:**
- `gsd-planner.md:6-7` -- `role_type: judge` with `model: sonnet`. This contradicts the routing table in `delegation.md:11-16` which maps `judge -> inherit`. The `model` field overrides the `role_type` mapping (per resolution order at `delegation.md:23-25`), so runtime behavior is correct (planner runs on sonnet). However, the role_type/model mismatch is a semantic inconsistency. This is flagged as a cross-layer observation, not a TC-02 failure, because TC-02 requires presence of both fields -- not consistency between them.
- The MEMORY.md notes "gsd-planner has role_type: judge but model: sonnet (actual executor usage)" -- this was a known, intentional decision.

**Spec-vs-reality gap:** None.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | delegation.md: 149 lines + gather-synthesize.md: 76 lines = 225 total (< 337 threshold). Both source docs deleted. No dangling refs in active code. v2 patterns preserved. |
| TC-02 | met | All 20 agent files have both `role_type` and `model` in YAML frontmatter. Cross-layer: gsd-planner has role_type/model mismatch (judge/sonnet) -- known intentional. |
