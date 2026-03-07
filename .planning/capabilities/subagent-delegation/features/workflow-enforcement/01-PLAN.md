---
phase: subagent-delegation/workflow-enforcement
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/doc.md
  - get-shit-done/workflows/review.md
  - get-shit-done/workflows/framing-pipeline.md
  - get-shit-done/workflows/init-project.md
  - get-shit-done/workflows/gather-synthesize.md
  - get-shit-done/workflows/execute.md
  - get-shit-done/workflows/execute-plan.md
  - get-shit-done/workflows/plan.md
  - get-shit-done/references/delegation.md
requirements: [EU-01, FN-01, FN-02, FN-03, TC-01, TC-02]
autonomous: true
must_haves:
  truths:
    - "All 8 workflows with delegation content have delegation.md in required_reading"
    - "Zero Task() calls contain model= parameter across all workflows and delegation.md"
    - "No workflow contains inline delegation explanations that duplicate delegation.md"
    - "No key_constraints section hardcodes model tier assignments -- all reference agent frontmatter"
    - "Net line count across all modified files is lower than pre-enforcement baseline (2858 lines)"
  artifacts:
    - path: "get-shit-done/workflows/doc.md"
      provides: "Delegation-enforced workflow: required_reading, no model=, no redundant delegation prose, key_constraints references agent frontmatter"
    - path: "get-shit-done/workflows/review.md"
      provides: "Delegation-enforced workflow: required_reading, no model=, no redundant delegation prose"
    - path: "get-shit-done/workflows/framing-pipeline.md"
      provides: "Delegation-enforced workflow: required_reading, no model=, key_constraints references agent frontmatter"
    - path: "get-shit-done/references/delegation.md"
      provides: "Reference doc with model= removed from its own Task() examples"
  key_links:
    - from: "get-shit-done/workflows/*.md"
      to: "get-shit-done/references/delegation.md"
      via: "required_reading @file reference"
      pattern: "@.*delegation\\.md"
---

<objective>
Enforce delegation.md as the single source of delegation patterns across all 8 target workflows + delegation.md itself.

Purpose: Eliminate redundant inline delegation explanations, remove model= from Task() calls (fixing 4 known contradictions), add delegation.md required_reading references, and update key_constraints sections to reference agent frontmatter instead of hardcoding model tiers -- producing shorter, more consistent workflow files.

Output: 9 modified files (8 workflows + delegation.md) with net line reduction.

Note: landscape-scan.md is EXCLUDED from the target list -- it has zero delegation content (no model= in Task calls, no delegation prose). Adding required_reading for delegation.md would be noise.
</objective>

<execution_context>
@get-shit-done/workflows/execute-plan.md
@get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/subagent-delegation/features/workflow-enforcement/FEATURE.md
@.planning/capabilities/subagent-delegation/features/workflow-enforcement/RESEARCH.md
@get-shit-done/references/delegation.md

<interfaces>
The required_reading block format (add delegation.md line to existing block or create new block):
```
required_reading:
  - @{GSD_ROOT}/get-shit-done/references/delegation.md
```

Task() calls currently use model= in these forms -- all must be removed:
- model="sonnet"
- model="opus"
- model="inherit"
- model="{executor_model}"
- model="{verifier_model}"
- model="{planner_model}"
- model="{checker_model}"
- model="{researcher_model}"

Known contradictions (Task() vs agent YAML -- removing model= fixes these):
| Workflow | Agent | Task() says | YAML says |
|----------|-------|-------------|-----------|
| review.md | gsd-review-quality | sonnet | opus |
| doc.md | gsd-doc-synthesizer | inherit | opus |
| review.md | gsd-review-synthesizer | inherit | opus |
| plan.md | gsd-research-synthesizer | inherit | opus |

key_constraints sections to update (hardcoded model tiers):
- doc.md line 259: "gsd-doc-explorer (6x sonnet), gsd-doc-synthesizer (1x inherit), gsd-doc-writer (Nx sonnet)"
- framing-pipeline.md line 418: "gsd-doc-explorer (6x sonnet), gsd-doc-synthesizer (1x inherit), gsd-doc-writer (Nx sonnet)"

