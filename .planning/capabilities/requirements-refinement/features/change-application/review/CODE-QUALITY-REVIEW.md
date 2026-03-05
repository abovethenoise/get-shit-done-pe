# Code Quality Review — Fix Pass (23 Findings)

## Phase 1: Quality Standards

Evaluating Node.js (CommonJS) CLI library code and workflow markdown for:
- DRY extraction correctness (helpers replace all prior inline sites)
- Behavioral correctness of boundary changes (break vs continue)
- Sort stability (severity addition must not break type-first ordering)
- Guard function consistency (null + traversal checks at all sites)
- Dead code removal completeness (no orphaned references)
- Workflow simplification (no lost critical behavior)

## Phase 2: Trace Against Code

---

### Finding 1: Inconsistent guardPath usage in cmdRefinementReport — null path bypasses guard but still hits path.resolve

**Category:** Resource Management

**Verdict:** regression (suspected)

**Evidence:**
- `refinement.cjs:277-279` — `if (matrixFile) guardPath(matrixFile, '--matrix-file'); const content = safeReadFile(path.resolve(cwd, matrixFile));`
- Same pattern at lines 287-289 (graphFile) and 297-298 (srcDir)
- Reasoning: When `--matrix-file` is the last CLI arg (no value follows), `matrixFile` is `undefined`. The `if (matrixFile)` guard skips `guardPath`, but execution continues to `path.resolve(cwd, undefined)` which resolves to `cwd` itself. `safeReadFile` would then try to read a directory, return null, and `error()` would fire — so it does fail. But the failure message ("Cannot read matrix file: undefined") is misleading, and the path traversal guard is silently skipped. Compare to `cmdRefinementWrite:225` and `cmdChangesetWrite:452` which call `guardPath` unconditionally (guardPath itself handles null via `if (!value) error(...)`). The three sites in cmdRefinementReport are the only places that conditionally call guardPath, breaking the "guardPath handles both checks" contract.

---

### Finding 2: break vs continue in parseMarkdownTable is correct

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `refinement.cjs:66` — `if (!line || !line.startsWith('|')) break;`
- Reasoning: The old `continue` would skip non-table lines but keep iterating, potentially picking up a second unrelated table further in the document. `break` correctly stops at the first non-table line after the header, treating the table as a contiguous block. This is the correct semantic for "parse THE markdown table" (singular).

---

### Finding 3: Severity sort preserves type-first ordering

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `refinement.cjs:472-476` — `const typeOrd = (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99); if (typeOrd !== 0) return typeOrd; return (SEVERITY_ORDER[...] ?? 99) - (SEVERITY_ORDER[...] ?? 99);`
- Reasoning: Type comparison is primary; severity is only consulted when types are equal. The `?? 99` (nullish coalescing) correctly handles entries with no severity field — they sort last within their type group. No regression.

---

### Finding 4: guardPath correctly used at all 6 sites — except the 3 conditional sites in cmdRefinementReport

**Category:** DRY

**Verdict:** met (with caveat from Finding 1)

**Evidence:**
- Unconditional sites (correct): `refinement.cjs:216` (--name), `refinement.cjs:225` (--content-file in write), `refinement.cjs:452` (--content-file in changeset-write) — all 3 call `guardPath(value, label)` directly, letting guardPath handle null.
- Conditional sites (see Finding 1): `refinement.cjs:278`, `refinement.cjs:288`, `refinement.cjs:298` — all wrapped in `if (value)`, which sidesteps guardPath's null check.

---

### Finding 5: clearFindings used at both sites, old inline code fully removed

**Category:** DRY

**Verdict:** met

**Evidence:**
- `refinement.cjs:185` — `clearFindings(findingsDir);` in cmdRefinementInit
- `refinement.cjs:304` — `clearFindings(destFindingsDir);` in cmdRefinementReport
- Git diff confirms both old inline blocks (readdirSync + filter + unlinkSync loops) are removed.

---

### Finding 6: matrixKeyFn/graphKeyFn replace ALL duplicated lambdas

**Category:** DRY

**Verdict:** met

**Evidence:**
- Used at `refinement.cjs:181-182` (cmdRefinementInit) and `refinement.cjs:367-368` (cmdRefinementDelta).
- Git diff confirms both old inline lambda definitions are removed. No remaining inline key functions.

---

### Finding 7: source field name fix handles both field names

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `refinement.cjs:517` — `entry.source || entry.source_finding || 'user-initiated'`
- Reasoning: The old code only checked `entry.source_finding`. The fix adds `entry.source` as primary, with `source_finding` as fallback for backward compatibility. This matches the field name used in `cmdChangesetParse` output (line 593: `source: sourceMatch ? ...`), ensuring round-trip fidelity.

