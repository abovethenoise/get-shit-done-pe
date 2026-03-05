## Existing System Findings

### Relevant Implementations

- **`capability-list` CLI route** already returns all capability slugs with status and feature count -- exactly what `scan-discover` needs as its starting point. Returns JSON: `{ capabilities: [{ slug, status, feature_count }] }` -- `get-shit-done/bin/lib/capability.cjs:49-84` (`cmdCapabilityList`)

- **`capability-status` CLI route** returns per-capability details including nested feature slugs and statuses -- usable for enriching scan-discover output. -- `get-shit-done/bin/lib/capability.cjs:86-121` (`cmdCapabilityStatus`)

- **`feature-list` and `feature-status` routes** exist for per-capability feature enumeration -- `get-shit-done/bin/lib/feature.cjs:55-120` (`cmdFeatureList`, `cmdFeatureStatus`)

- **`findCapabilityInternal` and `findFeatureInternal`** resolve capability/feature slugs to full directory and file paths, handling edge cases (empty slug, missing dir, missing file). -- `get-shit-done/bin/lib/core.cjs:504-549`

- **`listAllFeaturesInternal`** enumerates all features across all capabilities in one call, returning `[{capability_slug, feature_slug}]`. -- `get-shit-done/bin/lib/core.cjs:476-500`

- **`safeReadFile`** reads a file or returns null on error -- utility for loading artifact contents without try/catch boilerplate. -- `get-shit-done/bin/lib/core.cjs:51-57`

- **`extractFrontmatter`** parses YAML frontmatter from any markdown file using js-yaml FAILSAFE_SCHEMA. -- `get-shit-done/bin/lib/frontmatter.cjs:14-31`

- **Gather-synthesize pattern** is the existing parallel-agent-then-consolidate workflow. Spawns N gatherers via Task(), then one synthesizer. The landscape-scan's per-pair-then-consolidate pattern is similar but sequential, not parallel. -- `get-shit-done/workflows/gather-synthesize.md`

- **`.documentation/capabilities/` directory** exists with exploration notes (e.g., `install-and-deploy.md`, `requirements-refinement.md`). The BRIEF references this as an artifact type to scan. -- `/Users/philliphall/get-shit-done-pe/.documentation/capabilities/`

- **Agent file frontmatter convention** uses `role_type` field (`executor`, `judge`, `quick`) to determine model. New `gsd-scan-pair.md` agent should use `role_type: executor` to get sonnet. -- `get-shit-done/bin/lib/core.cjs:18-22` (`ROLE_MODEL_MAP`)

### Constraints

- **50KB Bash buffer limit** -- `core.cjs:31-39` uses `@file:<path>` fallback for large JSON. The `scan-discover` route will return loaded file contents for all capabilities, which could easily exceed 50KB. Any orchestrator calling scan-discover must handle the `@file:` prefix pattern. [This constrains how scan-discover returns data -- must use output() which auto-handles the limit]

- **CLI router is a flat switch statement** -- `get-shit-done/bin/gsd-tools.cjs:126-406`. New routes (`scan-discover`, `scan-pairs`, `scan-checkpoint`) must be added as top-level cases in this switch. No sub-router mechanism exists; the pattern is flat `case 'scan-discover':`. [Constrains naming: must be hyphenated flat verbs matching existing convention]

- **Zero runtime dependencies** -- `package.json` has only `js-yaml` as a dependency. No graph/clustering libraries available. TC-03's large-project clustering must be pure JS or delegate to mgrep. [Constrains the 50+ cap tier implementation]

- **CommonJS module system** -- all lib files use `require()` / `module.exports`. New scan lib module must follow this pattern. -- `get-shit-done/bin/lib/capability.cjs:1-9`

- **Agents receive contents not paths** -- established pattern in gather-synthesize.md (lines 50-68): context is assembled by the orchestrator and injected into the Task prompt as XML blocks. The per-pair agent cannot do its own file I/O. [Constrains the scan-pair agent design to be stateless]

### Reuse Opportunities

