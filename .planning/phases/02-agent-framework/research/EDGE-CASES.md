# Edge Cases: Agent Framework Boundary Conditions

**Phase:** 02-agent-framework
**Researched:** 2026-02-28
**Dimension:** Boundary conditions, failure modes, edge cases
**Confidence:** HIGH (grounded in actual codebase — frontmatter.cjs, core.cjs, plan files)

---

## Agent Definition Edge Cases

### 1. Malformed YAML Frontmatter

**Scenario:** Agent `.md` file has invalid YAML between the `---` delimiters — unclosed string, bad indentation, duplicate keys, or invalid characters.

**Impact:** `extractFrontmatter()` uses js-yaml with `FAILSAFE_SCHEMA`. Per `frontmatter.cjs` line 27-29: `yaml.load` throws, the catch block returns `{}`. This means `role_type` is absent from the result. `resolveModelFromRole()` then falls through to v1 `resolveModelInternal()`, which looks up the agent name in MODEL_PROFILES. A new v2 agent name (e.g., `gsd-research-domain`) will not be found in MODEL_PROFILES, so `resolveModelInternal` returns `'sonnet'` (the default). The agent runs, but silently — the malformation is not surfaced to the user.

**Recommended Handling:**
- `resolveModelFromRole()` should log a warning to stderr when `extractFrontmatter` returns `{}` for a file that exists and has `---` delimiters. Signal: file has frontmatter delimiters but parse produced empty object.
- Do not hard-fail: silently defaulting to sonnet is the correct safety behavior, but the warning prevents debugging confusion later.
- The YAML parse error is already written to stderr (line 29 in frontmatter.cjs) — confirm this is surfaced in agent spawn logs.

---

### 2. Agent Definition Exceeds ~1500 Token Target

**Scenario:** An agent body grows during authoring to 2000, 2500, or 3000 tokens — e.g., the synthesizer (allowed up to ~2000) or a future agent that accretes instructions.

**Impact:** No hard enforcement exists. Token budget is a guideline. Oversized definitions increase context consumption in every agent spawn. At 6 gatherers × 2500 tokens each, the gather phase consumes 15,000 tokens in agent definitions alone before any context layers. This crowds out Layer 1-4 context and pushes toward model context limits.

**Recommended Handling:**
- The `~1500 tokens (~400-500 words)` target should be documented as an enforced guideline in the agent definition schema, not just the plan task.
- The `02-01-PLAN.md` verification step (`wc -w`) already checks word count per gatherer. Keep this in the plan's `<verify>` block — it is the only enforcement point.
- Accept that synthesizer may run ~2000 tokens (per CONTEXT.md allowance). Do not enforce the same limit on judges.
- Warn when a definition exceeds 600 words during any future agent-creation task.

---

### 3. reads/writes Fields Reference Non-Existent Files

**Scenario:** An agent's frontmatter declares `reads: [capability-context]` but the orchestrator spawns it without providing that context — or the file path referenced does not exist at runtime.

**Impact:** `reads` and `writes` in v2 frontmatter are **declarative metadata** — they inform the orchestrator about what an agent expects, but the current framework has no runtime enforcement. The agent receives whatever the orchestrator injects. If expected context is absent, the agent either hallucinates, produces low-quality output, or flags gaps — depending on how well its body is written.

The `writes` field has a symmetric problem: if the path is wrong, the gatherer writes to the wrong location, the gather-synthesize workflow's existence check (`check each output_path exists`) fails, triggering the retry-once path.

**Recommended Handling:**
- Document that `reads`/`writes` are declarative, not enforced. The orchestrator is responsible for satisfying `reads` at spawn time.
- The gather-synthesize workflow should assert that each gatherer's actual output path matches the declared `writes` path after completion. Flag mismatch as partial failure.
- For missing read context (e.g., no CAPABILITY.md): the workflow should pass an explicit `<missing_context>` signal to the agent rather than silently omitting it. Agent can then note the gap in its output.

