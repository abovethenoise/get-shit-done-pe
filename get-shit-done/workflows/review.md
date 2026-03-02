<purpose>
Orchestrate the full review pipeline for a feature: spawn 4 specialist reviewers in parallel (gather-synthesize pattern), consolidate via synthesizer, present findings to user one-at-a-time with 5 response options, handle re-review cycles after accepted fixes.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/workflows/gather-synthesize.md
@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
The invoking workflow passes these as context:
- `CAPABILITY_SLUG`: The capability containing this feature
- `FEATURE_SLUG`: The feature being reviewed
- `LENS`: Primary lens identifier (debug | new | enhance | refactor)
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op "$CAPABILITY_SLUG" "$FEATURE_SLUG" review --raw)
```

Parse JSON for: `commit_docs`, `capability_slug`, `capability_dir`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_context`, `has_plans`, `state_path`, `roadmap_path`.

**If `feature_found` is false:** Error -- feature not found.

Derive review-specific context:
- `reviewer_agents`: resolve from agent directory (gsd-review-enduser.md, gsd-review-functional.md, gsd-review-technical.md, gsd-review-quality.md)
- `synthesizer_path`: gsd-review-synthesizer.md
- `max_re_review_cycles`: 2
- `failure_threshold`: 2

Create review output directory:
```bash
mkdir -p "${FEATURE_DIR}/review"
```

## 2. Context Assembly

Build context payload following gather-synthesize Layers 1-3.

**Layer 1: Core Context (always)**
Read and include:
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/ROADMAP.md`

**Layer 2: Capability Context**
Read `${capability_dir}/CAPABILITY.md` if it exists.

**Layer 3: Feature Context**
Read `${feature_dir}/FEATURE.md`. This contains 3-layer requirements (EU/FN/TC) -- the primary source for requirement tracing.

**Layer 4: Framing Context**
If `LENS` is provided, read `get-shit-done/framings/${LENS}/anchor-questions.md` for lens-specific question sets.

Assemble payload:

```
<core_context>
{contents of PROJECT.md, STATE.md, ROADMAP.md}
</core_context>

<capability_context>
{contents of CAPABILITY.md -- omit block if not applicable}
</capability_context>

<feature_context>
{contents of FEATURE.md with EU/FN/TC requirements}
</feature_context>

