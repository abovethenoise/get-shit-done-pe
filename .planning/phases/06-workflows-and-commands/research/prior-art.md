## Prior Art Findings

**Phase:** 06 — Workflows and Commands
**Dimension:** Prior Art
**Researched:** 2026-02-28
**Scope:** Framing-aware workflow entry points (WKFL-01 through WKFL-07), project initialization (INIT-01, INIT-02, INIT-03), discovery brief handoff, pipeline convergence, fuzzy resolution

---

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| Aider chat modes (ask/architect/code) | User-switched modes that alter behavior without changing the underlying model; ask mode for discovery, architect for two-model planning, code for execution | proven | medium | [aider.chat/docs/usage/modes](https://aider.chat/docs/usage/modes.html) |
| Copilot Workspace / Coding Agent pipeline | 3-stage: specification (current state + desired state) → plan (file-level edits) → code; steerable at each checkpoint | proven (workspace sunsetted May 2025, learnings absorbed into coding agent) | medium | [githubnext.com/projects/copilot-workspace](https://githubnext.com/projects/copilot-workspace) |
| Kiro spec-driven development | Prompt → 3 spec files (requirements.md, design.md, tasks.md) with choice of requirements-first vs design-first for features; separate bug-fix spec flow; agent hooks for file-event automation | emerging | high | [kiro.dev/docs/specs](https://kiro.dev/docs/specs/) |
| Roo Code Boomerang / Orchestrator mode | Orchestrator breaks complex task → delegates subtasks to specialized modes (Code, Architect, Debug) → subtasks run in isolation → return summary to parent → parent resumes | proven | high | [docs.roocode.com/features/boomerang-tasks](https://docs.roocode.com/features/boomerang-tasks) |
| BMAD Method | YAML workflow blueprints with named agent personas (Analyst, PM, Architect, Developer, QA); each step assigned to a persona; explicit artifact handoffs between steps | emerging | medium | [github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) |
| Windsurf Cascade workflows | Markdown workflow files in `.windsurf/workflows/`; sequential step execution; slash command invocation; workflow composition via calling other workflows | proven | low-medium | [docs.windsurf.com/windsurf/cascade/workflows](https://docs.windsurf.com/windsurf/cascade/workflows) |
| Double Diamond (Design Council) | Diverge → converge → diverge → converge: discover (explore problem) → define (narrow problem statement) → develop (explore solutions) → deliver (narrow to solution); first two diamonds are discovery/framing, last two are pipeline | proven (2004, widely adopted in product design) | high | [maze.co/blog/double-diamond-design-process](https://maze.co/blog/double-diamond-design-process/) |
| Robin (academic) — interaction patterns for debugging | Research identifies: single-turn Q&A (leaps to action, sub-optimal) vs multi-turn insert-expansion (asks clarifying questions before proposing fixes); recommended debugging flow: fault identification → localization → comprehension → fixing | emerging (research prototype, 2024) | high for /debug framing | [arxiv.org/html/2402.06229](https://arxiv.org/html/2402.06229) |
| GSD v1 discuss-phase + plan-phase pipeline | `discuss-phase` extracts decisions → CONTEXT.md; `plan-phase` reads CONTEXT.md + spawns researcher + planner + checker; `resume-project` restores state from STATE.md | proven (first-party, in production) | high | codebase: `get-shit-done/workflows/discuss-phase.md`, `plan-phase.md` |
| fzf / kubectl-fuzzy pattern | Interactive fuzzy finder for CLI resource selection; partial string match → ranked list → single-item auto-select; multiple-match → interactive list | proven | medium | [github.com/junegunn/fzf](https://github.com/junegunn/fzf), [github.com/d-kuro/kubectl-fuzzy](https://github.com/d-kuro/kubectl-fuzzy) |
| Progressive disclosure (AI design pattern) | Reveal complexity gradually; load only names/descriptions at startup; expose details on demand; prevents context flooding | proven (Claude Code Skills implementation, 2025) | high | [honra.io/articles/progressive-disclosure-for-ai-agents](https://www.honra.io/articles/progressive-disclosure-for-ai-agents) |

---

### Recommended Starting Point

**GSD v1 discuss-phase + plan-phase pipeline, extended with Kiro's work-type-specific entry flows and Roo Code's orchestrator-worker isolation model.**

GSD v1 already has the core discovery → planning → execution → verification → documentation pipeline working and battle-tested. The gap is at the front door: v1 has a single `discuss-phase` entry point that doesn't differentiate by work type. Kiro demonstrates that distinguishing between a feature spec flow and a bug-fix spec flow at the entry point produces materially better artifacts — the questions are different, the artifact shape is different, the downstream emphasis is different. Roo Code demonstrates the cleanest implementation of this: an orchestrator that dispatches to a mode-specific worker, receives only a summary back, and resumes. GSD v2's 4-framing model (debug/new/enhance/refactor) is this pattern extended to 4 work types with richer discovery.

The practical starting point: the v2 framing commands are thin orchestrators. Each reads STATE.md + project model, runs a framing-specific discovery conversation (fixed skeleton + adaptive branches), produces a Discovery Brief, then calls the shared pipeline in the same way. The pipeline is identical after the brief; the front door is the only differentiation. This is the Double Diamond pattern applied to software development: each framing is a distinct first-diamond (diverge problem space → converge to brief), and all framings share the same second-diamond (pipeline: requirements → plan → execute → review → docs).

---

### Anti-Patterns

**1. Mode-per-framing agent proliferation**
Kiro's current implementation creates separate spec artifacts per work type (requirements.md for features, bugfix.md for bugs). This means the downstream pipeline must handle different artifact shapes depending on the entry mode. In GSD's context, where review agents and doc agents are already defined against a fixed schema, separate artifact shapes per framing would require 4x maintenance of every downstream agent. Prevention: single Discovery Brief schema with a `lens` field and lens-specific sections that are all present but empty when not applicable. Downstream agents read the brief; the lens field tells them which sections to weight.
[First principles: artifact schema proliferation multiplies maintenance surface proportionally to the number of framings; a single schema with optional sections is strictly superior when the pipeline is shared]

**2. Mode switching as the primary UX**
Aider's mode system (ask/architect/code) places the cognitive burden of mode selection on the user. Users must consciously switch between modes and understand what each mode does. In GSD's context, where the user is initiating work, the framing is implied by the work they're describing — a `/debug the timing issue` is unambiguously in debug mode. User-initiated mode switching is appropriate for tool-like sessions (aider); workflow-initiated framing is appropriate for project-oriented sessions (GSD). Anti-pattern: asking the user "which mode do you want?" instead of inferring framing from the command used.
[Source: [aider.chat/docs/usage/modes](https://aider.chat/docs/usage/modes.html) — user must type `/chat-mode architect` explicitly; this is friction for work-type-aware workflows]

**3. Orchestrator context poisoning**
The v1 `plan-phase` workflow loads a large amount of file content into the orchestrator context (CONTEXT.md, STATE.md, ROADMAP.md, REQUIREMENTS.md, RESEARCH.md). As the pipeline extends (discovery brief + research + requirements + plan + review + docs), the orchestrator accumulates context from every stage. Roo Code's Orchestrator mode explicitly prevents this by refusing to read files or execute commands — all reads happen in worker subagents that return only summaries. GSD v2 workflows must apply the same discipline: the orchestrator passes paths to workers, not content; workers return structured summaries, not raw output.
[Source: [docs.roocode.com/features/boomerang-tasks](https://docs.roocode.com/features/boomerang-tasks) — "Orchestrator mode intentionally lacks file-reading and command-execution capabilities to maintain focus on orchestration rather than implementation details"; also confirmed by context isolation research at jxnl.co]

**4. Fuzzy resolution as a search problem**
The natural instinct for "fuzzy natural language → capability/feature" is to build a semantic search or embedding lookup. This is over-engineered for a local project model with < 100 entries. The fzf pattern demonstrates that ranked substring matching + interactive disambiguation handles this case with zero infrastructure. For GSD's context: extract all capability and feature names from the project model, run the user's input against them as a fuzzy filter, auto-select if unique match, present top 3 if multiple, prompt for clarification if none. All in < 20 lines of Node.js using `gsd-tools.cjs`. No vector DB, no embeddings.
[Source: [github.com/d-kuro/kubectl-fuzzy](https://github.com/d-kuro/kubectl-fuzzy) — "partial or fuzzy search...choose from an interactive list...if only one match, selected automatically"; [First principles: the search space is bounded and deterministic; semantic search adds non-determinism without benefit]]

**5. Upfront comprehensive discovery**
BMAD's approach is to run a full analyst → PM → architect → developer → QA sequence for every piece of work. This is appropriate for greenfield projects where the domain is unfamiliar. For incremental development on an existing project (the dominant GSD use case), comprehensive upfront discovery is overhead. The Minimum Viable Understanding (MVU) concept in the 06-CONTEXT.md is the correct counter-pattern: run the minimum discovery needed to produce a brief that unblocks the pipeline, no more. The `--skip` / fast-track path is essential for experienced users who provide rich context upfront.
[First principles: discovery cost compounds; MVU-based termination keeps cost proportional to actual uncertainty; also consistent with progressive disclosure pattern showing context bloat degrades AI performance]

---

### Libraries / Tools

- **fzf**: General-purpose CLI fuzzy finder, version 0.60.3 (Feb 2026). Relevant for understanding the fuzzy matching UX pattern (auto-select on single match, ranked interactive list on multiple). GSD does not need to depend on fzf directly — the pattern can be implemented in gsd-tools.cjs using simple string scoring. — [github.com/junegunn/fzf](https://github.com/junegunn/fzf)

- **Node.js string distance / fuzzy matching**: No library needed. The project already uses `gsd-tools.cjs` (CommonJS). A simple Levenshtein distance or substring scoring function (< 30 lines) handles the fuzzy resolution case. No external library dependency required. — [First principles: the search space is bounded; adding a fuzzy-matching library adds a dependency for a problem that doesn't require one]

- **GSD v1 `gsd-tools.cjs`**: Already implements `init` (multiple subcommands), `state load`, `roadmap get-phase`, `commit`, `plan-validate`, `config-get`, `resolve-model`. The v2 additions needed: `project-model list-capabilities`, `project-model list-features`, `project-model fuzzy-match`, `init new-workflow` (creates discovery brief scaffold), `init project` (two-mode initialization). These are additive CLI commands, not rewrites. — codebase: `bin/gsd-tools.cjs`

---

### Canonical Patterns

**1. Framing as a front door, not a separate system**
The Double Diamond framing: each work type (debug/new/enhance/refactor) is a distinct first diamond (problem space exploration → problem definition). All work types converge to the same second diamond (requirements → plan → execute → review → docs). The Discovery Brief is the artifact that crosses the diamonds — it's the contract between the framing-specific discovery and the framing-agnostic pipeline. Implement as: framing command runs discovery → writes Discovery Brief → calls shared pipeline workflow passing brief path as argument.
[Source: Double Diamond (Design Council 2004); independently validated by Copilot Workspace's "current state + desired state" spec as first-diamond artifact; confirmed by 06-CONTEXT.md decisions]

**2. Fixed skeleton + adaptive muscles for discovery conversations**
Derived from both Kiro's question flow and the academic Robin debugging research. The structure: 3-5 anchor questions that must always be answered (the skeleton), followed by adaptive branches based on what the answers reveal (the muscles). The anchor questions define MVU for the lens; the branches explore open threads until MVU is saturated. This prevents both under-discovery (missing critical context) and over-discovery (infinite questioning).
[Source: [arxiv.org/html/2402.06229](https://arxiv.org/html/2402.06229) — Robin's staged debugging flow (fault ID → localization → comprehension → fixing) is the skeleton; clarifying questions are the muscles; Kiro's "requirements-first vs design-first" choice is an adaptive branch]

**3. Playback-before-transition (always summarize)**
Before any framing command transitions from discovery to the pipeline, the system produces a structured summary of what it understood and asks the user to confirm. This pattern appears across all mature implementations: Copilot Workspace's editable specification before code generation, GSD v1's CONTEXT.md as explicit capture, BMAD's per-agent output review. The playback surface is the Discovery Brief itself: displaying it and asking "does this capture the problem?" catches misunderstandings before they propagate downstream.
[Source: [githubnext.com/projects/copilot-workspace](https://githubnext.com/projects/copilot-workspace) — "You can edit both lists, either to correct the system's understanding...or to refine requirements"; GSD v1 `discuss-phase.md` line 18: "Your job: Capture decisions clearly enough that downstream agents can act on them without asking the user again"]

**4. Orchestrator passes paths, not content**
The v1 `plan-phase` workflow demonstrates the risk of orchestrator context accumulation (14 file paths loaded). The Roo Code boomerang pattern provides the counter-pattern: orchestrator owns workflow state (which stage are we at, what paths exist) but delegates all reading and writing to workers. Workers receive paths in `<files_to_read>` blocks; they return structured summaries. Orchestrator never reads file content directly. Applied to GSD v2 workflows: the framing workflow passes the discovery brief path to the requirements agent; the requirements agent reads the brief and produces requirements files; the requirements agent reports "requirements written to X" not the requirements content. The orchestrator advances to the next stage using the path.
[Source: [docs.roocode.com/features/boomerang-tasks](https://docs.roocode.com/features/boomerang-tasks) — "Orchestrator mode...lacks file-reading and command-execution capabilities"; [jxnl.co/writing/2025/08/29/context-engineering-slash-commands-subagents/](https://jxnl.co/writing/2025/08/29/context-engineering-slash-commands-subagents/) — "8x cleaner main thread, same diagnostic capability"]

**5. Incremental-write + resume state for /init**
The existing GSD v1 `resume-project` workflow demonstrates the resume pattern: check for `.continue-here` files, incomplete SUMMARYs, interrupted agents; reconstruct STATE.md if missing. For the v2 `/init` command, the same discipline applies: each phase of initialization (scan → validate → gap-fill) writes its output incrementally as it completes, not all at once. If `/init` is interrupted, re-running it detects the partial state (via the presence of partially-written artifacts) and offers to resume from the last completed phase. This is directly carried over from v1's `.continue-here` pattern.
[Source: GSD v1 `get-shit-done/workflows/resume-project.md` — "Check for continue-here files (mid-plan resumption)"; codebase: `gsd-tools.cjs init resume`]

**6. Independent section validation in /init existing-project**
The 06-CONTEXT.md specifies that init validation sections should be independent: "confirming tech stack doesn't depend on confirming architecture." This matches how modern project scanning tools (e.g., ScanCode.io, ast-grep) work — they produce sections of findings that can be validated independently. The practical implementation: run parallel scan agents for structure, tech stack, entry points, data models, and patterns; each agent writes its own section; user validates each section independently. No section blocks another. This prevents the cascading failure mode where one wrong inference blocks the entire init.
[Source: 06-CONTEXT.md decisions; [scancodeio.readthedocs.io](https://scancodeio.readthedocs.io/en/latest/tutorial_cli_analyze_codebase.html) — parallel codebase analysis produces independent result sections; [First principles: independent sections enable partial correction without full restart]]

**7. Cross-framing detection and lens pivot**
The 06-CONTEXT.md identifies that `/new` should detect when the user is describing something that already exists and offer to pivot to `/enhance`. The canonical pattern for this is "classifier + graceful redirect": check the user's description against the project model at the start of discovery; if overlapping capability is detected, surface it with evidence and offer the alternative framing. This is the same pattern used by Kiro's project init ("steering files" that tell the system about existing capabilities) and by the academic debugging research (hardness classifier that routes to single-turn vs multi-turn based on issue complexity).
[Source: 06-CONTEXT.md: "Cross-framing detection: /new pivoting to /enhance when user describes overlapping existing capability"; [kiro.dev/docs/specs](https://kiro.dev/docs/specs/) — "steering documents...dramatically improves Kiro's contextual understanding"; [arxiv.org/html/2402.06229](https://arxiv.org/html/2402.06229) — hardness classifier routing to appropriate response type]

---

### GSD v1 Baseline: What Already Exists

This is critical context for Phase 6 planning. GSD v1 has the following that Phase 6 can carry forward or extend:

| v1 Component | Phase 6 Relevance | Action |
|---|---|---|
| `commands/gsd/debug.md` | Has discovery questions (expected, actual, errors, timeline, reproduction) + subagent spawn pattern | Extend: add MVU completion check, lens pivot offer, brief output |
| `get-shit-done/workflows/discuss-phase.md` | CONTEXT.md extraction pattern; "you are a thinking partner"; scope guardrail | Adapt: becomes discuss-capability and discuss-feature; same philosophy |
| `get-shit-done/workflows/resume-project.md` | Full state restoration, continue-here file detection, interrupt detection | Carry forward: `/resume` in v2 is this workflow adapted for capability/feature model |
| `get-shit-done/workflows/plan-phase.md` | Full planning pipeline (research → planner → findings Q&A → validation → checker → finalize); already has the user confirmation gate | Carry forward: v2 pipeline convergence reuses this after discovery brief is written |
| `get-shit-done/workflows/new-project.md` | New vs brownfield detection; config setup; parallel research agents; roadmap creation | Adapt: v2 `/init` splits this into new-project mode and existing-project mode with structured scan |
| `gsd-tools.cjs` | `init`, `state load`, `roadmap`, `commit`, `plan-validate`, `resolve-model` | Extend with fuzzy-match, project-model queries |

---

### Sources

- [Aider chat modes documentation](https://aider.chat/docs/usage/modes.html) — HIGH confidence (official docs, verified)
- [Copilot Workspace (archived)](https://githubnext.com/projects/copilot-workspace) — HIGH confidence (official GitHub Next page)
- [Kiro specs documentation](https://kiro.dev/docs/specs/) — HIGH confidence (official docs, verified via WebFetch)
- [Roo Code Boomerang Tasks](https://docs.roocode.com/features/boomerang-tasks) — HIGH confidence (official docs, verified via WebFetch)
- [BMAD Method GitHub](https://github.com/bmad-code-org/BMAD-METHOD) — MEDIUM confidence (open source, README only, full workflow details not verified)
- [Windsurf Cascade Workflows](https://docs.windsurf.com/windsurf/cascade/workflows) — HIGH confidence (official docs, verified via WebFetch)
- [Double Diamond Design Process](https://maze.co/blog/double-diamond-design-process/) — HIGH confidence (widely cited, Design Council origin 2004)
- [Robin: Interaction Patterns for Debugging](https://arxiv.org/html/2402.06229) — HIGH confidence (peer-reviewed, 2024, ArXiv)
- [Slash Commands vs Subagents: Context Engineering](https://jxnl.co/writing/2025/08/29/context-engineering-slash-commands-subagents/) — MEDIUM confidence (practitioner article, specific metrics unverified)
- [Progressive Disclosure for AI Agents](https://www.honra.io/articles/progressive-disclosure-for-ai-agents) — MEDIUM confidence (practitioner article, pattern is well-established)
- [fzf GitHub](https://github.com/junegunn/fzf) — HIGH confidence (canonical implementation)
- [kubectl-fuzzy](https://github.com/d-kuro/kubectl-fuzzy) — HIGH confidence (production CLI tool demonstrating the pattern)
- GSD v1 codebase — HIGH confidence (first-party, direct inspection)
