---
type: module-doc
built-from-code-at: d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
last-verified: 2026-03-04
---

## Module: doc.md

## Purpose: [derived]

Orchestrate the documentation pipeline for a feature using a gather-synthesize pattern: spawn 5 parallel focus-area explorers, consolidate via a synthesizer, present recommendations grouped by focus area via Q&A loop, commit approved outputs. Located at `get-shit-done/workflows/doc.md`.

**Delta (doc-writer-overhaul):** Step 4 replaced single-agent doc writer spawn with 5 parallel gsd-doc-writer explorer Task() blocks + 1 synthesizer Task() block. Steps 5-12 preserved (consume doc-report.md which retains same format). `gather-synthesize.md` added to required_reading. Q&A loop updated from "iterate generated docs" to "iterate recommendations grouped by focus area." `key_constraints` updated to remove single-agent note, add gather-synthesize parameters.

## Exports: [derived]

This is a workflow prompt. It exposes the following interface:

- **Inputs:** `CAPABILITY_SLUG`, `FEATURE_SLUG`, `LENS`
- **CLI init:** `gsd-tools.cjs init feature-op` with `doc` operation — returns `commit_docs`, `capability_slug`, `capability_dir`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_context`, `has_plans`, `state_path`, `roadmap_path`
- **Steps:**
  1. Initialize (CLI init, mkdir `.documentation/modules`, `.documentation/flows`, `.documentation/capabilities`, `{feature_dir}/doc/`)
  2. Context assembly (Layers 1-4: core, capability, feature, lens-specific doc focus)
  3. Locate feature artifacts (SUMMARY.md scan, review synthesis check, git diff supplement)
  4. Spawn 5 parallel explorer Task() blocks + 1 synthesizer Task() block (gather-synthesize)
  5. Verify output (doc-report.md exists and non-empty)
  6. Impact discovery (collect recommendations referencing existing .documentation/ files)
  7. Present recommendations via Q&A loop (AskUserQuestion, grouped by focus area)
  8. Present impact flags
  9. Update FEATURE.md trace table
  10. Commit approved docs
  11. Output path targets (dynamic — depends on user approvals)
  12. Completion display
- **Explorer Task() blocks in Step 4 (parallel, model: sonnet):**
  - `gsd-doc-writer` (focus: code-comments) — writes `{feature_dir}/doc/code-comments-findings.md`
  - `gsd-doc-writer` (focus: module-flow-docs) — writes `{feature_dir}/doc/module-flow-docs-findings.md`
  - `gsd-doc-writer` (focus: standards-decisions) — writes `{feature_dir}/doc/standards-decisions-findings.md`
  - `gsd-doc-writer` (focus: project-config) — writes `{feature_dir}/doc/project-config-findings.md`
  - `gsd-doc-writer` (focus: friction-reduction) — writes `{feature_dir}/doc/friction-reduction-findings.md`
- **Synthesizer Task() block in Step 4 (model: inherit):**
  - `gsd-doc-writer` (role: synthesizer) — writes `{feature_dir}/doc-report.md`
- **Abort threshold:** 3+ of 5 explorer failures = abort
- **Retry:** each failed explorer retried once before abort check
- **Q&A options per recommendation:** Approve / Edit / Reject
- **Outputs:** `{feature_dir}/doc-report.md`, `{feature_dir}/doc/` (5 explorer findings files), approved doc artifacts at paths specified in recommendations

## Depends-on: [derived]

- `gsd-tools.cjs` — CLI tool for initialization
- `agents/gsd-doc-writer.md` — Dual-role explorer/synthesizer agent
- `workflows/gather-synthesize.md` — Pattern reference (required_reading)
- `references/ui-brand.md` — UI branding reference (required_reading)

## Constraints: [authored]

- Q&A happens in doc.md via AskUserQuestion — NOT inside doc agent.
- Gate docs are read-only validation inputs.
- User approval required before committing any recommendation.
- Abort threshold 3/5 matches the gather-synthesize.md canonical ratio — not 50% (avoids ambiguity at exactly 2 failures).
- mkdir of `{FEATURE_DIR}/doc` required before explorer spawns.

## WHY: [authored]

**Gather-synthesize over single-agent (FN-01, TC-01):** Single-agent doc writer cannot partition investigation across code comments, docs, standards, config, and friction-reduction simultaneously without cross-concern bleed. Five scoped explorers with exclusive focus areas produce cleaner, more complete coverage. Same pattern as research stage (plan.md) and review stage (review.md).

**doc-report.md format preserved as downstream contract (FN-05, FN-06):** The Q&A loop in Steps 7-8 and the auto-chain in review.md Step 12 both consume doc-report.md. Preserving the format means all downstream mechanics are unchanged — only the production path (single agent vs. gather-synthesize) differs.

**gather-synthesize.md added to required_reading (review Finding 3, accepted):** doc.md implements the gather-synthesize pattern (abort ratios, manifest handling, retry logic). review.md already signals this via required_reading. Omitting the reference leaves the orchestrating agent without its authoritative pattern reference.

---

## Module: gsd-doc-writer.md

## Purpose: [derived]

Dual-role agent for the doc stage. In explorer mode: investigates one assigned focus area and writes structured findings. In synthesizer mode: consolidates all explorer findings, deduplicates, orders by impact, writes doc-report.md. Located at `agents/gsd-doc-writer.md`.

**Delta (doc-writer-overhaul):** Fully rewritten from single-role doc writer to dual-role explorer/synthesizer. Role determined by `Role:` field in task_context. Focus area scope boundaries added with exclusive partition model. Explorer output format (YAML frontmatter + Finding entries) and synthesizer output format (doc-report.md with explorer_manifest) defined. Section Ownership Model (derived/authored tags) retained for synthesizer use when generating module/flow docs. "Requirement Layer Awareness" section removed (was review-stage content). `doc_context` tag adopted for lens context (fixes framing_context mismatch). Conflict priority removed (inapplicable to exclusive partitions). Inline scope definitions removed from Task() prompts — agent definition is single source of truth for scope.

## Exports: [derived]

This is an agent definition. It exposes the following interface:

- **Role dispatch:** `Role: explorer` | `Role: synthesizer` (from task_context)
- **Explorer inputs (via task_context):** `Role`, `Focus area`, `Feature artifacts`, output path
- **Explorer scope assignments:**
  - `code-comments` — source files modified in the change; reads actual source files; checks function docstrings, inline explanations, parameter notes
  - `module-flow-docs` — .documentation/ module and flow docs; works from SUMMARYs and review synthesis; checks for missing/stale docs
  - `standards-decisions` — new patterns or architectural decisions; reads existing .documentation/ and CLAUDE.md for drift; excludes config freshness
  - `project-config` — CLAUDE.md fixes, config drift, stale instructions; excludes new pattern identification
  - `friction-reduction` — hooks, skills, automation opportunities from workflow patterns in SUMMARYs; excludes changes to the implemented feature itself
- **Explorer output:** `{feature_dir}/doc/{focus-area}-findings.md` — YAML frontmatter (`focus_area`, `feature`, `date`) + Finding entries (`target_file`, `current_state`, `recommended_change`, `rationale`)
- **Synthesizer inputs:** explorer findings files manifest with per-file status
- **Synthesizer output:** `{feature_dir}/doc-report.md` — YAML frontmatter (`type`, `feature`, `date`, `explorer_manifest`) + focus area groups + Impact Flags section
- **Recommendation fields (synthesizer):** `target_file`, `what_to_change`, `why`, `priority` (high/medium/low)
- **Tools:** Read, Write, Bash, Grep, Glob

## Depends-on: [derived]

- `workflows/doc.md` — orchestrator that spawns this agent in both roles

## Constraints: [authored]

- Explorer scope is exclusive — no cross-area overlap. Overlap produces duplicates the synthesizer cannot cleanly resolve.
- code-comments explorer reads actual source files; all other explorers work from SUMMARYs and review artifacts.
- Explorer must write something even when no findings exist (explain what was checked and why no gaps were found).
- Failed explorer dimensions documented as gaps in doc-report.md — synthesizer does not fabricate findings for failed explorers.
- Section Ownership Model enforced: `[derived]` sections overwritten freely, `[authored]` sections never overwritten; untagged sections treated as authored.

## WHY: [authored]

**Single agent handles both explorer and synthesizer roles (TC-01):** Adding a separate synthesizer agent would create a new file with no behavioral difference from a prompted gsd-doc-writer. Role differentiation via task_context `Role:` field follows the same approach as research gatherers using dimension-specific prompts with the same agent type.

**doc_context tag adopted, framing_context dropped (review Finding 2, accepted):** The canonical gather-synthesize.md tag is `<framing_context>`, but doc.md uses `<doc_context>` to carry lens + artifact list together. The agent condition updated to match what it actually receives, eliminating the broken activation condition where the agent checked for a tag name it was never sent.

**Conflict priority removed (review Finding 4, accepted):** Exclusive scope partitions cannot produce inter-dimension conflicts by design (TC-03). The conflict priority ordering — copied from the review pattern where reviewers can disagree on the same finding — is semantically inapplicable here. Its presence implied a dispute model that the architecture deliberately avoided.

---

## Module: doc.md (command)

## Purpose: [derived]

Standalone skill entry point for the doc workflow. Resolves a feature or capability slug, infers LENS from available context, and routes to doc.md workflow invocation — at feature level (single feature) or capability level (all reviewed features). Also receives LENS from pipeline auto-chain (review.md Step 12). Located at `commands/gsd/doc.md`.

## Exports: [derived]

This is a skill definition. It exposes the following interface:

- **Invocation forms:** `/gsd:doc`, `/gsd:doc {cap/feat}`, `/gsd:doc {cap}`
- **$ARGUMENTS:** optional — feature slug, capability slug, or empty
- **Slug resolution:** `gsd-tools.cjs slug-resolve $ARGUMENTS` — returns `resolved`, `type`, `capability_slug`, `feature_slug`, `candidates`, `reason`
- **Resolution outcomes:** feature (go to feature-level), capability (go to capability-level), ambiguous (present candidates via AskUserQuestion), no_match (stop)
- **No-arg inference path:**
  1. Read `STATE.md` Session Continuity "Stopped at:" line — extract `{cap}/{feat}` if deterministic
  2. Fallback: `git log --oneline -10 --grep="docs|feat|fix"` — parse `{capability}/{feature}` from commit message patterns
  3. Fallback: AskUserQuestion free-text prompt
- **LENS inference chain (stop at first match):**
  1. Pipeline context — LENS passed as input (auto-chain from framing-pipeline)
  2. RESEARCH.md frontmatter — `lens:` field value
  3. Default — `"enhance"`
- **Feature-level:** invokes `doc.md` workflow for single feature with CAPABILITY_SLUG, FEATURE_SLUG, LENS
- **Capability-level:** reads `CAPABILITY.md` features table, gates on `review/synthesis.md` existence per feature, iterates sequentially, displays progress `GSD > DOCUMENTING: {cap}/{feat} ({N}/{total})`

## Depends-on: [derived]

- `gsd-tools.cjs` — slug resolution
- `workflows/doc.md` — workflow invoked at feature and capability level
- `.planning/STATE.md` — session continuity for no-arg inference
- `.planning/capabilities/{cap}/CAPABILITY.md` — features table for capability-level routing

## Constraints: [authored]

- Capability-level uses inline iteration — not capability-orchestrator.md. The orchestrator dispatches the full 6-stage pipeline per feature, which would incorrectly re-run research/plan/execute/review.
- No-arg path user prompt fallback is the terminal case (STATE.md then git log then ask).
- LENS defaults to "enhance" when no pipeline context and no RESEARCH.md `lens:` field — most common standalone use case is "what docs need updating after recent work."
- Skill follows the same structural pattern as /gsd:plan, /gsd:execute, /gsd:review.

## WHY: [authored]

**RESEARCH.md frontmatter as LENS fallback (TC-02):** FEATURE.md has no `lens:` field. STATE.md `pipeline_position` is free-form text, not machine-parseable. RESEARCH.md frontmatter is the reliable fallback — it carries the `lens:` field written during research synthesis and is stable after execution.

**git log fallback added to no-arg path (review Finding 7, accepted):** TC-02 spec listed "STATE.md session continuity or recent git commits" as the inference sources. Original implementation used only STATE.md and fell directly to user prompt. git log fallback added as intermediate step: parses `{capability}/{feature}` patterns from recent commit messages before prompting the user.
