## User Intent Findings

### Primary Goal

Detect cross-capability conflicts, gaps, and misalignments across an entire GSD project before they surface during implementation, producing structured evidence that downstream features (coherence-report, refinement-qa) can act on. -- source: CAPABILITY.md "Why" section, EU-01 story

### Acceptance Criteria

- Scan discovers and loads ALL capability and feature artifacts (CAPABILITY.md, FEATURE.md, exploration notes, discovery briefs) -- pass: no artifact type silently omitted; verified by comparing discovered artifacts against a filesystem glob -- source: FEATURE.md EU-01, FN-01
- Capabilities with zero spec docs are flagged as GAP findings immediately (before pair analysis) -- pass: a capability directory with no FEATURE.md or exploration docs produces a FINDING card of type GAP; never silently skipped -- source: FEATURE.md EU-01 AC, FN-01, Decisions 2026-03-05
- Relationship matrix covers every capability pair with relationship type and confidence -- pass: matrix has n(n-1)/2 cells for n capabilities, each cell contains one of the defined types + HIGH/MEDIUM/LOW confidence -- source: FEATURE.md FN-05 Layer 1
- Finding cards follow defined schema (type, severity, affected capabilities, doc sources with file:line, summary, recommendation) -- pass: every finding card has all six fields populated -- source: FEATURE.md FN-03
- Finding types are from the fixed taxonomy: CONFLICT, GAP, OVERLAP, DEPENDS_ON, ASSUMPTION_MISMATCH, ALIGNMENT -- pass: no finding card uses a type outside this set -- source: FEATURE.md FN-03
- Dependency graph distinguishes explicit, implicit, and gap dependencies with correct notation -- pass: graph uses `A --requires--> B`, `A --triggers--> B (implicit)`, `A --triggers--> B (GAP)` format -- source: FEATURE.md FN-05 Layer 3
- Dedup/consolidation pass groups N symptom findings into M root causes (M < N) after all pairs analyzed -- pass: at least one root_cause grouping produced when multiple related findings exist -- source: FEATURE.md FN-04
- Resumable via per-pair checkpoints -- pass: killing the process mid-scan and re-running skips completed pairs, loads their findings as context -- source: FEATURE.md EU-02, FN-02
- Checkpoint format: `scan-output/pairs/{A}-{B}.complete` files -- pass: files exist for completed pairs, absent for incomplete pairs -- source: FEATURE.md EU-02 AC
- Three-layer output written to `scan-output/summary.md` -- pass: file exists with all three sections (matrix, findings, dependency graph) -- source: FEATURE.md FN-05
- Tiered scaling: small (<=20) full pairwise, medium (21-50) mgrep pre-filter, large (50+) cluster-then-scan -- pass: pair count for medium/large projects is < n(n-1)/2 -- source: FEATURE.md TC-03
- Agent receives contents not paths (no file I/O in reasoning agent) -- pass: gsd-scan-pair agent prompt contains artifact text, not file paths to read -- source: FEATURE.md TC-02, Decisions 2026-03-05

### Implicit Requirements

- Output must be machine-parseable by coherence-report -- the downstream feature (coherence-report FN-01) reads `findings/`, `matrix.md`, and `dependency-graph.md` from `.planning/refinement/`. Landscape-scan's output path (`scan-output/`) must match what coherence-report expects, or one spec is wrong. -- [First principles: producer-consumer contract must align; FEATURE.md says `scan-output/` but coherence-report FEATURE.md says `.planning/refinement/`]
- Finding IDs must be globally unique and stable within a scan run -- coherence-report references finding IDs (FINDING-001 etc.) in its RECOMMENDATIONS.md. If IDs shift on resume, downstream references break. -- [First principles: resumable system that produces sequential IDs must not reassign IDs for previously checkpointed findings]
- The scan must handle the zero-capability edge case gracefully -- a brand new project with no capabilities should produce a clear "nothing to scan" result, not crash. -- [First principles: robustness for empty input]
- Sequential pair analysis order must be deterministic -- the spec says "later pairs benefit from accumulated findings context" (FEATURE.md Decisions 2026-03-05). If pair order is non-deterministic, accumulated context is unreliable across resume boundaries. Alphabetical ordering is specified in FN-01.
- Checkpoint state must include the findings produced by that pair, not just a completion flag -- EU-02 AC says "accumulated findings from checkpointed pairs are loaded as prior context." A bare `.complete` flag file is insufficient; the findings themselves must be loadable. -- source: FEATURE.md EU-02 AC bullet 3
- New CLI routes (scan-discover, scan-pairs, scan-checkpoint) must live in existing gsd-tools.cjs -- the constraint says "no external dependencies -- pure Node.js file I/O" and TC-01 references gsd-tools.cjs. -- source: FEATURE.md TC-01

