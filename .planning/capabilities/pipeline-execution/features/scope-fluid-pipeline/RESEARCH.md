---
lens: refactor
secondary_lens: debug
subject: pipeline-execution/scope-fluid-pipeline
date: 2026-03-05
---

# Research Synthesis

**Synthesized:** 2026-03-05
**Subject:** pipeline-execution/scope-fluid-pipeline
**Gatherer Results:** 6/6 succeeded

## Consensus

Findings agreed upon by multiple gatherers. Higher confidence -- multiple independent analyses reached the same conclusion.

### Conditional Branch Orchestrator is the correct merge pattern

framing-pipeline.md absorbs capability-orchestrator.md as a scope-detection branch at entry. Capability scope: build DAG from CAPABILITY.md, plan+execute per feature in wave order, then review+doc once for full scope. Feature scope: linear plan->execute->review->doc. The two files share 80%+ structure; the unique DAG logic is ~40-60 lines. This matches Airflow's BranchOperator pattern expressed in prose.

[Sources: Domain Truth, Existing System, Prior Art, Tech Constraints]

### plan.md already owns research -- Stage 1 is a duplicate

plan.md Step 5 (lines 59-166) contains the complete 6-gatherer + synthesizer spawn with lens-aware RESEARCH.md reuse checking. framing-pipeline.md Stage 1 is an identical duplicate. Removing Stage 1 eliminates duplicate-run risk and is zero-risk since plan.md is the sole invocation path post-refactor.

[Sources: Existing System, Tech Constraints, Domain Truth, User Intent]

### Reviewer and doc explorer agents are scope-agnostic -- zero agent definition changes needed

All reviewer agents (enduser, functional, technical, quality) and all doc explorer agents process whatever artifact list the orchestrator provides. Widening from single-feature to multi-feature input requires orchestration changes only, not agent changes. Only frontmatter `role_type` corrections (TC-08) touch agent files.

[Sources: Existing System, Tech Constraints, User Intent, Prior Art]

### SUMMARY.md presence is the correct scope-detection signal

SUMMARY.md is the execution output artifact (created by execute, consumed by review). Its presence per-feature directory indicates "executed." No new manifest artifact is needed. This aligns with artifact-based stage detection: filesystem artifacts ARE the state in a stateless LLM-interpreted system.

[Sources: Domain Truth, User Intent, Prior Art]

### The execute->review auto-chain gap is a design gap, not a bug

execute.md was written as a standalone workflow ("The workflow ends. The user decides next steps"). framing-pipeline.md was written later assuming execute returns control. The fix: when execute runs as a pipeline stage (not standalone), it returns cleanly so the orchestrator chains to review. Standalone `/gsd:execute` may not auto-chain, which is acceptable.

[Sources: Existing System, Prior Art, Edge Cases, Tech Constraints]

### Line budget is comfortable (TC-06)

| | Domain Truth | Existing System | Tech Constraints |
|---|---|---|---|
| **Deletions** | ~457 lines | ~532 lines | ~550 lines |
| **Additions** | ~150-200 lines | implicit | ~180 lines |
| **Net** | ~+260 freed | ~+532 freed | ~-370 net |

All three estimates agree: significant headroom exists. The variance is in how granularly each counted Stage 1/2 removal vs whole-file deletion.

[Sources: Domain Truth, Existing System, Tech Constraints]

### TC-08 role_type corrections are straightforward with one behavioral change

4 reviewer agents: `role_type: judge` -> `executor` (aligns with actual `model="sonnet"` spawn). gsd-planner: `role_type: executor` -> `judge` (aligns with judge-tier work). The planner change means `resolveModelFromRole()` returns `inherit` (Opus) instead of `sonnet`. This is the explicit intent of TC-08 but is a cost/behavioral change.

[Sources: Existing System, Tech Constraints, Domain Truth, Edge Cases]

### Context window exhaustion is the primary auto-chain risk

Plan runs 6 research agents + planner + checker. Execute runs N plan executors. By review time, the orchestrator's context is degraded. FN-08 specifies: "present next command for user to run in fresh context" as the fallback. Detection before quality degrades is the hard problem.

[Sources: Domain Truth, Tech Constraints, Edge Cases]

### Human gates belong only at review Q&A and doc approval

