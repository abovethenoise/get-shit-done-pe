## Existing System Findings

**Scope:** Phase 6 — Workflows and Commands (WKFL-01 through WKFL-07, INIT-01 through INIT-03)
**Analyzed:** 2026-02-28

---

### Relevant Implementations

- **`/gsd:debug` command** — `commands/gsd/debug.md:1` — Current v1 implementation of debug. Gathers symptoms via 5 AskUserQuestion steps (expected/actual/errors/timeline/reproduction), then spawns `gsd-debugger` subagent. No framing lens, no Discovery Brief, no capability reference. Symptom gathering is fixed-sequence rather than adaptive. This is the closest analog to the v2 `/debug` framing workflow but lacks lens mode, MVU detection, and pipeline convergence.

- **`/gsd:discuss-phase` workflow** — `get-shit-done/workflows/discuss-phase.md:1` — The existing discussion pattern is the structural predecessor to v2's `discuss-capability` and `discuss-feature`. It: (a) scans codebase for reusable assets, (b) identifies gray areas from phase goal, (c) presents them as multiSelect AskUserQuestion, (d) deep-dives each selected area with 4-question loops, (e) writes CONTEXT.md. The CONTEXT.md structure (`<domain>`, `<decisions>`, `<code_context>`, `<specifics>`, `<deferred>`) is the direct ancestor of the v2 capability file format, and the "scope guardrail" + "deferred ideas" pattern maps directly to Phase 6's `discuss-capability` kill/defer design.

- **`/gsd:new-project` workflow** — `get-shit-done/workflows/new-project.md:1` — Current init flow: brownfield detection, deep questioning, PROJECT.md creation, config collection, 4-parallel researchers, synthesizer, roadmapper. This is the v1 `/init` for new projects. Has `--auto` flag for YOLO mode. Missing: existing-project scan, capability map, `.documentation/` structure, incremental writes with state persistence.

- **`/gsd:resume-work` workflow** — `get-shit-done/workflows/resume-project.md:1` — Current resume: loads STATE.md, detects interrupted agents, detects incomplete plans, presents status dashboard, routes to next action. This is the functional predecessor to v2 `/resume`. Has checkpoint detection and agent resume via Task `resume` parameter.

- **`gather-synthesize` pattern** — `get-shit-done/workflows/gather-synthesize.md:1` — Reusable orchestration pattern: 4-layer context assembly (core/capability/feature/framing), parallel gatherer spawning, 50% failure threshold, synthesizer consolidation. **Layer 4 is explicitly framing-aware**: `get-shit-done/framings/{framing}/reviewer-questions.md` slots in here. The framing directories exist (`.gitkeep` files) but the question files do not yet. This pattern is shared across research (6 gatherers) and review (4 reviewers) and is designed for Phase 6 framing extension.

- **`review-phase` workflow** — `get-shit-done/workflows/review-phase.md:1` — Reads Layer 4 framing context with explicit fallback: "If framing files do not exist yet (Phase 6 creates them), proceed without framing context." This confirms framing question files are a known gap ready to be filled.

- **`execute-plan` workflow** — `get-shit-done/workflows/execute-plan.md:1` — Deviation rules (Rule 1-4), checkpoint protocol, task-commit protocol, SUMMARY creation, STATE.md progression, REQUIREMENTS.md completion marking. The plan format (5-field task structure: REQs, Artifact, Inputs, Done, Title) and wave-based parallelization are carried forward from Phase 3 per the Phase 6 CONTEXT decisions.

- **`gsd-tools.cjs` CLI** — `get-shit-done/bin/gsd-tools.cjs:1` — Flat switch dispatch, CommonJS only, stdout JSON. Has `init review-phase` and `init doc-phase` compound commands. Missing: `init debug`, `init new`, `init enhance`, `init refactor`, `init discuss-capability`, `init discuss-feature`, `init status`, `init init` compound commands needed for Phase 6 workflows.

- **Capability and feature data model** — `get-shit-done/bin/lib/capability.cjs:13`, `get-shit-done/bin/lib/feature.cjs:13` — `cmdCapabilityCreate` and `cmdFeatureCreate` exist. Path: `.planning/capabilities/{slug}/CAPABILITY.md`, `.planning/capabilities/{slug}/features/{slug}/FEATURE.md`. Templates exist at `get-shit-done/templates/capability.md` and `get-shit-done/templates/feature.md`. The feature template has a Trace Table (REQ → Research → Plan → Execute → Review → Docs → Status) matching v2's 3-layer requirements traceability.

