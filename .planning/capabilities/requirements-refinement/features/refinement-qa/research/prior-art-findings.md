## Prior Art Findings

Context: refinement-qa walks the user through every coherence finding from RECOMMENDATIONS.md, presenting each for resolution (accept/reject/modify/research-needed), then enters an open-ended phase for user-initiated concerns. Output is CHANGESET.md consumed by change-application.

Key constraints: zero runtime deps, Node.js CommonJS, all user interaction via AskUserQuestion, follows GSD UI brand (stage banners, checkpoint boxes), workflow file orchestration, must produce machine-parseable CHANGESET.md.

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| GSD plan workflow finding-resolution loop | Walk through findings one-by-one via AskUserQuestion with accept/edit/guidance/dismiss options; collect responses; re-spawn if needed | proven (in-project) | high | `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` steps 8.3-8.5 |
| GitHub PR review comment-resolution model | Present findings inline with code context; author resolves each (done/respond/rework); batch submission of all resolutions | proven | medium | [GitHub Code Review](https://github.com/features/code-review), [Gerrit walkthrough](https://gerrit-review.googlesource.com/Documentation/intro-gerrit-walkthrough.html) |
| Linear triage inbox pattern | Items enter a queue; reviewer processes each with accept/decline/snooze/merge-as-duplicate; batch keyboard shortcuts for speed | proven | medium | [Linear Triage Docs](https://linear.app/docs/triage) |
| MADR decision recording | Structured per-decision records with context/options/outcome/consequences; status lifecycle (proposed -> accepted/rejected/deprecated) | proven | low | [MADR](https://adr.github.io/madr/), [MADR template primer](https://ozimmer.ch/practices/2022/11/22/MADRTemplatePrimer.html) |
| Perforce changelist / git staging model | Group discrete changes into a named set before committing; changes can be shelved, reviewed, or submitted as a batch | proven | low | [Perforce shelving](https://help.perforce.com/helix-core/server-apps/p4guide/2022.2/Content/P4Guide/shelve-changelists.html) |

### Detailed Analysis

#### 1. GSD Plan Workflow Finding-Resolution Loop (Highest Fit)

**How it works (steps 8.3-8.5 of plan.md):**

```
For each finding in [validation errors + planner self-critique]:
  AskUserQuestion:
    header: "Finding {N}/{total}"
    question: "[{category}] {description}\nSuggestion: {suggestion}\nAffected REQs: {reqs}"
    options: "Accept suggestion" | "Edit" | "Provide guidance" | "Dismiss"
  Record user response
Aggregate all responses
If any responses require action -> re-spawn planner with feedback
If all accepted/dismissed -> proceed
```

Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` steps 8.3.C through 8.5

**Why it's the best fit:**

1. **Same runtime context.** This pattern already works within Claude Code's AskUserQuestion constraint. No adaptation needed for the interaction model -- it's proven in the exact same environment. [Source: plan.md step 8.3.C]

2. **Same structural shape.** The plan workflow walks through N findings, collects a resolution per finding, aggregates results, and uses the aggregation to drive next steps. refinement-qa does exactly the same thing -- walk through N agenda items, collect a resolution per item, aggregate into CHANGESET.md. [First principles: the problem structure is isomorphic -- iterate items, collect decisions, produce output artifact]

3. **Option mapping is close.** Plan workflow uses 4 options (Accept/Edit/Guidance/Dismiss). refinement-qa needs 3 options (Accept/Research-needed/Reject-modify). The option count is even simpler. The "Edit" and "Provide guidance" options from plan workflow can be collapsed into the "Reject/Modify" option where the user provides reasoning or adjusted action text. [Source: FEATURE.md FN-02 vs plan.md step 8.3.C]

4. **Progress tracking.** Plan workflow uses "Finding {N}/{total}" header pattern for progress indication. refinement-qa should adopt this directly. [Source: plan.md step 8.3.C]

**Key adaptations needed:**

- Plan workflow's findings come from planner self-critique (generated in-session). refinement-qa's items come from a pre-existing RECOMMENDATIONS.md file (loaded from disk). This is simpler -- no generation step, just parsing.
- Plan workflow may re-spawn the planner after collecting feedback. refinement-qa does not re-spawn anything -- it writes CHANGESET.md directly. This is also simpler.
- Plan workflow has no open-ended phase. refinement-qa adds one after the structured walkthrough. This maps to the existing GSD Q&A exit pattern from discuss-capability/discuss-feature: "Does this look good or is there anything else?" loop. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/questioning.md` anti_hallucination section]

#### 2. GitHub PR / Gerrit Comment-Resolution Model

**How it works:**
- Reviewer posts comments on specific code locations
- Author processes each comment: marks "Done" (addressed), responds with explanation, or pushes a rework
- Comments are grouped by file/location, not presented in isolation
- Resolution is per-comment but submission is batched (all at once)

Source: [Gerrit walkthrough](https://gerrit-review.googlesource.com/Documentation/intro-gerrit-walkthrough.html), [GitHub Code Review](https://github.com/features/code-review)

**Fit assessment:**
- **Context grouping (useful):** PR reviews group comments by file, which reduces context-switching. refinement-qa's RECOMMENDATIONS.md already groups items by category (decision/informational/auto-resolve from coherence-report FN-03). This structural grouping should be preserved in presentation order.
- **Batch submission (useful concept, different implementation):** PR reviews submit all resolutions at once. For refinement-qa, the CHANGESET.md is written after all items are resolved -- this is effectively batch submission. No per-item writes.
- **Rework cycle (not applicable):** PR reviews trigger reworks (new patch sets). refinement-qa has no rework cycle -- it collects decisions and produces a change set. The change-application feature handles execution. [First principles: refinement-qa is a decision-collection pass, not an iterative improvement loop]
- **Interactive diff display (not applicable):** PR reviews show code diffs inline. refinement-qa shows finding summaries + recommendations. No code-level display needed.

**Verdict:** Useful for the concept of "grouped presentation order" but the interaction model doesn't map cleanly to AskUserQuestion's sequential nature. The GSD plan workflow is a better template.

#### 3. Linear Triage Inbox Pattern

**How it works:**
- Issues enter a triage queue
- Reviewer processes each: accept (to backlog), decline (cancel), snooze (defer), mark as duplicate
- Keyboard shortcuts enable rapid processing
- AI can suggest actions (team, project, assignee, labels)

Source: [Linear Triage Docs](https://linear.app/docs/triage), [Linear Triage Intelligence](https://linear.app/docs/triage-intelligence)

**Fit assessment:**
- **Action vocabulary (useful):** Linear's accept/decline/snooze maps closely to refinement-qa's accept/reject/research-needed. "Snooze" = "research needed" (come back later). "Decline" = "reject." This validates the 3-option model as sufficient for triage decisions.
- **Pre-categorization (useful):** Linear's triage intelligence suggests labels/teams before human review. coherence-report's Q&A agenda triage (decision/informational/auto-resolve) serves the same function -- pre-categorizing items by the type of human judgment required.
- **Batch keyboard shortcuts (not applicable):** Linear's speed comes from keyboard navigation. AskUserQuestion is inherently sequential. No batch shortcuts possible.
- **Queue model vs. agenda model:** Linear's triage is an ongoing queue (items arrive continuously). refinement-qa's agenda is finite and fully known upfront. This means refinement-qa can show progress ("Item 3/12") and maintain context about what's coming, which Linear's queue model doesn't emphasize.

**Verdict:** Validates the 3-option resolution model and pre-categorization concept. Does not change the implementation approach.

### Recommended Starting Point

**GSD plan workflow finding-resolution loop (steps 8.3-8.5):** This is the direct internal precedent. It solves the same structural problem (walk through N items, collect per-item decisions via AskUserQuestion, aggregate results) in the same runtime environment (Claude Code). The refinement-qa workflow should replicate this pattern with three adaptations:

1. **Resolution options:** Replace Accept/Edit/Guidance/Dismiss with Accept/Research-needed/Reject-modify per FEATURE.md FN-02
2. **Open-ended phase:** Add the discuss-capability/discuss-feature Q&A exit loop ("Does this look good?" pattern from `questioning.md`) after the structured walkthrough
3. **Output artifact:** Write CHANGESET.md instead of collecting planner re-spawn feedback

This is not a "start from scratch" task -- it's an adaptation of proven in-project machinery. The plan workflow's finding loop is ~50 lines of workflow markdown. The refinement-qa workflow will be similar in size.

Sources: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` steps 8.3-8.5, `/Users/philliphall/get-shit-done-pe/get-shit-done/references/questioning.md` anti_hallucination section, FEATURE.md FN-02/FN-03

### Anti-Patterns

- **Per-item file writes during Q&A:** Writing to CHANGESET.md after each individual resolution (instead of collecting all resolutions, then writing once at the end). This creates partial state on disk that change-application could accidentally read if the session is interrupted. The plan workflow collects all responses in memory before acting on them (step 8.4 "Aggregate all user responses"). refinement-qa should do the same -- accumulate in-memory, write CHANGESET.md only after the open-ended phase completes. -- [First principles: partial writes create invalid intermediate state; the plan workflow avoids this by aggregating before acting; `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` step 8.4]

- **Presenting items without recommendation context:** Showing the finding description but not the recommended action. GitHub PR reviews work because reviewers see the code diff alongside the comment. Linear triage works because items have enough context to act on. refinement-qa must present both the finding summary AND the recommendation from RECOMMENDATIONS.md in each AskUserQuestion, so the user can make an informed accept/reject decision without having to read a separate document. -- [Source: FEATURE.md FN-02 specifies "Finding summary + affected capabilities + recommendation" per item; [Gerrit walkthrough](https://gerrit-review.googlesource.com/Documentation/intro-gerrit-walkthrough.html) shows reviewers need full context to resolve comments]

- **ADR-style per-decision documents:** Creating a separate markdown file for each resolution decision (like MADR creates one file per architectural decision). This would produce 10-20 files for a typical refinement run, adding directory clutter and requiring a separate aggregation step. The single CHANGESET.md artifact is the right output format -- all decisions in one file, structured for machine parsing. -- [First principles: ADRs are designed for long-lived architectural decisions that accumulate over a project lifetime; refinement resolutions are short-lived instructions consumed by change-application in the same session; creating individual files for ephemeral decisions violates KISS]

- **Severity-based skipping (auto-resolving low-severity items):** Tempting to auto-accept "informational" or "auto-resolvable" items from the Q&A agenda without presenting them to the user. The FEATURE.md explicitly decides against this: "All items are discussed regardless of severity -- no filtering or skipping" (FN-01). Even "auto-resolvable" items should be presented (potentially in batch) so the user maintains awareness. The coherence-report's three-bucket triage should affect *how* items are presented (batch vs. individual), not *whether* they are presented. -- [Source: FEATURE.md FN-01 decision; Linear triage similarly requires human action on every item in the queue -- nothing auto-resolves without reviewer action]

- **Re-spawning a synthesis agent during Q&A:** The plan workflow re-spawns the planner when the user provides guidance (step 8.5). This makes sense for planning (the plan needs regeneration). For refinement-qa, there is no agent to re-spawn -- the recommendations are already generated, and the user is simply deciding which to accept. If the user rejects a recommendation, the rejection goes directly into CHANGESET.md -- no need to regenerate anything. Adding a re-synthesis step would violate the clean pipeline separation (coherence-report generates, refinement-qa decides, change-application executes). -- [First principles: the pipeline architecture separates generation from decision from execution; re-synthesis during decision would blur coherence-report and refinement-qa boundaries; CAPABILITY.md architecture spine confirms this separation]

### Libraries / Tools

No external libraries recommended. The implementation uses:

- **Existing GSD workflow infrastructure:** Workflow file (`workflows/refinement-qa.md` or embedded in refinement orchestrator) following the same pattern as `plan.md`. No new tooling needed. [Source: FEATURE.md TC-01]
- **AskUserQuestion:** Claude Code's built-in tool for all user interaction. Already used extensively in plan.md, discuss-capability.md, discuss-feature.md. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/questioning.md`]
- **`gsd-tools.cjs` for CHANGESET.md writing:** The `refinement-write` CLI route from refinement-artifact handles disk writes. The Q&A workflow collects decisions in-memory and passes the complete change set to this route. [Source: FEATURE.md TC-01]
- **`gsd-tools.cjs` for CHANGESET.md parsing downstream:** The `changeset-parse` CLI route (new, from TC-02) reads CHANGESET.md and returns JSON for change-application. Not needed during Q&A itself. [Source: FEATURE.md TC-02]

### Canonical Patterns

- **Sequential-item-resolution with progress tracking (GSD plan.md):** Present items one-by-one via AskUserQuestion with "Finding {N}/{total}" headers, collect resolution per item, aggregate all resolutions before acting. This is the primary pattern to replicate. The key structural elements: (a) total count in header for progress, (b) finding context in question body, (c) fixed option set per item type, (d) in-memory aggregation, (e) single output write after completion. -- [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` steps 8.3-8.5]

- **Batched presentation for low-judgment items:** For items categorized as "informational" or "auto-resolvable" by the Q&A agenda (coherence-report FN-03), present as a batch summary rather than one-by-one. Pattern: show a table of N items with recommended actions, then a single AskUserQuestion: "Accept all N informational items as shown, or select items to discuss individually?" This is borrowed from Linear's triage model (batch actions on similar items) and from the plan workflow's info-severity pattern (step 8.9: "Info findings presented as a batch summary, not individual Q&As"). -- [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md` step 8.9; [Linear Triage Docs](https://linear.app/docs/triage)]

- **Open-ended exit loop (GSD questioning.md):** After structured items complete, enter "Does this look good or is there anything else?" loop. User can raise new concerns, override assumptions, or revisit decisions. Loop until user confirms done. This is the established GSD Q&A exit pattern used in discuss-capability and discuss-feature. Every AskUserQuestion goes through the tool -- no plain-text questions. -- [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/questioning.md` anti_hallucination section; discuss-capability.md guided_exploration step]

- **Change set as typed entries (ADR-inspired):** Each resolution becomes a typed entry (ACCEPT/MODIFY/REJECT/RESEARCH_NEEDED/ASSUMPTION_OVERRIDE/USER_INITIATED) with structured fields (source, affected capabilities, action, reasoning). This borrows ADR's principle of recording the decision *with its rationale*, not just the outcome. But unlike ADRs, entries are ephemeral (consumed by change-application in the same session) and stored in a single file, not individual documents. -- [Source: FEATURE.md FN-04; [MADR](https://adr.github.io/madr/) for the "record rationale with decision" principle]

- **Contradiction resolution via paired presentation:** When RECOMMENDATIONS.md contains contradictions (two recommendations that conflict), present them as a pair in a single AskUserQuestion rather than sequentially. This avoids the user accepting recommendation A without realizing it conflicts with recommendation B. Pattern: "These two recommendations conflict: [A summary] vs [B summary]. Which direction?" with options for each recommendation + "discuss further." -- [Source: FEATURE.md FN-02 specifies "Contradictions presented as paired items"; [First principles: sequential presentation of contradictions risks inconsistent decisions because the user lacks the pairing context when resolving the first item]]
