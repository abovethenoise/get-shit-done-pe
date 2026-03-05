---
type: feature
capability: "requirements-refinement"
status: specified
created: "2026-03-05"
---

# coherence-report

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| FN-03 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |
| TC-02 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: Synthesized coherence recommendations

**Story:** As a GSD user, I want scan findings interpreted, prioritized, and aligned to my project goals, so that I can discuss actionable recommendations in Q&A rather than parsing raw finding cards myself.

**Acceptance Criteria:**

- [ ] RECOMMENDATIONS.md contains root causes grouped with pointers to finding card IDs
- [ ] Systemic patterns identified across findings (not just individual issues)
- [ ] Findings prioritized into a resolution sequence aligned to project goals
- [ ] Contradictions between recommendations explicitly surfaced
- [ ] Zero-findings case produces a "clean bill of health" report
- [ ] RECOMMENDATIONS.md is the primary input to refinement-qa (shapes the Q&A agenda)

**Out of Scope:**

- Raw finding detection (landscape-scan's job)
- User interaction / Q&A (refinement-qa's job)
- Delta computation across runs (refinement-artifact's job)

## Functional Requirements

### FN-01: Context loading

**Receives:** Trigger from refinement orchestrator after landscape-scan completes.

**Returns:** Loaded context bundle for synthesis.

**Behavior:**

- Read project context: PROJECT.md (goals, requirements), ROADMAP.md (current priorities), STATE.md (current position)
- Read all scan artifacts from `.planning/refinement/`:
  - matrix.md (relationship matrix)
  - dependency-graph.md (dependency table)
  - findings/ (all FINDING-{id}.md cards)
- Load all capability files for reference (CAPABILITY.md from each capability)
- Bundle everything as structured input for the synthesis pass

### FN-02: Single-pass synthesis

**Receives:** Context bundle from FN-01.

**Returns:** RECOMMENDATIONS.md written to `.planning/refinement/`.

**Behavior:**

- Single Claude invocation synthesizes the full report
- RECOMMENDATIONS.md structure:
  1. **Executive Summary:** Finding count by severity, key themes, overall project coherence assessment
  2. **Root Causes:** Each root cause grouped with its symptom finding IDs. Format: root cause description → [FINDING-001, FINDING-003, FINDING-007]
  3. **Systemic Patterns:** Cross-cutting patterns that span multiple root causes (e.g., "3 capabilities assume auth but none specify the contract")
  4. **Goal Alignment:** Each root cause assessed against PROJECT.md goals — does this finding threaten a validated requirement? Block an active requirement? Affect an out-of-scope area?
  5. **Resolution Sequence:** Priority-ordered list of recommended actions. Higher priority = higher severity + more goal alignment + more downstream impact. Each action references the root cause(s) it addresses.
  6. **Contradictions:** Cases where recommendations conflict (e.g., "finding A recommends adding a dependency, finding B recommends removing that same dependency"). Flagged for Q&A resolution.
- Zero findings: write clean bill of health with project coherence assessment (still useful context)

### FN-03: Q&A agenda shaping

**Receives:** Completed RECOMMENDATIONS.md.

**Returns:** Structured Q&A agenda embedded in RECOMMENDATIONS.md (final section).

**Behavior:**

- From the resolution sequence, derive a Q&A agenda:
  - Items requiring user decision (contradictions, ambiguous severity, strategic tradeoffs)
  - Items that are informational only (clear fixes, no tradeoffs)
  - Items that can be auto-resolved (obvious gaps, missing docs)
- Each agenda item includes: what to discuss, recommended resolution, confidence level
- refinement-qa consumes this agenda to drive its conversation flow

## Technical Specs

### TC-01: Synthesis agent

**Intent:** Dedicated agent for coherence synthesis. Keeps the reasoning logic separate from orchestration.

**Upstream:** Orchestrator loads all context files and passes as structured input.

**Downstream:** RECOMMENDATIONS.md consumed by refinement-qa and refinement-artifact (for delta).

**Constraints:**

- Agent file: `agents/gsd-coherence-synthesizer.md`
- Agent receives: all scan artifacts + project context files (contents, not paths)
- Agent outputs: RECOMMENDATIONS.md content (orchestrator handles disk write)
- Model: inherit (opus-level reasoning needed for cross-finding synthesis and goal alignment)
- No file I/O in agent — clean separation same as landscape-scan agents

### TC-02: Goal alignment scoring

**Intent:** Structured assessment of how each finding relates to project goals, not just a text narrative.

**Upstream:** PROJECT.md validated requirements list, ROADMAP.md active focus groups.

**Downstream:** Resolution sequence prioritization uses goal alignment as a ranking factor.

**Constraints:**

- Each root cause gets a goal alignment assessment:
  - `blocks`: which validated/active requirements this root cause directly threatens
  - `risks`: which requirements could be affected indirectly
  - `irrelevant`: explicitly out-of-scope areas (low priority in resolution sequence)
- Alignment is categorical, not scored — avoids false precision
- If PROJECT.md has no validated requirements (new project), skip goal alignment and prioritize by severity + dependency impact only

## Decisions

- 2026-03-05: RECOMMENDATIONS.md (not REPORT.md) to avoid naming collision with refinement-artifact's directory-level concerns.
- 2026-03-05: Single synthesis pass — one Claude invocation, no staged pipeline within this feature.
- 2026-03-05: Zero findings produces clean bill of health (pipeline continues, Q&A confirms).
- 2026-03-05: Goal alignment is categorical (blocks/risks/irrelevant), not numeric.
- 2026-03-05: Q&A agenda embedded in RECOMMENDATIONS.md as final section — single artifact for refinement-qa to consume.
