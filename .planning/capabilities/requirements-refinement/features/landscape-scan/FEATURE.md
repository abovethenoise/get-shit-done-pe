---
type: feature
capability: "requirements-refinement"
status: complete
created: "2026-03-05"
---

# landscape-scan

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | done | draft |
| EU-02 | - | - | - | - | done | draft |
| FN-01 | - | - | - | - | done | draft |
| FN-02 | - | - | - | - | done | draft |
| FN-03 | - | - | - | - | done | draft |
| FN-04 | - | - | - | - | done | draft |
| FN-05 | - | - | - | - | done | draft |
| TC-01 | - | - | - | - | done | draft |
| TC-02 | - | - | - | - | done | draft |
| TC-03 | - | - | - | - | done | draft |

## End-User Requirements

### EU-01: Cross-capability coherence scan

**Story:** As a GSD user, I want to scan all my project's capabilities and features for conflicts, gaps, and misalignments, so that I can fix coherence issues before they surface during implementation.

**Acceptance Criteria:**

- [ ] Scan reads all capability and feature artifacts across the project
- [ ] Produces a relationship matrix showing how each capability pair relates
- [ ] Produces finding cards for each detected issue (conflict, gap, overlap, etc.)
- [ ] Produces a dependency graph distinguishing explicit vs implicit vs gap dependencies
- [ ] Capabilities with zero spec docs are flagged as GAP findings (not silently skipped)

**Out of Scope:**

- User Q&A interaction (refinement-qa feature)
- Applying changes to capability/feature files (change-application feature)
- Persisting reports across runs (refinement-artifact feature)

### EU-02: Resumable scan

**Story:** As a GSD user, I want the scan to checkpoint progress per pair, so that an interrupted scan can resume without re-analyzing completed pairs.

**Acceptance Criteria:**

- [ ] Each completed pair writes a checkpoint flag (e.g., `.planning/refinement/pairs/{A}-{B}.complete`)
- [ ] On re-run, already-checkpointed pairs are skipped
- [ ] Accumulated findings from checkpointed pairs are loaded as prior context

**Out of Scope:**

- Invalidating checkpoints when underlying artifacts change (potential follow-up)

## Functional Requirements

### FN-01: Artifact discovery and pair enumeration

**Receives:** Project root path (implicit from working directory).

**Returns:** Ordered list of capability pairs to analyze, with resolved file paths and loaded contents for each capability.

**Behavior:**

