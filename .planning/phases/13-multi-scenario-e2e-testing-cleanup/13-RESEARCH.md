# Phase 13: Multi-Scenario E2E Testing & Cleanup - Research

**Researched:** 2026-03-02
**Domain:** End-to-end pipeline testing across 13 scenarios with inline fixes and friction logging
**Confidence:** HIGH

## Summary

Phase 13 is a testing-and-fixing phase, not a library/technology phase. The "domain" is the GSD v2 codebase itself -- every command, workflow, agent, template, and CLI route built in Phases 1-12. The work is: run 13 scenarios grounded in a workout app persona, fix simple breaks inline, log friction to `13-FINDINGS.md`, triage all findings with the human, then do a targeted sweep for remaining dead references.

Phase 12 resolved the three blockers (B1: pipeline init route mismatch, B2: missing STATE.md/ROADMAP.md bootstrap, B3: capability-to-feature gap). All 8 ROADMAP success criteria for Phase 12 passed verification. The codebase entering Phase 13 has: 13 slash commands, 17 workflow files, 17 agent files, 4 framing directories with anchor questions, ~12 reference docs, ~20 templates, and a CLI tool (gsd-tools.cjs) with ~30 active routes.

**Primary recommendation:** Structure plans around scenario groups (not individual scenarios), with one plan per logical cluster of scenarios that share pre-staging needs. Fix inline. Log everything to 13-FINDINGS.md. Dedicate a final plan to triage Q&A + targeted sweep + fix pass.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All scenarios grounded in a single roleplay: building a "personal workout app" for someone who wants balanced cardio + strength training, no gym/weights/machines
- Single narrative across all framings -- workout app is the "new" project, then enhance/debug/refactor layer onto it
- 13 scenarios total (numbered 1-13 in CONTEXT.md)
- Fix simple issues inline, log broader friction to central `13-FINDINGS.md`
- All findings triaged in a human Q&A pass: each item marked "fix" or "ignore"
- Per-scenario reports in `.planning/phases/13-multi-scenario-e2e-testing-cleanup/scenarios/`
- Each report includes: scenario goal, steps taken, simulated user interactions, result, findings
- No summary rollup needed -- individual reports + findings doc tell the full story
- Test-driven fixes first, then targeted sweep for known problem patterns
- Phase 13 exit criteria: flows work correctly AND feel polished
- Phase 14 is strictly install mechanics

### Claude's Discretion
- Specific grep patterns for the targeted sweep
- How to mock/pre-stage artifacts for mid-pipeline entry scenarios
- Scenario execution order and parallelization strategy
- Level of detail in scenario reports

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

This phase uses no external libraries. All testing is simulated E2E traces through GSD workflow files, CLI route invocations, and artifact verification.

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| gsd-tools.cjs | current | CLI route invocation for all init/CRUD/state operations | All workflows call this; it's the testing surface |
| Bash + node | system | Running CLI routes, creating fixtures, verifying artifacts | Standard execution environment |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| Glob/Grep | Artifact verification, dead reference scanning | Post-scenario verification and targeted sweep |

### Alternatives Considered

None -- this phase tests the existing codebase, it doesn't introduce technology.

## Architecture Patterns

### Scenario Execution Pattern

Each scenario follows the same structure:

```
1. PRE-STAGE: Create workspace (temp dir or fixture dir)
   - Set up .planning/, .documentation/ as needed
   - Mock artifacts for mid-pipeline scenarios

2. TRACE: Walk through the user journey
   - Read each workflow file to understand what Claude-as-agent would do
   - Run CLI routes against the staged workspace
   - Verify data flow: inputs -> CLI -> JSON -> workflow -> artifacts

3. VERIFY: Check outputs
   - Expected artifacts exist
   - Frontmatter is well-formed
   - @file references resolve
   - CLI routes return valid JSON with expected fields

4. REPORT: Write scenario report
   - Goal, steps, simulated interactions, result, findings

5. FIX or LOG:
   - Simple fix? Do it inline, note in report
   - Broader issue? Log to 13-FINDINGS.md
```