### Scope Boundaries

**In scope:**
- Reading all artifact types across the project (CAPABILITY.md, FEATURE.md, exploration notes, briefs)
- Pairwise capability-level analysis via Claude reasoning agent
- Three-layer structured output (matrix, finding cards, dependency graph)
- Tiered scaling (small/medium/large)
- Per-pair checkpointing and resume
- Three new gsd-tools.cjs CLI routes (scan-discover, scan-pairs, scan-checkpoint)
- A new agent file (agents/gsd-scan-pair.md)
- Dedup/consolidation pass

**Out of scope:**
- User Q&A interaction (refinement-qa feature) -- source: FEATURE.md EU-01 Out of Scope
- Applying changes to capability/feature files (change-application feature) -- source: FEATURE.md EU-01 Out of Scope
- Persisting reports across runs or computing deltas (refinement-artifact feature) -- source: FEATURE.md EU-01 Out of Scope
- Feature-to-feature pairwise analysis (explicitly deferred) -- source: BRIEF.md Scope Boundary Out
- Checkpoint invalidation when underlying artifacts change -- source: FEATURE.md EU-02 Out of Scope

**Ambiguous:**
- Output directory mismatch: FEATURE.md specifies `scan-output/` as the output directory, but coherence-report FEATURE.md (FN-01) reads from `.planning/refinement/`. These must be reconciled before implementation.
- Whether `scan-output/summary.md` is the only output file or if matrix, findings, and dependency graph are also written as separate files (coherence-report expects separate files: `matrix.md`, `dependency-graph.md`, `findings/FINDING-{id}.md`).
- The BRIEF.md lists mgrep pre-filtering as in-scope for "medium/large projects" but the exact mgrep integration (how key terms are extracted, what "high textual proximity" means quantitatively) is underspecified.
- Whether the consolidation pass (FN-04) for 50+ cap projects (global cross-cluster dedup) is a separate Claude invocation or part of the same pass.

### Risk: Misalignment

- Output path contract mismatch between landscape-scan and coherence-report is the highest-risk misalignment. If not resolved, coherence-report cannot find scan results. landscape-scan FEATURE.md FN-05 says `scan-output/summary.md`; coherence-report FEATURE.md FN-01 says `.planning/refinement/`. -- source: landscape-scan FEATURE.md FN-05, coherence-report FEATURE.md FN-01
- The checkpoint mechanism (bare `.complete` flag files) may be insufficient for the resume requirement. EU-02 AC bullet 3 requires "accumulated findings from checkpointed pairs are loaded as prior context" -- but the finding cards in `scan-output/findings/` already serve this purpose if they persist. The risk is that the implementation treats checkpoints and findings as separate concerns when they are coupled. -- source: FEATURE.md EU-02
- Tiered scaling for medium/large projects adds significant complexity (mgrep integration, clustering logic) that may not be needed yet. The user's own project (get-shit-done-pe) likely has fewer than 20 capabilities. YAGNI principle from CLAUDE.md suggests the medium/large tiers could be deferred. -- source: CLAUDE.md "Engineering Principles", FEATURE.md TC-03
