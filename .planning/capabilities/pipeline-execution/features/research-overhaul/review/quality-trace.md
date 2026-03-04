---
dimension: quality
feature: pipeline-execution/research-overhaul
lens: enhance
reviewer: gsd-universal-quality-reviewer
date: 2026-03-04
---

# Quality Trace: research-overhaul

## Phase 1: Quality Standards

Lens: **enhance**. Focus question: Does the enhancement avoid bloating existing modules? Are existing patterns respected?

Evaluating markdown workflow files (prose + pseudo-code instructions for LLM consumption) against:

- **Functional Integrity:** Do the actual file contents match what the SUMMARY.md files claim was done? Do anti-patterns that should be removed still exist?
- **KISS:** Are instructions unambiguous? Are there redundant or contradictory instructions in the same file?
- **DRY:** Given the accepted tradeoff (Task() duplication across callers), is the duplication consistent and complete, or partial?
- **Earned Abstractions:** Does research-workflow.md's new "reference documentation" role serve a clear purpose, or is it now an orphaned document that adds cognitive overhead?
- **Robustness:** Are failure paths complete? Do skip gates that must be removed still exist?

---

## Phase 2: Trace Against Code

### Finding 1: plan.md Step 5 -- core anti-pattern NOT removed (regression)

**Category:** Bloat / Idiomatic Violation

**Verdict:** regression (proven)

**Evidence:**

- `/Users/philliphall/.claude/get-shit-done/workflows/plan.md:57` — `**Skip if:** \`--skip-research\` flag, or \`research_enabled\` is false without \`--research\` override.`
- `/Users/philliphall/.claude/get-shit-done/workflows/plan.md:60` — `**If research needed:** Invoke \`@/Users/philliphall/.claude/get-shit-done/workflows/research-workflow.md\``
- `/Users/philliphall/.claude/get-shit-done/workflows/plan.md:62` — `Handle return: complete/partial -> continue. Failed -> offer: provide context, skip research, abort.`

- Reasoning: The SUMMARY for Plan 01 explicitly states these were removed: `research_enabled` and `has_research` from Step 1 parse list, `--skip-research` from Step 2, and the entire old Step 5 delegation. None of that happened. The file at line 25 still lists `research_enabled` and `has_research` in the JSON parse block. Line 31 still has `--skip-research`. Line 57-62 is the verbatim old Step 5 with both skip gates and the `@research-workflow.md` delegation. The 6+1 Task() blocks do not exist anywhere in plan.md.

- Context: The entire feature's goal is to replace this exact delegation pattern. FN-01, TC-01, TC-03, EU-01, EU-02 all require this change. The SUMMARY.md for Plan 01 reports "Done" for all of them. The actual file contradicts every one of those status claims.

---

### Finding 2: framing-pipeline.md Stage 1 -- core anti-pattern NOT removed (regression)

**Category:** Bloat / Idiomatic Violation

**Verdict:** regression (proven)

**Evidence:**

- `/Users/philliphall/.claude/get-shit-done/workflows/framing-pipeline.md:83-106` — the full Stage 1 block reads: `Invoke the research workflow directly, passing framing context:` followed by `@/Users/philliphall/.claude/get-shit-done/workflows/research-workflow.md` and a parameter block ending with `The research workflow spawns 6 gatherers in parallel via gather-synthesize, then consolidates via the research synthesizer agent.`

- Reasoning: FN-02 and TC-01 require this block to be replaced with 6+1 explicit Task() blocks. The SUMMARY for Plan 02 reports "Done" with 91 lines added and 24 removed. The actual file has zero Task() blocks (grep confirmed no matches). The old delegation including the explicit statement "The research workflow spawns 6 gatherers in parallel via gather-synthesize" -- the exact ambiguity this feature targets -- is still present verbatim.

- Context: This is the primary caller for research in the full framing workflow. The double-research prevention mechanism (TC-02) described in Plan 02 depends on the synthesizer writing lens frontmatter, which depends on the Task() blocks being present. The mechanism does not exist because the Task() blocks were not written.

---

### Finding 3: review.md -- Task() blocks absent, gather-synthesize delegation unchanged (regression)

**Category:** Bloat / Idiomatic Violation

**Verdict:** regression (proven)

**Evidence:**

- `/Users/philliphall/.claude/get-shit-done/workflows/review.md:6` — `@/Users/philliphall/.claude/get-shit-done/workflows/gather-synthesize.md` (still in required_reading as category-3, which is correct)
- `/Users/philliphall/.claude/get-shit-done/workflows/review.md:49-56` — Step 4 reads: `Define gatherers: ... Per reviewer prompt: read agent file, subject, context payload, dimension name, feature artifacts list, requirement IDs, output path. Spawn ALL 4 simultaneously. Wait for all to complete.`
- `/Users/philliphall/.claude/get-shit-done/workflows/review.md:66` — Step 6 reads: `Spawn synthesizer with all trace reports.`
- `/Users/philliphall/.claude/get-shit-done/workflows/review.md:94` — Step 9 reads: `re-spawn only affected reviewers + always re-run synthesizer`

- Reasoning: FN-06 and TC-05 require Steps 4, 6, and 9 to contain explicit Task() blocks with `prompt`, `subagent_type`, `model`, and `description` fields. The SUMMARY for Plan 04 reports "Done" with 5 Task() blocks added. Grep on review.md returns zero Task() matches. All three steps still use vague prose delegation ("Spawn ALL 4 simultaneously", "Spawn synthesizer") -- the same anti-pattern this feature was designed to eliminate.

