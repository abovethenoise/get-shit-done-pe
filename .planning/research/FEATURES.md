# Feature Research

**Domain:** AI coding assistant orchestration framework (meta-prompting, spec-driven development, multi-agent coordination)
**Researched:** 2026-02-28
**Confidence:** HIGH (ecosystem well-documented in 2025-2026; GSD v1 is the baseline artifact)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that the ecosystem has normalized. Missing these means GSD v2 registers as incomplete compared to Kiro, Cursor, and Windsurf conventions.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Context file conventions (CLAUDE.md / steering files) | Cursor `.cursorrules`, Kiro `.kiro/steering/`, CLAUDE.md — every tool has a persistent project memory layer. Users expect the framework to encode and reload project context across resets. | LOW | GSD v1 already has this via CLAUDE.md + STATE.md. V2 needs to extend it for capability/feature hierarchy. |
| Structured requirements before execution | Kiro mandates `requirements.md → design.md → tasks.md` before any code runs. Spec-driven development is now expected, not novel. Users who've tried Kiro or Cursor + spec-kit expect this. | MEDIUM | GSD v1 has REQUIREMENTS.md but a single flat format. V2's 3-layer model (story + functional + technical) is an upgrade, not invention. |
| Requirement-to-task traceability | Tasks must reference requirement IDs. "No orphan tasks" is the stated goal — Kiro enforces this structurally ("every generated line links back to its originating specification"). | MEDIUM | GSD v1 has REQ IDs in PLAN frontmatter; cross-referencing exists in verifier. V2 extends this to 3 layers. |
| Fresh context per work unit | GSD's core value proposition — proven. Context rot is identified as AI coding's primary bottleneck in 2026. All serious tools isolate context per task/agent. | LOW | Already in GSD v1. Carry forward. |
| Atomic git commits per task | Standard practice — Addy Osmani's workflow, GSD v1, all serious frameworks require this as the traceability anchor. | LOW | Already in GSD v1. Carry forward. |
| Post-execution verification | Every framework includes a verification step. Kiro has acceptance criteria, GSD has the verifier agent, Cursor uses Bugbot. "Task complete" ≠ "goal achieved" is an industry consensus. | MEDIUM | GSD v1 verifier is sophisticated. V2 must trace through 3 requirement layers. |
| State persistence across context resets | STATE.md pattern solves context window resets. Without this, work continuity collapses. All agent frameworks solve this (Windsurf's Cascade "persistent knowledge layer", Kiro's steering files). | LOW | GSD v1 STATE.md is the solution. Carry forward. |
| Model profile selection | Switching between quality/balanced/budget models per task type is standard. Kiro, Cursor, Claude Code all support model selection. | LOW | GSD v1 already has model profiles. Carry forward, extend for framing types. |
| Parallelization of independent work | Multi-agent parallel execution is table stakes in 2026. Cursor has 8 parallel subagents, Claude Code has Agent Teams, Windsurf has parallel tool calls. | MEDIUM | GSD v1 has wave-based parallel execution. V2 needs parallel reviewers specifically. |

### Differentiators (Competitive Advantage)

