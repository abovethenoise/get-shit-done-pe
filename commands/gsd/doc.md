---
name: gsd:doc
description: Generate documentation recommendations for a feature or capability
argument-hint: "[<feature slug> | <capability slug>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---

<objective>
Generate documentation recommendations for a feature or capability. Supports standalone invocation (post-review, outside pipeline) and pipeline auto-chain. Routes by slug type — feature level runs doc for a single feature, capability level iterates all reviewed features.

**Flow:** slug-resolve -> infer LENS -> route (feature | capability | no-arg) -> doc.md workflow
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/doc.md
</execution_context>

<context>
**User reference:** $ARGUMENTS (optional -- feature slug, capability slug, or empty)

Context resolved via `gsd-tools slug-resolve`. LENS inferred from context.
</context>

<process>

## 1. Resolve Slug

**If $ARGUMENTS is non-empty:**

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
```

Parse JSON result for: `resolved`, `type`, `capability_slug`, `feature_slug`, `candidates`, `reason`.

**If $ARGUMENTS is empty:**
Skip slug resolution. Go to Step 3 (no-arg path).

## 2. Handle Resolution Result

**If resolved and type is "feature":**
- Set CAPABILITY_SLUG and FEATURE_SLUG from resolution
- Go to Step 4 (infer LENS) then Step 5 (feature-level invocation)

**If resolved and type is "capability":**
- Set CAPABILITY_SLUG from resolution
- Go to Step 4 (infer LENS) then Step 6 (capability-level invocation)

**If not resolved and reason is "ambiguous":**
- Present candidates to user:
  "Multiple matches found for '$ARGUMENTS':"
  - List each candidate with type and full_path
- Use AskUserQuestion to let user pick one
- Re-resolve with the selected candidate

**If not resolved and reason is "no_match":**
- Inform user: "No capability or feature matches '$ARGUMENTS'. Check available features with `/gsd:status`."
- Stop.

## 3. No-Arg Inference

Read `.planning/STATE.md`. Look in the "Session Continuity" section for "Stopped at:" line.

If "Stopped at:" references a feature (format: `{cap}/{feat} --`):
- Extract capability_slug and feature_slug
- Confirm with user via AskUserQuestion: "Inferred target: {cap}/{feat}. Proceed?" (Yes / Specify different target)
- If Yes: go to Step 4 (infer LENS) then Step 5 (feature-level invocation)
- If Specify: ask for slug, re-resolve via Step 1

If "Stopped at:" does not reference a deterministic feature:
- Try git log fallback: `git log --oneline -10 --grep="docs\\|feat\\|fix" | head -5` to find recent feature-scoped commits
- Parse commit messages for `{capability}/{feature}` patterns (e.g., `feat(pipeline-execution/doc-writer-overhaul):`)
- If a feature is found: confirm with user via AskUserQuestion, then proceed as above
- If no feature found: Use AskUserQuestion: "No recent feature detected. Provide a feature or capability slug to document:" (free text response)
- Re-resolve via Step 1

## 4. Infer LENS

LENS inference chain (stop at first match):

1. **Pipeline context**: If LENS was passed as an input to this command (pipeline auto-chain from framing-pipeline), use it.
2. **RESEARCH.md frontmatter**: Read `{feature_dir}/RESEARCH.md`. Check for `lens:` field in YAML frontmatter. Use its value if present and non-empty.
3. **Default**: Use "enhance".

Set LENS = result of inference.

## 5. Feature-Level Invocation

```
@{GSD_ROOT}/get-shit-done/workflows/doc.md
```

Pass: CAPABILITY_SLUG, FEATURE_SLUG, LENS

## 6. Capability-Level Invocation

Read `{capability_dir}/CAPABILITY.md` features table to get all feature slugs for this capability.

For each feature_slug in the features table:
- Check if `{capability_dir}/features/{feature_slug}/review/synthesis.md` exists
- If exists: include in run list
- If not: skip (log: "Skipping {feature_slug} — no review artifacts")

If run list is empty:
- Inform user: "No reviewed features found in {capability_slug}. Run `/gsd:review {cap/feat}` first."
- Stop.

For each feature in run list (sequentially):
```
@{GSD_ROOT}/get-shit-done/workflows/doc.md
```
Pass: CAPABILITY_SLUG, FEATURE_SLUG={current feature}, LENS

Display progress between features:
```
GSD > DOCUMENTING: {capability_slug}/{feature_slug} ({N}/{total})
```

</process>

<success_criteria>
- Slug resolved via 3-tier resolution (exact -> fuzzy -> fall-through)
- Feature-level: doc.md invoked for single feature with LENS
- Capability-level: doc.md invoked for each feature with review/synthesis.md, sequentially
- No-arg: target inferred from STATE.md session continuity with user confirmation
- LENS inferred from pipeline context -> RESEARCH.md frontmatter -> "enhance" default
- Capability-level routing uses inline iteration (not capability-orchestrator.md)
</success_criteria>
