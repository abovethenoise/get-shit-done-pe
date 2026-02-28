# Phase 4: Review Layer - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

4 specialist reviewers run in parallel (end-user, functional, technical, code quality), each tracing executed work against their requirement layer. A synthesizer consolidates reports, verifies findings, resolves conflicts, and presents recommendations to the user.

</domain>

<decisions>
## Implementation Decisions

### Verdict scale
- 3-level: met / not met / regression (no "partially met" — too subjective)
- Regression includes both proven (test fails, removed function) and suspected (code analysis), clearly labeled so synthesizer can weight them differently

### Finding evidence
- Every finding cites file:line, quotes relevant code/behavior, and explains reasoning
- Findings without evidence are not actionable — reviewer must show its work

### Severity assignment
- Reviewers do NOT assign severity — they report verdicts and findings only
- Synthesizer assigns severity (blocker / major / minor) after seeing all 4 reports with full context

### Conflict resolution
- Synthesizer uses judgment first, priority ordering (user > functional > technical > quality) as tiebreaker
- Synthesizer spot-checks reviewer findings by reading cited file:line references before presenting
- Overlapping findings from different reviewers presented separately — user sees both perspectives
- Mandatory conflicts section includes both outright disagreements and tensions between reviewer recommendations

### User presentation
- Findings presented one-at-a-time (consistent with Phase 3 Q&A pattern)
- 5 response options per finding: Accept / Accept w/ Edit (freeform) / Research (freeform) / Defer / Dismiss
- Any "Accept" or "Accept w/ Edit" triggers re-review of affected areas after fixes applied
- Max 2 re-review cycles, then surface remaining issues for manual resolution

### Code quality reviewer posture
- Hardest to please in the system — default posture is "prove this complexity is necessary"
- Opinionated about outcomes (simplicity, readability, maintainability), NOT preferences (formatting, bracket style, equivalent-complexity alternatives)
- Judges against the ideal, always — never anchors to existing codebase quality. Notes context ("improvement over existing 200-line pattern, still exceeds target") but flags regardless
- Judgment-based assessment, no mechanical thresholds — is the complexity justified by what the code does?
- Unnecessary dependencies are in scope — same "prove it" posture applies to imports
- "This abstraction isn't earning its keep" = valid finding. "I'd have used a different pattern at the same complexity" = noise.

### Agent sizing
- All reviewer and synthesizer agents should be Goldilocks-sized: ~1500 tokens max per agent definition
- No bloated prompts — every line earns its token cost

### Claude's Discretion
- Exact trace report structure (as long as it includes verdict, evidence, and REQ mapping)
- How to detect regressions (diff analysis, test results, behavioral comparison)
- Synthesizer's internal consolidation algorithm

</decisions>

<specifics>
## Specific Ideas

- Code quality reviewer should be the "guilty until proven innocent" agent — the one that keeps entropy from winning
- Findings should note context even when flagging against ideal (e.g., "improvement over existing pattern, but still exceeds target")

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-review-layer*
*Context gathered: 2026-02-28*
