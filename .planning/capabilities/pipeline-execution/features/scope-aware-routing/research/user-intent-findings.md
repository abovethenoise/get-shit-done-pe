## User Intent Findings

### Primary Goal

Route lens commands (/gsd:new, /gsd:enhance, /gsd:debug, /gsd:refactor) through scope-aware slug resolution so that a capability slug fans out to all features via capability-orchestrator, while feature slugs continue to run the current single-feature pipeline without regression. — [source: FEATURE.md, Goal section]

---

### Acceptance Criteria

- **AC-01: Capability slug routes to orchestrator** — Pass: running `/gsd:enhance pipeline-execution` resolves to `type: capability` and invokes capability-orchestrator.md with LENS=enhance; fail: it enters framing-discovery as a capability-level Q&A (current behavior). — [source: FEATURE.md EU-01, FN-04]

- **AC-02: Feature slug routes to framing-pipeline (no regression)** — Pass: running `/gsd:enhance pipeline-execution/scope-aware-routing` resolves to `type: feature` and enters framing-discovery then framing-pipeline exactly as it does today; fail: any change to the existing feature-level code path. — [source: FEATURE.md EU-01 "Feature-level invocation continues to work as-is", FN-01]

- **AC-03: All four lens commands updated** — Pass: new.md, enhance.md, debug.md, refactor.md each contain a capability-level branch; fail: any lens command missing the routing fork. — [source: FEATURE.md FN-04, TC-01]

- **AC-04: /gsd:new unknown slug asks capability-or-feature, not other lenses** — Pass: unknown slug in `/gsd:new` triggers AskUserQuestion "New capability or new feature?"; fail: /gsd:enhance, /gsd:debug, /gsd:refactor ask the same question (they error instead, suggesting /gsd:status). — [source: FEATURE.md EU-02, FN-01 "for other lenses, error with suggestion to check /gsd:status"]

- **AC-05: /gsd:new capability path routes to discuss-capability** — Pass: user selects "new capability" -> discuss-capability workflow runs (not framing-discovery); fail: discuss-capability is skipped or framing-discovery runs instead. — [source: FEATURE.md EU-02 AC, FN-03]

- **AC-06: /gsd:new capability path offers auto-fan-out after discuss-capability** — Pass: after discuss-capability completes, user is asked "Continue to pipeline for all features?" or "I'll run them individually"; fail: orchestration starts automatically with no user choice, or the offer is never made. — [source: FEATURE.md EU-02 AC, FN-03 "After discuss-capability completes, ask user via AskUserQuestion"]

- **AC-07: /gsd:new feature path asks which capability then routes to discuss-feature** — Pass: user selects "new feature" -> prompted for capability -> discuss-feature runs; fail: user is dropped to framing-discovery directly with no parent-capability selection. — [source: FEATURE.md EU-02 AC "ask which capability it belongs to, then route to discuss-feature"]

- **AC-08: Ambiguous slug presents candidates** — Pass: slug resolving to multiple candidates presents AskUserQuestion with candidate list before branching; fail: silent auto-selection or an unhandled error. — [source: FEATURE.md FN-01 "If ambiguous: present candidates via AskUserQuestion"; framing-discovery.md Step 2 established the same pattern]

- **AC-09: Non-new lens commands error on no_match** — Pass: `/gsd:enhance no-such-thing` displays an error with a suggestion to check `/gsd:status`; fail: user is asked "New capability or new feature?" (that question is exclusive to /gsd:new). — [source: FEATURE.md FN-01 "for other lenses, error with suggestion to check /gsd:status"]

- **AC-10: Feature stub auto-creation reads CAPABILITY.md features table** — Pass: for a capability slug with features listed in CAPABILITY.md but no feature directories on disk, stubs are created at `.planning/capabilities/{cap}/features/{feat}/FEATURE.md` before orchestrator runs; fail: orchestrator errors because FEATURE.md files are missing. — [source: FEATURE.md FN-02, TC-02]

