---
type: review-synthesis
feature: plan-presentation
capability: pipeline-execution
date: 2026-03-04
reviewers: [enduser-trace, functional-trace, technical-trace, quality-trace]
---

# Review Synthesis: plan-presentation

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All citations verified at stated line numbers |
| functional | 5 | 5 | 0 | planner-reference.md:264 and plan.md:280-284 verified as cited |
| technical | 5 | 5 | 0 | plan.md:270 forward-ref and planner-reference.md:264 stale instruction both verified |
| quality | 5 | 5 | 0 | Both blocker citations verified: plan.md:269-270 forward-ref, plan.md:280-284 nested options |

Citations verified by direct file reads. No invalid citations found across all four reviewers. All four reviewers are high-reliability sources.

---

## Findings

### Finding 1: Step 8.5 routes to 8.7, bypassing the unconditional deep-dive at 8.6

**Severity:** blocker
**Source:** quality-trace (primary), technical-trace (cross-layer observation), end-user (AC-3 implication)
**Requirement:** EU-02 AC-1, FN-04
**Verdict:** not met (proven)

**Evidence (from quality-trace):**

- `get-shit-done/workflows/plan.md:269-270` — `"If all findings accepted or dismissed: proceed to 8.7."`
- `get-shit-done/workflows/plan.md:274` — `"### 8.6. Deep-Dive (unconditional)"`

The step numbering routes the happy path (all findings resolved) from 8.5 directly to 8.7, skipping 8.6 entirely. The deep-dive is labeled unconditional and carries an explicit "runs regardless of finding count" note at line 288, but the flow control at line 270 contradicts this by jumping over it. An LLM executor following step 8.5 literally will skip the deep-dive when there are findings (the most common case), violating EU-02's unconditional trigger requirement.

Technical-trace flagged the same instruction at `planner-reference.md:264` as a cross-layer documentation gap but correctly noted the deep-dive placement. The forward-reference error is the sharper issue: the deep-dive exists in the file but is unreachable via the documented control flow when findings are present.

**Spot-check:** verified — `plan.md:270` reads "proceed to 8.7" and `plan.md:274` is step 8.6. The skip is real.

**Fix required:** Change `plan.md:270` from "proceed to 8.7" to "proceed to 8.6".

---

### Finding 2: Named deep-dive areas collapsed behind secondary expansion — EU-02 "named areas" criterion not met

**Severity:** blocker
**Source:** quality-trace (primary blocker), functional-trace (FN-04 partial), end-user (cross-layer observation only)
**Requirement:** EU-02 AC-2, FN-04
**Verdict:** not met (proven)

**Evidence (from quality-trace and functional-trace):**

- `get-shit-done/workflows/plan.md:280-284` — top-level deep-dive options:
  ```
  - "Wave ordering & task sequence"
  - "Approach vs alternatives"
  - "Requirement coverage + more..." (selecting this re-offers: "Assumptions made",
    "Self-critique details", "No deep-dive needed")
  - "No deep-dive needed"
  ```
- FEATURE.md FN-04 specifies 6 flat peer options including "Assumptions made" and "Self-critique details" as named siblings.
- EU-02 AC-2 requires named areas to include "assumptions" and "self-critique details" at minimum.

"Assumptions made" and "Self-critique details" are present in the workflow but are only discoverable after selecting "Requirement coverage + more..." — they are not named in the initial AskUserQuestion offer. EU-02 AC-2 requires the areas be named (visible), not merely reachable.

End-user reviewer flagged this as a usability concern but did not call it an AC violation, noting the AC says "include at minimum" without specifying top-level placement. Quality-trace disagrees: "named areas" in the AC implies visible areas. The conflict is resolved in favor of quality-trace (functional > end-user on FN-04 contract; quality and functional agree on the deviation from spec).

**Spot-check:** verified — `plan.md:280-284` confirmed. 4 top-level options, not 6.

**Fix required:** Flatten all 6 options to peers in a single AskUserQuestion, or explicitly amend EU-02 AC-2 to accept the nested design.

---

### Finding 3: Stale instruction at planner-reference.md:264 contradicts the new Round 1 Fixes return schema

**Severity:** major
**Source:** functional-trace (FN-02 partial), technical-trace (cross-layer observation)
**Requirement:** FN-02
**Verdict:** not met — partial (proven)

**Evidence (from functional-trace and technical-trace):**

- `get-shit-done/references/planner-reference.md:264` — `"Apply all fixes. Do not surface Round 1 fixes to the user."`
- `get-shit-done/references/planner-reference.md:401-409` — `### Round 1 Fixes` schema instructs the planner to capture and return fixes in ADR format.
- `get-shit-done/workflows/plan.md:248` — Step 8.3.B instructs the orchestrator to display the `### Round 1 Fixes` section verbatim.

The Round 1 self-critique protocol at line 264 tells the planner "Do not surface Round 1 fixes to the user." The new return format at lines 401-409 tells the planner to capture them and return them for orchestrator display. These instructions are in the same file with no resolution rule between them.

