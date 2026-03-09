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

**Load composed capabilities:**
For each capability in composes[], read `.planning/capabilities/{cap-slug}/CAPABILITY.md` for contract context.

**Load project context for grounding (if files exist):**
- `.docs/architecture.md` — system architecture context
- `.docs/domain-vocabulary.md` — domain concepts and vocabulary
- `.docs/brand.md` — voice, tone, design direction

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

1. **Goal** — What is the one verifiable sentence describing what this feature achieves?
2. **Flow** — What capabilities execute in what order? What's the happy path? Failure paths?
3. **Scope** — What's in (only these capabilities), what's out (no new logic here)?
4. **Composed capabilities** — Which capabilities does this feature compose? Are they all contracted?
5. **User-facing failures** — What does the user see when a composed capability fails?
6. **Context** — What flows between the composed capabilities (handoff contracts)?

**Round loop:**

1. Call AskUserQuestion (1-4 questions informed by what's unknown from the checklist)
2. Write answers to feature working notes (in the FEATURE.md Decisions section)
4. Assess: do I have enough to fill out Goal, Flow, Scope, and composes[] in FEATURE.md?
   - YES → AskUserQuestion: "I think I have what I need for this feature. Anything else?"
     - User says done → proceed to update_feature_notes
     - User has more → back to step 1
   - NO → back to step 1 with questions targeting gaps

No round limit — model self-assesses against done threshold.

**Done threshold:** enough clarity to fill out Goal (verifiable sentence), Flow (capability sequence + branches), Scope (in/out), composes[] (capability list), and User-Facing Failures.

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

**If exploration complete:** Write Goal, Flow, Scope, composes[], and User-Facing Failures into FEATURE.md.

The template at `get-shit-done/templates/feature.md` has the right structure. Fill the sections from discussion:

**Goal:**
- One verifiable sentence describing what this feature achieves

**Flow:**
- Ordered sequence: which capabilities execute in what order
- Branch logic, happy path + failure paths

**Scope:**
- What's in (only these capabilities)
- What's out (no new logic here)

**composes[] (frontmatter):**
- List of capability slugs this feature composes

**User-Facing Failures:**
- What the user sees when each composed capability fails

**Context:**
- What flows between the composed capabilities (handoff contracts)

**Feature file location:** `.planning/features/{feat-slug}/FEATURE.md`

Update status to `specified` if spec was written.
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
- Guided exploration covered goal, flow, scope, and composed capabilities
- Backward routing detected and handled when capability-level issues surface
- Feature notes updated with exploration results
- Kill/defer handled with reasoning persisted
- User knows next steps
</success_criteria>
</output>
