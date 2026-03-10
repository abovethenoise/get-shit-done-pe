<purpose>
Guided exploration of HOW a specific feature works. Thinking partner for feature-level clarity between planning and execution.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to help clarify implementation approach, edge cases, and dependencies for a specific feature.

This command is optional per feature. It can kill or defer features, and can route backward to discuss-capability when the feature reveals a capability-level misconception.
</purpose>

<downstream_awareness>
**discuss-feature feeds into:**

1. **FEATURE.md** at `.planning/features/{feat-slug}/FEATURE.md` — Goal, Flow, Scope, composes[]
2. **Planning** — Feature-level clarity informs task decomposition
3. **discuss-capability** — Backward routing when feature reveals capability misconception

**Not your job:** Execute the feature. That's the execute workflow.
</downstream_awareness>

<process>

<step name="initialize" priority="first">
Feature reference from argument (required — accepts fuzzy natural language).

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init discuss-feature)
```

Parse JSON for: `capability_list`, `feature_list`, `feature_count`, `capabilities_dir`.
</step>

<step name="fuzzy_resolve">
Resolve the user's natural language reference to a specific feature.

**Input:** The user's argument text (e.g., "drill timing", "the spaced repetition thing", "password-reset")

**Resolution using feature-list output from init:**

Parse the `feature_list` array. Match the user's reference against feature slugs:

1. **Exact slug match** — Direct hit on feature slug, use it
2. **Substring match** — User text is substring of a feature slug (or vice versa). If unique, auto-select. If multiple, present top 3.
3. **No match** — Ask user to clarify. Show available features.

**After resolving, confirm explicitly:**

Use AskUserQuestion:
- header: "Feature"
- question: "Resolved to: **{feature-slug}** (status: {status}). Is this correct?"
- options:
  - "Yes, continue" — Proceed with this feature
  - "No, show me the list" — Display all features for manual selection
</step>

<step name="load_feature">
Load the feature file and relevant capability context.

**Feature file location:** `.planning/features/{feat-slug}/FEATURE.md`

Read the feature file content. Extract:
- **status**: exploring | specified | in-progress | complete | killed | deferred
- **composes[]**: list of capability slugs from frontmatter

**Load composed capabilities (if any):**
If composes[] is non-empty, for each capability in composes[], read `.planning/capabilities/{cap-slug}/CAPABILITY.md` for contract context.
Parse `ui_facing` from each composed capability's frontmatter. If any are `true` and `.docs/design-system.md` exists, flag this feature as design-aware and load `.docs/design-system.md` into context.
If composes[] is empty, skip capability loading — proceed without capability context. Discovery does not require composition.

**Load project context for grounding (if files exist):**
- `.docs/architecture.md` — system architecture context
- `.docs/domain-vocabulary.md` — domain concepts and vocabulary
- `.docs/brand.md` — voice, tone, design direction
- `.docs/design-system.md` — design tokens, components, patterns (if exists AND any composed cap is ui_facing)

Store capability contracts and project context for use during discussion — the feature discussion should be grounded in what the composed capabilities provide.
</step>

<step name="semantic_composition_check">
Run mgrep against the feature's Goal/Flow description.

Surface to user if found:
  - Code that satisfies parts of the flow but isn't covered by any composed capability
    (possible missing composes[] entry)
  - Semantic contradiction between feature flow steps and composed capability contracts
    (capability may not actually do what the feature assumes)
  - Implicit dependencies: code the feature will need that isn't in any composed cap's
    contract (possible undeclared capability)

This feeds into backward_routing — if mgrep reveals a gap, the user
can route back to /gsd:discuss-capability before committing to the feature spec.
</step>

<step name="capability_scan">
Scan existing capabilities for potential composition matches.

```bash
CAP_LIST=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-list)
```

Parse the capabilities array. For each capability, compare its Goal against the feature's Goal/Flow description. Look for capabilities whose contract (Receives/Returns) could serve as building blocks for this feature.

**If matches found and composes[] is empty or incomplete:**

Use AskUserQuestion:
- header: "Composition"
- question: "Based on existing capabilities, these look relevant to this feature:\n\n{list each match: slug — goal — how it might fit}\n\nWould any of these power this feature?"
- options:
  - "Yes, add to composes[]" — User selects which ones. Update composes[] in working state (written to FEATURE.md at update step).
  - "Not quite" — Note in Decisions. May indicate a missing capability.
  - "Skip" — Move on.

**If no matches found and composes[] is empty:**
Note this — the feature may need new capabilities created first. Surface during guided exploration: "This feature doesn't compose any existing capabilities. You may need to create capabilities first with `/gsd:discuss-capability`."

**If composes[] is already populated:** Skip this step — the user already knows what this feature composes.
</step>

<step name="check_status">
Check feature status before proceeding.

**If status is `killed`:**
Display the kill reasoning from the feature file.

Use AskUserQuestion:
- header: "Killed"
- question: "This feature was previously killed. Reasoning: {reasoning}. What do you want to do?"
- options:
  - "Override and re-explore" — Reset status to exploring
  - "Keep killed" — Exit workflow

**If status is `deferred`:**
Display the deferral reasoning.

Use AskUserQuestion:
- header: "Deferred"
- question: "This feature was deferred. Reasoning: {reasoning}. What do you want to do?"
- options:
  - "Override and re-explore" — Reset status to exploring
  - "Keep deferred" — Exit workflow

**If status is `complete` or `in-progress`:**
Use AskUserQuestion:
- header: "Status"
- question: "This feature is already {status}. Re-exploring may surface new insights or changes."
- options:
  - "Continue exploring" — Proceed
  - "Exit" — Leave as-is

**If status is `exploring` or `specified` or no status:**
Continue to guided exploration.
</step>

<step name="guided_exploration">
Conduct guided Q&A exploring HOW this feature works.

MANDATORY: Every question MUST go through AskUserQuestion. NEVER output a question as plain text.
NEVER narrate what you are about to do or what just happened between tool calls.
Do NOT output filler like "Let me load...", "The user selected...", "Good, let me...".
Go DIRECTLY from one tool call to the next. The only text output allowed between
AskUserQuestion calls is the stage banner or a brief (1-line) context note embedded
in the next AskUserQuestion's question field.
After EVERY AskUserQuestion return, write results to feature working state before the next question.

**Background checklist (not sequential stages — use to assess gaps):**

Phase 1 — Identity (what does this feature achieve?):
1. **Goal** — One verifiable sentence: what the user gets when this is done. Must be testable.
2. **Composed capabilities** — Which capabilities does this feature compose (if known)? (Optional during discovery — composes[] is a planning artifact, not a discovery gate.)

Phase 2 — Flow (how does it work step by step?):
3. **Happy path** — Numbered steps: which capability executes, what it does in this context, what it passes to the next step. Push for concrete step-by-step, not vague "capabilities execute in order."
4. **Failure paths** — For each step, what happens on failure? Indented bullets under the step that fails.
5. **Branch logic** — Where does the flow fork based on conditions? What determines which branch?

Phase 3 — Boundaries:
6. **Scope: In** — Only these capabilities, only this orchestration.
7. **Scope: Out** — No new implementation logic. No changes to capability internals. Be explicit.

Phase 4 — Data and failures:
8. **User-Facing Failures** — For each composed capability: what failure mode, what does the user see? Push for the table format: Composed Capability | Failure Mode | User Sees.
9. **Context / Handoff contracts** — What data flows between composed capabilities? Push for the table format: From | To | Data | Format. Get concrete types/shapes, not just "passes data."

Phase 5 — Surface:
10. **UI surface** — Does this feature have a visual/interactive element? Two detection paths:
    - **From composed capabilities:** If any composed capability has `ui_facing: true`, auto-detect and surface: "This feature composes {cap} which is UI-facing. Which layout/interaction patterns from the design system apply at the feature level?"
    - **Direct probe:** If no composed capabilities are ui_facing (or composes[] is empty) and `.docs/design-system.md` exists, ask via AskUserQuestion:
      - header: "UI Surface"
      - question: "Does this feature involve any UI that users see or interact with?"
      - options: "Yes — has a visual/interactive element" | "No — no UI"
    - If yes (either path): Read `.docs/design-system.md`, surface applicable tokens/components/patterns. Inject `## Design References` table into FEATURE.md.
    - If `.docs/design-system.md` does not exist, skip this probe entirely.

