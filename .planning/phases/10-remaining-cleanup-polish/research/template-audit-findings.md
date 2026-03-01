# Template Audit Findings (CLN-04)

**Audited:** 2026-03-01
**Scope:** All files in `get-shit-done/templates/`
**Method:** Read every template, grep for consumers across workflows/bin/references

---

## 1. Existing Templates Inventory

### Top-Level Templates (30 files + 2 subdirectories)

| # | Template | Artifact Type | v1/v2 | Consumers | Verdict |
|---|----------|--------------|-------|-----------|---------|
| 1 | `capability.md` | Capability definition | **v2** | `bin/lib/template.cjs` (fill command) | **KEEP** -- already v2 |
| 2 | `config.json` | Project config | Neutral | `workflows/transition.md`, `workflows/execute-plan.md`, `workflows/progress.md` | **KEEP** -- model-neutral |
| 3 | `context.md` | Phase context (CONTEXT.md) | **v1** | `workflows/init-project.md` (indirect), planner-subagent-prompt references it | **UPDATE** -- phase language to feature/capability |
| 4 | `continue-here.md` | Session resumption | Neutral | `workflows/resume-work.md` | **KEEP** -- update phase refs to generic |
| 5 | `debug-subagent-prompt.md` | Debug subagent spawn | Neutral | Referenced by gsd-debugger pattern | **KEEP** -- no phase language |
| 6 | `DEBUG.md` | Debug session tracking | Neutral | Debug workflow pattern | **KEEP** -- no phase language |
| 7 | `discovery-brief.md` | Discovery brief | **v2** | `bin/lib/template.cjs` (fill command), `workflows/framing-discovery.md` | **KEEP** -- already v2 |
| 8 | `discovery.md` | Library/option discovery | **v1** | Zero direct workflow consumers (not @file referenced) | **UPDATE** -- heavy phase language |
| 9 | `docs.md` | Documentation structure | **v2** | `workflows/doc-phase.md` (implicit -- defines structure doc-phase uses) | **KEEP** -- already v2 |
| 10 | `feature.md` | Feature definition | **v2** | `bin/lib/template.cjs` (fill command) | **KEEP** -- already v2 |
| 11 | `milestone.md` | Milestone entry | **v1** | Zero direct workflow consumers | **DELETE** -- v1 milestone model |
| 12 | `milestone-archive.md` | Milestone archive | **v1** | References deleted `complete-milestone` workflow | **DELETE** -- v1 milestone model |
| 13 | `phase-prompt.md` | PLAN.md format | **v1** | `workflows/plan-phase.md` (defines output format gsd-planner produces) | **UPDATE** -- heavy phase language, core template |
| 14 | `planner-subagent-prompt.md` | Planner spawn prompt | **v1** | `workflows/plan-phase.md` (spawn pattern) | **UPDATE** -- phase language |
| 15 | `project.md` | PROJECT.md | Neutral | `workflows/init-project.md` | **KEEP** -- minor phase references |
| 16 | `requirements.md` | REQUIREMENTS.md | **v1** | Zero direct @file consumers; structure used by init | **UPDATE** -- phase traceability language |
| 17 | `research.md` | RESEARCH.md (deep) | **v1** | `workflows/research-workflow.md` (defines output format) | **UPDATE** -- heavy phase language |
| 18 | `retrospective.md` | Project retrospective | **v1** | Zero workflow consumers | **DELETE** -- milestone-centric, no v2 callers |
| 19 | `review.md` | Feature review | **v2** | Zero direct @file consumers; pattern for review-phase | **KEEP** -- already v2 |
| 20 | `roadmap.md` | ROADMAP.md | **v1** | Implicit use during init | **UPDATE** -- phase/milestone language |
| 21 | `state.md` | STATE.md | **v1** | `references/pipeline-invariants.md` | **UPDATE** -- phase position language |
| 22 | `summary.md` | Plan summary (full) | **v1** | `workflows/execute-plan.md`, `workflows/execute-phase.md`, `references/pipeline-invariants.md` | **UPDATE** -- heavy phase language |
| 23 | `summary-complex.md` | Summary variant (complex) | **v1** | `bin/lib/template.cjs` | **UPDATE** -- phase language |
| 24 | `summary-minimal.md` | Summary variant (minimal) | **v1** | `bin/lib/template.cjs` | **UPDATE** -- phase language |
| 25 | `summary-standard.md` | Summary variant (standard) | **v1** | `bin/lib/template.cjs` | **UPDATE** -- phase language |
| 26 | `UAT.md` | User acceptance testing | **v1** | `workflows/progress.md` (checks for UAT files), verify-work pattern | **UPDATE** -- phase language |
| 27 | `user-setup.md` | External service setup | **v1** | `workflows/execute-plan.md` | **UPDATE** -- phase language |
| 28 | `VALIDATION.md` | Validation strategy | **v1** | `workflows/plan-phase.md` | **UPDATE** -- phase language |
| 29 | `verification-report.md` | Phase verification | **v1** | `workflows/verify-phase.md` | **UPDATE** -- phase language |

