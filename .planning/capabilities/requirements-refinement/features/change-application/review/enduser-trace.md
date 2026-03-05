# End-User Trace Report: change-application

**Date:** 2026-03-05
**Artifact:** `get-shit-done/workflows/change-application.md`
**Reviewer:** End-User proxy

---

## Phase 1: Internalize Requirements

### EU-01: Apply confirmed changes to project artifacts
"Met" means:
1. ACCEPT and MODIFY entries from CHANGESET.md are applied to cap/feature files
2. REJECT and RESEARCH_NEEDED entries are logged but not executed
3. CLI route used when available; direct edit with UNVALIDATED flag as fallback
4. Safe execution order (creates before moves before kills)
5. Output is a DELTA.md execution log consumed by refinement-artifact

### EU-02: Graceful failure handling with user control
"Met" means:
1. On failure, execution halts immediately
2. User sees: applied entries, failed entry with reason, pending entries
3. User chooses: fix and resume, skip and continue, or abort
4. Skipped entries logged in DELTA.md with SKIPPED status

---

## Phase 2: Trace Against Code

### EU-01: Apply confirmed changes to project artifacts

**Verdict:** met

**Evidence:**

- **AC-1 (ACCEPT/MODIFY applied):** `change-application.md:25-26` -- `actionable: type is ACCEPT, MODIFY, USER_INITIATED, or ASSUMPTION_OVERRIDE` and `logged_only: type is REJECT or RESEARCH_NEEDED`. The workflow filters entries and only executes the actionable set. The execute_mutations step (lines 82-162) iterates over each PENDING entry and applies it.

- **AC-2 (REJECT/RESEARCH_NEEDED logged only):** `change-application.md:27` -- `logged_only: type is REJECT or RESEARCH_NEEDED`. These entries are excluded from execution. They appear in the EXECUTION-LOG.md under "Logged Only" (lines 203-210): `Type: REJECT / Reasoning: {user's rejection reasoning}` and `Type: RESEARCH_NEEDED / Reasoning: {research question}`.

- **AC-3 (CLI route first, fallback with UNVALIDATED):** `change-application.md:91-93` -- create-capability uses `gsd-tools.cjs capability-create`; lines 96-98 -- create-feature uses `gsd-tools.cjs feature-create`. Lines 100-125 show move-feature, modify-metadata, reinstate, defer, and kill all use direct edit and are marked UNVALIDATED. Line 126: `-> APPLIED{if UNVALIDATED: ' (UNVALIDATED)'}`. Confirmed CLI routes exist in `gsd-tools.cjs:384-404`.

- **AC-4 (Safe execution order):** `change-application.md:48-58` -- 8-level topological sort: (1) create capabilities, (2) create feature stubs, (3) move features, (4) modify metadata, (5) reinstate, (6) defer, (7) kill features, (8) kill capabilities.

- **AC-5 (Output is execution log):** `change-application.md:213` -- `Write to .planning/refinement/EXECUTION-LOG.md using the Write tool.` The format includes frontmatter with counts and per-entry results (lines 167-211).

**Cross-layer observations:**

- The FEATURE.md (lines 124-128, 175-187) references "DELTA.md" at path `.planning/refinement/DELTA.md`. The workflow implementation uses the name "EXECUTION-LOG.md" at the same path. This is a naming deviation from the FEATURE.md spec. The feature_context notes this was an intentional rename ("now called EXECUTION-LOG.md per implementation"), so the downstream consumer (refinement-artifact) must also reference EXECUTION-LOG.md. This is a spec-vs-implementation divergence that should be tracked.

- EU-01 AC-1 mentions only ACCEPT and MODIFY, but FN-01 (lines 70) and the workflow (line 25) also include USER_INITIATED and ASSUMPTION_OVERRIDE as actionable types. This is an expansion beyond the EU-01 acceptance criteria wording. Since FN-01 explicitly lists these additional types, this is likely intentional scope broadening at the functional layer, but the EU wording is narrower.

---

### EU-02: Graceful failure handling with user control

**Verdict:** met

**Evidence:**

- **AC-1 (Halt on failure):** `change-application.md:128-138` -- On failure, a banner is printed: `MUTATION FAILED`, with failed entry ID, error, applied list, and pending list. Execution halts before proceeding to the next entry.

- **AC-2 (User sees applied/failed/pending):** `change-application.md:131-137` -- `Applied so far: {list}` and `Pending: {list}` are printed. The AskUserQuestion (lines 141-143) includes: `Applied: {applied_count} | Pending: {pending_count}` with the error message.

- **AC-3 (Three user options):** `change-application.md:143` -- `options: ["Fix and resume", "Skip and continue", "Abort"]`. Lines 147-161 detail each option's behavior: Fix and resume retries the same entry (line 149), Skip marks SKIPPED and continues (lines 153-155), Abort leaves remaining as PENDING and writes final log (lines 158-161).

- **AC-4 (Skipped entries logged with SKIPPED status):** `change-application.md:153-155` -- `Mark SKIPPED with error reason` and `Update EXECUTION-LOG.md`. The log format at line 198-200 shows: `Result: SKIPPED / Reason: {skip reason}`.

**Cross-layer observations:**

- EU-02 AC-4 says "logged in DELTA.md" but the workflow writes to EXECUTION-LOG.md. Same naming deviation noted in EU-01. The behavior is functionally equivalent -- the file exists, contains skipped entries with SKIPPED status.

- The "Fix and resume" path (line 148-150) includes a recursive failure handler if the retry also fails. This is a reasonable UX choice but is not explicitly stated in the EU-02 acceptance criteria. Not a gap -- additive behavior.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | met | `change-application.md:25-27` -- actionable/logged_only split; `:48-58` -- 8-level sort; `:91-98` -- CLI routes for create-cap/create-feat; `:100-125` -- direct edit fallback with UNVALIDATED |
| EU-02 | met | `change-application.md:128-143` -- halt, show applied/failed/pending, AskUserQuestion with 3 options; `:153-155` -- SKIPPED status logged |

### Deviations Noted (not verdict-changing, tracked for downstream)

| Item | Detail |
|------|--------|
| DELTA.md vs EXECUTION-LOG.md | FEATURE.md/EU specs say "DELTA.md"; workflow uses "EXECUTION-LOG.md". Same path, different name. Downstream consumer (refinement-artifact) must align. |
| EU-01 AC-1 scope narrower than FN-01 | EU says "ACCEPT and MODIFY"; FN-01/workflow adds USER_INITIATED and ASSUMPTION_OVERRIDE. Functional expansion beyond EU wording. |