---

### 4. Agent Definition Has No Goal or Empty Goal

**Scenario:** An agent's body section is empty, omits the Goal sentence, or provides a one-word goal like "Research."

**Impact:** The agent runs with whatever context was injected but no steering. Output is unpredictable — could be too broad, too narrow, or entirely off-dimension. There is no parse-time validation of body content.

**Recommended Handling:**
- `02-01-PLAN.md` verification already checks for structural elements via grep. The plan's `<done>` criteria should explicitly verify the goal sentence exists.
- Consider a lightweight schema check during agent creation: grep for `Your goal is:` pattern as a signal that the goal section is present.
- Empty goal is more dangerous than missing `role_type` — it affects output quality, not just model selection. Treat it as a blocking issue during the creation task.

---

## Context Injection Edge Cases

### 5. No PROJECT.md (Missing Core Context)

**Scenario:** Layer 1 context assembly reads PROJECT.md but the file does not exist — either because the project was not initialized, or PROJECT.md was deleted.

**Impact:** Layer 1 is documented as "always include." If PROJECT.md is absent, the orchestrator has two options: error out, or inject an empty `<core_context>` block. With an empty block, every agent lacks project goals, stack constraints, and success criteria — output will be generic and project-unaware. This is particularly damaging for the User Intent and Domain Truth gatherers.

**Recommended Handling:**
- The gather-synthesize workflow (02-02-PLAN.md) should guard Layer 1 assembly: if PROJECT.md does not exist, fail with a clear error before spawning any agents. Do not silently proceed with empty context.
- Error message: "PROJECT.md not found. Run `gsd init` or verify `.planning/` directory is initialized before running research."

---

### 6. Requested Capability Context Does Not Exist

**Scenario:** The workflow attempts to inject Layer 2 (capability context) for a capability that has no CAPABILITY.md — either the capability was never created, or it was renamed.

**Impact:** `CAPABILITY.md` is absent, Layer 2 injection produces nothing. Agents working on a capability-scoped task have no capability-level constraints. Output quality degrades; agents may over-generalize or underscope.

**Recommended Handling:**
- Layer 2 is conditional ("when working on a capability"). The workflow should check file existence before inclusion.
- If CAPABILITY.md is missing but a capability name was provided: warn and proceed without Layer 2 rather than failing. Log: "Warning: CAPABILITY.md not found for [name]. Proceeding with core context only."
- This is a graceful degradation case — missing capability context is not a blocker.

---

### 7. Context Layers Conflict

**Scenario:** PROJECT.md declares the stack as "DuckDB + Python," but a CAPABILITY.md says "use SQLite for local caching." An agent receives both layers and encounters contradictory stack declarations.

**Impact:** The agent must choose which layer to believe. Without explicit priority rules, the agent may blend both, pick arbitrarily, or flag a conflict. This is particularly risky for Tech Constraints and Domain Truth gatherers.

**Recommended Handling:**
- The context layering architecture (Layer 1 → Layer 2 → Layer 3 → Layer 4) implies a zoom-in: more specific layers refine, not override, less specific ones. Document this explicitly in the gather-synthesize workflow: "Layer N+1 adds specificity to Layer N, not contradiction. If true conflict exists, it is a requirement gap — flag it as a Conflict in your output."
- Agents should not resolve layer conflicts themselves. They should surface them. Add to the citation requirement: "If context layers conflict, cite both and flag as a conflict."

---

### 8. Total Injected Context Exceeds Reasonable Budget

**Scenario:** A feature has a large FEATURE.md + requirements file, a large CAPABILITY.md, PROJECT.md is verbose, and active framing adds another document. The assembled context for a single gatherer might be 8,000-15,000 tokens before the agent definition or task context are added.

