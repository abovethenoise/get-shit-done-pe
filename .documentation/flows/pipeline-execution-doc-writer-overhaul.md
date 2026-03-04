---
type: flow-doc
built-from-code-at: d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
last-verified: 2026-03-04
---

## Flow: pipeline-execution/doc-writer-overhaul

## Trigger: [derived]

One of three entry points:

1. **Auto-chain:** `review-workflow` Step 12 passes cleanly (0 blockers) or with deferred findings — automatically invokes `doc.md` with `CAPABILITY_SLUG`, `FEATURE_SLUG`, `LENS` passed through.
2. **Skill (feature-level):** User invokes `/gsd:doc {cap/feat}` — `doc.md (command)` resolves slug, infers LENS, calls `doc.md` workflow.
3. **Skill (capability-level):** User invokes `/gsd:doc {cap}` — `doc.md (command)` iterates all reviewed features in the capability sequentially.

## Input: [derived]

- `CAPABILITY_SLUG` — capability containing the feature
- `FEATURE_SLUG` — feature being documented
- `LENS` — debug | new | enhance | refactor (inferred if not passed from pipeline)
- Feature artifacts: SUMMARY.md files, `review/synthesis.md` (if exists), git diff output
- Existing .documentation/ files (for impact discovery and standards-decisions explorer)

## Steps: [derived]

### Path A: Auto-chain from review

1. **review-workflow** --> Step 12 detects 0 blockers remaining (or deferred-only findings). Passes `CAPABILITY_SLUG`, `FEATURE_SLUG`, `LENS` to doc.md workflow.
2. **doc.md** --> Steps 1-3: initialize (CLI init, mkdir `{feature_dir}/doc/`), assemble context payload (4 layers), locate feature artifacts (SUMMARY.md scan + review/synthesis.md + git diff).
3. **doc.md** --> Step 4: spawn 5 parallel explorer Task() blocks (model: sonnet). Each explorer reads `gsd-doc-writer.md`, receives context payload + focus area assignment.
4. **gsd-doc-writer** (code-comments explorer) --> reads actual source files from artifact list. Writes `{feature_dir}/doc/code-comments-findings.md`.
5. **gsd-doc-writer** (module-flow-docs explorer) --> reads SUMMARYs and review synthesis. Writes `{feature_dir}/doc/module-flow-docs-findings.md`.
6. **gsd-doc-writer** (standards-decisions explorer) --> reads SUMMARYs, existing .documentation/, CLAUDE.md. Writes `{feature_dir}/doc/standards-decisions-findings.md`.
7. **gsd-doc-writer** (project-config explorer) --> reads SUMMARYs, CLAUDE.md for drift. Writes `{feature_dir}/doc/project-config-findings.md`.
8. **gsd-doc-writer** (friction-reduction explorer) --> reads SUMMARYs for workflow patterns. Writes `{feature_dir}/doc/friction-reduction-findings.md`.
9. **doc.md** --> Step 4 (post-explore): checks all 5 output files. Retries each missing/empty explorer once. Aborts if 3+ fail.
10. **doc.md** --> Step 4 (synthesize): spawns synthesizer Task() block (model: inherit). Synthesizer reads all explorer findings.
11. **gsd-doc-writer** (synthesizer) --> deduplicates findings, resolves overlaps, orders by impact within each focus area group. Writes `{feature_dir}/doc-report.md` with YAML manifest + grouped recommendations + Impact Flags.
12. **doc.md** --> Steps 5-6: verifies doc-report.md exists. Collects impact flags (recommendations touching existing .documentation/ files).
13. **doc.md** --> Step 7: Q&A loop — presents each recommendation (grouped by focus area) via AskUserQuestion "Rec {N}/{total}". User chooses Approve / Edit / Reject per recommendation.
14. **doc.md** --> Steps 8-12: presents impact flags, updates FEATURE.md trace table, commits approved docs, displays completion summary.

### Path B: Standalone feature-level (/gsd:doc {cap/feat})

