# Existing System Findings: Phase 5 Documentation

**Researched:** 2026-02-28
**Confidence:** HIGH -- direct source inspection of all referenced files
**Dimension:** Existing System (what works, what constrains, what can be reused)

---

## Relevant Implementations

- **v1 docs template** -- `get-shit-done/templates/docs.md`. Existing template produces 3 output files per capability: `design.md`, `features.md`, `lessons.md` under `.documentation/{capability}/`. Uses YAML frontmatter with `type: docs`, `capability: "{slug}"`, `built_from_code_at: "{git-sha}"`. This is INCOMPATIBLE with CONTEXT.md decisions -- v2 uses `modules/` (flat, 1:1 with code), `flows/` (capability-grouped cross-module narratives), `gate/` (scaffolded, human-maintained). The template must be rewritten. The `built_from_code_at` frontmatter field is reusable and maps to the ROADMAP success criterion for git SHA staleness detection.

- **Review-phase workflow** -- `get-shit-done/workflows/review-phase.md` (434 lines). Full orchestration pattern: init -> context assembly (Layers 1-3) -> locate artifacts via SUMMARY.md -> spawn agents -> failure handling -> output verification -> Q&A loop (AskUserQuestion with 12-char header limit) -> commit. This is the direct structural template for doc-phase.md. Key difference: review-phase uses gather-synthesize (4 parallel agents), doc-phase is single-agent pipeline.

- **Review-phase slash command** -- `commands/gsd/review-phase.md`. Frontmatter pattern: `name: gsd:review-phase`, `description`, `argument-hint`, `allowed-tools` array. Body: `<objective>`, `<execution_context>` with @workflow references, `<context>` with $ARGUMENTS, `<process>` delegating to workflow. This is the exact template for `commands/gsd/doc-phase.md`.

- **cmdInitReviewPhase** -- `get-shit-done/bin/lib/init.cjs:599-700`. Pattern for cmdInitDocPhase. Signature: `(cwd, phase, raw)`. Loads config, finds phase, extracts req IDs from ROADMAP, resolves agent models, discovers feature/capability paths, returns JSON. Key fields to adapt: `reviewer_agents` becomes `doc_agent_path`, `reviewer_model` becomes `doc_agent_model`, add `summary_files` (from SUMMARY.md scan), `documentation_dir`, `gate_docs_exist`. The init function also returns `state_path`, `roadmap_path` -- reuse directly.

- **v2 agent definition pattern** -- `agents/gsd-review-enduser.md` (81 lines). YAML frontmatter: `name`, `description`, `tools`, `role_type`, `reads`, `writes`. Body sections: Role, Goal, Success Criteria, Scope, Tool Guidance, (framing injection slot), Citation Requirement, Output Format. Two-phase output pattern (internalize then trace). The doc agent follows this skeleton but with `role_type: executor` (Sonnet) rather than `role_type: judge` (Opus/inherit).

- **Review synthesizer** -- `agents/gsd-review-synthesizer.md` (107 lines). Demonstrates spot-check verification pattern, severity assignment, conflict resolution. The doc agent's 3-pass self-validation (structural, referential, gate consistency) is a different verification pattern but the "verify your own output before presenting" principle is shared.

- **Plan-phase Q&A pattern** -- `get-shit-done/workflows/plan-phase.md:346-377`. One-at-a-time finding presentation with AskUserQuestion. Three response options (Accept / Feedback / Research). Review-phase extends to 5 options. Doc-phase Q&A will be simpler -- likely Approve / Edit / Reject per generated doc file, not per finding.

- **Gather-synthesize workflow** -- `get-shit-done/workflows/gather-synthesize.md`. Parameterized parallel orchestration. Doc-phase does NOT use this pattern (single agent, not parallel). However, the context assembly steps (Layers 1-3) and the artifact location via SUMMARY.md are directly reusable patterns within the doc-phase workflow.

- **FRONTMATTER_SCHEMAS** -- `get-shit-done/bin/lib/frontmatter.cjs:155-160`. Existing schemas: `plan`, `summary`, `verification`, `review`. Phase 5 could add a `docs` schema for validating generated doc frontmatter (type, module/flow name, built-from-code-at, last-verified). However, no existing code consumes a docs schema -- this is optional infrastructure.

- **Frontmatter CRUD** -- `get-shit-done/bin/lib/frontmatter.cjs`. `extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter` for parsing/updating YAML frontmatter. Generated doc files use frontmatter for staleness detection (`built-from-code-at: {git-sha}`). These functions handle all read/write operations.

