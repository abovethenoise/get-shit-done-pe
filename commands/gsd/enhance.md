---
name: gsd:enhance
description: Editor mode -- find the seam and extend through it via structured discovery
argument-hint: "[capability or feature reference]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---
<objective>
Run editor-mode discovery for enhancing an existing capability or feature. Understands what exists, finds the seam, and plans the extension.

**Thinking mode:** Outward -- from current state to extended state. Pragmatic, surgical. Find the seam, extend through it.

**If capability:** Invokes framing-pipeline.md which fans out to all features in DAG wave order.
**If feature:** Invokes framing-discovery.md directly for the single feature.

**Flow:** slug-resolve -> route to framing-pipeline or feature framing-discovery workflow

**MVU (Minimum Viable Understanding):**
- Observed behavior concretely described (not aspirational)
- Desired behavior clearly distinguishable from current
- The specific delta identified with the seam where modification occurs
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</execution_context>

<context>
**Lens:** enhance
**User reference:** $ARGUMENTS (required -- capability or feature slug)

Context resolved via `gsd-tools slug-resolve` and feature-scoped init routes.
</context>

<process>
## 1. Resolve Slug

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
```

Parse JSON result for: `resolved`, `tier`, `type`, `capability_slug`, `feature_slug`, `full_path`, `candidates`, `reason`.

## 2. Handle Resolution Result

**If resolved and type is "feature":**
- Invoke framing-discovery.md with LENS=enhance and CAPABILITY_SLUG (derived from feature path)
- Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback)

**If resolved and type is "capability":**
- Invoke framing-pipeline.md with CAPABILITY_SLUG and LENS=enhance
- The pipeline will fan out to all features in DAG wave order

**If not resolved and reason is "ambiguous":**
- Use AskUserQuestion:
  - header: "Multiple Matches"
  - question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?"
  - options: list each candidate with type and full_path
- Re-resolve with the selected candidate, return to top of Step 2

**If not resolved and reason is "no_match":**
- Display error: "No capability or feature matches '$ARGUMENTS'."
- Suggest: "Run /gsd:status to see available capabilities and features."
- Stop.

</process>

<success_criteria>
- Slug resolved via 3-tier resolution (exact -> fuzzy -> fall-through)
- Correct routing: capability -> framing-pipeline, feature -> framing-discovery
- Ambiguous matches presented for user selection
- No-match handled with error + /gsd:status suggestion (not create-new)
</success_criteria>
