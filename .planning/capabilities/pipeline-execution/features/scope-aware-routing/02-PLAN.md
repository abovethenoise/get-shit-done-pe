---
phase: pipeline-execution/scope-aware-routing
plan: "02"
wave: 1
depends_on: []
files_modified:
  - commands/gsd/new.md
autonomous: true
requirements:
  - EU-01
  - EU-02
  - FN-01
  - FN-02
  - FN-03
  - FN-04
  - TC-01
  - TC-02
must_haves:
  - new.md resolves slug type first; capability slug routes to capability-orchestrator with LENS=new after stub auto-creation
  - new.md unknown slug asks "New capability or new feature?" via AskUserQuestion; capability -> discuss-capability; feature -> ask which capability, then discuss-feature
  - After discuss-capability, new.md offers AskUserQuestion fan-out choice; "Continue" invokes capability-orchestrator with LENS=new; "Individual" shows next steps and stops
  - new.md capability-level routing auto-creates feature stubs from CAPABILITY.md features table: each missing feature gets a directory + FEATURE.md with status=exploring, existing features are skipped, empty table errors
  - feature branch in new.md preserves original framing-discovery invocation
---

# Plan 02: /gsd:new capability routing, disambiguation, and stub creation

## Objective

Rewrite `commands/gsd/new.md` to handle four cases: (1) resolved capability slug → stub auto-creation + capability-orchestrator, (2) resolved feature slug → framing-discovery (unchanged), (3) ambiguous slug → AskUserQuestion candidates, (4) no_match → "New capability or new feature?" disambiguation with discuss-capability or discuss-feature routing. Post-discuss-capability fan-out offer added. Feature stub auto-creation logic handles CAPABILITY.md table parsing, existence checks, creation, and status patching.

## Context

@/Users/philliphall/get-shit-done-pe/commands/gsd/new.md
@/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md
@/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md
@/Users/philliphall/get-shit-done-pe/get-shit-done/templates/feature.md
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/scope-aware-routing/FEATURE.md
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/scope-aware-routing/RESEARCH.md

## Tasks

<task name="update-new-routing-and-disambiguation">
  <files>
    commands/gsd/new.md
  </files>
  <action>
Restructure `commands/gsd/new.md`. The current `<process>` block delegates everything to framing-discovery. Replace it with a 4-step routing pattern.

**Add to `<execution_context>`:**
- `@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md`
- `@{GSD_ROOT}/get-shit-done/workflows/discuss-capability.md`
- Keep existing `framing-discovery.md` reference

**New `<process>` block:**

```
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
- Invoke framing-discovery.md with LENS=new and CAPABILITY_SLUG (derived from feature path)
- Preserve all workflow gates
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
  - options: "New capability", "New feature under an existing capability"
- **If new capability:**
  - Invoke discuss-capability workflow
  - After discuss-capability completes, use the capability slug it created as CAPABILITY_SLUG
  - Proceed to Step 4 (fan-out offer)
- **If new feature:**
  - Use AskUserQuestion:
    - header: "Which Capability?"
    - question: "Which capability does this feature belong to? Enter the capability slug."
  - Run slug-resolve on the user's input; if not a capability, ask again
  - Invoke framing-discovery.md with LENS=new and CAPABILITY_SLUG
  - Stop after framing-discovery completes

## 3. Feature Stub Auto-Creation (capability path only)

Before invoking capability-orchestrator, ensure feature directories exist for all features listed in CAPABILITY.md.

Read `.planning/capabilities/{CAPABILITY_SLUG}/CAPABILITY.md`. Parse the Features table to extract all feature slugs.

**If the features table has zero data rows (no features listed):**
- Display error: "No features found in CAPABILITY.md for '{CAPABILITY_SLUG}'."
- Suggest: "Run /gsd:discuss-capability {CAPABILITY_SLUG} to define features first."
- Stop.

**For each feature slug in the features table:**
- Check if `.planning/capabilities/{CAPABILITY_SLUG}/features/{feature_slug}/` directory exists
- **If it does not exist:**
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{CAPABILITY_SLUG}" "{feature_slug}"
  ```
  After creation, open the created FEATURE.md at `.planning/capabilities/{CAPABILITY_SLUG}/features/{feature_slug}/FEATURE.md` and change `status: planning` to `status: exploring` in the YAML frontmatter.
  Log: "Created feature stub: {CAPABILITY_SLUG}/{feature_slug}"
- **If it already exists:** Skip silently (no log, no error)

After the loop completes, proceed to capability-orchestrator invocation.

