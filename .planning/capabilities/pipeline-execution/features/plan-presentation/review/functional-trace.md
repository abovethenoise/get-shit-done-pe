# Functional Requirement Trace — plan-presentation

**Reviewer role:** Functional (FN layer)
**Framing context:** enhance
**Files examined:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md`
- `/Users/philliphall/get-shit-done-pe/agents/gsd-planner.md`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md`
- `.planning/capabilities/pipeline-execution/features/plan-presentation/FEATURE.md` (requirements source)

---

## Phase 1: Requirements Internalized

| FN ID | Behavior Contract |
|-------|-------------------|
| FN-01 | Planner return includes `### Justification` with ordering rationale, approach rationale, KISS rationale. All claims reference REQ IDs, dependency edges, or file paths. |
| FN-02 | Planner return includes `### Round 1 Fixes` with ADR entries (Context/Decision/Consequence). Zero-fix fallback is "No Round 1 fixes applied". Fixes captured during planning — cannot be reconstructed post-hoc. |
| FN-03 | Step 8.3 renders: (A) Justification narrative always, (B) Round 1 fix summary always, (C) Round 2 per-finding AskUserQuestion loop only when findings exist. Output contract to 8.4/8.5 unchanged. |
| FN-04 | New unconditional step between 8.5 and finalize. AskUserQuestion with 6 flat named areas. Loops until "No deep-dive needed". Runs regardless of finding count. |
| FN-05 | Step 8.6/8.7 (renamed) presents: Layer 1 justification, Layer 2 surfaced decisions, Layer 3 conditional ASCII flow, Layer 4 plan summary table. Finalize with 3 options. "I want changes" re-spawn must explicitly request justification regeneration. |
| FN-06 | ASCII flow renders only when 2+ waves OR 3+ plans. Omitted for 1 wave/1-2 plans. Uses `[Plan-NN: objective] -->` notation. No box-drawing characters. |
| FN-07 | Step 8.8/8.9 checker findings grouped by severity (blocker/warning/info). Justification cross-reference included where relevant. |

---

## Phase 2: Trace Against Code

---

### FN-01: Justification narrative in planner return

**Verdict:** met (proven)

**Evidence:**

- `get-shit-done/references/planner-reference.md:395-399` — `### Justification\n\n**Ordering rationale:** {why waves/tasks are sequenced this way — cite dependency edges and REQ IDs}\n**Approach rationale:** {why this approach vs alternatives — cite RESEARCH.md findings and project constraints}\n**KISS rationale:** {why this is the simplest approach that satisfies requirements — cite specific trade-offs rejected}`
  - All three rationale sub-fields are present inside the Planning Complete code block.

- `get-shit-done/references/planner-reference.md:418` — `The Justification section is generated during planning when the planner has full reasoning context across FEATURE.md, RESEARCH.md, and dependency edges. [...] All claims must reference specific REQ IDs, dependency edges, or file paths — generic statements fail the grounding check.`
  - Grounding requirement and generation-time constraint are documented in prose immediately after the code block, satisfying the "why this specific plan?" test enforcement.

- `agents/gsd-planner.md:41` — `Completion message also includes \`### Justification\` (ordering/approach/KISS rationale, grounded in REQ IDs) and \`### Round 1 Fixes\` (ADR-format entries for changes made during Round 1 self-critique) — see planner-reference.md Structured Return Formats for schema.`
  - Planner agent's `<output_format>` block instructs the agent to emit the section.

**Reasoning:** The return format schema is defined correctly with all three required rationale fields. The grounding constraint (REQ IDs / dependency edges / file paths) is explicitly stated. The agent definition references the schema.

---

### FN-02: Round 1 fix log in planner return

**Verdict:** PARTIAL (proven)

**Evidence:**

- `get-shit-done/references/planner-reference.md:401-409` — `### Round 1 Fixes\n\n{If fixes applied, one entry per fix:}\n- **Context:** {what was wrong before the fix}\n  **Decision:** {what changed}\n  **Consequence:** {REQ IDs affected, downstream impact}\n\n{If no fixes:}\nNo Round 1 fixes applied.`
  - ADR-format (Context/Decision/Consequence) is present. Zero-fix fallback string is present. Return section exists.

- `get-shit-done/references/planner-reference.md:264` — `Apply all fixes. Do not surface Round 1 fixes to the user.`
  - The Self-Critique Protocol's Round 1 sub-section retains the original instruction "Do not surface Round 1 fixes to the user." This directly contradicts FN-02's requirement that Round 1 fixes be captured and returned in the structured message for surfacing at step 8.3.B. The instruction was not updated to reflect the new behavior.
  - Reasoning: A planner agent reading the Self-Critique Protocol in order encounters "Do not surface Round 1 fixes" before reaching the Structured Return Formats section. The two instructions conflict. The behavioral outcome depends on which instruction takes precedence — not guaranteed.

