# Research: Capability/Feature Lifecycle

**Researched:** 2026-03-01
**Domain:** Capability/Feature lifecycle — directory model, slug resolution, pipeline wiring
**Confidence:** HIGH — based on direct code inspection

---

## 1. Capability/Feature CLI Route Inventory (Current State)

### Flat-Verb Routes (gsd-tools.cjs router)

| Route | Args | What It Does | Returns |
|-------|------|-------------|---------|
| `capability-create` | `name` | Slugifies name, creates `.planning/capabilities/{slug}/` + `features/` dirs, writes CAPABILITY.md from template | `{created, slug, path, capability_path}` |
| `capability-list` | — | Reads all capability dirs, extracts frontmatter status + feature count | `{capabilities: [{slug, status, feature_count}]}` |
| `capability-status` | `slug` | Reads CAPABILITY.md frontmatter + all nested features with status | `{slug, status, features[], feature_count}` |
| `feature-create` | `capSlug name` | Validates parent cap exists, slugifies name, creates feature dir, writes FEATURE.md from template | `{created, slug, capability_slug, path, feature_path}` |
| `feature-list` | `capSlug` | Lists all features for a capability with status | `{features: [{slug, status, capability}]}` |
| `feature-status` | `capSlug featureSlug` | Reads FEATURE.md frontmatter + counts EU/FN/TC requirements by regex | `{slug, status, capability, req_counts: {eu, fn, tc}}` |

### Init Compound Routes

| Route | Args | What It Does | Key Outputs |
|-------|------|-------------|------------|
| `init framing-discovery` | `lens [capSlug]` | Resolves capability, loads anchor questions path, lists all caps for fuzzy matching | `lens, mvu_slots, anchor_questions_path, capability, capability_list, brief_path` |
| `init discuss-capability` | — | Lists all capabilities with name+status | `capability_list, capabilities_dir, doc_capabilities` |
| `init discuss-feature` | — | Lists all caps + nested features (flattened for fuzzy) | `capability_list, feature_list, capabilities_dir` |
| `init plan-feature` | `capSlug featSlug` | Loads capability + feature context, inventories existing plans/research | `capability_dir, feature_dir, has_research, plans[], summaries[], context_path` |
| `init execute-feature` | `capSlug featSlug` | Loads execution context, inventories plans for completion tracking | `executor_model, plans[], incomplete_plans[], milestone_version` |
| `init feature-op` | `capSlug featSlug op` | Generic feature operation context (brave_search, existing artifacts) | `capability_dir, feature_dir, has_research, has_context, brave_search` |
| `init feature-progress` | — | Full capability/feature tree with plan/summary counts per feature | `capabilities[], total_features, total_plans, total_summaries` |

### Routes That Were Removed (Dead)

Per Phase 10-01 decisions: `init phase-op`, `init review-phase`, `init doc-phase` all return error messages. Phase-level variants are gone.

---

## 2. Template Analysis

### capability.md (current template)

**Sections present:**
- Frontmatter: `type: capability`, `status: planning`, `created`
- Goal (one sentence)
- Domain Model (entity table)
- Invariants (cross-feature rules)
- Boundaries (Owns / Consumes / Does Not Touch)
- Architecture Spine (data flow, ASCII diagram)
- Dependencies (produces/consumes table)
- Features (feature list with status)
- Decisions (date/decision/context/tradeoffs table)

**CONTEXT.md requires:** what + why + feature list + priority order + cross-feature constraints.

**Delta analysis:**

| CONTEXT.md requirement | Template coverage | Gap |
|------------------------|-------------------|-----|
| What (what it delivers) | "Goal" section — present | None |
| Why (why it matters) | Missing — no "Why" section | ADD: `## Why` section |
| Feature list | "Features" table — present but no priority column | ADD: priority order column |
| Priority order | Absent | ADD: priority field to Features table |
| Cross-feature constraints | "Invariants" covers some | RENAME/CLARIFY: distinguish invariants from cross-feature constraints |
| No requirements | Template has no requirements section — correct | None |

