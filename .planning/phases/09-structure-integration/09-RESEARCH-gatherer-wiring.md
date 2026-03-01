# Phase 9 Research: Gatherer Wiring

**Researched:** 2026-03-01
**Domain:** Research pipeline wiring (INTG-01)
**Confidence:** HIGH -- all source files read directly, no external research needed

## Current State

### Where the 6 Gatherers Live

All 6 live in `agents/` at the project root:

| File | Agent Name | Dimension |
|------|-----------|-----------|
| `agents/gsd-research-domain.md` | gsd-research-domain | Domain truths, first principles, universal constraints |
| `agents/gsd-research-system.md` | gsd-research-system | Existing codebase: what works, what constrains, what to reuse |
| `agents/gsd-research-intent.md` | gsd-research-intent | User intent: actual goals, acceptance criteria, implicit reqs |
| `agents/gsd-research-tech.md` | gsd-research-tech | Tech constraints: limits, dependencies, compatibility, feasibility |
| `agents/gsd-research-edges.md` | gsd-research-edges | Edge cases: failure modes, boundary conditions, integration failures |
| `agents/gsd-research-prior-art.md` | gsd-research-prior-art | Prior art: ecosystem patterns, libraries, proven approaches |

**Status: ORPHANED.** Created in Phase 2 (agent framework), but never wired into any workflow. No command or workflow currently spawns them.

### The Research Synthesizer: DELETED

`agents/gsd-research-synthesizer.md` was **deleted in Phase 8 cleanup** (Plan 03, commit `99d9239`). Rationale at the time: its only callers were `new-project.md` and `new-milestone.md`, both deleted. The fact that it was the intended synthesizer for the 6 gatherers was not accounted for -- the synthesizer was orphaned because no workflow wired the full gather-synthesize research pipeline yet.

**This must be recreated.** The gather-synthesize workflow expects a synthesizer agent path.

### Stale References to Deleted Synthesizer

These files still reference `gsd-research-synthesizer`:
- `get-shit-done/bin/lib/core.cjs:24` -- model profile entry
- `get-shit-done/bin/lib/init.cjs:191,228` -- model resolution in `cmdInitProject` and `cmdInitNewMilestone`
- `get-shit-done/references/model-profiles.md:14` -- model profile table row
- `bin/install.js:24` -- install manifest entry
- `get-shit-done/workflows/gather-synthesize.md:14` -- example path in parameter docs

These are cleanup targets (some may fall to Phase 10 CLN-03/CLN-05 scope).

## Each Gatherer Profile

All 6 share an identical contract structure:

### Common Contract

**Frontmatter:**
```yaml
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
role_type: executor
reads: [core-context, capability-context, feature-context, framing-context]
writes: [research-output]
```

**Input contract:** Each gatherer expects:
1. Its own agent definition (read via `agent_path` in the Task prompt)
2. A `<subject>` block identifying what is being researched
3. A context payload assembled by the orchestrator (Layers 1-4 from gather-synthesize.md)
4. A `<task_context>` block with `dimension_name` and `output_path`

**Output contract:** Each writes a markdown file to `output_path` with:
- Dimension-specific sections (defined per agent)
- Inline citations for every claim
- 8-20 findings (varies by dimension)

**Current callers:** NONE. All 6 are orphaned.

### Per-Gatherer Specifics

| Gatherer | Output File Name | Key Sections | Primary Tools |
|----------|-----------------|--------------|---------------|
| domain | `domain-truth-findings.md` | First Principles, Universal Constraints, Validated Assumptions, Domain Risks | WebSearch, WebFetch (external knowledge) |
| system | `existing-system-findings.md` | Relevant Implementations, Constraints, Reuse Opportunities, Integration Points, Undocumented Assumptions | mgrep, Grep, Glob, Read (codebase-heavy) |
| intent | `user-intent-findings.md` | Primary Goal, Acceptance Criteria, Implicit Requirements, Scope Boundaries, Risk: Misalignment | Read (context-file interpretation) |
| tech | `tech-constraints-findings.md` | Hard Constraints, Dependency Capabilities, Compatibility Issues, Feasibility Assessment, Alternatives | mcp__context7__, Grep, Bash (dependency manifests) |
| edges | `edge-cases-findings.md` | Failure Modes (table), Boundary Conditions, Integration Failure Scenarios, Existing Error Handling, Known Issues | WebSearch, mgrep, Grep (test files, error handling) |
| prior-art | `prior-art-findings.md` | Approaches Identified (table), Recommended Starting Point, Anti-Patterns, Libraries/Tools, Canonical Patterns | WebSearch, WebFetch, mcp__context7__ |