- **`findCapabilityInternal` and `findFeatureInternal`** — `get-shit-done/bin/lib/core.cjs:454` — Exact-slug lookups only. No fuzzy matching. `findCapabilityInternal(cwd, input)` slugifies input then checks for exact directory match. **Fuzzy resolution** (natural language → top-3 matches) does not exist yet in gsd-tools.

- **Model resolution (v2 role-based)** — `get-shit-done/references/model-profiles.md:50` — `resolveModelFromRole(cwd, agentPath)` reads agent frontmatter `role_type: executor|judge`, maps executor→sonnet, judge→inherit(opus). v1 `resolveModelInternal` remains for legacy agents. Phase 6 agents should declare `role_type` to use v2 resolution automatically.

- **`init review-phase` compound command** — `get-shit-done/bin/lib/init.cjs:599` — Pre-computes `reviewer_agents[]` (4 hardcoded: end-user, functional, technical, code-quality), `synthesizer_path`, `feature_paths`, `capability_paths`, `max_re_review_cycles: 2`, `failure_threshold: 2`. The framing parameter is not yet wired into init — framing context is assembled by the workflow from the `get-shit-done/framings/` directory directly.

- **`progress.md` command** — `commands/gsd/progress.md:1` — Delegates to `get-shit-done/workflows/progress.md`. This is the closest existing analog to v2 `/status`. The `/status` command for Phase 6 needs to show capability/feature status in addition to phase progress.

- **`discuss-phase.md` auto-advance** — `get-shit-done/workflows/discuss-phase.md:511` — Existing auto-advance mechanism: checks `--auto` flag or `workflow.auto_advance` config, then spawns plan-phase as a Task with direct workflow file references (not Skill tool). This pattern must be replicated for Phase 6's `/new`, `/enhance`, `/refactor`, `/debug` → auto-pipeline chains.

---

### Constraints

- **CommonJS only in `get-shit-done/bin/lib/`** — `get-shit-done/bin/gsd-tools.cjs:1` (package.json declares no `"type": "module"`). All new gsd-tools commands must use `require()` and `module.exports`. No ESM imports.

- **Task `model` parameter accepts only `"sonnet"`, `"haiku"`, or `"inherit"`** — `get-shit-done/references/model-profiles.md:84` — Passing `"opus"` directly fails. Judges must use `"inherit"`. All Phase 6 agent spawning must follow this constraint.

- **`gsd-tools init` pattern is the authoritative context loader** — `get-shit-done/bin/lib/init.cjs:1` — Every workflow starts with `node gsd-tools.cjs init <workflow-name>`. New workflows require a corresponding `cmdInit<WorkflowName>` function in `init.cjs`. This is a build-time constraint: new commands without matching init functions must inline their own context loading (brittle) or add to init.cjs.

- **stdout = JSON only** — `get-shit-done/bin/lib/core.cjs` (`output` function) — gsd-tools never writes human-readable output to stdout. Callers parse JSON. All new commands must follow this contract.

- **No interactive stdin** — Workflows use `AskUserQuestion` tool for user interaction, not stdin-based prompts. Bash commands must be non-interactive (`--yes` flags, `2>/dev/null`, etc.).

- **Framing directories exist but are empty** — `get-shit-done/framings/debug/.gitkeep` etc. — The 4 framing directories are scaffolded with `.gitkeep` only. Phase 6 must populate them with question files (`{role}-questions.md` format used by gather-synthesize Layer 4). The naming convention is inferred from `gather-synthesize.md:48`: `get-shit-done/framings/{framing}/{role}-questions.md`.

- **`findCapabilityInternal` uses exact slug match** — `get-shit-done/bin/lib/core.cjs:454` — v2 requires fuzzy resolution ("natural language → top-3 matches"). The current lookup fails for natural language inputs. A fuzzy resolver must be built as a new function or gsd-tools command that reads all capability slugs/names and scores against the input.

- **`discuss-phase.md` CONTEXT.md format** — `get-shit-done/workflows/discuss-phase.md:378` — The existing CONTEXT.md structure (`<domain>`, `<decisions>`, `<code_context>`, `<specifics>`, `<deferred>`) is consumed by `plan-phase.md` and `gsd-planner`. The v2 `discuss-capability` output format must not break this consumption contract, or the planner agent must be updated to handle both formats.

