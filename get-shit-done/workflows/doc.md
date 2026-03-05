<purpose>
Orchestrate the documentation pipeline for a feature: locate artifacts, spawn doc-writer agent, verify output, present docs for Q&A review, commit on approval. Auto-chains from review when review is clean.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
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
mkdir -p .documentation/modules .documentation/flows .documentation/capabilities
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
</doc_context>
```

Spawn all 5 explorers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: code-comments\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/code-comments-findings.md</task_context>",
  subagent_type="gsd-doc-writer",
  model="sonnet",
  description="Doc Explore: code-comments for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: module-flow-docs\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/module-flow-docs-findings.md</task_context>",
  subagent_type="gsd-doc-writer",
  model="sonnet",
  description="Doc Explore: module-flow-docs for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: standards-decisions\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/standards-decisions-findings.md</task_context>",
  subagent_type="gsd-doc-writer",
  model="sonnet",
  description="Doc Explore: standards-decisions for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: project-config\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/project-config-findings.md</task_context>",
  subagent_type="gsd-doc-writer",
  model="sonnet",
  description="Doc Explore: project-config for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)

Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: friction-reduction\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/friction-reduction-findings.md</task_context>",
  subagent_type="gsd-doc-writer",
  model="sonnet",
  description="Doc Explore: friction-reduction for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

Wait for ALL 5 explorers to complete.

After all explorers complete, check each output:
- {feature_dir}/doc/code-comments-findings.md
- {feature_dir}/doc/module-flow-docs-findings.md
- {feature_dir}/doc/standards-decisions-findings.md
- {feature_dir}/doc/project-config-findings.md
- {feature_dir}/doc/friction-reduction-findings.md

For each missing or empty file: retry that explorer ONCE with the same prompt.
After retry, if still missing/empty: status = "failed".

Abort threshold: if 3 or more explorers fail (failed_count >= 3), abort — do NOT proceed to synthesis.
Display error:

```
GSD > DOC EXPLORE FAILED: {N}/5 explorers failed
Failed: {list of failed focus areas}
Action: Check agent definitions and context assembly before retrying.
```

If 2 or fewer fail: proceed to synthesis with partial results.

```
Task(
  prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: synthesizer\nExplorer findings to consolidate:\n- code-comments: {feature_dir}/doc/code-comments-findings.md [{status}]\n- module-flow-docs: {feature_dir}/doc/module-flow-docs-findings.md [{status}]\n- standards-decisions: {feature_dir}/doc/standards-decisions-findings.md [{status}]\n- project-config: {feature_dir}/doc/project-config-findings.md [{status}]\n- friction-reduction: {feature_dir}/doc/friction-reduction-findings.md [{status}]\n\nFor any explorer with status 'failed': document the gap — do not fabricate findings.\n\nWrite consolidated doc-report.md to: {feature_dir}/doc-report.md</task_context>",
  subagent_type="gsd-doc-writer",
  model="inherit",
  description="Doc Synthesize for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
)
```

## 5. Verify Output

Check doc-report.md exists and is non-empty. If missing or empty: error.

## 6. Impact Discovery

Read doc-report.md. Collect impact flags: recommendations referencing existing .documentation/ files. Present after Q&A.

## 7. Present Recommendations (Q&A Loop)

For each focus area group in doc-report.md (in priority order: code-comments, module-flow-docs, standards-decisions, project-config, friction-reduction):

For each recommendation in the group:

Display:
- Focus area: {area}
- Target file: {target_file}
- What to change: {change}
- Why: {rationale}

Options via AskUserQuestion (header: "Rec {N}/{total}"):
- **Approve** -- include in commit
- **Edit** -- provide feedback, re-generate this recommendation
- **Reject** -- exclude from commit

## 8. Present Impact Flags

If impacted existing docs found in doc-report.md: display as informational section (no Q&A action required).

## 9. Update FEATURE.md Trace Table

Mark "Docs" column complete for documented requirements.

## 10. Commit Approved Docs

Stage and commit approved files:
```bash
git commit -m "docs(${CAPABILITY_SLUG}/${FEATURE_SLUG}): add generated documentation"
```

## 11. Output Path Targets

Approved recommendations are applied to the paths identified in each recommendation's `target_file` field. No fixed output paths — outputs depend on user approvals in Step 7.

## 12. Completion

```
GSD > FEATURE DOCUMENTED: {capability_slug}/{feature_slug}

Docs: {total} (Approved: {N}, Needs edit: {N}, Rejected: {N})
Impact flags: {count} existing docs may need review

Artifacts: {feature_dir}/doc/, {feature_dir}/doc-report.md
```

</process>

<key_constraints>
- Gather-synthesize pattern: 5 parallel explorers (sonnet) + 1 synthesizer (inherit)
- Abort threshold: 3+ of 5 explorer failures = abort
- mkdir -p "{FEATURE_DIR}/doc" required before explorer spawns
- Q&A happens HERE via AskUserQuestion -- NOT inside doc agent
- Impact flags presented separately after doc review
- Gate docs are read-only validation inputs
- User approval required before committing
- Requirements from FEATURE.md (EU/FN/TC)
- Review->Doc auto-chain when review passes cleanly
- Section ownership: [derived] regenerated, [authored] preserved
</key_constraints>