### Recommended Directory Structure

```
.planning/phases/13-multi-scenario-e2e-testing-cleanup/
├── 13-CONTEXT.md
├── 13-RESEARCH.md
├── 13-FINDINGS.md           # Central friction/findings log
├── 13-XX-PLAN.md             # Plan files
├── 13-XX-SUMMARY.md          # Plan summaries
└── scenarios/
    ├── 01-greenfield-new.md
    ├── 02-single-feature.md
    ├── 03-enhance-framing.md
    ├── 04-debug-framing.md
    ├── 05-refactor-framing.md
    ├── 06-brownfield-init.md
    ├── 07-mid-pipeline-plan.md
    ├── 08-mid-pipeline-execute.md
    ├── 09-mid-pipeline-review.md
    ├── 10-milestone-roadmap.md
    ├── 11-create-focus.md
    ├── 12-conflicting-focus.md
    └── 13-parallel-focus.md
```

### Pre-Staging Patterns for Mid-Pipeline Scenarios

**Pattern: Artifact Chain Simulation**

For mid-pipeline entry (scenarios 7-9), pre-stage the artifacts that earlier pipeline stages would have produced:

| Scenario | Pre-Stage These | Entry Point |
|----------|----------------|-------------|
| 7 (mid-plan) | PROJECT.md, CAPABILITY.md, DISCOVERY-BRIEF.md, RESEARCH.md, FEATURE.md (with requirements) | `/gsd:plan workout-app/some-feature` |
| 8 (mid-execute) | All of above + PLAN files in feature dir | `/gsd:execute` via execute.md |
| 9 (mid-review) | All of above + executed code/artifacts + SUMMARY files | `/gsd:review workout-app/some-feature` |

Pre-staging approach: Use the templates in `get-shit-done/templates/` to create realistic artifacts with workout-app domain content. Fill in placeholder fields. The key is that CLI routes (`init plan-feature`, `init execute-feature`, `init feature-op`) need real directories and files to return valid JSON.

**Pattern: Brownfield Simulation (Scenario 6)**

```
1. Start from the workout app built in Scenario 1
2. Delete .planning/ and .documentation/ directories
3. Keep all "code" (which in simulation = the capability/feature artifacts treated as if they were code)
4. Run /gsd:init and verify it detects existing-project mode
5. Verify capability/feature auto-discovery works
```

### Anti-Patterns to Avoid
- **Testing in isolation from the narrative:** All 13 scenarios share one persona. Scenario 3 (enhance) should reference the workout app built in scenario 1, not a fresh project.
- **Ignoring sequencing dependencies:** Scenarios 1-5 build on each other. Scenarios 6-13 can be independent.
- **Over-mocking:** Use real CLI routes and real file writes. Only mock what Claude-as-agent would say in Q&A (the simulated user interactions).
- **Fixing everything inline:** Only fix syntax bugs and easy replacements. Workflow design issues go to FINDINGS.md for triage.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Artifact pre-staging | Custom fixture scripts | Templates + gsd-tools CRUD commands | `capability-create`, `feature-create` + template fill give you real artifacts |
| JSON validation | Manual field checking | `node gsd-tools.cjs init <route> ... --raw` | CLI routes already validate and return structured JSON |
| Reference scanning | Custom grep scripts | Existing Phase 11 scan patterns | Phase 11 already built the `@file` reference scan and cross-ref audit patterns |

**Key insight:** The testing infrastructure IS the product. gsd-tools.cjs routes, templates, and CRUD commands are both the testing tools and the things being tested.

## Common Pitfalls

### Pitfall 1: Scenario Drift from Narrative
**What goes wrong:** Scenarios become generic "test init" instead of "initialize the workout app project"
**Why it happens:** Easier to test abstractly than to maintain a coherent persona
**How to avoid:** Every scenario report must reference the workout app persona. Simulated user interactions must use workout-domain language.
**Warning signs:** Reports that say "created capability X" instead of "created workout-routines capability"

