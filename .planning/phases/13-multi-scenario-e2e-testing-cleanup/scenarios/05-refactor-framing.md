# Scenario 05: Refactor Framing -- Data Model Restructuring

**Persona:** "The workout data model is messy -- exercises, routines, and sessions are all tangled in one flat structure. I want to reorganize it."
**Date:** 2026-03-02
**Verdict:** PASS

---

## 1. Command File: refactor.md

| Check | Result | Detail |
|-------|--------|--------|
| References framing-discovery.md | PASS | `@~/.claude/get-shit-done/workflows/framing-discovery.md` in execution_context (line 28) |
| LENS=refactor | PASS | `gsd-tools init framing-discovery refactor` (line 37), `LENS=refactor` passed to process (line 43) |
| Anchor questions path | PASS | Resolved via `init framing-discovery refactor` -> `get-shit-done/framings/refactor/anchor-questions.md` |
| @file references resolve | PASS | All 3 refs resolve: framing-discovery.md, framing-lenses.md, ui-brand.md |

## 2. Refactor Anchor Questions

**Directory:** `get-shit-done/framings/refactor/` -- EXISTS
**File:** `anchor-questions.md` (2603 bytes)

**Questions are refactor-specific (Surgeon mode):**
1. "What is the current design and why does it exist?" -- understand load-bearing walls
2. "What pressure is this design failing under?" -- identify specific pain
3. "What does the target design look like?" -- define destination
4. "What breaks during the transition?" -- map migration risk
5. "What is the behavioral contract that must survive?" -- define invariant surface

**MVU Slots:** current_design, target_design, breakage -- correct per framing-lenses.md

**Branching hints present:** Each question has branching hints. Cross-lens detection: Q2 "pressure is correctness" suggests /debug; Q5 "some behavior should change" suggests compound lens (refactor + enhance).

## 3. Framing-Discovery Trace (LENS=refactor)

**init framing-discovery refactor** returns valid JSON:
```json
{
  "lens": "refactor",
  "mvu_slots": ["current_design", "target_design", "breakage"],
  "anchor_questions_path": "get-shit-done/framings/refactor/anchor-questions.md",
  "anchor_questions_exists": true,
  "framing_lenses_path": "get-shit-done/references/framing-lenses.md",
  "framing_lenses_exists": true,
  "brief_template_path": "get-shit-done/templates/discovery-brief.md"
}
```

**Discovery simulation (data model restructuring):**
- Q1 (current design): Single flat JSON structure containing exercises, routines, and sessions. Grew organically -- started as just exercises, then routines were bolted on, then session tracking added. No separation of concerns.
- Q2 (pressure): Complexity. Adding the weekly progress tracker (S03 enhance) requires querying sessions separately, but they are embedded in the monolithic structure. Takes too long to change anything.
- Q3 (target design): Three separate models: exercises (catalog), routines (templates), sessions (history). Each with its own schema. Routines reference exercises by ID. Sessions reference routines by ID.
- Q4 (breakage): Workout generator reads the flat structure directly -- must be updated. Session history must be migrated (data migration). No external consumers beyond the app itself.
- Q5 (behavioral contract): Workout generation must produce identical results. Historical session data must be preserved and queryable.

**MVU tracking:**
- current_design: FILLED by Q1 (flat JSON, organic growth, no separation)
- target_design: FILLED by Q3 (3 models with referential integrity)
- breakage: FILLED by Q4 (workout generator update, data migration)

## 4. Convergence to Framing Pipeline

| Check | Result | Detail |
|-------|--------|--------|
| framing-discovery.md hands off to framing-pipeline.md | PASS | Line 246-259: invokes framing-pipeline with all context |
| LENS propagates through pipeline | PASS | All 6 stages receive refactor-specific guidance |
| Refactor-specific pipeline behavior | PASS | Research: "dependency mapping, consumer contracts, migration precedents"; Requirements: rich TC layer; Plan: "maximum caution, migration-first ordering, behavioral tests before structural changes, rollback plan"; Execute: "incremental migration, each step leaves system working"; Review: "verify external behavior unchanged, structural goals met, no half-states" |

## 5. Feature Creation Test

```
node gsd-tools.cjs feature-create workout-routines data-model-refactor --cwd=/tmp/gsd-test-workout
```

**Result:** SUCCESS
```json
{
  "created": true,
  "slug": "data-model-refactor",
  "capability_slug": "workout-routines",
  "path": ".planning/capabilities/workout-routines/features/data-model-refactor",
  "feature_path": ".planning/capabilities/workout-routines/features/data-model-refactor/FEATURE.md"
}
```

## 6. Findings

No new findings. Refactor framing is correctly wired:
- Command file references framing-discovery.md with LENS=refactor
- Anchor questions are surgeon-mode specific (underneath: restructure without changing external behavior)
- init route returns correct MVU slots (current_design, target_design, breakage)
- Pipeline provides refactor-specific behavioral guidance at each stage (maximum caution risk posture)

## 7. Verdict

**PASS** -- Refactor framing loads correct anchor questions (5 surgeon-mode questions), discovery converges to pipeline via framing-discovery -> framing-pipeline handoff, LENS=refactor propagates through all 6 pipeline stages with refactor-specific behavioral guidance (maximum caution risk posture, incremental migration execution, behavioral invariant verification in review).

---

## Cross-Framing Verification (All 4 Framings)

| Framing | Command File | Points to framing-discovery.md | LENS Passed | Anchor Qs Exist | Anchor Qs Lens-Specific | MVU Slots Correct | Converges to Pipeline |
|---------|-------------|-------------------------------|-------------|-----------------|------------------------|-------------------|----------------------|
| new | commands/gsd/new.md | PASS | new | PASS (6 questions) | PASS (Architect mode) | problem, who, done_criteria, constraints | PASS |
| enhance | commands/gsd/enhance.md | PASS | enhance | PASS (5 questions) | PASS (Editor mode) | current_behavior, desired_behavior, delta | PASS |
| debug | commands/gsd/debug.md | PASS | debug | PASS (5 questions) | PASS (Detective mode) | symptom, reproduction_path, hypothesis | PASS |
| refactor | commands/gsd/refactor.md | PASS | refactor | PASS (5 questions) | PASS (Surgeon mode) | current_design, target_design, breakage | PASS |

**Shared infrastructure verification:**
- All 4 commands reference `@~/.claude/get-shit-done/workflows/framing-discovery.md` -- PASS
- framing-discovery.md handles all 4 LENS values via `init framing-discovery ${LENS}` -- PASS
- framing-discovery.md hands off to framing-pipeline.md (line 246-259) -- PASS
- framing-pipeline.md propagates LENS to all 6 downstream stages -- PASS (23 LENS references in pipeline)
- framing-lenses.md defines all 4 lenses with MVU slots, directions, tones, and cross-framing detection rules -- PASS
