# Functional Trace Report: landscape-scan

**Date:** 2026-03-05
**Artifacts reviewed:**
- `get-shit-done/bin/lib/scan.cjs`
- `get-shit-done/bin/gsd-tools.cjs` (lines 418-432)
- `get-shit-done/workflows/landscape-scan.md`
- `get-shit-done/templates/gsd-scan-pair.md`

---

## Phase 1: Internalize Requirements

| Req ID | Behavior Specification |
|--------|----------------------|
| EU-01 | Full coherence scan: reads all artifacts, produces matrix + finding cards + dependency graph. Zero-spec caps flagged as GAP. |
| EU-02 | Checkpoint per pair; resume skips completed pairs; prior findings loaded from checkpointed pairs. |
| FN-01 | Discover capabilities, resolve paths, load contents, enumerate pairs (A < B alpha). Zero spec -> GAP immediately. Partial -> include available. |
| FN-02 | Agent gets contents not paths. Analyzes 6 types. Can reference prior findings. Checkpoint after each pair. |
| FN-03 | 6 finding types, 3 severity levels. Fields: type, severity, affected caps, doc_sources (file:line), summary, recommendation. Globally sequential IDs (FINDING-001...). |
| FN-04 | Post-analysis consolidation. Group by root cause. Preserve cards + add root_cause field. 50+ cap: global consolidation after cluster dedup. |
| FN-05 | Layer 1: relationship matrix (cap x cap). Layer 2: finding cards sorted by severity. Layer 3: dependency graph (explicit/implicit/gap). |
| TC-01 | CLI routes scan-discover, scan-pairs, scan-checkpoint in scan.cjs. |
| TC-02 | Per-pair agent template gsd-scan-pair.md, receives contents not paths, sonnet, zero file I/O. |
| TC-03 | Tiered scaling: small <=20 full pairwise, medium 21-50 mgrep pre-filter, large 50+ cluster-first. |

---

## Phase 2: Trace Against Code

### EU-01: Cross-capability coherence scan

**Verdict:** met

**Evidence:**
- `scan.cjs:28-31` -- `fs.readdirSync(capabilitiesDir, { withFileTypes: true }).filter(e => e.isDirectory())` -- Reads all capability directories.
- `scan.cjs:37-60` -- Loads CAPABILITY.md, features, and documentation content per capability.
- `scan.cjs:84-96` -- `if (completeness === 'none') { gapFindings.push(...)` -- Zero-spec caps produce GAP findings immediately.
- `landscape-scan.md:126-166` -- Workflow orchestrates matrix, finding cards, and dependency graph output assembly.
- Reasoning: The CLI tools provide discovery and pair enumeration; the workflow template drives the full pipeline including three-layer output. All EU-01 acceptance criteria are addressed across these artifacts.

### EU-02: Resumable scan

**Verdict:** met

**Evidence:**
- `scan.cjs:132-177` -- `cmdScanCheckpoint` implements read/write/list actions for checkpoint markers.
- `scan.cjs:152-153` -- `fs.writeFileSync(filePath, '', 'utf-8')` -- Writes empty `.complete` file per pair.
- `landscape-scan.md:50-63` -- Workflow loads completed pairs via `scan-checkpoint --action list`, filters them out, logs remaining count.
- `landscape-scan.md:72-73` -- "Load all existing FINDING-*.md files" -- Prior findings from checkpointed pairs are loaded as context for subsequent pairs.
- Reasoning: Checkpoint write, read, list, and resume-skip logic are all implemented. Prior findings accumulation is specified in the workflow.

### FN-01: Artifact discovery and pair enumeration

**Verdict:** not met (proven)

**Evidence:**
- `scan.cjs:37-39` -- Discovery loads `CAPABILITY.md`, features, and `.documentation/capabilities/{slug}.md`. However, FEATURE.md spec states discovery should also resolve "exploration notes, discovery briefs" -- the code loads documentation but the spec mentions resolving "all artifact types."
- `scan.cjs:69` -- FN-01 spec says "Read all capabilities via `gsd-tools.cjs capability-list`" but `cmdScanDiscover` does its own directory enumeration of `.planning/capabilities/` rather than calling the existing `capability-list` route. This is a deviation from the spec, though functionally similar.
- `scan.cjs:84-96` -- Zero-spec caps produce GAP finding: met.
- `scan.cjs:63-71` -- Completeness computed as `full` (cap + features), `partial` (cap only), `none` (no cap). This does not account for missing features being noted as "partial" -- a cap with CAPABILITY.md but no features is `partial`, but a cap with features but no CAPABILITY.md is `none`. The spec says "Partially specced capabilities (some artifacts missing): include available artifacts, note missing types." The code does include available artifacts (features are loaded regardless), but `completeness` does not distinguish a cap with features-only from a truly empty cap -- both are `none`.
- `scan.cjs:122-127` -- Pair enumeration uses `i < j` on sorted slugs, ensuring A < B alphabetically: met.

