# Technical Trace: plan-presentation

**Feature:** pipeline-execution / plan-presentation
**Reviewer:** technical-trace
**Date:** 2026-03-04

---

## Phase 1: Requirements Internalized

| TC-ID | Technical Specification |
|-------|------------------------|
| TC-01 | planner-reference.md return format extended with `### Justification` (ordering/approach/KISS, grounded in REQ IDs) and `### Round 1 Fixes` (ADR-format). Extension only — existing fields and planner algorithm untouched. |
| TC-02 | plan.md step 8 restructured: 8.3 shows narrative before findings, new deep-dive step outside iteration budget, "I want changes" re-spawn must explicitly request justification regeneration, 8.3 output contract (accept/edit/dismiss -> 8.4/8.5) and 3-iteration max unchanged. |
| TC-03 | ui-brand.md gains ASCII flow diagram convention: `[brackets]` + `-->` only, no box-drawing characters, complexity gate (2+ waves or 3+ plans), lightweight addition. |

Additional checks: token growth ceiling (10-15% per file), no unrelated section modifications, cross-reference consistency between planner-reference.md sections and plan.md step 8.

---

## Phase 2: Trace Against Code

### TC-01: planner-reference.md return format extension

**Verdict:** met (proven)

**Evidence:**

- `get-shit-done/references/planner-reference.md:395-418` — diff commit f064a0d added the following block between the `### Plans Created` table and `### Findings`:

```markdown
### Justification

**Ordering rationale:** {why waves/tasks are sequenced this way — cite dependency edges and REQ IDs}
**Approach rationale:** {why this approach vs alternatives — cite RESEARCH.md findings and project constraints}
**KISS rationale:** {why this is the simplest approach that satisfies requirements — cite specific trade-offs rejected}

### Round 1 Fixes

{If fixes applied, one entry per fix:}
- **Context:** {what was wrong before the fix}
  **Decision:** {what changed}
  **Consequence:** {REQ IDs affected, downstream impact}

{If no fixes:}
No Round 1 fixes applied.
```

  Reasoning: Both required sections are present with exactly the schema specified in FEATURE.md TC-01. The `### Justification` section has the three required sub-fields (ordering/approach/KISS). The `### Round 1 Fixes` section uses ADR-style entries (Context/Decision/Consequence) matching FN-02 specification.

- `get-shit-done/references/planner-reference.md:418` — `"The Justification section is generated during planning when the planner has full reasoning context across FEATURE.md, RESEARCH.md, and dependency edges. Round 1 fixes are captured during self-critique because they cannot be reconstructed after the planner Task() completes. All claims must reference specific REQ IDs, dependency edges, or file paths — generic statements fail the grounding check."`

  Reasoning: Prose paragraph explaining generation intent and grounding check is present as specified.

- `agents/gsd-planner.md:41` — `"Completion message also includes \`### Justification\` (ordering/approach/KISS rationale, grounded in REQ IDs) and \`### Round 1 Fixes\` (ADR-format entries for changes made during Round 1 self-critique) — see planner-reference.md Structured Return Formats for schema."`

  Reasoning: gsd-planner.md output_format block updated to instruct the planner agent to emit both sections.

- Existing fields in the Planning Complete block (`## PLANNING COMPLETE`, Wave Structure table, Plans Created table, Findings section, Next Steps) are unchanged — confirmed by diff showing only insertion between `Plans Created` table and `### Findings`.

- `get-shit-done/references/planner-reference.md:250-276` — Self-Critique Protocol section (Round 1 Fix Silently, Round 2 Surface Issues, Hard Stop) is byte-for-byte identical to pre-edit content. No algorithm changes.

- Size: 413 lines before, 431 lines after — 4.3% growth. Within 15% ceiling.

**Spec-vs-reality gap:** None.

---

### TC-02: plan.md workflow restructure

**Verdict:** met (proven)

**Evidence:**

**8.3 output contract preserved:**

- `get-shit-done/workflows/plan.md:263-265` — Section C of restructured 8.3 retains:

```markdown
For each finding (validation errors + planner self-critique Round 2), use AskUserQuestion:
- header: "Finding {N}/{total}"
- question: "[{category}] {description}\n\nSuggestion: {suggestion}\nAffected REQs: {reqs_affected}"
- options:
  - "Accept suggestion" — apply as-is
  - "Edit" — provide modified guidance
  - "Provide guidance" — tell planner what to change
  - "Dismiss" — not applicable
```

  Reasoning: Four-option per-finding AskUserQuestion format identical to pre-edit. Output contract to 8.4/8.5 (accepted suggestions, edits, guidance, dismissals) unchanged.

**3-iteration max unchanged:**

- `get-shit-done/workflows/plan.md:272` — `"Max 3 iterations of the 8.1-8.5 loop. If max reached with unresolved issues: surface for manual resolution."`

  Reasoning: Iteration boundary is still defined as the 8.1-8.5 loop. The loop scope (8.1 through 8.5) is identical to pre-edit.

