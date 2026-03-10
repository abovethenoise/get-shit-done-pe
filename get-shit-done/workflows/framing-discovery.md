<purpose>
Run lens-specific discovery for a capability. Resolves the capability via fuzzy matching, checks status, loads anchor questions, runs Q&A with per-field MVU tracking, detects lens misclassification, supports lens pivots, performs mandatory summary playback, and produces a Discovery Brief artifact.

Shared across all four framing entry points (/debug, /new, /enhance, /refactor). The invoking slash command passes the lens identifier and the user's fuzzy capability reference.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init framing-discovery "${LENS}" "${CAPABILITY_SLUG}" --feature "${FEATURE_SLUG}" --raw)
```

Parse JSON for: `lens`, `mvu_slots`, `anchor_questions_path`, `anchor_questions_exists`, `framing_lenses_path`, `brief_template_path`, `capability` (object or null), `capability_status`, `brief_path`, `capability_list[]`, `capability_count`, `commit_docs`, `feature` (object or null), `feature_slug`, `feature_dir`.

**If `anchor_questions_exists` is false:** Error -- framing question files missing for this lens.

## 2. Slug Resolution

**If `capability` is already resolved (non-null) from init:** Skip to Step 3.

**If no fuzzy reference was provided in $ARGUMENTS:**

Use AskUserQuestion:
- header: "Capability"
- question: "What capability or feature are you working on? Describe it in a few words."

Take the user's response as the fuzzy reference.

**Resolve using slug-resolve CLI route:**

```bash
RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$INPUT")
```

Parse JSON result for: `resolved`, `tier`, `type`, `capability_slug`, `feature_slug`, `candidates`, `reason`.

**If resolved (unique match):**
- Auto-select, display confirmation
- Set CAPABILITY_SLUG from result

**Branch on resolution type:**

**If type is "capability":** Current behavior — capability-level MVU, discover features during Q&A.
  - Set CAPABILITY_SLUG from result

**If type is "feature":** Feature-level discovery.
  - Set FEATURE_SLUG from result
  - If the feature's composes[] is non-empty, load composed capabilities passively (for context, not as primary anchor). Set CAPABILITY_SLUG from the first composed capability if available.
  - If composes[] is empty, proceed without capability context — discovery does not require it.
  - Scope anchor Q&A to the specific feature — questions target feature-level understanding, not capability-level

**If not resolved and reason is "ambiguous":**
- Present candidates to user (2-3 matches), user picks
- Re-resolve with selected slug

**If not resolved and reason is "no_match":**
- Offer to create new capability or re-describe (same as current zero-match behavior)
- Falls through to Claude interpretation of user intent

**After resolution, confirm with user:**

Display: "Resolved to: **{capability name}** (`{slug}`). Proceed?"

Use AskUserQuestion:
- header: "Confirm"
- question: "I resolved your reference to **{name}** (`{slug}`). Is this correct?"
- options:
  - "Yes, proceed" -- continue to Step 3
  - "No, let me clarify" -- return to fuzzy input

## 3. Capability Status Check

**Skip this step if CAPABILITY_SLUG is not set (feature-only discovery).**

Read the resolved capability's status from init output or CAPABILITY.md.

**If status is `killed`:**
Display: "This capability was killed. Reason: {reason from CAPABILITY.md}"
Use AskUserQuestion to confirm: "Override and restart discovery?" / "Cancel"
If cancel -> exit workflow.

**If status is `deferred`:**
Display: "This capability is deferred. Reason: {reason from CAPABILITY.md}"
Use AskUserQuestion to confirm: "Override and start discovery?" / "Cancel"
If cancel -> exit workflow.

**If status is `complete`:**
Display: "This capability is already complete. Are you sure you want to re-run discovery?"
Use AskUserQuestion to confirm: "Yes, re-discover" / "Cancel"
If cancel -> exit workflow.

**Otherwise (exploring, specified, in-progress, or new):** Proceed.

## 4. Scaffold Discovery Brief

If no brief exists at `brief_path`, scaffold one:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" template fill discovery-brief --fields '{"capability":"${CAPABILITY_NAME:-}","lens":"${LENS}","date":"${TODAY}"}'
```

