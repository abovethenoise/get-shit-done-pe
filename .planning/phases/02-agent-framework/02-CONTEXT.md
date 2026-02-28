# Phase 2: Agent Framework - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the agent framework pattern (goal-driven definitions with layered context injection) and implement research agents using that pattern. The framework establishes how ALL agents are structured; only research agents are fully built in this phase. Planner, reviewer, executor, and documenter agents come in their respective phases (3-5) using the pattern established here.

</domain>

<decisions>
## Implementation Decisions

### Agent definition format
- Clean break from v1 — new definitions from scratch, no backward compatibility
- Definition structure informed by official Anthropic docs and Claude Agent SDK best practices (key research point)
- Target ~1500 tokens per definition — "goldilocks" sizing, no bloat
- Format (markdown vs YAML vs other) is Claude's discretion, grounded in Anthropic guidance

### Agent philosophy: goal-driven, not artifact-driven
- Agents are goal-only: they know their role, goal, and what success looks like
- Orchestrator decides what context/artifacts to pass — agents don't self-select their inputs
- This is a lean preference — research needed on where the boundary between agent awareness and orchestrator control should sit

### Context layering
- Workflow injects context at spawn time — agents stay simple, orchestrator owns context decisions
- Core context hierarchy: project goals (always) → capability details (when within a capability) → feature details (when on a specific feature)
- Each level adds context as you zoom in — no agent gets more context than its scope requires
- Framing-specific question sets: location (with agent vs separate directory) deferred to research on Anthropic patterns and existing GSD patterns

### Research orchestration — 6 dimensions
- **Gather phase** (all 6 always run, no shortcuts):
  1. Domain Truth — owns first-principles thinking (RSRCH-01)
  2. Existing System — codebase analysis
  3. User Intent — requirement/context interpretation
  4. Tech Constraints — technical feasibility/limits
  5. Edge Cases — boundary conditions and failure modes
  6. Prior Art — ecosystem patterns and prior solutions
- All research agents have access to all tools (mgrep, web search, Context7)
- **Synthesize phase** outputs 5 sections:
  1. Consensus — no annotations needed
  2. Conflicts — P1-P3 priority ranking (blocking → resolve during build)
  3. Gaps — confidence x impact matrix (spike / risk-accept / defer / ignore)
  4. Constraints Discovered — no annotations needed
  5. Recommended Scope — no annotations needed
- Annotation test: "if the annotation doesn't alter what the next agent does, it's decoration"

### Gather-synthesize as generic framework primitive
- The gather→synthesize pattern is a reusable framework primitive, not research-specific
- Review (Phase 4) and potentially planning will use the same pattern
- Failure handling: retry failed agent once, then proceed with partial results; synthesizer notes the gap

### Scope constraints
- Agents constrained through positive framing: role, goal, success criteria — not negative "don't do X" lists
- Mandatory citations: every claim must reference specific file paths, code snippets, URLs, or artifacts
- No quality gate between agents and synthesizer — synthesizer handles quality filtering
- Framework keeps pipeline simple; complexity only where it changes downstream behavior

### Claude's Discretion
- Agent definition file format (markdown vs YAML vs other)
- Whether agent definitions are standalone or composable (research Anthropic patterns)
- Framing-specific question set organization
- Internal structure of the gather→synthesize primitive

</decisions>

<specifics>
## Specific Ideas

- Research architecture diagram provided by user:
  ```
  Capability / Feature Under Research
                          │
      ┌───────┬───────────┼──────────┬───────────┬───────────┐
      v       v           v          v           v           v
   DOMAIN   EXISTING    USER       TECH        EDGE        PRIOR
   TRUTH    SYSTEM      INTENT     CONSTRAINTS CASES       ART

  Agent Results ──> Synthesis
                      │
           ┌──────┬──-+───┬──────────┬───────────────┐
           v      v        v          v               v
       CONSENSUS  CONFLICTS  GAPS   CONSTRAINTS   RECOMMENDED
                                    DISCOVERED    SCOPE
  ```
- Agent SDK and official Anthropic documentation should be primary references for definition patterns
- Existing GSD v1 patterns should inform (but not constrain) v2 design

</specifics>

<deferred>
## Deferred Ideas

- Implementation/executor agent definitions — Phase 3+ (each phase defines its own agents using the framework)
- Planner agent specifics — Phase 3
- Reviewer agent specifics — Phase 4
- Documentation agent specifics — Phase 5

</deferred>

---

*Phase: 02-agent-framework*
*Context gathered: 2026-02-28*
