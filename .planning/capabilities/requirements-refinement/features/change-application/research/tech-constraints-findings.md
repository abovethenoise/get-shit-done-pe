## Tech Constraints Findings

### Hard Constraints

- **Zero runtime deps** -- the project uses only Node.js stdlib + vendored js-yaml 4.1.1 + argparse. No new libraries can be introduced. -- source: `/Users/philliphall/get-shit-done-pe/.planning/PROJECT.md` line 77
- **CJS module pattern required** -- all lib modules are CommonJS (`require`/`module.exports`), new code must follow. -- source: all files in `get-shit-done/bin/lib/*.cjs`
- **refinement.cjs does not exist yet** -- planned by refinement-artifact Plan 01 (not yet executed). `changeset-parse` and `changeset-write` routes are also planned by refinement-qa Plan 01 (not yet executed). change-application depends on both being built first. -- source: `Glob` returned no hits for `**/refinement.cjs`; routes absent from `gsd-tools.cjs` switch statement
- **CHANGESET.md action field is free text** -- mutation type must be inferred from the `action` field string, not from a structured `mutation_type` enum. The CHANGESET.md schema (refinement-qa Plan 01) defines entries with: `type` (ACCEPT/MODIFY/etc.), `source`, `capabilities`, `action`, `reasoning`. The `action` field contains the recommendation text. There is no explicit mutation-type field. -- source: refinement-qa `01-PLAN.md` lines 85-137
- **DELTA.md naming collision resolved** -- refinement-artifact Plan 01 notes that `DELTA.md` is owned by refinement-artifact (delta diff), and change-application's execution log should use a different name. The FEATURE.md for change-application still calls it DELTA.md. This is a spec-level conflict that needs resolution before implementation. -- source: refinement-artifact `01-PLAN.md` line 68: "DELTA.md naming collision: This feature owns DELTA.md. change-application's execution log will use EXECUTION-LOG.md"
- **Atomic file mutations via Read/Edit tools only** -- TC-01 explicitly prohibits Bash sed/awk for file edits. All direct edits must use Claude Code's Read/Edit tools. -- source: FEATURE.md TC-01 line 170

### Dependency Capabilities

- **capability.cjs**: exports `cmdCapabilityCreate(cwd, name, raw)` -- creates `.planning/capabilities/{slug}/` with `CAPABILITY.md` and `features/` subdirectory. Takes a display name, generates slug internally. Returns JSON with `created`, `slug`, `path`. -- source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/capability.cjs` lines 13-47
- **feature.cjs**: exports `cmdFeatureCreate(cwd, capSlug, name, raw)` -- creates feature directory under an existing capability with `FEATURE.md` from template. Validates parent capability exists. Returns JSON with `created`, `slug`, `capability_slug`, `path`. -- source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs` lines 13-53
- **frontmatter.cjs**: exports `extractFrontmatter(content)`, `spliceFrontmatter(content, newObj)`, `reconstructFrontmatter(obj)` -- full YAML frontmatter read/modify/write cycle. `spliceFrontmatter` replaces frontmatter in a markdown string while preserving body content. Uses vendored js-yaml with FAILSAFE_SCHEMA (all values as strings). -- source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/frontmatter.cjs` lines 14-85
- **core.cjs**: exports `findCapabilityInternal(cwd, slug)`, `findFeatureInternal(cwd, capSlug, featureSlug)`, `generateSlugInternal(text)`, `safeReadFile(path)` -- critical for locating cap/feat directories before mutation. `findFeatureInternal` returns `{ found, directory, slug, feature_path }`. -- source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 504-549
- **gsd-tools.cjs CLI router**: flat-verb command pattern. Routes: `capability-create <name>`, `capability-list`, `capability-status <slug>`, `feature-create <cap> <name>`, `feature-list <cap>`, `feature-status <cap> <feat>`. All accept `--raw` flag. No routes exist for: move, kill, defer, reinstate, or metadata update. -- source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` lines 370-402
- **refinement-write --type delta** (planned): will write to `.planning/refinement/DELTA.md`. Accepts `--content-file <path>` with file content. Simple file writer -- no validation logic. -- source: refinement-artifact `01-PLAN.md` lines 100-113

### Compatibility Issues

