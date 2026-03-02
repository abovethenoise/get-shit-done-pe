<purpose>
Create executable planning prompts (PLAN.md files) for a feature. Default flow: Research (if needed) -> Plan -> Self-critique -> CLI validate -> Plan-check -> Done. Orchestrates research-workflow, gsd-planner, and gsd-plan-checker with a revision loop (max 3 iterations).
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
**CAPABILITY_SLUG** -- The capability this feature belongs to (e.g., "coaching")
**FEATURE_SLUG** -- The feature to plan (e.g., "mistake-detection")
**LENS** -- Framing lens (debug|new|enhance|refactor), from framing-pipeline or direct invocation
**ANCHOR_QUESTIONS_PATH** -- Path to lens-specific anchor questions file
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-feature "$CAPABILITY_SLUG" "$FEATURE_SLUG")
```

Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `commit_docs`, `feature_found`, `feature_dir`, `feature_slug`, `capability_slug`, `capability_dir`, `has_research`, `has_context`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`.

**If `planning_exists` is false:** Error -- run `/gsd:new` first.

## 2. Parse Arguments

Extract flags: `--research`, `--skip-research`, `--skip-verify`.

**If `feature_found` is false:** Validate and create directory:
```bash
mkdir -p ".planning/capabilities/${CAPABILITY_SLUG}/features/${FEATURE_SLUG}"
```

## 3. Validate Feature

Read `${feature_dir}/FEATURE.md`. **If missing:** Error -- run `/gsd:discuss-feature` first.

Extract: feature name, requirements (EU/FN/TC IDs), goal/description.

## 4. Load CONTEXT.md

If `context_path` is not null: use it.
If null: ask user -- "Continue without context" or "Run discuss-feature first".

## 5. Handle Research

**Skip if:** `--skip-research` flag, or `research_enabled` is false without `--research` override.
**If `has_research` AND no `--research` flag:** Use existing, skip to step 6.

**If research needed:** Invoke `@~/.claude/get-shit-done/workflows/research-workflow.md` with subject, context_paths (PROJECT.md, STATE.md, ROADMAP.md, requirements), output_dir, capability_path, feature_path, framing_context. Spawns 6 gatherers + synthesizer. Output: `{feature_dir}/RESEARCH.md`.

Handle return: complete/partial -> continue. Failed -> offer: provide context, skip research, abort.

## 6. Check Existing Plans

If plans exist: offer add more, view existing, or replan from scratch.

## 7. Spawn gsd-planner Agent

Planner prompt:

```markdown
<planning_context>
**Feature:** {CAPABILITY_SLUG}/{FEATURE_SLUG}
**Lens:** {LENS}
**Anchor Questions:** @{ANCHOR_QUESTIONS_PATH}

<files_to_read>
- {state_path} (Project State)
- {roadmap_path} (Roadmap)
- {FEATURE_PATH} (Feature Requirements -- EU/FN/TC layers)
- {context_path} (USER DECISIONS from /gsd:discuss-feature)
- {research_path} (Technical Research)
</files_to_read>

**Feature requirement IDs (every ID MUST appear in a plan's `requirements` field):** {feature_req_ids from FEATURE.md}

**Project instructions:** Read ./CLAUDE.md if exists
**Project skills:** Check .claude/skills/ or .agents/skills/ if exists
</planning_context>

<downstream_consumer>
Output consumed by execute workflow. Plans need: frontmatter (wave, depends_on, files_modified, autonomous), tasks in XML, verification criteria, must_haves for goal-backward verification.
</downstream_consumer>

<quality_gate>
- [ ] PLAN.md files created in feature directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks specific and actionable
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from feature goal
</quality_gate>
```

```
Task(
  prompt="First, read ~/.claude/agents/gsd-planner.md for your role.\n\n" + filled_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",
  description="Plan Feature {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

## 8. Handle Planner Return

- **PLANNING COMPLETE:** Extract plan paths and findings. If findings -> step 8.5. If none -> step 8.7.
- **CHECKPOINT REACHED:** Present to user, get response, spawn continuation.
- **PLANNING INCONCLUSIVE:** Show attempts, offer: add context / retry / manual.

## 8.5. Present Findings (Q&A)

For each finding (one at a time):

```
Finding {N}/{total}: [{category}]
{description}
Suggestion: {suggestion}
Affected REQs: {reqs_affected}

Options:
  1. Accept -- suggestion is good
  2. Provide feedback -- tell planner what to change
  3. Research guidance -- point to what needs investigating
```

Accept -> next. Feedback -> re-spawn planner in revision mode. Research -> spawn researcher with guidance, revise affected tasks. After all resolved -> step 8.7.

## 8.7. CLI Validation

```bash
VALIDATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" plan-validate "${REQ_SOURCE}" ${PLAN_FILES} --raw)
```

If errors: display with fix guidance, re-spawn planner (max 2 attempts). If warnings: informational only. If passed: step 8.9.

## 8.9. Finalize Plans

Display summary (feature, plan count, task count, waves, validation status). Ask: "Finalize this plan?"

Confirmed -> step 9 (plan-checker if enabled, else step 12). Not confirmed -> ask what to change, re-spawn.

## 9. Spawn gsd-plan-checker

Focuses on execution feasibility: can an executor implement these tasks? Valid paths? Realistic data shapes?

```
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="Verify Feature {CAPABILITY_SLUG}/{FEATURE_SLUG} plans"
)
```

## 10. Handle Checker Return

- **VERIFICATION PASSED:** Proceed to step 12.
- **ISSUES FOUND:** Display issues, proceed to step 11.

## 11. Revision Loop (Max 3)

Re-spawn planner in revision mode with checker issues (targeted updates, not full replan). Re-run checker. If max reached with remaining issues: offer force proceed, provide guidance, or abandon.

## 12. Present Final Status

```
GSD > FEATURE {FEATURE_SLUG} PLANNED

**Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}** -- {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01, 02 | [objectives] |

Research: {Completed | Used existing | Skipped}
Verification: {Passed | Passed with override | Skipped}

## Next Up

**Execute Feature {FEATURE_SLUG}** -- run all {N} plans

Continue with the execute workflow.

<sub>/clear first for fresh context window</sub>

Also: cat {feature_dir}/*-PLAN.md -- review plans
```

</process>

<success_criteria>
- .planning/ directory validated
- Feature validated (FEATURE.md exists with requirements)
- CONTEXT.md loaded early and passed to ALL agents
- Research completed (unless skipped or existing)
- Plans created with self-critique findings resolved
- CLI validation passed
- User explicitly confirmed "Finalize this plan?"
- Plan-checker verification passed (or user override)
- User sees status between agent spawns
- User knows next steps
</success_criteria>
