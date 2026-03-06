## User Intent Findings

### Primary Goal

Consolidate the pipeline so that review, doc, and progress stages operate at whatever scope was executed (one feature or full capability), absorb redundant orchestrator/research/requirements stages into fewer files, fix the broken execute-to-review auto-chain, and correct agent role-to-model mismatches -- all without increasing total lines of code. -- [source: FEATURE.md requirements EU-01 through TC-08; BRIEF.md problem statement]

### Acceptance Criteria

- **AC-1: Scope-fluid pipeline entry** -- Any command (/plan, /execute, /review, /doc) accepts both capability and feature slugs via slug-resolve. Pass: slug-resolve determines scope at entry; pipeline adapts behavior based on resolved scope. -- [source: FEATURE.md EU-01]

- **AC-2: Autonomous pipeline progression** -- Pipeline auto-chains plan->execute->review->doc without manual handoffs. Pass: plan finalization triggers execute; execute completion triggers review; review completion (no blockers) triggers doc. Human gates exist only at review findings Q&A and doc approval Q&A. -- [source: FEATURE.md EU-02, FN-08]

- **AC-3: Focus-aware progress routing** -- Progress identifies active focus groups, falls back to recent work then state scan, presents concrete `/gsd:*` commands. Pass: never suggests "add feature" when planning/execution is next; asks user when multiple parallel-safe paths exist. -- [source: FEATURE.md EU-03, FN-07]

- **AC-4: No CLI breakage** -- All gsd-tools CLI routes pass smoke test (valid JSON, no crashes). All 13 slash commands fire without error. Feature-scope and capability-scope commands both work. Existing artifacts remain compatible. -- [source: FEATURE.md EU-04, FN-09, TC-07]

- **AC-5: Scope-fluid review** -- 4 reviewers + 1 synthesizer receive the full execution-scope artifact list. Scope inferred from SUMMARY.md presence in feature directories (no new manifest). Code review ground truth is spec (FEATURE.md requirements). Pass: multi-feature execution produces 1 review cycle, not N. -- [source: FEATURE.md FN-01]

- **AC-6: Scope-fluid doc** -- 5 explorers + 1 synthesizer see full execution scope. Doc review ground truth is code (what was built). Approved recommendations executed by doc writer agents. Pass: multi-feature execution produces 1 doc cycle. -- [source: FEATURE.md FN-02]

- **AC-7: Review remediation loop** -- Accepted findings fed to existing planner -> remediation PLAN.md -> existing executor -> re-review at execution scope. Max 2 cycles. No new artifacts or patterns. Pass: remediation uses existing planning and execution patterns. -- [source: FEATURE.md FN-03]

- **AC-8: Research absorbed into plan** -- Plan stage spawns 6 parallel research gatherers + synthesizer (all 6, always). Research output feeds directly into planner. Single stage replaces current research + plan sequence. Pass: no separate research handoff; RESEARCH.md produced within plan stage. -- [source: FEATURE.md FN-04; TC-02]

- **AC-9: Requirements from discussion, not pipeline** -- Pipeline no longer has a requirements generation stage. Pipeline receives scope + requirements as input from upstream discussion. Pass: framing-pipeline Stage 2 (requirements generation) is deleted. -- [source: FEATURE.md FN-05; TC-03]

- **AC-10: Single pipeline orchestrator** -- framing-pipeline.md absorbs capability-orchestrator.md DAG logic. Capability scope: build DAG from CAPABILITY.md, plan+execute per feature in wave order, then review+doc once for full scope. Feature scope: plan->execute->review->doc. Lens from brief frontmatter, not force-injected. Pass: capability-orchestrator.md deleted; DAG wave ordering and cycle detection preserved in framing-pipeline.md. -- [source: FEATURE.md FN-06; TC-01]

- **AC-11: Per-feature review/doc loops removed** -- framing-pipeline.md no longer loops review+doc per feature. Single review + single doc invocation per pipeline run. review.md and doc.md internals unchanged. Pass: only the invocation pattern changes. -- [source: FEATURE.md FN-04 (labeled in trace as "Remove per-feature review/doc loops"); TC-04]

- **AC-12: Review/doc commands accept capability scope** -- /gsd:review and /gsd:doc no longer force `--type feature` on slug-resolve. Pass: both commands accept capability-scope slugs and pass capability-scope artifact lists to review.md/doc.md. -- [source: FEATURE.md TC-05]

- **AC-13: No net line increase** -- Total lines across modified files must not increase. Deletions (orchestrator, research-workflow, Stage 2, per-feature loops) offset any additions. No new files created. No new artifacts or manifests. Pass: `wc -l` sum of modified files <= sum before refactor. -- [source: FEATURE.md TC-06]

- **AC-14: Correct role-to-model mapping** -- Every agent frontmatter role_type matches actual function. Every workflow Task() call uses model= consistent with ROLE_MODEL_MAP (executor->sonnet, judge->inherit, quick->haiku). Specific fixes: 4 reviewer agents role_type judge->executor; gsd-planner role_type executor->judge. Pass: all 18 agents and all workflow Task() calls verified aligned. -- [source: FEATURE.md TC-08]

- **AC-15: Backward compatibility for deleted workflows** -- Callers of capability-orchestrator.md and research-workflow.md are updated to use consolidated paths. No orphaned references to deleted files. Pass: grep for deleted filenames returns zero results in any workflow, command, or agent. -- [source: FEATURE.md FN-09]

### Implicit Requirements

- **Execution-scope detection must be automatic** -- Pipeline detects whether scope is single-feature or multi-feature without user configuration. User describes this as "scope-fluid," meaning the system adapts. -- [First principles: "fluid" implies automatic adaptation, not user-configured mode switching; BRIEF.md "The pipeline detects and adapts"]

