## Existing System Findings

### Relevant Implementations

- **CLI router in gsd-tools.cjs** uses a flat `switch` statement for top-level commands (e.g., `capability-create`, `feature-create`, `plan-validate`). New routes `refinement-init` and `refinement-write` must be added as new `case` entries here. -- `get-shit-done/bin/gsd-tools.cjs:126-406` (`main()`)

- **Capability/feature directory creation pattern** uses `fs.mkdirSync(dir, { recursive: true })` followed by `fs.writeFileSync` for the initial file, then calls `output()` with creation result. This is the established pattern for `refinement-init`. -- `get-shit-done/bin/lib/capability.cjs:24-46` (`cmdCapabilityCreate`)

- **Template fill for directory creation** also creates nested directories with `mkdirSync({ recursive: true })` and checks `fs.existsSync` before writing to prevent overwrites. -- `get-shit-done/bin/lib/template.cjs:160-175` (`cmdTemplateFill` capability case)

- **Frontmatter parsing** via `extractFrontmatter()` uses `js-yaml` with `FAILSAFE_SCHEMA` (all values as strings). Finding cards with frontmatter will need this for delta comparison. -- `get-shit-done/bin/lib/frontmatter.cjs:14-31` (`extractFrontmatter`)

- **Markdown table row parsing** exists in `plan-validate.cjs` with regex `^\|\s*([A-Z]+-\d+)\s*\|` for extracting IDs from table rows. Delta computation for matrix.md and dependency-graph.md will need similar row-level parsing. -- `get-shit-done/bin/lib/plan-validate.cjs:19-27` (`parseReqSource`)

- **State snapshot pattern** reads a file, extracts structured fields via regex, and returns JSON. `cmdStateSnapshot` is the closest analog to the pre-scan snapshot (FN-01). -- `get-shit-done/bin/lib/state.cjs:400-440` (`cmdStateSnapshot`)

- **`safeReadFile()`** returns file contents or `null` on any error -- exactly the read-or-null behavior needed for first-run detection (RECOMMENDATIONS.md exists or not). -- `get-shit-done/bin/lib/core.cjs:51-57` (`safeReadFile`)

### Constraints

- **Zero runtime dependencies** -- the project has no runtime deps (only `js-yaml` bundled inline via esbuild). New code must use only Node.js builtins + the existing `js-yaml` dep. -- `package.json:38-41` (devDependencies only; `get-shit-done/bin/lib/frontmatter.cjs:9` shows `js-yaml` is available via bundle)

- **CommonJS module format** -- all lib modules use `require()`/`module.exports`. New refinement lib must follow `.cjs` extension and CommonJS exports. -- `get-shit-done/bin/lib/*.cjs` (all 14 modules)

- **`output()` calls `process.exit(0)`** -- every CLI route must terminate via `output()` or `error()`. This means a single CLI invocation can only return one result payload. The `refinement-init` and `refinement-write` routes must each be self-contained. -- `get-shit-done/bin/lib/core.cjs:26-42` (`output`)

- **`.planning/` is the root for all planning artifacts** -- `loadConfig` reads from `.planning/config.json`, all phase/capability/feature directories live under `.planning/`. The refinement directory at `.planning/refinement/` is consistent with this convention. -- `get-shit-done/bin/lib/core.cjs:59-107` (`loadConfig`)