**Impact:** Model context window pressure. The 6 gatherers each receive the full context payload. At a 200K context window, this is manageable, but at high token counts per layer, agents spend significant context on background they may not use (e.g., the Edge Cases gatherer doesn't need the full requirements list).

**Recommended Handling:**
- The current design (each agent gets the same context payload) is intentional and correct for small-medium context sizes. Do not add per-agent context filtering — YAGNI.
- Document the recommendation: keep CAPABILITY.md and FEATURE.md under 500 tokens each. This is a content discipline issue, not a framework issue.
- If a specific gather run hits problems, the orchestrator can trim to core context + most relevant section. Flag this as a future concern, not a Phase 2 requirement.

---

### 9. First Run — No Capabilities Exist Yet

**Scenario:** The system is used for the first time (or after `gsd init`). No capabilities have been created. The gather-synthesize pattern is invoked with only Layer 1 context available.

**Impact:** This is actually the normal case for new-project and early research. Layer 2 and Layer 3 are optional. The workflow should operate correctly with only Layer 1. The gatherers produce more general findings — which is appropriate at this stage.

**Recommended Handling:**
- No special handling needed. Layer 2/3/4 are conditional. Document clearly that Layer 1-only operation is valid and expected on first use.
- The synthesizer should note in its output if only Layer 1 context was available — this signals to downstream agents that findings are capability-agnostic.

---

## Gather→Synthesize Failure Modes

### 10. One of Six Gatherers Fails (Standard Case)

**Scenario:** One gatherer times out, errors, or produces an empty output file. Per CONTEXT.md locked decision: "retry failed agent once, then proceed with partial results; synthesizer notes the gap."

**Impact:** 5 of 6 dimensions are covered. The synthesizer receives a manifest showing one failure. For most dimensions, a single missing gatherer is tolerable — the synthesizer can note the gap, and the planner treats the gap as a spike or risk-accept based on the confidence x impact matrix.

**Recommended Handling:**
- The gather-synthesize workflow must explicitly implement: check output file existence after each gatherer completes, retry once for missing/empty output, build manifest.
- The synthesizer prompt must include the manifest: "Gatherer [dimension] failed after retry. Treat its dimension as a Gap in the output."
- Define "empty output": file exists but is under 50 words, or file does not exist. Both count as failure.

---

### 11. Three or More of Six Gatherers Fail

**Scenario:** 3+ gatherers fail after their retry. The synthesizer receives a manifest with 3+ failures.

**Impact:** Partial synthesis is less meaningful when half the dimensions are missing. A synthesis from 3 dimensions (e.g., only Domain Truth, Existing System, User Intent) misses Tech Constraints, Edge Cases, and Prior Art — the three dimensions most likely to surface blocking information. Downstream planner may produce a flawed plan.

**Recommended Handling:**
- Add a failure threshold to the workflow: if >= 3 gatherers fail, do NOT proceed to synthesis. Instead, surface a structured error: "Gather phase failed: 3/6 dimensions unavailable. Retry or investigate gatherer failures before synthesizing."
- This threshold (50%) is the right call. Below 50%, partial synthesis is informative. At or above 50%, synthesis output is unreliable.
- Do not make this configurable — YAGNI. The 3/6 threshold is the right default.

---

### 12. Gatherers Produce Contradictory Findings

**Scenario:** Domain Truth gatherer concludes "SQLite is the right choice for this use case." Tech Constraints gatherer concludes "SQLite cannot handle the concurrency requirements."

**Impact:** Both findings arrive at the synthesizer. This is the synthesizer's primary job — identifying and ranking conflicts. The synthesizer should surface this as a P1 conflict (blocking — must resolve before build).

**Recommended Handling:**
- This is the designed behavior. No special handling needed.
- The synthesizer's scope definition must be explicit: "You adjudicate contradictions. A contradiction between gatherers is not an error — it is a signal."
- Conflicts get P1-P3 ranking. The planner must resolve P1 conflicts before task creation.

---

### 13. Gatherer Produces Zero-Content Output

**Scenario:** A gatherer completes successfully (no error, no timeout) but writes a file containing only a header, placeholder text, or "No findings in this dimension."

**Impact:** This is worse than a failure in some ways: the output file exists and is non-empty, so the failure detection logic (file existence check) passes. The synthesizer receives the file and must infer it has no useful content.

**Recommended Handling:**
- Redefine failure detection: check file exists AND word count > 50, not just file exists. An output under 50 words should be treated as partial failure.
- The synthesizer should be instructed: "A gatherer output with fewer than 3 findings is a partial result — note it in Gaps."
- Consider: the gatherer agent definition should make zero-content output hard to produce by requiring a structured output format with mandatory sections. If sections are empty, the agent must explain why (cite).

---

### 14. Synthesizer Itself Fails

**Scenario:** The Opus synthesizer times out, produces a truncated response, or errors mid-output.

**Impact:** No consolidated research output. The gather phase completed (6 gatherer files exist), but there is no synthesis. Downstream planning cannot proceed.

**Recommended Handling:**
- The synthesizer is not subject to retry-once logic per CONTEXT.md (that applies to gatherers). Add explicit policy: retry synthesizer once.
- If synthesizer fails twice: surface a structured error with the paths to all 6 gatherer output files. The user or orchestrator can manually initiate a second synthesis attempt with those paths.
- Do not attempt to auto-proceed without a synthesis — the downstream planner depends on the structured 5-section output.

---

### 15. Gatherer Timeout

**Scenario:** A gatherer agent takes too long — e.g., a WebSearch or Context7 call hangs, or the agent enters a read loop.

**Impact:** The orchestrator's Task tool spawn does not return. The gather phase stalls. The retry-once logic cannot trigger because the original call never completed — it's still pending.

**Recommended Handling:**
- This is a Claude Agent SDK concern, not a GSD framework concern. The Task tool has its own timeout behavior.
- From a GSD framework perspective: document that the workflow assumes spawned tasks will eventually complete or error. If a task hangs, the user must interrupt and re-run.
- The `analysis_paralysis_guard` in `gsd-executor.md` (5+ consecutive reads without action → stop) is a good pattern. Consider adding similar guidance to gatherer agent definitions: "If you have read 4+ sources without writing findings, write what you have now."

---

## Model Allocation Edge Cases

### 16. Opus Is Unavailable (API Error or Rate Limit)

**Scenario:** A judge agent (synthesizer, plan validator, reviewer) is spawned with `model: inherit` (Opus), but the API returns an error — rate limit, quota exceeded, service unavailable, or the session's primary model is not Opus.

**Impact:** The `inherit` pattern means the spawned task inherits the parent session's model. If the parent is running on Sonnet (e.g., Claude Code session with Sonnet selected), `inherit` gives the judge Sonnet, not Opus. This silently undermines the Executor/Judge model allocation: the judge runs on the same model as the executor.

**Recommended Handling:**
- The CONTEXT.md decision is "hardcoded mapping, not configurable." This is correct, but the `inherit` mechanism is a delegation to the session, not a guarantee of Opus.
- Document this explicitly in model-profiles.md: "The `inherit` model means the spawned agent uses the parent session's model. For judge semantics to hold, the orchestrating session must be running on Opus."
- No code change needed in Phase 2. The `resolveModelFromRole()` function correctly returns `'inherit'` for judges. The model selection is the user's responsibility at the session level.

---

### 17. Missing role_type in Agent Definition

**Scenario:** A v2 agent is written without a `role_type` field in frontmatter — either accidentally omitted or written before the field was defined.

**Impact:** `resolveModelFromRole()` detects absent `role_type` and falls through to `resolveModelInternal()`. The agent's name (e.g., `gsd-research-domain`) is looked up in MODEL_PROFILES. It will not be found (it's a new v2 agent), so `resolveModelInternal` returns `'sonnet'` (line 81 in core.cjs: "if (!agentModels) return 'sonnet'"). The agent runs on Sonnet. For executor agents, this is correct. For judge agents, this silently runs them on Sonnet instead of Opus — a quality degradation without a visible error.

