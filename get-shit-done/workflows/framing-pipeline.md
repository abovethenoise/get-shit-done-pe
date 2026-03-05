<purpose>
Orchestrate the post-discovery pipeline for any scope (capability or feature). Pipeline stages: plan -> execute -> review -> doc. For capability scope, builds a DAG from CAPABILITY.md features table, runs plan+execute per feature in wave order, then review+doc once for the full scope. For feature scope, runs 4 stages linearly.

Invoked by framing-discovery.md after brief finalization, or directly by commands for capability-scope orchestration. Framing context (brief path + lens metadata) shapes behavior at every stage without changing agent definitions.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
@{GSD_ROOT}/get-shit-done/references/escalation-protocol.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
The invoking workflow passes these as context:
- `BRIEF_PATH`: Absolute path to the completed Discovery Brief (.planning/capabilities/{cap}/features/{feat}/DISCOVERY-BRIEF.md)
- `LENS`: Primary lens identifier (debug | new | enhance | refactor)
- `SECONDARY_LENS`: Secondary lens identifier (optional, for compound work)
- `CAPABILITY_SLUG`: The resolved capability slug
- `CAPABILITY_NAME`: The resolved capability name
- `FEATURE_SLUG`: The feature being processed (may be null for capability scope)
- `FEATURE_DIR`: Absolute path to the feature directory (.planning/capabilities/{cap}/features/{feat})

Derived:
- `SCOPE`: "capability" if FEATURE_SLUG is null/empty, "feature" if FEATURE_SLUG is provided
</inputs>

<process>

## 1. Initialize

Read the Discovery Brief at `BRIEF_PATH` (if feature scope) or CAPABILITY.md (if capability scope). Extract from frontmatter:
- `primary_lens`
- `secondary_lens` (may be empty)
- `completion` signal (mvu_met | user_override | gaps_flagged)

Read framing-lenses.md for lens behavioral spec. Note the lens metadata:
```
LENS_METADATA:
  primary: {LENS}
  secondary: {SECONDARY_LENS or null}
  direction: {from framing-lenses.md -- backward/forward/outward/underneath}
  tone: {from framing-lenses.md -- convergent/exploratory/pragmatic/risk-aware}
  brief_spec_fields: {from framing-lenses.md -- lens-specific Specification fields}
```

Read anchor questions for the active lens:
```bash
ANCHOR_QUESTIONS_PATH="get-shit-done/framings/${LENS}/anchor-questions.md"
```

Determine scope:
```
SCOPE = if FEATURE_SLUG is provided then "feature" else "capability"
```

This metadata and anchor questions are passed to every stage as context. The orchestrator passes PATHS, not content -- each stage reads files itself.

Display banner:
```
-------------------------------------------------------
 GSD > FRAMING PIPELINE
-------------------------------------------------------

Scope: {SCOPE}
Capability: {CAPABILITY_SLUG}
Feature: {FEATURE_SLUG or "all (capability scope)"}
Lens: {LENS} {+ SECONDARY_LENS if compound}
Brief: {BRIEF_PATH or "per-feature"}

Running 4 stages: plan -> execute -> review -> doc
```

Initialize escalation state:
```
ESCALATION_STATE:
  backward_resets: 0
  max_backward_resets: 1
```

## 2. Capability-Scope Branch (DAG Wave Orchestration)

**When SCOPE is "capability":**

### 2a. Build Feature DAG

Read CAPABILITY.md at `.planning/capabilities/${CAPABILITY_SLUG}/CAPABILITY.md`.

Extract the Features table columns: Feature | Priority | Depends-On | Status.

Build a directed acyclic graph:
- Each feature is a node
- Each `Depends-On` entry creates a directed edge (dependency -> feature)
- Skip features with status "complete"

### 2b. Cycle Detection

Validate: no cycles in the DAG.

If a cycle is found (e.g., A depends on B, B depends on A):
- Display: "Circular dependency detected: A -> B -> A"
- Use AskUserQuestion:
  - header: "Dependency Cycle"
  - question: "Which dependency should be removed to break the cycle?"
  - options: list each edge in the cycle
- Remove the selected edge and re-validate
- Repeat until no cycles remain

### 2c. Topological Sort Into Waves

