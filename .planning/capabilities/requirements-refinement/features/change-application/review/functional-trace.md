# Functional Trace: change-application

**Date:** 2026-03-05
**Artifact:** `get-shit-done/workflows/change-application.md`
**Scope:** EU-01, EU-02, FN-01, FN-02, FN-03, FN-04, FN-05, TC-01, TC-02

---

## Phase 1: Internalize Requirements

| Req | Behavior Specification |
|-----|----------------------|
| EU-01 | Apply ACCEPT/MODIFY entries, log REJECT/RESEARCH_NEEDED, CLI route first with UNVALIDATED fallback, safe execution order, output DELTA.md |
| EU-02 | Halt on failure, show applied/failed/pending, user chooses fix/skip/abort, skipped logged as SKIPPED |
| FN-01 | Parse via changeset-parse CLI (returns JSON), filter to actionable (ACCEPT/MODIFY/USER_INITIATED/ASSUMPTION_OVERRIDE), exclude REJECT/RESEARCH_NEEDED, sort into 8-level topological order |
| FN-02 | 7 mutation types, CLI routes for create-capability and create-feature, direct edits for rest (flagged UNVALIDATED), APPLIED on success, halt on failure |
| FN-03 | AskUserQuestion with 3 options, fix-and-resume retries same entry, skip marks SKIPPED, abort leaves remaining PENDING and writes log |
| FN-04 | DELTA.md at .planning/refinement/DELTA.md with Change ID, Result, Error, UNVALIDATED flag, summary counts, logged-only entries |
| FN-05 | Reinstate: status->exploring, clear kill/defer reasoning, clear downstream artifacts (research, plans), keep FEATURE.md EU/FN/TC sections |
| TC-01 | Workflow file using CLI routes where available, UNVALIDATED flags, atomic at file level |
| TC-02 | Markdown with frontmatter, .planning/refinement/DELTA.md, overwritten each run |

---

## Phase 2: Trace Against Code

### EU-01: Apply confirmed changes to project artifacts

**Verdict:** not met (proven)

**Evidence:**
- `change-application.md:25-28` -- actionable filter includes `ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE`; logged_only includes `REJECT, RESEARCH_NEEDED`. Matches spec.
- `change-application.md:48-58` -- 8-level topological sort (creates -> moves -> metadata -> reinstate -> defer -> kills). Matches safe execution order.
- `change-application.md:91-93` -- CLI route for create-capability uses `--name {slug}` flag syntax. The actual CLI (`gsd-tools.cjs:384-386`) dispatches via positional arg: `cmdCapabilityCreate(cwd, args[1], raw)`. Passing `--name {slug}` makes `args[1]` = `"--name"`, which would be slugified as the capability name, never reaching the intended slug. Same issue at line 96-97 for `feature-create --capability {cap} --name {feat}` where `args[1]` receives `"--capability"`.
- `change-application.md:213` -- Output written to `.planning/refinement/EXECUTION-LOG.md`, but EU-01 spec requires output as `DELTA.md`. File name mismatch.
- Reasoning: Two deviations found -- (1) CLI invocation syntax produces wrong arguments at runtime, (2) output artifact name differs from spec.

**Cross-layer observations:** CLI invocation syntax mismatch affects all create-capability and create-feature mutations, which are the two CLI-routed operations. This could cascade to runtime failure for those mutation types.

---

### EU-02: Graceful failure handling with user control

**Verdict:** met

**Evidence:**
- `change-application.md:128-161` -- On failure: halts immediately, displays applied/failed/pending lists, presents AskUserQuestion with three options (Fix and resume, Skip and continue, Abort).
- `change-application.md:147-149` -- Fix and resume: waits for user confirmation, retries same entry, recursive on re-failure.
- `change-application.md:152-154` -- Skip: marks SKIPPED with error reason, updates log, continues.
- `change-application.md:157-161` -- Abort: remaining stay PENDING, writes final log, prints summary.
- Reasoning: All acceptance criteria for EU-02 are implemented in the workflow.

