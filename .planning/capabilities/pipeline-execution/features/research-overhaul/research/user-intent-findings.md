## User Intent Findings

### Primary Goal

Make research impossible to skip, impossible to shortcut, and smart enough to know when existing output is still valid — so the 6-gatherer parallel spawn actually happens every time it should. — source: `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/BRIEF.md` (Problem Statement + Desired Behavior)

---

### Acceptance Criteria

- **AC-1: Gatherers spawn in parallel.** When `plan.md` Step 5 runs research, exactly 6 Task() calls fire simultaneously, not sequentially, not delegated to a sub-orchestrator that spawns one. — Pass: 6 `research/` output files exist after research completes, each written by a distinct gatherer agent. — source: `BRIEF.md` Desired Behavior #1; `research-workflow.md` key_constraints line "All 6 gatherers always run"

- **AC-2: Research is mandatory in plan.md.** No combination of flags or config can cause `plan.md` to skip the research step. `--skip-research` flag and `research_enabled` config gate are both removed. — Pass: plan.md Step 5 has no conditional bypass path; `--skip-research` does not appear in the workflow. — source: `BRIEF.md` Delta table "Remove skip gates: --skip-research and research_enabled gates removed entirely"

- **AC-3: Research is mandatory in framing-pipeline.md.** Stage 1 of `framing-pipeline.md` cannot be skipped. — Pass: framing-pipeline.md Stage 1 has no skip condition; the research call is unconditional. — source: `BRIEF.md` Scope Boundary "Fix all other research-workflow.md callers"; `framing-pipeline.md` line 86 (current caller)

- **AC-4: Delegation pattern is unambiguous.** The instruction to invoke `research-workflow.md` is written in a form the model cannot interpret as "read and execute yourself" or "delegate to your primary collaborator." — Pass: research callers use explicit `Task()` pseudo-code (matching the pattern already used in `plan.md` Step 7) rather than `Invoke @{path}`. — source: `BRIEF.md` Prior Exploration "Step 7's explicit Task() block left no room for misinterpretation; Step 5's indirection did"; `plan.md` lines 60 vs 108-115

- **AC-5: Research reuse is lens-aware, not binary.** The `has_research` file-existence check is replaced with logic that evaluates whether existing `RESEARCH.md` was produced under the same (or compatible) lens as the current invocation. — Pass: if existing RESEARCH.md was generated under lens A and current lens is B (incompatible), research re-runs. If lens matches or is compatible, existing research is reused. — source: `BRIEF.md` Delta table "Smarter research reuse: Replace binary has_research check with lens-aware logic"

- **AC-6: All workflows audited.** Every `workflows/*.md` file has been inspected for the "Invoke @" or bare `@{path}` delegation anti-pattern in contexts where the model should be orchestrating agents. — Pass: audit produces an enumerated list of all instances found, with disposition (fixed / acceptable / not-applicable) for each. — source: `BRIEF.md` Scope Boundary "Codebase-wide audit of all workflows for the same anti-pattern; Fix all instances found"

- **AC-7: Invariant files unchanged.** `research-workflow.md`, `gather-synthesize.md`, the 6 gatherer agent definitions, and RESEARCH.md output format are not modified unless research explicitly recommends a change. — Pass: diff of those files shows no changes, or any change is traced to a research-phase recommendation. — source: `BRIEF.md` Invariants 1-5; Scope Boundary "Out" section

- **AC-8: Lens metadata is written to RESEARCH.md or its directory.** After research runs, there is a durable record of which lens was active, so the reuse check in AC-5 has something to compare against on subsequent invocations. — Pass: RESEARCH.md frontmatter or a sidecar file (e.g., `research/manifest.md`) contains lens identifier used during generation. — [First principles: if the reuse check must compare current lens against prior lens, the prior lens must be persisted somewhere — it cannot be inferred from file content alone]

---

### Implicit Requirements

- **IR-1: The fix must work without user intervention for the common case.** The user's complaint was that the model silently shortcut research — the fix cannot introduce a new user prompt asking "should I run research or reuse?" unless the lens comparison is genuinely ambiguous. — [First principles: replacing one friction point with a different friction point does not solve the problem; the user wants the system to be self-correcting]

- **IR-2: The Task() delegation pattern used in the fix must match the pattern already established in plan.md Step 7.** Consistency of delegation style within a single workflow is an implicit requirement of the project's DRY/KISS principles. — source: `BRIEF.md` Prior Exploration "Step 7's explicit Task() block"; `/Users/philliphall/.claude/CLAUDE.md` "DRY, KISS, YAGNI — no exceptions"

- **IR-3: The research step's model selection must still honor `researcher_model` from the init output.** Replacing "Invoke @" with Task() must not hardcode a model or drop the model configuration plumbing that currently feeds into step 5. — source: `plan.md` line 25 (`researcher_model` parsed from init JSON); [First principles: new delegation syntax changes form, not semantics — model selection must not regress]

- **IR-4: The audit of other workflows must distinguish between "ambiguous delegation that spawns agents" and "reference reading that the current context window executes."** Not all `@{path}` patterns are bugs — `required_reading` blocks are intentionally read by the current model. Only delegation that should spawn sub-agents is in scope for the fix. — source: `BRIEF.md` Open Questions "How many other workflows use ambiguous delegation?"; [First principles: `review.md` line 120 `@{GSD_ROOT}/get-shit-done/workflows/doc.md` for auto-advance is delegation; `plan.md` `@{GSD_ROOT}/get-shit-done/references/ui-brand.md` in required_reading is reference — these are categorically different]

