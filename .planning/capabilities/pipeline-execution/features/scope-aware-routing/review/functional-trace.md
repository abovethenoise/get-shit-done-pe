---
feature: pipeline-execution/scope-aware-routing
review_type: functional
reviewer: functional-reviewer
date: 2026-03-04
files_reviewed:
  - commands/gsd/new.md
  - commands/gsd/enhance.md
  - commands/gsd/debug.md
  - commands/gsd/refactor.md
  - commands/gsd/execute.md (reference)
---

# Functional Trace: Scope-Aware Pipeline Routing

## Phase 1: Requirements Internalized

| Req | Behavior Contract |
|-----|-------------------|
| FN-01 | slug-resolve used for all lens commands; resolved capability → capability-orchestrator+LENS; resolved feature → framing-pipeline; ambiguous → AskUserQuestion candidates; no_match in /gsd:new → ask "New capability or feature?"; no_match in other lenses → error + /gsd:status |
| FN-02 | On capability path: read CAPABILITY.md features table; for each feature not on disk: create dir + stub FEATURE.md via feature-create; stubs only; empty table → error + suggest discuss-capability |
| FN-03 | /gsd:new unknown slug + user picks "new capability" → discuss-capability; after completes → AskUserQuestion fan-out ("Continue" → capability-orchestrator LENS=new; "Individual" → show next steps and stop) |
| FN-04 | All four commands (/gsd:new, /gsd:enhance, /gsd:debug, /gsd:refactor) have identical-pattern routing branch; capability → orchestrator; feature → framing-pipeline; pattern is consistent copy |

---

## Phase 2: Trace Against Code

---

### FN-01: Slug resolution determines scope

**Verdict:** PASS

**Evidence:**

**new.md — slug-resolve call:**
- `commands/gsd/new.md:47-50` — `RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")` / `Parse JSON result for: resolved, tier, type, capability_slug, feature_slug, full_path, candidates, reason.`
- Reasoning: Uses the existing `gsd-tools slug-resolve` tool as specified.

**new.md — capability branch:**
- `commands/gsd/new.md:56-58` — `**If resolved and type is "capability":** / - Set CAPABILITY_SLUG from result / - Proceed to Step 3 (feature stub auto-creation)`
- Reasoning: Capability resolution routes to stub creation, which then routes to capability-orchestrator. Satisfies the "route to capability-orchestrator with LENS" contract (orchestrator invoked in Step 4).

**new.md — feature branch:**
- `commands/gsd/new.md:60-63` — `**If resolved and type is "feature":** / - Invoke framing-discovery.md with LENS=new and CAPABILITY_SLUG (derived from feature path) / - Preserve all workflow gates / - Stop after framing-discovery completes`
- Reasoning: Feature resolution routes to framing-pipeline as specified.

**new.md — ambiguous branch:**
- `commands/gsd/new.md:65-70` — `**If not resolved and reason is "ambiguous":** / - Use AskUserQuestion: / - header: "Multiple Matches" / - question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?" / - options: list each candidate with type and full_path / - Re-resolve with the selected candidate, return to top of Step 2`
- Reasoning: Ambiguous case presents candidates via AskUserQuestion as specified.

**new.md — no_match branch (correct behavior for /gsd:new):**
- `commands/gsd/new.md:72-87` — `**If not resolved and reason is "no_match" (or no $ARGUMENTS):** / - Use AskUserQuestion: / - header: "New Work" / - question: "What kind of new work is this?" / - options: "New capability", "New feature under an existing capability"`
- Reasoning: /gsd:new correctly asks "New capability or new feature?" for no_match, not an error. Matches spec.

**enhance.md, debug.md, refactor.md — no_match branches (error + /gsd:status, not create-new):**
- `commands/gsd/enhance.md:69-72` — `**If not resolved and reason is "no_match":** / - Display error: "No capability or feature matches '$ARGUMENTS'." / - Suggest: "Run /gsd:status to see available capabilities and features." / - Stop.`
- `commands/gsd/debug.md:69-72` — identical pattern
- `commands/gsd/refactor.md:69-72` — identical pattern
- Reasoning: Non-new lens commands correctly error with /gsd:status suggestion rather than offering to create. Matches spec differentiation.

