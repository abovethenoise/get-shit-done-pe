# Phase 7: Cleanup — Concept Inventory

**Synthesized:** 2026-02-28
**Sources:** research-A (GSD repo), research-B (custom concepts), research-C (project files)
**Status:** FINAL — Q&A complete 2026-02-28

---

## Verdict Legend

| Verdict | Meaning |
|---------|---------|
| **KEEP v1** | v1 concept is superior — replaces or extends GSD |
| **KEEP GSD** | GSD concept wins — earning its place |
| **KEEP GSD (low)** | GSD concept useful but not critical — keep, deprioritize |
| **REMOVE** | Not earning its place — remove from pipeline |
| **DROP** | Dead artifact — delete or archive |

---

## Layer 1: The 6 Known Concept Domains

### 1. Framing/Lens Taxonomy

| Aspect | v1 | GSD |
|--------|-----|-----|
| Entry points | 4 typed commands (debug/new/enhance/refactor) | None |
| Discovery | Lens-aware with MVU slots, exit signals, cross-framing detection | `discuss-phase` — open-ended, untyped |
| Artifact | Discovery Brief (structured, lens-variant) | CONTEXT.md (decisions-focused) |
| Pipeline injection | Same agents get different questions per lens | No framing awareness |

**Files (14):** `references/framing-lenses.md`, `workflows/framing-discovery.md`, `workflows/framing-pipeline.md`, `framings/{debug,new,enhance,refactor}/anchor-questions.md`, `commands/gsd/{debug,new,enhance,refactor}.md`, `templates/discovery.md`, `templates/discovery-brief.md`, `references/escalation-protocol.md`

**Draft Verdict: KEEP v1**
GSD has nothing here. The typed discovery layer adds structure that `discuss-phase` lacks. The framing pipeline routes work through the standard GSD pipeline with lens context injection.

---

### 2. Research (6-Agent Synthesis vs 4-Generic)

| Aspect | v1 | GSD |
|--------|-----|-----|
| Agent count | 6 epistemic agents | 4 domain agents |
| Questions | First-principles: truth, intent, system, prior art, constraints, edges | Domain-specific: stack, features, architecture, pitfalls |
| Reusability | Same pattern used for research AND review (gather-synthesize) | Inline per-workflow, not reusable |
| Scope | Problem-type-agnostic | Template-driven, domain-scoped |

**Files (8):** `agents/gsd-research-{domain,intent,system,prior-art,tech,edges}.md`, `agents/gsd-research-synthesizer.md` (v2), `workflows/gather-synthesize.md`

**FINAL Verdict: KEEP v1**
6 epistemic agents replace GSD's 4 domain agents. First-principles questions are problem-type-agnostic. Gather-synthesize primitive replaces inline orchestration.

---

### 3. Discovery/Discussion (Lens-Aware vs discuss-phase)

| Aspect | v1 | GSD |
|--------|-----|-----|
| Entry | `discuss-capability`, `discuss-feature` (hierarchy-aware) | `discuss-phase` (phase-level only) |
| Typing | Lens-specific questioning | Generic gray-area probing |
| Artifact | Discovery Brief → enters pipeline | CONTEXT.md → consumed by researcher + planner |
| Scope | Capability and feature level | Phase level |

**Files (4):** `commands/gsd/discuss-{capability,feature}.md`, `workflows/discuss-{capability,feature}.md`

**FINAL Verdict: KEEP v1**
Lens-typed discovery with capability/feature granularity replaces discuss-phase. Capability/feature hierarchy is confirmed (see Layer 2).

---

### 4. Requirements (3 Abstraction Levels vs Flat)

| Aspect | v1 | GSD |
|--------|-----|-----|
| Layers | EU-xx (user story), FN-xx (functional), TC-xx (technical) | REQ-xx (flat, single layer) |
| Hierarchy | Project → Capability → Feature → 3-layer requirements | Project → Phase → flat REQ-IDs |
| Enforcement | `plan-validate` CLI: zero-orphan-task rule | Plan-checker verifies task completeness, no REQ tracing |
| Expressiveness | Strictly more expressive | Simpler, lower ceremony |

**Files (3):** `templates/feature.md`, `templates/capability.md`, `templates/requirements.md` (v2 version)

**FINAL Verdict: KEEP v1**
3-layer requirements are strictly more expressive. Each downstream agent traces against its specific layer. `plan-validate` enforces traceability GSD lacks.

---

### 5. Code Review (4-Reviewer+Judge vs UAT+Debug)

| Aspect | v1 | GSD |
|--------|-----|-----|
| When | After execution, before docs | After execution (verification) |
| Mechanism | 4 parallel specialists trace per-requirement-layer | Single verifier checks goal achievement |
| Verdict type | met / not-met / regression | pass / fail with gaps |
| Conflict resolution | Priority ordering: user > functional > technical > quality | N/A — single agent |

**Files (7):** `agents/gsd-review-{enduser,functional,technical,quality,synthesizer}.md`, `commands/gsd/review-phase.md`, `workflows/review-phase.md`, `templates/review.md`

**FINAL Verdict: KEEP v1** (complementary to GSD verification)
v1 review traces requirements → code. GSD verification checks goal achievement. Both fire post-execution but serve different purposes. Keeping both gives layered quality assurance.

---

### 6. Documentation (Taxonomy+Ownership vs GSD Artifacts)

