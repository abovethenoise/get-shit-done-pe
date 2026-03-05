## Review Synthesis

### Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 4 | 4 | 0 | Line numbers occasionally off by 1-2 but code matches. Reliable. |
| functional | 5 | 5 | 0 | Thorough evidence with precise line ranges. Reliable. |
| technical | 4 | 4 | 0 | Minor off-by-one on route line numbers; substantively correct. |
| quality | 5 | 5 | 0 | All DRY duplication claims verified against source. Robustness finding confirmed. |

### Findings

#### Finding 1: Inconsistent nullish guard on path traversal checks -- potential TypeError

**Severity:** major
**Source:** quality
**Requirement:** quality (Robustness)
**Verdict:** not met (suspected)

**Evidence (from reviewer):**
- `refinement.cjs:462` -- `if (contentFile.includes('..'))` with no prior truthiness check
- `refinement.cjs:275` -- `if (matrixFile && matrixFile.includes('..'))` (has truthiness check)
- Reasoning: In `cmdChangesetWrite`, if `--content-file` is the last argument, `args[contentFileIdx + 1]` is `undefined` and line 462 calls `.includes('..')` on `undefined`, throwing `TypeError`. Lines 275/285/295 guard against this; lines 212/222/462 do not. Line 222 is partially protected by a prior `!contentFile` check at line 221, but line 462 has no such upstream guard before the traversal check.

**Spot-check:** verified -- `refinement.cjs:460-462` confirms `contentFileIdx === -1` is checked (flag absent) but `args[contentFileIdx + 1]` being `undefined` (flag present, no value) is not guarded before `.includes()` on line 462.

---

#### Finding 2: Duplicated snapshotTable key functions between cmdRefinementInit and cmdRefinementDelta

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `refinement.cjs:163-166` -- matrix key lambda in `cmdRefinementInit`
- `refinement.cjs:369-371` -- identical matrix key lambda in `cmdRefinementDelta`
- `refinement.cjs:171` -- dependency graph key lambda in `cmdRefinementInit`
- `refinement.cjs:376` -- identical graph key lambda in `cmdRefinementDelta`
- Reasoning: Two anonymous key functions are copy-pasted verbatim. If keying logic changes, both sites must be updated. Named constants (`matrixKeyFn`, `graphKeyFn`) would eliminate this.

**Spot-check:** verified -- lines 163-166 and 369-371 contain identical lambda bodies for matrix keying; lines 171 and 376 contain identical lambda bodies for graph keying.

---

#### Finding 3: Duplicated findings-clearing logic between cmdRefinementInit and cmdRefinementReport

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `refinement.cjs:174-179` -- clear FINDING-*.md in `cmdRefinementInit`
- `refinement.cjs:299-304` -- clear FINDING-*.md in `cmdRefinementReport`
- The filter predicate `f.startsWith('FINDING-') && f.endsWith('.md')` also appears at lines 93 and 309 for reading.
- Reasoning: A `clearFindings(dir)` helper would DRY up four call sites sharing the same glob pattern.

**Spot-check:** verified -- both code blocks perform identical readdirSync/filter/unlinkSync sequences.

---

