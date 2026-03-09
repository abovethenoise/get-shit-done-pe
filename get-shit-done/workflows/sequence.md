<purpose>
Build the project dependency graph from composes[] edges and write SEQUENCE.md with execution order, blockers, branches, coordinate points, critical path, and orphans.
</purpose>

<process>

<step name="build_graph">
Build the dependency graph:

```bash
GRAPH=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-build)
```

Parse JSON for `nodes` and `edges`. Log: "{N} nodes, {M} edges"
</step>

<step name="query_sequence">
Get full structural picture:

```bash
SEQUENCE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query sequence)
```

Parse JSON for: `executable`, `blocked`, `branches`, `coordinate_points`, `critical_path`, `orphans`.
</step>

<step name="query_coupling">
Get feature coupling analysis:

```bash
COUPLING=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query coupling)
```

Parse JSON for shared capability analysis.
</step>

<step name="write_sequence_md">
Write `.planning/SEQUENCE.md` with the following structure:

```markdown
---
generated: {ISO date}
total_capabilities: {N}
total_features: {N}
executable_count: {N}
blocked_count: {N}
orphan_count: {N}
---

# Sequence

## What Can Execute Now

| Feature | Composed Capabilities | Status | UI |
|---------|----------------------|--------|----|
| {slug} | {cap1, cap2} | {status} | {✓ if has_ui, blank otherwise} |

## Blocked

| Feature | Blocker | Blocker Status | UI |
|---------|---------|----------------|----|
| {slug} | cap:{cap} | {status} | {✓ if has_ui, blank otherwise} |

## Parallel Branches

{N} independent branch(es) detected:
- Branch 1: {feat1, feat2} (share cap:{x})
- Branch 2: {feat3} (disjoint)

## Coordinate Points

| Shared Capability | Features |
|-------------------|----------|
| {cap} | {feat1, feat2} |

## Critical Path

| Blocking Capability | Status | Unblocks |
|--------------------|--------|----------|
| {cap} | {status} | {N} features: {list} |

## Orphans

**Capabilities not composed by any feature:** {list or "None"}
**Features with empty composes[]:** {list or "None"}
```

Write using the Write tool to `.planning/SEQUENCE.md`.
</step>

<step name="commit">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: generate SEQUENCE.md from dependency graph" --files .planning/SEQUENCE.md
```
</step>

<step name="summary">
Display:

```
-------------------------------------------------------
 GSD > SEQUENCE GENERATED
-------------------------------------------------------

Executable: {N} features ready
Blocked: {N} features waiting
Critical path: {top blocker} -> unblocks {N} features
Branches: {N} independent
Orphans: {N} caps, {N} features

Full map: .planning/SEQUENCE.md
```
</step>

</process>

<success_criteria>
- Graph built from composes[] edges
- SEQUENCE.md written with all 6 sections
- Frontmatter includes counts for quick parsing
- Commit created
</success_criteria>
