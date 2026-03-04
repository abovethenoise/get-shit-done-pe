---
phase: research-overhaul
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/plan.md
autonomous: true
requirements: [EU-01, FN-01, FN-03, FN-04, TC-01, TC-02, TC-03]
must_haves:
  truths:
    - "plan.md Step 5 contains 6 explicit Task() blocks (one per gatherer) plus a 7th for the synthesizer — no @workflow.md delegation remains"
    - "plan.md has no --skip-research flag, no research_enabled gate, and no skip branch in the failure path"
    - "plan.md Step 5 checks RESEARCH.md frontmatter lens fields before deciding to run or reuse research"
    - "The synthesizer Task() prompt instructs it to write YAML frontmatter (lens, secondary_lens, subject, date) to RESEARCH.md"
  artifacts:
    - path: "get-shit-done/workflows/plan.md"
      provides: "Rewritten Step 5 with explicit Task() spawns, lens-aware reuse, and mandatory research"
  key_links:
    - from: "plan.md Step 5 lens-aware reuse check"
      to: "RESEARCH.md YAML frontmatter"
      via: "Read RESEARCH.md header, extract lens field, compare to current LENS variable"
      pattern: "read frontmatter lens from RESEARCH.md, compare lens tuple (primary + secondary)"
    - from: "plan.md Step 5 synthesizer Task()"
      to: "RESEARCH.md frontmatter output"
      via: "Synthesizer prompt instruction to write lens/secondary_lens/subject/date fields"
      pattern: "Task() prompt contains explicit frontmatter schema instruction"
---

<objective>
Rewrite plan.md Step 5 to replace ambiguous @workflow.md delegation with 6+1 explicit Task() blocks, remove all skip gates, and implement lens-aware research reuse via RESEARCH.md frontmatter comparison.

Purpose: The model currently interprets "Invoke @research-workflow.md" as delegation (reads the file, then shortcuts the gather spawn). Explicit Task() pseudo-code — identical to the pattern already used in Step 7 — eliminates this ambiguity. Skip gates signal optionality; removing them makes research structurally mandatory. Lens-aware reuse prevents double-research in the framing-pipeline -> plan.md chain.

Output: Modified get-shit-done/workflows/plan.md with corrected Step 5.
</objective>

<execution_context>
@get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/capabilities/pipeline-execution/CAPABILITY.md
@.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md
@.planning/capabilities/pipeline-execution/features/research-overhaul/RESEARCH.md

<interfaces>
<!-- Task() block pattern (established in plan.md Step 7 and execute.md) -->
Task(
  prompt="First, read {agent_path} for your role.\n\n<subject>{subject}</subject>\n\n{context_payload}\n\n<task_context>Dimension: {dimension_name}\nWrite to: {output_path}</task_context>",
  subagent_type="{agent_slug}",
  model="sonnet",
  description="{description}"
)

<!-- Gatherer agent slugs (from research-workflow.md) -->
gsd-research-domain    -> agents/gsd-research-domain.md    -> research/domain-truth-findings.md
gsd-research-system    -> agents/gsd-research-system.md    -> research/existing-system-findings.md
gsd-research-intent    -> agents/gsd-research-intent.md    -> research/user-intent-findings.md
gsd-research-tech      -> agents/gsd-research-tech.md      -> research/tech-constraints-findings.md
gsd-research-edges     -> agents/gsd-research-edges.md     -> research/edge-cases-findings.md
gsd-research-prior-art -> agents/gsd-research-prior-art.md -> research/prior-art-findings.md
gsd-research-synthesizer -> agents/gsd-research-synthesizer.md -> RESEARCH.md

<!-- gather-synthesize.md Task prompt template (Step 2) -->
"First, read {agent_path} for your role and goal.\n\n<subject>{subject}</subject>\n\n{context_payload}\n\n<task_context>Dimension: {dimension_name}\nWrite your complete analysis to: {output_path}</task_context>"

