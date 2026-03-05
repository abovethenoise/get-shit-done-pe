## Prior Art Findings

Context: landscape-scan needs to (1) enumerate capability pairs, (2) analyze each pair for conflicts/gaps/overlaps via Claude, (3) produce structured finding cards, (4) deduplicate/consolidate findings, (5) generate three-layer output, (6) checkpoint/resume, and (7) scale for large projects.

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| SARIF-style finding cards | OASIS standard for structured static analysis results with ruleId, level, locations, fingerprints, correlationGuid | proven | high | [SARIF v2.1.0 spec](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html) |
| DefectDojo dedup model | Hash-based + unique-ID deduplication with cross-tool consolidation and endpoint-aware grouping | proven | medium | [DefectDojo dedup docs](https://docs.defectdojo.com/en/working_with_findings/finding_deduplication/deduplication_algorithms/) |
| ArchUnit constraint-checking | Declarative architecture rules checked against a code model; layered/onion architecture, cycle detection | proven | low | [ArchUnit user guide](https://www.archunit.org/userguide/html/000_Index.html) |
| Igor root-cause clustering | Two-phase dedup: minimize execution traces, then cluster by graph similarity to map N symptoms to M root causes | emerging | medium | [Igor CCS 2021](https://dl.acm.org/doi/10.1145/3460120.3485364) |
| LLM pairwise ranking with batching | Framework for reducing O(n^2) LLM comparisons via batching, caching, and pre-filtering | emerging | high | [Rethinking Sorting in LLM-Based Pairwise Ranking](https://arxiv.org/abs/2505.24643) |
| File-marker checkpointing | Write completion markers per unit of work; on resume, skip units with existing markers | proven | high | [Application checkpointing (Wikipedia)](https://en.wikipedia.org/wiki/Application_checkpointing) |

### Recommended Starting Point

**SARIF-informed finding card format + file-marker checkpointing + mgrep pre-filter tiering**

Rationale: The FEATURE.md spec already describes a system very close to the right architecture. Prior art confirms the design choices are sound, not that a different approach is needed. Specifically:

1. **Finding card format**: Adopt SARIF's field vocabulary where it maps naturally. SARIF's `ruleId` maps to finding type (CONFLICT, GAP, etc.), `level` maps to severity, `locations` maps to doc sources (file:line), `message` maps to summary, `correlationGuid` maps to root_cause linking. This gives the finding cards a proven schema without requiring the full SARIF JSON overhead -- keep markdown+frontmatter as the format, but use SARIF field semantics for consistency. [SARIF v2.1.0 spec](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)

2. **Deduplication**: DefectDojo's hash-code approach (hash key fields to detect duplicates) is overkill here -- the spec already has the right idea with a consolidation pass where Claude groups findings by root cause. The Igor dual-phase model (minimize first, then cluster) maps conceptually to the spec's approach: per-pair analysis produces findings, then a consolidation agent groups them. No need to import algorithmic machinery; Claude's reasoning handles the clustering. [First principles: with <50 findings in most runs, algorithmic dedup adds complexity without payoff vs. a single Claude consolidation pass]

3. **Checkpoint/resume**: File-marker checkpointing (`scan-output/pairs/{A}-{B}.complete`) is exactly the canonical pattern. No library needed -- `fs.existsSync()` on resume, `fs.writeFileSync()` on completion. This is the simplest correct approach. [Application checkpointing (Wikipedia)](https://en.wikipedia.org/wiki/Application_checkpointing)

4. **O(n^2) scaling**: The spec's three-tier strategy (full pairwise / mgrep pre-filter / cluster-then-scan) aligns with the LLM pairwise ranking research showing that pre-filtering is the primary lever for reducing LLM calls. mgrep as a textual proximity filter before Claude analysis is the right approach. [LLM Pairwise Ranking paper](https://arxiv.org/abs/2505.24643)

### Anti-Patterns

- **Full SARIF JSON output**: Looks appealing because it is a standard, but SARIF is designed for tool-to-tool interchange (IDE integrations, CI pipelines). GSD finding cards are consumed by humans and Claude agents in markdown workflows. Adopting full SARIF JSON would create friction: agents would need JSON parsing, humans would need rendering tools. Borrow the field semantics, not the format. [First principles: GSD's artifact format is markdown+frontmatter everywhere; breaking this convention for one feature creates a consistency gap]

- **Graph database for dependency analysis (jQAssistant/Neo4j pattern)**: The DZone article on fixing microservices architecture using graph analysis suggests storing dependencies in Neo4j for querying. This is powerful for large codebases with thousands of components, but GSD projects have <100 capabilities. A flat dependency list in markdown with typed edges (`A --requires--> B`) is sufficient and avoids an external dependency. [DZone article](https://dzone.com/articles/fixing-your-microservices-architecture-using-graph); [First principles: zero-runtime-deps constraint from project context]

- **Parallel pair analysis**: The spec already decided against this (2026-03-05 decision), and it is the right call. Later pairs benefit from accumulated findings context (e.g., "this is another symptom of FINDING-003"). Parallel analysis loses this compounding insight. The LLM pairwise ranking paper confirms that sequential with caching outperforms naive parallel when result quality depends on prior context. [FEATURE.md decisions section](/Users/philliphall/get-shit-done-pe/.planning/capabilities/requirements-refinement/features/landscape-scan/FEATURE.md, line 198)

- **Algorithmic dedup (MinHash, LSH, embedding similarity)**: These are appropriate when you have thousands of findings from automated scanners. With Claude producing <50 findings per run and already capable of referencing prior findings, a second Claude pass for consolidation is simpler, more accurate, and requires no external dependencies. [First principles: the dedup input is natural language findings, not structured hashes -- Claude is better at semantic grouping than any hash function]

### Libraries / Tools

No external libraries recommended. The implementation is pure Node.js (matching project constraints):

- **`fs` (Node.js built-in)**: File-marker checkpointing (existsSync, writeFileSync), artifact discovery (readdirSync, readFileSync) -- already used extensively in `gsd-tools.cjs`
- **`gsd-tools.cjs capability-list`**: Existing CLI route for enumerating capabilities -- upstream dependency for `scan-discover` route. [gsd-tools.cjs line 376](/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs)
- **`mgrep`**: Already available in the project for semantic search -- serves as the pre-filter for medium-tier projects (21-50 capabilities). No new dependency needed.

### Canonical Patterns

- **SARIF result schema (adapted)**: Each finding card should include: `type` (ruleId equivalent), `severity` (level), `affected_capabilities` (locations), `doc_sources` with file:line (physicalLocation.region), `summary` (message.text), `recommendation` (no SARIF equivalent -- GSD-specific addition), `root_cause` (correlationGuid equivalent, populated in consolidation pass). Fingerprints (SARIF's `partialFingerprints`) could be added later for cross-run diffing but are out of scope. [SARIF v2.1.0 spec](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)

- **File-marker checkpoint/resume**: For each completed unit of work, write a marker file. On startup, enumerate existing markers to build the "already done" set. Skip units in the set. This is the standard HPC/batch processing pattern, used everywhere from MapReduce to CI pipeline caching. Implementation: `scan-output/pairs/{A}-{B}.complete` as specified. [Application checkpointing](https://en.wikipedia.org/wiki/Application_checkpointing)

- **Pre-filter then analyze (funnel pattern)**: Cheap heuristic first (mgrep textual proximity), expensive analysis second (Claude reasoning). This is the canonical approach for O(n^2) problems where each comparison is expensive. The LLM ranking research validates this: batching and filtering are the primary levers, not parallelism. For GSD: mgrep each capability's key terms against other capabilities, rank by textual overlap, send only top-K pairs to Claude. [LLM Pairwise Ranking](https://arxiv.org/abs/2505.24643)

- **Two-pass consolidation**: First pass produces raw findings per pair. Second pass groups findings by root cause. This mirrors Igor's dual-phase approach (minimize then cluster) but uses Claude reasoning instead of graph algorithms. The key insight from Igor: symptoms that look different at the surface level often share a single root cause, and grouping them produces more actionable output. [Igor CCS 2021](https://dl.acm.org/doi/10.1145/3460120.3485364)

- **Relationship matrix as adjacency representation**: The three-layer output's relationship matrix is a standard adjacency matrix from graph theory. Each cell contains edge type + confidence. This is the canonical way to represent pairwise relationships in a compact, scannable format. No library needed -- a 2D array rendered as a markdown table. [First principles: adjacency matrices are the standard compact representation for pairwise relationships in discrete mathematics]
