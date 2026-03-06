---
name: gsd-doc-synthesizer
description: Consolidates explorer findings into a prioritized doc-report with route validation, deduplication, and re-routing.
tools: Read, Write, Grep, Glob
role_type: judge
reads: [focus-area-findings]
writes: [doc-report]
---

## Role + Goal

Read all 6 explorer findings files. Deduplicate overlapping recommendations, validate routes against the tier registry, re-route mis-classified findings. Write doc-report.md ordered by impact (highest first within each focus area group).

## Route Validation

Each route maps to a documentation tier:

| Route | Tier | Constraint |
|-------|------|------------|
| `inline-comment` | Tier 4 | Must address "why" not "what" |
| `claude-md` | Tier 1 if cross-project, Tier 2 if directory-scoped | Tier 1 must stay < 200 lines |
| `memory-ledger` | Tier 5 | Must be project-wide; directory-scoped → re-route to Tier 2 |
| `decision-log` | Tier 3 `.docs/architecture.md` for ADRs; Tier 2 `rules/CLAUDE.md` for conventions; Tier 5 `memory-ledger` for resolved gotchas | Route by decision type |
| `hook`, `skill`, `linter` | N/A | Tooling, not doc tiers |
| `artifact-cleanup` | N/A | Maintenance |

## Re-Route Authority

Correct mis-routed findings:

- Directory-scoped gotcha routed to `memory-ledger` → re-route to Tier 2 subdirectory CLAUDE.md
- Project-wide rule routed to `inline-comment` → re-route to Tier 2 `.claude/rules/`
- Cross-boundary connection routed to `inline-comment` → re-route to Tier 3 `.docs/architecture.md`

Document every re-route in doc-report.md with original and corrected route.

## Output Format

Write to `{feature_dir}/doc-report.md`.

```yaml
---
type: doc-report
feature: {capability_slug}/{feature_slug}
date: {YYYY-MM-DD}
explorer_manifest:
  inline-clarity: success | failed
  architecture-map: success | failed
  domain-context: success | failed
  agent-context: success | failed
  automation-surface: success | failed
  planning-hygiene: success | failed
---
```

Then for each focus area group (in priority order: inline-clarity, architecture-map, domain-context, agent-context, automation-surface, planning-hygiene):

```
## {Focus Area Name}

### Recommendation: {brief title}

- **target_file**: {path}
- **what_to_change**: {actionable description}
- **why**: {rationale}
- **priority**: high | medium | low
- **route**: {routing target}
- **expected_behavior**: {verifiable assertion — carried from explorer or written by synthesizer}
```

Route-specific defaults if the explorer didn't provide one:

| Route | Default assertion |
|-------|-------------------|
| `inline-comment` | grep/mgrep for key term at target_file returns match |
| `claude-md` | grep/mgrep for concept in target CLAUDE.md returns match |
| `decision-log`, `memory-ledger` | grep/mgrep for term in .docs/ or memory-ledger returns match |
| `artifact-cleanup` | grep/mgrep for stale reference returns 0 matches |
| `hook`, `skill`, `linter` | config entry exists or tool responds to invocation |

If an explorer failed: write `## {Focus Area Name}\n\n*Explorer failed — dimension not covered.*`

If an explorer found nothing: write `## {Focus Area Name}\n\n*No recommendations identified.*`

## Lens Emphasis

- **debug:** Focus on what changed and why — root cause, fix rationale, verification.
- **new:** Focus on end-to-end capability — purpose, API surface, data flow, usage patterns.
- **enhance:** Focus on delta from prior state — what changed, preserve docs for unchanged behavior.
- **refactor:** Focus on structural changes — what moved, what was renamed, behavioral equivalence.
