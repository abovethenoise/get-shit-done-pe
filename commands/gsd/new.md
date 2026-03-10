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
  - After discuss-capability completes, stop. The capability is defined.
  - Display next steps: "Create features that compose this capability with `/gsd:new {feature-name}`, then use `/gsd:discuss-feature` to explore each one."
- **If new feature:**
  - Use the user's original input as the feature name
  - Create the feature: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{name}"`
  - Invoke framing-discovery.md with LENS=new and FEATURE_SLUG (from the created feature)
  - Stop after framing-discovery completes

## 3. Framing-Pipeline Invocation (capability path only)

Reached from Step 2 "resolved as capability" path.

Scan `.planning/features/*/FEATURE.md` for features whose `composes[]` includes CAPABILITY_SLUG.

**If no features found that compose this capability:**
- Display error: "No features found composing '{CAPABILITY_SLUG}'."
- Suggest: "Create features first with `/gsd:new {feature-name}`, then `/gsd:discuss-feature` to explore each one."
- Stop.

```
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
```
Pass: CAPABILITY_SLUG, LENS=new

Invoke framing-pipeline directly — it fans out to all features that compose this capability.
</process>

<success_criteria>
- Slug resolved; capability -> framing-pipeline (if composing features exist), feature -> framing-discovery
- Unknown slug asks capability-or-feature; capability routes to discuss-capability then stops, feature creates and routes to framing-discovery
- No features composing capability -> error with guidance to create features first
- Feature-level framing-discovery invocation preserved (no regression from original behavior)
</success_criteria>
