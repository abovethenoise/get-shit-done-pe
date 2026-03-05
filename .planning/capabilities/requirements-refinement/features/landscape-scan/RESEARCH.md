---
lens: new
secondary_lens: null
subject: requirements-refinement/landscape-scan
date: 2026-03-05
---

# Research Synthesis

**Synthesized:** 2026-03-05
**Subject:** requirements-refinement/landscape-scan
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### Output Path Mismatch is the Highest-Priority Spec Bug

Landscape-scan FEATURE.md FN-05 specifies `scan-output/` as the output directory, but coherence-report FEATURE.md FN-01 reads from `.planning/refinement/`. This is a producer-consumer contract violation that will block the downstream pipeline. Must be reconciled before implementation.

[Sources: User Intent, Edge Cases, Existing System]

### 50KB Bash Buffer is a Known Constraint with Existing Solution

`scan-discover` returning all capability contents as JSON will exceed the 50KB Bash buffer limit (current project artifacts total ~134KB for 8 capabilities). The existing `output()` function in `core.cjs:31-39` handles this via `@file:<path>` tmpfile fallback. Orchestrator must handle the `@file:` prefix.

[Sources: Existing System, Tech Constraints, Edge Cases]

### Context Window Growth is Unbounded and Needs Active Management

Per-pair agent receives cap_A + cap_B contents + all accumulated prior findings. This grows linearly with completed pairs. For 20 caps (190 pairs), later pairs could approach or exceed practical context limits. Mitigations: include only findings relevant to the current pair, periodically summarize accumulated findings, or cap context at a fixed token budget.

[Sources: Domain Truth, Tech Constraints, Edge Cases]

### Sequential Pair Analysis is Correct but Creates Ordering Sensitivity

Sequential execution enables later pairs to reference earlier findings ("another symptom of FINDING-003"), producing higher-quality analysis. However, this creates ordering bias: early pairs have zero prior context, and LLMs exhibit recency bias toward the second capability presented. Mitigations: deterministic alphabetical ordering (already specified), symmetric capability presentation in agent prompt.

[Sources: Domain Truth, Prior Art, Edge Cases]

### Pairwise Analysis Captures the Vast Majority of Coherence Issues

NIST combinatorial testing research shows 70-95% of defects are triggered by pairwise interactions of just two variables. Higher-order analysis (triples, etc.) has exponential cost and diminishing returns. The pairwise approach is sound.

[Sources: Domain Truth, Prior Art]

### mgrep Pre-Filter Has a Blocking Issue: .mgrepignore Excludes .planning/

`.mgrepignore` line 39 excludes `.planning/`. Since capability artifacts live in `.planning/capabilities/`, mgrep will return zero results for these files. The medium-tier pre-filter (TC-03, 21-50 caps) is currently non-functional. Either remove `.planning/` from `.mgrepignore` or implement a non-mgrep pre-filter (keyword extraction + set intersection in pure JS).

[Sources: Edge Cases, Tech Constraints]

### Zero Runtime Dependencies Constraint Limits Clustering Options

GSD ships only vendored js-yaml + argparse. No external libraries for clustering, NLP, or similarity scoring are available. The large-project tier (50+ caps) must use metadata-based clustering (frontmatter tags, `consumes:` field, directory structure) rather than algorithmic approaches.

[Sources: Existing System, Tech Constraints, Prior Art]

### Existing Utility Functions Cover Most Discovery Needs

`cmdCapabilityList`, `listAllFeaturesInternal`, `findCapabilityInternal`, `findFeatureInternal`, `safeReadFile`, `extractFrontmatter`, and `output()` provide the foundation for `scan-discover`. Key caveat: `cmdCapabilityList` silently skips directories without CAPABILITY.md, but the spec requires these to be flagged as GAP findings.

[Sources: Existing System, Tech Constraints]

### Finding Card Schema Aligns with SARIF Field Semantics

The FEATURE.md's finding card schema (type, severity, affected capabilities, doc sources with file:line, summary, recommendation) maps naturally to SARIF's proven vocabulary (ruleId, level, locations, message, physicalLocation). Adopt SARIF field semantics without SARIF JSON format -- keep markdown+frontmatter consistent with the rest of GSD.

[Sources: Prior Art, Domain Truth]

### Dedup is a Clustering Problem, Not a Filtering Problem

Naive deduplication yields bug counts at least 10x larger than root-cause clustering (Igor, CCS 2021). Two findings may look different (different pairs, different wording) but trace to the same root cause. A Claude consolidation pass is the right approach for <50 findings per run -- no algorithmic machinery needed.

[Sources: Domain Truth, Prior Art]

### Checkpoint/Resume via File Markers is the Canonical Pattern

Per-pair checkpointing using `scan-output/pairs/{A}-{B}.complete` files is exactly the standard HPC/batch processing pattern. Pure `fs.existsSync()` on resume, `fs.writeFileSync()` on completion. Each pair analysis must be idempotent.

[Sources: Prior Art, Domain Truth, Tech Constraints]

### Categorical Confidence (HIGH/MEDIUM/LOW) Over Numeric Scores

