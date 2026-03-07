<purpose>
Create executable planning prompts (PLAN.md files) for a feature. Default flow: Research (if needed) -> Plan -> Self-critique -> CLI validate -> Plan-check -> Done. Orchestrates research (internal gather-synthesize), gsd-planner, and gsd-plan-checker with a revision loop (max 3 iterations).
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
@{GSD_ROOT}/get-shit-done/references/delegation.md
</required_reading>

<inputs>
**CAPABILITY_SLUG** -- The capability this feature belongs to (e.g., "coaching")
**FEATURE_SLUG** -- The feature to plan (e.g., "mistake-detection")
**LENS** -- Framing lens (debug|new|enhance|refactor), from framing-pipeline or direct invocation
**SECONDARY_LENS** -- Secondary framing lens (optional, for compound work)
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

**Lens-aware reuse check:**

```bash
mkdir -p "${feature_dir}/research"
```

Check whether RESEARCH.md exists:
```bash
test -f "${feature_dir}/RESEARCH.md" && test -s "${feature_dir}/RESEARCH.md"
```

**If RESEARCH.md does not exist:** Run research (proceed to spawn block below).

**If RESEARCH.md exists:** Read its YAML frontmatter. Extract `lens` and `secondary_lens` fields.
- If `lens` matches current `LENS` AND `secondary_lens` matches current `SECONDARY_LENS` (or both are absent/null): **Reuse existing RESEARCH.md. Skip to Step 6.**
- If lens mismatch: Re-run research. Log reason: "Existing research used {frontmatter_lens}, current work uses {LENS}. Re-running."
- If RESEARCH.md exists but has no frontmatter or no `lens` field: Treat as stale. Re-run research.

**Spawn research gatherers (when research needed):**

Assemble context payload (read each path, embed content):
```
<core_context>{contents of PROJECT.md, STATE.md, ROADMAP.md}</core_context>
<capability_context>{contents of CAPABILITY.md}</capability_context>
<feature_context>{contents of FEATURE.md}</feature_context>
<framing_context>
Lens: {LENS}
Secondary lens: {SECONDARY_LENS or null}
Brief path: {brief_path}
Anchor questions: {ANCHOR_QUESTIONS_PATH}
</framing_context>
```

Spawn all 6 gatherers simultaneously (parallel Task calls -- do NOT wait for one before spawning the next):

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-research-domain.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Domain Truth\nWrite your complete analysis to: {feature_dir}/research/domain-truth-findings.md</task_context>",
  subagent_type="gsd-research-domain",
  description="Research Domain Truth for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-research-system.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Existing System\nWrite your complete analysis to: {feature_dir}/research/existing-system-findings.md</task_context>",
  subagent_type="gsd-research-system",
  description="Research Existing System for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-research-intent.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: User Intent\nWrite your complete analysis to: {feature_dir}/research/user-intent-findings.md</task_context>",
  subagent_type="gsd-research-intent",
  description="Research User Intent for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-research-tech.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Tech Constraints\nWrite your complete analysis to: {feature_dir}/research/tech-constraints-findings.md</task_context>",
  subagent_type="gsd-research-tech",
  description="Research Tech Constraints for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-research-edges.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Edge Cases\nWrite your complete analysis to: {feature_dir}/research/edge-cases-findings.md</task_context>",
  subagent_type="gsd-research-edges",
  description="Research Edge Cases for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-research-prior-art.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Prior Art\nWrite your complete analysis to: {feature_dir}/research/prior-art-findings.md</task_context>",
  subagent_type="gsd-research-prior-art",
  description="Research Prior Art for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

Wait for ALL 6 gatherers to complete. Check each output file exists and is non-empty:
```bash
for f in domain-truth existing-system user-intent tech-constraints edge-cases prior-art; do
  test -f "${feature_dir}/research/${f}-findings.md" && test -s "${feature_dir}/research/${f}-findings.md" && echo "${f}: OK" || echo "${f}: FAILED"
done
```

For any failed gatherer: retry once with the same Task() prompt. If still failed after retry: mark as failed in manifest.

If more than 3 gatherers failed: surface error and abort. Do NOT continue to synthesizer.

**Spawn synthesizer (after gather phase succeeds or partially succeeds):**

Build gatherer manifest listing each dimension path and its status (success | failed).

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-research-synthesizer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Gather phase complete. Synthesize the following gatherer outputs into a consolidated RESEARCH.md.\n\nGatherer outputs:\n- Domain Truth: {feature_dir}/research/domain-truth-findings.md [{status}]\n- Existing System: {feature_dir}/research/existing-system-findings.md [{status}]\n- User Intent: {feature_dir}/research/user-intent-findings.md [{status}]\n- Tech Constraints: {feature_dir}/research/tech-constraints-findings.md [{status}]\n- Edge Cases: {feature_dir}/research/edge-cases-findings.md [{status}]\n- Prior Art: {feature_dir}/research/prior-art-findings.md [{status}]\n\nWrite your synthesis to: {feature_dir}/RESEARCH.md\n\nIMPORTANT: Begin RESEARCH.md with YAML frontmatter:\n---\nlens: {LENS}\nsecondary_lens: {SECONDARY_LENS or null}\nsubject: {CAPABILITY_SLUG}/{FEATURE_SLUG}\ndate: {ISO date today}\n---\n\nIf any gatherer has status \"failed\", document the gap -- do not fabricate content for missing dimensions.</task_context>",
  subagent_type="gsd-research-synthesizer",
  description="Synthesize Research for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

**Cleanup research findings:**
After RESEARCH.md is verified non-empty, remove ephemeral gatherer outputs:
```bash
rm -f "${feature_dir}"/research/*-findings.md
rmdir "${feature_dir}/research" 2>/dev/null
```
RESEARCH.md is the sole retained research artifact.

