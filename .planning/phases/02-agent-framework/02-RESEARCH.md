# Phase 2: Agent Framework — Synthesized Research

**Synthesized:** 2026-02-28
**Sources:** DOMAIN-TRUTH, EXISTING-SYSTEM, USER-INTENT, TECH-CONSTRAINTS, EDGE-CASES, PRIOR-ART
**Confidence:** HIGH (all 6 dimensions covered, strong source agreement)

---

## 1. Consensus

All 6 researchers agree on the following. No caveats.

**Agent definition format: Claude Agent SDK YAML frontmatter + markdown body.**
The official Anthropic subagent format (`.md` files with YAML frontmatter in `.claude/agents/`) is the correct target. It is native to Claude Code, supports per-agent tool restriction, per-agent model selection, and version-controllable definitions. No framework dependency needed. CrewAI (24 parameters), LangGraph (graph nodes), and AutoGen (conversational) are all over-engineering for GSD's use case.

**Goal-driven > task-driven for LLM agents.**
Anthropic's own subagent examples use goal-framed prompts ("You are a senior code reviewer ensuring high standards"), not checklists. Goal framing lets agents adapt to findings; checklist framing breaks at first deviation. GSD agents should specify role + goal + success criteria, not step-by-step instructions.

**Positive framing > negative lists for scope constraints.**
Constitutional AI research confirms: "Do X" outperforms "Don't do Y" for constraining model behavior. Agent bodies should define what success looks like, not enumerate prohibitions. The verification test: `grep -c "do not\|never\|don't"` should return 0 for v2 agent definitions.

**Orchestrator owns context injection; agents receive, don't fetch.**
Both Anthropic's patterns and GSD's CONTEXT.md agree: the orchestrator assembles context at spawn time and passes it to agents. Agents contain no context-gathering logic (no "read STATE.md" instructions). Context is layered: core (always) -> capability (when scoped) -> feature (when specific) -> framing (when in workflow).

**Executor/Judge model split is empirically validated.**
Anthropic's own multi-agent research system uses Opus lead + Sonnet workers and measured 90.2% improvement over single-agent Opus. Token usage explains 80% of performance variance. Sonnet with focused context frequently outperforms Opus with noisy context. The mapping: Executor = `sonnet`, Judge = `inherit` (Opus via parent session).

**Parallel gather prevents anchoring bias; synthesis is judicial.**
Running 6 researchers in parallel forces independent analysis. The synthesizer then weighs competing evidence (judicial role), not just concatenating findings. PARALLELMUSE research confirms: aggregating independent reasoning reports outperforms serial information gathering.

**v1 agents are 3-9x over target size.**
v1 agents range 1,800-9,400 tokens vs the 1,500 token target. Inflation sources: embedded output templates, copy-pasted boilerplate (`<project_context>`, tool strategy), process documentation masquerading as role definition. v2 must externalize templates and shared content.

**Subagents cannot spawn subagents.**
Claude Agent SDK hard constraint. No nesting. Only the main `claude --agent` thread can spawn subagents. The gather-synthesize pattern is flat: orchestrator spawns 6 gatherers, waits, then spawns 1 synthesizer.

**`reads`/`writes` fields are declarative, not enforced.**
Agent frontmatter declares expected inputs/outputs as metadata. The orchestrator satisfies `reads` at spawn time. There is no runtime enforcement. This is documentation + validation, not access control. The orchestrator still owns the actual paths.

**File-based result collection is the only mechanism.**
Orchestrator does not receive agent output in its context. Agents write files to disk; orchestrator checks file existence. The synthesizer reads gatherer output files via the Read tool, not inline injection.

---

## 2. Conflicts

### P1 — Blocking (must resolve before planning)

**P1-A: Citation requirement vs first-principles reasoning.**
DOMAIN-TRUTH says mandatory citations force grounding in evidence. EDGE-CASES identifies that strict citation requirements can paralyze agents doing first-principles reasoning (no external source to cite). Resolution: allow `[First principles: reasoning chain]` as a valid citation format. The requirement is traceability, not external validation. Add this carve-out to all gatherer definitions.