**Round loop:**

1. Call AskUserQuestion (1-4 questions informed by what's unknown from the checklist)
2. Write answers directly into the corresponding FEATURE.md template sections (Goal, Flow steps, Scope lists, User-Facing Failures table, Context table). Do NOT dump raw Q&A into the Decisions section — fill the real template sections progressively as answers come in. Partial fills are fine; they get refined in subsequent rounds. Only write to Decisions for actual decisions made during discussion (tradeoffs, choices, rejected alternatives).
3. Assess: do I have enough to fill the FEATURE.md template sections?
   - YES → AskUserQuestion: "I think I have what I need for this feature. Anything else?"
     - User says done → proceed to update_feature_notes
     - User has more → back to step 1
   - NO → back to step 1 with questions targeting gaps

No round limit — model self-assesses against done threshold.

**Done threshold:** enough clarity to fill Goal (verifiable sentence), Flow (numbered steps with failure branches), Scope (in/out lists), User-Facing Failures (table with capability/mode/user-sees), and Context (table with from/to/data/format). composes[] is desirable but not blocking.

**Progression guidance:**
- Start with Phase 1 — don't ask about failure modes before the happy path is clear
- Phase 2 is the heart — spend the most time here. Push for numbered steps referencing specific capabilities, not abstract sequences.
- Phase 4 may partially fill from Phase 2 answers — extract failure and data flow info rather than re-asking

**Grounding in capability contracts:**
Reference the composed capabilities' contracts during discussion. "Capability {X} returns {output} — does this feature need to transform that before passing to {Y}?"

**Kill/defer detection:**
If during discussion the user expresses doubt about the feature's value or feasibility:

Use AskUserQuestion:
- header: "Direction"
- question: "Sounds like you're reconsidering this feature. What's the right move?"
- options:
  - "Kill it" — Mark as killed with reasoning
  - "Defer it" — Mark as deferred with reasoning
  - "Keep exploring" — Continue discussion
</step>

<step name="backward_routing">
Detect when feature discussion reveals a capability-level problem.

**Backward routing triggers:**
- Feature composes a capability whose contract is incomplete or wrong
- Feature reveals the capability was misconceived or mis-scoped
- Feature conflicts with another feature composing the same capability
- Implementation approach fundamentally changes what a capability does

**When detected:**

Use AskUserQuestion:
- header: "Backward"
- question: "This feature discussion is surfacing a capability-level issue: {specific issue}. The capability itself may need re-thinking."
- options:
  - "Route to discuss-capability" — Pause feature discussion, recommend re-exploring the capability
  - "Route to replan" — The capability plan needs restructuring
  - "Continue here" — Acknowledge the issue but keep discussing this feature

If "Route to discuss-capability":
```
The feature discussion revealed: {issue}

Recommend re-exploring the affected capability first:
`/gsd:discuss-capability {capability-slug}`

Then return to this feature:
`/gsd:discuss-feature {feature-slug}`
```
Exit workflow.

If "Route to replan":
```
The feature discussion revealed: {issue}

Recommend replanning the capability:
`/gsd:discuss-capability {capability-slug}` (with updated context)

This feature's composition may change after replanning.
```
Exit workflow.

If "Continue here": Note the issue but proceed with feature exploration.
</step>

<step name="update_feature_notes">
After exploration is complete (or kill/defer/backward-route decided), update feature artifacts.

**If kill/defer:** Update the feature file status and add reasoning. Skip spec generation.

Template sections were filled progressively during the round loop. This step is a final pass:

1. **Verify template compliance** — read FEATURE.md and check each section matches the template format:
   - Goal: one verifiable sentence (not a paragraph)
   - Flow: numbered steps referencing capability slugs, with indented failure branches
   - Scope: In/Out as bullet lists
   - User-Facing Failures: table format (Composed Capability | Failure Mode | User Sees)
   - Context: table format (From | To | Data | Format)
   - Unfilled sections: leave the template placeholder text — do NOT delete sections or leave them empty

2. **Clean up** — remove any raw Q&A notes that leaked outside template sections. Every piece of content should live in its template section.

3. **Update frontmatter:**
   - `composes:` → update if user provided composition during discussion; do not prompt for it as required
   - `status:` → set to `specified` if Goal + Flow + Scope + User-Facing Failures + Context are filled; otherwise `exploring`

4. **Decisions section** — should contain only actual decisions (tradeoffs, choices, rejected alternatives), not Q&A transcripts.
</step>

<step name="summarize_and_next">
Present summary of what was captured and next steps.

```
## Feature: {feature-slug}
Status: {status}

### Exploration Summary
- Goal: {one sentence}
- Composes: {list of capability slugs}
- Key edge cases: {count identified}
- Open questions: {count}

{If killed or deferred:}
### Decision: {Killed | Deferred}
Reasoning: {reasoning}

{If backward routing:}
### Backward Route
Issue: {what was discovered}
Action: {discuss-capability or replan}

---

## Next Steps

{If specified (Goal/Flow/composes[] written):}
- `/gsd:plan {this-feat}` — Plan this feature

{If killed:}
- Feature marked as killed. Can be overridden later.

{If deferred:}
- Feature deferred. Can be picked up later.
```
</step>

<step name="git_commit">
Commit the feature notes update:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(feature): update {feat-slug} exploration" --files ".planning/features/{feat-slug}/FEATURE.md"
```
</step>

</process>

<success_criteria>
- Feature resolved from fuzzy reference (confirmed with user)
- Status checked (killed/deferred shows reasoning, offers override)
- Guided exploration covered Goal, Flow (numbered steps + failure branches), Scope (in/out), User-Facing Failures (table), and Context (table) at minimum
- Capability scan surfaced composition suggestions when composes[] empty/incomplete
- Backward routing detected and handled when capability-level issues surface
- Feature notes updated with structured template sections filled
- Status set to `specified` when all required sections filled
- Kill/defer handled with reasoning persisted
- User knows next steps
</success_criteria>
</output>
