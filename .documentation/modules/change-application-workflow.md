---
type: module-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Module: change-application.md

## Purpose: [derived]

Apply confirmed changes from CHANGESET.md to capability and feature files, using CLI routes for creates and the Edit tool for modifications. Writes EXECUTION-LOG.md at completion. Located at `get-shit-done/workflows/change-application.md`.

Fourth stage of the requirements-refinement pipeline. Consumes refinement-qa output, produces execution log and modified planning files.

## Exports: [derived]

This is a workflow prompt. It exposes the following interface:

- **Inputs:** None (reads `.planning/refinement/CHANGESET.md` via changeset-parse)
- **CLI commands invoked:**
  - `gsd-tools changeset-parse --raw` -- parse CHANGESET.md to JSON
  - `gsd-tools capability-create {slug} --raw` -- create new capability directory
  - `gsd-tools feature-create {cap} {feat} --raw` -- create new feature directory
- **Steps:**
  1. Parse changeset (split into actionable vs logged-only entries)
  2. Apply each actionable entry (CLI for creates, Read+Edit for everything else)
  3. Write EXECUTION-LOG.md with all results
- **Entry classification:**
  - Actionable: ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE
  - Logged-only: REJECT, RESEARCH_NEEDED (recorded but not executed)
- **Failure handling:** AskUserQuestion per failure with Fix/Skip/Abort options
- **Outputs:** `.planning/refinement/EXECUTION-LOG.md`, modified `.planning/capabilities/` files

## Depends-on: [derived]

- `gsd-tools.cjs` -- CLI tool for changeset-parse, capability-create, feature-create routes
- `bin/lib/refinement.cjs` -- Implementation of cmdChangesetParse
- `.planning/refinement/CHANGESET.md` -- input from refinement-qa stage
- `references/ui-brand.md` -- required reading for UI styling

## Constraints: [authored]

- changeset-parse refuses partial CHANGESET.md (status must be `complete`).
- Creates use CLI routes with positional args; modifications use direct Read + Edit.
- Failure halts with AskUserQuestion (fix/skip/abort) -- does not silently continue.
- EXECUTION-LOG.md written once at end, not incrementally.
- No checkpoint needed -- file operations are fast, re-run from scratch is cheap.
