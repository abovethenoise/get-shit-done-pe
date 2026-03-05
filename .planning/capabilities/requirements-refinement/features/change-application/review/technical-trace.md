# Technical Trace: change-application

## Phase 1: Internalize Requirements

### TC-01: Execution engine
- Implemented as workflow file (part of refinement orchestration)
- Uses gsd-tools CLI routes where available (capability-create, feature-create)
- Direct file edits use Read/Edit tools (not Bash sed/awk)
- UNVALIDATED flags in DELTA.md serve as backlog items for future CLI route coverage
- Must not corrupt existing file content on partial failure -- each mutation is atomic at file level

### TC-02: DELTA.md format
- Simple execution log consumed by refinement-artifact
- Markdown with frontmatter (date, changeset source, result counts)
- Written to `.planning/refinement/DELTA.md` (implemented as EXECUTION-LOG.md)
- Parseable by gsd-tools if needed (new CLI route: delta-parse)
- Overwritten on each refinement run

### Secondary requirements traced (cross-layer, included per task_context):
- FN-01: changeset-parse CLI route for parsing
- FN-02: 7 mutation types, CLI-first routing with direct edit fallback
- FN-03: Failure handling with AskUserQuestion (fix/skip/abort)
- FN-04: DELTA.md output with per-entry results
- FN-05: Reinstate clears downstream artifacts, preserves FEATURE.md
- EU-01: Apply confirmed changes to project artifacts
- EU-02: Graceful failure handling with user control

---

## Phase 2: Trace Against Code

### TC-01: Execution engine

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/change-application.md:1-2` -- `<purpose>Apply confirmed changes from CHANGESET.md to capability and feature files.</purpose>` -- Implemented as a workflow .md file, confirming "part of refinement orchestration."
- `get-shit-done/workflows/change-application.md:91-93` -- `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create --name {slug} --raw` -- Uses gsd-tools CLI route for capability creation.
- `get-shit-done/workflows/change-application.md:96-98` -- `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create --capability {cap} --name {feat} --raw` -- Uses gsd-tools CLI route for feature creation.
- `get-shit-done/workflows/change-application.md:106-109` -- modify-metadata handler: `Read target file ... Edit field value using Edit tool` -- Direct edits use Read/Edit tools, not sed/awk.
- `get-shit-done/workflows/change-application.md:100-104` -- move-feature handler: `cp -r ... rm -rf` -- Uses Bash for filesystem operations but Read/Edit for frontmatter update (line 102: "Read target FEATURE.md, update capability frontmatter field"). The cp/rm are filesystem operations, not text editing, so this is consistent with the spirit of "direct file edits use Read/Edit tools."
- `get-shit-done/workflows/change-application.md:126` -- `After each mutation: print "  -> APPLIED{if UNVALIDATED: ' (UNVALIDATED)'}" and rewrite EXECUTION-LOG.md` -- UNVALIDATED flags are present for all 5 non-CLI mutation types.
- `get-shit-done/workflows/change-application.md:61-70` -- Pre-validation step with idempotency checks prevents corruption from re-runs. Each mutation is processed independently (atomic at file level).

**Spec-vs-reality gap:** The spec says "UNVALIDATED flags in DELTA.md" but the implementation uses EXECUTION-LOG.md instead. This naming change is documented in the plan context (01-PLAN.md:97-99) as a deliberate collision resolution -- DELTA.md is owned by refinement-artifact for semantic diffs. The UNVALIDATED flag mechanism itself is faithfully implemented.

**Cross-layer observations:** The CLI routes (capability-create, feature-create) exist in gsd-tools.cjs at lines 384-386 and 401-403 respectively. The changeset-parse route exists at line 460-462. All three routes are wired and functional.

---

### TC-02: DELTA.md format

**Verdict:** met (with documented naming deviation)

**Evidence:**
- `get-shit-done/workflows/change-application.md:167-211` -- Full EXECUTION-LOG.md template matches TC-02 format spec:
  - Frontmatter with date, changeset source, result counts (lines 168-175)
  - Summary table with APPLIED/FAILED/SKIPPED/PENDING counts (lines 179-186)
  - Per-entry sections with CS-ID, topic, result, error/reason (lines 188-210)
  - Logged-only section for REJECT/RESEARCH_NEEDED (lines 202-210)
- `get-shit-done/workflows/change-application.md:213` -- `Write to .planning/refinement/EXECUTION-LOG.md using the Write tool` -- Output path uses EXECUTION-LOG.md not DELTA.md.
- `get-shit-done/workflows/change-application.md:165` -- `After EVERY mutation (success or failure), rebuild and write EXECUTION-LOG.md` -- Overwritten pattern (not append-only), matching "overwritten on each refinement run."

**Spec-vs-reality gap:** TC-02 specifies the file as `.planning/refinement/DELTA.md` but implementation uses `.planning/refinement/EXECUTION-LOG.md`. This is a deliberate deviation documented in the plan (01-PLAN.md:97-99): "EXECUTION-LOG.md, NOT DELTA.md. DELTA.md is owned by refinement-artifact for semantic diffs." The format, structure, and behavior are otherwise identical to spec.

TC-02 also specifies "Parseable by gsd-tools if needed (new CLI route: delta-parse)." No `delta-parse` route exists in gsd-tools.cjs (confirmed via grep -- zero matches). This is consistent with the spec's "if needed" qualifier -- the route was not needed for the current implementation. The EXECUTION-LOG.md format is simple enough markdown+frontmatter that existing parsing patterns in gsd-tools could be extended to support it.

**Cross-layer observations:** The FEATURE.md TC-02 example (lines 189-235) shows the format titled "# Refinement Delta" while the workflow template (line 178) uses "# Execution Log". This is consistent with the naming change but means the FEATURE.md example is stale relative to the implementation.

---

### FN-01: Change set parsing via changeset-parse CLI route

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/change-application.md:18-19` -- `CHANGESET=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-parse --raw)` -- Parses via CLI route.
- `get-shit-done/bin/lib/refinement.cjs:542-607` -- `cmdChangesetParse` implementation reads CHANGESET.md, parses frontmatter and entries, returns JSON with `{ meta, entries }` structure.
- `get-shit-done/workflows/change-application.md:24-26` -- Split into actionable (ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE) and logged_only (REJECT, RESEARCH_NEEDED). Matches FN-01 filter spec exactly.
- `get-shit-done/workflows/change-application.md:47-58` -- Safe execution order matches FN-01 spec: 8 categories from create-caps through kill-caps.

