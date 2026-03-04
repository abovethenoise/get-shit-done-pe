---
type: feature
capability: "pipeline-execution"
status: planning
created: "2026-03-04"
---

# Research Overhaul

## Goal

Make the research step in the plan workflow (and all other research callers) work as designed: mandatory, lens-aware, and unambiguously delegated so the model actually spawns the 6 parallel gatherers.

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | ✓ | - | - | - | - | draft |
| EU-02 | ✓ | - | - | - | - | draft |
| FN-01 | ✓ | - | - | - | - | draft |
| FN-02 | ✓ | - | - | - | - | draft |
| FN-03 | ✓ | - | - | - | - | draft |
| FN-04 | ✓ | - | - | - | - | draft |
| FN-05 | ✓ | - | - | - | - | draft |
| TC-01 | ✓ | - | - | - | - | draft |
| TC-02 | ✓ | - | - | - | - | draft |
| TC-03 | ✓ | - | - | - | - | draft |
| TC-04 | ✓ | - | - | - | - | draft |
| FN-06 | ✓ | - | - | - | - | draft |
| FN-07 | ✓ | - | - | - | - | draft |
| TC-05 | ✓ | - | - | - | - | draft |

## End-User Requirements

### EU-01: Research always runs before planning

**Story:** As a GSD user, I want research to always run before planning, so that plans are grounded in codebase-specific facts rather than training knowledge.

**Acceptance Criteria:**

- [ ] No `--skip-research` flag exists in plan.md
- [ ] No `research_enabled` config gate exists in plan.md
- [ ] Running `/gsd:plan` always produces a RESEARCH.md before planning begins
- [ ] Existing RESEARCH.md is reused when lens matches (no redundant work)

**Out of Scope:**

- Timestamp-based staleness checking
- Adding a user escape hatch for trivial features

### EU-02: All 6 research gatherers actually spawn in parallel

**Story:** As a GSD user, I want the research step to spawn all 6 specialist gatherers in parallel as designed, so that research covers all dimensions (domain, system, intent, tech, edges, prior art).

**Acceptance Criteria:**

- [ ] 6 gatherer output files exist in `research/` subdirectory after research runs
- [ ] Gatherers run in parallel (not sequentially)
- [ ] Research failure path offers "provide context" or "abort" — not "skip"

**Out of Scope:**

- Changing what the gatherers investigate or their agent definitions

## Functional Requirements

### FN-01: Replace ambiguous delegation with explicit Task() blocks in plan.md

**Receives:** Feature context (capability, feature, lens, framing context) from plan.md initialization.

**Returns:** 6 gatherer output files + 1 RESEARCH.md synthesis.

**Behavior:**

- plan.md Step 5 contains 6 explicit `Task()` pseudo-code blocks, one per gatherer
- Each block specifies: `prompt`, `subagent_type`, `model`, `description`
- Blocks follow the exact pattern used in plan.md Step 7 (gsd-planner)
- After 6 gatherers complete, a 7th `Task()` block spawns the synthesizer
- The word "Invoke" and bare `@workflow.md` delegation are not used for agent spawning

### FN-02: Replace ambiguous delegation in framing-pipeline.md Stage 1

**Receives:** Feature context from framing-pipeline initialization + lens metadata.

**Returns:** 6 gatherer output files + 1 RESEARCH.md synthesis.

**Behavior:**

- framing-pipeline.md Stage 1 contains the same 6+1 explicit `Task()` blocks as plan.md
- Framing context (brief_path, lens, secondary_lens, direction, focus) is embedded in each gatherer's prompt
- Pattern is consistent with plan.md Step 5 (same structure, same agent types)

### FN-03: Lens-aware research reuse

**Receives:** Path to existing RESEARCH.md (if any), current primary_lens, current secondary_lens.

**Returns:** Decision: reuse existing or re-run research.

**Behavior:**

- If RESEARCH.md does not exist → run research
- If RESEARCH.md exists → read its frontmatter for `lens` and `secondary_lens` fields
- If frontmatter lens matches current lens AND frontmatter secondary_lens matches current secondary_lens → reuse existing, skip re-run
- If lens mismatch → re-run research (log reason: "existing research used {old_lens}, current work uses {new_lens}")
- If RESEARCH.md exists but has no frontmatter or no lens field → treat as stale, re-run
- Compound lens comparison: both primary AND secondary must match (tuple equality)

### FN-04: Persist lens metadata in RESEARCH.md output

