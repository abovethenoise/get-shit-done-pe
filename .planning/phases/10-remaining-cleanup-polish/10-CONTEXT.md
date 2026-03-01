# Phase 10: Remaining Cleanup & Polish - Context

**Gathered:** 2026-03-01
**Updated:** 2026-03-01 (refined after planning round 1)
**Status:** Ready for re-planning

<domain>
## Phase Boundary

Audit and clean the entire GSD toolchain against the now-established v2 structure. Remove dead CLI modules, delete stale templates, update or remove reference docs, fix all broken @file references. Phase 9 established the v2 structure -- Phase 10 makes sure everything else aligns with it.

**The v2 model is capabilities and features. Phases do not exist in v2.** The only holdover is "milestone" as a loose grouping concept for priority/roadmap purposes.

All v1 phase commands are deleted. Phase workflows are renamed to generic names and updated for feature/capability context. Templates, references, and CLI code that only served the v1 phase model get removed. Surviving artifacts get updated to v2 language (capabilities/features, not phases).

</domain>

<decisions>
## Implementation Decisions

### CRITICAL: No Phase Concept in v2
- **Phases do not exist in v2.** Everything is capabilities and features.
- **Milestone** is the only holdover — loose grouping for priority/roadmap.
- `phase:` frontmatter fields in templates → REMOVE (not "keep for grouping" — that's false)
- "Phases are still valid execution units" → FALSE. Remove this language everywhere.
- All v1 phase commands deleted. All v1 phase workflows renamed to generic names.

### V1 Phase Command Deletion
Delete these 4 command wrappers from commands/gsd/:
- `plan-phase.md` → DELETE
- `execute-phase.md` → DELETE
- `review-phase.md` → DELETE
- `doc-phase.md` → DELETE
- `research-phase.md` → DELETE (already planned)

Users invoke `/gsd:new`, `/gsd:enhance`, `/gsd:refactor`, `/gsd:debug` instead. These route through framing-pipeline which calls the underlying workflow logic.

### V1 Phase Workflow Renaming
The workflow files contain reusable logic that framing-pipeline.md depends on. Rename to drop "phase":
- `workflows/plan-phase.md` → `workflows/plan.md`
- `workflows/execute-phase.md` → `workflows/execute.md`
- `workflows/review-phase.md` → `workflows/review.md`
- `workflows/doc-phase.md` → `workflows/doc.md`
- `workflows/execute-plan.md` → stays (already generic)
- `workflows/transition.md` → DELETE (only serves phase transitions; v2 doesn't have phase transitions)

After renaming, update content inside each workflow to make sense in feature/capability context (not just filename — the internal language too).

Update all @file references in framing-pipeline.md, agents, and any other callers to point to renamed files.

### V1 Phase CLI Route Deletion
These CLI init routes become dead after command/workflow deletion:
- `init plan-phase` → DELETE (only caller was plan-phase.md workflow)
- `init execute-phase` → KEEP but rename to `init execute` (called by execute.md + execute-plan.md)
- `init review-phase` → DELETE (only caller was review-phase.md workflow)
- `init doc-phase` → DELETE (only caller was doc-phase.md workflow)
- `init phase-op` → DELETE (only callers were verify-phase.md + research-phase.md, both deleted)

Also delete the corresponding handler functions from init.cjs.

### Cascade: Orphaned Agents
These agents are ONLY spawned by the deleted/renamed workflows. Evaluate each:
- `gsd-planner` → KEEP (spawned by plan.md workflow, which still exists renamed)
- `gsd-plan-checker` → KEEP (spawned by plan.md workflow)
- `gsd-executor` → KEEP (spawned by execute-plan.md)
- `gsd-verifier` → KEEP (spawned by execute.md workflow)
- `gsd-review-enduser`, `gsd-review-functional`, `gsd-review-technical`, `gsd-review-quality` → KEEP (spawned by review.md workflow)
- `gsd-review-synthesizer` → KEEP (spawned by gather-synthesize.md)
- `gsd-doc-writer` → KEEP (spawned by doc.md workflow)

None are orphaned because the workflows are RENAMED not DELETED. But update any agent @file refs that point to old workflow names.

### Cascade: Workflows That Route to Phase Commands
These workflows reference `/gsd:plan-phase`, `/gsd:execute-phase` etc. in their routing logic:
- `progress.md` → Update all routing to v2 commands
- `resume-work.md` (resume-project.md) → Update all routing to v2 commands
- `framing-pipeline.md` → Update @file refs to renamed workflows

### CLI Dead Code Strategy
- Full audit of ALL bin/lib/*.cjs files — not just the CLI router
- Rule: grep for callers across surviving v2 commands/workflows/agents. Zero callers = delete
- Expanded scope: v1 phase init routes (init plan-phase, etc.) now dead — add to removal list
- Phase lifecycle routes (phase add/insert/remove/next-decimal) → DELETE
- Phase utility routes (find-phase, phase complete, phase-plan-index, phases list) → evaluate per caller; if only called by deleted phase workflows, DELETE
- Milestone-related CLI routes: remove if zero callers
- Dead state fields: remove if nothing reads/writes them
- Helper/utility functions: if a helper only served deleted routes, it's dead too

### Model Profile Standard
- **Main/orchestrator:** Opus
- **Research/execution:** Sonnet
- **Judge/review:** Opus (inherit from orchestrator)
- **Quick tasks, no logic or thinking:** Haiku
- Update both model-profiles.md (mapping table + brief rationale per tier) and core.cjs hardcoded profiles
- Update model-profile-resolution.md in the same pass -- tightly coupled

### Template Keep/Kill Criteria
- Update surviving templates to v2 capability/feature language
- `phase:` frontmatter field → REMOVE from all templates (not "keep for grouping")
- Delete any template that serves an artifact type that no longer exists in v2
- phase-prompt.md → rename to plan-prompt.md or similar, update to feature/capability context
- summary templates → update to feature-level language, remove "Next Phase Readiness"
- All templates live in the same templates/ directory

### New v2 Templates
- **CAPABILITY.md** -- already exists (created Phase 9)
- **FEATURE.md** -- already exists (created Phase 9)
- **DISCOVERY-BRIEF.md** -- already exists (created Phase 9)
- **FEATURE-REQUIREMENTS.md** -- SKIP (user decided feature.md is sufficient)

### Reference Doc Accuracy
- Audit all reference docs: is it referenced by surviving v2 artifacts? Is content accurate?
- Caller check uses v2 artifacts only -- refs only from deleted v1 workflows count as zero callers
- **Keep list (confirmed):**
  - pipeline-invariants.md
  - questioning.md
  - model-profiles.md (updated to v2 standard)
  - model-profile-resolution.md (updated alongside model-profiles.md)
  - ui-brand.md
  - checkpoints.md
  - framing-lenses.md
  - escalation-protocol.md
  - git-integration.md
  - continuation-format.md (updated to v2 examples)
- Everything else: remove if zero v2 callers

### @file Resolution Approach
- Automated grep for all @file and @/ patterns across commands/workflows/agents
- Build list, verify each target exists, fix broken ones
- @file refs pointing to files deleted/renamed in this phase: update to new paths or remove
- {GSD_ROOT} tokenization: Phase 12 scope (INST-02), NOT Phase 10

### GSD Naming Conventions
- Agents: `gsd-` prefix
- Workflows: no prefix, generic names (plan.md not plan-phase.md)
- Commands: live under commands/gsd/
- New v2 templates: same templates/ directory

### Claude's Discretion
- Per-template decision on whether to update consumer references or strip them
- Which helper functions are truly dead vs shared across v1/v2 paths
- Exact internal language updates in renamed workflow files

</decisions>

<specifics>
## Specific Ideas

- "Everything should use our new v2 standard for model profiles"
- Q&A (questioning.md) is a key feature being expanded -- preserve and potentially enhance
- Milestone is the ONLY holdover from v1 hierarchy — loose grouping for priority/roadmap
- Capability is the WHAT/WHY, Feature is the HOW
- feature.md is sufficient — no separate FEATURE-REQUIREMENTS.md needed
- Installed version in ~/.claude/ is what runs — deleting source files doesn't affect running toolchain until next install. No bootstrap trap.

</specifics>

<deferred>
## Deferred Ideas

- questioning.md expansion/enhancement -- future milestone scope, not Phase 10
- {GSD_ROOT} tokenization and runtime resolution in install.js -- Phase 12 (INST-02)

</deferred>

---

*Phase: 10-remaining-cleanup-polish*
*Context gathered: 2026-03-01, updated: 2026-03-01*
