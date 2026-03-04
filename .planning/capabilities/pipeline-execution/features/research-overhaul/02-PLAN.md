---
phase: research-overhaul
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - get-shit-done/workflows/framing-pipeline.md
autonomous: true
requirements: [EU-02, FN-02, TC-01, TC-02]
must_haves:
  truths:
    - "framing-pipeline.md Stage 1 contains 6+1 explicit Task() blocks matching the plan.md Step 5 pattern"
    - "framing-pipeline.md Stage 1 embeds lens/framing context in each gatherer prompt"
    - "No @workflow.md delegation remains in framing-pipeline.md Stage 1"
    - "When framing-pipeline runs research then hands off to plan.md (Stage 3), plan.md reuses the existing RESEARCH.md via the lens-aware check (no double-research)"
  artifacts:
    - path: "get-shit-done/workflows/framing-pipeline.md"
      provides: "Rewritten Stage 1 (Section 2) with explicit Task() spawns matching plan.md Step 5 pattern"
  key_links:
    - from: "framing-pipeline.md Stage 1 synthesizer Task()"
      to: "RESEARCH.md frontmatter"
      via: "Same frontmatter instruction as plan.md Step 5 synthesizer prompt"
      pattern: "lens/secondary_lens/subject/date written to RESEARCH.md header"
    - from: "framing-pipeline.md Stage 3 plan.md invocation"
      to: "plan.md Step 5 lens-aware reuse"
      via: "RESEARCH.md frontmatter lens match prevents double-research"
      pattern: "framing-pipeline writes RESEARCH.md with correct lens; plan.md reads and matches"
---

<objective>
Rewrite framing-pipeline.md Stage 1 (Section 2) to replace the `@research-workflow.md` delegation with the same 6+1 explicit Task() pattern established in plan.md Step 5, embedding framing context in each gatherer prompt.

Purpose: framing-pipeline.md Stage 1 uses the identical anti-pattern as plan.md Step 5 — bare @workflow.md delegation that the model interprets as "read the file" rather than "spawn 6 agents in parallel." The fix is the same fix: explicit Task() blocks. By using the same RESEARCH.md frontmatter (written by the synthesizer), the lens-aware reuse logic in plan.md Step 5 prevents double-research when framing-pipeline Stage 3 invokes plan.md.

Output: Modified get-shit-done/workflows/framing-pipeline.md with corrected Stage 1.
</objective>

<execution_context>
@get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/capabilities/pipeline-execution/features/research-overhaul/FEATURE.md
@.planning/capabilities/pipeline-execution/features/research-overhaul/RESEARCH.md
@.planning/capabilities/pipeline-execution/features/research-overhaul/01-SUMMARY.md

<interfaces>
<!-- Task() block pattern — established in plan.md Step 5 (Plan 01). Identical pattern applies here. -->
<!-- Gatherer agent slugs, model parameters, and output paths are identical to plan.md Step 5. -->
<!-- Only difference: framing_context block is richer (includes LENS_METADATA fields from Section 1) -->

<!-- Current framing-pipeline.md Stage 1 delegation (Section 2, lines ~83-106) — the bug: -->
Invoke the research workflow directly, passing framing context:
```
@{GSD_ROOT}/get-shit-done/workflows/research-workflow.md
```
Pass: subject, context_paths, output_dir, capability_path, feature_path, framing_context...
The research workflow spawns 6 gatherers in parallel via gather-synthesize...

<!-- framing-pipeline.md inputs available in Stage 1 context: -->
BRIEF_PATH, LENS, SECONDARY_LENS, CAPABILITY_SLUG, CAPABILITY_NAME, FEATURE_SLUG, FEATURE_DIR
LENS_METADATA.direction, LENS_METADATA.tone, ANCHOR_QUESTIONS_PATH
Lens-specific focus (one of: debug/new/enhance/refactor bullet from Section 2 header)