Features where GSD v2 can lead relative to Kiro, Cursor rules, and single-verifier frameworks. These are either absent from or poorly implemented by competitors.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Four workflow framings (debug / new / enhance / refactor) | No existing tool differentiates its workflow front-door by work type. Cursor has "agent mode" generically. Kiro is always spec-first (works for new, mismatches debug). GSD v2 gives each work type a distinct discovery phase that feeds the same pipeline. | MEDIUM | The value is in the discover-then-converge model. The four framings ask different questions before producing the same requirements → plan → execute → review chain. This is novel vs competitors. |
| 3-layer requirements (end-user / functional / technical) | Kiro separates requirements, design, and tasks — but those aren't requirement layers, they're sequential stages. The 3-layer model ensures every requirement is reviewable from three perspectives: does it serve the user, does it define behavior, does it constrain implementation? | HIGH | High complexity because the template system, planner agent, and all four reviewers must be requirement-layer-aware. High value because each reviewer can focus on their layer without guessing. |
| 4 specialist reviewers in parallel + synthesis | Current tools: GSD v1 has a single verifier. Kiro has acceptance criteria checks. Diffray runs 10+ specialist agents but is a SaaS code review product, not an orchestration framework. Nobody does 4 reviewers (end-user, functional, technical, code-quality) as part of a development workflow framework. | HIGH | diffray proves specialist-agent review outperforms monolithic review (87% fewer false positives, 3x more bugs). GSD v2 brings this inside the framework, not as external tooling. The synthesis step is what prevents noise. |
| Iterative self-critique before plan presentation | SELF-REFINE (2024 paper) showed 13-30% error reduction. Addy Osmani's workflow documents iterating plans before coding. No framework builds self-critique as a formal pipeline step. GSD v2's planner challenges its own draft on coverage, approach validity, feasibility, and surface assumptions before showing the user. | MEDIUM | Medium complexity — it's a prompt architecture change in the planner agent, not a new system. High value because it catches silent guessing, which is how AI frameworks produce plausible-looking but wrong plans. |
| Framing-aware agents (same agent, different question sets) | Most tools either have generic agents or separate agents per role. GSD v2's insight: the lens (debug vs new vs refactor) changes the questions, not the agent. This means no agent duplication while still getting framing-specific discovery. | MEDIUM | The framing context is the key — it's a context injection pattern, not agent proliferation. This keeps the system DRY while being framing-specific. |
| Reflect-and-write documentation from actual code | All tools generate docs from specs (before code). GSD v2 generates documentation after execution by reading what was actually built. This closes the spec-implementation drift gap. Kiro acknowledges the "spec-first maturity levels" problem; GSD v2 solves it by documenting final state, not intended state. | MEDIUM | The documentation agent reads the built codebase, not the plan. This is the differentiator — .documentation/ is a reference to reality, not an aspiration. |
| Full requirement traceability as a zero-tolerance constraint | Kiro has traceability as a feature. GSD v2 treats "no orphan tasks" as an invariant — if a task doesn't reference a REQ ID, it cannot proceed. This is a cultural and enforcement difference, not just a feature difference. | LOW | Enforcement is a planning and verifier rule, not new infrastructure. But it's a strong differentiator in practice because most frameworks let orphan tasks accumulate silently. |
| Capability/Feature hierarchy matching how work is actually scoped | Current GSD: milestone/phase. Competitors: project/repository. GSD v2: capability/feature. A capability is a user-facing ability (e.g., "search works"), a feature is a building block. This maps to how product people think, not how engineers structure code. | MEDIUM | Primarily a structural change in .planning/ directory layout and artifact naming. The hierarchy change is the differentiator; the artifact system is a carry-forward. |
| First-principles research with parallelized gather → synthesize | GSD v1 has research but it's a single-agent pass. V2 parallelizes gathering (multiple researcher agents on different dimensions) then synthesizes. Challenges assumptions from first principles rather than confirming hypotheses. | MEDIUM | The research synthesizer agent is new. The parallelization pattern exists in GSD v1's wave execution. This combines them for research specifically. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly not build. Each is a complexity trap that has burned other frameworks.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-advance through stages | "Reduce friction — don't make me type the next command." | Removes user from the control loop. Every orchestration framework that tried auto-advance (early Cursor agent mode, GSD v1 experimented with it and dropped it) discovered that silent progression past a broken stage compounds errors. The user's judgement is the quality gate between stages. | Explicit command per stage. User progression is intentional, not a bug. |
| Multi-AI runtime support (v2 scope) | "Port to Gemini CLI / Codex / OpenCode." | Claude Code's Task tool, agent spawning, and CLAUDE.md are the primitives GSD v2 is built on. Multi-runtime requires abstracting these primitives — which adds complexity without improving the Claude Code experience. PORT IS NOT IN SCOPE until the system is solid on one runtime. | Define clean interfaces so porting to other runtimes is possible later. Don't build the abstraction now. |
| Real-time collaboration features | "Multiple users working on the same capability concurrently." | Framework is designed for one user, one project, one conversation at a time. Concurrency on .planning/ artifacts requires locking, merge resolution, and conflict detection — a separate engineering problem. | Serial work. If two developers are using GSD, they have separate projects. |
| AI-generated test suites as part of orchestration | "Auto-generate tests alongside every plan." | Test generation belongs in the executor's domain, not the orchestrator's. When the orchestrator mandates test generation, it either produces tests that pass trivially (testing implementation, not behavior) or tests that fail constantly (wrong assumptions about the implementation). | Verifier agents check wiring and requirements coverage. Tests are the executor's responsibility, guided by the functional requirement layer. |
| Persistent memory beyond STATE.md (vector databases, embeddings) | "Store everything so no context is ever lost." | Vector search introduces non-determinism in what context loads. STATE.md's discipline — explicit, curated, updated by the framework — beats "retrieve similar chunks" because it's auditable. The problem is context management quality, not context storage quantity. | Disciplined STATE.md updates with explicit capability/feature context fields. If the state is getting unwieldy, the work scope is too large. |
| Backward compatibility with GSD v1 artifacts | "Don't break my existing .planning/ directories." | The hierarchy change (milestone/phase → capability/feature) and the 3-layer requirement model require different artifact structures. Maintaining backward compat would constrain the design of new artifacts. Migration tooling is possible later; it shouldn't be a v2 constraint. | Clean break. Document the migration path in a migration guide. Ship a `gsd migrate` command in v2.1 if demand exists. |
| Dashboard / progress visualization UI | "I want to see project health at a glance." | GSD is a terminal-native framework. Adding a UI means maintaining a renderer, update loop, and visual design on top of the orchestration system. The `gsd:progress` and `gsd:health` commands already surface this information. | `/gsd:progress` command with structured output. Let users pipe to their preferred visualization if they want it. |
| LLM-judged requirement quality scoring | "Have AI grade how good my requirements are before proceeding." | Circular: the AI that writes plans is also grading the requirements feeding those plans. Better to enforce structural completeness (does the requirement have all three layers? does it have acceptance criteria?) than to judge quality semantically. | Structural validation in the planning pipeline. If the 3-layer format is satisfied, the requirement is processable. Quality is the user's responsibility. |

