---
name: gsd:plan
description: Plan a capability (all features in DAG order) or a single feature
argument-hint: "<capability or feature slug>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---

<objective>
Plan a capability or feature through the framing pipeline's plan stage. Resolves the user's slug reference via 3-tier slug resolution and routes accordingly.

**If capability:** Invokes capability-orchestrator.md which plans all features in DAG wave order.
**If feature:** Invokes plan.md workflow directly for the single feature.

**Flow:** slug-resolve -> route to capability orchestrator or feature plan workflow
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/plan.md
@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md
</execution_context>

<context>
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
- Invoke the plan.md workflow with CAPABILITY_SLUG and FEATURE_SLUG
- Pass: `LENS=plan`, `FEATURE_SLUG`, `CAPABILITY_SLUG`

**If resolved and type is "capability":**
- Invoke capability-orchestrator.md with CAPABILITY_SLUG and LENS=plan
- The orchestrator will plan all features in DAG wave order

**If not resolved and reason is "ambiguous":**
- Present candidates to user:
  "Multiple matches found for '$ARGUMENTS':"
  - List each candidate with type and full_path
- Use AskUserQuestion to let user pick one
- Re-resolve with the selected candidate

**If not resolved and reason is "no_match":**
- Use AskUserQuestion:
  - header: "Not Found"
  - question: "No capability or feature matches '$ARGUMENTS'. Would you like to create a new one, or try a different name?"
  - options: "Create new capability", "Try different name", "Cancel"
- If create: route to `/gsd:new`
- If retry: ask for new name, re-resolve

## 3. Workflow Invocation

For **feature-level planning:**
```
@{GSD_ROOT}/get-shit-done/workflows/plan.md
```
Pass: FEATURE_SLUG, CAPABILITY_SLUG, LENS=plan

For **capability-level planning:**
```
@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md
```
Pass: CAPABILITY_SLUG, LENS=plan

</process>

<success_criteria>
- Slug resolved via 3-tier resolution (exact -> fuzzy -> fall-through)
- Correct routing: capability -> orchestrator, feature -> plan.md workflow
- Ambiguous matches presented for user selection
- No-match handled gracefully with create/retry options
</success_criteria>
