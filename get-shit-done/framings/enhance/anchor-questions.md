# Enhance Anchor Questions

**Lens:** Editor mode
**Direction:** Outward (current state -> fit)
**MVU Slots:** current_behavior, desired_behavior, delta

---

## Question 1: What does the system do today?

**Purpose:** Ground the conversation in concrete current behavior. No enhancement makes sense without understanding the starting point.

**Branching hints:**
- If user describes current behavior precisely -> move to Question 2
- If user is vague -> ask for a specific scenario walkthrough ("walk me through what happens when ___")
- If current behavior varies by context -> document the variants; the enhancement may apply to all or some

## Question 2: What should it do instead (or additionally)?

**Purpose:** Define the desired end state. This is the target, not the change itself.

**Branching hints:**
- If desired behavior is a modification -> clarify: replace existing behavior or add alongside it?
- If desired behavior is entirely new functionality -> this may be /new, not /enhance; flag for lens check
- If multiple desired behaviors -> ask which is the primary enhancement vs follow-ups

## Question 3: What is the delta between current and desired?

**Purpose:** Identify the specific seam where the change happens. The delta is what gets built.

**Branching hints:**
- If delta is small and well-defined -> good; this is a clean enhancement
- If delta touches many parts of the system -> this may need /refactor first; flag for lens check
- If delta is unclear -> the user may not fully understand current behavior; loop back to Question 1

## Question 4: What must NOT change?

**Purpose:** Identify behavioral invariants. Every enhancement risks breaking something that works.

**Branching hints:**
- If user names specific invariants -> document them as hard constraints
- If user says "nothing should break" -> too vague; ask about specific downstream consumers, API contracts, user workflows
- If no invariants exist -> this is unusual; double-check that there are no consumers of current behavior

## Question 5: How does this fit with what is planned or in progress?

**Purpose:** Check for conflicts with other work. An enhancement that conflicts with planned changes creates merge pain.

**Branching hints:**
- If no conflicts -> good; note this in the brief
- If potential conflicts -> flag them; the enhancement may need sequencing
- If this enhancement enables future work -> note it; this affects priority

## Question 6: Does this enhancement touch anything the user sees?

**Purpose:** If the enhancement changes visual or interactive elements, the design system should inform the change. Only ask if `.docs/design-system.md` exists in the project — skip entirely otherwise.

**Branching hints:**
- If yes -> read `.docs/design-system.md`, check whether the change aligns with existing tokens/components/patterns. Note applicable design references in the brief.
- If the enhancement changes layout, spacing, colors, or interaction patterns -> surface the relevant design system entries; the delta should stay within the system
- If no visual changes -> skip; no design references needed
