---
type: feature
capability: "pipeline-execution"
status: planning
created: "2026-03-04"
---

# Doc-Writer Overhaul

## Goal

Restructure the doc-writer stage from a single-agent writer to gather->synthesize pattern with parallel explorers by focus area. Add `/gsd:doc` standalone skill entry point. Expand recommendation scope to cover: code comments, .documentation, new standards/decisions, CLAUDE.md fixes, hooks/skills for friction reduction.

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| EU-02 | - | - | - | - | - | draft |
| EU-03 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| FN-03 | - | - | - | - | - | draft |
| FN-04 | - | - | - | - | - | draft |
| FN-05 | - | - | - | - | - | draft |
| FN-06 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |
| TC-02 | - | - | - | - | - | draft |
| TC-03 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: Doc recommendations cover the full impact surface

**Story:** As a GSD user, I want the doc stage to recommend updates across all impacted artifacts — not just .documentation files — so that nothing drifts silently after a feature lands.

**Acceptance Criteria:**

- [ ] Doc output includes recommendations for: code comments, .documentation modules/flows, new standards or decisions, CLAUDE.md fixes, hooks or skills that could reduce friction
- [ ] Each recommendation identifies the target file and what to change
- [ ] Recommendations are grouped by focus area so I can review by category

**Out of Scope:**

- Auto-applying recommendations (user approves each one)
- Changing the .documentation directory structure

### EU-02: Doc stage can run standalone

**Story:** As a GSD user, I want to run `/gsd:doc` outside the pipeline — so that I can generate documentation recommendations after any review completes, without re-running the full pipeline.

**Acceptance Criteria:**

- [ ] `/gsd:doc` works without being auto-chained from review
- [ ] Operates on the most recently reviewed feature(s) — uses committed execution artifacts (SUMMARYs, review synthesis, code diffs)
- [ ] Works at both feature level (`/gsd:doc {cap/feat}`) and capability level (`/gsd:doc {cap}`) — capability level runs doc for all reviewed features
- [ ] Output format is identical whether invoked standalone or via pipeline auto-chain

**Out of Scope:**

- Running doc without any prior execution/review artifacts existing

### EU-03: Doc output reflects the lens context

**Story:** As a GSD user, I want doc recommendations to reflect whether I just built something new, enhanced existing behavior, fixed a bug, or refactored — so that the documentation focus matches what actually changed.

**Acceptance Criteria:**

- [ ] When invoked via lens pipeline (new/enhance/debug/refactor), LENS propagates to explorers and shapes their investigation focus
- [ ] new: emphasis on end-to-end docs, architecture additions, new capability docs
- [ ] enhance: emphasis on what changed, updated modules/flows, decision rationale
- [ ] debug: emphasis on root cause documentation, failure modes, known issues
- [ ] refactor: emphasis on before/after architecture, migration notes, updated mappings
- [ ] When invoked standalone without lens context, defaults to "enhance" (most common post-review use case)

**Out of Scope:**

- Changing explorer focus area definitions per lens (lens shapes emphasis within each area, not which areas run)

## Functional Requirements

### FN-01: Parallel explorers by focus area

**Receives:** Feature artifacts (FEATURE.md, SUMMARYs, review synthesis, code files from git diff).

**Returns:** One findings file per focus area in `{feature_dir}/doc/`.

**Behavior:**

- Replace single doc-writer spawn with parallel explorer spawns (one per focus area)
- Each explorer investigates one focus area and writes a findings file
- Explorers run in parallel via explicit Task() blocks (same pattern as research gatherers)
- LENS propagated to each explorer prompt — shapes investigation emphasis per EU-03
- Explorer failure is non-fatal — synthesizer works with whatever findings arrive

### FN-02: Focus area definitions

**Receives:** Feature artifacts + lens context.

**Returns:** Focus-area-scoped investigation per explorer.

**Behavior:**

- Focus areas:
  1. **Code comments** — scan modified files for missing/stale inline documentation
  2. **Module & flow docs** — generate/update .documentation/ module and flow references
  3. **Standards & decisions** — identify new patterns, conventions, or architectural decisions worth codifying
  4. **Project config** — detect CLAUDE.md fixes, config drift, or stale instructions
  5. **Friction reduction** — recommend hooks, skills, or automation that could streamline repeated workflows
- Each focus area maps to one explorer agent spawn
- Focus areas are stable — not configurable per-run

### FN-03: Synthesizer produces unified recommendations

**Receives:** Explorer findings files from `{feature_dir}/doc/`.

**Returns:** `{feature_dir}/doc-report.md` with prioritized recommendations.

**Behavior:**

- Reads all explorer findings, deduplicates, resolves conflicts
- Each recommendation: target file, what to change, why, which focus area sourced it
- Recommendations ordered by impact (highest first)
- Synthesizer produces the same doc-report.md format the current single-agent produces — downstream Q&A loop unchanged

### FN-04: /gsd:doc skill entry point

**Receives:** Optional slug (capability or capability/feature). If omitted, detects most recently reviewed feature from STATE.md or git log.

