# Phase 5: Documentation — Synthesized Research

**Synthesized:** 2026-02-28
**Sources:** DOMAIN-TRUTH, EXISTING-SYSTEM, USER-INTENT, TECH-CONSTRAINTS, EDGE-CASES, PRIOR-ART
**Confidence:** HIGH (all 6 dimensions covered, strong source agreement, grounded in academic research + codebase inspection)

---

## 1. Consensus

All 6 researchers agree on the following. No caveats.

**Single doc agent (executor/Sonnet), not multi-agent.**
GSD's pipeline has already narrowed scope by the time the doc agent runs (post-review, scoped file list). DocAgent (Meta) and DocAider (Microsoft) use multi-agent because they process entire repositories. GSD's doc agent operates on a small change set with a strict input contract. The 3-pass self-validation provides verification benefits without agent coordination overhead. PRIOR-ART confirms: multi-agent matters for large scope; GSD's narrow scope makes single-writer + validation passes more efficient.

**Dependencies-first generation order: modules before flows.**
DocAgent's ablation study proves documenting dependencies before dependents improves truthfulness by ~8 percentage points (94.64% vs 86.75%). Module docs become verified context for flow doc generation. This ordering is implicit in CONTEXT.md's discovery scope (modified files first, then one-hop impact) but must be made explicit in the agent's processing sequence.

**3-pass self-validation with external anchors is the correct pattern.**
Chain-of-Verification research (Meta, 2023) confirms that self-verification accuracy depends on independence from the draft. All three passes use external anchors: Pass 1 checks structure against heading template, Pass 2 checks references against real code files, Pass 3 checks terminology against gate docs. This achieves the 21-62% error reduction documented in code verification research. Total validation overhead: ~7-10k tokens (<5% of 200k context window).

**Pass 2 (referential integrity) is the highest-value validation pass.**
Even sophisticated multi-agent systems with AST-based verification achieve only ~96% accuracy on code entity references. Package hallucination research shows all 16 tested coding models hallucinated references at an average rate of 19.6%. Pass 2 must verify: every export name exists in the actual file, every dependency reference resolves to a real module, every flow step references a real module in `.documentation/modules/`. Without it, ~1 in 20 referenced entities will be wrong.

**Section ownership model ([derived]/[authored]) is novel and correct.**
No surveyed documentation system distinguishes between machine-derived and human-authored sections. All treat documentation as fully regenerable. GSD's approach solves the real problem: systems that overwrite everything force users to re-add judgment after every update, which means they stop adding judgment entirely. The [derived]/[authored] tag parsing depends on reliable heading-anchor parsing -- Pass 1 structural compliance is the safety mechanism.

**Gate docs are validation inputs, not agent outputs.**
The agent's epistemic scope is "what the code does." Gate docs define "what the code should respect." These are different knowledge domains owned by different authorities. The agent reads gate docs during Pass 3 validation and enforces human-defined standards without modifying them. The `[manual]` tag reinforces this boundary.

**One-hop impact flagging, never auto-rewrite.**
RepoAgent validates this pattern: minimal-scope change propagation with human review of flagged docs prevents cascading hallucinations. The doc agent greps existing flow docs for references to modified module names and outputs a list of affected docs. Auto-rewriting would compound errors -- the agent that generated the original flow doc may not have the full context to correctly update it.

**Git SHA staleness is the right approach.**
Simpler than dependency graphs, more reliable than timestamps, native to Git tooling GSD already uses. `built-from-code-at:` SHA enables future staleness checks via `git log <sha>..HEAD -- <source_file>`. No surveyed tool uses exactly this pattern, but it follows Git's content-addressable design naturally.

**Post-review-acceptance trigger is optimal.**
GSD's trigger fires only after code has been reviewed and accepted. No surveyed system is this selective. RepoAgent uses pre-commit hooks (too aggressive), DocAider uses PR-open events (pre-review). Post-review avoids wasted work on rejected code and ensures the agent documents accepted, verified implementations.

**Review-phase workflow is the structural template for doc-phase.**
Same high-level flow: init -> context assembly -> locate artifacts -> spawn agent -> verify output -> Q&A -> commit. Key simplifications for doc-phase: single agent spawn (not 4 parallel + synthesizer), no failure threshold logic (single point of failure = abort), simpler Q&A (approve/reject per doc, not 5 response options).

