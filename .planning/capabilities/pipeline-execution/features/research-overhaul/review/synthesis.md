## Review Synthesis

**Feature:** pipeline-execution/research-overhaul
**Lens:** enhance
**Date:** 2026-03-04
**Reviewers:** end-user, functional, technical, quality

---

### Quality Reviewer File Path Note

The quality reviewer read stale files at `~/.claude/get-shit-done/workflows/` (the installed copy) rather than the repo source tree at `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/`. This is confirmed by direct verification:

- Quality cited `~/.claude/.../plan.md:57` — `--skip-research flag, or research_enabled is false` — that line exists verbatim in the installed copy
- Repo source `plan.md:57` reads `**Lens-aware reuse check:**` — the anti-pattern is not there
- Quality cited zero Task() blocks in framing-pipeline.md and review.md — both files in the repo source contain the full 6+1 and 4+1 Task() blocks respectively

**Result:** Quality Findings 1-6 are false positives. Quality Finding 7 (FEATURE.md count discrepancy) is the only finding that references the correct repo path and is evaluated on its merits.

---

### Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 4 | 1 | `plan.md:307` cited as "Skipped" present — verified at line 307: `Research: {Completed | Used existing | Skipped}` — valid. `plan.md:327` cited by functional contradicts EU-01 verdict; both lines verified. See conflicts. |
| functional | 5 | 5 | 0 | All citations verified including FN-06 deviation at `review.md:6` and `FEATURE.md:216`. Reliable. |
| technical | 5 | 5 | 0 | All citations verified. TC-04 count discrepancy note aligns with table row count (22 rows confirmed). Reliable. |
| quality | 6 | 1 | 5 | Findings 1-6 cite `~/.claude/get-shit-done/workflows/` (stale installed files). Only Finding 7 cites the correct repo path (`/Users/philliphall/get-shit-done-pe/...FEATURE.md:262`). Findings 1-6 are false positives. Weight drastically reduced. |

---

### Findings

#### Finding 1: "Skipped" label present in plan.md completion status display

**Severity:** minor
**Source:** end-user
**Requirement:** EU-01
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:307` — `Research: {Completed | Used existing | Skipped}`
- Reasoning: The Step 12 completion status template presents "Skipped" as a reachable label. The flow logic at plan.md:68-73 has no branch that produces a "Skipped" state — only "Reuse existing" and "Re-run". The label is a documentation artifact from the pre-overhaul version. A user seeing "Research: Skipped" in the completion output would conclude research was bypassed, contradicting the guarantee that research always runs.

**Spot-check:** verified — `plan.md:307` confirmed: `Research: {Completed | Used existing | Skipped}`. `plan.md:327` (success_criteria block) reads `Research completed (or existing research reused when lens matches)` with no "Skipped" variant — functional reviewer's cited line is also accurate and represents a separate, correct location. Both lines exist; they contradict each other. The status display template is the user-facing artifact and is the defect.

**Severity rationale:** Minor, not blocker. The flow logic correctly forbids skipping; the status template is a cosmetic inconsistency. It creates confusion but does not enable a bypass path. The failure path at `plan.md:166` also explicitly reads `Do NOT offer "skip research" as an option.`

---

#### Finding 2: `@gather-synthesize.md` retained in review.md required_reading (FN-06 deviation)

**Severity:** minor
**Source:** functional
**Requirement:** FN-06
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md:6` — `@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md`
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:216` — `The @gather-synthesize.md required_reading reference is removed — review.md owns the spawn logic directly`
- Reasoning: FN-06 explicitly names removal of this reference as a required behavior. The reference is still present. The audit table at `FEATURE.md:282` classifies `review.md:6 @gather-synthesize.md` as Category 3 / correct usage / no action — an internal contradiction in the feature documentation. The functional requirement governs.

**Spot-check:** verified — `review.md:6` confirmed as `@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md`. `FEATURE.md:216` confirmed as quoted. `FEATURE.md:282` confirmed as Category 3 / no action. Contradiction is real.

**Severity rationale:** Minor, not major. The Task() blocks that FN-06 principally required ARE present (review.md lines 64-113, 5 Task() blocks confirmed by grep). The required_reading reference is now a true Cat-3 usage — review.md reads gather-synthesize for context while owning its own spawn logic. The functional reviewer is technically correct that FN-06's prose says to remove it, but the FEATURE.md audit table's Cat-3 classification is arguably the more accurate technical judgment. The reference does not cause incorrect behavior; it is contextually appropriate. However, the requirement says remove it, so it is a not-met finding.

---

#### Finding 3: FEATURE.md audit table count discrepancy (17 vs 22)

**Severity:** minor
**Source:** quality (Finding 7), technical (TC-04 cross-layer observation)
**Requirement:** TC-04 / quality
**Verdict:** not met (documentation only)

**Evidence (from quality reviewer):**
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:262` — `Total @workflow.md references found: 17 instances (across 8 files; 8 files clean)`
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md:295` (03-SUMMARY section) — `22 total instances found across 8 files`
- Table itself contains 22 rows when counted.

**From technical reviewer:** The discrepancy arises because the header counts unique `@reference` tokens while the table rows count workflow locations — some rows bundle multiple references (e.g., execute.md row covers 3 references; framing-pipeline.md required_reading covers 3 files). The counting rule is never documented.

**Spot-check:** verified — `FEATURE.md:262` confirmed as `17 instances`. Table rows counted: 22 rows. Discrepancy is real.

**Severity rationale:** Minor. Classification logic itself is correct and consistently applied (technical reviewer verified this). The discrepancy is a presentation/documentation inconsistency that adds confusion for future audits. Does not affect runtime behavior.

---

#### Finding 4: SECONDARY_LENS not declared in plan.md inputs block

**Severity:** minor
**Source:** functional (FN-03 cross-layer observation)
**Requirement:** FN-03 (cross-layer)
**Verdict:** suspected gap (not a requirement deviation)

**Evidence (from reviewer):**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:10-15` — inputs block lists `CAPABILITY_SLUG, FEATURE_SLUG, LENS, ANCHOR_QUESTIONS_PATH` only
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:71` — `secondary_lens` referenced in reuse logic
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:84` — `SECONDARY_LENS` referenced in context payload
- Reasoning: When plan.md is invoked directly (not from framing-pipeline), SECONDARY_LENS may be undefined. The reuse logic's "or both are absent/null" clause partially mitigates this.

