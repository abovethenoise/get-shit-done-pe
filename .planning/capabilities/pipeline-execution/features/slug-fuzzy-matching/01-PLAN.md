---
type: plan
feature: slug-fuzzy-matching
capability: pipeline-execution
status: ready
created: "2026-03-06"
---

# Plan 01: Fix Tier 2 Fuzzy Matching

## Objective

Add hyphen-normalized substring matching to `resolveSlugInternal()` so that inputs like "pipe-line" match "pipeline-execution".

## Requirements Coverage

| REQ | Covered |
|-----|---------|
| EU-01 | Yes |
| FN-01 | Yes |
| FN-02 | Yes |
| TC-01 | Yes |

## Tasks

### Task 1: Add hyphen-normalized matching to resolveSlugInternal

**File:** `get-shit-done/bin/lib/core.cjs`
**REQs:** FN-01, FN-02, TC-01

**Changes:**

1. Before the Tier 2 matching loop (after line 431), add a normalization helper:
   ```javascript
   const norm = s => s.replace(/-/g, '');
   const normInput = norm(trimmed);
   ```

2. Update capability matching (line 441) to include normalized comparison:
   ```javascript
   const normSlug = norm(slug);
   if (slug.includes(trimmed) || trimmed.includes(slug) || normSlug.includes(normInput) || normInput.includes(normSlug)) {
   ```

3. Update feature matching (line 453) to include normalized comparison:
   ```javascript
   const normFeatSlug = norm(f.feature_slug);
   const normFullPath = norm(fullPath);
   if (f.feature_slug.includes(trimmed) || trimmed.includes(f.feature_slug) || fullPath.includes(trimmed) || normFeatSlug.includes(normInput) || normInput.includes(normFeatSlug) || normFullPath.includes(normInput)) {
   ```

### Task 2: Verify fix

**REQs:** EU-01

**Verification:**

1. `node gsd-tools.cjs slug-resolve "pipe-line"` -> resolves to pipeline-execution
2. `node gsd-tools.cjs slug-resolve "pipeline-execution"` -> still resolves (exact, tier 1)
3. `node gsd-tools.cjs slug-resolve "pipeline"` -> still resolves (substring, tier 2)
4. `node gsd-tools.cjs slug-resolve "zzz-nonexistent"` -> still returns no_match
5. `node gsd-tools.cjs slug-resolve "slug-fuzzy"` -> resolves to slug-fuzzy-matching feature

## Risk

Low. Two-line change in a single function. Existing substring matching preserved as fallback. Normalization only adds matching paths, never removes them.
