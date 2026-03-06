---
phase: pipeline-execution/scope-fluid-pipeline
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/framing-pipeline.md
  - get-shit-done/workflows/capability-orchestrator.md
  - get-shit-done/workflows/research-workflow.md
autonomous: true
requirements: [FN-04, FN-05, FN-06, TC-01, TC-02, TC-03, TC-04]
must_haves:
  truths:
    - "framing-pipeline.md handles both capability-scope and feature-scope execution"
    - "capability-orchestrator.md and research-workflow.md are deleted"
    - "Pipeline stages are plan -> execute -> review -> doc (no research or requirements stages)"
    - "Capability scope: DAG wave ordering of features for plan+execute, then single review+doc"
    - "Feature scope: linear plan -> execute -> review -> doc"
  artifacts:
    - path: "get-shit-done/workflows/framing-pipeline.md"
      provides: "Consolidated pipeline with scope-detection branch, DAG logic, 4-stage flow"
  key_links:
    - from: "get-shit-done/workflows/framing-pipeline.md"
      to: "get-shit-done/workflows/plan.md"
      via: "Stage 1 invocation (plan already owns research internally)"
      pattern: "workflows/plan.md"
    - from: "get-shit-done/workflows/framing-pipeline.md"
      to: "get-shit-done/workflows/review.md"
      via: "Single review invocation at execution scope"
      pattern: "workflows/review.md"
---

<objective>
Consolidate the pipeline: absorb capability-orchestrator DAG logic into framing-pipeline.md, remove duplicate research stage (Stage 1) and requirements generation stage (Stage 2), remove per-feature review/doc loops, and delete the two absorbed workflow files.

Purpose: Eliminate orchestration duplication and stage duplication. framing-pipeline becomes the single pipeline entry point for both capability and feature scopes.
Output: Rewritten framing-pipeline.md, deleted capability-orchestrator.md and research-workflow.md.
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

<interfaces>
framing-pipeline.md inputs (from framing-discovery.md):
  - BRIEF_PATH, LENS, SECONDARY_LENS, CAPABILITY_SLUG, CAPABILITY_NAME, FEATURE_SLUG, FEATURE_DIR
  - For capability scope: FEATURE_SLUG may be empty/null; CAPABILITY_SLUG is always present

capability-orchestrator.md DAG logic to preserve (lines 32-52):
  - Build DAG from CAPABILITY.md Features table (Feature | Priority | Depends-On | Status)
  - Cycle detection with AskUserQuestion resolution
  - Topological sort into waves
  - Skip features with status "complete"

plan.md already owns research (Step 5, lines 59-166):
  - 6 parallel gatherers + synthesizer
  - Lens-aware RESEARCH.md reuse checking
  - No changes needed to plan.md

