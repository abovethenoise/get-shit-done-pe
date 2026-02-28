# Project Research Summary

**Project:** GSD v2 — AI Agent Orchestration Framework
**Domain:** Meta-prompting / spec-driven development / multi-agent coordination framework (Claude Code runtime)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Executive Summary

GSD v2 is a refactor of a mature AI coding orchestration framework — not a greenfield build. The v1 baseline is solid: CommonJS CLI, markdown+YAML artifact store, wave-based parallel execution, single-verifier review. The v2 thesis is that context rot and orphan tasks are the core failure modes of AI coding at scale, and that a 3-layer requirement model + 4 specialist parallel reviewers + framing-aware discovery are the structural fixes. Research confirms this thesis is grounded: Kiro (AWS) independently arrived at structured spec-before-code, diffray's specialist-agent review shows 87% fewer false positives, and SELF-REFINE academic work validates iterative self-critique. GSD v2 has the right instincts — the implementation risk is in the details of the new hierarchy and traceability enforcement.

The recommended approach is a strict layered build: foundation infrastructure (templates + CLI commands + YAML library migration) before any agent work, agent definitions before workflows, workflows before slash commands. The capability/feature hierarchy replaces milestone/phase as the planning spine; every artifact (FEATURE.md, PLAN.md, REVIEW.md, DOCS.md) is co-located per feature directory. The one new external dependency is `js-yaml 4.1.1` — the existing hand-rolled YAML parser cannot handle the 3-layer requirement nesting depth without rewriting it to the same size as js-yaml. Everything else is carry-forward.

The key risks are operational, not architectural. Building v2 while running on v1 is the bootstrap trap — any rename or move of active workflow/agent files mid-session corrupts the running context. Requirements theater (writing requirements post-hoc to justify a predetermined plan) is the traceability adoption failure mode, well-documented in academic research. Parallel reviewer coordination without an explicit conflict resolution protocol collapses to majority-averaging. Self-critique without hard iteration limits produces infinite loops. Each of these has a clear prevention strategy; the question is enforcement discipline.

---

## Key Findings

### Recommended Stack

The stack is minimal and intentional. Node.js >=20 (existing constraint), CommonJS `.cjs` module format (existing constraint), and `js-yaml 4.1.1` as the only new runtime dependency. The existing hand-rolled `frontmatter.cjs` parser (~230 lines, 3-level nesting limit) will break on the 3-layer requirements YAML structure. `js-yaml` handles this natively, has explicit CJS `require()` support in its exports map (verified), and has zero transitive dependencies. All alternative YAML libraries were evaluated and rejected: `yaml` (eemeli) fails `require()` in CJS, `gray-matter` adds 4 transitive deps to wrap the same js-yaml.

**Core technologies:**
- Node.js >=20 (LTS): Runtime — existing constraint, required for `c8` coverage and `node:test` stability
- CommonJS `.cjs`: Module format — existing constraint, no bundler, no ESM migration (YAGNI)
- `js-yaml` 4.1.1: YAML parse/serialize — replaces fragile hand-rolled parser, handles deep requirement nesting
- Markdown + YAML frontmatter: Artifact format — proven in v1, human-readable, version-control-native
- `node:test` (built-in): Test runner — no Jest/Vitest, existing constraint
- `c8 ^11.0.0`: Coverage gating — existing, keep at `--lines 70`

**What NOT to add:** No TypeScript (build step overhead, codebase is small), no SQLite (YAML frontmatter is the state layer), no LangChain/LangGraph (wrong paradigm — GSD is a prompting framework, not a runtime AI SDK), no template engine (XML block injection with simple string selection covers the use case with zero deps).

### Expected Features

The ecosystem has normalized spec-before-code, requirement traceability, fresh context per task, and state persistence. These are table stakes — GSD v1 already covers most of them. The differentiating features in v2 are what no competitor currently does:

