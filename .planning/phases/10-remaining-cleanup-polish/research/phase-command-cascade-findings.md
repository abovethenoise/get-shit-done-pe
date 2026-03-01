# Phase Command Cascade Analysis — Research Findings

**Audited:** 2026-03-01
**Scope:** Impact analysis of deleting all v1 phase commands and renaming phase workflows

---

## 1. Files Being Deleted

### Commands (5 command wrappers):
- `commands/gsd/plan-phase.md`
- `commands/gsd/execute-phase.md`
- `commands/gsd/review-phase.md`
- `commands/gsd/doc-phase.md`
- `commands/gsd/research-phase.md`

### Workflows deleted:
- `workflows/verify-phase.md` (only spawned by execute-phase, and verify concept removed)
- `workflows/research-phase.md` (standalone wrapper, framing-pipeline calls research-workflow directly)
- `workflows/transition.md` (only serves phase transitions; v2 has no phase transitions)

### Templates deleted:
- `templates/verification-report.md` (only consumer was verify-phase.md)

---

## 2. Files Being Renamed (NOT deleted)

These contain reusable logic that framing-pipeline.md depends on:

| Old Name | New Name | Why Kept |
|---|---|---|
| `workflows/plan-phase.md` | `workflows/plan.md` | Called by framing-pipeline.md stage 3 (line 154) |
| `workflows/execute-phase.md` | `workflows/execute.md` | Called by framing-pipeline.md stage 4 (line 183) |
| `workflows/review-phase.md` | `workflows/review.md` | Called by framing-pipeline.md stage 5 (line 219) |
| `workflows/doc-phase.md` | `workflows/doc.md` | Called by framing-pipeline.md stage 6 (line 254) |
| `workflows/execute-plan.md` | stays (already generic) | Called by execute.md (renamed execute-phase) |

**After renaming, update internal content** to make sense in feature/capability context.

---

## 3. Callers That Need @file Reference Updates

### framing-pipeline.md (CRITICAL — hard dependency on all 4 renamed workflows):
- Line 154: `@~/.claude/get-shit-done/workflows/plan-phase.md` → `plan.md`
- Line 183: `@~/.claude/get-shit-done/workflows/execute-phase.md` → `execute.md`
- Line 219: `@~/.claude/get-shit-done/workflows/review-phase.md` → `review.md`
- Line 254: `@~/.claude/get-shit-done/workflows/doc-phase.md` → `doc.md`

### progress.md (routes to deleted commands):
- Line 178: `/gsd:execute-phase {phase}` → route to v2 commands
- Lines 201, 224, 243, 250, 251, 297, 298, 325: Multiple `/gsd:plan-phase` and `/gsd:review-phase` refs

### resume-work.md / resume-project.md (routes to deleted commands):
- Line 179: `/gsd:execute-phase {phase}` → route to v2 commands
- Lines 183, 213, 227, 235: `/gsd:plan-phase` refs

### plan-phase.md itself (auto-advance spawns execute-phase):
- Line 541-572: Auto-advance mode spawns execute-phase.md as Task
- After rename: update to reference execute.md

### transition.md callers:
- execute-phase.md line ~381 invokes transition.md
- Since transition.md is being DELETED, remove this invocation from execute.md (renamed execute-phase)
- Capability/feature completion state management needs to be handled differently in v2

---

## 4. CLI Init Routes — Full Impact

### Routes to DELETE (callers are deleted commands/workflows):
| Route | Handler Function | Only Caller |
|---|---|---|
| `init plan-phase` | `cmdInitPlanPhase` | plan-phase.md workflow |
| `init review-phase` | `cmdInitReviewPhase` | review-phase.md workflow |
| `init doc-phase` | `cmdInitDocPhase` | doc-phase.md workflow |
| `init phase-op` | `cmdInitPhaseOp` | verify-phase.md + research-phase.md |