- **ROLE_MODEL_MAP** -- `get-shit-done/bin/lib/core.cjs:34-37`. `executor: 'sonnet'`, `judge: 'inherit'`. Doc agent is `role_type: executor` (produces artifacts, not judging). Resolved to Sonnet by `resolveModelFromRole`. No code changes needed -- just correct frontmatter in the agent definition.

- **SUMMARY.md files** -- e.g., `.planning/phases/04-review-layer/04-01-SUMMARY.md`. Rich metadata: phase, plan, subsystem, tags, requires/provides dependency chain, affects, tech-stack, key-files (created/modified), key-decisions. The doc agent needs SUMMARY.md data to discover what was built -- specifically the `key-files.created` and `key-files.modified` arrays. This is how the doc-phase workflow locates artifacts to document.

- **gsd-tools.cjs init dispatch** -- `get-shit-done/bin/gsd-tools.cjs:510-551`. Switch-case pattern. Each `init` subcommand dispatches to a function in init.cjs. Adding `init doc-phase` requires a new case at line ~552 (after review-phase case) dispatching to `cmdInitDocPhase(cwd, args[2], raw)`. The help text at line 127 area needs a new entry.

- **fillTemplate** -- `get-shit-done/bin/lib/template.cjs:273-294`. Only handles `capability` and `feature` types. The docs.md template is read directly by agents, not populated via `fillTemplate`. No code change needed here -- the template rewrite is a file content change only.

## Constraints

- **v1 docs template is incompatible with CONTEXT.md** -- `get-shit-done/templates/docs.md` produces `design.md`, `features.md`, `lessons.md`. CONTEXT.md specifies `modules/` (flat, 1:1 with code), `flows/` (capability-grouped), `gate/` (scaffolded, human-maintained). The template must be completely rewritten, not patched. [Constrains: Plan 02 Task 2]

- **Doc agent is single-agent pipeline, not gather-synthesize** -- `05-CONTEXT.md` decision. One doc agent per phase, not parallel documentation agents. This is a deliberate simplification vs. the review and research patterns. The doc-phase workflow must NOT follow gather-synthesize.md. [Constrains: Plan 03 workflow design]

- **Section ownership model is per-section, not per-file** -- `05-CONTEXT.md` decision. `[derived]` sections are overwritten freely, `[authored]` sections are preserved. The agent must parse existing docs by heading anchors and handle mixed sections within a single file. This is more complex than whole-file regeneration. [Constrains: agent output format and update strategy]

- **Heading templates are strict and locked** -- `05-CONTEXT.md` decision. Module docs: `## Module:`, `## Purpose:`, `## Exports:`, `## Depends-on:`, `## Constraints:`, `## WHY:`. Flow docs: `## Flow:`, `## Trigger:`, `## Input:`, `## Steps:`, `## Output:`, `## Side-effects:`, `## WHY:`. Gate docs: `## Constraint:`, `## Glossary:`, `## State:` with `[manual]` tag. These are grep targets -- any deviation breaks downstream tooling. [Constrains: agent definition and template]

- **Gate docs are validation inputs, not agent outputs** -- `05-CONTEXT.md` decision. The doc agent reads gate docs during Pass 3 self-validation. It does not generate or modify gate doc content. Gate docs are scaffolded with universal seed content (Plan 01 Task 2) and then human-maintained. [Constrains: agent scope and gate doc lifecycle]

- **One-hop impact discovery, never full scan** -- `05-CONTEXT.md` decision. Agent greps existing flow docs for references to modified modules. Flags impacted docs for human review, does not auto-rewrite. Never scans unrelated modules. [Constrains: agent discovery scope]

- **Q&A review uses AskUserQuestion in orchestrator** -- Established pattern from plan-phase (step 9.5) and review-phase (step 8). The doc agent writes files; the workflow presents them to the user for approval. Q&A happens in the workflow, not inside the agent. Header limit: 12 characters. [Constrains: workflow design]

- **Agent token budget ~1500 tokens** -- Established in Phase 2/4. All v2 agent definitions are lean identity documents. The doc agent has significant scope (3-pass validation, section ownership, heading templates, impact discovery) that must fit within this budget. The reviewer agents at ~80 lines demonstrate this is achievable with careful structure. [Constrains: agent definition size]

