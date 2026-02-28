# Phase 4: Review Layer — Synthesized Research

**Synthesized:** 2026-02-28
**Sources:** DOMAIN-TRUTH, EXISTING-SYSTEM, USER-INTENT, TECH-CONSTRAINTS, EDGE-CASES, PRIOR-ART
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Verdict scale**: 3-level: met / not met / regression (no "partially met" — too subjective)
- **Regression subtypes**: Both proven (test fails, removed function) and suspected (code analysis), clearly labeled so synthesizer can weight them differently
- **Finding evidence**: Every finding cites file:line, quotes relevant code/behavior, and explains reasoning. Findings without evidence are not actionable
- **Severity assignment**: Reviewers do NOT assign severity — they report verdicts and findings only. Synthesizer assigns severity (blocker / major / minor) after seeing all 4 reports with full context
- **Conflict resolution**: Synthesizer uses judgment first, priority ordering (user > functional > technical > quality) as tiebreaker. Spot-checks reviewer findings by reading cited file:line references before presenting. Overlapping findings from different reviewers presented separately. Mandatory conflicts section includes both outright disagreements and tensions
- **User presentation**: Findings presented one-at-a-time (consistent with Phase 3 Q&A pattern). 5 response options per finding: Accept / Accept w/ Edit (freeform) / Research (freeform) / Defer / Dismiss. Any "Accept" or "Accept w/ Edit" triggers re-review of affected areas after fixes applied. Max 2 re-review cycles, then surface remaining issues for manual resolution
- **End-user reviewer posture**: Literal and unforgiving — acceptance criteria demonstrably pass or they don't. User's proxy, not the developer's ally. Deviations flagged even if "better" than spec
- **Functional reviewer posture**: Behavior contract enforcer — does the code implement specified behaviors correctly? Focus: input/output contracts, state transitions, error handling paths
- **Technical reviewer posture**: Spec compliance + feasibility — did implementation follow the technical spec? Documents spec-vs-reality gaps where the spec was wrong/infeasible
- **Code quality reviewer posture**: Hardest to please — default posture is "prove this complexity is necessary." Opinionated about outcomes (simplicity, readability, maintainability), NOT preferences. Judges against the ideal, always. Unnecessary dependencies are in scope
- **Reviewer layer scoping**: Each reviewer's primary focus is its own REQ layer (EU-xx, FN-xx, TC-xx respectively). May flag cross-layer concerns as secondary observations
- **Framing-aware review**: All 4 reviewers keep equal weight across framings. Framing-specific review prompts injected by the workflow, NOT baked into agent definitions
- **Agent sizing**: All reviewer and synthesizer agents ~1500 tokens max per agent definition

### Claude's Discretion
- Exact trace report structure (as long as it includes verdict, evidence, and REQ mapping)
- How to detect regressions (diff analysis, test results, behavioral comparison)
- Synthesizer's internal consolidation algorithm

