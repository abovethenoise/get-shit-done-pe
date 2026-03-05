# Review Synthesis: landscape-scan

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All line references accurate. Reasoning sound. |
| functional | 5 | 5 | 0 | FN-01 spec deviation correctly identified via FEATURE.md:69. |
| technical | 5 | 5 | 0 | Dead import (scan.cjs:8) verified. Path/format deviations confirmed. |
| quality | 4 | 4 | 0 | Dead code grep confirmed. DRY duplication with capability.cjs:57-60 confirmed. |

All reviewers had reliable citations. No weighting adjustments needed.

---

## Findings

### Finding 1: TC-03 -- Medium/large tier scaling not implemented

**Severity:** major
**Source:** end-user, functional, technical, quality
**Requirement:** TC-03
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- `scan.cjs:116-119` -- Only two tiers detected (small, medium). No `count > 50` check for large tier. Medium/large both fall back to full pairwise with stderr warning.
- `scan.cjs:122-127` -- All pairs generated regardless of tier.
- FEATURE.md:191-193 specifies three distinct behaviors: small (full pairwise), medium (mgrep pre-filter), large (cluster-first).

**Spot-check:** verified -- scan.cjs:117-119 confirmed. Warning message is transparent, fallback is safe (over-analyzes, never under-analyzes).

**Assessment:** The implementation is honest (stderr warning) and degrades gracefully, but delivers only small-tier behavior. For 50 capabilities this produces 1225 pairs, which is expensive. All four reviewers flagged this. Severity is major rather than blocker because the feature functions correctly for the common case (small projects), and the fallback is safe.

---

### Finding 2: TC-02 -- Agent template at templates/ instead of spec's agents/

**Severity:** major
**Source:** functional, technical, quality
**Requirement:** TC-02
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- FEATURE.md:175 -- "Agent file: `agents/gsd-scan-pair.md`"
- Actual location: `get-shit-done/templates/gsd-scan-pair.md`
- No `agents/` directory exists (glob confirmed).
- `landscape-scan.md:78` references `templates/gsd-scan-pair.md` -- internally consistent, but spec is stale.

**Spot-check:** verified -- FEATURE.md:175 and glob both confirmed.

**Assessment:** The system works because the workflow references the correct actual path. The spec is stale. This is a traceability gap -- someone reading TC-02 cannot find the file where the spec says it should be. The `templates/` location follows established project conventions (technical reviewer notes this). Resolution: update FEATURE.md TC-02 to reflect actual location.

---

### Finding 3: TC-02 -- Sonnet model constraint not enforced

**Severity:** minor
**Source:** functional, technical
**Requirement:** TC-02
**Verdict:** not met (suspected)

**Evidence (from reviewers):**
- FEATURE.md:179 -- "Agent model: sonnet"
- `gsd-scan-pair.md` contains no model specification.
- `landscape-scan.md:81` specifies `subagent_type="gsd-executor"` but not a model.

**Spot-check:** verified -- neither artifact specifies sonnet.

**Assessment:** Model selection is an orchestrator runtime concern. The spec states sonnet, but the implementation defers to whatever model the executor uses. This is a spec/code divergence but unlikely to cause functional issues -- the orchestrator chooses the model at runtime. Minor because it's a preference not a constraint.

---

### Finding 4: FN-01 -- scan-discover does not use capability-list as spec requires

**Severity:** minor
**Source:** functional, quality
**Requirement:** FN-01
**Verdict:** not met (suspected)

**Evidence (from reviewers):**
- FEATURE.md:69 -- "Read all capabilities via `gsd-tools.cjs capability-list`"
- `scan.cjs:20-31` -- `cmdScanDiscover` directly reads the filesystem.
- `capability.cjs:66` -- `cmdCapabilityList` skips directories without CAPABILITY.md (`if (!content) continue`), which would prevent GAP detection.

**Spot-check:** verified -- capability.cjs:66 confirmed. Direct reuse is impossible without changing capability-list behavior.

**Assessment:** The deviation is functionally justified -- capability-list silently skips empty dirs, but scan-discover needs them for GAP findings. The spec text is stale. This is a documentation/traceability issue, not a code defect. Quality reviewer correctly identifies this as an idiomatic/documentation gap rather than a functional problem.

---