## Current Research Flow

### Path 1: plan-phase.md (primary)

```
/gsd:plan-phase {X}
  |
  v
commands/gsd/plan-phase.md
  |
  v
get-shit-done/workflows/plan-phase.md
  |
  +-- Step 5: Handle Research
  |     |
  |     v
  |   Spawns gsd-phase-researcher (single agent)
  |   via Task() with subagent_type="general-purpose"
  |   Agent reads: agents/gsd-phase-researcher.md
  |   Input: CONTEXT.md, REQUIREMENTS.md, STATE.md, phase description
  |   Output: {phase_dir}/{padded_phase}-RESEARCH.md
  |
  +-- Step 8: Spawn gsd-planner (consumes RESEARCH.md)
```

**Key detail:** plan-phase.md spawns ONE researcher agent (gsd-phase-researcher) that does ALL research in a single context window. It does NOT use gather-synthesize. It does NOT spawn the 6 gatherers.

### Path 2: research-phase.md (standalone)

```
/gsd:research-phase {X}
  |
  v
commands/gsd/research-phase.md
  |
  v
get-shit-done/workflows/research-phase.md
  |
  +-- Step 4: Spawn gsd-phase-researcher (same single-agent pattern)
```

Same single-agent approach. Just standalone instead of integrated into plan-phase.

### Path 3: framing-pipeline.md (v2 pipeline)

```
framing-discovery.md (Q&A, produces BRIEF.md)
  |
  v
framing-pipeline.md
  |
  +-- Stage 1: Research
  |     |
  |     v
  |   @~/.claude/get-shit-done/workflows/research-phase.md  <-- DELEGATES to research-phase
  |   Passes: framing_context (BRIEF_PATH, LENS, direction, focus)
  |
  +-- Stage 2: Requirements (auto-generate from Brief)
  +-- Stage 3: Plan
  +-- Stage 4: Execute
  +-- Stage 5: Review
  +-- Stage 6: Reflect
```

**Critical finding:** framing-pipeline.md Stage 1 currently delegates to `research-phase.md`, which spawns `gsd-phase-researcher`. The 6 gatherers are never invoked. The framing context is passed but the single researcher doesn't have the same dimensional coverage.

### Path 4: init-project.md (existing project scan)

Uses gather-synthesize but with DIFFERENT gatherers (6 scan agents for codebase structure/stack/data/patterns/entry points/dependencies). Not the research gatherers.

### Path 5: review-phase.md

Uses gather-synthesize with 4 review gatherers + gsd-review-synthesizer. This is the working reference implementation of the gather-synthesize pattern for a non-research domain.

## Standalone Research Workflow Design

### What Needs to Exist

Based on the CONTEXT.md decisions, the new standalone research workflow must:

1. **Be a NEW workflow file** (not inline in framing-pipeline or plan-phase)
2. **Orchestrate all 6 gatherers** via the existing gather-synthesize.md pattern
3. **Use a research synthesizer agent** to consolidate 6 outputs into one RESEARCH.md
4. **Replace gsd-phase-researcher entirely** -- that agent becomes dead code
5. **Support multiple callers** with the same interface

### Required New/Modified Artifacts

