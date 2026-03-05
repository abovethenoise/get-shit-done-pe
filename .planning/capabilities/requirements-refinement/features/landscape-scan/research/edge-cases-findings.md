## Edge Cases Findings

### Failure Modes

| Failure | Likelihood | Severity | Mitigation | Source |
|---------|------------|----------|------------|--------|
| **Output directory mismatch** -- landscape-scan writes to `scan-output/` but coherence-report reads from `.planning/refinement/`. Downstream feature cannot find scan results. | common (already exists in specs) | blocking | Reconcile output paths before implementation. `.planning/refinement/` is the canonical location per refinement-artifact EU-02. Update landscape-scan FEATURE.md FN-03, FN-05 to match. | landscape-scan FEATURE.md FN-05 vs coherence-report FEATURE.md FN-01; flagged in `research/user-intent-findings.md:58` |
| **Context window exhaustion on large capabilities** -- per-pair agent receives cap_A contents + cap_B contents + all accumulated prior findings. At pair N, accumulated findings grow linearly. For a 20-cap project (190 pairs), pair #190 receives all 189 pairs' worth of findings. | common (for any non-trivial project) | blocking | Cap accumulated findings context: include only findings relevant to either capability in the current pair, or summarize prior findings instead of including full cards. Alternatively, limit to last K findings + a summary. | `research/domain-truth-findings.md` "Context window exhaustion" risk; [First principles: context = cap_A + cap_B + sum(findings_1..N-1), unbounded without management] |
| **mgrep cannot index `.planning/` artifacts** -- `.mgrepignore` excludes `.planning/` directory. The medium-tier pre-filter (TC-03, 21-50 caps) depends on mgrep searching capability artifact contents to determine textual proximity. mgrep will return zero results for these files. | common (`.mgrepignore` already excludes `.planning/`) | blocking | Either remove `.planning/` from `.mgrepignore` (breaks existing indexing intent) or implement a non-mgrep pre-filter for capability artifacts (e.g., keyword extraction + set intersection in pure JS). | `.mgrepignore:39` excludes `.planning/`; FEATURE.md TC-03 specifies "mgrep pre-filter" for medium tier |
| **Checkpoint corruption on interrupted write** -- if the process is killed mid-write of a `.complete` flag or a finding card, the file may be truncated or empty. On resume, the scan sees a checkpoint exists but the associated finding cards are incomplete or missing. | rare | degraded | Write to a temp file first, then rename (atomic on most filesystems). On resume, validate that finding cards exist for each checkpointed pair before skipping it. | [First principles: rename is atomic on POSIX; write+rename is the standard pattern for crash-safe file updates] |
| **Dedup consolidation merges unrelated findings** -- root cause clustering operates on LLM judgment. Two findings from different pairs may share surface-level similarity (e.g., both mention "missing validation") but have completely different root causes. Over-consolidation loses distinct issues. | common | degraded | Require the consolidation agent to justify each merge with a specific causal link. Preserve original finding cards alongside root cause groupings so users can disagree with merges. | `research/domain-truth-findings.md` "Deduplication... is a clustering problem"; Igor (CCS 2021) shows naive dedup inflates counts by 10x |
| **Pair ordering bias** -- sequential analysis means early pairs have zero prior context; later pairs benefit from accumulated findings. The first pair analyzed always has the least context. Additionally, LLMs exhibit recency bias -- the second capability in a pair may be systematically favored. | common | degraded | Randomize or strategically order pairs (e.g., most-connected capabilities first). Present capability contents symmetrically in agent prompt. Explicitly instruct agent to treat both capabilities equally. | `research/domain-truth-findings.md` "Sequential analysis... creates an ordering dependency"; recency bias from ConInstruct benchmark |
| **Duplicate finding IDs across interrupted runs** -- if a scan is interrupted at pair 10 (FINDING-001 through FINDING-015 written) and then resumed, new findings from pair 11+ must continue the sequence. If the checkpoint does not record the last-used finding ID, resumed runs may start from FINDING-001 again, causing ID collisions. | rare | degraded | Store the current finding ID counter in a checkpoint metadata file (e.g., `scan-output/scan-meta.json`). On resume, read the counter and continue from the next available ID. | FEATURE.md FN-03: "Finding IDs are globally sequential across the scan run" |
| **Capability slug collision in pair keys** -- checkpoint files use `{A}-{B}.complete` naming. If a capability slug contains a hyphen (common: `cli-tooling`, `framing-and-discovery`), the pair key `cli-tooling-framing-and-discovery` is ambiguous -- where does A end and B begin? | rare | blocking | Use a separator that cannot appear in slugs (e.g., `__` or `--`) or use directory structure (`pairs/cli-tooling/framing-and-discovery.complete`). | [First principles: slugs are generated by `generateSlugInternal` which produces hyphenated strings; `core.cjs:359`] |
| **Single-capability project** -- only 1 capability means 0 pairs. The scan produces no findings, no relationship matrix, no dependency graph. If the output format requires a non-empty matrix/graph, this fails. | rare | cosmetic | Handle n=0 pairs explicitly: produce an empty matrix (1x1, self-referential), empty findings list, and an informational message. Do not error out. | [First principles: n(n-1)/2 = 0 when n=1] |
| **50KB Bash buffer overflow on scan-discover** -- scan-discover returns loaded file contents for all capabilities as JSON. For a 20-cap project with detailed specs, this easily exceeds the 50KB limit. | common | degraded | Already handled by `output()` in `core.cjs:31-39` which writes to a temp file and returns `@file:<path>`. Orchestrator must handle the `@file:` prefix. | `get-shit-done/bin/lib/core.cjs:31-39`; flagged in `research/existing-system-findings.md:27` |

