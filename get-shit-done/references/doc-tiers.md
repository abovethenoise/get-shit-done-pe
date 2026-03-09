# Documentation Tier Registry

Single source of truth for the 5-tier documentation structure. Referenced by init, discuss, and doc workflows.

**The golden rule: if Claude can infer it from the code, omit it.** Documentation exists only for what is non-obvious, behavioral, or cross-boundary. Every line must earn its place.

## Tier 1 -- Project Router

| Attribute | Value |
|-----------|-------|
| **Path** | `CLAUDE.md` (project root) |
| **Loading** | Always loaded -- every session |
| **Size limit** | < 200 lines |
| **Contains** | Project identity, tech stack summary, pointers to `.docs/` and `.claude/`, conventions that apply everywhere |
| **Does NOT contain** | Detailed architecture, domain definitions, directory-scoped rules, implementation notes |

## Tier 2 -- Scoped Rules

| Attribute | Value |
|-----------|-------|
| **Path** | `{subdir}/CLAUDE.md` (directory-scoped) and `.claude/rules/*.md` (glob-matched) |
| **Loading** | Auto-loaded when agent enters directory (CLAUDE.md) or by glob match (rules/) |
| **Contains** | Framework conventions, naming rules, testing patterns, behavioral rules for AI -- scoped to that directory or domain |
| **Does NOT contain** | Cross-project content (that's Tier 1), architecture narratives (that's Tier 3) |

## Tier 3 -- Cross-Boundary Knowledge

| Attribute | Value |
|-----------|-------|
| **Path** | `.docs/architecture.md`, `.docs/domain-vocabulary.md`, `.docs/brand.md` |
| **Loading** | On demand -- read when working on cross-boundary tasks, during init, discuss, or doc workflows |
| **Contains** | System architecture and component connections; business domain vocabulary and where concepts manifest in code; architectural decisions (ADRs); voice/tone/design direction |
| **Does NOT contain** | Rules the agent must follow (that's Tier 2), session-specific state, implementation details of single files |

## Tier 4 -- Inline Comments

| Attribute | Value |
|-----------|-------|
| **Path** | Source files -- comments at point of confusion |
| **Loading** | When the file is read |
| **Contains** | "Why" not "what" -- non-obvious rationale, tradeoff explanations, gotcha warnings at the exact line |
| **Does NOT contain** | Restating what code does, API docs (use doc comments), cross-file concerns (that's Tier 3) |

## Tier 5 -- Memory Ledger

| Attribute | Value |
|-----------|-------|
| **Path** | `.claude/memory-ledger.md` |
| **Loading** | On demand -- checked when encountering known-tricky areas |
| **Contains** | Project-wide solved gotchas, framework limitations, workarounds with context |
| **Does NOT contain** | Directory-scoped rules (re-route to Tier 2), architectural decisions (re-route to Tier 3), session-specific notes |

## Routing Rules

Content routes to the **lowest-numbered tier** where it fits:

1. If it applies to every session and is < 3 lines -> Tier 1
2. If it's a rule scoped to a directory or domain -> Tier 2
3. If it's cross-boundary knowledge or architecture -> Tier 3
4. If it explains "why" at a specific code location -> Tier 4
5. If it's a solved gotcha or workaround -> Tier 5

## Decision Routing

| Decision type | Route |
|---------------|-------|
| Architectural decisions (ADRs) | `.docs/architecture.md` (Tier 3) |
| Behavioral rules / conventions | `.claude/rules/` or `{subdir}/CLAUDE.md` (Tier 2) |
| Solved gotchas from past decisions | `.claude/memory-ledger.md` (Tier 5) |
| Code-level "why this approach" | Inline comments (Tier 4) |
