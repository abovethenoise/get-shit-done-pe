---
type: review
layer: end-user
feature: plan-presentation
capability: pipeline-execution
reviewer: enduser-trace
date: 2026-03-04
---

# End-User Requirement Trace: plan-presentation

## Phase 1: Requirements Internalization

### EU-01: Plan approval is an informed decision

Three AC items. "Met" means:

- AC-1: The Justification narrative (ordering, approach, KISS) is displayed in the step-8 flow BEFORE the finalize AskUserQuestion fires.
- AC-2: Round 1 self-critique fixes are surfaced with what-changed and why, not a bare count.
- AC-3: The finalize prompt is structurally downstream of every justification layer — no code path reaches finalize without first passing through all layers.

### EU-02: Interactive plan discussion is always available

Four AC items. "Met" means:

- AC-1: An AskUserQuestion deep-dive offering named plan areas fires unconditionally — zero findings does not suppress it.
- AC-2: The named areas offered collectively cover at minimum: wave ordering, approach vs alternatives, requirement coverage, assumptions, self-critique details.
- AC-3: Selecting an area produces focused detail from the planner's reasoning, not a generic response.
- AC-4: "No deep-dive needed" is an explicit option that bypasses area drill-down and goes directly to finalize.

---

## Phase 2: Requirement Traces

### EU-01: Plan approval is an informed decision

**Verdict: met (proven)**

#### AC-1: Justification narrative visible before finalize prompt

**PASS**

`get-shit-done/workflows/plan.md:238-244` — step 8.3 opens with:

```
**A. Justification narrative (always renders)**

Display the `### Justification` section from the planner return (ordering rationale,
approach rationale, KISS rationale). If missing (legacy or error): display "No
justification available from planner."
```

`get-shit-done/workflows/plan.md:307` — the Finalize AskUserQuestion is placed inside step 8.7, which is downstream of 8.3 (justification), 8.6 (deep-dive), and only fires after step 8.7's three-layer summary is presented:

```
Finalize AskUserQuestion:
- header: "Finalize"
- question: "Review complete. Finalize this plan?"
```

The sequential step numbering (8.3 -> 8.6 -> 8.7 finalize) and the explicit `proceed to 8.7` flow control at `plan.md:270` enforce ordering. The finalize prompt cannot fire before justification renders because 8.3 has no conditional branch that skips A and B.

The planner return format at `get-shit-done/references/planner-reference.md:395-399` establishes the `### Justification` schema the orchestrator parses:

```
### Justification

**Ordering rationale:** {why waves/tasks are sequenced this way...}
**Approach rationale:** {why this approach vs alternatives...}
**KISS rationale:** {why this is the simplest approach...}
```

And `agents/gsd-planner.md:41` directs the agent to emit it:

```
Completion message also includes `### Justification` (ordering/approach/KISS rationale,
grounded in REQ IDs) and `### Round 1 Fixes` (ADR-format entries for changes made during
Round 1 self-critique)...
```

#### AC-2: Self-critique fixes shown with what/why per fix — "fixed N issues" alone is a failure

**PASS**

`get-shit-done/workflows/plan.md:246-248` — step 8.3.B:

```
**B. Round 1 fix summary (always renders)**

Display the `### Round 1 Fixes` section verbatim (or "No Round 1 fixes applied").
```

`get-shit-done/references/planner-reference.md:401-410` — the Round 1 Fixes schema mandates per-fix entries in ADR format:

```
### Round 1 Fixes

{If fixes applied, one entry per fix:}
- **Context:** {what was wrong before the fix}
  **Decision:** {what changed}
  **Consequence:** {REQ IDs affected, downstream impact}

{If no fixes:}
No Round 1 fixes applied.
```

Each fix entry requires three fields — Context (what was wrong), Decision (what changed), Consequence (REQ IDs affected). A bare count like "fixed 3 issues" does not satisfy this schema. The schema is the contract; the display instruction at 8.3.B is "verbatim" — the planner output format, not the orchestrator, is responsible for the per-fix detail.

`planner-reference.md:418` adds the grounding enforcement:

```
Round 1 fixes are captured during self-critique because they cannot be reconstructed
after the planner Task() completes. All claims must reference specific REQ IDs,
dependency edges, or file paths — generic statements fail the grounding check.
```

**Cross-layer observation:** The "verbatim" instruction in 8.3.B means the orchestrator trusts the planner's output format without re-validating it. If the planner emits a bare count rather than ADR entries, the orchestrator will surface a bare count. The schema enforcement is instruction-level, not mechanically enforced at parse time. This is a risk to AC-2 quality but does not make the AC not met — the spec does not require mechanical enforcement.

#### AC-3: Approval prompt cannot fire before all justification layers presented

**PASS**

The workflow structure at `plan.md:238-313` sequences steps without conditional bypass of the justification layers:

- 8.3.A (Justification narrative) — always renders, no condition (`plan.md:242`)
- 8.3.B (Round 1 fix summary) — always renders, no condition (`plan.md:246`)
- 8.3.C (findings loop) — conditional, but the condition governs the loop, not 8.3.A or 8.3.B
- 8.6 (Deep-dive) — unconditional (`plan.md:288`: "This step runs regardless of finding count")
- 8.7 (Final Summary + Finalize) — reached only after 8.6 completes

`plan.md:261` makes explicit that justification is not gated on findings:

```
If findings list is empty: skip the loop entirely. Justification and Round 1 summary still render.
```

`plan.md:270` — flow control from findings loop to finalize routes through 8.7 (`proceed to 8.7`), which begins with the 3-layer summary before the finalize AskUserQuestion. There is no branch in the documented flow that reaches `Finalize AskUserQuestion` at `plan.md:307-313` without first executing 8.3.A, 8.3.B, 8.6, and the 8.7 summary layers.

---

### EU-02: Interactive plan discussion is always available

**Verdict: met (proven)**

#### AC-1: AskUserQuestion deep-dive with named plan areas fires unconditionally before finalize

**PASS**

`get-shit-done/workflows/plan.md:274-288` — step 8.6:

```
### 8.6. Deep-Dive (unconditional)