### Boundary Conditions

- **Exactly 20 capabilities (tier boundary):** FEATURE.md TC-03 says "Small (<=20 caps)" gets full pairwise. BRIEF.md says "Small (<20 caps)". At n=20, the system produces 190 pairs. Off-by-one determines whether pair 20 gets full pairwise (190 pairs) or mgrep pre-filtering. -- FEATURE.md TC-03 line 191 vs BRIEF.md line 58

- **Exactly 50 capabilities (tier boundary):** At n=50 (1,225 pairs), system transitions from medium (mgrep pre-filter) to large (cluster-first). FN-04 specifies "global consolidation pass runs after cluster-level dedup to catch duplicates across cluster boundaries." At exactly 50, does the global consolidation pass run? TC-03 says "Large (50+ caps)" but "50+" is ambiguous with "21-50" range including 50. -- FEATURE.md TC-03 lines 191-193

- **Exactly 2 capabilities, one with zero spec docs:** Produces 1 pair. The zero-doc capability generates a GAP finding card (FN-01). But the pair analysis (FN-02) then analyzes this pair where one side has only a GAP card and no actual content. Agent receives one real capability and one empty one. -- FEATURE.md FN-01 "still include in pair enumeration"

- **Capability directory exists but CAPABILITY.md missing:** `cmdCapabilityList` silently skips these (`capability.cjs:66`). `scan-discover` must not reuse `capability-list` output directly -- it must also scan for directories without CAPABILITY.md to produce GAP findings. -- `get-shit-done/bin/lib/capability.cjs:66`; `research/existing-system-findings.md:67`

- **Feature directory exists but FEATURE.md missing:** `listAllFeaturesInternal` skips feature dirs without FEATURE.md (`core.cjs:492`). Scan-discover must decide whether to report these as incomplete features. -- `research/existing-system-findings.md:69`

- **Zero capabilities in project:** `capability-list` returns `{ capabilities: [] }`. Scan should gracefully produce empty output, not error. -- `get-shit-done/bin/lib/capability.cjs:52-55`

- **Accumulated findings context at pair 190 (n=20):** If each pair produces an average of 0.5 findings at ~500 tokens each, pair 190 receives ~47,500 tokens of prior findings alone, plus two capability contents. This approaches or exceeds practical context limits if capabilities are large. -- [First principles: linear growth of accumulated context]

- **Capabilities added or removed between interrupted scan runs:** EU-02 (resumable scan) does not address capability list changes between runs. If a capability is added, new pairs exist that have no checkpoints. If a capability is removed, checkpointed pairs reference a deleted capability. Pair enumeration on resume must re-derive from current state and only skip pairs that still exist AND are checkpointed. -- FEATURE.md EU-02 out-of-scope note

- **Two findings with same type and same capabilities but different directions:** FN-03 says finding cards include "affected capabilities (with direction)." Two findings could both be DEPENDS_ON between caps A and B, but one says A depends on B and the other says B depends on A (circular dependency). This is a valid finding, not a duplicate. The dedup pass must not merge these. -- FEATURE.md FN-03, FN-04

- **Dependency graph with cycles:** FN-05 Layer 3 outputs a directed dependency graph. Cycles (A -> B -> C -> A) are valid findings (they indicate circular dependencies) but must not cause rendering or analysis infinite loops. -- [First principles: DAG assumptions fail when cycles exist]

- **Relationship matrix display at n=50:** A 50x50 matrix has 2,500 cells. In markdown table format, this is unwieldy. At n=100, it is 10,000 cells. The matrix may need to be filtered (show only non-NONE relationships) or split into sub-matrices. -- [First principles: markdown tables are not designed for large grids]

### Integration Failure Scenarios

- **`gsd-tools.cjs capability-list` returns empty/error** --> scan-discover has no capabilities to enumerate. Scan cannot proceed. Must produce an informative error, not a silent empty output. -- `get-shit-done/bin/lib/capability.cjs:49-84`

- **mgrep service unavailable or not installed** --> medium-tier pre-filtering (TC-03) fails entirely. Fallback: either skip pre-filtering and run full pairwise (safe but slow), or error with guidance to install mgrep. Currently mgrep is a third-party tool at `/Users/philliphall/.nvm/versions/node/v20.19.3/bin/mgrep` -- not bundled with GSD. -- `which mgrep` resolves but is not a GSD dependency

