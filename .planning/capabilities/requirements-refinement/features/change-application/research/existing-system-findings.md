## Existing System Findings

### Relevant Implementations

- **`capability-create` CLI route** exists and handles creating capability directories + CAPABILITY.md files. Accepts `name`, generates slug, creates `.planning/capabilities/{slug}/features/` directory structure, writes CAPABILITY.md from template. -- `get-shit-done/bin/lib/capability.cjs:13-47` (`cmdCapabilityCreate`)

- **`feature-create` CLI route** exists and handles creating feature stubs under an existing capability. Validates parent capability exists, generates slug, creates directory, writes FEATURE.md from template. -- `get-shit-done/bin/lib/feature.cjs:13-53` (`cmdFeatureCreate`)

- **No CLI routes exist for move, modify-metadata, reinstate, defer, or kill mutations.** The gsd-tools.cjs switch statement (lines 126-406) contains only: `capability-create`, `capability-list`, `capability-status`, `feature-create`, `feature-list`, `feature-status`. No mutation routes beyond create exist. -- `get-shit-done/bin/gsd-tools.cjs:370-402`

- **`changeset-parse` CLI route is planned but not yet built.** Refinement-qa 01-PLAN.md defines it as `cmdChangesetParse(cwd, raw)` in `refinement.cjs`, returning JSON with `meta` and `entries` arrays. Refuses partial changesets (`status: partial`). This is the upstream dependency for change-application FN-01. -- `.planning/capabilities/requirements-refinement/features/refinement-qa/01-PLAN.md:187-217`

- **`refinement.cjs` module is planned but not yet built.** It will house `cmdRefinementInit`, `cmdRefinementWrite`, `cmdChangesetWrite`, `cmdChangesetParse`, and utility functions (`parseMarkdownTable`, `diffMaps`, etc.). -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/01-PLAN.md:83-144`

- **DELTA.md naming collision resolved.** Refinement-artifact owns `DELTA.md` (semantic diff of findings). Change-application's execution log must use a different name. The resolution recorded in refinement-artifact 01-PLAN.md says change-application uses `EXECUTION-LOG.md`. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/01-PLAN.md:68`; `.planning/STATE.md:185`

### Constraints

- **Only 2 of 7 mutation types have CLI routes (create-capability, create-feature).** The remaining 5 (move-feature, modify-metadata, reinstate, defer, kill) must use direct file edits and be flagged as UNVALIDATED in the execution log. -- `get-shit-done/bin/gsd-tools.cjs:370-402` (complete route listing)

- **CHANGESET.md entry schema has a specific field structure.** Each entry parsed by `changeset-parse` returns: `{ id, topic, type, source, capabilities, action, reasoning }`. The `action` field is free text describing the change, not a structured mutation command. Change-application must interpret `action` text into a mutation type + parameters. -- `.planning/capabilities/requirements-refinement/features/refinement-qa/01-PLAN.md:143-158`

- **Frontmatter uses FAILSAFE_SCHEMA (all values as strings).** When modifying frontmatter in capability/feature files, `extractFrontmatter` returns all values as strings. `spliceFrontmatter` must receive strings. Status values like `"killed"` or `"deferred"` will be string type. -- `get-shit-done/bin/lib/frontmatter.cjs:23` (`yaml.FAILSAFE_SCHEMA`)

- **`output()` calls `process.exit(0)`.** CLI commands terminate the process after output. Change-application cannot call CLI command functions directly in-process for sequential mutations; it must invoke them via Bash `node gsd-tools.cjs` subprocess calls. -- `get-shit-done/bin/lib/core.cjs:41`

