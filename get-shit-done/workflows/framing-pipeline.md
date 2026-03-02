<purpose>
Orchestrate the 6 post-discovery pipeline stages for any framing at feature level. After discovery produces a brief, this workflow runs: research -> requirements -> plan -> execute -> review -> doc. Framing context (brief path + lens metadata) shapes behavior at every stage without changing agent definitions.

Invoked by framing-discovery.md after brief finalization. All four framings converge here. The pipeline operates on a single feature -- capability context is derived from the feature's directory path.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/references/framing-lenses.md
@~/.claude/get-shit-done/references/escalation-protocol.md
@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
The invoking workflow passes these as context:
- `BRIEF_PATH`: Absolute path to the completed Discovery Brief (.planning/capabilities/{cap}/features/{feat}/DISCOVERY-BRIEF.md)
- `LENS`: Primary lens identifier (debug | new | enhance | refactor)
- `SECONDARY_LENS`: Secondary lens identifier (optional, for compound work)
- `CAPABILITY_SLUG`: The resolved capability slug
- `CAPABILITY_NAME`: The resolved capability name
- `FEATURE_SLUG`: The feature being processed
- `FEATURE_DIR`: Absolute path to the feature directory (.planning/capabilities/{cap}/features/{feat})
</inputs>

<process>

## 1. Initialize

Read the Discovery Brief at `BRIEF_PATH`. Extract from frontmatter:
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

This metadata and anchor questions are passed to every stage as context. The orchestrator passes PATHS, not content -- each stage reads files itself.

Display banner:
```
-------------------------------------------------------
 GSD > FRAMING PIPELINE
-------------------------------------------------------

Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}
Lens: {LENS} {+ SECONDARY_LENS if compound}
Brief: {BRIEF_PATH}
Completion: {completion signal}

Running 6 stages: research -> requirements -> plan -> execute -> review -> doc
```

Initialize escalation state:
```
ESCALATION_STATE:
  backward_resets: 0
  max_backward_resets: 1
```

## 2. Stage 1 -- Research (Lens-Aware)

Research agents investigate technical feasibility with lens-aware focus.

**Lens-aware research behavior:**
- /debug: Prioritize reproduction environment, error paths, dependency versions
- /new: Prioritize domain modeling, architectural options, prior art
- /enhance: Prioritize existing module boundaries, integration points, test coverage
- /refactor: Prioritize dependency mapping, consumer contracts, migration precedents

Invoke the research workflow directly, passing framing context:

```
@~/.claude/get-shit-done/workflows/research-workflow.md
```

Pass:
- `subject`: "{CAPABILITY_NAME}/{FEATURE_SLUG}" (the feature being researched)
- `context_paths`:
  - `project_path`: .planning/PROJECT.md
  - `state_path`: .planning/STATE.md
  - `roadmap_path`: .planning/ROADMAP.md
- `output_dir`: .planning/capabilities/{CAPABILITY_SLUG}/features/{FEATURE_SLUG}
- `capability_path`: .planning/capabilities/{CAPABILITY_SLUG}/CAPABILITY.md
- `feature_path`: ${FEATURE_DIR}/FEATURE.md
- `framing_context`:
  - `brief_path`: {BRIEF_PATH}
  - `lens`: {LENS}
  - `secondary_lens`: {SECONDARY_LENS or null}
  - `direction`: {LENS_METADATA.direction}
  - `focus`: {lens-specific focus from above}
  - `anchor_questions_path`: {ANCHOR_QUESTIONS_PATH}

The research workflow spawns 6 gatherers in parallel via gather-synthesize, then consolidates via the research synthesizer. Output: `{output_dir}/RESEARCH.md`.

**After research completes:**
- Check for escalation signals in research output (see escalation-protocol.md)
- If escalation: handle per Section 8 (Escalation Handling) below
- If clean: proceed to Stage 2

## 3. Stage 2 -- Requirements Generation (Lens-Weighted)

Auto-generate 3-layer requirements (end-user, functional, technical) from the Discovery Brief. All 3 layers are always present, but weight varies by lens.

**Lens-specific weighting:**

| Lens | End-User (EU) | Functional (FN) | Technical (TC) |
|------|--------------|-----------------|----------------|
| debug | Thin -- "user sees correct behavior" | Medium -- behavioral contract for the fix | Rich -- root cause detail, error paths, regression tests |
| new | Rich -- user stories, acceptance criteria | Medium -- behavioral boundaries | Thin -- implementation constraints only |
| enhance | Medium -- delta from user perspective | Rich -- current vs desired behavior contract | Medium -- integration points, invariants |
| refactor | Thin -- "behavior unchanged" | Medium -- behavioral invariants preserved | Rich -- structural changes, migration steps, contract preservation |

**Compound work adjustment:** If `SECONDARY_LENS` is set, enrich the secondary lens's strong layer. Example: enhance+refactor -> rich FN (enhance primary) AND rich TC (refactor secondary).

**Process:**

Read the brief at `BRIEF_PATH`. Extract:
- Problem Statement -> EU requirements seed
- Specification (lens-specific fields) -> FN + TC requirements seed
- Scope Boundary (in/out) -> requirement scoping
- Unknowns & Assumptions -> flag as risks in requirements

Draft requirements directly into FEATURE.md, populating the 3-layer sections:
- EU-xx: End-user stories with acceptance criteria
- FN-xx: Functional behavior specifications
- TC-xx: Technical implementation specifications

Read the existing FEATURE.md template structure at `${FEATURE_DIR}/FEATURE.md`, fill in the End-User Requirements, Functional Requirements, and Technical Specs sections.

