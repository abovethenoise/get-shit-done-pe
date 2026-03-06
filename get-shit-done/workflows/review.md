<purpose>
Orchestrate the full review pipeline for a feature: spawn 4 specialist reviewers in parallel (gather-synthesize pattern), consolidate via synthesizer, present findings one-at-a-time with 5 response options, handle re-review cycles after accepted fixes.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
- `CAPABILITY_SLUG`: The capability containing the feature(s)
- `FEATURE_SLUG`: The feature being reviewed (null/empty for capability scope)
- `LENS`: Primary lens (debug | new | enhance | refactor)
- `SCOPE`: Derived -- "feature" if FEATURE_SLUG provided, "capability" if null/empty
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op "$CAPABILITY_SLUG" "$FEATURE_SLUG" review --raw)
```

Parse: `commit_docs`, `capability_slug`, `capability_dir`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_context`, `has_plans`, `state_path`, `roadmap_path`.

**If `feature_found` is false:** Error.

Derive: reviewer agents (enduser, functional, technical, quality), synthesizer path, max_re_review_cycles=2, failure_threshold=2.

```bash
mkdir -p "${FEATURE_DIR}/review"
```

## 2. Context Assembly

Build payload (Layers 1-4):
- **Layer 1:** PROJECT.md, STATE.md, ROADMAP.md
- **Layer 2:** `${capability_dir}/CAPABILITY.md` (if exists)
- **Layer 3:** `${feature_dir}/FEATURE.md` (EU/FN/TC requirements)
- **Layer 4:** `get-shit-done/framings/${LENS}/anchor-questions.md` (if LENS provided)

## 3. Locate Artifacts (Scope-Fluid)

Determine scope: `SCOPE = if FEATURE_SLUG is provided then "feature" else "capability"`

**Feature scope (FEATURE_SLUG provided):**
Read SUMMARY.md files from feature directory to build list of key files created/modified. Extract requirement IDs from FEATURE.md (EU-xx, FN-xx, TC-xx).

**Capability scope (FEATURE_SLUG is null/empty):**
Scan all feature directories under `.planning/capabilities/${CAPABILITY_SLUG}/features/`. For each feature directory that contains at least one `*-SUMMARY.md` file:
- Collect SUMMARY.md paths and FEATURE.md path
- Extract key files and requirement IDs from each
- Build combined artifact list and combined requirement ID list across all features

Log scope: "Reviewing at {SCOPE} scope: {feature count} feature(s)"

**Ground truth framing:** Spec (FEATURE.md requirements) is ground truth for code review. Reviewers verify implementation against specified requirements -- the spec defines correctness.

## 4. Spawn 4 Reviewers in Parallel

Assemble context payload (read each path, embed content):
```
<core_context>{contents of PROJECT.md, STATE.md, ROADMAP.md}</core_context>
<capability_context>{contents of CAPABILITY.md}</capability_context>
<feature_context>{contents of FEATURE.md with EU/FN/TC requirements}</feature_context>
<review_context>
Lens: {LENS}
Anchor questions: {GSD_ROOT}/get-shit-done/framings/{LENS}/anchor-questions.md
Feature artifacts: {artifact list from Step 3}
Requirement IDs: {EU-xx, FN-xx, TC-xx from FEATURE.md}
</review_context>
```

