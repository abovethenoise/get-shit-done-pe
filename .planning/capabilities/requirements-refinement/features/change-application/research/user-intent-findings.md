## User Intent Findings

### Primary Goal

Execute the confirmed change set from refinement Q&A against actual capability and feature files -- using CLI routes where they exist, falling back to direct edits where they don't -- so that coherence findings become real project mutations without manual file editing, with halt-on-failure giving the user control over partial application. -- [source: FEATURE.md EU-01, EU-02; CAPABILITY.md architecture spine showing change-application as the mutation executor between refinement-qa and refinement-artifact]

### Acceptance Criteria

- CHANGESET.md is parsed via `gsd-tools changeset-parse` and only actionable entries (ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE) are selected for execution -- pass: REJECT and RESEARCH_NEEDED entries appear in DELTA.md "Logged Only" section but no file mutations attempted for them; fail: non-actionable entries cause file mutations or are silently dropped -- [source: FEATURE.md FN-01, EU-01 AC lines 1-2]
- Actionable entries are sorted into safe execution order: create caps -> create features -> move features -> modify metadata -> reinstate -> defer -> kill features -> kill caps -- pass: execution sequence follows this ordering regardless of CHANGESET.md entry order; fail: entries executed in original order or arbitrary order -- [source: FEATURE.md FN-01 sort order; Decisions "Safe execution order"]
- Each mutation checks for a gsd-tools CLI route first; if one exists, uses it (validated path); if not, uses Read/Edit tools for direct markdown edit and flags the entry as UNVALIDATED in DELTA.md -- pass: CLI-routed mutations have no UNVALIDATED flag, direct-edit mutations do; fail: all mutations use direct edit, or UNVALIDATED flag missing on fallback edits -- [source: FEATURE.md FN-02 route selection; EU-01 AC line 3; Decisions "CLI routes first"]
- All 7 mutation types are supported: create capability, create feature, move feature, modify metadata, reinstate feature, defer feature, kill feature/capability -- pass: each type has a defined handler that produces correct file-level changes; fail: any type causes an unhandled error or is silently skipped -- [source: FEATURE.md FN-02; Decisions "7 mutation types"]
- On any mutation failure, execution halts immediately -- pass: no subsequent entries are attempted after a failure; fail: execution continues past a failed entry without user input -- [source: FEATURE.md FN-03; EU-02 AC line 1; Decisions "Halt on failure"]
- On failure, user sees three categories: applied entries (safe to keep), the failed entry (with error reason), and pending entries (not yet attempted) -- pass: all three categories displayed; fail: any category missing or entries miscategorized -- [source: FEATURE.md FN-03; EU-02 AC line 2]
- User gets three options on failure: fix and resume (from the failed entry), skip and continue (mark SKIPPED), or abort (mark remaining PENDING) -- pass: all three options offered and honored; fail: fewer options or different behavior than described -- [source: FEATURE.md FN-03; EU-02 AC lines 3-4]
- DELTA.md is written to `.planning/refinement/DELTA.md` with: frontmatter (date, changeset source, result counts), summary table, per-entry results (change ID, result status, error if failed, UNVALIDATED flag if applicable), and a "Logged Only" section for REJECT/RESEARCH_NEEDED entries -- pass: file matches TC-02 example format; fail: missing sections or unparseable format -- [source: FEATURE.md FN-04, TC-02 with example]
- DELTA.md is simple: change ID + result + error. No before/after snapshots of file content -- pass: entries contain only ID, result, error, and UNVALIDATED flag; fail: entries include file diffs or content snapshots -- [source: FEATURE.md FN-04; Decisions "DELTA.md is simple"]
- Reinstate mutation sets status to `exploring`, clears kill/defer reasoning, clears downstream artifacts (research, plans), but keeps EU/FN/TC requirement sections intact -- pass: status is exploring, reasoning gone, research/plan artifacts deleted, requirement sections preserved; fail: any of these conditions violated -- [source: FEATURE.md FN-05]
- DELTA.md is overwritten on each refinement run (not append-only) -- pass: previous DELTA.md is replaced; fail: new results appended to old -- [source: FEATURE.md TC-02 "Overwritten on each refinement run"]
- Each mutation is atomic at the file level -- partial failure of a single mutation must not corrupt the target file -- pass: if a mutation fails mid-edit, the file remains in its pre-mutation state; fail: file left in inconsistent state -- [source: FEATURE.md TC-01 "Must not corrupt existing file content on partial failure"]

