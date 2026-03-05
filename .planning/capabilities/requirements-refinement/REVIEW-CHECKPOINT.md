# Review Checkpoint: requirements-refinement

## Status: 5/5 features reviewed — COMPLETE

## Completed Reviews

### 1. change-application — REVIEWED
- **Findings:** 1 blocker, 1 major, 5 minor
- **Escalated concern:** Entire feature violates KISS/YAGNI — over-engineered mutation engine for what should be simple markdown file edits. User directive: "Once it gets the direction of what documentation to update and what changes to apply, it should just do it."
- **Accepted fixes:**
  - CLI invocation syntax bug (positional args, not flags) — standardize with other CLI commands
  - Update FEATURE.md to reference EXECUTION-LOG.md instead of DELTA.md
  - Update stale example title in TC-02
- **Dismissed:** Reinstate partial-deletion risk
- **Action needed:** Fundamental simplification of feature (both FEATURE.md requirements and workflow)
- **Artifacts:** `review/review-decisions.md`, `review/synthesis.md`, 4 trace reports

### 2. coherence-report — REVIEWED
- **Findings:** 0 blockers, 1 major, 3 minor
- **Accepted fixes:**
  - Clarify root-cause clustering relationship (synthesizer should consume scan's grouping, not re-derive)
  - Specify temp file path and cleanup behavior
- **Dismissed:** Missing ROADMAP/STATE graceful handling, synthesizer frontmatter divergence
- **Artifacts:** `review/review-decisions.md`, `review/synthesis.md`, 4 trace reports

### 3. landscape-scan — REVIEWED
- **Findings:** 0 blockers, 2 major, 10 minor
- **Accepted fixes (MUST FIX):**
  - TC-03: Implement medium/large tier scaling (user: "Not a YAGNI violation, could be used by anyone in any size project")
  - TC-02: Update spec to say templates/ (prompt-template pattern is correct)
  - Enforce sonnet for executor agents, inherit (opus) for judge roles
  - Remove dead code (unused exports, dead import)
  - Add path sanitization to --pair argument
  - DRY refactor for dir listing duplication
  - Update stale spec entries (capability-list, checkpoint paths, Layer 3 format)
- **Key principle established:** Model selection rule — sonnet for executor agents, inherit for judge roles
- **Artifacts:** `review/review-decisions.md`, `review/synthesis.md`, 4 trace reports

### 4. refinement-qa — REVIEWED
- **Findings:** 0 blockers, 2 major, 5 minor
- **All accepted:**
  - Fix source_finding/source field name mismatch in write/parse round-trip
  - Add secondary severity sort in changeset type groups
  - Update FEATURE.md TC-01 stale route name
  - Fix parseMarkdownTable boundary bug (continue -> break)
  - Update spec "no file I/O" claim
  - Note banner style as systemic issue
  - Add explicit checkpoint counter conditional
- **Artifacts:** `review/review-decisions.md`, `review/synthesis.md`, 4 trace reports

### 5. refinement-artifact — REVIEWED
- **Findings:** 0 blockers, 1 major, 4 minor
- **All 7 requirements met:** EU-01, EU-02, FN-01, FN-02, FN-03, TC-01, TC-02
- **Accepted fixes:**
  - TypeError guard in cmdChangesetWrite (nullish check before .includes('..'))
  - Extract duplicated key lambdas (matrixKeyFn, graphKeyFn) to module-level constants
  - Extract clearFindings() helper for duplicated findings-clearing blocks
  - Extract guardPath() helper for 6 repeated path traversal checks
- **Dismissed:** Changeset co-location (no benefit to splitting)
- **Artifacts:** `review/review-decisions.md`, `review/synthesis.md`, 4 trace reports

## Cross-Cutting Findings

1. **Over-engineering pattern:** change-application is the worst case, but review the entire capability for unnecessary complexity
2. **Model selection rule:** Sonnet for executor agents, inherit (opus) for judge roles — enforce everywhere
3. **Banner style drift:** All workflows use dashes instead of ui-brand.md heavy lines — systemic, not per-feature
4. **Spec staleness:** Multiple features have FEATURE.md text that doesn't match justified implementation choices
5. **DRY across features:** refinement.cjs has cross-feature DRY issues (path guards, findings clearing) that should be fixed in a single pass

## Capability Review Summary

| Feature | Reqs Met | Blockers | Major | Minor | Accepted | Dismissed |
|---------|----------|----------|-------|-------|----------|-----------|
| change-application | partial | 1 | 1 | 5 | 3 | 1 |
| coherence-report | all | 0 | 1 | 3 | 2 | 2 |
| landscape-scan | all | 0 | 2 | 10 | 7+ | 0 |
| refinement-qa | all | 0 | 2 | 5 | 7 | 0 |
| refinement-artifact | all | 0 | 1 | 4 | 4 | 1 |

**Total accepted fixes across capability: ~23**

## Next Steps

1. Blockers remain (change-application over-engineering) — no auto-advance to doc workflow
2. change-application needs fundamental simplification before doc generation
3. All other features' accepted fixes can proceed independently
4. Cross-feature DRY fixes in refinement.cjs should be batched
