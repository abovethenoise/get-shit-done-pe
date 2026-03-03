<purpose>
Guided exploration of WHAT and WHY for a capability. Thinking partner for capability-level clarity before committing to a framing lens.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to help clarify the capability's core idea, boundaries, and suggested lens, and to surface cross-capability concerns.

This command is optional and repeatable. It can also kill or defer ideas with reasoning.
</purpose>

<downstream_awareness>
**discuss-capability enriches:**

1. **Capability file** in `.documentation/capabilities/` — status, exploration section, suggested lens
2. **Framing commands** (/debug, /new, /enhance, /refactor) — suggested lens guides which entry point to use
3. **discuss-feature** — capability-level clarity feeds feature-level discussion

**Not your job:** Figure out HOW to implement features. That's discuss-feature and planning.
</downstream_awareness>

<process>

<step name="initialize" priority="first">
Capability reference from argument (required — accepts fuzzy natural language).

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init discuss-capability)
```

Parse JSON for: `capability_list`, `capability_count`, `documentation_dir`, `capabilities_dir`.
</step>

<step name="fuzzy_resolve">
Resolve the user's natural language reference to a specific capability.

**Input:** The user's argument text (e.g., "drill timing", "the spaced repetition thing", "mistake-grading")

**Resolution using capability-list output:**

```bash
CAP_LIST=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-list)
```

Parse the capabilities array from the JSON response. Match the user's reference against capability slugs:

1. **Exact slug match** — Direct hit, use it
2. **Substring match** — User text is substring of a slug (or vice versa). If unique, auto-select. If multiple, present top 3.
3. **No match** — Ask user to clarify or offer to create a new capability

**After resolving, confirm explicitly:**

Use AskUserQuestion:
- header: "Capability"
- question: "Resolved to: **{capability-slug}** (status: {status}). Is this correct?"
- options:
  - "Yes, continue" — Proceed with this capability
  - "No, show me the list" — Display all capabilities for manual selection
  - "Create new" — Create a new capability instead

If "No, show me the list": Display capability list with slugs and statuses, let user pick.
If "Create new": Ask for capability name, create via `capability-create`, then proceed.
</step>

<step name="load_capability">
Load the capability file and check its status.

**Capability file location:** `.documentation/capabilities/{slug}.md`

If the file does not exist, check `.planning/capabilities/{slug}/CAPABILITY.md` for working artifact data.

Read the capability file content. Extract:
- **status**: exploring | specified | in-progress | complete | killed | deferred
- **Exploration section**: core idea, open questions, suggested lens (if previously discussed)
- **Brief section**: empty or populated
- **Requirements section**: empty or populated
</step>

<step name="check_status">
Check capability status before proceeding.

**If status is `killed`:**
Display the kill reasoning from the capability file.

Use AskUserQuestion:
- header: "Killed"
- question: "This capability was previously killed. Reasoning: {reasoning}. What do you want to do?"
- options:
  - "Override and re-explore" — Reset status to exploring, clear kill reasoning
  - "Keep killed" — Exit workflow

If "Keep killed": Exit workflow.
If "Override and re-explore": Update status to `exploring`, clear reasoning, continue.

**If status is `deferred`:**
Display the deferral reasoning.

Use AskUserQuestion:
- header: "Deferred"
- question: "This capability was deferred. Reasoning: {reasoning}. What do you want to do?"
- options:
  - "Override and re-explore" — Reset status to exploring
  - "Keep deferred" — Exit workflow

If "Keep deferred": Exit workflow.
If "Override and re-explore": Update status to `exploring`, continue.

**If status is `complete` or `in-progress`:**
Use AskUserQuestion:
- header: "Status"
- question: "This capability is already {status}. Re-exploring may surface new insights or changes."
- options:
  - "Continue exploring" — Proceed with discussion
  - "Exit" — Leave as-is

**If status is `exploring` or `specified` or no status:**
Continue to guided exploration.
</step>

<step name="cross_capability_awareness">
Before diving into exploration, scan the capability map for cross-cutting concerns.

```bash
CAP_LIST=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-list)
```

Parse all capabilities. Identify potential cross-cutting concerns:
- Capabilities that share domain concepts (e.g., both touch "user sessions", "scoring", "scheduling")
- Capabilities with dependency relationships (one produces what another consumes)
- Capabilities that might conflict (competing approaches to the same problem)

Store cross-capability insights internally for use during guided exploration. Surface them naturally when relevant — don't dump a list upfront.
</step>

<step name="guided_exploration">
Conduct guided Q&A exploring WHAT and WHY for this capability.

MANDATORY: Every question MUST go through AskUserQuestion. NEVER output a question as plain text.
NEVER narrate what you are about to do or what just happened between tool calls.
Do NOT output filler like "Let me load...", "The user selected...", "Good, let me...".
Go DIRECTLY from one tool call to the next. The only text output allowed between
AskUserQuestion calls is the stage banner or a brief (1-line) context note embedded
in the next AskUserQuestion's question field.
After EVERY AskUserQuestion return, write results to capability working state before the next question.

**Background checklist (not sequential stages — use to assess gaps):**

1. **Core idea** — What is this capability at its essence? One sentence.
2. **Why it matters** — What problem does it solve? Who benefits?
3. **Boundaries** — What is explicitly in scope? What is explicitly out?
4. **Open questions** — What is still unclear or undecided?
5. **Suggested lens** — Based on the discussion, which framing lens fits? (debug/new/enhance/refactor)
6. **Cross-capability concerns** — Surface insights from cross_capability_awareness when relevant

**Round loop:**

1. Call AskUserQuestion (1-4 questions informed by what's unknown from the checklist)
2. Write answers to capability working notes (in the capability file's Exploration section)
4. Assess: do I have enough to stub initial feature structure?
   - YES → AskUserQuestion: "I think I have what I need for this capability. Anything else?"
     - User says done → proceed to update_capability_file
     - User has more → back to step 1
   - NO → back to step 1 with questions targeting gaps

No round limit — model self-assesses against done threshold.

**Done threshold:** enough clarity to stub initial feature structure (feature names + one-line descriptions).

**If previous exploration exists:**
Embed the previous exploration summary IN the AskUserQuestion question field:
- header: "Prior Notes"
- question: "Previous exploration captured:\n\n{summary of prior exploration}\n\nHas anything changed?"
- options:
  - "Still accurate" — Keep prior notes, continue exploring gaps
  - "Something changed" — Let me update specific points
Do NOT output the summary as separate plain text before the AskUserQuestion.

**Cross-capability surfacing:**
When discussion touches on something that overlaps with another capability, raise it naturally:
"This overlaps with {other-capability} — {specific concern}. Worth noting."

**Kill/defer detection:**
If during discussion the user expresses doubt about the capability's value:
- "I don't think we need this"
- "This might be premature"
- "Let's not build this yet"

Recognize this as a potential kill/defer signal. Ask:

Use AskUserQuestion:
- header: "Direction"
- question: "Sounds like you're reconsidering this capability. What's the right move?"
- options:
  - "Kill it" — Mark as killed with reasoning
  - "Defer it" — Mark as deferred with reasoning
  - "Keep exploring" — Continue discussion, doubt was just thinking aloud
</step>

<step name="update_capability_file">
After exploration is complete (or kill/defer decided), update the capability file.

**Capability file location:** `.documentation/capabilities/{slug}.md`

If the file does not exist, create it.

**File format:**

```markdown
# {Capability Name}
status: {exploring | specified | in-progress | complete | killed | deferred}