---

## 2. Conflicts

### P1 — Blocking (must resolve before planning)

**P1-A: ROADMAP.md says "per capability/feature" but CONTEXT.md says "modules/ and flows/".**
ROADMAP success criterion 2 says docs are "organized per capability/feature." CONTEXT.md specifies `modules/` (flat, 1:1 with code) and `flows/` (capability-grouped). These are different organization schemes. Resolution: CONTEXT.md takes precedence (more detailed, decided later). Modules are flat by code file. Flows are grouped by capability. The roadmap wording is compatible but imprecise -- no code change needed, but implementers should follow CONTEXT.md structure, not ROADMAP.md wording.

**P1-B: Q&A review pattern does not map cleanly to doc output.**
Plan-phase and review-phase Q&A present findings one at a time (discrete items). Doc output is generated content (full files). Presenting an entire module doc for yes/no approval is a different interaction from presenting a specific finding for accept/dismiss. Resolution: Q&A presents one complete doc file at a time with "Doc 1/N" header format. User can Approve, Edit (with feedback for re-generation), or Reject. This is simpler than review-phase's 5-option model but still uses the same AskUserQuestion primitive.

**P1-C: SUMMARY.md key-files may not list all modified files.**
The `key-files` frontmatter lists "important" files, not exhaustively all files. Resolution: the orchestrator supplements SUMMARY.md key-files with `git diff --name-only` between pre-execution and post-execution commits (pattern already used in execute-plan.md line 409). The merged, deduplicated list is passed to the doc agent.

### P2 — Important (resolve during build)

**P2-A: Single agent handling both module and flow doc formats within ~1500 token budget.**
The doc agent has significant scope (3-pass validation, section ownership, heading templates for two doc types, impact discovery). At ~1500 tokens this is tight. Resolution: the agent definition references the docs template externally rather than embedding full heading specifications. The template file contains the structural rules; the agent definition contains role/goal/success criteria. Reviewer agents at ~80 lines demonstrate this is achievable.

**P2-B: WHY blocks risk inheriting reviewer speculation as documented rationale.**
Review findings may include interpretations, not just facts. If the doc agent transcribes reviewer speculation into WHY blocks, that speculation becomes "documented rationale." Resolution: WHY blocks should only be generated from review findings that explicitly cite decision context (e.g., "per CONTEXT.md decision X"). Reviewer speculation without citations should not become WHY blocks. Better to have no WHY than a hallucinated one.

**P2-C: [authored] section conflicts lack a defined resolution workflow.**
CONTEXT.md says "flag conflicts" when authored sections conflict with changed code, but does not specify the resolution mechanism. Resolution: conflicts are surfaced during Q&A review. The orchestrator presents both the old [authored] text and the new code behavior. User decides: update authored section, or note the discrepancy. This is a Q&A interaction, not a blocking gate.

### P3 — Minor (note and move on)

**P3-A: Staleness detection is advisory only.** No automated guard checks `built-from-code-at:` SHAs. Code can change without re-running doc-phase. Acceptable for Phase 5 -- on-demand regeneration is a deferred future enhancement.

**P3-B: Gate doc sparse coverage creates false confidence.** Pass 3 validating against 7 universal constraints and 5 glossary terms provides real but limited coverage. The validation pass should report what it checked against, making sparse coverage visible rather than hiding it.

**P3-C: One-hop discovery false positives from broad grep matching.** Grepping for "parser" in flow docs may match WHY blocks discussing why the parser was NOT used. Since impact flags are advisory-only (not auto-rewritten), this is low severity. User filters during Q&A.

---

## 3. Gaps

