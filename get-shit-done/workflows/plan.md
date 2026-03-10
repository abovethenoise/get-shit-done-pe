<purpose>
Create executable PLAN.md files for a capability or feature. Branches on target type. Default: Research (if needed) → Plan → Self-critique → CLI validate → Plan-check → Done.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/ui-brand.md
@{GSD_ROOT}/get-shit-done/references/delegation.md
@{GSD_ROOT}/get-shit-done/references/context-assembly.md
</required_reading>

<inputs>
**TARGET_SLUG** -- Capability or feature slug
**TARGET_TYPE** -- "capability" or "feature" (from invoking command)
**LENS** -- Framing lens (debug|new|enhance|refactor)
**SECONDARY_LENS** -- Secondary lens (optional)
**ANCHOR_QUESTIONS_PATH** -- Path to lens-specific anchor questions
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-feature "$TARGET_SLUG")
```

Parse JSON for: `plan_checker_enabled`, `commit_docs`, `feature_found`, `feature_dir`, `feature_slug`, `has_context`, `has_brief`, `has_plans`, `plan_count`, `planning_exists`, `state_path`, `roadmap_path`, `context_path`, `brief_path`, `design_path`, `research_path`.

**If `planning_exists` is false:** Error -- run `/gsd:new` first.

Determine target type and directory:
- **Feature:** `target_dir = .planning/features/${TARGET_SLUG}`, spec = `FEATURE.md`
- **Capability:** `target_dir = .planning/capabilities/${TARGET_SLUG}`, spec = `CAPABILITY.md`

## 2. Validate Target

Read spec file at `${target_dir}/${spec_file}`.

**If missing:** Error -- run `/gsd:discuss-capability` or `/gsd:discuss-feature` first.

**If feature:** Extract `composes[]` from frontmatter. Run gate check:
```bash
GATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" gate-check "$TARGET_SLUG" --raw)
```
If gate fails (unverified capabilities): surface blocker list, offer "Plan capability first" or "Override gate".

**If capability:** Extract contract sections (Receives/Returns/Rules).

## 3. Load Context

Context assembly per @get-shit-done/references/context-assembly.md:
- Layer 1: PROJECT.md, STATE.md, ROADMAP.md
- Layer 2: Target spec (CAPABILITY.md contract or FEATURE.md goal/flow/composes[])
- Layer 3: RESEARCH.md, BRIEF.md (if exist)
- Layer 4: Lens-specific anchor questions

## 3b. User Focus

Present spec summary, then AskUserQuestion:
- header: "Planning Focus"
- question: "Here's what the spec requires:\n\n{spec summary}\n\nWhat matters most?"
- options: "Simplicity" | "Correctness" | "Speed" | "Let me specify"

Store as `USER_FOCUS`. Passed to research gatherers, planner, and deep-dive approval.

## 4. Handle Research

```bash
mkdir -p "${target_dir}/research"
```

Check RESEARCH.md exists and lens matches current lens. If stale or missing: spawn research via @get-shit-done/references/gather-synthesize-pattern.md.

Pass `target_type` to all gatherers for type-aware orientation.

Gatherer spawn pattern: 6 parallel agents → wait → synthesizer → RESEARCH.md. Cleanup ephemeral findings after synthesis.

If research fails (>3 gatherer failures): offer "Provide context directly" or "Abort".

## 5. Check Existing Plans

If plans exist: offer add more, view existing, or replan from scratch.

## 5b. Downstream Consumer Context

**If capability target:** Query downstream consumers:

```bash
DOWNSTREAM=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query downstream "$TARGET_SLUG")
```

Parse JSON for features that compose this capability.
Include in planner's prompt as `<downstream_consumers>`:
  Feature slugs, their Goal lines, and which contract sections they depend on.

Purpose: the planner must write contract-preserving tasks. A task that narrows
the contract to fit the immediate need silently breaks other composers.
If zero downstream consumers: note "no composers yet — contract is not load-bearing."

**If feature target:** Skip — features don't have downstream consumers.

## 5c. Semantic Scope Scan

Run mgrep against the capability contract or feature flow description.
Include results in the planner's prompt as `<semantic_scope>`:
  Files NOT already in research findings → flag as implicit scope
  Files already in research → confirm scope coverage

## 6. Spawn Planner

```
Task(
  prompt=planning_prompt,
  subagent_type="gsd-planner",
  description="Plan ${TARGET_TYPE} ${TARGET_SLUG}",
  references=["@{GSD_ROOT}/get-shit-done/references/planner-reference.md"]
)
```

Planning prompt includes:
- Target type, slug, lens
- files_to_read block (state, spec, research, design, CLAUDE.md)
- For capabilities: contract sections that must be covered
- For features: flow steps + composed capability contracts
- Downstream consumer: execute workflow needs frontmatter (wave, depends_on, files_modified, autonomous)
- `USER_FOCUS` from Step 3b — planner uses this to justify approach choices and prioritize task ordering

**ONE planner per target.** No parallel planner spawns.

## 6b. Contract Coverage Check

Map plan tasks back to spec sections (contract rules for capabilities, flow steps for features). Build a coverage table showing which spec sections are covered and which have gaps.

If gaps exist, AskUserQuestion:
- header: "Coverage"
- question: "Plan covers {N}/{total} spec sections. Gaps:\n\n{gap list}"
- options: "Fill gaps" | "Accept as follow-ups" | "Spec needs trimming"

## 7. Draft/Refine Loop

### 7.1 CLI Validation

```bash
VALIDATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" plan-validate "${target_dir}/${spec_file}" ${PLAN_FILES} --raw)
```

### 7.2 Surface to User

Present in order:
- **A. Justification narrative** (ordering, approach, KISS rationale)
- **B. Round 1 fix summary**
- **C. Round 2 findings loop** — each finding via AskUserQuestion with options: Accept suggestion | Edit | Provide guidance | Dismiss

### 7.3 Re-spawn if Needed

If guidance/edits given: re-spawn planner with feedback → back to 7.1. Max 3 iterations.

### 7.4 Final Summary

3-layer summary: Justification → Surfaced decisions → Visual plan architecture (if 2+ waves or 3+ plans).

### 7.5 Deep-Dive and Approval

AskUserQuestion (multiSelect): Wave ordering, Approach vs alternatives, Coverage, Assumptions.

Include alignment check against `USER_FOCUS` from Step 3b.

Finalize: "Yes, finalize" | "I want changes" | "Abort"

### 7.6 Plan Checker (if enabled)

```
Task(prompt=checker_prompt, subagent_type="gsd-plan-checker", description="Verify ${TARGET_SLUG} plans", references=["@{GSD_ROOT}/get-shit-done/references/checker-reference.md"])
```

Checker findings grouped by severity (blockers → warnings → info). Max 3 checker cycles.

## 8. Present Final Status

```
GSD > ${TARGET_TYPE} ${TARGET_SLUG} PLANNED

**${TARGET_TYPE}: ${TARGET_SLUG}** -- {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|

Research: {Completed | Used existing}
Verification: {Passed | Passed with override | Skipped}

## Next Up

**Execute ${TARGET_SLUG}** -- run all {N} plans
<sub>/clear first for fresh context window</sub>
```

</process>

<success_criteria>
- .planning/ directory validated
- Target spec validated (CAPABILITY.md contract or FEATURE.md goal/flow)
- For features: gate check passed (all composed caps verified) or user override
- User focus captured (Step 3b) — shapes research and planner
- Research completed or reused (lens match)
- Plans created with self-critique resolved
- Contract coverage mapped (Step 6b) — gaps surfaced before user review
- CLI validation passed
- User explicitly confirmed "Finalize this plan?" with focus alignment check
- Plan-checker passed (or user override)
</success_criteria>