Technical-trace characterizes the line-264 sentence as referring to mid-task output (not surfacing during execution), while the return format captures fixes post-task. This reading is plausible but requires the planner agent to infer the temporal distinction. The sentence is not qualified and reads as an absolute prohibition. A planner that interprets it literally will omit the `### Round 1 Fixes` section from its return, causing step 8.3.B to render "No Round 1 fixes applied" regardless of what actually occurred.

**Spot-check:** verified — `planner-reference.md:264` reads exactly as cited. The contradiction is real.

**Fix required:** Update line 264 to read: "Apply all fixes. Do not surface Round 1 fixes to the user mid-task — capture them in `### Round 1 Fixes` for the orchestrator's post-task rendering."

---

### Finding 4: Step 8.5 forward-reference additionally skips deep-dive on the no-findings path

**Severity:** major
**Source:** quality-trace (implicit in Finding 1), end-user (noted as "unconditional" confirmed via 8.6 label, not flow control)
**Requirement:** EU-02 AC-1
**Verdict:** not met — regression (proven)

**Evidence:**

- `get-shit-done/workflows/plan.md:261` — "If findings list is empty: skip the loop entirely."
- `get-shit-done/workflows/plan.md:270` — "If all findings accepted or dismissed: proceed to 8.7."
- `get-shit-done/workflows/plan.md:274` — "### 8.6. Deep-Dive (unconditional)"
- `get-shit-done/workflows/plan.md:288` — "This step runs regardless of finding count."

When findings are empty, step 8.3 skips the loop and there is no explicit "proceed to 8.6" or "proceed to 8.7" in the empty-findings path — sequential reading would proceed to 8.4 (collect feedback), 8.5 (re-spawn if needed), and then line 270 routes to 8.7. When findings are present and resolved, line 270 also routes to 8.7. Both paths skip 8.6.

This is a sub-finding of Finding 1 (same root cause: the "proceed to 8.7" instruction) but affects a distinct code path. It is separated here because end-user confirmed the "regardless of finding count" text and concluded unconditional execution was proven — the flow control evidence contradicts that conclusion.

**Note:** End-user and quality-trace conflict on EU-02 AC-1's verdict. End-user says "met (proven)" citing the step label and line-288 text. Quality-trace says "blocker" because line 270 overrides the intent. The line-270 flow control is dispositive — an LLM follows explicit "proceed to X" instructions, not section labels. Quality verdict applies per conflict priority (quality finding is the more specific mechanical analysis; functional and technical corroborate).

**Spot-check:** verified — both paths (empty findings and resolved findings) route through line 270 to 8.7.

**Fix required:** Same as Finding 1 — change line 270 to route to 8.6.

---

### Finding 5: "Justification cross-reference" in step 8.9 has no grounding rule for contradiction detection

**Severity:** minor
**Source:** quality-trace (Warning)
**Requirement:** FN-07
**Verdict:** partially met — suspected inconsistency

**Evidence (from quality-trace):**

- `get-shit-done/workflows/plan.md:339` — `"Justification cross-reference: {cite relevant Justification section if checker finding contradicts planner rationale, else omit}"`

The instruction delegates "contradiction" detection to agent judgment with no definition of what constitutes a contradiction vs a supplemental finding. The "else omit" clause is correct but "if checker finding contradicts planner rationale" is underdefined. This will produce inconsistent cross-referencing across runs — some agents will add references where none apply; others will omit them when they should be present.

Functional-trace (FN-07) found this step met, but did not examine the ambiguity of the cross-reference field at line 339. No conflict — functional confirmed the field exists; quality identified the field is underdefined. Both are correct.

**Spot-check:** verified — `plan.md:339` reads as cited.

**Fix opportunity:** Add a concrete test: "cross-reference only when the checker finding directly names a REQ ID or dependency edge that the planner's Justification addresses differently."

---

### Finding 6: ui-brand.md complexity gate boundary uses two phrasings across three locations

**Severity:** minor
**Source:** quality-trace (Info)
**Requirement:** FN-06 / quality
**Verdict:** not met — phrasing inconsistency only, no logic error

**Evidence (from quality-trace):**

- `get-shit-done/references/ui-brand.md:154` — "Omit for trivially simple plans (1 wave, 1-2 plans)" — colloquial range
- `get-shit-done/references/ui-brand.md:180` — "Flow diagrams on trivially simple plans (1 wave, ≤2 plans)" — inequality notation
- `get-shit-done/workflows/plan.md:303` — "If 1 wave and ≤2 plans: omit." — inequality notation

Three locations, two phrasings. "1-2 plans" and "≤2 plans" are mathematically equivalent but "1-2" is ambiguous (could be read as requiring both conditions). The inequality notation used in two of three locations is the safer form.

**Spot-check:** verified — `ui-brand.md:154` uses "1-2 plans"; `ui-brand.md:180` uses "≤2 plans".

**Fix opportunity:** Normalize `ui-brand.md:154` to "≤2 plans" for consistency.

---

### Finding 7: planner-reference.md trailing prose paragraph partially duplicates template field descriptions

**Severity:** minor
**Source:** quality-trace (Info)
**Requirement:** quality / DRY
**Verdict:** not met — redundant but harmless