**Cross-layer observation (secondary):** The Self-Critique Protocol section is in the same file as the Structured Return Formats section. A planner following Round 1 instructions literally will suppress fixes; the return format schema then instructs inclusion. No resolution rule is stated. This creates ambiguity in agent execution.

---

### FN-03: Restructured step 8.3 — narrative before findings

**Verdict:** met (proven)

**Evidence:**

- `get-shit-done/workflows/plan.md:238-261` — Step 8.3 has three explicit sub-sections:
  - `**A. Justification narrative (always renders)**` at line 242: `Display the \`### Justification\` section from the planner return [...]. If missing (legacy or error): display "No justification available from planner."`
  - `**B. Round 1 fix summary (always renders)**` at line 246: `Display the \`### Round 1 Fixes\` section verbatim (or "No Round 1 fixes applied").`
  - `**C. Round 2 findings loop (runs only when findings exist)**` at line 250 with AskUserQuestion per-finding structure.
  - `If findings list is empty: skip the loop entirely. Justification and Round 1 summary still render.` at line 261.

**Reasoning:** All four behaviors from FN-03 are present: justification always renders, Round 1 summary always renders, per-finding loop is conditional on findings existence, empty-findings path explicitly documented. Output contract to 8.4/8.5 is preserved — the per-finding accept/edit/dismiss responses from part C feed into step 8.4 Collect Feedback (line 263-265) and step 8.5 Re-spawn (line 267-272) unchanged.

---

### FN-04: Unconditional deep-dive step

**Verdict:** PARTIAL (proven)

**Evidence:**

- `get-shit-done/workflows/plan.md:274-288` — `### 8.6. Deep-Dive (unconditional)` exists between step 8.5 and step 8.7. The step fires via AskUserQuestion, loops until "No deep-dive needed" is selected, and runs regardless of finding count.

- `get-shit-done/workflows/plan.md:280-284` — Top-level AskUserQuestion options:
  ```
  - "Wave ordering & task sequence"
  - "Approach vs alternatives"
  - "Requirement coverage + more..." (selecting this re-offers: "Assumptions made", "Self-critique details", "No deep-dive needed")
  - "No deep-dive needed"
  ```
  FN-04 specifies 6 flat options presented as peers in one AskUserQuestion:
  1. "Wave ordering & task sequence"
  2. "Approach vs alternatives"
  3. "Requirement coverage"
  4. "Assumptions made"
  5. "Self-critique details"
  6. "No deep-dive needed"

  The implementation collapses options 3, 4, and 5 behind a nested "Requirement coverage + more..." sub-menu. Only 4 options appear at the top level. "Assumptions made" and "Self-critique details" require a second AskUserQuestion to reach. This deviates from the flat 6-option contract in FN-04.

- `get-shit-done/workflows/plan.md:288` — `This step runs regardless of finding count. Well-formed plans receive equal scrutiny.` — Unconditional execution is correctly specified.

**Reasoning:** The unconditional trigger and loop-until-skip mechanics are met. The 6 named areas are present in the workflow but not as 6 flat peer options in a single AskUserQuestion as specified. The nested structure changes the interaction contract — a user must select "Requirement coverage + more..." to expose "Assumptions made" and "Self-critique details", introducing an extra interaction step not required by FN-04.

---

### FN-05: Replaced step 8.6 — full 3-layer presentation

**Verdict:** met (proven)

**Evidence:**

- `get-shit-done/workflows/plan.md:290-313` — Step 8.7 "Final Summary and Approval" contains:
  - `**Layer 1 — Justification narrative:**` at line 294 — repeats ordering/approach/KISS rationale.
  - `**Layer 2 — Surfaced decisions:**` at line 296 — Round 1 fixes + key Round 2 resolutions.
  - `**Layer 3 — Visual plan architecture (conditional):**` at line 300 — conditional ASCII flow with complexity gate.
  - `**Plan summary table:**` at line 305 — feature, plan count, task count, waves, validation status.
  - Finalize AskUserQuestion at lines 307-313 with three options: "Yes, finalize", "I want changes", "Abort".

- `get-shit-done/workflows/plan.md:312` — `"I want changes" — re-spawn planner with collected feedback; re-spawn prompt must explicitly request justification regeneration`
  - Justification regeneration request is explicitly mandated on re-spawn.

**Reasoning:** All four layers are present. Finalize prompt fires after all layers. "I want changes" re-spawn instruction explicitly calls for justification regeneration. The spec refers to this as "Layer 4" (plan summary table) but the implementation labels it as an unlabeled fourth section after Layer 3 — this is a minor labeling inconsistency but the content contract is fully satisfied.

