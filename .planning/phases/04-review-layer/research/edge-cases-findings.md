# Edge Cases Findings: Phase 4 Review Layer

**Phase:** 04-review-layer
**Researched:** 2026-02-28
**Dimension:** Boundary conditions, failure modes, edge cases
**Confidence:** HIGH (grounded in 04-CONTEXT.md decisions, REQUIREMENTS.md REVW-01 through REVW-08, prior phase patterns from 02-agent-framework and 03-planning-pipeline)

---

## Failure Modes

| Failure | Likelihood | Severity | Mitigation | Source |
|---------|------------|----------|------------|--------|
| Reviewer produces empty/malformed trace report | common | blocking | Word count gate (< 50 words = failed); structured output format with mandatory sections; retry once then mark dimension as gap in synthesizer input | [Phase 2 precedent: `.planning/phases/02-agent-framework/research/EDGE-CASES.md` EC-13 — zero-content gatherer output; 04-CONTEXT.md: "Findings without evidence are not actionable"] |
| Two reviewers produce contradictory verdicts on same REQ | common | degraded | Synthesizer's mandatory conflicts section surfaces both; priority ordering (user > functional > technical > quality) as tiebreaker; spot-check cited file:line before presenting | [04-CONTEXT.md: "Synthesizer uses judgment first, priority ordering as tiebreaker"; "Overlapping findings from different reviewers presented separately"] |
| Synthesizer spot-check finds reviewer cited wrong file:line | common | blocking | Synthesizer reads cited file:line before presenting; downgrade finding confidence if evidence does not match; flag as "unverified finding" in presentation to user | [04-CONTEXT.md: "Synthesizer spot-checks reviewer findings by reading cited file:line references before presenting"; First principles: LLMs hallucinate file references — spot-checking is the only defense] |
| Re-review loop exceeds max 2 cycles with issues persisting | rare | degraded | Hard stop at 2 cycles; remaining issues surfaced to user for manual resolution with clear "unresolved after 2 review cycles" label | [04-CONTEXT.md: "Max 2 re-review cycles, then surface remaining issues for manual resolution"] |
| Reviewer output exceeds context budget (too many findings, verbose evidence) | common | degraded | Cap reviewer output at word/token limit; synthesizer truncation strategy for oversized inputs; reviewer prompt constrains output shape | [First principles: code quality reviewer reviewing large codebase will produce verbose output; Phase 2 EC-2 token budget accrual pattern applies] |
| Reviewer traces against wrong requirement layer | rare | blocking | Reviewer agent definition explicitly scopes to its layer (EU-xx, FN-xx, TC-xx); synthesizer cross-checks that reviewer findings reference correct REQ prefix | [04-CONTEXT.md: "Each reviewer's primary focus is its own REQ layer"; REVW-03/04/05 define layer assignments] |
| Reviewer cannot find evidence for a requirement (code not implemented) | common | blocking | Verdict = "not met" with evidence "no implementation found at expected location"; reviewer must cite where it searched and what it expected to find | [First principles: absence of evidence is itself a finding — the reviewer must document the search, not just the absence] |
| User Defers or Dismisses a critical blocker finding | rare | degraded | Synthesizer labels severity; if user Dismisses a blocker, log the decision in review artifact with rationale; do not block workflow — user owns risk | [04-CONTEXT.md: 5 response options include Defer/Dismiss; First principles: user is the decision-maker, framework records the decision but does not override] |
| All 4 reviewers agree on "met" but synthesizer spot-check reveals actual bug | rare | blocking | Spot-check is the safety net; synthesizer overrides reviewer verdicts when evidence contradicts; flag as "synthesizer override" in output | [04-CONTEXT.md: "Synthesizer spot-checks reviewer findings by reading cited file:line references"; First principles: 4 parallel LLM reviewers can all miss the same issue if it requires cross-file reasoning] |
| Regression type ambiguity: proven vs suspected disagreement between reviewers | common | degraded | Synthesizer weights proven (test fails, removed function) higher than suspected (code analysis); present both with labels so user can judge | [04-CONTEXT.md: "Regression includes both proven and suspected, clearly labeled so synthesizer can weight them differently"] |
| One reviewer crashes/times out while other 3 complete | rare | degraded | Retry once (per Phase 2 gather-synthesize precedent); if still fails, synthesizer proceeds with 3 reports and notes gap | [Phase 2 precedent: `.planning/phases/02-agent-framework/research/EDGE-CASES.md` EC-10 — single gatherer failure handled by retry + gap notation] |
| Synthesizer itself fails after all 4 reviewers complete | rare | blocking | Retry synthesizer once; if fails twice, surface raw reviewer reports to user with structured error | [Phase 2 precedent: EC-14 — synthesizer retry policy] |