#### Finding 4: Path traversal guard repeated 6 times without extraction

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `refinement.cjs:212,222,275,285,295,462` -- six instances of `includes('..')` guard with slight message and truthiness-check variations.
- Reasoning: A `guardPath(value, label)` helper would centralize the check and ensure consistency (also addresses Finding 1's inconsistency).

**Spot-check:** verified -- six separate path traversal checks confirmed across the file.

---

#### Finding 5: EU-01 -- Persistent refinement report

**Severity:** n/a (passing)
**Source:** end-user, functional, technical
**Requirement:** EU-01
**Verdict:** met

**Evidence (from reviewers):**
- `refinement.cjs:246-247` -- RECOMMENDATIONS.md writable via `--type recommendations`
- `refinement.cjs:339-446` -- `cmdRefinementDelta` computes diffs and writes DELTA.md
- `refinement.cjs:357-360` -- First-run check returns early without writing DELTA.md
- All three reviewers agree: met with no gaps.

**Spot-check:** verified

---

#### Finding 6: EU-02 -- Scan artifact directory structure

**Severity:** n/a (passing)
**Source:** end-user, functional, technical
**Requirement:** EU-02
**Verdict:** met

**Evidence (from reviewers):**
- `refinement.cjs:150-156` -- `cmdRefinementInit` creates `.planning/refinement/`, `findings/`, `pairs/`
- `refinement.cjs:228-254` -- All write targets use `.md` extension; checkpoints use `.complete` marker files
- `refinement.cjs:327-334` -- `renderDeltaTable` produces standard pipe-delimited markdown tables
- All three reviewers agree: met with no gaps.

**Spot-check:** verified

---

#### Finding 7: FN-01 -- Pre-scan snapshot

**Severity:** n/a (passing)
**Source:** functional, technical
**Requirement:** FN-01
**Verdict:** met

**Evidence (from reviewers):**
- `refinement.cjs:159-190` -- Reads RECOMMENDATIONS.md (null on first run), snapshots findings/matrix/graph, serializes as `[key, value]` arrays for JSON transport
- `refinement.cjs:174-180` -- Clears stale findings after snapshot (snapshot-then-clear pattern)
- Both reviewers agree: met. Functional notes snapshot captures matrix/graph beyond spec (additive, not a deviation).

**Spot-check:** verified

---

#### Finding 8: FN-02 -- Report generation

**Severity:** n/a (passing)
**Source:** functional, technical
**Requirement:** FN-02
**Verdict:** met

**Evidence (from reviewers):**
- `refinement.cjs:260-322` -- `cmdRefinementReport` writes matrix.md, dependency-graph.md, findings/ with overwrite semantics
- RECOMMENDATIONS.md correctly not written by this command (delegated to coherence-report via `refinement-write`)
- Both reviewers agree: met with no gaps.

**Spot-check:** verified

---

#### Finding 9: FN-03 -- Delta computation

**Severity:** n/a (passing)
**Source:** functional, technical
**Requirement:** FN-03
**Verdict:** met

**Evidence (from reviewers):**
- `refinement.cjs:339-446` -- Semantic diffs via `diffMaps` for findings, matrix, and dependency graph
- `refinement.cjs:357-360` -- First-run detection (both `recommendations === null` AND `findings.size === 0`)
- `refinement.cjs:438` -- Writes DELTA.md to `.planning/refinement/`
- Both reviewers agree: met. Both note the AND condition for first-run detection is intentionally conservative.

**Spot-check:** verified

---

#### Finding 10: TC-01 -- Directory management CLI routes

**Severity:** n/a (passing)
**Source:** functional, technical
**Requirement:** TC-01
**Verdict:** met

**Evidence (from reviewers):**
- `gsd-tools.cjs:435-452` -- All four spec'd routes registered (refinement-init/write/report/delta)
- `gsd-tools.cjs:455-463` -- Two additive changeset routes (changeset-write/changeset-parse) -- not in spec but support downstream change-application feature
- `refinement.cjs:5-7` -- Only imports `fs`, `path`, `./core.cjs` (no external deps)
- Checkpoint reuse: `scan-checkpoint` route exists separately in `scan.cjs`, no duplication
- Both reviewers agree: met.

**Spot-check:** verified

---

#### Finding 11: TC-02 -- Delta diffing logic

**Severity:** n/a (passing)
**Source:** functional, technical
**Requirement:** TC-02
**Verdict:** met

**Evidence (from reviewers):**
- `refinement.cjs:63-83` -- `diffMaps` uses `JSON.stringify` comparison (semantic, not textual line-diff)
- `refinement.cjs:88-125` -- Findings keyed by ID from filename
- `refinement.cjs:367-377` -- Matrix keyed by first two columns, graph keyed by From|To tuple
- `refinement.cjs:327-334` -- All output as markdown tables via `renderDeltaTable`
- Both reviewers agree: met with no spec-vs-reality gaps.

**Spot-check:** verified

---

#### Finding 12: Changeset commands co-located in refinement.cjs

**Severity:** minor
**Source:** quality
**Requirement:** quality (YAGNI)
**Verdict:** met (borderline)

**Evidence (from reviewer):**
- `refinement.cjs:448-608` -- `cmdChangesetWrite` and `cmdChangesetParse` (160 lines) belong to downstream feature
- Reasoning: They share the same `.planning/refinement/` directory and imports. Splitting would create a second file with identical imports. Co-location is defensible.

**Spot-check:** not checked (architectural judgment, not a code correctness claim)

---

#### Finding 13: JSON.stringify for deep equality and Map serialization are justified

**Severity:** n/a (passing)
**Source:** quality
**Requirement:** quality (KISS)
**Verdict:** met

**Evidence (from reviewer):**
- `refinement.cjs:71` -- `JSON.stringify` comparison for flat string-keyed objects is idiomatic for zero-dep CLI tools
- `refinement.cjs:183-188` -- `Array.from(map.entries())` is the standard JS Map serialization pattern
- Reasoning: Both patterns are the simplest correct approach for the constraints.

**Spot-check:** verified

---

### Conflicts

#### Disagreements

None. All four reviewers reached "met" verdicts on all seven requirements (EU-01, EU-02, FN-01, FN-02, FN-03, TC-01, TC-02). No conflicting verdicts.

#### Tensions

- **Snapshot scope (FN-01):** Functional reviewer notes snapshot captures matrix/graph beyond FN-01 spec (which only mentions RECOMMENDATIONS.md and findings/). Technical reviewer treats this as part of the implementation without comment. Both agree it is additive and supports FN-03's broader diffing needs. No resolution needed -- additive behavior is acceptable.

- **First-run detection logic (FN-03):** Both functional and technical reviewers note the AND condition (`recommendations === null && findings.size === 0`) is a stricter interpretation than the spec's "null snapshot" language. Both independently conclude this is intentionally conservative. No tension to resolve -- consistent assessment.

- **Changeset co-location (quality Finding 5) vs TC-01 additive routes (functional/technical):** Quality reviewer flags changeset commands as borderline YAGNI for this feature. Functional and technical reviewers note the changeset routes as "additive, not a deviation." These perspectives coexist -- the routes are acceptable from a requirements standpoint but the code organization is a minor quality concern.

### Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 1     |
| Minor    | 4     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01 | met | n/a | end-user, functional, technical |
| EU-02 | met | n/a | end-user, functional, technical |
| FN-01 | met | n/a | functional, technical |
| FN-02 | met | n/a | functional, technical |
| FN-03 | met | n/a | functional, technical |
| TC-01 | met | n/a | functional, technical |
| TC-02 | met | n/a | functional, technical |
| quality: robustness | not met (suspected) | major | quality |
| quality: DRY (key fns) | not met (proven) | minor | quality |
| quality: DRY (findings clear) | not met (proven) | minor | quality |
| quality: DRY (path guards) | not met (proven) | minor | quality |
| quality: YAGNI (co-location) | met (borderline) | minor | quality |
