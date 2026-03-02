<purpose>
Create executable planning prompts (PLAN.md files) for a feature with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates research-workflow (6 gatherers + synthesizer), gsd-planner, and gsd-plan-checker agents with a revision loop (max 3 iterations).
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
**CAPABILITY_SLUG** — The capability this feature belongs to (e.g., "coaching")
**FEATURE_SLUG** — The feature to plan (e.g., "mistake-detection")
**LENS** — The framing lens (debug|new|enhance|refactor), passed from framing-pipeline or direct invocation
**ANCHOR_QUESTIONS_PATH** — Path to lens-specific anchor questions file (from framing-discovery init)

These come from framing-pipeline context or from direct user invocation via /gsd:plan.
</inputs>

<process>

## 1. Initialize

Load all context in one call (paths only to minimize orchestrator context):

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-feature "$CAPABILITY_SLUG" "$FEATURE_SLUG")
```

Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `commit_docs`, `feature_found`, `feature_dir`, `feature_slug`, `capability_slug`, `capability_dir`, `has_research`, `has_context`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`.

**File paths (for <files_to_read> blocks):** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`. These are null if files don't exist.

**If `planning_exists` is false:** Error — run `/gsd:new` first.

## 2. Parse and Normalize Arguments

Extract from $ARGUMENTS: flags (`--research`, `--skip-research`, `--skip-verify`).

**If `feature_found` is false:** Validate feature exists under the capability directory. If valid but missing, create the directory:
```bash
mkdir -p ".planning/capabilities/${CAPABILITY_SLUG}/features/${FEATURE_SLUG}"
```

**Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.

## 3. Validate Feature

Read FEATURE.md directly from the feature directory:
```bash
FEATURE_PATH="${feature_dir}/FEATURE.md"
```

**If FEATURE.md does not exist:** Error — run `/gsd:discuss-feature` first to create feature requirements.

Extract from FEATURE.md: feature name, requirements (EU/FN/TC IDs), goal/description.

## 4. Load CONTEXT.md

Check `context_path` from init JSON.

If `context_path` is not null, display: `Using feature context from: ${context_path}`

**If `context_path` is null (no CONTEXT.md exists):**

Use AskUserQuestion:
- header: "No context"
- question: "No CONTEXT.md found for feature ${FEATURE_SLUG}. Plans will use research and requirements only — your design preferences won't be included. Continue or capture context first?"
- options:
  - "Continue without context" — Plan using research + requirements only
  - "Run discuss-feature first" — Capture design decisions before planning

If "Continue without context": Proceed to step 5.
If "Run discuss-feature first": Display `/gsd:discuss-feature ${CAPABILITY_SLUG}/${FEATURE_SLUG}` and exit workflow.

## 5. Handle Research

**Skip if:** `--skip-research` flag, or `research_enabled` is false (from init) without `--research` override.

**If `has_research` is true (from init) AND no `--research` flag:** Use existing, skip to step 6.

**If RESEARCH.md missing OR `--research` flag:**

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► RESEARCHING FEATURE: ${FEATURE_SLUG}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning researcher...
```

### Delegate to Research Workflow

Invoke the research workflow:

```
@~/.claude/get-shit-done/workflows/research-workflow.md
```

Pass:
- `subject`: "Feature: ${CAPABILITY_SLUG}/${FEATURE_SLUG}"
- `context_paths`:
  - `project_path`: .planning/PROJECT.md
  - `state_path`: {state_path}
  - `roadmap_path`: .planning/ROADMAP.md
  - `requirements_path`: {requirements_path}
- `output_dir`: {feature_dir}
- `capability_path`: {capability_dir}/CAPABILITY.md
- `feature_path`: {feature_dir}/FEATURE.md
- `framing_context`: {framing_context from caller, if any}

The research workflow spawns 6 gatherers in parallel via gather-synthesize, then consolidates via the research synthesizer. Output: `{feature_dir}/RESEARCH.md`.

### Handle Research Return

- **`status: "complete"` or `status: "partial"`:** Display confirmation, continue to step 6
- **`status: "failed"`:** Display blocker, offer: 1) Provide context, 2) Skip research, 3) Abort

## 6. Check Existing Plans

```bash
ls "${feature_dir}"/*-PLAN.md 2>/dev/null
```

**If exists:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.

## 7. Use Context Paths from INIT

Extract from INIT JSON:

```bash
STATE_PATH=$(echo "$INIT" | jq -r '.state_path // empty')
ROADMAP_PATH=$(echo "$INIT" | jq -r '.roadmap_path // empty')
REQUIREMENTS_PATH=$(echo "$INIT" | jq -r '.requirements_path // empty')
RESEARCH_PATH=$(echo "$INIT" | jq -r '.research_path // empty')
CONTEXT_PATH=$(echo "$INIT" | jq -r '.context_path // empty')

# Feature-level: FEATURE.md has EU/FN/TC trace table
FEATURE_PATH="${feature_dir}/FEATURE.md"
REQ_SOURCE="${FEATURE_PATH}"
```

## 8. Spawn gsd-planner Agent

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PLANNING FEATURE: ${FEATURE_SLUG}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning planner...
```

Planner prompt:

```markdown
<planning_context>
**Feature:** {CAPABILITY_SLUG}/{FEATURE_SLUG}
**Lens:** {LENS}
**Anchor Questions:** @{ANCHOR_QUESTIONS_PATH}

<files_to_read>
- {state_path} (Project State)
- {roadmap_path} (Roadmap)
- {FEATURE_PATH} (Feature Requirements — EU/FN/TC layers)
- {context_path} (USER DECISIONS from /gsd:discuss-feature)
- {research_path} (Technical Research)
</files_to_read>

**Feature requirement IDs (every ID MUST appear in a plan's `requirements` field):** {feature_req_ids from FEATURE.md}

**Project instructions:** Read ./CLAUDE.md if exists — follow project-specific guidelines
**Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, plans should account for project skill rules
</planning_context>

<downstream_consumer>
Output consumed by the execute workflow. Plans need:
- Frontmatter (wave, depends_on, files_modified, autonomous)
- Tasks in XML format
- Verification criteria
- must_haves for goal-backward verification
</downstream_consumer>

<quality_gate>
- [ ] PLAN.md files created in feature directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from feature goal
</quality_gate>
```

```
Task(
  prompt="First, read ~/.claude/agents/gsd-planner.md for your role and instructions.\n\n" + filled_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",
  description="Plan Feature {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

## 9. Handle Planner Return

- **`## PLANNING COMPLETE`:** Extract plan file paths and findings list from planner output.

  **If findings exist:** Proceed to step 9.5 (Q&A loop).
  **If no findings:** Proceed to step 9.7 (CLI validation).

- **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation (step 12)
- **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual

## 9.5. Present Findings to User

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PLANNER FINDINGS ({count} items)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

For each finding (one at a time):

Display:
```
Finding {N}/{total}: [{category}]
{description}

Suggestion: {suggestion}
Affected REQs: {reqs_affected}

Options:
  1. Accept -- planner's suggestion is good
  2. Provide feedback -- tell the planner what to change
  3. Research guidance -- point to what needs investigating
```

**If Accept:** Mark finding resolved. Next finding.

**If Feedback:** Record user feedback. After all findings processed, re-spawn planner in revision mode with feedback applied. Re-run self-critique. If new findings emerge, add to queue and continue.

**If Research Guidance:** Spawn researcher with guidance. Read result. Revise affected plan tasks. If finding resolved, next. If new findings/assumptions surface, add to queue.

After all findings resolved: proceed to step 9.7.

## 9.7. Run CLI Validation

```bash
VALIDATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" plan-validate "${REQ_SOURCE}" ${PLAN_FILES} --raw)
```

Parse JSON result.

**If `passed` is true and warnings exist:**
Display warnings. These are informational -- uncovered REQs surface as planner awareness, not blockers.

**If `passed` is false (errors exist):**
Display errors with fix guidance:
```
VALIDATION ERRORS (must fix before finalizing):

  ERROR: orphan_task -- Task "{title}" in {plan} has no REQ references
    Fix: Add <reqs> with at least one requirement ID

  ERROR: phantom_reference -- REQ {id} in Task "{title}" not found in {source}
    Fix: Remove invalid REQ reference or add REQ to source file

  ERROR: cross_layer_mixing -- Task "{title}" mixes EU and TC layers
    Fix: Split task or bridge through FN-layer REQ
```

Re-spawn planner in revision mode with validation errors. Loop until validation passes (max 2 attempts). If still failing after 2 attempts, present errors to user for manual resolution.

**If `passed` is true and no warnings:** Proceed to step 9.9.

## 9.9. Finalize Plans

Display plan summary:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PLAN SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}
Plans: {count}
Tasks: {total across all plans}
Waves: {wave count}

Plan 01: {objective} ({task_count} tasks, wave {wave})
Plan 02: {objective} ({task_count} tasks, wave {wave})
...

Validation: PASSED
Findings resolved: {count}
```

Ask user: "Finalize this plan?"

**If user confirms:** Proceed to step 10 (plan-checker) if `plan_checker_enabled`, otherwise step 13.
**If user does not confirm:** Ask what needs changing. Re-spawn planner with feedback. Return to step 9.

## 10. Spawn gsd-plan-checker Agent

**Scope note:** With v2 self-critique handling coverage and CLI validation handling structural rules, the plan-checker focuses on execution feasibility: Can an executor actually implement these tasks? Are the artifact paths valid? Are the input data shapes realistic?

Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► VERIFYING PLANS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning plan checker...
```

Checker prompt:

```markdown
<verification_context>
**Feature:** {CAPABILITY_SLUG}/{FEATURE_SLUG}
**Feature Goal:** {goal from FEATURE.md}

<files_to_read>
- {feature_dir}/*-PLAN.md (Plans to verify)
- {roadmap_path} (Roadmap)
- {FEATURE_PATH} (Feature Requirements — EU/FN/TC layers)
- {context_path} (USER DECISIONS from /gsd:discuss-feature)
- {research_path} (Technical Research)
</files_to_read>

**Feature requirement IDs (MUST ALL be covered):** {feature_req_ids}

**Project instructions:** Read ./CLAUDE.md if exists — verify plans honor project guidelines
**Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — verify plans account for project skill rules
</verification_context>

<expected_output>
- ## VERIFICATION PASSED — all checks pass
- ## ISSUES FOUND — structured issue list
</expected_output>
```

```
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="Verify Feature {CAPABILITY_SLUG}/{FEATURE_SLUG} plans"
)
```

## 11. Handle Checker Return

- **`## VERIFICATION PASSED`:** Display confirmation, proceed to step 13.
- **`## ISSUES FOUND`:** Display issues, check iteration count, proceed to step 12.

## 12. Revision Loop (Max 3 Iterations)

Track `iteration_count` (starts at 1 after initial plan + check).

**If iteration_count < 3:**

Display: `Sending back to planner for revision... (iteration {N}/3)`

Revision prompt:

```markdown
<revision_context>
**Feature:** {CAPABILITY_SLUG}/{FEATURE_SLUG}
**Mode:** revision

<files_to_read>
- {feature_dir}/*-PLAN.md (Existing plans)
- {context_path} (USER DECISIONS from /gsd:discuss-feature)
</files_to_read>

**Checker issues:** {structured_issues_from_checker}
</revision_context>

<instructions>
Make targeted updates to address checker issues.
Do NOT replan from scratch unless issues are fundamental.
Return what changed.
</instructions>
```

```
Task(
  prompt="First, read ~/.claude/agents/gsd-planner.md for your role and instructions.\n\n" + revision_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",
  description="Revise Feature {CAPABILITY_SLUG}/{FEATURE_SLUG} plans"
)
```

After planner returns -> spawn checker again (step 10), increment iteration_count.

**If iteration_count >= 3:**

Display: `Max iterations reached. {N} issues remain:` + issue list

Offer: 1) Force proceed, 2) Provide guidance and retry, 3) Abandon