---

### FN-01: Change set parsing

**Verdict:** met

**Evidence:**
- `change-application.md:18-19` -- Parses via `gsd-tools.cjs changeset-parse --raw`. Confirmed in `gsd-tools.cjs:460-462` that `changeset-parse` route exists and calls `cmdChangesetParse`.
- `refinement.cjs:542-607` -- `cmdChangesetParse` reads `.planning/refinement/CHANGESET.md`, parses frontmatter and entries, returns JSON via `output()` with `{ meta, entries }` structure including `type`, `action`, `capabilities` fields.
- `change-application.md:25-28` -- Filters to actionable (ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE) and logged_only (REJECT, RESEARCH_NEEDED). Matches spec.
- `change-application.md:48-58` -- 8-level topological sort. Matches spec.
- Reasoning: All four sub-requirements of FN-01 are addressed.

---

### FN-02: Mutation execution

**Verdict:** not met (proven)

**Evidence:**
- `change-application.md:32-43` -- 7 mutation types defined with keyword-based classification from free-text action field. Matches spec.
- `change-application.md:91-93` -- create-capability CLI route: `capability-create --name {slug} --raw`. Actual CLI (`gsd-tools.cjs:384-386`) uses positional args. `args[1]` would receive literal `"--name"` string, not the slug. `capability.cjs:16` would then call `generateSlugInternal("--name")` producing an incorrect slug.
- `change-application.md:96-97` -- create-feature CLI route: `feature-create --capability {cap} --name {feat} --raw`. Actual CLI (`gsd-tools.cjs:401-403`) passes `args[1]` as capSlug and `args[2]` as name. These would receive `"--capability"` and `"{cap}"` respectively. `args[2]` is the actual cap value but `args[1]` is the literal flag string.
- `change-application.md:100-125` -- Direct edit handlers for move, modify-metadata, reinstate, defer, kill all flagged UNVALIDATED. Matches spec.
- `change-application.md:126` -- On success prints APPLIED. On failure halts. Matches spec.
- Reasoning: The two CLI-routed mutation types have incorrect invocation syntax. The 5 direct-edit types are correctly specified.

**Cross-layer observations:** The `--name`/`--capability` flags are not parsed by gsd-tools.cjs -- it only strips `--raw` and `--cwd`. All other args are positional.

---

### FN-03: Failure handling

**Verdict:** met

**Evidence:**
- `change-application.md:141-143` -- AskUserQuestion with header "CA Fail", question showing CS-ID/error/counts, options: ["Fix and resume", "Skip and continue", "Abort"].
- `change-application.md:145` -- Empty response guard: retry once, then conversational fallback.
- `change-application.md:147-149` -- Fix and resume: wait for user, retry same entry, recursive on re-failure. Matches spec.
- `change-application.md:152-154` -- Skip: mark SKIPPED with error reason, update log, continue. Matches spec.
- `change-application.md:157-161` -- Abort: remaining PENDING, write final log, exit. Matches spec.
- Reasoning: All three FN-03 sub-requirements met.

---

### FN-04: DELTA.md output

**Verdict:** not met (proven)

**Evidence:**
- `change-application.md:213` -- Writes to `.planning/refinement/EXECUTION-LOG.md`. FN-04 spec requires `.planning/refinement/DELTA.md`.
- `change-application.md:167-211` -- Format includes: frontmatter with date/counts, summary table (APPLIED/FAILED/SKIPPED/PENDING), per-entry sections with CS-ID/topic/Result/Error/UNVALIDATED flag, logged-only section. Content structure matches spec requirements.
- `change-application.md:165` -- Written after every mutation (WAL pattern). Matches "written incrementally" intent.
- Reasoning: The content and structure match FN-04 requirements, but the file name is EXECUTION-LOG.md instead of DELTA.md. This is a naming deviation from the spec.

---

### FN-05: Reinstate mutation specifics

**Verdict:** met

