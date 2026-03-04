# Research Synthesis

**Synthesized:** 2026-03-04
**Subject:** pipeline-execution/scope-aware-routing -- Make lens commands work at both capability and feature level via slug resolution routing
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### slug-resolve already returns type: capability | feature -- no new resolver logic needed

`resolveSlugInternal` returns `{ resolved, type, capability_slug, feature_slug, candidates, reason }` with `type` being `"capability"` or `"feature"`. The routing branch requires only consuming this existing field, not building new resolution infrastructure.

[Sources: Domain Truth, Existing System, Tech Constraints, Prior Art]

### Routing belongs in the lens command files, not inside framing-discovery

The proven pattern from `/gsd:execute` and `/gsd:plan`: command file calls `slug-resolve`, checks `type`, branches to orchestrator (capability) or framing-discovery/pipeline (feature). Currently, lens commands delegate everything to `framing-discovery.md` which has no capability-orchestrator branch. The fork must be promoted to the command level.

[Sources: Existing System, User Intent (IMP-01), Prior Art, Domain Truth]

### capability-orchestrator is directly reusable -- no changes needed

Already accepts `CAPABILITY_SLUG` + `LENS` as inputs, builds DAG from CAPABILITY.md features table, groups into waves, dispatches `framing-pipeline.md` per feature. The routing layer just needs to invoke it when `type="capability"`.

[Sources: Domain Truth, Existing System, Tech Constraints, Prior Art]

### All 4 lens commands get identical inline routing (no shared abstraction layer)

FEATURE.md Decisions explicitly reject a shared routing layer. The pattern is ~5 lines of prose per command: resolve -> check type -> branch. 4x5 lines of consistent copy is acceptable given the explicit decision. `/gsd:execute` and `/gsd:plan` already demonstrate this inline pattern.

[Sources: User Intent (AC-14), Tech Constraints, Prior Art, Domain Truth]

### /gsd:new unknown slug has a different decision tree than enhance/debug/refactor

For `/gsd:new` with `no_match`: ask "New capability or new feature?" For enhance/debug/refactor with `no_match`: error with suggestion to check `/gsd:status`. The lens identity gates the fall-through behavior.

[Sources: Domain Truth, User Intent (AC-04, AC-09), Edge Cases]

### Feature stub status mismatch: template defaults to `planning`, TC-02 requires `exploring`

`feature.md` template hardcodes `status: planning`. `fillTemplate` has no `{status}` variable. TC-02 requires `exploring`. A post-creation patch or template modification is needed.

[Sources: Tech Constraints, Edge Cases, User Intent (IMP-05)]

### Ambiguous slug must present candidates via AskUserQuestion -- never auto-select

When `slug-resolve` returns `reason: ambiguous`, present `candidates[]` to the user. This pattern is consistent across all existing commands that use slug-resolve.

[Sources: Domain Truth, User Intent (AC-08), Edge Cases, Prior Art]

### Empty features table must error before orchestration

If CAPABILITY.md features table has zero data rows, the routing layer must error and suggest running `discuss-capability` first. The orchestrator currently does NOT guard this -- it silently completes with zero features processed.

[Sources: Domain Truth, User Intent (AC-13), Edge Cases]

### cmdFeatureCreate errors on existing features -- stub loop must check existence first

`feature.cjs` lines 27-30 raise a hard error when a feature already exists. The stub auto-creation loop must check disk existence and skip gracefully, not catch-and-continue.

[Sources: Existing System, Tech Constraints, Edge Cases]

## Conflicts

Disagreements between gatherers. Each conflict includes both positions and a resolution.

### Where framing-discovery fits in the capability-level path

**Existing System says:** framing-discovery.md Step 2 already has capability vs feature branching -- but the capability branch routes to MVU Q&A, not capability-orchestrator. The branch exists but is wired wrong.

**User Intent says:** The capability-level branch bypasses framing-discovery entirely -- straight to capability-orchestrator. Framing-discovery is only for the feature path.

**Resolution:** User Intent is correct per the requirements. The capability-level route goes command -> capability-orchestrator (which internally invokes framing-discovery per-feature as needed in Step 4b). The existing framing-discovery capability branch is irrelevant to this feature -- it handles capability-level MVU scoping within discovery, not capability-level orchestrator dispatch. No changes to framing-discovery.md are needed.

### Feature stub status: relax TC-02 or patch after creation?

**Tech Constraints says:** Three options: (a) post-creation patch, (b) add `--status` flag to `feature-create`, (c) accept `planning` and relax TC-02. Simplest: accept `planning` since orchestrator only skips `complete` features.

**User Intent says:** TC-02 explicitly requires `exploring`. The template default must be overridden.

**Resolution:** TC-02 is a stated requirement. The planner should implement a post-creation patch (simplest approach: workflow instruction to update frontmatter status after calling `feature-create`). Adding a `--status` flag is cleaner but modifies shared infrastructure. Planner decides the mechanism.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **What happens when discuss-capability produces zero features** -- FN-02 covers a pre-existing empty table but not the case where discuss-capability itself writes zero features. Whether auto-fan-out offer is skipped or errored is unspecified. [Source: User Intent, single-source ambiguity]

- **Exact format of the capability-or-feature AskUserQuestion** -- The decision says to ask "New capability or new feature?" but doesn't specify option labels or whether it uses AskUserQuestion vs freeform. Almost certainly AskUserQuestion given system patterns. [Source: User Intent, single-source]

