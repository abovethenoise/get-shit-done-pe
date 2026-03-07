# Review Decisions: delegation-patterns

**Date:** 2026-03-07
**Scope:** Feature (subagent-delegation/delegation-patterns)

## Accepted

### Finding 1 — FN-01: opus validity (MAJOR)
- **Action:** Amended FN-01 spec to say "opus is valid but inherit is preferred"
- **Evidence:** Official Claude Code docs at code.claude.com/docs/en/sub-agents confirm opus is valid model value for subagents
- **Files changed:** FEATURE.md (FN-01 spec text)

### Finding 2 — EU-01 AC-3: gather-synthesize.md not "replaced" (MAJOR)
- **Action:** Amended AC-3 to say "delegation content consolidated into delegation.md; context assembly retained in gather-synthesize.md"
- **Rationale:** Context assembly (Layers 0-4) is workflow-owned process, not delegation pattern. DRY separation confirmed by all 4 reviewers.
- **Files changed:** FEATURE.md (EU-01 AC-3 text)

### Finding 3 — gsd-planner/quality role_type/model mismatch (MINOR, expanded)
- **Original finding:** gsd-planner has role_type: judge but model: sonnet
- **User decision:** Planner and quality reviewer should run on Opus (critical thinking). Also drop role_type entirely — model field in frontmatter is the single authority.
- **Actions taken:**
  - Changed gsd-planner model from sonnet to inherit (Opus)
  - Changed gsd-review-quality model from sonnet to inherit (Opus)
  - Removed role_type from all 20 agent files
  - Removed ROLE_MODEL_MAP from core.cjs
  - Renamed resolveModelFromRole to resolveModelFromFrontmatter (reads model field instead of role_type)
  - Updated delegation.md routing table to remove role_type column
  - Updated FEATURE.md TC-02 spec to reference model field instead of role_type
- **Files changed:** 20 agent files, core.cjs, init.cjs, delegation.md, FEATURE.md

### Finding 4 — FN-02: "integration" typo in delegation.md (MINOR)
- **Action:** Changed "integration" to "quality" in delegation.md:66
- **Files changed:** delegation.md

## Deferred

None.

## Dismissed

None.