**Evidence:**
- `change-application.md:112` -- Sets frontmatter status to `exploring`, removes killed/deferred reason fields. Matches "set status to exploring, clear kill/defer reasoning."
- `change-application.md:113-115` -- Clears downstream artifacts: `rm -rf research/`, deletes RESEARCH.md, all `*-PLAN.md`, all `*-SUMMARY.md`. Matches "clear downstream artifacts (research, plans)."
- `change-application.md:116` -- Preserves FEATURE.md (EU/FN/TC sections) and BRIEF.md. Matches "keep FEATURE.md EU/FN/TC sections." BRIEF.md preservation is additive, not contradictory.
- Reasoning: All three FN-05 sub-requirements met.

---

### TC-01: Execution engine

**Verdict:** not met (proven)

**Evidence:**
- `change-application.md:1-251` -- Implemented as a workflow file (prompt-based). Matches "workflow file" requirement.
- `change-application.md:100,106,109,119,125` -- Direct edits flagged UNVALIDATED. Matches spec.
- `change-application.md:91-98` -- CLI routes used for create-capability and create-feature. Matches "CLI routes where available" intent, though invocation syntax is incorrect (see FN-02).
- `change-application.md:101-104` -- Move uses copy-verify-delete pattern (cp, read/verify, rm). Provides file-level atomicity for moves.
- Reasoning: Workflow structure and UNVALIDATED flags match. CLI route invocation syntax is incorrect, which compromises the "CLI routes where available" contract at runtime. Marking not met due to the CLI syntax issue affecting core execution path.

**Cross-layer observations:** File-level atomicity for direct edits relies on Claude's Edit tool behavior -- no explicit rollback mechanism on partial failure within a single mutation.

---

### TC-02: DELTA.md format

**Verdict:** not met (proven)

**Evidence:**
- `change-application.md:167-175` -- Markdown with frontmatter (date, changeset path, counts). Matches "markdown with frontmatter."
- `change-application.md:213` -- Written to `.planning/refinement/EXECUTION-LOG.md`. TC-02 requires `.planning/refinement/DELTA.md`.
- `change-application.md:165` -- "After EVERY mutation, rebuild and write EXECUTION-LOG.md" -- overwrite behavior matches "overwritten each run."
- Reasoning: Format is correct, path is wrong. Same deviation as FN-04.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | not met | change-application.md:91-93 -- CLI flag syntax mismatch with positional-arg CLI; line 213 -- output named EXECUTION-LOG.md not DELTA.md |
| EU-02 | met | change-application.md:128-161 -- halt/fix/skip/abort all implemented correctly |
| FN-01 | met | change-application.md:18-19 + refinement.cjs:542-607 -- changeset-parse returns JSON, filtering and sorting correct |
| FN-02 | not met | change-application.md:91-97 -- `--name`/`--capability` flags not supported by positional-arg CLI router |
| FN-03 | met | change-application.md:141-161 -- AskUserQuestion with 3 options, all paths implemented |
| FN-04 | not met | change-application.md:213 -- file named EXECUTION-LOG.md, spec requires DELTA.md |
| FN-05 | met | change-application.md:112-116 -- reinstate clears downstream, preserves FEATURE.md, sets exploring |
| TC-01 | not met | change-application.md:91-98 -- CLI invocation syntax incorrect for both routed mutations |
| TC-02 | not met | change-application.md:213 -- path is EXECUTION-LOG.md, spec requires DELTA.md |

### Deviation Summary

Two distinct issues found:

1. **CLI invocation syntax (affects EU-01, FN-02, TC-01):** Workflow uses `--name {slug}` and `--capability {cap} --name {feat}` flag syntax, but `gsd-tools.cjs` CLI router only supports positional args (strips `--raw` and `--cwd`, passes everything else positionally). This would cause create-capability and create-feature mutations to receive wrong values at runtime.

2. **Output file naming (affects EU-01, FN-04, TC-02):** Workflow writes `EXECUTION-LOG.md` but spec requires `DELTA.md`. Content structure is correct; only the filename diverges.