**P1-B: Research-to-plan format contract.**
EDGE-CASES flags the synthesizer output format as the most important integration risk. The synthesizer defines the contract (5 sections); the Phase 3 planner must consume it. If the format drifts between phases, the pipeline degrades silently. Resolution: lock the synthesizer output template with exact section headings (`## Consensus`, `## Conflicts`, `## Gaps`, `## Constraints Discovered`, `## Recommended Scope`) in the synthesizer agent definition. Phase 3 planner references these headings explicitly.

**P1-C: Failure threshold for gather phase.**
EDGE-CASES recommends: if >= 3 of 6 gatherers fail, abort synthesis. CONTEXT.md says "retry once, then proceed with partial results" but does not address catastrophic failure. Resolution: implement a 50% threshold — if more than half of gatherers fail after retry, surface structured error instead of proceeding to synthesis. Express threshold as `> len(gatherers) / 2` to support reuse with different gatherer counts (Phase 4 uses 4 reviewers).

**P1-D: Gather-synthesize must be parameterized, not hardcoded to 6.**
EDGE-CASES and USER-INTENT both flag that the gather-synthesize pattern is a framework primitive reused in Phase 4 (4 reviewers). The workflow must accept a `gatherers[]` array and a `synthesizer` path, not hardcode 6 agents. Failure threshold must scale with gatherer count.

### P2 — Important (resolve during build)

**P2-A: Agent file location during development.**
TECH-CONSTRAINTS notes plans place agents at `agents/` (project root), but Claude Code resolves `subagent_type` from `.claude/agents/` or `~/.claude/agents/`. EXISTING-SYSTEM confirms v1 uses the "First, read {path}" injection pattern as a workaround. Resolution: use "First, read {absolute_path}" pattern consistently during Phase 2 development. Final deployment location is a Phase 7 concern.

**P2-B: `model: opus` is not a valid Task parameter.**
TECH-CONSTRAINTS confirms only `"sonnet"`, `"haiku"`, `"inherit"` are valid. `"opus"` may be blocked by org policies. PRIOR-ART shows some agent definitions use `model: opus` in frontmatter. Resolution: use `model: inherit` in judge agent frontmatter. Document that `inherit` means "parent session's model" and judge semantics require the parent to be running Opus.

**P2-C: Zero-content gatherer output passes existence check.**
EDGE-CASES: a gatherer that writes only headers and no findings passes the file-existence check. Resolution: define failure as file missing OR word count < 50. The gather-synthesize workflow checks both.

### P3 — Minor (note and move on)

**P3-A: `tools:` field enforcement is unconfirmed.** TECH-CONSTRAINTS could not confirm whether Claude Code enforces the `tools:` frontmatter allowlist at runtime. Treat it as documentation. Actual restriction happens through agent instructions.

**P3-B: Opus cost for Phase 4 reviewers.** EDGE-CASES notes 4 Opus calls during review is expensive. This is by design and is a Phase 4 concern. Do not pre-optimize.

---

## 3. Gaps

| Gap | Impact | Confidence | Classification | Action |
|-----|--------|------------|----------------|--------|
| Whether `inherit` always resolves to Opus | HIGH — judge on wrong model silently | MEDIUM | risk-accept | Document: judge semantics require Opus parent session. No code fix possible. |
| Whether 6 parallel Task calls work | MEDIUM — never tested beyond 4 | MEDIUM | risk-accept | Pattern is consistent; fall back to 3+3 batching if needed. |
| Context7 MCP availability | LOW — degradable | HIGH | ignore | Agents degrade to WebSearch if Context7 unavailable. |
| Token budget enforcement at runtime | LOW — guideline only | HIGH | ignore | Plan verification uses `wc -w`. No runtime check needed. |
| `tools:` field enforcement | LOW — treat as docs | LOW | ignore | No impact on correctness. |
| Framing question set content | NONE — intentionally deferred | HIGH | defer | Phase 6 scope. Phase 2 creates directory skeleton only. |
| Cross-capability framing | LOW — rare scenario | LOW | defer | Run separate gather-synthesize per capability. No framework change. |

---

## 4. Constraints Discovered

**Hard constraints (cannot change):**

