# Phase 6 Research Synthesis: Workflows and Commands

**Phase:** 06-workflows-and-commands
**Synthesized:** 2026-02-28
**Gatherer Status:** 6/6 success (domain-truth, existing-system, user-intent, tech-constraints, edge-cases, prior-art)
**Confidence:** HIGH

---

## Consensus

All six gatherers converge on the following findings without contradiction:

- **Framing is reasoning configuration, not cosmetic labeling.** The four entry points (debug/new/enhance/refactor) prime structurally different reasoning chains — backward for debug, forward for new, outward for enhance, underneath for refactor. This is validated by cognitive science (framing effects on situation models), LLM research (framing triggers systematic bias in continuations), and prior art (Kiro separates feature specs from bug-fix specs because the artifact shape differs). — [domain-truth FP-2, user-intent AC-02, prior-art Kiro/Robin findings]

- **Discovery must produce a written artifact (Discovery Brief), not rely on shared understanding.** The brief is the contract between discovery and the pipeline. It must be a template at a known path with known fields. One-sentence problem statement is the completeness gate. — [domain-truth FP-3, user-intent AC-11/AC-12, prior-art canonical pattern 1/3]

- **All framings converge to the same pipeline after discovery, but framing shapes behavior within each stage.** The pipeline stages are identical (requirements -> plan -> execute -> review -> docs); framing changes risk posture in plan, aggressiveness in execute, definition of done in review. "Same pipeline" means same stages, not identical behavior. — [domain-truth FP-5/UC-1, user-intent AC-14/AC-18, prior-art Double Diamond pattern]

- **Slash commands = orchestration; subagents = execution.** Discovery Q&A stays in the main thread (needs user responses). All file reading, codebase analysis, artifact generation goes to subagents. This prevents context pollution. — [domain-truth UC-1, existing-system gather-synthesize pattern, prior-art Roo Code boomerang anti-pattern 3]

- **MVU completion conditions must be explicit per lens, tracked as named slots, not inferred from conversational feel.** Debug: symptom + reproduction + hypothesis. New: problem + who + done criteria + constraints. Enhance: current + desired + delta. Refactor: current design + target design + breakage. — [domain-truth UC-2, user-intent AC-04, edge-cases MVU boundary conditions]

- **Fixed skeleton (3-5 anchor questions) + adaptive muscles (branch based on answers) is the discovery architecture.** Prevents both under-discovery and over-discovery. Validated by Robin debugging research and progressive disclosure patterns. — [domain-truth FP-4, user-intent AC-03, prior-art canonical pattern 2]

- **Summary playback before transitioning from discovery to pipeline is mandatory.** Not optional, not user-controllable. This is the misunderstanding gate. The brief itself is the playback surface. — [domain-truth VA-1/DR-1, user-intent AC-06, prior-art canonical pattern 3]

- **Fuzzy resolution for all commands: substring/slug matching, not semantic search.** < 100 artifacts in a project model. fzf-style ranked matching. Auto-select on unique match, top-3 on multiple, clarify on none. No embedding library needed. Implement in workflow markdown, not gsd-tools. — [user-intent AC-34/AC-35/AC-36, tech-constraints fuzzy resolution section, prior-art anti-pattern 4]

- **`/init` auto-detects new vs existing via filesystem evidence.** `.planning/` exists + code exists = existing. Nothing = new. Ambiguous = one question. Existing-project flow: parallel scan -> user validation (independent sections) -> gap fill. Incremental writes with resume support. — [domain-truth UC-6/VA-3/VA-4, user-intent AC-24 through AC-29, tech-constraints brownfield detection reuse]

- **The gather-synthesize pattern is reusable for all Phase 6 workflows.** 4-layer context assembly with Layer 4 as the framing injection slot. Already handles parallel spawning, failure thresholds, synthesis. Framing directories exist but are empty — Phase 6 populates them. — [existing-system gather-synthesize, tech-constraints framing question files, prior-art canonical pattern 4]

- **discuss-capability and discuss-feature are thinking partners, not pipeline stages.** Optional, repeatable, can kill/defer ideas. discuss-capability sets WHAT/WHY (upstream of lens commands). discuss-feature sets HOW (between plan and execute). Both can route backward. — [user-intent AC-30 through AC-33, existing-system discuss-phase predecessor]