- **DELTA.md vs EXECUTION-LOG.md naming** -- refinement-artifact Plan 01 explicitly claims DELTA.md for its own delta diff output and states change-application should use EXECUTION-LOG.md. But the change-application FEATURE.md (FN-04, TC-02) calls the output "DELTA.md" and specifies the path `.planning/refinement/DELTA.md`. One of these must change. If refinement-artifact's plan is built first (it's in the same capability, earlier feature), the collision is real. -- source: refinement-artifact `01-PLAN.md` line 68 vs change-application `FEATURE.md` FN-04
- **Mutation type inference is fragile** -- CHANGESET.md entries have a free-text `action` field but no structured mutation-type indicator. The workflow must parse natural language like "Create capability analytics-pipeline" or "Move feature drill-timing from practice to analytics-pipeline" to determine which of 7 mutation types to execute. This is inherently pattern-matching on agent-generated text. -- source: CHANGESET.md schema in refinement-qa `01-PLAN.md` lines 117-137; FEATURE.md FN-02 line 90
- **CAPABILITY.md template creates with status `planning`** -- `capability-create` and `feature-create` always produce artifacts with `status: planning`. There is no parameter to override initial status. If the coherence report recommends creating with a different initial status, the workflow would need a post-create frontmatter splice. -- source: `get-shit-done/templates/capability.md` line 4, `get-shit-done/templates/feature.md` line 4
- **No status enum validation** -- frontmatter.cjs uses FAILSAFE_SCHEMA (all strings). Status values like `killed`, `deferred`, `exploring` are not validated against any enum. Any string can be written. This is both a flexibility (no blocker) and a risk (no guardrails). -- source: `frontmatter.cjs` line 23

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| Create capability via CLI | **viable** | `capability-create` exists, takes name, returns slug. -- source: `capability.cjs` lines 13-47 |
| Create feature via CLI | **viable** | `feature-create` exists, takes cap-slug + name, validates parent. -- source: `feature.cjs` lines 13-53 |
| Move feature via CLI | **blocked** | No `feature-move` CLI route exists. No fs.rename utility exposed. -- source: grep of gsd-tools.cjs shows no move/rename routes |
| Move feature via direct edit | **constrained** | Requires: (1) copy directory tree, (2) update FEATURE.md frontmatter `capability` field, (3) delete source directory. Must use Node.js `fs` via Bash or workflow-level file operations. Claude Code's Edit tool cannot move directories. Risk: partial failure leaves orphan copies. |
| Modify metadata via CLI | **blocked** | No `frontmatter-set` or `feature-update` CLI route exists. `frontmatter get` is read-only. -- source: `gsd-tools.cjs` lines 229-239 |
| Modify metadata via direct edit | **viable** | Read file, `extractFrontmatter`, mutate object, `spliceFrontmatter`, write back. All utilities exist in frontmatter.cjs. The workflow (being a .md prompt, not code) would use Read/Edit tools directly on the markdown files. -- source: `frontmatter.cjs` lines 14-85 |
| Reinstate feature via direct edit | **viable** | Read FEATURE.md, splice frontmatter to `status: exploring`, remove kill/defer reasoning section from body, delete research/ and *-PLAN.md artifacts. All achievable via Read/Edit + file deletion. |
| Defer feature via direct edit | **viable** | Read FEATURE.md, splice frontmatter to `status: deferred`, add reasoning. Straightforward frontmatter mutation. |
| Kill feature/capability via direct edit | **viable** | Read FEATURE.md or CAPABILITY.md, splice frontmatter to `status: killed`, add reasoning. Same pattern as defer. |
| Write DELTA.md via refinement-write | **constrained** | Route is planned (refinement-artifact Plan 01) but not yet built. If built, `refinement-write --type delta --content-file <path>` writes to `.planning/refinement/DELTA.md`. If not built yet at execution time, the workflow can write directly. Naming collision with refinement-artifact's DELTA.md must be resolved first. |
| Write DELTA.md directly | **viable** | Workflow writes markdown file directly using Write tool. No dependency on refinement-write. Avoids naming collision if output file is renamed to EXECUTION-LOG.md. |
| Parse CHANGESET.md via changeset-parse | **constrained** | Route is planned (refinement-qa Plan 01) but not yet built. The workflow must either (a) depend on changeset-parse being built first, or (b) inline its own parser. Given the CHANGESET.md schema is well-defined, inline parsing is feasible but duplicates logic. |
| Infer mutation type from action text | **constrained** | No structured mutation_type field in CHANGESET.md schema. Must pattern-match free-text action strings. Risk of misclassification. The workflow being a .md prompt executed by Claude Code means the LLM does the classification -- this is actually well-suited to the runtime (LLM is good at text classification). [First principles: LLM executing the workflow can classify action text more reliably than regex, but this makes the behavior non-deterministic and untestable via CLI] |

