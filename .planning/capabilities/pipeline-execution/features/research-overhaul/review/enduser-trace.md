---
reviewer: gsd-review-enduser
feature: pipeline-execution/research-overhaul
lens: enhance
date: 2026-03-04
---

# End-User Trace Report: research-overhaul

## Phase 1: Internalize Requirements

### EU-01: Research always runs before planning

**Acceptance Criteria:**
1. No `--skip-research` flag exists in plan.md
2. No `research_enabled` config gate exists in plan.md
3. Running `/gsd:plan` always produces a RESEARCH.md before planning begins
4. Existing RESEARCH.md is reused when lens matches (no redundant work)

"Met" looks like: plan.md Step 5 has no conditional branch that skips research. The only branch is reuse (lens match) vs. re-run. The status display does not present "Skipped" as a reachable outcome.

### EU-02: All 6 research gatherers actually spawn in parallel

**Acceptance Criteria:**
1. 6 gatherer output files exist in `research/` subdirectory after research runs
2. Gatherers run in parallel (not sequentially)
3. Research failure path offers "provide context" or "abort" — not "skip"

"Met" looks like: 6 explicit Task() blocks in parallel, explicit "do NOT wait" instruction, failure handling presents "provide context" and "abort" options only.

---

## Phase 2: Trace Against Code

### EU-01: Research always runs before planning

**Verdict:** not met (proven)

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:31` — `Extract flags: \`--research\`, \`--skip-verify\`.`
  - Reasoning: `--skip-research` was removed (criterion 1 met), but a `--research` flag is still parsed at Step 2. The flag is extracted and then never referenced again in the workflow — no conditional branch acts on it. This is a residual artifact, not a functional bypass. Criterion 1 is met by this read.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:307` — `Research: {Completed | Used existing | Skipped}`
  - Reasoning: The Step 12 final status display still presents "Skipped" as a valid research outcome. No code path in Step 5 leads to a "Skipped" state — the only branches are "Reuse existing" and "Re-run". However, the status display string itself presents "Skipped" as a reachable label to the user. This is a contradiction: the flow logic forbids skipping, but the UI template promises the user they might see "Skipped" as a research outcome. The acceptance criteria state "Running `/gsd:plan` always produces a RESEARCH.md before planning begins." A user reading the completion status "Research: Skipped" would conclude research was bypassed — this contradicts the guarantee in EU-01. Criterion 3 is undermined by this display artifact.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:166` — `Do NOT offer "skip research" as an option.`
  - Reasoning: The failure handler explicitly forbids "skip research" as a failure-path option. This is correct and supports criterion 3. However, the status display at line 307 undercuts it by showing "Skipped" as a valid completion state.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:68-73` — `**If RESEARCH.md does not exist:** Run research [...] **If RESEARCH.md exists:** Read its YAML frontmatter...`
  - Reasoning: The lens-aware reuse logic is present. The only two outcomes at the step level are "run research" and "reuse existing". Criteria 1, 2, and 4 are structurally satisfied by this logic. The violation is solely the "Skipped" label in the Step 12 status display.

**Cross-layer observations:** The `--research` flag parsed at line 31 has no downstream reference. It appears to be a pre-overhaul artifact. It does not affect flow but could confuse a user or future maintainer who invokes `--research` expecting some behavior change.

---

### EU-02: All 6 research gatherers actually spawn in parallel

**Verdict:** met (proven)

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:90` — `Spawn all 6 gatherers simultaneously (parallel Task calls -- do NOT wait for one before spawning the next):`
  - Reasoning: Explicit parallel spawn instruction. The "do NOT wait" clause directly satisfies criterion 2.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:93-133` — Six consecutive `Task(...)` blocks for `gsd-research-domain`, `gsd-research-system`, `gsd-research-intent`, `gsd-research-tech`, `gsd-research-edges`, `gsd-research-prior-art`
  - Reasoning: All 6 gatherer Task() blocks are present. Each writes to a named file in `{feature_dir}/research/`. After spawning, the file-existence check at lines 137-141 confirms 6 output files are expected. Criterion 1 is met.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:160-166` — `If research fails [...] Present options to user via AskUserQuestion: - "Provide context directly" [...] - "Abort" [...] Do NOT offer "skip research" as an option.`
  - Reasoning: The failure path explicitly offers "provide context" and "abort" only. "Skip" is explicitly forbidden. Criterion 3 is met.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:105` — `Spawn all 6 gatherers simultaneously (parallel Task calls -- do NOT wait for one before spawning the next):`
  - Reasoning: Same parallel spawn instruction present in framing-pipeline Stage 1. Both research callers satisfy criterion 2.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:108-148` — Six consecutive `Task(...)` blocks with the same 6 subagent_types
  - Reasoning: framing-pipeline also contains all 6 gatherer Task() blocks. Criterion 1 is met for this caller.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:160` — `If more than 3 gatherers failed: surface escalation (MAJOR tier per escalation-protocol.md). Do NOT continue to synthesizer.`
  - Reasoning: framing-pipeline failure path escalates rather than skips. Criterion 3 is met for this caller.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | not met (proven) | `plan.md:307` — status display includes "Skipped" as a reachable research outcome, contradicting the guarantee that research always runs |
| EU-02 | met (proven) | `plan.md:90-133` — 6 parallel Task() blocks with explicit "do NOT wait" instruction; `plan.md:166` — failure path forbids "skip" |
