---
lens: plan
secondary_lens: null
subject: requirements-refinement/refinement-qa
date: 2026-03-05
---

# Research Synthesis

**Synthesized:** 2026-03-05
**Subject:** requirements-refinement/refinement-qa
**Gatherer Results:** 6/6 succeeded

## Consensus

### Plan Workflow Finding-Resolution Loop Is the Primary Template

The GSD plan workflow (steps 8.3-8.5) is the direct internal precedent: walk N items via AskUserQuestion with progress headers ("Finding {N}/{total}"), collect per-item resolution, aggregate, then act. refinement-qa is structurally isomorphic -- iterate agenda items, collect decisions, produce CHANGESET.md. The open-ended phase maps to the existing Q&A exit loop from discuss-feature/discuss-capability ("Does this look good or is there anything else?").

[Sources: Prior Art, Existing System, Tech Constraints]

### AskUserQuestion Cannot Capture Free-Text Inline -- Two-Step Pattern Required

AskUserQuestion presents selectable options (2-4 ideal), not free-text fields. "Research needed" and "Reject/Modify" require user-provided reasoning text. The solution: after user selects an option requiring text, issue a follow-up AskUserQuestion or prompt conversationally for the text. This doubles interaction steps for those resolution types.

[Sources: Tech Constraints, Edge Cases, Prior Art]

### Three Resolution Options Is Correct

3 options (Accept / Research Needed / Reject-Modify) is within AskUserQuestion's 2-4 ideal range, validated by cognitive load research as near-optimal for sequential decisions, and confirmed by Linear triage's similar accept/decline/snooze model. The review workflow proves 5 options work; 3 is safe.

[Sources: Domain Truth, Tech Constraints, Prior Art]

### `refinement-write` Does Not Support "changeset" Type -- Must Be Resolved

The planned `refinement-write` CLI route accepts types: matrix, dependency-graph, finding, delta, checkpoint, recommendations. "changeset" is NOT in this list. Either add it (~5 lines) or write CHANGESET.md directly. Additionally, `refinement.cjs` does not exist yet -- it is planned but unbuilt.

[Sources: Existing System, Tech Constraints, Edge Cases]

### `changeset-parse` CLI Route Must Be Built

TC-02 requires a `changeset-parse` route in gsd-tools.cjs for change-application to consume CHANGESET.md as JSON. This route does not exist. It must be created as part of this feature (or as a prerequisite). ~50-80 lines following established gsd-tools patterns.

[Sources: Existing System, Tech Constraints, User Intent, Edge Cases]

### Q&A Agenda Table Format Is a Cross-Feature Contract

The coherence-report defines the Q&A Agenda as a 5-column markdown table: `# | Category | Topic | Recommended Resolution | Confidence`. refinement-qa's FN-01 must parse this exact structure. No code enforces this contract yet -- deviation breaks parsing silently.

[Sources: Existing System, Tech Constraints, Edge Cases]

### Decision Fatigue on Long Agendas Is a Real Risk

Research shows decision quality drops non-linearly over sequential decisions (judges: 65% -> near 0% before breaks). Under fatigue, users default to the lowest-cost option (ACCEPT). A 15+ item agenda will produce unreflective acceptances on later items. Batching auto-resolvable/informational items mitigates this.

[Sources: Domain Truth, Edge Cases, Prior Art]

### Context Window Exhaustion Threatens Long Sessions

50+ agenda items at ~500-1000 tokens each = 25K-50K tokens of Q&A history, plus loaded artifacts. Auto-compaction triggers at 64-75% capacity and can hang or lose earlier resolutions. The pipeline invariant says orchestrators should stay at 10-15% context.

[Sources: Edge Cases, Tech Constraints]

### AskUserQuestion Empty Response Bug Is a Session Risk

