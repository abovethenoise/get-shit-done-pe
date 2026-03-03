<purpose>
Guided exploration of HOW a specific feature works. Thinking partner for feature-level clarity between planning and execution.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to help clarify implementation approach, edge cases, and dependencies for a specific feature within a capability.

This command is optional per feature. It can kill or defer features, and can route backward to discuss-capability or replan when the feature reveals a capability-level misconception.
</purpose>

<downstream_awareness>
**discuss-feature feeds into:**

1. **Requirements files** at `.planning/capabilities/{cap-slug}/features/{feat-slug}/requirements/` — EU, FN, TC files
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

**Input:** The user's argument text (e.g., "drill timing", "the spaced repetition thing", "mistake-grading/auto-classify")

**Resolution using feature-list output from init:**

Parse the `feature_list` array. Match the user's reference against feature slugs and full paths (`capability/feature`):

1. **Exact slug match** — Direct hit on feature slug, use it
2. **Full path match** — User provides `capability/feature` format
3. **Substring match** — User text is substring of a feature slug (or vice versa). If unique, auto-select. If multiple, present top 3.
4. **Capability-scoped** — If user provides a capability slug followed by a feature hint, narrow search to that capability's features
5. **No match** — Ask user to clarify. Show available capabilities and their features.

**After resolving, confirm explicitly:**

Use AskUserQuestion:
- header: "Feature"
- question: "Resolved to: **{feature-slug}** under capability **{capability-slug}** (status: {status}). Is this correct?"
- options:
  - "Yes, continue" — Proceed with this feature
  - "No, show me the list" — Display all features for manual selection
  - "Different capability" — Pick a different capability first, then feature

If "No, show me the list": Display feature list grouped by capability, let user pick.
If "Different capability": List capabilities, let user select, then show features within it.
</step>

<step name="load_feature">
Load the feature file and its parent capability context.

**Feature file location:** `.planning/capabilities/{cap-slug}/features/{feat-slug}/FEATURE.md`

Read the feature file content. Extract:
- **status**: exploring | specified | in-progress | complete | killed | deferred
- **Existing requirements**: EU, FN, TC files in the requirements subdirectory (if any)

**Also load parent capability:**
Read `.planning/capabilities/{cap-slug}/CAPABILITY.md` for capability-level context.
If `.documentation/capabilities/{cap-slug}.md` exists, read it for exploration notes and suggested lens.

Store capability context for use during discussion — the feature discussion should be grounded in capability-level understanding.
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

1. **Implementation approach** — How should this feature work at a high level?
2. **Edge cases** — What happens in unusual situations? Error states? Empty data?
3. **Dependencies** — What does this feature need from other features or external systems?
4. **User interaction** — How does the user interact with this feature? What do they see/do?
5. **Data flow** — What data does this feature consume and produce?
6. **Constraints** — Performance requirements? Compatibility? Platform limitations?

**Round loop:**

1. Call AskUserQuestion (1-4 questions informed by what's unknown from the checklist)
2. Write answers to feature working notes (in the FEATURE.md Decisions section)
4. Assess: do I have enough to fill out EU, FN, and TC requirements in FEATURE.md?
   - YES → AskUserQuestion: "I think I have what I need for this feature. Anything else?"
     - User says done → proceed to update_feature_notes
     - User has more → back to step 1
   - NO → back to step 1 with questions targeting gaps

No round limit — model self-assesses against done threshold.

**Done threshold:** enough clarity to fill out EU (user stories + acceptance criteria), FN (input/output contracts + behavior rules + edge cases), and TC (constraints + upstream/downstream + approach) requirements in FEATURE.md.

**Grounding in capability context:**
Reference the parent capability's exploration notes during discussion. "The capability suggests {lens} framing — does that align with how you see this feature?"

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
- Feature doesn't make sense given the capability definition
- Feature reveals the capability was misconceived or mis-scoped
- Feature conflicts with another feature in the same capability
- Implementation approach fundamentally changes what the capability is

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

Recommend re-exploring the parent capability first:
`/gsd:discuss-capability {capability-slug}`

Then return to this feature:
`/gsd:discuss-feature {capability-slug}/{feature-slug}`
```
Exit workflow.

If "Route to replan":
```
The feature discussion revealed: {issue}

Recommend replanning the capability:
`/gsd:discuss-capability {capability}` (with updated context)

This feature's requirements may change after replanning.
```
Exit workflow.

If "Continue here": Note the issue but proceed with feature exploration.
</step>

<step name="update_feature_notes">
After exploration is complete (or kill/defer/backward-route decided), update feature artifacts.

**If kill/defer:** Update the feature file status and add reasoning. Skip requirement generation.

**If exploration complete:** Write actual EU, FN, TC content into FEATURE.md.

The template at `get-shit-done/templates/feature.md` already has the right structure. Fill the sections from discussion:

**End-User Requirements (EU):**
- Write user stories with acceptance criteria gathered during discussion
- Format: `As a {who}, I want {what}, so that {why}`
- Each story gets observable acceptance criteria as checkboxes
- Include out-of-scope notes where discussed

**Functional Requirements (FN):**
- Write input/output contracts from discussion
- Behavior rules and logic
- Edge case handling identified during exploration
- Error conditions and responses

**Technical Specs (TC):**
- Technical constraints discussed (language, libs, patterns, performance)
- Upstream: what feeds into this feature
- Downstream: what consumes this feature's output
- Implementation approach from discussion

**Update the Trace Table** at the top of FEATURE.md to reflect the requirements written (EU-01, EU-02, FN-01, etc.).

**Feature file location:** `.planning/capabilities/{cap-slug}/features/{feat-slug}/FEATURE.md`

Update status to `specified` if requirements were written.
</step>

<step name="summarize_and_next">
Present summary of what was captured and next steps.

```
## Feature: {capability}/{feature}
Status: {status}

### Exploration Summary
- Implementation approach: {summary}
- Key edge cases: {count identified}
- Dependencies: {list or "none identified"}
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

{If exploring/specified:}
- Continue with framing: `/gsd:{lens} {capability-slug}`
- Discuss another feature: `/gsd:discuss-feature {capability-slug}/{other-feature}`
- Return to capability: `/gsd:discuss-capability {capability-slug}`

{If killed:}
- Feature marked as killed. Can be overridden later.

{If deferred:}
- Feature deferred. Can be picked up later.
```
</step>

<step name="git_commit">
Commit the feature notes update:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(feature): update {cap-slug}/{feat-slug} exploration" --files ".planning/capabilities/{cap-slug}/features/{feat-slug}/FEATURE.md"
```

Include any requirements files created:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(feature): update {cap-slug}/{feat-slug} exploration" --files ".planning/capabilities/{cap-slug}/features/{feat-slug}/FEATURE.md" ".planning/capabilities/{cap-slug}/features/{feat-slug}/requirements/"
```
</step>

</process>

<success_criteria>
- Feature resolved from fuzzy reference (confirmed with user)
- Status checked (killed/deferred shows reasoning, offers override)
- Guided exploration covered implementation approach, edge cases, and dependencies
- Backward routing detected and handled when capability-level issues surface
- Feature notes updated with exploration results
- Kill/defer handled with reasoning persisted
- User knows next steps
</success_criteria>
