# Quality Trace: change-application

## Phase 1: Quality Standards

Evaluating a Claude Code workflow definition (.md) for:
- **Structural parsimony**: Is the workflow as simple as it can be for 7 mutation types + failure handling?
- **Idiomatic consistency**: Does it follow established GSD workflow conventions (sibling files)?
- **DRY**: Are mutation handlers free of redundant logic?
- **Robustness**: Are failure modes, edge cases, and resource safety addressed?
- **Requirement fidelity**: Does the implementation satisfy all 9 requirements without drift?

Artifact under review: `get-shit-done/workflows/change-application.md` (252 lines).

---

## Phase 2: Trace Against Code

### Finding 1: FEATURE.md spec naming drift (DELTA.md vs EXECUTION-LOG.md)

**Category:** Idiomatic Violation

**Verdict:** met (deliberate, documented supersession)

**Evidence:**
- `FEATURE.md:35` -- `"Output is a DELTA.md execution log consumed by refinement-artifact"`
- `FEATURE.md:128-136` -- FN-04 specifies "DELTA.md" throughout
- `FEATURE.md:185` -- TC-02 specifies `Written to .planning/refinement/DELTA.md`
- `01-PLAN.md:97-99` -- `"IMPORTANT: Output file is EXECUTION-LOG.md, NOT DELTA.md. DELTA.md is owned by refinement-artifact for semantic diffs. FEATURE.md spec says 'DELTA.md' but this was superseded by naming collision resolution."`
- `refinement-artifact/RESEARCH.md:80-84` -- Naming collision identified and resolution proposed
- Reasoning: The FEATURE.md requirements (FN-04, TC-02) still reference DELTA.md, but this was a known spec-level collision resolved during research. The workflow correctly uses EXECUTION-LOG.md. The FEATURE.md spec was not retroactively updated, which is a traceability gap but not a code quality issue. The implementation is correct.

---

### Finding 2: Reinstate mutation destructive operations lack granular error handling

**Category:** Resource Management

**Verdict:** suspected regression

**Evidence:**
- `change-application.md:113-116` -- Reinstate step deletes `research/`, `RESEARCH.md`, `*-PLAN.md`, `*-SUMMARY.md` via `rm -rf`
- Reasoning: The reinstate handler performs 4+ filesystem deletions sequentially. If the status update (step 1-3) succeeds but a deletion (step 5) fails partway, the feature is in an inconsistent state: status says `exploring` but some stale artifacts remain. The workflow's general failure handler (AskUserQuestion) will catch the error, but the partially-cleared state is not explicitly documented as a known risk. This is a minor concern since the failure mode is "extra files remain" (safe direction) rather than "files missing" (dangerous direction). The copy-verify-delete pattern used for move-feature is not applied here because deletion IS the intent, so this is acceptable risk.

---

### Finding 3: Mutation classification relies on LLM free-text parsing without fallback heuristics

**Category:** Robustness

**Verdict:** met

**Evidence:**
- `change-application.md:32-44` -- Classification uses keyword matching against action free-text
- `change-application.md:42` -- `"If action doesn't map: mark FAILED with 'Unknown mutation type' and continue."`
- Reasoning: The runtime IS an LLM, so free-text classification is idiomatic for this execution context. The fallback (mark FAILED, continue) prevents silent misclassification. The keyword lists in the workflow serve as guidance anchors rather than rigid regex. This is appropriate for a prompt-driven workflow.

---

### Finding 4: Pre-validation idempotency check for create operations

**Category:** Robustness

**Verdict:** met

**Evidence:**
- `change-application.md:61-70` -- Pre-validation step checks existence before creates, marks as APPLIED (idempotent skip)
- `01-PLAN.md:78` -- `"Both error on duplicate (process.exit(1)) -- must pre-check existence before calling."`
- Reasoning: Without this check, re-running the workflow after a partial failure would hit `process.exit(1)` on already-created entities. The idempotency check correctly prevents this. The check also prevents the failure handler from firing on a non-error condition.

---

### Finding 5: No `</process>` or structural inconsistency with sibling workflows

**Category:** Idiomatic Violation

**Verdict:** met

**Evidence:**
- `change-application.md:239` -- `</process>` present
- `change-application.md:1-7` -- Uses `<purpose>`, `<required_reading>`, `<inputs>`, `<process>` structure
- `refinement-qa.md:1-4,204-216` -- Same structure: `<purpose>`, `<required_reading>`, `<inputs>`, `<process>`, `<success_criteria>`, `</output>`
- Reasoning: Structural pattern matches sibling workflows. Tags are well-formed and properly closed.