Read the scaffolded brief to get current state. If a brief already exists, read it to check for prior discovery data.

## 5. Upfront Lens Misclassification Check

Before asking the first anchor question, do a lightweight misclassification check based on available context.

Read the cross-framing detection rules from framing-lenses.md:
- /new but capability file describes existing functionality -> suggest /enhance
- /enhance but no existing behavior documented -> suggest /new
- /refactor but capability describes correctness issues -> suggest /debug
- /debug but capability describes desired structural changes -> suggest /refactor

**If misclassification suspected:**

Use AskUserQuestion:
- header: "Lens Check"
- question: "Based on what I see, this might be better suited for /{suggested_lens} ({mode_name} mode) rather than /{current_lens}. {reason}. What would you like to do?"
- options:
  - "Switch to /{suggested_lens}" -- pivot lens (go to Step 5a)
  - "Keep /{current_lens}" -- continue with current lens
  - "This is compound work" -- set secondary lens (current becomes secondary, suggested becomes primary or vice versa)

### 5a. Lens Pivot

If user chooses to switch lens:
1. Update `LENS` variable to new lens
2. Re-run init to get new MVU slots and anchor questions: `node gsd-tools.cjs init framing-discovery "${NEW_LENS}" "${CAPABILITY_SLUG}"`
3. Reset the Specification section of the brief (zero it out). Preserve Meta (update lens fields), Context, Unknowns, Scope Boundary.
4. Return to Step 5 with new lens (skip re-checking misclassification for the lens we just came from).

## 6. Load Anchor Questions

Read the anchor questions file at `anchor_questions_path`.

Parse each question's:
- Title
- Purpose
- Branching hints

These questions form the fixed skeleton. Adaptive follow-ups branch from user answers.

## 7. Discovery Q&A Loop

Initialize MVU tracking state:
```
mvu_state = {}
for each slot in mvu_slots:
  mvu_state[slot] = { filled: false, content: null }
```

**For each anchor question (1 through N):**

Present the question using AskUserQuestion:
- header: "Q{n}/{total}"
- question: The anchor question text. If prior answers provide context, adapt the framing (the "adaptive muscles" on the fixed skeleton).

After each answer:
1. **Extract MVU slot data** -- Analyze the answer against the MVU slot definitions. If the answer fills or partially fills a slot, update `mvu_state[slot]`.
2. **Write to Discovery Brief progressively** -- Fill the corresponding brief section (Problem Statement, Specification fields, Context, Scope Boundary) directly in the brief file at `brief_path`. Do NOT accumulate in memory and dump later — write after each answer so the brief is always current. Partial fills are fine; they get refined as more answers come in.
3. **Check branching hints** -- Based on the answer, determine if adaptive follow-up questions are needed before moving to the next anchor question.
4. **Run adaptive follow-ups** if branching hints indicate (max 2 follow-ups per anchor question to prevent over-discovery).

**After anchor question 3 (mid-discovery), run misclassification check:**
Review accumulated answers. If answers consistently describe a different lens's domain:
- Use AskUserQuestion to offer pivot (same format as Step 5)
- If pivot: execute Step 5a, then resume Q&A with remaining questions for the new lens

**Skip/Fast-Track:**
If the user provides rich context that fills multiple MVU slots at once, acknowledge what's been captured and skip redundant questions. Present: "Based on your answer, I have enough for {slots}. Skipping to {next unanswered area}."

**Exit signal checking after each Q&A exchange:**

Check all three exit signals:

1. **MVU Met:** All slots in `mvu_state` have `filled: true` with semantically complete content. Semantic completeness means the content meets the completion criteria defined in framing-lenses.md (e.g., refactor with identical current/target design is NOT complete).

   If MVU met: Propose proceeding. "All discovery slots are filled. Ready to move to summary playback?"

2. **User Override:** User explicitly says something like "let's move on" or "that's enough" before MVU is met.

   If override: Document unfilled slots as explicit assumptions. "I'll note these as assumptions: {unfilled slots}. Proceeding."

