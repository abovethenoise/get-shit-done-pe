<purpose>
Orchestrate documentation pipeline: spawn explorers, synthesize with inferability gate, present for Q&A, apply approved recommendations, commit.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
@{GSD_ROOT}/get-shit-done/references/delegation.md
@{GSD_ROOT}/get-shit-done/references/context-assembly.md
</required_reading>

<inputs>
- `TARGET_SLUG`: Capability or feature slug
- `TARGET_TYPE`: "capability" or "feature"
- `LENS`: Primary lens (debug | new | enhance | refactor)
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op "$TARGET_SLUG" doc --raw)
```

Parse: `commit_docs`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_plans`, `state_path`, `roadmap_path`.

Determine target directory:
- Feature: `.planning/features/${TARGET_SLUG}`
- Capability: `.planning/capabilities/${TARGET_SLUG}`

```bash
mkdir -p "${target_dir}/doc"
```

## 2. Context Assembly

Per @get-shit-done/references/context-assembly.md:
- Layer 1: PROJECT.md, STATE.md, ROADMAP.md
- Layer 2: Target spec (CAPABILITY.md contract or FEATURE.md goal/flow/composes[])
- Layer 3: SUMMARY.md files, review synthesis (if exists)
- Layer 4: Lens-specific doc focus

**Ground truth:** Code (what was actually built) is ground truth for documentation.

## 3. Locate Artifacts

Read SUMMARY.md files for key files list. Check for review synthesis. Supplement with git diff. Deduplicate.

## 4. Spawn 6 Explorers in Parallel

Assemble context payload embedding all layers + artifact list.

Spawn all 6 explorers simultaneously with focus areas: inline-clarity, architecture-map, domain-context, agent-context, automation-surface, planning-hygiene.

Each writes to `${target_dir}/doc/{focus-area}-findings.md`.

Wait for ALL 6. Retry failures once. Abort if ≥4 fail.

## 5. Synthesize

```
Task(
  prompt=synth_prompt,
  subagent_type="gsd-doc-synthesizer",
  description="Doc Synthesize for ${TARGET_SLUG}"
)
```

Synthesizer applies 5-test inferability gate, deduplicates, validates routes, writes `${target_dir}/doc-report.md`.

## 6. Present Recommendations (Q&A Loop)

For each recommendation in doc-report.md (by priority order):

Display: focus area, target file, change, rationale, route, expected behavior.

Options via AskUserQuestion:
- **Approve** — include in commit
- **Edit** — re-generate with feedback
- **Reject** — exclude

## 7. Apply Approved Recommendations

Group by route:
- `inline-comment` → **code-comments** group
- `claude-md` → **claude-md** group
- `decision-log`, `memory-ledger` → **docs** group
- `artifact-cleanup` → **cleanup** group

Spawn writer per non-empty group in parallel:
```
Task(prompt=writer_prompt, subagent_type="gsd-doc-writer",
  description="Doc Write: {group} for ${TARGET_SLUG}")
```

Orchestrator-handled routes: `skill` → /skill-creator, `hook` → update config, `linter` → update config.

## 8. Verify Writers

Run each recommendation's `expected_behavior` assertion. If all pass: commit. If failures: offer "Commit anyway" | "Fix" | "Abort".

## 9. Commit and Cleanup

```bash
git commit -m "docs(${TARGET_SLUG}): add generated documentation"
```

Remove ephemeral artifacts:
```bash
rm -f "${target_dir}"/doc/*-findings.md
rmdir "${target_dir}/doc" 2>/dev/null
rm -f "${target_dir}"/review/*-trace.md
rm -f "${target_dir}"/review/synthesis.md
rm -f "${target_dir}"/review/review-decisions.md
rmdir "${target_dir}/review" 2>/dev/null
```

## 10. Completion

```
GSD > ${TARGET_TYPE} DOCUMENTED: ${TARGET_SLUG}

Docs: {total} (Approved: {N}, Rejected: {N})
Verified: {pass_count}/{total_approved} assertions passed

Artifact: ${target_dir}/doc-report.md
```

</process>

<key_constraints>
- Three agent roles: gsd-doc-explorer (6x), gsd-doc-synthesizer (1x), gsd-doc-writer (Nx per route group)
- Abort threshold: 4+ of 6 explorer failures
- Q&A happens HERE — NOT inside agents
- User approval required before committing
- Ephemeral artifact cleanup after doc commit; doc-report.md is sole retained artifact
- Post-write verification: orchestrator runs expected_behavior assertions before committing
</key_constraints>