| Aspect | v1 | GSD |
|--------|-----|-----|
| Agent | `gsd-doc-writer` reads actual code + review findings | None |
| Output | Reference docs with [derived]/[authored] ownership tags | SUMMARY.md (execution record) |
| Gate docs | `.documentation/gate/` — constraints, state, glossary | None |
| Purpose | Future lookup: "how does X work?" | Retrospective: "what happened in phase Y?" |

**Files (5):** `agents/gsd-doc-writer.md`, `commands/gsd/doc-phase.md`, `workflows/doc-phase.md`, `templates/docs.md`, `.documentation/gate/`

**FINAL Verdict: KEEP v1**
GSD produces execution records (SUMMARY.md), not reference documentation. v1 doc-writer produces reference docs by reading actual built code. Complementary artifacts.

---

## Layer 2: GSD-Native Capabilities

### Earning their place (KEEP GSD)

| Concept | What It Does | Why It Stays |
|---------|-------------|-------------|
| **Session management** | STATE.md + pause/resume | Context rot is real |
| **Wave-based parallel execution** | Plans grouped by dependency, parallel within wave | Core GSD value |
| **Quick mode** | Ad-hoc tasks with GSD guarantees | Escape valve for small fixes |
| **Codebase mapping (4 agents)** | Parallel tech/arch/quality/concerns docs | Essential for brownfield |
| **Model profile routing** | quality/balanced/budget agent model selection | Opus vs Sonnet allocation matters |
| **Git branching strategy** | none/phase/milestone with auto-merge | Clean history during pivots |
| **Scientific method debugging** | Hypothesis-driven with persistent state | Beats ad-hoc every time |

### Low priority (KEEP GSD, deprioritize)

| Concept | What It Does | Why Low Priority |
|---------|-------------|-----------------|
| **Checkpoint protocol** | human-verify/decision/human-action | Safety net, costs nothing |
| **Summary frontmatter dependency graph** | requires/provides/affects | Metadata for traceability |
| **Milestone audit + integration checker** | Cross-reference requirements vs implementation | Useful when shipping milestones |

### Remove (REMOVE)

| Concept | What It Does | Why Remove |
|---------|-------------|-----------|
| **TDD execution pattern** | RED-GREEN-REFACTOR cycle | Not running TDD workflow. Re-add if adopted. |
| **Todo system** | add-todo, check-todos | Linear does this better. Solving a solved problem. |
| **Health check** | Validate .planning/ integrity | Statusline metrics. Nice-to-have, not load-bearing. |
| **Plan deviation rules** | 4 rules for executor off-plan behavior | Matters for teams. Solo, you notice and fix. |

---

## Layer 3: Unmapped v1 Concepts

| Concept | What It Does | FINAL Verdict |
|---------|-------------|---------------|
| **Gather-synthesize primitive** | Reusable N-gatherer + 1-synthesizer orchestration | **KEEP v1** — replaces inline orchestration |
| **Capability/Feature hierarchy** | Project → Capability → Feature (above phase level) | **KEEP v1** — confirmed during Q&A |
| **Self-critiquing planner** | Planner critiques its own output before presenting | **KEEP GSD** (external checker) — but incorporate gather→synthesize→draft→Q&A flow |
| **Zero-orphan-task enforcement** | Every plan task must reference a REQ ID | **KEEP v1** — traceability enforcement GSD lacks |
| **Escalation protocol** | Rules for when to escalate decisions to user | **KEEP v1** — more structured than GSD's deviation rules |
| **init command (unified entry)** | Auto-detects new/existing codebase, routes to setup | **KEEP v1** — init-project.md replaces new-project.md |

---

## Layer 4: Dead Artifacts & Conflicts

### Dead (remove)

| Item | Location | Reason |
|------|----------|--------|
| `new-project.md.bak` | commands/gsd/ (both installed + project) | Stale backup |
| `discovery-phase.md` | workflows/ (installed) | No command, not called, superseded by framing-discovery |

### Conflicts (RESOLVED)

| Item | Resolution |
|------|-----------|
| `gsd-planner.md` (44K installed vs 28K project) | **Project wins.** Cherry-pick any useful accumulated patches from installed version. |
| Project init (`new-project.md` vs `init-project.md`) | **init-project.md wins.** Unified entry point replaces separate new-project. |
| `resume-work` vs `resume-project` | Fix name mismatch. |
| Deploy gap (v2 paths don't exist in installed) | Resolved by cleanup + publish. |

### Alien (not GSD, leave alone)

| Item | Location | Why |
|------|----------|-----|
| `primary-collaborator.md` | `~/.claude/agents/` | User's poker-app agent. Not GSD. Not in package.json files list. |

---

## Summary Scoreboard (FINAL)

| Category | Count | Items |
|----------|-------|-------|
| **KEEP v1** | 11 | Framing, research (6-agent), discovery (lens-aware), hierarchy (capability/feature), requirements (3-layer), review (4-reviewer), documentation (doc-writer), gather-synthesize, zero-orphan enforcement, escalation protocol, init-project |
| **KEEP GSD** | 7 | Session mgmt, wave execution, quick mode, codebase mapping, model routing, git branching, debugger |
| **KEEP GSD (low)** | 3 | Checkpoints, summary frontmatter, milestone audit |
| **KEEP GSD (modified)** | 1 | External plan-checker (incorporate gather→synthesize→draft→Q&A flow) |
| **REMOVE** | 4 | TDD pattern, todos, health check, deviation rules |
| **DROP dead** | 2 | `.bak` file, `discovery-phase.md` |
| **CONFLICTS resolved** | 4 | Planner → project wins, init → init-project wins, resume naming fix, deploy gap |

---

*Final inventory — Q&A complete 2026-02-28. Ready for planning.*
