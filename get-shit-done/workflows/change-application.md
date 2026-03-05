<purpose>
Apply confirmed changes from CHANGESET.md to capability and feature files. Executes mutations in safe topological order, writes EXECUTION-LOG.md incrementally, and halts on failure for user decision.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
No explicit inputs -- reads .planning/refinement/CHANGESET.md via changeset-parse.
</inputs>

<process>

<step name="parse_changeset">
Parse and classify change set:

```bash
CHANGESET=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-parse --raw)
```

If command fails: abort with "CHANGESET.md not found or invalid. Run refinement-qa first."

Split entries into:
- `actionable`: type is ACCEPT, MODIFY, USER_INITIATED, or ASSUMPTION_OVERRIDE
- `logged_only`: type is REJECT or RESEARCH_NEEDED

Log: "{N} actionable entries, {M} logged-only entries"
</step>

<step name="classify_mutations">
For each actionable entry, classify the `action` free-text field into one of 7 mutation types:

1. **create-capability** -- "create capability", "add capability", "new capability"
2. **create-feature** -- "create feature", "add feature", "new feature"
3. **move-feature** -- "move feature", "relocate", "transfer from ... to"
4. **modify-metadata** -- "update", "change", "rename", "set", "adjust"
5. **reinstate** -- "reinstate", "restore", "reactivate", "un-defer", "un-kill"
6. **defer** -- "defer", "postpone", "delay"
7. **kill** -- "kill", "remove", "drop", "eliminate", "delete"

If action doesn't map: mark FAILED with "Unknown mutation type" and continue.

Extract targets from action text (capability slug, feature slug, source/target for moves, field/value for metadata changes).
</step>

<step name="sort_execution_order">
Sort into safe topological order:
1. Create capabilities
2. Create feature stubs
3. Move features between capabilities
4. Modify metadata
5. Reinstate features
6. Defer features
7. Kill features
8. Kill capabilities

Within each category, maintain original CHANGESET.md ordering.
</step>

<step name="pre_validation">
Before executing, validate each entry:

- **create-capability**: if `.planning/capabilities/{slug}/` exists -> APPLIED (idempotent skip)
- **create-feature**: if feature dir exists -> APPLIED (idempotent skip)
- **move-feature**: source must exist AND target cap must exist (or in create set). Missing source -> FAILED
- **modify-metadata, defer, kill**: target file must exist. Missing -> FAILED
- **reinstate**: target feature must exist. Missing -> FAILED

Log: "{N} passed, {M} pre-failed, {K} idempotent skips"
</step>

<step name="execute_mutations">
Print stage banner:

```
-------------------------------------------------------
 GSD > CHANGE APPLICATION
-------------------------------------------------------

Applying {N} changes from CHANGESET.md ({M} logged-only entries excluded).
```

Initialize EXECUTION-LOG.md with all entries PENDING.

For each PENDING entry in safe execution order:

Print: "[{i}/{total}] {mutation_type}: {CS-ID} — {topic}"

**create-capability (CLI route):**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create --name {slug} --raw
```

**create-feature (CLI route):**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create --capability {cap} --name {feat} --raw
```

**move-feature (direct edit, UNVALIDATED):**
1. `cp -r .planning/capabilities/{source_cap}/features/{feat}/ .planning/capabilities/{target_cap}/features/{feat}/`
2. Read target FEATURE.md, update `capability` frontmatter field
3. Verify target exists and is readable
4. `rm -rf .planning/capabilities/{source_cap}/features/{feat}/`

**modify-metadata (direct edit, UNVALIDATED):**
1. Read target file (CAPABILITY.md or FEATURE.md)
2. Identify field from action text
3. Edit field value using Edit tool

**reinstate (direct edit, UNVALIDATED):**
1. Set frontmatter `status` to `exploring`, remove killed/deferred reason fields
2. Clear downstream artifacts:
   - `rm -rf .planning/capabilities/{cap}/features/{feat}/research/`
   - Delete RESEARCH.md, all *-PLAN.md, all *-SUMMARY.md