### Pitfall 2: Incomplete Pre-Staging Breaks CLI Routes
**What goes wrong:** Mid-pipeline CLI routes return errors because expected directories/files don't exist
**Why it happens:** `init plan-feature cap feat` needs `.planning/capabilities/{cap}/features/{feat}/` to exist with FEATURE.md
**How to avoid:** Before each mid-pipeline scenario, verify the pre-staged directory tree with `ls -R` and run the init route to confirm valid JSON
**Warning signs:** CLI routes returning null fields or error messages

### Pitfall 3: Fixing Inline Without Logging
**What goes wrong:** Fixes happen but aren't recorded, making triage incomplete
**Why it happens:** Developer momentum -- fix and move on
**How to avoid:** Every inline fix gets a line in 13-FINDINGS.md with "FIXED" status. Every deferred issue gets "OPEN" status.
**Warning signs:** Scenario reports mention fixes but FINDINGS.md is sparse

### Pitfall 4: Parallel Scenario Interference
**What goes wrong:** Scenarios 11-13 (focus groups) modify STATE.md and ROADMAP.md, potentially conflicting with each other or with earlier scenarios
**Why it happens:** All scenarios operate on the same `.planning/` directory
**How to avoid:** Run parallel focus group scenarios in separate workspace copies (temp dirs), or run them sequentially with clear state resets between scenarios
**Warning signs:** Unexpected STATE.md content, focus group overlap detection errors

### Pitfall 5: Phase 11 Friction Items Unchecked
**What goes wrong:** Phase 11 found 12 issues (3 blockers, 5 friction, 4 cosmetic). Phase 12 fixed the blockers but some friction/cosmetic items may still be open.
**Why it happens:** Phase 12 focused on architecture, not cosmetic fixes
**How to avoid:** During the targeted sweep, re-verify all Phase 11 friction items (F1-F5, C1-C4) against current code state
**Warning signs:** Old error messages still pointing to deleted commands

## Code Examples

### CLI Route Testing Pattern

```bash
# Test init route returns valid JSON
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init project --cwd=/tmp/gsd-test-workout)
echo "$INIT" | python3 -c "import sys,json; json.load(sys.stdin); print('VALID JSON')"

# Test capability CRUD
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-create workout-routines --cwd=/tmp/gsd-test-workout
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-list --cwd=/tmp/gsd-test-workout

# Test feature CRUD
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create workout-routines bodyweight-exercises --cwd=/tmp/gsd-test-workout
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-list workout-routines --cwd=/tmp/gsd-test-workout

# Test slug resolution
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "workout" --cwd=/tmp/gsd-test-workout

# Test feature-scoped init routes
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-feature workout-routines bodyweight-exercises --cwd=/tmp/gsd-test-workout
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-feature workout-routines bodyweight-exercises --cwd=/tmp/gsd-test-workout
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op workout-routines bodyweight-exercises review --cwd=/tmp/gsd-test-workout
```

### Scenario Report Template

```markdown
# Scenario {N}: {Name}

**Goal:** {What this scenario tests}
**Date:** {date}
**Status:** PASS | FAIL | PARTIAL

## Pre-Staging
{What was set up before the scenario started}

## Steps

### Step 1: {Action}
**Command/Workflow:** {what was invoked}
**Simulated user input:** {what the user would say/choose}
**Expected result:** {what should happen}
**Actual result:** {what did happen}
**Verdict:** PASS | FAIL | FRICTION

## Findings
| # | Type | Description | Status |
|---|------|-------------|--------|
| S{N}-F1 | bug/friction/cosmetic | {description} | FIXED/OPEN |

## Artifacts Produced
{List of files created/modified during this scenario}
```

### 13-FINDINGS.md Structure