- **Universal escalation protocol: 3-tier severity at every stage.** Minor = flag + continue. Moderate = pause + propose amendment. Major = halt + recommend upstream return (propose-and-confirm, not auto-return). — [domain-truth DR-5, user-intent AC-21 through AC-23, edge-cases escalation severity]

---

## Conflicts

### P1 — Blocking

- **`.planning/capabilities/` vs `.documentation/capabilities/` path conflict**: Existing gsd-tools code (capability.cjs, core.cjs, template.cjs) writes capability files to `.planning/capabilities/{slug}/CAPABILITY.md`. The CONTEXT.md calls for `.documentation/capabilities/` for per-capability lifecycle files. These are different stores with different purposes but overlapping content. — Resolution: Keep `.planning/capabilities/` as the working artifact store (briefs, plans, requirements). Use `.documentation/capabilities/` only for doc-agent published outputs. All existing gsd-tools code continues to work unchanged. The planner must make this split explicit in task definitions. — [tech-constraints compatibility issues, existing-system capability data model]

- **`init resume` naming collision**: Existing `gsd-tools init resume` detects interrupted agents and returns session state. Phase 6's `/resume` command picks up interrupted pipelines at stage boundaries. Different semantics, same name. — Resolution: New pipeline resume uses `init resume-pipeline` (or similar unambiguous name). Existing `init resume` is untouched. — [tech-constraints compatibility issues, existing-system gsd-tools CLI]

### P2 — Important

- **CONTEXT.md decisions exceed REQUIREMENTS.md scope in several areas**: WKFL-02 through WKFL-05 describe only discovery, not framing's pipeline influence. INIT-03 undersells discuss-capability (no kill/defer, no cross-capability awareness). The CONTEXT.md is the authoritative source — implementation must follow CONTEXT.md, not just REQUIREMENTS.md. — [user-intent risk: misalignment section]

- **Framing question file naming convention is undocumented**: `gather-synthesize.md` references `framings/{framing}/{role}-questions.md` but the exact naming scheme (per-role vs per-dimension) is not canonicalized. — Resolution: Phase 6 must define and document the canonical naming convention before creating files. — [existing-system undocumented assumptions, tech-constraints framing question files]

### P3 — Minor

- **`references/` vs `framings/` content overlap**: The `references/` directory contains items named `debug`, `enhance`, `new`, `refactor`. The `framings/` directory is where Phase 6 should write question files. — Resolution: Check references/ content; migrate relevant material to framings/; one canonical location. — [tech-constraints alternatives section]

---

## Gaps

| Gap | Impact | Confidence | Classification | Action |
|-----|--------|------------|----------------|--------|
| Compound work conflict resolution rules (when primary and secondary lens disagree on risk posture, review targets, or requirements weight) | high | low | spike | Define explicit precedence rules for primary vs secondary lens at each pipeline stage before building compound work support |
| Escalation loop termination across pipeline stages (backward flow can loop: discovery -> requirements -> plan -> discovery again) | high | medium | risk-accept | Implement global pipeline-run escalation counter; hard stop after 1 backward reset per run; user must explicitly restart for a second reset |
| Discovery brief file path and naming convention | high | low | spike | Define canonical path (e.g., `.planning/capabilities/{slug}/BRIEF.md`) and template before building any framing workflow |
| Circling detection reliability (LLM judgment-based, no mechanical rules) | medium | low | risk-accept | Add concrete pattern rules (same question asked 2x, same answer repeated) as guardrails alongside LLM judgment; accept residual risk |
| Severity threshold calibration for escalation protocol per stage | medium | low | risk-accept | Document severity rubric with 2-3 concrete examples per tier per stage; accept that thresholds will drift and need periodic recalibration |
| Phase 3 plan format verification (CONTEXT.md assumes 5-field task structure from Phase 3, but Phase 3 plans show "not started" in roadmap) | medium | medium | spike | Verify actual Phase 3 output format before planning Phase 6 pipeline convergence; if format differs, update Phase 6 spec |
| `/plan` command: does it trigger research or assume research already ran? | medium | low | spike | Define explicitly: `/plan` with approved requirements = research already done. If no RESEARCH.md exists, `/plan` gates with a warning. |
| `/status` data source (STATE.md vs live .planning/ scan) | low | low | defer | Decide during planning; both approaches are viable. STATE.md is faster, live scan is more accurate. |
| `auto_advance` config persistence semantics | low | medium | defer | Document that `auto_advance` is project-level persistent flag, not per-invocation; framing commands must understand this |