### Deferred Ideas
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVW-01 | 4 parallel specialist reviewers: end-user, functional, technical, code quality | Validated by domain research (FP-2: parallel isolation prevents anchoring bias; VA-2: specialists outperform generalists), prior art (Qodo 2.0, Google ADK fan-out), and tech constraints (Task tool supports 4+ parallel spawns). Gather-synthesize.md is the orchestration pattern. |
| REVW-02 | Each reviewer produces trace report: per-requirement verdict (met / not met / regression) | **MISALIGNMENT**: REQUIREMENTS.md says "met / partially met / not met / regression" (4-level). CONTEXT.md removes "partially met." CONTEXT.md is authoritative. ROADMAP.md success criteria #2 also says "partially met" and adds reviewer-assigned severity — both overridden by CONTEXT.md. Domain research validates 3-level scale (VA-1: binary-like scales produce higher inter-rater agreement). |
| REVW-03 | End-user reviewer traces against story + acceptance criteria | Supported across all dimensions. Evidence-gated tracing validated (FP-1, UC-1). Literal/unforgiving posture locked in CONTEXT.md. |
| REVW-04 | Functional reviewer traces against behavior specs | Same structural principle as REVW-03. Layer-specific scoping validated (FP-4). |
| REVW-05 | Technical reviewer traces against implementation specs | Same structural principle as REVW-03. Also documents spec-vs-reality gaps per CONTEXT.md. |
| REVW-06 | Code quality reviewer traces for DRY, KISS, no over-complexity, no bloat, no obsolete code | CONTEXT.md broadens scope beyond REVW-06 text: adds dependency scrutiny, judgment-based assessment, "guilty until proven innocent" posture. Domain research flags this as highest hallucination risk (DR-2: judgment-based criteria give LLM more room to fabricate). Mitigated by synthesizer severity assignment and lowest priority ranking. |
| REVW-07 | Synthesizer consolidates 4 trace reports, verifies findings, resolves conflicts (priority: user > functional > technical > quality) | Validated by domain (FP-3: investigation and adjudication are different cognitive tasks; VA-3: synthesizer-as-judge is canonical). Prior art confirms (Qodo 2.0 judge pattern). Tech constraints: synthesizer spot-checks by reading files, cannot spawn sub-agents. |
| REVW-08 | Synthesized recommendations presented to user for decision | Plan-phase Q&A pattern (step 9.5) is the base. Extended to 5 response options + re-review cycling. AskUserQuestion tool available in orchestrator only. 12-character header limit applies. |
</phase_requirements>

## 1. Consensus