3. Preserve: FEATURE.md (EU/FN/TC sections), BRIEF.md

**defer (direct edit, UNVALIDATED):**
1. Set frontmatter `status` to `deferred`
2. Add reasoning from changeset entry

**kill (direct edit, UNVALIDATED):**
1. Set frontmatter `status` to `killed`
2. Add reasoning from changeset entry

After each mutation: print "  -> APPLIED{if UNVALIDATED: ' (UNVALIDATED)'}" and rewrite EXECUTION-LOG.md.

**On failure — halt and ask user:**

```
MUTATION FAILED

Failed: {CS-ID} — {topic}
Error: {error message}

Applied so far: {list}
Pending: {list}
```

AskUserQuestion:
- header: "CA Fail"
- question: "{CS-ID} failed: {error_message}\n\nApplied: {applied_count} | Pending: {pending_count}"
- options: ["Fix and resume", "Skip and continue", "Abort"]

Empty response guard: retry once, then conversational fallback.

**If "Fix and resume":**
- Wait for user confirmation ("done" / "fixed")
- Retry the SAME failed entry
- If fails again: return to failure handler (recursive)

**If "Skip and continue":**
- Mark SKIPPED with error reason
- Update EXECUTION-LOG.md
- Continue to next PENDING entry

**If "Abort":**
- Remaining entries stay PENDING
- Write final EXECUTION-LOG.md
- Print: "Aborted. {applied_count} applied, {pending_count} remain pending."
- Skip to completion
</step>

<step name="write_execution_log">
After EVERY mutation (success or failure), rebuild and write EXECUTION-LOG.md:

```markdown
---
date: {YYYY-MM-DD}
changeset: .planning/refinement/CHANGESET.md
applied: {count}
failed: {count}
skipped: {count}
pending: {count}
---

# Execution Log

## Summary

| Result | Count |
|--------|-------|
| APPLIED | {N} |
| FAILED | {M} |
| SKIPPED | {K} |
| PENDING | {P} |

## Entries

### {CS-ID}: {topic}
Result: APPLIED
{if UNVALIDATED: "Flag: UNVALIDATED (direct edit, no CLI route)"}

### {CS-ID}: {topic}
Result: FAILED
Error: {error message}

### {CS-ID}: {topic}
Result: SKIPPED
Reason: {skip reason}

## Logged Only

### {CS-ID}: {topic}
Type: REJECT
Reasoning: {user's rejection reasoning}

### {CS-ID}: {topic}
Type: RESEARCH_NEEDED
Reasoning: {research question}
```

Write to `.planning/refinement/EXECUTION-LOG.md` using the Write tool.
</step>

<step name="completion">
```
-------------------------------------------------------
 GSD > CHANGE APPLICATION COMPLETE
-------------------------------------------------------

| Result | Count |
|--------|-------|
| APPLIED | {N} |
| FAILED | {M} |
| SKIPPED | {K} |
| PENDING | {P} |

Execution log: .planning/refinement/EXECUTION-LOG.md

{if any FAILED/SKIPPED: list each with CS-ID and reason}
{if any UNVALIDATED: "Note: {U} entries applied via direct edit (UNVALIDATED)."}
{if all APPLIED: "All changes applied successfully."}

Next: Run refinement-artifact to generate the refinement report.
```
</step>

</process>

<success_criteria>
- CHANGESET.md parsed via changeset-parse CLI route
- Mutations classified from free-text action field
- Safe execution order: creates -> moves -> metadata -> reinstate -> defer -> kills
- 2 CLI routes + 5 direct edit handlers
- Idempotency pre-check prevents duplicate failures
- EXECUTION-LOG.md written incrementally (WAL pattern)
- Failure halts with 3 AskUserQuestion options (fix/skip/abort)
- Reinstate clears downstream artifacts but preserves FEATURE.md
- Move uses copy-verify-delete pattern
</success_criteria>
