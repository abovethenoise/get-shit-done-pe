---
name: gsd:new
description: Architect mode -- define problem space before solutioning through structured discovery. Works at capability or feature level.
argument-hint: "[capability or feature slug, or empty for disambiguation]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---
<objective>
Run architect-mode discovery for a new capability or feature. Resolves slug type first, then routes to the correct workflow. Capability-level input triggers feature stub auto-creation and framing-pipeline. Feature-level input runs framing-discovery directly. Unknown slugs prompt user to disambiguate.

**Thinking mode:** Forward -- from problem to shape. Exploratory but disciplined. Define before designing.

**Flow:** Resolve slug type -> route: capability (stub creation + framing-pipeline) | feature (framing-discovery) | ambiguous (AskUserQuestion candidates) | no_match (AskUserQuestion capability-or-feature)

**MVU (Minimum Viable Understanding):**
- The problem or goal stated in one sentence with audience identified
- Who experiences this problem (specific, not "users")
- A list of scenarios or examples that illustrate the problem or goal
- At least one observable, testable done criterion
- Non-negotiable constraints identified (or explicitly unconstrained)
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
@{GSD_ROOT}/get-shit-done/workflows/discuss-capability.md
@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</execution_context>

<context>
**Lens:** new
**User reference:** $ARGUMENTS

Context files are resolved inside the workflow via `gsd-tools init framing-discovery new`.
</context>

<process>
## 1. Resolve Slug

If $ARGUMENTS is provided:
```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")
```
Parse JSON result for: `resolved`, `tier`, `type`, `capability_slug`, `feature_slug`, `full_path`, `candidates`, `reason`.

If $ARGUMENTS is empty: treat as no_match (skip resolution, go to Step 2 no_match branch).

## 2. Handle Resolution Result

**If resolved and type is "capability":**
- Set CAPABILITY_SLUG from result
- Proceed to Step 3 (feature stub auto-creation)

**If resolved and type is "feature":**
- Invoke framing-discovery.md with LENS=new and FEATURE_SLUG from result
- Capability context comes from the feature's composes[] if populated, not forced
- Preserve all workflow gates (fuzzy resolution confirmation, MVU tracking, misclassification detection, mandatory summary playback)
- Stop after framing-discovery completes

**If not resolved and reason is "ambiguous":**
- Use AskUserQuestion:
  - header: "Multiple Matches"
  - question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?"
  - options: list each candidate with type and full_path
- Re-resolve with the selected candidate, return to top of Step 2

**If not resolved and reason is "no_match" (or no $ARGUMENTS):**
- Use AskUserQuestion:
  - header: "New Work"
  - question: "What kind of new work is this?"
  - options: "New capability", "New feature"
- **If new capability:**
  - Invoke discuss-capability workflow
  - After discuss-capability completes, use the capability slug it created as CAPABILITY_SLUG
  - Proceed to Step 3 (feature stub auto-creation), then Step 4 (fan-out offer)
- **If new feature:**
  - Use the user's original input as the feature name
  - Create the feature: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{name}"`
  - Invoke framing-discovery.md with LENS=new and FEATURE_SLUG (from the created feature)
  - Stop after framing-discovery completes

## 3. Feature Stub Auto-Creation (capability path only)

Before invoking framing-pipeline, ensure feature directories exist for all features listed in CAPABILITY.md.

Scan `.planning/features/*/FEATURE.md` for features whose `composes[]` includes capabilities related to CAPABILITY_SLUG. Also check if discuss-capability created feature stubs.

**If no features found that compose this capability:**
- Display error: "No features found composing '{CAPABILITY_SLUG}'."
- Suggest: "Run /gsd:discuss-capability {CAPABILITY_SLUG} to define features first."
- Stop.

**For each feature slug that needs stub creation:**
- Check if `.planning/features/{feature_slug}/` directory exists
- **If it does not exist:**
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{feature_slug}"
  ```
  After creation, open the created FEATURE.md at `.planning/features/{feature_slug}/FEATURE.md` and change `status: planning` to `status: exploring` in the YAML frontmatter.
  Log: "Created feature stub: {feature_slug}"
- **If it already exists:** Skip silently (no log, no error)

After the loop completes, proceed to Step 4 (framing-pipeline invocation — direct path, no fan-out offer).

## 4. Framing-Pipeline Invocation

```
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
```
Pass: CAPABILITY_SLUG, LENS=new

**Note:** Step 4 is reached either from:
- Step 2 "resolved as capability" path (after Step 3 stub creation) — invoke pipeline directly, no fan-out offer
- Step 2 "no_match → new capability" path (after Step 3 stub creation) — present fan-out offer first

**Fan-out offer (only when arriving from discuss-capability path):**
Before invoking pipeline, use AskUserQuestion:
- header: "Pipeline Ready"
- question: "Capability and features defined. Continue to pipeline for all features now?"
- options: "Continue (run pipeline for all features)", "I'll run them individually"
- If "I'll run them individually": display next steps ("Run /gsd:new {feature_slug} for each feature") and stop
- If "Continue": invoke framing-pipeline

**Direct path (arriving from Step 2 resolved-as-capability):**
Invoke framing-pipeline directly without fan-out offer.
</process>

<success_criteria>
- Slug resolved; capability -> stub creation + framing-pipeline, feature -> framing-discovery
- Unknown slug asks capability-or-feature; routes correctly to discuss-capability or framing-discovery
- Feature stubs created for missing features; existing features skipped; empty table errors
- Post-discuss-capability fan-out offer presented before framing-pipeline invocation
- Feature-level framing-discovery invocation preserved (no regression from original behavior)
</success_criteria>
