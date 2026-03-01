# Phase 11: Automated Testing - Research

**Question:** What do I need to know to PLAN this phase well?

## 1. What Exists Today

### Slash Commands (9 files in `commands/gsd/`)

| # | File | Workflow Invoked | CLI Init Route |
|---|------|-----------------|----------------|
| 1 | `init.md` | `init-project.md` | `init project` |
| 2 | `debug.md` | `framing-discovery.md` (lens=debug) | `init framing-discovery debug` |
| 3 | `new.md` | `framing-discovery.md` (lens=new) | `init framing-discovery new` |
| 4 | `enhance.md` | `framing-discovery.md` (lens=enhance) | `init framing-discovery enhance` |
| 5 | `refactor.md` | `framing-discovery.md` (lens=refactor) | `init framing-discovery refactor` |
| 6 | `discuss-capability.md` | `discuss-capability.md` | `init discuss-capability` |
| 7 | `discuss-feature.md` | `discuss-feature.md` | `init discuss-feature` |
| 8 | `progress.md` | `progress.md` | `init progress` |
| 9 | `resume-work.md` | `resume-work.md` | `init resume` |

**Gap vs CMD-01:** Requirements list 11 commands (init, debug, new, enhance, refactor, discuss-capability, discuss-feature, status, resume, plan, review). Only 9 command files exist. Missing: `status.md`, `plan.md`, `review.md`. However, `progress.md` may map to `status`, and `plan`/`review` may be workflow-internal (invoked by framing-pipeline, not directly by user). This needs verification during testing -- it may be a finding, or the 11-count in CMD-01 may be stale.

### CLI Tool Routes (`gsd-tools.cjs`)

Active `init` subcommands (the compound commands that workflows call):

| Route | Handler | Status |
|-------|---------|--------|
| `init execute-phase` | `cmdInitExecutePhase` | Live (v1 pipeline) |
| `init resume` | `cmdInitResume` | Live |
| `init progress` | `cmdInitProgress` | Live |
| `init project` | `cmdInitProject` | Live (v2) |
| `init framing-discovery <lens> [cap]` | `cmdInitFramingDiscovery` | Live (v2) |
| `init discuss-capability` | `cmdInitDiscussCapability` | Live (v2) |
| `init discuss-feature` | `cmdInitDiscussFeature` | Live (v2) |
| `init plan-feature` | `cmdInitPlanFeature` | Live (v2) |
| `init execute-feature` | `cmdInitExecuteFeature` | Live (v2) |
| `init feature-op` | `cmdInitFeatureOp` | Live (v2) |
| `init feature-progress` | `cmdInitFeatureProgress` | Live (v2) |
| `init phase-op` | Returns error message | Dead (intentional) |
| `init review-phase` | Returns error message | Dead (intentional) |
| `init doc-phase` | Returns error message | Dead (intentional) |

Other live atomic routes: `state` (9 subcommands), `find-phase`, `commit`, `template fill`, `frontmatter get`, `verify` (2 subcommands), `config-get`, `config-set`, `phases list`, `roadmap` (3 subcommands), `requirements mark-complete`, `phase complete`, `progress`, `phase-plan-index`, `state-snapshot`, `summary-extract`, `plan-validate`, `capability-create`, `capability-list`, `capability-status`, `feature-create`, `feature-list`, `feature-status`.

### Workflows (14 files in `get-shit-done/workflows/`)

```
init-project.md          framing-discovery.md     framing-pipeline.md
discuss-capability.md    discuss-feature.md       research-workflow.md
gather-synthesize.md     plan.md                  execute-plan.md
execute.md               review.md                doc.md
progress.md              resume-work.md
```

### Agents (17 files in `agents/`)

6 research gatherers, 4 reviewers + synthesizer, planner, executor, doc-writer, plan-checker, verifier.

### @file Reference Scope

Active toolchain directories that contain `@~/.claude/` references:
- `commands/gsd/` -- 9 files, ~24 refs
- `get-shit-done/workflows/` -- 14 files, ~20 refs
- `agents/` -- 3 files (planner, executor), ~5 refs
- `get-shit-done/templates/` -- 2 files (phase-prompt, structure), ~8 refs

Total: ~57 active @file refs across ~28 files.

`.planning/` directory files also contain @file refs, but these are historical (PLAN, VERIFICATION, RESEARCH docs). The CONTEXT decision says "scan everything -- no exceptions," so these get scanned too.

### Existing Test Infrastructure

- 14 test files in `tests/` using Node.js `--test` runner
- Test helper in `tests/helpers.cjs`
- Tests cover the `lib/*.cjs` modules (unit tests for CLI handlers)
- CLI runs confirmed: `node gsd-tools.cjs state load --cwd=<path>` returns valid JSON

## 2. Key Challenges for Planning

### Challenge 1: E2E Simulation Requires Scaffolded Fixtures

The `init framing-discovery` route requires:
- A `.planning/capabilities/` directory with at least one capability
- A valid STATE.md with frontmatter
- A config.json

The `init project` route needs a clean directory (no .planning/) for new-project mode.

Each command's init route expects different project state. The planner must define what fixtures look like for each test scenario.

### Challenge 2: Interactive Commands Can't Be Fully E2E'd in Script

