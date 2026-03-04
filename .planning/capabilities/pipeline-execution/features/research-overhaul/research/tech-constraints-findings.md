## Tech Constraints Findings

**Feature:** pipeline-execution/research-overhaul
**Dimension:** Tech Constraints
**Researched:** 2026-03-04
**Lens:** enhance (primary), debug (secondary)

---

### Hard Constraints

- **AI instruction interpretation is not deterministic** — `@{GSD_ROOT}/get-shit-done/workflows/research-workflow.md` in a prose `<process>` step is ambiguous instruction. The model may interpret it as "delegate to a sub-process" (shortcut) or "read and inline the content" (correct). There is no runtime enforcement. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` Step 5, line 60; contrast with plan.md Step 7 `Task()` block at lines 108-115]

- **`Task()` pseudo-code is the unambiguous agent-spawn signal** — Explicit `Task(prompt=..., subagent_type=..., model=...)` syntax is the established GSD convention for spawning subagents. All verified parallel spawns in the codebase use this form. The `@workflow.md` reference form carries no such signal for the model. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute.md` lines 63-95; `plan.md` lines 108-115; `doc.md` line 48; `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/research/TECH-CONSTRAINTS.md` section "Claude Code Agent Spawning"]

- **`gather-synthesize.md` is not a callable function — it is a readable document** — The workflow system has no function-call semantics. `@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md` in a `required_reading` block causes the orchestrator to read and internalize the instructions. Delegation via `@workflow` in a process step does NOT guarantee the model will follow those instructions as a subroutine. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md` lines 12-13, 149-152; `gather-synthesize.md` `<key_constraints>` block line 188: "This is a workflow pattern, not executable code."]

- **No hard cap on parallel Task() spawns is documented** — The Claude Code runtime does not publish a limit on simultaneous Task() calls. 4 parallel agents is confirmed working (execute-plan pattern); 6 is the gather-synthesize target and is consistent with the existing pattern. — [Source: `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/research/TECH-CONSTRAINTS.md` section "Limits on Parallel Spawning"]

- **Orchestrator receives no agent output in-context; results are file-based** — A spawned agent's context is isolated. The orchestrator checks existence and non-emptiness of output files after completion. It does NOT receive the agent's prose output in its own context window. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/pipeline-invariants.md` Invariant 5 "Context Loading Via Paths Not Content"; `TECH-CONSTRAINTS.md` Phase 2 section "How Agents Return Results"]

- **RESEARCH.md has no standardized frontmatter schema** — The synthesizer writes a free-form RESEARCH.md. No frontmatter fields (e.g., `lens`, `subject`, `gatherers_succeeded`) are mandated by any template or schema. Lens-aware reuse detection (e.g., "does this RESEARCH.md match the current lens?") cannot be done programmatically without adding a frontmatter schema. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md` — no frontmatter template defined; `plan.md` Step 5 only checks `has_research` boolean (file exists) not lens metadata]

- **`plan.md` Step 5 reuse check is binary** — The init command returns `has_research` (boolean). If `true`, the plan workflow skips research entirely. There is no check for whether the existing RESEARCH.md was produced under a compatible lens. A mismatched-lens RESEARCH.md is silently reused. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` lines 57-62: "If `has_research` AND no `--research` flag: Use existing, skip to step 6."]

- **Node.js >=16.7.0 required; `fetch` available natively only in Node 18+** — Any new gsd-tools CLI commands that use `fetch` effectively require Node 18. — [Source: `/Users/philliphall/get-shit-done-pe/package.json` engines field; `/Users/philliphall/get-shit-done-pe/.planning/phases/06-workflows-and-commands/research/tech-constraints.md` constraint #9]

- **CommonJS only in `bin/lib/`** — All lib modules use `require()`/`module.exports`. No ESM. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` line 1; `/Users/philliphall/get-shit-done-pe/.planning/phases/06-workflows-and-commands/research/tech-constraints.md` constraint #1]

---

### Dependency Capabilities

- **Claude Code Task() tool**: Accepts `prompt`, `subagent_type`, `model`, `description`. Valid `model` values: `"sonnet"`, `"haiku"`, `"inherit"`. `"opus"` is NOT valid — use `"inherit"` for judge/Opus behavior. Parallel spawning: all Task() calls in a single model response run concurrently. — [Source: `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/research/TECH-CONSTRAINTS.md` section "How Task Tool Works"]

- **`gather-synthesize.md`**: Reusable orchestration document for N parallel gatherers + 1 synthesizer. Defines context assembly (4 layers), parallel spawning instructions, failure threshold (>50% = abort), partial synthesis, and manifest format. Is read via `required_reading` block, not called as a function. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` entire file]