After findings resolution (or immediately if no findings), present a plan-area
deep-dive via AskUserQuestion:
```

`plan.md:288`:

```
This step runs regardless of finding count. Well-formed plans receive equal scrutiny.
```

The step label itself ("unconditional") and the explicit "regardless of finding count" statement at line 288 establish that zero-findings does not suppress the deep-dive. The flow control at `plan.md:270` routes to 8.7 only from 8.5, meaning the 8.6 deep-dive is encountered on all paths before 8.7's finalize prompt.

#### AC-2: Named areas include at minimum wave ordering, approach vs alternatives, requirement coverage, assumptions, self-critique details

**PASS**

`get-shit-done/workflows/plan.md:280-284`:

```
- options:
  - "Wave ordering & task sequence"
  - "Approach vs alternatives"
  - "Requirement coverage + more..." (selecting this re-offers: "Assumptions made",
    "Self-critique details", "No deep-dive needed")
  - "No deep-dive needed"
```

Mapping against the AC minimum set:

| AC-required area | Implementation option | Present? |
|---|---|---|
| wave ordering | "Wave ordering & task sequence" | Yes |
| approach vs alternatives | "Approach vs alternatives" | Yes |
| requirement coverage | "Requirement coverage + more..." | Yes |
| assumptions | "Assumptions made" (in expansion) | Yes |
| self-critique details | "Self-critique details" (in expansion) | Yes |

All five minimum areas are present. Three appear as top-level options; two (assumptions, self-critique details) appear in the secondary AskUserQuestion expansion triggered by "Requirement coverage + more...".

**Cross-layer observation:** "Requirement coverage" and the two hidden-behind-expansion areas (assumptions, self-critique details) are bundled under one option. A user who does not select "Requirement coverage + more..." cannot discover the assumptions or self-critique options. The AC specifies the areas "include at minimum" the five — it does not specify they must all be top-level. The expansion pattern satisfies the letter of the AC. However, the grouping is not self-evident from the option label: "Requirement coverage + more..." does not signal that "more" means assumptions and self-critique details. A user wanting assumptions but not requirement coverage must still select this option. This is a usability concern but not an AC violation.

#### AC-3: Selecting an area provides focused detail on that area

**PASS**

`get-shit-done/workflows/plan.md:286`:

```
If user selects an area: draw relevant detail from the planner's `### Justification`
section and the PLAN.md frontmatter for that area. Present the detail, then re-offer
remaining areas (selected area removed).
```

The instruction specifies the data source (planner's `### Justification` section + PLAN.md frontmatter) and the scope (relevant to the selected area). "Relevant detail" is instruction-level precision, not mechanical enforcement, but it unambiguously requires area-focused content, not a generic repeat of the full justification. The "selected area removed" re-offer loop enforces that the same area cannot be re-selected, implying distinct content per area.

**Cross-layer observation:** The implementation of what "draw relevant detail" means is delegated entirely to the orchestrating model at runtime. There is no structured sub-schema for each area's content shape. This is unavoidable given the instruction-file medium, but it means AC-3 quality depends on model fidelity to the instruction.

#### AC-4: User can select "No deep-dive needed" to skip directly to finalize

**PASS**

`get-shit-done/workflows/plan.md:284`:

```
- "No deep-dive needed"
```

This is an explicit top-level option in the deep-dive AskUserQuestion at 8.6.

`plan.md:286`:

```
Repeat until user selects "No deep-dive needed" → proceed to 8.7.
```

Selecting "No deep-dive needed" routes directly to step 8.7 (Final Summary and Approval). The finalize prompt is inside 8.7, so "No deep-dive needed" leads to finalize without forcing any area drill-down. The option is also re-offered in the expansion at `plan.md:283`: `"Requirement coverage + more..." (selecting this re-offers: "Assumptions made", "Self-critique details", "No deep-dive needed")` — confirming the skip path remains available after expansion.

---

## Summary

| Req ID | AC | Verdict | Key Evidence |
|---|---|---|---|
| EU-01 | AC-1: Justification visible before finalize | PASS | `plan.md:242-244` — 8.3.A always renders; `plan.md:307` — finalize is downstream in 8.7 |
| EU-01 | AC-2: Fixes shown with what/why per fix | PASS | `planner-reference.md:401-410` — ADR schema (Context/Decision/Consequence) per fix; `plan.md:248` — display verbatim |
| EU-01 | AC-3: Approval cannot fire before all justification layers | PASS | `plan.md:261` — justification renders even with empty findings; `plan.md:288` — deep-dive unconditional; finalize only reachable via 8.7 |
| EU-02 | AC-1: Deep-dive fires unconditionally | PASS | `plan.md:274,288` — step labeled "unconditional"; explicit "regardless of finding count" |
| EU-02 | AC-2: Named areas include all five minimum areas | PASS | `plan.md:280-283` — all 5 areas present; 2 via expansion under "Requirement coverage + more..." |
| EU-02 | AC-3: Selecting area provides focused detail | PASS | `plan.md:286` — draws from `### Justification` + PLAN.md frontmatter for selected area |
| EU-02 | AC-4: "No deep-dive needed" skips to finalize | PASS | `plan.md:284,286` — explicit option, routes to 8.7 |

**Overall verdict: all EU requirements met (proven).**
