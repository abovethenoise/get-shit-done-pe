<purpose>
Orchestrate review pipeline: spawn 4 specialist reviewers in parallel, consolidate via synthesizer, present findings with response options, handle re-review cycles. Branches on target type.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
@{GSD_ROOT}/get-shit-done/references/delegation.md
@{GSD_ROOT}/get-shit-done/references/context-assembly.md
</required_reading>

<inputs>
- `TARGET_SLUG`: Capability, feature, or focus-group slug
- `TARGET_TYPE`: "capability" | "feature" | "focus-group"
- `LENS`: Primary lens (debug | new | enhance | refactor)
- `ARTIFACT_PATHS`: (focus-group only) List of artifact paths aggregated by the command layer
</inputs>

<focus_group_handling>
When `TARGET_TYPE === 'focus-group'`: read artifacts from the provided `ARTIFACT_PATHS` list rather than inferring from a single slug's directory. The reviewers themselves don't change — they receive context and process it regardless of scope. Review output goes to `.planning/focus/{TARGET_SLUG}/review/`.
</focus_group_handling>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op "$TARGET_SLUG" review --raw)
```

Parse: `commit_docs`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_plans`, `state_path`, `roadmap_path`.

Determine target directory:
- Feature: `.planning/features/${TARGET_SLUG}`
- Capability: `.planning/capabilities/${TARGET_SLUG}`

```bash
mkdir -p "${target_dir}/review"
```

## 2. Context Assembly

Per @get-shit-done/references/context-assembly.md:
- Layer 1: PROJECT.md, STATE.md, ROADMAP.md
- Layer 2: Target spec (CAPABILITY.md contract or FEATURE.md goal/flow/composes[])
- Layer 3: SUMMARY.md files, key files created/modified
- Layer 4: Lens-specific anchor questions

**Review focus by type:**
- **Capability:** Reviewers verify contract satisfaction (Receives/Returns/Rules), constraint compliance, side effect accuracy
- **Feature:** Reviewers verify goal achievement, user-facing failure handling, composes[] accuracy, flow execution

## 2a. Review Focus

AskUserQuestion:
- header: "Review Focus"
- question: "What should this review prioritize?"
- options: "End-to-end flow" | "Logic consistency" | "Reusability" | "All equally" | "Let me specify"

Store as `REVIEW_FOCUS`. Passed to synthesizer to weight findings.

## 2b. Downstream Blast Radius

**If capability target:** Query downstream consumers for blast radius context:

```bash
DOWNSTREAM=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query downstream "$TARGET_SLUG")
```

Parse JSON for features that compose this capability.
Include in all reviewer prompts as `<downstream_consumers>`:
  Feature slugs and their Goal lines.

Purpose: when a reviewer finds a contract deviation, they can surface which
features are affected. Without this, findings land without propagation context.

**If feature target:** Skip — features don't have downstream consumers.

## 2c. Semantic Context for Technical Reviewer

Run mgrep against the target's Constraints and "Must Not Propagate" sections.
Include results in the technical reviewer's prompt as `<semantic_call_sites>`:
  Code that invokes or depends on constrained behavior.

## 3. Spawn 4 Reviewers in Parallel

Assemble context payload embedding all layers.

```
Task(prompt=review_prompt, subagent_type="gsd-review-enduser",
  description="Review End-User for ${TARGET_SLUG}")
Task(prompt=review_prompt, subagent_type="gsd-review-functional",
  description="Review Functional for ${TARGET_SLUG}")
Task(prompt=review_prompt, subagent_type="gsd-review-technical",
  description="Review Technical for ${TARGET_SLUG}")
Task(prompt=review_prompt, subagent_type="gsd-universal-quality-reviewer",
  description="Review Quality for ${TARGET_SLUG}")
```

Each reviewer writes to `${target_dir}/review/{dimension}-trace.md`.

Wait for ALL 4 to complete.

## 4. Failure Handling

Missing output → retry ONCE. Still missing → "failed". If ≥2 failed: abort synthesis.

## 5. Synthesize

```
Task(prompt=synth_prompt, subagent_type="gsd-review-synthesizer",
  description="Synthesize Review for ${TARGET_SLUG}")
```

Synthesizer reads all trace reports, writes `${target_dir}/review/synthesis.md`.

**Conflict priority (lens-aware):**
- debug: functional > technical > end-user > quality
- new/enhance: end-user > functional > technical > quality
- refactor: technical > quality > functional > end-user

`REVIEW_FOCUS` overlays on top — e.g., "reusability" elevates quality/technical regardless of lens.

## 6. Parse Synthesis

Extract ordered findings. If zero: display "NO ISSUES FOUND", skip to step 9.

## 7. Present Findings (Q&A Loop)

For each finding (blockers first):

Display: severity, spec section, verdict, source reviewer, evidence, spot-check result.

Options via AskUserQuestion:
- **Accept** — fix it
- **Accept+Edit** — fix with modifications
- **Research** — needs investigation
- **Defer** — valid but not now
- **Dismiss** — not valid

After all processed: if accepted findings → step 8. Otherwise → step 9.

## 8. Re-Review Loop

Max 2 cycles. Re-spawn only affected reviewers + synthesizer. Present new/changed findings.

## 9. Log Decisions

Write `${target_dir}/review/review-decisions.md`.

## 10. Completion

```
GSD > ${TARGET_TYPE} REVIEWED: ${TARGET_SLUG}

Findings: {total}
  Accepted: {count}
  Deferred: {count}
  Dismissed: {count}
Re-review cycles: {N}/2

Review artifacts: ${target_dir}/review/
```

## 11. Auto-Advance

**0 blocker/major remaining:** Auto-invoke doc workflow with TARGET_SLUG, TARGET_TYPE, LENS.
**Deferred but no blockers:** Auto-invoke doc with deferrals noted.
**Blockers remain:** Do NOT auto-advance. Surface blocker list.

</process>

<key_constraints>
- Follows gather-synthesize pattern with review-specific parameters
- Q&A happens HERE via AskUserQuestion — NOT inside agents
- Reviewers spawned in parallel (prevents anchoring bias)
- Synthesizer runs only after all reviewers complete (or abort if ≥2 fail)
- Conflict priority: lens-aware (debug weights functional first, refactor weights technical first, new/enhance weight end-user first) + REVIEW_FOCUS overlay
- Re-review is targeted: only affected reviewers + synthesizer
- Max 2 re-review cycles
- Review traces are ephemeral — cleaned up by doc.md after doc stage completes
- Auto-advances to doc when no blockers remain
</key_constraints>
