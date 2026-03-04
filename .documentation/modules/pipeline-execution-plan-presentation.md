---
type: module-doc
built-from-code-at: d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
last-verified: 2026-03-04
---

## Module: planner-reference.md

## Purpose: [derived]

Reference file for the gsd-planner agent: PLAN.md frontmatter schema, task anatomy, PLAN.md template, goal-backward methodology, dependency graph and wave assignment, context budget rules, self-critique protocol, discovery levels, checkpoint templates, gap closure mode, revision mode, and structured return formats. Located at `get-shit-done/references/planner-reference.md`.

**Delta (plan-presentation):** Planning Complete return format extended with two new sections between Plans Created table and Findings: `### Justification` (ordering rationale, approach rationale, KISS rationale — all claims must cite REQ IDs, dependency edges, or file paths) and `### Round 1 Fixes` (ADR-format entries per fix: Context/Decision/Consequence; fallback string "No Round 1 fixes applied" when zero). Self-critique protocol Round 1 instruction qualified: "Do not surface Round 1 fixes to the user mid-task — capture them in `### Round 1 Fixes` for the orchestrator's post-task rendering."

## Exports: [derived]

This is a reference document (not executable code). It defines the following contracts consumed by gsd-planner and plan.md:

- **PLAN.md frontmatter schema:** `phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `requirements`, `user_setup`, `must_haves` (truths/artifacts/key_links)
- **Task anatomy (v2):** 5 required fields: `name`, `reqs`, `files`, `action`, `done`; plus `verify`
- **Task types:** `auto`, `checkpoint:human-verify`, `checkpoint:decision`, `checkpoint:human-action`
- **Task sizing:** 15-60 minute Claude execution time per task; 2-3 tasks per plan
- **Goal-backward methodology:** 5-step process (extract REQ IDs, state goal, derive truths, derive artifacts, derive wiring)
- **Wave assignment algorithm:** `wave = max(wave[dep] for dep in depends_on) + 1`
- **Self-critique protocol:** Round 1 (silent fixes, captured in return section) and Round 2 (surface issues as findings)
- **Structured return formats:**
  - **Planning Complete block:** Wave Structure table, Plans Created table, `### Justification` section, `### Round 1 Fixes` section, Findings, Next Steps
  - **Gap Closure Plans Created block:** separate return format for `--gaps` mode
- **Justification schema:** 3 fields: `Ordering rationale`, `Approach rationale`, `KISS rationale` — each must cite specific REQ IDs, dependency edges, or file paths
- **Round 1 Fixes schema:** one entry per fix: `Context` (what was wrong), `Decision` (what changed), `Consequence` (REQ IDs affected, downstream impact); or "No Round 1 fixes applied"

## Depends-on: [derived]

- None. planner-reference.md is a standalone reference consumed by other modules via @-link injection.

## Constraints: [authored]

- Extension-only pattern: existing return format fields (Wave Structure, Plans Created, Findings, Next Steps) are unchanged. New sections insert between Plans Created and Findings.
- Justification is generated during planning when the planner has full reasoning context -- it cannot be reconstructed after the planner Task() completes.
- Round 1 fixes are not surfaced mid-task. They are captured in the `### Round 1 Fixes` section and returned to the orchestrator after the planner Task() completes.
- All Justification claims must pass the "why this specific plan?" test -- content applicable to any plan is boilerplate and fails the grounding check.
- Self-critique is exactly 2 rounds. No Round 3.

## WHY: [authored]

**Justification in planner return, not orchestrator (research finding, FN-01):** The planner agent has full reasoning context in a fresh 200k window during planning. By the time plan.md step 8.3 runs, the orchestrator's context only contains the finished PLAN.md files -- not the reasoning that produced them. Justification must be captured in the planner's completion message or it is lost.

**ADR format for Round 1 fix entries (FN-02):** Each fix is a decision with context (what was wrong), decision (what changed), and consequence (REQ IDs affected). This mirrors the Context/Decision/Consequence pattern from Architectural Decision Records. It makes each fix independently verifiable and traceability is preserved back to REQ IDs.

**Insertion point between Plans Created and Findings (01-SUMMARY key decision):** Placing the two new sections before Findings preserves any downstream parsers keyed on the Findings block position. The Findings block remains the last structured section before Next Steps.

---

## Module: ui-brand.md

## Purpose: [derived]

Visual pattern reference for user-facing GSD output: stage banners, checkpoint boxes, status symbols, progress display, spawning indicators, Next Up blocks, error boxes, tables, ASCII flow diagrams, and anti-patterns. Loaded by orchestrators as required_reading. Located at `get-shit-done/references/ui-brand.md`.

**Delta (plan-presentation):** New `## ASCII Flow Diagrams` section added at line 152 (before Anti-Patterns). Complexity gate rule, notation, multi-dependency convergence syntax, and 5 display rules documented. New anti-pattern entry added: "Flow diagrams on trivially simple plans (1 wave, ≤2 plans)". Phrasing standardized to "≤2 plans" across all three locations in the file (review finding 6).

## Exports: [derived]

This is a reference document. It defines the following visual conventions:

- **Stage banners:** `━━━ GSD ► {STAGE NAME} ━━━` format; named stage values enumerated
- **Checkpoint boxes:** 62-character width, `╔══╗` frame; 3 types (Verification Required / Decision Required / Action Required)
- **Status symbols:** `✓ ✗ ◆ ○ ⚡ ⚠ 🎉`
- **Progress display:** capability/feature level (bar), task level (N/total), plan level (N/total)
- **Spawning indicators:** `◆ Spawning...` / `✓ Complete:` pattern
- **Next Up block:** always at end of major completions; `## ▶ Next Up` heading with copy-paste command
- **Error box:** `╔══ ERROR ══╗` frame with "To fix:" resolution
- **Tables:** standard markdown table format with status symbol columns
- **ASCII flow diagrams (new):**
  - Render only when 2+ waves OR 3+ plans (complexity gate)
  - Omit for trivially simple plans (1 wave, ≤2 plans)
  - Notation: `[Plan-NN: objective summary] --> [Plan-NN: objective summary]`
  - Multi-dependency convergence: `(after Plan-XX + Plan-YY)` parenthetical
  - No box-drawing characters (`┌─┐`) -- `[brackets]` and `-->` only
  - Objective summary: 3-6 words
- **Anti-patterns:** varying widths, mixed banner styles, missing `GSD ►` prefix, random emoji, missing Next Up block, flow diagrams on trivially simple plans

## Depends-on: [derived]

- None. ui-brand.md is a standalone reference consumed by workflows and agents via @-link injection.

## Constraints: [authored]

- No box-drawing characters in flow diagram notation. Must render in monospace terminal without Unicode box-drawing support.
- Complexity gate is a "should" rule enforced by the Anti-Patterns list. No CLI enforcement.
- Convention, not template -- the notation is a guide for agent judgment, not a rigid schema.

## WHY: [authored]

**Complexity gate alongside the notation (02-SUMMARY key decision):** Documenting the gate condition (2+ waves OR 3+ plans) in the same section as the notation ensures callers self-regulate. Without the gate, agents would produce flow diagrams for every plan including single-task trivial cases where the diagram adds noise.

**Standardized to ≤2 plans (review finding 6):** Three locations in the file described the omit threshold: "1-2 plans" (ambiguous -- could imply both conditions required) and "≤2 plans" (unambiguous inequality). Normalized all three to "≤2 plans" to eliminate the ambiguous phrasing.