**Slug field:** Template uses `{capability}` for name but no `name:` field in frontmatter. The `init` functions match against frontmatter `name:` regex. Gap: template should add `name:` to frontmatter.

### feature.md (current template)

**Sections present:**
- Frontmatter: `type: feature`, `capability`, `status: planning`, `created`
- Trace Table (REQ through Docs, status column)
- End-User Requirements (EU-01 with Story + Acceptance Criteria + Out of Scope)
- Functional Requirements (FN-01 with Receives/Returns/Behavior)
- Technical Specs (TC-01 with Intent/Upstream/Downstream/Constraints/Example)
- Decisions

**CONTEXT.md requires:** 3-layer requirements (end-user, functional, technical) — FULLY COVERED. Feature.md template matches the 3-layer model precisely.

**CONTEXT.md also implies:** DISCOVERY-BRIEF.md lives in feature directory. Template does not create this — it is created during framing-discovery workflow. No gap in template, but note this is a workflow-created artifact not a template-created one.

**Slug field:** Frontmatter has `capability: "{slug}"` but no `name:` field. Same gap as capability.md — `init discuss-feature` matches on `name:` regex.

---

## 3. Directory Creation Flow

### What Creates What

```
/gsd:new <slug>
  --> capability-create <name>
      --> .planning/capabilities/{slug}/
      --> .planning/capabilities/{slug}/features/
      --> .planning/capabilities/{slug}/CAPABILITY.md  (from template)

/gsd:discuss-capability <slug>  (if "Create new" selected)
  --> capability-create <name>
      --> same as above

framing-discovery workflow (Step 4)
  --> template fill discovery-brief ...
      --> .planning/capabilities/{slug}/BRIEF.md

feature-create <capSlug> <name>
  --> .planning/capabilities/{slug}/features/{featSlug}/
  --> .planning/capabilities/{slug}/features/{featSlug}/FEATURE.md  (from template)

discuss-capability (update_capability_file step)
  --> .documentation/capabilities/{slug}.md  (separate from .planning tree!)

discuss-feature (update_feature_notes step)
  --> .planning/capabilities/{cap}/features/{feat}/requirements/  (subdirectory!)
  -- NOTE: this conflicts with CONTEXT.md directory model
```

### Directory Model Conflict: Critical Gap

**CONTEXT.md target structure:**
```
.planning/capabilities/{cap}/
  CAPABILITY.md
  features/{feat}/
    FEATURE.md
    DISCOVERY-BRIEF.md
    RESEARCH.md
    01-PLAN.md
    01-SUMMARY.md
```

**Current reality:**
- `discuss-capability` writes to `.documentation/capabilities/{slug}.md` — NOT `.planning/capabilities/{slug}/CAPABILITY.md`
- `discuss-feature` writes notes to `.planning/capabilities/{cap}/features/{feat}/requirements/` subdirectory — NOT to FEATURE.md directly
- `framing-discovery` writes the brief to `.planning/capabilities/{slug}/BRIEF.md` (capability level) — NOT `.planning/capabilities/{cap}/features/{feat}/DISCOVERY-BRIEF.md` (feature level)
- The pipeline writes RESEARCH.md to capability level (`output_dir: .planning/capabilities/{CAPABILITY_SLUG}`) — NOT feature level

**The v2 model shifts the pipeline from capability-level to feature-level targeting.** This is the core B1 fix required.

---

## 4. Slug Resolution Design

### Current Implementation (2-tier, in workflow layer)

**Tier 1 — Exact match:** `findCapabilityInternal(cwd, slug)` runs `generateSlugInternal(input)` which lowercases and replaces non-alphanumeric with hyphens. This is exact-after-slugification, not truly exact.

**Tier 2 — Substring match:** Done in workflow code (framing-discovery.md Step 2, discuss-capability.md fuzzy_resolve step), NOT in CLI. The workflow reads `capability_list` from init and manually does substring matching against slugs and names. Multiple matches prompt user selection.

