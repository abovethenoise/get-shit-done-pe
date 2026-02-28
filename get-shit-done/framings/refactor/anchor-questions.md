# Refactor Anchor Questions

**Lens:** Surgeon mode
**Direction:** Underneath (current design -> migration path)
**MVU Slots:** current_design, target_design, breakage

---

## Question 1: What is the current design and why does it exist?

**Purpose:** Understand load-bearing walls before moving them. Every design decision had a reason, even if it was expedience.

**Branching hints:**
- If user can explain the original reasoning -> document it; the refactor must preserve or explicitly reject those reasons
- If user says "it just grew this way" -> organic growth means hidden dependencies; extra caution needed
- If current design is undocumented -> the first step is understanding, not changing; flag this in the brief

## Question 2: What pressure is this design failing under?

**Purpose:** Identify the specific pain. Refactoring without pressure is premature optimization.

**Branching hints:**
- If pressure is performance -> quantify: what is slow, how slow, what is acceptable?
- If pressure is complexity -> identify: where do developers get confused, what takes too long to change?
- If pressure is correctness -> this might be /debug, not /refactor; flag for lens check
- If no clear pressure -> challenge the need to refactor at all

## Question 3: What does the target design look like?

**Purpose:** Define the destination. A refactor without a target is wandering.

**Branching hints:**
- If user has a clear target -> validate it against the pressure points from Question 2
- If user knows what is wrong but not what is right -> propose 2-3 structural options with tradeoffs
- If target design is "just clean it up" -> too vague; push for specific structural changes

## Question 4: What breaks during the transition?

**Purpose:** Map the migration risk. The danger zone is between current and target.

**Branching hints:**
- If changes are internal (no API changes) -> risk is lower; focus on test coverage gaps
- If changes affect external consumers -> document every consumer and their contract
- If migration requires data changes -> flag this as high risk; data migrations are irreversible in practice

## Question 5: What is the behavioral contract that must survive?

**Purpose:** Define the invariant surface. After refactoring, external behavior must be identical.

**Branching hints:**
- If contract is well-defined (types, tests, API specs) -> the refactor has a safety net
- If contract is implicit -> documenting it IS part of the refactor; add to scope
- If some behavior should change -> this is not a pure refactor; it is refactor + enhance; flag for compound lens
