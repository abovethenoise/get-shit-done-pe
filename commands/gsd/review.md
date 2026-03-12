---
name: gsd:review
description: Review a feature or capability's implementation against its requirements
argument-hint: "<feature or capability slug>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---

<objective>
Run code review + requirements verification for a feature or capability. Accepts both scopes -- resolves the user's reference and routes accordingly. Feature scope reviews a single feature. Capability scope reviews all executed features within the capability.

**Flow:** slug-resolve -> route (feature | capability) -> review.md workflow
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/review.md
</execution_context>

<context>
**User reference:** $ARGUMENTS (required -- feature slug, capability slug, or cap/feat path)

Context resolved via `gsd-tools slug-resolve` (no type hint -- accepts both scopes).
</context>

<process>
## 1. Resolve Slug

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
```

Parse JSON result for: `resolved`, `type`, `capability_slug`, `feature_slug`, `candidates`, `reason`.

## 2. Handle Resolution Result

**If resolved and type is "feature":**
- Set CAPABILITY_SLUG and FEATURE_SLUG from resolution
- Go to Step 3 (feature-level invocation)

**If resolved and type is "capability":**
- Set CAPABILITY_SLUG from resolution
- Go to Step 4 (capability-level invocation)

**If resolved and type is "focus-group":**
- Read `.planning/focus/{slug}/FOCUS.md` to get scope[]
- Collect all SUMMARY.md, CAPABILITY.md, FEATURE.md from all items in scope
- Invoke review.md workflow with TARGET_TYPE='focus-group', TARGET_SLUG={slug}, and aggregated artifact paths as context
- Review artifacts → `.planning/focus/{slug}/review/`

**If not resolved and reason is "ambiguous":**
- Present candidates to user (all matches)
- Use AskUserQuestion to let user pick one
- Re-resolve with selected candidate

**If not resolved and reason is "no_match":**
- Inform user: "No capability or feature matches '$ARGUMENTS'. Check available features with `/gsd:status`."

## 3. Feature-Level Invocation

```
@{GSD_ROOT}/get-shit-done/workflows/review.md
```

Pass: CAPABILITY_SLUG, FEATURE_SLUG

## 4. Capability-Level Invocation

Read `{capability_dir}/CAPABILITY.md` features table to get all feature slugs.

For each feature_slug in the features table:
- Check if `{capability_dir}/features/{feature_slug}/` has at least one `*-SUMMARY.md` file (indicates execution happened)
- If SUMMARY exists: include in review list
- If not: skip (log: "Skipping {feature_slug} -- no execution artifacts")

If review list is empty:
- Inform user: "No executed features found in {capability_slug}. Run `/gsd:execute {cap/feat}` first."
- Stop.

```
@{GSD_ROOT}/get-shit-done/workflows/review.md
```

Pass: CAPABILITY_SLUG, FEATURE_SLUG=null (capability scope -- review.md handles multi-feature artifact collection)

</process>

<success_criteria>
- Slug resolved via 3-tier resolution (no type constraint)
- Feature-level: review.md invoked for single feature
- Capability-level: review.md invoked with capability scope (FEATURE_SLUG null), processes all executed features
- Ambiguous matches presented for selection
- No-match directs user to /gsd:status for discovery
</success_criteria>
