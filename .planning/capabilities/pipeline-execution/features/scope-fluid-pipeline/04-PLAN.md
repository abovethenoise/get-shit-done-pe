---
phase: pipeline-execution/scope-fluid-pipeline
plan: 04
type: execute
wave: 3
depends_on: [01, 02, 03]
files_modified:
  - commands/gsd/new.md
  - commands/gsd/enhance.md
  - commands/gsd/debug.md
  - commands/gsd/refactor.md
  - commands/gsd/plan.md
  - commands/gsd/execute.md
  - commands/gsd/doc.md
  - agents/gsd-review-enduser.md
  - agents/gsd-review-functional.md
  - agents/gsd-review-technical.md
  - agents/gsd-review-quality.md
  - agents/gsd-planner.md
  - get-shit-done/templates/codebase/structure.md
  - get-shit-done/workflows/plan.md
autonomous: true
requirements: [FN-09, TC-06, TC-07, TC-08, EU-04]
must_haves:
  truths:
    - "Zero references to capability-orchestrator.md or research-workflow.md in any live source file"
    - "All 18 agents have correct role_type matching their actual function"
    - "All CLI routes pass smoke test (valid JSON, no crashes)"
    - "Net line count across modified files has not increased"
    - "All 13 slash commands fire without error"
  artifacts:
    - path: "commands/gsd/new.md"
      provides: "Updated reference to framing-pipeline.md instead of capability-orchestrator.md"
    - path: "agents/gsd-planner.md"
      provides: "role_type: judge (was executor)"
    - path: "agents/gsd-review-enduser.md"
      provides: "role_type: executor (was judge)"
  key_links:
    - from: "commands/gsd/new.md"
      to: "get-shit-done/workflows/framing-pipeline.md"
      via: "Capability-scope routing"
      pattern: "framing-pipeline"
    - from: "agents/gsd-planner.md"
      to: "lib/core.cjs"
      via: "ROLE_MODEL_MAP: judge -> inherit (Opus)"
      pattern: "role_type.*judge"
---

<objective>
Clean up all references to deleted workflows, fix agent role_type mismatches, verify CLI backward compatibility, and validate net line count constraint.

Purpose: Ensure no orphaned references exist after the refactor, model assignments are correct, and nothing is broken.
Output: Updated command files, agent files, template; verification results.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/FEATURE.md
@.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/RESEARCH.md
@.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/01-SUMMARY.md
@.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/03-SUMMARY.md

<interfaces>
Files referencing capability-orchestrator.md (from grep):
  - commands/gsd/new.md
  - commands/gsd/enhance.md
  - commands/gsd/debug.md
  - commands/gsd/refactor.md
  - commands/gsd/plan.md
  - commands/gsd/execute.md
  - commands/gsd/doc.md
  - get-shit-done/workflows/plan.md (reference only, not invocation)

Files referencing research-workflow.md:
  - get-shit-done/workflows/plan.md
  - get-shit-done/templates/codebase/structure.md
  - get-shit-done/workflows/plan.md

TC-08 role_type corrections:
  4 reviewer agents (judge -> executor): gsd-review-enduser, gsd-review-functional, gsd-review-technical, gsd-review-quality
  1 synthesizer (judge -> stays judge -- synthesizers are judges): gsd-review-synthesizer stays judge
  gsd-planner (executor -> judge): changes model from sonnet to inherit/Opus via resolveModelFromRole

ROLE_MODEL_MAP (core.cjs):
  executor -> sonnet
  judge -> inherit (Opus)
  quick -> haiku