```markdown
# Phase 13: Findings

**Date:** {date}
**Scenarios completed:** {N}/13

## Summary
- Total findings: {N}
- Fixed inline: {N}
- Open for triage: {N}
- From targeted sweep: {N}

## Findings

### From Scenarios

| # | Scenario | Type | Description | Status | Triage |
|---|----------|------|-------------|--------|--------|
| F1 | S01 | bug | {description} | FIXED | - |
| F2 | S03 | friction | {description} | OPEN | fix/ignore |

### From Targeted Sweep

| # | Pattern | Location | Description | Status | Triage |
|---|---------|----------|-------------|--------|--------|
| T1 | v1 remnant | {file:line} | {description} | OPEN | fix/ignore |

## Triage Results
{After human Q&A pass}
```

## State of the Art

| Old Approach (Phase 11) | Current Approach (Phase 13) | When Changed | Impact |
|--------------------------|----------------------------|--------------|--------|
| Single synthetic project (TaskFlow) | 13 scenarios on one persona (workout app) | Phase 13 design | Broader coverage, narrative coherence |
| Simulation only (read workflow, imagine execution) | Simulation + CLI route validation + artifact verification | Phase 12 fixed routes | Can now actually run CLI routes end-to-end |
| Phase-based pipeline (BROKEN in Phase 11) | Feature-based pipeline (fixed in Phase 12) | Phase 12 Plans 01-04 | Full pipeline testable for first time |

**Key change since Phase 11:** The v2 pipeline is now wired end-to-end. Phase 11's E2E simulation broke at Stage 3 (plan) because pipeline workflows called v1 phase routes. Phase 12 rewrote all workflows to use v2 feature routes. Phase 13 can now test the actual pipeline flow.

## Open Questions

1. **How deep should mid-pipeline pre-staging go?**
   - What we know: CLI routes need real directories and files to return valid JSON
   - What's unclear: How realistic do DISCOVERY-BRIEF.md, RESEARCH.md, REQUIREMENTS content need to be? Minimal valid vs. workout-domain-specific?
   - Recommendation: Use workout-domain content in pre-staged artifacts. This catches template rendering issues and makes scenario reports meaningful. Cost is minimal -- just fill in templates with workout-app text.

2. **Parallel focus group testing workspace isolation**
   - What we know: Scenarios 11-13 all modify STATE.md and ROADMAP.md
   - What's unclear: Can they safely run in the same workspace or do they need separate copies?
   - Recommendation: Run sequentially with documented state before/after each scenario. Parallel would require temp dir copies and introduces filesystem management complexity not worth the time savings.

3. **Phase 11 friction items -- what's still open?**
   - What we know: F1-F3 (/gsd:new-project refs) were noted as "Fix now" in Phase 11. F4 (/gsd:discuss-phase ref) same.
   - What's unclear: Did Phase 12 fix these? The commit `2f9ad5a` message says "fix: update dead command references found in Phase 11 E2E simulation"
   - Recommendation: Verify during targeted sweep. If already fixed, note as verified. If not, add to FINDINGS.md.

4. **INST-01..08 and VAL-01..03 -- orphaned in REQUIREMENTS.md**
   - What we know: Phase 12 verification flagged these as "mapped to Phase 12 in REQUIREMENTS.md but no plan claimed them"
   - What's unclear: Should Phase 13 update REQUIREMENTS.md to remap these to Phase 14?
   - Recommendation: Yes -- as part of cleanup, remap INST-01..08 and VAL-01..03 to Phase 14 in REQUIREMENTS.md traceability table.

## Scenario Grouping Strategy (Claude's Discretion)

### Recommended Plan Structure

| Plan | Scenarios | Rationale |
|------|-----------|-----------|
| Plan 1 | S01 (greenfield) + S02 (single feature) | Foundation -- builds the workout app that all other scenarios reference |
| Plan 2 | S03 (enhance) + S04 (debug) + S05 (refactor) | Four framings -- S01 already tested /new, these test the other three |
| Plan 3 | S06 (brownfield) | Standalone -- requires stripping .planning/ from the workout app |
| Plan 4 | S07 (mid-plan) + S08 (mid-execute) + S09 (mid-review) | Mid-pipeline entry -- all share the same pre-staging pattern |
| Plan 5 | S10 (milestone/roadmap) + S11 (create focus) + S12 (conflicting focus) + S13 (parallel focus) | Focus group and sequencing scenarios -- all test STATE.md/ROADMAP.md management |
| Plan 6 | Targeted sweep + triage Q&A + fix pass | Cleanup -- grep patterns, Phase 11 re-verification, human triage, fixes |

