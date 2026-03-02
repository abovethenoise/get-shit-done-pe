<purpose>
Orchestrate the full review pipeline for a feature: spawn 4 specialist reviewers in parallel (gather-synthesize pattern), consolidate via synthesizer, present findings one-at-a-time with 5 response options, handle re-review cycles after accepted fixes.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
- `CAPABILITY_SLUG`: The capability containing this feature
- `FEATURE_SLUG`: The feature being reviewed
- `LENS`: Primary lens (debug | new | enhance | refactor)
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

## 3. Locate Feature Artifacts

Read SUMMARY.md files from feature directory to build list of key files created/modified. Extract requirement IDs from FEATURE.md (EU-xx, FN-xx, TC-xx).

## 4. Spawn 4 Reviewers in Parallel

Define gatherers:
- `agents/gsd-review-enduser.md` -> `{feature_dir}/review/enduser-trace.md`
- `agents/gsd-review-functional.md` -> `{feature_dir}/review/functional-trace.md`
- `agents/gsd-review-technical.md` -> `{feature_dir}/review/technical-trace.md`
- `agents/gsd-review-quality.md` -> `{feature_dir}/review/quality-trace.md`

Per reviewer prompt: read agent file, subject, context payload, dimension name, feature artifacts list, requirement IDs, output path.

Spawn ALL 4 simultaneously. Wait for all to complete.

## 5. Failure Handling

Check each output exists and is non-empty. Missing -> retry ONCE. Still missing -> status "failed".

If `failed_count >= 2`: abort synthesis, display error with failed dimensions.
If fewer: proceed with partial results.

## 6. Synthesize

Spawn synthesizer with all trace reports. Priority for conflicts: end-user > functional > technical > quality. Output: `{feature_dir}/review/synthesis.md`.

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

If accepted findings AND cycles remaining: re-spawn only affected reviewers + always re-run synthesizer. Present any new/changed findings (same Q&A). If max reached: surface remaining for manual resolution.

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
- Review traces in feature_dir/review/ (feature-scoped paths)
</key_constraints>
