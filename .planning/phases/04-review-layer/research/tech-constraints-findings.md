## Tech Constraints Findings

**Researched:** 2026-02-28
**Dimension:** Technical limits, dependencies, compatibility issues, and feasibility boundaries for Phase 4: Review Layer
**Confidence:** HIGH (sourced from existing codebase, live workflow files, Phase 2/3 research, and observed runtime behavior)

---

### Hard Constraints

- **Subagents cannot spawn subagents** — Task calls are one level deep. The review synthesizer cannot spawn follow-up agents to spot-check findings. Spot-checking must happen within the synthesizer's own context using Read/Grep tools. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-phase.md` — all spawning done by orchestrator, never by spawned agents; `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/research/TECH-CONSTRAINTS.md` — Task tool is sole spawning mechanism]

- **File-based result collection only** — Orchestrator cannot receive agent output in its context. Reviewer agents must write trace reports to disk. Orchestrator verifies file existence, then passes paths to synthesizer. [Source: Phase 2 TECH-CONSTRAINTS.md — "Orchestrator does NOT receive the agent's full output in its context. It reads the agent's return message and checks files on disk."]

- **Model parameter values: only "sonnet", "haiku", "inherit"** — Cannot pass "opus" directly. Reviewer agents (role_type: judge) must use "inherit" to get Opus from the parent session. This requires the user to start their session on Opus. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 34-37 — `ROLE_MODEL_MAP`; `/Users/philliphall/get-shit-done-pe/get-shit-done/references/model-profiles.md` — explicit note on `inherit` vs `opus`]

- **AskUserQuestion header max 12 characters** — Per questioning.md: "Headers longer than 12 characters (hard limit — validation will reject them)". Finding presentation headers must be abbreviated. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/questioning.md` line 82]

- **No quality gate between gatherers and synthesizer** — Locked decision from Phase 2. Synthesizer is the sole quality filter. Applied equally to review: 4 reviewer outputs flow directly to review synthesizer without intermediate validation. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` — key_constraints section]

