## User Intent Findings

### Primary Goal

Give the user enough visible reasoning at plan approval time to judge whether the plan is correct, appropriately ordered, and genuinely minimal — so approval is an informed decision, not a rubber stamp. — source: `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/BRIEF.md` Prior Exploration + Desired Behavior

---

### Acceptance Criteria

- **AC-1: Justification narrative is present, non-skippable.** Every plan checkpoint includes a narrative that states: why tasks are in this order, why this approach (vs alternatives) satisfies requirements, and why the plan is minimal per KISS/YAGNI. — Pass: the plan checkpoint output contains all three rationale threads before any table or approval prompt; no conditional that allows the narrative to be omitted. — source: `BRIEF.md` Desired Behavior #1; feature_context "why is the plan in this order?... why is this the simplest and most effective approach"

- **AC-2: Self-critique fixes are surfaced with what/why detail.** When the planner's Round 1 self-critique fixes issues silently (as specified by planner-reference.md), the checkpoint output lists each fix with: what changed and why it was changed. "Fixed 4 issues" alone is a failing output. — Pass: the checkpoint shows an enumerated list of Round 1 fixes, each with a one-line description of the change and the requirement or rule that triggered it. — source: `BRIEF.md` Existing State "Self-critique mentions fix count but not content — user sees 'fixed 4 issues' with no detail"; Prior Exploration "planner acknowledged 'fixed 4 issues' but showed no detail"

- **AC-3: Research ambiguities are flagged for user input.** If the research phase surfaced any unresolved ambiguities or open questions, these are presented at the plan checkpoint as items requiring user guidance, not silently absorbed or ignored. — Pass: if RESEARCH.md contains unresolved items, they appear explicitly in the checkpoint output labeled as "needs your input"; if no unresolved items exist, this section is absent (not an empty placeholder). — source: `BRIEF.md` Desired Behavior "Surfaced decisions — each self-critique fix shown with what/why rationale; research ambiguities flagged for input"; feature_context "Research uncovered these ambiguities that we need your guidance or input on"

- **AC-4: Interactive deep-dive is always offered, never skipped.** The AskUserQuestion deep-dive (offering the user key plan areas to explore before final approval) fires unconditionally — it cannot be short-circuited by "no unresolved findings" or any other condition. — Pass: the AskUserQuestion call with plan area choices appears in the workflow regardless of whether the checker found findings; the word "skip" or equivalent conditional does not gate this step. — source: `BRIEF.md` Existing State "Q&A gate is skipped when plan-checker finds no 'unresolved findings' — user never gets interactive deep-dive opportunity"; Desired Behavior "Interactive deep-dive — AskUserQuestion with key plan areas as choices before final approval (always offered, never skipped)"

- **AC-5: Visual plan architecture is present.** The checkpoint output includes at least one ASCII or markdown flow diagram illustrating the plan's wave/dependency structure — not just a flat table. — Pass: the checkpoint output contains a diagram element (ASCII box/arrow flow or equivalent) alongside the wave/plan table; a table alone without any visual flow is a failing output. — source: `BRIEF.md` Desired Behavior "Visual plan output — ASCII/markdown flows to illustrate plan architecture alongside tables"; feature_context "ASCII/markdown flows for visual plan architecture"

- **AC-6: Approval prompt follows justification, not precedes it.** The "finalize this plan?" approval step appears after all three layers (narrative, surfaced decisions, interactive Q&A) have been presented and completed, not before or concurrently. — Pass: in the workflow's control flow, AskUserQuestion for deep-dive options is presented and resolved before the final "Finalize?" AskUserQuestion fires. — source: `BRIEF.md` Existing State "asked for blanket approval"; Prior Exploration real-world example sequence