- **DAG phantom dependency handling** -- A feature with `Depends-On` pointing to a non-existent slug creates a DAG edge to a node that never dispatches. Feature silently never runs. No guard exists. [Source: Edge Cases, single-source]

### Unanswered Questions

- Where exactly in each command file does the routing fork insert? Before the existing `<process>` section, or replacing the framing-discovery delegation? Planner must decide the insertion point. [Source: User Intent]
- Should the routing branch in `/gsd:new` also check capability status (killed/deferred) before routing to discuss-capability, or does discuss-capability handle that itself? [Source: Edge Cases]

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable -- violating them leads to incorrect, insecure, or broken implementations.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Lens commands are markdown prompt files, not code -- all routing is natural-language instruction | Tech Constraints, Existing System | No compilation; changes are prose edits to `.md` files |
| `slug-resolve` must return `resolved: true` before trusting `type` field | Tech Constraints, Domain Truth | Checking only `type` without `resolved` causes dispatch on unresolved slugs |
| `cmdFeatureCreate` errors on existing features (hard error, not no-op) | Tech Constraints, Existing System | Stub loop must check existence before calling `feature-create` |
| `feature.md` template hardcodes `status: planning` -- no `{status}` variable | Tech Constraints, Edge Cases | Stubs created via `feature-create` will have wrong status unless patched |
| No shared routing layer -- each lens command handles routing inline | User Intent (FEATURE.md Decisions), Prior Art | Creating a shared abstraction violates the stated architectural decision |
| capability-orchestrator internal logic is out of scope | User Intent (scope boundary) | Cannot modify orchestrator to add empty-table guard -- must guard before invocation |
| No external runtime dependencies allowed | Tech Constraints | All logic in pure Node.js CJS with only js-yaml dep |
| `fillTemplate('feature', ...)` substitutes `{slug}` with capability slug, not feature slug | Tech Constraints | Pre-existing bug; safe as long as template is not modified to use `{slug}` for feature identity |
| Capability exact match wins over feature in Tier-1 resolution (same slug) | Existing System, Edge Cases | A slug matching both a capability and feature always routes to capability |

## Recommended Scope

### Build (In Scope)

- **Routing branch in all 4 lens commands** -- Add `slug-resolve` call + type-based branch before framing-discovery delegation. Pattern mirrors `/gsd:execute` and `/gsd:plan`. [Supported by: Domain Truth, Existing System, Prior Art, User Intent AC-01 through AC-03]

- **`/gsd:new` no_match disambiguation flow** -- AskUserQuestion: "New capability or new feature?" Capability -> discuss-capability workflow. Feature -> ask which capability, then discuss-feature. [Supported by: User Intent AC-04/05/07, Domain Truth]

- **`/gsd:new` post-discuss-capability fan-out offer** -- After discuss-capability completes, AskUserQuestion: "Continue to pipeline for all features?" If yes, invoke capability-orchestrator with LENS=new. [Supported by: User Intent AC-06, Domain Truth]

- **Non-new lens no_match error** -- enhance/debug/refactor with no_match display error + suggest `/gsd:status`. [Supported by: User Intent AC-09, Domain Truth]

- **Ambiguity handling in routing branch** -- When `reason: ambiguous`, present candidates via AskUserQuestion. [Supported by: User Intent AC-08, Edge Cases, Prior Art]

- **Feature stub auto-creation before orchestrator dispatch** -- Parse CAPABILITY.md features table, check disk existence per feature, call `feature-create` for missing stubs, patch status to `exploring`, log each creation. Error on empty table. [Supported by: User Intent AC-10/11/12/13, Tech Constraints, Domain Truth]

### Skip (Out of Scope)

- **Modifying capability-orchestrator.md** -- Explicitly out of scope per FEATURE.md. [Source: User Intent scope boundary]
- **Modifying framing-discovery.md or framing-pipeline.md** -- No changes needed; capability path bypasses discovery, feature path uses it as-is. [Source: User Intent scope boundary]
- **Shared routing abstraction / new gsd-tools command for routing** -- Explicitly rejected in Decisions. [Source: User Intent, Prior Art anti-pattern]
- **Auto-running discuss-feature during stub creation** -- Stubs only; orchestrator handles per-feature discovery. [Source: User Intent, Tech Constraints]
- **Semantic matching / suggestions** -- Out of scope per FEATURE.md. [Source: User Intent scope boundary]
- **New gsd-tools command for CAPABILITY.md table parsing** -- Inline parsing in workflow matches existing orchestrator pattern (YAGNI). [Source: Tech Constraints]

### Investigate Further

- **Stub status patch mechanism** -- Planner must decide: (a) post-creation sed-like instruction in workflow prose to change `planning` to `exploring` in frontmatter, (b) add `--status` flag to `feature-create` CLI, or (c) relax TC-02 to accept `planning`. Option (a) is simplest and changes no shared code. [Gap: Tech Constraints identified the issue; no consensus on solution]
- **Empty features table after discuss-capability** -- Edge case where discuss-capability completes but writes zero features. Should the auto-fan-out offer be suppressed? The empty-table guard (FN-02) covers this, but confirm the UX flow. [Gap: User Intent flagged as ambiguous]
- **Routing insertion point in command files** -- Whether routing prepends to the existing `<process>` block or restructures it. Planner should examine `/gsd:execute` as the reference implementation. [Gap: User Intent flagged as ambiguous]
