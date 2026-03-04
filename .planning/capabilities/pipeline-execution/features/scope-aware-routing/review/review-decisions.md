# Review Decisions: scope-aware-routing

**Reviewed:** 2026-03-04
**Findings:** 5 (3 major, 2 minor)

## Accepted (3)

### Finding 1 — discuss-capability path skips stub creation (major)
**Action:** Fixed. new.md Step 2 no_match→new-capability path now routes through Step 3 before Step 4.
**Files changed:** commands/gsd/new.md

### Finding 2 — Ambiguous re-loop missing in enhance/debug/refactor (major)
**Action:** Fixed. Added "return to top of Step 2" to ambiguous branch in all 3 files.
**Files changed:** commands/gsd/enhance.md, commands/gsd/debug.md, commands/gsd/refactor.md

### Finding 5 — Step 3 redundant in enhance/debug/refactor (minor)
**Action:** Fixed. Removed redundant Step 3 (Workflow Invocation) from all 3 files — Step 2 already specifies the invocation target.
**Files changed:** commands/gsd/enhance.md, commands/gsd/debug.md, commands/gsd/refactor.md

## Dismissed (2)

### Finding 3 — TC-02 status=exploring depends on agent prose (major)
**Reason:** discuss-capability uses same feature-create CLI and also produces `status: planning`. Both paths are consistent. TC-02's `exploring` requirement dismissed — `planning` is the correct status for stubs.

### Finding 4 — "new feature" routes to framing-discovery not discuss-feature (minor)
**Reason:** framing-discovery subsumes discuss-feature as its first step (discovery brief). The routing is correct; EU-02 wording was imprecise.