### Implicit Requirements

- The `changeset-parse` CLI route must exist before change-application can function, since FN-01 explicitly calls `gsd-tools changeset-parse` -- this is listed as a new route in refinement-qa TC-02 but may not be built yet when change-application is implemented -- [source: FEATURE.md FN-01; refinement-qa FEATURE.md TC-02]
- Direct file edits must use Read/Edit tools, never Bash sed/awk -- this is stated in TC-01 but easy to overlook during implementation -- [source: FEATURE.md TC-01 "Direct file edits use Read/Edit tools (not Bash sed/awk)"]
- Currently existing CLI routes that map to mutation types: `capability-create` and `feature-create` exist in gsd-tools.cjs. Routes for move, kill, defer, reinstate, and metadata modification do NOT exist -- meaning most mutation types will initially be UNVALIDATED direct edits -- [source: gsd-tools.cjs lines 371-398 showing only capability-create, capability-list, capability-status, feature-create, feature-list, feature-status]
- The workflow must use AskUserQuestion for the failure-handling interaction (fix/skip/abort), consistent with GSD conventions for all user interaction -- [First principles: EU-02 describes user interaction on failure; GSD convention per PROJECT.md and all workflow patterns is that user interaction goes through AskUserQuestion]
- DELTA.md must be parseable by `gsd-tools delta-parse` (a new CLI route) -- TC-02 mentions this parenthetically but it implies a contract that the format must be machine-readable, not just human-readable -- [source: FEATURE.md TC-02 "Parseable by gsd-tools if needed (new CLI route: delta-parse)"]
- The `refinement-write` CLI route (from refinement-artifact TC-01) may be the intended mechanism for writing DELTA.md, since refinement-artifact owns directory management -- if not available, change-application writes directly -- [source: refinement-artifact FEATURE.md TC-01 "refinement-write -- writes a specific artifact file (RECOMMENDATIONS.md, DELTA.md, matrix.md, dependency-graph.md)"]
- CHANGESET.md entries have a "change ID" (referenced in FN-04 as "Change ID from CHANGESET.md") but the CHANGESET.md format in refinement-qa FN-04 does not explicitly define an ID field -- the TC-02 example uses "CS-01, CS-02" style IDs, implying CHANGESET.md entries must have sequential IDs -- [source: FEATURE.md FN-04 "Change ID (from CHANGESET.md)"; TC-02 example showing CS-01, CS-02 etc.; refinement-qa FEATURE.md FN-04 listing entry fields without an explicit ID field]
- This feature is implemented as a workflow file (part of the refinement orchestration), not as a standalone CLI tool -- [source: FEATURE.md TC-01 "Implemented as a workflow file"]
- The "fix and resume" option implies the user fixes the issue externally (outside the workflow) and then execution resumes from the failed entry -- the workflow must wait for user confirmation after they fix, not re-run automatically -- [source: FEATURE.md FN-03 "user fixes the issue externally, execution resumes from the failed entry"]

### Scope Boundaries

**In scope:**
- Workflow file for mutation execution with CLI-first routing -- [source: FEATURE.md TC-01]
- CHANGESET.md parsing and filtering to actionable entries -- [source: FEATURE.md FN-01]
- All 7 mutation type handlers -- [source: FEATURE.md FN-02]
- Failure handling with user choice (fix/skip/abort) -- [source: FEATURE.md FN-03]
- DELTA.md output generation -- [source: FEATURE.md FN-04]
- Reinstate-specific logic (status reset, artifact cleanup) -- [source: FEATURE.md FN-05]