---

## Feature Dependencies

```
[4 Workflow Framings]
    └──feeds──> [3-Layer Requirements]
                    └──feeds──> [Planner with Self-Critique]
                                    └──feeds──> [Plan with REQ ID References]
                                                    └──requires──> [Full Req Traceability]
                                                    └──feeds──> [Execution]
                                                                    └──feeds──> [4 Parallel Reviewers]
                                                                                    └──requires──> [3-Layer Requirements]
                                                                                    └──feeds──> [Review Synthesis]
                                                                                                    └──feeds──> [Reflect-and-Write Docs]

[Capability/Feature Hierarchy]
    └──requires──> [STATE.md extended with capability/feature fields]
    └──requires──> [Context file conventions carry-forward]

[4 Parallel Reviewers]
    └──requires──> [3-Layer Requirements] (each reviewer targets one layer + code quality)
    └──requires──> [Parallelization / wave execution] (carry-forward from v1)
    └──requires──> [Review Synthesis agent] (new in v2)

[Reflect-and-Write Docs]
    └──requires──> [Execution complete]
    └──requires──> [Review synthesis accepted]

[First-Principles Research]
    └──requires──> [Parallelization / wave execution]
    └──requires──> [Research Synthesizer agent] (new in v2)
```

### Dependency Notes