Pipeline stage transitions (plan->execute, execute->review) are mechanical handoffs that should auto-chain. Judgment points (review findings triage, doc approval) require human gates. Placing gates at handoffs creates friction; omitting them at judgment points creates runaway automation.

[Sources: Domain Truth, User Intent, Prior Art]

### Requirements generation belongs upstream in discussion, not in pipeline

Pipeline stages should be automatable with bounded interaction. Requirements generation is inherently iterative and exploratory. Removing Stage 2 aligns with the principle that pipelines process decided work. Pipeline receives scope + requirements as input.

[Sources: Domain Truth, User Intent]

### 8+ command files reference capability-orchestrator.md and must be updated

Exhaustive grep required. Files include: `commands/gsd/plan.md`, `commands/gsd/execute.md`, `commands/gsd/new.md`, `commands/gsd/refactor.md`, `commands/gsd/enhance.md`, `commands/gsd/debug.md`, plus `templates/codebase/structure.md` and `.documentation/` files. Missing one produces a silent read of a nonexistent file.

[Sources: Existing System, Tech Constraints, Edge Cases]

### DAG cycle detection must be ported verbatim

capability-orchestrator.md has explicit cycle detection with user resolution (lines 37-44). If not ported into framing-pipeline.md's capability-scope branch, circular feature dependencies silently loop or crash topological sort.

[Sources: Edge Cases, Existing System]

## Conflicts

### Planner model resolution mechanism

**Tech Constraints says:** plan.md uses `{planner_model}` from `init plan-feature` which calls `resolveModelInternal` (v1 path, defaults to sonnet). Changing role_type to judge won't change runtime model because v1 resolution is used.

**Edge Cases says:** Risk materializes only if v2 resolution (`resolveModelFromRole`) is adopted for the planner. Currently workflows use hardcoded `model=` from init output.

**Existing System says:** `init plan-feature` (init.cjs line 443) calls `resolveModelFromRole` for the planner agent -- v2 path. Changing role_type WILL change model from sonnet to inherit.

**Resolution:** Existing System cites the specific code path (init.cjs:443 calling `resolveModelFromRole`). This is the v2 path. The planner model WILL change to inherit/Opus when role_type changes to judge. Tech Constraints and Edge Cases describe v1 resolution which applies to other agents but not the planner init. The planner change is intentional per TC-08 and model-profiles.md v2 table.

### Scope detection accuracy (SUMMARY.md staleness)

**Domain Truth says:** SUMMARY.md presence is sufficient and necessary. No additional manifest needed.

**Edge Cases says:** SUMMARY.md from a prior session (days ago) is indistinguishable from one executed minutes ago. Capability-scope review may include stale features.

**User Intent says:** FEATURE.md decision says "no new manifest artifact" but notes the planner should consider whether additional signals are needed.

**Resolution:** Both positions are correct at different scopes. For single-feature execution, SUMMARY.md presence is sufficient (the user knows what they just executed). For capability-scope review aggregating multiple features, staleness is a real risk. The "no new manifest" constraint from FEATURE.md is binding. Best mitigation within constraints: timestamp comparison (SUMMARY.md mtime vs current session) without creating a new artifact. Flag for the planner as an edge case to handle, not a design change.

### TC-06 strictness -- advisory or blocking?

**Edge Cases says:** "If additions exceed deletions, the constraint is advisory -- flag for review but don't block."

**User Intent says:** "Total lines across modified files must not increase" -- presented as a hard pass/fail.

**Resolution:** User Intent directly cites FEATURE.md TC-06 which states the constraint. It is a hard constraint. However, all line budget analyses show ~300+ lines of headroom, making violation unlikely. Treat as hard constraint per the spec.

## Gaps

### Missing Dimensions

None -- all 6 gatherers succeeded.

### Low-Confidence Findings

- **Progress focus group routing rewrite (FN-07)** -- Only Edge Cases and Existing System touch this in detail. progress.md expects `focus_groups` from init but it is never provided (dead code). The `active_focus` field in STATE.md is singular, not an array, which cannot represent overlapping focus groups. Rewrite scope is unclear. [Single-source depth: Existing System]

- **Review/doc output path for capability scope** -- Tech Constraints notes review traces go to `{feature_dir}/review/` and doc to `{feature_dir}/doc/`. For capability-scope, output location is unspecified (e.g., `{capability_dir}/review/`?). No gatherer fully resolved this. [Source: Tech Constraints]

