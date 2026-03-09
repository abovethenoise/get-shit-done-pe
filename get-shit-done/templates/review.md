---
type: review
feature: "{slug}"
capability: "{slug}"
reviewer: "{reviewer_type}"
status: pending
---

# Review: {feature}

## Trace Report

### {REQ ID}: {title}

**Verdict:** met | not met | regression

**Evidence:**

- **File:** `{file}:{line}`
- **Code:** `{quoted code snippet}`
- **Reasoning:** {Why this verdict — connect the code to the requirement}

**Regression Label:** proven | suspected
<!-- Include Regression Label only when verdict is "regression" -->
<!-- proven: test failure, removed function, deleted behavior -->
<!-- suspected: code analysis suggests regression but no direct proof -->

## End-User Reviewer

Traces against: Goal (verifiable sentence) + User-Facing Failures table from FEATURE.md

### {REQ ID}: {title}

**Verdict:** met | not met | regression

**Evidence:**

- **File:** `{file}:{line}`
- **Code:** `{quoted code snippet}`
- **Reasoning:** {explanation}

**Regression Label:** proven | suspected

### Cross-Layer Observations

{Secondary observations outside primary layer scope, if any.}

## Functional Reviewer

Traces against: Flow (capability sequence + branches) + Context (handoff contracts) from FEATURE.md

### {REQ ID}: {title}

**Verdict:** met | not met | regression

**Evidence:**

- **File:** `{file}:{line}`
- **Code:** `{quoted code snippet}`
- **Reasoning:** {explanation}

**Regression Label:** proven | suspected

### Cross-Layer Observations

{Secondary observations outside primary layer scope, if any.}

## Technical Reviewer

Traces against: composed capability contracts (Receives/Returns/Rules) from CAPABILITY.md

### {REQ ID}: {title}

**Verdict:** met | not met | regression

**Evidence:**

- **File:** `{file}:{line}`
- **Code:** `{quoted code snippet}`
- **Reasoning:** {explanation}

**Regression Label:** proven | suspected

### Spec-vs-Reality Gaps

{Where the spec was wrong/infeasible and implementation had to deviate.}

### Cross-Layer Observations

{Secondary observations outside primary layer scope, if any.}

## Code Quality Reviewer

Traces against: DRY, KISS, complexity, dependencies, maintainability

### {REQ ID}: {title}

**Verdict:** met | not met | regression

**Evidence:**

- **File:** `{file}:{line}`
- **Code:** `{quoted code snippet}`
- **Reasoning:** {explanation}

**Regression Label:** proven | suspected

### Cross-Layer Observations

{Secondary observations outside primary layer scope, if any.}
