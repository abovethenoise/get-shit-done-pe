---
phase: subagent-delegation/delegation-patterns
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/references/delegation.md
  - get-shit-done/references/model-profiles.md
  - get-shit-done/references/model-profile-resolution.md
  - get-shit-done/workflows/gather-synthesize.md
autonomous: true
requirements: [EU-01, FN-01, FN-02, FN-03, TC-01]

must_haves:
  truths:
    - "A single delegation.md exists in get-shit-done/references/"
    - "delegation.md defines model routing rules (executor=sonnet, judge=inherit, quick=haiku)"
    - "delegation.md defines gather-synthesize shape (N parallel gatherers + 1 synthesizer)"
    - "delegation.md defines single delegation shape (1 scoped subagent)"
    - "delegation.md is strictly fewer than 337 lines"
    - "model-profiles.md and model-profile-resolution.md are deleted"
    - "gather-synthesize.md is reduced to a stub pointing to delegation.md"
    - "4 existing @file references to gather-synthesize.md do not break"
  artifacts:
    - path: "get-shit-done/references/delegation.md"
      provides: "Consolidated delegation reference: model routing, gather-synthesize shape, single delegation shape, when-to-delegate heuristics"
    - path: "get-shit-done/workflows/gather-synthesize.md"
      provides: "Stub file preserving @file reference targets, pointing readers to delegation.md for patterns and containing only the context assembly process steps"
  key_links:
    - from: "get-shit-done/workflows/review.md"
      to: "get-shit-done/workflows/gather-synthesize.md"
      via: "@file reference on line 6"
      pattern: "@.*gather-synthesize"
    - from: "get-shit-done/workflows/doc.md"
      to: "get-shit-done/workflows/gather-synthesize.md"
      via: "@file reference on line 6"
      pattern: "@.*gather-synthesize"
    - from: "commands/gsd/init.md"
      to: "get-shit-done/workflows/gather-synthesize.md"
      via: "@file reference on line 38"
      pattern: "@.*gather-synthesize"
    - from: "get-shit-done/workflows/init-project.md"
      to: "get-shit-done/workflows/gather-synthesize.md"
      via: "inline reference on line 350"
      pattern: "gather-synthesize"
---

<objective>
Create the consolidated delegation reference doc and clean up source docs.

Purpose: Replace 3 overlapping delegation docs (337 lines total) with a single, AI-optimized delegation.md (<150 lines target) that front-loads imperative routing rules and uses XML-tagged sections for AI attention.

Output: delegation.md created, model-profiles.md and model-profile-resolution.md deleted, gather-synthesize.md reduced to stub.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/capabilities/subagent-delegation/CAPABILITY.md
@.planning/capabilities/subagent-delegation/features/delegation-patterns/FEATURE.md
@.planning/capabilities/subagent-delegation/features/delegation-patterns/RESEARCH.md

<interfaces>
Source docs to consolidate:
- get-shit-done/references/model-profiles.md (79 lines) -- role map, v1/v2 tables, overrides, profile switching
- get-shit-done/references/model-profile-resolution.md (46 lines) -- resolution flow, v1 fallback
- get-shit-done/workflows/gather-synthesize.md (212 lines) -- gather-synthesize pattern with context assembly

Active @file references to gather-synthesize.md (4 total, must not break):
- get-shit-done/workflows/review.md:6
- get-shit-done/workflows/doc.md:6
- commands/gsd/init.md:38
- get-shit-done/workflows/init-project.md:350

No active @file references to model-profiles.md or model-profile-resolution.md (safe to delete).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create consolidated delegation.md reference doc</name>
  <reqs>EU-01, FN-01, FN-02, FN-03</reqs>
  <files>get-shit-done/references/delegation.md</files>
  <action>
  Create get-shit-done/references/delegation.md as a single consolidated delegation reference. Target under 150 lines.

  Structure the doc with XML-tagged sections and imperative framing (commands, not descriptions). Include:

  1. **Model routing table** (from model-profiles.md v2 section):
     - executor -> model: sonnet (gatherers, planners, executors, doc writers, reviewers)
     - judge -> model: inherit (synthesizers, checkers, verifiers)
     - quick -> model: haiku (slug resolution, timestamps)
     - "opus" is valid but use "inherit" for flexibility
     - Note: Claude Code reads `model` from agent YAML frontmatter natively

  2. **Gather-synthesize delegation shape** (from gather-synthesize.md, delegation parts only):
     - Pattern: spawn N gatherers in parallel (model=sonnet) -> wait all -> retry failed once -> abort if >50% fail -> spawn 1 synthesizer (model=inherit)
     - Used by: research (6 gatherers), review (4 gatherers), doc (6 explorers)
     - Flat delegation only -- subagents cannot spawn subagents
     - Include a concise Task() call example

  3. **Single delegation shape** (new, extracted from execute-plan.md patterns):
     - Pattern: spawn 1 subagent for scoped task -> orchestrator waits -> processes result
     - Used by: plan execution (executor), verification (verifier), plan checking (checker)
     - Include a concise Task() call example

  4. **When-to-delegate heuristics**:
     - Delegate: parallel independent analysis, scoped execution, mechanical verification
     - Do NOT delegate: user Q&A, synthesis/judgment, orchestration decisions

  5. **Anti-patterns** section:
     - "Orchestrators MUST NOT read agent definition files. Agent definitions are for the subagent, not the orchestrator. Include 'First, read {agent_path} for your role.' in the subagent's prompt. If the orchestrator reads agent definitions, it absorbs enough context to handle the task inline — defeating delegation."
     - "Do not pass content between agents — pass file PATHS. Agents read files in their own context."

  DO NOT include:
  - Context assembly layers (Layers 0-4) -- these are workflow-owned, stay in gather-synthesize.md
  - v1 profile tables, per-agent overrides, profile switching
  - v1 resolveModelInternal() or resolveModelFromRole() implementation details

  Use imperative framing throughout ("Spawn gatherers with model=sonnet", not "Gatherers should be spawned").
  Use XML tags for major sections (<model_routing>, <gather_synthesize>, <single_delegation>, <when_to_delegate>, <anti_patterns>).
  </action>
  <verify>
    <automated>wc -l get-shit-done/references/delegation.md | awk '{if ($1 < 150) print "PASS: "$1" lines"; else print "FAIL: "$1" lines (target <150)"}'</automated>
  </verify>
  <done>delegation.md exists in get-shit-done/references/, is under 150 lines, contains all 5 sections (model routing, gather-synthesize shape, single delegation shape, when-to-delegate, anti-patterns)</done>