---

### Finding 8: Dead import removal in scan.cjs is clean

**Category:** Bloat

**Verdict:** met

**Evidence:**
- `extractFrontmatter` import removed. Grep confirms zero remaining references in scan.cjs.
- `FINDING_TYPES`, `SEVERITY_LEVELS`, `CONFIDENCE_LEVELS`, `FINDING_FIELDS` exports removed. Grep confirms zero references anywhere in the codebase.

---

### Finding 9: listDirs helper used at all 3 directory-listing sites

**Category:** DRY

**Verdict:** met

**Evidence:**
- `scan.cjs:29` (capabilitiesDir in discover), `scan.cjs:45` (featuresDir in discover), `scan.cjs:105` (capabilitiesDir in pairs).
- All three former inline `readdirSync + filter(isDirectory) + map(name) + sort()` blocks replaced.

---

### Finding 10: Tier scaling correctly implements thresholds without filtering

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `scan.cjs:109-110` — `if (count > 50) tier = 'large'; else if (count > 20) tier = 'medium';`
- Old code had a stderr warning for medium tier and no large tier distinction. New code sets the label correctly. Pair enumeration is still full O(n^2) for all tiers — the tier label is metadata for the orchestrator to act on, not filtering logic in scan.cjs itself. This matches the FEATURE.md spec (TC-03) which puts filtering responsibility on the orchestrator.

---

### Finding 11: scan.cjs path sanitization added but not using guardPath

**Category:** DRY

**Verdict:** not met (minor)

**Evidence:**
- `scan.cjs:132-133` — `if (pair && pair.includes('..')) error(...); if (outputDir && outputDir.includes('..')) error(...);`
- `refinement.cjs:11-14` defines `guardPath` which does the same null + ".." check. scan.cjs does not import or use `guardPath`, instead implementing inline checks. This is a mild DRY violation — two files, two patterns for the same concern.
- Context: scan.cjs and refinement.cjs are sibling libs under `bin/lib/`. guardPath could be extracted to core.cjs or scan.cjs could import from refinement.cjs. However, scan.cjs has the additional wrinkle that `pair` and `outputDir` are optional (null is valid, meaning "not provided"), so the `if (value)` guard is intentional here — same conditional pattern as cmdRefinementReport (Finding 1).

---

### Finding 12: Workflow simplification retains all critical behavior

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `change-application.md` retains: changeset parsing via CLI (line 19), actionable vs logged-only split (lines 25-28), sequential application with status tracking (lines 44-78), failure UX with AskUserQuestion fix/skip/abort (lines 67-78), EXECUTION-LOG.md output (lines 82-116), completion banner (lines 119-138).
- Removed: mutation classification, topological sort, WAL, idempotency pre-checks. These are explicitly listed in FEATURE.md TC-01 constraints (lines 89-91) as not needed.

---

### Finding 13: CLI syntax in workflow uses positional args correctly

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `change-application.md:19` — `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-parse --raw`
- `change-application.md:53` — `capability-create {slug} --raw`
- `change-application.md:57` — `feature-create {cap} {feat} --raw`
- These match the CLI route signatures in gsd-tools.cjs. Positional args before `--raw` flag.

---

### Finding 14: Completeness logic fix in scan.cjs is correct

**Category:** Functional Integrity

**Verdict:** met

**Evidence:**
- `scan.cjs:60-66` — `if (capContent && features.length > 0 && docContent) completeness = 'full'; else if (capContent || features.length > 0 || docContent) completeness = 'partial';`
- Old code: `full` required only capContent + features (ignored docContent); `partial` required only capContent (ignored features-only or doc-only). New logic: `full` requires all three; `partial` fires when any artifact exists. This correctly implements the three-state completeness model.

---

## Summary

| Area | Verdict |
|------|---------|
| guardPath extraction | 3/6 sites correct; 3 sites use conditional wrapper (Finding 1) |
| clearFindings extraction | Clean at both sites |
| matrixKeyFn/graphKeyFn | Clean at all 4 usage sites |
| break vs continue | Correct fix |
| Severity sort | Correct, stable with type-first |
| source field name | Correct with backward compat |
| Dead import/export removal | Clean, no orphans |
| listDirs extraction | Clean at all 3 sites |
| Tier scaling | Correct labels, no premature filtering |
| Path sanitization (scan.cjs) | Works but duplicates guardPath pattern |
| Workflow simplification | No lost critical behavior |
| CLI syntax | Correct positional args |

**Actionable findings:** 1 (Finding 1 — conditional guardPath in cmdRefinementReport risks misleading error on undefined arg value, and breaks the guardPath contract where guardPath itself handles null). 1 minor (Finding 11 — scan.cjs inline ".." checks duplicate guardPath).