**Evidence (from quality-trace):**

- `get-shit-done/references/planner-reference.md:397-399` — template fields inline: `{cite dependency edges and REQ IDs}`, `{cite RESEARCH.md findings and project constraints}`, `{cite specific trade-offs rejected}`
- `get-shit-done/references/planner-reference.md:418` — trailing prose: "All claims must reference specific REQ IDs, dependency edges, or file paths — generic statements fail the grounding check."

The grounding rule is embedded in both the template field descriptions and the trailing paragraph. The paragraph adds generation-timing context ("generated during planning", "cannot be reconstructed after planner Task() completes") which is not in the template fields and has standalone value. The pure duplication is the grounding rule itself.

**Spot-check:** verified — both locations read as cited. The prose does add timing context not present in the fields.

**Fix opportunity:** Either trim the prose to timing context only, or keep as-is (the reinforcement is low-cost and serves LLM instruction redundancy as a feature, not a bug).

---

## Conflicts

### Disagreements

**EU-02 AC-1 verdict — met vs blocker:**

- End-user says "met (proven)" citing `plan.md:274` label ("unconditional") and `plan.md:288` ("runs regardless of finding count").
- Quality-trace says "blocker" citing `plan.md:270` ("proceed to 8.7") which routes over step 8.6 in both the findings-present and empty-findings paths.
- Resolution: Quality-trace is correct. LLM executors follow explicit `proceed to X` flow control instructions; step labels and explanatory text are documentation, not control flow. The "proceed to 8.7" instruction at line 270 overrides the "unconditional" label at line 274. End-user's verdict relied on the step header and prose, not the control flow path.
- Tiebreaker applied: no — judgment is sufficient. The flow control reading is objectively correct.

**EU-02 AC-2 verdict — met vs blocker:**

- End-user says "met" noting the AC says "include at minimum" without requiring top-level placement; all five areas reachable.
- Quality-trace says "blocker" arguing "named areas" implies visible/offered areas, not merely reachable ones.
- Functional-trace says "partial" on FN-04 — the 6 flat peers specified are not implemented.
- Resolution: Quality-trace and functional-trace are aligned on the deviation from spec. End-user's reading of "include at minimum" is too permissive when the requirement also says "named areas" — hidden-behind-expansion is not "named." Functional requirement (FN-04) and quality finding (EU-02 AC-2) both cite the same deviation. Quality verdict upheld.
- Tiebreaker applied: functional > end-user per priority ordering, corroborated by quality.

### Tensions

**Redundant prose in planner-reference.md — keep vs trim:**

- Quality-trace recommends trimming the trailing paragraph at line 418 as DRY violation.
- Technical-trace cites the same paragraph as evidence that the grounding constraint is "documented in prose immediately after the code block" and treats it as meeting the spec.
- Assessment: These can coexist. Technical-trace's verdict (TC-01 met) does not depend on the prose being uniquely authoritative — the template fields alone satisfy the spec. Quality-trace's recommendation to trim is valid but low-priority. Neither is wrong; the tension is between "reinforcement is useful in LLM instruction files" (implicit technical view) and "DRY is a quality standard" (quality view). Leave as-is unless the trim is explicitly requested.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 2     |
| Major    | 2     |
| Minor    | 3     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-02 AC-1 (deep-dive unconditional) | not met | blocker | quality-trace |
| EU-02 AC-2 (named areas) / FN-04 | not met | blocker | quality-trace, functional-trace |
| FN-02 (Round 1 fixes surfaced) | partial | major | functional-trace, technical-trace |
| EU-02 AC-1 (no-findings path also skips deep-dive) | not met | major | quality-trace |
| FN-07 (cross-reference grounding rule) | partial | minor | quality-trace |
| FN-06 / quality (phrasing consistency) | minor | minor | quality-trace |
| quality / DRY (prose duplication) | minor | minor | quality-trace |
| EU-01 AC-1 | met | — | end-user, functional, technical |
| EU-01 AC-2 | met | — | end-user, functional |
| EU-01 AC-3 | met | — | end-user |
| EU-02 AC-3 | met | — | end-user |
| EU-02 AC-4 | met | — | end-user |
| FN-01 | met | — | functional, technical |
| FN-03 | met | — | functional, technical |
| FN-05 | met | — | functional, technical |
| FN-06 | met | — | functional, technical |
| FN-07 | met (with caveat) | — | functional |
| TC-01 | met | — | technical |
| TC-02 | met | — | technical |
| TC-03 | met | — | technical |
| Token ceiling (plan.md) | marginal | — | technical |

### Critical Path to Resolution

Both blockers are in `get-shit-done/workflows/plan.md` step 8, resolvable together:

1. **plan.md:270** — change "proceed to 8.7" to "proceed to 8.6" (fixes Findings 1 and 4)
2. **plan.md:280-284** — flatten deep-dive to 6 peer options (fixes Finding 2)
3. **planner-reference.md:264** — qualify "Do not surface Round 1 fixes" to restrict to mid-task only (fixes Finding 3)