**Recommended Handling:**
- `resolveModelFromRole()` should log a warning when a v2 agent (identifiable by having no entry in MODEL_PROFILES) lacks `role_type`. Signal: file has no `role_type` AND no MODEL_PROFILES entry.
- The `02-01-PLAN.md` verification does not check for `role_type` presence on all agents. Add: `grep -c "role_type:" agents/gsd-research-synthesizer.md` should return >= 1.

---

### 18. Unknown role_type Value

**Scenario:** An agent definition contains `role_type: reviewer` or `role_type: orchestrator` — values not in ROLE_MODEL_MAP.

**Impact:** `resolveModelFromRole()` per Plan 03 design: "Unknown role_type values default to sonnet." This is a safe fallback but silently degrades a potential judge to Sonnet.

**Recommended Handling:**
- The plan already handles this with a safe fallback. Accept the behavior.
- Log a warning: "Unknown role_type 'reviewer' in [agent]. Defaulting to sonnet. Valid values: executor, judge."
- Keep ROLE_MODEL_MAP to exactly two entries (executor, judge) for now. The framework is intentionally simple.

---

### 19. Cost Implications of Opus for All Judges

**Scenario:** Phase 4 review uses 4 parallel reviewers. Per the allocation table (02-03-PLAN.md), all 4 reviewers are `role_type: judge` — all run on Opus.

