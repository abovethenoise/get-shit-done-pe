# Quality Trace: plan-presentation

**Feature:** pipeline-execution / plan-presentation
**Files reviewed:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md`
- `/Users/philliphall/get-shit-done-pe/agents/gsd-planner.md`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md`

---

### Phase 1: Quality Standards

These files are LLM instruction files, not compiled code. The evaluation lens shifts accordingly:

- **Instruction unambiguity:** Can an LLM agent follow each instruction deterministically? Vague or contradictory instructions are bugs.
- **DRY:** Intentional repetition (design decision noted in the brief) is exempted; unintentional duplication is a defect.
- **KISS:** Is the deep-dive loop (4-option → expand → re-offer minus selection) the simplest mechanism that satisfies EU-02?
- **Bloat:** Do new sections earn their token cost relative to the clarity they provide?
- **Consistency:** Do additions pattern-match the existing sections in each file?
- **Edge-case coverage:** Empty findings, zero fixes, single-wave plans, "I want changes" mid-deep-dive.

---

### Phase 2: Trace Against Code

---

### Finding 1: Deep-dive step number is internally inconsistent

**Category:** KISS / Instruction Ambiguity

**Verdict:** not met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:274` — Section header reads `### 8.6. Deep-Dive (unconditional)`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:285` — Text reads: "present a plan-area deep-dive via AskUserQuestion ... then re-offer remaining areas (selected area removed). Repeat until user selects 'No deep-dive needed' → proceed to 8.7."
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:291` — Section header reads `### 8.7. Final Summary and Approval`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:315` — Section header reads `### 8.8. Plan Checker (if enabled)`
- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/plan-presentation/FEATURE.md:209` (TC-02 example block) — Labels the deep-dive as `Step 8.NEW`, and the replaced summary as `Step 8.6`

The FEATURE.md design spec calls the deep-dive "8.NEW" and relabels the final summary as "8.6". The implemented plan.md labels the deep-dive as "8.6" and the final summary as "8.7". This is not a logical error, but it does create a forward-reference mismatch: step 8.5 says "proceed to 8.7" (meaning finalize), but 8.7 is now the full-summary step, not finalize. An LLM reading step 8.5 in isolation will skip the deep-dive at 8.6 if it interprets "proceed to 8.7" as jumping past 8.6. The text at step 8.5 reads:

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:269` — "If all findings accepted or dismissed: proceed to 8.7."

The correct target is 8.6 (Deep-Dive), but the instruction says 8.7.

**Severity: Blocker**

Reasoning: An LLM executor following step 8.5 literally will skip the unconditional deep-dive (EU-02 acceptance criterion: "fires unconditionally before finalize"). The numbering error turns an unconditional requirement into a conditional skip.

---

### Finding 2: "Justification cross-reference" field in 8.9 has no defined source when checker fires on a finding not covered by planner justification

**Category:** KISS / Instruction Ambiguity

**Verdict:** not met (suspected)

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:339` — `"Justification cross-reference: {cite relevant Justification section if checker finding contradicts planner rationale, else omit}"`

The instruction delegates the "cite relevant section" decision entirely to the LLM agent's judgment. There is no defined rule for what constitutes a contradiction vs a supplemental finding, nor is there a fallback for checker findings on areas the planner justification does not address (e.g., a wave dependency error that the planner omitted entirely from the justification). The "else omit" clause is correct direction, but "if checker finding contradicts planner rationale" is underdefined — contradiction is a semantic judgment with no grounding rule.

**Severity: Warning**

Reasoning: This is unlikely to cause a hard failure but will produce inconsistent behavior across runs. Some agents will add cross-references where they don't exist; others will omit them when they should be present. The feature's intent (FN-07) is explicit formatting — the vagueness undermines it.

---

### Finding 3: planner-reference.md "Justification" section trailing prose duplicates information already in the template

**Category:** DRY

**Verdict:** not met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:397-400` — Template fields already specify: `{why waves/tasks are sequenced this way — cite dependency edges and REQ IDs}`, `{why this approach vs alternatives — cite RESEARCH.md findings...}`, `{why this is the simplest approach...}`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:418` — Trailing prose paragraph: "The Justification section is generated during planning when the planner has full reasoning context across FEATURE.md, RESEARCH.md, and dependency edges. Round 1 fixes are captured during self-critique because they cannot be reconstructed after the planner Task() completes. All claims must reference specific REQ IDs, dependency edges, or file paths — generic statements fail the grounding check."

The template's inline field descriptions already encode the "grounded in REQ IDs" rule and the source document references. The trailing paragraph restates the same three points as prose without adding new constraints. An LLM reading the template plus the trailing paragraph receives the same instruction twice.

**Severity: Info**

Reasoning: Redundant but harmless — the template fields are the authoritative instruction source and are unambiguous on their own. The prose paragraph does not introduce contradictions, only duplication. Not a blocker.

---

### Finding 4: Deep-dive option count in plan.md (4) conflicts with FEATURE.md (6)

**Category:** KISS / Instruction Ambiguity

**Verdict:** not met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:280-283` — Deep-dive options:
  1. "Wave ordering & task sequence"
  2. "Approach vs alternatives"
  3. "Requirement coverage + more..." (selecting this re-offers: "Assumptions made", "Self-critique details", "No deep-dive needed")
  4. "No deep-dive needed"

