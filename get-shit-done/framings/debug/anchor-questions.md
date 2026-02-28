# Debug Anchor Questions

**Lens:** Detective mode
**Direction:** Backward (symptom -> root cause)
**MVU Slots:** symptom, reproduction_path, hypothesis

---

## Question 1: What exactly is happening?

**Purpose:** Establish the observable symptom without interpretation. Separate what the user sees from what they think is wrong.

**Branching hints:**
- If symptom is vague ("it's broken") -> ask for specific error messages, screenshots, or output
- If symptom is clear -> move to Question 2
- If multiple symptoms -> ask which appeared first (temporal ordering narrows search)

## Question 2: When did it start, and what changed?

**Purpose:** Establish timeline and narrow the change surface. Most bugs trace to a recent change.

**Branching hints:**
- If user knows exactly when -> focus on what changed at that time (code, config, data, environment)
- If gradual onset -> ask about frequency and conditions (intermittent bugs need reproduction paths)
- If "it never worked" -> pivot to Question 3 directly (this may be a misunderstanding, not a regression)

## Question 3: Can you make it happen reliably?

**Purpose:** Establish a reproduction path. Without reproduction, debugging is guesswork.

**Branching hints:**
- If reproducible -> document exact steps, inputs, and environment as the reproduction path
- If intermittent -> ask about conditions that correlate (load, timing, specific data, specific user)
- If cannot reproduce -> flag this as an open question in the brief; hypothesis must account for non-reproducibility

## Question 4: What have you already tried or ruled out?

**Purpose:** Avoid re-investigating dead ends. Capture existing evidence and eliminated hypotheses.

**Branching hints:**
- If user has strong hypothesis -> validate it against the symptom and reproduction path
- If user has tried nothing -> this is fine; move to Question 5
- If user has tried many things -> extract what each attempt revealed (negative results are evidence)

## Question 5: Where does the system boundary lie?

**Purpose:** Isolate the fault domain. Is this in our code, a dependency, infrastructure, or data?

**Branching hints:**
- If clearly in our code -> narrow to module/component
- If unclear -> the brief should flag isolation as an open question
- If external dependency -> the brief should note this; fix strategy differs (workaround vs upstream report)