### Boundary Conditions

- **Empty requirement layer**: A feature has EU requirements but no FN or TC requirements — the functional and technical reviewers have nothing to trace against. Reviewer must report "no requirements in scope" rather than inventing findings or reporting all-met. — [First principles: absence of requirements is not the same as all requirements met; reviewer must distinguish "nothing to review" from "everything passes"]

- **Single-line acceptance criteria**: EU-01 has one acceptance criterion: "user can log in." End-user reviewer must trace this literally — either the code demonstrates login works or it does not. No room for "partially met" (by design: 3-level verdict). — [04-CONTEXT.md: "3-level: met / not met / regression (no 'partially met')"]

- **Requirement spans multiple files/modules**: FN-01 specifies a behavior implemented across 3 files (e.g., route handler, service module, data layer). Reviewer must trace through all 3 and produce a single verdict for the REQ, citing all relevant file:line references. — [First principles: a functional requirement is about behavior, not files; the trace must follow the behavior path, not stop at one file]

- **Zero findings from code quality reviewer**: All code is clean, simple, no bloat. The code quality reviewer must still produce a structured report with explicit "met" verdicts, not an empty report. — [04-CONTEXT.md: "Hardest to please in the system"; First principles: "no findings" is a valid outcome but must be explicitly stated, not silently empty]

- **Regression on a REQ that was not in the current feature's scope**: Reviewer finds that implementing feature X broke feature Y (a different feature's REQ). The reviewer can flag this as a secondary observation, but the synthesizer must handle cross-feature regressions — they cannot be traced in the current feature's trace table. — [04-CONTEXT.md: "May flag cross-layer concerns as secondary observations"; First principles: regressions do not respect feature boundaries]

- **Maximum re-review depth**: Accept -> fix -> re-review cycle 1 -> new issue found -> fix -> re-review cycle 2 -> still issues. Hard stop. The remaining issues are surfaced with "unresolved after max re-review cycles" label. User must manually resolve or accept risk. — [04-CONTEXT.md: "Max 2 re-review cycles, then surface remaining issues for manual resolution"]

- **Verdict scale boundary: regression vs not-met**: Code existed before, was working, and current changes broke it = regression. Code never existed = not met. Boundary: code existed in a different form and was refactored into something that does not work = regression (it worked before) not "not met" (it was never this implementation). — [First principles: regression is about behavioral change, not code identity; if the behavior worked before and does not work now, it is a regression regardless of whether the code was rewritten]

- **Framing-specific review questions for debug framing**: End-user reviewer asks "is the bug fixed?" not "does the story pass?" If the feature has no bug context (wrong framing applied), the reviewer falls back to standard acceptance criteria tracing. — [04-CONTEXT.md: "The QUESTIONS each reviewer asks change per framing, not the reviewer's importance"; "Framing-specific review prompts injected by the workflow"]

- **Evidence citation for non-code requirements**: Some acceptance criteria are about behavior ("user sees a confirmation message") not code structure. Reviewer must cite the code that produces the behavior, not just assert the behavior exists. — [04-CONTEXT.md: "Every finding cites file:line, quotes relevant code/behavior, and explains reasoning"]

- **Agent definition token budget at ~1500 tokens**: With 4 reviewers + 1 synthesizer, that is ~7500 tokens in agent definitions alone. If any reviewer exceeds budget (likely for code quality reviewer given its complex posture), total agent context grows. — [04-CONTEXT.md: "~1500 tokens max per agent definition"; Phase 2 EC-2 token budget pattern]

### Integration Failure Scenarios

- **Upstream: execution phase produced no artifacts** -> Reviewers have nothing to trace against. All verdicts would be "not met" for every REQ. The workflow should guard: if no execution summary or modified files exist, skip review and surface "nothing to review" error. — [First principles: review without executed work is meaningless; the workflow must check for execution artifacts before spawning reviewers]

- **Upstream: FEATURE.md requirements are ambiguous or incomplete** -> Reviewers trace against vague specs and produce uncertain verdicts. The synthesizer cannot adjudicate because the source of truth is unclear. Mitigation: reviewer flags "ambiguous requirement — cannot determine met/not-met" as a distinct finding type. — [First principles: garbage in, garbage out; ambiguous requirements produce ambiguous reviews]

- **Upstream: plan tasks referenced REQs that were later modified** -> The plan was created against REQ version 1, execution implemented version 1, but requirements were updated to version 2 during execution. Review traces against current FEATURE.md (version 2). Findings may flag "not met" for changes the executor never saw. Mitigation: review workflow should compare plan-time REQ snapshot with current REQs and flag drift. — [First principles: requirements drift between planning and review is a real-world scenario in iterative development]