All 18 agents on disk:
  6 research agents (executor, correct)
  4 review agents (should be executor, currently judge)
  1 review synthesizer (judge, correct)
  1 research synthesizer (judge, correct)
  gsd-planner (should be judge)
  gsd-executor (executor, correct)
  gsd-verifier (judge, correct)
  gsd-doc-writer (executor, correct)
  gsd-plan-checker (judge, correct)
  gsd-coherence-synthesizer (judge, correct)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Update all references to deleted workflows, fix agent role_type, verify backward compatibility</name>
  <reqs>FN-09, TC-08, EU-04</reqs>
  <files>commands/gsd/new.md, commands/gsd/enhance.md, commands/gsd/debug.md, commands/gsd/refactor.md, commands/gsd/plan.md, commands/gsd/execute.md, commands/gsd/doc.md, get-shit-done/workflows/plan.md, get-shit-done/templates/codebase/structure.md, agents/gsd-review-enduser.md, agents/gsd-review-functional.md, agents/gsd-review-technical.md, agents/gsd-review-quality.md, agents/gsd-planner.md</files>
  - get-shit-done/workflows/plan.md
  <action>
  **Part A: Update capability-orchestrator.md references**

  For each of these 7 command files, find references to `capability-orchestrator.md` and update them:
  - commands/gsd/new.md
  - commands/gsd/enhance.md
  - commands/gsd/debug.md
  - commands/gsd/refactor.md
  - commands/gsd/plan.md
  - commands/gsd/execute.md
  - commands/gsd/doc.md

  The references will be in routing logic where capability-scope invocations route to the orchestrator. Update these to route to `framing-pipeline.md` instead. framing-pipeline now handles both capability and feature scope (per Plan 01).

  For each file:
  1. Read the file
  2. Find capability-orchestrator references (may be @file refs, routing comments, or invocation paths)
  3. Replace with framing-pipeline.md reference
  4. Verify the routing logic still makes sense (capability scope -> framing-pipeline, feature scope -> framing-pipeline)

  **Part B: Update research-workflow.md references**

  - get-shit-done/workflows/plan.md: Find reference to research-workflow.md. This is likely a comment or @file reference since plan.md already owns research internally. Remove the reference or update comment to note research is internal.
  - get-shit-done/templates/codebase/structure.md: Update architecture description to remove research-workflow.md from the pipeline description.
  - get-shit-done/workflows/plan.md

  **Part C: Fix agent role_type frontmatter**

  Change `role_type: judge` to `role_type: executor` in:
  - agents/gsd-review-enduser.md
  - agents/gsd-review-functional.md
  - agents/gsd-review-technical.md
  - agents/gsd-review-quality.md

  These are reviewer agents that do work (read code, produce trace files). They run on sonnet via model="sonnet" in review.md Task() calls. role_type should match: executor -> sonnet.

  Change `role_type: executor` to `role_type: judge` in:
  - agents/gsd-planner.md

  The planner synthesizes research, makes architectural decisions, and produces plans. It is a judge. This intentionally changes its model resolution from sonnet to inherit (Opus) per TC-08 and model-profiles.md.

  **Do NOT change** gsd-review-synthesizer.md -- it is correctly judge (synthesizers decide/consolidate).

  **Part D: Verify all 18 agents align**

  After changes, verify every agent file's role_type against its actual function:
  - 6 research agents: executor (correct, spawned with model="sonnet")
  - 4 review agents: executor (fixed in Part C)
  - gsd-review-synthesizer: judge (correct)
  - gsd-research-synthesizer: check and fix if needed (should be judge)
  - gsd-planner: judge (fixed in Part C)
  - gsd-plan-checker: judge (correct)
  - gsd-executor: executor (correct)
  - gsd-verifier: judge (correct)
  - gsd-doc-writer: executor (correct)
  - gsd-coherence-synthesizer: judge (correct)

  Also verify every workflow Task() call uses model= consistent with the agent's role_type. Spot-check: review.md reviewer spawns should use model="sonnet", planner spawn in plan.md should use model="inherit".

  **Part E: Backward compatibility spot-check (EU-04)**

  After all reference updates:
  - Verify each command file in commands/gsd/ has valid structure
  - Verify @file references in command files resolve to existing files
  - Verify no command references a deleted workflow
  - Verify feature-scope and capability-scope commands both have valid routing
  </action>
  <verify>
    <automated>grep -rl "capability-orchestrator" commands/ get-shit-done/workflows/ get-shit-done/templates/ agents/ 2>/dev/null | wc -l | xargs test 0 -eq</automated>
    <automated>grep -rl "research-workflow" commands/ get-shit-done/workflows/ get-shit-done/templates/ agents/ 2>/dev/null | wc -l | xargs test 0 -eq</automated>
    <automated>grep "role_type" agents/gsd-review-enduser.md | grep -q "executor"</automated>
    <automated>grep "role_type" agents/gsd-planner.md | grep -q "judge"</automated>
  </verify>
  <done>Zero references to deleted workflows in live source files. All 18 agents have correct role_type. Workflow Task() model= parameters align with role_type. All command files have valid routing to existing workflows.</done>
