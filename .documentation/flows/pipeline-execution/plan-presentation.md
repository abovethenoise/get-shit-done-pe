---
type: flow-doc
built-from-code-at: d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
last-verified: 2026-03-04
---

## Flow: pipeline-execution/plan-presentation

## Trigger: [derived]

User invokes `/gsd:plan` (direct) or reaches plan.md via framing-pipeline Stage 3. The flow begins after the planner Task() returns its completion message (step 8.1) and ends when the user finalizes or aborts.

## Input: [derived]

- Planner completion message containing: Wave Structure table, Plans Created table, `### Justification` section (ordering rationale, approach rationale, KISS rationale), `### Round 1 Fixes` section (ADR entries or "No Round 1 fixes applied"), `### Findings` (Round 2 self-critique issues, may be empty)
- CLI validation output: validation errors appended to findings list
- PLAN.md files: `wave` and `depends_on` frontmatter fields (used in step 8.6 for ASCII flow diagram)
- `plan_checker_enabled` config flag

## Steps: [derived]

### Phase 1: Surface planner output (step 8.3)

1. **plan-workflow** --> Renders `### Justification` section verbatim (ordering rationale, approach rationale, KISS rationale). Always fires. If section is missing: displays "No justification available from planner."
2. **plan-workflow** --> Renders `### Round 1 Fixes` section verbatim (ADR entries or "No Round 1 fixes applied"). Always fires.
3. **plan-workflow** --> If findings list (Round 2 + validation errors) is non-empty: runs per-finding AskUserQuestion loop. For each finding: header "Finding N/total", category/description/suggestion/affected REQs, 4 options (Accept suggestion / Edit / Provide guidance / Dismiss).
4. **plan-workflow** --> If findings list is empty: skips loop entirely. Proceeds to step 8.4.

### Phase 2: Feedback collection and re-spawn (steps 8.4-8.5)

5. **plan-workflow** --> Aggregates all user responses: accepted suggestions, edits, guidance, dismissals (step 8.4).
6. **plan-workflow** --> If any finding received guidance or edits: re-spawns gsd-planner with collected feedback. Returns to step 8.1. Max 3 iterations.
7. **plan-workflow** --> If all findings accepted or dismissed (or no findings): proceeds to step 8.6.

### Phase 3: Final summary (step 8.6)

8. **plan-workflow** --> Presents Layer 1 (Justification narrative): repeats ordering/approach/KISS rationale from planner return. Full context at decision time.
9. **plan-workflow** --> Presents Layer 2 (Surfaced decisions): Round 1 fixes from `### Round 1 Fixes` section; key Round 2 resolutions (one line per accepted/edited finding from 8.3.C).
10. **plan-workflow** --> Presents Layer 3 (conditional ASCII flow): reads PLAN.md `wave` and `depends_on` frontmatter. If 2+ waves OR 3+ plans: renders ASCII flow diagram (ui-brand.md notation: `[Plan-NN: objective] --> [Plan-NN: objective]`). If 1 wave and ≤2 plans: omits.
11. **plan-workflow** --> Presents plan summary table: feature, plan count, task count, waves, validation status.

### Phase 4: Deep-dive and approval (step 8.7)

12. **plan-workflow** --> Presents unconditional AskUserQuestion (multiSelect: true): header "Deep-Dive", 4 named plan areas ("Wave ordering & task sequence" / "Approach vs alternatives" / "Requirement coverage" / "Assumptions made"). Fires regardless of finding count.
13. **plan-workflow** --> If user selects areas: draws relevant detail from planner `### Justification` section and PLAN.md frontmatter for each selected area. Presents all detail. Re-offers remaining areas + "Self-critique details" + "No deep-dive needed" as second AskUserQuestion.
14. **plan-workflow** --> If user selects "No deep-dive needed": proceeds to finalize prompt.
15. **plan-workflow** --> Finalize AskUserQuestion: "Yes, finalize" / "I want changes" / "Abort". "I want changes" re-spawns gsd-planner with explicit instruction to regenerate justification. "Abort" stops workflow.

### Phase 5: Plan checker (steps 8.8-8.9, conditional)

16. **plan-workflow** --> If `plan_checker_enabled`: spawns gsd-plan-checker Task() (model: checker_model). Checker validates plans across quality dimensions.
17. **plan-workflow** --> Groups checker findings by severity: blockers first (one AskUserQuestion each, must resolve), warnings second (one AskUserQuestion each, can override), info items as batch summary (no individual Q&As).
18. **plan-workflow** --> Each blocker/warning AskUserQuestion includes justification cross-reference field: cited when checker finding and planner Justification share a REQ ID or dependency edge.
19. **plan-workflow** --> If guidance given: re-spawns gsd-planner, returns to step 8.8. Max 3 checker cycles.

## Output: [derived]

- `{feature_dir}/*-PLAN.md` files (finalized)
- User confirmation: "Yes, finalize" selection at step 8.7 finalize prompt
- Final status display: `GSD > FEATURE {FEATURE_SLUG} PLANNED` with wave table, research status, verification status, and Next Up block

## Side-effects: [derived]

- gsd-planner re-spawned (0-3 times) if findings require guidance
- gsd-plan-checker spawned once per checker cycle (0-3 times total)
- No file writes by plan.md itself in this phase; PLAN.md files written by gsd-planner Task()

## WHY: [authored]

**Justification rendered before findings (EU-01, FN-03):** The prior flow rendered findings first then prompted for approval. Users saw only what was wrong, never why the plan was structured as it is. Surfacing justification narrative unconditionally (even when there are zero findings) turns approval into an informed judgment call rather than a rubber stamp.

**Deep-dive fires on both findings paths (EU-02, review findings 1+4):** Review identified that step 8.5's "proceed to 8.7" instruction caused the deep-dive to be bypassed in both the findings-present path and the no-findings path. The fix routes step 8.5 to 8.6 (Final Summary), which then flows to 8.7 (Deep-Dive). Both paths now reach the deep-dive unconditionally.

**Final Summary before Deep-Dive (user preference, review decision 1):** The original design had deep-dive at step 8.6 and final summary at step 8.7. During review acceptance, the user preferred summary-then-deep-dive ordering: the 3-layer summary gives full context, then the deep-dive lets the user probe specific areas. This is the final step ordering: 8.6 Summary --> 8.7 Deep-Dive+Approval.

**Severity grouping in checker findings (FN-07):** Presenting blockers before warnings before info matches the action urgency. Blockers must resolve before execution. Info items as a batch summary prevents individual Q&A fatigue for non-actionable findings.
