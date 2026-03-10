<purpose>
Guided exploration of WHAT and WHY for a capability. Thinking partner for capability-level clarity before committing to a framing lens.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to help clarify the capability's core idea, boundaries, and suggested lens, and to surface cross-capability concerns.

This command is optional and repeatable. It can also kill or defer ideas with reasoning.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/doc-tiers.md
</required_reading>

<downstream_awareness>
**discuss-capability enriches:**

1. **Capability file** in `.planning/capabilities/{slug}/CAPABILITY.md` — status, exploration section, suggested lens
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

Parse JSON for: `capability_list`, `capability_count`, `capabilities_dir`.
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

<step name="semantic_pre_scan">
Before committing to a design direction, run mgrep against the capability description
(user's "core idea" from step 2 or existing Goal section).

Surface to user:
  - **Existing implementations**: Code that already does what this capability describes
    (reuse opportunity — may not need a new capability at all)
  - **Partial overlaps**: Code that covers part of the contract
    (integration point, not a blocker)
  - **Name collisions**: Existing capabilities with different names but
    semantically similar goals (possible duplicate or needs differentiation)

Present findings before Q&A step so user can adjust scope based on what exists.
</step>

<step name="load_capability">
Load the capability file and check its status.

**Capability file location:** `.planning/capabilities/{slug}/CAPABILITY.md`

Read the capability file content. Extract:
- **status**: exploring | specified | in-progress | complete | killed | deferred
- **Exploration section**: core idea, open questions, suggested lens (if previously discussed)
- **Brief section**: empty or populated
- **Requirements section**: empty or populated

**Load project context for grounding (if files exist):**
- `.docs/architecture.md` — system architecture context
- `.docs/domain-vocabulary.md` — domain concepts and vocabulary
- `.docs/brand.md` — voice, tone, design direction

These provide grounding so exploration is informed by project architecture and domain.
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

Enhance cross-capability awareness with mgrep:
  Run mgrep against the capability's Goal to find other capabilities with
  semantic overlap. Compare against explicit composes[] edges:
    - Overlap WITH composes[] edge → expected dependency, skip
    - Overlap WITHOUT edge → surface as "possible undeclared relationship"

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
7. **UI surface** — Is this capability user-facing? If yes, which design system entries apply?
   (Only probe if `.docs/design-system.md` exists in the project)

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

**UI surface gate (checklist item 7):**
After core idea + boundaries are established (items 1-3), if `.docs/design-system.md` exists in the project:

Use AskUserQuestion:
- header: "UI Surface"
- question: "Is this capability user-facing (renders UI that users see or interact with)?"
- options:
  - "Yes — directly user-facing" → Read `.docs/design-system.md`, surface available tokens/components/patterns, ask which apply. Inject `## Design References` table into CAPABILITY.md. Set `ui_facing: true` in frontmatter.
  - "Partially — has a UI surface" → Same as Yes.
  - "No — backend/system only" → Set `ui_facing: false` in frontmatter. No Design References section written.

If `.docs/design-system.md` does not exist, skip this gate entirely — no question asked.

**Re-exploration: check ui_facing drift:**
When re-running discuss-capability on an existing capability, check whether `ui_facing` status needs updating. A capability that started as non-UI may have gained a UI surface through feature composition. If a composed feature introduces UI concerns, surface this during re-exploration and offer to flip `ui_facing` and add Design References.

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

**Capability file location:** `.planning/capabilities/{slug}/CAPABILITY.md`

Update the existing CAPABILITY.md (created by `capability-create`). Do NOT overwrite the entire file — update these sections:

- **Frontmatter `status:`** — update to reflect current state
- **Decisions table** — add exploration decisions with date, context, tradeoffs
- **Goal / Why sections** — update if exploration refined the core idea

If killed or deferred, update the status in frontmatter and add a row to the Decisions table with the reasoning.

If exploration surfaced a suggested framing lens, add it to the Decisions table.
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

{If exploring/specified — scan feature statuses in capability dir:}

  {List undiscussed features:}
  - `/gsd:discuss-feature {feat}` — for each undiscussed feature

  {If related/cross-cutting capabilities surfaced during discussion:}
  - `/gsd:discuss-capability {related-cap}` — Explore related capability

  {Always:}
  - "If you'd like me to assume specs for undiscussed features, just say so."

{If killed:}
- Capability marked as killed. Can be overridden later via `/gsd:discuss-capability {slug}`.

{If deferred:}
- Capability deferred. Can be picked up later via `/gsd:discuss-capability {slug}`.
```
</step>

<step name="git_commit">
Commit the capability file update:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(capability): update {slug} exploration" --files ".planning/capabilities/{slug}/CAPABILITY.md"
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
