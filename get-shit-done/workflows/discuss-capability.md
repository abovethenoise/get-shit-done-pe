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

Phase 1 — Identity (what is this?):
1. **Goal** — What does this primitive do? One sentence.
2. **Why it matters** — What problem does it solve? Who benefits?
3. **Boundaries** — What is explicitly in scope? What is explicitly out?

Phase 2 — Contract (what does it take and give?):
4. **Receives** — What inputs does this accept? Type, required/optional, description for each.
5. **Returns** — What outputs does this produce? Type, description for each.
6. **Rules** — What invariants must hold? (Violating one = bug.) Push for deterministic, testable statements.
7. **Sample Payload** — One concrete I/O example showing a realistic input and its expected output.

Phase 3 — Behavior (what else happens?):
8. **Failure Behavior** — What happens on bad input, missing data, downstream failure? Does it propagate?
9. **Atomic Boundaries** — What succeeds or fails together as a unit?
10. **Side Effects** — What always fires: logging, events, state mutations?
11. **Constraints** — Hard limits: libs, patterns, performance, what not to touch.
12. **Context: Must Not Propagate** — What stays encapsulated inside this capability?

Phase 4 — Connections:
13. **Dependencies** — What does this produce for / consume from other capabilities?
14. **Cross-capability concerns** — Surface insights from cross_capability_awareness when relevant
15. **UI surface** — Is this capability user-facing? If yes, which design system entries apply?
    (Only probe if `.docs/design-system.md` exists in the project)

Phase 5 — Meta:
16. **Open questions** — What is still unclear or undecided?
17. **Suggested lens** — Based on the discussion, which framing lens fits? (debug/new/enhance/refactor)

**Round loop:**

1. Call AskUserQuestion (1-4 questions informed by what's unknown from the checklist)
2. Write answers directly into the corresponding CAPABILITY.md template sections (Goal, Contract tables, Failure Behavior table, etc.). Do NOT write to a scratch "Exploration" or "Notes" section — fill the real template sections progressively as answers come in. Partial fills are fine; they get refined in subsequent rounds.
3. Assess: do I have enough to fill the CAPABILITY.md template sections?
   - YES → AskUserQuestion: "I think I have what I need for this capability. Anything else?"
     - User says done → proceed to feature_powerability_probe
     - User has more → back to step 1
   - NO → back to step 1 with questions targeting gaps

No round limit — model self-assesses against done threshold.

**Done threshold:** enough clarity to fill Goal, Contract (Receives/Returns/Rules with at least one Sample Payload), Failure Behavior, and Constraints in CAPABILITY.md. Atomic Boundaries, Side Effects, and Context sections are desirable but not blocking — flag as open questions if unfilled.

**Progression guidance:**
- Start with Phase 1 (identity) — don't jump to contract details before the core idea is solid
- Phase 2 (contract) is the heart — spend the most time here. Push for concrete types, not vague descriptions.
- Phases 3-4 may partially fill from Phase 2 answers — extract and confirm rather than re-asking
- Phase 5 wraps up — suggest lens only after the capability shape is clear

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

<step name="feature_powerability_probe">
After exploration is complete, probe for what features this capability might power.

**Skip if capability was killed or deferred.**

Use AskUserQuestion:
- header: "Features"
- question: "Now that we've defined what this capability does — what kinds of features might it power? For example, what user-facing workflows or experiences would compose this capability? (This is exploratory — no features will be created.)"
- options:
  - "I have some ideas" — User describes feature concepts. Capture them in the Decisions table as "Feature concept: {description}" rows. If the user provides enough detail on a specific feature concept, continue exploring it conversationally (what would it compose, what's the user flow). Record insights but do NOT create feature stubs.
  - "Not sure yet" — Fine. Note in Decisions: "Feature concepts: deferred to later exploration."
  - "Skip" — Move on without recording.

This is purely informational — it helps the user think about composition without committing to anything.
</step>

<step name="update_capability_file">
After exploration is complete (or kill/defer decided), update the capability file.

**Capability file location:** `.planning/capabilities/{slug}/CAPABILITY.md`

Template sections were filled progressively during the round loop. This step is a final pass:

1. **Verify template compliance** — read CAPABILITY.md and check each section matches the template format:
   - Goal: one sentence (not a paragraph)
   - Contract: Receives/Returns as tables (not prose), Rules as numbered invariants, Sample Payload as code block
   - Failure Behavior as table (Condition/Behavior/Propagates?)
   - Dependencies as table (Direction/Capability/What/Notes)
   - Unfilled sections: leave the template placeholder text — do NOT delete sections or leave them empty

2. **Clean up** — remove any raw Q&A notes that leaked outside template sections. Every piece of content should live in its template section.

3. **Update frontmatter:**
   - `status:` → set to `specified` if Goal + Contract (Receives/Returns/Rules) + Failure Behavior are filled; otherwise `exploring`
   - `ui_facing:` → update based on UI surface probe

4. **Decisions table** — should contain only actual decisions (date/decision/context/tradeoffs rows), not Q&A transcripts. Add suggested lens if one surfaced.

If killed or deferred, update the status in frontmatter and add a row to the Decisions table with the reasoning.
</step>

<step name="summarize_and_next">
Present summary of what was captured and next steps.

```
## Capability: {name}
Status: {status}

### Exploration Summary
- Goal: {one sentence}
- Contract: {Receives: N inputs, Returns: N outputs, Rules: N invariants | "partial — see open questions"}
- Suggested lens: {lens or "undecided"}
- Open questions: {count}
- Cross-capability concerns: {list or "none"}
- Feature concepts: {list from powerability probe or "none explored"}

{If killed or deferred:}
### Decision: {Killed | Deferred}
Reasoning: {reasoning}

---

## Next Steps

{If specified (contract filled):}
- `/gsd:new {feature-name}` — Create features that compose this capability
- `/gsd:discuss-feature {feat}` — Explore how a feature uses this capability

{If exploring (contract incomplete):}
- `/gsd:discuss-capability {slug}` — Continue exploring to fill contract gaps

{If related/cross-cutting capabilities surfaced during discussion:}
- `/gsd:discuss-capability {related-cap}` — Explore related capability

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
- Guided exploration covered Goal, Contract (Receives/Returns/Rules/Sample Payload), Failure Behavior, and Constraints at minimum
- Cross-capability concerns surfaced when relevant
- Feature powerability probe offered (informational, no stubs created)
- Capability file updated with all explored template sections
- Status set to `specified` when contract is filled
- Kill/defer handled with reasoning persisted
- User knows next steps (create features, not discuss features of auto-stubs)
</success_criteria>