Spawn all 4 reviewers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-review-enduser.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: End-User\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nWrite your trace report to: {feature_dir}/review/enduser-trace.md</task_context>",
  subagent_type="gsd-review-enduser",
  model="sonnet",
  description="Review End-User for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-review-functional.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Functional\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nWrite your trace report to: {feature_dir}/review/functional-trace.md</task_context>",
  subagent_type="gsd-review-functional",
  model="sonnet",
  description="Review Functional for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-review-technical.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Technical\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nWrite your trace report to: {feature_dir}/review/technical-trace.md</task_context>",
  subagent_type="gsd-review-technical",
  model="sonnet",
  description="Review Technical for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-review-quality.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG or 'all (capability scope)'}</subject>\n\n{context_payload}\n\n<task_context>Dimension: Quality\nExecution scope: {SCOPE}\nFeature artifacts: {artifact_list}\nRequirement IDs: {requirement_ids}\nCross-scope detection (when capability scope): check for cross-scope state conflicts, interface contract violations, conflicting assumptions between features, and spec coverage gaps in implementation.\nWrite your trace report to: {review_dir}/quality-trace.md</task_context>",
  subagent_type="gsd-universal-quality-reviewer",
  model="sonnet",
  description="Review Quality for {CAPABILITY_SLUG}/{FEATURE_SLUG or 'all'}"
)
```

Wait for ALL 4 reviewers to complete.

## 5. Failure Handling

Check each output exists and is non-empty. Missing -> retry ONCE. Still missing -> status "failed".

If `failed_count >= 2`: abort synthesis, display error with failed dimensions.
If fewer: proceed with partial results.

## 6. Synthesize

Build reviewer manifest listing each dimension and its status (success | failed).

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-review-synthesizer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG or 'all (capability scope)'}</subject>\n\n{context_payload}\n\n<task_context>Review phase complete. Consolidate the following reviewer trace reports.\n\nExecution scope: {SCOPE} ({SCOPE == 'capability' ? 'reviewing all executed features in capability' : 'reviewing single feature'})\n\nReviewer outputs:\n- End-User: {review_dir}/enduser-trace.md [{status}]\n- Functional: {review_dir}/functional-trace.md [{status}]\n- Technical: {review_dir}/technical-trace.md [{status}]\n- Quality: {review_dir}/quality-trace.md [{status}]\n\nConflict priority: end-user > functional > technical > quality\n\nWrite your synthesis to: {review_dir}/synthesis.md\n\nNote the review scope (capability-level or feature-level) in the synthesis output header.\nIf any reviewer has status \"failed\", document the gap — do not fabricate findings for missing dimensions.</task_context>",
  subagent_type="gsd-review-synthesizer",
  model="inherit",
  description="Synthesize Review for {CAPABILITY_SLUG}/{FEATURE_SLUG or 'all'}"
)
```

If synthesis output missing: error.

## 7. Parse Synthesis

Extract ordered findings list. If zero findings: display "NO ISSUES FOUND", skip to step 10.

## 8. Present Findings (Q&A Loop)

For each finding (ordered by severity, blockers first):

Display: severity, requirement, verdict, source reviewer, evidence, spot-check result.

Options via AskUserQuestion (header max 12 chars, e.g., "Find 1/7"):
- **Accept** -- fix it
- **Accept+Edit** -- fix with modifications
- **Research** -- need investigation first
- **Defer** -- valid but not now
- **Dismiss** -- not valid/applicable

After all processed: if accepted findings exist -> step 9. Otherwise -> step 10.

## 9. Re-Review Loop

Check `re_review_cycle < max_re_review_cycles` (2).

If accepted findings AND cycles remaining: re-spawn only affected reviewers using the same Task() blocks from Step 4 (same prompt structure, same subagent_types). Always re-run synthesizer via Step 6 Task() block after affected reviewers complete. Present any new/changed findings (same Q&A). If max reached: surface remaining for manual resolution.

## 10. Log Decisions

Write `{feature_dir}/review/review-decisions.md` with accepted, deferred, and dismissed findings.

## 11. Completion

```
GSD > FEATURE REVIEWED: {capability_slug}/{feature_slug}

Findings: {total}
  Accepted: {count}
  Deferred: {count}
  Dismissed: {count}
Re-review cycles: {N}/{max}

Review artifacts:
  {feature_dir}/review/
```

## 12. Auto-Advance

After completion:

**If 0 blocker/major findings remaining:**
- Auto-invoke doc workflow: `@{GSD_ROOT}/get-shit-done/workflows/doc.md`
- Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS
- Display: "No blockers remaining. Auto-advancing to documentation generation."

**If deferred findings but no blockers:**
- Auto-invoke doc workflow with deferrals noted: `@{GSD_ROOT}/get-shit-done/workflows/doc.md`
- Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS
- Display: "Deferred findings noted. Auto-advancing to documentation generation."

**If blockers remain:**
- Do NOT auto-advance
- Display: "Blockers remain. Resolve before documentation can be generated."
- Surface blocker list for manual resolution

</process>

<key_constraints>
- Follows gather-synthesize pattern with review-specific parameters
- Q&A happens HERE via AskUserQuestion -- NOT inside agents
- Reviewers spawned in parallel (prevents anchoring bias)
- Synthesizer runs only after all reviewers complete (or abort if >=2 fail)
- Conflict priority: end-user > functional > technical > quality
- Re-review is targeted: only affected reviewers + synthesizer
- Max 2 re-review cycles
- Requirements from FEATURE.md (EU/FN/TC), not separate REQUIREMENTS.md
- Review traces are ephemeral — cleaned up by doc.md after doc stage completes (doc is review's downstream consumer)
- Auto-advances to doc workflow when no blockers remain (step 12)
</key_constraints>