**Tier 3 — LLM interpret:** Also in workflow (framing-discovery, discuss-capability). "If 0 matches — offer to create new capability or re-describe." The workflow (which IS Claude) interprets the user's intent. This is implicit — Claude is the LLM interpreter.

### Where Resolution Lives Today

```
CLI layer (gsd-tools.cjs):
  findCapabilityInternal() -- exact slug match only
  findFeatureInternal() -- exact slug match only (requires cap slug already known)

Workflow layer (framing-discovery.md, discuss-capability.md, discuss-feature.md):
  - Calls init to get capability_list/feature_list
  - Runs substring matching against the list
  - Presents options to user on multi-match
  - Falls through to Claude-as-LLM for zero-match (offer to create/clarify)
```

### 3-Tier Design for v2

CONTEXT.md specifies: "Steps 1-2 in CLI route, step 3 falls through to workflow."

**Current state:** Step 1 is partially in CLI (slugification). Step 2 is in workflow. Step 3 is implicit.

**v2 design — what needs to change:**

A new CLI route `resolve-slug` (or added to `init framing-discovery`) should:

1. **Tier 1 — Exact:** `findCapabilityInternal(cwd, input)` → if `found`, return `{resolved: true, type: 'capability', slug}` or run `findFeatureInternal` if input contains `/`
2. **Tier 2 — Fuzzy/wildcard:** If not found, load capability list, run substring matching. If unique match, return `{resolved: true, type: 'capability'|'feature', slug, matched_by: 'fuzzy'}`. If multi-match, return `{resolved: false, candidates: [...], reason: 'ambiguous'}`.
3. **Tier 3 — Fall-through:** If multi-match or zero-match, return `{resolved: false, candidates: [], reason: 'no_match'}`. The workflow (Claude) interprets user intent.

**Capability vs Feature disambiguation:** Input `mistake-detection` resolves to capability. Input `coaching/mistake-detection` resolves to feature (slash is the separator). Input `mistake` with both `coaching/mistake-detection` (feature) and `mistake-grading` (capability) present → ambiguous → present to user.

**Key constraint from CONTEXT.md:** "Lens is always explicit via command: /new, /debug, /enhance, /refactor." Slug resolution only determines the target (cap or feature), not the lens. The command invocation provides the lens.

**New CLI route needed:**

```
slug-resolve <input> [--type capability|feature|auto]
```

Returns:
```json
{
  "tier": 1|2|3,
  "resolved": true|false,
  "type": "capability"|"feature"|null,
  "capability_slug": "...",
  "feature_slug": "...|null",
  "full_path": "coaching/mistake-detection",
  "candidates": [],
  "reason": "exact"|"fuzzy"|"ambiguous"|"no_match"
}
```

The 3-tier resolution merges capability AND feature matching in one call. This is the single entry point CONTEXT.md describes: `/gsd:<lens> <slug>` where the slug can be a capability OR feature.

---

## 5. framing-discovery.md Adaptation Map

### Current State

`framing-discovery.md` is **capability-scoped**:
- Resolves to a CAPABILITY slug
- Writes brief to `.planning/capabilities/{slug}/BRIEF.md` (capability level)
- Passes `CAPABILITY_SLUG` to framing-pipeline
- framing-pipeline writes RESEARCH.md to capability level
- framing-pipeline writes requirements to capability level

### Required Changes for v2

CONTEXT.md specifies: "Pipeline passes feature only (not cap + feature). Stages derive capability from feature's directory path."

| Current behavior | V2 target | Change required |
|-----------------|-----------|-----------------|
| Resolves to capability slug only | Resolves to capability OR feature slug | 3-tier slug-resolve determines target type |
| Brief at `.planning/capabilities/{slug}/BRIEF.md` | Brief at `.planning/capabilities/{cap}/features/{feat}/DISCOVERY-BRIEF.md` | Path change when target is feature |
| Passes `CAPABILITY_SLUG` to pipeline | Passes `FEATURE_SLUG` (capability derived from path) | Interface change |
| framing-pipeline writes artifacts at capability level | All artifacts at feature level | Path change throughout pipeline |