**Deep-dive does not consume iteration budget:**

- `get-shit-done/workflows/plan.md:270` — `"If all findings accepted or dismissed: proceed to 8.7."` (skipping 8.6 entirely from the loop)
- `get-shit-done/workflows/plan.md:272` — `"Max 3 iterations of the 8.1-8.5 loop."`
- `get-shit-done/workflows/plan.md:274` — Deep-dive is step 8.6, structurally outside the `8.1-8.5` loop.

  Reasoning: Step 8.6 (deep-dive) is positioned after the 8.1-8.5 loop exits. The loop boundary is explicitly labeled `8.1-8.5`. A re-triggered iteration goes `back to 8.1` (line 269), not to 8.6. Deep-dive is outside the counted budget.

**"I want changes" re-spawn with explicit justification regeneration:**

- `get-shit-done/workflows/plan.md:312` — `"  - \"I want changes\" — re-spawn planner with collected feedback; re-spawn prompt must explicitly request justification regeneration"`

  Reasoning: The constraint from TC-02 is present verbatim as a sub-note on the "I want changes" option.

**Narrative before findings (step 8.3 restructured):**

- `get-shit-done/workflows/plan.md:238-261` — New three-part structure:
  - Part A: `"Display the \`### Justification\` section from the planner return (ordering rationale, approach rationale, KISS rationale). If missing (legacy or error): display "No justification available from planner.""`
  - Part B: `"Display the \`### Round 1 Fixes\` section verbatim (or "No Round 1 fixes applied")."`
  - Part C: findings loop, gated by: `"If findings list is empty: skip the loop entirely. Justification and Round 1 summary still render."`

  Reasoning: Narrative sections A and B are unconditional. Section C (findings loop) is conditional on findings existing. This satisfies TC-02's requirement that justification renders before findings, and that findings loop is the existing 8.3 mechanics preserved.

- Size: 335 lines before, 386 lines after — 15.2% growth. This is at the top boundary of the 10-15% ceiling stated in the additional checks. The commit message reported `69 insertions, 18 deletions` (net +51 lines), which confirms the measurement.

**Spec-vs-reality gap:** The token growth ceiling check specifies 10-15%. plan.md growth is 15.2%, which is marginally over the upper bound by 0.2 percentage points. This is a rounding-sensitive boundary condition. The spec says "within 10-15% of pre-edit size" — at 335 lines the 15% ceiling is 335 * 1.15 = 385.25, and the actual post-edit count is 386 lines. One line over the ceiling. This is flagged as a marginal overage, not a structural violation.

---

### TC-03: ui-brand.md flow diagram convention

**Verdict:** met (proven)

**Evidence:**

- `get-shit-done/references/ui-brand.md:152-171` — New `## ASCII Flow Diagrams` section:

```markdown
## ASCII Flow Diagrams

Use for wave dependency visualization. Render only when plan has **2+ waves OR 3+ plans** (complexity gate). Omit for trivially simple plans (1 wave, 1-2 plans).

**Notation:**
```
[Plan-01: objective summary] --> [Plan-02: objective summary]
                             --> [Plan-03: objective summary]

[Plan-04: objective summary] (after Plan-02 + Plan-03)
```

Rules:
- Use `-->` for sequential dependency
- Plans at same wave level appear on separate lines under a shared arrow column
- Parenthetical notes for multi-dependency convergence: `(after Plan-XX + Plan-YY)`
- No box-drawing characters (`┌`, `─`, `┐`) — use `[brackets]` and `-->` only
- Objective summary: 3-6 words, enough to identify the plan's purpose
```

  Reasoning: Notation uses `[brackets]` and `-->` only. No box-drawing characters (`┌`, `─`, `┐`) — these are explicitly prohibited in the rules and the rule cites the specific characters. Renders correctly in monospace terminal because it uses only standard ASCII.

- `get-shit-done/references/ui-brand.md:177` — Anti-patterns section gains: `"- Flow diagrams on trivially simple plans (1 wave, ≤2 plans)"`

  Reasoning: Convention registered in anti-patterns section for consistency enforcement.

- `get-shit-done/workflows/plan.md:300-303` — plan.md step 8.7 (Final Summary and Approval, Layer 3) references the convention:

```markdown
**Layer 3 — Visual plan architecture (conditional):**
If 2+ waves OR 3+ plans: render ASCII flow diagram (ui-brand.md notation):
  [Plan-NN: objective summary] --> [Plan-NN: objective summary]
Derive from PLAN.md `wave` and `depends_on` frontmatter. If 1 wave and ≤2 plans: omit.
```

  Reasoning: Cross-reference is consistent — plan.md references `ui-brand.md notation` and the inline example matches the convention exactly.

