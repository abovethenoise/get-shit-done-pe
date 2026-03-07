<purpose>
Orchestrate the documentation pipeline for a feature: locate artifacts, spawn doc-writer agent, verify output, present docs for Q&A review, commit on approval. Auto-chains from review when review is clean.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
@{GSD_ROOT}/get-shit-done/references/delegation.md
</required_reading>

<inputs>
- `CAPABILITY_SLUG`: The capability containing the feature(s)
- `FEATURE_SLUG`: The feature being documented (null/empty for capability scope)
- `LENS`: Primary lens (debug | new | enhance | refactor)
- `SCOPE`: Derived -- "feature" if FEATURE_SLUG provided, "capability" if null/empty
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op "$CAPABILITY_SLUG" "$FEATURE_SLUG" doc --raw)
```

Parse: `commit_docs`, `capability_slug`, `capability_dir`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_context`, `has_plans`, `state_path`, `roadmap_path`.

**If `feature_found` is false:** Error.

```bash
mkdir -p "${FEATURE_DIR}/doc"
```

## 2. Context Assembly

Build payload (Layers 1-4):
- **Layer 1:** PROJECT.md, STATE.md, ROADMAP.md
- **Layer 2:** `${capability_dir}/CAPABILITY.md` (if exists)
- **Layer 3:** `${feature_dir}/FEATURE.md` (EU/FN/TC requirements)
- **Layer 4:** Lens-specific doc focus (debug=root cause, new=end-to-end, enhance=what changed, refactor=before/after)

## 3. Locate Artifacts (Scope-Fluid)

Determine scope: `SCOPE = if FEATURE_SLUG is provided then "feature" else "capability"`

**Feature scope (FEATURE_SLUG provided):**
Read SUMMARY.md files from feature directory for key files list. Check for review synthesis (`${FEATURE_DIR}/review/synthesis.md`). Supplement with git diff. Deduplicate.

**Capability scope (FEATURE_SLUG is null/empty):**
Scan all feature directories under `.planning/capabilities/${CAPABILITY_SLUG}/features/`. For each feature directory that contains at least one `*-SUMMARY.md` file:
- Collect SUMMARY.md paths, FEATURE.md path, and review synthesis path
- Extract key files from each
- Build combined artifact list across all features

Log scope: "Documenting at {SCOPE} scope: {feature count} feature(s)"

**Ground truth framing:** Code (what was actually built) is ground truth for documentation. Explorers document actual implementation, not aspirational requirements.

**Doc aggregator framing (capability scope):** When documenting across multiple features, detect: terminology inconsistency across features, orphaned docs referencing removed/changed code, and prioritize updates by impact (user-facing > internal > config).

## 4. Spawn Explorers in Parallel

Assemble context payload (read each path, embed content):

```
<core_context>{contents of PROJECT.md, STATE.md, ROADMAP.md}</core_context>
<capability_context>{contents of CAPABILITY.md}</capability_context>
<feature_context>{contents of FEATURE.md with EU/FN/TC requirements}</feature_context>
<doc_context>
Lens: {LENS}
Lens emphasis:
  - new: emphasis on end-to-end docs, architecture additions, new capability docs
  - enhance: emphasis on what changed, updated modules/flows, decision rationale
  - debug: emphasis on root cause documentation, failure modes, known issues
  - refactor: emphasis on before/after architecture, migration notes, updated mappings
Feature artifacts: {artifact list from Step 3}
Review synthesis: {feature_dir}/review/synthesis.md (if exists)
Review traces: {feature_dir}/review/*-trace.md (if exist)
Review decisions: {feature_dir}/review/review-decisions.md (if exists)
Research: {feature_dir}/RESEARCH.md (if exists)
Plans: {feature_dir}/*-PLAN.md (if exist)
</doc_context>
```