**Receives:** Synthesizer output, current lens context.

**Returns:** RESEARCH.md with YAML frontmatter containing lens metadata.

**Behavior:**

- Synthesizer Task() prompt instructs it to write YAML frontmatter at top of RESEARCH.md
- Frontmatter includes: `lens: {primary_lens}`, `secondary_lens: {secondary_lens}`, `subject: {subject}`, `date: {ISO date}`
- `extractFrontmatter()` from `frontmatter.cjs` can parse the result
- No changes to gsd-tools CLI or init.cjs required

### FN-05: Audit all workflows for `@workflow.md` delegation anti-pattern

**Receives:** All files in `workflows/*.md`.

**Returns:** Enumerated list of every `@{GSD_ROOT}/workflows/*.md` reference with classification and disposition.

**Behavior:**

- Classify each instance as: (1) parallel agent spawn = bug, fix now; (2) sequential workflow handoff = document for future evaluation; (3) context reference inside Task() prompt = correct usage, no action
- Category 1 instances (research delegation in plan.md and framing-pipeline.md) are fixed by FN-01 and FN-02
- Category 2 and 3 instances are documented in a Decisions entry with disposition
- No other category 1 instances exist beyond research delegation (per research findings)

## Technical Specs

### TC-01: Task() block structure for gatherer spawns

**Intent:** Unambiguous spawn instruction that the model cannot misinterpret as delegation or reference-reading.

**Upstream:** plan.md Step 5 initialization provides: `researcher_model`, feature context, lens metadata, assembled context payload.

**Downstream:** 6 gatherer agents write to `{feature_dir}/research/{dimension}-findings.md`. Synthesizer reads these and writes `{feature_dir}/RESEARCH.md`.

**Constraints:**

- `model` parameter: use `"sonnet"` for gatherers (executor role), `"inherit"` for synthesizer (judge role)
- `subagent_type`: must match registered agent types (e.g., `"gsd-research-domain"`)
- Subagents cannot spawn other subagents — all 6+1 Task() calls must be in the main conversation context
- Orchestrator checks file existence after spawn (not return values — results are file-based)

**Example:**

