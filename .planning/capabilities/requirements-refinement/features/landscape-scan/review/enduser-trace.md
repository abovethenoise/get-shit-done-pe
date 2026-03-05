# End-User Trace Report: landscape-scan

## Phase 1: Internalize Requirements

### EU-01: Cross-capability coherence scan
AC:
1. Scan reads all capability and feature artifacts across the project
2. Produces relationship matrix showing how each capability pair relates
3. Produces finding cards for each detected issue
4. Produces dependency graph (explicit vs implicit vs gap)
5. Capabilities with zero spec docs flagged as GAP (not skipped)

"Met" means: The code reads all capability dirs + features + docs, the workflow produces matrix.md / finding cards / dependency-graph.md, and empty-spec capabilities generate GAP findings.

### EU-02: Resumable scan
AC:
1. Each completed pair writes checkpoint flag
2. On re-run, checkpointed pairs skipped
3. Accumulated findings from checkpointed pairs loaded as prior context

"Met" means: checkpoint write/read/list commands exist and work; the workflow filters completed pairs and loads prior findings.

---

## Phase 2: Trace Against Code

### EU-01: Cross-capability coherence scan

**Verdict:** met

**Evidence:**

**AC-1 (Scan reads all capability and feature artifacts):**
- `scan.cjs:20-21` — `const capabilitiesDir = path.join(cwd, '.planning', 'capabilities'); const documentationDir = path.join(cwd, '.documentation', 'capabilities');`
- `scan.cjs:28-31` — Reads all directory entries: `fs.readdirSync(capabilitiesDir, { withFileTypes: true }).filter(e => e.isDirectory())`
- `scan.cjs:37-59` — For each capability: reads CAPABILITY.md (`capContent`), iterates features directory and reads each FEATURE.md (`featContent`), reads documentation file (`docContent`)
- `scan.cjs:73-80` — Outputs all content in structured JSON with `slug`, `artifacts.capability`, `artifacts.features[]`, `artifacts.documentation`
- Reasoning: Discovery reads CAPABILITY.md, all feature FEATURE.md files, and documentation. Content is included in the output (not just paths), satisfying FN-02's "agent receives contents, not paths" requirement. The workflow template (`landscape-scan.md:69-70`) instructs the orchestrator to extract full contents from discovery output and inject them into the agent template.

**AC-2 (Produces relationship matrix):**
- `landscape-scan.md:126-138` — Workflow step `output_assembly` specifies building a capability x capability markdown table with relationship types and confidence levels, written to `.planning/refinement/matrix.md`
- Reasoning: The workflow instructs the orchestrating agent to produce this artifact. The matrix format matches the requirement (pair-based, severity-annotated).

**AC-3 (Produces finding cards):**
- `gsd-scan-pair.md:22-42` — Agent template defines the finding card schema with frontmatter fields (id, type, severity, confidence, affected_capabilities, doc_sources) plus Summary and Recommendation sections
- `landscape-scan.md:87-93` — Workflow writes each finding to `.planning/refinement/findings/FINDING-{NNN}.md`
- `scan.cjs:10-15` — Constants exported: `FINDING_TYPES = ['CONFLICT', 'GAP', 'OVERLAP', 'DEPENDS_ON', 'ASSUMPTION_MISMATCH', 'ALIGNMENT']`, `SEVERITY_LEVELS = ['HIGH', 'MEDIUM', 'LOW']`
- Reasoning: Six finding types and three severity levels match FN-03. Finding IDs are globally sequential per the workflow.

**AC-4 (Produces dependency graph):**
- `landscape-scan.md:153-166` — Workflow specifies extraction of three dependency types (explicit, implicit, gap) into a markdown table at `.planning/refinement/dependency-graph.md`
- Reasoning: The three dependency categories (explicit from CAPABILITY.md tables, implicit from DEPENDS_ON findings, gap from GAP findings) are enumerated with evidence references.

**AC-5 (Capabilities with zero spec docs flagged as GAP):**
- `scan.cjs:64-71` — Completeness computed: `if (capContent && features.length > 0) completeness = 'full'; else if (capContent) completeness = 'partial'; else completeness = 'none';`
- `scan.cjs:84-96` — When `completeness === 'none'`: creates a GAP finding with `severity: 'HIGH'`, `type: 'GAP'`, summary `"Capability directory '{slug}' exists with no specification (no CAPABILITY.md)"`
- Reasoning: Directories without CAPABILITY.md are flagged as GAP findings with HIGH severity. They are not skipped. This directly satisfies the acceptance criterion.

**Cross-layer observations:**
- The gap detection only fires when CAPABILITY.md is entirely missing (`completeness === 'none'`). A directory with CAPABILITY.md but zero features is classified as `partial`, not flagged as GAP. This may or may not be intentional -- the AC says "zero spec docs" which could be interpreted either way, but the implementation is defensible since CAPABILITY.md itself is a spec doc.

---

### EU-02: Resumable scan

**Verdict:** met

**Evidence:**

**AC-1 (Each completed pair writes checkpoint flag):**
- `scan.cjs:149-154` — Write action: `fs.mkdirSync(pairsDir, { recursive: true }); const filePath = path.join(pairsDir, '${pair}.complete'); fs.writeFileSync(filePath, '', 'utf-8');`
- `landscape-scan.md:98-101` — Workflow calls checkpoint write after each pair: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" scan-checkpoint --pair "{A}__{B}" --action write`
- Reasoning: Empty `.complete` files serve as checkpoint flags. The naming convention `{A}__{B}` (double underscore) is consistent between workflow and CLI.