- **Downstream: documentation phase reads review verdicts** -> If review artifact format changes or synthesizer output structure drifts, the documentation agent (Phase 5) cannot parse review status. Mitigation: lock synthesizer output section headings as a formal contract (per Phase 2 synthesizer precedent). — [Phase 2 precedent: `.planning/phases/02-agent-framework/research/EDGE-CASES.md` EC-28 — format contract between phases; `agents/gsd-research-synthesizer.md`: "Section headings must be exact"]

- **Downstream: re-review triggers re-execution** -> User Accepts a finding, fix is applied, re-review runs. But the fix broke something else. The re-review catches it, but we are now in cycle 2 of 2. If this new break is severe, the user is told "unresolved after max cycles" for a regression that did not exist before the fix. Mitigation: re-review scope should be limited to affected areas (per 04-CONTEXT.md) to reduce blast radius. — [04-CONTEXT.md: "Any 'Accept' or 'Accept w/ Edit' triggers re-review of affected areas after fixes applied"]

- **Integration: gather-synthesize workflow parameterization** -> Phase 4 uses 4 reviewers, not 6 gatherers. The failure threshold from Phase 2 (>= ceil(N/2) failures = abort) means >= 2 reviewer failures aborts synthesis. With 4 agents, a single timeout + single crash = abort. This threshold may be too aggressive for review. — [Phase 2 EC-27: parameterized gatherer count; First principles: 2/4 = 50% failure rate is the right abort threshold, same as 3/6]

- **Integration: review template vs synthesizer output** -> The existing `review.md` template (`get-shit-done/templates/review.md`) uses a different structure (PASS/PARTIAL/FAIL/BLOCKED + Domain/Code/Integration reviewers) than what Phase 4 specifies (met/not-met/regression + end-user/functional/technical/code-quality reviewers). The template must be updated to match Phase 4 design. — [Template: `get-shit-done/templates/review.md` lines 13-15 use PASS/PARTIAL/FAIL/BLOCKED; 04-CONTEXT.md specifies met/not-met/regression]

### Existing Error Handling (gaps)

- `get-shit-done/templates/review.md`: Uses v1 verdict scale (PASS/PARTIAL/FAIL/BLOCKED) and v1 reviewer types (Domain/Code/Integration). Phase 4 requires v2 verdict scale (met/not met/regression) and v2 reviewer types (end-user/functional/technical/code quality). Template must be rewritten. — `get-shit-done/templates/review.md:13-52`

- No reviewer agent definitions exist yet. All 4 reviewer agents and the review synthesizer agent must be created from scratch. No existing error handling to evaluate. — [Glob search: `agents/gsd-*review*` and `agents/gsd-synth*` returned no results]

- `agents/gsd-research-synthesizer.md`: Existing synthesizer has a quality gate (< 50 words = failed, > 3/6 fail = abort). Review synthesizer needs equivalent gates adapted for 4 inputs instead of 6. The threshold math changes: >= 2/4 failures = abort. — `agents/gsd-research-synthesizer.md:37-44`

- No re-review loop implementation exists. The planner self-critique loop (`agents/gsd-planner.md` self_critique section) is the closest precedent: 2 rounds max, hard stop, surface remaining issues. Review re-review loop needs similar hard-stop semantics but with a different trigger (user Accept -> fix -> re-review vs. planner draft -> critique -> fix). — `agents/gsd-planner.md:233-272`

### Known Issues in Ecosystem

- **LLM file:line citation hallucination**: LLMs frequently cite plausible but incorrect file paths and line numbers. The synthesizer spot-check is the mitigation, but it adds latency (synthesizer must read files to verify). Known pattern across all code review LLM tools. — [First principles: this is the primary reason 04-CONTEXT.md mandates spot-checking; no external URL needed — this is well-established LLM behavior]

- **Parallel LLM agent agreement bias**: When 4 LLM agents review the same code independently, they tend to converge on similar assessments because they share training data biases. This means 4 "met" verdicts do not provide 4x confidence — they may all miss the same class of bug. The synthesizer spot-check partially mitigates this. — [First principles: independent LLM instances are not truly independent — they share model weights and training biases; the spot-check adds a different evaluation mode (file reading vs. requirement tracing)]

- **Context window pressure with large codebases**: A reviewer tracing a requirement across multiple files must read those files into context. For features touching 10+ files, the reviewer's context fills quickly. At ~1500 token agent definition + requirement text + code file contents, a complex feature review could hit 50%+ context consumption per reviewer. — [Phase 2 EC-8 context budget overflow; `agents/gsd-planner.md` quality degradation curve shows quality degrades above 50% context usage]

