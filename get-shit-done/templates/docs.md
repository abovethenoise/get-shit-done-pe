---
type: docs-template
version: 2
structure: modules-flows-gate
---

# Documentation Template (v2)

Template for `.documentation/` directory structure. Replaces v1 design/features/lessons per-capability layout with v2 modules/flows/gate structure per CONTEXT.md decisions.

## Directory Structure

```
.documentation/
  modules/              <- flat, 1:1 with code files, AI agent primary lookup
    reader.md
    parser.md
    transform.md
  flows/                <- capability-grouped, cross-module narratives
    hand-import/
      import-flow.md
    planning/
      validate-flow.md
  gate/                 <- scaffolded by agent, human-maintained content
    constraints.md      <- banned patterns, invariants, boundaries
    glossary.md         <- domain terms, project-specific concepts
    state.md            <- what persists, where, what shape
```

## Module Doc Template

Each module doc is a flat file in `.documentation/modules/`, named 1:1 with the source code file.

### Frontmatter

```yaml
---
type: module
module: <exact_code_filename>
built-from-code-at: <git-sha>
last-verified: <YYYY-MM-DD>
---
```

### Heading Template (strict, for grep consistency)

```markdown
## Module: <exact_code_name> [derived]

## Purpose: [derived]
<What this module does, one paragraph>

## Exports: [derived]
- `functionName(params)` - description
- `anotherExport` - description

## Depends-on: [derived]
- `module-name` - what it provides to this module

## Constraints: [authored]
<Invariants, boundaries, things that must not change>

## WHY: [authored]
<Non-obvious rationale — only if needed, only from cited review findings>
```

### Rules

- Every section tagged `[derived]` or `[authored]`
- `[derived]` sections: regenerated from code, agent may overwrite freely
- `[authored]` sections: written with judgment, agent preserves and flags conflicts
- Untagged sections default to `[authored]` (safe default — never overwrite uncertain content)
- Module names must be case-sensitive exact matches to code filenames
- One-way cross-referencing: modules do NOT link back to flows

## Flow Doc Template

Each flow doc lives in `.documentation/flows/<capability>/`, grouped by capability.

### Frontmatter

```yaml
---
type: flow
flow: <capability>/<flow_name>
built-from-code-at: <git-sha>
last-verified: <YYYY-MM-DD>
---
```

### Heading Template (strict, for grep consistency)

```markdown
## Flow: <capability>/<flow_name> [derived]

<ASCII diagram of the flow>

## Trigger: [derived]
<What initiates this flow>

## Input: [derived]
<What data/state is required>

## Steps: [derived]
1. <module_name> -> <what it does in this flow>
2. <module_name> -> <what it does in this flow>

## Output: [derived]
<What this flow produces>

## Side-effects: [derived]
<State changes, logs, external calls>

## WHY: [authored]
<Non-obvious rationale — only if needed, inline per step when appropriate>
```

### Rules

- Flow steps reference modules by name, not individual functions
- ASCII diagram first (visual overview), then structured steps
- One-way: flows reference modules in Steps. Modules don't link back.
- Each step identifies the owning module

## Gate Doc Templates

Gate docs are scaffolded by the agent but human-maintained. All entries tagged `[manual]`.

### constraints.md

```markdown
## Constraint: <scope> [manual]
<What is banned or required, and why>
```

### glossary.md

```markdown
## Glossary: <term> [manual]
<Definition in project context>
```

### state.md

```markdown
## State: <store_name> [manual]
Type: database | cache | config | file
Location: <path or connection>
Schema: <shape of data>
Lifecycle: <when created, when updated, when purged>
Owned-by: <which module writes to this>
Read-by: <which modules consume this>
```

### Rules

- Gate docs are validation inputs, not agent outputs
- Agent reads gate docs during Pass 3 validation
- Agent enforces constraints/glossary consistency but never modifies gate doc content
- All gate doc entries tagged `[manual]` to signal human ownership

## Ownership Tags

Every section in module and flow docs must have an ownership tag:

| Tag | Meaning | Agent behavior |
|-----|---------|---------------|
| `[derived]` | Regenerated from code + reviews | Overwrite freely on each run |
| `[authored]` | Written with human judgment | Preserve, flag conflicts if code changed |
| `[manual]` | Human-maintained gate doc entry | Never modify |
| *(untagged)* | Defaults to `[authored]` | Safe default — never overwrite |

## Processing Order

1. **Modules first** — dependencies-first ordering improves truthfulness ~8%
2. **Flows second** — module docs become verified context for flow generation

## Self-Validation (3-pass)

**Pass 1 -- Structural compliance:** Required headings present, ownership tags on every section, anchors match canonical format, last-verified timestamp updated.

**Pass 2 -- Referential integrity:** Module names match real code artifacts, listed exports actually exist, dependency references resolve, flow step module references match `.documentation/modules/` filenames.

**Pass 3 -- Consistency with gate docs:** Domain terms match glossary spellings, no banned patterns from constraints.md in examples, state references match state.md entries.