<!-- RESEARCH.md frontmatter schema (same as plan.md Step 5 output): -->
---
lens: {primary_lens}
secondary_lens: {secondary_lens or "null"}
subject: {subject}
date: {ISO date}
---
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Replace framing-pipeline.md Stage 1 delegation with explicit Task() blocks</name>
  <reqs>FN-02, TC-01, TC-02</reqs>
  <files>get-shit-done/workflows/framing-pipeline.md</files>
  <action>
  Read framing-pipeline.md in full first. Locate Section 2 (Stage 1 -- Research). Replace everything from "Invoke the research workflow directly" through the closing "If clean: proceed to Stage 2" block. Preserve the lens-aware research behavior bullets at the top of Section 2 (the /debug, /new, /enhance, /refactor focus list) — only replace the delegation block and the "After research completes" handling.

  Replace the delegation block (from "Invoke the research workflow directly" through "The research workflow spawns 6 gatherers...") with:

  ```markdown
  **Spawn research gatherers:**

  Assemble context payload (read each path, embed content):
  ```
  <core_context>{contents of PROJECT.md, STATE.md, ROADMAP.md}</core_context>
  <capability_context>{contents of CAPABILITY.md}</capability_context>
  <feature_context>{contents of FEATURE.md}</feature_context>
  <framing_context>
  Lens: {LENS}
  Secondary lens: {SECONDARY_LENS or null}
  Lens direction: {LENS_METADATA.direction}
  Lens tone: {LENS_METADATA.tone}
  Research focus: {lens-specific focus from above}
  Brief path: {BRIEF_PATH}
  Anchor questions: {ANCHOR_QUESTIONS_PATH}
  </framing_context>
  ```

  Spawn all 6 gatherers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):

  ```
  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-domain.md for your role.\n\n<subject>{CAPABILITY_NAME}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Domain Truth\nWrite your complete analysis to: {FEATURE_DIR}/research/domain-truth-findings.md</task_context>",
    subagent_type="gsd-research-domain",
    model="sonnet",
    description="Research Domain Truth for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-system.md for your role.\n\n<subject>{CAPABILITY_NAME}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Existing System\nWrite your complete analysis to: {FEATURE_DIR}/research/existing-system-findings.md</task_context>",
    subagent_type="gsd-research-system",
    model="sonnet",
    description="Research Existing System for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-intent.md for your role.\n\n<subject>{CAPABILITY_NAME}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: User Intent\nWrite your complete analysis to: {FEATURE_DIR}/research/user-intent-findings.md</task_context>",
    subagent_type="gsd-research-intent",
    model="sonnet",
    description="Research User Intent for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-tech.md for your role.\n\n<subject>{CAPABILITY_NAME}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Tech Constraints\nWrite your complete analysis to: {FEATURE_DIR}/research/tech-constraints-findings.md</task_context>",
    subagent_type="gsd-research-tech",
    model="sonnet",
    description="Research Tech Constraints for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-edges.md for your role.\n\n<subject>{CAPABILITY_NAME}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Edge Cases\nWrite your complete analysis to: {FEATURE_DIR}/research/edge-cases-findings.md</task_context>",
    subagent_type="gsd-research-edges",
    model="sonnet",
    description="Research Edge Cases for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-prior-art.md for your role.\n\n<subject>{CAPABILITY_NAME}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Prior Art\nWrite your complete analysis to: {FEATURE_DIR}/research/prior-art-findings.md</task_context>",
    subagent_type="gsd-research-prior-art",
    model="sonnet",
    description="Research Prior Art for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )
  ```

  Wait for ALL 6 gatherers to complete. Check each output file exists and is non-empty:
  ```bash
  for f in domain-truth existing-system user-intent tech-constraints edge-cases prior-art; do
    test -f "${FEATURE_DIR}/research/${f}-findings.md" && test -s "${FEATURE_DIR}/research/${f}-findings.md" && echo "${f}: OK" || echo "${f}: FAILED"
  done
  ```

  For any failed gatherer: retry once with the same Task() prompt. If still failed: mark as failed in manifest.

  If more than 3 gatherers failed: surface escalation (MAJOR tier per escalation-protocol.md). Do NOT continue to synthesizer.

  **Spawn synthesizer:**

  Build manifest listing each dimension path and status.

  ```
  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-research-synthesizer.md for your role.\n\n<subject>{CAPABILITY_NAME}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Gather phase complete. Synthesize the following gatherer outputs into a consolidated RESEARCH.md.\n\nGatherer outputs:\n- Domain Truth: {FEATURE_DIR}/research/domain-truth-findings.md [{status}]\n- Existing System: {FEATURE_DIR}/research/existing-system-findings.md [{status}]\n- User Intent: {FEATURE_DIR}/research/user-intent-findings.md [{status}]\n- Tech Constraints: {FEATURE_DIR}/research/tech-constraints-findings.md [{status}]\n- Edge Cases: {FEATURE_DIR}/research/edge-cases-findings.md [{status}]\n- Prior Art: {FEATURE_DIR}/research/prior-art-findings.md [{status}]\n\nWrite your synthesis to: {FEATURE_DIR}/RESEARCH.md\n\nIMPORTANT: Begin RESEARCH.md with YAML frontmatter:\n---\nlens: {LENS}\nsecondary_lens: {SECONDARY_LENS or null}\nsubject: {CAPABILITY_NAME}/{FEATURE_SLUG}\ndate: {ISO date today}\n---\n\nIf any gatherer has status \"failed\", document the gap — do not fabricate content for missing dimensions.</task_context>",
    subagent_type="gsd-research-synthesizer",
    model="inherit",
    description="Synthesize Research for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )
  ```
  ```

  After inserting the replacement block, update the "After research completes" section directly below:
  - Keep: "Check for escalation signals in research output (see escalation-protocol.md)"
  - Keep: "If escalation: handle per Section 8 (Escalation Handling) below"
  - Keep: "If clean: proceed to Stage 2"
  - Remove any reference to "research workflow spawns" or delegation language

  Do not modify any other section of framing-pipeline.md.
  </action>
  <verify>
    <automated>grep -n "Invoke\|@.*research-workflow\|research workflow spawns" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md</automated>
  </verify>
  <done>
  - grep returns zero matches for "Invoke", "@.*research-workflow", "research workflow spawns" in framing-pipeline.md
  - framing-pipeline.md Section 2 contains "Task(" at least 7 times (6 gatherers + 1 synthesizer)
  - framing-pipeline.md synthesizer Task() prompt contains the RESEARCH.md frontmatter instruction with lens/secondary_lens/subject/date fields
  - framing-pipeline.md lens-specific focus bullets (/debug, /new, /enhance, /refactor) remain intact above the spawn block
  </done>
