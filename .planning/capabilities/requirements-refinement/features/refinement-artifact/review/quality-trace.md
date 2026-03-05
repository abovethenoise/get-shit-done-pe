# Quality Trace: refinement-artifact

**Lens:** new
**File under review:** `get-shit-done/bin/lib/refinement.cjs` (622 lines, 10 exports)
**Router:** `get-shit-done/bin/gsd-tools.cjs` (6 routes wired)

---

## Phase 1: Quality Standards

Evaluating Node.js CommonJS module for:
- DRY: No duplicated logic between commands that share the same domain operations
- KISS: Abstractions (Map serialization, utility functions) must be justified by reuse or clarity
- YAGNI: No code that serves a different feature's concern without structural justification
- Robustness: Path sanitization consistency, error handling completeness
- Bloat: Single-use helpers should not exist as named functions unless they improve readability of a complex caller

---

## Phase 2: Trace Against Code

### Finding 1: Duplicated snapshotTable key functions between cmdRefinementInit and cmdRefinementDelta

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `refinement.cjs:163-166` -- `row => { const keys = Object.keys(row); return keys.length >= 2 ? \`${row[keys[0]]}|${row[keys[1]]}\` : null; }`
- `refinement.cjs:369-371` -- identical lambda: `row => { const keys = Object.keys(row); return keys.length >= 2 ? \`${row[keys[0]]}|${row[keys[1]]}\` : null; }`
- `refinement.cjs:171` -- `row => (row['From'] && row['To']) ? \`${row['From']}|${row['To']}\` : null`
- `refinement.cjs:376` -- identical lambda: `row => (row['From'] && row['To']) ? \`${row['From']}|${row['To']}\` : null`
- Reasoning: Two anonymous key functions are copy-pasted verbatim between `cmdRefinementInit` (lines 161-172) and `cmdRefinementDelta` (lines 367-377). These are the same domain operation -- keying matrix rows and dependency-graph rows. If the keying logic changes, both sites must be updated in lockstep. Named constants (`matrixKeyFn`, `graphKeyFn`) would eliminate this.

### Finding 2: Duplicated findings-clearing logic between cmdRefinementInit and cmdRefinementReport

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `refinement.cjs:174-179`:
  ```
  if (fs.existsSync(findingsDir)) {
    const existing = fs.readdirSync(findingsDir).filter(f => f.startsWith('FINDING-') && f.endsWith('.md'));
    for (const f of existing) { fs.unlinkSync(path.join(findingsDir, f)); }
  }
  ```
- `refinement.cjs:299-304`:
  ```
  const existing = fs.readdirSync(destFindingsDir).filter(f => f.startsWith('FINDING-') && f.endsWith('.md'));
  for (const f of existing) { fs.unlinkSync(path.join(destFindingsDir, f)); }
  ```
- Reasoning: The "clear all FINDING-*.md files from a directory" operation is repeated in two commands. The filter predicate `f.startsWith('FINDING-') && f.endsWith('.md')` also appears two more times (lines 93, 309) for reading. A single `clearFindings(dir)` helper would DRY this up and ensure the glob pattern stays consistent across all four call sites.

### Finding 3: Path traversal guard repeated 6 times without extraction

**Category:** DRY

**Verdict:** not met (proven)

**Evidence:**
- `refinement.cjs:212` -- `if (name.includes('..')) error('Invalid name: contains ".." segment');`
- `refinement.cjs:222` -- `if (contentFile.includes('..')) error('Invalid --content-file: contains ".." segment');`
- `refinement.cjs:275` -- `if (matrixFile && matrixFile.includes('..')) error('Invalid path: contains ".." segment');`
- `refinement.cjs:285` -- `if (graphFile && graphFile.includes('..')) error('Invalid path: contains ".." segment');`
- `refinement.cjs:295` -- `if (srcDir && srcDir.includes('..')) error('Invalid path: contains ".." segment');`
- `refinement.cjs:462` -- `if (contentFile.includes('..')) error('Invalid --content-file: contains ".." segment');`
- Reasoning: Six instances of the same guard with slight message variations. Some check for truthiness first (`matrixFile &&`), some do not -- this inconsistency is itself a bug risk. A `guardPath(value, label)` helper would centralize both the check and the error message format.

### Finding 4: renderDeltaTable is justified despite single-caller

**Category:** Bloat

**Verdict:** met