- **4 Workflow Framings require 3-Layer Requirements:** Framing determines which discovery questions get asked, which determines how requirements are articulated across all three layers. The framing is the input, requirements are the output.
- **4 Parallel Reviewers require 3-Layer Requirements:** Each reviewer is specialized to one layer (end-user reviewer checks the story + acceptance criteria, functional reviewer checks behavioral spec, technical reviewer checks implementation spec, code quality reviewer checks DRY/KISS/no bloat). Without defined layers, review degrades to one generic agent.
- **Full Traceability requires Planner discipline:** The zero-orphan-task invariant is enforced at planning time. If the planner doesn't output REQ-IDs in every task, the verifier can't cross-reference. These must be designed together.
- **Reflect-and-Write Docs require Review Synthesis accepted:** Documentation describes what was built and verified, not what was planned. It is the final stage, gated on accepted review.
- **Capability/Feature Hierarchy requires STATE.md extension:** STATE.md currently tracks milestone/phase progress. V2 must track current capability, current feature, and cross-feature state without breaking the fresh-context-per-unit discipline.

---

## MVP Definition

### Launch With (v2 — the core loop must work end-to-end)

- [ ] **4 Workflow framings** — debug, new, enhance, refactor as distinct front-door commands with framing-specific discovery phases. Essential: the workflow framing is the core UX innovation; everything else depends on which questions get asked first.
- [ ] **3-Layer requirements template and enforcement** — end-user (story + acceptance), functional (behavior), technical (spec). Essential: the reviewer specialization is meaningless without defined layers to review against.
- [ ] **Planner with self-critique step** — draft → challenge (coverage, approach, feasibility, assumptions) → present. Essential: prevents silent guessing before committing to a plan.
- [ ] **4 Parallel reviewers + synthesis** — end-user, functional, technical, code quality reviewers running in parallel; synthesizer produces unified recommendation. Essential: the review architecture is the primary differentiator over GSD v1's single verifier.
- [ ] **Full requirement traceability enforcement** — zero-orphan-task invariant in planner output; cross-reference in verifier. Essential: this is the stated core value of v2 ("every piece of work traces back to a requirement").
- [ ] **Capability/Feature hierarchy in .planning/** — replace milestone/phase directory structure and STATE.md fields. Essential: all artifact paths depend on this.
- [ ] **Reflect-and-write documentation step** — documentation agent reads actual built code, writes .documentation/ reference. Essential: closes spec-implementation drift.

### Add After Validation (v2.x)

- [ ] **First-principles research with parallelized gather → synthesize** — parallel researcher agents + synthesizer. Trigger: the research phase is bottlenecking planning quality on complex projects.
- [ ] **Framing-aware context injection enhancements** — richer framing context that includes examples and anti-patterns per work type. Trigger: users report framing discovery questions are too generic.
- [ ] **`gsd migrate` command for v1 artifact migration** — converts .planning/phases/ to .planning/capabilities/features/. Trigger: existing GSD v1 users want to upgrade without losing project history.
- [ ] **Extended STATE.md capability/feature fields** — structured fields for cross-feature state (blocked capabilities, feature dependencies). Trigger: multi-capability projects start losing state between context resets.

### Future Consideration (v2+)

- [ ] **Port to other runtimes (Gemini CLI, OpenCode, Codex)** — defer until Claude Code implementation is solid and the primitive interface is stable.
- [ ] **`gsd:progress` structured output improvements** — richer progress visualization for multi-capability projects. Defer until the hierarchy is stable and real project data exists.
- [ ] **Agent hook system (Kiro-style)** — triggered by file events. Defer: the explicit command model is simpler and works; hooks add complexity for marginal productivity gain at this scale.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 4 Workflow framings | HIGH | MEDIUM | P1 |
| 3-Layer requirements | HIGH | MEDIUM | P1 |
| Planner self-critique | HIGH | LOW | P1 |
| 4 Parallel reviewers + synthesis | HIGH | HIGH | P1 |
| Full traceability enforcement | HIGH | LOW | P1 |
| Capability/Feature hierarchy | HIGH | MEDIUM | P1 |
| Reflect-and-write docs | MEDIUM | MEDIUM | P1 |
| First-principles parallel research | MEDIUM | MEDIUM | P2 |
| Framing context enhancements | LOW | LOW | P2 |
| GSD v1 migration command | MEDIUM | LOW | P2 |
| Multi-runtime support | LOW | HIGH | P3 |
| Agent hook system | LOW | HIGH | P3 |
| Dashboard UI | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v2 launch — the core loop doesn't work without it
- P2: Should have — improves the system once core is validated
- P3: Nice to have — future consideration, low urgency

---

## Competitor Feature Analysis

| Feature | Kiro (AWS) | Cursor | GSD v1 | GSD v2 Plan |
|---------|-----------|--------|--------|-------------|
| Structured spec before code | YES — 3-stage (req → design → tasks) | PARTIAL — via .cursorrules conventions | PARTIAL — REQUIREMENTS.md flat format | FULL — 3-layer requirements |
| Requirement traceability | YES — every code line links to spec | NO — no formal tracing | PARTIAL — REQ IDs in plan frontmatter | FULL — zero-orphan invariant |
| Work type differentiation | NO — always spec-first regardless of work type | NO — agent mode is generic | PARTIAL — gsd:debug is separate | FULL — 4 framings with distinct discovery |
| Multi-reviewer specialization | NO — acceptance criteria check only | NO — no built-in review specialization | NO — single verifier | FULL — 4 parallel specialist reviewers |
| Plan self-critique before presentation | NO | NO | NO | YES — draft → challenge → present |
| Documentation from actual code | NO — docs from specs only | NO | NO | YES — reflect-and-write documentation step |
| Context file conventions | YES — .kiro/steering/ | YES — .cursorrules / .mdc | YES — CLAUDE.md + STATE.md | YES — carry forward + extend |
| Fresh context per task | PARTIAL — single session management | PARTIAL — composer session | YES — atomic plans in fresh contexts | YES — carry forward |
| Parallel agent execution | LIMITED — sequential stages | YES — up to 8 subagents | YES — wave-based | YES — reviewers in parallel |
| State persistence | YES — persistent knowledge layer | PARTIAL — Cursor Memory | YES — STATE.md | YES — extend for capability/feature fields |

---

## Sources

- [Cursor vs Windsurf vs Claude Code in 2026 — DEV Community](https://dev.to/pockit_tools/cursor-vs-windsurf-vs-claude-code-in-2026-the-honest-comparison-after-using-all-three-3gof) — MEDIUM confidence
- [Understanding Spec-Driven Development: Kiro, spec-kit, Tessl — Martin Fowler](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — HIGH confidence
- [AWS Kiro: Spec-Driven Agentic AI IDE — InfoQ](https://www.infoq.com/news/2025/08/aws-kiro-spec-driven-agent/) — HIGH confidence
- [Kiro dev — official site](https://kiro.dev/) — HIGH confidence
- [Meet the Agents: 10 AI Specialists That Review Your Code — diffray](https://diffray.ai/blog/meet-the-agents/) — MEDIUM confidence (direct inspection of specialist-agent review pattern)
- [5 AI Code Review Pattern Predictions in 2026 — Qodo](https://www.qodo.ai/blog/5-ai-code-review-pattern-predictions-in-2026/) — MEDIUM confidence
- [Claude Code Multi-Agent Orchestration — Shipyard](https://shipyard.build/blog/claude-code-multi-agent/) — MEDIUM confidence
- [GSD (Get-Shit-Done) — GitHub](https://github.com/gsd-build/get-shit-done) — HIGH confidence (direct baseline)
- [My LLM coding workflow going into 2026 — Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/) — MEDIUM confidence
- [SELF-REFINE: Iterative Refinement with Self-Feedback — OpenReview](https://openreview.net/pdf?id=S37hOerQLB) — HIGH confidence (academic source)
- [Context is AI coding's real bottleneck in 2026 — The New Stack](https://thenewstack.io/context-is-ai-codings-real-bottleneck-in-2026/) — MEDIUM confidence

---

*Feature research for: AI coding assistant orchestration framework (GSD v2)*
*Researched: 2026-02-28*
