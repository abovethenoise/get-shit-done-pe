---
type: flow-doc
built-from-code-at: d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
last-verified: 2026-03-04
---

## Flow: pipeline-execution/scope-aware-routing

## Trigger: [derived]

User invokes any of the four lens commands with a capability or feature slug:
- `/gsd:new [slug]`
- `/gsd:enhance [slug]`
- `/gsd:debug [slug]`
- `/gsd:refactor [slug]`

The routing decision happens at Step 1 (slug resolution) before any workflow is invoked.

## Input: [derived]

- `$ARGUMENTS` — user-provided string: capability slug, feature slug, ambiguous partial, or empty (new.md only)
- Implicit: `.planning/` directory tree (read by `gsd-tools slug-resolve` to classify the slug)
- For capability path: `.planning/capabilities/{cap}/CAPABILITY.md` (features table, read during stub creation in new.md)

## Steps: [derived]

### Shared: Slug Resolution (all 4 commands)

1. **scope-aware-routing** → runs `gsd-tools slug-resolve $ARGUMENTS`, parses JSON for `resolved`, `type`, `candidates`, `reason`, `capability_slug`, `feature_slug`
2. **scope-aware-routing** → branches on result:

```
resolved=true, type=capability   → capability path (Step A)
resolved=true, type=feature      → feature path (Step B)
resolved=false, reason=ambiguous → disambiguation path (Step C)
resolved=false, reason=no_match  → no-match path (Step D, behavior differs per command)
```

### Path A: Capability slug (all 4 commands)

3. **scope-aware-routing** → (`/gsd:new` only) runs stub creation loop (see Path A-stub below)
4. **scope-aware-routing** → invokes `capability-orchestrator.md` with CAPABILITY_SLUG and LENS={new|enhance|debug|refactor}
5. **capability-orchestrator** → fans out to all features in CAPABILITY.md in DAG wave order

### Path A-stub: Feature stub auto-creation (`/gsd:new` only, runs before Step 4)

3a. **scope-aware-routing** → reads `.planning/capabilities/{cap}/CAPABILITY.md`, parses features table
3b. **scope-aware-routing** → if features table is empty: errors, suggests `/gsd:discuss-capability`, stops
3c. **scope-aware-routing** → for each feature slug in table:
    - checks if `.planning/capabilities/{cap}/features/{feat}/` exists on disk
    - if missing: runs `gsd-tools feature-create {cap} {feat}`, patches FEATURE.md `status: planning` → `status: exploring`, logs "Created feature stub: {cap}/{feat}"
    - if exists: skips silently

### Path B: Feature slug (all 4 commands)

3. **scope-aware-routing** → invokes `framing-discovery.md` with LENS={new|enhance|debug|refactor} and CAPABILITY_SLUG (derived from feature path)
4. **framing-discovery** → runs lens-specific discovery session, produces Discovery Brief
5. **framing-pipeline-workflow** → runs 6-stage pipeline (research → requirements → plan → execute → review → doc)

All framing-discovery workflow gates are preserved: fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback.

### Path C: Ambiguous slug (all 4 commands)

3. **scope-aware-routing** → presents AskUserQuestion:
   - header: "Multiple Matches"
   - question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?"
   - options: each candidate with type and full_path
4. **scope-aware-routing** → re-resolves with selected candidate, returns to top of Step 2

### Path D: No match — /gsd:new

3. **scope-aware-routing** → presents AskUserQuestion:
   - header: "New Work"
   - question: "What kind of new work is this?"
   - options: "New capability", "New feature under an existing capability"

**If new capability:**
4. **scope-aware-routing** → invokes `discuss-capability.md`
5. **discuss-capability** → creates capability directory and populates CAPABILITY.md with features table
6. **scope-aware-routing** → runs Path A-stub (stub creation loop) using CAPABILITY_SLUG from discuss-capability
7. **scope-aware-routing** → presents AskUserQuestion fan-out offer:
   - header: "Pipeline Ready"
   - options: "Continue (run pipeline for all features)", "I'll run them individually"
   - If "I'll run them individually": displays next steps, stops
   - If "Continue": invokes `capability-orchestrator.md` with CAPABILITY_SLUG and LENS=new

**If new feature:**
4. **scope-aware-routing** → presents AskUserQuestion "Which Capability?" — user enters capability slug
5. **scope-aware-routing** → re-resolves user input; if not a capability, asks again
6. **scope-aware-routing** → invokes `framing-discovery.md` with LENS=new and CAPABILITY_SLUG, stops

### Path D: No match — /gsd:enhance, /gsd:debug, /gsd:refactor

3. **scope-aware-routing** → displays error: "No capability or feature matches '$ARGUMENTS'."
4. **scope-aware-routing** → suggests: "Run /gsd:status to see available capabilities and features.", stops

## Output: [derived]

**Feature path (Path B):** Discovery Brief → FEATURE.md requirements → plan artifacts → implementation artifacts → review artifacts → doc artifacts (full 6-stage pipeline output per feature)

**Capability path (Path A):** Same per-feature outputs across all features in the capability, executed in DAG wave order by `capability-orchestrator.md`

**Stub creation (Path A-stub, /gsd:new):** Feature directories created at `.planning/capabilities/{cap}/features/{feat}/FEATURE.md` with `status: exploring`; one log line per stub created

**New capability path (Path D → new capability):** Capability directory + CAPABILITY.md (from discuss-capability), feature stubs, then either full pipeline output or next-step instructions

## Side-effects: [derived]

- Feature directories created on disk when stub creation runs (Path A-stub)
- FEATURE.md `status` field patched from `planning` to `exploring` for each created stub
- `discuss-capability.md` creates `.planning/capabilities/{cap}/CAPABILITY.md` when invoked (Path D → new capability)
- `capability-orchestrator.md` may create additional artifacts per feature (review outputs, plan artifacts) in DAG wave order

## WHY: [authored]

**Routing at the command entry point, not inside workflows (TC-01):** Slug resolution happens before any workflow is invoked, keeping framing-discovery.md and capability-orchestrator.md unaware of how they were called. This preserves workflow composability — either can be invoked directly without going through lens command routing.

**Capability path always runs stub creation before orchestrator (`/gsd:new` only, Finding 1 fix):** The discuss-capability workflow populates CAPABILITY.md but does not create feature directories on disk. Without stub creation, capability-orchestrator would be invoked against a capability whose feature directories do not exist. The fixed flow ensures stub creation runs for both the direct-resolved-capability path and the discuss-capability path before the orchestrator is called.

**Fan-out offer only after discuss-capability, not on direct resolution (02-PLAN.md):** A user who resolves an existing capability already committed to that scope. A user who just ran discuss-capability may want to review the features before committing to a full pipeline run. The offer is gated on the path taken, not on scope level.
