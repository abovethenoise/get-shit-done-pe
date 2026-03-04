---
phase: plan-presentation
plan: 03
type: execute
wave: 2
depends_on: [01, 02]
files_modified:
  - get-shit-done/workflows/plan.md
autonomous: true
requirements: [EU-01, EU-02, FN-03, FN-04, FN-05, FN-06, FN-07, TC-02]
must_haves:
  truths:
    - "plan.md step 8.3 renders Justification narrative and Round 1 fix summary BEFORE the per-finding Q&A loop — not after"
    - "plan.md has a new step between findings resolution (8.5) and the finalize prompt that fires unconditionally via AskUserQuestion with named plan areas"
    - "The named areas include: Wave ordering & task sequence, Approach vs alternatives, Requirement coverage, Assumptions made, Self-critique details, No deep-dive needed"
    - "plan.md step 8.6 presents the full 3-layer summary (justification + surfaced decisions + conditional ASCII flow + plan table) before the finalize AskUserQuestion"
    - "plan.md step 8.8 explicitly groups checker findings by severity (blocker/warning/info) rather than inheriting 8.3 format by implication"
    - "The 3-iteration max on the 8.1-8.5 loop is unchanged"
    - "Steps 8.4 and 8.5 output contract (per-finding accept/edit/dismiss) is preserved"
    - "plan.md stays within 10-15% token growth ceiling of its pre-edit size"
  artifacts:
    - path: "get-shit-done/workflows/plan.md"
      provides: "Restructured step 8 with 3-layer justification presentation, unconditional deep-dive, and explicit checker format"
  key_links:
    - from: "plan.md step 8.3 (justification narrative)"
      to: "planner-reference.md Planning Complete block (### Justification section)"
      via: "planner return message parsed by orchestrator at step 8.1"
      pattern: "### Justification"
    - from: "plan.md step 8.6 (conditional ASCII flow)"
      to: "ui-brand.md ASCII Flow Diagrams section"
      via: "complexity gate: 2+ waves OR 3+ plans"
      pattern: "ASCII Flow Diagrams"
---

<objective>
Restructure plan.md step 8 to implement the full 3-layer justification presentation. This is the consumer of the data contracts established in Plans 01 and 02: it reads the Justification and Round 1 Fixes from the planner return, surfaces them before findings, adds an unconditional deep-dive step, replaces the flat step 8.6 summary, and makes step 8.8 checker format explicit.

Purpose: The current flat "approve?" checkpoint produces rubber-stamp approvals. This restructure ensures informed approval every time.
Output: plan.md with restructured step 8 (steps 8.3, 8.NEW deep-dive, 8.6 replacement, 8.8 explicit format).
</objective>

<execution_context>
@/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/plan-presentation/FEATURE.md
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/plan-presentation/RESEARCH.md
@/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md
@/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md

<interfaces>
Upstream contracts this plan consumes:
- planner-reference.md Planning Complete block: ### Justification (ordering/approach/KISS rationale), ### Round 1 Fixes (ADR entries or "No Round 1 fixes applied")
- ui-brand.md ASCII Flow Diagrams: [Plan-NN: objective] --> notation, complexity gate (2+ waves OR 3+ plans), omit for trivially simple plans

Downstream contracts this plan must preserve:
- Step 8.3 output contract: per-finding accept/edit/dismiss responses must still feed steps 8.4 and 8.5
- Step 8.4/8.5 re-spawn logic: unchanged (max 3 iterations)
- Step 8.7 checker invocation: unchanged
- Step 8.8 input: checker findings list (same as before, only formatting changes)

Current step 8 structure for reference:
  8.1 Receive Planner Output
  8.2 CLI Validation
  8.3 Surface ALL to User (per-finding AskUserQuestion loop)
  8.4 Collect Feedback
  8.5 Re-spawn if Needed
  8.6 User Approval (flat summary + finalize)
  8.7 Plan Checker
  8.8 Handle Checker Findings (implicit "same as 8.3")

