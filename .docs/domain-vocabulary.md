# Domain Vocabulary

## Core Concepts

| Term | Definition | Code Location |
|------|-----------|---------------|
| **Capability** | Contract-first primitive. Defines Receives/Returns/Rules. Implements one thing. | `lib/capability.cjs`, `.planning/capabilities/{slug}/CAPABILITY.md` |
| **Feature** | Composition of capabilities via `composes[]`. Orchestrates primitives into user-facing functionality. No new logic — only wiring. | `lib/feature.cjs`, `.planning/capabilities/{cap}/features/{feat}/FEATURE.md` |
| **Contract** | A capability's formal interface: what it receives, returns, and the invariant rules. | CAPABILITY.md `## Contract` section |
| **composes[]** | YAML frontmatter array declaring which capabilities a feature uses. Creates DAG edges. | Feature frontmatter |
| **Wave** | A set of capabilities/features with no mutual dependencies. Can execute in parallel. | `lib/graph.cjs` wave query |
| **Focus Group** | A sprint-like bundle of capabilities/features with dependency ordering. | `workflows/focus.md`, ROADMAP.md |
| **Framing Lens** | One of 4 thinking modes: new (architect), enhance (editor), refactor (surgeon), debug (detective). | `get-shit-done/framings/` |
| **Gather-Synthesize** | Delegation pattern: spawn N parallel agents, synthesize into 1 output. | `workflows/gather-synthesize.md` |
| **Plan** | Executable task specification (XML tasks in markdown). One plan per feature or capability. | `{nn}-PLAN.md` |
| **Summary** | Completion record with frontmatter metadata for dependency resolution. | `{nn}-SUMMARY.md` |
| **Gate-check** | Verification that all composed capabilities are verified before feature planning. | `gsd-tools gate-check` |
| **Escalation** | 3-tier error handling: minor (log), moderate (pause+surface), major (halt+recommend). Max 1 backward reset per run. | `references/escalation-protocol.md` |

## Domain-to-Code Mapping

| Domain Concept | Implementation |
|---------------|----------------|
| Capability CRUD | `lib/capability.cjs` → `capability-create`, `capability-list`, `capability-status` |
| Feature composition | `lib/feature.cjs` → `feature-create`, `feature-list`, `feature-validate` |
| Dependency graph | `lib/graph.cjs` → `graph-build`, `graph-query {waves,downstream,upstream,coupling,stale}` |
| State persistence | `lib/state.cjs` → `state load`, `state update`, `state patch` |
| Frontmatter schema | `lib/frontmatter.cjs` → `frontmatter get` |
| Pipeline stages | `workflows/{plan,execute-plan,review,doc}.md` |
| Agent routing | `references/delegation.md` — model field in agent frontmatter |
