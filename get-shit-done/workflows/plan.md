<purpose>
Create executable planning prompts (PLAN.md files) for a feature. Default flow: Research (if needed) -> Plan -> Self-critique -> CLI validate -> Plan-check -> Done. Orchestrates research-workflow, gsd-planner, and gsd-plan-checker with a revision loop (max 3 iterations).
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
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

Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `plan_checker_enabled`, `commit_docs`, `feature_found`, `feature_dir`, `feature_slug`, `capability_slug`, `capability_dir`, `has_context`, `has_brief`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `brief_path`, `design_path`, `research_path`.

**If `planning_exists` is false:** Error -- run `/gsd:new` first.

## 2. Parse Arguments

Extract flags: `--research`, `--skip-verify`.

**If `feature_found` is false:** Validate and create directory:
```bash
mkdir -p ".planning/capabilities/${CAPABILITY_SLUG}/features/${FEATURE_SLUG}"
```

## 3. Validate Feature

Read `${feature_dir}/FEATURE.md`. **If missing:** Error -- run `/gsd:discuss-feature` first.

Extract: feature name, requirements (EU/FN/TC IDs), goal/description.

## 4. Load Context

Scan capability/feature hierarchy:
1. Read CAPABILITY.md at ${capability_dir}/CAPABILITY.md
2. Scan sibling features: list ${capability_dir}/features/*/FEATURE.md
   - For each: extract status, requirement count, dependencies
3. Read current FEATURE.md (validated in step 3)
4. If BRIEF.md exists at ${capability_dir}/BRIEF.md: include Discovery Brief
5. If RESEARCH.md exists in feature dir: include it
6. No gate. No user prompt. Hierarchy scan is sufficient.

## 5. Handle Research

**Skip if:** `--skip-research` flag, or `research_enabled` is false without `--research` override.
**If `has_research` AND no `--research` flag:** Use existing, skip to step 6.

**If research needed:** Invoke `@{GSD_ROOT}/get-shit-done/workflows/research-workflow.md` with subject, context_paths (PROJECT.md, STATE.md, ROADMAP.md, requirements), output_dir, capability_path, feature_path, framing_context. Spawns 6 gatherers + synthesizer. Output: `{feature_dir}/RESEARCH.md`.

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
- {capability_dir}/CAPABILITY.md (Capability context + feature landscape)
- {FEATURE_PATH} (Feature Requirements -- EU/FN/TC layers)
- {brief_path} (Discovery Brief -- if exists)
- {research_path} (Technical Research -- if exists)
- {design_path} (Design & Style Guide -- if exists)
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
  prompt="First, read {GSD_ROOT}/agents/gsd-planner.md for your role.\n\n" + filled_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",
  description="Plan Feature {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

**ONE planner per feature.** No parallel planner spawns. If capability-level planning is needed, the capability-orchestrator handles feature sequencing — each feature still gets exactly one planner invocation.

## 8. Draft/Refine Loop

### 8.1. Receive Planner Output

Planner returns draft plans + self-critique findings.

### 8.2. CLI Validation

```bash
VALIDATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" plan-validate "${REQ_SOURCE}" ${PLAN_FILES} --raw)
```

Validation errors are added to findings list. **Do NOT auto-re-spawn planner on validation errors.**

### 8.3. Surface ALL to User

Present everything to user via AskUserQuestion:

For each finding (validation errors + planner self-critique):

Use AskUserQuestion:
- header: "Finding {N}/{total}"
- question: "[{category}] {description}\n\nSuggestion: {suggestion}\nAffected REQs: {reqs_affected}"
- options:
  - "Accept suggestion" — apply as-is
  - "Edit" — provide modified guidance
  - "Provide guidance" — tell planner what to change
  - "Dismiss" — not applicable

### 8.4. Collect Feedback

Aggregate all user responses: accepted suggestions, edits, guidance, dismissals.

### 8.5. Re-spawn if Needed

If any findings received guidance or edits: re-spawn planner with collected feedback → back to 8.1.
If all findings accepted or dismissed: proceed to 8.6.

Max 3 iterations of the 8.1-8.5 loop. If max reached with unresolved issues: surface for manual resolution.

### 8.6. User Approval

Present final plan summary:
- Feature, plan count, task count, waves
- Validation status
- Key decisions made during Q&A

Use AskUserQuestion:
- header: "Finalize"
- question: "Finalize this plan?"
- options: "Yes, finalize", "I want changes" (back to 8.5 with guidance), "Abort"

### 8.7. Plan Checker (if enabled)

If `plan_checker_enabled`:

```
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="Verify Feature {CAPABILITY_SLUG}/{FEATURE_SLUG} plans"
)
```

### 8.8. Handle Checker Findings

Checker findings are ALSO surfaced to user (same Q&A format as 8.3). **No auto-re-spawn on checker issues.**

If checker found issues: present via AskUserQuestion, collect feedback, re-spawn planner if guidance given. Back to 8.7 for re-check.

Repeat until user approves or max 3 checker cycles reached.

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
- Context hierarchy scanned and passed to ALL agents
- Research completed (or existing research reused when lens matches)
- Plans created with self-critique findings resolved
- CLI validation passed
- User explicitly confirmed "Finalize this plan?"
- Plan-checker verification passed (or user override)
- User sees status between agent spawns
- User knows next steps
</success_criteria>
