---
type: flow-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Flow: requirements-refinement/landscape-scan

## Trigger: [derived]

User invokes the landscape-scan workflow directly (no slash command yet). The workflow reads `.planning/capabilities/` to discover all capabilities for analysis.

## Input: [derived]

- Implicit: `.planning/capabilities/` directory tree (capabilities with CAPABILITY.md, features with FEATURE.md)
- Implicit: `.documentation/capabilities/` directory tree (capability-level documentation files)
- Implicit: `.planning/refinement/pairs/` directory (checkpoint state for resumability)

## Steps: [derived]

```
1. init_directories    -> mkdir .planning/refinement/{findings,pairs}
2. discover            -> gsd-tools scan-discover -> capabilities[] + gap_findings[]
3. enumerate_pairs     -> gsd-tools scan-pairs -> ordered pairs + tier classification
                       -> gsd-tools scan-checkpoint --action list -> completed pairs
                       -> filter to remaining pairs
4. sequential_analysis -> for each remaining pair (A, B):
                            load cap A + cap B contents from discovery output
                            load prior findings context (HIGH + recent 20 if >100KB)
                            spawn Task(gsd-scan-pair template, gsd-executor)
                            parse findings or NO_FINDINGS token
                            write FINDING-{NNN}.md files
                            write checkpoint: scan-checkpoint --pair A__B --action write
5. consolidation       -> load all findings, group symptoms into root causes (ROOT-{NNN})
                       -> update finding frontmatter with root_cause field
6. output_assembly     -> write matrix.md (cap x cap relationship grid)
                       -> write dependency-graph.md (explicit + implicit + gap deps)
                       -> write summary.md (finding distribution, root causes, all findings)
```

### Checkpoint/Resume Branch (EU-02)

At step 3, completed pairs are filtered out. If all pairs are complete, step 4 is skipped entirely. Checkpoint keys use double-underscore separator (`A__B`) matching the deterministic sort order from `listDirs`. This means a resumed scan produces identical pair keys to the original run.

## Output: [derived]

- `.planning/refinement/findings/FINDING-{NNN}.md` — individual finding cards (written during step 4)
- `.planning/refinement/matrix.md` — capability x capability relationship grid (step 6)
- `.planning/refinement/dependency-graph.md` — explicit, implicit, and gap dependencies (step 6)
- `.planning/refinement/summary.md` — aggregated findings with distribution and root causes (step 6)
- `.planning/refinement/pairs/{A}__{B}.complete` — checkpoint markers (step 4)

## Side-effects: [derived]

- Creates `.planning/refinement/` directory tree if it does not exist
- Writes finding files incrementally during pair analysis (not transactional)
- Updates finding frontmatter with `root_cause` field during consolidation
- Checkpoint files are append-only (never deleted during a scan)

## WHY: [authored]

**Sequential pair analysis, not parallel (TC-01):** Each pair agent receives prior findings context to avoid duplicate detection. Parallel analysis would either miss duplicates or require a post-hoc dedup pass.

**Checkpoint resumability via deterministic ordering (EU-02):** Pair keys (`A__B`) depend on sorted capability slugs. The `listDirs` helper sorts alphabetically, ensuring the same pair key is generated across runs. Without deterministic ordering, a resumed scan would generate different keys and re-analyze already-completed pairs.

**Skip-not-halt for malformed output (no-silent-failures + batch pattern):** A single pair producing malformed output should not halt the entire scan. The workflow logs the skip and continues, preserving progress on other pairs.
