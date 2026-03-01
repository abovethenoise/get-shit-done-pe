# CLI Route Smoke Test Results

**Date:** 2026-03-01
**Toolchain:** `get-shit-done/bin/gsd-tools.cjs`
**Test method:** Each route invoked via `node gsd-tools.cjs <route> --cwd=<fixture-dir>`, capturing exit code, JSON validity, and output sample.

## Summary

| Metric | Count |
|--------|-------|
| Total routes tested | 21 |
| PASS | 19 |
| FAIL | 0 |
| WARN | 2 |

**Overall verdict:** All routes functional. Two routes require arguments not specified in the plan's test table (documented as WARN with corrected invocations passing).

## Fixture Directories

**Directory A (empty project):** `/tmp/gsd-test-empty-*` -- Empty directory, no `.planning/`
**Directory B (existing project):** `/tmp/gsd-test-existing-*` -- Full scaffolding with STATE.md, ROADMAP.md, REQUIREMENTS.md, capability/feature structure, config.json

## Init Route Results (Existing Project -- Directory B)

| # | Route | Exit | JSON | Verdict | Notes |
|---|-------|------|------|---------|-------|
| 1 | `init project` | 0 | YES | PASS | Detected `ambiguous` mode (has .planning/ but no PROJECT.md) |
| 2 | `init framing-discovery debug` | 0 | YES | PASS | Returns lens, MVU slots, anchor questions path, capability list |
| 3 | `init framing-discovery new` | 0 | YES | PASS | Returns lens, MVU slots, capability list |
| 4 | `init framing-discovery enhance` | 0 | YES | PASS | Returns lens, MVU slots, capability list |
| 5 | `init framing-discovery refactor` | 0 | YES | PASS | Returns lens, MVU slots, capability list |
| 6 | `init discuss-capability` | 0 | YES | PASS | Returns capability list, doc capabilities |
| 7 | `init discuss-feature` | 0 | YES | PASS | Returns capability list with nested features |
| 8 | `init resume` | 0 | YES | PASS | Returns state/roadmap existence, no interrupted agent |
| 9 | `init progress` | 0 | YES | PASS | Returns phase stats, model config |
| 10 | `init plan-feature test-cap test-feat` | 0 | YES | PASS | Returns capability/feature context, model config |
| 11 | `init execute-feature test-cap test-feat` | 0 | YES | PASS | Returns executor model, capability/feature paths |
| 12 | `init feature-op test-cap test-feat review` | 0 | YES | PASS | Returns operation type, capability/feature context |
| 13 | `init feature-progress` | 0 | YES | PASS | Returns capabilities with nested feature stats |

## Init Route Results (Empty Project -- Directory A)

| # | Route | Exit | JSON | Verdict | Notes |
|---|-------|------|------|---------|-------|
| 14 | `init project` | 0 | YES | PASS | Detected new-project mode (no .planning/) |

## Dead Route Results (Directory B)

| # | Route | Exit | Message | Verdict | Notes |
|---|-------|------|---------|---------|-------|
| 15 | `init phase-op` | 1 | "init phase-op has been removed. Use v2 framing commands instead." | PASS | Graceful error, no crash |
| 16 | `init review-phase` | 1 | "init review-phase has been removed. Use v2 framing commands instead." | PASS | Graceful error, no crash |
| 17 | `init doc-phase` | 1 | "init doc-phase has been removed. Use v2 framing commands instead." | PASS | Graceful error, no crash |

## Atomic Route Results (Directory B)

| # | Route | Exit | JSON | Verdict | Notes |
|---|-------|------|------|---------|-------|
| 18 | `state load` | 0 | YES | PASS | Returns config + state frontmatter |
| 19 | `progress` | 0 | YES | PASS | Returns milestone, phases, plan/summary counts |
| 20 | `capability-list` | 0 | YES | PASS | Returns capabilities array with feature counts |
| 21 | `feature-list test-cap` | 0 | YES | PASS | Returns features array for given capability |

## Argument Requirement Findings

| # | Route | Without Args | With Args | Severity |
|---|-------|-------------|-----------|----------|
| 10 | `init plan-feature` | Exit 1: "capability slug and feature slug required" | PASS with `test-cap test-feat` | WARN (cosmetic) |
| 11 | `init execute-feature` | Exit 1: "capability slug and feature slug required" | PASS with `test-cap test-feat` | WARN (cosmetic) |
| 12 | `init feature-op` | Exit 0, returns JSON with nulls | PASS with `test-cap test-feat review` | cosmetic |
| 21 | `feature-list` | Exit 1: "capability slug required" | PASS with `test-cap` | cosmetic |

These routes correctly require positional arguments. The plan's test table omitted the required args. When invoked with proper arguments, all pass. This is expected behavior, not a bug.

## Findings Summary

| Severity | Finding | Route |
|----------|---------|-------|
| cosmetic | Routes 10, 11 require positional args (cap-slug, feat-slug) -- error messages are clear and helpful | `init plan-feature`, `init execute-feature` |
| cosmetic | Route 21 requires capability slug arg -- error message is clear | `feature-list` |
| cosmetic | Route 12 (`init feature-op`) accepts no args without error but returns JSON with null capability/feature fields -- could validate and error instead | `init feature-op` |

**No blockers found. No friction-level issues. All routes functional.**

## Output Samples

### init project (existing project, test 1)
```json
{
  "detected_mode": "ambiguous",
  "planning_exists": true,
  "code_exists": false,
  "project_exists": false,
  "partial_run": { "has_partial": false, "completed_sections": [], "next_section": null },
  "project_context": null,
  "commit_docs": true,
  "has_git": false
}
```

### init project (empty dir, test 14)
```json
{
  "detected_mode": "new",
  "planning_exists": false,
  "code_exists": false,
  "project_exists": false,
  "partial_run": { "has_partial": false, "completed_sections": [], "next_section": null },
  "project_context": null,
  "commit_docs": true,
  "has_git": false
}
```

### Dead route (test 15)
```
Error: init phase-op has been removed. Use v2 framing commands instead.
```

---

*Generated: 2026-03-01*
*Phase: 11-automated-testing, Plan: 02*
