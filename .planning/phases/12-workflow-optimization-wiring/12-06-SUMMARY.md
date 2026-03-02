---
phase: 12-workflow-optimization-wiring
plan: 06
subsystem: installer, references, templates, docs
tags: [install.js, multi-runtime, v1-cleanup, terminology, user-guide]

# Dependency graph
requires:
  - plan: 12-01
    provides: v2 workflow rewrites (plan.md, execute.md)
  - plan: 12-02
    provides: v2 review and doc pipeline
provides:
  - Claude-Code-only installer (no Codex/Gemini/OpenCode adapters)
  - v2 terminology across all references and templates
  - Rewritten USER-GUIDE.md for v2 model
  - GSD de-branding in agent prose
affects: [install, templates, references, docs]

# Tech tracking
tech-stack:
  added: []
  patterns: [capability/feature commit format, feature directory paths]

key-files:
  created: []
  modified:
    - bin/install.js
    - package.json
    - get-shit-done/references/ui-brand.md
    - get-shit-done/references/git-integration.md
    - get-shit-done/references/continuation-format.md
    - get-shit-done/references/questioning.md
    - get-shit-done/templates/config.json
    - get-shit-done/templates/context.md
    - get-shit-done/templates/research.md
    - get-shit-done/templates/summary.md
    - get-shit-done/templates/continue-here.md
    - get-shit-done/templates/user-setup.md
    - get-shit-done/templates/discovery.md
    - get-shit-done/templates/VALIDATION.md
    - docs/USER-GUIDE.md
    - agents/gsd-research-prior-art.md

key-decisions:
  - "install.js reduced from 2376 to 771 lines by removing all multi-runtime support"
  - "templates/requirements.md and templates/UAT.md deleted (v1, no v2 references)"
  - "USER-GUIDE.md fully rewritten for v2: 4 framing modes, capability workflows, 3-layer requirements, focus groups"
  - "gsd-review-quality.md duplicate (lines 65-116) already cleaned in prior phase -- skipped"

patterns-established:
  - "Capability/feature commit format: {type}({cap}/{feat}): {description}"
  - "Feature directory paths: .planning/capabilities/{cap}/features/{feat}/"

requirements-completed: [CMD-01]

# Metrics
duration: 13min
completed: 2026-03-02
---

# Plan Summary: Install Cleanup and V1 Terminology Sweep

**Claude-Code-only installer (2376->771 lines), v2 terminology across all references/templates, USER-GUIDE rewritten for capability-based workflows**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-02T14:53:50Z
- **Completed:** 2026-03-02T15:06:42Z
- **Tasks:** 3
- **Files modified:** 26

## Accomplishments
- install.js stripped of all Codex/Gemini/OpenCode adapter code, patch backup system, manifest system, CHANGELOG/VERSION metadata (~1600 lines removed)
- All template path headers updated from phase directories to feature directories (7 templates + 7 codebase templates)
- config.json template cleaned of v1 gate keys (auto_advance, confirm_phases, confirm_transition)
- USER-GUIDE.md fully rewritten for v2: 4 framing modes, capability-based workflows, 3-layer requirements, focus groups, updated command surface
- GSD branded language removed from agent prose
- continuation-format.md made phase-free, questioning.md wrapper tag removed
- v1 templates deleted (requirements.md, UAT.md)

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean install.js (INST-05/06) and update package.json** - `d8b9306` (chore)
2. **Task 2: Sweep v1 terminology from references, templates, and config** - `fee06b4` (chore)
3. **Task 3: V1 artifact cleanup, USER-GUIDE rewrite, and de-branding sweep** - `1cd2849` (chore)

## Files Created/Modified
- `bin/install.js` - Claude Code only installer, 771 lines (was 2376)
- `package.json` - Description and keywords updated for Claude Code only
- `get-shit-done/references/ui-brand.md` - Feature/focus group banners
- `get-shit-done/references/git-integration.md` - Capability/feature commit format
- `get-shit-done/references/continuation-format.md` - Zero phase references
- `get-shit-done/references/questioning.md` - Wrapper tag removed
- `get-shit-done/templates/config.json` - V1 gate keys removed
- `get-shit-done/templates/context.md` - Feature directory path
- `get-shit-done/templates/research.md` - Feature directory path
- `get-shit-done/templates/summary.md` - Feature directory path
- `get-shit-done/templates/continue-here.md` - Feature directory path
- `get-shit-done/templates/user-setup.md` - Feature directory path
- `get-shit-done/templates/discovery.md` - Feature directory path
- `get-shit-done/templates/VALIDATION.md` - Feature requirements terminology
- `get-shit-done/templates/requirements.md` - DELETED (v1 template)
- `get-shit-done/templates/UAT.md` - DELETED (v1 template)
- `docs/USER-GUIDE.md` - Full rewrite for v2 (~300 lines)
- `agents/gsd-research-prior-art.md` - De-branded prose
- `get-shit-done/templates/codebase/*.md` (7 files) - Generic planning labels

## Decisions Made
- install.js reduced from 2376 to 771 lines by removing all multi-runtime support (Codex, Gemini, OpenCode adapters, patch backup, manifest, CHANGELOG/VERSION)
- templates/requirements.md deleted: v1 template, v2 uses FEATURE.md with EU/FN/TC sections
- templates/UAT.md deleted: no v2 workflow references this template
- gsd-review-quality.md duplicate removal skipped: file is only 63 lines, duplicate already cleaned in prior phase

## Unplanned Changes
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Steps
- Continue with remaining Phase 12 plans (12-07 through 12-09)
- phase-prompt.md template still has phase directory path headers (out of scope for this plan, noted for future)

---
*Completed: 2026-03-02*