### Subdirectory: `codebase/` (7 files)

| # | Template | Artifact Type | v1/v2 | Consumers | Verdict |
|---|----------|--------------|-------|-----------|---------|
| 30 | `codebase/architecture.md` | Codebase architecture | Neutral | `workflows/execute-plan.md` (codebase update step) | **KEEP** |
| 31 | `codebase/concerns.md` | Known issues | Neutral | Codebase mapping pattern | **KEEP** |
| 32 | `codebase/conventions.md` | Coding style | Neutral | `workflows/execute-plan.md` (codebase update step) | **KEEP** |
| 33 | `codebase/integrations.md` | External services | Neutral | `workflows/execute-plan.md` (codebase update step) | **KEEP** |
| 34 | `codebase/stack.md` | Technology stack | Neutral | `workflows/execute-plan.md` (codebase update step) | **KEEP** |
| 35 | `codebase/structure.md` | File organization | Neutral | `workflows/execute-plan.md` (codebase update step) | **KEEP** |
| 36 | `codebase/testing.md` | Test framework | Neutral | Codebase mapping pattern | **KEEP** |

### Subdirectory: `research-project/` (5 files)

| # | Template | Artifact Type | v1/v2 | Consumers | Verdict |
|---|----------|--------------|-------|-----------|---------|
| 37 | `research-project/ARCHITECTURE.md` | Project research | **v1** | Zero workflow consumers (grep found nothing) | **DELETE** |
| 38 | `research-project/FEATURES.md` | Feature landscape | **v1** | Only self-referenced within research-project/ | **DELETE** |
| 39 | `research-project/PITFALLS.md` | Domain pitfalls | **v1** | Only self-referenced within research-project/ | **DELETE** |
| 40 | `research-project/STACK.md` | Stack research | **v1** | Zero workflow consumers | **DELETE** |
| 41 | `research-project/SUMMARY.md` | Research summary | **v1** | Zero workflow consumers | **DELETE** |

---

## 2. Templates to Delete

| Template | Rationale |
|----------|-----------|
| `milestone.md` | v1 milestone entry concept. No v2 workflow calls it. `complete-milestone` workflow was deleted in Phase 8. |
| `milestone-archive.md` | References deleted `complete-milestone` workflow. v1 milestone archive has no v2 equivalent. |
| `retrospective.md` | Milestone-centric retrospective. Zero workflow consumers. v2 model has no retrospective artifact type. |
| `research-project/` (entire dir) | All 5 files have zero workflow consumers. This was a v1 "project-level research" concept replaced by the 6-gatherer research-workflow pipeline. The `requirements.md` template still references `FEATURES.md` categories -- that reference needs updating. |

**Total deletions:** 8 files (3 top-level + 5 in research-project/)

---

## 3. Templates to Update (v1 phase language -> v2 capability/feature language)

### High Priority (actively consumed, heavy phase language)

| Template | Key Changes Needed |
|----------|-------------------|
| `context.md` | Title "Phase Context Template" -> "Feature Context Template". All "phase" -> "feature". Path pattern `.planning/phases/XX-name/` -> `.planning/capabilities/{cap}/{feature}/`. Consumer refs: `gsd-phase-researcher` -> valid agent name or strip. Examples: rewrite without "Phase 3: Post Feed" framing. |
| `phase-prompt.md` | This is the PLAN.md template -- the single most consumed template. Rename concept: "Phase Prompt" -> "Plan Template". Replace `phase: XX-name` frontmatter with `feature:` or keep generic. Update all path examples from `.planning/phases/XX-name/` to v2 paths. Update `<output>` section path. **This is the highest-risk update.** |
| `summary.md` + variants | Replace "Phase [X]: [Name] Summary" -> "Plan Summary". All `phase:` frontmatter -> keep (still used for plan grouping). Update path patterns. Update "Next Phase Readiness" -> "Next Steps". |
| `research.md` | Title "Phase [X]: [Name] - Research" -> "Feature Research" or keep generic. Update path patterns. Remove phase-specific framing. |
| `planner-subagent-prompt.md` | Replace `{phase_number}` -> `{feature}` or make generic. Update file path patterns. |