Pipeline receives requirements from discuss-feature (FN-05):
  - FEATURE.md EU/FN/TC sections already populated before pipeline runs
  - Pipeline no longer generates requirements
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Rewrite framing-pipeline.md: scope-detection branch + 4-stage flow</name>
  <reqs>FN-06, TC-01, TC-02, TC-03, TC-04</reqs>
  <files>get-shit-done/workflows/framing-pipeline.md</files>
  <action>
  Rewrite framing-pipeline.md with these structural changes:

  1. **Update purpose block**: "Orchestrate the post-discovery pipeline for any scope (capability or feature). Pipeline stages: plan -> execute -> review -> doc."

  2. **Update inputs block**: Add note that FEATURE_SLUG may be null for capability scope. Add SCOPE derived input (capability or feature, determined by whether FEATURE_SLUG is provided).

  3. **Section 1 (Initialize)**: Keep lens metadata loading. Update banner to show "4 stages: plan -> execute -> review -> doc" instead of 6. Add scope detection:
     ```
     SCOPE = if FEATURE_SLUG is provided then "feature" else "capability"
     ```

  4. **Delete current Stage 1 (Research)** entirely (lines 73-178). Research is owned by plan.md Step 5 -- duplicate removal. This is zero-risk per RESEARCH.md consensus.

  5. **Delete current Stage 2 (Requirements Generation)** entirely (lines 180-229). Requirements come from discuss-feature upstream. Pipeline receives pre-written requirements in FEATURE.md.

  6. **Renumber remaining stages**: Stage 3 (Plan) becomes Stage 1. Stage 4 (Execute) becomes Stage 2. Stage 5 (Review) becomes Stage 3. Stage 6 (Doc) becomes Stage 4.

  7. **Add capability-scope branch before Stage 1 (Plan)**: When SCOPE is "capability":
     - Read CAPABILITY.md at `.planning/capabilities/${CAPABILITY_SLUG}/CAPABILITY.md`
     - Extract Features table (Feature | Priority | Depends-On | Status)
     - Build DAG: each feature is a node, each Depends-On creates a directed edge
     - Cycle detection: if cycle found, display "Circular dependency detected: A -> B -> A", use AskUserQuestion to ask which dependency to remove, remove edge, re-validate
     - Topological sort into waves. Skip features with status "complete"
     - For each wave, for each feature (sequentially within wave):
       - Set FEATURE_SLUG, FEATURE_DIR for current feature
       - Check DISCOVERY-BRIEF.md existence; if missing, invoke framing-discovery.md
       - Run Stage 1 (Plan) and Stage 2 (Execute) for this feature
     - After all waves complete: run Stage 3 (Review) and Stage 4 (Doc) ONCE for the full capability scope
     - The review/doc stages receive artifact lists from ALL features in the capability

  8. **Feature-scope branch**: When SCOPE is "feature" (existing behavior, simplified):
     - Run Stage 1 (Plan) -> Stage 2 (Execute) -> Stage 3 (Review) -> Stage 4 (Doc) linearly

  9. **Update Stage 3 (Review)**: Remove per-feature language. Review receives execution-scope artifact list (single feature or all features in capability). Scope inferred from SUMMARY.md presence in feature directories.

  10. **Update Stage 4 (Doc)**: Same scope-fluid treatment as review.

  11. **Update key_constraints block**: Remove "All 6 stages run in sequence. No stage skipping." Replace with "4 stages: plan -> execute -> review -> doc. Review and doc run once per execution scope."

  12. **Update completion banner**: Show 4 stages, not 6. Show scope (capability or feature).

  13. **Preserve all existing patterns**: Escalation handling (Section 8), lens metadata propagation, auto-chain behavior, backward reset budget.

  14. **Lens passing**: Lens available from brief frontmatter. Stages reference LENS and ANCHOR_QUESTIONS_PATH where useful. Do NOT force-inject large context blocks -- pass paths.
  </action>
  <verify>
    <automated>grep -c "Stage 1.*Research\|Stage 2.*Requirements\|requirements.*generation\|research.*gatherers" get-shit-done/workflows/framing-pipeline.md | xargs test 0 -eq</automated>
    <automated>grep -q "capability\|SCOPE" get-shit-done/workflows/framing-pipeline.md</automated>
    <automated>grep -q "cycle.*detect" get-shit-done/workflows/framing-pipeline.md</automated>
  </verify>
  <done>framing-pipeline.md contains scope-detection branch, DAG logic with cycle detection, 4-stage flow (plan/execute/review/doc), no research or requirements stages, and preserves escalation + lens propagation.</done>
</task>

<task type="auto">
  <name>Delete capability-orchestrator.md and research-workflow.md</name>
  <reqs>TC-01, TC-02, FN-04, FN-05</reqs>
  <files>get-shit-done/workflows/capability-orchestrator.md, get-shit-done/workflows/research-workflow.md</files>
  <action>
  1. Verify framing-pipeline.md from Task 1 contains:
     - DAG wave ordering logic (from capability-orchestrator.md)
     - Cycle detection with user resolution (from capability-orchestrator.md)
     - No research stage (plan.md owns research via Step 5)

  2. Delete `get-shit-done/workflows/capability-orchestrator.md` (156 lines)

  3. Delete `get-shit-done/workflows/research-workflow.md` (224 lines)

  4. Verify neither file exists:
     ```bash
     test ! -f get-shit-done/workflows/capability-orchestrator.md
     test ! -f get-shit-done/workflows/research-workflow.md
     ```
  </action>
  <verify>
    <automated>test ! -f get-shit-done/workflows/capability-orchestrator.md && test ! -f get-shit-done/workflows/research-workflow.md && echo "PASS"</automated>
  </verify>
  <done>Both files deleted. DAG logic lives in framing-pipeline.md. Research lives in plan.md.</done>
</task>

</tasks>

<verification>
1. framing-pipeline.md handles both capability and feature scope
2. No research or requirements generation stages exist in framing-pipeline.md
3. DAG cycle detection preserved from capability-orchestrator.md
4. Review and doc run once per execution scope (not per-feature)
5. capability-orchestrator.md and research-workflow.md are deleted
6. plan.md unchanged (already owns research)
</verification>

<success_criteria>
- framing-pipeline.md is the single pipeline entry for both scopes
- 4-stage flow: plan -> execute -> review -> doc
- Capability scope: DAG wave plan+execute per feature, then single review+doc
- Feature scope: linear 4-stage flow
- Two workflow files deleted (~380 lines removed)
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/scope-fluid-pipeline/01-SUMMARY.md`
</output>