---

### FN-02: Mutation execution (7 types, CLI-first routing)

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/change-application.md:31-44` -- 7 mutation types defined with keyword classification rules.
- `get-shit-done/workflows/change-application.md:90-125` -- All 7 handlers implemented:
  1. create-capability (CLI, line 90-93)
  2. create-feature (CLI, line 95-98)
  3. move-feature (direct edit + UNVALIDATED, lines 100-104)
  4. modify-metadata (direct edit + UNVALIDATED, lines 106-109)
  5. reinstate (direct edit + UNVALIDATED, lines 111-116)
  6. defer (direct edit + UNVALIDATED, lines 118-120)
  7. kill (direct edit + UNVALIDATED, lines 122-124)
- `get-shit-done/workflows/change-application.md:42` -- Unknown action text: `mark FAILED with "Unknown mutation type" and continue` -- matches FN-02 failure behavior.

---

### FN-03: Failure handling with AskUserQuestion

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/change-application.md:128-161` -- Complete failure handling flow:
  - Halt on failure (line 128: "On failure -- halt and ask user")
  - State report showing applied/failed/pending (lines 130-138)
  - AskUserQuestion with header "CA Fail", 3 options (lines 140-143)
  - Empty response guard (line 145)
  - Fix and resume retries SAME entry, recursive on re-failure (lines 147-150)
  - Skip marks SKIPPED, updates log, continues (lines 152-155)
  - Abort preserves PENDING, writes final log (lines 157-161)

---

### FN-04: DELTA.md output with per-entry results

**Verdict:** met (with naming deviation to EXECUTION-LOG.md)

**Evidence:**
- `get-shit-done/workflows/change-application.md:164-213` -- Full output format includes:
  - Change ID from CHANGESET.md (line 190: `{CS-ID}`)
  - Result statuses: APPLIED, FAILED, SKIPPED, PENDING (lines 191-200)
  - Error message for FAILED (line 196)
  - UNVALIDATED flag for direct edits (line 192)
  - Summary counts at top in frontmatter (lines 169-174) and table (lines 181-186)
  - Non-actionable entries in "Logged Only" section (lines 202-210)

