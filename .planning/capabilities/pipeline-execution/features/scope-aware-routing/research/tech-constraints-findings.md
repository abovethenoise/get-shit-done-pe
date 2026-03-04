## Tech Constraints Findings

### Hard Constraints

- **No external runtime dependencies** — `get-shit-done/bin/package.json` has a single dep (`js-yaml@4.1.1`); all logic must remain in pure Node.js CJS. Any new routing code must follow the same pattern.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/package.json`

- **Node.js >= 16.7.0 required** — Engine constraint in `package.json`. `fs.readdirSync` with `{ withFileTypes: true }`, `fs.mkdirSync` with `{ recursive: true }`, and `String.prototype.replaceAll` (which the codebase doesn't use, but any contributor might try) all behave correctly at 16.7+. Actual runtime is Node 20.19.3 (verified), so no regression risk.
  — Source: `/Users/philliphall/get-shit-done-pe/package.json` (engines field); `node --version` output

- **CJS-only module system** — All lib files use `module.exports` / `require()`. No ESM interop. Any new lib module must be `.cjs` and use the same CJS pattern.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/*.cjs` (all files)

- **Bash tool output buffer limit ~50KB** — `core.cjs` explicitly guards against this: outputs >50KB are written to a tmpfile and the path is returned prefixed with `@file:`. Any new `gsd-tools` command returning large JSON must respect this existing pattern.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 32–40

- **Lens commands are markdown prompt files, not code** — `/commands/gsd/new.md`, `enhance.md`, `debug.md`, `refactor.md` are Claude Code slash command definitions. All routing logic in them is natural-language instruction, not code. Changes are plain text edits — no compilation step.
  — Source: `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md` (all four files confirm this pattern)

- **`slug-resolve` returns `type: capability | feature | null`** — The existing route contract is fixed. When `resolved: true`, the `type` field is always one of `"capability"` or `"feature"`. When `resolved: false`, `type` is `null`. The routing branch must guard on `resolved` before trusting `type`.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 394–473 (`resolveSlugInternal`)

- **`feature-create` errors if capability doesn't exist** — `cmdFeatureCreate` calls `findCapabilityInternal` and hard-errors if the parent capability is missing. Feature stub creation (TC-02) must pre-validate the capability exists before looping feature rows from CAPABILITY.md.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs` lines 18–21

- **`feature-create` errors if feature already exists** — Duplicate creation raises a hard error, not a no-op. Any stub-creation loop must check disk existence first (or catch the error). This is a behavioral constraint, not just a guard.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs` lines 27–30

- **CAPABILITY.md features table is freeform markdown** — No machine-readable schema. The table columns are `Feature | Priority | Depends-On | Status` by convention only. Parsing must use regex or line-splitting; there is no YAML/JSON source of truth for features. Malformed rows will produce garbage slugs unless filtered.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/capability.md` (Features table); `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/CAPABILITY.md` (real example)

- **`fillTemplate('feature', ...)` has a bug in `{slug}` substitution** — `template.cjs` line 265: `content.replace(/\{slug\}/g, options.capability || slug)`. The `{slug}` placeholder is replaced with the *capability slug*, not the feature slug. The `feature.md` template uses `"{slug}"` in the frontmatter `capability:` field — so the substitution is intentional for that field. But if the template ever references `{slug}` meaning the feature's own slug, the wrong value is injected. This is a pre-existing bug, not introduced by this feature, but stub creation will produce correct output as long as the template is not modified.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/template.cjs` line 265; `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/feature.md` line 3

---

### Dependency Capabilities

- **`resolveSlugInternal` (core.cjs):** Already differentiates `type: capability` vs `type: feature` in Tier 1 (exact) and Tier 2 (fuzzy). It returns `resolved: bool`, `type`, `capability_slug`, `feature_slug`, `candidates[]`, and `reason`. All data needed for routing decisions is already in the response. No new `gsd-tools` command needed for FN-01.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 394–473

