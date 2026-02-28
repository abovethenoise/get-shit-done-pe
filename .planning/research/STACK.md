# Stack Research

**Domain:** AI agent orchestration framework (meta-prompting, file-based, Node.js CLI)
**Researched:** 2026-02-28
**Confidence:** HIGH (core decisions), MEDIUM (YAML library comparison), LOW (requirement ID conventions)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >=20.x (LTS) | Runtime | Existing constraint. Node 20+ required for c8 coverage; also unlocks `node:test` improvements and `--experimental-vm-modules` for future ESM testing. |
| CommonJS (.cjs) | N/A | Module format | Existing constraint. All lib files use `.cjs`. Zero-dep policy means no bundler. ESM migration would break callers — YAGNI. |
| Markdown + YAML frontmatter | N/A | Artifact format | Proven in v1. Claude Code's own `agents/*.md` uses this exact format. Human-readable, version-control-friendly, no serialization overhead. |
| `js-yaml` | 4.1.1 | YAML parse/serialize in gsd-tools | See rationale below. Only new dependency warranted — replaces the hand-rolled frontmatter parser with a battle-tested YAML engine that handles deep nesting, multiline strings, and edge cases v2's 3-layer requirements will hit. |

**js-yaml rationale (HIGH confidence):**

The v1 hand-rolled `extractFrontmatter` / `reconstructFrontmatter` in `frontmatter.cjs` is ~230 lines of regex + stack-walking that handles only 3 levels of nesting and has known edge cases (inline arrays, special chars in values). V2's 3-layer requirement blocks will produce deeper nesting:

```yaml
requirements:
  end_user:
    - id: "EU-001"
      story: "As a user..."
      acceptance:
        - "Given X when Y then Z"
  functional:
    - id: "FN-001"
      links: ["EU-001"]
      behavior: "..."
  technical:
    - id: "TC-001"
      links: ["FN-001"]
      spec: "..."
```

`js-yaml` 4.1.1 handles this natively. It ships explicit `"require": "./index.js"` in its exports map (verified via `npm info js-yaml --json`), so `require('js-yaml')` works in CJS without modification. Zero dependencies of its own. Last published 2025-11-14. Size: ~55KB unpacked.

**Why NOT `yaml` (eemeli) 2.8.2:** The exports map has no `require` key — only `"node": "./dist/index.js"` which is an ESM bundle. `require('yaml')` fails in CJS (verified). Would require dynamic `import()` workaround, adding async complexity to a synchronous CLI. Excluded.

**Why NOT `gray-matter` 4.0.3:** Depends on `js-yaml@^3.13.1` (pinned to old major), `kind-of`, `section-matter`, `strip-bom-string` — 4 transitive deps. Pulling in gray-matter to wrap js-yaml when js-yaml does the job directly violates KISS. Excluded.

**Why NOT hand-rolled parser continued:** The 3-layer requirement structure with nested arrays of objects will require multiline scalars and deeper nesting than the current parser reliably handles. Rewriting the parser to cover all YAML edge cases would produce more code than js-yaml itself. Excluded.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` (built-in) | Node 20+ | Test runner | All new tests. No Jest/Vitest — existing constraint, proven in v1. |
| `c8` | ^11.0.0 | Coverage gating | Already present. Keep at `--lines 70`. |
| `esbuild` | ^0.24.0 | Hook bundling at publish | Already present. No change needed. |

No additional libraries needed. Every v2 capability (framing dispatch, requirement IDs, traceability, parallel reviewer orchestration) is implemented as markdown documents + YAML data + gsd-tools CLI logic — same as v1's approach.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `node scripts/run-tests.cjs` | Custom test runner | Already exists; add new test files for v2 modules |
| `rg` (ripgrep) | Agent codebase search | Runtime tool for Claude agents; not a JS dep |
| Git | Commit, branch, status | Runtime dep; used via `child_process.execSync` in `git.cjs` |

---

## Installation

```bash
# Add the one new runtime dependency
npm install js-yaml