## 4. Capability-Orchestrator Invocation

```
@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md
```
Pass: CAPABILITY_SLUG, LENS=new

**Note:** Step 4 is reached either from:
- Step 2 "resolved as capability" path (after Step 3 stub creation)
- Step 2 "no_match → new capability" path after discuss-capability completes (skip Step 3, proceed directly here since discuss-capability just populated CAPABILITY.md)

**Fan-out offer (only when arriving from discuss-capability path):**
Before invoking orchestrator, use AskUserQuestion:
- header: "Pipeline Ready"
- question: "Capability and features defined. Continue to pipeline for all features now?"
- options: "Continue (run pipeline for all features)", "I'll run them individually"
- If "I'll run them individually": display next steps ("Run /gsd:new {feature_slug} for each feature") and stop
- If "Continue": invoke capability-orchestrator

**Direct path (arriving from Step 2 resolved-as-capability):**
Invoke capability-orchestrator directly without fan-out offer.
```

**Update `<objective>` block** to reflect that /gsd:new operates at both capability and feature level.

**Update `<success_criteria>`** to include:
- Slug resolved; capability -> stub creation + orchestrator, feature -> framing-discovery
- Unknown slug asks capability-or-feature; routes correctly to discuss-capability or discuss-feature
- Feature stubs created for missing features; existing features skipped; empty table errors
- Post-discuss-capability fan-out offer presented
  </action>
  <verify>
Read the updated `commands/gsd/new.md`. Confirm:
1. `<execution_context>` includes `capability-orchestrator.md`, `discuss-capability.md`, and `framing-discovery.md`
2. `<process>` has Steps 1, 2, 3, 4
3. Step 2 has all 4 branches: feature (→framing-discovery), capability (→Step 3), ambiguous (→AskUserQuestion), no_match (→AskUserQuestion capability-or-feature)
4. no_match "new capability" branch invokes discuss-capability, then goes to Step 4 fan-out offer
5. no_match "new feature" branch asks which capability, then invokes framing-discovery
6. Step 3 reads CAPABILITY.md features table, errors on empty table, checks disk existence per feature, calls feature-create for missing stubs, patches `status: planning` to `status: exploring` in frontmatter, logs each creation
7. Step 4 direct path (resolved-as-capability) invokes orchestrator without fan-out offer
8. Step 4 discuss-capability path presents AskUserQuestion fan-out offer before invoking orchestrator
9. Original feature-level framing-discovery invocation is preserved in the feature branch of Step 2
  </verify>
  <done>new.md has 4-step routing; capability path includes stub creation + orchestrator; no_match path disambiguates capability vs feature; post-discuss-capability fan-out offer present</done>
  <reqs>EU-01, EU-02, FN-01, FN-02, FN-03, FN-04, TC-01, TC-02</reqs>
</task>

## Verification

After task completes, do a final read of `commands/gsd/new.md` and verify every acceptance criterion from FEATURE.md EU-01 and EU-02 is addressed:

**EU-01 checks:**
- [ ] `/gsd:new {cap}` routes to capability-orchestrator via resolved capability slug
- [ ] Feature-level invocation goes to framing-discovery (no regression)
- [ ] Ambiguous slugs present candidates via AskUserQuestion
- [ ] Capability routing goes through stub creation first, then orchestrator

**EU-02 checks:**
- [ ] Unknown slug triggers AskUserQuestion "New capability or new feature?"
- [ ] Capability choice routes to discuss-capability
- [ ] Feature choice asks which capability, then routes to discuss-feature (framing-discovery)
- [ ] After discuss-capability, user offered fan-out or individual option

**TC-02 checks:**
- [ ] Stub creation uses `feature-create` CLI route
- [ ] Existing features are skipped (existence check before create call)
- [ ] Status patched to `exploring` after creation
- [ ] Each creation logged with capability/feature slug

## Success Criteria

- [ ] new.md: resolved capability slug triggers stub auto-creation then capability-orchestrator
- [ ] new.md: resolved feature slug triggers framing-discovery (preserved behavior)
- [ ] new.md: ambiguous slug presents AskUserQuestion candidates
- [ ] new.md: no_match slug asks "New capability or new feature?"
- [ ] new.md: "new capability" choice runs discuss-capability, then offers fan-out
- [ ] new.md: "new feature" choice asks which capability, then runs framing-discovery
- [ ] new.md: stub loop checks existence, skips existing, patches status to `exploring`, logs new stubs
- [ ] new.md: empty features table produces error + suggest discuss-capability
