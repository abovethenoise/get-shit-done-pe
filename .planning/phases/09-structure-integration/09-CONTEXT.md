# Phase 9: Structure & Integration - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish v2 directory conventions (capabilities/features replacing phases) across all surviving artifacts, wire the 6 orphaned research gatherers into the pipeline, update hooks for v2 STATE.md fields, and ensure all pipeline handoffs preserve the 10 core pipeline behaviors.

Templates are OUT OF SCOPE — Phase 10 owns the holistic template audit (CLN-04). Phase 9 updates structure, wiring, and functional references only.

</domain>

<decisions>
## Implementation Decisions

### Directory Model
- New projects via /init produce `.planning/capabilities/` with NO `phases/` directory
- `.documentation/` directory (architecture.md, domain.md, mapping.md, capabilities/, decisions/) created by /init as scaffolding
- STATE.md tracks: active capability, active feature, current plan within feature, decisions from discovery, blockers, last agent summary, pipeline position
- Pull existing capabilities/features directory structure details from Phase 1 docs (FOUND-01 through FOUND-06)
- Templates deferred to Phase 10 — don't update template language in this phase

### Research Gatherer Wiring
- All 6 gatherers (domain, edges, intent, prior-art, system, tech) always run regardless of framing type
- 6 gatherers REPLACE gsd-phase-researcher entirely — they ARE the research stage
- Fire after discuss-capability/discuss-feature and before planning
- Synthesizer agent consolidates 6 outputs into one RESEARCH.md (consensus/conflicts/gaps pattern)
- Create a NEW standalone research workflow (not inline in framing-pipeline)
  - Framing-pipeline determines WHAT to research (scoped by lens)
  - Research workflow determines HOW to research (gatherers + synthesis)
  - Separation enables: multiple callers, independent testability, clean separation of concerns

### Path Reference Migration
- Fix ALL functional @file references now — a broken path is a broken pipeline
- Prose, comments, and examples deferred to Phase 10 reference audit
- Use {GSD_ROOT} tokens immediately (Phase 12 install.js resolves them)
- Update gsd-tools.cjs path resolution to understand capability/feature directories (don't defer to Phase 10)
- For surviving pipeline commands (plan-phase.md, execute-phase.md, research-phase.md): evaluate each — flag as standalone, merge into v2 feature workflow, or delete. Don't blanket rename.

### Hooks Audit
- Audit context-monitor and statusline hooks against v2 model (capabilities/features, not phases)
- Verify hooks read STATE.md fields that still exist after v2 field renames
- Update hooks in same phase as STATE.md changes — they're tightly coupled
- Context-monitor: verify + fix stale refs only, don't enhance for v2 awareness (scope creep)

### Pipeline Handoffs
- Same 4 framing entry points (/debug, /new, /enhance, /refactor). Whether it targets capability or feature depends on what follows the command
- Auto-advance for mechanical stages. Manual gates at every human judgment point (Q&A, ambiguity surfacing, approach review, requirement walkthrough)
- Plan → Execute: draft plan → plan-checker verifies → Q&A loop if ambiguity → user verbal "pass" confirmation → auto-execute with parallel waves
- Execute → Review: execution complete + verification passes → 4 parallel reviewers auto-spawn
- Review → Documentation: review accepted → doc-writer auto-generates
- Review issues: 4 reviewers → synthesizer → draft fix plan → Q&A loop → verbal pass → auto-execute fix. Same pattern everywhere.
- Feature completion → auto-suggest next feature within capability

### Artifact Awareness
- Keep per-workflow <files_to_read> approach (no central manifest)
- Each agent .md must explicitly declare 'expects' (inputs) and 'produces' (outputs) sections
- Makes the pipeline chain visible and verifiable: research produces RESEARCH.md, planner expects RESEARCH.md + CONTEXT.md, executor expects PLAN.md, etc.

### Pipeline Invariants (MUST preserve)
Document these 10 behaviors as formal pipeline invariants in a reference doc:
1. Fresh context per executor (subagents get full 200k, orchestrator stays lean)
2. Wave dependency analysis (plans grouped by dependency, executed in order)
3. Plan-checker verification loop (draft → verify → Q&A → confirm)
4. Atomic commits per task (each task = one git commit)
5. Context loading via paths not content (pass file paths, agents read themselves)
6. State progression via CLI (gsd-tools.cjs manages STATE.md updates)
7. Session handoff (STATE.md + SUMMARY.md provide full context for /clear recovery)
8. Requirement ID chain (every task traces to a REQ ID)
9. Summary frontmatter (structured SUMMARY.md per plan)
10. Spot-check on executor output (verify claims before reporting success)

### Session Handoff
- Same mechanism as current (STATE.md + SUMMARY.md), updated field names for capability/feature model
- Evaluate whether `.continue-here` files pull their weight or are redundant with STATE.md + SUMMARY.md — cleanup candidate if redundant

### Claude's Discretion
- None specified — all areas had explicit decisions

</decisions>

<specifics>
## Specific Ideas

- "Function is important, the raw method isn't as much" — preserve what works, don't be precious about how it's implemented
- The 10 pipeline invariants came from direct user observation of what makes GSD work well
- Research workflow separation reasoning: multiple callers (framing-pipeline, /new, /enhance, quick mode), independent testability, clean separation of what-to-research vs how-to-research

</specifics>

<deferred>
## Deferred Ideas

- Template language updates (phase → capability/feature) — Phase 10 CLN-04
- Prose/comment/example reference updates — Phase 10 CLN-05
- Context-monitor v2 enhancement (capability/feature boundary awareness) — future phase
- Whether .continue-here is redundant — evaluate during research, decision may fall to Phase 10

</deferred>

---

*Phase: 09-structure-integration*
*Context gathered: 2026-03-01*