### Medium Priority (consumed but lighter phase language)

| Template | Key Changes Needed |
|----------|-------------------|
| `discovery.md` | Replace `phase: XX-name` -> generic. Update path to DISCOVERY.md. Light touch. |
| `requirements.md` | Replace "v1 Requirements / v2 Requirements" section naming (confusing with model v1/v2). Remove `research FEATURES.md` reference (deleted). Update traceability table "Phase" column. |
| `roadmap.md` | Keep phase concept (still valid in v2) but remove milestone-grouping section. Update terminology where needed. |
| `state.md` | "Phase: [X] of [Y]" -> update to capability/feature position tracking. Light touch. |
| `UAT.md` | Replace `phase: XX-name` frontmatter. Update path patterns. |
| `user-setup.md` | Replace `Phase {X}:` headers. Update path patterns. |
| `VALIDATION.md` | Replace `Phase {N}` in title. Update frontmatter. |
| `verification-report.md` | Replace `Phase {X}: {Name}` throughout. Update path references. |
| `continue-here.md` | Replace `phase: XX-name` frontmatter. Light touch. |

### Low Priority (minimal changes)

| Template | Key Changes Needed |
|----------|-------------------|
| `project.md` | "After each phase transition" -> "After each feature completion". Very minor. |

---

## 4. New Templates Design

Per 10-CONTEXT.md, 4 new templates are needed. However, audit reveals **2 of 4 already exist:**

| Template | Status | Notes |
|----------|--------|-------|
| `CAPABILITY.md` | **EXISTS** (`capability.md`) | Already v2-compatible. Created recently (Feb 28). |
| `FEATURE.md` | **EXISTS** (`feature.md`) | Already v2-compatible. Created recently (Feb 28). |
| `DISCOVERY-BRIEF.md` | **EXISTS** (`discovery-brief.md`) | Already v2-compatible. Created recently (Feb 28). Wired into `framing-discovery.md` and `bin/lib/template.cjs`. |
| `FEATURE-REQUIREMENTS.md` | **DOES NOT EXIST** | Needs creation. |

### FEATURE-REQUIREMENTS.md -- Design

**Purpose:** End user / functional / technical requirements scoped to a single feature. Maps to the 3 reviewer dimensions from milestone 1.

**Closest existing template:** `feature.md` already has EU/FN/TC sections. `requirements.md` has the checkable requirement format. FEATURE-REQUIREMENTS.md is the intersection: checkable requirements organized by the 3 reviewer layers, scoped to one feature.

**Consumers:** `review-phase.md` workflow (review.md template traces against these), `plan-phase.md` (plans reference requirement IDs).

**Proposed structure:**

```
---
type: feature-requirements
feature: "{slug}"
capability: "{slug}"
status: draft
created: "{date}"
---

# Requirements: {feature}

## End-User Requirements

- [ ] **EU-01**: {User story format: As a {who}, I want {what}, so that {why}}
  - AC: {acceptance criterion 1}
  - AC: {acceptance criterion 2}

- [ ] **EU-02**: ...

## Functional Requirements

- [ ] **FN-01**: {Behavioral spec: given {input}, when {action}, then {output}}
  - Edge: {edge case handling}
  - Error: {error condition and response}

- [ ] **FN-02**: ...

## Technical Requirements

- [ ] **TC-01**: {Implementation constraint or specification}
  - Intent: {why this approach}
  - Constraint: {hard limits}

- [ ] **TC-02**: ...

## Traceability

| REQ | Plan | Status |
|-----|------|--------|
| EU-01 | - | draft |
| FN-01 | - | draft |
| TC-01 | - | draft |

## Out of Scope

- {Explicit exclusion} -- {reason}
```

**Design rationale:**
- Mirrors `review.md` reviewer layers (EU, FN, TC) for direct traceability
- Checkable format from `requirements.md` for status tracking
- Scoped to feature (not project-wide like `requirements.md`)
- Traceability table links to plans (same pattern as project-level requirements)

---

## 5. Consumer Reference Fixes

### Broken Agent References in Templates