<framing_context>
Lens: {LENS}
{contents of anchor-questions.md -- omit block if not applicable}
</framing_context>
```

## 3. Locate Feature Artifacts

Identify what was built for this feature. Read SUMMARY.md files from the feature directory to understand what files were created/modified:

```bash
ls "${FEATURE_DIR}"/*-SUMMARY.md 2>/dev/null
```

Build a list of key files from all summaries -- these are the files reviewers will trace against.

Extract requirement IDs from FEATURE.md (EU-xx, FN-xx, TC-xx patterns).

## 4. Gather Phase -- Spawn 4 Reviewers in Parallel

Display banner:
```
-------------------------------------------------------
 GSD > REVIEWING FEATURE: {capability_slug}/{feature_slug}
-------------------------------------------------------

* Spawning 4 specialist reviewers...
```

Define the 4 gatherers following gather-synthesize parameters:

```
gatherers:
  - agent_path: agents/gsd-review-enduser.md
    dimension_name: "End-User"
    output_path: {feature_dir}/review/enduser-trace.md
  - agent_path: agents/gsd-review-functional.md
    dimension_name: "Functional"
    output_path: {feature_dir}/review/functional-trace.md
  - agent_path: agents/gsd-review-technical.md
    dimension_name: "Technical"
    output_path: {feature_dir}/review/technical-trace.md
  - agent_path: agents/gsd-review-quality.md
    dimension_name: "Code Quality"
    output_path: {feature_dir}/review/quality-trace.md
```

Construct one Task prompt per reviewer:

```
First, read {agent_path} for your role and goal.

<subject>
Review Feature: {capability_slug}/{feature_slug}
</subject>

{context_payload}

<task_context>
Dimension: {dimension_name}

Feature artifacts to review (key files from summaries):
{list of key files created/modified for this feature}

Requirement IDs in scope:
{EU-xx, FN-xx, TC-xx IDs extracted from FEATURE.md}

Write your complete trace report to: {output_path}
</task_context>
```

Spawn ALL 4 reviewers simultaneously using parallel Task calls. Do not wait for one to finish before spawning the next.

```
Task(
  prompt=reviewer_prompt,
  subagent_type="general-purpose",
  description="Review: {dimension_name}"
)
```

Wait for ALL reviewers to complete.

## 5. Failure Handling

After all reviewers complete, check each output:

```bash
test -f {output_path} && test -s {output_path}
```

For each reviewer:
- Output exists and is non-empty: status = "success"
- Output missing or empty: retry that reviewer ONCE with the same prompt

After retry:
- Output now exists and is non-empty: status = "success"
- Still missing or empty: status = "failed"

Build manifest:

```
manifest:
  End-User: success|failed
  Functional: success|failed
  Technical: success|failed
  Code Quality: success|failed
```

**Abort threshold:** Count failed reviewers. If `failed_count >= failure_threshold` (default 2):
- Do NOT proceed to synthesis
- Display:

```
## REVIEW GATHER FAILED

Feature: {capability_slug}/{feature_slug}
Failed: {failed_count}/4 reviewers

Failed dimensions:
- {dimension_name}: {reason if known}

Cause: Too many reviewers failed to produce output.
Action: Investigate agent definitions and context assembly before retrying.
```

If fewer than `failure_threshold` failed: proceed to synthesis with partial results.

Display status:
```
Reviewer results:
  End-User:    [OK | FAILED]
  Functional:  [OK | FAILED]
  Technical:   [OK | FAILED]
  Code Quality: [OK | FAILED]

* Spawning synthesizer...
```

## 6. Synthesize Phase

Construct synthesizer prompt:

```
First, read {synthesizer_path} for your role and goal.

<subject>
Review Feature: {capability_slug}/{feature_slug}
</subject>

{context_payload}

<task_context>
Gather phase complete. Synthesize the following reviewer trace reports into a consolidated review.

Priority order for conflict resolution: end-user > functional > technical > quality

Reviewer outputs to read:
- End-User: {feature_dir}/review/enduser-trace.md (status: {manifest.End-User})
- Functional: {feature_dir}/review/functional-trace.md (status: {manifest.Functional})
- Technical: {feature_dir}/review/technical-trace.md (status: {manifest.Technical})
- Code Quality: {feature_dir}/review/quality-trace.md (status: {manifest.Code Quality})

Manifest:
{manifest}

Note: If any reviewer has status "failed", its dimension is missing from the review. Document the gap in your synthesis -- do not fabricate content for missing dimensions.

Produce:
- Per-requirement verdict summary table
- Critical issues list (blocks release)
- Warnings list (should fix)
- Clean bill of health (if no issues)

Write your complete synthesis to: {feature_dir}/review/synthesis.md
</task_context>
```

```
Task(
  prompt=synthesizer_prompt,
  subagent_type="general-purpose",
  description="Synthesize review for Feature: {capability_slug}/{feature_slug}"
)
```

Wait for synthesizer to complete. Verify output exists:
```bash
test -f "${FEATURE_DIR}/review/synthesis.md" && test -s "${FEATURE_DIR}/review/synthesis.md"
```

If synthesis output missing: error -- synthesis failed.

## 7. Parse Synthesis

Read `{feature_dir}/review/synthesis.md`. Extract the ordered list of findings. Each finding has: number, title, severity, source reviewer, requirement ID, verdict, evidence, spot-check result.

If zero findings (all requirements met, no issues): display success and skip to step 10.

```
-------------------------------------------------------
 GSD > REVIEW COMPLETE -- NO ISSUES FOUND
-------------------------------------------------------

Feature: {capability_slug}/{feature_slug}
All requirements verified as met. No findings to present.
```

## 8. Present Findings to User (Q&A Loop)

Display banner:
```
-------------------------------------------------------
 GSD > REVIEW FINDINGS ({count} items)
-------------------------------------------------------
```

Initialize tracking:
- `accepted_findings = []` -- findings that need re-review after fixes
- `deferred_findings = []`
- `dismissed_findings = []`
- `re_review_cycle = 0`

For each finding (one at a time, ordered by severity: blockers first):

Display the finding:
```
[Severity: {severity}] Finding {N}/{total}
Requirement: {req_id}
Verdict: {verdict}
Source: {reviewer}

{evidence summary}

Spot-check: {verified|not checked|failed}
```

Use AskUserQuestion:
- header: "Find {N}/{T}" (max 12 characters)
- question: "{finding title}\n\n{evidence detail}\n\nHow would you like to handle this finding?"
- options:
  - "Accept" -- Finding is valid, fix it
  - "Accept+Edit" -- Finding is valid with modifications (provide details)
  - "Research" -- Need more investigation before deciding (provide guidance)
  - "Defer" -- Valid but not fixing now
  - "Dismiss" -- Finding is not valid or not applicable

**Handle responses:**

- **Accept:** Add to `accepted_findings` with original finding details. Continue to next finding.
- **Accept+Edit:** Prompt user for modification details. Add to `accepted_findings` with user's edits applied. Continue to next finding.
- **Research:** Prompt user for research guidance. Log guidance for follow-up. Continue to next finding.
- **Defer:** Add to `deferred_findings`. Log reason: "Deferred by user". Continue to next finding.
- **Dismiss:** Add to `dismissed_findings`. Log reason: "Dismissed by user". Continue to next finding.

After all findings processed:
- If accepted findings exist: create fix tasks, update FEATURE.md trace table, then continue to step 9.
- If no accepted findings: skip to step 10.

## 9. Re-Review Loop

**Skip if:** No accepted findings (all deferred or dismissed).

Check: `re_review_cycle < max_re_review_cycles` (default 2).

**If accepted findings exist AND cycles remaining:**

Increment `re_review_cycle`.

Display:
```
-------------------------------------------------------
 GSD > RE-REVIEW CYCLE {N}/{max}
-------------------------------------------------------

{count} accepted findings to verify after fixes.
Spawning targeted reviewers...
```

Determine which reviewers are affected by the accepted findings. Map each finding's source reviewer to the reviewer agent that produced it.

**Targeted re-review:** Only re-spawn reviewers whose domain was affected by accepted findings. The synthesizer ALWAYS re-runs.

For each affected reviewer, spawn with updated prompt that focuses on the accepted findings:

```
First, read {agent_path} for your role and goal.

<subject>
Re-review Feature: {capability_slug}/{feature_slug} (cycle {re_review_cycle})
</subject>

{context_payload}

<task_context>
Dimension: {dimension_name}
Mode: Re-review -- focus on previously flagged findings

Accepted findings to verify:
{list of accepted findings relevant to this reviewer}

Previous trace report: {output_path}

Feature artifacts:
{list of key files}

Write your updated trace report to: {output_path}
(Overwrite the previous report)
</task_context>
```

Spawn affected reviewers in parallel. Wait for completion.
Re-spawn synthesizer with updated reports.
Parse new synthesis. Present any NEW or CHANGED findings to user (same Q&A loop as step 8).

**If `re_review_cycle >= max_re_review_cycles` AND still accepted findings:**

Display:
```
Max re-review cycles reached ({max}). Remaining findings:
{list of unresolved findings}

These require manual resolution.
```

## 10. Log Deferred and Dismissed Findings

Write to `{feature_dir}/review/review-decisions.md`:

```markdown
# Review Decisions -- Feature: {capability_slug}/{feature_slug}

**Date:** {date}
**Re-review cycles:** {re_review_cycle}

## Accepted Findings

{list of accepted findings with disposition}

## Deferred Findings

{list of deferred findings with reason}

## Dismissed Findings

{list of dismissed findings with reason}
```

## 11. Completion

Display:
```
-------------------------------------------------------
 GSD > FEATURE REVIEWED: {capability_slug}/{feature_slug}
-------------------------------------------------------

Feature: {capability_slug}/{feature_slug}

Findings: {total}
  Accepted: {count} (fixed and re-verified)
  Deferred: {count}
  Dismissed: {count}
Re-review cycles: {re_review_cycle}/{max}

Review artifacts:
  {feature_dir}/review/enduser-trace.md
  {feature_dir}/review/functional-trace.md
  {feature_dir}/review/technical-trace.md
  {feature_dir}/review/quality-trace.md
  {feature_dir}/review/synthesis.md
  {feature_dir}/review/review-decisions.md
```

</process>

<key_constraints>
- This workflow follows the gather-synthesize pattern from gather-synthesize.md with review-specific parameters.
- Q&A interaction happens HERE in the workflow via AskUserQuestion -- NOT inside reviewer or synthesizer agents.
- Reviewers are spawned in parallel (never sequential) to prevent anchoring bias.
- Synthesizer runs only after all reviewers complete (or abort if >=2 fail).
- Synthesizer resolves conflicts per priority: end-user > functional > technical > quality.
- Re-review is targeted: only affected reviewers re-run, synthesizer always re-runs.
- AskUserQuestion headers must stay within 12 characters (e.g., "Find 1/7").
- Deferred and Dismissed findings are logged in the review artifact, not discarded.
- Max 2 re-review cycles. After that, remaining issues surface for manual resolution.
- Requirements sourced from FEATURE.md (3-layer EU/FN/TC), not a separate REQUIREMENTS.md.
- Review traces written to feature_dir/review/ (v2 feature-scoped paths).
</key_constraints>
