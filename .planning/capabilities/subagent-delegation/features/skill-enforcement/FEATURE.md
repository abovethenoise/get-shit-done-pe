---
type: feature
capability: "subagent-delegation"
status: killed
created: "2026-03-07"
---

# skill-enforcement

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | draft |
| FN-01 | - | - | - | - | - | draft |
| TC-01 | - | - | - | - | - | draft |

## End-User Requirements

### EU-01: {title}

**Story:** As a {who}, I want {what}, so that {why}.

**Acceptance Criteria:**

- [ ] {Observable outcome 1}
- [ ] {Observable outcome 2}

**Out of Scope:**

- {What this requirement explicitly does NOT cover.}

## Functional Requirements

### FN-01: {title}

**Receives:** {Inputs, triggers, data the feature consumes.}

**Returns:** {Outputs, side effects, data the feature produces.}

**Behavior:**

- {Rule or logic}
- {Edge case handling}
- {Error condition and response}

## Technical Specs

### TC-01: {title}

**Intent:** {Why this approach, not just what.}

**Upstream:** {What feeds into this.}

**Downstream:** {What consumes this output.}

**Constraints:**

- {Hard limits: language, libs, patterns, performance.}

**Example:**

```
{Concrete illustration of the spec in action.}
```

## Decisions

- 2026-03-07: KILLED — folded into workflow-enforcement. Command/skill files are thin routing layers with no delegation logic. The audit work (verify Task in allowed-tools, verify no contradictions with delegation.md, verify execution_context loads) is added as a requirement in workflow-enforcement instead.