LLM-generated numeric confidence scores are poorly calibrated. Categorical ratings reduce the illusion of precision and map directly to action thresholds.

[Sources: Domain Truth, Prior Art]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### Pipeline Invariant #5 vs TC-02 (Contents vs Paths)

**Tech Constraints says:** Pipeline Invariant #5 states orchestrators should pass file paths, not content, to subagents.
**Existing System / User Intent say:** TC-02 explicitly requires "Agent receives contents (not paths) -- no file I/O in the reasoning agent." The gather-synthesize pattern already follows this approach.

**Resolution:** TC-02 is a deliberate, justified override of the invariant. Scan-pair agents analyze text, not modify files. The invariant targets executor agents that need to write files. No conflict -- just document the intentional deviation.

### Output as Single File vs Separate Files

**User Intent says:** FN-05 specifies `scan-output/summary.md` as the output. Ambiguous whether matrix, findings, and dependency graph are also separate files.
**Edge Cases says:** Coherence-report expects separate files: `matrix.md`, `dependency-graph.md`, `findings/FINDING-{id}.md`.

**Resolution:** Both are needed. Individual finding cards written per-pair (for checkpointing). Summary file assembled at the end. Coherence-report's expected input format is the authoritative consumer contract.

### Tier Boundary at 20 Capabilities

**Edge Cases says:** FEATURE.md TC-03 says "Small (<=20 caps)" but BRIEF.md says "Small (<20 caps)". Off-by-one at n=20 changes behavior.
**User Intent says:** TC-03 specifies "Small (<=20 caps)".

**Resolution:** FEATURE.md is the authoritative spec. Use `<=20` for small tier. BRIEF.md is exploratory and lower-authority.

### Checkpoint Slug Collision

**Edge Cases says:** Pair key `cli-tooling-framing-and-discovery` in `{A}-{B}.complete` format is ambiguous because slugs contain hyphens.
**Existing System says:** `generateSlugInternal` produces hyphenated strings.

**Resolution:** Use a double-underscore separator (`{A}__{B}.complete`) or directory structure (`pairs/{A}/{B}.complete`). This is a real bug in the spec that must be fixed before implementation.

## Gaps