**Evidence:**
- `refinement.cjs:327-334` -- function definition
- `refinement.cjs:390,394,398,421,434` -- five call sites within `cmdRefinementDelta`
- Reasoning: Although `renderDeltaTable` is only called from one function, it is called five times within that function. Inlining it would bloat `cmdRefinementDelta` significantly. The extraction earns its keep by reducing a 100+ line function's visual noise.

### Finding 5: Changeset commands co-located in refinement.cjs

**Category:** YAGNI

**Verdict:** met (borderline)

**Evidence:**
- `refinement.cjs:448-608` -- `cmdChangesetWrite` and `cmdChangesetParse` (160 lines)
- Reasoning: These commands belong to the refinement-qa feature per the review context, not refinement-artifact. However, they operate on the same `.planning/refinement/` directory, share the same `safeReadFile`/`error`/`output` imports, and `cmdChangesetParse` produces data consumed by `cmdRefinementDelta`. Co-location in the same file is defensible given the shared domain directory. Splitting would create a second file with identical imports operating on the same directory tree. This is borderline but does not create a maintenance burden that exceeds the cost of splitting.

### Finding 6: JSON.stringify for deep equality comparison

**Category:** KISS

**Verdict:** met

**Evidence:**
- `refinement.cjs:71` -- `JSON.stringify(oldMap.get(key)) !== JSON.stringify(value)`
- `refinement.cjs:403` -- `JSON.stringify(e.old[field]) !== JSON.stringify(e.new[field])`
- Reasoning: The values being compared are simple objects with string properties (severity, type, recommendation, summary; or markdown table row cells). For flat string-keyed objects, `JSON.stringify` comparison is idiomatic in Node.js CLI tools with zero runtime deps. A deep-equal utility would be an unnecessary dependency for this use case. The only risk is key ordering, but since both sides are produced by the same `snapshotFindings`/`snapshotTable` functions with deterministic key insertion order, this is safe.

### Finding 7: Map serialization/deserialization round-trip

**Category:** KISS

**Verdict:** met

**Evidence:**
- `refinement.cjs:183-188` -- `Array.from(findings.entries())` serialization
- `refinement.cjs:349-355` -- `new Map(snapshotRaw.findings || [])` deserialization
- Reasoning: Maps cannot be JSON-serialized directly. The `[key, value]` array pattern is the idiomatic JavaScript approach (`new Map(entries)` constructor). The snapshot is written to a temp file between `refinement-init` and `refinement-delta` calls. This is the simplest correct approach; plain objects would lose insertion order guarantees and require different diffing logic.

### Finding 8: Inconsistent nullish guard on path traversal checks

**Category:** Robustness

**Verdict:** not met (suspected)

**Evidence:**
- `refinement.cjs:222` -- `if (contentFile.includes('..'))` (no truthiness check)
- `refinement.cjs:275` -- `if (matrixFile && matrixFile.includes('..'))` (has truthiness check)
- `refinement.cjs:462` -- `if (contentFile.includes('..'))` (no truthiness check)
- Reasoning: Three of six path guards check for truthiness before calling `.includes()`, three do not. If a flag is present but its value arg is missing (e.g., `--content-file` is last arg), `contentFile` would be `undefined`, and `.includes('..')` would throw `TypeError: Cannot read properties of undefined`. Lines 275, 285, 295 handle this correctly; lines 212, 222, 462 do not. The guards at lines 222 and 462 are partially protected by prior logic (line 221 checks `!contentFile` for the `cmdRefinementWrite` case), but line 462 in `cmdChangesetWrite` has no such upstream guard before the traversal check -- the `contentFile` value is extracted at line 461 and the `includes` check runs before the `!jsonContent` check at line 465. If `--content-file` is the last argument, `args[contentFileIdx + 1]` is `undefined` and line 462 throws.

---

## Summary

| # | Finding | Category | Verdict |
|---|---------|----------|---------|
| 1 | Duplicated snapshotTable key functions | DRY | not met |
| 2 | Duplicated findings-clearing logic | DRY | not met |
| 3 | Path traversal guard repeated 6x | DRY | not met |
| 4 | renderDeltaTable single-caller | Bloat | met |
| 5 | Changeset commands co-located | YAGNI | met |
| 6 | JSON.stringify for deep equality | KISS | met |
| 7 | Map serialization round-trip | KISS | met |
| 8 | Inconsistent nullish guard on path checks | Robustness | not met (suspected) |

**3 DRY violations (proven), 1 robustness concern (suspected), 4 justified patterns.**