- **Reviewer/explorer agents themselves don't change structurally** -- Scope change happens in orchestration (what artifact lists get passed in), not agent definitions. Agents are already generic. Only frontmatter role_type corrections (TC-08) modify agent files. -- [source: BRIEF.md "agents/gsd-review-*: input expansion, not restructure"]

- **RESEARCH.md format unchanged** -- Research output format stays the same even though it's now produced inside plan.md instead of research-workflow.md. -- [source: FEATURE.md TC-02 constraints: "Research output (RESEARCH.md) format unchanged"]

- **FEATURE.md format unchanged** -- EU/FN/TC structure and format remain identical. Pipeline just receives them as input from upstream discussion. -- [source: FEATURE.md TC-03 constraints]

- **Existing behavioral invariants are sacrosanct** -- 4-reviewer domain split, 5-explorer doc split, gather-synthesize pattern, max 2 re-review cycles, lens propagation, escalation protocol all survive unchanged. -- [source: BRIEF.md "Load-bearing walls (preserve)"]

- **No tech-debt backlog** -- The brief mentioned auto-extracting minor findings to a tech-debt backlog. This was explicitly dropped during discussion. Not part of the feature. -- [source: FEATURE.md Decisions: "Tech-debt backlog: dropped. Simplification over additional artifacts."]

- **Auto-chain must handle context exhaustion gracefully** -- If context window is exhausted mid-pipeline, present next command for user to run in fresh context rather than failing silently. -- [source: FEATURE.md FN-08: "If context window is exhausted, present next command for user to run in fresh context"; EU-02 out of scope: "Forcing continuation when context window is exhausted"]

### Scope Boundaries

**In scope:**
- Scope-fluid review and doc (match execution scope, not hard-coded to feature)
- Research absorption into plan stage (delete research-workflow.md)
- Requirements stage removal (delete framing-pipeline Stage 2)
- Capability-orchestrator absorption into framing-pipeline (delete capability-orchestrator.md)
- Per-feature review/doc loop removal from framing-pipeline
- Relaxing review/doc command scope constraints
- Auto-chain wiring: plan->execute->review->doc with correct human gates
- Progress focus-aware routing rewrite
- Agent role_type/model mapping corrections (TC-08)
- CLI backward compatibility verification

**Out of scope:**
- Changing slug-resolve internals (EU-01 out of scope) -- [source: FEATURE.md EU-01]
- Adding new CLI routes (EU-04 out of scope) -- [source: FEATURE.md EU-04]
- Changing focus group creation/management (EU-03 out of scope) -- [source: FEATURE.md EU-03]
- Forcing continuation when context window exhausted (EU-02 out of scope) -- [source: FEATURE.md EU-02]
- Tech-debt backlog (dropped decision) -- [source: FEATURE.md Decisions]
- Creating new files or artifacts -- [source: FEATURE.md TC-06]
- Changing review.md/doc.md workflow internals (only invocation pattern changes) -- [source: FEATURE.md TC-04]

**Ambiguous:**
- **Progress ownership** -- BRIEF.md open question: "Should progress live in pipeline-execution or command-surface?" FN-07 is specified under this feature but progress-workflow.md might belong to a different capability. Recommendation: treat as in-scope for this feature since FN-07 requires it, but flag if capability boundaries matter later. -- [source: BRIEF.md open questions]
- **How auto-chain signals work across workflow boundaries** -- FN-08 says execute completion triggers review, but execute.md currently terminates with "user decides next steps." The mechanism for framing-pipeline to override execute.md's termination behavior is unspecified. Is it: (a) execute.md returns control to framing-pipeline which invokes review, or (b) execute.md itself invokes review? The feature says "fix the current wiring where execute.md terminates instead of returning to pipeline" which implies (a). -- [source: FEATURE.md FN-08]

### Risk: Misalignment

- **"No net line increase" vs. absorbing DAG logic** -- framing-pipeline must absorb capability-orchestrator's DAG wave ordering and cycle detection. This adds complexity to framing-pipeline. The offset comes from deleting capability-orchestrator.md and research-workflow.md entirely, plus removing Stage 2 and per-feature loops. If the deleted content is less than the absorbed content, TC-06 fails. The prior research gatherers should verify line counts. -- [source: FEATURE.md TC-06 vs TC-01/TC-02/TC-03/TC-04]

- **FN-04 dual meaning** -- FEATURE.md FN-04 is titled "Research absorbed into plan" but the trace table also lists a separate concept of "Remove per-feature review/doc loops." These are distinct changes bundled under one ID in some contexts. The planner must treat them as separate work items. -- [source: FEATURE.md FN-04 title vs TC-04 which is the actual per-feature loop removal]

- **Scope detection via SUMMARY.md presence** -- FN-01 says "Scope inferred from SUMMARY.md presence in feature directories." This is the only detection mechanism specified. If a feature has a SUMMARY.md from a prior incomplete run, it would be incorrectly included in scope. The planner should consider whether additional signals (e.g., SUMMARY.md recency or matching plan execution) are needed. -- [source: FEATURE.md FN-01 behavior; FEATURE.md Decisions: "Scope detection: inferred from SUMMARY.md presence"]

- **18 agents mentioned but only 17 exist in capability description** -- TC-08 says "Verify all 18 agents" while CAPABILITY.md says "all 17 agents." The planner needs to enumerate actual agents on disk to determine the correct count. -- [source: FEATURE.md TC-08 vs CAPABILITY.md "Owns" section]