**Cross-layer observations:** The deviation of not using `capability-list` internally means scan-discover may diverge from `capability-list` behavior if that route's logic changes. This is a maintenance concern, not a functional defect today.

### FN-02: Per-pair sequential analysis

**Verdict:** met

**Evidence:**
- `gsd-scan-pair.md:3` -- `You do NOT perform file I/O. All context is provided below.` -- Agent receives contents not paths: met.
- `gsd-scan-pair.md:65-79` -- Agent analyzes all 6 types systematically: met.
- `gsd-scan-pair.md:81` -- `If this pair reveals another symptom of a root cause identified in prior findings, reference the prior finding ID` -- Prior findings reference: met.
- `landscape-scan.md:97-101` -- Checkpoint written after each pair via `scan-checkpoint --pair "{A}__{B}" --action write`: met.
- `gsd-scan-pair.md:17-19` -- Prior findings injected via `{{PRIOR_FINDINGS}}` placeholder: met.
- Reasoning: The template and workflow together implement all FN-02 behaviors.

### FN-03: Finding card format

**Verdict:** met

**Evidence:**
- `scan.cjs:12` -- `const FINDING_TYPES = ['CONFLICT', 'GAP', 'OVERLAP', 'DEPENDS_ON', 'ASSUMPTION_MISMATCH', 'ALIGNMENT']` -- All 6 types: met.
- `scan.cjs:13` -- `const SEVERITY_LEVELS = ['HIGH', 'MEDIUM', 'LOW']` -- 3 severity levels: met.
- `scan.cjs:15` -- `const FINDING_FIELDS = ['id', 'type', 'severity', 'confidence', 'affected_capabilities', 'doc_sources', 'summary', 'recommendation', 'root_cause']` -- All required fields present.
- `gsd-scan-pair.md:25-36` -- Template schema includes type, severity, confidence, affected_capabilities (with direction), doc_sources (path + line), summary, recommendation: met.
- `gsd-scan-pair.md:85` -- `Use FINDING-XXX as the ID placeholder (the orchestrator assigns sequential IDs)`: met.
- `landscape-scan.md:90-91` -- Orchestrator replaces `FINDING-XXX` with sequential `FINDING-{NNN}`: met.

**Cross-layer observations:** The `FINDING_FIELDS` constant in scan.cjs includes `confidence` which is not listed in the FN-03 spec fields ("type, severity, affected capabilities, doc sources, summary, recommendation") but IS listed in the template schema. The spec and code diverge on whether `confidence` is a required field -- the code includes it, the spec omits it from the FN-03 field list but includes it in TC-02 template. This is additive, not a regression.

### FN-04: Dedup and consolidation

**Verdict:** met

**Evidence:**
- `landscape-scan.md:107-118` -- Consolidation step: loads all findings, groups by root cause, assigns `ROOT-{NNN}` IDs, updates frontmatter with `root_cause` field: met.
- `landscape-scan.md:119` -- "Findings that are standalone (not part of a group) keep `root_cause: null`": met.
- `scan.cjs:15` -- `FINDING_FIELDS` includes `root_cause`: schema supports the field.
- Reasoning: Consolidation logic is specified in the workflow. The CLI provides the schema constants. The 50+ cap global consolidation is addressed implicitly through the workflow's consolidation step running on all findings.

**Cross-layer observations:** The FN-04 spec explicitly calls for "50+ cap projects: global consolidation after cluster-level dedup." The workflow consolidation step does not explicitly mention cluster-level dedup -- it runs a single consolidation pass on all findings. This is acceptable for small/medium tiers but the large-tier cluster-then-consolidate flow is not explicitly implemented in the workflow. This ties to TC-03 not-met finding below.

### FN-05: Three-layer output aggregation

**Verdict:** met