### Adaptation Steps

1. **Step 1 (Initialize):** Replace `init framing-discovery` call with `slug-resolve` call (new CLI route). Determine if resolved target is capability or feature.

2. **Step 2 (Fuzzy Resolution):** Largely unchanged — but now resolves BOTH caps and features. If target is capability, route to capability orchestrator. If feature, proceed to discovery for that feature.

3. **Step 4 (Scaffold Brief):** If feature-scoped: write to `.planning/capabilities/{cap}/features/{feat}/DISCOVERY-BRIEF.md`. If capability-scoped (old path): write to capability level then route through capability orchestrator.

4. **Step 9 (Finalize Brief):** Write brief to feature-level path.

5. **Step 10 (Pipeline Handoff):** Pass `FEATURE_SLUG` + `CAPABILITY_SLUG` (derived). Remove direct `CAPABILITY_SLUG` as primary identifier — feature is primary.

### Discuss-Capability → Feature Stubs

CONTEXT.md: "Discuss capability enhances CAPABILITY.md + creates initial FEATURE.md stubs (features discovered during discussion)."

Current `discuss-capability.md` does NOT create FEATURE.md stubs. The `update_capability_file` step only writes to `.documentation/capabilities/{slug}.md`. This is a missing behavior that needs to be added.

**Gap:** discuss-capability needs a post-exploration step that:
1. Identifies features mentioned during exploration
2. Calls `feature-create {capSlug} {featName}` for each new feature
3. Updates CAPABILITY.md Features table with discovered features

---

## 6. Capability Orchestrator Spec

CONTEXT.md: "Thin orchestrator reads CAPABILITY.md, gets prioritized feature list, calls framing-pipeline per feature in order."

### Data Needed from CAPABILITY.md

```
- features list with priority order
- cross-feature constraints (Invariants section)
- dependencies table (which features depend on others)
- capability name and slug (for passing to pipeline)
```

### Priority and DAG Construction

The CAPABILITY.md Features table currently has `Feature | Status` columns. V2 requires `Feature | Priority | Depends-On | Status`. The orchestrator reads this to:

1. Build an ordered list: features sorted by priority integer
2. Build a DAG: edges from "Depends-On" values
3. Topological sort: determines wave groupings

**Wave grouping logic:**
```
Wave 1: features with no dependencies (or all deps complete)
Wave 2: features whose only deps are Wave 1
Wave N: features whose deps are all in earlier waves
```

### Orchestrator Interface

```bash
# New CLI route needed:
init capability-orchestrate <capSlug>
```

Returns:
```json
{
  "capability_slug": "coaching",
  "capability_dir": ".planning/capabilities/coaching",
  "features": [
    {"slug": "mistake-detection", "priority": 1, "depends_on": [], "status": "pending"},
    {"slug": "grading", "priority": 2, "depends_on": ["mistake-detection"], "status": "pending"}
  ],
  "waves": [
    ["mistake-detection"],
    ["grading"],
    ["session-summary"]
  ],
  "dag": {
    "mistake-detection": [],
    "grading": ["mistake-detection"],
    "session-summary": ["grading"]
  }
}
```

### Orchestrator Workflow

The orchestrator is a thin workflow (not a full agent), similar to framing-pipeline.md pattern. It:

1. Reads CAPABILITY.md, extracts ordered feature list
2. Constructs DAG from dependency declarations
3. Topological-sorts into waves
4. For each wave (in order):
   a. Displays wave plan to user ("Wave 1: mistake-detection, grading [parallel]")
   b. User confirms or adjusts
   c. Dispatches `framing-pipeline.md` for each feature in the wave
   d. If parallelization enabled: parallel dispatch; otherwise sequential
