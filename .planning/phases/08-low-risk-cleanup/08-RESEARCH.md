# Phase 8: Low Risk Cleanup - Research

**Researched:** 2026-03-01
**Domain:** Codebase artifact audit — build verified kill lists from 4 parallel audits
**Confidence:** HIGH (all files traced from 11-command v2 surface through workflows/agents)

## Summary

Four parallel researchers audited the entire GSD artifact set: commands, workflows, agents, and hooks/metadata. Each traced the reference chain from the 11 v2 commands (init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review) downward, cross-referenced against the Phase 7 INVENTORY.md verdicts.

**Primary finding:** The actual kill counts differ from roadmap estimates. The roadmap says "26 commands, 20 workflows" but the verified numbers are lower because many pipeline-internal artifacts (plan-phase, execute-phase, etc.) must be kept — they're the execution engine, not user-facing commands.

**Approach:** Delete only artifacts that are (1) not in any surviving reference chain AND (2) don't touch state/execution flow. Pipeline internals are flagged for Phase 10 resolution.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Build kill lists by tracing from 11 v2 commands, cross-reference with INVENTORY.md
- Full dependency trace per file before deleting
- If file has live references: present each conflict to user for case-by-case decision
- Quick smoke scan after each category commit
- One atomic commit per category (commands, workflows, agents, hooks, metadata)
- Delete from project source tree only (installed tree rebuilt by Phase 12)
- Audit ALL non-code files for dead metadata
- Remove `package.json` `"type": "commonjs"` if .cjs makes it redundant
- Leave milestone 1 planning directories alone
- Anything touching state/execution flow stays — Phase 9 decides

### Claude's Discretion
- None specified

### Deferred Ideas (OUT OF SCOPE)
- None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-02 | 26 unused commands removed | Commands audit: 15 verified kills (not 26 — pipeline internals kept for Phase 10) |
| CLN-01 | 20 orphaned workflows removed | Workflows audit: 21 verified kills (higher than estimate) |
| CLN-02 | Orphaned agents removed | Agents audit: 6 verified kills (gsd-debugger, gsd-project-researcher, gsd-research-synthesizer, gsd-roadmapper, gsd-integration-checker, gsd-codebase-mapper) |
| CLN-06 | gsd-check-update.js hook removed | Hooks audit: confirmed exists, safe to kill. Dead code block in gsd-statusline.js also needs cleanup. |
| CLN-07 | VERSION, CHANGELOG.md, metadata removed | Metadata audit: CHANGELOG.md kill, VERSION is install-time write (Phase 12 fix), package.json has no "type" field in source |
</phase_requirements>

## Verified Kill Lists

### Commands to DELETE (15 files)

| File | What it was | Why dead |
|------|-------------|----------|
| `add-phase.md` | Add phase to roadmap | Roadmap utility, not v2 surface |
| `add-tests.md` | Generate UAT tests | TDD removed in Phase 7 |
| `audit-milestone.md` | Audit milestone | Milestone lifecycle, not v2 surface |
| `cleanup.md` | Archive phase dirs | Housekeeping utility |
| `complete-milestone.md` | Archive milestone | Milestone lifecycle |
| `insert-phase.md` | Insert decimal phase | Roadmap utility |
| `join-discord.md` | Discord link | Marketing, not v2 |
| `list-phase-assumptions.md` | Surface planner assumptions | Planning utility |
| `new-project.md` | Init project (v1) | Superseded by init.md |
| `plan-milestone-gaps.md` | Plan gap closure | Milestone management |
| `reapply-patches.md` | Reapply local mods | Patch system removed |
| `remove-phase.md` | Remove roadmap phase | Roadmap utility |
| `set-profile.md` | Switch model profile | Config utility |
| `settings.md` | Configure toggles | Config utility |
| `update.md` | Update GSD version | Package maintenance |

### Commands FLAGGED for Phase 10 (keep now, likely delete later)

These are pipeline-internal commands not in the v2 surface but currently part of the execution engine:

| File | What it was | Why flagged |
|------|-------------|-------------|
| `discuss-phase.md` | Phase discussion (v1) | Superseded by discuss-capability/feature, but touches execution flow |
| `doc-phase.md` | Generate docs | Pipeline stage |
| `execute-phase.md` | Execute plans | Pipeline stage |
| `help.md` | Show commands | Utility |
| `map-codebase.md` | 4-agent mapping | KEEP GSD in inventory |
| `new-milestone.md` | Start milestone | Project lifecycle |
| `pause-work.md` | Save session state | Session management |
| `plan-phase.md` | Create plans | Pipeline stage |
| `progress.md` | Check progress | Status/routing |
| `quick.md` | Ad-hoc tasks | KEEP GSD in inventory |
| `research-phase.md` | Standalone research | Pipeline stage |
| `review-phase.md` | Run reviewers | Pipeline stage |
| `verify-work.md` | UAT validation | Post-execution |

