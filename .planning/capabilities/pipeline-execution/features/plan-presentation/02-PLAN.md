---
phase: plan-presentation
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/references/ui-brand.md
autonomous: true
requirements: [TC-03, FN-06]
must_haves:
  truths:
    - "ui-brand.md contains an ASCII Flow Diagrams section with the simple arrow notation [Plan-NN: objective] --> [Plan-NN: objective]"
    - "The complexity gate rule (render only when 2+ waves OR 3+ plans) is documented"
    - "The omit rule for trivially simple plans (1 wave, 1-2 plans) is documented"
    - "ui-brand.md stays within 10-15% token growth ceiling of its pre-edit size"
  artifacts:
    - path: "get-shit-done/references/ui-brand.md"
      provides: "Canonical ASCII flow notation that plan.md step 8.6 references when rendering wave diagrams"
  key_links:
    - from: "get-shit-done/references/ui-brand.md (ASCII Flow Diagrams section)"
      to: "get-shit-done/workflows/plan.md (step 8.6 wave flow diagram)"
      via: "complexity gate + arrow notation convention"
      pattern: "ASCII Flow Diagrams"
---

<objective>
Add a lightweight ASCII flow diagram convention to ui-brand.md. This standardizes the notation that plan.md step 8.6 will use when rendering conditional wave flow diagrams — no formal template, just a convention with example and rules.

Purpose: plan.md step 8.6 needs a reference point for consistent flow notation. Centralizing it in ui-brand.md makes it reusable across GSD output stages.
Output: ui-brand.md with new ASCII Flow Diagrams section.
</objective>

<execution_context>
@/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/plan-presentation/FEATURE.md
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/plan-presentation/RESEARCH.md

<interfaces>
From FEATURE.md FN-06 and TC-03:
- Notation: [Plan-NN: objective] --> [Plan-NN: objective]
- Complexity gate: render only when 2+ waves OR 3+ plans
- Omit for trivially simple plans (1 wave, 1-2 plans) — KISS
- No box-drawing characters (┌─┐ etc.) for flows
- Must render correctly in monospace terminal
- This is a convention, not a template — inline generation, no fill-in-the-blank
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Add ASCII Flow Diagrams section to ui-brand.md</name>
  <reqs>TC-03, FN-06</reqs>
  <files>get-shit-done/references/ui-brand.md</files>
  <action>
  1. Read the full file. Record current line count.

  2. Find the most logical insertion point. The file has sections: Stage Banners, Checkpoint Boxes, Status Symbols, Progress Display, Spawning Indicators, Next Up Block, Error Box, Tables, Anti-Patterns. Insert the new section BEFORE "Anti-Patterns" (second-to-last section).

  3. Add the following new section. Keep the total addition to ~20 lines to stay within the Goldilocks ceiling:

  ```
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

  4. Add one Anti-Pattern entry to the existing Anti-Patterns list: "- Flow diagrams on trivially simple plans (1 wave, ≤2 plans)"

  5. After edits: count new line total. Verify the file grew by no more than 15% of the original line count. The file is ~161 lines; 15% = ~24 lines. The new section + anti-pattern should be well within this.

  6. Do NOT modify any existing sections (Stage Banners, Status Symbols, etc.).
  </action>
  <verify>
    <automated>grep -n "ASCII Flow Diagrams" /Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md && grep -n "complexity gate\|2+ waves\|3+ plans" /Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md && grep -n "trivially simple" /Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md && grep -n "\-\->" /Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md</automated>
    <manual>Confirm the section appears before Anti-Patterns. Confirm the notation example uses [brackets] and --> only (no box-drawing chars). Confirm complexity gate and omit rule are both documented.</manual>
  </verify>
  <done>grep returns matches for "ASCII Flow Diagrams", complexity gate language, "trivially simple", and "-->" arrow notation. File line count is within 15% of pre-edit count.</done>
</task>

</tasks>

<verification>
ui-brand.md modified with:
- ASCII Flow Diagrams section present before Anti-Patterns
- Complexity gate rule (2+ waves OR 3+ plans)
- Omit rule for simple plans
- Arrow notation example with multi-dependency convergence
- New anti-pattern entry for forcing diagrams on simple plans
- Token growth within Goldilocks ceiling
</verification>

<success_criteria>
- ui-brand.md has ASCII Flow Diagrams section with canonical [Plan-NN: objective] --> notation
- Complexity gate (2+ waves OR 3+ plans) documented
- Omit rule for trivially simple plans documented
- No box-drawing character anti-pattern documented
- File within 10-15% token growth ceiling
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/plan-presentation/02-SUMMARY.md`
</output>
