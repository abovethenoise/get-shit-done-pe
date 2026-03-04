# Functional Trace Report: pipeline-execution/research-overhaul

**Lens:** enhance
**Reviewer:** gsd-review-functional
**Date:** 2026-03-04

---

## Phase 1: Requirements Internalized

| Req | Behavior Contract |
|-----|-------------------|
| EU-01 | No skip flags; RESEARCH.md always produced before planning; existing reused when lens matches |
| EU-02 | 6 gatherer output files; parallel (not sequential); failure path = provide context or abort (not skip) |
| FN-01 | plan.md Step 5: 6 explicit Task() blocks + 1 synthesizer Task(); no "Invoke" or bare @workflow.md |
| FN-02 | framing-pipeline.md Stage 1: same 6+1 Task() pattern; framing context embedded in prompts |
| FN-03 | Lens-aware reuse: no file → run; file+match → reuse; file+mismatch → re-run+log; no frontmatter → stale |
| FN-04 | Synthesizer Task() prompt instructs YAML frontmatter: lens, secondary_lens, subject, date |
| FN-05 | All @workflow.md instances enumerated, classified (cat 1/2/3), documented with dispositions |
| FN-06 | review.md Steps 4+6 have explicit Task() blocks (4 reviewers + 1 synthesizer); @gather-synthesize.md required_reading removed |
| FN-07 | research-workflow.md reframed as reference docs; no "Invoke"/"Delegate to"; callers own Task() spawns |
| TC-01 | Task() structure: prompt, subagent_type, model, description; model=sonnet for executors, model=inherit for judges |
| TC-02 | framing-pipeline Stage 1 writes RESEARCH.md with lens frontmatter; plan.md Step 5 reads and reuses on lens match |
| TC-03 | --skip-research, research_enabled, has_research gates removed from plan.md |
| TC-04 | Cat 1=parallel spawn=bug; cat 2=sequential handoff=document; cat 3=context ref=correct |
| TC-05 | Reviewer Task() blocks: model=sonnet for reviewers, model=inherit for synthesizer; quality reviewer subagent_type="gsd-universal-quality-reviewer" |

---

## Phase 2: Trace Against Code

---

### EU-01: Research always runs before planning

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:31` — `Extract flags: \`--research\`, \`--skip-verify\`.`
  - Reasoning: `--skip-research` is no longer present. The only flags are `--research` (force re-run) and `--skip-verify`. No skip path for research.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:56-73` — Step 5 opens with lens-aware reuse check, then spawns research if RESEARCH.md absent or stale. No branch exits without research or reuse.
  - Reasoning: All paths through Step 5 either reuse existing (matching lens) or spawn fresh research. No "skip to Step 6 without research" path survives.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:327` — `Research completed (or existing research reused when lens matches)` — success_criteria explicitly names both outcomes; no "skipped" variant.

**Cross-layer observations:** None.

---

### EU-02: All 6 research gatherers actually spawn in parallel

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:90` — `Spawn all 6 gatherers simultaneously (parallel Task calls -- do NOT wait for one before spawning the next):`
  - Reasoning: Explicit parallelism instruction. All 6 Task() blocks follow on lines 93-133 without any wait/dependency between them.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:136-145` — File existence check loop for all 6 output files after completion.
  - Reasoning: 6 output files are checked, confirming 6 gatherers were expected to run.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:161-166` — Failure path: `Present options to user via AskUserQuestion: "Provide context directly" / "Abort"`. `Do NOT offer "skip research" as an option.`
  - Reasoning: EU-02 acceptance criteria "failure path = provide context or abort, not skip" is explicitly satisfied.

**Cross-layer observations:** None.

---

### FN-01: Replace ambiguous delegation with explicit Task() blocks in plan.md

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:93-98` — Domain Truth Task() block with `prompt`, `subagent_type="gsd-research-domain"`, `model="sonnet"`, `description` fields.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:100-134` — Five more gatherer Task() blocks in identical structure (system, intent, tech, edges, prior-art). All 6 present.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:147-158` — Synthesizer Task() block: `subagent_type="gsd-research-synthesizer"`, `model="inherit"`. Seventh Task() as specified.
- Grep result confirms zero matches for "Invoke" or bare "@research-workflow" in plan.md — anti-pattern fully replaced.
  - Reasoning: FN-01 requires "6 explicit Task() blocks, one per gatherer" + "7th Task() block spawns the synthesizer" + no "Invoke" or bare @workflow.md. All three sub-behaviors are satisfied.

**Cross-layer observations:** None.

---

