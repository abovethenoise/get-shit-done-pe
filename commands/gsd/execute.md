---
name: gsd:execute
description: Execute plans for a capability or feature
argument-hint: "<capability or feature slug>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

<objective>
Execute the plan for a capability or feature. This is a pipeline stage invoked after planning — it reads the existing plan and carries out implementation.

**If capability:** Invokes framing-pipeline.md which executes all features in DAG wave order.
**If feature:** Invokes execute-plan.md workflow directly for the single feature.

**Flow:** slug-resolve -> route to framing-pipeline or feature execute workflow
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
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
- Invoke the execute-plan.md workflow with CAPABILITY_SLUG and FEATURE_SLUG
- Pass: `FEATURE_SLUG`, `CAPABILITY_SLUG`

**If resolved and type is "capability":**
- Invoke framing-pipeline.md with CAPABILITY_SLUG and LENS=execute
- The pipeline will execute all features in DAG wave order

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

## 2b. Pre-flight

```bash
PREFLIGHT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query execute-preflight "$SLUG" --raw)
```

Parse JSON. If `ready` is false:
- `no_plan` → "No plan found for {SLUG}. Run {route} first." Do not invoke workflow.
- `stale_plan` → Use AskUserQuestion: header "Stale Plan", question "Plan is older than spec. Re-plan or execute anyway?", options "Re-plan", "Execute anyway". If re-plan: surface route, stop. If execute anyway: continue.
- `upstream_gaps` → "Upstream not ready: {gaps}. Run {route} first." Do not invoke workflow.
- `not_found` → "Slug '{SLUG}' not found in project graph." Do not invoke workflow.

Where `$SLUG` is the resolved `feature_slug` or `capability_slug` from step 2.

If `ready` is true or user chose "Execute anyway": continue to workflow invocation.

## 3. Workflow Invocation

For **feature-level execution:**
```
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
```
Pass: FEATURE_SLUG, CAPABILITY_SLUG

For **capability-level execution:**
```
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
```
Pass: CAPABILITY_SLUG, LENS=execute

</process>

<success_criteria>
- Slug resolved via 3-tier resolution (exact -> fuzzy -> fall-through)
- Correct routing: capability -> framing-pipeline, feature -> execute-plan.md workflow
- Ambiguous matches presented for user selection
- No-match handled gracefully with create/retry options
</success_criteria>
