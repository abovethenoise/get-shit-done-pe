# Functional Trace Report: delegation-patterns

**Reviewer:** gsd-review-functional
**Lens:** enhance
**Date:** 2026-03-07

---

## Phase 1: Internalize Requirements

| Req ID | Behavior Specification |
|--------|----------------------|
| FN-01 | Model routing: executor->sonnet, judge->inherit, quick->haiku. No role_type->fallback/error. "opus" never valid; use "inherit". |
| FN-02 | Gather-synthesize: N parallel gatherers (sonnet), retry failed once, abort if >50% fail, 1 synthesizer (inherit). Gatherers receive paths not content. |
| FN-03 | Single delegation: 1 subagent via Task tool with model per role_type, orchestrator waits then processes. |
| EU-01 | Single delegation.md exists, defines routing/shapes/heuristics, replaces 3 source docs, net line reduction. |
| TC-01 | Consolidated doc < 337 lines. |
| TC-02 | All agents have role_type and model in frontmatter. |

---

## Phase 2: Trace Against Code

### FN-01: Model routing rules

**Verdict:** not met (proven)

**Evidence:**

1. Routing table correctly maps role_type to model:
   - `delegation.md:11-15` -- Table maps executor->sonnet, judge->inherit, quick->haiku. **Matches spec.**

2. Fallback behavior documented:
   - `delegation.md:24` -- `"If no model field: role_type maps via ROLE_MODEL_MAP -> {executor: 'sonnet', judge: 'inherit', quick: 'haiku'}."`
   - `delegation.md:25` -- `"If neither exists: error. All agents must have at least role_type."`
   - **Matches spec** for no-role_type fallback.

3. "opus" validity -- **DEVIATION from spec:**
   - `delegation.md:18` -- `"opus is a valid model value but prefer inherit for flexibility."`
   - Spec states: `"opus" is never a valid model parameter value; use "inherit" instead`
   - The implementation says opus IS valid (just not preferred). The spec says opus is NEVER valid. These are contradictory.

4. Agent frontmatter mismatch -- `gsd-planner`:
   - `~/.claude/agents/gsd-planner.md:6-7` -- `role_type: judge` / `model: sonnet`
   - Per FN-01: judge role_type -> model="inherit". Planner has model="sonnet", violating the routing rule.
   - Reasoning: A judge-typed agent running on sonnet contradicts the routing table. Either the role_type is wrong (should be executor) or the model is wrong (should be inherit).

**Cross-layer observations:** The gsd-planner inconsistency is noted in project memory as a known finding ("gsd-planner has role_type: judge but model: sonnet (actual executor usage)"). This suggests the role_type may be misclassified rather than the model being wrong, but the delegation.md routing table is the contract and it is violated either way.

---

### FN-02: Gather-synthesize delegation shape

**Verdict:** met

**Evidence:**

1. Parallel gatherer spawning:
   - `delegation.md:38` -- `"Spawn N gatherers in parallel (model=sonnet)."`
   - **Matches spec.**

2. Retry/abort logic:
   - `delegation.md:40-41` -- `"Retry failed gatherers once."` / `"If >50% failed: abort. Do not synthesize."`
   - **Matches spec.**

3. Synthesizer:
   - `delegation.md:42` -- `"Spawn 1 synthesizer (model=inherit) with gatherer outputs."`
   - **Matches spec.**

4. Paths not content:
   - `delegation.md:73` -- `"Pass file PATHS to agents, not file content."`
   - `delegation.md:50` -- Task call example shows `{agent_path}`, `{output_path}`, `{context}` as references.
   - **Matches spec.**

5. gather-synthesize.md stub correctly defers to delegation.md:
   - `gather-synthesize.md:4` -- `"Delegation patterns (model routing, shapes, heuristics) are in @{GSD_ROOT}/get-shit-done/references/delegation.md"`
   - `gather-synthesize.md:73-74` -- `"See @{GSD_ROOT}/get-shit-done/references/delegation.md for the gather-synthesize delegation shape"`
   - Stub retains context assembly (Layers 0-4) and defers delegation mechanics. **Correct separation.**

---

### FN-03: Single delegation shape

**Verdict:** met

**Evidence:**

1. Shape documented:
   - `delegation.md:82-89` -- Flow: construct prompt, spawn 1 subagent via Task with model per role_type, wait, process result.
   - **Matches spec.**

2. Task call example:
   - `delegation.md:94-98` -- Shows `Task(prompt="First, read {agent_path}...", model="sonnet")` pattern.
   - **Matches spec.**

3. Users table:
   - `delegation.md:103-106` -- execute-plan (sonnet), review verification (inherit), plan validation (inherit).
   - Models align with role_types from agent frontmatter (executor->sonnet, judge->inherit).

---

### EU-01: Single delegation.md reference doc

**Verdict:** met

**Evidence:**

1. File exists: `get-shit-done/references/delegation.md` (149 lines).
2. Defines model routing (lines 5-27), delegation shapes (lines 29-108), when-to-delegate heuristics (lines 110-125).
3. Source docs deleted: `model-profiles.md` and `model-profile-resolution.md` absent from `get-shit-done/references/`. `gather-synthesize.md` reduced to 76-line stub.
4. Net reduction: 149 + 76 = 225 lines vs. original 337. **Reduction achieved.**

---

### TC-01: Net line reduction

**Verdict:** met

**Evidence:**
- `delegation.md`: 149 lines. `gather-synthesize.md` stub: 76 lines. Total: 225 < 337.
- Original 3 source docs: 337 lines combined.

---

### TC-02: Agent frontmatter consistency

**Verdict:** met

**Evidence:**
- All 20 agents in `~/.claude/agents/` have both `role_type` and `model` fields in YAML frontmatter (verified via extraction of all 20 files).
- Breakdown: 14 with model=sonnet, 6 with model=inherit, 0 with model=haiku.
- No agents missing either field.

**Cross-layer observations:** Zero agents use `model: haiku` despite `quick` role_type being defined in the routing table. The `quick` role_type has no current consumers. This is not a violation (TC-02 requires presence of fields, not coverage of all role_types), but it means the quick->haiku path is untested.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | not met (proven) | delegation.md:18 -- "opus is a valid model value" contradicts spec ("opus is never valid"). gsd-planner.md:6-7 -- judge/sonnet violates routing table. |
| FN-02 | met | delegation.md:38-42 -- parallel gather, retry, abort, synthesize all specified correctly. |
| FN-03 | met | delegation.md:82-98 -- single delegation shape matches spec. |
| EU-01 | met | delegation.md exists (149 lines), covers routing/shapes/heuristics, source docs replaced. |
| TC-01 | met | 225 total lines < 337 original. |
| TC-02 | met | All 20 agents have role_type and model fields. |
