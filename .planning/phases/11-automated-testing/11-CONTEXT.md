# Phase 11: Automated Testing - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify every surviving command and file reference works before attempting install. The core test is an E2E simulation: Claude runs through a full new-project → capability build cycle on a synthetic project in a temp directory, producing a narrative friction log with severity levels. Separately, scan all @file references across the artifact set. One-shot verification — scripts are disposable, the report is the artifact.

</domain>

<decisions>
## Implementation Decisions

### Test scope & pass criteria
- Exit code 0 + expected output shape (JSON parses, markdown has expected sections)
- Test BOTH slash commands AND CLI tool routes (gsd-tools.cjs subcommands)
- The real test is an E2E simulation: run the full v2 pipeline (new-project → capability build) internally on a synthetic project
- Flag points of friction or breaks throughout the flow
- discuss-phase should be dead — it's a v1 concept. If it still exists, that's a finding.

### Test data & isolation
- Synthetic fixtures in a temp directory (/tmp/gsd-test-*)
- Do NOT run against the source repo's .planning/ data
- Clean isolation, no risk to real project state

### Test persistence
- One-shot verification — run once, validate, done
- Test scripts are deleted after verification passes
- The friction log artifact is what persists, not the scripts

### Failure reporting
- Narrative friction log, not just a pass/fail table
- Severity levels: blocker (can't proceed), friction (works but painful), cosmetic (minor annoyance)
- Report written to `.planning/phases/11-automated-testing/` as permanent verification artifact
- After report is produced: discuss findings with user via Q&A before fixing anything
- Then fix agreed-upon items, then proceed to Phase 12 (install)

### @file reference scanning
- Scan ALL artifact directories: commands/gsd/, get-shit-done/workflows/, get-shit-done/templates/, get-shit-done/references/, agents/
- Scan everything — no exceptions for code blocks or examples. If an @file ref exists, it must resolve.
- Source paths only — install path (~/.claude/) validation is Phase 12's concern
- Auto-fix obvious renames (e.g., plan-phase.md → plan.md). Log non-obvious broken refs for discussion.

### Claude's Discretion
- Exact synthetic project structure (what STATE.md, ROADMAP.md etc. look like)
- Which CLI routes to test beyond the obvious ones
- How to structure the temp directory setup/teardown
- E2E simulation depth per command (some commands need more exercise than others)

</decisions>

<specifics>
## Specific Ideas

- "Simulate an end-to-end new project and capability build with yourself internally and flag points of friction or breaks"
- discuss-phase is a v1 concept — if it's still wired in, that's a finding to surface
- The Q&A mode of interactive commands is the biggest thing to verify — commands need to reach their checkpoints properly

</specifics>

<deferred>
## Deferred Ideas

- discuss-phase deletion — noted as dead, but actual removal would be a cleanup task beyond Phase 11's verification scope
- Permanent test suite — explicitly rejected for now; could revisit in a future milestone if regression testing becomes needed

</deferred>

---

*Phase: 11-automated-testing*
*Context gathered: 2026-03-01*