**Must have (v2 launch — table stakes and core differentiators):**
- 4 workflow framings (debug / new / enhance / refactor) with framing-specific discovery phases
- 3-layer requirements (end-user story + acceptance / functional behavior / technical spec)
- Planner self-critique — draft → challenge (coverage, approach, feasibility, assumptions) → present
- 4 parallel specialist reviewers + review synthesizer
- Zero-orphan-task requirement traceability as an invariant, not a feature
- Capability/feature hierarchy replacing milestone/phase in `.planning/`
- Reflect-and-write documentation (docs generated from built code, not from spec)

**Should have (v2.x — add after core loop is validated):**
- First-principles parallel research (parallelized gather → synthesize; this document is the output of that very pattern)
- Framing context enhancements (richer per-framing question sets with examples)
- `gsd migrate` command for v1 artifact conversion

**Defer to v2+:**
- Multi-runtime support (Gemini CLI, OpenCode, Codex) — interface stability first
- Agent hook system (Kiro-style file-event triggers) — explicit command model is simpler and works
- Dashboard/progress visualization UI — `gsd:progress` command covers this without a renderer

**Explicit anti-features:** Auto-advance between stages (removes user from quality gate), persistent vector memory (non-deterministic context loading, STATE.md is better), backward compat with v1 artifacts (hierarchy change requires clean break), AI-judged requirement quality scoring (circular — the AI grading the requirements feeds the AI using them).

### Architecture Approach

The architecture preserves the existing 4-layer pattern (commands → workflows → agents → CLI) and adds three orthogonal concerns layered on top: the capability/feature hierarchy in `.planning/`, 3-layer requirement traceability threading through every artifact, and framing-awareness as a front-door concern that converges to a shared pipeline. Framing is a front door, not a separate system — each framing (debug/new/enhance/refactor) has its own discovery workflow, but all framings produce a FEATURE.md and then route through the identical pipeline (FEATURE.md → PLAN.md → execute → REVIEW.md → DOCS.md). This keeps the system DRY: pipeline changes propagate once, not 4x.

**Major components:**
1. Slash commands — entry points; encode framing as argument; load workflow via `@` reference
2. Workflows — orchestrate the full pipeline; framing-aware discovery; spawn agents via Task tool; gate on state
3. Agents — specialist personas (planner, executor, 4 reviewers + synthesizer, documentor, researcher); framing context injected at spawn time, not baked into agent definition
4. `gsd-tools.cjs` CLI — all stateful operations (capability/feature CRUD, frontmatter parse/write, REQ ID allocation, git, model resolution)
5. `.planning/` artifact store — source of truth; capabilities/features directory hierarchy; co-located per-feature artifacts
6. Templates — canonical schemas for FEATURE.md, PLAN.md, REVIEW.md, DOCS.md
7. References — shared behavioral rules injected into agent context

**Build order is load-bearing:** Layer 0 (templates + CLI capability/feature commands + YAML migration) must complete before any agent work. Template schema decisions propagate to every agent and workflow downstream. FEATURE.md (3-layer schema) and REVIEW.md (reviewer trace schema) are the critical path — get these right before writing anything that reads them.

### Critical Pitfalls

1. **Refactoring the scaffold while standing on it** — Renaming or moving active v1 workflow/agent files mid-session silently corrupts running context (hardcoded `~/.claude/get-shit-done/` paths in `@` references fail without error). Avoid by treating v1 as frozen during v2 construction; build v2 in isolated path namespace; clean-break cutover only after v2 is fully functional.

2. **Requirements theater** — 3-layer requirements written post-hoc to justify a predetermined plan. Requirements traceability research identifies "benefit is diffuse, overhead is immediate" as the primary adoption failure mode. Enforce by requiring Layer 2 (functional) to include at least one non-obvious constraint before the planner sees any requirements; reviewers trace forward (code → requirement), not backward (requirement → code).

3. **Parallel reviewers without conflict resolution protocol** — 4 reviewers optimizing for different criteria will disagree. Without an explicit priority ordering and "conflicts" section in synthesis output, the synthesizer averages (majority wins) and valid minority findings are silently discarded. 36.94% of multi-agent failures are coordination failures. Fix: priority ordering (user acceptance > functional compliance > technical compliance > code quality), structured finding severity (blocker/major/minor), mandatory conflicts section in REVIEW.md even if empty.

