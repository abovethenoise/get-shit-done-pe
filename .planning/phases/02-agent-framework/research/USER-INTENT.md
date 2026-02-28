# User Intent: Phase 2 Requirements Analysis

**Dimension:** RSRCH-02 — Bridges truth to goals
**Analyzed:** 2026-02-28
**Source documents:** 02-CONTEXT.md, REQUIREMENTS.md, STATE.md, ROADMAP.md
**Confidence:** HIGH (all decisions locked in CONTEXT.md with explicit rationale; plans already drafted with concrete implementation detail)

---

## Locked Decisions → Deliverables

Each locked decision from 02-CONTEXT.md translates to specific files, schemas, and code.

### Decision: "Clean break from v1 — new definitions from scratch"

**What it means:**
- No attempt to migrate or wrap v1 agents
- v1 agents (`gsd-planner.md`, `gsd-executor.md`, etc.) stay frozen during Phase 2 (bootstrap trap constraint from STATE.md)
- v2 agents get a new YAML frontmatter schema that v1 agents do not have

**Concrete deliverables:**
- 7 new agent `.md` files in `agents/` (6 gatherers + 1 synthesizer)
- These files introduce the v2 schema; v1 files are untouched until Phase 7 cleanup

---

### Decision: "Agent definitions are goal-driven with artifact awareness"

**What it means — the boundary:**
- CONTEXT.md is deliberately ambiguous about where agent awareness ends and orchestrator control begins ("lean preference — research needed")
- The plans resolve this: agents declare `reads` and `writes` in frontmatter (artifact awareness), but the orchestrator decides WHICH artifacts to pass at spawn time
- Agent knows the TYPES it expects; orchestrator resolves the PATHS

**Concrete deliverables:**
- YAML frontmatter on every agent with `reads: [list of artifact types]` and `writes: [list of artifact types]`
- Body of each agent definition does NOT contain "read STATE.md" type instructions (no context-gathering logic inside agent)

**Files created:**
```
agents/gsd-research-domain.md    — reads: [core-context, capability-context, feature-context, framing-context]
agents/gsd-research-system.md    — reads: [core-context, capability-context, feature-context, framing-context]
agents/gsd-research-intent.md    — reads: [core-context, capability-context, feature-context, framing-context]
agents/gsd-research-tech.md      — reads: [core-context, capability-context, feature-context, framing-context]
agents/gsd-research-edges.md     — reads: [core-context, capability-context, feature-context, framing-context]
agents/gsd-research-prior-art.md — reads: [core-context, capability-context, feature-context, framing-context]
agents/gsd-research-synthesizer.md — reads: [research-outputs, gatherer-manifest]
```
All have `writes: [research-output]` (gatherers) or `writes: [research-summary]` (synthesizer).

---

### Decision: "Layered context: core (project + capability) always present"

**What it means:**
- Context is NOT injected inside agent definitions — it is assembled by the workflow at spawn time
- 5 layers, each additive:
  ```
  Layer 0: Agent definition file (always)
  Layer 1: Core — PROJECT.md, STATE.md, ROADMAP.md (always)
  Layer 2: Capability — CAPABILITY.md (when capability-scoped)
  Layer 3: Feature — FEATURE.md + requirements (when feature-scoped)
  Layer 4: Framing — framings/{framing}/{role}-questions.md (when inside a workflow)
  ```
- The orchestrator CONSTRUCTS the prompt by reading the relevant layer files and injecting them as XML blocks (`<core_context>`, `<capability_context>`, etc.)
- Agents don't go fetch context — they receive it

**Concrete deliverables:**
- `get-shit-done/workflows/gather-synthesize.md` — documents the context assembly step as part of the orchestration pattern
- `get-shit-done/framings/{debug,new,enhance,refactor}/.gitkeep` — framing directory skeleton (content in Phase 6)
- Convention established: `get-shit-done/framings/{framing}/{role}-questions.md` is Layer 4 content location

---

### Decision: "6-dimension gather→synthesize"

**What it means — the 6 agents and their scopes:**

