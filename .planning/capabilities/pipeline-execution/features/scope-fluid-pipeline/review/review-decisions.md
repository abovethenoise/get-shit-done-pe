# Review Decisions — scope-fluid-pipeline

Date: 2026-03-06

## Accepted (5)

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | Doc command capability-scope passes FEATURE_SLUG per-feature instead of null | Major | Fixed doc command to pass null, let doc.md collect all features |
| 2 | README.md refs to deleted workflows + stale .documentation/ | Major | Updated README, deleted .documentation/ |
| 3 | Dual remediation loops (framing-pipeline + review.md) | Major | Removed from framing-pipeline, review.md owns remediation |
| 4 | Duplicate human checkpoint line in framing-pipeline | Minor | Removed duplicate |
| 5 | Section 2e nesting (feature as child of capability) | Minor | Restructured as peer Section 3 |
| 6 | Dual review→doc auto-chain | Minor | Removed from framing-pipeline, review.md Step 12 owns it |

## Deferred (0)

None.

## Dismissed (0)

None.