- **Parallel reviewer isolation is non-negotiable** — anchoring bias (37% decision variation when reviewers see each other's work) makes shared state between reviewers a correctness issue, not a preference. — [DOMAIN-TRUTH FP-2, citing AgentReview EMNLP 2024; PRIOR-ART Google ADK fan-out pattern; TECH-CONSTRAINTS file-based result collection]

- **Evidence-gated findings are the primary hallucination defense** — LLMs produce incorrect code review findings at 29-45% rates without grounding. Every finding must cite file:line + quoted code + reasoning. Findings without evidence are discarded before synthesis. — [DOMAIN-TRUTH FP-1, UC-1; PRIOR-ART evidence-gated pattern from CodeRabbit/Qodo; EDGE-CASES spot-check failure mode]

- **Gather-synthesize.md is the orchestration pattern** — already parameterized for review use case, explicitly listed in reuse_examples. 4 reviewers as gatherers, review synthesizer as synthesizer. Context layering (0-4), failure handling (retry once, abort at >50%), and file-based result collection work unchanged. — [EXISTING-SYSTEM gather-synthesize analysis; TECH-CONSTRAINTS dependency capabilities; PRIOR-ART Google ADK parallel pattern]

- **Reviewer agents are ~1500-token identity documents, not execution scripts** — same skeleton as research agents: YAML frontmatter (name, description, tools, role_type, reads, writes) + Role/Goal/Success Criteria/Scope/Output Format. No step-by-step logic, no framing-specific content, no embedded templates. — [EXISTING-SYSTEM v2 agent skeleton; TECH-CONSTRAINTS agent definition constraint; USER-INTENT AC-14, AC-15]

- **Synthesizer is heavier than research synthesizer** — additional responsibilities: severity assignment, spot-checking by reading cited files, mandatory conflicts section with tensions, overlapping findings preserved separately. ~2000 token budget justified (Phase 2 precedent). — [TECH-CONSTRAINTS synthesizer analysis; EXISTING-SYSTEM research synthesizer comparison; USER-INTENT AC-05 through AC-08]

- **3-level verdict scale (met / not met / regression) produces more reliable judgments** — removing "partially met" forces binary factual determination. LLM-as-judge research shows binary/near-binary scales have higher inter-rater agreement. — [DOMAIN-TRUTH VA-1, citing G-Eval research; USER-INTENT AC-02; TECH-CONSTRAINTS verdict constraint]

- **Reviewer prompts must be simple: verdict + evidence only** — adding explanation/correction requirements increases misjudgment rates. Reviewers do NOT propose fixes, assign severity, or suggest alternatives. — [DOMAIN-TRUTH UC-3, citing arxiv 2505.16339; PRIOR-ART anti-pattern: over-prompted verification; USER-INTENT AC-04]

- **Q&A presentation happens in the orchestrator workflow, not inside agents** — Task subagents cannot interact with the user. The synthesizer returns findings; the workflow presents them one-at-a-time via AskUserQuestion. — [TECH-CONSTRAINTS Q&A presentation flow; EXISTING-SYSTEM plan-phase Q&A pattern; USER-INTENT AC-09]

- **All reviewer agents use role_type: judge (Opus via inherit)** — reviewers need judgment, not just data gathering. resolveModelFromRole() already handles this mapping. Cost is higher than research gatherers (which used Sonnet) but justified by the judgment-based task. — [TECH-CONSTRAINTS model parameter values and feasibility table; EXISTING-SYSTEM ROLE_MODEL_MAP]

- **No external library dependencies** — review layer is an LLM orchestration pattern implemented through agent definitions and workflow scripts. — [PRIOR-ART libraries section; EXISTING-SYSTEM reuse analysis]

## 2. Conflicts

### P1 — Blocking

- **REVW-02 verdict scale: REQUIREMENTS.md vs CONTEXT.md** — REQUIREMENTS.md says "met / partially met / not met / regression" (4-level). CONTEXT.md explicitly removes "partially met" as too subjective (3-level). ROADMAP.md success criteria #2 also uses the 4-level scale. — Resolution: implement 3-level scale per CONTEXT.md (authoritative for implementation decisions). Flag REQUIREMENTS.md and ROADMAP.md for text update. [USER-INTENT misalignment finding; TECH-CONSTRAINTS compatibility issue]

- **ROADMAP.md success criteria #2: reviewer-assigned severity vs CONTEXT.md synthesizer-assigned severity** — ROADMAP.md says reviewers produce "finding severity (blocker / major / minor)." CONTEXT.md explicitly moves severity to synthesizer only. — Resolution: implement synthesizer-assigned severity per CONTEXT.md. Flag ROADMAP.md for text update. [USER-INTENT misalignment finding; TECH-CONSTRAINTS compatibility issue]

### P2 — Important

- **Re-review scope: full 4-reviewer re-run vs targeted re-review** — CONTEXT.md says "re-review of affected areas" but does not specify whether all 4 reviewers re-run or only affected ones. Full re-review = up to 15 total agent spawns (initial 5 + 2 cycles x 5). Targeted = 2-3 spawns per cycle. — Resolve during build: default to targeted re-review (only re-spawn reviewers whose domain was affected), with synthesizer always re-running. [USER-INTENT re-review scope risk; TECH-CONSTRAINTS re-review feasibility; EDGE-CASES re-review blast radius]

- **Code quality reviewer token budget tension** — the quality reviewer's complex posture (guilty-until-proven-innocent, dependency scrutiny, judge against ideal with context notes) may push to ~1700 tokens, exceeding the ~1500 budget. Other 3 reviewers fit comfortably. — Resolve during build: allow quality reviewer up to ~1700 tokens if needed; the ~1500 is a soft target, not a hard gate. [TECH-CONSTRAINTS token budget estimate; EDGE-CASES agent definition budget]

- **Synthesizer spot-check scope** — CONTEXT.md says spot-check, but exhaustive verification of all citations is wasteful. Synthesizer cannot spawn sub-agents for this (hard constraint). — Resolve during build: spot-check selectively — prioritize "not met" and "regression" verdicts over "met" verdicts. Sample 3-5 high-priority citations per reviewer. [TECH-CONSTRAINTS spot-check feasibility; DOMAIN-TRUTH UC-2 position bias]

### P3 — Minor

- **Gather-synthesize.md reuse examples list different reviewer names** — says "Correctness, Completeness, Security, Performance" but CONTEXT.md defines "end-user, functional, technical, code quality." — Note and move on: the reuse examples are illustrative. The workflow invocation uses CONTEXT.md names. No code change needed in gather-synthesize.md. [EXISTING-SYSTEM undocumented assumption; TECH-CONSTRAINTS compatibility issue]

- **Deferred/Dismissed finding persistence** — CONTEXT.md defines Defer and Dismiss as response options but does not specify where these findings persist after exiting the review loop. Phase 3 Q&A has no equivalents. — Note and move on: log in review artifact with label. Not blocking for Phase 4 design. [USER-INTENT ambiguous scope item]

## 3. Gaps

| Gap | Impact | Confidence | Classification | Action |
|-----|--------|------------|----------------|--------|
| Framing-specific reviewer question files do not exist yet (`framings/{framing}/reviewer-questions.md`) | high | high | defer | Phase 6 (WKFL-07) populates these. Phase 4 designs reviewer agents to work without framing injection, with a context slot for Phase 6. |
| No `review-phase` command or workflow exists | high | high | proceed | New artifacts to create: `commands/gsd/review-phase.md` + `get-shit-done/workflows/review-phase.md`. Pattern well-established from plan-phase and execute-phase. |
| No reviewer agent definitions exist | high | high | proceed | Create 4 new agents: `gsd-review-enduser.md`, `gsd-review-functional.md`, `gsd-review-technical.md`, `gsd-review-quality.md` + 1 synthesizer: `gsd-review-synthesizer.md`. Agent skeleton from research agents is directly reusable. |
| Review template (`templates/review.md`) uses v1 verdict scale and reviewer types | high | high | proceed | Rewrite template: PASS/PARTIAL/FAIL/BLOCKED -> met/not met/regression. Domain/Code/Integration reviewers -> end-user/functional/technical/code quality. |
| Re-review trigger mechanism undefined | medium | medium | spike | Who triggers re-review after fixes — the review workflow or the execution workflow? Phase 4 must define the entry point; Phase 6 wires the full loop. Spike during planning. |
| Zero-findings report handling undefined | low | medium | risk-accept | Reviewer produces all-met report = valid outcome, not failure. Synthesizer treats empty findings + explicit met verdicts as success. Document in synthesizer spec. |
| Cross-feature regression trace table handling | medium | medium | risk-accept | Reviewer flags cross-feature regressions as secondary observations. Synthesizer includes them but they cannot be mapped in the current feature's trace table. Accept limitation, document. |
| `gsd-tools init review-phase` does not exist | medium | high | proceed | New switch case in `gsd-tools.cjs` following `init plan-phase` / `init execute-phase` pattern. Returns reviewer models, feature paths, config flags. |

## 4. Constraints Discovered

- **Subagents cannot spawn subagents** — Task calls are one level deep. The synthesizer cannot spawn follow-up agents to spot-check. Spot-checking must happen within the synthesizer's own context using Read/Grep tools. — [TECH-CONSTRAINTS hard constraint, sourced from execute-phase.md and Phase 2 research]

- **File-based result collection only** — orchestrator cannot receive agent output in its context. Reviewer agents must write trace reports to disk. Orchestrator verifies file existence, then passes paths to synthesizer. — [TECH-CONSTRAINTS hard constraint, sourced from Phase 2 TECH-CONSTRAINTS.md]

- **AskUserQuestion header max 12 characters** — finding presentation headers must be abbreviated (e.g., "Finding 1/7"). — [TECH-CONSTRAINTS hard constraint, sourced from questioning.md line 82]

- **Q&A interaction only available in orchestrator** — Task subagents cannot call AskUserQuestion. Finding presentation must be in the review-phase workflow, not inside the synthesizer agent. — [TECH-CONSTRAINTS hard constraint; EXISTING-SYSTEM plan-phase Q&A precedent]

- **CommonJS only for CLI tooling** — any review-related CLI code (report parsing, validation) must use `.cjs` with `require()`. — [TECH-CONSTRAINTS hard constraint from Phase 2]

- **Context provided by orchestrator, not fetched by agent** — reviewer agents receive file paths and context at spawn time. Agent definitions must NOT contain "read FEATURE.md" instructions. — [TECH-CONSTRAINTS hard constraint; AGNT-02 requirement]

- **Reviewer failure threshold: >=2 of 4 failures = abort synthesis** — 50% threshold from gather-synthesize pattern. With 4 agents, 1 failure proceeds with gap notation; 2 failures aborts. — [EDGE-CASES integration failure scenario; TECH-CONSTRAINTS feasibility table]

- **LLM requirement-conformance accuracy: 52-78% (best case 85% with behavioral comparison prompting)** — adequate for surfacing issues for human decision, NOT for autonomous pass/fail gating. GSD's user-decision design correctly accounts for this. — [PRIOR-ART requirement-conformance accuracy data, citing arxiv 2508.12358]

- **Regression detection is the hardest review task** — requires comparing two states (before/after), which is inherently harder than evaluating against an explicit spec. Regression verdicts will have highest false-negative rate. Proven vs suspected distinction is critical. — [DOMAIN-TRUTH DR-1]

- **Code quality review is the most hallucination-prone role** — judgment-based criteria (DRY, KISS) give the LLM more room to fabricate findings than spec-based criteria. Highest false-positive rate. Mitigated by lowest priority ranking and synthesizer severity assignment. — [DOMAIN-TRUTH DR-2]

## 5. Recommended Scope

- **Create 5 agent definitions** — 4 reviewers (`gsd-review-enduser.md`, `gsd-review-functional.md`, `gsd-review-technical.md`, `gsd-review-quality.md`) + 1 synthesizer (`gsd-review-synthesizer.md`). Use research agent skeleton. ~1500 tokens each (quality reviewer up to ~1700, synthesizer up to ~2000). All role_type: judge. — [Consensus on agent structure; existing agent skeleton; CONTEXT.md sizing decision]

- **Create review-phase workflow** — `get-shit-done/workflows/review-phase.md`. Follows gather-synthesize pattern: spawn 4 reviewers in parallel -> check files exist -> spawn synthesizer -> read synthesis -> present findings one-at-a-time via AskUserQuestion -> handle responses -> re-review loop (max 2 cycles). — [Consensus on orchestration pattern; TECH-CONSTRAINTS Q&A flow diagram; EXISTING-SYSTEM plan-phase precedent]

- **Create review-phase command** — `commands/gsd/review-phase.md`. References review-phase workflow. Follows pattern from plan-phase.md and execute-phase.md commands. — [EXISTING-SYSTEM command pattern]

- **Rewrite review template** — `get-shit-done/templates/review.md`. Update verdict scale (met/not met/regression), reviewer types (end-user/functional/technical/code quality), and frontmatter schema. — [EXISTING-SYSTEM template mismatch; EDGE-CASES template conflict]

- **Add `init review-phase` to gsd-tools** — new switch case in `gsd-tools.cjs` returning reviewer models, feature/capability paths, review config flags. Follows `init plan-phase` / `init execute-phase` pattern. — [EXISTING-SYSTEM gsd-tools init pattern; gap analysis]

- **Add review frontmatter schema** — extend `FRONTMATTER_SCHEMAS` in `frontmatter.cjs` with a `review` schema for validating REVIEW.md frontmatter. — [EXISTING-SYSTEM frontmatter CRUD reuse]

- **Design framing injection slot in reviewer agents** — reviewer agents work without framing context (default path). Include a documented slot where Phase 6 injects framing-specific question sets. Do NOT populate the slot in Phase 4. — [CONTEXT.md framing decision; TECH-CONSTRAINTS compatibility issue; gap analysis]

- **Two-phase verification prompting in reviewer agents** — reviewer should first internalize its requirement layer, then trace code against it. This separation improves accuracy from 52% to 85%. Structure the reviewer output format to enforce this separation. — [PRIOR-ART canonical pattern, citing arxiv 2508.12358]

- **Do NOT build**: framing question files (Phase 6), fix execution logic (executor domain), test suite generation (out of scope), auto-advance past review (out of scope).

---

*Phase: 04-review-layer*
*Synthesized: 2026-02-28*