| Agent File | Dimension | Research Question |
|------------|-----------|-------------------|
| `gsd-research-domain.md` | Domain Truth | What are the fundamental truths and first principles of this problem space? |
| `gsd-research-system.md` | Existing System | What exists in the codebase that is relevant — works, constrains, can be reused? |
| `gsd-research-intent.md` | User Intent | What does the user actually want and what acceptance criteria matter most? |
| `gsd-research-tech.md` | Tech Constraints | What are the technical limits, dependencies, compatibility issues? |
| `gsd-research-edges.md` | Edge Cases | What can go wrong, what are the boundary conditions and failure modes? |
| `gsd-research-prior-art.md` | Prior Art | How have others solved this? What ecosystem patterns and libraries exist? |

**What the synthesizer produces — 5 mandatory output sections:**

| Section | Annotation rules |
|---------|-----------------|
| Consensus | No annotations — findings all agents agree on |
| Conflicts | P1 (blocking), P2 (resolve during build), P3 (defer) priority ranking |
| Gaps | Confidence × impact matrix: spike / risk-accept / defer / ignore |
| Constraints Discovered | No annotations |
| Recommended Scope | Actionable — planner derives tasks from this directly |

**Annotation test (direct quote from CONTEXT.md):** "if the annotation doesn't alter what the next agent does, it's decoration." Synthesizer applies this to every annotation decision.

---

### Decision: "Executor/Judge model allocation"

**What it means in code:**
- Every v2 agent frontmatter declares `role_type: executor | judge`
- A new function `resolveModelFromRole(cwd, agentPath)` in `core.cjs` reads the agent file, extracts `role_type`, and maps it to a model
- Mapping is hardcoded: executor → sonnet, judge → inherit (opus)
- v1 agents without `role_type` fall through to existing `resolveModelInternal()` — zero v1 breakage

**Concrete deliverables:**
```javascript
// get-shit-done/bin/lib/core.cjs additions:
const ROLE_MODEL_MAP = {
  executor: 'sonnet',
  judge: 'inherit',
};

function resolveModelFromRole(cwd, agentPath) { ... }
// exports: ROLE_MODEL_MAP, resolveModelFromRole
```

- `get-shit-done/references/model-profiles.md` updated with v2 section documenting both systems

**Model assignments for Phase 2 agents:**
- 6 gatherers → `role_type: executor` → Sonnet
- 1 synthesizer → `role_type: judge` → Opus

---

### Decision: "Positive framing scope constraints"

**What it means concretely:**
- Every agent body defines scope using "You investigate X" / "You are the X researcher" / "Your goal is Y" structure
- No "do not", "never", "don't" lists in agent body
- Scope hallucination is prevented by SPECIFICITY, not prohibition — the goal statement is narrow enough that generic output is out of scope by definition
- Mandatory citation requirement in every agent: "Every claim must cite its source: file path, code snippet, URL, or artifact reference. Unsourced claims are treated as unverified."

**Verification test:** `grep -c "do not\|never\|don't" agents/gsd-research-*.md` should return 0 for all files.

---

## Requirement → Implementation Map

| Req ID | What User Wants | Concrete Implementation |
|--------|----------------|------------------------|
| AGNT-01 | Goal-driven with artifact awareness | `reads:` and `writes:` fields in YAML frontmatter of every agent def. Body states goal in one sentence. |
| AGNT-02 | Layered context injection at spawn time, agents stay simple | Workflow assembles context into XML blocks and passes to agent at spawn. Agents contain zero context-fetching logic. |
| AGNT-03 | Framing changes questions, not the agent definition | Framing-specific content lives in `framings/{framing}/{role}-questions.md` (Layer 4), injected by workflow. Agent file is unchanged across framings. |
| AGNT-04 | Scope constraints prevent hallucination | Positive framing in agent body (specific goal statement) + mandatory citation requirement. No prohibition lists. |
| RSRCH-01 | First-principles research | `gsd-research-domain.md` — owns the "fundamental truths and constraints" question exclusively. Primary tools: WebSearch + WebFetch. |
| RSRCH-02 | Bridges truth to goals (this agent) | `gsd-research-intent.md` — owns "what does the user actually want?" question. Primary tools: Read (context files). |
| RSRCH-03 | Parallelized gather→synthesize | `get-shit-done/workflows/gather-synthesize.md` documents the orchestration: all gatherers spawn in parallel via Task tool, synthesizer runs after. |
| RSRCH-04 | mgrep for codebase search | All 6 gatherers declare `tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*` in frontmatter. Existing System and Edge Cases agents emphasize Grep/Glob in tool guidance. |
| RSRCH-05 | Web search for domain knowledge | Same tool list on all gatherers. Domain Truth and Prior Art agents emphasize WebSearch/WebFetch. |
| RSRCH-06 | Context7 for library docs | Same tool list. Tech Constraints and Prior Art agents emphasize `mcp__context7__*`. |

