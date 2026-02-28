## User Intent Findings

### Primary Goal

The user wants a review layer that proves executed work satisfies its requirements by having independent specialist reviewers trace code back to specs, so that unverified output never reaches the documentation stage. -- [source: `.planning/PROJECT.md` core value: "every requirement is verified against the actual code"]

### Acceptance Criteria

Derived from CONTEXT.md decisions and REQUIREMENTS.md, each with a testable pass/fail condition:

- **AC-01: 4 parallel reviewers execute independently** -- Pass: end-user, functional, technical, and code quality reviewers each produce a report without reading each other's output. Fail: any reviewer receives another reviewer's findings as input. -- [source: `04-CONTEXT.md` "4 specialist reviewers run in parallel"; `REQUIREMENTS.md` REVW-01]

- **AC-02: 3-level verdict scale per requirement** -- Pass: every requirement in a trace report receives exactly one of: met / not met / regression. Fail: any other verdict value appears (including "partially met"). -- [source: `04-CONTEXT.md` "3-level: met / not met / regression (no 'partially met' -- too subjective)"]

- **AC-03: Evidence-backed findings** -- Pass: every finding cites file:line, quotes relevant code/behavior, and explains reasoning. Fail: any finding lacks a file:line citation or quoted evidence. -- [source: `04-CONTEXT.md` "Findings without evidence are not actionable"]

- **AC-04: Reviewers do not assign severity** -- Pass: reviewer trace reports contain only verdicts and findings. Fail: any reviewer output includes blocker/major/minor labels. -- [source: `04-CONTEXT.md` "Reviewers do NOT assign severity"]

- **AC-05: Synthesizer assigns severity after consolidation** -- Pass: synthesizer output includes blocker/major/minor for every finding, assigned with full cross-report context. Fail: severity missing or assigned without referencing multiple reports. -- [source: `04-CONTEXT.md` "Synthesizer assigns severity (blocker / major / minor) after seeing all 4 reports"]

- **AC-06: Synthesizer spot-checks before presenting** -- Pass: synthesizer reads cited file:line references from reviewer reports to verify accuracy. Fail: synthesizer presents findings without verification. -- [source: `04-CONTEXT.md` "Synthesizer spot-checks reviewer findings by reading cited file:line references before presenting"]

- **AC-07: Mandatory conflicts section** -- Pass: synthesizer output includes a conflicts section covering both outright disagreements and tensions between reviewers. Fail: conflicts section is missing or only covers one type. -- [source: `04-CONTEXT.md` "Mandatory conflicts section includes both outright disagreements and tensions"]

- **AC-08: Priority ordering as tiebreaker** -- Pass: when synthesizer resolves conflicts, judgment is applied first; user > functional > technical > quality ordering used only when judgment is insufficient. Fail: priority ordering is applied mechanically without judgment. -- [source: `04-CONTEXT.md` "Synthesizer uses judgment first, priority ordering as tiebreaker"]

- **AC-09: One-at-a-time presentation** -- Pass: findings are presented to user sequentially, consistent with Phase 3 Q&A pattern. Fail: findings are batched or dumped as a single report. -- [source: `04-CONTEXT.md` "Findings presented one-at-a-time (consistent with Phase 3 Q&A pattern)"]

- **AC-10: 5 response options per finding** -- Pass: user is offered Accept / Accept w/ Edit / Research / Defer / Dismiss for each finding. Fail: any option is missing or additional options are added. -- [source: `04-CONTEXT.md` "5 response options per finding"]

- **AC-11: Re-review capped at 2 cycles** -- Pass: "Accept" or "Accept w/ Edit" triggers re-review of affected areas; maximum 2 re-review cycles enforced. Fail: more than 2 re-review cycles occur, or re-review is skipped after acceptance. -- [source: `04-CONTEXT.md` "Max 2 re-review cycles, then surface remaining issues for manual resolution"]

