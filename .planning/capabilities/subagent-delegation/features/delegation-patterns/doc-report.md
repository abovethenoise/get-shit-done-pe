---
type: doc-report
feature: subagent-delegation/delegation-patterns
date: 2026-03-07
explorer_manifest:
  inline-clarity: success
  architecture-map: success
  domain-context: success
  agent-context: success
  automation-surface: success
  planning-hygiene: success
---

# Lens: refactor

Focus on structural changes -- what moved, what was renamed, behavioral equivalence.

---

## Inline Clarity

### Recommendation: Document why resolveModelInternal and resolveModelFromFrontmatter coexist

- **target_file**: get-shit-done/bin/lib/core.cjs
- **what_to_change**: Add comment above `resolveModelInternal` explaining it is the legacy path superseded by `resolveModelFromFrontmatter`. Note that init.cjs still calls it for 5 of 6 agents because agent files live at `~/.claude/agents/` (outside repo) and the full path is not trivially available in all contexts. State that frontmatter is authoritative per TC-02.
- **why**: Two model resolution functions coexist with no explanation. `resolveModelInternal` returns `sonnet` for planner; frontmatter says `opus`. A developer cannot tell if the inconsistency is intentional or a migration gap.
- **priority**: high
- **route**: inline-comment
- **expected_behavior**: `grep -c "Legacy\|Superseded\|frontmatter" get-shit-done/bin/lib/core.cjs` returns at least 1 match near the resolveModelInternal function.

**Deduplicated from**: inline-clarity F1, architecture-map F1, agent-context F4, automation-surface F1, domain-context F2. All identified the same dual-resolution inconsistency from different angles.

### Recommendation: Document or remove opus-to-inherit conversion in resolveModelInternal

- **target_file**: get-shit-done/bin/lib/core.cjs
- **what_to_change**: At line 305 (`return override === 'opus' ? 'inherit' : override`), either add a comment explaining why config overrides convert opus to inherit, or remove the ternary since review decisions confirmed opus is a valid model value.
- **why**: The conversion contradicts FN-01 (as amended by review) and delegation.md. `resolveModelFromFrontmatter` returns opus directly. The config-override path silently changes it. Without a comment, this looks like a bug.
- **priority**: high
- **route**: inline-comment
- **expected_behavior**: `grep -A2 "override === 'opus'" get-shit-done/bin/lib/core.cjs` shows either a rationale comment or the ternary is removed.

**Deduplicated from**: inline-clarity F2, automation-surface F2.

**Re-route**: automation-surface routed this to `memory-ledger`. This is a code-level "why" at a specific line, not a project-wide gotcha. Corrected to `inline-comment` (Tier 4).

### Recommendation: Document defensive sonnet fallback in resolveModelFromFrontmatter

- **target_file**: get-shit-done/bin/lib/core.cjs
- **what_to_change**: At `return fm.model || 'sonnet'`, add comment: "Defensive fallback -- delegation.md requires model field on all agents, but default to sonnet to avoid spawn failures if field is missing."
- **why**: delegation.md says "no fallback resolution" but the code has one. The contradiction is invisible without a comment.
- **priority**: medium
- **route**: inline-comment
- **expected_behavior**: `grep -B1 -A1 "fm.model || 'sonnet'" get-shit-done/bin/lib/core.cjs` shows a rationale comment.

### Recommendation: Annotate haiku row in delegation.md as reserved/unused

- **target_file**: get-shit-done/references/delegation.md
- **what_to_change**: Add note to the haiku routing row: "No current agents use haiku. Reserved for future lightweight tasks." Prevents readers from searching for nonexistent haiku consumers.
- **why**: A routing rule with zero consumers looks like dead documentation or a missing implementation. MEMORY.md records "haiku evaluated for all agents -- none suitable" but delegation.md does not.
- **priority**: low
- **route**: inline-comment
- **expected_behavior**: `grep -i "no current\|reserved" get-shit-done/references/delegation.md` returns at least 1 match near the haiku row.

**Deduplicated from**: domain-context F4, agent-context F2.

**Re-route**: agent-context routed this to `claude-md`. This is an inline annotation in a reference doc, not a CLAUDE.md behavioral rule. Corrected to `inline-comment` (Tier 4).

### Recommendation: Add conceptual categories to delegation.md model routing section

- **target_file**: get-shit-done/references/delegation.md
- **what_to_change**: Add brief rationale: "Opus agents perform judgment/synthesis/planning. Sonnet agents perform execution/gathering/verification." This replaces the orphaned "judge" vocabulary from planning artifacts.
- **why**: The model routing table lists agent-to-model mappings with no conceptual framework for why. The "judge vs executor" design rationale is invisible in the final artifact.
- **priority**: medium
- **route**: inline-comment
- **expected_behavior**: `grep -c "judgment\|synthesis\|execution\|gathering" get-shit-done/references/delegation.md` returns at least 2 matches.

---

## Architecture Map

### Recommendation: Add delegation.md to single-delegation workflow required_reading