- `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/plan-presentation/FEATURE.md:116-121` — FN-04 acceptance criteria lists 6 named areas:
  1. Wave ordering & task sequence
  2. Approach vs alternatives
  3. Requirement coverage
  4. Assumptions made
  5. Self-critique details
  6. No deep-dive needed (skip)

The plan.md implements a 2-level nesting: "Requirement coverage + more..." collapses areas 3, 4, and 5 from FEATURE.md behind a secondary prompt. EU-02 requires "Named areas include at minimum: wave ordering, approach vs alternatives, requirement coverage, assumptions, self-critique details." The collapsing of 3 named areas behind a "more..." expansion means areas 4 and 5 are not initially named, only discoverable after selecting "Requirement coverage + more...".

EU-02 acceptance criterion reads: "Named areas include at minimum..." — the areas must be named (visible), not merely reachable. The collapsed design fails this literal read.

**Severity: Blocker**

Reasoning: EU-02's acceptance criterion is an explicit list of named areas. Hiding "Assumptions made" and "Self-critique details" behind a secondary expansion means they are not "named areas" in the initial offer. An auditor checking EU-02 against the implementation will fail this. Additionally, the nested re-offer mechanic ("re-offers: Assumptions made, Self-critique details, No deep-dive needed") introduces ambiguity: if the user wants "Assumptions made" and "No deep-dive needed" in one pass, the current flow requires two separate selections.

---

### Finding 5: ui-brand.md complexity gate rule and anti-patterns section are in two locations with slight phrasing mismatch

**Category:** DRY

**Verdict:** not met

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md:154` — "Render only when plan has **2+ waves OR 3+ plans** (complexity gate). Omit for trivially simple plans (1 wave, 1-2 plans)."
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md:179-180` — Anti-patterns section: "Flow diagrams on trivially simple plans (1 wave, ≤2 plans)"

The positive gate condition uses "1 wave, 1-2 plans" while the anti-patterns list uses "1 wave, ≤2 plans". These are mathematically equivalent but textually different. An LLM cross-referencing both locations sees two phrasings of the same boundary and must determine they are the same rule. The "≤2" notation is tighter and unambiguous; "1-2" is colloquial and could be misread as a range requiring exactly 1 AND 2.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:301` — plan.md references the same gate: "If 2+ waves OR 3+ plans: render ... If 1 wave and ≤2 plans: omit."

Three locations, two different phrasings of the same boundary condition. plan.md uses "≤2" (tighter), ui-brand.md uses both forms.

**Severity: Info**

Reasoning: Not a logic error — all three conditions are equivalent. But the inconsistent phrasing adds unnecessary cognitive load for any LLM reading across files. Should be normalized to "≤2 plans" everywhere, but not a blocker.

---

### Finding 6: gsd-planner.md output_format sentence is additive but creates a forward-reference dependency

**Category:** KISS / Bloat

**Verdict:** met (with note)

**Evidence:**

- `/Users/philliphall/get-shit-done-pe/agents/gsd-planner.md:41` — "Completion message also includes `### Justification` (ordering/approach/KISS rationale, grounded in REQ IDs) and `### Round 1 Fixes` (ADR-format entries for changes made during Round 1 self-critique) — see planner-reference.md Structured Return Formats for schema."

This sentence is the correct minimal addition: it names the two new sections, characterizes their content in a single parenthetical each, and defers full specification to planner-reference.md. No redundant detail is embedded here. The forward-reference is appropriate given planner-reference.md is the canonical schema location and is loaded at spawn time.

**Severity: None — Finding met.**

---

### Summary

| # | Finding | Severity | File |
|---|---------|----------|------|
| 1 | Step 8.5 says "proceed to 8.7" — skips unconditional deep-dive at 8.6 | Blocker | plan.md:269 |
| 2 | "Justification cross-reference" field has no grounding rule for contradiction detection | Warning | plan.md:339 |
| 3 | planner-reference.md trailing paragraph duplicates template field descriptions | Info | planner-reference.md:418 |
| 4 | Deep-dive collapses 3 named areas behind secondary expansion, violating EU-02 "named areas" criterion | Blocker | plan.md:280-283 |
| 5 | Complexity gate boundary uses two phrasings ("1-2 plans" vs "≤2 plans") across three files | Info | ui-brand.md:154,179 |
| 6 | gsd-planner.md output_format addition is minimal and correct | None | gsd-planner.md:41 |

**Blockers: 2. Warnings: 1. Info: 2.**

The two blockers are both in `plan.md` step 8. Finding 1 is a step-number forward-reference that would cause an LLM to skip the unconditional deep-dive. Finding 4 is a structural collapse of required named areas behind a secondary expansion, failing EU-02's explicit "named areas" acceptance criterion. Both are localized to the same section and can be resolved together.