### Finding 5: Dead exported schema constants (YAGNI)

**Severity:** minor
**Source:** quality
**Requirement:** quality (YAGNI)
**Verdict:** not met (proven)

**Evidence (from quality reviewer):**
- `scan.cjs:12-16` -- Four schema constants defined: `FINDING_TYPES`, `SEVERITY_LEVELS`, `CONFIDENCE_LEVELS`, `FINDING_FIELDS`.
- `scan.cjs:184-187` -- All four exported via `module.exports`.
- Grep across `get-shit-done/` confirms zero imports of these constants anywhere.
- Constants are not consumed internally within scan.cjs either.

**Spot-check:** verified -- grep confirmed zero consumers outside scan.cjs.

**Assessment:** These are speculative exports with no current consumer. The constants serve a documentation purpose (they define the schema) but as code they violate YAGNI. Low impact -- they don't break anything, they just add surface area.

---

### Finding 6: Dead import -- extractFrontmatter in scan.cjs

**Severity:** minor
**Source:** technical
**Requirement:** quality (bloat)
**Verdict:** not met (proven)

**Evidence (from technical reviewer):**
- `scan.cjs:8` -- `const { extractFrontmatter } = require('./frontmatter.cjs');`
- Grep confirms `extractFrontmatter` appears only on line 8 within scan.cjs -- never called.

**Spot-check:** verified -- grep confirmed single occurrence at line 8.

---

### Finding 7: Capability directory listing duplicated (DRY)

**Severity:** minor
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** not met (suspected)

**Evidence (from quality reviewer):**
- `scan.cjs:28-31` -- `cmdScanDiscover` reads `.planning/capabilities/` with `readdirSync` + filter + sort.
- `scan.cjs:110-113` -- `cmdScanPairs` repeats the identical pattern.
- `capability.cjs:57-60` -- `cmdCapabilityList` also uses the same pattern.

**Spot-check:** verified -- all three locations confirmed.

**Assessment:** Quality reviewer correctly notes this is a codebase-wide pattern (10+ occurrences), not a scan-specific regression. Within scan.cjs, `cmdScanPairs` could call `cmdScanDiscover` or share a helper. The duplication is real but consistent with existing conventions.

---

### Finding 8: No input validation on --pair argument (path traversal)

**Severity:** minor
**Source:** quality
**Requirement:** quality (robustness)
**Verdict:** not met (suspected)

**Evidence (from quality reviewer):**
- `scan.cjs:138` -- `const pair = pairIdx !== -1 ? args[pairIdx + 1] : null;`
- `scan.cjs:152` -- Pair value used directly in file path: `path.join(pairsDir, '${pair}.complete')`
- No validation for `../` or other path traversal characters.
- Other commands (e.g., `generateSlugInternal` in core.cjs) reject path separators.

**Spot-check:** not checked (reasoning-based finding, not a line-citation issue).

**Assessment:** Low risk since this is orchestrator-called (not user-facing), but inconsistent with defensive patterns elsewhere in the codebase.

---

### Finding 9: FN-05 Layer 3 format deviation -- table vs ASCII arrows

**Severity:** minor
**Source:** functional, technical
**Requirement:** FN-05
**Verdict:** met (with deviation)

**Evidence (from reviewers):**
- FEATURE.md:127 -- Spec shows `A --requires--> B` ASCII arrow format.
- `landscape-scan.md:158-165` -- Implementation uses markdown table: `| From | To | Type | Evidence |`.

**Spot-check:** verified -- both locations confirmed.

**Assessment:** The table format conveys equivalent information and is arguably more structured/parseable. The information content matches; only the presentation format differs. Both reviewers noted this as a deviation, not a defect.

---

### Finding 10: Consolidation reasoning inline in orchestrator (asymmetric delegation)

**Severity:** minor
**Source:** quality
**Requirement:** quality (architecture)
**Verdict:** not met (suspected)

**Evidence (from quality reviewer):**
- `landscape-scan.md:106-119` -- Consolidation is a reasoning task embedded in the orchestrator workflow.
- Per-pair analysis is delegated to a dedicated agent (`gsd-scan-pair.md`), but consolidation (cross-pair pattern recognition) is left inline.

**Spot-check:** verified -- landscape-scan.md:106-119 confirmed.