- **target_file**: get-shit-done/references/delegation.md
- **what_to_change**: Add `delegation.md` to the `<required_reading>` block of `plan.md`, `execute-plan.md`, and `execute.md`. These workflows spawn single subagents but have no path to the anti-pattern guidance in delegation.md.
- **why**: EU-01 required a single clear delegation reference. The doc exists but single-delegation workflows cannot discover it. Only gather-synthesize workflows reach it via cross-reference.
- **priority**: high
- **route**: claude-md
- **expected_behavior**: `grep -l 'delegation.md' get-shit-done/workflows/plan.md get-shit-done/workflows/execute-plan.md get-shit-done/workflows/execute.md` returns all 3 files.

### Recommendation: Update INTEGRATIONS.md and STRUCTURE.md to remove deleted artifact references

- **target_file**: .planning/codebase/INTEGRATIONS.md
- **what_to_change**: Replace references to `MODEL_PROFILES` constant and `model-profiles.md` file (lines 73-79) with description of frontmatter-based resolution via `resolveModelFromFrontmatter`. Update STRUCTURE.md to replace deleted file entries (`model-profiles.md`, `model-profile-resolution.md`) with `delegation.md`.
- **why**: These codebase docs are read by agents during research phases. Stale references to deleted artifacts cause agents to look for files that do not exist.
- **priority**: medium
- **route**: artifact-cleanup
- **expected_behavior**: `grep 'model-profiles.md' .planning/codebase/INTEGRATIONS.md .planning/codebase/STRUCTURE.md` returns 0 matches.

**Re-route**: architecture-map routed this to `inline-comment`. These are codebase reference documents, not source code. Corrected to `artifact-cleanup`.

---

## Domain Context

### Recommendation: Record inherit-to-opus decision in delegation.md

- **target_file**: get-shit-done/references/delegation.md
- **what_to_change**: Add a one-line decision note: "We use explicit `opus` rather than `inherit` because it makes model assignment deterministic -- agents always get the specified model regardless of parent session." This captures the review-phase reversal from the original FN-01 spec.
- **why**: FEATURE.md says "prefer inherit for flexibility." delegation.md says "we use explicit values." The contradiction is unexplained. The decision to reject flexibility in favor of determinism is a meaningful design choice that should be traceable.
- **priority**: high
- **route**: decision-log (convention in reference doc -> Tier 2 delegation.md)
- **expected_behavior**: delegation.md contains text mentioning both "inherit" and "opus" with rationale for choosing opus.

**Re-route**: domain-context routed the dual-resolution finding (F2) to `decision-log` generically. Since this is a convention documented in a reference doc, it stays in delegation.md as a Tier 2 behavioral rule rather than routing to `.docs/architecture.md`.

### Recommendation: Document model resolution precedence in delegation.md

- **target_file**: get-shit-done/references/delegation.md
- **what_to_change**: Add a precedence statement to the Model Routing section: "Agent frontmatter `model` field is authoritative. When workflows pass `model=` in Task() calls, the Task parameter takes effect at spawn time. Ensure Task() values match frontmatter to avoid divergence."
- **why**: Two model resolution paths exist (frontmatter vs init.cjs/workflow Task params). When they disagree (frontmatter says opus, init says sonnet), there is no documented precedence rule.
- **priority**: high
- **route**: claude-md
- **expected_behavior**: delegation.md Resolution section contains a statement about Task() model parameter vs frontmatter precedence.

**Deduplicated from**: domain-context F2, automation-surface F3.

**Re-route**: automation-surface routed this to `memory-ledger`. This is a convention/rule for delegation behavior, not a project-wide gotcha. Corrected to `claude-md` (Tier 2 reference doc).

---

## Agent Context

### Recommendation: Create project-level CLAUDE.md with delegation anti-patterns

- **target_file**: CLAUDE.md (project root)
- **what_to_change**: Create a project-level CLAUDE.md containing the three delegation anti-pattern rules from delegation.md: (1) orchestrator must not read agent definitions, (2) pass paths not content, (3) never handle inline what should be delegated. Keep it under 200 lines per Tier 1 constraint.
- **why**: CLAUDE.md is loaded automatically at session start. The anti-patterns are behavioral constraints on the orchestrator that should be enforced before any workflow begins. Currently they exist only in delegation.md, which is discovered mid-workflow.
- **priority**: high
- **route**: claude-md (Tier 1 -- cross-project behavioral rules)
- **expected_behavior**: `test -f CLAUDE.md && grep -q "orchestrator" CLAUDE.md` returns 0.

### Recommendation: Resolve inherit vs explicit opus in workflow Task() calls

- **target_file**: get-shit-done/references/delegation.md
- **what_to_change**: Either update workflows (plan.md, review.md, doc.md) to use `model="opus"` in Task() calls for synthesizers, or document in delegation.md that `model="inherit"` is acceptable for Task-level opus agents since Claude Code resolves inherit to the parent session model (Opus).
- **why**: delegation.md says "we use explicit values" but three workflows pass `model="inherit"` for synthesizers. The convention should be explicit and consistent.
- **priority**: medium
- **route**: claude-md
- **expected_behavior**: Either all workflow Task calls use `model="opus"`, or delegation.md documents that `inherit` is acceptable for Task-level opus agents.