1. **CommonJS only** in `get-shit-done/bin/lib/` — `.cjs` with `require()`. No ESM.
2. **Model values** — only `"sonnet"`, `"haiku"`, `"inherit"` valid in Task `model` parameter.
3. **FAILSAFE_SCHEMA** — `extractFrontmatter()` returns all values as strings. String comparison required for `role_type`.
4. **No subagent nesting** — subagents cannot spawn subagents. Gather-synthesize is flat.
5. **Backward compatibility** — v1 agents without `role_type` must continue working via `resolveModelInternal()` fallback.
6. **File-based results only** — orchestrator reads results from disk, not from agent return values.
7. **Agent definitions during dev use "First, read {path}" pattern** — `subagent_type` resolution requires `.claude/agents/` location.
8. **No quality gate between gatherers and synthesizer** — locked decision in CONTEXT.md.
9. **No step-by-step execution logic in agent bodies** — agents are goal definitions, not scripts.
10. **Context provided by orchestrator, not fetched by agent** — agents receive context at spawn.

**Soft constraints (workarounds exist):**

1. **~1500 token target** — synthesizer allowed ~2000. Flex to ~2000 max for any agent if justified.
2. **Agent file location** — project-root `agents/` during dev; "First, read" pattern makes location moot.
3. **Manifest format** — no v1 standard. Define as `{agent_name: "success" | "failed" | "partial"}` JSON.

---

## 5. Recommended Scope

Phase 2 delivers the agent framework pattern AND the first concrete agents using that pattern.

### Deliverables

**7 agent definition files:**

| File | Role | Dimension | role_type |
|------|------|-----------|-----------|
| `agents/gsd-research-domain.md` | Domain Truth researcher | RSRCH-01 | executor |
| `agents/gsd-research-system.md` | Existing System researcher | codebase analysis | executor |
| `agents/gsd-research-intent.md` | User Intent researcher | requirement interpretation | executor |
| `agents/gsd-research-tech.md` | Tech Constraints researcher | feasibility/limits | executor |
| `agents/gsd-research-edges.md` | Edge Cases researcher | failure modes | executor |
| `agents/gsd-research-prior-art.md` | Prior Art researcher | ecosystem patterns | executor |
| `agents/gsd-research-synthesizer.md` | Research synthesizer | judicial synthesis | judge |

Each gatherer: ~1500 tokens. Frontmatter schema:
```yaml
---
name: gsd-research-{dimension}
description: [routing signal for orchestrator]
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
color: blue
role_type: executor
reads: [core-context, capability-context, feature-context, framing-context]
writes: [research-output]
---
```

Body structure: role statement, goal (one sentence), scope (what this dimension covers), tool guidance (which tools are primary for this dimension), output format, citation requirement (with first-principles carve-out), success criteria.

Synthesizer: ~2000 tokens. `role_type: judge`. Receives 6 output file paths + manifest. Produces 5-section output with locked section headings.

**Gather-synthesize workflow:**
`get-shit-done/workflows/gather-synthesize.md` — parameterized pattern accepting `gatherers[]` array and `synthesizer` path. Implements:
- 5-layer context assembly (core always, capability/feature/framing conditional)
- Parallel spawn of all gatherers
- File existence + word count (>50) check per gatherer
- Retry-once for failures
- Manifest construction
- Synthesizer spawn with output paths + manifest
- Failure threshold: abort if > 50% of gatherers fail

**Framing directory skeleton:**
```
get-shit-done/framings/debug/.gitkeep
get-shit-done/framings/new/.gitkeep
get-shit-done/framings/enhance/.gitkeep
get-shit-done/framings/refactor/.gitkeep
```
Convention: `framings/{framing}/{role}-questions.md` (content in Phase 6).

**Model allocation code:**
```javascript
// core.cjs additions
const ROLE_MODEL_MAP = { executor: 'sonnet', judge: 'inherit' };
function resolveModelFromRole(cwd, agentPath) { ... }
// Falls back to resolveModelInternal() for v1 agents without role_type
```
Updated `model-profiles.md` documenting both v1 and v2 systems.

### What NOT to build