Present drafted requirements to user:

Use AskUserQuestion:
- header: "Reqs Review"
- question: "Here are the auto-generated requirements from the Discovery Brief. Review the 3-layer requirements (EU/FN/TC) with {LENS}-weighted distribution."
- Show the requirements content
- options:
  - "Approve" -- requirements are good, proceed to planning
  - "Edit" -- provide corrections (re-draft affected sections)
  - "Back to discovery" -- requirements reveal discovery gaps (escalation)

Lens-specific question prompts for the requirements Q&A:
- **debug:** "What behavior should change? What should remain the same?"
- **new:** "What user stories matter most? What acceptance criteria are non-negotiable?"
- **enhance:** "What's working that must be preserved? What's the minimum viable enhancement?"
- **refactor:** "What constraints exist on the refactor? What behavioral invariants must hold?"

**If "Back to discovery":** This is a MODERATE escalation. Handle per Section 8.

**After approval:** Proceed to Stage 3.

## 4. Stage 3 -- Plan (Lens-Shaped Risk Posture)

Invoke the planning workflow with framing context:

```
@~/.claude/get-shit-done/workflows/plan.md
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

**After planning completes:**
- Check for escalation signals (planner found scope issues, requirement gaps)
- If escalation: handle per Section 8
- If clean: proceed to Stage 4

## 5. Stage 4 -- Execute (Lens-Shaped Aggressiveness)

Invoke the execution workflow with framing context:

```
@~/.claude/get-shit-done/workflows/execute.md
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
- If escalation: handle per Section 8
- If clean: **auto-chain to Stage 5** (no user intervention needed)

## 6. Stage 5 -- Review (3-Input Model, Auto-Chained from Execute)

**Execute -> Review auto-chain:** After execute.md completes, automatically invoke review.md without user intervention. The review stage itself has a human checkpoint if issues are found.

Review receives three inputs -- not just requirements:

1. **Requirements** (the contract) -- "Did we build what was specified?"
2. **Lens metadata** (the disposition) -- "Are we reviewing this the right way?"
3. **Brief** (the intent) -- "Does this actually solve the original problem?"

The third input catches spec-complete but problem-incomplete work.

Invoke the review workflow with all three inputs:

```
@~/.claude/get-shit-done/workflows/review.md
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
Feature: {FEATURE_SLUG}
Feature dir: {FEATURE_DIR}

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
- If review finds fundamental scope/requirement problems: MAJOR escalation per Section 8
- If review passes cleanly: **auto-chain to Stage 6** (no user intervention needed)

## 7. Stage 6 -- Doc/Reflect (Auto-Chained from Review)

**Review -> Doc auto-chain:** After review completes cleanly, automatically invoke doc.md. If review surfaces issues, Q&A checkpoint intervenes first -- once resolved, doc stage auto-chains.

The doc stage IS the doc agent wired as the final pipeline step. After review acceptance, the doc agent reads actual built code and generates/updates documentation.

Invoke the documentation workflow:

```
@~/.claude/get-shit-done/workflows/doc.md
```

Provide context to the doc workflow:
```
<framing_context>
Brief path: {BRIEF_PATH}
Primary lens: {LENS}
Anchor questions: {ANCHOR_QUESTIONS_PATH}
Capability: {CAPABILITY_SLUG} ({CAPABILITY_NAME})
Feature: {FEATURE_SLUG}
Feature dir: {FEATURE_DIR}

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
- Update FEATURE.md frontmatter status to "complete" (all 6 stages passed)
- Update FEATURE.md trace table to mark all columns complete
- Proceed to completion

## 8. Escalation Handling

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

## 9. Pipeline Completion

Display completion banner:
```
-------------------------------------------------------
 GSD > PIPELINE COMPLETE
-------------------------------------------------------

Feature: {CAPABILITY_SLUG}/{FEATURE_SLUG}
Lens: {LENS} {+ SECONDARY_LENS if compound}

Stages completed:
  1. Research      [OK]
  2. Requirements  [OK]
  3. Plan          [OK]
  4. Execute       [OK]
  5. Review        [OK]
  6. Doc           [OK]

Escalations: {count} ({breakdown by tier})
Backward resets: {backward_resets}/{max_backward_resets}

Feature status: complete
```

</process>

<key_constraints>
- Orchestrator passes PATHS not content. Each stage reads files itself with fresh context.
- All 6 stages run in sequence. No stage skipping.
- LENS and ANCHOR_QUESTIONS_PATH propagated to all 6 pipeline stages.
- Each stage receives lens framing context that affects its Q&A, discovery, and agent behavior.
- Requirements generation always produces all 3 layers (EU/FN/TC). Weight varies by lens.
- Requirements populate FEATURE.md directly, not a separate REQUIREMENTS.md.
- Research output written to feature directory, not capability directory.
- Review receives 3 inputs: requirements + lens metadata + brief. The brief check catches spec-complete-but-problem-incomplete work.
- Doc stage is the doc agent -- not a new agent.
- Execute -> Review auto-chains (no user intervention). Review -> Doc auto-chains when clean.
- Full auto-chain: user kicks off execute once -> builds code -> auto-reviews -> auto-documents -> done. Only pauses for human decisions (fix Q&A, doc confirmations).
- Escalation protocol is universal: same 3 tiers at every stage boundary.
- Maximum 1 backward reset per pipeline run. After that, hard stop (user must restart manually).
- Major issues use propose-and-confirm. No auto-return.
- Compound work: primary lens governs, secondary lens informs. See framing-lenses.md precedence table.
- FEATURE.md status updated to "complete" when all 6 stages finish.
</key_constraints>
