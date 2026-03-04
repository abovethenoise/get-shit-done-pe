## Existing System Findings

### Relevant Implementations

- All four lens commands are structurally identical: resolve capability via `framing-discovery.md`, pass `LENS=<name>` and `CAPABILITY_SLUG=(fuzzy from $ARGUMENTS)` — no capability vs feature branching exists today — `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md`, `enhance.md`, `debug.md`, `refactor.md` (all `<process>` blocks)

- `framing-discovery.md` Step 2 already contains a written capability vs feature branch: if `slug-resolve` returns `type="capability"` → capability-level MVU; if `type="feature"` → scope anchor Q&A to that feature — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:51-58`

- `resolveSlugInternal` is the 3-tier resolver (exact → fuzzy → fall-through). Returns `{ resolved, tier, type, capability_slug, feature_slug, full_path, candidates, reason }`. `type` is already `"capability"` or `"feature"` — no new field needed — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs:394-473` (`resolveSlugInternal`)

- Feature detection in `resolveSlugInternal`: checks all capabilities for matching feature directories containing `FEATURE.md`. Exact match on slug, then substring fuzzy. Returns `capability_slug` + `feature_slug` together — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs:421-427`

- `capability-orchestrator.md` already orchestrates feature fan-out: reads CAPABILITY.md features table, builds a DAG, groups into waves, dispatches `framing-pipeline.md` per feature — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:1-156`

- `capability-orchestrator.md` accepts `LENS` as an input (Step 1: `Inputs: CAPABILITY_SLUG, LENS`). It can fan out any of the four lenses across features — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:16`

- `cmdCapabilityStatus` returns `{ slug, status, features[], feature_count }` — already provides the feature list needed for stub creation — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/capability.cjs:86-121` (`cmdCapabilityStatus`)

- `cmdFeatureCreate` creates a feature directory + `FEATURE.md` from the `feature.md` template, given `capSlug` and `name`. Idempotent: handles partial creation (dir exists, no `FEATURE.md`) — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs:13-53` (`cmdFeatureCreate`)

- CAPABILITY.md features table format (from template): `| Feature | Priority | Depends-On | Status |` — this is the source for stub names in FN-02 auto-stub creation — `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/capability.md:63-65`

- `framing-discovery.md` Step 2 `no_match` branch says: "Offer to create new capability or re-describe (same as current zero-match behavior) — Falls through to Claude interpretation of user intent" — this is where `/gsd:new` unknown-slug capability creation currently lives, and where FN-03's discuss-capability offer must be inserted — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:64-66`

- `cmdInitFramingDiscovery` populates the `capability_list` (all known capabilities) for fuzzy resolution in-workflow. It does not currently distinguish capability-level vs feature-level in its returned payload — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs:152-283` (`cmdInitFramingDiscovery`)

- `framing-discovery.md` already pipes `FEATURE_SLUG` through to `framing-pipeline.md` (Step 10, context block). If `FEATURE_SLUG` is null, the pipeline is capability-level — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:268`

### Constraints

- Lens command files (new/enhance/debug/refactor) pass only `CAPABILITY_SLUG` and `LENS` to `framing-discovery`. There is no `FEATURE_SLUG` parameter in the command `<context>` block — adding feature-level routing requires either modifying the command files or having `framing-discovery` handle the split internally — `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md:44` (and all four commands)

- `framing-discovery.md` Step 2 already has capability vs feature branching logic written as prose — but it is **not wired to capability-orchestrator**. The capability branch currently just runs capability-level MVU Q&A. The connection to `capability-orchestrator.md` does not exist yet — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:52`

- `capability-orchestrator.md` Step 4b checks for `DISCOVERY-BRIEF.md` existence — if none, invokes `framing-discovery.md` for that feature first. This means orchestrator requires a pre-existing brief or runs discovery per-feature, not once at capability level — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:81-88`