**Impact:** 4 simultaneous Opus calls during review. This is by design (quality gate), but the cost is significant compared to the research phase (6 Sonnet gatherers + 1 Opus synthesizer).

**Recommended Handling:**
- This is a Phase 4 concern, not Phase 2. Note it as a flag.
- The CONTEXT.md decision says "Judge = Opus." Accept the cost implication.
- If cost is a concern in Phase 4, revisit whether all 4 reviewers need Opus, or only the synthesizer. Do not pre-optimize now.

---

## Scope Constraint Edge Cases

### 20. Positive Framing Does Not Prevent Scope Creep

**Scenario:** An agent is told "You investigate boundary conditions and failure modes." This positive framing still leaves room for the agent to drift into general best practices, architecture opinions, or feature suggestions — things that belong to other gatherers.

**Impact:** Scope creep from a gatherer produces duplicate findings that the synthesizer must deduplicate, and increases the gatherer's output length (token budget creep). The synthesizer's deduplication load increases.

**Recommended Handling:**
- Positive framing alone is insufficient for tight scoping. Add a boundary signal to each gatherer definition: "You produce findings in [N] categories: [list]." This constrains the shape of output, not just the direction.
- The Edge Cases gatherer specifically should define: failure modes, boundary conditions, error handling gaps, race conditions. Not: architecture recommendations, library choices, feature suggestions.
- The synthesizer handles residual overlap. Accept that some cross-dimension bleed will occur — it is not a critical problem.

---

### 21. Mandatory Citations Cause Agent Refusal

**Scenario:** The Edge Cases agent is asked to reason about failure modes for a new capability. There are no existing files in the codebase to cite (nothing is built yet), and no web sources directly address this specific use case. The agent, following the citation requirement, either refuses to make claims or produces heavily hedged output.

**Impact:** The citation requirement ("every claim must cite its source") can paralyze an agent doing first-principles reasoning. First-principles conclusions do not always have a direct external citation.

**Recommended Handling:**
- The citation requirement needs an explicit carve-out: "Reasoned conclusions from first principles may be cited as '[First principles reasoning: chain of logic here]'. Not all claims require external sources — the requirement is traceability, not external validation."
- The Domain Truth agent (RSRCH-01) specifically owns first-principles thinking. Its citation format should explicitly allow: "First principles: [reasoning]" as a valid citation.
- Add this clarification to the citation requirement language in all gatherer definitions.

---

### 22. Agent Needs to Reason Beyond Provided Context

