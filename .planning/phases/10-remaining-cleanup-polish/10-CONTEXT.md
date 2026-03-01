# Phase 10: Remaining Cleanup & Polish - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and clean the entire GSD toolchain against the now-established v2 structure. Remove dead CLI modules, delete stale templates, update or remove reference docs, fix all broken @file references, tokenize hardcoded paths to {GSD_ROOT}, create 4 new v2 templates, and enforce naming conventions. Phase 9 established the v2 structure -- Phase 10 makes sure everything else aligns with it.

Templates, references, and CLI code that only served the v1 model get removed. Surviving artifacts get updated to v2 language (capabilities/features, not phases).

</domain>

<decisions>
## Implementation Decisions

### CLI Dead Code Strategy
- Full audit of ALL bin/lib/*.cjs files (gsd-tools.cjs, core.cjs, init.cjs, state.cjs) -- not just the CLI router
- Rule: grep for callers across surviving commands/workflows/agents. Zero callers = delete
- v1 phase CLI commands: audit against roadmap to confirm phases 11-12 don't depend on them, then remove if safe
- Milestone-related CLI routes: same rule -- remove if zero callers (milestone commands deleted in Phase 8)
- Dead state fields (milestone_name, milestone tracking): remove if nothing reads/writes them
- Helper/utility functions included in audit -- if a helper only served deleted routes, it's dead too

### Model Profile Standard
- **Main/orchestrator:** Opus
- **Research/execution:** Sonnet
- **Judge/review:** Opus (inherit from orchestrator)
- **Quick tasks, no logic or thinking:** Haiku
- Update both model-profiles.md (mapping table + brief rationale per tier) and core.cjs hardcoded profiles
- Update model-profile-resolution.md in the same pass -- tightly coupled

### Template Keep/Kill Criteria
- Update surviving templates to v2 capability/feature language (not phase language)
- Delete outright any template that serves an artifact type that no longer exists in v2 (git history preserves)
- Consumer references (e.g., "gsd-phase-researcher reads this"): Claude decides per-template whether to update or strip
- context.md template: update to capability/feature language
- summary.md template: update to feature-level language (same concept, scoped to feature)
- All templates live in the same templates/ directory (stale v1 templates deleted, only v2 remains)

### New v2 Templates (4 new)
- **CAPABILITY.md** -- Defines capability scope, child features, priority order. New equivalent of milestone definition.
- **FEATURE.md** -- Scoped requirements, acceptance criteria, discovery decisions. Replaces CONTEXT.md + phase-specific REQUIREMENTS.md.
- **DISCOVERY-BRIEF.md** -- Lens classification, research synthesis, scoped requirements. Handoff artifact from discovery to planning. No v1 equivalent exists.
- **FEATURE-REQUIREMENTS.md** -- End user / functional / technical requirements. Maps to the 3 reviewer dimensions from milestone 1.

### Reference Doc Accuracy
- Audit all reference docs: is it referenced by surviving v2 artifacts? Is content accurate? Remove or update accordingly.
- Caller check uses v2 artifacts only -- refs only from deleted v1 workflows count as zero callers
- **Keep list (confirmed):**
  - pipeline-invariants.md -- active checklist for modifications (quick spot-check of 'Where' field paths)
  - questioning.md -- actively used, Q&A is expanding/becoming more interactive
  - model-profiles.md -- updated to v2 standard, kept
  - model-profile-resolution.md -- updated alongside model-profiles.md, kept
  - ui-brand.md -- actively @file referenced by multiple workflows, kept
- Everything else: remove if zero v2 callers

### @file Resolution Approach
- Automated grep for all @file and @/ patterns across commands/workflows/agents
- Build list, verify each target exists, fix broken ones manually
- {GSD_ROOT} tokenization: Phase 10 converts all ~193 hardcoded /Users/philliphall/.claude/ paths to {GSD_ROOT} tokens
- {GSD_ROOT} resolution: check what install.js already uses/expects and align with that convention (don't invent new)
- @file refs pointing to files deleted in this phase: remove the @file line entirely (no TODO markers)

### GSD Naming Conventions
- Agents: `gsd-` prefix (gsd-executor.md, gsd-planner.md, etc.)
- Workflows: no prefix (execute-plan.md, plan-phase.md, etc.)
- Commands: live under commands/gsd/
- Research audits all filenames for convention violations and flags for fixing
- New v2 templates: same templates/ directory, no subdirectory

### Claude's Discretion
- Per-template decision on whether to update consumer references or strip them (artifact_contracts may be sufficient)
- Specific {GSD_ROOT} token format (pending install.js research)
- Which helper functions are truly dead vs shared across v1/v2 paths

</decisions>

<specifics>
## Specific Ideas

- "Can remove most reference docs. The one exception: the 10 pipeline behaviors reference. That one earns its place because it's a checklist you'll validate against during modifications."
- "Everything should use our new v2 standard for model profiles: main -> opus, research/execution -> sonnet, judge/review -> opus (inherit), quick tasks -> haiku"
- Q&A (questioning.md) is a key feature being expanded -- preserve and potentially enhance, don't touch destructively
- FEATURE-REQUIREMENTS.md maps to the 3 reviewer dimensions (end user, functional, technical) designed in milestone 1

</specifics>

<deferred>
## Deferred Ideas

- questioning.md expansion/enhancement -- future milestone scope, not Phase 10
- {GSD_ROOT} runtime resolution in install.js -- Phase 12 (INST-02)
- v1 phase command removal if roadmap audit shows phases 11-12 depend on them -- handle in Phase 12

</deferred>

---

*Phase: 10-remaining-cleanup-polish*
*Context gathered: 2026-03-01*