- **No `.documentation/` directory exists yet** -- Verified by filesystem check. The directory structure (modules/, flows/, gate/) must be created. Plan 01 Task 2 scaffolds gate/ with seed content. The agent creates modules/ and flows/ subdirectories during documentation generation. [Constrains: Plan 01 must run before Plan 03]

## Reuse Opportunities

- **Review-phase workflow as structural template for doc-phase workflow** -- `get-shit-done/workflows/review-phase.md`. Same high-level flow: init -> context assembly -> locate artifacts -> spawn agent(s) -> verify output -> Q&A -> commit. Simplify: remove parallel spawning (single agent), remove failure handling (single point of failure = abort), remove re-review cycling (doc approval is binary). Keep: init call, context layers 1-3, SUMMARY.md artifact location, AskUserQuestion pattern, commit step.

- **cmdInitReviewPhase as template for cmdInitDocPhase** -- `get-shit-done/bin/lib/init.cjs:599-700`. Same pattern: loadConfig, findPhaseInternal, getRoadmapPhaseInternal, resolve models, discover features/capabilities, return JSON. Replace: reviewer agents array with single doc agent path, add summary_files discovery, add documentation_dir and gate_docs_exist checks.

- **Review-phase slash command as template for doc-phase command** -- `commands/gsd/review-phase.md`. Direct copy-and-adapt: change name, description, argument-hint, execution_context reference, process description.

- **v2 agent skeleton (any reviewer agent)** -- `agents/gsd-review-enduser.md`. Same structure: YAML frontmatter + Role + Goal + Success Criteria + Scope + Tool Guidance + Output Format. Change role_type to executor, adjust reads/writes, add doc-specific content (3-pass validation, section ownership, heading templates).

- **Context assembly pattern (Layers 1-3)** -- Used identically in gather-synthesize.md, review-phase.md, plan-phase.md. Layer 1: PROJECT.md + STATE.md + ROADMAP.md. Layer 2: CAPABILITY.md files. Layer 3: FEATURE.md + REQUIREMENTS.md. Doc-phase uses the same layers. No new context machinery needed.

- **SUMMARY.md key-files arrays for artifact discovery** -- Phase SUMMARY.md files list `key-files.created` and `key-files.modified`. The doc-phase workflow reads these to determine which files the doc agent should document. This is the same pattern review-phase uses to locate "what was built in this phase" (review-phase.md step 3).

- **Frontmatter CRUD for doc file metadata** -- `get-shit-done/bin/lib/frontmatter.cjs`. `extractFrontmatter` to check existing doc staleness (`built-from-code-at`), `spliceFrontmatter` to update timestamps after regeneration. Already exported and callable.

- **Gate doc seed content from CONTEXT.md** -- `05-CONTEXT.md:122-180`. Exact content for constraints.md (7 constraints), glossary.md (5 terms), state.md (template). Copy-paste into gate doc files during Plan 01 Task 2. No research or generation needed.

## Integration Points

- **Doc-phase triggers after review acceptance** -- `05-CONTEXT.md` trigger model and `ROADMAP.md` Phase 5 description. The full pipeline is: execute -> review -> accept -> document. The doc-phase workflow reads review artifacts (synthesis.md, trace reports) as input to the doc agent's "why" channel. Integration: doc-phase workflow must accept phase number and locate review artifacts in `{phase_dir}/review/`.

- **Review findings feed doc agent's "why" channel** -- `05-CONTEXT.md` input contract. Agent reads code (what it does), review findings (why it's this way), requirements (what it was supposed to do). The review synthesis at `{phase_dir}/review/synthesis.md` and individual trace reports are the "why" source. The doc-phase workflow must include these paths in the agent's task context.

- **REQUIREMENTS.md traceability table** -- `.planning/REQUIREMENTS.md:107-157`. Traceability maps REQ IDs through plan -> execution -> review -> documentation. Phase 5 fills the "documentation" column. This requires updating the traceability table after docs are committed.

- **Phase 6 workflow integration** -- `ROADMAP.md` Phase 6 description. The full end-to-end pipeline includes documentation as a stage. The doc-phase command must be invocable from Phase 6 workflows as a pipeline step, not just as a standalone command. The slash command pattern (commands/gsd/doc-phase.md) already supports this -- workflows reference commands by name.

- **Gate docs consumed by future doc agent runs** -- `.documentation/gate/` files are read by Pass 3 self-validation on every doc agent run. Once scaffolded in Plan 01, they persist and accumulate human-authored content. The agent must handle empty gate docs gracefully (freshly scaffolded = template entries only).