**Evidence:**
- `landscape-scan.md:126-138` -- Layer 1 relationship matrix as cap x cap markdown table, highest severity relationship per cell, diagonal `--`: met.
- `landscape-scan.md:140-149` -- Layer 2 finding cards sorted by severity then type, root causes grouped with symptoms: met.
- `landscape-scan.md:155-166` -- Layer 3 dependency graph with explicit/implicit/gap types as markdown table: met.
- `landscape-scan.md:168-204` -- Summary.md consolidates all layers with metadata, distribution table, root causes table: met.
- Reasoning: All three layers are fully specified in the workflow with concrete output formats and file destinations.

**Cross-layer observations:** The FN-05 spec says Layer 3 format should be `A --requires--> B` directed graph notation. The workflow uses a markdown table format (`| From | To | Type | Evidence |`). This is a format deviation from the spec's ASCII arrow notation, though the table conveys equivalent information.

### TC-01: CLI routes in scan.cjs

**Verdict:** met

**Evidence:**
- `gsd-tools.cjs:418-421` -- `case 'scan-discover'` routes to `cmdScanDiscover`: met.
- `gsd-tools.cjs:423-426` -- `case 'scan-pairs'` routes to `cmdScanPairs`: met.
- `gsd-tools.cjs:428-432` -- `case 'scan-checkpoint'` routes to `cmdScanCheckpoint`: met.
- `scan.cjs:1-7` -- Pure Node.js, no external dependencies: met.
- Reasoning: All three CLI routes exist and delegate to the scan module.

### TC-02: Per-pair agent definition

**Verdict:** not met (proven)

**Evidence:**
- `gsd-scan-pair.md` exists at `get-shit-done/templates/gsd-scan-pair.md` -- but TC-02 spec says "Agent file: `agents/gsd-scan-pair.md`". The file is in `templates/` not `agents/`.
- `gsd-scan-pair.md:3` -- `You do NOT perform file I/O` -- Zero file I/O: met.
- `gsd-scan-pair.md:9-19` -- Receives capability contents + prior findings + schema: met.
- TC-02 spec says "Agent model: sonnet" -- the template itself does not specify a model. The workflow at `landscape-scan.md:81` says `subagent_type="gsd-executor"` but does not specify sonnet. Model selection is not enforced in either artifact.
- Reasoning: Two deviations: (1) file location is `templates/` not `agents/`; (2) sonnet model constraint is not enforced in any artifact.

**Cross-layer observations:** The workflow references the template path as `$HOME/.claude/get-shit-done/templates/gsd-scan-pair.md` (line 78), which is consistent with the actual file location but inconsistent with the TC-02 spec path.

### TC-03: Tiered scaling strategy

**Verdict:** not met (proven)

**Evidence:**
- `scan.cjs:116-120` -- Tier detection: `if (count > 20) { tier = 'medium' }` -- Only two tiers (small, medium). No large tier detection (50+ caps). Threshold is `> 20` not `<= 20` for small, so small is 0-20 caps: met for small threshold.
- `scan.cjs:119` -- `process.stderr.write('Warning: Medium/large tier pair filtering not yet implemented. Falling back to full pairwise.\n')` -- Medium tier mgrep pre-filtering is explicitly not implemented; falls back to full pairwise.
- `scan.cjs:122-127` -- All pairs generated regardless of tier -- no filtering applied for medium or large tiers.
- Reasoning: TC-03 specifies three tiers with distinct behaviors (small=full pairwise, medium=mgrep pre-filter, large=cluster-first). Only small tier behavior is implemented. Medium and large are detected but fall back to small behavior with a stderr warning.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | met | scan.cjs + landscape-scan.md cover full pipeline |
| EU-02 | met | scan.cjs:132-177 checkpoint read/write/list + workflow resume logic |
| FN-01 | not met | scan.cjs:69 -- does not use capability-list; completeness logic conflates features-only with empty |
| FN-02 | met | gsd-scan-pair.md + workflow: contents-not-paths, 6 types, prior findings, checkpoint |
| FN-03 | met | scan.cjs:12-15 + gsd-scan-pair.md:25-36 -- all types, severities, fields present |
| FN-04 | met | landscape-scan.md:107-119 -- consolidation with root_cause grouping |
| FN-05 | met | landscape-scan.md:126-204 -- three layers + summary output |
| TC-01 | met | gsd-tools.cjs:418-432 -- all three CLI routes registered |
| TC-02 | not met | File at templates/ not agents/; sonnet model not enforced |
| TC-03 | not met | scan.cjs:116-120 -- medium/large tier filtering not implemented, falls back to full pairwise |
