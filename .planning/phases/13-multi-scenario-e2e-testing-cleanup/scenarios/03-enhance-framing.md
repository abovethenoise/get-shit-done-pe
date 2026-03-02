# Scenario 03: Enhance Framing -- Add Weekly Progress Tracker

**Persona:** "I want to add a weekly progress tracker to see how my workouts are trending over time."
**Date:** 2026-03-02
**Verdict:** PASS

---

## 1. Command File: enhance.md

| Check | Result | Detail |
|-------|--------|--------|
| References framing-discovery.md | PASS | `@~/.claude/get-shit-done/workflows/framing-discovery.md` in execution_context (line 28) |
| LENS=enhance | PASS | `gsd-tools init framing-discovery enhance` (line 37), `LENS=enhance` passed to process (line 43) |
| Anchor questions path | PASS | Resolved via `init framing-discovery enhance` -> `get-shit-done/framings/enhance/anchor-questions.md` |
| @file references resolve | PASS | All 3 refs resolve: framing-discovery.md, framing-lenses.md, ui-brand.md |

## 2. Enhance Anchor Questions

**Directory:** `get-shit-done/framings/enhance/` -- EXISTS
**File:** `anchor-questions.md` (2440 bytes)

**Questions are enhance-specific (Editor mode):**
1. "What does the system do today?" -- grounds in current behavior
2. "What should it do instead (or additionally)?" -- desired end state
3. "What is the delta between current and desired?" -- identifies the seam
4. "What must NOT change?" -- behavioral invariants
5. "How does this fit with what is planned or in progress?" -- conflict detection

**MVU Slots:** current_behavior, desired_behavior, delta -- correct per framing-lenses.md

**Branching hints present:** Each question has branching hints for vague/clear/multi-part answers and cross-lens detection flags (/new detection in Q2, /refactor detection in Q3).

## 3. Framing-Discovery Trace (LENS=enhance)

**init framing-discovery enhance** returns valid JSON:
```json
{
  "lens": "enhance",
  "mvu_slots": ["current_behavior", "desired_behavior", "delta"],
  "anchor_questions_path": "get-shit-done/framings/enhance/anchor-questions.md",
  "anchor_questions_exists": true,
  "framing_lenses_path": "get-shit-done/references/framing-lenses.md",
  "framing_lenses_exists": true,
  "brief_template_path": "get-shit-done/templates/discovery-brief.md"
}
```

**Discovery simulation (weekly progress tracker):**
- Q1 (current behavior): The workout generator creates daily exercise sets but provides no historical view. Each session is standalone.
- Q2 (desired behavior): After each workout, users see a weekly trend chart showing volume, consistency, and progression. Existing workout generation stays unchanged.
- Q3 (delta): Add a data aggregation layer that reads workout history and a visualization component. Seam: post-workout completion hook -> aggregate -> render.
- Q4 (invariants): Workout generation algorithm must not change. Exercise selection interface must stay the same.
- Q5 (fit): No conflicts with existing features.

**MVU tracking:** All 3 slots (current_behavior, desired_behavior, delta) would be filled by Q3. Q4-Q5 provide scope boundary data.

## 4. Convergence to Framing Pipeline

| Check | Result | Detail |
|-------|--------|--------|
| framing-discovery.md hands off to framing-pipeline.md | PASS | Line 246-259: invokes `@~/.claude/get-shit-done/workflows/framing-pipeline.md` with BRIEF_PATH, LENS, SECONDARY_LENS, CAPABILITY_SLUG, CAPABILITY_NAME |
| LENS propagates through pipeline | PASS | framing-pipeline.md references LENS 23+ times; passes to all 6 stages (research, requirements, plan, execute, review, doc) |
| Pipeline reads anchor questions | PASS | `ANCHOR_QUESTIONS_PATH="get-shit-done/framings/${LENS}/anchor-questions.md"` (line 47) |
| Lens-specific behavior per stage | PASS | Each stage has enhance-specific guidance (e.g., research: "existing module boundaries, integration points, test coverage"; requirements: rich FN layer; plan: "targeted, extend through existing seams"; execute: "surgical, modify through existing seams") |

## 5. Feature Creation Test

```
node gsd-tools.cjs feature-create workout-routines weekly-progress --cwd=/tmp/gsd-test-workout
```

**Result:** SUCCESS
```json
{
  "created": true,
  "slug": "weekly-progress",
  "capability_slug": "workout-routines",
  "path": ".planning/capabilities/workout-routines/features/weekly-progress",
  "feature_path": ".planning/capabilities/workout-routines/features/weekly-progress/FEATURE.md"
}
```

## 6. Findings

No new findings from this scenario. All enhance framing components exist and are correctly wired:
- Command file references framing-discovery.md with LENS=enhance
- Anchor questions exist and are enhance-specific (Editor mode: outward direction)
- init route returns correct MVU slots and paths
- framing-discovery hands off to framing-pipeline with LENS propagation
- feature-create works for the enhance scenario

## 7. Verdict

**PASS** -- Enhance framing loads correct anchor questions (5 questions with Editor-mode framing), discovery converges to pipeline via framing-discovery -> framing-pipeline handoff, and LENS propagates through all 6 pipeline stages with enhance-specific behavioral guidance at each stage.
