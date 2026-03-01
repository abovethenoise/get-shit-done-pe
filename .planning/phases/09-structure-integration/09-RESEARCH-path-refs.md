# Phase 9 Research: Path References

**Researched:** 2026-03-01
**Scope:** Exhaustive scan of commands/, workflows/, agents/, hooks/, bin/ for broken @file refs, hardcoded paths, and phase-model assumptions.

---

## Functional @file References to DELETED Workflows (MUST FIX)

These commands reference workflows that were deleted in Phase 7/8 cleanup. The command files themselves are orphaned too (not in CMD-01's 11-command surface), so the fix is: **delete the command, not fix the reference.**

| Command File | Line | @file Reference | Target Status |
|---|---|---|---|
| `commands/gsd/discuss-phase.md` | 30 | `@~/.claude/get-shit-done/workflows/discuss-phase.md` | DELETED workflow |
| `commands/gsd/help.md` | 16 | `@~/.claude/get-shit-done/workflows/help.md` | DELETED workflow |
| `commands/gsd/map-codebase.md` | 23 | `@~/.claude/get-shit-done/workflows/map-codebase.md` | DELETED workflow |
| `commands/gsd/new-milestone.md` | 28 | `@~/.claude/get-shit-done/workflows/new-milestone.md` | DELETED workflow |
| `commands/gsd/pause-work.md` | 22 | `@~/.claude/get-shit-done/workflows/pause-work.md` | DELETED workflow |
| `commands/gsd/quick.md` | 29 | `@~/.claude/get-shit-done/workflows/quick.md` | DELETED workflow |
| `commands/gsd/verify-work.md` | 23 | `@~/.claude/get-shit-done/workflows/verify-work.md` | DELETED workflow |

**Recommended action:** Delete all 7 command files. They reference deleted workflows and are NOT in the CMD-01 target surface (init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review).

### Additional Orphaned Commands (no deleted workflow, but not in CMD-01)

These commands still exist but are NOT in the 11-command target surface. They reference workflows that DO still exist, so they're "functional but unwanted":

| Command | References Workflow | Workflow Exists? | Disposition |
|---|---|---|---|
| `commands/gsd/discuss-phase.md` | `workflows/discuss-phase.md` | NO | Delete command |
| `commands/gsd/doc-phase.md` | `workflows/doc-phase.md` | YES | Phase 9 evaluates: merge into v2 or delete |
| `commands/gsd/execute-phase.md` | `workflows/execute-phase.md` | YES | Phase 9 evaluates: merge into v2 or delete |
| `commands/gsd/plan-phase.md` | `workflows/plan-phase.md` | YES | Phase 9 evaluates: merge into v2 or delete |
| `commands/gsd/research-phase.md` | `workflows/research-phase.md` | YES | Phase 9 evaluates: 6 gatherers replace this |
| `commands/gsd/review-phase.md` | `workflows/review-phase.md` | YES | Phase 9 evaluates: merge into v2 or delete |
| `commands/gsd/progress.md` | `workflows/progress.md` | YES | Keep? Not in CMD-01 but useful |

Per CONTEXT.md decision: "For surviving pipeline commands (plan-phase.md, execute-phase.md, research-phase.md): evaluate each -- flag as standalone, merge into v2 feature workflow, or delete."

---

## Functional @file References in SURVIVING Workflows (MUST FIX)

These are @file references inside workflows/agents that ARE part of the active pipeline but point to deleted workflows:

| File | Line | Reference | Target Status | Impact |
|---|---|---|---|---|
| `workflows/framing-pipeline.md` | 79 | `@~/.claude/workflows/research-phase.md` | EXISTS but being replaced by 6 gatherers | Wire to new research workflow |
| `workflows/resume-work.md` | 235 | `/gsd:research-phase [N]` | Command exists but workflow is being replaced | Update command ref |
| `workflows/transition.md` | 418 | `/gsd:research-phase [X+1]` | Same | Update command ref |
| `workflows/transition.md` | 443 | `/gsd:discuss-phase [X+1]` | DELETED workflow | Broken ref |
| `workflows/transition.md` | 393 | `SlashCommand("/gsd:discuss-phase [X+1]")` | DELETED workflow | Broken ref |
| `workflows/transition.md` | 410 | `/gsd:discuss-phase [X+1]` | DELETED workflow | Broken ref |
| `workflows/progress.md` | 217 | `/gsd:discuss-phase {phase}` | DELETED workflow | Broken ref |
| `workflows/progress.md` | 290 | `/gsd:discuss-phase {Z+1}` | DELETED workflow | Broken ref |
| `workflows/progress.md` | 349 | `/gsd:new-milestone` | DELETED workflow | Broken ref |
| `workflows/progress.md` | 251 | `/gsd:verify-work {phase}` | DELETED workflow | Broken ref |
| `workflows/progress.md` | 298 | `/gsd:verify-work {Z}` | DELETED workflow | Broken ref |
| `workflows/progress.md` | 325 | `/gsd:verify-work` | DELETED workflow | Broken ref |
| `workflows/execute-plan.md` | 395-397 | `/gsd:verify-work`, `/gsd:discuss-phase` | DELETED workflows | Broken next-step suggestions |
| `workflows/execute-plan.md` | 397 | `/gsd:complete-milestone`, `/gsd:add-phase` | DELETED commands | Broken next-step suggestions |
| `workflows/resume-work.md` | 234 | `/gsd:discuss-phase [N]` | DELETED workflow | Broken suggestion |
| `workflows/resume-work.md` | 181 | `/gsd:discuss-phase 3` | DELETED workflow | Broken suggestion |
| `workflows/plan-phase.md` | 153-156 | `discuss-phase` redirect | DELETED workflow | Broken redirect |
| `workflows/plan-phase.md` | 604 | `/gsd:discuss-phase ${NEXT_PHASE}` | DELETED workflow | Broken next-step |

---

## Hardcoded `.planning/phases/` Paths (Phase-Model Assumptions)

These are functional code paths that assume `.planning/phases/XX-name/` directory structure. In v2, new projects use `.planning/capabilities/` instead.

### In Workflows

| File | Line | Code Pattern | What It Assumes |
|---|---|---|---|
| `workflows/research-phase.md` | 29 | `ls .planning/phases/${PHASE}-*/RESEARCH.md` | phases/ directory |
| `workflows/research-phase.md` | 60 | `Write to: .planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md` | phases/ directory |
| `workflows/plan-phase.md` | 37 | `mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"` | phases/ directory |
| `workflows/plan-phase.md` | 649 | `cat .planning/phases/{phase-dir}/*-PLAN.md` | phases/ directory |
| `workflows/execute-plan.md` | 29-30 | `ls .planning/phases/XX-name/*-PLAN.md` | phases/ directory |
| `workflows/execute-plan.md` | 58 | `grep ... .planning/phases/XX-name/` | phases/ directory |
| `workflows/execute-plan.md` | 118 | `cat .planning/phases/XX-name/` | phases/ directory |
| `workflows/execute-plan.md` | 278 | `grep ... .planning/phases/XX-name/` | phases/ directory |
| `workflows/execute-plan.md` | 285 | `Create ... at .planning/phases/XX-name/` | phases/ directory |
| `workflows/execute-plan.md` | 366 | `commit ... --files .planning/phases/XX-name/` | phases/ directory |
| `workflows/execute-plan.md` | 389-390 | `ls .planning/phases/[current-phase-dir]/*` | phases/ directory |
| `workflows/resume-work.md` | 65 | `ls .planning/phases/*/.continue-here*.md` | phases/ directory |
| `workflows/resume-work.md` | 68 | `for plan in .planning/phases/*/*-PLAN.md` | phases/ directory |
| `workflows/resume-work.md` | 194 | `ls .planning/phases/XX-name/*-CONTEXT.md` | phases/ directory |
| `workflows/progress.md` | 136-138 | `ls .planning/phases/[current-phase-dir]/*` | phases/ directory |
| `workflows/progress.md` | 149 | `grep ... .planning/phases/[current-phase-dir]/*` | phases/ directory |
| `workflows/execute-phase.md` | 289 | `--files .planning/phases/*${PARENT_PHASE}*/*-UAT.md` | phases/ directory |
| `workflows/gather-synthesize.md` | 11 | `.planning/phases/XX-name/research/domain-truth.md` | phases/ directory (example) |
| `workflows/transition.md` | 42-43 | `ls .planning/phases/XX-current/*-PLAN.md` | phases/ directory |
| `workflows/transition.md` | 114 | `ls .planning/phases/XX-current/.continue-here*.md` | phases/ directory |
| `workflows/transition.md` | 154 | `cat .planning/phases/XX-current/*-SUMMARY.md` | phases/ directory |
| `workflows/transition.md` | 364 | `ls .planning/phases/*[X+1]*/*-CONTEXT.md` | phases/ directory |

### In Agents

| File | Line | Code Pattern | What It Assumes |
|---|---|---|---|
| `agents/gsd-phase-researcher.md` | 198 | `.planning/phases/XX-name/{phase_num}-RESEARCH.md` | phases/ directory |
| `agents/gsd-executor.md` | 259 | `.planning/phases/XX-name/` | phases/ directory |
| `agents/gsd-executor.md` | 365 | `--files .planning/phases/XX-name/` | phases/ directory |
| `agents/gsd-verifier.md` | 370 | `.planning/phases/{phase_dir}/` | phases/ directory |
| `agents/gsd-verifier.md` | 464 | `.planning/phases/{phase_dir}/` | phases/ directory |
| `agents/gsd-planner.md` | 395 | `.planning/phases/XX-name/` | phases/ directory |
| `agents/gsd-planner.md` | 690 | `.planning/phases/XX-name/` | phases/ directory |
| `agents/gsd-planner.md` | 711 | `--files .planning/phases/$PHASE-*/` | phases/ directory |

### In gsd-tools.cjs Lib Modules

| File | Line | Code Pattern | What It Assumes |
|---|---|---|---|
| `bin/lib/phase.cjs` | 12+ | `path.join(cwd, '.planning', 'phases')` (~30 occurrences) | phases/ directory |
| `bin/lib/core.cjs` | 256+ | `path.join(cwd, '.planning', 'phases')` | phases/ directory |
| `bin/lib/roadmap.cjs` | 97+ | hardcoded `phases` references | phases/ directory |
| `bin/lib/commands.cjs` | 63+ | `path.join(cwd, '.planning', 'phases')` | phases/ directory |
| `bin/lib/init.cjs` | 41+ | `phase_dir`, `phase_slug`, `padded_phase` in output | phases/ model |

**Note:** Per CONTEXT.md, gsd-tools.cjs path resolution must be updated to understand capability/feature directories. The `phase.cjs` module is the most heavily affected.

---

## {GSD_ROOT} Candidates

All `$HOME/.claude/get-shit-done/` and `~/.claude/get-shit-done/` paths should use `{GSD_ROOT}` token (Phase 12 install.js resolves them).

**Total occurrences across commands/workflows/agents: 193**

### By Path Pattern (unique targets, all exist on disk unless noted)

| Current Path | {GSD_ROOT} Version | Occurrence Count |
|---|---|---|
| `~/.claude/get-shit-done/workflows/*.md` | `{GSD_ROOT}/workflows/*.md` | ~85 |
| `~/.claude/get-shit-done/references/*.md` | `{GSD_ROOT}/references/*.md` | ~25 |
| `~/.claude/get-shit-done/templates/*.md` | `{GSD_ROOT}/templates/*.md` | ~10 |
| `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` | `{GSD_ROOT}/bin/gsd-tools.cjs` | ~30 |
| `~/.claude/agents/gsd-*.md` | `{GSD_ROOT}/../agents/gsd-*.md` or keep `~/.claude/agents/` | ~5 |

### Agent Path References (special case)

| File | Line | Current Path | Note |
|---|---|---|---|
| `commands/gsd/research-phase.md` | 138 | `~/.claude/agents/gsd-phase-researcher.md` | Agent path, not GSD_ROOT |
| `commands/gsd/research-phase.md` | 174 | `~/.claude/agents/gsd-phase-researcher.md` | Agent path, not GSD_ROOT |
| `workflows/plan-phase.md` | 210 | `~/.claude/agents/gsd-phase-researcher.md` | Agent path, not GSD_ROOT |
| `workflows/plan-phase.md` | 329 | `~/.claude/agents/gsd-planner.md` | Agent path, not GSD_ROOT |
| `workflows/plan-phase.md` | 521 | `~/.claude/agents/gsd-planner.md` | Agent path, not GSD_ROOT |

These use `~/.claude/agents/` which is Claude Code's agent directory, not GSD_ROOT. May need a separate `{AGENTS_ROOT}` token or leave as `~/.claude/agents/`.

---

## References to Deleted Artifacts (Phase 8 Leftovers)

### gsd-phase-researcher references (being replaced by 6 gatherers per CONTEXT.md)

| File | Line | Reference | Context |
|---|---|---|---|
| `commands/gsd/research-phase.md` | 12, 44, 74, 138, 174, 186 | `gsd-phase-researcher` | Entire command built around this agent |
| `workflows/research-phase.md` | 2, 14, 62 | `gsd-phase-researcher` | Workflow spawns this agent |
| `workflows/plan-phase.md` | 2, 175, 210, 661 | `gsd-phase-researcher` | Integrated research step |

**Note:** `agents/gsd-phase-researcher.md` still EXISTS on disk. Per CONTEXT.md: "6 gatherers REPLACE gsd-phase-researcher entirely." The agent file and all references need to be removed/replaced as part of Phase 9 gatherer wiring.

### discuss-phase references (workflow deleted, command still exists)

| File | Line | Reference |
|---|---|---|
| `commands/gsd/discuss-phase.md` | full file | Entire command references deleted workflow |
| `workflows/plan-phase.md` | 153, 156, 190, 297, 459, 506, 604 | Redirects to `/gsd:discuss-phase` |
| `workflows/execute-plan.md` | 396 | Suggests `/gsd:discuss-phase` |
| `workflows/resume-work.md` | 181, 197, 234 | Suggests `/gsd:discuss-phase` |
| `workflows/progress.md` | 217, 290 | Suggests `/gsd:discuss-phase` |
| `workflows/transition.md` | 393, 410, 442 | Suggests/invokes `/gsd:discuss-phase` |
| `agents/gsd-plan-checker.md` | 45, 273 | References `/gsd:discuss-phase` |
| `agents/gsd-phase-researcher.md` | 40 | References `/gsd:discuss-phase` |
| `agents/gsd-planner.md` | 51 | References `/gsd:discuss-phase` |

---

## Prose/Comment References (Phase 10 -- Document Only)

These are non-functional references in prose, comments, or examples. They don't break the pipeline.

| File | Line | Reference | Type |
|---|---|---|---|
| `agents/gsd-phase-researcher.md` | 540 | `@react-three/fiber 8.15` | Example text (not a file ref) |
| `agents/gsd-executor.md` | 57 | `(@-references)` | Prose describing @file pattern |
| `agents/gsd-executor.md` | 325 | `"${DECISIONS[@]}"` | Bash array syntax, not @file |
| `agents/gsd-planner.md` | 87 | `Context (@file references)` | Prose describing pattern |
| `agents/gsd-executor.md` | 154 | `**See @~/.claude/get-shit-done/references/checkpoints.md**` | Functional but inline prose ref |
| `agents/gsd-executor.md` | 263 | `**Use template:** @~/.claude/get-shit-done/templates/summary.md` | Functional but inline prose ref |
| `agents/gsd-planner.md` | 136 | `suggest /gsd:research-phase before plan-phase` | Prose suggestion |
| `agents/gsd-planner.md` | 357-364 | `@~/.claude/get-shit-done/workflows/execute-plan.md` etc | Functional @file refs in agent (keep, update path token) |
| `agents/gsd-phase-researcher.md` | 317-319 | `/gsd:verify-work` | Prose reference to deleted command |
| `workflows/gather-synthesize.md` | 11 | `.planning/phases/XX-name/research/` | Example output path |

---

## Hooks Assessment

| Hook | Phase Path Refs | Status |
|---|---|---|
| `hooks/gsd-context-monitor.js` | 0 | Clean -- no phase-model assumptions |
| `hooks/gsd-statusline.js` | 0 | Clean -- no phase-model assumptions |

Both hooks are purely session/context focused. No updates needed for Phase 9 path migration.

---

## bin/install.js Assessment

| File | Phase Path Refs | Notes |
|---|---|---|
| `bin/install.js` | 0 grep hits for `phases` | Install.js doesn't hardcode `.planning/phases/`. It deploys source files to `~/.claude/` directories. Phase 12 owns its refactor (INST-05, INST-06). |

---

## Summary Stats

| Category | Count | Action |
|---|---|---|
| Commands referencing DELETED workflows | 7 files | Delete commands (not in CMD-01) |
| Additional orphaned commands (not in CMD-01) | 6 files | Evaluate per CONTEXT.md decision |
| Surviving workflows with broken `/gsd:` command refs | ~25 references across 6 workflow files | Fix: update to v2 equivalents |
| Hardcoded `.planning/phases/` in workflows | ~22 locations across 8 files | Fix: update to capability/feature model |
| Hardcoded `.planning/phases/` in agents | ~8 locations across 4 files | Fix: update to capability/feature model |
| Hardcoded `.planning/phases/` in gsd-tools lib | ~50+ locations across 5 files | Fix: add capability/feature path resolution |
| `{GSD_ROOT}` conversions needed | ~193 occurrences | Convert `~/.claude/get-shit-done/` to `{GSD_ROOT}/` |
| `gsd-phase-researcher` refs (being replaced) | ~15 references across 3 files | Replace with 6-gatherer wiring |
| `/gsd:discuss-phase` refs (deleted) | ~20 references across 10 files | Replace with v2 equivalent (discuss-capability/discuss-feature) |
| Prose/comment refs (Phase 10) | ~10 items | Document only, defer |
| Hooks needing updates | 0 | No action |

### Priority Order for Phase 9

1. **Delete 7 orphaned commands** pointing to deleted workflows
2. **Fix ~25 broken `/gsd:` command references** in surviving workflows (discuss-phase -> discuss-capability/discuss-feature, verify-work -> review, etc.)
3. **Replace gsd-phase-researcher wiring** with 6-gatherer research workflow (INTG-01)
4. **Evaluate 6 remaining non-CMD-01 commands** (plan-phase, execute-phase, etc.) per CONTEXT.md
5. **Update `.planning/phases/` paths** to capability/feature model in workflows + agents
6. **Update gsd-tools.cjs** lib modules for capability/feature path resolution (CLN-03 overlap -- coordinate with Phase 10)
7. **Convert `~/.claude/get-shit-done/` to `{GSD_ROOT}/`** across all files (INST-02 prereq for Phase 12)