- **`cmdCapabilityList`** -- `get-shit-done/bin/lib/capability.cjs:49` -- directly reusable as the first step of scan-discover. Returns all capability slugs.

- **`listAllFeaturesInternal`** -- `get-shit-done/bin/lib/core.cjs:476` -- reusable to enumerate all features for artifact loading without re-implementing directory walking.

- **`safeReadFile`** -- `get-shit-done/bin/lib/core.cjs:51` -- reusable for loading CAPABILITY.md, FEATURE.md, and .documentation contents without error handling boilerplate.

- **`extractFrontmatter`** -- `get-shit-done/bin/lib/frontmatter.cjs:14` -- reusable for parsing status, dependencies, and metadata from capability/feature files.

- **`output()` and `error()`** -- `get-shit-done/bin/lib/core.cjs:26,44` -- mandatory for any new CLI route. Handles JSON serialization, 50KB buffer, and process exit.

- **`generateSlugInternal`** -- `get-shit-done/bin/lib/core.cjs:359` -- reusable for generating checkpoint filenames from capability pair slugs (e.g., `{A}-{B}.complete`).

- **Context assembly XML block pattern** from `get-shit-done/workflows/gather-synthesize.md:50-68` -- reusable template for how to inject capability contents into the scan-pair agent prompt.

### Integration Points

- **gsd-tools.cjs switch statement** -- `get-shit-done/bin/gsd-tools.cjs:126` -- new `scan-discover`, `scan-pairs`, and `scan-checkpoint` cases must be added here, following the existing pattern of requiring a lib module and calling its exported function.

- **New lib module needed** -- following the pattern of `get-shit-done/bin/lib/capability.cjs`, a new `get-shit-done/bin/lib/scan.cjs` should export `cmdScanDiscover`, `cmdScanPairs`, `cmdScanCheckpoint`.

- **New agent file** -- `agents/gsd-scan-pair.md` -- must follow existing agent frontmatter convention (name, description, tools, color, role_type, reads, writes). See `agents/gsd-executor.md:1-9` for the pattern.

- **New workflow or command file** -- either a `commands/gsd/scan.md` command file or a `get-shit-done/workflows/scan.md` workflow file needed to orchestrate the scan loop (call scan-discover, iterate pairs, spawn per-pair agents, run consolidation, write summary).

- **`scan-output/` directory** -- new output location. Not under `.planning/` (which is the existing convention for GSD artifacts). The FEATURE.md specifies `scan-output/` at project root. This breaks from the `.planning/` convention but is specified in the requirements.

### Undocumented Assumptions

- **`cmdCapabilityList` skips directories without CAPABILITY.md** -- `get-shit-done/bin/lib/capability.cjs:66`. If a capability dir exists but has no CAPABILITY.md, it is silently skipped. The landscape-scan spec says these should be flagged as GAP findings, so scan-discover cannot simply reuse capability-list's output for completeness detection -- it must also check for dirs without CAPABILITY.md.

- **Feature enumeration requires FEATURE.md** -- `get-shit-done/bin/lib/core.cjs:492`. `listAllFeaturesInternal` skips feature directories without a FEATURE.md file. Scan-discover must decide whether featureless dirs are worth reporting.

- **No existing concept of "artifact completeness"** -- the existing capability/feature CRUD has no notion of "full", "partial", or "none" completeness as specified in TC-01. This must be computed fresh by scan-discover by checking which artifact types exist for each capability.

- **`.documentation/capabilities/` is a separate tree** from `.planning/capabilities/`. The two are not linked by any existing code -- scan-discover must manually correlate slugs between these directories. The init code in `cmdInitDiscussCapability` reads `.documentation/capabilities/` separately (line 313-319 of init.cjs).

- **Capability `consumes` field exists in CAPABILITY.md frontmatter** but is not parsed or used by any existing CLI route. Scan-discover could use this for explicit dependency detection but must parse it from raw frontmatter. -- referenced in `CAPABILITY.md` files but not in any lib code.
