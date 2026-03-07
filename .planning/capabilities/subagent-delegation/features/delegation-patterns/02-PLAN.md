---
phase: subagent-delegation/delegation-patterns
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - agents/gsd-research-synthesizer.md
  - agents/gsd-research-prior-art.md
  - agents/gsd-plan-checker.md
  - agents/gsd-research-edges.md
  - agents/gsd-review-synthesizer.md
  - agents/gsd-research-domain.md
  - agents/gsd-executor.md
  - agents/gsd-verifier.md
  - agents/gsd-research-system.md
  - agents/gsd-research-tech.md
  - agents/gsd-research-intent.md
  - agents/gsd-coherence-synthesizer.md
  - agents/gsd-review-enduser.md
  - agents/gsd-review-functional.md
  - agents/gsd-review-technical.md
  - agents/gsd-review-quality.md
  - agents/gsd-planner.md
  - agents/gsd-doc-writer.md
  - agents/gsd-doc-explorer.md
  - agents/gsd-doc-synthesizer.md
autonomous: true
requirements: [TC-02]

must_haves:
  truths:
    - "All 20 agent files have a model field in YAML frontmatter"
    - "Executor agents have model: sonnet"
    - "Judge agents have model: inherit"
    - "No agent has model: opus (use inherit instead)"
    - "Existing role_type field is preserved unchanged"
  artifacts:
    - path: "agents/*.md"
      provides: "Agent definitions with model field added to YAML frontmatter for Claude Code native model routing"
  key_links:
    - from: "agents/*.md (model field)"
      to: "Claude Code Agent tool"
      via: "Claude Code reads model from agent YAML frontmatter at spawn time"
      pattern: "^model:"
---

<objective>
Add model field to all 20 agent YAML frontmatter files for Claude Code native model routing.

Purpose: Claude Code reads `model:` from agent frontmatter natively. Adding this field moves model enforcement from "instruction the AI must follow" to "configuration Claude Code enforces" -- collapsing a 3-step resolution chain to 1 step.

Output: All 20 agent files updated with correct model field.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/subagent-delegation/features/delegation-patterns/FEATURE.md
@.planning/capabilities/subagent-delegation/features/delegation-patterns/RESEARCH.md

<interfaces>
Current agent frontmatter state (all 20 files have role_type, none have model):

Executor agents (role_type: executor -> add model: sonnet):
- gsd-doc-explorer.md
- gsd-doc-writer.md
- gsd-executor.md
- gsd-planner.md (NOTE: role_type is "judge" per file, but research says planner IS an executor -- model-profiles.md line 29 agrees. However, the agent FILE is source of truth. Keep role_type: judge, set model: sonnet because planners are spawned with model=sonnet in plan.md)
- gsd-research-domain.md
- gsd-research-edges.md
- gsd-research-intent.md
- gsd-research-prior-art.md
- gsd-research-system.md
- gsd-research-tech.md
- gsd-review-enduser.md
- gsd-review-functional.md
- gsd-review-quality.md
- gsd-review-technical.md

Judge agents (role_type: judge -> add model: inherit):
- gsd-coherence-synthesizer.md
- gsd-doc-synthesizer.md
- gsd-plan-checker.md
- gsd-research-synthesizer.md
- gsd-review-synthesizer.md
- gsd-verifier.md

No quick agents exist currently (no role_type: quick in any file).

IMPORTANT: gsd-planner.md has role_type: judge but is spawned as a sonnet executor in workflows.
Set model: sonnet on gsd-planner.md to match actual usage (it IS an executor -- it does work, doesn't judge).
Do NOT change role_type -- that would break resolveModelFromRole() which reads it.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Add model field to all 20 agent YAML frontmatter files</name>
  <reqs>TC-02</reqs>
  <files>
    agents/gsd-research-synthesizer.md
    agents/gsd-research-prior-art.md
    agents/gsd-plan-checker.md
    agents/gsd-research-edges.md
    agents/gsd-review-synthesizer.md
    agents/gsd-research-domain.md
    agents/gsd-executor.md
    agents/gsd-verifier.md
    agents/gsd-research-system.md
    agents/gsd-research-tech.md
    agents/gsd-research-intent.md
    agents/gsd-coherence-synthesizer.md
    agents/gsd-review-enduser.md
    agents/gsd-review-functional.md
    agents/gsd-review-technical.md
    agents/gsd-review-quality.md
    agents/gsd-planner.md
    agents/gsd-doc-writer.md
    agents/gsd-doc-explorer.md
    agents/gsd-doc-synthesizer.md
  </files>
  <action>
  For each of the 20 agent .md files in agents/, add a `model:` field to the YAML frontmatter. Place it on the line immediately after the `role_type:` field.

  Assignment rules:
  - If role_type is "executor" -> add `model: sonnet`
  - If role_type is "judge" -> add `model: inherit`
  - EXCEPTION: gsd-planner.md has role_type: judge but add `model: sonnet` (planner is spawned as executor in workflows)

  Do NOT:
  - Change the existing role_type value
  - Change any other frontmatter fields
  - Modify any content below the frontmatter closing `---`

  The 14 executor agents get model: sonnet:
  gsd-doc-explorer, gsd-doc-writer, gsd-executor, gsd-research-domain,
  gsd-research-edges, gsd-research-intent, gsd-research-prior-art,
  gsd-research-system, gsd-research-tech, gsd-review-enduser,
  gsd-review-functional, gsd-review-quality, gsd-review-technical,
  gsd-planner (override: role_type says judge but actual usage is executor)

  The 6 judge agents get model: inherit:
  gsd-coherence-synthesizer, gsd-doc-synthesizer, gsd-plan-checker,
  gsd-research-synthesizer, gsd-review-synthesizer, gsd-verifier
  </action>
  <verify>
    <automated>echo "=== Model field check ===" && for f in agents/*.md; do NAME=$(basename "$f"); MODEL=$(head -10 "$f" | grep "^model:" | awk '{print $2}'); ROLE=$(head -10 "$f" | grep "^role_type:" | awk '{print $2}'); echo "$NAME: role_type=$ROLE model=$MODEL"; done && echo "=== Counts ===" && echo "sonnet:" $(grep -l "^model: sonnet" agents/*.md | wc -l) && echo "inherit:" $(grep -l "^model: inherit" agents/*.md | wc -l) && echo "total:" $(grep -l "^model:" agents/*.md | wc -l)</automated>
  </verify>
  <done>All 20 agent files have model field in frontmatter. 14 agents have model: sonnet. 6 agents have model: inherit. No agent has model: opus. Existing role_type values unchanged.</done>
</task>

</tasks>

<verification>
1. All 20 agent files contain `model:` in YAML frontmatter
2. 14 executor agents have `model: sonnet`
3. 6 judge agents have `model: inherit`
4. gsd-planner.md has `model: sonnet` (not inherit, despite role_type: judge)
5. No agent file has `model: opus`
6. All existing `role_type` values are unchanged
7. No content below frontmatter `---` is modified in any file
</verification>

<success_criteria>
- 20/20 agent files have model field
- Model assignments match delegation routing rules
- Net line addition: exactly +20 lines (1 line per file) -- offset by deletions in Plan 01
</success_criteria>

<output>
After completion, create `.planning/capabilities/subagent-delegation/features/delegation-patterns/02-SUMMARY.md`
</output>