Known bug (GH #29547 and 5+ related issues). Guard hook exists but only catches empty responses. For a 50-item session at 5% failure rate = 2-3 items silently auto-resolved. Must never auto-advance on empty response.

[Sources: Tech Constraints, Edge Cases]

### Contradiction Pairs Must Be Presented Adjacently

FN-02 says contradictions are "paired items" but the Q&A agenda has no pairing column. If items are walked in priority order, contradiction partners may be separated by many items. User accepts A at position 5, encounters contradicting B at position 20 without remembering A. Must present pairs adjacently with explicit cross-reference.

[Sources: Edge Cases, Prior Art, Domain Truth]

## Conflicts

### Incremental Writes vs. Single Output

**Edge Cases says:** Write CHANGESET.md incrementally with `status: partial` after each item/batch to survive session interruptions and reduce context pressure. Support resume from partial state.

**Prior Art says:** Collect all resolutions in-memory, write CHANGESET.md once after open-ended phase completes. Per-item writes create invalid intermediate state (anti-pattern from plan workflow which aggregates before acting).

**Resolution:** Both are valid but serve different failure modes. The key insight from Edge Cases is that Claude Code sessions are not durable -- a 30-item session can be lost to `/clear` or timeout. Prior Art is correct that partial state on disk is risky. **Recommended approach:** accumulate in-memory during the session, but write a checkpoint to disk after each batch of 5-7 items with `status: partial` frontmatter. `changeset-parse` should refuse to parse partial changesets (preventing change-application from acting on incomplete data). On resume, detect partial CHANGESET.md and continue from last checkpoint. This balances durability against intermediate-state risk.

### Auto-Resolvable Items: Individual vs. Batch Presentation

**Domain Truth / User Intent says:** FEATURE.md decides "all items discussed regardless of severity -- no filtering or skipping." Every item gets individual AskUserQuestion.

**Prior Art / Edge Cases says:** Auto-resolvable items should be batched ("Accept all N informational items?") to reduce fatigue. Plan workflow step 8.9 uses batch summaries for info-severity findings.

**Resolution:** These can coexist. "No skipping" means the user sees every item, not that every item gets its own AskUserQuestion. Batch presentation of auto-resolvable items (show table, "Accept all or review individually?") satisfies both constraints: nothing is skipped, but low-judgment items don't cause fatigue. The FEATURE.md decision forbids silent skipping, not batch confirmation.

### Workflow File: Standalone vs. Embedded

**User Intent notes:** TC-01 says "workflows/refinement-qa.md (or embedded in the main refinement workflow)" -- left undecided.

**Edge Cases says:** Separate file means a new Task spawn (fresh context -- good for long Q&A). Embedded means Q&A runs in orchestrator context (bad for long sessions due to context pressure).

**Resolution:** Standalone workflow file at `workflows/refinement-qa.md`. Long Q&A sessions need context isolation. The orchestrator loads artifacts, spawns the Q&A workflow, and receives CHANGESET.md as output. This matches the pattern from coherence-report (separate agent with separate context).

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **Contradiction pair detection mechanism** -- Only Edge Cases covers this in detail. The Q&A agenda table has no pairing column; the pairing must be inferred from the Contradictions section (section 6) of RECOMMENDATIONS.md. No gatherer verified what this section's format actually looks like. [Source: Edge Cases]

- **CHANGESET.md exact markdown structure** -- FN-04 specifies 6 entry types with fields (type, source, capabilities, action, reasoning) but the exact heading levels, field delimiters, and section separators are unspecified. `changeset-parse` needs a concrete schema. [Source: Existing System]

- **Sorting of USER_INITIATED entries in CHANGESET.md** -- FN-04 says "sorted by type, then by finding severity" but user-initiated items have no severity. Sorting order for these entries is undefined. [Source: Edge Cases]

- **How "deeper questions" (FN-02 bullet 5) work within AskUserQuestion** -- The user should be able to ask follow-up questions about a finding before resolving it. AskUserQuestion uses fixed options. An "Ask a question" 4th option or conversational pattern is needed but unspecified. [Source: User Intent]

### Unanswered Questions

1. What is the exact markdown format of RECOMMENDATIONS.md section 6 (Contradictions)? The pairing mechanism depends on this.
2. Should `changeset-parse` live in `refinement.cjs` or a standalone module? Ownership is ambiguous between refinement-qa (TC-02) and refinement-artifact (which owns other CLI routes).
3. What happens when item count exceeds 99? Header "QA 100/150" = 11 chars (safe), but "QA 1000/1500" = 13 chars (exceeds 12-char limit). Practically unlikely but unhandled.
4. How does the zero-findings case flow? Skip structured phase, enter open phase directly, but the exit prompt "Does this look good?" assumes prior work to confirm.

## Constraints Discovered

| Constraint | Source | Impact |
|-----------|--------|--------|
| AskUserQuestion header max 12 characters | Tech Constraints | Headers like "Contradiction" (13 chars) will be rejected. Use "QA {N}/{T}" format (max 10 chars for 2-digit counts). |
| AskUserQuestion only available in orchestrator context, not inside Task() subagents | Tech Constraints | If refinement-qa runs as a Task subagent, it CANNOT use AskUserQuestion. Must run in orchestrator context or as the primary workflow. |
| Zero runtime dependencies -- Node.js stdlib + vendored js-yaml only | Tech Constraints | All parsing (markdown tables, CHANGESET.md) must use string splitting / regex. No external markdown or YAML parsers. |
| AskUserQuestion cannot capture free-text inline | Tech Constraints, Edge Cases | "Research needed" and "Reject/Modify" require a two-step pattern: select option, then capture text via follow-up or chat. |
| `refinement.cjs` does not exist yet | Tech Constraints, Existing System | `parseMarkdownTable` and `refinement-write` are planned but unbuilt. Must either build prerequisites or inline the logic (~20 lines for table parsing). |
| Q&A agenda table format is an implicit contract | Existing System, Tech Constraints | 5-column pipe-delimited table. Any coherence-report format change silently breaks refinement-qa parsing. |
| 50KB Bash buffer limit for CLI output | Existing System | Large CHANGESET.md may need `@file:` prefix pattern for CLI output. |
| AskUserQuestion empty response bug (GH #29547) | Tech Constraints, Edge Cases | Must never auto-advance on empty response. Treat as retry. |
| Pipeline invariant: orchestrators stay at 10-15% context | Edge Cases | Cannot hold all finding cards + full Q&A history in orchestrator context. Must load lazily per item. |
| CHANGESET.md must be parseable by `changeset-parse` returning JSON | User Intent, Tech Constraints | Format must be defined precisely enough for deterministic parsing. Schema-first design required. |

## Recommended Scope

### Build (In Scope)

- **Workflow file at `workflows/refinement-qa.md`** -- Standalone file following plan.md's finding-resolution loop pattern. Separate from orchestrator for context isolation. [Sources: Prior Art, Edge Cases, Tech Constraints]
- **Structured Q&A phase** -- Per-item AskUserQuestion with "QA {N}/{T}" headers, 3 options (Accept / Research Needed / Reject-Modify), two-step text capture for non-accept options. Batch presentation for auto-resolvable items. [Sources: all 6 gatherers agree on structure]
- **Open-ended phase** -- "Does this look good?" exit loop from questioning.md. Supports USER_INITIATED entries, ASSUMPTION_OVERRIDE entries, and revisiting structured decisions. [Sources: Prior Art, User Intent, Domain Truth]
- **CHANGESET.md output format** -- Define exact markdown schema (heading levels, field delimiters) with frontmatter (date, status, counts). Write once after session completes, with periodic checkpoint writes (status: partial) for durability. [Sources: User Intent, Edge Cases, Prior Art]
- **`changeset-parse` CLI route** -- New function in refinement.cjs (or standalone module), wired into gsd-tools.cjs switch. Reads CHANGESET.md, returns JSON. Refuses partial changesets. [Sources: Existing System, Tech Constraints, User Intent]
- **Inline table parser for Q&A agenda** -- ~20 lines of pipe-delimited table parsing. Do not depend on refinement.cjs `parseMarkdownTable` existing yet. [Sources: Tech Constraints]
- **Contradiction pair adjacency logic** -- When walking agenda, detect contradiction pairs (from RECOMMENDATIONS.md section 6) and present them adjacently with cross-references. [Sources: Edge Cases, Prior Art, Domain Truth]
- **Empty response guard for Q&A** -- Never auto-advance on empty AskUserQuestion return. Retry the item. After 3 consecutive empties, pause and instruct user to type `/clear`. [Sources: Edge Cases, Tech Constraints]

### Skip (Out of Scope)

- **Per-decision ADR files** -- Single CHANGESET.md is correct; individual files per decision violate KISS for ephemeral decisions. [Source: Prior Art]
- **Re-synthesis during Q&A** -- No re-spawning coherence agents. Q&A collects decisions; it does not regenerate recommendations. [Source: Prior Art]
- **Severity-based auto-skipping** -- FEATURE.md explicitly forbids. Batch presentation is fine; silent skipping is not. [Source: User Intent, Prior Art]
- **Resume from partial CHANGESET.md** -- Nice to have but adds significant complexity (detecting partial state, skipping resolved items, merging). Defer to a future iteration unless the plan is trivially small. [Source: Edge Cases -- identified but high implementation cost]
- **Adding "changeset" type to `refinement-write`** -- Until refinement.cjs exists, this is blocked. Write CHANGESET.md directly via file write (precedent from coherence-report fallback pattern). Migrate later. [Sources: Existing System, Tech Constraints]

### Investigate Further

- **CHANGESET.md exact schema** -- Must be defined before implementation. Entry heading levels, field format (key: value? markdown table?), section separators, frontmatter fields. The planner should define this schema as step 1, then build `changeset-parse` and the writer against it simultaneously. [Gap: no gatherer produced a concrete schema]
- **Contradiction section format in RECOMMENDATIONS.md** -- The pairing mechanism depends on how coherence-report formats section 6. Check coherence-report's plan/spec for the exact structure before designing the pair-detection logic. [Gap: Low-confidence finding]
- **AskUserQuestion + Task() interaction** -- If refinement-qa runs as a standalone workflow file, confirm it executes in orchestrator context (not as a Task subagent) so AskUserQuestion is available. The constraint is hard -- if violated, zero user interaction is possible. [Source: Tech Constraints]
- **"Deeper questions" interaction pattern** -- FN-02 says users can ask deeper questions mid-discussion. This needs a concrete design: 4th option "Ask a question"? Conversational text between AskUserQuestion calls? The spec is silent on mechanism. [Source: User Intent]
