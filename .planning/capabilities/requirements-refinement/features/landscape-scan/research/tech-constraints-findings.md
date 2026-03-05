## Tech Constraints Findings

### Hard Constraints

- **Claude Code Bash output buffer ~50KB** -- CLI route output that exceeds 50KB gets written to tmpfile with `@file:` prefix. `scan-discover` returning all capability contents will exceed this for projects with >5 substantive capabilities. Current project: 8 caps, key artifacts total ~134KB. -- source: `get-shit-done/bin/lib/core.cjs:31-36`

- **Node.js >=16.7.0 engine requirement** -- All file I/O APIs used (`fs.readdirSync` with `withFileTypes`, `fs.mkdirSync` with `recursive`) are available in Node 16.7+. No blocker. -- source: `package.json:36` (`"engines": {"node": ">=16.7.0"}`)

- **Zero runtime dependencies** -- GSD ships only vendored js-yaml 4.1.1 + argparse. Any new code must use pure Node.js stdlib (fs, path, os). No external libraries for clustering, NLP, or similarity scoring. -- source: `package.json` (no `dependencies` block), `get-shit-done/bin/lib/frontmatter.cjs:9` (js-yaml require)

- **Pipeline Invariant #5: Context via paths not content** -- Existing invariant states orchestrators should pass file paths, not content, to subagents. TC-02 spec explicitly contradicts this: "Agent receives contents (not paths) -- no file I/O in the reasoning agent." This is a deliberate design choice for scan-pair agents (they analyze text, not modify files), but it creates tension with the documented invariant. -- source: `get-shit-done/references/pipeline-invariants.md:62-72`, FEATURE.md TC-02

- **Claude Code subagent context window: 200K tokens (~800KB text)** -- Per-pair agent receives two capabilities' contents + accumulated findings. Heaviest pair (pipeline-execution + requirements-refinement) is ~101KB raw content. With accumulated findings growing across 28 pairs, later pairs could approach context limits. -- [First principles: 200K tokens at ~4 chars/token = ~800KB; heaviest pair raw = 101KB; 28 pairs with growing findings context]

- **Sequential pair execution is serial by design** -- FN-02 mandates sequential (not parallel) pair analysis so later pairs benefit from accumulated findings. For 28 pairs (8 caps), this means 28 sequential Claude API calls. At ~30-60s per sonnet call, minimum wall time is ~15-30 minutes for this project. -- source: FEATURE.md FN-02, Decisions section

### Dependency Capabilities

- **gsd-tools.cjs capability-list**: Returns `{capabilities: [{slug, status, feature_count}]}`. Already works. Provides the cap list for scan-discover to build on. Does NOT return artifact contents or paths -- only slugs and metadata. -- source: `get-shit-done/bin/lib/capability.cjs:49-84`, verified via `node gsd-tools.cjs capability-list`

- **gsd-tools.cjs capability-status**: Returns `{slug, status, features: [{slug, status}], feature_count}`. Provides feature listing per capability. Does NOT return file contents. -- source: `get-shit-done/bin/lib/capability.cjs:86-121`

- **core.cjs findCapabilityInternal/findFeatureInternal**: Returns directory paths and validates existence. Available for scan-discover to resolve artifact paths. -- source: `get-shit-done/bin/lib/core.cjs:504-549`

- **core.cjs output()**: Handles JSON serialization with the 50KB tmpfile fallback. scan-discover can use this directly -- the `@file:` pattern is already handled by callers. -- source: `get-shit-done/bin/lib/core.cjs:26-42`

- **frontmatter.cjs extractFrontmatter()**: Parses YAML frontmatter from markdown files. Needed for reading capability/feature status and metadata. Uses js-yaml FAILSAFE_SCHEMA (all values as strings). -- source: `get-shit-done/bin/lib/frontmatter.cjs:14-31`

- **mgrep**: Available at `/Users/philliphall/.nvm/versions/node/v20.19.3/bin/mgrep`. Semantic search tool. TC-03 medium tier (21-50 caps) requires mgrep for pre-filtering pairs by textual proximity. mgrep is an external tool (not vendored), so this tier depends on user having mgrep installed. -- source: `which mgrep` output, FEATURE.md TC-03

- **gather-synthesize.md pattern**: Existing orchestration pattern for parallel agents + synthesizer. NOT directly applicable -- landscape-scan is sequential, not parallel. But the Task() spawning syntax and context payload format are reusable. -- source: `get-shit-done/workflows/gather-synthesize.md`

### Compatibility Issues

- **scan-discover output size vs Bash buffer**: For the current 8-cap project, loading all CAPABILITY.md + FEATURE.md + BRIEF.md contents into a single JSON response produces ~134KB. This exceeds the 50KB Bash buffer limit, triggering the tmpfile fallback. The orchestrator workflow must handle `@file:` responses. -- source: measured artifact sizes (see below), `core.cjs:31-36`

  ```
  cli-tooling:              1,487 bytes
  command-surface:          1,206 bytes
  documentation-generation: 1,560 bytes
  framing-and-discovery:    1,530 bytes
  install-and-deploy:      25,592 bytes
  pipeline-execution:      54,344 bytes
  requirements-refinement: 46,858 bytes
  session-context:          1,697 bytes
  TOTAL:                 ~134,274 bytes
  ```

- **FN-01 references `.documentation/capabilities/*.md`**: This directory exists but is sparse (2 files). Not all capabilities have exploration notes here. scan-discover must handle missing documentation artifacts gracefully. -- source: `ls .documentation/capabilities/` (only install-and-deploy.md, requirements-refinement.md present)