**Assessment:** For current scale (small projects, few findings), this is acceptable. The asymmetry is worth noting for future scaling. Quality reviewer correctly flags this as suspected, not proven.

---

### Finding 11: Completeness logic edge case -- features-only cap classified as 'none'

**Severity:** minor
**Source:** end-user, functional
**Requirement:** EU-01 / FN-01
**Verdict:** met (with observation)

**Evidence (from reviewers):**
- `scan.cjs:63-71` -- Completeness logic: `full` requires CAPABILITY.md + features, `partial` requires CAPABILITY.md only, `none` is absence of CAPABILITY.md.
- A directory with features but no CAPABILITY.md is classified `none` (same as a truly empty directory).

**Spot-check:** verified -- scan.cjs:63-71 confirmed.

**Assessment:** End-user reviewer notes this is defensible since "CAPABILITY.md itself is a spec doc." Functional reviewer flags it as a conflation. Both agree the behavior is acceptable -- a directory without CAPABILITY.md reasonably triggers a GAP finding regardless of feature presence. The GAP finding message (`scan.cjs:92`) correctly says "no CAPABILITY.md" rather than "no spec docs."

---

### Finding 12: Checkpoint path format differs from spec

**Severity:** minor
**Source:** technical
**Requirement:** EU-02 / FN-02
**Verdict:** met (with deviation)

**Evidence (from technical reviewer):**
- FEATURE.md:51 -- Spec says `scan-output/pairs/{A}-{B}.complete` (single hyphen separator, `scan-output/` base).
- Implementation uses `.planning/refinement/pairs/{A}__{B}.complete` (double underscore separator, `.planning/refinement/` base).

**Spot-check:** verified -- FEATURE.md:51 and scan.cjs:146,152 confirmed.

**Assessment:** The double-underscore separator is a better design choice (avoids ambiguity with capability slugs containing hyphens). The `.planning/refinement/` path is consistent throughout the implementation. The spec is stale but the implementation is correct.

---

## Conflicts

### Disagreements

- **FN-01 verdict:** Functional reviewer says "not met (proven)" vs technical reviewer and end-user reviewer say "met."
  - Functional cites two deviations: (1) not using `capability-list` per spec, (2) completeness logic conflates features-only with empty.
  - Technical and end-user acknowledge the same facts but judge the behavior as functionally correct.
  - Resolution: The behavior is functionally correct -- the deviations are justified by GAP detection requirements. The spec text is stale, not the code. Verdict: **met with spec staleness noted**. FN-01 deviation is captured as Finding 4 (minor).
  - Tiebreaker applied: yes -- end-user priority wins over functional.

### Tensions

- **TC-02 spec path vs project conventions:** Functional and quality reviewers flag `templates/` vs `agents/` as a not-met. Technical reviewer acknowledges it but notes `templates/` follows established project conventions. All agree the system works correctly.
  - Assessment: The spec should be updated to match the established convention. No code change needed.

- **Dead exports (Finding 5) vs schema documentation value:** Quality reviewer flags the exported constants as YAGNI violations. End-user and functional reviewers reference these constants as evidence that FN-03 is met (the schema is defined). Both perspectives are valid -- the constants serve a documentation/specification purpose even if no code consumes them today. The tension is minor.

- **Consolidation delegation (Finding 10):** Quality reviewer flags the asymmetry. No other reviewer mentions it. This is a forward-looking architectural observation, not a current defect. It coexists with the current "met" verdicts for FN-04 since the consolidation logic is specified, just not delegated to a separate agent.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 2     |
| Minor    | 10    |

| Req ID | Verdict | Severity | Source Reviewer(s) |
|--------|---------|----------|--------------------|
| EU-01 | met | -- | end-user, functional, technical |
| EU-02 | met | -- | end-user, functional, technical |
| FN-01 | met (spec stale) | minor | functional, quality |
| FN-02 | met | -- | end-user, functional, technical |
| FN-03 | met | -- | end-user, functional, technical |
| FN-04 | met | -- | end-user, functional, technical |
| FN-05 | met (format deviation) | minor | functional, technical |
| TC-01 | met | -- | end-user, functional, technical |
| TC-02 | not met (path + model) | major | functional, technical, quality |
| TC-03 | not met (partial) | major | end-user, functional, technical, quality |