- **CommonJS only** — `get-shit-done/bin/lib/` uses `.cjs` with `require()`. Any CLI tooling for review (e.g., review report parsing, validation) must be CommonJS. [Source: Phase 2 TECH-CONSTRAINTS.md hard constraint #1]

- **Agent definitions are identity documents, not execution scripts** — No step-by-step flow in agent bodies. Reviewer agents declare role/goal/success/scope/citation format. The orchestrator workflow controls execution order. [Source: Phase 2 TECH-CONSTRAINTS.md — "No step-by-step execution logic in agent definitions"]

- **Context provided by orchestrator, not fetched by agent** — Agents receive context at spawn time. Reviewer agents should NOT contain "read FEATURE.md" instructions. The orchestrator assembles context and passes file paths in the prompt. [Source: AGNT-02 requirement; Phase 2 TECH-CONSTRAINTS.md hard constraint #10]

- **3-level verdict scale (met / not met / regression), NOT 4-level** — CONTEXT.md explicitly removed "partially met" as too subjective. REVW-02 in REQUIREMENTS.md still says "met / partially met / not met / regression" (4-level). The CONTEXT.md decision overrides this. The implementation must use the 3-level scale. [Source: `/Users/philliphall/get-shit-done-pe/.planning/phases/04-review-layer/04-CONTEXT.md` — "3-level: met / not met / regression (no 'partially met' — too subjective)"]

- **Reviewers do NOT assign severity** — Only verdicts and findings. Synthesizer assigns severity (blocker / major / minor) after seeing all 4 reports. [Source: 04-CONTEXT.md — "Reviewers do NOT assign severity"]

### Dependency Capabilities

- **Claude Agent SDK (Task tool)**: Supports parallel spawning of 4+ agents in a single response. Orchestrator blocks until all complete. Each agent gets fresh 200k context window. Confirmed from execute-phase.md (N plans per wave in parallel) and new-project.md (4 parallel researchers). 4 reviewers is well within observed patterns. — [Source: Phase 2 TECH-CONSTRAINTS.md parallel spawning section; `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-phase.md`]

- **Gather-synthesize workflow**: Reusable pattern already designed for review in Phase 2. Accepts `gatherers[]` array (agent_path, dimension_name, output_path) and `synthesizer` object. 4-layer context assembly (core, capability, feature, framing). The review use case is explicitly listed in the reuse_examples section. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` — reuse_examples lists "Review (Phase 4): Gatherers: Correctness, Completeness, Security, Performance"]

- **resolveModelFromRole()**: Reads `role_type` from agent frontmatter, maps executor->sonnet, judge->inherit. Already implemented in core.cjs (Phase 2 deliverable). All 4 reviewers and the synthesizer are judges (role_type: judge), so all get Opus via inherit. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 34-37]

- **js-yaml / frontmatter.cjs**: Available for parsing agent YAML frontmatter and any structured YAML in review reports. Uses FAILSAFE_SCHEMA (all values as strings). — [Source: Phase 2 TECH-CONSTRAINTS.md YAML section]

- **AskUserQuestion tool**: Available in the main orchestrator conversation (not inside Task subagents). Supports header (max 12 chars), question, and options array. Used throughout plan-phase.md and discuss-phase.md for one-at-a-time presentation. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan-phase.md` steps 4, 9.5, 9.9; `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/discuss-phase.md`]

### Compatibility Issues

- **REVW-02 requirement vs CONTEXT.md decision mismatch** — REQUIREMENTS.md REVW-02 says "met / partially met / not met / regression" (4 verdicts). CONTEXT.md decision says "3-level: met / not met / regression (no 'partially met')". CONTEXT.md is the authoritative source for implementation decisions. Implementation must use 3 verdicts. The requirement text should be updated to match. — [Source: REQUIREMENTS.md line 52 vs 04-CONTEXT.md line 17]

- **ROADMAP.md success criteria #2 vs CONTEXT.md** — ROADMAP.md Phase 4 success criteria says "per-requirement verdicts (met / partially met / not met / regression) and finding severity (blocker / major / minor)". Two mismatches: (a) "partially met" should be removed per CONTEXT.md, (b) severity is assigned by synthesizer, not reviewers. ROADMAP.md wording should be updated. — [Source: ROADMAP.md lines 80-82 vs 04-CONTEXT.md lines 17, 25-26]

- **Gather-synthesize reuse_examples lists different reviewer names** — The gather-synthesize.md reuse_examples section lists "Correctness, Completeness, Security, Performance" as the 4 review dimensions. CONTEXT.md defines "end-user, functional, technical, code quality" as the 4 reviewers. The gather-synthesize template was written before the CONTEXT.md discussion finalized the reviewer identities. The workflow invocation must use the CONTEXT.md names. — [Source: gather-synthesize.md reuse_examples vs 04-CONTEXT.md lines 41-76]

- **Framing-specific review prompts** — CONTEXT.md says "Framing-specific review prompts injected by the workflow, NOT baked into agent definitions." This requires framing question files at `get-shit-done/framings/{framing}/reviewer-questions.md`. These files don't exist yet and aren't in Phase 4's scope (WKFL-07 is Phase 6). Phase 4 must design reviewer agents to work WITHOUT framing injection as the default path, with a framing context slot that Phase 6 fills later. — [Source: 04-CONTEXT.md lines 65-67; REQUIREMENTS.md — WKFL-07 mapped to Phase 6]

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| 4 parallel reviewer agents via gather-synthesize | Viable | Pattern proven with 6 parallel research agents. 4 is quantitatively less. gather-synthesize.md explicitly lists review as a use case. [Source: gather-synthesize.md reuse_examples] |
| All 5 agents (4 reviewers + synthesizer) as role_type: judge / Opus | Viable | resolveModelFromRole already handles this. All 5 use `model: "inherit"`. Cost is higher than research (which used Sonnet for gatherers), but reviewers need judgment, not just data gathering. [Source: model-profiles.md — "4x reviewers (Phase 4): judge: Opus; Review synthesizer (Phase 4): judge: Opus"] |
| ~1500 token agent definitions for reviewers | Viable | Phase 2 research confirmed ~900-1350 tokens typical for agent definitions. Reviewer agents have simpler scope than research agents (one REQ layer vs open-ended investigation). Synthesizer allowed up to ~2000 tokens per Phase 2 precedent. [Source: Phase 2 TECH-CONSTRAINTS.md token math section] |
| Synthesizer spot-checking by reading cited file:line references | Constrained | Synthesizer gets fresh 200k context window. It can Read files. But if implementation touches many files, reading ALL cited references may consume significant context. Synthesizer should selectively spot-check (sample-based), not exhaustively verify every citation. [First principles: 200k tokens is ~150k words. A large codebase feature might touch 20-30 files at 100-500 lines each. Reading all is feasible but wasteful. Sampling 3-5 high-priority citations per reviewer is more practical.] |
| Re-review after fix application (max 2 cycles) | Constrained | Each re-review cycle spawns 4 new reviewer agents + 1 synthesizer = 5 agent spawns per cycle. Max 2 cycles = up to 15 total agent spawns (initial + 2 re-reviews). This is viable but expensive. The orchestrator must track which areas were affected and scope re-review to changed files, not the full codebase. [First principles: 15 Opus-level agent spawns per review is the ceiling. Scoped re-review (only affected reviewers, only changed areas) can reduce this to 2-4 re-spawns per cycle.] |
| One-at-a-time finding presentation with 5 response options | Viable | Matches the Q&A pattern already implemented in plan-phase.md step 9.5. AskUserQuestion supports custom option arrays. 5 options (Accept / Accept w/ Edit / Research / Defer / Dismiss) fits within normal UI. [Source: plan-phase.md step 9.5 — 3 options per finding; discuss-phase.md — similar Q&A loop] |
| Q&A presentation happens in orchestrator (not in subagent) | Required | Task subagents cannot interact with the user. Only the orchestrating workflow (main conversation) can present questions. This is the same constraint as plan-phase.md step 9.5 Q&A loop. The synthesizer returns findings; the workflow presents them. [Source: Phase 3 research — "Pattern 2: Q&A Loop in Workflow (Not Agent)"] |
| Reviewer agents reading implementation code + requirement specs | Constrained | A reviewer needs: (1) requirement spec (~2-5k tokens for one layer of FEATURE.md), (2) implementation code (variable, could be 5-50k tokens depending on feature size), (3) agent definition (~1.5k tokens), (4) orchestrator overhead (~5-10k tokens). Total: ~15-70k tokens. Well within 200k window, but large features could push reviewer context usage to 30-40%. The orchestrator should pass file paths, not inline code. [First principles: 200k window minus 10k overhead = 190k usable. Even a 50-file feature at 500 lines average = ~375k tokens — doesn't fit. Reviewers must use Grep/Read selectively, not load entire codebase.] |

### Alternatives

- **If re-review cost is too high (15 agent spawns)** -> Scoped re-review: only re-spawn reviewers whose domain was affected by the fix. End-user reviewer re-runs if acceptance criteria changed. Technical reviewer re-runs if implementation changed. Synthesizer always re-runs. This reduces to 2-3 spawns per re-review cycle. — [First principles: if a fix only changes one file's implementation, only the technical and code-quality reviewers need to re-run. The end-user and functional reviewers' verdicts are unaffected unless the fix changes observable behavior.]

- **If reviewer context is too large for a single feature** -> Split review into file-level passes. Reviewer reads one file at a time, accumulates findings, writes partial report. Orchestrator merges partial reports. This is more complex but handles features touching 50+ files. — [First principles: breaking the problem into smaller units is always possible but adds orchestrator complexity. Better approach: reviewers should use Grep to search for relevant patterns across files rather than reading every file sequentially.]

- **If framing-specific prompts are needed before Phase 6** -> Hardcode a default "new" framing question set directly in the review workflow as a fallback. Phase 6 replaces the fallback with proper framing injection. — [First principles: Phase 4 needs to work standalone. Framing injection is Phase 6 scope. A sensible default avoids blocking.]

- **If synthesizer spot-checking is too slow** -> Skip spot-checking on "met" verdicts (low-risk findings). Only spot-check "not met" and "regression" verdicts where the stakes of a wrong verdict are higher. — [First principles: spot-checking is a sampling strategy. Sampling should be risk-weighted, not uniform.]

---

### Phase 4 Specific Technical Analysis

#### 4 Reviewers vs 6 Researchers: gather-synthesize Differences

The gather-synthesize pattern works identically for 4 or 6 agents. Key differences are in the agents themselves, not the pattern:

| Dimension | Research (6 agents) | Review (4 agents) |
|-----------|--------------------|--------------------|
| Agent role_type | executor (Sonnet) | judge (Opus) |
| Model cost per agent | Lower (Sonnet) | Higher (Opus) |
| Total agents per run | 7 (6+synthesizer) | 5 (4+synthesizer) |
| Agent input | Context layers 1-4 + codebase search | Implementation code + requirement specs |
| Agent output | Findings with citations | Trace report: per-REQ verdict + evidence |
| Failure threshold | >50% (>3/6) aborts | >50% (>2/4) aborts |
| Synthesizer task | Deduplicate + adjudicate conflicts | Assign severity + resolve conflicts + spot-check |

[Source: gather-synthesize.md parameters and process; 04-CONTEXT.md reviewer definitions]

The abort threshold at >50% means for 4 reviewers, 3 failures aborts. 2 failures still proceeds with partial results. This is stricter per-agent than the 6-gatherer case.

#### Reviewer Agent Context Budget

Each reviewer must fit within ~1500 tokens. Given the CONTEXT.md decisions, here is the token budget estimate per reviewer:

```
YAML frontmatter:           ~100 tokens
Role + Goal:                ~150 tokens
Success Criteria:           ~150 tokens
Scope (layer-specific):     ~300 tokens
Tool Guidance:              ~100 tokens
Citation Requirement:       ~100 tokens
Output Format (trace report): ~400 tokens
Buffer:                     ~200 tokens
TOTAL:                      ~1500 tokens
```

The code quality reviewer has the most complex posture description (04-CONTEXT.md lines 69-75). It may push to ~1700 tokens. The synthesizer can use up to ~2000 tokens (Phase 2 precedent).

[First principles: Lean agents are more reliable. Every token in the agent definition competes with implementation code for the 200k window. 1500 tokens = 0.75% of the window — negligible overhead.]

#### Synthesizer Responsibilities Are Heavier Than Research Synthesizer

The review synthesizer has more work than the research synthesizer:

1. **Severity assignment** (blocker / major / minor) — research synthesizer doesn't assign severity
2. **Spot-checking** by reading cited file:line references — research synthesizer trusts gatherer citations
3. **Conflict resolution with priority ordering** (user > functional > technical > quality) — research synthesizer uses P1/P2/P3 generic ranking
4. **Mandatory conflicts section** with both disagreements and tensions — research synthesizer only has simple conflicts section
5. **Present overlapping findings separately** — user sees both reviewer perspectives

This heavier load justifies the ~2000 token budget for the review synthesizer definition. It also means the synthesizer will use more of its 200k context window (reading 4 trace reports + spot-checking citations).

[Source: 04-CONTEXT.md severity, conflict resolution, and overlapping findings decisions; research synthesizer agent definition for comparison]

#### Q&A Presentation Flow

The finding presentation must happen in the orchestrator (main conversation), not inside any agent. The flow:

```
Orchestrator
  |
  +-- Spawn 4 reviewers (parallel Task calls)
  |     Each writes: {phase_dir}/review/{reviewer}-trace.md
  |
  +-- Check files exist (failure handling per gather-synthesize.md)
  |
  +-- Spawn synthesizer (single Task call)
  |     Reads: 4 trace report files + manifest
  |     Writes: {phase_dir}/review/synthesis.md
  |
  +-- Read synthesis.md
  |
  +-- For each finding (one at a time):
  |     AskUserQuestion:
  |       header: abbreviated (max 12 chars, e.g., "Finding 1/7")
  |       question: finding description + evidence + severity
  |       options: Accept / Accept+Edit / Research / Defer / Dismiss
  |
  |     Handle response:
  |       Accept -> mark resolved, next
  |       Accept+Edit -> capture freeform edit, apply, mark for re-review
  |       Research -> capture freeform guidance, research, next
  |       Defer -> mark deferred, next
  |       Dismiss -> mark dismissed, next
  |
  +-- If any "Accept" or "Accept+Edit" -> apply fixes, re-review cycle
  |     Max 2 re-review cycles
  |     Then surface remaining issues for manual resolution
  |
  +-- Return final review status
```

[Source: 04-CONTEXT.md user presentation decisions; plan-phase.md Q&A loop pattern; First principles: subagents cannot interact with users]

#### Token Budget for Reviewer Agent Inputs

A reviewer agent's 200k context window must hold:

| Component | Estimated Tokens | Notes |
|-----------|-----------------|-------|
| System prompt (Claude Code runtime) | 1-3k | Unobservable, estimated |
| Tool definitions | 2-4k | Read, Write, Bash, Grep, Glob |
| Agent definition (via first-read) | ~1.5k | The reviewer .md file |
| Orchestrator prompt + context layers | 3-5k | File paths, manifest, framing context |
| Requirement specs (one layer) | 2-5k | EU, FN, or TC section of FEATURE.md |
| Implementation code (via Read/Grep) | 10-100k | Variable — reviewer reads files on demand |
| Reasoning + output generation | 20-50k | Agent's working memory |
| **Total used** | **40-170k** | **Well within 200k** |

The key insight: reviewers do NOT receive implementation code inline. They receive file paths and use Read/Grep tools to inspect code. This means a feature with 50 implementation files is still reviewable — the reviewer searches for relevant patterns rather than reading everything.

[First principles: Agent context is consumed incrementally through tool calls. A reviewer that uses Grep to find all places a function is called, then Read to inspect those specific lines, uses far less context than loading all files upfront.]

---

### Sources

- `/Users/philliphall/get-shit-done-pe/.planning/phases/04-review-layer/04-CONTEXT.md` — All locked implementation decisions for Phase 4
- `/Users/philliphall/get-shit-done-pe/.planning/REQUIREMENTS.md` — REVW-01 through REVW-08 requirement definitions
- `/Users/philliphall/get-shit-done-pe/.planning/ROADMAP.md` — Phase 4 success criteria and dependencies
- `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/research/TECH-CONSTRAINTS.md` — Agent SDK constraints, parallel spawning, context windows, model values
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` — Reusable pattern for parallel agents + synthesizer
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan-phase.md` — Q&A presentation pattern, AskUserQuestion usage
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/discuss-phase.md` — AskUserQuestion patterns, one-at-a-time presentation
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/questioning.md` — AskUserQuestion constraints (12-char header limit)
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/model-profiles.md` — Role-based model resolution, reviewer model assignments
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` — ROLE_MODEL_MAP implementation
- `/Users/philliphall/get-shit-done-pe/agents/gsd-research-synthesizer.md` — Synthesizer pattern for comparison
- `/Users/philliphall/get-shit-done-pe/.planning/phases/03-planning-pipeline/03-RESEARCH.md` — Q&A loop patterns, workflow-vs-agent responsibility split