- **`agent-history.json` + `current-agent-id.txt` interrupt tracking** — `get-shit-done/workflows/execute-plan.md:79` — Existing agent tracking writes to `.planning/current-agent-id.txt` on spawn and deletes on completion. `/resume` reads this to detect interruptions. Phase 6 workflows that spawn pipeline agents must follow the same protocol or interruption detection breaks.

---

### Reuse Opportunities

- **`discuss-phase.md` gray-area discussion loop** — `get-shit-done/workflows/discuss-phase.md:296` (`discuss_areas` step) — The 4-question-per-area loop with `AskUserQuestion` and "More questions / Next area" check is directly reusable for `discuss-capability` and `discuss-feature`. Both v2 commands need the same question cadence and scope-creep redirect mechanism.

- **`gather-synthesize.md` pattern** — `get-shit-done/workflows/gather-synthesize.md:1` — The 4-layer context assembly + parallel spawn + failure threshold + synthesize pattern is fully reusable for all Phase 6 discovery workflows. Framing lens changes Layer 4 input only; the orchestration logic is unchanged.

- **`gsd-tools commit` command** — `get-shit-done/bin/gsd-tools.cjs` (`commit` command) — Used across all workflows for planning doc commits. All Phase 6 artifact writes (Discovery Brief, capability files, feature files) should use this command with `commit_docs` flag respected.

- **`gsd-tools generate-slug`** — `get-shit-done/bin/lib/commands.cjs:10` — Consistent slug generation for capability and feature names. Already exported. All Phase 6 name-to-slug conversions must use this to maintain directory naming consistency.

- **`gsd-tools scaffold` commands** — `get-shit-done/bin/gsd-tools.cjs:63` — `scaffold context`, `scaffold uat`, `scaffold verification`, `scaffold phase-dir` exist. Phase 6 needs `scaffold capability`, `scaffold feature`, `scaffold discovery-brief` analogs — these can follow the same pattern using `fillTemplate`.

- **`gsd-tools state record-session`** — `get-shit-done/bin/lib/state.cjs` — All existing workflows update session continuity after completion. Phase 6 workflows must call this to ensure `/resume` can route correctly after a `/debug`, `/new`, `/enhance`, or `/refactor` run.

- **Auto-advance pattern in `discuss-phase.md`** — `get-shit-done/workflows/discuss-phase.md:511` — Checks `--auto` flag and `workflow.auto_advance` config, then spawns downstream workflow as Task with direct file references. All 4 framing commands need this same auto-advance mechanism to chain discovery → research → plan → execute → review → docs.

- **`v2 role-based model resolution`** — `get-shit-done/bin/lib/core.cjs:378` (`resolveModelFromRole`) — Phase 6 agents (framing-specific gatherers, discovery synthesizer, `discuss-capability` agent, `discuss-feature` agent) should declare `role_type` in frontmatter and use `resolveModelFromRole` for automatic model assignment without touching the v1 profile table.

- **Brownfield detection in `init new-project`** — `get-shit-done/bin/lib/init.cjs:162` — Detects existing code via `find` command, checks for package files. The Phase 6 `/init` existing-project flow can reuse this detection logic. `is_brownfield` flag is already computed.

---

### Integration Points

- **`gather-synthesize.md` Layer 4 framing slot** — `get-shit-done/workflows/gather-synthesize.md:46` — New framing question files (`get-shit-done/framings/{framing}/{role}-questions.md`) plug directly into the existing gather-synthesize pattern. `review-phase.md` already reads this path. The planner and researcher workflows need the same Layer 4 injection added.

- **`gsd-tools.cjs` switch dispatch** — `get-shit-done/bin/gsd-tools.cjs:181` — New commands add cases to the switch. New `init` compound commands add to `init.cjs`. New `capability`/`feature` subcommands extend the existing `capability.cjs` and `feature.cjs` modules. The fuzzy resolver adds a new case (`resolve-capability`, `resolve-feature`, or a generic `fuzzy-resolve`).

- **`commands/gsd/` directory** — `commands/gsd/` — New slash commands are `.md` files here. Each command file references workflow files via `@~/.claude/get-shit-done/workflows/` in `<execution_context>`. Phase 6 creates 11 new command files (replacing existing `debug.md`, `resume-work.md`, augmenting `progress.md`, adding `init.md`, `new.md`, `enhance.md`, `refactor.md`, `discuss-capability.md`, `discuss-feature.md`, `status.md`, `plan.md`, `review.md`).