---

## Implicit Priorities

Reading across CONTEXT.md, ROADMAP.md, and the existing plan files, these priorities are embedded in the user's framing:

**1. The pattern matters more than the content.**
CONTEXT.md repeatedly frames Phase 2 as "establishing the pattern ALL future agents follow." The 7 research agents are the vehicle — the pattern is the product. This means: if a research agent definition is off-pattern, that's a Phase 2 failure even if the content is good.

**2. No new complexity without payoff.**
The annotation test ("if the annotation doesn't alter what the next agent does, it's decoration") is a DRY/KISS principle applied to agent design. Every structural element in the agent defs must change downstream behavior. Applied to deliverables: don't add sections to agent definitions that the synthesizer or orchestrator doesn't actually use.

**3. Backward compatibility is a constraint, not a goal.**
"Clean break from v1" is the goal; backward compatibility (bootstrap trap, v1 fallback in `resolveModelFromRole`) is a constraint imposed by the reality that v2 is built while running on v1. Phase 7 removes the compatibility shims. The user is not attached to v1 patterns — they just can't break things mid-build.

**4. Gather-synthesize is load-bearing infrastructure.**
The CONTEXT.md statement "review (Phase 4) and potentially planning will use the same pattern" signals this is not a one-off — it's a framework primitive. The gather-synthesize workflow must be parameterized enough that Phase 4 can reuse it with 4 different agent paths without modification.

**5. Token budget is a real constraint.**
"~1500 tokens per definition" is specific. The user made this a named constraint in CONTEXT.md. This rules out long execution flow sections, step-by-step instructions, or context-gathering logic inside agent bodies — those must live elsewhere (workflow files, orchestrator logic).

---

## Success Criteria Assertions

From ROADMAP.md Phase 2 success criteria, translated to testable statements:

**Criterion 1:** "Every agent definition specifies its goal, the artifacts it reads, and the artifacts it writes — no ambient knowledge assumptions"

- TESTABLE: `grep "reads:" agents/gsd-research-*.md` returns a reads list in every file
- TESTABLE: `grep "writes:" agents/gsd-research-*.md` returns a writes list in every file
- TESTABLE: No agent body contains instructions like "read STATE.md" or "check .planning/"
- TESTABLE: Every agent body contains exactly one goal statement

**Criterion 2:** "Agents receive core context (project + capability) automatically, with framing-specific context layered on top without modifying the agent definition itself"

- TESTABLE: `gather-synthesize.md` documents 5-layer context assembly
- TESTABLE: Agent files do not contain PROJECT.md or STATE.md path references in their body
- TESTABLE: Framing directories exist and are separate from agent definition files
- TESTABLE: Same agent file can serve multiple framings (no framing-specific content inside agent)

**Criterion 3:** "Agent prompts include explicit scope constraints that prevent scope hallucination and generic output"

- TESTABLE: Every agent body contains a citation requirement statement
- TESTABLE: `grep -c "do not\|never\|don't" agents/gsd-research-*.md` returns 0 across all files
- TESTABLE: Each agent has a specific, non-overlapping goal statement (6 distinct questions, not "research things")
- TESTABLE: Agent goal statements reference a concrete question (not a capability category)

