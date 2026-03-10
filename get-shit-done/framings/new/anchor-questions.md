# New Anchor Questions

**Lens:** Architect mode
**Direction:** Forward (why -> shape)
**MVU Slots:** problem, who, done_criteria, constraints

---

## Question 1: What problem does this solve, and for whom?

**Purpose:** Establish the WHY before the WHAT. Prevents solutioning before the problem is defined.

**Branching hints:**
- If user leads with a solution ("I want to add X") -> ask what problem X solves; solution may be right but problem must be explicit
- If problem is clear but audience is vague -> ask who experiences this problem and how often
- If problem is broad -> ask which aspect matters most right now (scope narrowing)

## Question 2: What scenarios or examples illustrate the problem or goal?

**Purpose:** Provide concrete examples to anchor the problem or goal in reality. This will help identify features needed to solve the problem.

**Branching hints:**
- If user provides a scenario -> ask for more details to understand the problem better
- If user describes a goal -> ask for a concrete example to make it tangible
- If no examples given -> ask for a simple, illustrative scenario

## Question 3: What does done look like?

**Purpose:** Define success criteria before design begins. Observable, testable outcomes.

**Branching hints:**
- If user describes features -> translate to outcomes ("so success means a user can ___ and see ___?")
- If user says "I'll know it when I see it" -> push for at least one concrete scenario
- If multiple success criteria -> ask which is the minimum viable outcome vs nice-to-have

## Question 4: What constraints are non-negotiable?

**Purpose:** Surface hard limits before they become late surprises. Technical, business, timeline, dependency constraints.

**Branching hints:**
- If no constraints mentioned -> probe: existing tech stack? Timeline? Budget? Compatibility requirements?
- If many constraints -> prioritize: which ones would kill the project if violated?
- If constraints conflict with success criteria -> flag the tension explicitly in the brief

## Question 5: What is explicitly out of scope?

**Purpose:** Define the boundary. What this capability does NOT do, even if related.

**Branching hints:**
- If user struggles to exclude anything -> suggest adjacent capabilities and ask "does this include ___?"
- If scope is very tight -> good; confirm it matches the problem statement
- If scope is very broad -> this may need decomposition into multiple capabilities; flag in the brief

## Question 6: What shape does this take?

**Purpose:** Move from problem to solution shape. Not detailed design -- just the rough form factor.

**Branching hints:**
- If user has strong opinions on shape -> capture them as constraints, not requirements
- If user defers to you -> propose 2-3 shape options with tradeoffs; user picks direction
- If shape is unclear -> this is fine at discovery stage; flag as open question, pipeline stages will resolve

## Question 7: Does this have a visual or interactive element?

**Purpose:** Surface UI/UX needs early so design system context informs the rest of discovery. Only ask if `.docs/design-system.md` exists in the project — skip entirely otherwise.

**Branching hints:**
- If yes -> read `.docs/design-system.md`, surface applicable tokens/components/patterns. Note which design system entries apply in the brief. Set `ui_facing: true` on the capability.
- If partially (e.g., has a settings UI but core logic is backend) -> same as yes; note which parts are UI-facing
- If no -> set `ui_facing: false`; no design references needed