5. After all waves: updates capability status

### Interface with framing-pipeline

**Current framing-pipeline inputs:** `BRIEF_PATH, LENS, SECONDARY_LENS, CAPABILITY_SLUG, CAPABILITY_NAME`

**V2 framing-pipeline inputs (feature-level):**
```
FEATURE_SLUG       -- the feature being processed
CAPABILITY_SLUG    -- derived from feature directory path
FEATURE_DIR        -- .planning/capabilities/{cap}/features/{feat}/
BRIEF_PATH         -- {FEATURE_DIR}/DISCOVERY-BRIEF.md
LENS               -- from capability orchestrator (from CAPABILITY.md suggested lens or user input)
```

The pipeline derives capability context from the feature's directory. No need to pass capability separately if feature_dir is absolute — `cap_slug = path.basename(path.dirname(path.dirname(feature_dir)))`.

---

## 7. Pipeline Stage Wiring Table

### Current State vs V2 Target

| Stage | Current: What It Calls | Current: Output Location | V2: What It Should Call | V2: Output Location |
|-------|----------------------|--------------------------|------------------------|---------------------|
| Research | `research-workflow.md` | `.planning/capabilities/{cap}/RESEARCH.md` | `research-workflow.md` (unchanged) | `.planning/capabilities/{cap}/features/{feat}/RESEARCH.md` |
| Requirements | Inline in framing-pipeline.md (generates to cap) | `.planning/capabilities/{cap}/REQUIREMENTS.md` | Same generation logic | FEATURE.md itself (3-layer sections already there) |
| Plan | `plan.md` workflow | `.planning/capabilities/{cap}/features/{feat}/` (via `init plan-feature`) | `plan.md` workflow (unchanged) | `.planning/capabilities/{cap}/features/{feat}/01-PLAN.md` |
| Execute | `execute.md` workflow | Feature dir (via `init execute-feature`) | `execute.md` workflow (unchanged) | Feature dir, `01-SUMMARY.md` |
| Review | `review.md` workflow | Feature dir | `review.md` workflow (unchanged) | Feature dir |
| Doc | `doc.md` workflow | `.documentation/` | `doc.md` workflow (unchanged) | `.documentation/` |

### Key Delta: Research + Requirements

The big mismatch is research and requirements. Currently framing-pipeline.md:
- Passes `output_dir: .planning/capabilities/{CAPABILITY_SLUG}` → research lands at capability level
- Generates requirements to `REQUIREMENTS.md` at capability level

V2 target:
- Research output: `{FEATURE_DIR}/RESEARCH.md`
- Requirements: NOT a separate file — requirements are already embedded in FEATURE.md (3-layer format). Requirements generation stage either populates FEATURE.md directly OR writes a separate REQUIREMENTS.md within the feature dir.

### framing-pipeline.md Changes Required

In Stage 1 (Research), change `output_dir` from capability level to feature level:
```
Current: output_dir: .planning/capabilities/{CAPABILITY_SLUG}
V2:      output_dir: .planning/capabilities/{CAPABILITY_SLUG}/features/{FEATURE_SLUG}
```

In Stage 2 (Requirements), change write target:
```
Current: .planning/capabilities/{CAPABILITY_SLUG}/REQUIREMENTS.md
V2:      Populate FEATURE.md sections EU/FN/TC directly, OR write
         .planning/capabilities/{cap}/features/{feat}/REQUIREMENTS.md
```

In Stages 3-6: Change context paths to use `FEATURE_DIR` as base. `init plan-feature` and `init execute-feature` already accept `capSlug featSlug` — these are already feature-scoped. The plan.md and execute.md workflows should already work if invoked correctly.

**The pipeline already has feature-scoped init commands — the gap is that framing-pipeline.md doesn't USE them yet.** It still passes capability-level context.

### Stage Handoff Wiring (current framing-pipeline.md)