### Workflows to DELETE (21 files)

| File | What it was | Why dead |
|------|-------------|----------|
| `add-phase.md` | Add phase to roadmap | Dead command's workflow |
| `add-tests.md` | Generate tests | TDD removed |
| `audit-milestone.md` | Audit milestone | Dead command's workflow |
| `cleanup.md` | Archive dirs | Dead command's workflow |
| `complete-milestone.md` | Complete milestone | Dead command's workflow |
| `diagnose-issues.md` | Hypothesis debugging | Only caller is verify-work (dead chain) |
| `discuss-phase.md` | v1 phase discussion | Superseded by discuss-capability/feature |
| `help.md` | Help reference | Dead command's workflow |
| `insert-phase.md` | Insert phase | Dead command's workflow |
| `list-phase-assumptions.md` | List assumptions | Dead command's workflow |
| `map-codebase.md` | Codebase mapping | Dead command's workflow |
| `new-milestone.md` | New milestone | Dead command's workflow |
| `new-project.md` | New project (v1) | Superseded by init-project.md |
| `pause-work.md` | Pause work | Dead command's workflow |
| `plan-milestone-gaps.md` | Gap closure | Dead command's workflow |
| `quick.md` | Quick mode | Dead command's workflow |
| `remove-phase.md` | Remove phase | Dead command's workflow |
| `set-profile.md` | Set profile | Dead command's workflow |
| `settings.md` | Settings | Dead command's workflow |
| `update.md` | Update GSD | Dead command's workflow |
| `verify-work.md` | Verify work | Dead command's workflow |

### Workflows to KEEP

| File | Referenced by | Chain |
|------|--------------|-------|
| `init-project.md` | init.md command | init → init-project |
| `gather-synthesize.md` | init.md, review-phase.md | Reusable orchestration primitive |
| `framing-discovery.md` | debug/new/enhance/refactor | Framing entry points |
| `framing-pipeline.md` | framing-discovery.md | Pipeline orchestration |
| `research-phase.md` | framing-pipeline.md | Pipeline stage |
| `plan-phase.md` | plan-phase command, framing-pipeline | Pipeline stage |
| `execute-phase.md` | plan-phase.md, framing-pipeline | Pipeline stage |
| `execute-plan.md` | execute-phase.md | Execution detail |
| `review-phase.md` | review-phase command, framing-pipeline | Pipeline stage |
| `doc-phase.md` | framing-pipeline.md | Pipeline stage |
| `discuss-capability.md` | discuss-capability command | v2 discussion |
| `discuss-feature.md` | discuss-feature command | v2 discussion |
| `resume-work.md` | resume-work command | Session continuity |
| `progress.md` | progress command | Status/routing |
| `transition.md` | execute-phase.md (prose ref) | Post-phase routing |
| `verify-phase.md` | execute-phase.md (prose ref) | Goal verification |

### Agents to DELETE (6 files)

| File | What it was | Why dead |
|------|-------------|----------|
| `gsd-codebase-mapper.md` | 4-agent codebase analysis | Only caller is map-codebase (dead) |
| `gsd-debugger.md` | Scientific debugging | Only caller is verify-work→diagnose-issues (dead chain). NOT used by /debug framing. |
| `gsd-integration-checker.md` | Cross-milestone audit | Only caller is audit-milestone (dead) |
| `gsd-project-researcher.md` | 4-parallel domain researcher | Only callers are new-project/new-milestone (dead) |
| `gsd-research-synthesizer.md` | Research synthesis | Only callers are new-project/new-milestone (dead) |
| `gsd-roadmapper.md` | Roadmap generation | Only callers are new-project/new-milestone (dead) |

### Agents to KEEP

| File | Referenced by | Role |
|------|--------------|------|
| `gsd-phase-researcher.md` | research-phase workflow | Phase research |
| `gsd-planner.md` | plan-phase workflow | Plan generation |
| `gsd-plan-checker.md` | plan-phase workflow | Plan verification |
| `gsd-executor.md` | execute-phase workflow | Plan execution |
| `gsd-verifier.md` | execute-phase workflow | Goal verification |
| `gsd-review-enduser.md` | review-phase workflow | End-user review |
| `gsd-review-functional.md` | review-phase workflow | Functional review |
| `gsd-review-technical.md` | review-phase workflow | Technical review |
| `gsd-review-quality.md` | review-phase workflow | Code quality review |
| `gsd-review-synthesizer.md` | review-phase workflow | Review synthesis |
| `gsd-doc-writer.md` | doc-phase workflow | Documentation |
| `gsd-research-domain.md` | None (Phase 9 INTG-01 wiring) | v2 epistemic gatherer |
| `gsd-research-edges.md` | None (Phase 9 INTG-01 wiring) | v2 epistemic gatherer |
| `gsd-research-intent.md` | None (Phase 9 INTG-01 wiring) | v2 epistemic gatherer |
| `gsd-research-prior-art.md` | None (Phase 9 INTG-01 wiring) | v2 epistemic gatherer |
| `gsd-research-system.md` | None (Phase 9 INTG-01 wiring) | v2 epistemic gatherer |
| `gsd-research-tech.md` | None (Phase 9 INTG-01 wiring) | v2 epistemic gatherer |

