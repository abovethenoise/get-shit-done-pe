# Phase 7: Cleanup - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit all v1 artifacts against v2 usage. Determine which v1 concepts are superior, which v2 equivalents win, and which should hybridize. Remove dead weight, reorganize keepers into GSD structure, and verify the pipeline still works end-to-end. This is a concept-level audit, not just a file-level grep.

</domain>

<decisions>
## Implementation Decisions

### Inventory approach
- **Concept-first audit** — map each capability domain (v1 approach vs v2 approach), then derive file-level actions from the verdict
- Three inventory layers:
  1. **6 known concept domains** — framing/lens taxonomy, research (6-agent synthesis vs 4 generic), discovery/discussion (lens-aware vs discuss-phase), requirements (3 abstraction levels vs flat), code review (4-reviewer+judge vs UAT+debug), documentation (taxonomy+ownership vs GSD artifacts)
  2. **Unevaluated GSD capabilities** — session management, codebase mapping, state tracking, model routing, git branching strategy, quick mode
  3. **Unmapped v1 concepts** — things that have no GSD equivalent (lens system, doc agent pipeline stages)
- Also audit specific agent definitions (gsd-planner.md, gsd-executor.md, etc.) for behaviors to preserve or override
- Output format: **verdict + rationale** per domain (keep v1 / keep v2 / hybridize / drop both)
- Inventory lives in `.planning/phases/07-cleanup/07-INVENTORY.md`
- **Two-pass process**: audit produces inventory, then Q&A round to review verdicts before any planning or execution

### Removal criteria
- **Archive + gitignore** — removed files move to archive directory, added to .gitignore. Not truly deleted, recoverable locally
- **Hybridize verdicts** get flagged for discussion, not auto-merged. Q&A round before any merge work happens
- **Dead v1 concepts** — ideas from early iterations that got superseded even within v1. Flag these for removal so they don't accidentally carry forward
- **One source of truth** — if a concept was merged into GSD structure but standalone version still exists, that's a conflict. Eliminate redundancy
- Files with "keep v1" verdict get **reorganized into GSD directory structure** (workflows/, agents/, templates/)

### CLI refactoring
- **Dead commands removed entirely** — no deprecation wrappers, clean cut
- **Token budget consciousness** — strip v1-specific flags/behaviors from shared commands to reduce footprint toward ~1500 token target
- **Code vs prompt dividing line**:
  - Stays in .cjs: deterministic execution — git, file I/O, config, state mutations
  - Moves to .md: orchestration instructions — "read X, think about Y, output Z"
  - The test: "Would this break if the LLM interpreted it slightly differently each time?" Yes → code. No → prompt
- **Evaluate CLI→workflow migration** — commands that are "prompts pretending to be CLI tools" should become workflow .md files
- **Namespace strategy**: prune /gsd: commands first, then decide namespace for custom concepts based on what survives

### Safety & verification
- Archive + gitignore provides rollback safety (no branch ceremony needed)
- **Final step: full pipeline smoke test** on a throwaway branch — every stage fires, every agent runs, every artifact produced
  - new-project/new-milestone → discuss-phase → plan-phase → execute-phase → verify-work
  - Doesn't need real work, just proves pipeline integrity
- Smoke test is baked into phase execution — cleanup isn't "done" until pipeline runs clean

### Claude's Discretion
- Infrastructure-level files (orphan templates, unused agent defs): Claude decides archive vs direct delete per-file
- Token budget allocation strategy across agent invocations
- Smoke test failure recovery: fix in place vs revert+re-evaluate, based on severity
- Per-command evaluation of whether v1 remnants are harmless or bloating

</decisions>

<specifics>
## Specific Ideas

- Research and planning agents should have autonomy to independently identify cross-version inefficiencies or ambiguities that the concept-level audit might miss — flag these for additional Q&A before execution
- The inventory Q&A round is critical: user reviews all verdicts and hybrid candidates before anything gets planned or executed
- "Would this break if the LLM interpreted it differently each time?" is the canonical test for code vs prompt

</specifics>

<deferred>
## Deferred Ideas

- Namespace strategy for custom concepts (/gsd: vs /pe: vs new namespace) — decision deferred until after pruning reveals actual surface area
- Hybridization implementation work — flagged during cleanup, scoped and executed separately after Q&A

</deferred>

---

*Phase: 07-cleanup*
*Context gathered: 2026-02-28*
