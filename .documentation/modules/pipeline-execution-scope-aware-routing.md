---
type: module-doc
built-from-code-at: d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
last-verified: 2026-03-04
---

## Module: scope-aware-routing

## Purpose: [derived]

Adds capability-level routing to all four lens commands (`/gsd:new`, `/gsd:enhance`, `/gsd:debug`, `/gsd:refactor`). Before this feature, each command only ran at feature level. Now each command resolves the input slug first, then branches: capability slugs fan out via `capability-orchestrator.md`; feature slugs invoke `framing-discovery.md` as before; ambiguous slugs present candidates; unmatched slugs either ask "capability or feature?" (`/gsd:new`) or error with a status suggestion (the other three).

`/gsd:new` additionally handles feature stub auto-creation: before invoking the orchestrator it reads `CAPABILITY.md`'s features table and creates missing feature directories using `feature-create`, patching `status: planning` to `status: exploring` after each creation.

The four commands in `commands/gsd/` are the modified files. No shared routing abstraction was introduced — each command carries the routing logic inline, consistent with the project decision to not abstract until a second use case forces it.

## Exports: [derived]

These are workflow prompt files, not code modules. Each exposes a prompt interface consumed by the Claude model.

**`commands/gsd/new.md`** — 4-step routing process:
- Step 1: Run `gsd-tools slug-resolve $ARGUMENTS`, parse JSON result
- Step 2: Branch on resolved type:
  - `type: capability` → Step 3 (stub creation), then Step 4 (direct orchestrator invocation)
  - `type: feature` → invoke `framing-discovery.md` with LENS=new, stop
  - `ambiguous` → AskUserQuestion with candidate list, re-resolve, return to top of Step 2
  - `no_match` (or empty ARGUMENTS) → AskUserQuestion "New capability or new feature?":
    - New capability: invoke `discuss-capability`, then Step 3, then Step 4 (with fan-out offer)
    - New feature: AskUserQuestion for capability slug, invoke `framing-discovery.md`, stop
- Step 3: Feature stub auto-creation loop:
  - Read `.planning/capabilities/{CAPABILITY_SLUG}/CAPABILITY.md`, parse features table
  - Empty features table → error, suggest `/gsd:discuss-capability`, stop
  - For each feature slug: check disk existence; if missing, run `feature-create` CLI, patch `status: planning` → `status: exploring`, log creation; if exists, skip silently
- Step 4: Invoke `capability-orchestrator.md` with CAPABILITY_SLUG and LENS=new
  - Fan-out offer (AskUserQuestion) only when arriving from the `discuss-capability` path
  - Direct invocation (no offer) when arriving from a pre-existing resolved capability slug

**`commands/gsd/enhance.md`** — 2-step routing process:
- Step 1: Run `gsd-tools slug-resolve $ARGUMENTS`, parse JSON result
- Step 2: Branch on resolved type:
  - `type: feature` → invoke `framing-discovery.md` with LENS=enhance (all workflow gates preserved)
  - `type: capability` → invoke `capability-orchestrator.md` with CAPABILITY_SLUG and LENS=enhance
  - `ambiguous` → AskUserQuestion with candidate list, re-resolve, return to top of Step 2
  - `no_match` → error "No capability or feature matches", suggest `/gsd:status`, stop

**`commands/gsd/debug.md`** — 2-step routing process:
- Step 1: Run `gsd-tools slug-resolve $ARGUMENTS`, parse JSON result
- Step 2: Branch on resolved type (same pattern as enhance.md, LENS=debug)

**`commands/gsd/refactor.md`** — 2-step routing process:
- Step 1: Run `gsd-tools slug-resolve $ARGUMENTS`, parse JSON result
- Step 2: Branch on resolved type (same pattern as enhance.md, LENS=refactor)

**Slug resolution JSON fields used by all 4 commands:**
`resolved`, `tier`, `type`, `capability_slug`, `feature_slug`, `full_path`, `candidates`, `reason`

## Depends-on: [derived]

- `get-shit-done/bin/gsd-tools.cjs` — `slug-resolve` subcommand (returns `type: capability | feature`)
- `get-shit-done/bin/gsd-tools.cjs` — `feature-create` subcommand (`/gsd:new` stub creation path only)
- `get-shit-done/workflows/capability-orchestrator.md` — receives CAPABILITY_SLUG + LENS for fan-out
- `get-shit-done/workflows/framing-discovery.md` — receives LENS + CAPABILITY_SLUG for feature-level runs
- `get-shit-done/workflows/discuss-capability.md` — invoked by `/gsd:new` no_match→new-capability path
- `get-shit-done/references/framing-lenses.md` — lens behavioral specifications
- `get-shit-done/references/ui-brand.md` — UI branding reference
- `.planning/capabilities/{cap}/CAPABILITY.md` — features table parsed by `/gsd:new` stub creation loop

## Constraints: [authored]

- All 4 lens commands route through `gsd-tools slug-resolve` before any workflow invocation. No slug is assumed to be a feature or capability without resolution.
- No shared routing abstraction layer exists by design (TC-01 decision: routing is inlined per command, no shared module until a second non-lens use case appears).
- `no_match` behavior is lens-specific: `/gsd:new` asks "capability or feature?"; `/gsd:enhance`, `/gsd:debug`, `/gsd:refactor` error and suggest `/gsd:status`. This is intentional — the other lenses work on existing things and should not offer to create new work.
- Feature stub creation uses existence check first; `feature-create` is only called for missing directories (no overwrite).
- Ambiguous resolution re-loops to the top of Step 2 after user selection. The "return to top of Step 2" instruction is explicit in all 4 commands (Finding 2 from review, fixed post-review).
- Fan-out offer (Step 4 AskUserQuestion) only fires on the `discuss-capability` path in `/gsd:new`. A directly resolved capability slug bypasses the offer and invokes the orchestrator immediately.
- The `discuss-capability` path in `/gsd:new` routes through Step 3 stub creation before Step 4 (Finding 1 from review, fixed post-review).

## WHY: [authored]

**Inline routing per command, no shared abstraction (TC-01 decision):** The routing logic is identical in shape across all 4 commands but implemented inline in each. This is intentional: `no-premature-abstraction` constraint applies — there is no second use case outside lens commands to justify a shared routing layer. If a fifth lens command is added, the copy is the cost of that decision.

**no_match diverges between /gsd:new and the other three (RESEARCH.md AC-09):** Research confirmed that enhance/debug/refactor users who provide an unknown slug made a mistake and need correction, not a creation flow. Offering "create new" from debug mode would be a category error. Only `/gsd:new` is in the business of creating new work.

**Status patch done inline, not via CLI flag (02-PLAN.md decision):** `feature-create` CLI writes `status: planning` from the template; TC-02 required `status: exploring` for stubs. Rather than modifying the shared CLI binary, the workflow prose instructs the agent to patch the status after creation. This avoids modifying shared infrastructure for a workflow-level concern. (Note: Finding 3 from review proposed a `--status` CLI flag; this was dismissed because the two-step inline approach is consistent with how discuss-capability works and avoids binary changes.)

**Fan-out offer only on discuss-capability path (02-PLAN.md decision):** When a user resolves an existing capability, they know it has features and likely want the pipeline to run immediately. When a user just ran `discuss-capability` to create a new capability, they may not want to commit to a full fan-out yet. The offer is therefore gated on which path was taken, not on capability-vs-feature type alone.