**Scenario:** A gatherer receives Layer 1-4 context but the answer to its research question requires knowledge not in any provided file — e.g., ecosystem best practices, library documentation, known failure modes for a given technology.

**Impact:** Per the design (AGNT-01, AGNT-02): agents use tools to supplement provided context. This is not an edge case — it is the designed operation. Agents have access to WebSearch, Context7, Grep/Glob. The provided context is a starting point, not a ceiling.

**Recommended Handling:**
- This is designed behavior. No handling needed.
- Clarify in the gatherer definitions: "Your provided context is your starting point. Use tools to extend it. Cite all tool-derived findings."

---

## Framing Edge Cases

### 23. No Active Framing (Default Behavior)

**Scenario:** The gather-synthesize pattern is invoked without a framing — e.g., during initial project research before any workflow framing is active. Layer 4 context would be empty.

**Impact:** Layer 4 is conditional ("when inside a workflow framing"). Empty Layer 4 means agents receive no framing-specific question sets. They research based on their intrinsic dimension scope only.

**Recommended Handling:**
- This is valid and expected behavior. Layer 4 absence = framework-mode research (general, not framing-specific).
- The workflow should make this explicit: "If no framing is active, omit Layer 4 context block entirely. Do not inject an empty block."
- Document: general research (no framing) produces broader findings than framing-specific research. Both are valid use cases.

---

### 24. Framing Files Don't Exist for a Given Framing Type

**Scenario:** The workflow attempts to load `get-shit-done/framings/debug/researcher-questions.md` for Layer 4, but that file has not been created yet (Phase 6 scope). 02-02-PLAN.md creates only `.gitkeep` files, not content.

**Impact:** Layer 4 injection for research agents during debug framing will fail until Phase 6. If the workflow does not guard for this, it may error or inject an empty file path.

**Recommended Handling:**
- The workflow must guard Layer 4 assembly: check if `{framing}/{role}-questions.md` exists before including it. If absent: log a warning and proceed without Layer 4.
- Warning: "Framing context for [debug/researcher] not found. Layer 4 omitted. Framing-specific guidance will be added in Phase 6."
- This is the expected state during Phase 2-5. Design for graceful omission, not failure.

---

### 25. Framing Spans Capabilities

**Scenario:** A "refactor" framing is invoked on a change that affects multiple capabilities. The workflow injects one CAPABILITY.md (Layer 2) but the framing context spans two or more capabilities.

**Impact:** Agents are scoped to a single capability context. Cross-capability concerns are invisible to agents that only see one capability's Layer 2. This is particularly problematic for the Existing System and Tech Constraints gatherers.

**Recommended Handling:**
- The current framework design is single-capability scoped. Cross-capability research is out of scope for Phase 2.
- If multi-capability framing is needed: the orchestrator can run two separate gather-synthesize instances (one per capability) and then merge at the planning layer. Do not add multi-capability injection to the framework now — YAGNI.
- Document this limitation explicitly in the gather-synthesize workflow.

---

## Integration Edge Cases

### 26. v2 and v1 Agent Definitions Coexist During Migration

**Scenario:** After Phase 2, v2 agents (`gsd-research-*.md` with `role_type`) exist alongside v1 agents (`gsd-planner.md`, `gsd-executor.md` without `role_type`). Orchestrators may call `resolveModelFromRole()` for both.

**Impact:** `resolveModelFromRole()` falls through to `resolveModelInternal()` for v1 agents — this is the designed behavior. However, if a v1 agent definition is passed to `resolveModelFromRole()` and its name is not in MODEL_PROFILES (e.g., a custom agent), it defaults to sonnet. This is correct but silent.

**Recommended Handling:**
- This is the designed coexistence pattern (per 02-03-PLAN.md). Accept the behavior.
- The fall-through path is covered. No additional handling needed in Phase 2.
- Phase 7 cleanup removes MODEL_PROFILES and makes `role_type` mandatory. Until then, the fallback is intentional.