**Criterion 4:** "Research agents can be spawned in parallel (gather pattern) with a synthesizer that consolidates findings into a single summary"

- TESTABLE: `gather-synthesize.md` exists and describes parallel spawning
- TESTABLE: Workflow documents retry-once failure policy
- TESTABLE: Workflow documents manifest tracking (success/failed/partial per agent)
- TESTABLE: Synthesizer output format has exactly 5 sections: consensus, conflicts, gaps, constraints discovered, recommended scope

**Criterion 5:** "Research agents use mgrep for codebase search and web search tools for domain knowledge"

- TESTABLE: All 6 gatherer frontmatters include `Grep, Glob` in tools list
- TESTABLE: All 6 gatherer frontmatters include `WebSearch, WebFetch` in tools list
- TESTABLE: All 6 gatherer frontmatters include `mcp__context7__*` in tools list
- TESTABLE: Each gatherer body contains tool guidance specifying which tools are primary for that dimension

---

## Scope Boundaries

### In Scope (Phase 2)

| Item | Evidence |
|------|----------|
| 6 gatherer agent definitions | CONTEXT.md, 02-01-PLAN.md explicit task list |
| 1 research synthesizer agent definition (replaces v1) | 02-01-PLAN.md Task 2 |
| `gather-synthesize.md` workflow | 02-02-PLAN.md Task 1 |
| Framing directory skeleton (4 dirs + .gitkeep) | 02-02-PLAN.md Task 2 |
| `ROLE_MODEL_MAP` + `resolveModelFromRole()` in core.cjs | 02-03-PLAN.md Task 1 |
| `model-profiles.md` updated documentation | 02-03-PLAN.md Task 2 |

### Explicitly Out of Scope (Phase 2)

| Item | Deferred To | Evidence |
|------|-------------|----------|
| Planner agent definition | Phase 3 | CONTEXT.md `<deferred>` section |
| Reviewer agent definitions (4x) | Phase 4 | CONTEXT.md `<deferred>` |
| Documentation agent definition | Phase 5 | CONTEXT.md `<deferred>` |
| Framing question set content (debug/new/enhance/refactor) | Phase 6 | 02-02-PLAN.md: ".gitkeep only, no content files" |
| Workflow commands that USE the agents | Phase 6 | ROADMAP.md Phase 6 scope |
| REQ ID traceability enforcement | Phase 3 | REQUIREMENTS.md traceability table |
| v1 code removal/cleanup | Phase 7 | REQUIREMENTS.md FOUND-07 |

### Boundary Ambiguity: Framing-specific question sets for research

CONTEXT.md notes that the location of framing-specific question sets is "deferred to research on Anthropic patterns and existing GSD patterns." The plans resolve this by:
1. Creating the directory structure now (Phase 2)
2. Leaving content for Phase 6

The convention `framings/{framing}/{role}-questions.md` is established in 02-02-PLAN.md. This is the authoritative resolution — no further ambiguity.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| What files get created | HIGH | 02-01, 02-02, 02-03 PLAN.md files have explicit file lists |
| Agent definition schema | HIGH | Frontmatter schema shown verbatim in 02-01-PLAN.md `<interfaces>` block |
| Context layering design | HIGH | 5 layers documented in 02-02-PLAN.md `<interfaces>` block |
| Model resolution code | HIGH | `resolveModelFromRole` pseudocode provided in 02-03-PLAN.md |
| Token budget constraint | HIGH | Stated explicitly in CONTEXT.md, reaffirmed in 02-01-PLAN.md task action |
| Framing question set content | NONE | Explicitly deferred to Phase 6 — not a gap, intentionally empty |
| v1 backward compatibility approach | HIGH | resolveModelFromRole fallback described in 02-03-PLAN.md |
| Synthesizer output contract | HIGH | 5 sections named and annotated in CONTEXT.md and 02-01-PLAN.md |

**No unresolved ambiguities in Phase 2 scope.** Every decision in CONTEXT.md has a corresponding implementation detail in the three plan files. The plans were written with enough specificity that the executor agent can operate autonomously (`autonomous: true` in all three plans).
