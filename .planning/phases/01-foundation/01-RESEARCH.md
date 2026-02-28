---
phase: 1
type: research
status: complete
researched: 2026-02-28
method: parallel-6-agent-synthesis
agents: domain-truth, existing-system, user-intent, tech-constraints, edge-cases, prior-art
---

# Phase 1: Foundation — Research

## Executive Summary

Phase 1 delivers the structural backbone for GSD v2: directory hierarchy, templates, CLI commands, js-yaml migration, 3-layer requirement format, and REQ ID scheme. Research was conducted across 6 parallel dimensions (domain truth, existing system, user intent, tech constraints, edge cases, prior art) and synthesized into consensus findings, conflict resolutions, gap closures, and constraint discovery.

## Key Findings

### 1. js-yaml Migration is the Critical Path

The hand-rolled frontmatter parser in `lib/frontmatter.cjs` cannot handle 4-5 level YAML nesting required by the 3-layer requirement format. It has known bugs with quoted commas in inline arrays, zero support for block scalars, and breaks on round-trip with colon-containing values. js-yaml@4.1.1 handles all of these correctly.

**Migration constraints:**
- gsd-tools.cjs currently has zero runtime dependencies — js-yaml is the first
- `bin/package.json` must be created (does not exist today)
- Public API (`extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter`) must be preserved — 5+ modules import these by name
- `parseMustHavesBlock` can remain as-is (js-yaml handles 3-level nesting natively, but removing it is Phase 7 cleanup)
- Canonical serialization config: `{ lineWidth: -1, quotingType: "'", forceQuotes: false }`
- `extractFrontmatter` must return `{}` (not null) when no frontmatter exists — matches existing caller expectations
- Wrap `yaml.load()` in try/catch with file path context in error messages

**js-yaml@4.1.1 specifics:**
- YAML 1.2: `yes`/`no` are strings (not booleans) — different from 3.x
- `safeLoad`/`safeDump` removed — use `load`/`dump` directly
- Auto-quotes strings containing `:`, `#`, `[`, special chars
- Round-trip fidelity confirmed perfect for 3-layer requirement nesting
- Tabs in indentation throw parse error (correct behavior)

### 2. Existing System Architecture

**Command dispatch:** Flat `switch (command)` in `gsd-tools.cjs` main(). New commands use nested `case 'capability': { const sub = args[1]; ... }` pattern.

**Hard runtime constraints:**
- CommonJS only (`.cjs`, `require`/`module.exports`)
- No interactive stdin — all input via CLI args
- stdout is JSON-only (callers parse it) — use `output()` helper
- `--cwd` flag must be honored by all new commands
- Errors → stderr + `process.exit(1)`
- Payloads >50KB → temp file with `@file:` prefix

**Template engine:** `template.cjs` hardcodes content inline as arrays of strings — template files in `templates/` are human-readable references consumed by Claude, not by the code. New fill cases must follow this pattern.

**State engine:** STATE.md uses `**Bold:**` regex patterns in body, YAML frontmatter is derived (computed from body on every write via `syncStateFrontmatter()`). New fields must be added to both body extraction regexes and frontmatter computation.

### 3. Directory Structure Design

**v2 structure (confirmed by user decisions):**
```
.planning/
├── STATE.md, PROJECT.md, REQUIREMENTS.md
└── capabilities/
    └── {slug}/
        ├── CAPABILITY.md, RESEARCH.md, PLAN.md
        └── features/
            └── {slug}/
                ├── FEATURE.md, RESEARCH.md, PLAN.md
                ├── REVIEW.md, DECISIONS.md
```

**Invariants:**
- Path slugs immutable after creation (rename = migration)
- Canonical filenames per artifact type (Terraform model: always `CAPABILITY.md`, never `auth-capability.md`)
- Slug generation: lowercase, `[^a-z0-9]+ → -`, strip leading/trailing hyphens
- Existing `generateSlugInternal()` in core.cjs is correct and reusable

### 4. Resolved Conflicts

| Conflict | Resolution | Rationale |
|----------|-----------|-----------|
| REVIEW.md: 3 vs 4 reviewers | Build 4-reviewer template per REQUIREMENTS.md | CONTEXT.md's 3-reviewer mention is deferred Phase 4 restructure |
| DOCS.md naming vs 3-file structure | FOUND-06 "DOCS.md" = template for generating 3 doc files | One template, three outputs (design.md, features.md, lessons.md) |
| Multiline in YAML frontmatter | Frontmatter values single-line only; multi-line in body | Keeps frontmatter scannable, avoids agent confusion |
| Feature ordering format | `build_sequence: [slug-a, slug-b]` array in PLAN.md frontmatter | Machine-readable; CLI reads for ordered list output |

### 5. Closed Gaps