1. **doc.md (command)** --> resolves `$ARGUMENTS` via `gsd-tools.cjs slug-resolve`. Type = "feature".
2. **doc.md (command)** --> infers LENS: checks pipeline context, then RESEARCH.md frontmatter `lens:` field, then defaults to "enhance".
3. **doc.md (command)** --> invokes `doc.md` workflow with `CAPABILITY_SLUG`, `FEATURE_SLUG`, `LENS`.
4. Steps 2-14 from Path A proceed identically.

### Path C: Standalone capability-level (/gsd:doc {cap})

1. **doc.md (command)** --> resolves `$ARGUMENTS` via `gsd-tools.cjs slug-resolve`. Type = "capability".
2. **doc.md (command)** --> reads `CAPABILITY.md` features table. Gates each feature on `review/synthesis.md` existence. Builds run list.
3. **doc.md (command)** --> infers LENS (same chain as Path B).
4. **doc.md (command)** --> for each feature in run list (sequentially): invokes `doc.md` workflow with current `FEATURE_SLUG`. Displays `GSD > DOCUMENTING: {cap}/{feat} ({N}/{total})` between features.
5. Steps 2-14 from Path A repeated for each feature.

### Path D: No-arg invocation (/gsd:doc)

1. **doc.md (command)** --> reads `STATE.md` Session Continuity "Stopped at:" line.
2. **doc.md (command)** --> if deterministic feature found: confirms with user via AskUserQuestion. If not: runs `git log --oneline -10 --grep="docs|feat|fix"` to parse `{cap}/{feat}` from commit messages. If still not found: prompts user via AskUserQuestion free text.
3. **doc.md (command)** --> resolves confirmed slug, infers LENS, routes to feature-level or capability-level path.

## Output: [derived]

- `{feature_dir}/doc-report.md` — unified recommendations: YAML manifest + focus area groups + Impact Flags
- `{feature_dir}/doc/code-comments-findings.md` — explorer output
- `{feature_dir}/doc/module-flow-docs-findings.md` — explorer output
- `{feature_dir}/doc/standards-decisions-findings.md` — explorer output
- `{feature_dir}/doc/project-config-findings.md` — explorer output
- `{feature_dir}/doc/friction-reduction-findings.md` — explorer output
- Approved doc artifacts at paths specified per recommendation (dynamic — depends on user Q&A decisions)
- `{feature_dir}/FEATURE.md` — trace table updated (Docs column)

## Side-effects: [derived]

- `{feature_dir}/doc/` directory created if not exists
- `.documentation/modules/`, `.documentation/flows/`, `.documentation/capabilities/` directories created if not exist
- Git commit created for approved doc changes (`docs({capability_slug}/{feature_slug}): add generated documentation`)
- Failed explorer outputs may be partial or missing — documented as gaps in doc-report.md manifest, not fabricated

## WHY: [authored]

**Gather-synthesize replaces single-agent (FN-01, TC-01):** A single doc-writer agent investigates all 5 focus areas serially, producing undifferentiated output. Five scoped explorers with exclusive scope partitions produce focused, non-overlapping findings. The synthesizer then applies a dedup + priority ordering pass that a single agent cannot perform on its own output. Same pattern proven in research stage (plan.md) and review stage (review.md).

**LENS propagates from review auto-chain (EU-03, review Finding in 02-SUMMARY.md):** review.md Step 12 previously lacked LENS in both auto-advance branches. The fix ensures that when review passes cleanly and auto-chains to doc, the emphasis context (new/enhance/debug/refactor) that shaped the review is preserved into the doc explorers. Without this, the most common invocation path (auto-chain) would always produce "enhance"-emphasis documentation regardless of what lens the pipeline was running under.

**Capability-level uses inline iteration, not capability-orchestrator.md (TC-02, FN-04):** The capability orchestrator dispatches the full 6-stage pipeline per feature. Reusing it for doc-only capability iteration would incorrectly re-run research/plan/execute/review for each feature. The inline loop in the skill reads the features table and gates on synthesis.md existence — minimal, correct, no over-engineering.
