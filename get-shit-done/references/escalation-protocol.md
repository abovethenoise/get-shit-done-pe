# Escalation Protocol

Universal 3-tier escalation reference for the framing pipeline. Every stage can push back upstream when it detects a problem. The mechanism is consistent across all stages; what constitutes each tier varies per stage.

---

## 3-Tier Model

| Tier | Mechanism | Pipeline Effect |
|------|-----------|----------------|
| **Minor** | Flag the issue, continue execution. Reflect stage captures it in documentation. | No interruption. Issue logged for future awareness. |
| **Moderate** | Pause pipeline. Surface issue to user. Propose specific amendment. | Pipeline waits for user decision before continuing. |
| **Major** | Halt pipeline. Recommend returning to a specific upstream stage. Propose-and-confirm -- no auto-return. | Pipeline stops until user explicitly confirms the backward return or overrides. |

---

## Per-Stage Severity Examples

### Research Stage

| Tier | Examples |
|------|----------|
| Minor | Research found a minor dependency version mismatch that won't block implementation. Research uncovered an alternative approach worth noting but not required. |
| Moderate | Research found the proposed approach has a known limitation that affects 1-2 requirements. Research discovered a missing prerequisite that needs user input to resolve. |
| Major | Research found the entire approach is infeasible given current constraints (e.g., required API doesn't exist, fundamental architectural conflict). Research discovered the problem is already solved elsewhere in the codebase -- discovery may have been misdirected. |

### Requirements Stage

| Tier | Examples |
|------|----------|
| Minor | A requirement is ambiguous but has a reasonable default interpretation. One acceptance criterion could be more specific but intent is clear. |
| Moderate | Requirements contradict the brief's scope boundary (in-scope item not covered, or out-of-scope item implied). The lens weighting produces requirements that don't match the problem statement's emphasis. |
| Major | Brief's problem statement doesn't translate into testable requirements -- discovery was insufficient. Requirements reveal the capability overlaps significantly with an existing one -- may need to merge or re-scope at discovery level. |

### Plan Stage

| Tier | Examples |
|------|----------|
| Minor | A task's artifact path could be better named. Wave ordering is suboptimal but not incorrect. |
| Moderate | A requirement cannot be satisfied with the planned approach -- need to adjust 1-2 tasks or add a task. The risk posture from the lens conflicts with a specific task's approach (e.g., refactor lens but plan has a big-bang migration step). |
| Major | Requirements are internally contradictory -- cannot plan a coherent execution path. The scope implied by requirements is fundamentally larger than what discovery scoped -- needs re-scoping at requirements or discovery level. |

### Execute Stage

| Tier | Examples |
|------|----------|
| Minor | Implementation found a cleaner approach than planned -- minor deviation from plan but same outcome. A test revealed an edge case worth documenting but not blocking. |
| Moderate | Implementation discovered a requirement is impossible to satisfy as written -- needs amendment. A blocking dependency was missed in planning -- need to add a task or reorder. |
| Major | Execution reveals the entire approach is wrong (e.g., the hypothesis was false for /debug, the architectural choice doesn't scale for /new). Needs return to research or discovery. |

### Review Stage

| Tier | Examples |
|------|----------|
| Minor | Code quality finding -- style or convention issue that doesn't affect correctness. Documentation gap -- a decision wasn't recorded but implementation is correct. |
| Moderate | Implementation satisfies requirements but the brief's intent check fails -- built what was specified but doesn't solve the original problem. One requirement verdict is "not met" but the fix is straightforward (< 1 task of work). |
| Major | Multiple requirements verdicts are "not met" -- execution missed significant scope. Review finds a regression in existing behavior that wasn't caught by the plan's invariant checks. The brief's problem statement is fundamentally not addressed despite spec compliance. |

---

## Loop Termination Rules

### Backward Reset Budget

Each pipeline run has a global escalation counter:

```
ESCALATION_STATE:
  backward_resets: 0
  max_backward_resets: 1
```

**Rule: Maximum 1 backward reset per pipeline run.**

A backward reset occurs when the pipeline returns to an earlier stage (e.g., from review back to requirements, or from plan back to discovery).

### Budget Exhaustion

When `backward_resets >= max_backward_resets`:

1. No further backward returns are permitted
2. The user is presented with:
   - Accept the proposed amendment and continue forward
   - Override and continue forward with documented risk
   - Stop the pipeline entirely (user restarts manually after resolving the root issue)

### User Restart

After a hard stop, the user can:
- Fix the root issue outside the pipeline
- Restart the pipeline from any stage by re-invoking with appropriate arguments
- The new run gets a fresh escalation budget (1 backward reset)

---

## Propose-and-Confirm Pattern

Major issues use propose-and-confirm. The pipeline NEVER auto-returns to an upstream stage.

**Flow:**

```
Stage detects major issue
  |
  v
Pipeline halts
  |
  v
Present to user:
  - What was found
  - Why it's major
  - Recommended upstream stage to return to
  - What would change if we return
  |
  v
User confirms one of:
  - "Return to {stage}" -- backward reset (uses budget)
  - "Override and continue" -- proceed with documented risk
  - "Stop pipeline" -- halt for manual resolution
```

**Why propose-and-confirm:** Auto-returning wastes time if the user has context that resolves the issue without going back. The user may also prefer to stop entirely and rethink, rather than loop.

---

## Escalation Signal Format

Stages indicate escalation severity using structured markers in their output:

```
[ESCALATION: Minor] {description}
[ESCALATION: Moderate] {description}. Proposed amendment: {amendment}
[ESCALATION: Major] {description}. Recommendation: return to {stage} because {reason}
```

The pipeline orchestrator (framing-pipeline.md) checks for these markers at each stage boundary and routes accordingly.

---

## Stage Boundary Checks

The orchestrator performs escalation checks at each stage transition:

```
Research complete -> check -> Requirements
Requirements approved -> check -> Plan
Plan finalized -> check -> Execute
Execute complete -> check -> Review
Review complete -> check -> Reflect
```

Minor issues accumulate and are captured in the reflect (documentation) stage. Moderate and major issues halt the pipeline at the stage boundary where they were detected.