- **AC-7: plan.md step 8.6 (User Approval) presentation is replaced, not supplemented.** The current step 8.6 shows "Feature, plan count, task count, waves / Validation status / Key decisions made during Q&A" as a flat summary. This is replaced by the 3-layer justification presentation. The flat summary fields may remain as part of a richer output but cannot be the whole output. — Pass: plan.md step 8.6 contains all three required layers explicitly; the existing flat-table format is not the terminal state of the presentation. — source: `BRIEF.md` Delta table "Justification narrative / Surfaced decisions / Interactive Q&A — all at Plan checkpoint step"; `plan.md` step 8.6 current state (lines 266–275)

- **AC-8: PLAN.md artifact format is unchanged.** The 3-layer presentation is an output of the plan checkpoint workflow, not a change to the PLAN.md file schema or content. — Pass: diff of PLAN.md files written by the planner shows no new sections or frontmatter fields added as a result of this feature; PLAN.md template in planner-reference.md is unchanged. — source: `BRIEF.md` Invariant #1 "PLAN.md artifact format unchanged"

---

### Implicit Requirements

- **IR-1: The interactive deep-dive must offer meaningful choices, not a yes/no.** The user's complaint is about having no visibility into plan reasoning. AskUserQuestion must present specific plan areas as named choices (e.g., "Wave ordering rationale", "Approach decisions", "Coverage gaps") so the user can selectively drill into what they care about — not just a generic "do you have questions?" prompt. — [First principles: a deep-dive that offers no structured choices recreates the same opacity problem; the user said "why is the plan in this order?" — they want area-specific answers on demand]

- **IR-2: The justification narrative must be grounded in the actual plan content, not boilerplate.** The narrative must reference specific tasks, specific requirements, and specific alternatives considered — not a generic "we followed KISS principles and requirements are covered." Generic narratives are the same failure mode as the current flat table. — [First principles: the user is inquisitive and skeptical (CLAUDE.md); a narrative that could apply to any plan does not pass the "why this specific plan?" test]

- **IR-3: Round 1 self-critique fix surfacing must not contradict planner-reference.md's instruction to "fix silently."** The planner still fixes silently in Round 1 (the PLAN.md files are already corrected). What changes is that the checkpoint output includes a retrospective log of those fixes — the planner writes them to its return payload, and the orchestrator surfaces them. The planner's behavior does not change, only the information passed back to the orchestrator. — source: `planner-reference.md` lines 253–264 "Apply all fixes. Do not surface Round 1 fixes to the user." + `BRIEF.md` Invariant #3 "Planner agent planning logic unchanged"; [First principles: invariant says planner logic unchanged — the fix must live in the plan.md orchestrator workflow, not the gsd-planner agent]

- **IR-4: The presentation must respect the UI brand patterns.** Output formatting must use existing GSD visual patterns (stage banners, checkpoint boxes, status symbols) from ui-brand.md. The justification narrative and surfaced decisions should fit within the existing visual language, not introduce new box styles or symbols. — source: `plan.md` required_reading "@{GSD_ROOT}/get-shit-done/references/ui-brand.md"; `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md` Anti-Patterns