# Existing devDeps — no changes
# c8 and esbuild already present
```

`js-yaml` moves from devDependency to dependency since gsd-tools.cjs uses it at runtime.

---

## File Organization Patterns

### Directory Structure for v2 Hierarchy

```
.planning/
  PROJECT.md                  # Project goals, constraints, context
  STATE.md                    # Cross-session persistent state
  config.json                 # Model profiles, parallelization flags
  capabilities/
    CAP-01-name/
      CAPABILITY.md           # Goals, context, framing type
      features/
        FEAT-01-01-name/
          REQUIREMENTS.md     # 3-layer requirements (EU/FN/TC)
          PLAN.md             # Tasks with req_id links
          SUMMARY.md          # Outcome record
          REVIEW.md           # 4-reviewer synthesis
          DOCUMENTATION.md    # Reflect-and-write output
```

**Rationale:** Flat phase directories (v1 `phases/NN-name/`) don't express containment. The capability > feature nesting makes the hierarchy self-documenting in the filesystem. Existing path normalization logic in `phase.cjs` carries forward as `capability.cjs` with adjusted prefix conventions.

### Requirement ID Conventions

```
CAP-01        Capability ID (project-scoped)
FEAT-01-01    Feature ID (capability-scoped)
EU-001        End-user requirement
FN-001        Functional requirement (links EU-*)
TC-001        Technical requirement (links FN-*)
TASK-001      Plan task (links TC-* and/or FN-*)
```

**Why this scheme (MEDIUM confidence):** No industry standard exists for file-based AI planning systems — this domain is too new. The prefix pattern mirrors Doorstop and standard RTM conventions (verified: standard practice uses stable unique IDs that never change even if items reorder). Short prefixes over verbose labels (`EU-` not `end_user_req_`) because these IDs appear inline in YAML frontmatter repeatedly.

### YAML Frontmatter Schema Evolution

V1 PLAN.md frontmatter:
```yaml
phase: "01"
plan: "01-01"
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: []
must_haves:
  truths: []
  artifacts: []
```

V2 PLAN.md frontmatter (additive):
```yaml
capability: "CAP-01"
feature: "FEAT-01-01"
framing: "new"          # debug | new | enhance | refactor
wave: 1
depends_on: []
files_modified: []
autonomous: true
req_links:              # replaces flat 'requirements'
  - "TC-001"
  - "TC-002"
must_haves:
  truths: []
  artifacts: []