```
Task(
  prompt="First, read {agent_path} for your role.\n\n<subject>{subject}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Domain Truth\nWrite to: {output_path}</task_context>",
  subagent_type="gsd-research-domain",
  model="sonnet",
  description="Research Domain Truth for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

### TC-02: Double-research prevention

**Intent:** When framing-pipeline Stage 1 runs research and then invokes plan.md (Stage 3), plan.md must not re-run research for the same feature.

**Upstream:** framing-pipeline Stage 1 writes RESEARCH.md with lens frontmatter. Stage 3 invokes plan.md.

**Downstream:** plan.md Step 5 reads RESEARCH.md, finds matching lens, reuses it.

**Constraints:**

- The lens-aware reuse logic (FN-03) handles this case naturally — framing-pipeline writes RESEARCH.md with lens frontmatter, plan.md reads it and finds a match
- No additional mechanism needed if FN-03 and FN-04 are implemented correctly
- Edge case: if framing-pipeline pivots lens mid-pipeline (rare), the RESEARCH.md lens won't match and plan.md will correctly re-run

### TC-03: Skip gate removal scope

**Intent:** Remove all paths that allow bypassing research without modifying the CLI tool.

**Upstream:** plan.md workflow text (not executable code).

**Downstream:** Model reads plan.md and has no skip branch to follow.

**Constraints:**

- `--skip-research` is model-parsed prose, not CLI-enforced — removal means deleting it from workflow text
- `research_enabled` is a config.json field — the gate in plan.md is removed, but the config field itself stays (removing config schema is out of scope)
- `has_research` binary check is replaced by lens-aware logic (FN-03), not simply removed
- framing-pipeline.md Stage 1 had no skip gates (already mandatory) — only plan.md needs skip gate removal

### TC-04: Workflow audit classification criteria

**Intent:** Distinguish fixable anti-patterns from correct usage during the `@workflow.md` audit.

**Upstream:** All `workflows/*.md` files.

**Downstream:** Classification document in FEATURE.md Decisions section.

**Constraints:**

- Category 1 (parallel spawn): The calling context needs multiple agents spawned simultaneously. Current pattern delegates to another workflow that handles spawning. Fix: inline Task() blocks. **Known instances: plan.md Step 5, framing-pipeline.md Stage 1.**
- Category 2 (sequential handoff): The calling context hands off to another workflow for the next phase. Model reads the referenced workflow inline and continues. Risk: lower than category 1 (no parallel spawning needed), but model could still shortcut. **Known instances: framing-pipeline stages 3-6, capability-orchestrator, framing-discovery → framing-pipeline.**
- Category 3 (context reference): The `@` reference appears inside a Task() prompt or as required_reading. This is correct — agent needs to read the file. **Known instances: execute.md, various `required_reading` blocks.**

### FN-06: Replace ambiguous delegation in review.md with explicit Task() blocks

**Receives:** Feature context (capability, feature, lens) from review.md initialization.

**Returns:** 4 reviewer trace files + 1 synthesis report.

**Behavior:**

- review.md Step 4 contains 4 explicit `Task()` pseudo-code blocks, one per reviewer
- Each block specifies: `prompt`, `subagent_type`, `model`, `description`
- After 4 reviewers complete, Step 6 contains a `Task()` block for the synthesizer
- The `@gather-synthesize.md` required_reading reference is retained as a category-3 context reference — review.md owns the spawn logic but reads the pattern description for context
- Pattern is consistent with plan.md Step 5 and framing-pipeline.md Stage 1 (same Task() structure)
- Re-review loop (Step 9) spawns only affected reviewers using the same Task() pattern

### FN-07: Reframe research-workflow.md as reference documentation

**Receives:** N/A (file update, not runtime behavior).

**Returns:** Updated research-workflow.md that describes the research pattern without imperative delegation language.

**Behavior:**

- research-workflow.md no longer uses "Invoke" or "Delegate to" for gather-synthesize.md
- Step 5 is rewritten to describe the pattern (what happens, not "execute this")
- Purpose block updated: callers (plan.md, framing-pipeline.md) own the actual Task() spawns; this file documents the research framework (gatherer dimensions, context layers, output structure)
- Existing content about gatherer definitions, context assembly, and output structure is preserved — only the imperative delegation language changes

## Technical Specs (continued)

### TC-05: Task() block structure for reviewer spawns

**Intent:** Same unambiguous spawn instruction pattern used for research, applied to review.

**Upstream:** review.md Step 1 initialization provides: feature context, FEATURE.md requirement IDs, SUMMARY.md artifact lists.

**Downstream:** 4 reviewer agents write to `{feature_dir}/review/{dimension}-trace.md`. Synthesizer reads these and writes `{feature_dir}/review/synthesis.md`.

**Constraints:**

- `model` parameter: use `"sonnet"` for reviewers (executor role), `"inherit"` for synthesizer (judge role)
- `subagent_type`: must match registered agent types (`gsd-review-enduser`, `gsd-review-functional`, `gsd-review-technical`, `gsd-universal-quality-reviewer`, `gsd-review-synthesizer`)
- Note: quality reviewer subagent_type is `gsd-universal-quality-reviewer` but agent file is `agents/gsd-review-quality.md`
- Re-review spawns use the same Task() blocks but only for affected dimensions

## Decisions

- Research synthesis lens frontmatter is the lowest-cost approach for lens-aware reuse (no CLI changes)
- DRY cost of duplicating Task() blocks across plan.md and framing-pipeline.md is accepted — ambiguity cost is worse
- Category 2 `@workflow.md` instances (sequential handoffs) are documented but not fixed in this feature
- review.md's gather-synthesize delegation (same pattern, 4 reviewers) fixed in Plan 04 (promoted from follow-up)
- research-workflow.md reframed as reference documentation in Plan 03 task 2 — no longer a delegation target
- DRY cost of duplicating Task() blocks across review.md accepted — same rationale as plan.md/framing-pipeline.md

## @workflow.md Audit Results (FN-05, TC-04)

**Date:** 2026-03-04
**Files scanned:** 16 workflow files
**Total @workflow.md references found:** 22 instances (across 8 files; 8 files clean)

### Classification Table

| File | Line | Reference | Category | Disposition |
|------|------|-----------|----------|-------------|
| plan.md | 60 | `@research-workflow.md` | 1 -- parallel spawn | FIX in Plan 01. Step 5 delegates research orchestration that requires 6 parallel Task() spawns. |
| framing-pipeline.md | 86 | `@research-workflow.md` | 1 -- parallel spawn | FIX in Plan 02. Stage 1 delegates research orchestration that requires 6 parallel Task() spawns. |
| research-workflow.md | 152 | `@gather-synthesize.md` | 1 -- parallel spawn | FIX in Plan 03 Task 2. Step 5 delegates gather-synthesize execution that spawns 6 parallel gatherers. Reframed as reference documentation. |
| framing-pipeline.md | 169 | `@plan.md` | 2 -- sequential handoff | Document only. Stage 3 hands off to plan workflow. Model reads inline and continues. No parallel spawning needed. |
| framing-pipeline.md | 202 | `@execute.md` | 2 -- sequential handoff | Document only. Stage 4 hands off to execute workflow. Sequential single-context continuation. |
| framing-pipeline.md | 244 | `@review.md` | 2 -- sequential handoff | Document only. Stage 5 hands off to review workflow. Sequential single-context continuation. |
| framing-pipeline.md | 286 | `@doc.md` | 2 -- sequential handoff | Document only. Stage 6 hands off to doc workflow. Sequential single-context continuation. |
| capability-orchestrator.md | 95 | `@framing-pipeline.md` | 2 -- sequential handoff | Document only. Orchestrator invokes framing-pipeline per feature in sequence. |
| framing-discovery.md | 259 | `@framing-pipeline.md` | 2 -- sequential handoff | Document only. Discovery hands off to pipeline after brief finalization. |
| review.md | 120 | `@doc.md` | 2 -- sequential handoff | Document only. Review auto-advances to doc workflow on clean pass. |
| init-project.md | 341 | `@gather-synthesize.md` | 2 -- sequential handoff | Document only. Existing project scan uses gather-synthesize pattern for parallel codebase analysis. |
| capability-orchestrator.md | 8 | `@framing-pipeline.md` | 3 -- context ref | Correct usage. required_reading block -- model reads for context. No action. |
| capability-orchestrator.md | 9 | `@framing-lenses.md` | 3 -- context ref | Correct usage. required_reading block -- reference file. No action. |
| review.md | 6 | `@gather-synthesize.md` | 3 -- context ref | Correct usage. required_reading block -- model reads gather-synthesize pattern for context. No action. |
| review.md | 7 | `@ui-brand.md` | 3 -- context ref | Correct usage. required_reading block -- reference file. No action. |
| research-workflow.md | 12 | `@gather-synthesize.md` | 3 -- context ref | Correct usage. required_reading block -- model reads pattern description. No action. |
| execute.md | 73-75 | `@execute-plan.md`, `@summary.md`, `@checkpoints.md` | 3 -- context ref | Correct usage. Inside Task() prompt execution_context block. Agent reads these files. No action. |
| plan.md | 7 | `@ui-brand.md` | 3 -- context ref | Correct usage. required_reading block -- reference file. No action. |
| doc.md | 6 | `@ui-brand.md` | 3 -- context ref | Correct usage. required_reading block -- reference file. No action. |
| framing-discovery.md | 10-11 | `@framing-lenses.md`, `@ui-brand.md` | 3 -- context ref | Correct usage. required_reading block -- reference files. No action. |
| framing-pipeline.md | 10-12 | `@framing-lenses.md`, `@escalation-protocol.md`, `@ui-brand.md` | 3 -- context ref | Correct usage. required_reading block -- reference files. No action. |
| resume-work.md | 10 | `@continuation-format.md` | 3 -- context ref | Correct usage. required_reading block -- reference file. No action. |
| execute-plan.md | 8 | `@git-integration.md` | 3 -- context ref | Correct usage. required_reading block -- reference file. No action. |

### Summary

- Category 1 (bugs): 3 found. plan.md (Plan 01), framing-pipeline.md (Plan 02), research-workflow.md (Plan 03 Task 2). All have assigned fixes.
- Category 2 (sequential handoffs): 7 instances. Documented. Lower risk -- no parallel spawn needed. Evaluate for reliability separately if shortcutting is observed.
- Category 3 (correct usage): 12+ instances (required_reading blocks and Task() prompt context refs). No action needed.

### Follow-up Items

- review.md uses same gather-synthesize delegation pattern as research (4 reviewers). Fixed in Plan 04 with explicit Task() blocks.
- Category-2 sequential handoffs: evaluate reliability of model inline-read behavior for framing-pipeline stages 3-6 in a separate feature if shortcutting is observed.
- init-project.md's gather-synthesize reference (line 341) uses descriptive "Use the pattern" language rather than bare delegation -- lower risk but worth monitoring.