### Recommendation: Remove stale gsd-researcher.md reference from init.cjs

- **target_file**: get-shit-done/bin/lib/init.cjs
- **what_to_change**: Remove or update the `researcher_model` resolution at line 426. `gsd-researcher.md` does not exist -- research was split into 6 dimension-specific agents. The `resolveModelFromFrontmatter` fallback silently returns sonnet for a nonexistent file.
- **why**: Stale reference to a pre-split agent. Silently falls back to sonnet, masking the fact that the referenced agent does not exist.
- **priority**: medium
- **route**: artifact-cleanup
- **expected_behavior**: `grep -c "gsd-researcher\.md" get-shit-done/bin/lib/init.cjs` returns 0.

---

## Automation Surface

### Recommendation: Create agent frontmatter model field validation hook

- **target_file**: (new hook or linter target)
- **what_to_change**: Create a hook or linter rule that validates: (1) all `~/.claude/agents/gsd-*.md` files have a `model:` field in frontmatter, (2) the value is one of {sonnet, opus, haiku, inherit}.
- **why**: TC-02 verification was done manually during review. As agent count grows, manual verification does not scale. The planner/quality-reviewer model mismatch was caught by review but could have been caught automatically.
- **priority**: medium
- **route**: hook
- **expected_behavior**: A pre-commit or CI check that runs `grep -L '^model:' ~/.claude/agents/gsd-*.md` and fails if any files are returned.

---

## Planning Hygiene

### Recommendation: Update 02-SUMMARY to reflect review-phase changes

- **target_file**: .planning/capabilities/subagent-delegation/features/delegation-patterns/02-SUMMARY.md
- **what_to_change**: (1) Change all 6 judge agent model values from `inherit` to `opus` in the summary table. (2) Update verification line from "6 agents: model: inherit" to "6 agents: model: opus". (3) Replace "All role_type values unchanged" with "role_type removed from all 20 agent files (review decision, Finding 3)." (4) Add a post-review annotation at the top referencing review-decisions.md.
- **why**: The summary is the primary artifact future planners read. It currently describes a state (inherit models, preserved role_type) that never shipped.
- **priority**: high
- **route**: artifact-cleanup
- **expected_behavior**: `grep -c "inherit" .planning/capabilities/subagent-delegation/features/delegation-patterns/02-SUMMARY.md` returns 0. Summary contains reference to review-decisions.md.

**Deduplicated from**: planning-hygiene F1, F2, automation-surface F5.

**Re-route**: automation-surface routed this to `memory-ledger`. This is a directory-scoped planning artifact, not a project-wide gotcha. Corrected to `artifact-cleanup`.

### Recommendation: Add staleness annotations to RESEARCH.md

- **target_file**: .planning/capabilities/subagent-delegation/features/delegation-patterns/RESEARCH.md
- **what_to_change**: (1) Add note at top: "Post-review: resolveModelFromRole renamed to resolveModelFromFrontmatter; ROLE_MODEL_MAP removed from core.cjs." (2) Add note to conflict resolution section: "User decided during review to use explicit opus instead of inherit. See review-decisions.md Finding 3."
- **why**: Future research phases re-reading this file will grep for `resolveModelFromRole` and find nothing. The inherit recommendation was overridden but the override is not noted.
- **priority**: medium
- **route**: artifact-cleanup
- **expected_behavior**: RESEARCH.md contains staleness annotations about the rename and the inherit-to-opus override.

### Recommendation: Update FEATURE.md requirements to reflect review decisions

- **target_file**: .planning/capabilities/subagent-delegation/features/delegation-patterns/FEATURE.md
- **what_to_change**: (1) FN-01: Change "Receives: Agent role_type" to "Receives: Agent model field from YAML frontmatter". (2) FN-02: Change "model=inherit" to "model=opus". (3) FN-03: Change "model per role_type" to "model per agent frontmatter". (4) Update trace table from "draft" to completed status.
- **why**: FEATURE.md is the requirement spec. It currently describes routing via role_type (removed) and model=inherit (changed to opus). The trace table shows "draft" for completed requirements.
- **priority**: medium
- **route**: artifact-cleanup
- **expected_behavior**: `grep -c "role_type" .planning/capabilities/subagent-delegation/features/delegation-patterns/FEATURE.md` returns 0 outside the Decisions section. Trace table shows completion status.

### Recommendation: Remove orphaned Model Resolution section header from core.cjs

- **target_file**: get-shit-done/bin/lib/core.cjs
- **what_to_change**: Delete the empty section header `// --- Model Resolution ----` at lines 16-17 (leftover from ROLE_MODEL_MAP removal). The actual model resolution functions live under the "Roadmap & model utilities" header at line 263.
- **why**: The orphaned header creates a false expectation that model resolution code lives near the top of the file.
- **priority**: low
- **route**: artifact-cleanup
- **expected_behavior**: `grep -c "Model Resolution" get-shit-done/bin/lib/core.cjs` returns 0 or 1 (co-located with actual functions only).

**Re-route**: inline-clarity routed this to `inline-comment`. The recommendation is to delete dead code, not add a "why" comment. Corrected to `artifact-cleanup`.