```

**Migration note:** Old `phase`/`plan` keys removed; `capability`/`feature` replace them. `requirements` renamed `req_links` to signal the traceability intent. `framing` is a new key that agents use to load context-specific question sets.

### Agent Prompt Templating

**Approach: XML section injection with named blocks (carry forward from v1).**

V1 agents use XML sections (`<role>`, `<execution_context>`, `<context>`) in markdown. V2 adds framing-specific sections:

```markdown
<framing_context>
<!-- Injected by orchestrator based on framing type -->
<!-- For "debug": observe → hypothesize → root cause questions -->
<!-- For "new": explore → brainstorm discovery questions -->
<!-- For "refactor": reason for change → explore options questions -->
</framing_context>
```

Orchestrator selects the appropriate `<framing_context>` block from a reference file (e.g., `references/framing-contexts.md`) and injects it into the agent's Task call. No template engine needed — string interpolation in `node gsd-tools.cjs render-framing-context <framing>` returns the block as text.

**Why NOT a template engine (Mustache, Handlebars, etc.):** Templates are for variable substitution in output-facing documents. Agent prompts need conditional block selection, not variable interpolation — `if framing == "debug" then include block A`. A simple `renderFramingContext(framing)` function in gsd-tools covers the entire use case with zero new deps.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `js-yaml` (direct) | `gray-matter` | Only if you need multi-format frontmatter (TOML, JSON) in the same tool — GSD doesn't |
| Hand-rolled frontmatter (extend) | N/A | Only for flat 2-level schemas; v2's nesting depth breaks this |
| XML section injection | Mustache/Handlebars templating | If agent prompts needed runtime variable fill-in; GSD uses file references via `@` instead |
| `node:test` built-in | Jest / Vitest | Never — introduces devDep, bundler interactions, and config complexity for what is simple unit tests |
| `.cjs` CommonJS | ESM migration | Only if dropping Node 16 support AND willing to convert all callers; YAGNI for a framework refactor |
| Flat requirement list in frontmatter | Separate REQUIREMENTS.md file | When the requirements data is too large for frontmatter (>50 lines); use the `@file:` pattern from gsd-tools |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `yaml` (eemeli) 2.x | No CJS `require()` path in exports map; `require('yaml')` fails — verified | `js-yaml` 4.1.1 |
| LangChain / LangGraph / agent SDKs | These are Python/TS runtime frameworks for building AI apps; GSD is a *prompting framework* that runs inside Claude Code's context — no runtime AI SDK calls needed | Markdown + YAML + gsd-tools CLI |
| Database (SQLite, etc.) for traceability | All artifacts are markdown files in `.planning/` — a DB adds setup complexity with zero benefit since the dataset is <1000 rows per project | YAML frontmatter + `gsd-tools.cjs` queries |
| TypeScript | v1 is pure CJS JS; adding TS means a build step, `tsconfig.json`, and type-checking latency; the codebase is small enough that JSDoc types suffice | JSDoc annotations if types needed |
| `esbuild` for bundling lib files | v1 uses esbuild only for hooks; lib files are shipped as source; bundling them adds a build gate before tests pass | Ship `.cjs` source files directly |
| External state store (Redis, file DB) | `STATE.md` and YAML frontmatter are the state layer; cross-session memory is a file-read problem, not a database problem | `gsd-tools.cjs state load/update` |

---

## Stack Patterns by Variant

**If a requirement block grows too large for PLAN.md frontmatter (>50 lines):**
- Write requirements to `FEAT-XX-XX-REQUIREMENTS.md` as a standalone file
- Reference via `req_file: "FEAT-01-01-REQUIREMENTS.md"` in PLAN.md frontmatter
- `gsd-tools.cjs` reads the `@file:` pattern already — same mechanism

**If the 4-parallel reviewer pattern needs inter-reviewer communication:**
- Do NOT give reviewers write access to shared state during review
- Each reviewer writes to its own `REVIEW-{type}.md` (eu, fn, tc, quality)
- Synthesizer agent reads all 4 files and writes `REVIEW.md` with consolidated findings
- Sequential synthesis after parallel review — the established "scatter-gather" pattern

**If framing type can't be determined at command invocation time:**
- Default to "new" framing
- Planner agent asks the 4 framing-discovery questions in its first turn to confirm
- Framing is stored in CAPABILITY.md once confirmed, referenced by all subsequent agents

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `js-yaml@4.1.1` | Node.js >= 6.x | No Node-version constraint; pure JS |
| `js-yaml@4.x` | `js-yaml@3.x` API | Breaking: `safeLoad` → `load`, `safeDump` → `dump`. Do not alias the old names. |
| `c8@^11.0.0` | Node >=20 or >=22 | Already in devDeps; requires Node 20+ |
| `node:test` built-in | Node >=18 (stable in 20) | Use Node 20+ to access stable test runner API |

---

## Sources

- `npm info js-yaml --json` — exports map verified, `"require": "./index.js"` present, version 4.1.1, published 2025-11-14 (HIGH confidence)
- `npm info yaml --json` — exports map verified, no `require` key, CJS `require('yaml')` fails (HIGH confidence, tested)
- `npm info gray-matter --json` — 4 transitive dependencies including pinned `js-yaml@^3` (HIGH confidence)
- Claude Code official docs: https://code.claude.com/docs/en/sub-agents — agent frontmatter schema, `name`, `description`, `tools`, `model`, `skills`, `memory` fields (HIGH confidence, fetched 2026-02-28)
- Microsoft Azure AI Agent Orchestration Patterns: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns — sequential, parallel (scatter-gather), handoff patterns (MEDIUM confidence, official docs updated 2026-02-12)
- WebSearch: gray-matter, js-yaml, yaml npm ecosystem — corroborates above findings (MEDIUM confidence)
- WebSearch: requirement traceability matrix ID conventions — confirms stable unique ID prefix pattern (MEDIUM confidence, no authoritative single source)
- Existing codebase analysis: `frontmatter.cjs` (299 lines), `package.json` v1.22.0, `ARCHITECTURE.md`, `STACK.md` — primary context for all "carry forward" decisions (HIGH confidence)

---

*Stack research for: GSD v2 — AI agent orchestration framework refactor*
*Researched: 2026-02-28*