Group features into execution waves:
- **Wave 1:** Features with no dependencies (or all deps already complete)
- **Wave 2:** Features whose dependencies are all in Wave 1 or earlier
- **Wave N:** Features whose dependencies are all in waves before N

### 2d. Execute Waves (Plan + Execute Per Feature)

For each wave (in order), for each feature in the wave (sequentially):

1. Set `FEATURE_SLUG` and `FEATURE_DIR` for the current feature
2. Check `DISCOVERY-BRIEF.md` existence at `${FEATURE_DIR}/DISCOVERY-BRIEF.md`
   - If missing: invoke `framing-discovery.md` for this feature first
   - Pass: LENS, CAPABILITY_SLUG, FEATURE_SLUG
3. Set `BRIEF_PATH` to `${FEATURE_DIR}/DISCOVERY-BRIEF.md`
4. Run **Stage 1 (Plan)** for this feature (see Section 3)
5. Run **Stage 2 (Execute)** for this feature (see Section 4)

After ALL waves complete:
- Collect artifact lists (SUMMARY.md, FEATURE.md) from ALL features in the capability
- Run **Stage 3 (Review)** ONCE for the full capability scope (see Section 5)
- Run **Stage 4 (Doc)** ONCE for the full capability scope (see Section 6)

### 2e. Feature-Scope Branch (Linear Pipeline)

**When SCOPE is "feature":**

Run Stage 1 (Plan) -> Stage 2 (Execute) -> Stage 3 (Review) -> Stage 4 (Doc) linearly for the single feature.

## 3. Stage 1 -- Plan (Lens-Shaped Risk Posture)

Invoke the planning workflow with framing context:

```
@{GSD_ROOT}/get-shit-done/workflows/plan.md
```

Provide context to the plan workflow:
```
<framing_context>
Brief path: {BRIEF_PATH}
Primary lens: {LENS}
Secondary lens: {SECONDARY_LENS or "none"}
Lens direction: {LENS_METADATA.direction}
Anchor questions: {ANCHOR_QUESTIONS_PATH}
Capability: {CAPABILITY_SLUG}
Feature: {FEATURE_SLUG}
Feature dir: {FEATURE_DIR}

Risk posture guidance (from lens):
- debug: Conservative. Isolate the fix. Minimize blast radius. Test the hypothesis before committing to a solution path.
- new: Balanced. Define boundaries before building. Spike unknowns first.
- enhance: Targeted. Extend through existing seams. Preserve invariants.
- refactor: Maximum caution. Migration-first ordering. Behavioral tests before structural changes. Rollback plan for each step.
</framing_context>
```

Plan.md owns research internally (Step 5: 6 parallel gather-synthesize agents with lens-aware RESEARCH.md reuse checking). No separate research stage needed.

**After planning completes:**
- Check for escalation signals (planner found scope issues, requirement gaps)
- If escalation: handle per Section 7
- If clean: proceed to Stage 2

## 4. Stage 2 -- Execute (Lens-Shaped Aggressiveness)

Invoke the execution workflow with framing context:

```
@{GSD_ROOT}/get-shit-done/workflows/execute.md
```

Provide context to the execute workflow:
```
<framing_context>
Brief path: {BRIEF_PATH}
Primary lens: {LENS}
Secondary lens: {SECONDARY_LENS or "none"}
Anchor questions: {ANCHOR_QUESTIONS_PATH}
Capability: {CAPABILITY_SLUG}
Feature: {FEATURE_SLUG}
Feature dir: {FEATURE_DIR}

Execution approach guidance (from lens):
- debug: Diagnostic-first. Verify hypothesis before fixing. Minimal change to resolve root cause.
- new: Build-forward. Implement in dependency order. No premature optimization.
- enhance: Surgical. Modify through existing seams. Preserve all unrelated behavior.
- refactor: Incremental migration. Each step must leave the system in a working state. Behavioral tests validate each structural change.
</framing_context>
```

**After execution completes:**
- Check for escalation signals (execution discovered scope problems, requirement mismatches)
- If escalation: handle per Section 7
- If clean: **auto-chain to Stage 3** (no user intervention needed)

## 5. Stage 3 -- Review (3-Input Model, Auto-Chained from Execute)

**Execute -> Review auto-chain:** After execute completes, automatically invoke review without user intervention. The review stage itself has a human checkpoint if issues are found.