4. **Self-critique loop without termination** — Reflection loops without hard stop conditions produce infinite iteration. Documented real failure: agents repeating responses 58+ times. Fix: maximum 2 critique rounds, hard stop. Findings categorized as blocker (loop continues) or advisory (loop terminates, finding included in output). Unresolved blockers after round 2 go to the user, not back to the critic.

5. **Agent prompt bloat** — Each subprocess already loads ~50K tokens baseline in Claude Code. Layered context (project + capability + feature + framing) compounds this. Context rot degrades attention to earlier instructions. Fix: hard token budgets per layer (core ≤500 tokens, capability ≤300, framing-specific ≤400); strip all human-readable framing and prose from agent context (instructions only); CLAUDE.md compression research shows 60-70% reduction is achievable without information loss.

---

## Implications for Roadmap

The architecture's build order is explicit and dependency-driven. Layer 0 must precede everything else because template schemas propagate to all downstream agents and workflows. Suggested phase structure maps to the architectural layers.

### Phase 1: Foundation — Infrastructure and Schema

**Rationale:** Template schemas and CLI capability/feature commands are the dependency anchor for the entire system. Nothing else can be built correctly until FEATURE.md's 3-layer schema and REVIEW.md's reviewer trace schema are finalized. The `js-yaml` migration must also land here to unblock safe YAML writing in later phases. This is the critical path.

**Delivers:** `js-yaml` integrated, hand-rolled parser replaced; capability/feature CRUD commands in `gsd-tools.cjs`; all new templates (CAPABILITY.md, FEATURE.md, PLAN.md updated, REVIEW.md, DOCS.md); STATE.md updated for capability/feature position fields; `.planning/capabilities/` directory structure established.

**Addresses:** Capability/feature hierarchy (FEATURES.md P1), 3-layer requirements template (FEATURES.md P1)