**new.md — empty $ARGUMENTS handling:**
- `commands/gsd/new.md:52` — `If $ARGUMENTS is empty: treat as no_match (skip resolution, go to Step 2 no_match branch).`
- Reasoning: Empty argument treated as no_match, triggering the "New capability or new feature?" prompt. Correct.

---

### FN-02: Capability-level auto-creates feature stubs

**Verdict:** PASS

**Evidence:**

**Read CAPABILITY.md and parse features table:**
- `commands/gsd/new.md:93` — `Read .planning/capabilities/{CAPABILITY_SLUG}/CAPABILITY.md. Parse the Features table to extract all feature slugs.`
- Reasoning: Correct source file and parse target specified.

**Empty table error:**
- `commands/gsd/new.md:95-98` — `**If the features table has zero data rows (no features listed):** / - Display error: "No features found in CAPABILITY.md for '{CAPABILITY_SLUG}'." / - Suggest: "Run /gsd:discuss-capability {CAPABILITY_SLUG} to define features first." / - Stop.`
- Reasoning: Empty table condition is handled with error and discuss-capability suggestion as specified.

**Existence check before creation:**
- `commands/gsd/new.md:101` — `Check if .planning/capabilities/{CAPABILITY_SLUG}/features/{feature_slug}/ directory exists`
- Reasoning: Checks existence on disk before attempting creation; only creates when missing.

**feature-create CLI invocation:**
- `commands/gsd/new.md:103-104` — `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{CAPABILITY_SLUG}" "{feature_slug}"`
- Reasoning: Uses the feature-create CLI route as specified in TC-02.

**Status patch to exploring:**
- `commands/gsd/new.md:106` — `After creation, open the created FEATURE.md at .planning/capabilities/{CAPABILITY_SLUG}/features/{feature_slug}/FEATURE.md and change status: planning to status: exploring in the YAML frontmatter.`
- Reasoning: Status patched from `planning` to `exploring` after stub creation as required by TC-02.

**Creation log:**
- `commands/gsd/new.md:107` — `Log: "Created feature stub: {CAPABILITY_SLUG}/{feature_slug}"`
- Reasoning: Each creation is logged with capability/feature slug as specified.

**Skip existing silently:**
- `commands/gsd/new.md:108` — `**If it already exists:** Skip silently (no log, no error)`
- Reasoning: Existing features skipped without error or log, satisfying the no-overwrite constraint.

**Stubs-only contract:**
- `commands/gsd/new.md:110` — `After the loop completes, proceed to Step 4 (capability-orchestrator invocation — direct path, no fan-out offer)`
- Reasoning: After stub creation the command hands off to orchestrator; no discuss-feature auto-run, satisfying the "stubs only — orchestrator handles discovery" constraint.

---

### FN-03: /gsd:new capability flow

**Verdict:** PASS

**Evidence:**

**Route to discuss-capability on "new capability" selection:**
- `commands/gsd/new.md:77-80` — `**If new capability:** / - Invoke discuss-capability workflow / - After discuss-capability completes, use the capability slug it created as CAPABILITY_SLUG / - Proceed to Step 4 (fan-out offer)`
- Reasoning: Correctly routes to discuss-capability and then proceeds to fan-out offer, not directly to orchestrator.

**Fan-out AskUserQuestion present:**
- `commands/gsd/new.md:123-129` — `**Fan-out offer (only when arriving from discuss-capability path):** / Before invoking orchestrator, use AskUserQuestion: / - header: "Pipeline Ready" / - question: "Capability and features defined. Continue to pipeline for all features now?" / - options: "Continue (run pipeline for all features)", "I'll run them individually" / - If "I'll run them individually": display next steps ("Run /gsd:new {feature_slug} for each feature") and stop / - If "Continue": invoke capability-orchestrator`
- Reasoning: Implements the exact AskUserQuestion fan-out contract from spec. Both branches handled.

**LENS=new passed to orchestrator:**
- `commands/gsd/new.md:117` — `Pass: CAPABILITY_SLUG, LENS=new`
- Reasoning: Correct LENS value passed when invoking capability-orchestrator from the fan-out continue path.

**Individual path shows next steps and stops:**
- `commands/gsd/new.md:128` — `If "I'll run them individually": display next steps ("Run /gsd:new {feature_slug} for each feature") and stop`
- Reasoning: Individual choice correctly shows next steps and stops without invoking orchestrator.

