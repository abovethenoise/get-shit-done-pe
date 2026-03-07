---
phase: subagent-delegation/workflow-enforcement
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/coherence-report.md
requirements: [TC-03]
autonomous: true
must_haves:
  truths:
    - "Every command that invokes a delegation-heavy workflow has Task in allowed-tools"
    - "No command file contains inline delegation logic or Task() calls"
    - "No command's process instructions contradict delegation.md patterns"
    - "coherence-report.md @agents/ anti-pattern is fixed with proper Task() delegation"
  artifacts:
    - path: "get-shit-done/workflows/coherence-report.md"
      provides: "Fixed workflow: agent path passed in Task prompt instead of @file loaded by orchestrator"
  key_links:
    - from: "commands/gsd/*.md"
      to: "get-shit-done/workflows/*.md"
      via: "allowed-tools containing Task"
      pattern: "Task"
---

<objective>
Audit all 16 command files for delegation coherence and fix the one known anti-pattern in coherence-report.md.

Purpose: Ensure command files (thin routing layer) do not interfere with delegation patterns. Verify Task is in allowed-tools for delegation-heavy commands. Fix AUDIT-FINDINGS #1 where coherence-report.md loads agent definition via @file instead of passing path in Task prompt.

Output: Audit results documented in summary. coherence-report.md fixed.
</objective>

<execution_context>
@get-shit-done/workflows/execute-plan.md
@get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md
@.planning/capabilities/subagent-delegation/features/workflow-enforcement/AUDIT-FINDINGS.md
@get-shit-done/references/delegation.md

<interfaces>
Command files live at: commands/gsd/*.md (16 files in the repo source tree)

Expected delegation-heavy commands (should have Task in allowed-tools):
- plan.md, execute.md, review.md, doc.md, new.md, enhance.md, debug.md, refactor.md, init.md, refine.md

Expected non-delegation commands (no Task needed):
- discuss-capability.md, discuss-feature.md, focus.md, progress.md, resume-work.md, status.md

TC-03 checks (per FEATURE.md):
1. Task in allowed-tools for every command that invokes a delegation-heavy workflow
2. No command contains inline delegation logic or Task() calls
3. No command's process instructions contradict delegation.md patterns
4. Fix any gaps found

AUDIT-FINDINGS #1 fix (coherence-report.md line 100):
- Current: `@agents/gsd-coherence-synthesizer.md` loads agent def into orchestrator context
- Fix: Remove @file reference, pass agent path in Task prompt instead
- Use pattern: `"First, read {agent_path} for your role.\n\n{assembled_prompt}"`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Command file coherence audit and coherence-report.md anti-pattern fix</name>
  <reqs>TC-03</reqs>
  <files>
    commands/gsd/*.md (read-only audit, 16 files)
    get-shit-done/workflows/coherence-report.md
  </files>
  <action>
  1. AUDIT all 16 command files in commands/gsd/:
     a. For each command file, check if it invokes a workflow that uses delegation (Task() calls):
        - Delegation-heavy commands (should have Task in allowed-tools): plan.md, execute.md, review.md, doc.md, new.md, enhance.md, debug.md, refactor.md, init.md, refine.md
        - Non-delegation commands (no Task needed): discuss-capability.md, discuss-feature.md, focus.md, progress.md, resume-work.md, status.md
     b. For commands invoking delegation-heavy workflows: verify `Task` is in the `allowed-tools` list
     c. For ALL commands: verify no inline delegation logic (model routing rules, Task() calls, spawning instructions)
     d. For ALL commands: verify process instructions do not contradict delegation.md patterns

  2. FIX coherence-report.md (AUDIT-FINDINGS finding #1):
     - Find the line with `@agents/gsd-coherence-synthesizer.md` (approximately line 100)
     - Remove the @file reference that causes the orchestrator to load the agent definition
     - Replace the spawn step with a proper Task() call:
       ```
       Task(
         prompt="First, read agents/gsd-coherence-synthesizer.md for your role.\n\n{assembled_prompt}",
         description="Synthesize coherence recommendations"
       )
       ```
     - This matches the correct pattern used by review.md, plan.md, doc.md

  3. Record audit results in the SUMMARY:
     - List of commands with Task in allowed-tools (expected: 10)
     - List of commands without Task (expected: 6 conversational/status commands)
     - Any gaps or contradictions found
     - Fix applied to coherence-report.md
  </action>
  <verify>
    <automated>cd /Users/philliphall/get-shit-done-pe && grep -n '@agents/' get-shit-done/workflows/coherence-report.md || echo "PASS: no @agents/ reference in coherence-report.md"</automated>
  </verify>
  <done>All 16 command files audited. Commands invoking delegation-heavy workflows have Task in allowed-tools. No command contains inline delegation logic or contradicts delegation.md. coherence-report.md @agents/ anti-pattern replaced with correct Task() delegation pattern.</done>
</task>

</tasks>

<verification>
1. `grep -rn '@agents/' get-shit-done/workflows/coherence-report.md` returns zero matches
2. Audit confirms all 10 delegation-heavy commands have Task in allowed-tools
3. No command file contains Task() calls or inline model routing rules
</verification>

<success_criteria>
- 16 command files audited with zero delegation coherence issues (TC-03)
- coherence-report.md anti-pattern fixed (AUDIT-FINDINGS #1)
- No command contradicts delegation.md patterns
</success_criteria>

<output>
After completion, create `.planning/capabilities/subagent-delegation/features/workflow-enforcement/02-SUMMARY.md`
</output>