## 13. Present Final Status

Route to `<offer_next>`.

</process>

<offer_next>
Output this markdown directly (not as a code block):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► FEATURE {FEATURE_SLUG} PLANNED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}** — {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | 01, 02 | [objectives] |
| 2    | 03     | [objective]  |

Research: {Completed | Used existing | Skipped}
Verification: {Passed | Passed with override | Skipped}

───────────────────────────────────────────────────────────────

## Next Up

**Execute Feature {FEATURE_SLUG}** — run all {N} plans

Continue with the execute workflow.

<sub>/clear first for fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat {feature_dir}/*-PLAN.md — review plans

───────────────────────────────────────────────────────────────
</offer_next>

<success_criteria>
- [ ] .planning/ directory validated
- [ ] Feature validated (FEATURE.md exists with requirements)
- [ ] Feature directory created if needed
- [ ] CONTEXT.md loaded early (step 4) and passed to ALL agents
- [ ] Research completed (unless --skip-research or exists)
- [ ] research-workflow spawned with CONTEXT.md
- [ ] Existing plans checked
- [ ] gsd-planner spawned with CONTEXT.md + RESEARCH.md + lens framing
- [ ] Plans created (PLANNING COMPLETE or CHECKPOINT handled)
- [ ] Planner findings presented one-at-a-time with 3 response options (step 9.5)
- [ ] CLI validation passed via plan-validate (step 9.7)
- [ ] User explicitly confirmed "Finalize this plan?" (step 9.9) -- no auto-finalize
- [ ] gsd-plan-checker spawned with CONTEXT.md (feasibility focus)
- [ ] Verification passed OR user override OR max iterations with user decision
- [ ] User sees status between agent spawns
- [ ] User knows next steps
</success_criteria>