- **Execution log file must NOT be named DELTA.md.** That name is owned by refinement-artifact for semantic diffs. Despite the FEATURE.md spec using "DELTA.md", the resolved name is `EXECUTION-LOG.md` at `.planning/refinement/EXECUTION-LOG.md`. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/01-PLAN.md:68`

### Reuse Opportunities

- **`extractFrontmatter` + `spliceFrontmatter`** for reading and updating status/reasoning fields in capability and feature markdown files during modify-metadata, defer, kill, and reinstate mutations. -- `get-shit-done/bin/lib/frontmatter.cjs` (`extractFrontmatter`, `spliceFrontmatter`)

- **`findCapabilityInternal` + `findFeatureInternal`** for validating that target capabilities/features exist before attempting mutations. Both return structured results with `found`, `directory`, `slug`, and path fields. -- `get-shit-done/bin/lib/core.cjs:504-549` (`findCapabilityInternal`, `findFeatureInternal`)

- **`generateSlugInternal`** for normalizing capability/feature names to slugs when processing changeset entries. -- `get-shit-done/bin/lib/core.cjs:359-366` (`generateSlugInternal`)

- **`safeReadFile`** for reading markdown files without throwing on missing files (returns null). -- `get-shit-done/bin/lib/core.cjs:51-56` (`safeReadFile`)

- **`reconstructFrontmatter`** for serializing updated frontmatter objects back to YAML string format (handles string coercion, sort order preservation). -- `get-shit-done/bin/lib/frontmatter.cjs:52-76` (`reconstructFrontmatter`)

- **Capability/feature template content generation** via `fillTemplate('capability', opts)` and `fillTemplate('feature', opts)` for create mutations (though the CLI routes already wrap these). -- `get-shit-done/bin/lib/template.cjs:248-279` (`fillTemplate`)

### Integration Points

- **Upstream: `changeset-parse` CLI route** returns `{ meta: {...}, entries: [{id, topic, type, source, capabilities, action, reasoning}] }`. Change-application FN-01 must call `node gsd-tools.cjs changeset-parse --raw` and parse stdout JSON. -- `.planning/capabilities/requirements-refinement/features/refinement-qa/01-PLAN.md:201-208`

- **Downstream: Execution log consumed by `refinement-artifact`** for the "Changes Applied" section of REFINEMENT-REPORT.md. The log must be at `.planning/refinement/EXECUTION-LOG.md` (resolved name) with the format specified in FEATURE.md TC-02. -- `.planning/capabilities/requirements-refinement/features/change-application/FEATURE.md:176-188`

- **CLI route invocation for create mutations:** `node gsd-tools.cjs capability-create <name> --raw` and `node gsd-tools.cjs feature-create <cap-slug> <name> --raw`. Both return JSON with `created: true` on success or exit code 1 with stderr on failure. -- `get-shit-done/bin/gsd-tools.cjs:371-375` (capability-create), `get-shit-done/bin/gsd-tools.cjs:388-391` (feature-create)

- **Capability/feature file paths follow a fixed convention:** `.planning/capabilities/{cap-slug}/CAPABILITY.md` and `.planning/capabilities/{cap-slug}/features/{feat-slug}/FEATURE.md`. All direct file edits must target these paths. -- `get-shit-done/bin/lib/core.cjs:508,534` (path construction in find functions)

### Undocumented Assumptions

- **Feature frontmatter has no `killed_reason` or `deferred_reason` field in the template.** The feature template only has `type`, `capability`, `status`, `created` in frontmatter. Kill/defer reasoning must be added as new frontmatter fields or embedded in the markdown body. Current code never reads these fields. -- `get-shit-done/templates/feature.md:1-6`

- **Capability template frontmatter has no `status` lifecycle beyond `planning`.** The template sets `status: planning` but there are no routes or code that transition capability status to `killed` or `deferred`. -- `get-shit-done/templates/capability.md:3`

- **`cmdCapabilityCreate` errors on existing capabilities** (line 21-22). If a changeset entry says "create capability X" but X already exists, the CLI route will fail. Change-application must handle this as an idempotent check (skip if exists) rather than treating it as an error. -- `get-shit-done/bin/lib/capability.cjs:21-22`

- **`cmdFeatureCreate` errors on existing features** (line 28-30). Same idempotency concern as capability-create. -- `get-shit-done/bin/lib/feature.cjs:28-30`

- **No `fs.rename` or directory-move utility exists.** Move-feature mutation requires moving a feature directory from one capability's `features/` to another's. No helper exists; this must be implemented as direct `fs.rename` or copy+delete. -- [First principles: grep for `rename` and `move` in the codebase produced no results in lib modules]

- **CHANGESET.md `action` field is free text, not a structured mutation descriptor.** The changeset schema (from refinement-qa 01-PLAN) stores human-readable action text like "Move feature X from cap-A to cap-B". Change-application must parse this text or use additional heuristics to determine mutation type and parameters. There is no `mutation_type` field in the entry schema. -- `.planning/capabilities/requirements-refinement/features/refinement-qa/01-PLAN.md:117-136`
