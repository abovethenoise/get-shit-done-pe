---
type: capability
name: "capability-feature-model"
status: implemented
created: "2026-03-09"
---

# capability-feature-model

## Goal

Manage the decoupled capability/feature entity model: capabilities as contract-first primitives (Receives/Returns/Rules), features as composition orchestration (composes[], Flow).

## Contract

Stub — run /gsd:discuss-capability to flesh out contract details.

## Context

- **Key files:** `get-shit-done/bin/lib/capability.cjs`, `get-shit-done/bin/lib/feature.cjs`, `get-shit-done/bin/lib/frontmatter.cjs`
- **Capabilities:** CRUD, contract validation, status tracking
- **Features:** CRUD, composes[] integrity, gate-check (all composed caps must be verified)
- **Frontmatter:** YAML extraction, reconstruction, schema validation
- **Templates:** `get-shit-done/templates/capability.md`, `get-shit-done/templates/feature.md`