Spawn all 6 explorers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-explorer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Focus area: inline-clarity\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/inline-clarity-findings.md</task_context>",
  subagent_type="gsd-doc-explorer",
  description="Doc Explore: inline-clarity for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-explorer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Focus area: architecture-map\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/architecture-map-findings.md</task_context>",
  subagent_type="gsd-doc-explorer",
  description="Doc Explore: architecture-map for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-explorer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Focus area: domain-context\nFeature artifacts: {artifact_list}\nResearch: {feature_dir}/RESEARCH.md\nPlans: {feature_dir}/*-PLAN.md\nWrite your findings to: {feature_dir}/doc/domain-context-findings.md</task_context>",
  subagent_type="gsd-doc-explorer",
  description="Doc Explore: domain-context for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-explorer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Focus area: agent-context\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/agent-context-findings.md</task_context>",
  subagent_type="gsd-doc-explorer",
  description="Doc Explore: agent-context for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-explorer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Focus area: automation-surface\nFeature artifacts: {artifact_list}\nReview traces: {feature_dir}/review/*-trace.md\nReview decisions: {feature_dir}/review/review-decisions.md\nWrite your findings to: {feature_dir}/doc/automation-surface-findings.md</task_context>",
  subagent_type="gsd-doc-explorer",
  description="Doc Explore: automation-surface for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-explorer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Focus area: planning-hygiene\nFeature artifacts: {artifact_list}\nResearch: {feature_dir}/RESEARCH.md\nPlans: {feature_dir}/*-PLAN.md\nSummaries: {feature_dir}/*-SUMMARY.md\nWrite your findings to: {feature_dir}/doc/planning-hygiene-findings.md</task_context>",
  subagent_type="gsd-doc-explorer",
  description="Doc Explore: planning-hygiene for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

Wait for ALL 6 explorers to complete.

After all explorers complete, check each output:
- {feature_dir}/doc/inline-clarity-findings.md
- {feature_dir}/doc/architecture-map-findings.md
- {feature_dir}/doc/domain-context-findings.md
- {feature_dir}/doc/agent-context-findings.md
- {feature_dir}/doc/automation-surface-findings.md
- {feature_dir}/doc/planning-hygiene-findings.md

For each missing or empty file: retry that explorer ONCE with the same prompt.
After retry, if still missing/empty: status = "failed".

Abort threshold: if 4 or more explorers fail (failed_count >= 4), abort — do NOT proceed to synthesis.
Display error:

```
GSD > DOC EXPLORE FAILED: {N}/6 explorers failed
Failed: {list of failed focus areas}
Action: Check agent definitions and context assembly before retrying.
```

If 3 or fewer fail: proceed to synthesis with partial results.

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-synthesizer.md for your role.\nThen read {GSD_ROOT}/get-shit-done/references/doc-tiers.md for tier registry.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Explorer findings to consolidate:\n- inline-clarity: {feature_dir}/doc/inline-clarity-findings.md [{status}]\n- architecture-map: {feature_dir}/doc/architecture-map-findings.md [{status}]\n- domain-context: {feature_dir}/doc/domain-context-findings.md [{status}]\n- agent-context: {feature_dir}/doc/agent-context-findings.md [{status}]\n- automation-surface: {feature_dir}/doc/automation-surface-findings.md [{status}]\n- planning-hygiene: {feature_dir}/doc/planning-hygiene-findings.md [{status}]\n\nFor any explorer with status 'failed': document the gap — do not fabricate findings.\n\nWrite consolidated doc-report.md to: {feature_dir}/doc-report.md</task_context>",
  subagent_type="gsd-doc-synthesizer",
  description="Doc Synthesize for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

## 5. Present Recommendations (Q&A Loop)

For each focus area group in doc-report.md (in priority order: inline-clarity, architecture-map, domain-context, agent-context, automation-surface, planning-hygiene):

For each recommendation in the group:

Display:
- Focus area: {area}
- Target file: {target_file}
- What to change: {change}
- Why: {rationale}
- Route: {routing target}
- Expected behavior: {assertion}

Options via AskUserQuestion (header: "Rec {N}/{total}"):
- **Approve** -- include in commit
- **Edit** -- provide feedback, re-generate this recommendation
- **Reject** -- exclude from commit

## 6. Update FEATURE.md Trace Table

Mark "Docs" column complete for documented requirements.

## 7. Apply Approved Recommendations

Group approved recommendations by route:
- `inline-comment` → **code-comments** group
- `claude-md` → **claude-md** group
- `decision-log`, `memory-ledger` → **docs** group
- `artifact-cleanup` → **cleanup** group

For each non-empty group, spawn a writer in parallel:

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<task_context>\nRoute group: {group_name}\nRecommendations to apply:\n{list of approved recommendations for this group with target_file, what_to_change}\n</task_context>",
  subagent_type="gsd-doc-writer",
  description="Doc Write: {group_name} for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

Only spawn writers for groups that have approved recommendations. Skip empty groups. Wait for all writers to complete.

**Orchestrator-handled routes** (after writers complete):
- For each approved `skill` recommendation: invoke `/skill-creator` with the skill spec
- For each approved `hook` recommendation: create/update hook config directly
- For each approved `linter` recommendation: update linter config directly

## 8. Verify Writers

Run each approved recommendation's `expected_behavior` assertion. These are freeform — grep patterns, mgrep queries, file existence checks, line counts, or absence checks. The explorer/synthesizer wrote them; the orchestrator executes them.

For each approved recommendation:
- Run its `expected_behavior` assertion
- Record: PASS or FAIL with actual result

If all pass: proceed to commit.

If any fail, display failures and prompt via AskUserQuestion (header: "Verify"):
- **Commit anyway** — proceed despite failures
- **Fix** — re-run failed writers with failure context
- **Abort** — stop before commit

## 9. Commit and Cleanup

Stage and commit approved files:
```bash
git commit -m "docs(${CAPABILITY_SLUG}/${FEATURE_SLUG}): add generated documentation"
```

Remove ephemeral gatherer outputs — the human-approved artifacts are the sole records of each stage.

```bash
rm -f "${FEATURE_DIR}"/doc/*-findings.md
rmdir "${FEATURE_DIR}/doc" 2>/dev/null
rm -f "${FEATURE_DIR}"/review/*-trace.md
rm -f "${FEATURE_DIR}"/review/synthesis.md
rm -f "${FEATURE_DIR}"/review/review-decisions.md
rmdir "${FEATURE_DIR}/review" 2>/dev/null
```

## 10. Completion

```
GSD > FEATURE DOCUMENTED: {capability_slug}/{feature_slug}

Docs: {total} (Approved: {N}, Rejected: {N})
Verified: {pass_count}/{total_approved} assertions passed

Artifact: {feature_dir}/doc-report.md
```

</process>

<key_constraints>
- Three agent roles: gsd-doc-explorer (6x), gsd-doc-synthesizer (1x), gsd-doc-writer (Nx per route group) -- model routing per agent frontmatter
- Abort threshold: 4+ of 6 explorer failures = abort
- mkdir -p "{FEATURE_DIR}/doc" required before explorer spawns
- Q&A happens HERE via AskUserQuestion -- NOT inside doc agent
- Gate docs are read-only validation inputs
- User approval required before committing
- Requirements from FEATURE.md (EU/FN/TC)
- Review->Doc auto-chain when review passes cleanly
- Each finding routed to correct mechanism (comment, CLAUDE.md, hook, skill, linter, memory-ledger, artifact-cleanup)
- Ephemeral artifact cleanup: doc findings + review traces/synthesis/decisions deleted after doc commit; doc-report.md is the sole retained artifact
- Post-write verification: orchestrator runs each recommendation's expected_behavior assertion before committing
</key_constraints>
