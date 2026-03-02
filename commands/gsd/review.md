---
name: gsd:review
description: Review a feature's implementation against its requirements
argument-hint: "<feature slug>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Run code review + requirements verification for a feature. Review always operates at the feature level -- resolves the user's reference to a specific feature and invokes the review.md workflow.

**Flow:** slug-resolve (feature) -> load feature context -> review.md workflow
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/review.md
</execution_context>

<context>
**User reference:** $ARGUMENTS (required -- feature slug, e.g. "mistake-detection" or "coaching/grading")

Context resolved via `gsd-tools slug-resolve` with feature type hint.
</context>

<process>
## 1. Resolve Slug

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS" --type feature)
```

Parse JSON result.

## 2. Handle Resolution Result

**If resolved:**
- Invoke review.md workflow with CAPABILITY_SLUG and FEATURE_SLUG

**If not resolved and reason is "ambiguous":**
- Present candidates to user (feature matches only)
- Use AskUserQuestion to let user pick one
- Re-resolve with selected candidate

**If not resolved and reason is "no_match":**
- Inform user: "No feature matches '$ARGUMENTS'. Check available features with `/gsd:status`."

## 3. Workflow Invocation

```
@~/.claude/get-shit-done/workflows/review.md
```

Pass: FEATURE_SLUG, CAPABILITY_SLUG

The review workflow handles:
- Code review against FEATURE.md 3-layer requirements (EU/FN/TC)
- Gap and issue surfacing
- Human checkpoint if issues found
- Auto-chain to doc stage if clean

</process>

<success_criteria>
- Feature resolved via 3-tier slug resolution (feature type hint)
- Review workflow invoked with correct feature context
- Ambiguous matches presented for selection
- No-match directs user to /gsd:status for discovery
</success_criteria>