### FN-02: Replace ambiguous delegation in framing-pipeline.md Stage 1

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:105` — `Spawn all 6 gatherers simultaneously (parallel Task calls -- do NOT wait for one before spawning the next):`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:108-148` — All 6 gatherer Task() blocks with `prompt`, `subagent_type`, `model="sonnet"`, `description` fields.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:167-172` — Synthesizer Task() with `model="inherit"`. 7th Task() present.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:94-103` — Framing context embedded in context payload: `Lens direction: {LENS_METADATA.direction}`, `Lens tone: {LENS_METADATA.tone}`, `Research focus: {lens-specific focus}`, `Brief path: {BRIEF_PATH}`.
  - Reasoning: FN-02 requires 6+1 Task() blocks and framing context embedded in gatherer prompts. Both are satisfied. Pattern is consistent with plan.md Step 5.

**Cross-layer observations:** None.

---

### FN-03: Lens-aware research reuse

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:63-65` — `test -f "${feature_dir}/RESEARCH.md" && test -s "${feature_dir}/RESEARCH.md"` — absence check gate.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:68` — `If RESEARCH.md does not exist: Run research` — missing file → run.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:70-73` — Frontmatter extraction: `Extract \`lens\` and \`secondary_lens\` fields. If \`lens\` matches current \`LENS\` AND \`secondary_lens\` matches current \`SECONDARY_LENS\` (or both are absent/null): Reuse existing RESEARCH.md. Skip to Step 6.`
  - Reasoning: Tuple equality comparison (primary AND secondary must match) is implemented. The "(or both are absent/null)" clause handles the edge case where neither has a secondary lens.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:72` — `If lens mismatch: Re-run research. Log reason: "Existing research used {frontmatter_lens}, current work uses {LENS}. Re-running."`
  - Reasoning: Mismatch path with log message exactly as specified.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:73` — `If RESEARCH.md exists but has no frontmatter or no \`lens\` field: Treat as stale. Re-run research.`
  - Reasoning: No-frontmatter → stale path implemented.

**Cross-layer observations:** SECONDARY_LENS is not declared as a named input in plan.md's `<inputs>` block (lines 10-15). The block lists CAPABILITY_SLUG, FEATURE_SLUG, LENS, ANCHOR_QUESTIONS_PATH only. SECONDARY_LENS is referenced in the reuse logic (line 71) and the context payload (line 84) but has no formal input declaration. This creates a behavioral gap: when plan.md is invoked directly (not from framing-pipeline), SECONDARY_LENS may be undefined. The reuse logic's "or both are absent/null" clause partially mitigates this, but the input contract is incomplete. Flagged as cross-layer (input contract) — not a functional requirement deviation since FN-03 does not specify the inputs block.

---

### FN-04: Persist lens metadata in RESEARCH.md output

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:153` (synthesizer Task prompt, embedded) — `IMPORTANT: Begin RESEARCH.md with YAML frontmatter:\n---\nlens: {LENS}\nsecondary_lens: {SECONDARY_LENS or null}\nsubject: {CAPABILITY_SLUG}/{FEATURE_SLUG}\ndate: {ISO date today}\n---`
  - Reasoning: The synthesizer Task() prompt explicitly instructs the synthesizer to write all 4 required frontmatter fields (lens, secondary_lens, subject, date). This is the specified mechanism for FN-04.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:168` — Identical YAML frontmatter instruction in the framing-pipeline synthesizer Task() prompt.
  - Reasoning: Both callers (plan.md and framing-pipeline.md) instruct the synthesizer to write frontmatter. TC-02 double-research prevention depends on this, and it is consistently implemented in both callers.

**Cross-layer observations:** None.

---

