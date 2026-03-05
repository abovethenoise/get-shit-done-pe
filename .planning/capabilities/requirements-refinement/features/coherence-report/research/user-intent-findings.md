## User Intent Findings

### Primary Goal

Transform raw landscape-scan findings into a prioritized, goal-aligned recommendations document that shapes the refinement-qa conversation, so the user discusses actionable decisions rather than parsing individual finding cards. — [source: FEATURE.md EU-01 story, CAPABILITY.md architecture spine]

### Acceptance Criteria

- RECOMMENDATIONS.md is written to `.planning/refinement/` after a single Claude invocation — pass: file exists with all 7 sections (exec summary + 6 body sections including Q&A agenda); fail: missing sections or multiple invocations required — [source: FEATURE.md FN-02]
- Root causes group symptom finding IDs with explicit pointers (e.g., `root cause description -> [FINDING-001, FINDING-003]`) — pass: every root cause references at least one finding ID from landscape-scan output; fail: root causes without finding ID traceability — [source: FEATURE.md FN-02 section 2, EU-01 AC line 1]
- Systemic patterns span multiple root causes, not just restate individual findings — pass: each pattern references 2+ root causes or 3+ findings; fail: patterns that are 1:1 rewording of a single finding — [source: FEATURE.md FN-02 section 3]
- Goal alignment uses categorical labels (blocks/risks/irrelevant) per root cause, not numeric scores — pass: every root cause has exactly one of the three categories; fail: numeric scores or missing labels — [source: FEATURE.md TC-02, Decisions log]
- Goal alignment is skipped when PROJECT.md has no validated requirements — pass: new-project case produces severity+dependency prioritization only; fail: hallucinated goal alignment against nonexistent requirements — [source: FEATURE.md TC-02 final constraint]
- Resolution sequence is priority-ordered by severity + goal alignment + downstream impact — pass: higher severity + blocks alignment + more dependencies ranks higher; fail: arbitrary or alphabetical ordering — [source: FEATURE.md FN-02 section 5]
- Contradictions between recommendations are explicitly surfaced — pass: conflicting recommendations paired and flagged for Q&A; fail: contradictions silently resolved or omitted — [source: FEATURE.md FN-02 section 6, EU-01 AC line 4]
- Q&A agenda is embedded as the final section of RECOMMENDATIONS.md with three item categories (decision, informational, auto-resolve) — pass: each agenda item has category + what-to-discuss + recommended-resolution + confidence; fail: agenda in separate file or missing categorization — [source: FEATURE.md FN-03, Decisions log]
- Zero-findings case produces a clean bill of health report with coherence assessment — pass: RECOMMENDATIONS.md exists and contains project coherence assessment even with zero findings; fail: empty file or error — [source: FEATURE.md FN-02 final bullet, EU-01 AC line 5]
- Agent file is `agents/gsd-coherence-synthesizer.md`, receives contents not paths, performs no file I/O — pass: agent definition exists, orchestrator handles all disk reads/writes; fail: agent reads files directly — [source: FEATURE.md TC-01]
- RECOMMENDATIONS.md is consumable by refinement-qa (agenda loading in FN-01 of refinement-qa parses the Q&A agenda section) — pass: refinement-qa can parse agenda items from the final section; fail: format mismatch requiring manual intervention — [source: refinement-qa FEATURE.md FN-01]

### Implicit Requirements