3. **Diminishing Returns:** Same question essence asked twice, same answer repeated, no new information in last 2 exchanges.

   If detected: Flag the pattern. "We seem to be circling. Would you like to proceed with what we have, or try a different angle?"

## 8. Summary Playback (Mandatory)

This step is NOT optional. It must execute before any transition to the pipeline.

Brief sections were filled progressively during the Q&A loop. This step is a final verification pass:

1. **Read the brief** at `brief_path` and verify all sections are filled:
   - Meta: capability, primary_lens, secondary_lens (if compound), completion signal
   - Problem Statement: synthesized (not raw Q&A transcript)
   - Context: existing state, relevant modules, prior exploration
   - Specification: active lens variant uncommented, fields filled from MVU state
   - Unknowns: assumptions from unfilled slots, open questions surfaced during Q&A
   - Scope Boundary: in/out/follow-ups

2. **Clean up** — ensure no raw Q&A answers leaked outside brief sections. Synthesize any remaining rough notes into proper section content.

3. **Fill gaps** — if any section is still a template placeholder, fill it from `mvu_state` or flag as explicit unknown.

Present the completed brief to the user:

Use AskUserQuestion:
- header: "Brief Review"
- question: Present the full brief content. "Here is the Discovery Brief. Please review:"
- Show the complete brief text
- options:
  - "Looks good, proceed" -- finalize brief
  - "I have corrections" -- user provides corrections, update brief, re-present
  - "Wait, I forgot something" -- return to Q&A for additional questions

**If corrections:** Update the brief with user's corrections and re-present.
**If forgot something:** Return to Step 7 (Q&A loop) -- only ask about the new information, don't repeat completed questions.

## 9. Finalize Brief

Write the completed Discovery Brief to `brief_path`:
- Set `completion` field in frontmatter to the exit signal that triggered completion (mvu_met, user_override, or gaps_flagged)
- Set timestamp to current date

```bash
# Write the brief
```

Use the Write tool to write the completed brief to the brief path.

If `commit_docs` is true:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: complete discovery brief for ${CAPABILITY_SLUG}" --files "${BRIEF_PATH}"
```

Display completion summary:
- Lens used
- MVU slot status (filled/unfilled)
- Exit signal
- Brief location

## 10. Pipeline Handoff

After the brief is finalized, hand off to the framing pipeline for the 6 post-discovery stages.

Display:
```
-------------------------------------------------------
 GSD > HANDING OFF TO PIPELINE
-------------------------------------------------------

Brief complete. Starting post-discovery pipeline:
  research -> requirements -> plan -> execute -> review -> reflect
```

Invoke the framing-pipeline workflow with the discovery context:

```
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
```

Pass the following context to framing-pipeline:
- `BRIEF_PATH`: The path where the brief was written (from Step 9)
- `LENS`: The active lens (may have changed from pivot in Step 5a)
- `SECONDARY_LENS`: Secondary lens if compound work was detected (from Step 5)
- `CAPABILITY_SLUG`: The resolved capability slug (from Step 2), or null if feature-only discovery
- `CAPABILITY_NAME`: The resolved capability name (from Step 2), or null if feature-only discovery
- `FEATURE_SLUG`: The resolved feature slug (null if capability-level)
- `FEATURE_DIR`: The feature directory path (null if capability-level)

The pipeline workflow handles all subsequent stages. Discovery is complete.

</process>

<success_criteria>
- [ ] Capability resolved via fuzzy matching with explicit confirmation
- [ ] Capability status checked (killed/deferred blocks launch)
- [ ] Discovery Brief scaffolded at correct path
- [ ] Anchor questions loaded from lens-specific file
- [ ] Q&A loop tracks per-field MVU slots (not heuristic)
- [ ] Misclassification checked at start and mid-discovery
- [ ] Lens pivot resets Specification section
- [ ] All three exit signals functional (MVU met, user override, diminishing returns)
- [ ] Summary playback mandatory before finalization
- [ ] Brief written to target directory BRIEF.md
</success_criteria>
