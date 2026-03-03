---
feature: install-and-deploy/install-feedback
plan: "02-recheck"
review_date: "2026-03-03"
---

# Review Decisions — install-feedback 02-recheck

## Accepted (5)

| # | Severity | Finding | Action |
|---|----------|---------|--------|
| 1 | MAJOR | gsd-auto-update.js missing from validation expected hooks | Fix: add to expectedHooks array |
| 2 | MINOR | Dead non-interactive guard in promptLocation() | Fix: remove dead branch |
| 4 | MINOR | getCommitAttribution() re-reads settings.json per recursive call | Fix: cache once in install(), pass as param |
| 5 | MINOR | Unused `description` param in verifyInstalled() | Fix: remove param |
| 6 | MINOR | Trailing `return;` in replaceCc() | Fix: remove |

## Deferred (2)

| # | Severity | Finding | Reason |
|---|----------|---------|--------|
| 3 | MINOR | Agent copy duplicates copyWithPathReplacement pipeline | Different cleanup semantics (agents preserve non-GSD files) — not a true DRY violation |
| 7 | MINOR | String-equality version compare in auto-update | String equality is correct for exact-match checks against npm registry version strings |

## Dismissed (0)