**Out of scope:**
- Generating the change set (refinement-qa's job) -- [source: FEATURE.md EU-01 Out of Scope]
- Writing the refinement report (refinement-artifact's job) -- [source: FEATURE.md EU-01 Out of Scope]
- Re-running the coherence scan after changes -- [source: FEATURE.md EU-01 Out of Scope]
- Automatic retry or self-healing of failed mutations -- [source: FEATURE.md EU-02 Out of Scope]
- Building `changeset-parse` CLI route (refinement-qa's responsibility) -- [source: refinement-qa FEATURE.md TC-02]
- Building `refinement-write` CLI route (refinement-artifact's responsibility) -- [source: refinement-artifact FEATURE.md TC-01]

**Ambiguous:**
- Whether `delta-parse` CLI route should be built by this feature or deferred -- TC-02 says "Parseable by gsd-tools if needed (new CLI route: delta-parse)" with the "if needed" suggesting it may be optional -- [source: FEATURE.md TC-02]
- How "modify metadata" mutations specify what to change -- FN-02 says "update status, description, dependencies, or other fields" but CHANGESET.md entry format (from refinement-qa FN-04) only has a generic "action" field -- the action text must encode the specific field and new value, but the parsing contract is undefined -- [source: FEATURE.md FN-02 item 4; refinement-qa FEATURE.md FN-04]
- Whether the workflow writes DELTA.md directly or uses `refinement-write` CLI route from refinement-artifact -- both features are P2 and could be built in either order -- [source: FEATURE.md TC-02 vs refinement-artifact FEATURE.md TC-01]
- How "move feature" works mechanically -- relocating a feature directory from one capability to another requires directory rename/move, updating the source capability's feature table, and updating the target capability's feature table -- none of this has a CLI route and the atomicity guarantee (TC-01) is hard to satisfy across multiple file operations -- [source: FEATURE.md FN-02 item 3; TC-01 atomicity constraint]
- Whether "kill capability" requires all features within it to also be killed, or whether it can only be killed if it has no active features -- the safe execution order puts kill caps last, suggesting features are handled first, but this precondition is not explicit -- [First principles: killing a capability with active features would orphan them; the ordering hint (kill features before kill caps) implies sequential handling but does not state the precondition]

### Risk: Misalignment

- Most mutation types will be UNVALIDATED on first implementation because only `capability-create` and `feature-create` CLI routes exist today. The remaining 5 mutation types (move, modify metadata, reinstate, defer, kill) will all be direct edits. The UNVALIDATED flag mechanism is designed for this scenario, but if the user expects CLI route coverage to expand before change-application ships, there may be a sequencing expectation mismatch. -- [source: gsd-tools.cjs available routes; FEATURE.md FN-02 route selection; CAPABILITY.md dependencies "Consumes cli-tooling"]
- The "fix and resume" failure option assumes the user can fix the issue outside the workflow and come back. In a Claude Code session, "fixing externally" may mean the user edits a file in another terminal or asks Claude to fix it in a side conversation. The workflow needs to clearly communicate what to fix and then re-check before retrying -- but no re-validation step is specified. -- [source: FEATURE.md FN-03 option 1; First principles: resuming from a failed mutation without verifying the fix could cause the same failure again]
- The DELTA.md in this feature (execution log of applied changes) has the same filename as the DELTA.md in refinement-artifact (diff between refinement runs). These are different artifacts with different purposes: change-application's DELTA.md tracks mutation results; refinement-artifact's DELTA.md tracks finding changes across runs. Both write to `.planning/refinement/DELTA.md`. This is a naming collision that could cause one feature to overwrite the other's output. -- [source: FEATURE.md FN-04 "Written DELTA.md artifact at .planning/refinement/DELTA.md"; refinement-artifact FEATURE.md FN-03 "DELTA.md written to .planning/refinement/"]
