---
type: flow-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Flow: requirements-refinement/change-application

## Trigger: [derived]

User invokes the change-application workflow after refinement-qa completes. Reads CHANGESET.md from `.planning/refinement/`.

## Input: [derived]

- Implicit: `.planning/refinement/CHANGESET.md` (required, status must be `complete`)

## Steps: [derived]

```
1. parse_changeset   -> gsd-tools changeset-parse --raw
                     -> split entries: actionable (ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE)
                                       logged_only (REJECT, RESEARCH_NEEDED)
                     -> abort if parse fails or status is partial
2. apply_changes     -> for each actionable entry in changeset order:
                        IF create capability -> gsd-tools capability-create {slug} --raw
                        IF create feature    -> gsd-tools feature-create {cap} {feat} --raw
                        ELSE (modify/defer/kill/reinstate/move/metadata)
                          -> Read target file + Edit tool (direct markdown edits)
                        mark APPLIED on success
                     -> on failure: AskUserQuestion with 3 options:
                        "Fix and resume" -> retry after user confirms
                        "Skip and continue" -> mark SKIPPED
                        "Abort" -> remaining entries stay PENDING
3. write_execution_log -> write .planning/refinement/EXECUTION-LOG.md
                        -> frontmatter: date, changeset path, result counts
                        -> body: summary table + per-entry results + logged-only section
```

### Failure Handler

Each failed change halts execution and presents an AskUserQuestion with applied/pending counts. The user chooses fix (retry), skip (continue), or abort (stop all). Empty response guard: retry once, then conversational fallback. No checkpoint needed -- operations are fast file edits, not long-running processes.

## Output: [derived]

- `.planning/refinement/EXECUTION-LOG.md` -- execution results with frontmatter counts and per-entry status (APPLIED, FAILED, SKIPPED, PENDING)
- Modified `.planning/capabilities/` files (CAPABILITY.md, FEATURE.md) as specified by changeset actions

## Side-effects: [derived]

- Creates new capability/feature directories via CLI routes (capability-create, feature-create)
- Edits existing CAPABILITY.md and FEATURE.md files via Edit tool
- Writes EXECUTION-LOG.md once at completion (not incrementally)

## WHY: [authored]

**CLI for creates, Edit for everything else:** Create operations need directory scaffolding (mkdir, template files) that the CLI already handles. Modifications are direct markdown edits where the Edit tool is more precise than trying to route through CLI.

**No checkpoint needed:** Unlike landscape-scan (minutes per pair) or refinement-qa (user interaction), change-application operations are fast file reads and writes. If interrupted, re-running from scratch is cheap.

**Logged-only entries preserved in execution log:** REJECT and RESEARCH_NEEDED entries are not applied but are recorded in EXECUTION-LOG.md for audit trail -- the user can see what was deliberately excluded and why.
