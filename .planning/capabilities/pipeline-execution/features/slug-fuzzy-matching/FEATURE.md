---
type: feature
capability: "pipeline-execution"
status: planning
created: "2026-03-06"
---

# slug-fuzzy-matching

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| FN-02 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: Fuzzy slug resolution tolerates hyphen variations

**Story:** As a GSD user, I want slug resolution to match my input even when I use different hyphen placement (e.g., "pipe-line" for "pipeline-execution"), so that I don't get hard errors for reasonable approximations.

**Acceptance Criteria:**

- [ ] `slug-resolve "pipe-line"` resolves to `pipeline-execution` (tier 2 fuzzy match)
- [ ] `slug-resolve "doc-writer"` resolves or returns candidates for features containing "doc-writer"
- [ ] Non-matching inputs still return `no_match` (no false positives)

**Out of Scope:**

- Typo correction (e.g., "pipline" for "pipeline") -- only hyphen/separator normalization
- Tier 1 exact matching changes

## Functional Requirements

### FN-01: Hyphen-normalized substring matching for capabilities

**Receives:** User input string, list of capability slugs on disk.

**Returns:** Matching candidates where hyphen-stripped input is a substring of hyphen-stripped slug, or vice versa.

**Behavior:**

- Strip all hyphens from both input and each capability slug before substring comparison
- If normalized input is substring of normalized slug (or vice versa), add to candidates
- Preserve existing behavior: 1 candidate = auto-resolve, 2+ = ambiguous, 0 = no_match

### FN-02: Hyphen-normalized substring matching for features

**Receives:** User input string, list of feature slugs across all capabilities.

**Returns:** Matching candidates where hyphen-stripped input is a substring of hyphen-stripped slug (or full_path), or vice versa.

**Behavior:**

- Same normalization as FN-01 applied to feature slugs and full_path (cap/feat)
- Preserve existing behavior for candidate count routing

## Technical Specs

### TC-01: Modify resolveSlugInternal Tier 2 matching

**Intent:** Fix the two substring-match sites to normalize hyphens before comparison, making fuzzy matching resilient to separator differences.

**Upstream:** All GSD commands via `slug-resolve` CLI route.

**Downstream:** All command routing (debug, new, enhance, refactor, plan, execute, review, doc, status).

**Constraints:**

- Change only `resolveSlugInternal()` in `get-shit-done/bin/lib/core.cjs`
- No new dependencies
- No performance concerns (small data set)

**Example:**

```javascript
// Before (line 441):
if (slug.includes(trimmed) || trimmed.includes(slug)) {

// After:
const normSlug = slug.replace(/-/g, '');
const normInput = trimmed.replace(/-/g, '');
if (normSlug.includes(normInput) || normInput.includes(normSlug) || slug.includes(trimmed) || trimmed.includes(slug)) {
```

## Decisions

- Hyphen-strip normalization chosen over edit-distance (simpler, sufficient for the failure mode observed)
- Both capability and feature match sites get the same fix for consistency
- Existing substring matching preserved as fallback (normalization adds to it, doesn't replace)