- **AC-11: Stub creation is additive only** — Pass: existing feature directories are not overwritten; fail: any existing FEATURE.md is truncated or replaced. — [source: FEATURE.md TC-02 "Only create if directory doesn't already exist (no overwrite)"]

- **AC-12: Stub status set to `exploring`** — Pass: each created stub has `status: exploring` in YAML frontmatter; fail: stub status is `planning` (the template default) or any other value. — [source: FEATURE.md TC-02 "Set status to `exploring` in stub FEATURE.md"; template default in get-shit-done/templates/feature.md is `planning`, so explicit override required]

- **AC-13: Empty features table triggers error, not stub-creation** — Pass: capability slug with empty features table in CAPABILITY.md produces an error message "suggest running discuss-capability first"; fail: empty loop runs silently with zero stubs created and orchestrator still invoked. — [source: FEATURE.md FN-02 "If features table is empty: error, suggest running discuss-capability first"]

- **AC-14: Routing logic is consistent across all 4 commands (DRY)** — Pass: the routing fork (resolve -> check type -> branch) is either a shared reference or a visually identical, copy-consistent block in each command; fail: one command's routing diverges (different branch names, different error messages, different orchestrator call signature). — [source: FEATURE.md FN-04 "Pattern is identical across all 4 commands (DRY — shared routing logic or consistent copy)", Decisions "No shared routing layer needed — each lens command handles it"]

---

### Implicit Requirements

- **IMP-01: slug-resolve is invoked before framing-discovery, not inside it** — The existing framing-discovery.md already has its own slug resolution in Step 2 which always resolves to capability OR feature. The new routing branch must intercept the slug before framing-discovery.md is called, otherwise the capability route is unreachable. — [First principles: framing-discovery.md Step 10 hands off to framing-pipeline, not capability-orchestrator; the fork must be in the calling slash command, not inside the discovery workflow]

- **IMP-02: LENS is passed through to capability-orchestrator unchanged** — capability-orchestrator.md accepts CAPABILITY_SLUG + LENS as inputs; it expects the same lens string ("new", "enhance", "debug", "refactor") that framing-pipeline expects. The routing layer must not transform or default the LENS value. — [source: capability-orchestrator.md process Step 1 "Inputs: CAPABILITY_SLUG, LENS"]

- **IMP-03: gsd-tools slug-resolve is already integrated into framing-discovery; the lens commands do not call it today** — Current lens commands delegate entirely to framing-discovery.md without calling slug-resolve directly (e.g., new.md passes `CAPABILITY_SLUG=(resolved from $ARGUMENTS via fuzzy matching)` as commentary only). The routing logic will need to add an explicit slug-resolve call at the command level before the framing-discovery handoff. — [source: /Users/philliphall/.claude/commands/gsd/new.md process section; framing-discovery.md Step 2]

- **IMP-04: discuss-capability (for /gsd:new capability flow) is distinct from framing-discovery** — discuss-capability.md is a thinking-partner workflow that produces a features table in CAPABILITY.md; framing-discovery.md produces a DISCOVERY-BRIEF.md per feature. They are separate workflows with different outputs. /gsd:new capability flow must route to discuss-capability, not accidentally invoke framing-discovery at capability level. — [source: discuss-capability.md purpose; framing-discovery.md purpose; FEATURE.md FN-03]

- **IMP-05: Feature stub template default status is `planning`, not `exploring`** — get-shit-done/templates/feature.md line 4 has `status: planning`. TC-02 requires `status: exploring` for stubs. The stub creation logic must explicitly override this field; it cannot rely on the template default. — [source: /Users/philliphall/get-shit-done-pe/get-shit-done/templates/feature.md; FEATURE.md TC-02]