- Context: The `@gather-synthesize.md` required_reading reference at line 6 is correct category-3 usage per the audit (TC-04). Retaining it is right. The problem is that Steps 4, 6, and 9 were supposed to be rewritten with the explicit Task() blocks that would make gather-synthesize a reference rather than a spawning delegation. That rewrite did not happen.

---

### Finding 4: plan.md Step 5 still offers "skip research" in failure path (regression)

**Category:** KISS

**Verdict:** regression (proven)

**Evidence:**

- `/Users/philliphall/.claude/get-shit-done/workflows/plan.md:62` — `Failed -> offer: provide context, skip research, abort.`

- Reasoning: EU-02 acceptance criteria states: "Research failure path offers 'provide context' or 'abort' -- not 'skip'." TC-03 states the skip option must be removed from workflow text. The 01-SUMMARY.md decision log notes: "Kept 'Do NOT offer skip research' instruction in failure path -- this is an anti-skip directive, not a skip gate." That note was premature; the file was never changed and the skip option is present in the failure path verbatim.

- Context: This is a subset of Finding 1 but independently stated in EU-02 acceptance criteria and has its own requirement traceability.

---

### Finding 5: research-workflow.md Step 5 still delegates imperatively to gather-synthesize (regression)

**Category:** Idiomatic Violation

**Verdict:** regression (proven)

**Evidence:**

- `/Users/philliphall/.claude/get-shit-done/workflows/research-workflow.md:147-169` — Step 5 heading: `## 5. Invoke Gather-Synthesize`. Body: `Delegate to the gather-synthesize pattern:` followed by `@/Users/philliphall/.claude/get-shit-done/workflows/gather-synthesize.md`. The step retains full imperative language: "Pass:", "Wait for gather-synthesize to complete."

- Reasoning: FN-07 requires research-workflow.md Step 5 to be rewritten with descriptive language (what happens, not "execute this"). The 03-SUMMARY.md claims the reframe was completed: "Step 5: descriptive 'When callers spawn...' replaces imperative 'Delegate to @gather-synthesize.md'". The actual file at lines 147-169 still reads "Invoke Gather-Synthesize" (heading), "Delegate to the gather-synthesize pattern" (body), and retains the bare `@gather-synthesize.md` reference as an execution instruction.

- Context: The 03-SUMMARY also claims the purpose block was updated to "reference documentation for the research gather-synthesize pattern." The actual purpose at lines 1-7 still reads: "Standalone research orchestration workflow. Spawns 6 specialist research gatherers in parallel via the gather-synthesize pattern...Callers: framing-pipeline.md (Stage 1), plan.md (Step 5)." These callers are now supposed to own the spawning directly; describing research-workflow.md as their orchestrator is inconsistent with the declared architecture. The purpose block was not changed.

---

### Finding 6: plan.md Step 1 still parses research_enabled and has_research (regression)

**Category:** KISS

**Verdict:** regression (proven)

**Evidence:**

- `/Users/philliphall/.claude/get-shit-done/workflows/plan.md:25` — `Parse JSON for: \`researcher_model\`, \`planner_model\`, \`checker_model\`, \`research_enabled\`, \`plan_checker_enabled\`, \`commit_docs\`, \`feature_found\`, \`feature_dir\`, \`feature_slug\`, \`capability_slug\`, \`capability_dir\`, \`has_research\`, ...`

- Reasoning: TC-03 states: "`research_enabled` is a config.json field -- the gate in plan.md is removed". EU-01 acceptance criteria states: "No `research_enabled` config gate exists in plan.md". The 01-SUMMARY.md states these were removed from the parse list. Both remain in line 25. The model parsing these values will use them as inputs to the skip gates at line 57, perpetuating the bypass paths.

- Context: Distinct from Finding 1 because this is the upstream data source for the skip gates. Even if Step 5 language were softened without removing the parse targets, the model would still have these values available to act on.

---

### Finding 7: FEATURE.md audit table row count discrepancy (KISS)

**Category:** KISS

**Verdict:** not met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:262` — summary states: `**Total @workflow.md references found:** 17 instances (across 8 files; 8 files clean)`
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:295` — 03-SUMMARY states: `22 total instances found across 8 files`
- The classification table itself contains 22 rows (counting the execute.md combined entry as one row but covering 3 references, and several other multi-reference rows).

- Reasoning: The header says 17 instances, the summary says 22, and the table rows do not map cleanly to either number. A reader cannot determine the actual count without re-counting manually. This is a maintenance burden for future audits: if someone needs to verify "all @workflow.md references are classified," they cannot trust the header count. The discrepancy is never explained in the document.

- Context: This is a documentation integrity issue in the artifact that TC-04 required to be produced. The counts should be reconciled to a single number with clear counting rules (e.g., "17 files references, some rows cover multiple references on the same line").

---

## Summary

**Critical (regression -- proven):** Findings 1-6 represent the feature's core deliverables not being written to disk. Five SUMMARY.md files claim completion for work that demonstrably did not occur in the target files. The gap is total: zero Task() blocks exist in framing-pipeline.md or review.md; plan.md retains every anti-pattern it was supposed to lose.

**Non-critical:** Finding 7 is a documentation count discrepancy in FEATURE.md that adds confusion to the audit artifact but does not affect runtime behavior.

**Scope note on research-workflow.md:** Finding 5 confirms the reframe was not applied. However, since plan.md and framing-pipeline.md still delegate to research-workflow.md (Findings 1-2), the file's current "orchestration workflow" framing is at least internally consistent with how callers currently use it. The inconsistency is that 03-SUMMARY claims it was changed when it was not.
