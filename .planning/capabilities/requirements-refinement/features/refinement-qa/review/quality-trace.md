# Quality Trace: refinement-qa

## Phase 1: Quality Standards

Evaluating a meta-prompting workflow file (refinement-qa.md) and its supporting CLI module (refinement.cjs) against: DRY, KISS, YAGNI, idiomatic Node.js/CJS patterns, field-level contract consistency between writer and parser, and robustness of markdown parsing.

Requirements: EU-01, EU-02, FN-01, FN-02, FN-03, FN-04, TC-01, TC-02.

---

## Phase 2: Trace Against Code

### Finding 1: Field name mismatch in changeset write/parse round-trip

**Category:** Functional Integrity

**Verdict:** regression (proven)

**Evidence:**
- `get-shit-done/bin/lib/refinement.cjs:524` -- `lines.push(\`- **Source:** \${entry.source_finding || 'user-initiated'}\`);`
- `get-shit-done/bin/lib/refinement.cjs:593` -- `const sourceMatch = block.match(/- \*\*Source:\*\*\s*(.+)/);`
- `get-shit-done/bin/lib/refinement.cjs:600` -- `source: sourceMatch ? sourceMatch[1].trim() : '',`
- `get-shit-done/workflows/refinement-qa.md:106` -- `Record: { id: "CS-{counter}", topic, type: "ACCEPT", source_finding, capabilities, action, ... }`
- Reasoning: The workflow produces entries with field `source_finding`. `cmdChangesetWrite` reads `entry.source_finding` to render `**Source:**` in the markdown. But `cmdChangesetParse` deserializes `**Source:**` back as `entry.source` (not `source_finding`). The downstream consumer (change-application) receives `source` while the upstream producer uses `source_finding`. This is a silent field rename during the round-trip. Data is not lost (it survives in the markdown), but the contract between writer input schema and parser output schema is inconsistent. Any consumer expecting `source_finding` after parsing will get `undefined`.

### Finding 2: parseMarkdownTable does not terminate at table boundary

**Category:** Robustness

**Verdict:** not met (suspected)

**Evidence:**
- `get-shit-done/bin/lib/refinement.cjs:44-47`:
  ```
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;
  ```
- Reasoning: The loop `continue`s past non-pipe lines instead of `break`ing. If a file contains two separate markdown tables (e.g., matrix.md with a legend table below the data table), both tables' rows are merged into one result array. The function docstring says "Parse a pipe-delimited markdown table" (singular), but it actually parses all tables in the file as one. Currently used only via `snapshotTable` for `matrix.md` and `dependency-graph.md`, which likely have single tables -- so this is a latent bug, not an active one. The fix would be trivial (`break` instead of `continue`), but the current behavior is defensible if those files are guaranteed single-table.

### Finding 3: JSON.stringify for deep equality in diffMaps

**Category:** KISS

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/lib/refinement.cjs:71` -- `if (JSON.stringify(oldMap.get(key)) !== JSON.stringify(value))`
- Reasoning: The values being compared are small row objects from markdown tables (4-5 string fields each). `JSON.stringify` comparison is a pragmatic choice here -- a deep-equal utility would be an unnecessary dependency for this use case. Property insertion order is stable because all objects are constructed identically by `parseMarkdownTable`. Complexity is justified.

### Finding 4: Validation does not enforce source_finding field

**Category:** Robustness

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/lib/refinement.cjs:472` -- `if (!entry.id || !entry.topic || !entry.type || !entry.capabilities || !entry.action || !entry.reasoning)`
- Reasoning: `source_finding` is intentionally optional -- user-initiated entries don't have a source finding. The fallback `entry.source_finding || 'user-initiated'` on line 524 handles this correctly. The validation is appropriately scoped.

### Finding 5: Workflow uses correct CLI route name

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/refinement-qa.md:134` -- `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-write --content-file {temp_json} --checkpoint`
- `get-shit-done/bin/gsd-tools.cjs:455` -- `case 'changeset-write':`
- TC-01 requirement says "Change set writing uses `refinement-write` CLI route" but the actual implementation uses `changeset-write`. The workflow correctly references the implemented route name (`changeset-write`), not the stale requirement text. The route exists and is properly wired.

### Finding 6: TC-01 requirement text is stale relative to implementation

**Category:** Idiomatic Violation (documentation drift)

**Verdict:** not met (proven)

**Evidence:**
- `FEATURE.md:145` -- "Change set writing uses `refinement-write` CLI route from refinement-artifact"
- `get-shit-done/workflows/refinement-qa.md:134` -- uses `changeset-write` (correct)
- `get-shit-done/bin/gsd-tools.cjs:455` -- route is `changeset-write` (correct)
- Reasoning: The TC-01 requirement references a route name (`refinement-write`) and module name (`refinement-artifact`) that don't match the implementation. The implementation is correct; the requirement text was not updated. This is documentation drift that could mislead future contributors.

### Finding 7: Changeset sort is by type only, not type-then-severity

**Category:** Functional Integrity

**Verdict:** not met (proven)

**Evidence:**
- `FEATURE.md:127` (FN-04) -- "Entries sorted by type, then by finding severity"
- `get-shit-done/bin/lib/refinement.cjs:481-483`:
  ```
  const sorted = [...data.entries].sort((a, b) => {
    return (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99);
  });
  ```
- Reasoning: FN-04 specifies two-level sort: type first, then severity within type. The implementation only sorts by type. The secondary sort by severity is missing. Entries within the same type group retain insertion order instead.

### Finding 8: Workflow banner style matches codebase convention

**Category:** Idiomatic Violation

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/refinement-qa.md:42-44` -- uses `-------` dashes with `GSD >` prefix
- `get-shit-done/references/ui-brand.md:10-12` -- specifies `━━━━━━` with `GSD ►` prefix
- Reasoning: The brand guide specifies a different style, but every other workflow in the codebase (`change-application.md`, `capability-orchestrator.md`, `landscape-scan.md`, etc.) uses `GSD >` with dashes. The workflow follows the established codebase convention. This is a systemic brand-guide drift issue, not a refinement-qa regression.

---

## Summary

| # | Finding | Verdict | Severity |
|---|---------|---------|----------|
| 1 | source_finding/source field name mismatch in write/parse round-trip | regression (proven) | medium |
| 2 | parseMarkdownTable doesn't stop at table boundary | not met (suspected) | low |
| 3 | JSON.stringify for equality | met | -- |
| 4 | source_finding validation scope | met | -- |
| 5 | Correct CLI route reference | met | -- |
| 6 | TC-01 requirement text stale | not met (proven) | low |
| 7 | Missing secondary sort by severity | not met (proven) | low |
| 8 | Banner style matches codebase | met | -- |

**Actionable findings:** 1 (field mismatch), 6 (doc drift), 7 (missing sort). Finding 2 is latent.
