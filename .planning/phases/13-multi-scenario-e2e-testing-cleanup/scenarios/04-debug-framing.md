# Scenario 04: Debug Framing -- Timer Countdown Bug

**Persona:** "The workout timer isn't counting down correctly -- it skips seconds and sometimes freezes at 0."
**Date:** 2026-03-02
**Verdict:** PASS

---

## 1. Command File: debug.md

| Check | Result | Detail |
|-------|--------|--------|
| References framing-discovery.md | PASS | `@~/.claude/get-shit-done/workflows/framing-discovery.md` in execution_context (line 28) |
| LENS=debug | PASS | `gsd-tools init framing-discovery debug` (line 37), `LENS=debug` passed to process (line 43) |
| Anchor questions path | PASS | Resolved via `init framing-discovery debug` -> `get-shit-done/framings/debug/anchor-questions.md` |
| @file references resolve | PASS | All 3 refs resolve: framing-discovery.md, framing-lenses.md, ui-brand.md |

## 2. Debug Anchor Questions

**Directory:** `get-shit-done/framings/debug/` -- EXISTS
**File:** `anchor-questions.md` (2378 bytes)

**Questions are debug-specific (Detective mode):**
1. "What exactly is happening?" -- observable symptom without interpretation
2. "When did it start, and what changed?" -- timeline and change surface
3. "Can you make it happen reliably?" -- reproduction path
4. "What have you already tried or ruled out?" -- existing evidence
5. "Where does the system boundary lie?" -- fault domain isolation

**MVU Slots:** symptom, reproduction_path, hypothesis -- correct per framing-lenses.md

**Branching hints present:** Each question has branching hints for vague/clear/multiple answers. Cross-lens detection: Q2 "it never worked" pivots past reproduction (may be misunderstanding, not regression).

## 3. Framing-Discovery Trace (LENS=debug)

**init framing-discovery debug** returns valid JSON:
```json
{
  "lens": "debug",
  "mvu_slots": ["symptom", "reproduction_path", "hypothesis"],
  "anchor_questions_path": "get-shit-done/framings/debug/anchor-questions.md",
  "anchor_questions_exists": true,
  "framing_lenses_path": "get-shit-done/references/framing-lenses.md",
  "framing_lenses_exists": true,
  "brief_template_path": "get-shit-done/templates/discovery-brief.md"
}
```

**Discovery simulation (timer countdown bug):**
- Q1 (symptom): Timer skips seconds during countdown. Sometimes freezes at 0 instead of triggering completion. Observed on rest timer between sets.
- Q2 (when/what changed): Started after adding background music feature. The audio sync uses its own setInterval.
- Q3 (reproduction): Start a workout -> complete first set -> rest timer starts -> play background music -> timer skips. Reproducible ~80% of the time.
- Q4 (tried): Checked if disabling music fixes it (it does). Haven't looked at the interval code yet.
- Q5 (boundary): Our code. Two competing setInterval calls likely causing the issue.

**MVU tracking:**
- symptom: FILLED by Q1 (timer skips, freezes at 0)
- reproduction_path: FILLED by Q3 (specific steps, 80% repro rate, music correlation)
- hypothesis: FILLED by Q4-Q5 (competing setIntervals from audio sync and timer)

## 4. Convergence to Framing Pipeline

| Check | Result | Detail |
|-------|--------|--------|
| framing-discovery.md hands off to framing-pipeline.md | PASS | Line 246-259: invokes framing-pipeline with BRIEF_PATH, LENS, SECONDARY_LENS, CAPABILITY_SLUG, CAPABILITY_NAME |
| LENS propagates through pipeline | PASS | All 6 stages receive debug-specific guidance |
| Debug-specific pipeline behavior | PASS | Research: "reproduction environment, error paths, dependency versions"; Requirements: rich TC layer; Plan: "conservative, isolate the fix, minimize blast radius"; Execute: "diagnostic-first, verify hypothesis before fixing"; Review: "verify root cause addressed, not just symptom" |

## 5. Feature Creation Test

```
node gsd-tools.cjs feature-create workout-routines timer-fix --cwd=/tmp/gsd-test-workout
```

**Result:** SUCCESS
```json
{
  "created": true,
  "slug": "timer-fix",
  "capability_slug": "workout-routines",
  "path": ".planning/capabilities/workout-routines/features/timer-fix",
  "feature_path": ".planning/capabilities/workout-routines/features/timer-fix/FEATURE.md"
}
```

## 6. Findings

No new findings. Debug framing is correctly wired:
- Command file references framing-discovery.md with LENS=debug
- Anchor questions are detective-mode specific (backward: symptom -> root cause)
- init route returns correct MVU slots (symptom, reproduction_path, hypothesis)
- Pipeline provides debug-specific behavioral guidance at each stage

## 7. Verdict

**PASS** -- Debug framing loads correct anchor questions (5 detective-mode questions), discovery converges to pipeline via framing-discovery -> framing-pipeline handoff, LENS=debug propagates through all 6 pipeline stages with debug-specific behavioral guidance (conservative risk posture, diagnostic-first execution, root cause verification in review).