- Size: 160 lines before, 182 lines after — 13.7% growth. Within 15% ceiling.

**Spec-vs-reality gap:** None.

---

## Additional Technical Checks

### Token Growth Ceiling (10-15% per file)

| File | Before | After | Growth | Status |
|------|--------|-------|--------|--------|
| `get-shit-done/references/planner-reference.md` | 413 | 431 | 4.3% | within ceiling |
| `agents/gsd-planner.md` | 72 | 74 | 2.7% | within ceiling |
| `get-shit-done/references/ui-brand.md` | 160 | 182 | 13.7% | within ceiling |
| `get-shit-done/workflows/plan.md` | 335 | 386 | 15.2% | **marginally over** (386 vs 385.25 ceiling) |

plan.md is 1 line (0.2 percentage points) over the 15% ceiling. All other files are well within bounds.

### No Modifications to Unrelated Sections

- `get-shit-done/references/planner-reference.md`: diff shows insertion only within the Planning Complete return block. Self-Critique Protocol (lines 250-276), PLAN.md Template (lines 92-159), Goal-Backward Methodology, Dependency Graph, Context Budget Rules, Checkpoint Task Templates, Gap Closure Mode, Revision Mode, Context Section Rules sections — all identical to pre-edit. Confirmed via identical line numbers in both pre-edit and post-edit grep output.

- `get-shit-done/references/ui-brand.md`: diff shows insertion between Next Up Block section and Anti-Patterns section. Stage Banners, Checkpoint Boxes, Status Symbols, Progress Display, Spawning Indicators, Error Box, Tables sections — all unchanged.

- `get-shit-done/workflows/plan.md`: diff shows targeted replacement of step 8.3 and step 8.6, insertion of new 8.6, and renumbering of 8.7/8.8/8.9. Steps 1-7, research workflow (Step 5), context loading (Step 4), step 12 Final Status — all unchanged.

### Cross-Reference Consistency

The planner return format in `planner-reference.md` defines sections `### Justification` and `### Round 1 Fixes`. plan.md step 8.3 references these by exact name:

- `plan.md:244` — `"Display the \`### Justification\` section from the planner return"`
- `plan.md:248` — `"Display the \`### Round 1 Fixes\` section verbatim"`
- `plan.md:294` — `"Repeat ordering rationale, approach rationale, and KISS rationale from \`### Justification\`"`
- `plan.md:297` — `"Round 1 fixes from \`### Round 1 Fixes\`"`

Section names in planner-reference.md match what plan.md expects to parse. No naming divergence.

### Internal Inconsistency: Self-Critique Protocol vs Return Format

`planner-reference.md:264` still reads: `"Apply all fixes. Do not surface Round 1 fixes to the user."`

This sentence was part of the Round 1 algorithm (instructions to the planner during execution). The new `### Round 1 Fixes` section in the return format means fixes ARE surfaced — but only via the structured return, not during execution. The sentence refers to the planner not emitting fixes to the user mid-task; the return format section captures them for the orchestrator's post-task rendering. These are different moments. However, the instruction as written is literally contradicted by the new behavior: Round 1 fixes are now surfaced to the user via plan.md step 8.3.B. This is a documentation inconsistency in `planner-reference.md` — the Self-Critique Protocol section was not updated to acknowledge that Round 1 fixes are captured in the return format.

This is a cross-layer observation, not a TC-layer failure. The TC-01 constraint requires the algorithm be untouched, which it is. The stale instruction is a documentation gap.

**Cross-layer observation:** `planner-reference.md:264` — `"Do not surface Round 1 fixes to the user."` conflicts with the new `### Round 1 Fixes` return section at line 401. The sentence was not updated when the return format was extended. This creates an ambiguous instruction for the planner agent: the Round 1 algorithm says don't surface, but the return format schema instructs it to capture and return. In practice the planner should follow the return format schema (which is more specific), but the stale sentence could cause confusion.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | `planner-reference.md:395-418` — `### Justification` and `### Round 1 Fixes` added with exact schema; existing fields and algorithm untouched; 4.3% growth |
| TC-02 | met | `plan.md:238-312` — 8.3 restructured (narrative before findings), 8.6 deep-dive outside loop, 8.1-8.5 iteration cap preserved, "I want changes" explicitly requires justification regeneration |
| TC-03 | met | `ui-brand.md:152-171` — ASCII flow convention with brackets+arrows, no box-drawing characters, complexity gate, 13.7% growth |
| Token ceiling | marginal | `plan.md` at 15.2% vs 15% ceiling — 1 line over |
| Unrelated sections | met | All unrelated sections confirmed unchanged via diff analysis |
| Cross-references | met | Section names consistent between `planner-reference.md` and `plan.md` step 8 |
| Internal inconsistency | flagged | `planner-reference.md:264` stale instruction conflicts with new return format; cross-layer doc gap, not a TC failure |