### Routes to RENAME (callers are renamed workflows):
| Route | Handler | Callers |
|---|---|---|
| `init execute-phase` | `cmdInitExecutePhase` | execute.md (renamed) + execute-plan.md |

Consider renaming to `init execute` for consistency.

---

## 5. Phase Utility CLI Routes — Re-evaluation

With phase commands deleted, re-evaluate which phase utility routes are still needed:

| Route | Original Callers | Status After Deletions |
|---|---|---|
| `find-phase` | execute-phase.md | Caller renamed to execute.md — KEEP if execute.md still uses it |
| `phase complete` | execute-phase.md, transition.md | execute.md renamed, transition.md DELETED — evaluate |
| `phase-plan-index` | execute-phase.md | Caller renamed — KEEP if execute.md still uses it |
| `phases list` | execute-plan.md | Caller still exists — KEEP |
| `phase add` | ZERO callers | DELETE |
| `phase insert` | ZERO callers | DELETE |
| `phase remove` | ZERO callers | DELETE |
| `phase next-decimal` | decimal-phase-calculation.md (ref only) | DELETE |
| `roadmap get-phase` | plan-phase.md, research-phase.md, verify-phase.md | ALL callers deleted — DELETE unless renamed workflow still needs it |
| `config-get` | execute-phase.md, plan-phase.md, execute-plan.md | Callers renamed — KEEP |
| `config-set` | transition.md | Caller DELETED — evaluate |
| `plan-validate` | plan-phase.md | Caller renamed to plan.md — KEEP |

---

## 6. Agents — None Orphaned (Workflows Renamed, Not Deleted)

All agents survive because their spawning workflows are being RENAMED not deleted:
- gsd-planner → spawned by plan.md (renamed plan-phase.md)
- gsd-plan-checker → spawned by plan.md
- gsd-executor → spawned by execute-plan.md
- gsd-verifier → spawned by execute.md (renamed execute-phase.md)
- 4x review agents → spawned by review.md (renamed review-phase.md)
- gsd-review-synthesizer → spawned by gather-synthesize.md
- gsd-doc-writer → spawned by doc.md (renamed doc-phase.md)

**But**: update any @file references inside agent files that point to old workflow names.

---

## 7. Templates — Impact Summary

### Templates to DELETE:
- `verification-report.md` (only consumer was verify-phase.md)
- `milestone.md`, `milestone-archive.md`, `retrospective.md` (v1 milestone lifecycle)
- `research-project/` directory (5 files — replaced by research-workflow pipeline)

### Templates to RENAME:
- `phase-prompt.md` → `plan-prompt.md` or similar (defines PLAN.md output format, consumed by gsd-planner)
- `planner-subagent-prompt.md` → keep name (already generic enough)

### Templates to UPDATE (remove phase language):
- All summary variants (summary.md, summary-complex.md, summary-minimal.md, summary-standard.md)
- context.md, research.md, discovery.md, requirements.md, roadmap.md, state.md
- UAT.md, user-setup.md, VALIDATION.md, continue-here.md, project.md
- `phase:` frontmatter field → REMOVE from ALL templates

---

## 8. Reference Docs — Impact Summary

### Docs to DELETE:
- `planning-config.md` (zero v2 callers)
- `decimal-phase-calculation.md` (zero v2 callers)
- `git-planning-commit.md` (zero v2 callers)
- `verification-patterns.md` (only caller was verify-phase.md, deleted)
- `phase-argument-parsing.md` (only caller was research-phase.md, deleted)

### Docs to UPDATE:
- `model-profiles.md` → v2 4-tier standard, no deleted agents
- `model-profile-resolution.md` → v2 resolveModelFromRole pattern
- `continuation-format.md` → v2 examples, no phase command references
- `pipeline-invariants.md` → update any phase-specific invariants
- `escalation-protocol.md` → verify no phase references
- `questioning.md` → verify no phase references

---

*Research complete. Ready for re-planning.*