- **Remediation loop (FN-03) pipeline-level depth budget** -- Edge Cases identifies that FN-03's "max 2 cycles" applies per review invocation, but remediation creates new plan->execute->review loops. No total-depth guard exists at the pipeline level. Only one gatherer covered this. [Source: Edge Cases]

- **framing-discovery.md handoff contract update** -- Existing System notes framing-discovery passes BRIEF_PATH, LENS, CAPABILITY_SLUG, FEATURE_SLUG, FEATURE_DIR. If framing-pipeline absorbs capability orchestration, a capability-scope variant (no specific FEATURE_SLUG) is needed. Coverage from one gatherer only. [Source: Existing System]

### Unanswered Questions

- **How does framing-pipeline detect "running as pipeline stage" vs "standalone invocation" for auto-chain behavior?** FN-08 requires execute to chain to review when under pipeline control but terminate normally when standalone. The mechanism is unspecified.

- **Where do capability-scope review/doc output artifacts land?** Feature-scope uses `{feature_dir}/review/`. Capability-scope needs a location. No gatherer resolved this.

- **How does context exhaustion get detected before quality degrades?** FN-08 says "present next command" but the detection mechanism (token counting, heuristic, `context-monitor.md` hook) is unspecified.

- **What is the correct agent count -- 17 or 18?** TC-08 says "verify all 18 agents" but CAPABILITY.md says "all 17 agents." Needs disk enumeration.

## Constraints Discovered

Hard limits the planner MUST respect. These are non-negotiable.

| Constraint | Source | Impact |
|-----------|--------|--------|
| Zero runtime dependencies, Node >= 16.7.0, CommonJS only | Tech Constraints | No ESM, no external libs, no Node 18+ APIs |
| No new files (TC-06) | Tech Constraints, User Intent | All changes in existing files. Zero new workflow/agent/artifact files |
| No net line increase (TC-06) | Domain Truth, Tech Constraints, User Intent | ~550 lines deletable, ~180 additions needed. Budget is positive but must be tracked |
| PLAN.md immutability | Tech Constraints | Remediation loop (FN-03) creates new plans, never modifies existing |
| State mutations only via gsd-tools CLI | Tech Constraints | No direct file writes for state changes in workflows |
| model= parameter: only sonnet/inherit/haiku | Tech Constraints | Cannot specify "opus" directly; use `inherit` for Opus tier |
| RESEARCH.md format unchanged | User Intent | Output format stays identical despite being produced inside plan.md |
| FEATURE.md format unchanged | User Intent | EU/FN/TC structure preserved; pipeline receives as input |
| Existing behavioral invariants preserved | User Intent | 4-reviewer split, 5-explorer split, gather-synthesize pattern, max 2 re-review, lens propagation, escalation protocol |
| review.md/doc.md internal workflows unchanged | User Intent | Only invocation pattern (what artifact list, how many times called) changes |
| `init feature-op` requires both capSlug and featSlug | Existing System | Capability-scope must iterate features calling init per feature, not add new init route |
| Auto-chain must present next command on context exhaustion | User Intent, Edge Cases | Silent degradation if not handled |
| No tech-debt backlog | User Intent | Explicitly dropped during discussion |
| Exhaustive grep for deleted file references | Edge Cases, Existing System | 10+ files reference capability-orchestrator, 5+ reference research-workflow |

## Recommended Scope

### Build (In Scope)

- **Scope-detection branch in framing-pipeline.md** -- Conditional at entry: if capability slug, build DAG + wave-order plan/execute per feature, then single review+doc. If feature slug, linear pipeline. Absorb DAG logic from capability-orchestrator.md (~40-60 lines). [Consensus: Domain Truth, Existing System, Prior Art, Tech Constraints]

- **Delete capability-orchestrator.md and research-workflow.md** -- After absorbing DAG logic and confirming plan.md owns research. Update all 10+ references across commands/, templates/, .documentation/. [Consensus: all 6 gatherers]

- **Remove framing-pipeline Stage 1 (research) and Stage 2 (requirements)** -- Stage 1 duplicates plan.md Step 5. Stage 2 moved to discuss-feature. [Consensus: Domain Truth, Existing System, Tech Constraints, User Intent]

