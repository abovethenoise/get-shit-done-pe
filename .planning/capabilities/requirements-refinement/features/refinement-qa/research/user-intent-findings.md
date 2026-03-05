## User Intent Findings

### Primary Goal

Give the user a structured conversation that walks through every coherence finding from the scan, collects deliberate accept/reject/defer decisions on each, captures user-initiated concerns alongside automated findings, and outputs a machine-parseable change set that change-application can execute without further clarification. — [source: FEATURE.md EU-01, EU-02, FN-04; CAPABILITY.md architecture spine]

### Acceptance Criteria

- Every agenda item from RECOMMENDATIONS.md Q&A section is presented individually via AskUserQuestion -- none are skipped regardless of severity or category — pass: item count presented equals item count in Q&A agenda section; fail: any item omitted or batched silently — [source: FEATURE.md EU-01 AC line 1, Decisions "all items discussed regardless of severity"]
- Each item offers exactly 3 resolution options: Accept, Research Needed (with text input), Reject/Modify (with reasoning) — pass: AskUserQuestion for each item shows these 3 and only these 3 options; fail: fewer, more, or differently labeled options — [source: FEATURE.md FN-02, Decisions "3 resolution options"]
- User can ask deeper questions about any finding mid-discussion and receive context (related findings, source docs) before resolving — pass: Claude responds with contextual detail when asked; fail: forces immediate resolution without allowing follow-up — [source: FEATURE.md FN-02 bullet 5]
- Contradictions from RECOMMENDATIONS.md are presented as paired items so the user resolves the direction — pass: contradiction pairs are shown together with both sides visible; fail: contradictions presented independently without cross-reference — [source: FEATURE.md FN-02 final bullet]
- After structured items complete, an open-ended phase begins where the user can raise new concerns, override assumptions, or revisit earlier decisions — pass: open phase is reached; user can add USER_INITIATED and ASSUMPTION_OVERRIDE entries; fail: workflow ends after structured items — [source: FEATURE.md FN-03, EU-02]
- Exit uses the "Does this look good or is there anything else to discuss?" loop pattern -- continues until user explicitly confirms done — pass: loop repeats on continued input; exits on confirmation; fail: exits after one round or exits without confirmation — [source: FEATURE.md FN-03, Decisions "exit follows existing GSD Q&A pattern"]
- CHANGESET.md is written to `.planning/refinement/CHANGESET.md` with structured entries containing: type (ACCEPT|MODIFY|REJECT|RESEARCH_NEEDED|ASSUMPTION_OVERRIDE|USER_INITIATED), source, affected capabilities, action, reasoning — pass: file exists with all fields populated per entry; fail: missing fields or non-standard types — [source: FEATURE.md FN-04]
- CHANGESET.md has a summary header with counts by type — pass: summary exists and counts match actual entries; fail: missing or inaccurate summary — [source: FEATURE.md FN-04 final bullet]
- CHANGESET.md is parseable by `gsd-tools changeset-parse` returning JSON — pass: CLI route can read and return structured JSON; fail: format requires manual parsing — [source: FEATURE.md TC-02]
- RESEARCH_NEEDED items are tracked but not executed by change-application — pass: entries have type RESEARCH_NEEDED and are excluded from actionable set in change-application FN-01; fail: research items treated as actionable — [source: FEATURE.md TC-02, change-application FEATURE.md FN-01]
- REJECT items are logged in the change set but not executed — pass: entries exist with type REJECT and reasoning; change-application skips them; fail: rejected items omitted entirely or executed — [source: FEATURE.md TC-02]
- User-initiated items from the open phase produce change set entries with identical structure to report-driven items — pass: USER_INITIATED entries have the same fields (type, source, capabilities, action, reasoning); fail: different structure or free-text-only — [source: FEATURE.md EU-02 AC line 3]
- ASSUMPTION_OVERRIDE entries include reasoning from the user explaining why the finding is by-design — pass: reasoning field populated with user text; fail: empty reasoning or missing type — [source: FEATURE.md EU-02 AC line 2, Decisions "ASSUMPTION_OVERRIDE is a distinct entry type"]

### Implicit Requirements