### Hook to DELETE (1 file)

| File | Why dead |
|------|----------|
| `hooks/gsd-check-update.js` | Update check dropped per decision (CLN-06). Also: dead code block in `gsd-statusline.js` lines 87-95 reads update cache — strip that block too. |

### Hooks to KEEP

| File | Why keep |
|------|----------|
| `hooks/gsd-statusline.js` | Core UX (after dead update-check block removed) |
| `hooks/gsd-context-monitor.js` | Core context management |

### Metadata/Infrastructure to DELETE (6 items)

| File/Dir | What it is | Why dead |
|----------|-----------|----------|
| `CHANGELOG.md` | 66KB v1 changelog | INST-06: removed |
| `.github/` (entire directory) | CI, issue templates, funding, codeowners | v2 is personal tooling |
| `scripts/build-hooks.js` | Bundles hooks for npm dist | v2 not publishing to npm |
| `tests/codex-config.test.cjs` | Tests Codex adapter functions | Codex adapters dead (INST-05) |
| `tests/verify-health.test.cjs` | Tests health check CLI | Health check removed in Phase 7 |

### Metadata UNCERTAIN

| File | Question |
|------|----------|
| `scripts/run-tests.cjs` | Cross-platform test runner. Alive if any tests remain. Dead tests (codex, health) are being removed but other tests may exist. |

### Metadata NOT in source (Phase 12 install.js fixes)

These items don't exist in the project source tree — they're generated by install.js at install time:
- `VERSION` file — written dynamically from pkg.version
- `gsd-file-manifest.json` — manifest for patch system
- `gsd-local-patches/` directory — backup system
- `package.json` `"type": "commonjs"` — injected into installed tree, not source

These are Phase 12 (INST-05/INST-06) cleanup items, not Phase 8.

## Architecture Patterns

### Deletion Order (by category, one commit each)

```
Wave 1: Commands (15 files) → smoke scan
Wave 2: Workflows (21 files) → smoke scan
Wave 3: Agents (6 files) → smoke scan
Wave 4: Hooks (1 file + 1 dead code block) → smoke scan
Wave 5: Metadata/Infrastructure (6 items) → smoke scan
```

### Smoke Scan Pattern

After each category deletion:
```bash
# Grep surviving files for references to deleted filenames
# Flag any broken @file references
# Report and pause if conflicts found
```

## Common Pitfalls

### Pitfall 1: Deleting pipeline internals
**What goes wrong:** Deleting commands like `execute-phase.md` that are still used by the GSD workflow system
**Why it happens:** Confusing "not in v2 user surface" with "not needed"
**How to avoid:** Only delete from the verified kill lists. Pipeline internals flagged for Phase 10.

### Pitfall 2: Forgetting the installed tree
**What goes wrong:** Deleting from ~/.claude/ instead of project source
**Why it happens:** Both trees have the same files
**How to avoid:** All deletions target get-shit-done-pe/ only. Installed tree rebuilt by Phase 12.

### Pitfall 3: Not cleaning dead code in surviving files
**What goes wrong:** gsd-statusline.js has dead update-check code. Deleting the hook without cleaning the statusline leaves dead code.
**How to avoid:** Hook deletion includes cleaning dead references in surviving files.

## Open Questions

1. **scripts/run-tests.cjs** — Keep or kill depends on whether any non-dead test files exist after removing codex and health tests. Planner should check.

## Sources

### Primary (HIGH confidence)
- 4 parallel codebase audits: commands, workflows, agents, hooks/metadata
- Each audit used Glob + Grep to trace file references
- Cross-referenced against .planning/phases/07-cleanup/07-INVENTORY.md

### Secondary (MEDIUM confidence)
- Roadmap estimates (26 commands, 20 workflows) were higher than verified counts — estimates came from requirements session, not file-level audit

## Metadata

**Confidence breakdown:**
- Kill lists: HIGH — every file traced through reference chains
- Keep lists: HIGH — traced from 11 v2 commands + INVENTORY verdicts
- Phase 10 flags: MEDIUM — heuristic (touches execution = defer)

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable — no external dependencies)