- **AC-12: End-user reviewer is literal and unforgiving** -- Pass: end-user reviewer flags deviations from spec even when the deviation is arguably better. Fail: reviewer exercises benefit of the doubt or approves "better than spec" changes without flagging. -- [source: `04-CONTEXT.md` "Deviations flagged even if 'better' than spec"]

- **AC-13: Each reviewer scoped to its REQ layer** -- Pass: end-user reviews EU-xx, functional reviews FN-xx, technical reviews TC-xx. Cross-layer observations are labeled as secondary. Fail: reviewer produces primary findings outside its layer. -- [source: `04-CONTEXT.md` "Each reviewer's primary focus is its own REQ layer"]

- **AC-14: Agent definitions are ~1500 tokens max** -- Pass: each reviewer and synthesizer agent definition fits within approximately 1500 tokens. Fail: any agent definition substantially exceeds this budget. -- [source: `04-CONTEXT.md` "~1500 tokens max per agent definition"]

- **AC-15: Framing-specific review prompts are injected, not baked in** -- Pass: framing-specific questions (e.g., debug: "is the bug fixed?") are supplied by the workflow at runtime, not hardcoded in agent definitions. Fail: agent definitions contain framing-specific logic. -- [source: `04-CONTEXT.md` "Framing-specific review prompts injected by the workflow, NOT baked into agent definitions"]

### Implicit Requirements

- **Regression detection must cover both proven and suspected cases** -- The context specifies regressions include "both proven (test fails, removed function) and suspected (code analysis), clearly labeled." This means the reviewer output format must distinguish between proven and suspected regressions so the synthesizer can weight them differently. The distinction is critical but easy to lose in implementation. -- [source: `04-CONTEXT.md` regression definition]

- **Overlapping findings must preserve both perspectives** -- The context says overlapping findings from different reviewers are "presented separately -- user sees both perspectives." This implies the synthesizer must NOT deduplicate findings even when two reviewers flag the same issue. The user wants to see the same problem through different lenses. -- [source: `04-CONTEXT.md` "Overlapping findings from different reviewers presented separately"]

- **Code quality reviewer must judge against the ideal, not the codebase** -- The quality reviewer "never anchors to existing codebase quality" but must "note context." This means every quality finding needs two data points: (1) how far from ideal, and (2) whether it's an improvement or regression relative to existing code. Both are required. -- [source: `04-CONTEXT.md` "Judges against the ideal, always"]

- **Code quality reviewer owns dependency scrutiny** -- "Unnecessary dependencies are in scope -- same 'prove it' posture applies to imports." This extends the quality reviewer's domain beyond code structure to include import/dependency analysis, which is not mentioned in REVW-06 but is explicitly decided. -- [source: `04-CONTEXT.md` code quality reviewer posture]

- **The review layer must handle all 4 framings with equal weight** -- The context says "All 4 reviewers keep equal weight across framings" but the questions change. This means the review workflow must inject different question sets per framing (debug/new/enhance/refactor) without changing reviewer priority or posture. The framing injection mechanism must exist even though Phase 6 owns the full workflow. -- [First principles: Phase 4 must build the injection point even if Phase 6 populates it; otherwise Phase 6 would need to retrofit agent definitions]

- **The synthesizer is a verification layer, not just a merge** -- Spot-checking cited file:line means the synthesizer must have read access to source code and must actually verify reviewer claims. It is not a passive aggregator. This has a direct implication: the synthesizer's context window must include both all 4 reports AND access to the codebase. -- [source: `04-CONTEXT.md` "spot-checks reviewer findings by reading cited file:line references"]

- **REVW-02 in REQUIREMENTS.md says "partially met" but CONTEXT.md overrides this** -- REQUIREMENTS.md specifies the verdict scale as "met / partially met / not met / regression" but the user explicitly decided in discussion to remove "partially met" as too subjective, replacing it with a 3-level scale. The CONTEXT.md decision takes precedence. -- [source: `REQUIREMENTS.md` REVW-02 vs `04-CONTEXT.md` verdict scale decision]