---

### 27. Gather-Synthesize Used by Pipeline Not Needing All 6 Dimensions

**Scenario:** The review pipeline (Phase 4) uses the gather-synthesize pattern with 4 reviewers, not 6. The gather-synthesize workflow was designed around 6 agents (the research use case).

**Impact:** If the workflow hardcodes 6 as the gatherer count (e.g., "spawn 6 gatherers in parallel"), it breaks when called with 4. If it is truly parameterized via `gatherers[]` array, it works for any count.

**Recommended Handling:**
- The 02-02-PLAN.md specification explicitly requires parameterization: `gatherers[]` array — which agents to spawn and where they write. This is the correct design.
- Verify during implementation: no hardcoded "6" in the workflow. The failure threshold (>= 3 failures) should be expressed as `> len(gatherers) / 2` or `>= ceil(len(gatherers) / 2)`, not `>= 3`.
- The failure threshold for 4 reviewers becomes >= 2. For 6 gatherers it's >= 3. Parameterize the threshold, not the count.

---

### 28. Research→Plan Handoff Format Compatibility

**Scenario:** The synthesizer produces a RESEARCH.md (5 sections: consensus, conflicts, gaps, constraints, recommended scope). The planner agent (Phase 3) reads this file. If the planner expects a different format than what the synthesizer produces, the handoff breaks.

**Impact:** Format mismatch at phase boundaries is a classic integration failure. The synthesizer in Phase 2 defines the contract; the planner in Phase 3 must consume it. If these phases are developed independently, the contract may drift.

**Recommended Handling:**
- Define the synthesizer output format as a formal contract in the synthesizer agent definition — not just prose, but a structured template with section headings.
- The synthesizer definition must include the exact section headings: `## Consensus`, `## Conflicts`, `## Gaps`, `## Constraints Discovered`, `## Recommended Scope`.
- In Phase 3, the planner agent definition must explicitly declare it reads `[research-summary]` and reference the section structure it parses.
- This is the most important integration risk in Phase 2. If the format is ambiguous, the whole pipeline degrades silently.

---

### 29. Partial Research Output Consumed by Planner

**Scenario:** The synthesizer produces output with a manifest showing 2 failed gatherers. The planner receives this synthesis and creates a plan without realizing 2 dimensions were missing.

**Impact:** The planner may create tasks that conflict with the missing dimensions — e.g., plan a technical approach that the Tech Constraints gatherer (which failed) would have flagged as infeasible.

**Recommended Handling:**
- The synthesizer must prominently surface the manifest in its output: "Note: The following dimensions were not available: [Tech Constraints, Edge Cases]. Findings in the Gaps section reflect this absence."
- The planner agent definition (Phase 3) should check for manifest-reported gaps and flag them as "Gaps: investigate before implementation" in the plan output.
- This is a Phase 3 concern, but the synthesizer must make the gap visible — the planner cannot act on invisible information.

---

## Risk Matrix

