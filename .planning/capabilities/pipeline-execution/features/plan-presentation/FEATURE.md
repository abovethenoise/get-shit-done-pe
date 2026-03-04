---
type: feature
capability: "pipeline-execution"
status: planning
created: "2026-03-04"
---

# Plan Presentation Overhaul

## Goal

Replace the flat table + "approve?" plan checkpoint with a 3-layer justification presentation: narrative explaining ordering/approach/simplicity, surfaced self-critique decisions with rationale, and interactive AskUserQuestion deep-dive that is always offered (never skipped). Add ASCII/markdown flows for visual plan architecture.

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | ✓ | - | - | - | - | draft |
| EU-02 | ✓ | - | - | - | - | draft |
| FN-01 | ✓ | - | - | - | - | draft |
| FN-02 | ✓ | - | - | - | - | draft |
| FN-03 | ✓ | - | - | - | - | draft |
| FN-04 | ✓ | - | - | - | - | draft |
| FN-05 | ✓ | - | - | - | - | draft |
| FN-06 | ✓ | - | - | - | - | draft |
| TC-01 | ✓ | - | - | - | - | draft |
| TC-02 | ✓ | - | - | - | - | draft |
| TC-03 | ✓ | - | - | - | - | draft |

## End-User Requirements

### EU-01: Plan approval is an informed decision

**Story:** As a GSD user, I want to see why the plan is structured the way it is before I approve it, so that approval is a judgment call — not a rubber stamp.

**Acceptance Criteria:**

- [ ] Justification narrative (ordering rationale, approach rationale, KISS rationale) is visible before the finalize prompt
- [ ] Self-critique fixes are shown with what/why per fix — "fixed N issues" alone is a failure
- [ ] Approval prompt cannot fire before all justification layers have been presented

**Out of Scope:**

- Changing the quality of plans themselves (planner algorithm unchanged)
- Review/execute stage presentation

### EU-02: Interactive plan discussion is always available

**Story:** As a GSD user, I want to drill into specific plan areas before finalizing, so that I can challenge decisions and surface ambiguities — even when the plan-checker found nothing.

**Acceptance Criteria:**

- [ ] AskUserQuestion deep-dive with named plan areas fires unconditionally before finalize
- [ ] Named areas include at minimum: wave ordering, approach vs alternatives, requirement coverage, assumptions, self-critique details
- [ ] Selecting an area provides focused detail on that area
- [ ] User can select "No deep-dive needed" to skip directly to finalize

**Out of Scope:**

- Free-form dialogue (AskUserQuestion is the only interaction primitive)

## Functional Requirements

### FN-01: Justification narrative in planner return

**Receives:** Planner's full reasoning context during planning (FEATURE.md requirements, RESEARCH.md, CAPABILITY.md, BRIEF.md).

**Returns:** A `### Justification` section in the planner's structured completion message containing:
- **Ordering rationale** — why waves/tasks are in this sequence, referencing dependency edges and requirement IDs
- **Approach rationale** — why this approach vs alternatives considered, grounded in research findings and project constraints
- **KISS rationale** — why this is the simplest approach that satisfies requirements

**Behavior:**

- Justification is generated during planning when the planner has full reasoning context
- Claims must reference specific REQ IDs, dependency edges, or file paths — generic statements fail the grounding check
- Justification must pass the "why this specific plan?" test — content that could apply to any plan is boilerplate

### FN-02: Round 1 fix log in planner return

**Receives:** Planner's self-critique Round 1 findings (currently applied silently and discarded).

**Returns:** A `### Round 1 Fixes` section in the planner's structured completion message. Each fix: what changed, why, which REQs affected.

**Behavior:**

- Round 1 fixes are captured during planning — they cannot be reconstructed after the planner Task() completes
- Each fix is an ADR-style entry: Context (what was wrong), Decision (what changed), Consequence (what it affects)
- If Round 1 produced 0 fixes, section states "No Round 1 fixes applied"

### FN-03: Restructured step 8.3 — narrative before findings

**Receives:** Planner return (justification + Round 1 fixes + Round 2 findings + plan tables).

**Returns:** Formatted output to user showing narrative first, then findings.

**Behavior:**

- Present justification narrative (from FN-01) — always renders, even with 0 findings
- Present Round 1 fix summary (from FN-02) — always renders
- Present Round 2 findings via per-finding AskUserQuestion loop (existing 8.3 mechanics preserved)
- If Round 2 findings is empty: narrative still renders, per-finding loop is skipped
- Output contract to steps 8.4/8.5 unchanged: collected user responses per finding (accepted/edited/dismissed)

### FN-04: Unconditional deep-dive step

**Receives:** Completed narrative + findings resolution (or no findings).

**Returns:** User's deep-dive selections and any discussion.

**Behavior:**