**Handle research failure:**
If research fails (aborted due to too many gatherer failures):
Present options to user via AskUserQuestion:
- "Provide context directly" -- user supplies key facts; proceed to planning with user-provided context
- "Abort" -- stop planning workflow

Do NOT offer "skip research" as an option.

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
  description="Plan Feature {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

**ONE planner per feature.** No parallel planner spawns. If capability-level planning is needed, the framing-pipeline handles feature sequencing — each feature still gets exactly one planner invocation.

## 8. Draft/Refine Loop

### 8.1. Receive Planner Output

Planner returns draft plans + self-critique findings.

### 8.2. CLI Validation

```bash
VALIDATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" plan-validate "${REQ_SOURCE}" ${PLAN_FILES} --raw)
```

Validation errors are added to findings list. **Do NOT auto-re-spawn planner on validation errors.**

### 8.3. Surface to User

Present the planner return in this order:

**A. Justification narrative (always renders)**

Display the `### Justification` section from the planner return (ordering rationale, approach rationale, KISS rationale). If missing (legacy or error): display "No justification available from planner."

**B. Round 1 fix summary (always renders)**

Display the `### Round 1 Fixes` section verbatim (or "No Round 1 fixes applied").

**C. Round 2 findings loop (runs only when findings exist)**

For each finding (validation errors + planner self-critique Round 2), use AskUserQuestion:
- header: "Finding {N}/{total}"
- question: "[{category}] {description}\n\nSuggestion: {suggestion}\nAffected REQs: {reqs_affected}"
- options:
  - "Accept suggestion" — apply as-is
  - "Edit" — provide modified guidance
  - "Provide guidance" — tell planner what to change
  - "Dismiss" — not applicable

If findings list is empty: skip the loop entirely. Justification and Round 1 summary still render.

### 8.4. Collect Feedback

Aggregate all user responses: accepted suggestions, edits, guidance, dismissals.

### 8.5. Re-spawn if Needed

If any findings received guidance or edits: re-spawn planner with collected feedback → back to 8.1.
If all findings accepted or dismissed: proceed to 8.6.

Max 3 iterations of the 8.1-8.5 loop. If max reached with unresolved issues: surface for manual resolution.

### 8.6. Final Summary

Present the full 3-layer plan summary:

**Layer 1 — Justification narrative:** Repeat ordering rationale, approach rationale, and KISS rationale from `### Justification`. Repeat from 8.3.A — full context at decision time.

**Layer 2 — Surfaced decisions:**
- Round 1 fixes from `### Round 1 Fixes` (or "No Round 1 fixes applied")
- Key Round 2 resolutions: one line per finding accepted/edited in 8.3.C (what changed)

**Layer 3 — Visual plan architecture (conditional):**
If 2+ waves OR 3+ plans: render ASCII flow diagram (ui-brand.md notation):
  [Plan-NN: objective summary] --> [Plan-NN: objective summary]
Derive from PLAN.md `wave` and `depends_on` frontmatter. If 1 wave and ≤2 plans: omit.

**Plan summary table:** Feature, plan count, task count, waves, validation status.

### 8.7. Deep-Dive and Approval (unconditional)

After the summary, present a plan-area deep-dive via AskUserQuestion (multiSelect: true):

- header: "Deep-Dive"
- question: "Select any areas to drill into before finalizing, or skip to approve."
- multiSelect: true
- options:
  - "Wave ordering & task sequence"
  - "Approach vs alternatives"
  - "Requirement coverage"
  - "Assumptions made"

If user selects areas: draw relevant detail from the planner's `### Justification` section and the PLAN.md frontmatter for each selected area. Present all detail, then offer a second AskUserQuestion (multiSelect: true) with remaining areas:
- options: remaining unselected areas + "Self-critique details" + "No deep-dive needed"

If user selects "No deep-dive needed" (or selects it in the first question): proceed to finalize.

This step runs regardless of finding count. Well-formed plans receive equal scrutiny.

Finalize AskUserQuestion:
- header: "Finalize"
- question: "Review complete. Finalize this plan?"
- options:
  - "Yes, finalize"
  - "I want changes" — re-spawn planner with collected feedback; re-spawn prompt must explicitly request justification regeneration
  - "Abort"

### 8.8. Plan Checker (if enabled)

If `plan_checker_enabled`:

```
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  description="Verify Feature {CAPABILITY_SLUG}/{FEATURE_SLUG} plans"
)
```

### 8.9. Handle Checker Findings

Checker findings are surfaced to the user via AskUserQuestion. Format:

Group findings by severity before presenting:
- **Blockers** (must resolve before execution): present first, one per AskUserQuestion
- **Warnings** (should resolve, can override): present second
- **Info** (informational, no action required): present as a batch summary, not individual Q&As

For each blocker or warning:
- header: "Checker Finding {N}/{total} [{severity}]"
- question: "[{category}] {description}\n\nSuggestion: {suggestion}\nAffected REQs: {reqs_affected}\n\nJustification cross-reference: {if checker finding references the same REQ IDs as a Justification claim, cite that claim for context; else omit}"
- options:
  - "Accept suggestion"
  - "Edit"
  - "Provide guidance"
  - "Dismiss"

No auto-re-spawn on checker issues. If guidance given: re-spawn planner, back to 8.8 for re-check. Repeat until user approves or max 3 checker cycles reached.

## 12. Present Final Status

```
GSD > FEATURE {FEATURE_SLUG} PLANNED

**Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}** -- {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01, 02 | [objectives] |

Research: {Completed | Used existing}
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