| Gap | Resolution |
|-----|-----------|
| Cross-capability REQ ID format | `capability/EU-01` (slash separator matches directory path convention) |
| Single vs multi active capability | Single active with explicit switch; STATE.md tracks one `current_capability` |
| Trace table columns | `REQ ID, Layer, Status, Plan, Review, Docs` — populated progressively |
| CLI trace command | `trace update <capability> <feature> <req-id> <stage> <status>` |
| Partial creation failure | Detect empty directories (dir exists, no CAPABILITY.md) → treat as incomplete, allow re-creation |
| js-yaml serialization config | `{ lineWidth: -1, quotingType: "'", forceQuotes: false }` canonical |

### 6. Edge Cases to Handle

**Must handle in Phase 1:**
- Empty slug after sanitization (unicode input → empty string → crash)
- Slash in name passed unslugged to `fs.mkdirSync` → path injection
- Missing parent capability when creating feature → clear error
- Partial creation failure → detect empty dirs, allow re-creation
- `yaml.load()` exceptions → try/catch with file path context
- No-frontmatter files → return `{}` not null
- Missing template files → `safeReadFile` + human-readable error
- STATE.md absent → require initialization, don't auto-create

**Defer:**
- Soft name length limit (50 chars)
- Reserved name denylist
- BOM stripping
- Partial-layer requirement validation (Phase 3)
- Paused-capability resume format (Phase 6)

### 7. Prior Art Patterns Adopted

| Pattern | Source | Application |
|---------|--------|------------|
| YAML frontmatter with typed required fields | Jekyll, GitHub Docs | Schema per artifact type, validated at read/write |
| `kind` field as artifact type discriminator | Kubernetes | `type: capability\|feature\|plan\|review\|docs` in all frontmatter |
| Hard-error on collision, `--force` to override | Cargo | `capability create` errors on existing slug |
| Slug derived at invocation, never user-supplied | Cookiecutter, GSD v1 | `generate-slug` already correct |
| Predictable filename roles | Terraform modules | `CAPABILITY.md`, `FEATURE.md` — no variations |
| Co-located trace evidence | DO-178C | Trace table inside FEATURE.md, not separate artifact |
| Layer-prefixed REQ IDs | ISO 26262 + agile RTM | `EU-xx`, `FN-xx`, `TC-xx` per feature |

### 8. v1 Compatibility Constraints

- v1 must stay fully operational throughout Phase 1 (bootstrap trap)
- Add new functions/commands — never rename or remove existing ones
- `phase.cjs`, `milestone.cjs`, `roadmap.cjs`, `verify.cjs`, `init.cjs`, `commands.cjs` remain untouched
- Existing test suite (461 passing) must not regress

## Implementation Wave Structure

```
Wave 1 (foundation, no dependencies):
├── js-yaml migration (frontmatter.cjs)
├── Core helpers (findCapabilityInternal, findFeatureInternal in core.cjs)
└── Template files (capability.md, feature.md, review.md, docs.md in templates/)

Wave 2 (CLI commands, depends on Wave 1):
├── capability.cjs module (create, list, status)
├── feature.cjs module (create, list, status)
├── gsd-tools.cjs dispatch (capability, feature cases)
└── template.cjs fill cases (capability, feature)

Wave 3 (state + schemas, depends on Wave 2):
├── STATE.md extensions (current_capability, current_feature fields)
├── Frontmatter schema additions (capability, feature, review, docs)
└── Trace table CLI command (trace update)
```

## Files Phase 1 Touches

| File | Operation | What Changes |
|------|-----------|-------------|
| `bin/package.json` | CREATE | Enable js-yaml dependency |
| `bin/lib/frontmatter.cjs` | MODIFY | Replace parser/serializer with js-yaml |
| `bin/lib/core.cjs` | MODIFY | Add findCapabilityInternal, findFeatureInternal |
| `bin/lib/capability.cjs` | CREATE | Capability CRUD commands |
| `bin/lib/feature.cjs` | CREATE | Feature CRUD commands |
| `bin/lib/template.cjs` | MODIFY | Add capability, feature fill cases |
| `bin/lib/state.cjs` | MODIFY | Add current_capability, current_feature |
| `bin/gsd-tools.cjs` | MODIFY | Add capability, feature, trace dispatch |
| `templates/capability.md` | CREATE | CAPABILITY.md human-readable reference |
| `templates/feature.md` | CREATE | FEATURE.md with 3-layer requirement schema |
| `templates/review.md` | CREATE | REVIEW.md template |
| `templates/docs.md` | CREATE | .documentation/ template |

**Files NOT touched:** phase.cjs, milestone.cjs, roadmap.cjs, verify.cjs, init.cjs, commands.cjs, all workflow .md files.

---

*Phase: 01-foundation*
*Research completed: 2026-02-28 via parallel 6-agent synthesis*