### Alternatives

- **Move feature (blocked via CLI)** -> Direct file operations in the workflow: `fs.cpSync` source to target directory, update frontmatter capability field, `fs.rmSync` source. Alternatively, since this is a workflow (.md file, not code), the workflow instructs Claude Code to use Bash `cp -r` and `rm -rf` commands, then Edit the frontmatter. -- [First principles: directory move is two operations (copy + delete) at filesystem level regardless; CLI route would just wrap the same thing]

- **Modify metadata (blocked via CLI)** -> Direct Read/Edit on FEATURE.md or CAPABILITY.md files. The workflow reads the file, identifies the frontmatter field to change, and uses the Edit tool to modify it in place. `spliceFrontmatter` from frontmatter.cjs is available if the workflow calls it via a Bash one-liner, but more likely the workflow just uses Claude Code's Edit tool directly since it operates on markdown files. -- [First principles: frontmatter edits are simple text replacements in a well-structured format; direct edit is both simpler and lower-risk than building a new CLI route]

- **DELTA.md naming collision** -> Rename change-application's output to `EXECUTION-LOG.md` as suggested by refinement-artifact Plan 01 line 68. The downstream consumer (refinement-artifact) reads whatever path is specified. This requires updating FEATURE.md FN-04 and TC-02 to use the new name. -- source: refinement-artifact `01-PLAN.md` line 68

- **Mutation type inference from free text** -> Add a `mutation_type` structured field to the CHANGESET.md entry schema (in changeset-write). This would require modifying the refinement-qa Plan 01 schema definition and the changeset-write implementation. The 7 types map to enum values: `create-capability`, `create-feature`, `move-feature`, `modify-metadata`, `reinstate`, `defer`, `kill`. -- [First principles: structured enum is always more reliable than free-text inference; the schema is not yet built so adding a field is cheap]

### Summary: CLI Route Coverage for 7 Mutation Types

| Mutation Type | CLI Route | Status | Fallback |
|---------------|-----------|--------|----------|
| Create capability | `capability-create <name>` | EXISTS | n/a |
| Create feature | `feature-create <cap> <name>` | EXISTS | n/a |
| Move feature | none | MISSING | Direct fs copy+delete via Bash, Edit frontmatter |
| Modify metadata | none | MISSING | Read file, Edit frontmatter fields directly |
| Reinstate feature | none | MISSING | Edit frontmatter status, clear reasoning + artifacts |
| Defer feature | none | MISSING | Edit frontmatter status, add reasoning |
| Kill feature/capability | none | MISSING | Edit frontmatter status, add reasoning |

**2 of 7 mutation types have existing CLI routes. 5 require direct edit fallback with UNVALIDATED flag.**

### Key Implementation Constraint: Workflow vs Code Module

This feature is specified as a "workflow file" (TC-01 line 168). GSD workflows are `.md` files that Claude Code executes as prompts. They do NOT have programmatic access to Node.js modules like `frontmatter.cjs`. The workflow instructs Claude Code to:
- Run Bash commands (`node gsd-tools.cjs capability-create ...`)
- Use Read/Edit tools to modify files directly
- Use Write tool to create new files

This means the "direct edit fallback" pattern is not calling `spliceFrontmatter()` from code -- it is Claude Code's Edit tool modifying YAML frontmatter in markdown files. This is reliable for simple field changes (status, adding a section) but carries risk for complex multi-field mutations.

The `changeset-parse` route (when built) would be called via `node gsd-tools.cjs changeset-parse --raw` from a Bash command in the workflow, returning JSON that the workflow (Claude Code) parses.