| Gap | Impact | Confidence | Classification | Action |
|-----|--------|------------|----------------|--------|
| Chunking strategy for features touching >20 files | MEDIUM -- quality degrades at high file count | MEDIUM | risk-accept | Single agent handles 90%+ of features. For >20 files, orchestrator could split into module-docs spawn + flow-docs spawn. Document as soft limit warning, not hard block. |
| Whether [authored] tag parsing survives manual doc editing | MEDIUM -- human editors may remove tags | MEDIUM | risk-accept | Default untagged sections to [authored] (safe default -- never overwrite uncertain content). Pass 1 validates tag presence. |
| SUMMARY.md key-files completeness | LOW -- mitigated by git diff supplement | HIGH | resolved | Orchestrator merges SUMMARY.md key-files with git diff --name-only. |
| Self-validation reliability (same LLM validates own output) | MEDIUM -- inherent LLM limitation | MEDIUM | risk-accept | Q&A user review is the true safety net. 3-pass validation catches deterministic errors; user catches semantic errors. |
| No FRONTMATTER_SCHEMA for docs type | LOW -- no consumer exists | HIGH | defer | Optional infrastructure. Doc agent's 3-pass self-validation covers structural compliance. Add schema if frontmatter validation becomes useful later. |
| Context window pressure for very large features (40+ files) | LOW -- rare scenario | MEDIUM | defer | ~115k tokens for 20 files leaves 85k for reasoning. 40+ files would need batching. Cross that bridge when reached. |

---

## 4. Constraints Discovered

**Hard constraints (cannot change):**

1. **Doc agent is role_type: executor (Sonnet)** -- model-profiles.md explicitly assigns "Documentation writer: executor: Sonnet". No Opus-tier judgment available inside the agent. 3-pass validation must work within Sonnet's capabilities.
2. **Subagents cannot spawn subagents** -- all 3 validation passes run sequentially within a single agent context. No splitting generation and validation into separate agent spawns (unless orchestrator does the splitting).
3. **File-based result collection only** -- doc agent writes to `.documentation/` on disk. Orchestrator verifies file existence, then presents for Q&A.
4. **Agent definitions are identity documents, not execution scripts** -- no "Step 1, Step 2" logic in the agent body. The workflow controls execution order.
5. **Context provided by orchestrator, not fetched by agent** -- file paths, review artifacts, and FEATURE.md references injected at spawn time.
6. **CommonJS only** -- any CLI tooling (init doc-phase, heading validation) must be `.cjs` with `require()`.
7. **AskUserQuestion header max 12 characters** -- "Doc 1/3" format for Q&A review.
8. **Q&A happens in orchestrator, not in subagent** -- doc agent cannot interact with user.
9. **Heading templates are strict and locked** -- canonical format for grep consistency. Deviation breaks downstream search.
10. **Section ownership tags mandatory** -- every section tagged [derived] or [authored]. No exceptions.
11. **One-way cross-referencing only** -- flows reference modules. Modules do NOT link back to flows.
12. **Gate docs are validation inputs, not agent outputs** -- agent reads but never writes gate doc content.

**Soft constraints (workarounds exist):**

1. **~1500 token agent definition** -- can reference external template to stay within budget. Synthesizer precedent allows up to ~2000 if justified.
2. **SUMMARY.md key-files incompleteness** -- supplemented with git diff --name-only.
3. **Gate doc sparse coverage on first runs** -- validation reports what it checked against, making coverage explicit.

---

## 5. Recommended Scope

Phase 5 delivers the documentation pipeline: agent definition, CLI init command, docs template, workflow orchestration, and slash command.

### Deliverables

**3 plans (already defined), 2 waves:**

| Plan | Wave | Delivers | Requirements |
|------|------|----------|-------------|
| 05-01 | 1 | Doc agent definition (`gsd-doc-writer.md`) + gate doc scaffolding (`.documentation/gate/`) | DOCS-01 |
| 05-02 | 1 | `init doc-phase` CLI command + docs.md template rewrite | DOCS-02 |
| 05-03 | 2 | Doc-phase workflow + slash command | DOCS-01, DOCS-02, DOCS-03 |

**Wave 1 (parallel):** Agent definition + gate docs AND init command + template. These have no dependency on each other.

**Wave 2 (sequential):** Workflow + slash command. Depends on both wave 1 outputs -- the workflow spawns the agent (05-01) and calls init (05-02).

### Key artifacts

**Doc agent (`agents/gsd-doc-writer.md`):**
- role_type: executor (Sonnet)
- Reads: code files, review artifacts (synthesis.md), FEATURE.md, gate docs
- Writes: `.documentation/modules/*.md`, `.documentation/flows/**/*.md`, `{phase_dir}/doc-report.md`
- 3-pass self-validation before presenting output
- Section ownership parsing for incremental updates
- Processing order: modules first, then flows (dependencies-first)

