---
phase: 02-agent-framework
plan: "01"
subsystem: agents
tags: [claude-agent-sdk, research-agents, v2-schema, goal-driven, executor-judge]

requires: []
provides:
  - v2 agent definition schema with role_type/reads/writes frontmatter
  - 6 research gatherer agent definitions (domain, system, intent, tech, edges, prior-art)
  - 1 research synthesizer agent (judge role, 5-section output contract)
  - Established pattern for all future agent definitions
affects: [03-planning-workflow, 04-review-workflow, 05-docs-workflow, gather-synthesize-workflow]

tech-stack:
  added: []
  patterns:
    - "v2 agent schema: YAML frontmatter (name, description, tools, color, role_type, reads, writes) + markdown body"
    - "Executor/Judge model allocation: executor = sonnet, judge = inherit (Opus from parent session)"
    - "Positive scope framing: define what agent does via role+goal+success criteria, zero negative lists"
    - "Mandatory citations: file path, code snippet, URL, artifact, or [First principles: reasoning chain]"
    - "Gatherer output format: dimension-specific sections, each finding has inline citation"
    - "Synthesizer 5-section contract: Consensus / Conflicts / Gaps / Constraints Discovered / Recommended Scope"

key-files:
  created:
    - agents/gsd-research-domain.md
    - agents/gsd-research-system.md
    - agents/gsd-research-intent.md
    - agents/gsd-research-tech.md
    - agents/gsd-research-edges.md
    - agents/gsd-research-prior-art.md
    - agents/gsd-research-synthesizer.md
  modified: []

key-decisions:
  - "v2 agent body is identity document only: role, goal, success criteria, scope, tool guidance, output format, citations — no execution flow, no context-gathering logic"
  - "Citation carve-out: first-principles reasoning is a valid citation format [First principles: reasoning chain]"
  - "Synthesizer section headings are locked — downstream agents reference by exact name"
  - "Synthesizer quality gate: file missing or < 50 words = gatherer failed; abort if > 3 of 6 fail"
  - "All 6 gatherers use identical frontmatter reads list — orchestrator decides what context to inject"

patterns-established:
  - "Agent file = identity document: who you are, what you answer, how you know you succeeded"
  - "Tool guidance section: each dimension specifies which tools are primary vs secondary"
  - "Output format section: each agent specifies exact markdown structure for its findings"
  - "Positive framing verification: grep -c 'do not|never|don't' should return 0 for any v2 agent"

requirements-completed: [AGNT-01, AGNT-04, RSRCH-01, RSRCH-02, RSRCH-03, RSRCH-04, RSRCH-05, RSRCH-06]

duration: 3min
completed: "2026-02-28"
---

# Phase 2 Plan 01: Research Agent Definitions Summary

**7 goal-driven v2 agent definitions: 6 parallel gatherers (Sonnet/executor) + 1 judicial synthesizer (Opus/judge) establishing the agent pattern for all future GSD phases**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T16:14:00Z
- **Completed:** 2026-02-28T16:17:22Z
- **Tasks:** 2
- **Files modified:** 7 (6 created + 1 replaced)

## Accomplishments

- Created 6 research gatherer agent definitions, each with unique non-overlapping research dimension, v2 frontmatter schema, positive scope framing, dimension-specific tool guidance, and mandatory citation requirement
- Replaced v1 synthesizer (196 lines of step-by-step execution logic) with v2 definition (51 lines of role identity) — clean break per CONTEXT.md
- Established the agent definition pattern: identity document only, no execution flow, no context-gathering logic

## Task Commits

1. **Task 1: Create 6 research gatherer agent definitions** - `5afca69` (feat)
2. **Task 2: Replace v1 synthesizer with v2 research synthesizer** - `bf86114` (feat)

## Files Created/Modified

- `agents/gsd-research-domain.md` - Domain truth researcher: first principles, universal constraints, validated assumptions
- `agents/gsd-research-system.md` - Existing system researcher: implementations, constraints, reuse opportunities, integration points
- `agents/gsd-research-intent.md` - User intent researcher: job-to-be-done, acceptance criteria, implicit requirements, scope boundaries
- `agents/gsd-research-tech.md` - Tech constraints researcher: hard constraints, dependency capabilities, feasibility table
- `agents/gsd-research-edges.md` - Edge cases researcher: failure mode table (likelihood + severity + mitigation), boundary conditions
- `agents/gsd-research-prior-art.md` - Prior art researcher: approach comparison table, recommended starting point, anti-patterns
- `agents/gsd-research-synthesizer.md` - Research synthesizer (v2 replacement): 5-section output contract with locked headings, quality gate, P1/P2/P3 conflict ranking, confidence x impact gap matrix

## Decisions Made

- v2 agent body is an identity document only — role, goal, success criteria, scope, tool guidance, output format, citation requirement. Zero execution flow, zero context-gathering logic.
- Citation carve-out for first-principles reasoning: `[First principles: reasoning chain]` is a valid citation format (resolves P1-A conflict from RESEARCH.md)
- Synthesizer section headings are locked exact strings — downstream agents reference them by name (resolves P1-B from RESEARCH.md)
- Quality gate logic lives in the synthesizer definition: gatherer output missing or < 50 words = failed; abort if > 3 of 6 gatherers fail

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- v2 agent pattern established — Phases 3-5 agents follow the same schema
- Research gatherers ready for use once gather-synthesize workflow exists (Plan 02-02 or 02-03)
- Synthesizer 5-section output contract is the interface the Phase 3 planner will consume

## Self-Check: PASSED

All 8 files verified present. Both task commits confirmed in git log.

---
*Phase: 02-agent-framework*
*Completed: 2026-02-28*