- **`cmdFeatureCreate` (feature.cjs):** Accepts `(cwd, capSlug, name, raw)` and writes a FEATURE.md stub using `fillTemplate('feature', ...)`. This is the exact tool needed for TC-02 stub creation. The function is already exposed as `feature-create` CLI route. No new library code required for stub creation — the workflow can call `feature-create` per feature row parsed from CAPABILITY.md.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs` lines 13–53

- **`capability-orchestrator.md`:** Already accepts `CAPABILITY_SLUG` and `LENS` as inputs. Step 1 calls `capability-status` then reads CAPABILITY.md. It already handles DAG wave ordering and dispatches `framing-pipeline.md` per feature. No changes to capability-orchestrator are in scope — TC-01 just needs to route to it with the right args.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md` lines 16–30

- **`framing-discovery.md` (Step 2):** Already has the slug-resolution branch logic for `type: feature` vs `type: capability`. This is the workflow that lens commands invoke. The new capability-level branch in each lens command routes *around* `framing-discovery` — straight to `capability-orchestrator` — which is a legitimate short-circuit since orchestrator invokes discovery per-feature internally.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md` lines 52–59

- **`cmdInitFramingDiscovery` (init.cjs):** Returns `capability_list[]` for fuzzy resolution UI. Currently takes `lens`, `capability`, and optional `feature` args. This function is what lens commands invoke at Step 1 of framing-discovery. For the capability-level branch, this init call is bypassed — orchestrator does its own init via `capability-status`. No changes needed to `cmdInitFramingDiscovery`.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs` lines 152–283

- **`js-yaml@4.1.1`:** Used by `frontmatter.cjs` for YAML parsing of plan/capability frontmatter. Not involved in the routing or stub creation path. No compatibility concern.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/package.json`

---

### Compatibility Issues

- **Feature stub status field mismatch:** TC-02 requires stub status `exploring`, but `feature.md` template sets `status: planning` in frontmatter. `cmdFeatureCreate` passes the template through `fillTemplate('feature', ...)` which does a raw string replace — there is no `status` variable injected. The stub will be written with `status: planning`, not `status: exploring` as TC-02 requires. A post-creation patch (e.g., `gsd-tools state update` or manual sed in the workflow) would be needed, or `fillTemplate`/the template itself would need a `{status}` variable.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/feature.md` line 4 (`status: planning`); `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/scope-aware-routing/FEATURE.md` TC-02 constraint

- **Slug generation strips feature names with special chars:** `generateSlugInternal` lowercases and replaces non-alphanumeric sequences with hyphens. CAPABILITY.md feature table rows like `"My Feature (v2)"` would produce slug `my-feature-v2`. This is correct behavior, but if the table's Feature column contains the display name (not the slug), parsing must slug-ify it before using it as a directory name. Failure to do so would produce `directory_not_found` errors on subsequent lookups.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 359–366 (`generateSlugInternal`)

- **Fuzzy resolution ambiguity at capability-only scope:** If a user types a partial string matching both a capability and a feature slug (e.g., `pipeline` matching capability `pipeline-execution` AND feature `pipeline-presentation`), `resolveSlugInternal` returns `resolved: false, reason: ambiguous, candidates: [...]`. The current lens commands don't handle the ambiguous case — they rely on the framing-discovery workflow to present candidates. The new routing branch must handle this same ambiguity before choosing orchestrator vs pipeline.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 466–469

- **`framing-pipeline.md` expects `FEATURE_DIR` as input:** Its `<inputs>` block requires `FEATURE_SLUG` and `FEATURE_DIR`. The capability-orchestrator path does NOT require callers to pass a feature dir — orchestrator reads it from CAPABILITY.md. So the routing split is clean: capability slug → orchestrator (no feature dir needed), feature slug → framing-pipeline (feature dir required). No incompatibility, but the routing branch must not forward capability-level calls to framing-pipeline.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md` lines 16–24 (`<inputs>`)

- **`capability-orchestrator.md` reads CAPABILITY.md features table directly:** Step 1 already parses `Feature | Priority | Depends-On | Status` columns. If TC-02 (stub creation) runs before orchestrator, it must use the same column format. No incompatibility, but the parsing in TC-02 (done in the workflow, not in gsd-tools) must be consistent with how orchestrator reads the same table.
  — Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md` lines 27–29

