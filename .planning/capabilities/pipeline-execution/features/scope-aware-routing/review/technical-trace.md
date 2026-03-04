# Technical Review: scope-aware-routing

**Reviewer role:** Technical trace — TC-xx compliance
**Date:** 2026-03-04
**Files reviewed:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md`
- `/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md`
- `/Users/philliphall/get-shit-done-pe/commands/gsd/debug.md`
- `/Users/philliphall/get-shit-done-pe/commands/gsd/refactor.md`
- `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md` (reference)
- `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/feature.md`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/template.cjs`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs`

---

## Phase 1: Requirements Internalized

**TC-01** requires:
1. All 4 lens commands (new, enhance, debug, refactor) add a capability-level routing branch to their slug resolution handler.
2. Routing pattern: resolve slug -> check `type` -> branch on `capability` (orchestrator) vs `feature` (framing-pipeline).
3. Ambiguity handled via AskUserQuestion with candidates (same pattern as /gsd:doc, /gsd:review).
4. Existing feature-level invocation must not break.
5. Upstream `gsd-tools slug-resolve` returns `type: capability | feature` — implementation must consume this field.
6. Downstream: capability-orchestrator.md receives CAPABILITY_SLUG + LENS.

**TC-02** requires:
1. Feature stubs auto-created from CAPABILITY.md features table when directories don't exist on disk.
2. Template used: `get-shit-done/templates/feature.md`.
3. No overwrite: only create if directory does not already exist.
4. Status set to `exploring` in stub FEATURE.md frontmatter.
5. Log each creation: "Created feature stub: {cap}/{feat}".
6. Scoped to new.md capability path only (not enhance/debug/refactor).

---

## Phase 2: Trace Against Code

### TC-01: Lens command routing changes

**Verdict:** PASS (proven)

**Evidence:**

**new.md — slug resolution and routing:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:48` — `RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")`
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:50` — `Parse JSON result for: resolved, tier, type, capability_slug, feature_slug, full_path, candidates, reason.`
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:56-63` — Branches on `type is "capability"` (Step 3 stub creation + Step 4 orchestrator) and `type is "feature"` (framing-discovery.md with LENS=new).
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:65-70` — Ambiguity branch: AskUserQuestion with candidates, re-resolves.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:115-118` — Capability path passes `CAPABILITY_SLUG, LENS=new` to capability-orchestrator.md.

