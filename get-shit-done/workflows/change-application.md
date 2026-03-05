<purpose>
Apply confirmed changes from CHANGESET.md to capability and feature files. Writes EXECUTION-LOG.md at completion.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
No explicit inputs -- reads .planning/refinement/CHANGESET.md via changeset-parse.
</inputs>

<process>

<step name="parse_changeset">
Parse change set:

```bash
CHANGESET=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" changeset-parse --raw)
```

If command fails: abort with "CHANGESET.md not found or invalid. Run refinement-qa first."

Split entries into:
- `actionable`: type is ACCEPT, MODIFY, USER_INITIATED, or ASSUMPTION_OVERRIDE
- `logged_only`: type is REJECT or RESEARCH_NEEDED

Log: "{N} actionable entries, {M} logged-only entries"
</step>

<step name="apply_changes">
Print stage banner:

```
-------------------------------------------------------
 GSD > CHANGE APPLICATION
-------------------------------------------------------

Applying {N} changes from CHANGESET.md ({M} logged-only entries excluded).
```

Initialize results array (all entries start PENDING).

For each actionable entry in changeset order:

Print: "[{i}/{total}] {CS-ID} — {topic}"

Read the action text and apply:

**If action says create capability:**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create {slug} --raw
```

**If action says create feature:**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create {cap} {feat} --raw
```

**Everything else (modify, defer, kill, reinstate, move, metadata):**
1. Read the target file (CAPABILITY.md or FEATURE.md)
2. Apply the change described in the action text using the Edit tool
3. Direct markdown edits — no CLI route needed

After success: mark APPLIED, print "  -> APPLIED"

**On failure — halt and ask user:**

AskUserQuestion:
- header: "CA Fail"
- question: "{CS-ID} failed: {error_message}\n\nApplied: {applied_count} | Pending: {pending_count}"
- options: ["Fix and resume", "Skip and continue", "Abort"]

Empty response guard: retry once, then conversational fallback.

**If "Fix and resume":** Wait for user confirmation, retry the failed entry.
**If "Skip and continue":** Mark SKIPPED, continue to next entry.
**If "Abort":** Remaining entries stay PENDING, skip to write step.
</step>

<step name="write_execution_log">
Write EXECUTION-LOG.md to `.planning/refinement/EXECUTION-LOG.md`:

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
Result: {APPLIED|FAILED|SKIPPED|PENDING}
{if FAILED: "Error: {error message}"}

## Logged Only

### {CS-ID}: {topic}
Type: {REJECT|RESEARCH_NEEDED}
Reasoning: {reasoning from changeset}
```
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
{if all APPLIED: "All changes applied successfully."}

Next: Run refinement-artifact to generate the refinement report.
```
</step>

</process>

<success_criteria>
- CHANGESET.md parsed via changeset-parse CLI route
- Creates use CLI routes with positional args (capability-create {slug}, feature-create {cap} {feat})
- Everything else applied via direct Read + Edit
- Failure halts with AskUserQuestion: fix/skip/abort
- EXECUTION-LOG.md written once at end with all results
</success_criteria>