- **mgrep dependency for medium tier**: TC-03 medium tier (21-50 caps) requires mgrep for pre-filtering. mgrep is not a GSD dependency -- it's a separate tool installed by the user. If mgrep is absent, medium tier is blocked. -- source: mgrep not in package.json, installed separately at user level

- **Accumulated findings context growth**: FN-02 feeds prior findings to later pair agents. With 28 pairs and potentially 2-5 findings per pair, the accumulated context could reach 50-140 finding cards by pair 28. At ~500 bytes per finding card, that's 25-70KB of accumulated context on top of the pair's own ~25-100KB of capability content. Total could reach ~170KB for heavy pairs late in the sequence, still within the ~800KB context window but consuming 20%+ of available space. -- [First principles: 28 pairs x 2-5 findings x 500 bytes = 28-70KB accumulated; pair content 25-100KB; total ~95-170KB; context window ~800KB]

- **Checkpoint file naming with slugs containing special characters**: Capability slugs are already sanitized (lowercase alphanumeric + hyphens via `generateSlugInternal`). Pair checkpoint files like `{A}-{B}.complete` are safe because slugs only contain `[a-z0-9-]`. No special character issues. -- source: `get-shit-done/bin/lib/core.cjs:359-366` (generateSlugInternal)

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| scan-discover CLI route (TC-01) | viable | Pure Node.js file I/O. Builds on existing capability-list, findCapabilityInternal. Output will exceed 50KB Bash buffer -- use existing @file: tmpfile pattern. -- source: `core.cjs:26-42`, `capability.cjs:49-84` |
| scan-pairs CLI route (TC-01) | viable | Simple combinatorial generation from capability-list output. No external deps needed. -- [First principles: n*(n-1)/2 pair enumeration is trivial] |
| scan-checkpoint CLI route (TC-01) | viable | Read/write simple flag files in scan-output/pairs/. Pure fs operations. -- [First principles: touch/check file existence] |
| Per-pair agent with contents in prompt (TC-02) | constrained | Works for current project (8 caps, heaviest pair ~101KB). Risk for projects with very large capability docs (>200KB per pair) -- would need content summarization or truncation. Contradicts Pipeline Invariant #5 but is deliberate and justified. -- source: `pipeline-invariants.md:62-72`, measured artifact sizes |
| Sequential pair analysis (FN-02) | viable | Wall time ~15-30 min for 28 pairs. Acceptable for a scan that runs infrequently. No technical blocker. -- [First principles: 28 pairs x 30-60s/call] |
| Finding card dedup/consolidation (FN-04) | viable | Can be implemented as a final-pass agent or in-tool clustering. No external NLP deps needed -- sonnet can do semantic grouping in a single consolidation call with all findings as input. -- [First principles: consolidation is a reasoning task, not a computation task] |
| Small tier full pairwise <=20 caps (TC-03) | viable | 20 caps = 190 pairs. At 30-60s each, ~95-190 min wall time. Long but functional. -- [First principles: 20*19/2 = 190] |
| Medium tier mgrep pre-filter 21-50 caps (TC-03) | constrained | Depends on mgrep being installed (not a GSD dependency). If absent, must fall back to full pairwise or skip. 50 caps = 1225 pairs unfiltered -- mgrep filtering is essential. -- source: mgrep not in package.json |
| Large tier 50+ caps clustering (TC-03) | constrained | No clustering library available (zero deps constraint). Must use heuristic clustering (directory structure, capability tags in frontmatter). Viable but quality depends on how well capabilities are tagged. -- [First principles: without NLP/embedding libs, clustering must use metadata] |
| Three-layer output summary (FN-05) | viable | Relationship matrix, finding cards, dependency graph are all text generation tasks. sonnet/opus can produce these from structured finding data. -- [First principles: text formatting, not computation] |

### Alternatives

- **scan-discover exceeds Bash buffer** -> Already handled by existing `@file:` tmpfile pattern in `core.cjs output()`. Orchestrator reads the tmpfile path from stdout, then reads file contents. No alternative needed -- existing pattern is sufficient. -- source: `core.cjs:31-36`

- **mgrep unavailable for medium tier** -> Fall back to keyword-based filtering using Node.js `String.includes()` or regex matching against capability contents. Less semantic than mgrep but zero-dependency. Alternative: raise the small-tier threshold to 50 caps and skip the mgrep tier entirely. -- [First principles: substring/regex matching is a degraded but functional alternative to semantic search]

- **Accumulated findings exceed context window for late pairs** -> Summarize prior findings instead of passing full text. After every N pairs (e.g., 10), consolidate accumulated findings into a compressed summary. This preserves the sequential benefit while bounding context growth. -- [First principles: lossy compression of prior context is standard for bounded-context sequential processing]

- **Per-pair content too large for single prompt** -> For oversized capability pairs: (a) pass only CAPABILITY.md + FEATURE.md names/summaries, not full content; (b) split into multiple sub-prompts per pair; (c) pre-summarize each capability's artifacts before pair analysis. Option (a) is simplest and loses the least signal. -- [First principles: content reduction at the cost of analysis depth]

- **Large tier clustering without NLP deps** -> Use capability frontmatter tags (if present), directory naming conventions, or the `consumes:` field in CAPABILITY.md to build clusters. Alternatively, use mgrep (if available) to compute pairwise similarity scores and cluster by thresholding. -- [First principles: metadata-based clustering is deterministic and requires no ML; CAPABILITY.md consumes field already captures some dependency structure] -- source: CAPABILITY.md frontmatter pattern in `capability.cjs:49-84`
