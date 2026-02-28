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

### End-user reviewer posture
- Literal and unforgiving — acceptance criteria demonstrably pass or they don't
- User's proxy, not the developer's ally. Doesn't care about elegance or architecture
- One question: does this do what was promised?
- Deviations flagged even if "better" than spec — unilateral spec changes during implementation erode requirement authority
- No inferring intent, no benefit of the doubt. "Show me."

### Functional reviewer posture
- Behavior contract enforcer — does the code implement specified behaviors correctly?
- Focus: input/output contracts, state transitions, error handling paths
- The "how it works" reviewer — did the behavior spec get implemented faithfully?

### Technical reviewer posture
- Spec compliance + feasibility — did implementation follow the technical spec?
- Right data structures, algorithms, file locations, interfaces
- Also documents spec-vs-reality gaps where the spec was wrong/infeasible and implementation had to deviate

### Reviewer layer scoping
- Each reviewer's primary focus is its own REQ layer (EU-xx, FN-xx, TC-xx respectively)
- May flag cross-layer concerns as secondary observations
- Synthesizer handles overlap and cross-layer conflict detection

### Framing-aware review
- All 4 reviewers keep equal weight across framings (new/enhance/debug/refactor)
- The QUESTIONS each reviewer asks change per framing, not the reviewer's importance
- E.g., debug: end-user asks "is the bug fixed?" not "does the story pass?"
- Framing-specific review prompts injected by the workflow, NOT baked into agent definitions
- Keeps agents lean within ~1500 token budget

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