This gives 6 plans. Plans 1-5 produce scenario reports + inline fixes + FINDINGS.md entries. Plan 6 does the sweep, triage, and final fixes.

### Execution Order

Plans 1-2 MUST run sequentially (Plan 2 depends on the workout app from Plan 1).
Plans 3-5 can run after Plan 2 and are independent of each other.
Plan 6 runs last.

```
Plan 1 (S01-02) -> Plan 2 (S03-05) -> Plan 3 (S06) \
                                     -> Plan 4 (S07-09)  > Plan 6 (sweep + triage)
                                     -> Plan 5 (S10-13) /
```

### Targeted Sweep Patterns (Claude's Discretion)

Grep patterns to scan for during the targeted sweep:

| Pattern | What It Catches |
|---------|-----------------|
| `gsd:new-project` | Dead command reference (F1-F3 from Phase 11) |
| `gsd:discuss-phase` | Dead command reference (F4 from Phase 11) |
| `gsd:verify-work` | Dead command reference (C1-C2 from Phase 11) |
| `plan-phase` | v1 phase route in a workflow (B1 class, should all be gone) |
| `execute-phase` | v1 phase route (same class) |
| `review-phase` | v1 phase route (same class) |
| `doc-phase` | v1 phase route (same class) |
| `init progress` (without feature-progress) | Dead v1 init route |
| `.planning/phases/` in non-.planning files | v1 path reference in deployed code |
| `milestone_branch_template` | v1 config default |
| `phase_branch_template` | v1 config default |
| `gsd-codebase-mapper` | Deleted agent reference |
| `gsd-check-update` | Deleted hook reference |
| `PRD` (in workflow files) | v1 concept that should be removed |

Scope: All files under `commands/`, `agents/`, `get-shit-done/workflows/`, `get-shit-done/references/`, `get-shit-done/templates/`, `get-shit-done/bin/`. Exclude `.planning/phases/` (historical docs are expected to contain old references).

## Sources

### Primary (HIGH confidence)
- Phase 12 verification report (`.planning/phases/12-workflow-optimization-wiring/12-VERIFICATION.md`) -- 8/8 success criteria verified
- Phase 12 plan summaries (12-01 through 12-09) -- detailed record of what was built/fixed
- Phase 11 friction log (`.planning/phases/11-automated-testing/11-FRICTION-LOG.md`) -- 12 findings, 3 blockers
- Phase 11 E2E simulation notes (`.planning/phases/11-automated-testing/e2e-simulation-notes.md`) -- prior simulation methodology
- Phase 13 CONTEXT.md -- user decisions from discuss-phase
- ROADMAP.md -- Phase 13 success criteria
- REQUIREMENTS.md -- requirement traceability

### Secondary (MEDIUM confidence)
- Direct codebase inspection: commands/, workflows/, agents/, templates/, framings/, gsd-tools.cjs header
- STATE.md accumulated decisions -- Phase 12 decision log

## Metadata

**Confidence breakdown:**
- Testing approach: HIGH -- Phase 11 established the simulation methodology; Phase 13 extends it with more scenarios and real CLI route testing
- Pre-staging patterns: HIGH -- CLI routes and templates are well-documented; CRUD commands exist for capability/feature creation
- Scenario coverage: HIGH -- 13 scenarios map directly to the 7 ROADMAP success criteria plus focus group testing from CONTEXT.md
- Sweep patterns: MEDIUM -- patterns based on Phase 11 findings and Phase 12 cleanup; may miss novel issues

**Research date:** 2026-03-02
**Valid until:** 2026-03-16 (stable -- testing existing code, no external dependencies)
