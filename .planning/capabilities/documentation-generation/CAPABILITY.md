---
type: capability
name: documentation-generation
status: complete
created: "2026-03-03"
---

# Documentation Generation

## Goal

After review, gsd-doc-writer reads actual built code and writes .documentation/ entries optimized for mgrep searchability.

## Why

Without this, knowledge lives only in SUMMARY.md files. The .documentation/ tree is the living reference — future agents and developers read it to understand what's been built.

## Invariants

1. Doc writer reads actual code — it never invents documentation from plan artifacts alone.
2. .documentation/ mirrors the capability/feature hierarchy.

## Boundaries

### Owns
- doc.md workflow, gsd-doc-writer agent, .documentation/ directory structure, init-project.md documentation seeding

### Does Not Touch
- The review stage (pipeline-execution owns the review→doc transition)

## Architecture Spine

```
review verdict accepted
  → doc.md invokes gsd-doc-writer
  → reads: FEATURE.md + PLAN.md + SUMMARY.md + code
  → writes: .documentation/capabilities/{cap}/{feat}/*.md
  → updates: .documentation/architecture.md, domain.md, mapping.md
```

## Features

| Feature | Priority | Depends-On | Status |
|---------|----------|------------|--------|
| init-documentation-mapping | P1 | none | planning |
| project-brand-style-section | P1 | none | planning |

## Decisions

| Date | Decision | Context | Tradeoffs |
|------|----------|---------|-----------|
| 2026-03-02 | gsd-doc-writer rewritten for v2 model | v1 writer referenced phase artifacts | Smaller, more focused agent |