**Cross-layer observation (secondary):** The spec (FEATURE.md FN-05) calls the plan summary table "Layer 4" but plan.md labels it as an unlabeled "Plan summary table" section. Not a behavioral deviation — content matches.

---

### FN-06: Conditional ASCII wave flow diagram

**Verdict:** met (proven)

**Evidence:**

- `get-shit-done/references/ui-brand.md:152-169` — `## ASCII Flow Diagrams` section exists with:
  - `Render only when plan has **2+ waves OR 3+ plans** (complexity gate). Omit for trivially simple plans (1 wave, 1-2 plans).` at line 154.
  - Notation example using `[Plan-01: objective summary] --> [Plan-02: objective summary]` at lines 158-160.
  - `No box-drawing characters (\`┌\`, \`─\`, \`┐\`) — use \`[brackets]\` and \`-->\` only` at line 168.
  - Anti-pattern entry: `Flow diagrams on trivially simple plans (1 wave, ≤2 plans)` at line 180.

- `get-shit-done/workflows/plan.md:300-303` — Step 8.7 Layer 3 references the complexity gate: `If 2+ waves OR 3+ plans: render ASCII flow diagram (ui-brand.md notation): [Plan-NN: objective summary] --> [Plan-NN: objective summary]`. `If 1 wave and ≤2 plans: omit.`

**Reasoning:** All FN-06 behaviors are present. Complexity gate is correctly defined. Notation matches spec (`[Plan-NN: objective] -->`). No box-drawing characters. The ui-brand.md section is canonical and plan.md references it correctly.

---

### FN-07: Step 8.8 explicit format inheritance

**Verdict:** met (proven)

**Evidence:**

- `get-shit-done/workflows/plan.md:328-346` — Step 8.9 "Handle Checker Findings" (renumbered from 8.8 per plan restructure) explicitly documents:
  - `Group findings by severity before presenting:` at line 332.
  - `**Blockers** (must resolve before execution): present first, one per AskUserQuestion` at line 333.
  - `**Warnings** (should resolve, can override): present second` at line 334.
  - `**Info** (informational, no action required): present as a batch summary, not individual Q&As` at line 335.
  - `Justification cross-reference: {cite relevant Justification section if checker finding contradicts planner rationale, else omit}` at line 339 — embedded in the per-finding question template.

**Reasoning:** The implicit "same format as 8.3" reference has been replaced with explicit severity grouping (blocker/warning/info) and justification cross-reference. Both behaviors specified by FN-07 are present. The step is no longer implicitly defined.

**Cross-layer observation (secondary):** The renumbering moved "Handle Checker Findings" from 8.8 to 8.9 and "Plan Checker" from 8.7 to 8.8. FEATURE.md FN-07 refers to this as "step 8.8" — the implementation places the explicit format at 8.9. This is a step number label shift, not a behavioral deviation. The requirement is satisfied at the new step number.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | met | `planner-reference.md:395-399` — all three rationale fields present with grounding constraint at line 418 |
| FN-02 | PARTIAL | `planner-reference.md:401-409` — return format correct; `planner-reference.md:264` — "Do not surface Round 1 fixes to the user" instruction not updated, creating a direct contradiction with the new return schema |
| FN-03 | met | `plan.md:238-261` — A/B/C structure with always-renders guarantee and empty-findings skip documented |
| FN-04 | PARTIAL | `plan.md:280-284` — 4 top-level options, not 6 flat peers; "Assumptions made" and "Self-critique details" are nested behind "Requirement coverage + more..." sub-menu |
| FN-05 | met | `plan.md:290-313` — all four layers present; justification regeneration mandated on re-spawn |
| FN-06 | met | `ui-brand.md:152-169`, `plan.md:300-303` — complexity gate, notation, no box-drawing characters all correct |
| FN-07 | met | `plan.md:328-346` — explicit severity grouping (blocker/warning/info) and justification cross-reference present |

### Deviations Requiring Attention

**FN-02 deviation:** `planner-reference.md:264` still reads "Do not surface Round 1 fixes to the user." This instruction is in the Self-Critique Protocol (Round 1 sub-section) and directly contradicts the Structured Return Formats section which now includes `### Round 1 Fixes` for return and surfacing. A planner agent will encounter conflicting instructions in the same file. No resolution rule exists between them.

**FN-04 deviation:** The implementation uses a 2-level nested AskUserQuestion (4 top-level options, with items 3/4/5 collapsed under a gateway option) rather than the 6 flat peer options specified. "Assumptions made" and "Self-critique details" require a second interaction step to reach. The spec states "AskUserQuestion with named plan areas as options" with all 6 areas listed as siblings — the nesting is not authorized by the requirement.
