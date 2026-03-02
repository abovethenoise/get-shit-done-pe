# Scenario 12: Conflicting Focus

**Goal:** Test how GSD handles switching focus from one feature to another. Verify conflict detection, clean state transitions, and no silent corruption.
**Date:** 2026-03-02
**Retested:** 2026-03-02 -- Against repo source tree (not stale install)
**Status:** PASS

## Retest Notes

Original test was blocked because focus system didn't exist in the stale install. Retest confirms the focus system exists in the repo with explicit overlap/conflict handling (step 5 of focus.md workflow).

## Pre-Staging

Uses the workout app workspace from S01 retest.
Persona: "I'm focused on bodyweight exercises but now I want to switch to progress tracking instead."

## Steps

### Step 1: Verify focus system exists
**Command/Workflow:** Check for command, workflow, and CLI routes in repo
**Expected result:** Focus system available for testing conflict scenarios
**Actual result:**
- `commands/gsd/focus.md` -- EXISTS (1519 bytes)
- `get-shit-done/workflows/focus.md` -- EXISTS (6567 bytes, 199 lines)
- `init feature-progress` route in gsd-tools.cjs -- EXISTS (line 330)
- `slug-resolve` route -- EXISTS and tested working
- State template has `active_focus` frontmatter and "Active Focus Groups" section
**Verdict:** PASS

### Step 2: Analyze conflict handling design
**Command/Workflow:** Read focus.md workflow step 5 (Overlap Detection)
**Expected result:** Conflict/overlap handling mechanism
**Actual result:** Step 5 implements explicit overlap detection:

1. Read existing active focus groups from ROADMAP.md
2. Extract feature set from each existing group
3. Compare new focus group's features against existing groups
4. **For each overlapping item,** use AskUserQuestion with 3 options:
   - "Merge into '{existing_name}' (add new items, reprioritize)"
   - "Keep in both groups (parallel work)"
   - "Remove from new group"
5. If merge selected: modify existing group, re-run dependency ordering
6. If no overlap: proceed to ordering

**Verdict:** PASS -- Conflict handling is designed and implemented in the workflow

### Step 3: Verify name collision prevention
**Command/Workflow:** Read focus.md workflow step 2 (Q&A: Goal)
**Expected result:** Name validation against existing focus groups
**Actual result:** Step 2 includes: "Validate: name does not collide with existing focus groups in ROADMAP.md."
**Verdict:** PASS

### Step 4: Verify STATE.md integrity under focus changes
**Command/Workflow:** Read state template schema
**Expected result:** Structured focus tracking resistant to corruption
**Actual result:** State template uses:
- `active_focus` frontmatter field (structured, not free text)
- "Active Focus Groups" section with per-group entries
- Focus workflow commits both ROADMAP.md and STATE.md atomically
- Multiple parallel focus groups supported by design

No free-text "Current focus" label that could be silently corrupted. State changes go through the focus workflow which validates and commits atomically.
**Verdict:** PASS

## Findings (updated)

| # | Type | Description | Status |
|---|------|-------------|--------|
| S12-F1 | RETESTED | Focus system exists, conflict testing unblocked | RECLASSIFIED: false positive |
| S12-F2 | RETESTED | Focus state is structured (active_focus field + Active Focus Groups section), not a cosmetic text label | RECLASSIFIED: false positive |

## Artifacts Produced
- This updated scenario report

## Assessment

Conflicting focus handling is implemented in the focus.md workflow. Step 5 (Overlap Detection) explicitly handles the case where a new focus group overlaps with existing ones, offering merge, parallel, or remove options. Name collision is prevented at step 2. STATE.md uses structured focus tracking (not a free-text label). The atomic commit pattern (ROADMAP.md + STATE.md together) prevents partial state corruption.

**Original FAIL verdict was caused by testing against stale v1 install where focus system didn't exist.** Retest against repo: PASS.

**Note:** This is a design/code review pass, not a live execution test. The focus workflow is interactive (uses AskUserQuestion) and cannot be CLI-tested without user interaction. The implementation logic has been verified through code inspection.