### Scope Boundaries

**In scope:**
- 4 reviewer agent definitions (end-user, functional, technical, code quality) -- [source: `REQUIREMENTS.md` REVW-01 through REVW-06]
- 1 synthesizer agent definition -- [source: `REQUIREMENTS.md` REVW-07]
- Review workflow: spawn reviewers in parallel, collect reports, run synthesizer, present to user -- [source: `04-CONTEXT.md` decisions section]
- User presentation loop with 5 response options -- [source: `04-CONTEXT.md` user presentation]
- Re-review mechanism (max 2 cycles) -- [source: `04-CONTEXT.md` re-review]
- Framing injection point in reviewer prompts (slot for framing-specific questions) -- [source: `04-CONTEXT.md` framing-aware review]

**Out of scope:**
- Populating framing-specific question sets (Phase 6: WKFL-07) -- [source: `ROADMAP.md` Phase 6 requirements]
- Executing fixes from accepted findings (that's the executor's domain) -- [First principles: review judges work, it doesn't do work]
- Test suite generation or execution (explicitly out of scope per `REQUIREMENTS.md` "AI-generated test suites in orchestrator") -- [source: `REQUIREMENTS.md` out of scope table]
- Auto-advancing past review without user confirmation -- [source: `REQUIREMENTS.md` out of scope: "Auto-advance through stages"]

**Ambiguous:**
- Who triggers re-review after fixes? The review layer defines max 2 cycles, but the fix-then-re-review loop crosses into execution territory. Phase 4 needs to define the re-review entry point; Phase 6 wires it into the full pipeline.
- How does the synthesizer handle the case where a reviewer produces zero findings? Is that a valid report (all requirements met) or a failure signal (reviewer didn't engage)?
- What happens to "Defer" and "Dismiss" findings? They exit the review loop, but do they persist anywhere for future reference? The Phase 3 Q&A pattern doesn't have equivalents for these.

### Risk: Misalignment

- **REVW-02 verdict scale mismatch** -- REQUIREMENTS.md says "partially met" is a valid verdict; CONTEXT.md explicitly removes it. If REQUIREMENTS.md is not updated, downstream phases (especially Phase 6 workflows) may implement the wrong scale. The CONTEXT.md decision should be treated as authoritative, and REQUIREMENTS.md should be flagged for update. -- [source: `REQUIREMENTS.md` REVW-02 vs `04-CONTEXT.md` verdict scale]

- **ROADMAP.md success criteria #2 contradicts CONTEXT.md** -- ROADMAP.md Phase 4 success criterion 2 says reviewers produce "per-requirement verdicts" AND "finding severity (blocker / major / minor)." But CONTEXT.md explicitly moves severity assignment to the synthesizer, not reviewers. The roadmap success criteria need revision. -- [source: `ROADMAP.md` Phase 4 success criteria #2 vs `04-CONTEXT.md` severity assignment]

- **Code quality reviewer scope is broader than REVW-06** -- REVW-06 says "traces for DRY, KISS, no over-complexity, no bloat, no obsolete code." The CONTEXT.md decisions add dependency scrutiny, judgment-based assessment (no mechanical thresholds), and the "guilty until proven innocent" posture. REVW-06 undersells what was decided. -- [source: `REQUIREMENTS.md` REVW-06 vs `04-CONTEXT.md` code quality reviewer posture]

- **Re-review scope risk** -- The 2-cycle re-review cap is clear, but "re-review of affected areas" is vague. Does this mean the full 4-reviewer parallel pass runs again, or only the reviewer(s) whose domain was affected? Full re-review is expensive (4 parallel agents x 2 cycles = up to 8 additional reviewer runs). The user likely intends targeted re-review of affected areas only, but this is not explicitly stated. -- [First principles: the user values efficiency (KISS, YAGNI principles) and would not want 8 redundant reviewer runs when only 1 domain was affected]