Missing information, unfilled dimensions, and low-confidence findings. The planner must account for these unknowns.

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **mgrep integration details** -- TC-03 specifies "mgrep pre-filter" for medium tier but the exact integration (how key terms are extracted, what "high textual proximity" means quantitatively) is underspecified. Single source: User Intent.
- **Large-tier clustering quality** -- metadata-based clustering (using frontmatter tags, `consumes:` field) is proposed but untested. Quality depends entirely on how well capabilities are tagged, which varies per project. Single source: Tech Constraints.
- **Claude Code context compaction hangs** -- a long-running scan loop may trigger compaction mid-scan, freezing the process (GitHub issue #19567). Not validated against the specific sequential pair pattern. Single source: Edge Cases.
- **Claude Code agent output cap at 32K tokens** -- scan-pair agent analyzing two large capabilities may produce truncated output (GitHub issue #10738). Not validated for current model versions. Single source: Edge Cases.

### Unanswered Questions

- What is the exact output directory? `scan-output/` or `.planning/refinement/`? Requires a spec decision.
- Should finding cards be written as individual markdown files or embedded in a single summary? Coherence-report expects individual files, but the spec is ambiguous.
- How does the consolidation pass (FN-04) for 50+ cap projects work? Is global cross-cluster dedup a separate Claude invocation?
- What happens when a scan-pair agent returns malformed output? No validation schema or retry strategy is specified.
- How should the scan handle the `consumes:` field in CAPABILITY.md frontmatter for explicit dependency detection?

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable -- violating them leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| 50KB Bash buffer limit; `output()` handles via `@file:` tmpfile | Existing System, Tech Constraints | scan-discover output will exceed this; orchestrator must handle `@file:` prefix |
| Zero runtime dependencies (only vendored js-yaml + argparse) | Existing System, Tech Constraints, Prior Art | No clustering/NLP/graph libraries; all logic must be pure Node.js |
| CommonJS module system (`require()`/`module.exports`) | Existing System | New scan.cjs module must follow this pattern |
| CLI router is flat switch in gsd-tools.cjs | Existing System | New routes added as top-level cases; no sub-router |
| Agent receives contents not paths (stateless scan-pair agent) | Existing System, User Intent, Tech Constraints | scan-pair agent cannot do file I/O; all context injected by orchestrator |
| ~200K token context window (~800KB) per subagent | Tech Constraints | Combined cap contents + accumulated findings must stay under this |
| 32K token agent output limit | Edge Cases | scan-pair output may truncate for large capability pairs |
| Sequential pair execution (not parallel) | Domain Truth, Prior Art, Tech Constraints | 28 pairs at 30-60s each = 15-30 min wall time for current project |
| Subagents cannot spawn subagents | Edge Cases | All orchestration must happen in parent agent/workflow |
| `.mgrepignore` excludes `.planning/` | Edge Cases | mgrep pre-filter for medium tier is non-functional without workaround |
| Capability slugs are hyphenated | Existing System, Edge Cases | Pair checkpoint naming needs non-hyphen separator to avoid ambiguity |
| `cmdCapabilityList` skips dirs without CAPABILITY.md | Existing System, Edge Cases | scan-discover must independently check for orphan capability directories |

## Recommended Scope

Actionable guidance for the planner: what to build, what to skip, what needs more investigation.

### Build (In Scope)

- **scan-discover CLI route** (TC-01) -- enumerate all capabilities, features, and artifact types; compute completeness; flag GAP findings for missing docs. Builds on existing `cmdCapabilityList` + `listAllFeaturesInternal` but adds orphan-dir detection. [Supported by: Existing System, Tech Constraints]
- **scan-pairs CLI route** (TC-01) -- generate sorted pair list from capability slugs. Trivial combinatorial logic. [Supported by: Tech Constraints feasibility assessment]
- **scan-checkpoint CLI route** (TC-01) -- read/write checkpoint markers per pair. Use double-underscore separator for pair keys. [Supported by: Prior Art, Edge Cases]
- **gsd-scan-pair.md agent** (TC-02) -- receives two capabilities' contents + prior findings as XML blocks; outputs structured finding cards. Must explicitly prompt for conflict detection (LLMs won't surface conflicts spontaneously). Use `role_type: executor` for sonnet. [Supported by: Domain Truth, Existing System, Prior Art]
- **New lib module `scan.cjs`** -- exports `cmdScanDiscover`, `cmdScanPairs`, `cmdScanCheckpoint`. CommonJS, pure Node.js. [Supported by: Existing System]
- **Orchestrator workflow/command** -- drives the scan loop: discover -> enumerate pairs -> iterate sequentially (skip checkpointed) -> spawn per-pair agent -> write findings + checkpoint -> consolidation pass -> three-layer output. [Supported by: User Intent, Prior Art]
- **Small-tier full pairwise** (TC-03, <=20 caps) -- the only tier needed for the current project (8 caps, 28 pairs). [Supported by: Tech Constraints, User Intent]
- **Finding card format** -- markdown+frontmatter with SARIF-informed field semantics (type, severity, affected_capabilities, doc_sources, summary, recommendation, root_cause). Fixed taxonomy: CONFLICT, GAP, OVERLAP, DEPENDS_ON, ASSUMPTION_MISMATCH, ALIGNMENT. [Supported by: Prior Art, Domain Truth]
- **Consolidation pass** (FN-04) -- single Claude call with all findings as input; groups N symptoms into M root causes. [Supported by: Domain Truth, Prior Art]
- **Three-layer output** (FN-05) -- relationship matrix, finding cards, dependency graph. Write as separate files (matrix.md, findings/, dependency-graph.md) to satisfy coherence-report's consumer contract. [Supported by: User Intent, Edge Cases]
- **Checkpoint/resume** (EU-02) -- file-marker per pair + scan-meta.json for finding ID counter continuity. Validate checkpoint integrity on resume. [Supported by: Prior Art, Domain Truth, Edge Cases]

### Skip (Out of Scope)

- **Medium-tier mgrep pre-filter** (TC-03, 21-50 caps) -- blocked by `.mgrepignore` excluding `.planning/`; mgrep is not a GSD dependency; current project has 8 caps. YAGNI. Defer until a project actually needs it. [Supported by: Edge Cases, User Intent YAGNI principle]
- **Large-tier clustering** (TC-03, 50+ caps) -- no clustering libraries available; metadata-based clustering untested; no known GSD project has 50+ caps. Defer. [Supported by: Tech Constraints, Prior Art]
- **Full SARIF JSON output format** -- GSD is markdown-native; adopting SARIF JSON creates friction for agents and humans. Borrow semantics, not format. [Supported by: Prior Art]
- **Graph database for dependency analysis** -- overkill for <100 capabilities; violates zero-deps constraint. Flat markdown with typed edges is sufficient. [Supported by: Prior Art]
- **Checkpoint invalidation on artifact change** -- explicitly out of scope per EU-02. [Supported by: User Intent]
- **Feature-to-feature pairwise analysis** -- explicitly deferred per BRIEF.md. [Supported by: User Intent]

### Investigate Further

- **Output directory reconciliation** -- must decide: `scan-output/` or `.planning/refinement/`? Check coherence-report FEATURE.md FN-01 to determine the authoritative consumer contract. This is a blocking spec bug. [Gap: User Intent, Edge Cases both flag it]
- **Accumulated findings context management strategy** -- what is the cutoff? Include only findings relevant to current pair? Summarize after every N pairs? Fixed token budget? Needs a design decision before implementation. [Gap: Domain Truth, Tech Constraints identify the problem but not the solution]
- **Agent output validation** -- what happens when scan-pair returns malformed findings? Retry? Skip? Log and continue? Needs a design decision. [Gap: Edge Cases identifies the risk]
- **Pair checkpoint naming** -- confirm double-underscore (`{A}__{B}.complete`) or directory structure (`pairs/{A}/{B}.complete`) resolves the slug collision issue. [Gap: Edge Cases identifies the bug]