Commands like `/gsd:debug` depend on `AskUserQuestion` for the Q&A loop. A test script can verify:
- The CLI init route returns valid JSON with expected shape
- @file references in the command file resolve to existing files
- The workflow file referenced by the command exists

But it cannot simulate the full interactive Q&A flow. The "E2E simulation" from CONTEXT means Claude running through the pipeline on a synthetic project -- not a bash script automating the Q&A.

### Challenge 3: @file Resolution is Path-Based, Not Runtime-Based

`@~/.claude/get-shit-done/workflows/framing-discovery.md` references resolve at Claude Code runtime. The source repo's files are at `get-shit-done/workflows/framing-discovery.md` (no `~/.claude/` prefix). The scan must:
1. Extract the path after `@~/.claude/`
2. Check that path exists relative to repo root (since `~/.claude/` is the install target)
3. Source paths only -- CONTEXT says install path validation is Phase 12's concern

### Challenge 4: discuss-phase Is Still Referenced

Found in active toolchain: `get-shit-done/templates/research.md` line 21 references `/gsd:discuss-phase`. This is a finding -- CONTEXT explicitly flags "discuss-phase should be dead."

### Challenge 5: Command Count Mismatch

CMD-01 says 11 commands. Only 9 exist as slash command files. The 11-command list includes `plan` and `review` which exist as workflows but not as standalone slash commands (they're pipeline-internal stages invoked by `framing-pipeline.md`). `status` vs `progress` naming is also unclear. This needs to be surfaced as a finding.

## 3. Scope Boundaries

### In Scope (from CONTEXT decisions)
- CLI init routes fire without error (exit code 0, valid JSON)
- All @file refs across commands, workflows, agents, templates, references resolve
- No command references a deleted workflow, agent, or template
- E2E simulation: Claude runs new-project -> capability build on synthetic project
- Narrative friction log with severity levels (blocker / friction / cosmetic)
- Auto-fix obvious renames; log non-obvious for discussion

### Out of Scope
- Install path (`~/.claude/`) validation (Phase 12)
- Permanent test suite (explicitly rejected)
- Fixing findings (discussion first, fix second, per CONTEXT)

## 4. Test Strategy Shape

### Part A: @file Reference Scan (Automated)

Scan directories: `commands/gsd/`, `get-shit-done/workflows/`, `get-shit-done/templates/`, `get-shit-done/references/`, `agents/`

For every `@~/.claude/<path>` found:
1. Strip `@~/.claude/` prefix
2. Check file exists at `<repo-root>/<path>`
3. Report: file, line, ref, resolved (yes/no)

Auto-fix: if a ref points to a renamed file (e.g., `plan-phase.md` -> `plan.md`) and the rename is obvious, fix it and log.

### Part B: CLI Route Smoke Tests (Automated)

For each init route, run against a pre-built temp directory:
```
/tmp/gsd-test-*/
  .planning/
    STATE.md          (minimal valid frontmatter)
    REQUIREMENTS.md   (minimal)
    ROADMAP.md        (minimal)
    capabilities/
      test-cap/
        CAPABILITY.md
        features/
          test-feat/
            FEATURE.md
  config.json
```

Test each route returns exit code 0 and JSON parses. Also test the "new project" mode with an empty temp dir.

### Part C: E2E Simulation (Claude-Driven)

Claude runs through the full pipeline on a synthetic project in `/tmp/gsd-test-*`:
1. `/gsd:init` on empty directory (new-project mode)
2. Exercise capability/feature lifecycle commands
3. Run a framing command (e.g., `/gsd:new`) to verify discovery flow
4. Check pipeline progression through framing-pipeline stages
5. Flag friction points in a narrative log

### Part D: Cross-Reference Audit

- Every command file references an existing workflow
- Every workflow references existing agents/references/templates
- No reference to deleted artifacts (discuss-phase, verify-work, research-phase, etc.)

## 5. Known Findings (Pre-Test)

| Severity | Finding |
|----------|---------|
| Friction | `research.md` template line 21 references `/gsd:discuss-phase` (dead command) |
| Friction | CMD-01 lists 11 commands but only 9 exist as slash command files |
| Cosmetic | `init.md` references `/gsd:new-project` in its "After this command" text -- no such command exists |

## 6. Fixture Requirements

Minimum viable synthetic project for CLI route testing:

```
STATE.md frontmatter:
  gsd_state_version: 1.0
  milestone: test
  milestone_name: test
  status: planning

config.json:
  { "commit_docs": false, "research": false }

ROADMAP.md: (any valid markdown with phase headers)
REQUIREMENTS.md: (any valid markdown)
CAPABILITY.md: (minimal frontmatter with name/status)
FEATURE.md: (minimal frontmatter with name/status)
```

`commit_docs: false` prevents git operations in the temp dir.

## 7. Artifact Produced

Single friction log at `.planning/phases/11-automated-testing/11-FRICTION-LOG.md` with:
- Test results per category (A/B/C/D)
- Findings table with severity (blocker/friction/cosmetic)
- Auto-fixed items listed
- Non-obvious broken refs for discussion
- E2E narrative with friction points

Test scripts are disposable (deleted after verification passes).

---

*Research completed: 2026-03-01*
*Phase: 11-automated-testing*
