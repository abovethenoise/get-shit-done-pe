# Resume Point

## Where We Are
Phase 11 (Automated Testing) — all 3 plans executed, findings reviewed with user. Trivial fixes applied. **Phase 11 is NOT yet marked complete** — needs verification step and roadmap restructure.

## What's Done
- 11-01: @file scan + cross-ref audit ✓
- 11-02: CLI smoke tests (21 routes) ✓
- 11-03: E2E simulation + friction log + user Q&A + trivial fixes ✓

## What's Left Before Phase 11 Closes
1. **Restructure ROADMAP.md** — user decided:
   - Phase 12: Final workflow rewiring (close B1-B3 blockers from friction log)
   - Phase 13: Deeper E2E trace after rewiring
   - Phase 14: Install (was Phase 12)
2. **Mark Phase 11 complete** via `phase complete "11"`
3. Commit roadmap changes

## Key Decisions From This Session
- V1 phase system is disposable — no dual-mode, rewrite for v2
- Pipeline stage workflows (plan.md, execute.md, review.md, doc.md) need rewiring to use v2 feature routes
- STATE.md/ROADMAP.md bootstrap needs design
- Capability → feature decomposition step needs design
- User provided ideal flow vision (see friction log B1-B3 analysis + user message in session)

## User's Ideal Flow (captured verbatim)
- **New project:** discuss goals/standards/tech → document → discuss detailed goals (capabilities) → initial .planning structure
- **Brownfield:** discuss goals → determine frame → 6-phase research → discuss standards → document → confirm features → generate .planning/ and .documentation/
- **After start:** discuss capability → discovery → requirements → research → draft plan → discuss → finalize → execute → review → document/reflect
- **Or:** discuss feature → discovery (EU/FN/TC) → research → plan → discuss → execute → review → document
- **Milestone/roadmap:** lightweight sequencing layer, execution at capability/feature level
- Can jump in/out at any point

## Files to Read
- `.planning/phases/11-automated-testing/11-FRICTION-LOG.md` — full findings with 3 blockers
- `.planning/phases/11-automated-testing/e2e-simulation-notes.md` — pipeline trace