</task>

</tasks>

<verification>
After task completes:
1. grep -c "Task(" get-shit-done/workflows/framing-pipeline.md -- should return >= 7 (all in Stage 1)
2. grep -n "research-workflow\|Invoke" get-shit-done/workflows/framing-pipeline.md -- zero matches for delegation pattern
3. grep -n "gsd-research-synthesizer" get-shit-done/workflows/framing-pipeline.md -- present in Stage 1
4. grep -n "secondary_lens\|lens:" get-shit-done/workflows/framing-pipeline.md -- frontmatter instruction present in synthesizer prompt
5. Cross-check: framing-pipeline.md Stage 3 still invokes plan.md via @{GSD_ROOT}/get-shit-done/workflows/plan.md (sequential handoff, not a bug — leave as-is per TC-04 category 2 classification)
</verification>

<success_criteria>
- framing-pipeline.md Stage 1 has zero @workflow.md delegation for research spawning
- framing-pipeline.md Stage 1 has 6 gatherer Task() blocks and 1 synthesizer Task() block
- All 7 Task() blocks use model="sonnet" for gatherers, model="inherit" for synthesizer
- Synthesizer Task() prompt includes frontmatter instruction with lens/secondary_lens/subject/date
- Framing context (LENS, SECONDARY_LENS, direction, tone, focus, BRIEF_PATH, ANCHOR_QUESTIONS_PATH) is embedded in context_payload for each gatherer
- Stage 3 @plan.md sequential handoff is unchanged (correct usage per TC-04 category 2)
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/research-overhaul/02-SUMMARY.md`
</output>