**Spot-check:** not checked (cross-layer observation flagged by functional, not a named requirement).

**Severity rationale:** Minor. The "or both are absent/null" clause provides graceful handling for the undefined case. This is an incomplete input contract, not a broken flow. Flagged for awareness.

---

### Conflicts

#### Disagreements

- **EU-01 verdict:** End-user says "not met (proven)" citing `plan.md:307` ("Skipped" in status display). Functional says "met (proven)" citing `plan.md:327` (success_criteria names only "completed or reused").
  - Resolution: Both citations are verified and accurate — they point to two different locations in the same file. `plan.md:307` is the user-facing completion status template; `plan.md:327` is the success_criteria block (internal verification checklist). These are different constructs. The status display is what a user reads; the success_criteria is what the model checks. EU-01 acceptance criterion 3 states "the status display does not present 'Skipped' as a reachable outcome." The display at line 307 violates this. End-user verdict stands.
  - Tiebreaker applied: yes — end-user > functional per conflict priority ordering. But judgment also supports end-user: the EU acceptance criteria explicitly call out the status display, and functional cited a different document location that does not contradict the display defect.

#### Tensions

- **FN-06 `@gather-synthesize.md` removal:** Functional says "not met" because FN-06 prose requires removal. Technical says "met (TC-05 scope)" and flags the contradiction between FN-06 prose and TC-04 Cat-3 classification without resolving it. The FEATURE.md audit table (TC-04 output) classifies `review.md:6` as Cat-3 correct usage requiring no action, which contradicts FN-06's explicit removal requirement.
  - Assessment: The two requirements conflict. FN-06:216 says remove; TC-04 audit table:282 says no action (Cat-3). The feature documentation is internally inconsistent on this point. Given that the Task() blocks are present (the primary FN-06 deliverable), and given that the Cat-3 classification is technically accurate (review.md now reads gather-synthesize for context rather than delegating to it), the removal is defensible as "no longer needed." However, the requirement text says remove it. The finding stands as minor not-met, and the FEATURE.md should note the resolution of this contradiction explicitly.

- **TC-04 count discrepancy framing:** Quality characterizes it as a "maintenance burden" (KISS violation). Technical characterizes it as a "presentation inconsistency, not a logic error." Both are correct framings that coexist — the inconsistency is real and the classification logic is sound. No conflict to resolve; both perspectives add value.

---

### Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 0     |
| Minor    | 4     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01 | not met | minor | end-user |
| EU-02 | met | — | end-user, functional, technical |
| FN-01 | met | — | functional, technical |
| FN-02 | met | — | functional, technical |
| FN-03 | met | — | functional, technical |
| FN-04 | met | — | functional, technical |
| FN-05 | met | — | functional, technical |
| FN-06 | not met | minor | functional |
| FN-07 | met | — | functional |
| TC-01 | met | — | functional, technical |
| TC-02 | met | — | functional, technical |
| TC-03 | met | — | functional, technical |
| TC-04 | met (doc gap) | minor | technical, quality |
| TC-05 | met | — | functional, technical |
| quality | not met (doc) | minor | quality (Finding 7 — verified) |

**Overall assessment:** Feature is functionally complete and correct. 13 of 14 requirements met. Three minor findings — all documentation/display artifacts, none affecting runtime behavior or the core deliverable (explicit Task() spawning). The two not-met findings (EU-01 status label, FN-06 reference retention) are each single-line fixes.
