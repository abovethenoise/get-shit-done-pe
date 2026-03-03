---
phase: install-and-deploy/install-feedback
plan: 02
subsystem: install
tags: [refactor, bugfix, dead-code, quiet-mode]
depends_on:
  - install-and-deploy/install-feedback/01-PLAN.md
key_files:
  - bin/install.js
  - scripts/validate-install.js
  - hooks/gsd-auto-update.js
  - README.md
  - package-lock.json
decisions:
  - "GSD_BASELINE_SETTINGS includes deny rules + empty hooks arrays as minimum viable fallback"
  - "options.quiet pattern chosen over console monkey-patching for cleaner suppression"
  - "ccWarnings removed entirely (was dead code, never surfaced to user)"
  - "README cc->pe replacement done globally; Attribution upstream URL preserved (contains no cc refs)"
metrics:
  blocker_fixes: 1
  major_fixes: 6
  minor_fixes: 2
---

Post-review refactor fixing all blocker, major, and minor findings from the 4-feature review synthesis.

## Task Results

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | readSettings() known-good baseline | done | `da00919` |
| 2 | quiet mode, dead code, README, package-lock, error logging | done | `2704cef` |

## What Changed

**Blocker fix:** `readSettings()` no longer returns `{}` on missing/corrupt settings.json. Returns deep-clone of `GSD_BASELINE_SETTINGS` (deny rules + hooks arrays). Hooks structure is also ensured on successful parse (partial corruption guard). `settingsWasCorrupt` flag surfaces a message in finishInstall.

**Major fixes:**
- Console monkey-patch replaced with `options.quiet` pattern in validate-install.js. Install calls `runValidation({ quiet: true })`.
- Dead `ccWarnings` variable + push + return removed from install.js and replaceCc().
- All `get-shit-done-cc` references in README.md replaced with `get-shit-done-pe` (22 occurrences).
- package-lock.json regenerated.
- `child.on('error')` handler added in gsd-auto-update.js -- writes lastError/lastErrorTime to cache.

**Minor fixes:**
- Duplicate gsd-check-update inline SessionStart filter removed (orphanedHookPatterns already handles it).
- Dead `JSON.parse(input)` removed from gsd-auto-update.js stdin handler.

## Verification

All 6 automated checks pass:
1. Syntax check: bin/install.js, scripts/validate-install.js, hooks/gsd-auto-update.js
2. No `return {}` in install.js, `GSD_BASELINE_SETTINGS` present
3. 0 `get-shit-done-cc` references in README.md
4. 0 `ccWarnings` references in bin/install.js
5. package-lock.json is valid JSON
6. `lastError` present in hooks/gsd-auto-update.js

## Deviations

None. All plan tasks executed as specified.
