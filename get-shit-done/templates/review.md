---
type: review
feature: "{slug}"
capability: "{slug}"
status: pending
verdict: pending
---

# Review: {feature}

## Summary

**Verdict:** {PASS | PARTIAL | FAIL | BLOCKED}

| Result  | Count |
|---------|-------|
| Pass    | 0     |
| Partial | 0     |
| Fail    | 0     |

## Per-Requirement Trace

### {REQ ID}: {title}

**Verdict:** {PASS | PARTIAL | FAIL | BLOCKED}

**Evidence:**

- **Code:** {Does the implementation match the spec? Reference files/lines.}
- **Domain:** {Does the logic satisfy domain rules and invariants?}
- **Integration:** {Does it connect correctly with upstream/downstream?}

**Gap Analysis:** {What is missing or incomplete, if anything.}

**Fix Scope:** {Estimate of effort to close gaps: trivial | small | medium | large.}

**Blocking Assessment:** {Does this gap block other work? What is affected?}

## Reviewer Notes

### Domain Reviewer

{Concerns about domain logic, invariant violations, edge cases not tied to specific REQs.}

### Code Reviewer

{Concerns about code quality, DRY/KISS violations, patterns, performance.}

### Integration Reviewer

{Concerns about cross-boundary issues, API contracts, data flow between capabilities.}