Consolidation investigation results (for context -- no new patterns needed):
- Shared Task() template in delegation.md: NOT worth it. Workflows are prompts, not code. The gather-synthesize shape is already documented in delegation.md. Per-call parameters differ enough that a canonical template would add indirection without DRY benefit.
- gather-synthesize.md: Already 76 lines with Steps 2-5 as one-line cross-references. Nothing to consolidate.
- landscape-scan.md: Dropped from target list. Zero delegation content.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Baseline measurement and enforcement on 4 unenforced workflows + delegation.md</name>
  <reqs>EU-01, FN-01, FN-02, FN-03</reqs>
  <files>
    get-shit-done/workflows/doc.md
    get-shit-done/workflows/review.md
    get-shit-done/workflows/framing-pipeline.md
    get-shit-done/workflows/init-project.md
    get-shit-done/references/delegation.md
  </files>
  <action>
  1. BASELINE: Run `wc -l` on all 9 target files (8 workflows + delegation.md). Record total line count (expected: 2858). This baseline is needed for TC-02 verification in Task 2.

  2. For each of the 4 unenforced workflows (doc.md, review.md, framing-pipeline.md, init-project.md):
     a. Add `@{GSD_ROOT}/get-shit-done/references/delegation.md` to required_reading block (FN-01)
        - If workflow has existing required_reading block, add the line to it
        - If no required_reading block exists, add one
     b. Remove ALL `model=` parameters from Task() calls (FN-03)
        - Remove model="sonnet", model="inherit", model="opus", and variable forms like model="{executor_model}"
        - In key_constraints sections that hardcode model names:
          - doc.md line 259: change "gsd-doc-explorer (6x sonnet), gsd-doc-synthesizer (1x inherit), gsd-doc-writer (Nx sonnet)" to "gsd-doc-explorer (6x), gsd-doc-synthesizer (1x), gsd-doc-writer (Nx) -- model routing per agent frontmatter"
          - framing-pipeline.md line 418: same change pattern
     c. Strip redundant inline delegation content (FN-02)
        - Remove inline explanations of model routing rules (e.g. "sonnet for gatherers, opus for synthesizers")
        - Remove inline parallel spawning instructions that restate gather-synthesize shape
        - Remove inline anti-pattern warnings that duplicate delegation.md
        - PRESERVE workflow-specific Task() call templates (concrete agent paths, dimensions, output paths, prompt structures)
        - PRESERVE workflow-specific constraints (abort thresholds, re-review cycle counts, etc.)
        - If a section becomes empty after stripping, remove the section header too

  3. For delegation.md itself:
     - Remove model= parameters from all Task() examples (FN-03)
     - Remove "model=sonnet" and "model=opus" from the Task Call Example blocks (lines 50, 55, 95)
     - Also remove the redundant "(model=sonnet)" and "(model=opus)" parenthetical references in the Gather-Synthesize Shape Flow section (lines 37, 41)
     - In the Constraints section, change "Gatherers are model=sonnet. Synthesizer is model=opus." to "Model routing per agent frontmatter."
     - In the Single Delegation section, remove Model column from Users table (lines 100-106) since model comes from agent frontmatter
  </action>
  <verify>
    <automated>cd /Users/philliphall/get-shit-done-pe && grep -n 'model=' get-shit-done/workflows/doc.md get-shit-done/workflows/review.md get-shit-done/workflows/framing-pipeline.md get-shit-done/workflows/init-project.md get-shit-done/references/delegation.md | grep -v 'frontmatter' || echo "PASS: no model= found"</automated>
    <automated>cd /Users/philliphall/get-shit-done-pe && grep -l 'delegation.md' get-shit-done/workflows/doc.md get-shit-done/workflows/review.md get-shit-done/workflows/framing-pipeline.md get-shit-done/workflows/init-project.md | wc -l | xargs -I{} test {} -eq 4 && echo "PASS: all 4 workflows have delegation.md" || echo "FAIL: missing delegation.md reference"</automated>
  </verify>
  <done>4 workflows have delegation.md in required_reading. Zero model= parameters in Task() calls across these 5 files. key_constraints sections reference agent frontmatter. Redundant delegation prose removed. Baseline line count recorded.</done>
</task>