**Returns:** Invokes doc.md workflow for resolved feature(s).

**Behavior:**

- Skill definition follows existing GSD skill pattern (slug-resolve → init → workflow invocation)
- Feature-level slug: runs doc for that single feature
- Capability-level slug: runs doc for all features with review artifacts (same orchestration pattern as execute/review)
- No slug: infers target from most recent review activity
- When invoked standalone: uses committed execution artifacts (SUMMARYs, review synthesis, code diffs) — no pipeline prerequisite
- When invoked via pipeline (new/enhance/debug/refactor): receives LENS from pipeline context, propagates to doc.md
- When invoked standalone: infers LENS from FEATURE.md or RESEARCH.md frontmatter if available, defaults to "enhance" if not determinable

### FN-05: doc.md workflow restructure

**Receives:** Feature context from init (same inputs as current doc.md).

**Returns:** Explorer findings + synthesized doc-report.md + Q&A approved artifacts.

**Behavior:**

- Steps 1-3 (init, context assembly, artifact location) preserved
- Step 4 replaced: spawn N parallel explorers via Task() blocks, then spawn synthesizer
- Steps 5-12 (verify, impact discovery, Q&A, commit) preserved — they consume doc-report.md which has the same format
- `key_constraints` updated: remove "Single-agent pipeline (NOT gather-synthesize)" note

### FN-06: Q&A review loop preserved

**Receives:** Synthesized doc-report.md with per-recommendation entries.

**Returns:** User decisions: approve/edit/reject per recommendation.

**Behavior:**

- Same AskUserQuestion loop as current doc.md Step 7
- Recommendations presented grouped by focus area (EU-01 AC)
- Approve/Edit/Reject options per recommendation
- Only approved recommendations committed
- No changes to the Q&A mechanics — only the input source changes (synthesized report vs single-agent report)

## Technical Specs

### TC-01: doc.md workflow restructure

**Intent:** Replace single doc-writer Task() with parallel explorer Task() blocks + synthesizer Task().

**Upstream:** doc.md Step 3 (artifact location) provides file lists, review synthesis, feature context.

**Downstream:** doc.md Step 5 (verify output) reads doc-report.md — format unchanged.

**Constraints:**

- Explorer Task() blocks follow the same pattern as research gatherers in plan.md Step 5 and review.md Step 4
- Each explorer: `subagent_type="gsd-doc-writer"`, `model="sonnet"`, scoped prompt per focus area
- Synthesizer: `subagent_type="gsd-doc-writer"`, `model="inherit"` (judge role)
- Existing gsd-doc-writer agent definition expanded with focus-area-aware prompting — no new agent files unless single agent can't handle both explorer and synthesizer roles
- 5 parallel explorers + 1 synthesizer = 6 Task() calls total

### TC-02: /gsd:doc skill definition

**Intent:** Standalone entry point for doc-writer workflow at both feature and capability level.

**Upstream:** User invokes `/gsd:doc`, `/gsd:doc {cap/feat}`, or `/gsd:doc {cap}`.

**Downstream:** doc.md workflow receives CAPABILITY_SLUG, FEATURE_SLUG (or list of features), LENS.

**Constraints:**

- Skill file at `.claude/commands/doc.md` (or equivalent skill location)
- Pattern: slug-resolve → route by type (feature vs capability) → invoke doc.md workflow
- Capability-level: iterates reviewed features via capability-orchestrator pattern (same as execute/review)
- No-arg invocation: reads STATE.md session continuity or recent git commits to infer target
- LENS defaults to "enhance" when not determinable from context (standalone invocation has no prior pipeline context)
- Follows same structure as existing /gsd:plan, /gsd:execute, /gsd:review skills

### TC-03: Explorer agent scope boundaries

**Intent:** Each explorer investigates one focus area without duplicating work across explorers.

**Upstream:** doc.md Step 4 provides each explorer with: feature artifacts, focus area assignment, file lists.

**Downstream:** Each explorer writes `{feature_dir}/doc/{focus-area}-findings.md`.

**Constraints:**

- Explorer output format: YAML frontmatter (focus_area, feature, date) + findings as structured entries
- Each finding: target file, current state, recommended change, rationale, REQ IDs if applicable
- Explorers must not overlap — the focus area assignment is the partition key
- Code comments explorer reads actual source files; others work from SUMMARYs and review artifacts
- Standards & decisions explorer reads existing .documentation/ and CLAUDE.md for drift detection

## Decisions

- Gather->synthesize pattern reused from research stage — proven parallel exploration model
- 5 focus areas (not 6) — keeps explorer count manageable while covering the full recommendation scope from the BRIEF
- Single gsd-doc-writer agent handles both explorer and synthesizer roles via prompt differentiation (same as research gatherers use dimension-specific prompts with shared agent type)
- doc-report.md format preserved as the contract between explorers/synthesizer and Q&A loop — minimizes downstream changes
- /gsd:doc defaults LENS to "enhance" when standalone — most common standalone use case is "what docs need updating after recent work"