- Planner agent (Phase 3)
- Executor agent updates (Phase 3)
- Reviewer agents (Phase 4)
- Documentation agent (Phase 5)
- Framing question set content (Phase 6)
- Workflow commands that USE agents (Phase 6)
- v1 cleanup (Phase 7)

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Clean break from v1 -- new definitions from scratch
- Agent definitions are goal-driven with artifact awareness
- Layered context: core (project + capability) always present
- 6-dimension gather->synthesize (all 6 always run)
- Gather-synthesize as generic framework primitive (reusable in Phase 4)
- Failure handling: retry once, then partial results; synthesizer notes gap
- Executor/Judge model allocation: hardcoded, not configurable
- Positive framing scope constraints; mandatory citations
- No quality gate between gatherers and synthesizer
- ~1500 tokens per definition target

### Claude's Discretion
- Agent definition file format (resolved: Claude Agent SDK markdown + YAML frontmatter)
- Whether agent definitions are standalone or composable (resolved: standalone)
- Framing-specific question set organization (resolved: `framings/{framing}/{role}-questions.md`)
- Internal structure of the gather-synthesize primitive (resolved: parameterized workflow)

### Deferred Ideas
- Planner agent specifics -- Phase 3
- Reviewer agent specifics -- Phase 4
- Documentation agent specifics -- Phase 5

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AGNT-01 | Goal-driven definitions with artifact awareness | DOMAIN-TRUTH: goal framing > checklist framing for LLM agents. PRIOR-ART: Anthropic subagent examples use goal-framed prompts. EXISTING-SYSTEM: v1 agents lack artifact declarations. Implementation: `reads`/`writes` in frontmatter, goal statement in body. |
| AGNT-02 | Layered context injection, agents stay simple | DOMAIN-TRUTH: minimum context principle, context hierarchy. TECH-CONSTRAINTS: 5-layer assembly by orchestrator. PRIOR-ART: Anthropic's "fresh subagents with clean contexts" pattern. Implementation: gather-synthesize workflow assembles layers 1-4 at spawn. |
| AGNT-03 | Framing changes questions, not agent definition | USER-INTENT: Layer 4 = `framings/{framing}/{role}-questions.md`, injected by workflow. EDGE-CASES: framing files won't exist until Phase 6; workflow must guard and gracefully omit. Implementation: directory skeleton now, content Phase 6. |
| AGNT-04 | Scope constraints prevent hallucination | DOMAIN-TRUTH: positive framing > negative lists (Constitutional AI). PRIOR-ART: Anthropic's feature-by-feature scope constraint. EDGE-CASES: positive framing alone insufficient -- add output shape constraints per dimension. Implementation: specific goal + citation requirement + dimension-scoped output categories. |
| RSRCH-01 | First-principles research | DOMAIN-TRUTH: Domain Truth dimension owns first-principles thinking. EDGE-CASES: citation requirement needs first-principles carve-out. Implementation: `gsd-research-domain.md` with `[First principles: reasoning]` citation format. |
| RSRCH-02 | Bridge truth to goals | USER-INTENT: User Intent dimension bridges "what is true" to "what does the user want." Implementation: `gsd-research-intent.md` reads context files, interprets requirements, maps to acceptance criteria. |
| RSRCH-03 | Parallelized gather-synthesize | DOMAIN-TRUTH: parallel prevents anchoring bias. PRIOR-ART: scatter-gather is the canonical distributed pattern. TECH-CONSTRAINTS: 6 parallel Task calls viable (4 already proven). Implementation: `gather-synthesize.md` workflow with parameterized gatherer array. |
| RSRCH-04 | mgrep for codebase search | TECH-CONSTRAINTS: `mgrep` is a skill pattern, not a tool. Built-in Grep tool is the implementation. EXISTING-SYSTEM: skills live in `.agents/skills/`. Implementation: all gatherers include `Grep, Glob` in tools; Existing System and Edge Cases agents emphasize these. |
| RSRCH-05 | Web search for domain knowledge | TECH-CONSTRAINTS: WebSearch and WebFetch are built-in tools. Implementation: all gatherers include `WebSearch, WebFetch` in tools; Domain Truth and Prior Art agents emphasize these. |
| RSRCH-06 | Context7 for library docs | TECH-CONSTRAINTS: `mcp__context7__*` available via MCP server. EDGE-CASES: may be unavailable; agents degrade gracefully. Implementation: all gatherers include `mcp__context7__*` in tools; Tech Constraints and Prior Art agents emphasize these. |

---

*Synthesized: 2026-02-28*
*Phase: 02-agent-framework*
*All 6 research dimensions covered. No blocked gaps.*