- The Q&A agenda item format must be machine-parseable, not just human-readable prose, because refinement-qa FN-01 programmatically loads and categorizes agenda items — [source: refinement-qa FEATURE.md FN-01 lines 69-73, which specify parsing the Q&A agenda section and loading items by category]
- The agent must be opus-level (not sonnet) because cross-finding synthesis and goal alignment require stronger reasoning than per-pair analysis — [source: FEATURE.md TC-01 "opus-level reasoning needed"]
- Finding card IDs referenced in RECOMMENDATIONS.md must match the actual IDs produced by landscape-scan (FINDING-{NNN} format) — [First principles: if IDs don't match, traceability from recommendations back to scan findings breaks, and refinement-qa cannot load supporting context from `findings/` directory]
- The orchestrator (not the agent) must handle reading all input files and writing RECOMMENDATIONS.md, following the same separation pattern established by landscape-scan — [source: FEATURE.md TC-01 "No file I/O in agent -- clean separation same as landscape-scan agents"; landscape-scan FEATURE.md TC-02]
- Executive summary must include finding count by severity and key themes — this is the user's first-glance view and must be scannable without reading the full report — [source: FEATURE.md FN-02 section 1; First principles: user profile is "data professional" who values structure and scannability per CLAUDE.md]
- RECOMMENDATIONS.md section ordering is fixed (1-7) and must not be rearranged, because refinement-qa expects the Q&A agenda as the "final section" — [source: refinement-qa FEATURE.md FN-01 "Parse the Q&A agenda section (final section of RECOMMENDATIONS.md)"]

### Scope Boundaries

**In scope:**
- Synthesis agent definition (agents/gsd-coherence-synthesizer.md) — [source: FEATURE.md TC-01]
- Orchestration logic that loads scan artifacts and project context, invokes agent, writes RECOMMENDATIONS.md — [source: FEATURE.md FN-01, FN-02]
- RECOMMENDATIONS.md format with all 7 sections — [source: FEATURE.md FN-02, FN-03]
- Goal alignment scoring logic (categorical) — [source: FEATURE.md TC-02]
- Zero-findings path — [source: FEATURE.md FN-02]

**Out of scope:**
- Raw finding detection (landscape-scan) — [source: FEATURE.md EU-01 Out of Scope]
- User interaction / Q&A conversation (refinement-qa) — [source: FEATURE.md EU-01 Out of Scope]
- Delta computation across refinement runs (refinement-artifact) — [source: FEATURE.md EU-01 Out of Scope]
- Applying changes to capability/feature files (change-application) — [source: FEATURE.md EU-01 Out of Scope]
- CLI routes for file discovery (landscape-scan owns scan-discover, scan-pairs, scan-checkpoint) — [source: landscape-scan FEATURE.md TC-01]

**Ambiguous:**
- Whether the orchestrator for coherence-report is a new workflow file or part of the main refinement orchestrator workflow — FEATURE.md FN-01 says "Trigger from refinement orchestrator" but does not specify whether coherence-report has its own workflow file or is a step in a parent workflow — [source: FEATURE.md FN-01]
- Whether `.planning/refinement/` directory already exists when coherence-report runs (landscape-scan creates it) or whether coherence-report must handle directory creation — [First principles: landscape-scan writes to `.planning/refinement/` so it should exist, but defensive creation may be needed]
- What "confidence level" means for Q&A agenda items (FN-03) — no definition or categorical scale provided; contrast with finding severity (HIGH/MEDIUM/LOW) and goal alignment (blocks/risks/irrelevant) which are well-defined — [source: FEATURE.md FN-03 bullet 3]

### Risk: Misalignment

- The single-pass design assumes the context bundle (all scan artifacts + project context + all CAPABILITY.md files) fits within a single Claude invocation's context window. For large projects with many findings, this could exceed limits. The spec has no fallback strategy. — [source: FEATURE.md FN-02 "Single Claude invocation synthesizes the full report"; landscape-scan TC-03 defines tiers up to 50+ capabilities]
- FN-03 says the Q&A agenda is derived "from the resolution sequence" but refinement-qa expects three categories (decision/informational/auto-resolve) that don't map directly to resolution sequence entries. The categorization logic is left to the agent's judgment with no explicit rules for which items fall into which category. — [source: FEATURE.md FN-03 vs refinement-qa FEATURE.md FN-01-02]
- The "confidence level" field in Q&A agenda items (FN-03) is undefined — it could be interpreted as recommendation confidence, finding confidence, or resolution confidence. Without a clear definition, the agent will hallucinate a scale. — [source: FEATURE.md FN-03]