</task>

<task type="auto">
  <name>CLI smoke test, @file reference scan, and net line count verification</name>
  <reqs>TC-07, TC-06</reqs>
  <files></files>
  <action>
  **Part A: CLI Smoke Test (TC-07)**

  Run every gsd-tools CLI route and verify valid JSON output:
  ```bash
  node bin/gsd-tools.cjs slug-resolve "test" 2>&1 | head -5
  node bin/gsd-tools.cjs init feature-progress 2>&1 | head -5
  node bin/gsd-tools.cjs state-snapshot 2>&1 | head -5
  # ... all other routes
  ```

  Verify:
  - No crashes (exit code != segfault/uncaught)
  - JSON output where expected (valid JSON parse)
  - Error messages are graceful (not stack traces)

  **Part B: @file Reference Scan**

  Scan all live source files for @file references and verify targets exist:
  ```bash
  grep -roh '@{GSD_ROOT}/[^ ]*' commands/ get-shit-done/ agents/ | sort -u
  ```
  For each unique @file path, verify the target file exists on disk (after {GSD_ROOT} -> get-shit-done/ substitution).

  Flag any references to:
  - capability-orchestrator.md (should be zero after Task 1)
  - research-workflow.md (should be zero after Task 1)
  - Any other non-existent file

  **Part C: Net Line Count (TC-06)**

  Count total lines across all files modified by Plans 01-04:
  ```bash
  # Before counts (from git show HEAD:<file>):
  # framing-pipeline.md: 494
  # capability-orchestrator.md: 156 (deleted -> 0)
  # research-workflow.md: 224 (deleted -> 0)
  # execute.md: 216
  # review.md: 193
  # doc.md: 204
  # progress.md: 154
  # commands/gsd/review.md: get count
  # + all other modified files (commands, agents, template)

  # After counts:
  wc -l <each modified file, deleted files count as 0>

  # Calculate: sum(after) <= sum(before)
  ```

  If net line count increased: identify which file grew and whether it can be trimmed. TC-06 is a hard constraint -- total lines across modified files must not increase.

  Report results in SUMMARY.md with before/after table.
  </action>
  <verify>
    <automated>grep -roh '@{GSD_ROOT}/[^ "]*' commands/ get-shit-done/ agents/ 2>/dev/null | sed 's/@{GSD_ROOT}\//get-shit-done\//' | sort -u | while read f; do test -f "$f" || echo "MISSING: $f"; done</automated>
  </verify>
  <done>All CLI routes return valid output (no crashes). All @file references resolve. Net line count across modified files has not increased (TC-06 verified with before/after table).</done>
</task>

</tasks>

<verification>
1. Zero grep hits for "capability-orchestrator" or "research-workflow" in commands/, get-shit-done/, agents/, templates/
2. All 18 agents have role_type matching actual function
3. CLI routes return valid JSON
4. All @file references resolve to existing files
5. Net line count: sum(after) <= sum(before) across all modified files
6. No orphaned references to any deleted file
</verification>

<success_criteria>
- Clean reference sweep: zero orphans
- Correct model assignments: every agent runs on the right model tier
- Backward compatibility: all CLI routes and slash commands work
- TC-06 hard constraint met: no net line increase
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/04-SUMMARY.md`
</output>