---

## Constraints Discovered

- **CommonJS only** in `get-shit-done/bin/lib/`. All new modules use `require()`/`module.exports`. No ESM. — [tech-constraints hard constraints]

- **stdout = JSON only** from gsd-tools. `output()` writes JSON to stdout, `error()` writes to stderr. New commands must follow this contract. — [tech-constraints hard constraints]

- **50KB Bash tool buffer limit.** `output()` handles this via `@file:<path>` tmpfile fallback. Workflows parsing gsd-tools output must check for this prefix. — [tech-constraints hard constraints]

- **Task model parameter accepts only `"sonnet"`, `"haiku"`, or `"inherit"`.** Phase 6 agents must declare `role_type` in frontmatter and use `resolveModelFromRole`. — [existing-system constraints, tech-constraints dependency capabilities]

- **`gsd-tools init` pattern is the authoritative context loader.** Every workflow starts with `node gsd-tools.cjs init <workflow-name>`. New workflows need matching init functions in `init.cjs`. — [existing-system constraints]

- **`findCapabilityInternal` does exact slug match only.** Fuzzy resolution must be implemented separately (workflow-level recommended). — [existing-system constraints, tech-constraints dependency capabilities]

- **`fillTemplate()` is the single source of truth for capability/feature file creation.** New template types (Discovery Brief) require new `fillTemplate()` cases and template files. — [tech-constraints hard constraints]

- **`agent-history.json` + `current-agent-id.txt` interrupt tracking.** Phase 6 pipeline workflows must write `current-agent-id.txt` on spawn and delete on completion, or `/resume` detection breaks. — [existing-system constraints]

- **Framing directories exist but are empty** (`framings/debug/.gitkeep` etc.). Phase 6 populates them with question files. Existing workflows skip gracefully when absent. — [existing-system constraints, tech-constraints framing question files]

- **No interactive stdin** from gsd-tools. All user interaction via `AskUserQuestion` tool in workflows. — [tech-constraints hard constraints]

- **`discuss-phase.md` CONTEXT.md format is consumed verbatim by gsd-planner** via XML tag names. If Phase 6 changes section structure in capability files, the planner agent must be updated. — [existing-system undocumented assumptions]

- **`loadConfig(cwd)` returns defaults when `config.json` is missing.** `/init` writes config partway through; early init calls see defaults. — [existing-system undocumented assumptions]

---

## Recommended Scope

### Build Order

The scope decomposes into 5 logical build units based on dependency analysis. Each unit is independently testable.

**Unit 1: Foundation (infrastructure all other units depend on)**
- Discovery Brief template and `fillTemplate()` extension — [all framing workflows produce briefs; nothing downstream works without the template]
- Framing question files in `framings/{framing}/{role}-questions.md` — [gather-synthesize Layer 4 reads these; review-phase already has the slot]
- Fuzzy resolution logic in workflow markdown using `capability-list` output — [all 11 commands need this; no command works without it]
- `init` compound commands for new workflows added to `init.cjs` and `gsd-tools.cjs` switch — [every workflow needs its init function]
- Discovery state persistence (stage-level completion markers for `/resume`) — [pipeline stages must be resumable]