---

### Finding 6: WAL pattern for EXECUTION-LOG.md is sound but rewrite-heavy

**Category:** KISS

**Verdict:** met

**Evidence:**
- `change-application.md:165` -- `"After EVERY mutation (success or failure), rebuild and write EXECUTION-LOG.md"`
- Reasoning: Full rewrite after each mutation is the simplest correct implementation of a WAL (write-ahead log) in a context where there is no append API (Write tool overwrites). Append-mode would require reading existing content + appending, which is more complex for no benefit. The full-rewrite approach ensures the log is always consistent. For the expected scale (tens of entries, not thousands), this is appropriate.

---

### Finding 7: Move-feature copy-verify-delete pattern

**Category:** Robustness

**Verdict:** met

**Evidence:**
- `change-application.md:100-104` -- `cp -r` then verify then `rm -rf`
- `01-PLAN.md:106-111` -- Pattern explicitly documented as "never delete-then-create"
- Reasoning: This is the standard safe-move pattern. The verify step (step 3) before delete (step 4) prevents data loss if the copy fails silently. Correct implementation.

---

### Finding 8: AskUserQuestion failure flow recursive retry risk

**Category:** Robustness

**Verdict:** suspected regression

**Evidence:**
- `change-application.md:147-150` -- Fix-and-resume: `"If fails again: return to failure handler (recursive)"`
- Reasoning: The fix-and-resume path allows unbounded recursion. If a mutation is fundamentally broken (e.g., bad target path that the user cannot fix), the user could loop indefinitely between "fix and resume" and the failure handler. However, the user always has "skip" and "abort" as escape hatches, so this is bounded by user agency. The recursion is conceptual (prompt-level, not stack-level) since this is a workflow definition, not executable code. No stack overflow risk. Acceptable.

---

### Finding 9: TC-02 specifies `delta-parse` CLI route but none exists

**Category:** Bloat

**Verdict:** met (no implementation impact)

**Evidence:**
- `FEATURE.md:186` -- `"Parseable by gsd-tools if needed (new CLI route: delta-parse)"`
- gsd-tools.cjs has no `delta-parse` route
- Reasoning: TC-02 says "if needed" -- this is a future consideration, not a current requirement. The workflow does not call `delta-parse` and does not need to. The EXECUTION-LOG.md is consumed by refinement-artifact via direct file read, not via a parse route. No missing implementation.

---

### Finding 10: Seven mutation types in a single workflow file

**Category:** Unnecessary Abstraction

**Verdict:** met (absence of unnecessary abstraction is correct)

**Evidence:**
- `change-application.md:90-126` -- All 7 mutation handlers defined inline within the execute_mutations step
- Reasoning: Each handler is 3-7 lines of procedural instructions. Extracting them into separate files or abstractions would add indirection without reducing complexity. The handlers share no logic worth factoring out (CLI routes use Bash, direct edits use Read/Edit, reinstate has unique cleanup). Keeping them inline in a single workflow file is the simplest correct approach for this scale. KISS satisfied.

---

## Summary

| # | Finding | Category | Verdict |
|---|---------|----------|---------|
| 1 | DELTA.md vs EXECUTION-LOG.md naming drift in FEATURE.md | Idiomatic | met (documented) |
| 2 | Reinstate partial-deletion inconsistency risk | Resource Mgmt | suspected (safe direction) |
| 3 | LLM free-text mutation classification | Robustness | met |
| 4 | Create idempotency pre-check | Robustness | met |
| 5 | Structural consistency with sibling workflows | Idiomatic | met |
| 6 | WAL full-rewrite pattern | KISS | met |
| 7 | Move copy-verify-delete pattern | Robustness | met |
| 8 | Fix-and-resume recursive retry | Robustness | suspected (user-bounded) |
| 9 | delta-parse route referenced but unimplemented | Bloat | met (future, not required) |
| 10 | All handlers inline in single file | Abstraction | met (correct simplicity) |

**Overall assessment:** The workflow is well-structured, follows sibling conventions, and correctly implements all 9 requirements. The two suspected findings (2, 8) are minor and fail in the safe direction. No regressions, no unnecessary abstractions, no DRY violations. Complexity is justified by the problem space (7 distinct mutation types with different execution strategies).