- **Remove per-feature review/doc loops from framing-pipeline** -- Single review + single doc invocation per pipeline run. Scope inferred from SUMMARY.md presence across feature directories. [Consensus: User Intent, Domain Truth, Prior Art]

- **Fix auto-chain wiring** -- execute.md returns cleanly when under pipeline control. framing-pipeline chains plan->execute->review->doc with context-exhaustion fallback (present next command). Human gates only at review Q&A and doc approval. [Consensus: Domain Truth, Existing System, Prior Art, Edge Cases]

- **Relax review/doc command scope constraints** -- Remove `--type feature` from `commands/gsd/review.md`. Add capability-scope handling matching existing `commands/gsd/doc.md` pattern. [Consensus: Existing System, Tech Constraints, User Intent]

- **Fix TC-08 role_type mismatches** -- 4 reviewer agents: judge->executor. gsd-planner: executor->judge (intentionally changes model to inherit/Opus). [Consensus: Existing System, Tech Constraints, Domain Truth]

- **Update 8+ command files** -- Route capability-scope to framing-pipeline.md instead of deleted capability-orchestrator.md. Build checklist from grep, verify zero orphaned references post-refactor. [Consensus: Existing System, Tech Constraints, Edge Cases]

- **Port DAG cycle detection verbatim** -- From capability-orchestrator.md into framing-pipeline.md capability-scope branch. Include AskUserQuestion fallback. [Sources: Edge Cases, Existing System]

- **Progress focus-aware routing rewrite (FN-07)** -- Fix dead code (focus_groups never provided by init). Parse ROADMAP.md directly. Prioritize active focus groups, fall back to recent work then state scan. [Sources: Existing System, Edge Cases]

### Skip (Out of Scope)

- **Changing slug-resolve internals** -- Already works for both capability and feature. EU-01 explicitly excludes this. [Source: User Intent]

- **Adding new CLI routes** -- EU-04 excludes. No new init routes; iterate features with existing `init feature-op`. [Source: User Intent, Tech Constraints]

- **Changing review.md/doc.md workflow internals** -- Only invocation pattern changes. Agent definitions unchanged except role_type corrections. [Source: User Intent]

- **Tech-debt backlog** -- Explicitly dropped during discussion. [Source: User Intent]

- **State machine or runtime engine** -- Anti-pattern for LLM-interpreted prose. Artifact detection is the correct stateless approach. [Source: Prior Art]

- **Per-feature review with cross-feature aggregation layer** -- Doubles agent spawns. One review at execution scope catches cross-feature issues natively. [Source: Prior Art]

- **Chunked review for 8+ features** -- Viable future enhancement but not needed now. Typical capabilities are 3-5 features (~50k tokens, well within 200k). [Source: Tech Constraints]

### Investigate Further

- **Pipeline-stage vs standalone detection mechanism** -- How does execute.md know it's running under framing-pipeline (should return cleanly) vs standalone `/gsd:execute` (should present next steps)? Options: (a) pipeline passes a flag/env var, (b) execute always returns and standalone command wraps with next-steps logic. Planner should decide. [Gap: no gatherer resolved this]

- **Capability-scope review/doc output location** -- Feature-scope outputs to `{feature_dir}/review/`. Where does capability-scope output land? Options: (a) `{capability_dir}/review/`, (b) still per-feature with a capability-level synthesis. Planner should decide based on existing patterns. [Gap: Tech Constraints flagged, unresolved]

- **Context exhaustion detection strategy** -- `context-monitor.md` exists as a PostToolUse hook but is not integrated with pipeline transitions. Planner needs to determine whether to integrate it or use a simpler heuristic (e.g., stage count). [Gap: Edge Cases flagged]

- **Actual agent count (17 vs 18)** -- Enumerate agents on disk to resolve TC-08 verification target. [Gap: User Intent flagged]

- **SUMMARY.md staleness at capability scope** -- Timestamp comparison (mtime) is the lightest mitigation within the "no new artifacts" constraint. Planner should decide whether to implement or accept the risk for v1. [Conflict: Domain Truth vs Edge Cases, partially resolved]

- **Remediation loop total-depth budget** -- FN-03 caps re-review at 2 cycles per invocation but no pipeline-level guard prevents unlimited remediation->review loops. Planner should add a pipeline-level counter (max 2 outer loops). [Source: Edge Cases]