</task>

<task type="auto">
  <name>Delete source docs and reduce gather-synthesize.md to stub</name>
  <reqs>TC-01</reqs>
  <files>
    get-shit-done/references/model-profiles.md
    get-shit-done/references/model-profile-resolution.md
    get-shit-done/workflows/gather-synthesize.md
  </files>
  <action>
  1. Delete get-shit-done/references/model-profiles.md (79 lines, no @file refs).
  2. Delete get-shit-done/references/model-profile-resolution.md (46 lines, no @file refs).
  3. Rewrite get-shit-done/workflows/gather-synthesize.md as a stub that:
     - Keeps the file at its current path (preserving 4 @file references)
     - Opens with a brief note: "Delegation patterns (model routing, shapes, heuristics) are in @{GSD_ROOT}/get-shit-done/references/delegation.md"
     - Retains ONLY the context assembly process (Layers 0-4, Steps 1) from the current file -- this is workflow-owned orchestration process, not delegation pattern
     - Removes the gather/synthesize/failure/completion steps (now in delegation.md)
     - Removes key_constraints and reuse_examples sections
     - Target: under 80 lines (down from 212)

  Verify net line reduction:
  - Before: model-profiles.md (79) + model-profile-resolution.md (46) + gather-synthesize.md (212) = 337 lines
  - After: delegation.md (<150) + gather-synthesize.md stub (<80) = <230 lines
  - Net reduction: at least 107 lines
  </action>
  <verify>
    <automated>echo "=== Deleted files ===" && test ! -f get-shit-done/references/model-profiles.md && echo "model-profiles.md: DELETED" && test ! -f get-shit-done/references/model-profile-resolution.md && echo "model-profile-resolution.md: DELETED" && echo "=== Stub size ===" && wc -l get-shit-done/workflows/gather-synthesize.md && echo "=== New doc size ===" && wc -l get-shit-done/references/delegation.md && echo "=== Net line count ===" && STUB=$(wc -l < get-shit-done/workflows/gather-synthesize.md) && NEW=$(wc -l < get-shit-done/references/delegation.md) && TOTAL=$((STUB + NEW)) && echo "New total: $TOTAL (was 337, reduction: $((337 - TOTAL)))"</automated>
  </verify>
  <done>model-profiles.md and model-profile-resolution.md are deleted. gather-synthesize.md is a stub under 80 lines containing only context assembly. Combined new line count (delegation.md + stub) is strictly less than 337.</done>
</task>

<task type="auto">
  <name>Audit workflows for orchestrator-reads-agent-definition anti-pattern</name>
  <reqs>EU-01</reqs>
  <files>.planning/capabilities/subagent-delegation/features/workflow-enforcement/AUDIT-FINDINGS.md</files>
  <action>
  Scan all workflow .md files in get-shit-done/workflows/ for instances where the orchestrator is instructed to read agent definition files (e.g., "Read {agent}.md", "@agents/gsd-*.md" in required_reading sections, or any instruction that has the orchestrator consuming agent definitions before spawning).

  The correct pattern is: orchestrator passes "First, read {agent_path} for your role." in the subagent prompt. The orchestrator itself should NOT read agent definitions.

  Write findings to .planning/capabilities/subagent-delegation/features/workflow-enforcement/AUDIT-FINDINGS.md with:
  - Each workflow file that has the anti-pattern
  - Line number and current instruction
  - Recommended fix (move the read to the subagent prompt)

  This is a READ-ONLY audit — do not modify any workflow files (that's workflow-enforcement scope).
  </action>
  <verify>
    <automated>test -f .planning/capabilities/subagent-delegation/features/workflow-enforcement/AUDIT-FINDINGS.md && echo "PASS: Audit findings written" || echo "FAIL: No audit findings file"</automated>
  </verify>
  <done>Audit findings file exists with per-workflow anti-pattern instances documented for the workflow-enforcement feature.</done>
</task>

</tasks>

<verification>
1. delegation.md exists and is under 150 lines
2. delegation.md contains model routing, gather-synthesize shape, single delegation shape, when-to-delegate sections
3. model-profiles.md is deleted
4. model-profile-resolution.md is deleted
5. gather-synthesize.md is a stub under 80 lines
6. Combined line count (delegation.md + gather-synthesize stub) < 337
7. grep for @file references confirms gather-synthesize.md still exists at expected path
</verification>

<success_criteria>
- Single delegation.md consolidates all delegation knowledge from 3 source docs
- Net line reduction of at least 100 lines across all modified/created/deleted files
- No @file references broken (gather-synthesize.md stub preserves path)
- No v1 deprecated content in new docs
</success_criteria>

<output>
After completion, create `.planning/capabilities/subagent-delegation/features/delegation-patterns/01-SUMMARY.md`
</output>