**AC-2 (On re-run, checkpointed pairs skipped):**
- `scan.cjs:163-173` — List action returns all completed pair names: `fs.readdirSync(pairsDir).filter(f => f.endsWith('.complete')).map(f => f.replace('.complete', ''))`
- `landscape-scan.md:50-57` — Workflow fetches completed list and filters: "Filter out pairs where `{a}__{b}` appears in the completed_pairs list"
- Reasoning: The workflow explicitly checks completed pairs and skips them. Progress logging shows remaining count.

**AC-3 (Accumulated findings from checkpointed pairs loaded as prior context):**
- `landscape-scan.md:72-75` — "Load all existing FINDING-*.md files from `.planning/refinement/findings/`... Extract each finding's frontmatter (id, type, severity) + first paragraph of Summary"
- `landscape-scan.md:83-84` — Prior findings injected into agent template replacing `{{PRIOR_FINDINGS}}`
- `gsd-scan-pair.md:17-19` — Template has `<prior_findings>{{PRIOR_FINDINGS}}</prior_findings>` placeholder
- `gsd-scan-pair.md:78` — Agent instructions: "If this pair reveals another symptom of a root cause identified in prior findings, reference the prior finding ID in your summary"
- Reasoning: On resume, findings from already-completed pairs exist on disk and are loaded as prior context for remaining pairs. The agent is explicitly instructed to reference prior findings. This satisfies the accumulation requirement.

---

## Secondary Requirements (FN/TC layer, end-user impact only)

### FN-01: Artifact discovery and pair enumeration
- `scan.cjs:18-100` — `cmdScanDiscover` implemented as CLI route
- `scan.cjs:102-130` — `cmdScanPairs` implemented as CLI route
- Both wired in `gsd-tools.cjs:418-427`
- Verdict: met

### FN-02: Per-pair sequential analysis (agent receives contents, not paths)
- `scan.cjs:55-58` — Feature content included: `content: featContent`
- `scan.cjs:76-77` — Capability content included: `content: capContent`
- `landscape-scan.md:69-70` — "Extract capability A and B contents from the discovery output"
- `gsd-scan-pair.md:1-2` — Agent told "You do NOT perform file I/O. All context is provided below."
- Verdict: met

### FN-03: Finding card format (6 types, 3 severity levels, globally sequential IDs)
- `scan.cjs:12` — `FINDING_TYPES = ['CONFLICT', 'GAP', 'OVERLAP', 'DEPENDS_ON', 'ASSUMPTION_MISMATCH', 'ALIGNMENT']` (6 types)
- `scan.cjs:13` — `SEVERITY_LEVELS = ['HIGH', 'MEDIUM', 'LOW']` (3 levels)
- `gsd-scan-pair.md:85` — "Use `FINDING-XXX` as the ID placeholder (the orchestrator assigns sequential IDs)"
- `landscape-scan.md:91` — "Assign sequential ID: FINDING-{NNN} (replace FINDING-XXX placeholder)"
- Verdict: met

### FN-04: Dedup and consolidation (N symptoms to M root causes)
- `landscape-scan.md:106-119` — Consolidation step groups N symptoms into M root causes with ROOT-{NNN} IDs
- `scan.cjs:15` — `FINDING_FIELDS` includes `root_cause`
- Verdict: met

### FN-05: Three-layer output aggregation
- `landscape-scan.md:123-205` — Matrix, findings summary, dependency graph all specified
- Verdict: met

### TC-01: CLI routes
- `gsd-tools.cjs:418-432` — All three routes (scan-discover, scan-pairs, scan-checkpoint) registered
- Verdict: met

### TC-02: Per-pair agent
- `gsd-scan-pair.md` — Template exists with zero file I/O instruction
- `landscape-scan.md:81` — Spawns via Task tool with subagent_type="gsd-executor"
- Template does not specify model. The workflow says to use Task tool but model selection is left to the orchestrator.
- Verdict: met (template exists and enforces zero file I/O; model selection is an orchestrator concern)

### TC-03: Tiered scaling
- `scan.cjs:116-120` — Small tier (<=20) uses full pairwise. Medium tier (>20) detected but falls back to full pairwise with stderr warning: `'Warning: Medium/large tier pair filtering not yet implemented. Falling back to full pairwise.'`
- Large tier (>50) is not distinguished from medium -- there is no separate `count > 50` check.
- Verdict: not met (partial) -- Tier detection exists for small/medium but medium/large filtering is explicitly unimplemented, and large tier is not separately identified. The fallback to full pairwise means the feature degrades gracefully but does not deliver the specified behavior.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | met | scan.cjs:28-96 -- reads all artifacts, flags GAPs; landscape-scan.md specifies matrix, findings, dep graph |
| EU-02 | met | scan.cjs:149-173 -- checkpoint write/read/list; landscape-scan.md:50-75 -- skip completed, load prior findings |
| FN-01 | met | scan.cjs:18-130 -- both CLI commands implemented and wired |
| FN-02 | met | scan.cjs:55-77 -- content included in output; agent template enforces zero I/O |
| FN-03 | met | scan.cjs:12-13 -- 6 types, 3 severities; workflow assigns sequential IDs |
| FN-04 | met | landscape-scan.md:106-119 -- consolidation step with ROOT-{NNN} grouping |
| FN-05 | met | landscape-scan.md:123-205 -- three output layers specified |
| TC-01 | met | gsd-tools.cjs:418-432 -- all three routes registered |
| TC-02 | met | gsd-scan-pair.md -- template with zero I/O, Task tool spawning |
| TC-03 | not met | scan.cjs:118-119 -- medium/large tier filtering explicitly unimplemented, large tier not distinguished |
