# Phase 8: Low Risk Cleanup - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove obviously dead artifacts from the project source tree: unused commands, orphaned workflows, orphaned agents, dropped hooks, and dead metadata files. Phase 7 removed 3 feature systems (TDD, Todos, Health). Phase 8 removes everything else that doesn't serve the 11-command v2 surface.

Anything that touches state management or execution flow is OUT OF SCOPE for this phase — it may be needed for Phase 9 (Structure & Integration) wiring.

</domain>

<decisions>
## Implementation Decisions

### Kill List Construction
- Phase 8 must BUILD the kill lists first — the "26 commands" and "20 workflows" numbers from the roadmap are estimates, not verified counts
- Approach: trace from the 11 v2 commands (init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review) down through their referenced workflows and agents to build a "keep" set
- Cross-reference the keep set against INVENTORY.md (07-INVENTORY.md) verdicts as a second validation source
- Everything not in the keep set AND not touching state/execution is the kill list
- Audit only what currently exists in the project tree — Phase 7 deletions are already done, don't double-count

### Deletion Verification
- Full dependency trace per file before deleting — grep for all references (@file, require, import, workflow references)
- If a file on the kill list has live references somewhere: present each conflict to the user for case-by-case decision
- Quick smoke scan after each category commit — grep surviving files for references to anything just deleted

### Commit Strategy
- One atomic commit per category: (1) commands, (2) workflows, (3) agents, (4) hooks, (5) metadata files
- Each commit is independently revertable without affecting other categories

### File Tree Scope
- Delete from project source tree (get-shit-done-pe/) only
- The installed tree (~/.claude/) is rebuilt by install.js during Phase 12 — no need to touch it now

### Metadata Files
- Audit ALL non-code files for dead metadata, not just VERSION and CHANGELOG.md
- Includes: dotfiles, config artifacts, CI files, infrastructure files that served v1 but not v2
- Remove `package.json` `"type": "commonjs"` field if .cjs file extension makes it redundant (verify during execution)
- Leave milestone 1 planning directories (.planning/phases/01-07) alone — historical record

### Safety Guardrail
- If a file touches state management (STATE.md, session, config) or execution flow (wave runner, executor, CLI dispatch), keep it — Phase 9 will decide what to wire vs. remove
- When in doubt, keep. Phase 10 (Remaining Cleanup) exists for harder decisions.

</decisions>

<specifics>
## Specific Ideas

- The INVENTORY.md from Phase 7 provides concept-level verdicts (KEEP v1, KEEP GSD, REMOVE, DROP) that should validate the command-trace approach
- Phase 7 already removed: TDD execution pattern (13 files), todo system (4 files), health check (2 files), new-project.md.bak, discovery-phase.md — these are done
- The kill list numbers in ROADMAP.md (26 commands, 20 workflows) are estimates and may change once the actual audit runs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-low-risk-cleanup*
*Context gathered: 2026-03-01*