---

### FN-05: Reinstate clears downstream artifacts, preserves FEATURE.md

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/change-application.md:111-116` -- Reinstate handler:
  - Line 112: `Set frontmatter status to exploring, remove killed/deferred reason fields`
  - Line 114: `rm -rf .planning/capabilities/{cap}/features/{feat}/research/`
  - Line 115: `Delete RESEARCH.md, all *-PLAN.md, all *-SUMMARY.md`
  - Line 116: `Preserve: FEATURE.md (EU/FN/TC sections), BRIEF.md`

---

### EU-01: Apply confirmed changes to project artifacts

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/change-application.md:24-26` -- ACCEPT/MODIFY entries are actionable; REJECT/RESEARCH_NEEDED logged only.
- `get-shit-done/workflows/change-application.md:90-125` -- CLI routes and direct edit handlers apply changes to files.
- `get-shit-done/workflows/change-application.md:47-58` -- Safe execution order enforced.
- `get-shit-done/workflows/change-application.md:213` -- EXECUTION-LOG.md written as output for refinement-artifact.
- `get-shit-done/workflows/change-application.md:74-82` -- Stage banner with progress context.
- `get-shit-done/workflows/change-application.md:88` -- Per-mutation progress: `[{i}/{total}] {mutation_type}: {CS-ID}`

---

### EU-02: Graceful failure handling with user control

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/change-application.md:128` -- "On failure -- halt and ask user" -- immediate halt.
- `get-shit-done/workflows/change-application.md:130-138` -- User sees applied, failed, and pending breakdown.
- `get-shit-done/workflows/change-application.md:140-143` -- 3 options: fix and resume, skip and continue, abort.
- `get-shit-done/workflows/change-application.md:152-154` -- Skipped entries logged with SKIPPED status.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01 | met | change-application.md -- workflow file, 2 CLI routes + 5 direct edit handlers, Read/Edit for text edits, UNVALIDATED flags, pre-validation for atomicity |
| TC-02 | met (naming deviation) | change-application.md:167-213 -- format matches spec; file is EXECUTION-LOG.md not DELTA.md (deliberate collision avoidance); no delta-parse route (spec said "if needed") |
| FN-01 | met | change-application.md:18-19 -- changeset-parse CLI route; lines 24-26 actionable filter; lines 47-58 topological sort |
| FN-02 | met | change-application.md:31-44 -- 7 mutation types; lines 90-125 -- all handlers with CLI/direct-edit routing |
| FN-03 | met | change-application.md:128-161 -- AskUserQuestion with fix/skip/abort, empty response guard, recursive retry |
| FN-04 | met (naming deviation) | change-application.md:164-213 -- per-entry results with CS-ID, status, error, UNVALIDATED flag, logged-only section |
| FN-05 | met | change-application.md:111-116 -- status reset, artifact cleanup (research/, RESEARCH.md, *-PLAN.md, *-SUMMARY.md), FEATURE.md preserved |
| EU-01 | met | change-application.md -- actionable entries applied, safe order, progress logging, stage banners |
| EU-02 | met | change-application.md:128-161 -- halt on failure, applied/failed/pending visibility, 3 user options |

## Spec-vs-Reality Gaps

| Gap | Spec Said | Reality | Reason |
|-----|-----------|---------|--------|
| Output file name | `.planning/refinement/DELTA.md` | `.planning/refinement/EXECUTION-LOG.md` | Naming collision -- DELTA.md owned by refinement-artifact for semantic diffs. Documented in 01-PLAN.md:97-99. |
| delta-parse CLI route | "Parseable by gsd-tools if needed (new CLI route: delta-parse)" | Route does not exist | Spec qualified with "if needed" -- not needed for current implementation. Format is standard markdown+frontmatter, extensible when needed. |
| FEATURE.md TC-02 example title | `# Refinement Delta` | `# Execution Log` | Stale example in FEATURE.md not updated to reflect naming change. Non-functional -- the workflow template is authoritative. |