- **IR-5: The deep-dive Q&A must complete before the finalize prompt fires.** The user must have the opportunity to change the plan based on deep-dive responses. If deep-dive answers reveal a problem, the user needs a path back to "I want changes" before reaching final approval — this is not simply informational. — [First principles: the user's real concern is informed consent before execution; a deep-dive that is informational-only without a feedback loop still leaves them unable to act on what they learn]

- **IR-6: The feature targets plan.md's checkpoint presentation exclusively.** plan-checker logic, planner planning logic, and PLAN.md format are all invariants. The change seam is the orchestrator (plan.md workflow), specifically the step 8.6 approval block and any surrounding steps that shape what reaches the user. — source: `BRIEF.md` Invariants 1–3; Delta table column "Seam" all pointing to "Plan checkpoint step"

---

### Scope Boundaries

**In scope:**
- plan.md workflow: step 8.6 (User Approval) presentation overhaul
- plan.md workflow: orchestrator logic to collect and pass Round 1 fix details from planner return payload to checkpoint output
- plan.md workflow: research ambiguity surfacing at checkpoint
- plan.md workflow: unconditional AskUserQuestion deep-dive with named area choices before finalize prompt
- ASCII/markdown flow diagram for plan wave/dependency visualization at checkpoint
- Planner return format: add Round 1 fix log to the structured return payload (the planner writes it; the orchestrator reads it)

**Out of scope:**
- Changing PLAN.md artifact format (schema, frontmatter, task XML) — hard invariant
- Changing planner-reference.md planning logic or critique round instructions
- Changing plan-checker (gsd-plan-checker) validation logic
- Adding new pipeline stages before or after planning
- Changing research-workflow or gatherer agents (covered by research-overhaul feature)
- Review stage or execute stage presentation (flagged as follow-up in BRIEF.md, not in scope here)

**Ambiguous:**
- **Where exactly the Round 1 fix log is generated:** planner-reference.md says "do not surface Round 1 fixes to the user" — the invariant says planner logic is unchanged. If the fix log must appear at checkpoint, either: (a) plan.md orchestrator infers the log from diff of planner input vs output, or (b) planner-reference.md is amended to return the log without surfacing it (the orchestrator surfaces it). Option (b) may be considered a planner logic change. Research must resolve which approach is compatible with the invariant. — source: `planner-reference.md` lines 264 + `BRIEF.md` Invariant #3
- **AskUserQuestion key plan areas list:** What specific named choices appear in the deep-dive? Candidates: wave ordering, approach rationale, requirement coverage, assumptions made, alternatives rejected. The feature spec says "key plan areas as choices" without enumerating them. Research should propose the canonical list. — source: `BRIEF.md` Desired Behavior "AskUserQuestion with key plan areas as choices"
- **Trigger for research ambiguity surfacing:** RESEARCH.md may or may not have a structured "open questions" section. If research is from the new research-overhaul format it may have one; if it is legacy format it may not. The surfacing logic must handle both gracefully. — source: `BRIEF.md` Unknowns "Justification narrative can be generated from data already available at checkpoint time"

---

### Risk: Misalignment

- **Risk-1: "Always offered, never skipped" interactive Q&A conflicts with plan.md's existing finding-surfacing loop.** plan.md step 8.3 already uses AskUserQuestion to surface findings one at a time. If the deep-dive Q&A is a second AskUserQuestion pass, the user may see two sequential Q&A rounds with different purposes. The feature spec does not clarify whether the deep-dive replaces the existing finding Q&A, augments it, or runs after it. Conflating them would undermine the clean 3-layer structure. — source: `plan.md` step 8.3 (lines 240–255) vs `BRIEF.md` Desired Behavior Layer 3; [First principles: two AskUserQuestion rounds with unclear relationship creates confusion about which one gates finalization]

- **Risk-2: Surfacing Round 1 fixes without changing planner logic requires the fix log to somehow reach the orchestrator.** The current return format in planner-reference.md (lines 382–412) does not include a Round 1 fix log field. If planner logic is "unchanged," the orchestrator has no structured data to present. Either the invariant is softer than stated (log addition is acceptable), or the orchestrator must reconstruct the log from other signals (brittle). The planner must clarify to the plan whether emitting a fix log is a logic change or a data-format change. — source: `planner-reference.md` Structured Return Formats (lines 382–412) + `BRIEF.md` Invariant #3

- **Risk-3: The visual flow diagram may add noise rather than clarity for simple features.** A single-plan feature (1 wave, 1 plan, 2 tasks) has no meaningful architecture to illustrate. Forcing a diagram for trivially small plans would violate KISS. The implementation must define the threshold below which the diagram is omitted without violating AC-5's intent. — source: `/Users/philliphall/.claude/CLAUDE.md` "KISS — no exceptions"; [First principles: "visual architecture" only has value when there is architecture — single-wave single-plan has no topology worth drawing]