| Artifact | Action | Purpose |
|----------|--------|---------|
| `get-shit-done/workflows/research-workflow.md` | CREATE | Standalone research orchestration -- assembles context, calls gather-synthesize with 6 research gatherers + synthesizer |
| `agents/gsd-research-synthesizer.md` | RECREATE | Synthesizer agent (was deleted in Phase 8). Consolidates 6 gatherer outputs using consensus/conflicts/gaps pattern |
| `agents/gsd-phase-researcher.md` | DELETE (or deprecate) | Replaced by 6 gatherers + synthesizer |
| `get-shit-done/workflows/research-phase.md` | REWRITE | Point at new research-workflow.md instead of spawning gsd-phase-researcher |
| `get-shit-done/workflows/plan-phase.md` | MODIFY (Step 5) | Replace gsd-phase-researcher spawn with call to research-workflow.md |
| `get-shit-done/workflows/framing-pipeline.md` | MODIFY (Stage 1) | Replace @research-phase.md with @research-workflow.md (or keep delegating through research-phase.md) |
| `commands/gsd/research-phase.md` | MODIFY | Update to use new workflow |

### Research Workflow Internal Flow

```
research-workflow.md
  |
  +-- 1. Accept inputs: subject, context paths, output_dir, framing_context (optional)
  |
  +-- 2. Assemble context (Layers 1-4 per gather-synthesize.md)
  |     - Layer 1: PROJECT.md, STATE.md, ROADMAP.md
  |     - Layer 2: CAPABILITY.md (if scoped)
  |     - Layer 3: FEATURE.md + REQUIREMENTS.md (if scoped)
  |     - Layer 4: framing questions (if inside a framing)
  |
  +-- 3. Define gatherers array:
  |     - 6 research agents with output paths in {output_dir}/research/
  |     - dimension names: Domain Truth, Existing System, User Intent, Tech Constraints, Edge Cases, Prior Art
  |
  +-- 4. Define synthesizer:
  |     - agent: agents/gsd-research-synthesizer.md
  |     - output: {output_dir}/RESEARCH.md
  |
  +-- 5. Invoke gather-synthesize.md with gatherers + synthesizer + context + subject
  |
  +-- 6. Return RESEARCH.md path + manifest to caller
```

### Synthesizer Output Format

The recreated synthesizer must produce a RESEARCH.md that the planner can consume. Based on the Phase 2 design (verified via verification docs), the 5 output sections are:

1. **Consensus** -- findings agreed across multiple gatherers
2. **Conflicts** -- disagreements between gatherers with resolution
3. **Gaps** -- missing information, unfilled dimensions, low-confidence findings
4. **Constraints Discovered** -- hard limits the planner must respect
5. **Recommended Scope** -- what to build, what to skip, what to investigate further

**Important compatibility note:** The current planner (`gsd-planner.md`) expects RESEARCH.md sections from `gsd-phase-researcher` format: Standard Stack, Architecture Patterns, Don't Hand-Roll, Common Pitfalls, Code Examples. The synthesizer's output format is different. Either:
- (a) The synthesizer adapts its output to match what the planner expects, OR
- (b) The planner is updated to consume the synthesizer's format

This is a design decision for the planner -- the CONTEXT.md says "6 gatherers REPLACE gsd-phase-researcher entirely" which implies the downstream consumers (planner) must adapt.

## Integration Points

### 1. framing-pipeline.md Stage 1 --> research-workflow.md

**Current:** `@~/.claude/get-shit-done/workflows/research-phase.md`
**New:** `@~/.claude/get-shit-done/workflows/research-workflow.md` (or research-phase.md updated to delegate)

Framing-pipeline passes framing_context (BRIEF_PATH, LENS, direction, focus). The research workflow must accept this and inject it as Layer 4 context for gatherers.

### 2. plan-phase.md Step 5 --> research-workflow.md

**Current:** Spawns `gsd-phase-researcher` directly via Task()
**New:** Invokes research-workflow.md (which uses gather-synthesize)

The plan-phase workflow currently handles research inline. It would need to delegate to the research workflow instead.

### 3. research-phase.md command --> research-workflow.md

**Current:** Spawns `gsd-phase-researcher` directly
**New:** Delegates to research-workflow.md

### 4. Multiple caller support (per CONTEXT.md decision)

The separation enables these callers:
- framing-pipeline (after discovery)
- plan-phase (standalone planning)
- research-phase (standalone research)
- Potentially: init-project existing-project mode (currently uses different gatherers)

All callers provide: subject, context paths, output directory. Framing callers additionally provide framing_context.

### 5. discuss-capability / discuss-feature --> research handoff