### FN-05: Audit all workflows for @workflow.md delegation anti-pattern

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:259-303` — Full audit classification table present with 17+ instances across 8 files, 8 files clean.
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:265-292` — Each instance classified as cat 1/2/3 with disposition. Cat 1 instances (3 found) all have assigned fixes. Cat 2 (7 instances) documented as "Document only." Cat 3 (12+ instances) documented as "Correct usage. No action."
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:294-297` — Summary counts: 3 cat 1 (all fixed), 7 cat 2 (documented), 12+ cat 3 (correct).
  - Reasoning: FN-05 requires enumeration + classification + documentation of dispositions for all instances. The audit table satisfies all three.

**Cross-layer observations:** None.

---

### FN-06: Replace ambiguous delegation in review.md with explicit Task() blocks

**Verdict:** not met (proven) — partial

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:61` — `Spawn all 4 reviewers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:63-90` — All 4 reviewer Task() blocks present: enduser (`gsd-review-enduser`, `model="sonnet"`), functional (`gsd-review-functional`, `model="sonnet"`), technical (`gsd-review-technical`, `model="sonnet"`), quality (`gsd-universal-quality-reviewer`, `model="sonnet"`).
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:106-112` — Synthesizer Task() block: `subagent_type="gsd-review-synthesizer"`, `model="inherit"`.
  - Reasoning: The 4+1 Task() block requirement is satisfied.
- **DEVIATION:** `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:6` — `@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md` still present in required_reading block.
  - FN-06 spec states: `"The \`@gather-synthesize.md\` required_reading reference is removed — review.md owns the spawn logic directly"` (`FEATURE.md:216`).
  - The file still includes this reference at line 6. The FN-06 behavior contract is not fully met: the reference removal is an explicit named behavior in the requirement and it is not implemented.
- **Conflict note:** The audit table (`FEATURE.md:282`) classifies `review.md line 6 @gather-synthesize.md` as Category 3 / correct usage / no action. This contradicts FN-06's explicit instruction to remove it. The functional requirement (FN-06) governs; the audit table classification is inconsistent with the requirement. The deviation stands.

**Cross-layer observations:** review.md `key_constraints` line 182 still reads "Follows gather-synthesize pattern with review-specific parameters" — this is a documentation remnant consistent with the required_reading not being removed. Not a functional deviation (it is a description, not a delegation), but it is evidence that the cleanup was incomplete.

---

### FN-07: Reframe research-workflow.md as reference documentation

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md:1-4` (purpose block) — `Reference documentation for the research gather-synthesize pattern. Describes the 6 specialist research gatherers, context assembly layers, and output structure used when plan.md or framing-pipeline.md spawn research. Callers (plan.md Step 5, framing-pipeline.md Stage 1) own the actual Task() spawns.`
  - Reasoning: Purpose block explicitly reframes file as reference documentation. The phrase "Callers...own the actual Task() spawns" directly implements the FN-07 intent.
- Grep confirms zero matches for "Invoke" or "Delegate to" in research-workflow.md.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md:145-153` — Step 5 uses descriptive language: `"When callers spawn the 6 gatherers, the execution follows the gather-synthesize pattern described in \`gather-synthesize.md\`:"` followed by numbered description — not imperative "Execute" or "Invoke" language.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md:216-217` — `key_constraints` confirms: `"This is reference documentation for the research gather-synthesize pattern. Callers own the actual Task() spawns."`
  - Reasoning: FN-07 requires no "Invoke"/"Delegate to", Step 5 rewritten descriptively, purpose block updated, and existing content preserved. All sub-behaviors satisfied.

**Cross-layer observations:** None.

---

### TC-01: Task() block structure for gatherer spawns

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:93-98` — Domain Truth gatherer Task() block: all 4 fields present (`prompt`, `subagent_type="gsd-research-domain"`, `model="sonnet"`, `description`).
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:155` — Synthesizer block: `model="inherit"` — judge role uses inherit.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:108-113` — Domain Truth gatherer Task() in framing-pipeline: same 4-field structure.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:170` — Synthesizer: `model="inherit"`.
  - Reasoning: TC-01 specifies prompt/subagent_type/model/description fields; model=sonnet for executors, model=inherit for judges. Both callers implement this correctly across all 7 Task() blocks each.

**Cross-layer observations:** None.

---

### TC-02: Double-research prevention

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:167-172` — Synthesizer Task() in Stage 1 instructs writing RESEARCH.md with lens frontmatter to `{FEATURE_DIR}/RESEARCH.md`.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:63-71` — plan.md Step 5 checks for RESEARCH.md existence, reads frontmatter, matches lens. On match → reuse, skip to Step 6.
  - Reasoning: The chain is: framing-pipeline Stage 1 writes RESEARCH.md with `lens: {LENS}` frontmatter → Stage 3 invokes plan.md → plan.md Step 5 finds RESEARCH.md, frontmatter lens matches pipeline lens → reuses. TC-02 states "the lens-aware reuse logic (FN-03) handles this case naturally — no additional mechanism needed if FN-03 and FN-04 are implemented correctly." FN-03 and FN-04 are both implemented, therefore TC-02 is met.

**Cross-layer observations:** None.

---

### TC-03: Skip gate removal scope

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:31` — `Extract flags: \`--research\`, \`--skip-verify\`.` — `--skip-research` is absent.
- Grep for `skip-research`, `research_enabled`, `has_research` in plan.md returns zero matches.
  - Reasoning: TC-03 specifies removal of `--skip-research`, `research_enabled`, and `has_research` from plan.md workflow text. None of the three identifiers appear in the file.