---

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| Add capability branch to each lens command (TC-01) — markdown edits only | viable | Four `.md` files, each gets a `if type == capability → invoke orchestrator` branch after slug resolution. No code changes. Pattern matches existing `framing-discovery.md` Step 2 branch structure. Source: `/Users/philliphall/get-shit-done-pe/commands/gsd/new.md` + `core.cjs` slug-resolve contract |
| Use existing `slug-resolve` for FN-01 routing decision | viable | Already returns `type: capability \| feature`. Lens commands call it, check `type`, branch accordingly. Zero new gsd-tools code needed. Source: `core.cjs` `resolveSlugInternal` |
| Use existing `feature-create` CLI route for TC-02 stub creation | constrained | Works, but stub status will be `planning` not `exploring` (template hardcodes it). Requires either: (a) post-creation patch via `gsd-tools state update` equivalent, (b) a `--status` flag added to `feature-create`, or (c) accept `planning` and update TC-02 constraint. Source: `feature.md` template line 4 |
| Parse CAPABILITY.md features table in a new gsd-tools command | constrained | Viable but adds code. Alternatively, parsing can be done inline in the workflow (markdown line-by-line). Capability-orchestrator already does this inline — TC-02 can copy the same pattern. Source: `capability-orchestrator.md` Step 1 |
| Parse CAPABILITY.md features table inline in the workflow (no new CLI command) | viable | Capability-orchestrator already does this in Step 1 with a direct file read + table parse instruction. TC-02 can follow the same pattern. YAGNI — no new gsd-tools command needed. Source: `capability-orchestrator.md` lines 27–29 |
| Shared routing helper extracted into a new gsd-tools command | blocked | Decisions section of FEATURE.md explicitly rejects this: "Routing is simple: resolve slug type, branch accordingly. No shared routing layer needed — each lens command handles it." Source: `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/scope-aware-routing/FEATURE.md` Decisions |
| Auto-run `discuss-feature` during stub creation | blocked | TC-02 explicitly states "Stubs only — orchestrator handles discovery per feature." Running discuss-feature during stub creation contradicts this. Source: `FEATURE.md` FN-02 Behavior bullet 3 |
| Feature stub creation with `status: exploring` using current template | constrained | Template hardcodes `status: planning`. Must patch after creation or modify the template/`fillTemplate` to accept a status variable. Source: `feature.md` template + `template.cjs` `fillTemplate` |

---

### Alternatives

- **[Blocked] Shared routing layer** → Each of the 4 lens commands gets identical inline routing logic (resolve → branch). Duplication is bounded: 4 files × ~5 lines of routing instruction. DRY principle is satisfied at the acceptable cost given the decision already made.
  — [First principles: 4 × 5 lines of identical prose in markdown is not meaningfully harder to maintain than an abstraction layer that would require a new gsd-tools command, new init compound command, and test coverage. Constraint comes from the Decisions section of FEATURE.md which explicitly chose this path.]

- **[Constrained] Feature stub `status: planning` instead of `exploring`** → Accept `planning` as initial status and update the TC-02 constraint, OR add a one-line post-write sed instruction in the workflow to patch the status field. The cleanest fix is adding `{status}` as a template variable in `feature.md` and passing `exploring` from `fillTemplate` callers — but this modifies a shared template. Alternative: workflow patches FEATURE.md frontmatter via `gsd-tools state update` after stub creation (already works for STATE.md; `state update` only targets STATE.md so this doesn't apply). Simplest path: accept `planning` and relax TC-02 constraint, since orchestrator doesn't gate on initial status.
  — Source: `feature.cjs` `cmdFeatureCreate`; `feature.md` template; `capability-orchestrator.md` Step 1 (reads status but only skips `complete` features)

- **[Constrained] Ambiguity handling for new capability branch** → No dedicated ambiguity UI exists in the lens commands today (framing-discovery owns it). For TC-01, when `resolved: false, reason: ambiguous`, the routing branch must use `AskUserQuestion` with `candidates[]` from slug-resolve output. This is the same pattern already used in `framing-discovery.md` Step 2 — copy it directly. No new tooling needed.
  — Source: `framing-discovery.md` lines 62–67 (ambiguous branch); `core.cjs` `resolveSlugInternal` ambiguous return shape