- **`research-workflow.md`**: Standalone research orchestration. Reads `gather-synthesize.md` via `required_reading`. Defines 6 gatherers and synthesizer. Step 5 delegates to gather-synthesize via `@workflow` reference — this is the ambiguous delegation point. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/research-workflow.md` Step 5, lines 148-168]

- **`gsd-tools.cjs` `init plan-feature`**: Returns `has_research` (boolean), `researcher_model`, `research_enabled`, `research_path`. Does NOT return lens metadata for the existing RESEARCH.md. Cannot distinguish a lens-matching RESEARCH.md from a lens-mismatched one. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` Step 1, line 22-25]

- **`extractFrontmatter(content)` in `frontmatter.cjs`**: Can parse YAML frontmatter from any `.md` file. Returns `{}` on parse failure. Uses `FAILSAFE_SCHEMA` — all values are strings. If RESEARCH.md frontmatter were added, it would be parseable by existing tooling without changes. — [Source: `/Users/philliphall/get-shit-done-pe/.planning/phases/06-workflows-and-commands/research/tech-constraints.md` "Dependency Capabilities" section]

- **`resolveModelFromRole(cwd, agentPath)`**: Maps `role_type: executor` → `"sonnet"`, `role_type: judge` → `"inherit"`. The 6 research gatherers use `role_type: executor` (Sonnet); the synthesizer uses `role_type: judge` (Opus/inherit). — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/model-profiles.md` v2 Agent Assignments table]

---

### Compatibility Issues

- **`@{GSD_ROOT}/workflow.md` delegation vs `Task()` spawn**: `research-workflow.md` Step 5 uses prose delegation (`Delegate to the gather-synthesize pattern: @{GSD_ROOT}/...`). This is structurally different from the `Task()` blocks used in `plan.md` Step 7 and `execute.md`. The `@workflow` form has no spawn semantics — the model may read the referenced file and interpret "delegate" as permission to shortcut. The `Task()` form cannot be misread: it is explicit invocation syntax that matches the pattern used everywhere a subagent is actually spawned. — [Source: `research-workflow.md` line 149-152 vs `plan.md` lines 108-115; `execute.md` lines 63-95]

- **`required_reading` vs inline `Task()` for gather-synthesize**: `research-workflow.md` puts `gather-synthesize.md` in `required_reading` (line 12-13). This causes the orchestrator to internalize gather-synthesize instructions before executing the workflow. If `research-workflow.md` also contained explicit `Task()` blocks for each gatherer, there would be a duplication between what `gather-synthesize.md` instructs and what `research-workflow.md` instructs. The question is where the spawn instructions should live to be unambiguous — without creating a DRY violation. — [Source: `research-workflow.md` lines 12-13 and lines 148-168; `gather-synthesize.md` Step 2]

- **Lens-reuse compatibility**: `plan.md` Step 5 checks `has_research` (file exists) and skips research if true. An RESEARCH.md written under the `new` lens will be silently reused for a `debug` lens plan. The two lenses emphasize different research dimensions (domain modeling vs reproduction environment). This mismatch is a data-quality bug, not a blocker. — [Source: `plan.md` lines 57-62; `framing-pipeline.md` Stage 1 lens-aware behavior description, lines 76-82]

- **RESEARCH.md frontmatter schema does not exist yet**: Adding frontmatter to RESEARCH.md (e.g., `lens`, `subject`, `gatherers_succeeded`, `timestamp`) would require: (a) the synthesizer agent to write frontmatter, (b) `gsd-tools.cjs` `init plan-feature` to read and return the lens field, (c) `plan.md` to compare lens fields. None of these exist. The change would touch: `gsd-research-synthesizer.md` (write frontmatter), `init.cjs` `cmdInitPlanFeature` (read frontmatter), `plan.md` (compare lens). — [Source: Current state of `research-workflow.md` output contract (no frontmatter); `plan.md` Step 1 JSON fields; `init.cjs` implied by `has_research` boolean]

---

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---|---|---|
| Inline explicit `Task()` blocks for all 6 gatherers directly in `research-workflow.md` (eliminate delegation to `gather-synthesize.md`) | viable | Removes delegation ambiguity entirely. Creates DRY violation: review.md also uses gather-synthesize for 4 reviewers. Any change to the pattern must be made in two places. Acceptable tradeoff if the pattern is stable. — [Source: `review.md` line 6 `required_reading` for `gather-synthesize.md`; `research-workflow.md` Step 5] |
| Keep `gather-synthesize.md` as shared pattern; replace `@workflow` delegation in `research-workflow.md` Step 5 with explicit imperative: "Follow the steps in gather-synthesize.md exactly as written" | viable | No DRY violation. Reduces but does not eliminate ambiguity — still relies on model reading `required_reading` and following it. Stronger instruction phrasing (imperative mood, numbered steps, no "delegate") reduces misinterpretation risk. — [First principles: imperative mood ("Do X") is more directive than delegation mood ("Invoke X")] |
| Add lens metadata to RESEARCH.md frontmatter and update `init plan-feature` to return lens field for reuse comparison | viable (constrained) | Requires changes to: synthesizer agent (write frontmatter), `init.cjs` (read frontmatter), `plan.md` (compare lens). Small but multi-file change. No new dependencies needed — `extractFrontmatter()` already handles this. — [Source: `frontmatter.cjs` `extractFrontmatter()` capability; `init.cjs` extension pattern documented in phase 06 tech-constraints] |
| Lens-aware reuse check via `--research` flag override only (no frontmatter) | viable | Current `--research` flag forces re-run regardless of `has_research`. User must know to pass it. No programmatic detection of lens mismatch. Acceptable for v1 of the feature — lower cost, lower correctness. — [Source: `plan.md` line 57: "If `has_research` AND no `--research` flag: Use existing"] |
| Move all 6 explicit Task() blocks into `plan.md` directly (eliminate research-workflow.md) | constrained | Violates DRY severely: `framing-pipeline.md` Stage 1 also invokes `research-workflow.md`. Would require duplicating 6 Task() blocks in both callers. The indirection through `research-workflow.md` exists specifically to avoid this. — [Source: `framing-pipeline.md` line 86; `plan.md` line 60] |
| Keep current `@workflow` delegation pattern with no changes | blocked | Root bug: the model interprets `@workflow` delegation as permission to shortcut. This is the documented problem statement. No fix = the bug persists. — [Source: feature context problem statement; `research-workflow.md` Step 5 lines 148-168] |
| 6 parallel Task() spawns in a single workflow response (6 sub-contexts) | viable | No documented hard cap. Existing pattern (4 parallel in execute-plan) is close. Each spawned agent gets a fresh 200k context window. Orchestrator context stays lean because agents write results to disk. — [Source: `pipeline-invariants.md` Invariant 1; phase 02 TECH-CONSTRAINTS.md "Parallel Execution Constraints"] |
| CLI route flag for lens-aware research reuse (`--lens=enhance` passed to `gsd-tools init plan-feature`) | viable (constrained) | Would require adding `lens` parameter to `cmdInitPlanFeature` and returning `research_lens_match` boolean. Cleaner than prompting the user but requires gsd-tools change. Lower priority than fixing the delegation ambiguity. — [Source: `gsd-tools.cjs` init switch pattern; `init.cjs` `cmdInitPlanFeature` implied structure] |
| RESEARCH.md frontmatter frontmatter read via `extractFrontmatter()` in workflow markdown (no gsd-tools change) | viable | Workflow can `cat` RESEARCH.md and parse the `lens` field itself using a Bash call, avoiding gsd-tools changes entirely. Less clean than a proper init field but zero infrastructure cost. — [First principles: Bash can read a file; workflow can branch on the extracted value] |

---

### Alternatives

- **`@workflow` delegation blocked** → Replace with explicit `Task()` block expansion inside `research-workflow.md`, following the same `Task()` pattern as `plan.md` Step 7. The `gather-synthesize.md` file becomes pure reference documentation (read by the orchestrator for context), and `research-workflow.md` Step 5 becomes the canonical spawn location. — [First principles: the `Task()` form is the only unambiguous spawn signal in the GSD workflow system; every confirmed parallel spawn in the codebase uses it]

- **Lens-reuse detection without gsd-tools changes** → Add a YAML frontmatter block to the top of RESEARCH.md when the synthesizer writes it (e.g., `lens: enhance`, `subject: pipeline-execution/research-overhaul`). `plan.md` Step 5 reads this via Bash (`head -5 RESEARCH.md | grep lens:`). If lens does not match `LENS` variable, treat as missing and re-run. Zero gsd-tools changes required. — [First principles: `extractFrontmatter()` or a Bash grep can read any frontmatter; the synthesizer can be instructed to write it as part of its output contract]

- **`gather-synthesize.md` DRY conflict (if inlining Task() blocks)** → Keep `gather-synthesize.md` as the authoritative specification for the pattern. `research-workflow.md` embeds explicit `Task()` calls but adds a note: "These Task() calls implement the gather-synthesize pattern from `gather-synthesize.md`. If that pattern changes, update here." Explicit is better than implicitly delegated for AI-read workflows. — [First principles: workflow clarity for the AI reader is more important than source-of-truth purity in a system with no runtime compilation]

- **`review.md` uses same gather-synthesize delegation** → Same fix applies. `review.md` Step 4 should also inline explicit `Task()` blocks for its 4 reviewer agents rather than relying on `gather-synthesize.md` delegation. This is a parallel fix, not a blocker for the research-overhaul feature scope. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md` lines 4-6 `required_reading` for `gather-synthesize.md`; Step 4 describes gatherer spawning without Task() syntax]