- **One-at-a-time presentation bottleneck**: Presenting findings one-at-a-time (per 04-CONTEXT.md, matching Phase 3 Q&A pattern) means a review with 15 findings requires 15 user interactions. This is correct for decision quality but creates UX friction for clean reviews with many minor findings. — [04-CONTEXT.md: "Findings presented one-at-a-time (consistent with Phase 3 Q&A pattern)"; First principles: the tradeoff is correct — batching hides important decisions in noise]

- **Severity assignment timing**: Reviewers do NOT assign severity (by design). The synthesizer assigns severity after seeing all 4 reports. This means the synthesizer must infer severity from reviewer evidence without the reviewer's judgment. If reviewer evidence is thin (e.g., "file X does not match spec"), the synthesizer has insufficient signal to distinguish blocker from minor. — [04-CONTEXT.md: "Reviewers do NOT assign severity — they report verdicts and findings only"; First principles: severity requires cross-report context, which is why the synthesizer owns it — but it needs rich evidence to do this well]

---

## Risk Matrix

| Edge Case | Severity | Likelihood | Priority |
|-----------|----------|------------|----------|
| Reviewer produces empty/malformed output | High — review dimension missing | Medium — LLM quality variance | P1 — word count gate + retry |
| Contradictory verdicts on same REQ | None — designed behavior | High — expected | None — synthesizer handles |
| Spot-check finds wrong file:line citation | High — false finding presented to user | High — LLM hallucination pattern | P1 — mandatory spot-check before presentation |
| Re-review loop exceeds 2 cycles | Medium — unresolved issues persist | Low — most fixes resolve in 1 cycle | P2 — hard stop + clear labeling |
| Reviewer output exceeds context budget | Medium — degraded quality | Medium — complex features | P2 — output size constraint in agent definition |
| Reviewer traces wrong REQ layer | High — invalid findings | Low — agent definition prevents | P2 — synthesizer cross-check |
| No evidence found for a requirement | None — valid finding type | High — common in development | None — "not met" verdict with search documentation |
| User Dismisses blocker finding | Medium — user accepts risk | Low — rare with good severity labels | P2 — log decision, do not block |
| All reviewers miss same bug | High — false confidence | Low — spot-check mitigates | P1 — synthesizer spot-check is the only defense |
| Proven vs suspected regression ambiguity | Low — presentation issue | Medium — refactored code | P2 — clear labeling in output |
| No execution artifacts to review | High — meaningless review | Low — workflow guards prevent | P1 — pre-review artifact check |
| Ambiguous requirements upstream | Medium — uncertain verdicts | Medium — depends on requirement quality | P2 — reviewer flags ambiguity as distinct finding |
| Requirements drift between plan and review | Medium — stale verdicts | Low — short iteration cycles | P3 — snapshot comparison |
| Review template mismatch with Phase 4 design | High — wrong artifact structure | High — template is v1 | P1 — template rewrite required |
| Re-review fix causes new regression | Medium — new issue at cycle limit | Low — limited blast radius | P2 — scope re-review to affected areas |
| Gather-synthesize threshold too aggressive for 4 agents | Medium — abort on 2 failures | Low — reviewers are local, not network-dependent | P3 — accept 50% threshold |
| LLM agreement bias across 4 reviewers | Medium — false confidence | Medium — inherent to LLM architecture | P2 — spot-check is partial mitigation, accept residual risk |
| One-at-a-time presentation bottleneck | Low — UX friction, not correctness | High — every review session | P3 — accept, consistent with Phase 3 pattern |
| Severity inference from thin evidence | Medium — wrong severity assignment | Medium — depends on reviewer evidence quality | P2 — reviewer agent must produce rich evidence |

**Priority Key:**
- P1: Must be resolved before implementation. Blocking.
- P2: Should be resolved during implementation. Important.
- P3: Can be deferred. Nice-to-have or document-only fix.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Verdict scale edge cases | HIGH | 04-CONTEXT.md locked decisions specify exact 3-level scale |
| Spot-check necessity | HIGH | LLM file citation hallucination is well-documented behavior pattern |
| Re-review loop bounds | HIGH | 04-CONTEXT.md specifies max 2 cycles explicitly |
| Template mismatch | HIGH | Direct comparison of `review.md` template vs 04-CONTEXT.md decisions |
| Severity assignment timing | HIGH | 04-CONTEXT.md explicitly separates reviewer verdicts from synthesizer severity |
| Agreement bias risk | MEDIUM | First-principles reasoning about shared model weights; no empirical data for this specific system |
| Context budget pressure | MEDIUM | Extrapolated from Phase 2 EC-8 and planner quality degradation curve; no actual review context measurements |
| Re-review blast radius | MEDIUM | 04-CONTEXT.md says "re-review of affected areas" but does not define how affected areas are determined |
| Cross-feature regression handling | MEDIUM | 04-CONTEXT.md allows secondary observations but does not specify trace table handling for cross-feature findings |