- **IMP-06: Stub creation log output is a user-visible audit trail** — "Log each creation: 'Created feature stub: {cap}/{feat}'" is not a debug log; it serves as confirmation to the user that stubs were bootstrapped before orchestration starts. It must appear in the command output, not silently. — [source: FEATURE.md TC-02; First principles: user can't verify fan-out correctness without knowing what stubs were created]

- **IMP-07: Routing change must preserve all framing-discovery gates** — The existing workflow has five gates: fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, and mandatory summary playback. The new capability-level branch bypasses framing-discovery entirely; that bypass is intentional and correct. But the feature-level path must still hit all five gates without modification. — [source: /Users/philliphall/.claude/commands/gsd/new.md "Preserve all workflow gates"; framing-discovery.md success criteria]

---

### Scope Boundaries

**In scope:**
- Adding capability-level routing branch to new.md, enhance.md, debug.md, refactor.md
- Slug resolution via existing `gsd-tools slug-resolve` (no new CLI routes needed)
- Feature stub auto-creation logic (reading CAPABILITY.md features table, creating FEATURE.md stubs)
- /gsd:new capability-or-feature disambiguation prompt for unknown slugs
- /gsd:new post-discuss-capability auto-fan-out offer
- Error handling for non-new lenses on no_match slugs

**Out of scope:**
- Changing capability-orchestrator.md internal logic — [source: FEATURE.md EU-01 "Out of Scope: Changing capability-orchestrator's internal logic"]
- Semantic matching / suggestions ("this could go under X capability") — [source: FEATURE.md EU-02 "Out of Scope: Semantic matching", Decisions]
- Automatic discuss-feature invocation during auto-fan-out — stubs only, orchestrator handles per-feature discovery — [source: FEATURE.md Decisions "Auto-create stubs only, orchestrator handles discovery per feature (no discuss-feature auto-run)"]
- Any changes to framing-discovery.md, framing-pipeline.md, or the 6 pipeline stages

**Ambiguous:**
- **Where exactly the routing fork lives in each command** — The FEATURE.md says "each lens command handles it" with no shared layer, and "consistent copy" is acceptable. But there is no spec on whether routing is prepended to the existing `<process>` section or replaces the current framing-discovery delegation. Planner must decide the insertion point.
- **What happens when discuss-capability produces zero features in the features table** — FN-02 covers a pre-existing empty table; it does not address the case where discuss-capability itself completes but writes zero features (e.g., user deferred all features). Whether the auto-fan-out offer is skipped, or an error is shown, is unspecified.
- **Format of the capability-or-feature AskUserQuestion for /gsd:new** — The decision says to ask "New capability or new feature?" but does not specify whether this uses AskUserQuestion (with formal options) or is a freeform question. Given that all other prompts in the system use AskUserQuestion for branching, this is almost certainly AskUserQuestion — but the exact option labels are not specified.

---

### Risk: Misalignment

- **The current framing-discovery.md already branches on `type: capability` vs `type: feature`** (Step 2, lines "If type is 'capability'" / "If type is 'feature'") — this means there is already a partial routing concept inside framing-discovery. The new feature wants routing to happen before framing-discovery is called. If a planner reads framing-discovery's Step 2 as "routing is already handled," they may under-implement the lens command changes. The framing-discovery branch is for feature-level discovery scoping, not for capability-level orchestrator dispatch. — [source: framing-discovery.md Step 2; FEATURE.md FN-01 "If resolved as capability: route to capability-orchestrator with LENS"]

- **The feature says "No shared routing layer needed — each lens command handles it" but also "Pattern is identical across all 4 commands (DRY)"** — these are in tension. DRY usually implies shared code; the decision explicitly rejects a shared layer. A planner optimizing for DRY might introduce a shared workflow or helper contrary to the stated decision. The stated decision wins: consistent copy per command is the intended approach. — [source: FEATURE.md FN-04, Decisions]

- **Stub auto-creation is triggered as part of capability-level routing, not as a standalone step** — FN-02 is framed as a functional requirement but TC-02 calls it a pre-orchestration bootstrap. If a planner implements stub creation as a user-triggered explicit step (e.g., a separate sub-command) rather than as an automatic part of capability-level invocation, the EU-01 fan-out story breaks. — [source: FEATURE.md FN-02 "Auto-create feature stubs from CAPABILITY.md features table"; EU-01 "fan out to all features"]
