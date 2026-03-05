## Prior Art Findings

### Problem Class

Delta/diff reporting across structured audit runs: comparing findings (identified by stable IDs) and structured data (markdown tables) between consecutive runs, producing human-readable change reports. Zero external dependencies required (Node.js, no runtime deps).

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| Terraform plan-style drift detection | Snapshot desired state, refresh actual state, diff by resource address (stable identity key) | Proven | High | [HashiCorp blog](https://www.hashicorp.com/en/blog/detecting-and-managing-drift-with-terraform) |
| SonarQube new-code-period issue tracking | Compare findings by rule+location identity across scans; categorize as new/fixed/changed | Proven | High | [SonarQube docs](https://docs.sonarsource.com/sonarqube-server/user-guide/issues/solution-overview) |
| jsondiffpatch / deep-object-diff libraries | Generic JS object diffing with add/remove/change semantics | Proven | Low | [jsondiffpatch](https://github.com/benjamine/jsondiffpatch), [deep-object-diff](https://github.com/mattphillips/deep-object-diff) |
| MADR-style artifact directory convention | Numbered markdown files in structured directories with frontmatter metadata | Proven | Medium | [MADR](https://adr.github.io/madr/) |

### Detailed Analysis

#### 1. Terraform Plan Pattern (Highest Fit)

**How it works:**
1. Before mutation: snapshot current state (the "prior" state file)
2. After mutation: compute new state
3. Diff by resource address (stable identity key) producing added/removed/changed
4. Render as human-readable plan output with `+` / `-` / `~` markers

**Why it fits:**
- GSD's refinement-artifact does exactly this: snapshot findings before scan, compare after scan, report delta
- Finding IDs (`FINDING-001`) serve the same role as Terraform resource addresses -- stable identity keys across runs
- Matrix rows (capability pairs) and dependency graph rows (from/to tuples) are naturally keyed, just like Terraform resources
- The "overwrite current state each run, keep only one delta" model matches Terraform's approach (state + plan, not cumulative history)
- Zero-dep implementation is straightforward: read old state into memory, compute new state, compare by key

**Key pattern to adopt:** State is a map keyed by identity (finding ID, pair key, dependency tuple). Diff = set operations on keys (added = new - old, removed = old - new, changed = intersection where values differ).

Source: [Terraform drift detection](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift), [Terraform concise diff](https://www.hashicorp.com/en/blog/terraform-0-14-adds-a-new-concise-diff-format-to-terraform-plans)

#### 2. SonarQube Issue Identity Pattern (Key Design Insight)

**How it works:**
- Each issue has a composite identity: rule key + file + line range + message hash
- On each scan, compares current issues to previous issues using this identity
- Categorizes as: new (not in previous), fixed (not in current), unchanged
- "New code period" concept defines the comparison baseline

**Why it matters for GSD:**
- Finding ID stability is the critical design decision. SonarQube learned that naive identity (just line number) breaks when code moves. They use a composite key.
- GSD findings already use explicit IDs (`FINDING-{id}`), which is simpler and more stable than SonarQube's approach -- good decision already made in the spec.
- The "backdating" concept (when is an issue truly new vs. just newly detected?) is relevant if refinement rules change between runs.

**Key pattern to adopt:** Identity must be explicit and assigned, not derived from content position. The spec's `FINDING-{id}` approach is correct.

Source: [SonarQube issue management](https://docs.sonarsource.com/sonarqube-server/user-guide/issues/solution-overview), [SonarQube new code](https://docs.sonarsource.com/sonarqube-server/user-guide/about-new-code)

#### 3. Generic JS Diff Libraries (Low Fit)

**Why they don't fit:**
- `jsondiffpatch`, `deep-object-diff`, `deep-diff` solve generic object tree diffing
- GSD's diff is structurally simple: compare two sets of keyed items (findings, matrix cells, dependency rows)
- Adding a dependency for what amounts to set intersection/difference operations violates YAGNI
- The project has zero runtime deps -- adding one for ~30 lines of set logic is wrong

**When they would fit:** If the diff involved deeply nested, variably-structured objects where key identity is ambiguous. That's not this case.

Source: [deep-object-diff npm](https://www.npmjs.com/package/deep-object-diff), [First principles: the data structures being diffed are flat keyed records, not deep trees]

### Recommended Starting Point

**Terraform plan pattern (keyed-state diffing):** Implement delta computation as set operations on keyed maps. This matches the spec's requirements exactly, requires zero dependencies, and is the simplest correct approach.

Implementation sketch:
```
snapshotFindings(dir) -> Map<id, {severity, type, recommendation}>
snapshotMatrix(dir)   -> Map<"capA-capB", {relationship, confidence}>
snapshotDeps(dir)     -> Map<"from->to", {type, explicit}>

diffMaps(oldMap, newMap) -> { added: [], removed: [], changed: [] }
  added   = keys in new but not old
  removed = keys in old but not new
  changed = keys in both where values differ

renderDelta(diffs) -> DELTA.md markdown
```

This is ~50-80 lines of logic. The existing `state-snapshot` command in `gsd-tools.cjs` already demonstrates the snapshot-then-parse pattern for STATE.md, so the codebase has precedent for this approach.

Source: [First principles: set operations on keyed maps are the minimal correct solution for comparing flat structured records by stable ID]

### Anti-Patterns

- **Raw text diff (unified diff / patch format):** Tempting because tools like `diff` exist everywhere, but produces noisy output when markdown formatting changes without semantic meaning. The spec explicitly calls out "semantic, not textual" diff (TC-02). Text diff would flag whitespace changes, column width adjustments, and reordering as changes. -- [FEATURE.md TC-02 constraint](file:///Users/philliphall/get-shit-done-pe/.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md)

- **Cumulative history / append-only log:** Storing every historical run's state and computing multi-run trends. The spec explicitly scopes to "only current + delta from previous" (EU-01 out-of-scope). Building for cumulative history adds storage management, retention policies, and merge complexity with no current requirement. -- [FEATURE.md EU-01 out of scope](file:///Users/philliphall/get-shit-done-pe/.planning/capabilities/requirements-refinement/features/refinement-artifact/FEATURE.md)

- **Content-derived identity (hash-based finding IDs):** Generating finding IDs from content hashes seems clever but breaks identity when findings are edited/refined. A finding that changes severity should keep its ID. SonarQube had persistent problems with this -- issues appearing as "new" when they were just modified. Explicit sequential IDs (`FINDING-001`) are simpler and more stable. -- [SonarQube community: scanner finding new issues when code hasn't changed](https://community.sonarsource.com/t/scanner-finding-new-issues-when-code-hasnt-changed/118100)

- **External diff dependencies:** Adding `jsondiffpatch` or similar for what is fundamentally `Set.difference()` on keyed records. Violates the project's zero-runtime-deps constraint and adds complexity for a trivial operation. -- [First principles: dependency cost must exceed implementation cost to justify inclusion]

### Libraries / Tools

No external libraries recommended. The problem is solved with:
- `fs.readFileSync` / `fs.writeFileSync` (Node built-in)
- `Map` / `Set` (JS built-in) for keyed state comparison
- Existing markdown table parsing patterns already in the codebase (`get-shit-done/bin/lib/state.cjs`, `get-shit-done/bin/lib/core.cjs`)

### Canonical Patterns

- **Snapshot-Diff-Render:** Take a snapshot before mutation, run the mutation, diff snapshot vs. current state, render the delta. Used by Terraform (plan), database migrations (Prisma `migrate diff`), and Lighthouse CI (score comparison). This is the pattern to implement. -- [Terraform plan](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift), [Prisma migrate diff](https://fig.io/manual/prisma/migrate/diff)

- **Keyed Identity for Diff Stability:** Every diffable entity gets an explicit, stable identifier that persists across runs. Changes to the entity's properties are tracked as modifications, not as remove+add. Terraform uses resource addresses, SonarQube uses composite issue keys, database migrations use table/column names. GSD uses `FINDING-{id}`. -- [SonarQube issue tracking](https://docs.sonarsource.com/sonarqube-server/user-guide/issues/solution-overview)

- **MADR Directory Convention:** Structured directories with individual markdown files per record (one file per finding, not one big file). Enables per-record diffing and independent lifecycle management. Already specified in the feature spec (`findings/FINDING-{id}.md`). -- [MADR](https://adr.github.io/madr/)

- **Concise Diff Rendering:** Show only what changed, always include identity fields for context. Terraform 0.14+ hides unchanged fields but always shows `id`, `name`, and `tags` so the reader can orient. DELTA.md should show finding ID + what changed, not the full finding content. -- [Terraform concise diff](https://www.hashicorp.com/en/blog/terraform-0-14-adds-a-new-concise-diff-format-to-terraform-plans)

### Existing Codebase Precedent

The `state-snapshot` command in `gsd-tools.cjs` (line 338) already implements the "parse a markdown file into structured data" pattern. The refinement snapshot functions follow the same approach: read markdown, extract keyed records, return as structured data for comparison. No new patterns need to be invented.

Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` line 338, `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/state.cjs` line 400
