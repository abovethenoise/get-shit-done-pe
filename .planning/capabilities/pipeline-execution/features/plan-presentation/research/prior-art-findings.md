## Prior Art Findings

**Researched:** 2026-03-04
**Domain:** AI agent plan presentation, human-in-the-loop approval patterns, progressive disclosure UX
**Confidence:** HIGH

---

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| Cursor Plan Mode | Flat `.plan.md` written to disk, user edits directly before clicking "Build" | Proven (production, 2025) | Medium — file-edit model doesn't apply to prompt-based orchestration | [nearform.com](https://nearform.com/digital-community/cursor-vs-copilot-what-tool-has-the-best-planning-mode/) |
| Devin Checkpoint Model | Two non-negotiable checkpoints: step-by-step plan approval before code + PR review after | Proven (production, 2025) | Medium — checkpoint discipline is right, but no layered justification | [wwt.com](https://www.wwt.com/blog/empowering-the-enterprise-a-strategic-view-of-devin-ai-and-the-autonomous-workforce) |
| Copilot Workspace Two-Phase Spec | Current state + desired state articulation before planning; plan is then editable inline | Proven (sunset in favor of Copilot Coding Agent, 2025) | Medium-High — two-phase spec idea is directly transferable | [githubnext.com](https://githubnext.com/projects/copilot-workspace) |
| ADR (Architecture Decision Record) | Structured format: Context / Decision / Consequences / Status — captures the "why" alongside the "what" | Proven (decade-old industry standard) | High — directly maps to "surfaced self-critique decisions with what/why rationale" | [cognitect.com](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) |
| LangGraph `interrupt()` Pattern | Execution pauses at named checkpoint; state persisted; human examines payload and issues `Command(resume=...)` | Proven (production framework, 2025) | Low — requires Python runtime; conceptual model is relevant | [langchain blog](https://blog.langchain.com/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt/) |
| Progressive Disclosure (NN/g) | Show minimal critical info first; offer deeper layers on demand; max 2 levels before usability degrades | Proven (foundational UX research) | High — directly maps to 3-layer justification: narrative (always) → decisions (always) → drill-down (on demand) | [nngroup.com](https://www.nngroup.com/articles/progressive-disclosure/) |
| Claude Code Plan Mode | Read-only planning pass, outputs editable `plan.md`, Ctrl+G to edit in-editor, then execute | Proven (production, 2025) | Medium — plan file edit model doesn't apply; justification structure is relevant | [codewithmukesh.com](https://codewithmukesh.com/blog/plan-mode-claude-code/) |

---

### Recommended Starting Point

**ADR structure + Progressive Disclosure (2-layer): start here.**

The feature's 3-layer justification maps cleanly onto established ADR vocabulary (Context = why this order, Decision = approach chosen and why, Consequences = what remains unresolved), paired with progressive disclosure to manage cognitive load. The ADR pattern is the canonical industry answer to "explain your reasoning" in engineering planning. Progressive disclosure (2-level max) is the canonical UX answer to "show complex info without overwhelming." Together they give:

```
Layer 1 (always shown):   Narrative — ordering rationale + approach rationale + KISS justification
Layer 2 (always shown):   Surfaced decisions — self-critique fixes in ADR format (what / why / consequence)
Layer 3 (always offered): AskUserQuestion — drill-down into named plan areas on demand
```

This is not guesswork — both patterns are proven, have documented success conditions, and their failure modes are well-understood (see Anti-Patterns below). The match to AC-1 through AC-7 in the user intent findings is direct.

— [cognitect.com](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions), [nngroup.com](https://www.nngroup.com/articles/progressive-disclosure/)

---

### Anti-Patterns

- **Binary approve/reject at plan checkpoint (current GSD state):** All industry examples — Cursor, Devin, Copilot Workspace — moved away from flat approval with no justification. Devin's planning checkpoint specifically exists because "blanket approval without plan review" produced misaligned execution. The current GSD step 8.6 ("Finalize this plan?") is this anti-pattern. — [wwt.com/blog/empowering-the-enterprise-a-strategic-view-of-devin-ai-and-the-autonomous-workforce](https://www.wwt.com/blog/empowering-the-enterprise-a-strategic-view-of-devin-ai-and-the-autonomous-workforce)

- **Fix count without fix content:** "Fixed N issues" as the summary of self-critique is a documented failure in Claude Code Plan Mode and in GSD's own current state. The user receives a number with no actionable signal. The fix must be: what changed, why it changed, what rule triggered it — otherwise the number is noise. — [First principles: a count without content cannot be audited or rejected; user cannot evaluate whether the fix was correct]

- **Gated interactive Q&A (current GSD plan-checker path):** GSD's step 8.3 Q&A loop already short-circuits when no checker findings exist. This leaves the user with no opportunity to drill into plan rationale when the checker passes cleanly — exactly the case where a well-formed plan gets rubber-stamped. The pattern from all reviewed tools is: Q&A is unconditional when the plan is about to be finalized, not conditional on failure signals. — `plan.md` step 8.3 (lines 240-255) vs step 8.7-8.8 bypass path

- **More than 2 progressive disclosure levels:** NN/g research documents that designs with 3+ disclosure levels produce "low usability because users often get lost." The 3-layer justification must not become 3 levels of navigation — it must be 2 levels (always-shown layers 1+2, plus offered drill-down at same level), not a nested hierarchy. — [nngroup.com](https://www.nngroup.com/articles/progressive-disclosure/)

- **Forcing a visual diagram for trivially simple plans:** None of the reviewed tools (Cursor, Copilot, Devin) emit a visual architecture diagram for single-wave, 2-task plans. Generating a diagram where there is no architecture to illustrate is KISS violation and adds noise. The diagram is valuable when waves encode real dependencies — it is not valuable for a flat single-wave feature. — [First principles: "visual plan architecture" only has value when architecture exists; user intent AC-5 says "at least one diagram" but AC-5 must be interpreted against plan complexity]

- **Conflating the finding-surfacing Q&A with the plan deep-dive Q&A:** GSD's step 8.3 already uses AskUserQuestion for checker findings. If the new deep-dive Q&A (AC-4) runs at the same step, users face two sequential AskUserQuestion rounds with different purposes and no clear boundary. Cursor separates these explicitly: finding review → plan edit → final approval. GSD must do the same: findings Q&A (existing 8.3) remains separate from deep-dive Q&A (new, after 8.6's current flat summary). — [First principles: two Q&A rounds with unclear relationship recreates the opacity problem from a different angle]

---

### Libraries / Tools

No library-level implementations apply — this feature is a meta-prompting change to a markdown workflow orchestrator (plan.md). The relevant "libraries" are prompt patterns and structural templates.

- **ADR Nygard Format:** Context + Decision + Consequences + Status template — the minimal viable structure for surfacing self-critique fixes with rationale. Use this as the per-fix output format. — [cognitect.com](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

- **GSD ui-brand.md visual conventions:** All checkpoint output must use existing GSD stage banners, checkpoint boxes, and status symbols. The justification narrative and surfaced decisions are new content within existing visual containers — not new visual patterns. — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md`

---

### Canonical Patterns

- **Plan-then-approve (not approve-then-reveal):** Every reviewed tool (Cursor, Devin, Copilot Workspace, Claude Code plan mode) presents the complete plan with justification before soliciting approval. The approval is the final gate, not a mid-presentation interrupt. GSD's current flow has approval at 8.6 with no preceding justification layer — the approval precedes the reasoning. This must be inverted: justification first, approval last. — [nearform.com](https://nearform.com/digital-community/cursor-vs-copilot-what-tool-has-the-best-planning-mode/)

- **Editable plan with regeneration cascade:** Copilot Workspace's strongest pattern: user edits the plan spec at any point, and downstream steps regenerate from that edit. GSD already has this (8.5 re-spawn loop), but the trigger is user feedback through Q&A, not direct plan editing. The pattern confirms that the deep-dive Q&A must have a feedback path back to re-spawn — informational-only Q&A without a "I want changes" exit violates this canonical pattern. — [githubnext.com/projects/copilot-workspace](https://githubnext.com/projects/copilot-workspace)

- **Two-phase specification before plan generation (Copilot Workspace):** Document current state + desired state before the planner runs. GSD's RESEARCH.md partially serves this role, but the planner currently receives requirements without explicit current/desired framing. This pattern is out of scope for this feature (invariant: planner logic unchanged) but is relevant prior art for future planner-reference.md work. — [githubnext.com/projects/copilot-workspace](https://githubnext.com/projects/copilot-workspace)

- **Named plan areas for drill-down (not open-ended Q&A):** Claude Code's plan mode and Devin's planning checkpoint both structure the human-review interaction around named areas ("implementation order," "edge cases," "approach rationale") — not open-ended "do you have questions?" prompts. The feature spec's AskUserQuestion deep-dive must offer named choices. Candidate canonical list derived from reviewed tools: Wave ordering rationale / Approach vs alternatives / Requirement coverage / Assumptions made / Self-critique fix details. — [devin.ai/agents101](https://devin.ai/agents101), [codewithmukesh.com](https://codewithmukesh.com/blog/plan-mode-claude-code/)

- **Persisted interrupt state (LangGraph):** LangGraph's `interrupt()` pattern is conceptually the right model for the plan checkpoint: execution halts, state is serialized, human interacts, then execution resumes via `Command(resume=...)`. GSD implements this same pattern in markdown/prompt form — the plan.md workflow is the "execution," AskUserQuestion is the "interrupt," and user response is the "resume command." The conceptual alignment validates GSD's existing approach; the LangGraph implementation detail is not applicable (requires Python runtime). — [blog.langchain.com/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt](https://blog.langchain.com/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt/)

---

### Dimension-Specific Resolution: Ambiguities from User Intent Research

**Ambiguity 1: Where is the Round 1 fix log generated?**
Prior art is conclusive: the log must originate from the agent that has the information — the planner. Cursor generates its plan rationale as part of the plan artifact, not inferred later by the orchestrator. Copilot Workspace emits its current/desired state understanding as agent output, not re-derived by the IDE. The planner-reference.md "do not surface Round 1 fixes to the user" instruction means the planner does not present them inline during its pass — it does not mean the planner cannot include them in its structured return payload. Adding a fix log field to the return payload is a data format change, not a logic change. Invariant #3 ("planner logic unchanged") is compatible with adding a return field. — [First principles: the agent that applies fixes is the only agent that reliably knows what changed; inference from diffs is brittle and subject to noise from formatting changes]

**Ambiguity 2: Canonical deep-dive choices for AskUserQuestion**
From Claude Code plan mode (implementation order, edge cases, approach rationale), Devin checkpoint (architectural standards compliance, step-by-step intent review), and Copilot Workspace spec (current state understanding, desired state interpretation) — the canonical cluster is:
1. Wave ordering and task sequence rationale
2. Approach chosen vs alternatives rejected
3. Requirement coverage (which REQs each wave addresses)
4. Assumptions the planner made
5. Round 1 self-critique fix details (if any)

This matches the feature's "key plan areas" requirement directly. — [codewithmukesh.com](https://codewithmukesh.com/blog/plan-mode-claude-code/), [devin.ai](https://devin.ai/agents101)

**Ambiguity 3: Research ambiguity surfacing — legacy vs new RESEARCH.md format**
Prior art (Copilot Workspace two-phase spec) shows the solution: check for structured open questions fields first; if absent, fall back to a prose scan for question-like language. Copilot Workspace handles both structured and unstructured spec inputs. GSD can apply the same: if RESEARCH.md has an `<open_questions>` section, use it; if not, surface nothing (the section is absent, not an empty placeholder) per AC-3's own pass criteria. — [githubnext.com/projects/copilot-workspace](https://githubnext.com/projects/copilot-workspace)

---

*Researched: 2026-03-04*
*Feature: pipeline-execution/plan-presentation*
*Dimension: Prior Art*