- Read all capabilities via `gsd-tools.cjs scan-discover` (independent route — different output shape from capability-list, includes loaded contents and completeness assessment)
- For each capability, resolve paths to all artifact types: CAPABILITY.md, FEATURE.md files, exploration notes (.documentation/capabilities/*.md), discovery briefs
- Load and structure file contents per capability
- Enumerate all unique capability pairs (A×B where A < B alphabetically)
- Capabilities with zero spec docs: emit a GAP finding card immediately (before pair analysis), still include in pair enumeration
- Partially specced capabilities (some artifacts missing): include available artifacts, note missing types in structured input

### FN-02: Per-pair sequential analysis

**Receives:** Structured input containing both capabilities' doc contents + accumulated prior findings.

**Returns:** 0-N finding cards per pair.

**Behavior:**

- Agent receives contents (not paths) — no file I/O in the reasoning agent
- Agent analyzes for: conflicts, dependency gaps, assumption mismatches, overlaps, alignment issues
- Agent can reference prior findings from earlier pairs (e.g., "this is another symptom of the root cause in FINDING-003")
- Each finding card contains: type, severity, affected capabilities, doc sources (file:line), summary, recommendation
- Pairs with no findings produce zero cards (valid outcome)
- Checkpoint flag written after each pair completes: `scan-output/pairs/{A}-{B}.complete`

### FN-03: Finding card format

**Receives:** Agent analysis output for a capability pair.

**Returns:** Structured finding card written to `scan-output/findings/FINDING-{id}.md`.

**Behavior:**

- Finding types: CONFLICT, GAP, OVERLAP, DEPENDS_ON (undocumented), ASSUMPTION_MISMATCH, ALIGNMENT (project goal misalignment)
- Severity levels: HIGH, MEDIUM, LOW
- Each card includes: type, severity, affected capabilities (with direction), doc sources (file path + line number), summary (plain language), recommendation (actionable)
- Finding IDs are globally sequential across the scan run (FINDING-001, FINDING-002, etc.)

### FN-04: Dedup and consolidation

**Receives:** All finding cards from all pairs.

**Returns:** Consolidated findings where N symptoms map to M root causes (M < N).

**Behavior:**

- After all pairs analyzed, run consolidation pass
- Group related findings by root cause (e.g., 3 pairs all flag the same missing auth contract → 1 root cause with 3 symptoms)
- Preserve individual finding cards but add `root_cause` field linking to the consolidated root cause
- For 50+ cap projects: global consolidation pass runs after cluster-level dedup to catch duplicates across cluster boundaries

### FN-05: Three-layer output aggregation

**Receives:** Consolidated finding cards + pair analysis metadata.

**Returns:** Three-layer summary written to `scan-output/summary.md`.

**Behavior:**

- **Layer 1 — Relationship Matrix:** Capability × capability grid. Each cell shows relationship type (DEPENDS_ON, CONFLICT, GAP, OVERLAP, NONE) and confidence (HIGH/MEDIUM/LOW). Diagonal is `—`.
- **Layer 2 — Finding Cards:** Consolidated findings sorted by severity (HIGH first), then by type. Root causes grouped with their symptoms.
- **Layer 3 — Dependency Graph:** Markdown table with columns: From, To, Type (explicit/implicit/gap), Source. Explicit dependencies come from CAPABILITY.md, implicit are discovered during analysis, gap are expected but undocumented.

## Technical Specs

### TC-01: CLI routes for file discovery

**Intent:** Keep file I/O and path resolution in gsd-tools.cjs. Agent does reasoning only.

**Upstream:** gsd-tools.cjs `capability-list` route (existing).

**Downstream:** Orchestrator workflow receives structured data, passes to per-pair agent.

**Constraints:**

- New CLI route: `scan-discover` — returns JSON with all capabilities, their artifact paths, and loaded contents
- New CLI route: `scan-pairs` — returns ordered list of capability pairs to analyze
- New CLI route: `scan-checkpoint` — reads/writes checkpoint flags, returns list of completed pairs
- No external dependencies — pure Node.js file I/O

**Example:**

```
$ node gsd-tools.cjs scan-discover
{
  "capabilities": [
    {
      "slug": "auth",
      "artifacts": {
        "capability": { "path": "...", "content": "..." },
        "features": [...],
        "documentation": { "path": "...", "content": "..." }
      },
      "completeness": "full" | "partial" | "none"
    }
  ]
}
```

### TC-02: Per-pair agent definition

**Intent:** Dedicated agent file for pairwise capability analysis. Receives structured input, outputs finding cards.

**Upstream:** Orchestrator loads capability contents + prior findings, passes as agent prompt context.

**Downstream:** Finding cards written to `scan-output/findings/`.

**Constraints:**

- Agent file: `templates/gsd-scan-pair.md` (prompt templates live in `templates/`, not `agents/`)
- Agent receives: capability pair contents + prior findings + finding card schema
- Agent outputs: structured finding cards (markdown with frontmatter)
- No file I/O in agent — orchestrator handles disk writes
- Agent model: sonnet (reasoning quality sufficient, faster than opus for per-pair iteration)

### TC-03: Tiered scaling strategy

**Intent:** Prevent O(n²) Claude calls for large projects by filtering pairs before analysis.

**Upstream:** `scan-pairs` CLI route detects project size tier.

**Downstream:** Orchestrator receives filtered pair list appropriate to project size.

**Constraints:**

- Small (≤20 caps): Full pairwise — all n(n-1)/2 pairs analyzed sequentially
- Medium (21-50 caps): mgrep pre-filter — for each capability, mgrep its key terms against other capabilities' artifacts. Only pairs with high textual proximity hit Claude.
- Large (50+ caps): Cluster by domain/layer first (using capability tags or directory structure). Sequential analysis within clusters. Cross-cluster analysis limited to cluster boundary pairs. Global consolidation pass after all clusters.
- Tier detection is automatic based on capability count from `capability-list`

## Decisions

- 2026-03-05: Sequential pair analysis (not parallel) — later pairs benefit from accumulated findings context. Dedup pass consolidates N symptoms to M root causes.
- 2026-03-05: Clean separation — gsd-tools does file I/O, agent does reasoning. Agent receives contents, not paths.
- 2026-03-05: Capabilities with zero spec docs flagged as GAP immediately (not skipped).
- 2026-03-05: Global consolidation pass for 50+ cap projects to catch cross-cluster duplicates.
- 2026-03-05: Confidence scoring uses categorical (HIGH/MEDIUM/LOW) not numeric — more interpretable for Q&A.