Review receives three inputs -- not just requirements:

1. **Requirements** (the contract) -- "Did we build what was specified?"
2. **Lens metadata** (the disposition) -- "Are we reviewing this the right way?"
3. **Brief** (the intent) -- "Does this actually solve the original problem?"

The third input catches spec-complete but problem-incomplete work.

**Scope-fluid artifact collection:**
- Feature scope: SUMMARY.md and FEATURE.md from the single feature directory
- Capability scope: SUMMARY.md and FEATURE.md from ALL feature directories under the capability. Scope inferred from SUMMARY.md presence in feature directories.

Invoke the review workflow:

```
@{GSD_ROOT}/get-shit-done/workflows/review.md
```

Provide context to the review workflow:
```
<framing_context>
Brief path: {BRIEF_PATH}
Primary lens: {LENS}
Secondary lens: {SECONDARY_LENS or "none"}
Lens direction: {LENS_METADATA.direction}
Anchor questions: {ANCHOR_QUESTIONS_PATH}
Capability: {CAPABILITY_SLUG}
Feature: {FEATURE_SLUG or "all (capability scope)"}
Feature dir: {FEATURE_DIR}
Execution scope: {SCOPE}

Review disposition (from lens):
- debug: Verify root cause is addressed (not just symptom). Check reproduction path no longer triggers. Verify no regressions in adjacent paths.
- new: Verify capability matches problem statement. Check boundaries hold. Verify acceptance criteria from EU requirements.
- enhance: Verify delta is correct (desired - current = implemented change). Check invariants preserved. Verify existing behavior untouched.
- refactor: Verify external behavior unchanged. Check structural goals met. Verify migration completed (no half-states). Run full behavioral test suite.

Intent verification (from brief):
- Read Problem Statement from brief. Does the implemented work solve this problem?
- Read Specification from brief. Does the implementation match the lens-specific spec?
- Read Scope Boundary from brief. Is anything out-of-scope included? Is anything in-scope missing?
</framing_context>
```

**After review completes:**
- If review finds issues requiring re-work: normal review re-review cycle handles this (Q&A with user for fix decisions)
- If review finds fundamental scope/requirement problems: MAJOR escalation per Section 7
- If review passes cleanly: **auto-chain to Stage 4** (no user intervention needed)

## 6. Stage 4 -- Doc/Reflect (Auto-Chained from Review)

**Review -> Doc auto-chain:** After review completes cleanly, automatically invoke doc. If review surfaces issues, Q&A checkpoint intervenes first -- once resolved, doc stage auto-chains.

The doc stage IS the doc agent wired as the final pipeline step. After review acceptance, the doc agent reads actual built code and generates/updates documentation.

**Scope-fluid artifact collection:**
- Feature scope: artifacts from the single feature
- Capability scope: artifacts from ALL features in the capability

Invoke the documentation workflow:

```
@{GSD_ROOT}/get-shit-done/workflows/doc.md
```

Provide context to the doc workflow:
```
<framing_context>
Brief path: {BRIEF_PATH}
Primary lens: {LENS}
Anchor questions: {ANCHOR_QUESTIONS_PATH}
Capability: {CAPABILITY_SLUG} ({CAPABILITY_NAME})
Feature: {FEATURE_SLUG or "all (capability scope)"}
Feature dir: {FEATURE_DIR}
Execution scope: {SCOPE}

Documentation focus:
- What was built (from review-verified artifacts)
- How it connects to existing system (from brief Context section)
- Key decisions made during execution (from plan SUMMARY.md files)

Lens-specific doc emphasis:
- debug: Document the fix and root cause
- new: Document the new capability
- enhance: Document what changed and why
- refactor: Document structural changes with before/after
</framing_context>
```

**Human checkpoint within doc stage:** doc.md surfaces documentation changes for user confirmation before writing to `.documentation/`.

**After documentation completes:**
- Update FEATURE.md frontmatter status to "complete" (all 4 stages passed)
- Update FEATURE.md trace table to mark all columns complete
- For capability scope: update CAPABILITY.md status if all features complete
- Proceed to completion

## 7. Escalation Handling

At every stage boundary, check for escalation signals. Apply the universal 3-tier escalation protocol from escalation-protocol.md.

**Escalation check at each stage exit:**