- **Subagent (scan-pair) hits Claude rate limit** --> sequential pair analysis stalls at pair N. Findings from pairs 1..N-1 are written and checkpointed. Resumable scan (EU-02) should allow retry. But if rate limit is persistent, scan is blocked indefinitely with no timeout mechanism specified. -- [First principles: any external API call can rate-limit; sequential design means one rate-limit blocks everything]

- **Claude returns malformed finding cards** --> scan-pair agent outputs findings that don't match the expected schema (missing type, invalid severity, no affected capabilities). Downstream dedup and consolidation cannot process them. Must validate finding card structure before writing. -- [First principles: LLM outputs are non-deterministic; schema validation is required]

- **Filesystem permissions prevent writing to scan-output/** --> checkpoint and finding card writes fail. If errors are not caught per-pair, the entire scan crashes. If errors are caught silently, findings are lost. -- [Known issue: Claude Code filesystem write failures can be silent; GitHub issue #15060]

- **coherence-report reads scan output before scan completes** --> if the orchestrator does not enforce strict sequencing (landscape-scan completes THEN coherence-report starts), the downstream feature reads partial data. The CAPABILITY.md architecture spine shows sequential flow, but implementation must enforce it. -- `CAPABILITY.md:57-71` architecture spine

- **`.documentation/capabilities/` and `.planning/capabilities/` slug mismatch** --> exploration notes in `.documentation/capabilities/` use a slug that doesn't match the capability slug in `.planning/capabilities/`. scan-discover correlates these by slug. A mismatch means exploration notes are orphaned and not included in analysis. -- `research/existing-system-findings.md:73`

### Existing Error Handling (gaps)

- `get-shit-done/bin/lib/capability.cjs:66`: `cmdCapabilityList` silently skips directories without CAPABILITY.md (`if (!content) continue`). scan-discover needs these directories reported as GAP findings, not skipped.

- `get-shit-done/bin/lib/capability.cjs:74`: `cmdCapabilityList` swallows feature directory read errors (`catch { /* no features dir */ }`). scan-discover needs to distinguish "no features dir" from "features dir exists but is empty" from "features dir has dirs without FEATURE.md."

- `get-shit-done/bin/lib/core.cjs:51-57`: `safeReadFile` returns null on any error. No distinction between "file not found", "permission denied", and "file is binary/corrupt." scan-discover needs to know WHY a file couldn't be read to produce appropriate finding types.

- No existing validation for checkpoint file integrity. EU-02 assumes `.complete` files are either present (skip) or absent (analyze). No check for zero-byte or corrupted checkpoint files.

- No existing mechanism to detect or report when accumulated findings context would exceed agent context limits. The orchestrator must implement this guard.

### Known Issues in Ecosystem

- **Claude Code 50KB Bash buffer limit** -- large JSON outputs from gsd-tools.cjs are silently redirected to temp files with `@file:` prefix. Any new CLI route (scan-discover, scan-pairs, scan-checkpoint) that returns large payloads must be consumed by code that handles this prefix. Callers that parse stdout directly will get a file path, not JSON. -- `get-shit-done/bin/lib/core.cjs:31-39`

- **Claude Code context compaction hangs** -- Claude Code can hang indefinitely during context compaction for large conversations. A long-running scan loop that accumulates context may trigger compaction mid-scan, freezing the process. -- [GitHub issue #19567](https://github.com/anthropics/claude-code/issues/19567)

- **LLMs silently satisfy later conflicting instructions** -- ConInstruct benchmark shows GPT-4o silently generates a response 97.5% of the time when instructions contain 1-2 conflicts, without flagging the conflict. The scan-pair agent must be explicitly prompted with structured output requirements to surface conflicts; it will not do so spontaneously. -- [ConInstruct: arxiv.org/html/2511.14342](https://arxiv.org/html/2511.14342)

- **Claude Code agent output capped at 32K tokens** -- agent subprocesses may hit the 32K token output limit regardless of configuration settings. A scan-pair agent analyzing two large capabilities may produce truncated output. -- [GitHub issue #10738](https://github.com/anthropics/claude-code/issues/10738)

- **Subagents cannot spawn subagents** -- the scan-pair agent (spawned as a Task) cannot itself spawn sub-tasks. All orchestration (pair iteration, checkpoint management, consolidation) must happen in the parent agent or workflow, not delegated to the scan-pair agent. -- [Claude Agent SDK subagent architecture](https://www.ksred.com/the-claude-agent-sdk-what-it-is-and-why-its-worth-understanding/)

- **Atomic file writes not guaranteed on all platforms** -- `fs.writeFileSync` is not atomic. On crash mid-write, files can be truncated. Checkpoint files and finding cards written this way are vulnerable to corruption. The `write-then-rename` pattern is safer but not used by any existing gsd-tools code. -- [First principles: POSIX rename(2) is atomic; writeFileSync is not]