**Unit 2: Framing Workflows (the four entry points)**
- `/gsd:debug` slash command + workflow with detective-mode discovery, MVU (symptom + reproduction + hypothesis), lens-specific brief Specification fields — [WKFL-02]
- `/gsd:new` slash command + workflow with architect-mode discovery, MVU (problem + who + done + constraints), cross-framing detection (/new -> /enhance) — [WKFL-03]
- `/gsd:enhance` slash command + workflow with editor-mode discovery, MVU (current + desired + delta) — [WKFL-04]
- `/gsd:refactor` slash command + workflow with surgeon-mode discovery, MVU (current design + target design + breakage) — [WKFL-05]
- Lens misclassification detection (upfront + mid-discovery) — [06-CONTEXT.md decisions]
- Compound work support (primary + secondary lens) — [06-CONTEXT.md decisions]
- Summary playback before transition — [mandatory gate, all framings]
- Three exit signals (MVU met, user override, diminishing returns) — [all framings]

**Unit 3: Pipeline Convergence (wiring discovery to execution)**
- Brief -> requirements auto-generation with lens-specific weighting — [WKFL-06, AC-16/AC-17]
- Framing context injection into research agents, planner, executors, reviewers — [WKFL-07]
- Review receives three inputs: requirements + lens metadata + brief — [AC-19]
- Reflect = Phase 5 doc agent wired as final step — [AC-20]
- Universal escalation protocol at every stage (3-tier, propose-and-confirm for major) — [AC-21 through AC-23]
- Escalation loop termination (global counter, hard stop after 1 backward reset) — [domain-truth DR-5]

**Unit 4: Project Initialization**
- `/gsd:init` slash command with auto-detection (new vs existing vs ambiguous) — [INIT-01, INIT-02]
- New-project flow: deep Q&A -> PROJECT.md + capability map + `.documentation/` seed — [INIT-01]
- Existing-project flow: parallel scan (gather-synthesize) -> independent section validation -> gap fill — [INIT-02]
- Incremental writes with partial-run detection and resume — [AC-28]
- Brownfield detection reuse from `cmdInitNewProject` — [existing-system reuse]

**Unit 5: Discussion + Supporting Commands**
- `/gsd:discuss-capability` with kill/defer power, cross-capability awareness — [INIT-03, AC-30 through AC-32]
- `/gsd:discuss-feature` with backward routing — [AC-33]
- `/gsd:status` project-wide dashboard — [AC-37]
- `/gsd:resume` pipeline-aware state detection — [AC-38]
- `/gsd:plan` explicit trigger — [AC-39]
- `/gsd:review` manual trigger — [AC-39]

### What NOT to build

- Framing-specific agent definitions (agents are generic; workflows inject framing context) — [WKFL-07, prior-art anti-pattern 1]
- Semantic search / embedding-based fuzzy resolution (substring matching is sufficient) — [prior-art anti-pattern 4]
- Separate artifact schemas per framing (single Discovery Brief schema with lens-specific sections) — [prior-art anti-pattern 1]
- Auto-advance through pipeline without user confirmation — [REQUIREMENTS.md out of scope]
- v1 command cleanup (Phase 7) — [ROADMAP.md]

### Critical implementation patterns

1. **Orchestrator passes paths, not content.** Framing workflow passes brief path to requirements agent; requirements agent reads it, produces files, reports paths back. Orchestrator never reads file content. — [prior-art canonical pattern 4, domain-truth UC-1]

2. **Brief reset on lens pivot.** If discovery pivots from one lens to another, zero-out the lens-specific Specification section. Context and Meta survive; Specification does not. Wrong-lens data is worse than empty. — [edge-cases P1 failure mode]

3. **Capability status check before launch.** Every framing command checks capability status before starting discovery. `killed` or `deferred` status blocks launch and surfaces the reasoning. — [edge-cases discuss-capability kill enforcement]

4. **Explicit fuzzy resolution confirmation.** After resolving a natural language reference, show the resolved capability/feature name prominently and require confirmation before starting discovery. Silent wrong-target is a P1 failure mode. — [edge-cases fuzzy resolution failure, domain-truth DR-2]

5. **Per-field MVU validation, not heuristic.** Check each named MVU slot individually before declaring completion. Field presence is necessary but not sufficient — semantic completeness checks needed (e.g., refactor with identical current/target design is not complete). — [edge-cases MVU boundary conditions]

---

*Phase: 06-workflows-and-commands*
*Synthesis completed: 2026-02-28*
*Gatherers: 6/6 success*
*Ready for planning: yes*