<task type="auto">
  <name>Compliance audit of 4 already-updated workflows + gather-synthesize.md + net line reduction verification</name>
  <reqs>TC-01, TC-02, FN-01, FN-02, FN-03</reqs>
  <files>
    get-shit-done/workflows/execute.md
    get-shit-done/workflows/execute-plan.md
    get-shit-done/workflows/plan.md
    get-shit-done/workflows/gather-synthesize.md
  </files>
  <action>
  These 4 workflows were updated during the delegation-patterns feature. Audit each for compliance with FN-01/FN-02/FN-03 and fix inline:

  1. For each of execute.md, execute-plan.md, plan.md, gather-synthesize.md:
     a. CHECK: Does it have `@{GSD_ROOT}/get-shit-done/references/delegation.md` in required_reading? If not, add it. (FN-01)
        - execute.md: has required_reading block (line 11) with delegation.md. Verify present.
        - execute-plan.md: has required_reading block (lines 6-9) with delegation.md. Verify present.
        - plan.md: has required_reading block (lines 6-8) with delegation.md. Verify present.
        - gather-synthesize.md: has NO required_reading block -- only an inline @{GSD_ROOT} reference on line 4. Add a required_reading block with delegation.md. Keep the inline reference (it serves as context assembly instruction).
     b. CHECK: Any remaining `model=` in Task() calls? Remove all instances. (FN-03)
        - execute.md: expected 2 instances (model="{executor_model}", model="{verifier_model}") on lines 66, 169
        - execute-plan.md: expected 1 instance in Pattern A description (line 63: model=executor_model)
        - plan.md: expected 9 instances across research gatherers (model="sonnet"), synthesizer (model="inherit"), planner (model="{planner_model}"), checker (model="{checker_model}")
        - gather-synthesize.md: check for any (likely none -- it's a 76-line orchestration stub)
     c. CHECK: Any redundant inline delegation explanations? Strip them. (FN-02)
        - Preserve workflow-specific Task() templates, constraints, and parameters
     d. CHECK: Any contradictions where Task() model= disagrees with agent YAML frontmatter? (TC-01)
        - plan.md uses model="inherit" for gsd-research-synthesizer (YAML: model: opus) -- removing model= fixes this

  2. After all fixes, verify net line count reduction (TC-02):
     Run `wc -l` on all 9 modified files (8 workflows + delegation.md). Compare to baseline from Task 1.
     Net result must be fewer lines than baseline of 2858.
     Report: "Baseline: 2858 lines. Post-enforcement: {M} lines. Delta: {2858-M} lines removed."
  </action>
  <verify>
    <automated>cd /Users/philliphall/get-shit-done-pe && grep -rn 'model=' get-shit-done/workflows/execute.md get-shit-done/workflows/execute-plan.md get-shit-done/workflows/plan.md get-shit-done/workflows/gather-synthesize.md | grep -v 'frontmatter' || echo "PASS: no model= found in audited workflows"</automated>
  </verify>
  <done>All 4 workflows pass compliance audit (delegation.md in required_reading, zero model= in Task() calls, no redundant inline delegation content, no contradictions). gather-synthesize.md has required_reading block added. Combined line count across all 9 files is less than baseline of 2858.</done>
</task>

</tasks>

<verification>
1. `grep -rn 'model="' get-shit-done/workflows/*.md get-shit-done/references/delegation.md` returns zero matches in Task() call context
2. `grep -l 'delegation.md' get-shit-done/workflows/doc.md get-shit-done/workflows/review.md get-shit-done/workflows/framing-pipeline.md get-shit-done/workflows/init-project.md get-shit-done/workflows/gather-synthesize.md get-shit-done/workflows/execute.md get-shit-done/workflows/execute-plan.md get-shit-done/workflows/plan.md` returns all 8 target workflows
3. Total line count of all 9 files (8 workflows + delegation.md) is less than 2858
4. `grep -n 'sonnet\|opus\|inherit' get-shit-done/workflows/doc.md get-shit-done/workflows/framing-pipeline.md` shows no hardcoded model tier assignments in key_constraints
</verification>

<success_criteria>
- All 8 workflows have delegation.md in required_reading (FN-01)
- Zero model= parameters in any Task() call across workflows + delegation.md (FN-03)
- No redundant inline delegation prose duplicating delegation.md content (FN-02)
- key_constraints sections reference agent frontmatter instead of hardcoding model tiers (FN-02)
- 4 already-updated workflows pass compliance audit with no gaps (TC-01)
- Net line count reduced vs baseline of 2858 (TC-02)
</success_criteria>

<output>
After completion, create `.planning/capabilities/subagent-delegation/features/workflow-enforcement/01-SUMMARY.md`
</output>