- `resolveSlugInternal` Tier 1 single-slug logic tries capability first, then searches all features across all capabilities. If a feature slug matches a capability slug, the capability wins — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs:413-428` (type resolution priority)

- `CAPABILITY.md` features table is Markdown, parsed manually in `capability-orchestrator.md`. There is no CLI route (`gsd-tools`) for parsing the features table — the orchestrator reads the file directly — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:27-29`

- `cmdFeatureCreate` errors if the feature already exists — stub auto-creation (FN-02) must check existence first and skip gracefully — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs:27-30`

### Reuse Opportunities

- `resolveSlugInternal` — directly reusable as the routing gate. Already returns `type`, `capability_slug`, `feature_slug`. No changes needed to the function — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` (`resolveSlugInternal`, exported)

- `slug-resolve` CLI route — already wired in `gsd-tools.cjs` and callable as `node gsd-tools.cjs slug-resolve "$INPUT"`. Callers in `framing-discovery.md` already use this exact invocation — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs:360-368`

- `capability-orchestrator.md` — directly reusable as the capability fan-out engine for EU-01. Accepts `CAPABILITY_SLUG` + `LENS`. The new routing only needs to invoke it when `type="capability"` — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md`

- `cmdFeatureCreate` + `feature-create` CLI route — directly reusable for FN-02 stub creation from CAPABILITY.md features table — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs` (`cmdFeatureCreate`)

- `cmdCapabilityStatus` — returns feature list with slugs/statuses. Usable to enumerate features before stub creation — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/capability.cjs` (`cmdCapabilityStatus`)

- `discuss-capability.md` workflow — already exists as a standalone entry point. FN-03 unknown-slug flow can redirect to it rather than re-implementing capability creation Q&A — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/discuss-capability.md`

### Integration Points

- **framing-discovery.md Step 2 (capability branch):** The single insertion point for all four lens commands. When `slug-resolve` returns `type="capability"`, this step must invoke `capability-orchestrator.md` instead of proceeding to capability-level MVU. Currently the branch exists in prose but routes to MVU — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:52-53`

- **framing-discovery.md Step 2 (no_match branch):** Insertion point for FN-03 `/gsd:new` unknown-slug → discuss-capability offer. Currently falls through to Claude interpretation — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:64-66`

- **capability-orchestrator.md Step 4b (pre-discovery check):** Currently invokes `framing-discovery.md` per-feature if no brief exists. This is the feature-level entry point when orchestrator fans out — no change needed here, it already handles this — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:81-88`

- **`feature-create` CLI route:** Integration point for FN-02 stub creation. Workflow (orchestrator or framing-discovery) calls `node gsd-tools.cjs feature-create <cap> <feat-name>` per row in CAPABILITY.md features table — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs:388-392`

### Undocumented Assumptions

- `framing-discovery.md` is written as if it already handles both capability and feature scope (Step 2 has the branch), but the capability branch routes to capability-level MVU Q&A, not to `capability-orchestrator`. The spec says to do orchestration but the actual prose contradicts it — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md:52-58`

- The four lens commands all say `CAPABILITY_SLUG=(resolved from $ARGUMENTS via fuzzy matching)` — this implies the argument is always resolved to a capability. Feature-level arguments are not mentioned, meaning the commands implicitly assume capability-level input — `/Users/philliphall/get-shit-done-pe/commands/gsd/enhance.md:44`

- `framing-pipeline.md` says "The pipeline operates on a single feature" and expects `FEATURE_SLUG` and `FEATURE_DIR` as inputs. If capability-orchestrator is invoked at capability level, it handles the feature iteration; if framing-discovery routes a feature-level slug directly to pipeline, it must populate both fields — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md:3-4`

- `capability-orchestrator.md` reads CAPABILITY.md features table by parsing Markdown directly (no CLI tool). If the features table format changes, orchestrator breaks silently — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md:27-29`

- `discuss-capability.md` uses `capability-list` (not `slug-resolve`) for fuzzy matching. It implements its own 3-step resolution (exact, substring, no-match) separately from `resolveSlugInternal`. There are two parallel resolution implementations — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/discuss-capability.md:39-59`