- Agenda items must be presented in the priority order defined by RECOMMENDATIONS.md resolution sequence, not in arbitrary order — resolution sequence reflects severity + goal alignment + downstream impact, and Q&A should follow that ordering so high-impact items are resolved first — [source: FEATURE.md FN-02 "Walk through every agenda item in priority order"; coherence-report FEATURE.md FN-02 section 5 defines resolution sequence priority]
- The workflow must load supporting context (finding cards, matrix, dependency graph) alongside agenda items so Claude can answer deeper questions without additional file reads — [source: FEATURE.md FN-01 lines 72-73 "Load supporting context: finding cards from findings/, matrix from matrix.md, dependency graph from dependency-graph.md"]
- The orchestrator must handle all file I/O (reading RECOMMENDATIONS.md, writing CHANGESET.md), not the Q&A agent itself — this follows the clean separation pattern established by landscape-scan and coherence-report — [source: FEATURE.md TC-01 "No file I/O for scan artifacts -- orchestrator loads and passes contents"; landscape-scan TC-02, coherence-report TC-01]
- Revisiting a structured decision during the open phase must update (not duplicate) the corresponding change set entry — if the user changes their mind on FINDING-003 during the open phase, the original resolution should be replaced — [First principles: duplicate entries for the same finding would cause change-application to attempt conflicting mutations]
- The `changeset-parse` CLI route must be implemented as part of this feature (or refinement-artifact), since change-application FN-01 depends on it to parse CHANGESET.md into executable entries — [source: FEATURE.md TC-02 "Parseable by gsd-tools.cjs (new CLI route: changeset-parse)"; change-application FEATURE.md FN-01]
- The workflow must use GSD UI brand patterns (stage banners with `GSD > {STAGE}`, checkpoint boxes, status symbols) — not stated in refinement-qa requirements but mandatory per PROJECT.md brand standards — [source: PROJECT.md Brand & Design Standards; FEATURE.md TC-01 "Follows GSD UI brand patterns (stage banners, checkpoint boxes)"]
- The Q&A agenda items from RECOMMENDATIONS.md must have a parseable format with category, description, and recommended resolution -- the coherence-report feature defines the format but refinement-qa's FN-01 must know how to parse it — [First principles: FN-01 says "Parse the Q&A agenda section" which requires an agreed format between coherence-report FN-03 and this feature's FN-01]
- AskUserQuestion is mandatory for all user interaction -- no plain-text questions — this is a hard GSD convention visible in discuss-feature's guided_exploration step — [source: FEATURE.md TC-01 "Uses AskUserQuestion for all user interaction (mandatory per GSD conventions)"; discuss-feature workflow line 114 "MANDATORY: Every question MUST go through AskUserQuestion"]

### Scope Boundaries

**In scope:**
- Workflow file for refinement Q&A orchestration — [source: FEATURE.md TC-01]
- Agenda loading and parsing from RECOMMENDATIONS.md — [source: FEATURE.md FN-01]
- Structured Q&A phase with AskUserQuestion per item — [source: FEATURE.md FN-02]
- Open-ended phase for user-initiated concerns and assumption overrides — [source: FEATURE.md FN-03]
- CHANGESET.md output with structured entries — [source: FEATURE.md FN-04]
- `changeset-parse` CLI route for machine-readable output — [source: FEATURE.md TC-02]

**Out of scope:**
- Generating recommendations (coherence-report) — [source: FEATURE.md EU-01 Out of Scope]
- Running the scan (landscape-scan) — [source: FEATURE.md EU-01 Out of Scope]
- Applying changes to capability/feature files (change-application) — [source: FEATURE.md EU-01 Out of Scope]
- Running additional scans mid-Q&A (would restart the pipeline) — [source: FEATURE.md EU-02 Out of Scope]
- The `refinement-write` CLI route (owned by refinement-artifact) — [source: FEATURE.md TC-01 "Change set writing uses refinement-write CLI route from refinement-artifact"]

**Ambiguous:**
- Whether refinement-qa is its own workflow file (`workflows/refinement-qa.md`) or a step embedded in the main refinement orchestrator workflow — TC-01 says "Workflow file: workflows/refinement-qa.md (or embedded in the main refinement workflow)" leaving this undecided — [source: FEATURE.md TC-01]
- Whether `changeset-parse` is a new CLI route built by this feature or by refinement-artifact — TC-02 says this feature needs it, but refinement-artifact TC-01 also defines CLI routes (`refinement-init`, `refinement-write`) — ownership is unclear — [source: FEATURE.md TC-02 vs refinement-artifact FEATURE.md TC-01]
- How agenda item categories (decision/informational/auto-resolve from coherence-report FN-03) affect the Q&A flow — FN-02 presents all items with 3 options regardless of category, so it is unclear whether "auto-resolvable" items get a different default or presentation — [source: FEATURE.md FN-02 vs coherence-report FEATURE.md FN-03]
- What happens in the zero-findings case — coherence-report produces a "clean bill of health" but there is no specification for what refinement-qa does when the Q&A agenda is empty (skip straight to open phase? confirm the clean bill?) — [First principles: zero findings means zero structured items, but the user should still see the clean bill and have a chance to raise concerns in the open phase]

### Risk: Misalignment

- The FEATURE.md says "Change set writing uses `refinement-write` CLI route from refinement-artifact" (TC-01) but refinement-artifact is P2 while refinement-qa is P1. If refinement-artifact is not built first, refinement-qa has no write route. The plan must either sequence refinement-artifact's CLI routes before refinement-qa, or refinement-qa must write CHANGESET.md directly and migrate later. — [source: FEATURE.md TC-01; CAPABILITY.md feature table priority ordering]
- The three agenda item categories from coherence-report (decision/informational/auto-resolve) suggest different handling, but refinement-qa FN-02 treats all items identically with the same 3 options. "Auto-resolvable" items getting the same treatment as "decision" items may feel tedious to the user, undermining the "thorough but not wasteful" intent. — [source: coherence-report FEATURE.md FN-03 vs refinement-qa FEATURE.md FN-02; First principles: the user said "all items discussed" but also values efficiency per CLAUDE.md "KISS"]
- The "deeper questions" capability (FN-02 bullet 5) is described as a conversation mid-AskUserQuestion, but AskUserQuestion is a structured tool with fixed options. There is no mechanism described for free-form follow-up questions within the AskUserQuestion paradigm -- this may require an additional "Ask a question" option or a different interaction pattern. — [source: FEATURE.md FN-02 "User can ask deeper questions about any finding during discussion"; discuss-feature workflow shows AskUserQuestion with fixed options only]