- **No Mermaid, no JSON output for artifacts** -- the FEATURE.md spec explicitly mandates markdown tables for all output. This matches the existing convention where verification tables, progress tables, and trace tables are all markdown. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md:56-57` (EU-02 acceptance criteria)

- **`scan-checkpoint` route does not yet exist** -- it is specified in landscape-scan's TC-01 but not implemented. The refinement-artifact spec says to reuse it for pairs/ directory management, but it must be built first (either by landscape-scan or co-developed). -- `get-shit-done/bin/gsd-tools.cjs` (no `scan-checkpoint` case exists); `.planning/capabilities/requirements-refinement/features/landscape-scan/FEATURE.md:143`

### Reuse Opportunities

- **`safeReadFile(filePath)`** -- for reading RECOMMENDATIONS.md, findings/, matrix.md etc. with null-on-missing semantics. -- `get-shit-done/bin/lib/core.cjs:51-57`

- **`extractFrontmatter(content)`** -- for parsing finding card frontmatter (type, severity, affected capabilities) during delta computation. -- `get-shit-done/bin/lib/frontmatter.cjs:14-31`

- **`output(result, raw, rawValue)` and `error(message)`** -- standard output/error pattern for all CLI routes. -- `get-shit-done/bin/lib/core.cjs:26-47`

- **`pathExistsInternal(cwd, targetPath)`** -- for checking whether `.planning/refinement/` or specific artifact files exist before snapshot/write. -- `get-shit-done/bin/lib/core.cjs:349-357`

- **`toPosixPath(p)`** -- for normalizing paths in output JSON (cross-platform). -- `get-shit-done/bin/lib/core.cjs:12-14`

- **`loadConfig(cwd)`** -- for reading config.json if any refinement-specific config flags are needed in the future. -- `get-shit-done/bin/lib/core.cjs:59-107`

- **Test helpers: `createTempProject()`, `cleanup()`, `runGsdTools()`** -- for testing new refinement CLI routes. The `captureOutput()` pattern in capability.test.cjs is also reusable for unit-testing individual functions without spawning a process. -- `tests/helpers.cjs:45-73`, `tests/capability.test.cjs:26-53`

### Integration Points

- **gsd-tools.cjs switch statement** -- new `case 'refinement-init':` and `case 'refinement-write':` entries must be added to the main router. Pattern: require the new lib module, parse args, delegate to the command function. -- `get-shit-done/bin/gsd-tools.cjs:126-406`

- **New lib module creation** -- following the established pattern, a new `get-shit-done/bin/lib/refinement.cjs` module should export `cmdRefinementInit` and `cmdRefinementWrite`. It joins the existing 14 lib modules. -- `get-shit-done/bin/lib/` (convention: one lib module per domain)

- **landscape-scan's scan-checkpoint** -- TC-01 specifies that checkpoint management (pairs/ directory) reuses the `scan-checkpoint` route from landscape-scan. This creates an ordering dependency: either scan-checkpoint is built first, or refinement-artifact must include a minimal checkpoint implementation. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md:125`

- **coherence-report writes RECOMMENDATIONS.md** -- refinement-artifact manages the directory and does the delta, but RECOMMENDATIONS.md content comes from the coherence-report feature. The `refinement-write` route must accept content as input (likely via `--content-file` arg) rather than generating it. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md:89`

### Undocumented Assumptions

- **All lib modules are loaded lazily in gsd-tools.cjs** -- some modules (capability, feature, plan-validate, slug-resolve) are `require()`'d inside their `case` block rather than at the top. The newer pattern is inline require. New refinement module should follow this pattern to avoid startup cost. -- `get-shit-done/bin/gsd-tools.cjs:361-402` (inline requires)

- **`output()` writes to stdout and exits** -- there is no mechanism for a CLI route to write multiple files and report each write. `refinement-init` must create all directories/files in one shot, then return a single result JSON describing what was created. -- `get-shit-done/bin/lib/core.cjs:26-42`

- **Finding IDs (FINDING-001) are globally sequential per scan run** -- the delta computation must compare by these IDs across runs. If landscape-scan changes its ID scheme, delta breaks. This coupling is documented in FEATURE.md but not enforced by any shared constant or schema. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md:139`

- **Test runner is `node:test`** (built-in Node.js test runner, not Jest/Mocha) -- new tests must use `require('node:test')` and `require('node:assert')`. -- `tests/capability.test.cjs:7-8`, `scripts/run-tests.cjs` (referenced in package.json)

- **No existing `.planning/refinement/` directory management** -- the refinement directory is entirely new. No code currently reads from or writes to this path. This is greenfield within the established `.planning/` tree. -- [First principles: grep for "refinement" in all lib modules returns zero hits in code files]