- New step between findings resolution (8.5) and finalize (8.6)
- AskUserQuestion with named plan areas as options:
  1. "Wave ordering & task sequence"
  2. "Approach vs alternatives"
  3. "Requirement coverage"
  4. "Assumptions made"
  5. "Self-critique details"
  6. "No deep-dive needed" (skip to finalize)
- Runs regardless of finding count — well-formed plans get equal scrutiny
- If user selects an area: present focused detail from planner justification + relevant PLAN.md data, then re-offer remaining areas
- If user selects "No deep-dive needed": proceed to finalize

### FN-05: Replaced step 8.6 — full 3-layer presentation

**Receives:** All plan data + justification + findings + deep-dive results.

**Returns:** Final presentation before finalize prompt.

**Behavior:**

- Replaces current flat summary (count/waves/validation) with:
  1. Justification narrative (ordering + approach + KISS)
  2. Surfaced decisions (Round 1 fixes + key Round 2 resolutions)
  3. Conditional ASCII wave flow diagram (see FN-06)
  4. Plan summary table (existing format, retained)
- Finalize AskUserQuestion fires after all layers: "Yes, finalize" / "I want changes" / "Abort"
- "I want changes" triggers re-spawn with explicit instruction to regenerate justification

### FN-06: Conditional ASCII wave flow diagram

**Receives:** PLAN.md frontmatter: wave numbers, depends_on fields, plan objectives.

**Returns:** ASCII flow diagram or nothing.

**Behavior:**

- Renders only when plan has 2+ waves or 3+ plans (complexity gate)
- For trivially simple plans (1 wave, 1-2 plans): omitted entirely — KISS
- Diagram derived from wave/depends_on frontmatter data
- Simple notation: `[Plan-01: objective] --> [Plan-02: objective]`
- No formal template required — inline notation

### FN-07: Step 8.8 explicit format inheritance

**Receives:** Checker findings (when plan_checker_enabled).

**Returns:** Formatted checker output.

**Behavior:**

- Step 8.8 currently says "same Q&A format as 8.3" — must be updated explicitly
- Checker findings grouped by severity (blocker/warning/info) with justification cross-reference where relevant
- Handles both enabled and disabled checker paths

## Technical Specs

### TC-01: planner-reference.md return format extension

**Intent:** Capture justification and Round 1 fix data that would otherwise be lost when the planner Task() completes.

**Upstream:** Planner agent's completion message format.

**Downstream:** plan.md step 8.3 (narrative rendering), step 8.6 (final presentation).

**Constraints:**

- Extension only — existing return fields unchanged
- Two new sections: `### Justification` and `### Round 1 Fixes`
- Planner planning algorithm (task generation, wave assignment, dependency analysis, self-critique) untouched
- This is a return format change, not a logic change (analogous to adding a column to a view)

### TC-02: plan.md workflow restructure

**Intent:** Reorder step 8 to present justification before approval, add unconditional deep-dive.

**Upstream:** Planner return message (now includes justification + Round 1 fixes).

**Downstream:** Steps 8.4/8.5 (feedback collection), step 8.7 (checker), finalize.

**Constraints:**

- Step 8.3 output contract preserved: per-finding accept/edit/dismiss feeds 8.4/8.5
- 3-iteration max on draft/refine loop unchanged
- New deep-dive step does not consume iteration budget
- Re-spawn after "I want changes" must explicitly request justification regeneration
- plan.md is a markdown instruction file — changes take immediate effect, no tests

**Example:**

```
Step 8.3 (restructured):
  → Justification narrative (always)
  → Round 1 fix summary (always)
  → Round 2 findings loop (if findings exist)

Step 8.NEW (deep-dive):
  → AskUserQuestion: named plan areas (always)

Step 8.6 (replaced):
  → Full 3-layer summary + conditional flow diagram
  → Finalize prompt (after all layers)
```

### TC-03: ui-brand.md flow diagram convention

**Intent:** Standardize ASCII flow notation for reuse across GSD output.

**Upstream:** PLAN.md frontmatter (wave, depends_on, objective).

**Downstream:** plan.md step 8.6, potentially other stages later.

**Constraints:**

- Simple notation only — no box-drawing characters for flows
- Must render correctly in monospace terminal
- Convention, not template — lightweight addition to ui-brand.md

## Decisions

- Research confirmed: planner generates justification (not orchestrator) — planner has full reasoning context in fresh 200k window
- ADR format for Round 1 fix surfacing (Context/Decision/Consequence)
- Progressive disclosure = 2 levels: layers 1+2 always shown, layer 3 (deep-dive) offered on demand
- Findings loop and deep-dive are distinct steps — findings handles specific issues, deep-dive handles plan-level interrogation
- Visual flow diagram conditional on complexity (2+ waves or 3+ plans)
- PLAN.md artifact format invariant confirmed — justification lives in planner return message only