- **IR-5: The lens-aware reuse logic must handle the framing-pipeline.md invocation path, not just the plan.md direct invocation path.** Both callers feed into the same research step; the reuse check must work regardless of entry point. — source: `BRIEF.md` "framing-pipeline.md — secondary fix target (Stage 1 research call)"

- **IR-6: Removing skip gates does not break mid-pipeline entry.** CAPABILITY.md documents that "mid-pipeline entry points work without prior stages." Removing `--skip-research` must not break a user who runs `/gsd:plan` directly on a feature that already has valid research. The reuse logic (AC-5) is the replacement mechanism for this use case. — source: `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/CAPABILITY.md` Decisions table "Mid-pipeline entry points work without prior stages"

---

### Scope Boundaries

**In scope:**
- Remove `--skip-research` and `research_enabled` gates from `plan.md` Step 5
- Replace ambiguous delegation in `plan.md` Step 5 with explicit `Task()` pseudo-code
- Fix the same delegation issue in `framing-pipeline.md` Stage 1
- Implement lens-aware research reuse to replace the removed `has_research` binary check
- Codebase-wide audit of all `workflows/*.md` files for ambiguous delegation patterns
- Fix every instance of the anti-pattern that the audit identifies
- Persist lens metadata alongside RESEARCH.md so reuse logic can compare lenses

**Out of scope:**
- Changing `research-workflow.md` content or structure (unless research recommends it)
- Changing `gather-synthesize.md` pattern
- Changing the 6 gatherer agent definitions
- Changing RESEARCH.md output format
- Adding new gatherer types or dimensions

**Ambiguous:**
- **Lens compatibility matrix:** The reuse logic needs to know which lens combinations are compatible (e.g., does /enhance research cover /debug needs?). No compatibility matrix is defined anywhere. Research should recommend an approach: user Q&A, automatic comparison, or a defined compatibility table. — source: `BRIEF.md` Open Questions "What's the right lens-aware research reuse logic?"
- **research-workflow.md restructuring:** The brief floats the idea of making research-workflow.md "pure reference documentation" if callers now carry explicit spawn instructions. Whether this is in scope for this feature or a follow-up is unresolved. — source: `BRIEF.md` Follow-ups "Consider whether research-workflow.md should become pure reference documentation"
- **Non-workflow files:** The brief asks whether agent definitions and skill definitions have the same anti-pattern. The audit scope says "all workflows" but the question about broader scope is left open. — source: `BRIEF.md` Follow-ups "Consider if the same issue exists in non-workflow files"
- **framing-pipeline.md invocations of plan.md, execute.md, review.md, doc.md:** These all use bare `@{path}` delegation (lines 169, 202, 244, 286). These are stage-level pipeline handoffs, not agent spawns — but they are structurally identical to the research anti-pattern. The audit must clarify whether stage handoffs are in the same category or not. — source: `framing-pipeline.md` lines 169, 202, 244, 286

---

### Risk: Misalignment

- **Risk-1: "Unambiguous delegation" might mean Task() in plan.md but something different in framing-pipeline.md.** plan.md Step 7 uses Task() for a single agent spawn. framing-pipeline.md calling research-workflow.md is not spawning a single agent — it is delegating to a sub-orchestrator that then spawns 6 agents. The Task() pattern may not directly map to this two-level delegation hierarchy. If Task() wrapping research-workflow.md means the model spawns one agent to run research-workflow, which then spawns 6 more, that requires the sub-agent to correctly orchestrate gather-synthesize — which is a different trust model than having the main orchestrator spawn the 6 directly. Research must determine whether the fix should: (a) have callers invoke research-workflow.md via Task() as a sub-orchestrator, or (b) inline the explicit 6-gatherer spawn into each caller's workflow. — source: `BRIEF.md` Open Questions "What is the right delegation pattern? Task() pseudo-code is the leading hypothesis. Research should validate."; `plan.md` Task() pattern lines 108-115 vs research-workflow.md's own gather-synthesize delegation

- **Risk-2: Removing all skip gates may conflict with the user's legitimate need to iterate quickly on plans without re-running research.** The stated intent is "no way to skip research" but the user's workflow context includes repeated plan revisions. The lens-aware reuse logic must be robust enough to cover the "same lens, research already done" case with zero friction — otherwise removing the skip gate creates a tax on iteration speed. If the reuse logic is wrong or slow, the user will feel worse off. — source: `BRIEF.md` "Research is mandatory — no skip gates exist" vs CAPABILITY.md "Mid-pipeline entry points work without prior stages"

- **Risk-3: The audit scope "all workflows" may produce a long list of instances that are actually correct behavior.** review.md line 120 uses `@{path}` to auto-invoke doc.md — this is a stage handoff that is intentional. If the fixer treats all `@{path}` patterns as bugs, correct orchestration will be broken. The acceptance criteria for the audit (AC-6) must include a defined criterion for "this is a bug" vs "this is correct." — source: `review.md` line 120 auto-advance; `framing-pipeline.md` lines 169, 202, 244, 286