**Direct path (resolved-as-capability) skips fan-out:**
- `commands/gsd/new.md:131-133` — `**Direct path (arriving from Step 2 resolved-as-capability):** / Invoke capability-orchestrator directly without fan-out offer.`
- Reasoning: Fan-out offer is correctly restricted to the discuss-capability path only, not the resolved-as-capability path. This distinction is explicitly encoded.

---

### FN-04: Four lens commands updated with capability routing

**Verdict:** PASS

**Evidence:**

**All four commands have slug-resolve Step 1:**
- `commands/gsd/new.md:47-50` — `RESOLVED=$(node ... slug-resolve "$ARGUMENTS")` / Parse JSON for resolved, tier, type, etc.
- `commands/gsd/enhance.md:47-50` — identical slug-resolve call and parse
- `commands/gsd/debug.md:47-50` — identical slug-resolve call and parse
- `commands/gsd/refactor.md:47-50` — identical slug-resolve call and parse
- Reasoning: All four commands use the same slug-resolve invocation pattern.

**All four commands have capability → orchestrator branch:**
- `commands/gsd/new.md:56-58` — capability path proceeds to stub creation then orchestrator (LENS=new at line 117)
- `commands/gsd/enhance.md:58-60` — `**If resolved and type is "capability":** / - Invoke capability-orchestrator.md with CAPABILITY_SLUG and LENS=enhance`
- `commands/gsd/debug.md:58-60` — `**If resolved and type is "capability":** / - Invoke capability-orchestrator.md with CAPABILITY_SLUG and LENS=debug`
- `commands/gsd/refactor.md:58-60` — `**If resolved and type is "capability":** / - Invoke capability-orchestrator.md with CAPABILITY_SLUG and LENS=refactor`
- Reasoning: All four commands route capability slugs to capability-orchestrator with the correct LENS for each command.

**All four commands have feature → framing-pipeline branch:**
- `commands/gsd/new.md:60-63` — feature → framing-discovery.md with LENS=new, all workflow gates preserved
- `commands/gsd/enhance.md:54-57` — feature → framing-discovery.md with LENS=enhance, all workflow gates preserved
- `commands/gsd/debug.md:54-57` — feature → framing-discovery.md with LENS=debug, all workflow gates preserved
- `commands/gsd/refactor.md:54-57` — feature → framing-discovery.md with LENS=refactor, all workflow gates preserved
- Reasoning: All four commands preserve framing-discovery invocation for feature-level slugs with correct per-command LENS.

**Pattern consistency (consistent copy across all 4):**
- enhance.md, debug.md, refactor.md: all follow the same 3-step structure (Step 1: Resolve, Step 2: Handle Result with 4 branches, Step 3: Workflow Invocation) as established by the execute.md reference implementation
- new.md: follows the same 4-step structure (Step 1: Resolve, Step 2: Handle Result, Step 3: Stub Creation, Step 4: Orchestrator) with the additional /gsd:new-specific behavior correctly isolated
- Reasoning: Routing pattern is consistent copy across commands. Each command's LENS value is unique and correct throughout its process block. FN-04's "Pattern is identical across all 4 commands" contract is satisfied — the routing shape is identical; the extra steps in new.md are additive, not divergent.

**capability-orchestrator.md in execution_context for all four commands:**
- `commands/gsd/new.md:31` — `@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md`
- `commands/gsd/enhance.md:31` — `@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md`
- `commands/gsd/debug.md:31` — `@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md`
- `commands/gsd/refactor.md:31` — `@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md`
- Reasoning: All four commands include capability-orchestrator.md in execution_context, ensuring it is loaded when the command runs.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| FN-01 | PASS | new.md:47-87, enhance.md:47-72, debug.md:47-72, refactor.md:47-72 — all 4 cases (capability, feature, ambiguous, no_match) handled correctly per command type |
| FN-02 | PASS | new.md:93-110 — CAPABILITY.md parsed, empty table errored, existence check before creation, feature-create CLI used, status patched to exploring, creation logged, existing skipped |
| FN-03 | PASS | new.md:77-80, 123-129 — discuss-capability invoked on no_match+new-capability; fan-out AskUserQuestion present; both branches (continue/individual) handled; direct path skips fan-out |
| FN-04 | PASS | new.md:56-63, enhance.md:54-60, debug.md:54-60, refactor.md:54-60 — all 4 commands have capability branch (orchestrator+correct LENS) and feature branch (framing-discovery preserved) with consistent routing pattern |