## Undocumented Assumptions

- **SUMMARY.md key-files format is stable** -- The doc-phase workflow relies on `key-files.created` and `key-files.modified` arrays in SUMMARY.md frontmatter. This format was established in Phase 1 but is not schema-validated. If a SUMMARY.md lacks these fields, the workflow has no artifact list.

- **Review artifacts always exist when doc-phase runs** -- `05-CONTEXT.md` says docs trigger "after review acceptance." But the review-phase is Phase 4 and may not have been run for the current phase if the pipeline is interrupted. The workflow should verify review artifacts exist and handle missing reviews gracefully (warn, not abort -- docs can still be generated from code + requirements alone, just without "why" context).

- **Single doc agent handles both module and flow docs** -- `05-CONTEXT.md` specifies one agent that produces both types. This means the agent prompt must be comprehensive enough to cover two different output formats (module headings vs. flow headings). At ~1500 tokens budget, this is tight. The agent definition may need to reference the docs.md template externally rather than embedding the full format.

- **Plans already exist for Phase 5** -- Three detailed PLAN.md files already exist in `.planning/phases/05-documentation/`: 05-01 (agent + gate docs, wave 1), 05-02 (init command + template rewrite, wave 1), 05-03 (workflow + slash command, wave 2). These plans reference a `05-RESEARCH.md` that does not yet exist -- the research output this file belongs to is being created now to fill that gap.

- **No existing FRONTMATTER_SCHEMA for docs type** -- `FRONTMATTER_SCHEMAS` in frontmatter.cjs has schemas for plan, summary, verification, review but not docs. Generated documentation files with frontmatter won't have validation unless a schema is added. This is optional -- the existing plans don't mention it, and the doc agent's 3-pass self-validation covers structural compliance.

- **`commands/gsd/` directory exists in project root** -- Slash commands live at `commands/gsd/` (project-level). The existing review-phase.md command is there. Plan 03 creates `commands/gsd/doc-phase.md` in the same location. This is correct -- no path issue.

---

## Requirement Coverage Map

How existing system components map to each DOCS requirement:

| REQ | What It Needs | What Exists | Gap |
|-----|--------------|-------------|-----|
| DOCS-01 | Reflect-and-write agent reads actual built code after review acceptance | v2 agent skeleton from Phase 2; reviewer agents as pattern; no doc agent exists | Agent definition (gsd-doc-writer.md) with 3-pass validation, section ownership, heading templates |
| DOCS-02 | .documentation/ directory with per-capability/feature reference docs | docs.md template exists but v1 structure (design/features/lessons); .documentation/ dir does not exist | Template rewrite to v2 structure (modules/flows/gate); gate doc scaffolding with seed content; init command for workflow bootstrapping |
| DOCS-03 | Documentation optimized for quick lookups and mgrep searches | Strict heading templates locked in CONTEXT.md; grep-consistent naming conventions decided | Workflow orchestration (doc-phase.md) to tie agent + init + Q&A together; slash command entry point |

---

## Key Patterns Inventory

Patterns the doc-phase plans reference and must follow:

| Pattern | Source File | Used By | How Doc-Phase Uses It |
|---------|-------------|---------|----------------------|
| Init dispatch | `init.cjs` + `gsd-tools.cjs` | plan-phase, execute-phase, review-phase | `init doc-phase` -> `cmdInitDocPhase` (Plan 02) |
| Context assembly (L1-L3) | `gather-synthesize.md` step 1 | All workflows | Core + capability + feature context for agent prompt |
| Artifact discovery via SUMMARY.md | `review-phase.md` step 3 | Review workflow | Doc agent reads summary key-files to find what to document |
| Q&A review loop | `plan-phase.md` step 9.5 | Plan and review workflows | User approves/edits generated docs before commit |
| Agent definition skeleton | `gsd-review-enduser.md` | All v2 agents | Agent frontmatter + structured sections |
| Slash command entry point | `commands/gsd/review-phase.md` | Review workflow | `commands/gsd/doc-phase.md` (Plan 03) |
| Workflow orchestration | `review-phase.md` | Review pipeline | Single-agent variant for doc-phase.md (Plan 03) |

---

*Researched: 2026-02-28*
*Agent: gsd-research-system*
*Confidence: HIGH -- all findings sourced from direct file inspection*