**Avoids:** YAML parser breaking on nested requirement structures (PITFALLS #3 integration gotcha); STATE.md dual-write desync by doing it right at initial implementation (PITFALLS integration gotchas)

### Phase 2: Core Agents — Planner, Executor, Plan Checker

**Rationale:** The planner is the logical center of the pipeline — it reads requirements, produces the plan, runs self-critique, and enforces traceability. The executor and plan-checker are carry-forwards with targeted modifications (REQ ID field reading, SUMMARY.md frontmatter updates). These three agents form the requirements → plan → execute arc before the review layer exists.

**Delivers:** `gsd-planner.md` updated for 3-layer requirements + REQ ID traceability + self-critique (2-round maximum, blocker/advisory categorization); `gsd-executor.md` with REQ ID coverage tracking in SUMMARY.md; `gsd-plan-checker.md` updated to validate REQ ID resolution (not just presence).

**Addresses:** Planner self-critique (FEATURES.md P1), full traceability enforcement (FEATURES.md P1)

**Avoids:** Self-critique infinite loop — termination logic is baked into the agent definition (PITFALLS #6); requirements theater — planner self-critique must explicitly check whether requirements constrain vs describe the implementation (PITFALLS #3)

### Phase 3: Review Layer — 4 Specialist Reviewers + Synthesizer

**Rationale:** The 4-reviewer system is the primary differentiator over GSD v1. It depends on Phase 1 templates (REVIEW.md schema, FEATURE.md 3-layer IDs) and Phase 2 artifacts (PLAN.md with REQ IDs, SUMMARY.md). Reviewers must be built after the artifacts they review are fully specified. The synthesizer is built after the 4 reviewers, as it receives their outputs.

**Delivers:** `gsd-reviewer-user.md`, `gsd-reviewer-functional.md`, `gsd-reviewer-technical.md`, `gsd-reviewer-quality.md` — each with distinct review criteria, structured finding format (severity: blocker/major/minor), isolated context; `gsd-review-synthesizer.md` with explicit conflict resolution algorithm and mandatory conflicts section.

**Addresses:** 4 parallel reviewers + synthesis (FEATURES.md P1)

**Avoids:** Reviewer context leakage between parallel spawns (PITFALLS integration gotchas — isolation enforced at workflow level); synthesis averaging instead of adjudicating (PITFALLS #4 — conflict protocol in synthesizer definition)

### Phase 4: Documentation Agent

**Rationale:** The documentor is the terminal stage of the pipeline — it runs after review synthesis is accepted. Depends on REVIEW.md (Phase 3) and DOCS.md template (Phase 1). Isolated here because it has a distinct failure mode (writing from memory rather than from code) that deserves focused attention.

**Delivers:** `gsd-documentor.md` — reflects on built code (reads actual file paths, function names) not on FEATURE.md spec; generates DOCS.md with `built-from-code-at:` git SHA timestamp; capability-scoped (one doc per capability at completion, not per feature).

**Addresses:** Reflect-and-write documentation (FEATURES.md P1)

**Avoids:** Documentation graveyard / spec-implementation drift (PITFALLS #7 — enforced by agent reading code, not memory; staleness detectable via SHA timestamp)

### Phase 5: Workflows — Framing-Specific Discovery + Full Pipeline Assembly

**Rationale:** Workflows are the orchestration layer that connects everything built in Phases 1-4. They can only be written after all agents are defined, because workflows assemble context and spawn agents. The 4 framing workflows (debug, new, enhance, refactor) share the same pipeline invocation code after their distinct discovery steps — implement the pipeline arc once, reference it from all framings.

**Delivers:** `new-feature.md`, `debug.md`, `enhance-feature.md`, `refactor.md` — each with framing-specific discovery phase (different questions, same FEATURE.md output) and shared pipeline invocation; `review-feature.md`; `document-feature.md`; framing context injection pattern (XML block selection via `renderFramingContext()`).

**Addresses:** 4 workflow framings (FEATURES.md P1), framing-aware context injection (FEATURES.md differentiator)

**Avoids:** Separate command namespaces per framing — all framings converge to shared pipeline (ARCHITECTURE anti-pattern 1); agent proliferation by framing — framing context injected at workflow level, not baked into agent (ARCHITECTURE anti-pattern 3)

### Phase 6: Commands + Integration

**Rationale:** Slash commands are the entry points — they must come last because they reference workflows (which reference agents) and encode framing as arguments. This phase also includes end-to-end integration testing of the full pipeline and the clean-break cutover from v1.

**Delivers:** Updated slash commands with framing encoding; `cmdVerifyReferences` validation pass to catch broken `@` path references; full end-to-end integration test (one capability, one feature, all framings); v1 clean-break checklist completed; STATE.md capability/feature fields validated in real use.

**Addresses:** Context file conventions carry-forward (FEATURES.md table stakes)

**Avoids:** Bootstrap trap — v1 is frozen until v2 passes integration tests; path reference silent failures (PITFALLS #1 and integration gotchas); all v1 hardcoded paths verified via `cmdVerifyReferences`

### Phase Ordering Rationale

- Phases 1-4 follow the architectural build order from ARCHITECTURE.md directly (Layer 0 → 1 → 2 → 3 → 4). This is not a suggestion — it's a hard dependency chain.
- Phase 5 (workflows) cannot precede agent definitions because workflows call agents; building in reverse would require constant revision.
- Phase 6 (commands) is always last — entry points are the thinnest layer and depend on everything below.
- Phase 4 (documentation) is isolated from Phase 3 (review) despite being downstream. The documentor failure mode is distinct enough to warrant focused attention rather than bundling.
- The research infrastructure (first-principles parallel gather → synthesize) is v2.x, not v2. The current document is proof that the pattern works; implementing it as a formal capability can wait until the core loop is validated.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Review Layer):** The review synthesizer conflict resolution algorithm needs a well-defined specification before authorship. The priority ordering (user > functional > technical > quality) is established in research, but the exact synthesizer prompt architecture for adjudicating conflicts in practice needs a spike or prototype during planning.
- **Phase 5 (Workflows):** The framing-specific discovery questions for each of the 4 framings are not fully specified in any research file. What are the exact 4 questions debug discovery asks? What does enhance discovery read from the existing FEATURE.md? These need definition during workflow planning.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Template schema design and CLI CRUD commands follow established GSD v1 patterns. `js-yaml` migration is well-documented. Standard work.
- **Phase 2 (Core Agents):** Planner, executor, plan-checker are carry-forwards with targeted changes. GSD v1 patterns apply directly.
- **Phase 6 (Commands + Integration):** Slash command structure is unchanged from v1. Path verification tooling exists. Standard integration work.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library choices verified via `npm info`; CJS constraint confirmed from existing codebase; `js-yaml` CJS exports map verified directly |
| Features | HIGH | GSD v1 is the baseline (first-party); Kiro and diffray are publicly documented; SELF-REFINE is peer-reviewed; competitor analysis from multiple independent sources |
| Architecture | HIGH | GSD v1 codebase inspected directly; build order is dependency-derived, not opinionated; anti-patterns are from Claude Code's own documentation |
| Pitfalls | HIGH | CONCERNS.md is first-party; multi-agent coordination failure rates from ACM research; context bloat mechanics from Claude Code-specific technical analysis; traceability adoption from peer-reviewed study |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact framing discovery question sets:** Research establishes that the 4 framings need different discovery questions, but doesn't specify the exact question lists. Define these during Phase 5 planning, likely as a spike that tests different question sets against sample capabilities.
- **Token budget enforcement mechanism:** Research recommends hard token budgets per context layer (core ≤500, capability ≤300, framing ≤400) but doesn't specify how enforcement is implemented. Options: a `gsd-tools.cjs validate-context-budget` command, a linter in CI, or an honor system. Decide during Phase 1 planning.
- **Requirement ID convention uniqueness across capabilities:** The proposed `REQ-EU-001` scheme is feature-scoped. If two features have `REQ-EU-001`, cross-capability traceability becomes ambiguous. Decide during Phase 1 whether IDs are globally unique (e.g., `FEAT-01-01-EU-001`) or feature-scoped (acceptable because cross-feature tracing is not a v2 requirement).

---

## Sources

### Primary (HIGH confidence)

- GSD v1 codebase — direct inspection of `frontmatter.cjs`, `package.json`, `ARCHITECTURE.md`, `CONCERNS.md`, `PROJECT.md`
- `npm info js-yaml --json` — CJS exports map verified, `"require": "./index.js"` confirmed, published 2025-11-14
- `npm info yaml --json` — no `require` key confirmed, CJS failure verified
- SELF-REFINE: Iterative Refinement with Self-Feedback (OpenReview, peer-reviewed) — 13-30% error reduction from self-critique
- Why don't we trace? Barriers to software traceability (Springer 2023, peer-reviewed) — "benefit problem" root cause in traceability adoption
- AWS Kiro official docs (kiro.dev) — spec-driven development 3-stage model
- Claude Code official docs (code.claude.com) — Task tool, agent frontmatter, context isolation

### Secondary (MEDIUM confidence)

- Why Claude Code Subagents Waste 50K Tokens Per Turn (DEV.to, 2025) — Claude-specific context bloat mechanics
- Why Multi-Agent LLM Systems Fail (Augment Code) — 36.94% coordination failure rate
- diffray: Meet the Agents (diffray.ai) — specialist parallel review, 87% fewer false positives
- Parallel code review subagent pattern, 9-agent structure (hamy.xyz, 2026-02) — synthesis pattern
- Compress Your CLAUDE.md: 60-70% reduction achievable (techloom.it) — context compression evidence
- LLM Tool-Calling in Production: Infinite Loop Failure Mode (Medium) — self-critique termination failure modes
- Addy Osmani: My LLM coding workflow going into 2026 — iterative plan critique pattern
- Understanding Spec-Driven Development (Martin Fowler, martinfowler.com) — HIGH confidence for source, MEDIUM for specific Kiro details
- Work Breakdown Structures: 3-level depth recommendation (DEV.to SimpleWBS)
- SuperAGI Issue #542 — reflection loop producing 58 repetitions

### Tertiary (LOW confidence)

- Hierarchical AI orchestration patterns (n8n.io blog) — general patterns, not GSD-specific

---

*Research completed: 2026-02-28*
*Ready for roadmap: yes*
