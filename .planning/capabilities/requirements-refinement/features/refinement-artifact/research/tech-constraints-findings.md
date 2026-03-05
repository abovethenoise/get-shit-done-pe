## Tech Constraints Findings

### Hard Constraints

- **Zero runtime dependencies** — `get-shit-done/bin/package.json` declares only `js-yaml@4.1.1`. All new code must be pure Node.js CJS + js-yaml. No external diff libraries permitted. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/package.json` line 5; `/Users/philliphall/get-shit-done-pe/.planning/capabilities/cli-tooling/CAPABILITY.md` line 20]

- **CJS module format required** — All lib modules use `require()`/`module.exports`. No ESM. — [Source: every file in `get-shit-done/bin/lib/*.cjs`]

- **Node.js >= 16.7.0** — `package.json` engines field. `fs.mkdirSync({ recursive: true })` available since Node 10. `fs.rmSync` available since Node 14.14. All needed fs APIs are available. — [Source: `/Users/philliphall/get-shit-done-pe/package.json` line 36]

- **CLI output buffer limit: ~50KB** — `core.cjs` `output()` helper writes JSON to stdout; payloads >50KB are written to a tmpfile and the path is returned with `@file:` prefix. Delta output for large projects could exceed this. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 31-39]

- **`scan-checkpoint` route does not exist yet** — TC-01 says "Checkpoint management reuses landscape-scan's `scan-checkpoint` route." This route is specified in landscape-scan TC-01 but has zero implementation in the codebase. refinement-artifact depends on landscape-scan being implemented first, or must implement its own checkpoint logic. — [Source: grep for `scan-checkpoint` returns zero matches in `get-shit-done/bin/`; specified in landscape-scan FEATURE.md TC-01]

- **No existing markdown table parser** — The codebase has no `parseMarkdownTable` or equivalent utility. Delta diffing (TC-02) requires parsing matrix.md and dependency-graph.md tables. A table parser must be written from scratch. — [Source: grep for `parseMarkdownTable`/`parseTable` returns zero matches across entire codebase]

### Dependency Capabilities

- **js-yaml@4.1.1**: FAILSAFE_SCHEMA parsing (all scalars as strings), `yaml.load()`, `yaml.dump()`. Used via `frontmatter.cjs` `extractFrontmatter()` for reading finding card frontmatter (type, severity, ID). Sufficient for reading finding metadata for delta comparison. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/frontmatter.cjs` lines 14-31]

- **Node.js `fs` (sync API)**: `readFileSync`, `writeFileSync`, `mkdirSync({ recursive: true })`, `readdirSync({ withFileTypes: true })`, `existsSync`, `statSync`. All used extensively in existing lib modules. Pattern is synchronous I/O throughout. — [Source: capability.cjs, feature.cjs, state.cjs usage patterns]

- **`core.cjs` utilities**: `safeReadFile()` (returns null on missing file), `output()` (JSON stdout with tmpfile fallback), `error()` (stderr + exit 1), `generateSlugInternal()`, `findCapabilityInternal()`. All reusable for refinement routes. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs`]

- **`frontmatter.cjs` utilities**: `extractFrontmatter()` parses YAML frontmatter from markdown files. Finding cards use frontmatter for structured metadata (type, severity, ID). This is the mechanism to extract finding identity for delta comparison. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/frontmatter.cjs` lines 14-31]

### Compatibility Issues

- **Dependency on unimplemented landscape-scan routes**: refinement-artifact TC-01 specifies reuse of `scan-checkpoint` from landscape-scan. Since landscape-scan is also status `specified` (not implemented), this creates a build-order dependency. Either landscape-scan ships first, or refinement-artifact duplicates the checkpoint pattern (violating DRY). — [Source: landscape-scan FEATURE.md status: `specified`; refinement-artifact FEATURE.md TC-01]

- **Finding ID format assumption**: Delta diffing assumes findings are named `FINDING-{id}.md` with sequential numeric IDs (FINDING-001, FINDING-002). If landscape-scan changes this convention, delta diffing breaks. No formal contract/schema exists yet -- only spec text. — [Source: refinement-artifact FEATURE.md FN-03, landscape-scan FEATURE.md FN-03]

- **Matrix format not formalized**: The relationship matrix is described as "capability x capability grid" with cell values like "DEPENDS_ON / HIGH". The exact markdown table format (header row, cell syntax) is not specified in landscape-scan's TC specs. Delta diffing depends on a stable, parseable cell format. — [Source: landscape-scan FEATURE.md FN-05 Layer 1 description]

- **Dependency graph format not formalized**: Described as directed graph with `A --requires--> B` format in landscape-scan FN-05 Layer 3, but TC-02 says delta diff compares "from/to/type/explicit tuples." The markdown representation of these tuples must be parseable. No schema exists. — [Source: refinement-artifact FEATURE.md TC-02; landscape-scan FEATURE.md FN-05]

- **Router switch statement growth**: `gsd-tools.cjs` uses a flat switch statement (lines 126-406, ~280 lines). Adding `refinement-init` and `refinement-write` routes extends this further. Not a blocker, but increasing maintenance surface. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` lines 126-406]

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| `refinement-init` CLI route (create dir, snapshot state) | Viable | Follows exact pattern of `capability-create` / `feature-create`: mkdirSync recursive + writeFileSync. No new patterns needed. — [Source: capability.cjs lines 24-39] |
| `refinement-write` CLI route (write artifact to dir) | Viable | Standard writeFileSync pattern. Must validate artifact type argument. — [Source: existing writeFileSync usage across 6+ lib modules] |
| Pre-scan snapshot of findings directory | Viable | `readdirSync` + `extractFrontmatter` per finding file. Synchronous, no async complexity. Memory: even 100 findings at ~2KB each = ~200KB -- well within Node.js limits. — [First principles: findings are small markdown files with frontmatter] |
| Delta diffing: finding ID comparison (added/resolved/changed) | Viable | Compare two arrays of {id, type, severity, recommendation} objects. Set difference operations on IDs. Pure JS, no external tools needed. — [First principles: set operations on string IDs are trivial] |
| Delta diffing: matrix table parsing | Constrained | Must write a markdown table parser from scratch. Tables have fixed format: pipe-delimited cells, header row, separator row. Parsing is straightforward but error-prone without tests. Cell values contain relationship type + confidence (e.g., "DEPENDS_ON / HIGH") -- must handle empty cells, `--` diagonal. — [First principles: regex split on `\|` with trim is standard approach; no existing utility in codebase] |
| Delta diffing: dependency graph table parsing | Constrained | Same constraint as matrix parsing. Dependency graph is a markdown table with columns From/To/Relationship/Explicit. Must parse rows into tuples for comparison. — [Source: refinement-artifact FEATURE.md TC-02] |
| Reusing `scan-checkpoint` from landscape-scan | Blocked (for now) | Route does not exist in codebase. Landscape-scan is status `specified`, not implemented. — [Source: grep confirms zero implementation] |
| Markdown table diff output (all diff output as markdown tables) | Viable | Generating markdown tables from diff results is string concatenation. No library needed. Existing codebase generates markdown in template.cjs. — [Source: template.cjs `fillTemplate` patterns] |
| DELTA.md skipped on first run (no previous snapshot) | Viable | Pre-scan snapshot returns null when no RECOMMENDATIONS.md exists (FN-01 spec). Conditional skip is trivial. — [Source: refinement-artifact FEATURE.md FN-01] |

### Alternatives

- **Blocked: reuse `scan-checkpoint`** --> **Alternative: implement checkpoint read/write as a shared utility module** (e.g., `lib/refinement.cjs`) that both landscape-scan and refinement-artifact can import. This avoids duplication and removes the build-order dependency. The checkpoint logic is simple: read/write `.complete` flag files in a `pairs/` subdirectory. — [First principles: shared utility is DRY; checkpoint is ~20 lines of code (readdirSync + writeFileSync)]

- **Blocked: matrix/dep-graph format not formalized** --> **Alternative: define the table format contract in refinement-artifact's implementation** with a `parseMarkdownTable(content)` utility that returns an array of row objects. Landscape-scan must then conform to this format. The parser becomes the contract. — [First principles: parser-as-contract inverts the dependency -- whoever writes the parser defines the format]

- **Constrained: large delta output exceeding 50KB buffer** --> **Alternative: already handled by core.cjs `output()` tmpfile fallback**. No additional work needed -- the `@file:` protocol handles oversized JSON output automatically. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 31-39]
