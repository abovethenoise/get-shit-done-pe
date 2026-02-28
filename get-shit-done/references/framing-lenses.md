# Framing Lenses Reference

Authoritative behavioral specification for the four discovery lenses. All framing workflows, pipeline stages, and review processes reference this document.

---

## Lens Definitions

### Debug (Detective Mode)

**Direction:** Backward -- from symptom to root cause.
**Tone:** Convergent. Narrow the search space. Eliminate hypotheses.
**Anchor questions:** `framings/debug/anchor-questions.md`

**MVU Slots:**

| Slot | Completion Criteria |
|------|-------------------|
| symptom | Observable behavior described without interpretation. Specific error messages, outputs, or states documented. |
| reproduction_path | Steps to reliably trigger the symptom. Environment, inputs, and sequence specified. If intermittent, correlation conditions documented. |
| hypothesis | At least one falsifiable hypothesis about root cause. Must be testable -- not "something is wrong" but "module X fails when input Y exceeds Z". |

**Brief Specification fields:** symptom, reproduction_path, hypothesis, evidence

---

### New (Architect Mode)

**Direction:** Forward -- from problem to shape.
**Tone:** Exploratory but disciplined. Define before designing.
**Anchor questions:** `framings/new/anchor-questions.md`

**MVU Slots:**

| Slot | Completion Criteria |
|------|-------------------|
| problem | The problem this capability solves, stated in one sentence. Audience identified. |
| who | Who experiences this problem. Not "users" -- specific role, persona, or context. |
| done_criteria | At least one observable, testable outcome that defines success. |
| constraints | Non-negotiable limits: technical, business, timeline, dependency. If none, explicitly stated as unconstrained. |

**Brief Specification fields:** capability_definition, boundaries, constraints, success_criteria

---

### Enhance (Editor Mode)

**Direction:** Outward -- from current state to extended state.
**Tone:** Pragmatic, surgical. Find the seam, extend through it.
**Anchor questions:** `framings/enhance/anchor-questions.md`

**MVU Slots:**

| Slot | Completion Criteria |
|------|-------------------|
| current_behavior | Concrete description of what the system does today in the relevant area. Not aspirational. |
| desired_behavior | What the system should do after this work. Clearly distinguishable from current. |
| delta | The specific change between current and desired. Identifiable seam where the modification occurs. |

**Brief Specification fields:** current_behavior, desired_behavior, delta, invariants

---

### Refactor (Surgeon Mode)

**Direction:** Underneath -- restructure without changing external behavior.
**Tone:** Risk-aware. Understand load-bearing walls before moving them.
**Anchor questions:** `framings/refactor/anchor-questions.md`

**MVU Slots:**

| Slot | Completion Criteria |
|------|-------------------|
| current_design | How the system is structured today. Load-bearing walls and organic growth areas identified. |
| target_design | How the system should be structured after. Not "cleaner" -- specific structural changes named. |
| breakage | What breaks during transition. Consumers, contracts, data migrations, test coverage gaps documented. |

**Brief Specification fields:** current_design, target_design, migration_risk, behavioral_invariants

---

## Exit Signals

Three conditions can end discovery. They apply identically across all lenses.

| Signal | Trigger | Action |
|--------|---------|--------|
| MVU Met | All named slots for the active lens pass their completion criteria. | System proposes transition to pipeline. Summary playback is mandatory before proceeding. |
| User Override | User flags remaining gaps but chooses to proceed anyway. | Document unfilled slots as explicit assumptions in the brief's Unknowns section. Proceed. |
| Diminishing Returns | Circling detected: same question asked twice, same answer repeated, no new information in last 2 exchanges. | System flags the pattern. Propose proceeding with current state or switching approach. |

---

## Cross-Framing Detection Rules

During discovery, the system monitors for lens misclassification. Detection can trigger at two points:

**1. Upfront validation (before first anchor question):**
- /new but user describes existing functionality -> suggest /enhance
- /enhance but no existing behavior to extend -> suggest /new
- /refactor but user describes correctness issues -> suggest /debug
- /debug but user describes desired structural changes -> suggest /refactor

**2. Mid-discovery pivot (during anchor questions):**
- If answers to anchor questions consistently describe a different lens's domain, offer to switch.
- On lens pivot: zero out the Specification section in the brief. Meta and Context survive. Wrong-lens data is worse than empty.

---

## Compound Work

Some work spans two lenses. The compound model handles this without separate runs.

**Structure:** Primary lens leads discovery. Secondary lens informs specific areas.

**Example:** "This is primarily /enhance with a /refactor component" -- editor-mode discovery drives the process, but Question 2 (desired behavior) triggers surgeon-mode probing of the structural changes needed.

**Precedence rules by pipeline stage:**

| Stage | Primary Lens Governs | Secondary Lens Informs |
|-------|---------------------|----------------------|
| Discovery | Anchor questions, MVU slots, exit conditions | Additional probing on relevant questions |
| Requirements | Weight distribution (which layer is richest) | Additional requirements in secondary lens's strong layer |
| Plan | Decomposition strategy, risk posture | Task ordering for secondary concerns |
| Execute | Solution approach, what to preserve vs replace | Implementation constraints from secondary lens |
| Review | Definition of done, primary validation targets | Regression checks from secondary lens's invariants |

**Brief representation:** `primary_lens` and `secondary_lens` fields in Meta. Specification section uses primary lens's variant. Secondary lens concerns appear in Context or Unknowns.

---

## Brief Reset on Lens Pivot

When discovery pivots from one lens to another (either upfront or mid-discovery):

1. **Preserve:** Meta (update lens fields), Context (existing state, modules, prior exploration), Unknowns, Scope Boundary
2. **Zero out:** Specification section entirely. Replace with the new lens's variant template.
3. **Rationale:** Wrong-lens Specification data actively misleads downstream stages. Empty is safer than wrong.

---

## Summary Playback

Before transitioning from discovery to the pipeline, the system presents the completed brief to the user. This is mandatory, not optional.

**Purpose:** Catch misunderstandings, trigger "wait, I forgot..." moments, and establish mutual agreement on what was discovered.

**Format:** The brief itself is the playback surface. Present it, ask for confirmation or corrections.