| Template | Reference | Status | Fix |
|----------|-----------|--------|-----|
| `context.md` line 10 | `gsd-phase-researcher` | **Agent name valid** in `bin/lib/init.cjs` model resolution | Update to v2 name if agent is renamed, or strip if `artifact_contracts` sufficient |
| `context.md` line 11 | `gsd-planner` | **Valid** | Keep |
| `phase-prompt.md` line 3 | `agents/gsd-planner.md` | **Path may not exist** -- no `agents/` directory found in get-shit-done | Verify path; may be `~/.claude/agents/gsd-planner.md` (user's local) |
| `debug-subagent-prompt.md` | `gsd-debugger` | **Valid** in `bin/lib/core.cjs` model profiles | Keep |
| `planner-subagent-prompt.md` | `gsd-planner` | **Valid** | Keep |
| `milestone-archive.md` | `complete-milestone` workflow | **Deleted** in Phase 8 | Template itself is being deleted |

### Broken Path References in Templates

| Template | Path Reference | Status | Fix |
|----------|---------------|--------|-----|
| `phase-prompt.md` line 41 | `@~/.claude/get-shit-done/workflows/execute-plan.md` | **Valid** | Keep |
| `phase-prompt.md` line 42 | `@~/.claude/get-shit-done/templates/summary.md` | **Valid** | Keep |
| `phase-prompt.md` line 44 | `@~/.claude/get-shit-done/references/checkpoints.md` | **Verify exists** | Check if checkpoints.md survived prior cleanup |
| `phase-prompt.md` line 556 | `~/.claude/get-shit-done/workflows/verify-phase.md` | **Valid** | Keep |
| `requirements.md` line 85 | `research FEATURES.md categories` | **Broken** -- `research-project/FEATURES.md` being deleted | Remove reference |

### Templates with Hardcoded `~/.claude/` Paths (for {GSD_ROOT} tokenization)

All templates use `~/.claude/get-shit-done/` paths in @file references. These need tokenization to `{GSD_ROOT}` per 10-CONTEXT.md decisions. Templates with @file paths:

- `phase-prompt.md` (3 @file references)
- `summary.md` (execution_context pattern mentions path)

This is part of the broader {GSD_ROOT} tokenization task (INTG-03), not template-specific.

---

## 6. Risk Flags

| Risk | Severity | Notes |
|------|----------|-------|
| `phase-prompt.md` is the most consumed template | HIGH | Renaming "phase" language here propagates to every PLAN.md ever created. Existing `.planning/phases/` directories in user projects use phase naming. Must not break backward compatibility with existing artifacts. |
| `agents/` directory does not exist in get-shit-done | MEDIUM | `phase-prompt.md` references `agents/gsd-planner.md`. This path resolves to `~/.claude/agents/` (user's local Claude config), not the GSD toolchain. Verify this is intentional. |
| `research-project/` deletion orphans `requirements.md` reference | LOW | Line 85 of `requirements.md` says "Derive from research FEATURES.md categories". Easy fix -- update the guidance text. |
| `discovery.md` vs `discovery-brief.md` overlap | MEDIUM | Both serve "discovery" purposes. `discovery.md` is v1 (phase-scoped library decisions), `discovery-brief.md` is v2 (capability-scoped framing output). Clarify: does `discovery.md` survive or is it replaced by `discovery-brief.md`? They serve different scopes -- `discovery.md` is shallow/tactical, `discovery-brief.md` is strategic. Recommend keeping both but updating `discovery.md` language. |
| `FEATURE-REQUIREMENTS.md` vs `feature.md` overlap | MEDIUM | `feature.md` already has EU/FN/TC sections with requirement stubs. Adding a separate `FEATURE-REQUIREMENTS.md` may create confusion about which file holds the canonical requirements. Decision needed: merge into `feature.md` or keep separate? |
| Summary variant templates (3 files) | LOW | `summary-complex.md`, `summary-standard.md`, `summary-minimal.md` are selected by `bin/lib/template.cjs` based on plan complexity. They duplicate structure from `summary.md`. All 4 need synchronized updates. |

---

## Summary Counts

| Category | Count |
|----------|-------|
| Total templates audited | 41 |
| Already v2-compatible | 6 (capability, feature, discovery-brief, docs, review, debug-subagent-prompt) |
| Model-neutral (no changes) | 9 (config.json, DEBUG.md, all 7 codebase/ templates) |
| Update to v2 language | 18 |
| Delete (stale v1) | 8 |
| New templates needed | 1 (FEATURE-REQUIREMENTS.md) |