**Gate doc scaffolding:**
- `.documentation/gate/constraints.md` -- 7 universal seed constraints from CONTEXT.md
- `.documentation/gate/glossary.md` -- 5 universal seed terms from CONTEXT.md
- `.documentation/gate/state.md` -- template from CONTEXT.md
- All entries tagged `[manual]`
- Created once, human-maintained thereafter

**CLI init command (`cmdInitDocPhase`):**
- Pattern: mirrors `cmdInitReviewPhase` in init.cjs
- Returns: doc_agent_path, phase_dir, modified_files[], review_artifact_paths, feature_paths, git_sha, gate_docs_exist
- Registered in gsd-tools.cjs dispatch

**Docs template rewrite (`templates/docs.md`):**
- v1 structure (design/features/lessons) completely replaced
- v2 structure: module template + flow template with strict heading formats
- Ownership tags on every section
- Frontmatter with `built-from-code-at:` SHA field

**Doc-phase workflow (`workflows/doc-phase.md`):**
- Single-agent spawn pattern (not gather-synthesize)
- Init -> scaffold gate docs if missing -> context assembly (L1-L3) -> spawn doc agent -> verify output -> Q&A review -> commit
- Simpler than review-phase: 1 agent (not 5), no synthesizer, no re-review cycling

**Slash command (`commands/gsd/doc-phase.md`):**
- Entry point mirroring review-phase.md command structure
- Invocable from Phase 6 pipeline workflows

### What NOT to build

- Emergent docs (error taxonomy, change protocol, dependency manifest) -- grow organically
- On-demand doc regeneration command -- future enhancement
- Gate doc content beyond universal seeds -- human responsibility
- Function-level API reference -- belongs in code
- Full codebase scanning -- never
- FRONTMATTER_SCHEMA for docs type -- optional, no consumer exists
- Automated staleness checking -- advisory SHA stamps only

### Critical implementation guidance

1. **Module docs before flow docs** -- the agent must process in dependency order. DocAgent research proves ~8% truthfulness improvement.
2. **Pass 2 is non-negotiable** -- referential integrity checking is the single highest-value validation step. Without it, ~5% of code references will be hallucinated.
3. **Default untagged sections to [authored]** -- safe default prevents silent overwrite of human work when tags are accidentally removed.
4. **WHY blocks only from cited review findings** -- uncited reviewer speculation must not become documented rationale.
5. **Report validation coverage explicitly** -- "checked 7 constraints, 5 glossary terms, 0 state entries" is honest. Silent pass on empty gate docs creates false confidence.
6. **Case-sensitive heading enforcement** -- `## Module: parser` vs `## Module: Parser` breaks grep consistency. Pass 1 must enforce exact case matching.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCS-01 | Reflect-and-write agent reads actual built code after review acceptance | DOMAIN-TRUTH: LLMs understand syntax > semantics; 3-pass CoVe validation with external anchors. PRIOR-ART: DocAgent proves dependencies-first ordering improves truthfulness ~8%. TECH-CONSTRAINTS: Sonnet executor, single agent, file-based results. EDGE-CASES: hallucination rate ~5% even with verification; Pass 2 + Q&A review as defense layers. |
| DOCS-02 | .documentation/ directory with per-capability/feature reference docs | EXISTING-SYSTEM: v1 template incompatible, full rewrite needed. DOMAIN-TRUTH: section ownership prevents human-judgment loss. TECH-CONSTRAINTS: frontmatter CRUD available, git SHA trivial. EDGE-CASES: [authored] tag parsing fragility mitigated by Pass 1 structural check. |
| DOCS-03 | Documentation optimized for quick lookups and mgrep searches | DOMAIN-TRUTH: documentation ROI collapses without near-zero lookup time. USER-INTENT: heading templates, canonical anchors, ownership tags are machine-parseable. PRIOR-ART: module-level granularity matches LLM accuracy boundary. EDGE-CASES: heading drift caught by Pass 1; one-way cross-refs prevent O(N*M) maintenance. |

---

*Synthesized: 2026-02-28*
*Phase: 05-documentation*
*All 6 research dimensions covered. No blocked gaps.*
