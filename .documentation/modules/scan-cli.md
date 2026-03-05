---
type: module-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Module: scan.cjs

## Purpose: [derived]

CLI commands for the landscape scan feature. Provides three commands for capability discovery, pair enumeration, and checkpoint management. Located at `get-shit-done/bin/lib/scan.cjs`.

## Exports: [derived]

### `cmdScanDiscover(cwd, raw)`

Scans `.planning/capabilities/` and `.documentation/capabilities/` to build a full inventory.

**Route:** `gsd-tools scan-discover [--raw]`

**Output JSON:**
```json
{
  "capabilities": [{
    "slug": "string",
    "artifacts": {
      "capability": { "path": "string", "content": "string" } | null,
      "features": [{ "slug": "string", "path": "string", "content": "string" }],
      "documentation": { "path": "string", "content": "string" } | null
    },
    "completeness": "full|partial|none"
  }],
  "gap_findings": [{ "id": "FINDING-XXX", "type": "GAP", ... }]
}
```

**Completeness classification:** `full` requires CAPABILITY.md + features + documentation; `partial` requires any one; `none` means empty directory.

### `cmdScanPairs(cwd, raw)`

Generates all unique capability pairs for pairwise analysis.

**Route:** `gsd-tools scan-pairs [--raw]`

**Output JSON:**
```json
{
  "tier": "small|medium|large",
  "capability_count": "number",
  "pairs": [{ "a": "string", "b": "string" }],
  "total_pairs": "number"
}
```

**Tier thresholds:** small (<=20 caps), medium (21-50), large (>50).

### `cmdScanCheckpoint(cwd, args, raw)`

Manages checkpoint state for resumable scanning.

**Route:** `gsd-tools scan-checkpoint --action {read|write|list} [--pair A__B] [--output-dir path]`

**Actions:**
- `write`: Creates `{output-dir}/pairs/{pair}.complete` marker file
- `read`: Returns `{ completed: true|false }` for a specific pair
- `list`: Returns `{ completed_pairs: ["A__B", ...] }` sorted alphabetically

**Pair format:** Double-underscore (`__`) separator between capability slugs. Path traversal (`..`) rejected.

## Depends-on: [derived]

- `bin/lib/core.cjs` — `output`, `error`, `safeReadFile` helpers
- `gsd-tools.cjs` — Route registration (scan-discover, scan-pairs, scan-checkpoint)