<!-- RESEARCH.md frontmatter schema (new — introduced by this feature) -->
---
lens: {primary_lens}
secondary_lens: {secondary_lens or "null"}
subject: {subject}
date: {ISO date}
---

<!-- Current plan.md Step 5 (the bug) — line 57-62 -->
**Skip if:** `--skip-research` flag, or `research_enabled` is false without `--research` override.
**If `has_research` AND no `--research` flag:** Use existing, skip to step 6.
**If research needed:** Invoke `@{GSD_ROOT}/get-shit-done/workflows/research-workflow.md` with ...
Handle return: complete/partial -> continue. Failed -> offer: provide context, skip research, abort.

<!-- Current plan.md Step 2 (parse flags — must remove --skip-research) — line 31 -->
Extract flags: `--research`, `--skip-research`, `--skip-verify`.

<!-- Current plan.md Step 1 init JSON fields — research_enabled and has_research must be removed from parse list -->
Parse JSON for: `researcher_model`, ..., `research_enabled`, ..., `has_research`, ...
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Remove skip gates and --skip-research flag from plan.md Steps 1-2</name>
  <reqs>TC-03</reqs>
  <files>get-shit-done/workflows/plan.md</files>
  <action>
  Read plan.md in full first. Then make these targeted edits:

  **Step 1 (Initialize) — line ~25:**
  Remove `research_enabled` and `has_research` from the `Parse JSON for:` list. These fields no longer gate research. Keep all other fields in the parse list unchanged.

  **Step 2 (Parse Arguments) — line ~31:**
  Remove `--skip-research` from the `Extract flags:` line. The line becomes:
  ```
  Extract flags: `--research`, `--skip-verify`.
  ```

  **plan.md success_criteria section — line ~226:**
  Change "Research completed (unless skipped or existing)" to "Research completed (or existing research reused when lens matches)".

  Do not touch any other sections in this task. Step 5 is handled in the next task.
  </action>
  <verify>
    <automated>grep -n "skip-research\|research_enabled\|has_research" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md</automated>
  </verify>
  <done>grep returns zero matches for --skip-research, research_enabled, and has_research in plan.md (these strings no longer appear anywhere in the file)</done>
</task>