- **`get-shit-done/workflows/` directory** — `get-shit-done/workflows/` — Phase 6 workflow files live here. The `new-project.md` becomes either replaced or extended by an `init.md` workflow. Four framing workflows (`debug.md`, `new.md`, `enhance.md`, `refactor.md`) are new files. Existing `discuss-phase.md` logic is reused/extended for `discuss-capability.md` and `discuss-feature.md`.

- **`.planning/capabilities/` hierarchy** — `get-shit-done/bin/lib/capability.cjs:24` — All `discuss-capability` and lens workflow output writes to this directory. The `init review-phase` and `init doc-phase` compound commands already scan this directory to inject `capability_paths` and `feature_paths` into context. New capability files created by Phase 6 will be auto-detected by those existing init commands.

- **`STATE.md` session continuity** — `get-shit-done/bin/lib/state.cjs` — All workflow completions must call `state record-session`. The `/resume` command reads `Stopped at` and `Resume file` from STATE.md to route correctly after any Phase 6 workflow exits.

- **`agent-history.json`** — `.planning/agent-history.json` — Phase 6 pipeline workflows that spawn long-running agents (discovery, research, plan, execute) must write `current-agent-id.txt` on spawn and delete on completion to support interrupt detection via `/resume`.

---

### Undocumented Assumptions

- **`discuss-phase.md` expects ROADMAP.md to define scope** — `get-shit-done/workflows/discuss-phase.md:42` — The scope guardrail relies on the roadmap phase goal as the authoritative boundary. Phase 6's `discuss-capability` and `discuss-feature` need an equivalent anchor: the CAPABILITY.md goal and FEATURE.md specification respectively. These files must exist before the discussion starts or the scope guardrail has nothing to check against.

- **Framing question file naming convention is `{role}-questions.md`** — Inferred from `get-shit-done/workflows/gather-synthesize.md:48` and `get-shit-done/workflows/review-phase.md:46` — The gathering agents use role-specific question files. For reviewers the path is `framings/{framing}/reviewer-questions.md`. For research gatherers, the implied path would be `framings/{framing}/researcher-questions.md` or `framings/{framing}/{dimension}-questions.md`. This convention is not explicitly documented; Phase 6 must canonicalize it.

- **`gsd-tools init` consumes config.json at `.planning/config.json`** — `get-shit-done/bin/lib/core.cjs` (`loadConfig`) — All `init` functions call `loadConfig(cwd)`. If `config.json` is missing (e.g., during `/init` before config is written), `loadConfig` returns defaults. Phase 6's `/init` command writes config.json partway through flow; early `init` calls before that write will see defaults, not user selections.

- **Auto-advance chains use `workflow.auto_advance` config key** — `get-shit-done/workflows/discuss-phase.md:514` — The config key `workflow.auto_advance` is set to `true` during `--auto` runs and persists. Any subsequent command invocation will also auto-advance unless explicitly cleared. Phase 6 framing commands that check `auto_advance` must understand this is a project-level persistent flag, not a per-invocation flag.

- **`init review-phase` hardcodes 4 reviewer agents from the `agents/` directory** — `get-shit-done/bin/lib/init.cjs:616` — The 4 reviewer agent paths are hardcoded strings. If Phase 6 creates framing-specific reviewer variants or renames agent files, `init.cjs` must be updated manually — there is no autodiscovery of agents.

- **`discuss-phase.md` CONTEXT.md format is consumed verbatim by gsd-planner** — `get-shit-done/workflows/discuss-phase.md:378` — The planner agent reads the CONTEXT.md sections by XML tag names (`<decisions>`, `<specifics>`, etc.). If Phase 6 adds a `<discovery_brief>` section or changes section names in capability files, the planner agent prompt must be updated to recognize the new structure.

- **`gsd-tools.cjs` `init` commands assume a single `.planning/` at cwd** — `get-shit-done/bin/lib/init.cjs:8` — All path resolution is relative to `cwd`. The `--cwd` flag exists to override this. Phase 6 workflows that spawn subagents with shifted working directories must pass `--cwd` explicitly or paths will silently resolve to the wrong location.