```
framing-discovery.md
  |-> writes BRIEF.md (cap level today, feature level in v2)
  |-> invokes framing-pipeline.md with CAPABILITY_SLUG

framing-pipeline.md
  Stage 1: research-workflow.md
    output_dir: capability level (GAP: needs feature level)
  Stage 2: inline requirements generation
    output: capability REQUIREMENTS.md (GAP: needs feature FEATURE.md or feature REQUIREMENTS.md)
  Stage 3: plan.md
    uses: init plan-feature (already feature-scoped -- CORRECT)
  Stage 4: execute.md
    uses: init execute-feature (already feature-scoped -- CORRECT)
  Stage 5: review.md
    (needs feature-level req paths)
  Stage 6: doc.md
    writes to .documentation/ (unchanged)
```

---

## 8. Focus Group Command Spec

CONTEXT.md: "`/gsd:focus` command with Q&A (goals, priority caps/features) -> quick dependency ordering -> ROADMAP.md update."

### Current State

No `/gsd:focus` command exists. No `focus.md` workflow. No `init focus` CLI route. This is a net-new command.

### What Focus Groups Replace

Focus groups replace milestones as the sequencing mechanism. ROADMAP.md currently uses milestone-style structure. V2 ROADMAP.md uses focus group structure (from CONTEXT.md example):

```markdown
## Active Focus: Coaching Foundation
### Goal
Surface mistakes and grade decisions for a single user session.
### Priority Order
1. coaching/mistake-detection -> depends: none
2. coaching/grading -> depends: mistake-detection
3. coaching/session-summary -> depends: grading
### Status
- [x] coaching/mistake-detection (complete)
- [ ] coaching/grading (in progress)
- [ ] coaching/session-summary (not started)
```

### Focus Group Command Spec

**Command:** `/gsd:focus` (new slash command needed in `commands/gsd/`)

**Workflow file:** `get-shit-done/workflows/focus.md` (new file needed)

**CLI support route:** `init focus` (new route in init.cjs)

**Process:**

1. **Initialize:** Load all capabilities and features with current status. Load existing ROADMAP.md focus groups.

2. **Q&A (Goal):** "What is the goal of this sprint/focus?" → captures focus group name + goal sentence.

3. **Q&A (Priority caps/features):** "Which capabilities or features are in scope? In what priority order?" → user lists them. Fuzzy resolution per item using `slug-resolve`.

4. **Dependency scan:** For each capability selected, read CAPABILITY.md dependency table. For each feature selected, check if it references other features. Quick mgrep scan for shared file paths (for the overlap detection). Surface to user.

5. **Overlap check:** Compare new focus group's feature set against existing active focus groups' feature sets. If overlap: offer to merge into existing focus, or create parallel focus (user confirms).

6. **Ordering:** Final priority order presented to user for confirmation.

7. **ROADMAP.md update:** Write new focus group section. Use `state add-decision` to record focus group creation.

**STATE.md tracking:**

CONTEXT.md: "STATE.md tracks: Active focus group, active capability + feature within focus, current plan, key decisions from discovery, blockers."

`state patch` needs new field support: `--active-focus-group "Coaching Foundation"`. May require STATE.md template update and `state.cjs` patch handler expansion.

**New CLI routes needed:**

```
init focus                           -- load capability/feature inventory for focus workflow
focus-create <name> <goal>           -- create a focus group entry in ROADMAP.md
focus-list                           -- list all focus groups from ROADMAP.md
focus-status <name>                  -- status of a specific focus group
focus-update-item <name> <slug> <status>  -- mark item complete in focus group
```

---

## 9. New CLI Routes Needed

Summary of net-new routes required for v2:

| Route | Purpose | Priority |
|-------|---------|----------|
| `slug-resolve <input>` | 3-tier slug resolution (exact → fuzzy → fall-through) for both caps and features | HIGH — needed by all framing commands |
| `init capability-orchestrate <capSlug>` | Load CAPABILITY.md, extract features, build wave/DAG structure | HIGH — capability orchestrator depends on it |
| `init focus` | Load cap/feature inventory for focus group creation workflow | MEDIUM — needed by `/gsd:focus` |
| `focus-create <name> <goal>` | Write focus group to ROADMAP.md | MEDIUM |
| `focus-list` | List focus groups from ROADMAP.md | MEDIUM |
| `focus-status <name>` | Focus group status | LOW — nice to have |
| `focus-update-item <name> <slug> <status>` | Mark focus group item done | MEDIUM |

### Routes That Already Exist and Are Correct

| Route | Status |
|-------|--------|
| `capability-create` | Correct — creates right directory structure |
| `capability-list` | Correct |
| `capability-status` | Correct |
| `feature-create` | Correct |
| `feature-list` | Correct |
| `feature-status` | Correct |
| `init plan-feature` | Correct — already feature-scoped |
| `init execute-feature` | Correct — already feature-scoped |
| `init feature-op` | Correct |
| `init discuss-capability` | Correct |
| `init discuss-feature` | Correct |
| `init framing-discovery` | Partially correct — needs to accept feature slugs not just capability slugs |

---

## 10. Gap Summary

### Template Gaps

| Template | Gap | Fix |
|----------|-----|-----|
| capability.md | Missing `name:` in frontmatter | Add `name: "{name}"` to frontmatter |
| capability.md | Missing "Why" section | Add `## Why` section |
| capability.md | Features table missing priority + depends-on columns | Add columns |
| capability.md | No separation between invariants and cross-feature constraints | Clarify or split section |
| feature.md | Missing `name:` in frontmatter | Add `name: "{name}"` to frontmatter |

### Workflow Gaps

| Workflow | Gap | Fix |
|----------|-----|-----|
| discuss-capability.md | Writes to `.documentation/` not `.planning/capabilities/` | Redirect writes to CAPABILITY.md |
| discuss-capability.md | Does not create FEATURE.md stubs | Add feature stub creation step |
| framing-discovery.md | Only resolves capabilities, not features | Wire to `slug-resolve` |
| framing-discovery.md | Writes brief at capability level | Write brief at feature level |
| framing-pipeline.md | research `output_dir` is capability level | Change to feature level |
| framing-pipeline.md | requirements write to capability REQUIREMENTS.md | Write to feature FEATURE.md or feature REQUIREMENTS.md |
| framing-pipeline.md | Passes CAPABILITY_SLUG as primary identifier | Pass FEATURE_SLUG as primary, derive cap from path |

### Missing Files

| File | Purpose |
|------|---------|
| `commands/gsd/focus.md` | `/gsd:focus` slash command |
| `get-shit-done/workflows/focus.md` | Focus group creation workflow |
| `get-shit-done/workflows/capability-orchestrator.md` | Capability-level orchestration workflow |

### Missing CLI Routes

| Route | File to modify |
|-------|---------------|
| `slug-resolve` | gsd-tools.cjs router + new lib/slug.cjs |
| `init capability-orchestrate` | init.cjs |
| `init focus` | init.cjs |
| `focus-create` | gsd-tools.cjs router + new lib/focus.cjs |
| `focus-list` | lib/focus.cjs |
| `focus-update-item` | lib/focus.cjs |

---

## Sources

All findings derived directly from code inspection — no external sources needed.

- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` — CLI router, all routes
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/capability.cjs` — capability commands
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs` — feature commands
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs` — all init compound commands
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` — slug generation, findCapabilityInternal, findFeatureInternal
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md` — discovery workflow
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-pipeline.md` — pipeline orchestrator
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/discuss-capability.md` — capability discussion
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/discuss-feature.md` — feature discussion
- `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/capability.md` — capability template
- `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/feature.md` — feature template
- `/Users/philliphall/get-shit-done-pe/.planning/phases/12-workflow-optimization-wiring/12-CONTEXT.md` — decisions

**Confidence:** HIGH on all sections — direct code inspection, no inference required.
