---
type: discovery-brief
capability: pipeline-execution
primary_lens: debug
secondary_lens: null
completion: mvu_met
created: "2026-03-06"
---

# Discovery Brief: pipeline-execution (debug)

## Problem Statement

Slug resolution fails for non-exact inputs where hyphens differ from the target slug. Users entering reasonable approximations (e.g., "pipe-line" for "pipeline-execution") get a hard `no_match` error instead of a fuzzy match or candidate list. This blocks entry to any GSD command that relies on slug-resolve.

## Context

### Existing State

- All GSD commands route through `resolveSlugInternal()` in `get-shit-done/bin/lib/core.cjs` for slug resolution
- 3-tier resolution: exact -> fuzzy (substring) -> fall-through (no_match)
- Tier 1 (exact) works correctly
- Tier 2 (fuzzy) uses pure substring containment -- fails when hyphen placement differs
- Tier 3 fires prematurely as a result

### Relevant Modules

- `get-shit-done/bin/lib/core.cjs` -- `resolveSlugInternal()` lines 394-473 (sole fix target)
- `get-shit-done/bin/gsd-tools.cjs` -- `slug-resolve` CLI route (calls resolveSlugInternal)

### Prior Exploration

None for this specific bug. Prior brief was a refactor discovery for scope-fluid pipeline (completed).

## Specification (Debug)

### Symptom

`/gsd:debug pipe-line` returns `no_match` error instead of fuzzy-matching to "pipeline-execution" or presenting it as a candidate. Same failure for any non-exact slug where hyphen placement differs from the target.

### Reproduction Path

1. Run any GSD command with a non-exact slug: `node gsd-tools.cjs slug-resolve "pipe-line"`
2. Returns `{resolved: false, tier: 3, reason: "no_match", candidates: []}`
3. Expected: `{resolved: true, tier: 2, reason: "fuzzy_unique"}` or `{candidates: [...], reason: "ambiguous"}`

### Hypothesis

Tier 2 fuzzy matching uses pure substring containment:
- Line 441: `if (slug.includes(trimmed) || trimmed.includes(slug))` (capabilities)
- Line 453: `if (f.feature_slug.includes(trimmed) || trimmed.includes(f.feature_slug) || fullPath.includes(trimmed))` (features)

"pipe-line" is not a substring of "pipeline-execution" (hyphen in wrong position), so both checks fail. Needs normalization (strip hyphens before comparison) or token-based matching.

### Evidence

- Code read confirmed substring-only matching at both sites
- User reports fuzzy matching works for exact-substring inputs but fails when hyphens differ
- All fuzzy resolution flows through this single function -- no other matching logic exists in the codebase

## Unknowns

### Assumptions

- Hyphen-strip normalization before substring check is sufficient (simplest fix)
- Performance is not a concern (capability/feature counts are small)

### Open Questions

- Should matching also normalize underscores and spaces, or just hyphens?

## Scope Boundary

### In

- Fix Tier 2 matching in `resolveSlugInternal()` (core.cjs:430-460)
- Both capability matching (line 441) and feature matching (line 453)
- Single function fix propagates to all GSD commands

### Out

- Tier 1 exact lookups (`findCapabilityInternal`, `findFeatureInternal`) -- working correctly
- `generateSlugInternal` -- input normalization, separate concern
- Init routes that pass capability lists -- no matching logic, just data passing

### Follow-ups

- None identified -- all fuzzy matching lives in these two code sites