discuss-capability and discuss-feature are thinking partner workflows that produce enriched capability/feature files. They do NOT invoke research -- they feed INTO research by populating the context that research agents read.

```
discuss-capability --> enriches CAPABILITY.md (Layer 2 context)
discuss-feature --> enriches FEATURE.md (Layer 3 context)
  |
  v
framing commands (/debug, /new, /enhance, /refactor)
  |
  v
framing-discovery.md --> produces BRIEF.md
  |
  v
framing-pipeline.md
  |
  v
Stage 1: research-workflow.md (reads enriched context from discuss steps)
```

The handoff is implicit through shared artifacts, not explicit invocation.

### 6. Model profile wiring

The deleted synthesizer still has entries in:
- `get-shit-done/bin/lib/core.cjs` -- model profile map
- `get-shit-done/references/model-profiles.md` -- model profile table
- `bin/install.js` -- install manifest

When the synthesizer is recreated, these entries are already correct (they just point to a file that doesn't exist yet). The gatherers already have no model profile entries -- they run as `subagent_type="general-purpose"` per gather-synthesize.md pattern (gatherers use Sonnet/executor model, synthesizer uses inherit/Opus/judge model).

## Open Questions

### 1. Planner Format Compatibility

**Issue:** gsd-planner.md and the plan-phase workflow expect RESEARCH.md with sections like "Standard Stack", "Architecture Patterns", "Don't Hand-Roll", "Common Pitfalls". The synthesizer produces "Consensus", "Conflicts", "Gaps", "Constraints", "Recommended Scope".

**Options:**
- (a) Synthesizer outputs in planner-compatible format (maps gatherer findings into planner-expected sections)
- (b) Planner updated to consume synthesizer format
- (c) Synthesizer is a passthrough -- planner reads individual gatherer outputs directly

**Recommendation:** Option (a). The synthesizer should produce output shaped for the planner's consumption. The section names from gsd-phase-researcher were designed for planner consumption -- the synthesizer should consolidate gatherer findings INTO those sections. The 5-section format (Consensus/Conflicts/Gaps/Constraints/Recommended Scope) from Phase 2 design was pre-planner; now that the planner exists, the synthesizer should adapt.

### 2. research-phase.md vs research-workflow.md Naming

**Issue:** Should the existing `research-phase.md` workflow be rewritten in-place, or should a new `research-workflow.md` be created with `research-phase.md` becoming a thin wrapper?

**Recommendation:** Create `research-workflow.md` as the new standalone workflow. Rewrite `research-phase.md` to be a thin wrapper that delegates to it. This preserves backward compatibility for callers and separates "what to research" (callers) from "how to research" (workflow), matching the CONTEXT.md separation-of-concerns decision.

### 3. Phase vs Capability/Feature Scoping

**Issue:** The current research pipeline is phase-scoped (research-PHASE.md, plan-PHASE.md). The v2 model is capability/feature-scoped. The research workflow needs to work for both during the transition.

**Recommendation:** The research workflow accepts generic inputs (subject, context paths, output directory) and is scope-agnostic. The caller determines the scope. This is already how gather-synthesize.md works.

### 4. Deleted Synthesizer -- Recreate from Scratch or Restore?

**Issue:** The synthesizer was deleted from disk but the Phase 2 design docs, verification docs, and Phase 4 comparison analysis all document what it contained.

**Recommendation:** Recreate from the Phase 2 specification. The design is well-documented in `.planning/phases/02-agent-framework/` artifacts. Key specs:
- `role_type: judge`
- 5 output sections with locked headings
- Quality gate: gatherer output < 50 words = failed; abort if > 3/6 fail
- Manifest-driven: reads success/failed status per gatherer
- ~500-600 words

But update the output format per Open Question 1 above.

### 5. init.cjs Stale Model Refs

`get-shit-done/bin/lib/init.cjs` resolves models for `gsd-project-researcher`, `gsd-research-synthesizer`, and `gsd-roadmapper` in the `cmdInitProject` and `cmdInitNewMilestone` functions. All three agents are deleted. These functions may be dead code (their callers were deleted in Phase 8). Confirm during implementation and either update or remove.

---

*Research for Phase 9 INTG-01 gatherer wiring*
*Completed: 2026-03-01*
