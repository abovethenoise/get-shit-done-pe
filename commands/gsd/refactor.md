---
name: gsd:refactor
description: Surgeon mode -- understand load-bearing walls before restructuring via structured discovery
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
Run surgeon-mode discovery for refactoring an existing capability or feature. Understands load-bearing walls before proposing structural changes.

**Thinking mode:** Underneath -- restructure without changing external behavior. Risk-aware. Understand load-bearing walls before moving them.

**If capability:** Invokes capability-orchestrator.md which fans out to all features in DAG wave order.
**If feature:** Invokes framing-discovery.md directly for the single feature.

**Flow:** slug-resolve -> route to capability orchestrator or feature framing-discovery workflow

**MVU (Minimum Viable Understanding):**
- Current design with load-bearing walls and organic growth areas identified
- Target design with specific structural changes named (not just "cleaner")
- What breaks during transition: consumers, contracts, data migrations, test coverage gaps
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md
@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</execution_context>

<context>
**Lens:** refactor
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
- Invoke framing-discovery.md with LENS=refactor and CAPABILITY_SLUG (derived from feature path)
- Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback)

**If resolved and type is "capability":**
- Invoke capability-orchestrator.md with CAPABILITY_SLUG and LENS=refactor
- The orchestrator will fan out to all features in DAG wave order

**If not resolved and reason is "ambiguous":**
- Use AskUserQuestion:
  - header: "Multiple Matches"
  - question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?"
  - options: list each candidate with type and full_path
- Re-resolve with the selected candidate

**If not resolved and reason is "no_match":**
- Display error: "No capability or feature matches '$ARGUMENTS'."
- Suggest: "Run /gsd:status to see available capabilities and features."
- Stop.

## 3. Workflow Invocation

For **feature-level:**
```
@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
```
Pass: LENS=refactor, CAPABILITY_SLUG (from resolution)

For **capability-level:**
```
@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md
```
Pass: CAPABILITY_SLUG, LENS=refactor

</process>

<success_criteria>
- Slug resolved via 3-tier resolution (exact -> fuzzy -> fall-through)
- Correct routing: capability -> orchestrator, feature -> framing-discovery
- Ambiguous matches presented for user selection
- No-match handled with error + /gsd:status suggestion (not create-new)
</success_criteria>