- TC-03 constraint: "`has_research` binary check is replaced by lens-aware logic (FN-03), not simply removed." plan.md:63-73 shows lens-aware logic in place of any binary check.
- TC-03 constraint: "framing-pipeline.md Stage 1 had no skip gates (already mandatory) — only plan.md needs skip gate removal." framing-pipeline.md Stage 1 has no skip gates, consistent with this constraint.

**Cross-layer observations:** None.

---

### TC-04: Workflow audit classification criteria

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:267-292` — Audit table rows apply exactly the three category definitions from TC-04: cat 1 = parallel spawn instances have "FIX in Plan 0X" dispositions; cat 2 = sequential handoffs have "Document only" dispositions; cat 3 = context refs have "Correct usage. No action" dispositions.
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:269-271` — Three Category 1 instances identified (plan.md, framing-pipeline.md, research-workflow.md) with assigned fix plans.
  - Reasoning: TC-04 requires the classification criteria be applied during the audit. The audit table in FEATURE.md demonstrates correct application of all three category definitions with consistent dispositions. Downstream: Plan 03 Task 2 and the workflow files confirm the Category 1 fixes were executed.

**Cross-layer observations:** None.

---

### TC-05: Task() block structure for reviewer spawns

**Verdict:** met (proven)

**Evidence:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:64-69` — End-user reviewer: `subagent_type="gsd-review-enduser"`, `model="sonnet"`.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:72-76` — Functional reviewer: `subagent_type="gsd-review-functional"`, `model="sonnet"`.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:78-83` — Technical reviewer: `subagent_type="gsd-review-technical"`, `model="sonnet"`.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:85-90` — Quality reviewer: `subagent_type="gsd-universal-quality-reviewer"`, `model="sonnet"`. TC-05 specifically notes this subagent_type. Confirmed correct.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:107-112` — Synthesizer: `subagent_type="gsd-review-synthesizer"`, `model="inherit"`. Judge role confirmed.
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:140` — Re-review instruction: `re-spawn only affected reviewers using the same Task() blocks from Step 4`.
  - Reasoning: All TC-05 constraints satisfied: model=sonnet for reviewers, model=inherit for synthesizer, correct subagent_types including `gsd-universal-quality-reviewer` for quality, re-review uses same Task() pattern.

**Cross-layer observations:** None.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | met | plan.md:31 — `--skip-research` absent; plan.md:327 — success_criteria names only "completed or reused" |
| EU-02 | met | plan.md:90 — explicit parallel instruction; plan.md:161-166 — failure path = "provide context" or "abort", not skip |
| FN-01 | met | plan.md:93-134 — 6 gatherer Task() blocks; plan.md:147-158 — synthesizer Task(); zero "Invoke" matches |
| FN-02 | met | framing-pipeline.md:108-148 — 6 gatherer Task() blocks; lines:94-103 — framing context embedded |
| FN-03 | met | plan.md:63-73 — full 5-branch reuse logic with tuple equality, mismatch log, stale handling |
| FN-04 | met | plan.md:153 + framing-pipeline.md:168 — synthesizer Task() instructs 4-field YAML frontmatter in both callers |
| FN-05 | met | FEATURE.md:265-297 — full audit table with 17+ instances classified and dispositioned |
| FN-06 | not met | review.md:6 — `@gather-synthesize.md` still present in required_reading; FN-06:216 explicitly requires removal |
| FN-07 | met | research-workflow.md:1-4 — purpose reframed; research-workflow.md:145-153 — Step 5 descriptive not imperative; zero "Invoke" matches |
| TC-01 | met | plan.md:93-98 — 4-field Task() structure; plan.md:155 + framing-pipeline.md:170 — model="inherit" for synthesizers |
| TC-02 | met | framing-pipeline.md:167-172 → plan.md:63-71 — natural reuse chain via FN-03+FN-04 |
| TC-03 | met | plan.md:31 — `--skip-research` absent; grep confirms zero matches for all three removed identifiers |
| TC-04 | met | FEATURE.md:269-292 — audit table applies all 3 classification criteria with correct dispositions |
| TC-05 | met | review.md:87 — `gsd-universal-quality-reviewer` confirmed; review.md:110 — `model="inherit"` for synthesizer |

---

**Not met count:** 1 (FN-06)
**Met count:** 13

**FN-06 deviation summary:** review.md line 6 retains `@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md` in required_reading. FEATURE.md:216 states this reference must be removed as part of FN-06 ("review.md owns the spawn logic directly"). The audit table entry at FEATURE.md:282 classifies this same reference as Category 3 / no action — an internal contradiction in the feature documentation. The functional requirement (FN-06) is the governing contract. The deviation is proven by file:line comparison between the requirement and the artifact.