Target step 8 structure after this plan:
  8.1 Receive Planner Output            [unchanged]
  8.2 CLI Validation                    [unchanged]
  8.3 Surface to User (RESTRUCTURED):
        → Justification narrative (always)
        → Round 1 fix summary (always)
        → Round 2 findings loop (if findings exist, same accept/edit/dismiss contract)
  8.4 Collect Feedback                  [unchanged]
  8.5 Re-spawn if Needed                [unchanged; re-spawn must request justification regeneration]
  8.NEW Deep-Dive (new, unconditional):
        → AskUserQuestion with 6 named plan areas
        → Loops until "No deep-dive needed" selected
  8.6 Full 3-Layer Summary (REPLACED):
        → Justification narrative (ordering + approach + KISS)
        → Surfaced decisions (Round 1 fixes + key Round 2 resolutions)
        → Conditional ASCII flow diagram (2+ waves OR 3+ plans, else omit)
        → Plan summary table (existing format, retained)
        → Finalize AskUserQuestion: "Yes, finalize" / "I want changes" / "Abort"
  8.7 Plan Checker                      [unchanged]
  8.8 Handle Checker Findings (EXPLICIT format: grouped by severity, justification cross-reference)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Restructure plan.md step 8.3 and add unconditional deep-dive step</name>
  <reqs>FN-03, FN-04, TC-02</reqs>
  <files>get-shit-done/workflows/plan.md</files>
  <action>
  1. Read the full file. Record current line count.

  2. Locate step 8.3 "Surface ALL to User". Replace its content with the restructured version below. Keep the heading number 8.3 — do not renumber existing steps yet (renumbering happens in Task 2 if needed).

  NEW step 8.3 content:
  ```
  ### 8.3. Surface to User

  Present the planner return in this order:

  **A. Justification narrative (always renders)**

  Display the `### Justification` section from the planner return:
  - Ordering rationale (why waves/tasks are sequenced this way)
  - Approach rationale (why this approach vs alternatives)
  - KISS rationale (why this is the simplest satisfying approach)

  If the planner return has no `### Justification` section (legacy or error): display "No justification available from planner."

  **B. Round 1 fix summary (always renders)**

  Display the `### Round 1 Fixes` section from the planner return verbatim. If it contains "No Round 1 fixes applied", display that.

  **C. Round 2 findings loop (runs only when findings exist)**

  For each finding (validation errors + planner self-critique Round 2):

  Use AskUserQuestion:
  - header: "Finding {N}/{total}"
  - question: "[{category}] {description}\n\nSuggestion: {suggestion}\nAffected REQs: {reqs_affected}"
  - options:
    - "Accept suggestion" — apply as-is
    - "Edit" — provide modified guidance
    - "Provide guidance" — tell planner what to change
    - "Dismiss" — not applicable

  If findings list is empty: skip the loop entirely. Justification and Round 1 summary still render.
  ```

  3. After step 8.5 "Re-spawn if Needed", insert a new step. Label it "8.6. Deep-Dive" (this will push old 8.6 to 8.7, old 8.7 to 8.8, old 8.8 to 8.9 — renumber all subsequent steps accordingly):

  NEW deep-dive step content:
  ```
  ### 8.6. Deep-Dive (unconditional)

  After findings resolution (or immediately if no findings), present a plan-area deep-dive via AskUserQuestion:

  - header: "Plan Deep-Dive"
  - question: "Before finalizing, would you like to drill into any area of this plan?\n\nSelect an area to explore, or skip to finalize."
  - options:
    - "Wave ordering & task sequence"
    - "Approach vs alternatives"
    - "Requirement coverage"
    - "Assumptions made"
    - "Self-critique details"
    - "No deep-dive needed"

  If user selects an area: draw relevant detail from the planner's `### Justification` section and the PLAN.md frontmatter data for that area. Present the detail, then re-offer the remaining areas (re-run AskUserQuestion with the selected area removed from the options list). Repeat until user selects "No deep-dive needed".

  If user selects "No deep-dive needed": proceed to step 8.7.

  This step runs regardless of finding count. Well-formed plans receive equal scrutiny.
  ```

  4. Update cross-references: step 8.5 currently says "proceed to 8.6". After renumbering, it should say "proceed to 8.7". Update that reference. Also update the iteration cap note if it references a step number.

  5. Do NOT modify steps 8.1, 8.2, 8.4, 8.5, or the original checker steps. Only 8.3 content is replaced; new 8.6 is inserted; subsequent steps are renumbered.

  6. After edits: count new line total. Track growth against the Goldilocks ceiling in Task 2 (both tasks share one file — do not check growth mid-edit, check after Task 2 completes).
  </action>
  <verify>
    <automated>grep -n "Justification narrative" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "Round 1 fix summary\|Round 1 Fixes" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "Round 2 findings loop\|findings list is empty" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "Deep-Dive" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "Wave ordering" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "No deep-dive needed" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md</automated>
  </verify>
  <done>grep returns matches for all 6 pattern groups. Step 8.3 has A/B/C structure. New deep-dive step exists as 8.6 with 6 named areas including "No deep-dive needed".</done>
</task>

<task type="auto">
  <name>Replace plan.md step 8.6 flat summary with 3-layer presentation and make step 8.8 format explicit</name>
  <reqs>FN-05, FN-06, FN-07, TC-02</reqs>
  <files>get-shit-done/workflows/plan.md</files>
  <action>
  Note: After Task 1 renumbering, the old step 8.6 "User Approval" is now step 8.7, old 8.7 "Plan Checker" is now 8.8, old 8.8 "Handle Checker Findings" is now 8.9. Work with the renumbered steps.

  1. Locate the renumbered "User Approval" step (was 8.6, now 8.7). Replace its content:

  NEW step 8.7 (User Approval / 3-layer summary) content:
  ```
  ### 8.7. Final Summary and Approval

  Present the full 3-layer plan summary before the finalize prompt:

  **Layer 1 — Justification narrative:**
  Repeat the ordering rationale, approach rationale, and KISS rationale from the planner's `### Justification` section. This is the same content shown in 8.3.A — repeat it here so the user has the full context at decision time.

  **Layer 2 — Surfaced decisions:**
  - Round 1 fixes: list each fix from the planner's `### Round 1 Fixes` section (or "No Round 1 fixes applied")
  - Key Round 2 resolutions: for any finding the user accepted or edited in 8.3.C, summarize the resolution (one line per finding: what changed)

  **Layer 3 — Visual plan architecture (conditional):**
  If the plan has 2+ waves OR 3+ plans: render an ASCII flow diagram using the notation from ui-brand.md ASCII Flow Diagrams section:
    [Plan-NN: objective summary] --> [Plan-NN: objective summary]
  Derive from PLAN.md `wave` and `depends_on` frontmatter.
  If 1 wave and ≤2 plans: omit the diagram entirely.

  **Plan summary table (retained from existing format):**
  - Feature, plan count, task count, waves
  - Validation status

  After all layers, present finalize AskUserQuestion:
  - header: "Finalize"
  - question: "Review complete. Finalize this plan?"
  - options:
    - "Yes, finalize"
    - "I want changes" — re-spawn planner with collected feedback; re-spawn prompt must explicitly request justification regeneration
    - "Abort"
  ```

  2. Locate the renumbered "Handle Checker Findings" step (was 8.8, now 8.9). Replace the implicit "same Q&A format as 8.3" reference with explicit format instructions:

  NEW step 8.9 (Handle Checker Findings) content — replace only the presentation instruction, keep the re-spawn and cycle-limit logic:
  ```
  ### 8.9. Handle Checker Findings

  Checker findings are surfaced to the user via AskUserQuestion. Format:

  Group findings by severity before presenting:
  - **Blockers** (must resolve before execution): present first, one per AskUserQuestion
  - **Warnings** (should resolve, can override): present second
  - **Info** (informational, no action required): present as a batch summary, not individual Q&As

  For each blocker or warning:
  - header: "Checker Finding {N}/{total} [{severity}]"
  - question: "[{category}] {description}\n\nSuggestion: {suggestion}\nAffected REQs: {reqs_affected}\n\nJustification cross-reference: {cite relevant Justification section if checker finding contradicts planner rationale, else omit}"
  - options:
    - "Accept suggestion"
    - "Edit"
    - "Provide guidance"
    - "Dismiss"

  No auto-re-spawn on checker issues. If guidance given: re-spawn planner, back to 8.8 for re-check. Repeat until user approves or max 3 checker cycles reached.
  ```

  3. Verify the 3-iteration loop cap reference in step 8.5 (re-spawn if needed) still reads correctly after renumbering. Update any step number cross-references in the process section (e.g., "back to 8.1" should still say "back to 8.1").

  4. Final token growth check: read current line count, compare to original pre-edit count from Task 1. Growth must be ≤15% of original line count. The original plan.md is ~336 lines; 15% ceiling = ~50 lines of net new content. If over, trim verbose prose while keeping all structural instructions intact.

  5. Do NOT modify steps 8.1, 8.2, 8.4, 8.5, 8.6 (deep-dive added in Task 1), 8.8 (plan checker invocation), or step 12.
  </action>
  <verify>
    <automated>grep -n "Layer 1\|Layer 2\|Layer 3" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "conditional\|2+ waves\|3+ plans" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "Yes, finalize\|I want changes\|Abort" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "justification regeneration\|regenerate justification" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "Blocker\|blocker\|Warning\|severity" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md && grep -n "Justification cross-reference" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md</automated>
    <manual>Confirm: (1) Layer 1/2/3 structure in final summary step. (2) ASCII flow is conditional on 2+ waves OR 3+ plans. (3) Finalize AskUserQuestion has all 3 options. (4) "I want changes" re-spawn explicitly requests justification regeneration. (5) Checker step groups by severity with justification cross-reference. (6) Step 8.3 per-finding loop still feeds 8.4/8.5 (output contract preserved).</manual>
  </verify>
  <done>grep returns matches for all 6 pattern groups. plan.md line count is within 15% of original pre-edit count.</done>
</task>

</tasks>

<verification>
plan.md restructured with:
- Step 8.3: A=Justification narrative, B=Round 1 fix summary, C=per-finding loop (conditional)
- Step 8.6 (new): unconditional deep-dive with 6 named areas, loops until "No deep-dive needed"
- Step 8.7 (was 8.6): full 3-layer summary (justification + decisions + conditional ASCII flow + table) + finalize AskUserQuestion
- Step 8.9 (was 8.8): explicit severity grouping (blocker/warning/info) + justification cross-reference
- All step cross-references updated after renumbering
- Token growth within Goldilocks ceiling (10-15% max)
</verification>

<success_criteria>
- plan.md step 8.3 renders justification and Round 1 fixes before findings loop
- Unconditional deep-dive step with named areas fires between findings resolution and finalize
- Step 8.6 full 3-layer presentation with conditional ASCII flow diagram
- "I want changes" re-spawn explicitly requests justification regeneration
- Step 8.8/8.9 checker format explicitly groups by severity with justification cross-reference
- Steps 8.4/8.5 per-finding output contract preserved
- 3-iteration loop cap unchanged
- plan.md within 10-15% token growth ceiling
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/plan-presentation/03-SUMMARY.md`
</output>