<task type="auto">
  <name>Replace Step 5 delegation with explicit Task() blocks and lens-aware reuse logic</name>
  <reqs>FN-01, FN-03, FN-04, TC-01, TC-02</reqs>
  <files>get-shit-done/workflows/plan.md</files>
  <action>
  Replace the entire Step 5 section (currently lines ~55-62) with the following content. The replacement is a complete rewrite of the section — remove everything between "## 5. Handle Research" and "## 6. Check Existing Plans" and insert:

  ```markdown
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

  Spawn all 6 gatherers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):

  ```
  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-domain.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Domain Truth\nWrite your complete analysis to: {feature_dir}/research/domain-truth-findings.md</task_context>",
    subagent_type="gsd-research-domain",
    model="sonnet",
    description="Research Domain Truth for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-system.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Existing System\nWrite your complete analysis to: {feature_dir}/research/existing-system-findings.md</task_context>",
    subagent_type="gsd-research-system",
    model="sonnet",
    description="Research Existing System for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-intent.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: User Intent\nWrite your complete analysis to: {feature_dir}/research/user-intent-findings.md</task_context>",
    subagent_type="gsd-research-intent",
    model="sonnet",
    description="Research User Intent for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-tech.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Tech Constraints\nWrite your complete analysis to: {feature_dir}/research/tech-constraints-findings.md</task_context>",
    subagent_type="gsd-research-tech",
    model="sonnet",
    description="Research Tech Constraints for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-edges.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Edge Cases\nWrite your complete analysis to: {feature_dir}/research/edge-cases-findings.md</task_context>",
    subagent_type="gsd-research-edges",
    model="sonnet",
    description="Research Edge Cases for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-prior-art.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Prior Art\nWrite your complete analysis to: {feature_dir}/research/prior-art-findings.md</task_context>",
    subagent_type="gsd-research-prior-art",
    model="sonnet",
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
    prompt="First, read {GSD_ROOT}/agents/gsd-research-synthesizer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Gather phase complete. Synthesize the following gatherer outputs into a consolidated RESEARCH.md.\n\nGatherer outputs:\n- Domain Truth: {feature_dir}/research/domain-truth-findings.md [{status}]\n- Existing System: {feature_dir}/research/existing-system-findings.md [{status}]\n- User Intent: {feature_dir}/research/user-intent-findings.md [{status}]\n- Tech Constraints: {feature_dir}/research/tech-constraints-findings.md [{status}]\n- Edge Cases: {feature_dir}/research/edge-cases-findings.md [{status}]\n- Prior Art: {feature_dir}/research/prior-art-findings.md [{status}]\n\nWrite your synthesis to: {feature_dir}/RESEARCH.md\n\nIMPORTANT: Begin RESEARCH.md with YAML frontmatter:\n---\nlens: {LENS}\nsecondary_lens: {SECONDARY_LENS or null}\nsubject: {CAPABILITY_SLUG}/{FEATURE_SLUG}\ndate: {ISO date today}\n---\n\nIf any gatherer has status \"failed\", document the gap — do not fabricate content for missing dimensions.</task_context>",
    subagent_type="gsd-research-synthesizer",
    model="inherit",
    description="Synthesize Research for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )
  ```

  **Handle research failure:**
  If research fails (aborted due to too many gatherer failures):
  Present options to user via AskUserQuestion:
  - "Provide context directly" — user supplies key facts; proceed to planning with user-provided context
  - "Abort" — stop planning workflow

  Do NOT offer "skip research" as an option.
  ```
  </action>
  <verify>
    <automated>grep -n "Invoke\|@.*research-workflow\|skip-research\|skip research\|research_enabled\|has_research" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md</automated>
  </verify>
  <done>
  - grep returns zero matches for "Invoke", "@.*research-workflow", "skip-research", "skip research", "research_enabled", "has_research" in plan.md
  - plan.md Step 5 contains the text "Task(" at least 7 times (6 gatherers + 1 synthesizer)
  - plan.md Step 5 contains "gsd-research-synthesizer" and YAML frontmatter instruction with lens/secondary_lens/subject/date fields
  - plan.md Step 5 contains lens-aware reuse logic with frontmatter read and comparison
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. grep -c "Task(" get-shit-done/workflows/plan.md -- should return >= 9 (7 research + 2 existing from Steps 7 and 8.7)
2. grep -n "skip" get-shit-done/workflows/plan.md -- no research-skip references remain
3. grep -n "lens" get-shit-done/workflows/plan.md -- lens-aware reuse logic and frontmatter instruction both present
4. grep -n "research_enabled\|has_research\|--skip-research" get-shit-done/workflows/plan.md -- zero matches
5. Read Step 5 in full and confirm: 6 gatherer Task() blocks, 1 synthesizer Task() block, lens reuse check at top, frontmatter instruction in synthesizer prompt, failure path offers "provide context" or "abort" only
</verification>

<success_criteria>
- plan.md Step 5 has zero @workflow.md delegation for research spawning
- plan.md has zero skip gates (--skip-research, research_enabled gate)
- plan.md Step 5 lens-aware reuse: reads RESEARCH.md frontmatter, compares lens tuple, reuses on match
- plan.md synthesizer Task() instructs writing lens/secondary_lens/subject/date frontmatter to RESEARCH.md
- plan.md failure path: "provide context" and "abort" only — no "skip research" option
- All 7 Task() blocks use correct model parameter: "sonnet" for gatherers, "inherit" for synthesizer
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/research-overhaul/01-SUMMARY.md`
</output>