**enhance.md — slug resolution and routing:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md:47` — `RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")`
- `/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md:50` — Parses `resolved, tier, type, capability_slug, feature_slug, full_path, candidates, reason`.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md:54-60` — `type is "feature"` -> framing-discovery.md with LENS=enhance; `type is "capability"` -> capability-orchestrator.md with CAPABILITY_SLUG and LENS=enhance.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md:62-67` — Ambiguity: AskUserQuestion with candidates list.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md:84-87` — Capability invocation passes `CAPABILITY_SLUG, LENS=enhance`.

**debug.md — slug resolution and routing:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/debug.md:47` — Same `slug-resolve` invocation pattern.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/debug.md:54-60` — Same type branch: feature -> framing-discovery with LENS=debug; capability -> capability-orchestrator with LENS=debug.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/debug.md:62-67` — AskUserQuestion with candidates for ambiguous.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/debug.md:84-87` — Passes `CAPABILITY_SLUG, LENS=debug`.

**refactor.md — slug resolution and routing:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/refactor.md:47` — Same `slug-resolve` invocation pattern.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/refactor.md:54-60` — Same type branch: feature -> framing-discovery with LENS=refactor; capability -> capability-orchestrator with LENS=refactor.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/refactor.md:62-67` — AskUserQuestion with candidates for ambiguous.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/refactor.md:84-87` — Passes `CAPABILITY_SLUG, LENS=refactor`.

**Upstream conformance — resolveSlugInternal returns `type: capability | feature`:**
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs:417` — `return { resolved: true, tier: 1, type: 'capability', capability_slug: capResult.slug, ...`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs:408` — `return { resolved: true, tier: 1, type: 'feature', capability_slug: capPart, feature_slug: featResult.slug, ...`
- Reasoning: Both capability and feature return paths produce the `type` field that all 4 commands branch on. Interface contract is met.

**Feature-level preservation (no regression):**
- All 4 commands retain `type is "feature"` branch that invokes framing-discovery.md with the correct LENS. The capability branch is additive; it does not replace or modify the feature path. The reference implementation in execute.md follows the same structural pattern and is structurally equivalent.

**Spec-vs-reality gap:** None. The spec noted ambiguity should follow the `/gsd:doc, /gsd:review` pattern. All 4 commands use AskUserQuestion with `header: "Multiple Matches"` and list candidates with type and full_path, matching that pattern exactly.

---

### TC-02: Feature stub auto-creation

**Verdict:** PARTIAL (proven)

**Evidence:**

**Step presence and location:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:89-110` — Step 3 "Feature Stub Auto-Creation" exists and is scoped to capability path only, as specified.

**CAPABILITY.md parsing:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:93` — `Read .planning/capabilities/{CAPABILITY_SLUG}/CAPABILITY.md. Parse the Features table to extract all feature slugs.`
- Reasoning: Implementation specifies parsing the features table. This is prose instruction to the AI agent executing the command, not programmatic code. No CLI tool call for this parsing step is specified or implemented. The agent is expected to read and parse the markdown table inline.

**No-overwrite constraint:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:101-108` — `Check if .planning/capabilities/{CAPABILITY_SLUG}/features/{feature_slug}/ directory exists. If it does not exist: [create]. If it already exists: Skip silently (no log, no error).`
- Reasoning: No-overwrite logic is correctly specified in the command prose.

**Template used for stub creation:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:104` — `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{CAPABILITY_SLUG}" "{feature_slug}"`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs:388-391` — `case 'feature-create': cmdFeatureCreate(cwd, args[1], args[2], raw);`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs:43` — `const content = fillTemplate('feature', { name, slug, capability: capSlug, date: today });`
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/template.cjs:261` — `const templatePath = path.join(__dirname, '..', '..', 'templates', 'feature.md');`
- Reasoning: The feature-create command reads from `get-shit-done/templates/feature.md`, matching the spec constraint.

**STATUS constraint — `exploring` vs actual template default:**

This is the gap finding.

- The spec requires: `Set status to exploring in stub FEATURE.md` (TC-02 constraint).
- `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/feature.md:4` — `status: planning`
- The `feature-create` CLI command (`cmdFeatureCreate`) writes the template content verbatim via `fillTemplate`. It does NOT patch the status field.
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:106` — `After creation, open the created FEATURE.md at ... and change status: planning to status: exploring in the YAML frontmatter.`
- Reasoning: The status patch is implemented as a second step in the command prose — the agent is instructed to open the file after `feature-create` runs and manually change the frontmatter. The `feature-create` CLI itself always writes `status: planning` from the template. The `exploring` status only results if the agent successfully executes the prose instruction after the bash call. This is a behavioral dependency on the agent, not a programmatic guarantee.

**Log constraint:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:107` — `Log: "Created feature stub: {CAPABILITY_SLUG}/{feature_slug}"`
- Reasoning: The log instruction is in agent prose, not in the CLI output. The `feature-create` CLI does output a JSON result (`{ created: true, slug, capability_slug, path, feature_path }`), but the formatted log string `"Created feature stub: {cap}/{feat}"` is the agent's responsibility to emit based on that output.

**Empty table error handling:**
- `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:95-98` — Empty features table guard: display error and suggest running `/gsd:discuss-capability`, stop.
- Reasoning: Matches spec. Edge case is handled.

**Spec-vs-reality gap:** The spec states the status field is set to `exploring` as a constraint on the created stub. The actual implementation splits this across two operations: (1) `feature-create` CLI writes `status: planning` from the template, (2) the command prose instructs the agent to patch it afterward. The CLI itself has no `--status` flag or `exploring` override. The constraint is only met if the agent executes the post-creation patch step correctly. The spec does not acknowledge this two-step split; it implies the status is set during creation. This is a feasibility gap: the template hardcodes `planning` and the CLI does not accept a status override, making a single atomic creation with `exploring` status impossible without agent intervention.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| TC-01  | PASS | new.md:56-63, enhance.md:54-60, debug.md:54-60, refactor.md:54-60 — all 4 commands branch on `type: capability/feature`; capability path passes CAPABILITY_SLUG + LENS to orchestrator; feature path preserved; ambiguity uses AskUserQuestion with candidates |
| TC-02  | PARTIAL | new.md:104 calls `feature-create` which uses correct template (feature.cjs:43, template.cjs:261); no-overwrite at new.md:101-108 is correct; status `exploring` is a two-step agent operation not a programmatic guarantee — template hardcodes `planning` (feature.md:4), CLI has no status override flag |

**TC-02 gap detail:** The `exploring` status requirement (TC-02 constraint 4) depends on the agent executing a post-creation file edit. The `feature-create` CLI always produces `status: planning`. If the agent skips or mis-executes new.md:106, stubs will have `status: planning` rather than `status: exploring`. The spec presents this as an atomic creation constraint; the implementation requires two steps.