| Edge Case | Severity | Likelihood | Priority |
|-----------|----------|------------|----------|
| Malformed YAML frontmatter (EC-1) | Medium — silent sonnet fallback | Low — YAML is simple | P3 — add stderr warning |
| Definition exceeds token budget (EC-2) | Low — performance, not correctness | Medium — accretes over time | P3 — document and verify |
| reads/writes reference nonexistent files (EC-3) | Medium — missing context, degraded output | Medium — filesystem state changes | P2 — workflow guards needed |
| Missing goal in agent body (EC-4) | High — unpredictable output | Low — creation-time issue | P2 — verify during task |
| No PROJECT.md (EC-5) | High — all agents produce junk | Low — requires bad state | P1 — fail loudly before spawning |
| Missing CAPABILITY.md (EC-6) | Medium — degraded context | Medium — during development | P2 — graceful omission + warning |
| Context layer conflict (EC-7) | Medium — agents choose arbitrarily | Low — well-structured projects | P2 — document priority rules |
| Context budget overflow (EC-8) | Low — manageable at current scale | Low — theoretical | P3 — document discipline |
| First-run no capabilities (EC-9) | None — designed behavior | High — every new project | None — designed behavior |
| One of six gatherers fails (EC-10) | Low — 5 dimensions covered | Medium — network/API flakiness | P2 — workflow implementation |
| Three or more gatherers fail (EC-11) | High — synthesis unreliable | Low — rare coincidence | P1 — threshold enforcement |
| Contradictory gatherer findings (EC-12) | None — designed behavior | High — expected | None — synthesizer handles |
| Zero-content gatherer output (EC-13) | Medium — silent pass through | Medium — agent quality issue | P2 — word count check |
| Synthesizer fails (EC-14) | High — no output, pipeline stalls | Low — single agent | P1 — retry once + structured error |
| Gatherer timeout (EC-15) | Medium — phase stalls | Low — tool-level concern | P3 — document, SDK handles |
| Opus unavailable / inherit semantics (EC-16) | Medium — judge runs on Sonnet | Low — session-dependent | P2 — document, no code fix |
| Missing role_type in v2 agent (EC-17) | Medium — silent Sonnet for judge | Medium — authoring mistake | P2 — warning + verify |
| Unknown role_type value (EC-18) | Low — safe fallback | Low — author error | P3 — warning |
| Opus cost for all reviewers (EC-19) | Low — cost, not correctness | High — by design | P3 — accept, revisit Phase 4 |
| Positive framing allows creep (EC-20) | Low — extra deduplication work | Medium — LLM tendency | P2 — add output shape constraints |
| Citations paralyze first-principles (EC-21) | Medium — hedged or refused output | Medium — strict citation reading | P1 — clarify citation format |
| Agent reasoning beyond context (EC-22) | None — designed behavior | High — every research run | None — designed behavior |
| No active framing (EC-23) | None — designed behavior | High — early phases | None — designed behavior |
| Framing files don't exist (EC-24) | Low — Layer 4 omitted | High — Phase 2-5 state | P2 — guard + warning |
| Framing spans capabilities (EC-25) | Medium — cross-cap blind spots | Low — specific scenarios | P3 — document limitation |
| v1/v2 coexistence (EC-26) | None — designed behavior | High — during migration | None — designed behavior |
| Gather-synthesize with != 6 agents (EC-27) | High — if hardcoded | Medium — review phase reuse | P1 — parameterize, no hardcoding |
| Research→Plan format mismatch (EC-28) | High — silent pipeline degradation | Medium — cross-phase development | P1 — define formal contract |
| Partial research consumed by planner (EC-29) | Medium — flawed plan | Medium — when gatherers fail | P2 — synthesizer surfaces manifest |

**Priority Key:**
- P1: Must be resolved before implementation. Blocking.
- P2: Should be resolved during implementation. Important.
- P3: Can be deferred. Nice-to-have or document-only fix.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| YAML parsing behavior | HIGH | Read actual frontmatter.cjs — exception handling behavior is code-confirmed |
| resolveModelFromRole fallthrough | HIGH | Read plan 03 specification — design is explicit |
| gather-synthesize failure policy | HIGH | CONTEXT.md locked decision — "retry once, then partial" |
| Framing file absence | HIGH | Plan 02 explicitly creates only .gitkeep — content is Phase 6 |
| Context layer priority | MEDIUM | Architecture documented in RESEARCH.md references but no enforcement code read |
| Opus inherit semantics | MEDIUM | Based on Claude Agent SDK patterns — `inherit` means parent session model |
| Citation paralysis risk | MEDIUM | First-principles reasoning vs strict citation is a known LLM behavioral pattern |
| Token budget enforcement | MEDIUM | Plan verification uses `wc -w` — no runtime enforcement |
| Cross-phase format contract | HIGH | Gap is real and visible from reading phase 02 vs phase 03 plan dependencies |