## Exploration
Core idea: {one sentence captured during discussion}
Open questions: {list of unresolved questions}
Suggested lens: {debug | new | enhance | refactor | undecided}

{If killed:}
## Kill Reasoning
{Why this capability was killed, captured from discussion}
{Date killed}

{If deferred:}
## Deferral Reasoning
{Why this capability was deferred}
{Date deferred}

## Brief
(empty until framing runs)

## Requirements
(empty until pipeline runs)
```

Write the file. If the file already existed, preserve Brief and Requirements sections — only update status, Exploration, and kill/defer reasoning.

**Scaffold feature directories and stubs:**

After updating the capability file, create feature directories and FEATURE.md stubs for each feature identified during discussion. For each feature:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{cap-slug}" "{feature-name}"
```

This creates `.planning/capabilities/{cap-slug}/features/{feat-slug}/FEATURE.md` using the standard template with EU/FN/TC placeholder sections. These placeholders get filled during discuss-feature.

Skip this step if the capability was killed or deferred.
</step>

<step name="summarize_and_next">
Present summary of what was captured and next steps.

```
## Capability: {name}
Status: {status}

### Exploration Summary
- Core idea: {one sentence}
- Suggested lens: {lens or "undecided"}
- Open questions: {count}
- Cross-capability concerns: {list or "none"}

{If killed or deferred:}
### Decision: {Killed | Deferred}
Reasoning: {reasoning}

---

## Next Steps

{If exploring/specified:}
- `/gsd:{suggested-lens} {capability-slug}` — Start framing with suggested lens
- `/gsd:discuss-feature {capability-slug}/{feature}` — Explore specific features
- `/gsd:discuss-capability {capability-slug}` — Continue exploring (repeatable)

{If killed:}
- Capability marked as killed. Can be overridden later via `/gsd:discuss-capability {slug}`.

{If deferred:}
- Capability deferred. Can be picked up later via `/gsd:discuss-capability {slug}`.
```
</step>

<step name="git_commit">
Commit the capability file update:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(capability): update {slug} exploration" --files ".documentation/capabilities/{slug}.md"
```
</step>

</process>

<success_criteria>
- Capability resolved from fuzzy reference (confirmed with user)
- Status checked (killed/deferred shows reasoning, offers override)
- Guided exploration covered core idea, boundaries, and suggested lens
- Cross-capability concerns surfaced when relevant
- Capability file updated with exploration notes
- Kill/defer handled with reasoning persisted
- User knows next steps
</success_criteria>