Read the stage output for escalation indicators:
- Explicit flags: "ESCALATION: {severity}" markers in output
- Implicit signals: requirement gaps, scope mismatches, blocking unknowns

**Tier handling:**

### Minor (Flag and Continue)

Log the issue. Continue to next stage. The doc stage captures minor flags in documentation.

```
[ESCALATION: Minor] Stage {N}: {description}
Logged. Continuing pipeline.
```

### Moderate (Pause and Propose)

Pause the pipeline. Present the issue and proposed amendment to the user.

Use AskUserQuestion:
- header: "Escalation"
- question: "Stage {N} ({stage_name}) detected an issue:\n\n{description}\n\nProposed amendment: {amendment}\n\nThis would affect: {affected stages}"
- options:
  - "Accept amendment" -- apply the amendment, continue pipeline
  - "Override and continue" -- proceed without amendment (log as assumption)
  - "Return to {upstream stage}" -- backward reset (if budget allows)

**If "Return to {upstream stage}":**
Check escalation budget: `ESCALATION_STATE.backward_resets < ESCALATION_STATE.max_backward_resets`

If budget available:
1. Increment `backward_resets`
2. Return to the specified upstream stage
3. Re-run from that stage forward with the escalation context

If budget exhausted:
```
Maximum backward resets reached (1 per pipeline run).
Options:
  - Accept amendment and continue
  - Override and continue
  - Stop pipeline (user restarts manually after resolving)
```

### Major (Halt and Recommend)

Halt the pipeline. Recommend returning to a specific upstream stage. This uses propose-and-confirm -- the pipeline does NOT auto-return.

Use AskUserQuestion:
- header: "Major Issue"
- question: "Stage {N} ({stage_name}) found a major issue:\n\n{description}\n\nRecommendation: Return to {recommended_stage} because {reason}.\n\nThis requires your confirmation."
- options:
  - "Confirm: return to {recommended_stage}" -- backward reset (if budget allows)
  - "Override: continue anyway" -- proceed with documented risk
  - "Stop pipeline" -- halt, user decides next steps manually

**If confirmed backward return:** Same budget check as Moderate tier.

## 8. Pipeline Completion

Display completion banner:
```
-------------------------------------------------------
 GSD > PIPELINE COMPLETE
-------------------------------------------------------

Scope: {SCOPE}
Capability: {CAPABILITY_SLUG}
Feature: {FEATURE_SLUG or "all features"}
Lens: {LENS} {+ SECONDARY_LENS if compound}

Stages completed:
  1. Plan          [OK]
  2. Execute       [OK]
  3. Review        [OK]
  4. Doc           [OK]

Escalations: {count} ({breakdown by tier})
Backward resets: {backward_resets}/{max_backward_resets}

Status: complete
```

</process>

<key_constraints>
- Orchestrator passes PATHS not content. Each stage reads files itself with fresh context.
- 4 stages: plan -> execute -> review -> doc. Review and doc run once per execution scope.
- Capability scope: DAG wave ordering of features for plan+execute, then single review+doc for the full scope.
- Feature scope: linear plan -> execute -> review -> doc.
- LENS and ANCHOR_QUESTIONS_PATH propagated to all 4 pipeline stages.
- Each stage receives lens framing context that affects its Q&A, discovery, and agent behavior.
- Research is owned by plan.md (Step 5: 6 parallel gatherers + synthesizer). No separate research stage.
- Requirements come from discuss-feature upstream. Pipeline receives pre-written requirements in FEATURE.md.
- Review receives 3 inputs: requirements + lens metadata + brief. The brief check catches spec-complete-but-problem-incomplete work.
- Doc stage is the doc agent -- not a new agent.
- Execute -> Review auto-chains (no user intervention). Review -> Doc auto-chains when clean.
- Full auto-chain: user kicks off pipeline -> plans -> builds code -> auto-reviews -> auto-documents -> done. Only pauses for human decisions (fix Q&A, doc confirmations).
- Escalation protocol is universal: same 3 tiers at every stage boundary.
- Maximum 1 backward reset per pipeline run. After that, hard stop (user must restart manually).
- Major issues use propose-and-confirm. No auto-return.
- Compound work: primary lens governs, secondary lens informs. See framing-lenses.md precedence table.
- FEATURE.md status updated to "complete" when all 4 stages finish.
</key_constraints>
