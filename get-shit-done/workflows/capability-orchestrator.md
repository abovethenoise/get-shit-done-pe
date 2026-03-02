<purpose>
Orchestrate the framing pipeline across all features of a capability in DAG wave order. Reads CAPABILITY.md to extract the feature list, builds a dependency graph, groups features into execution waves, and dispatches framing-pipeline.md per feature.

Same pattern as execute.md wave orchestration but for features within a capability.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
@{GSD_ROOT}/get-shit-done/references/framing-lenses.md
</required_reading>

<process>

## 1. Initialize

**Inputs:** CAPABILITY_SLUG, LENS (from invoking command -- e.g., "plan", "new", "enhance")

```bash
CAP_STATUS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" capability-status "${CAPABILITY_SLUG}")
```

Parse JSON for: `slug`, `status`, `features[]` (each with slug, status).

Read CAPABILITY.md directly for the features table with priority and dependency info:
```bash
# Read the CAPABILITY.md file
```
Read the file at `.planning/capabilities/${CAPABILITY_SLUG}/CAPABILITY.md`.

Extract the Features table columns: Feature | Priority | Depends-On | Status.

## 2. Build DAG

From the Features table, construct a directed acyclic graph:
- Each feature is a node
- Each `Depends-On` entry creates a directed edge (dependency -> feature)
- Validate: no cycles. If cycle detected, present to user for resolution.

**Cycle detection:**
If a cycle is found (e.g., A depends on B, B depends on A):
- Display: "Circular dependency detected: A -> B -> A"
- Use AskUserQuestion: "Which dependency should be removed to break the cycle?"
- User picks; remove that edge and re-validate.

## 3. Group Into Waves

Topological sort the DAG into execution waves:
- **Wave 1:** Features with no dependencies (or all deps already complete)
- **Wave 2:** Features whose dependencies are all in Wave 1 or earlier
- **Wave N:** Features whose dependencies are all in waves before N

Features already marked `complete` in the status are skipped (not assigned to any wave).

## 4. Execute Waves

For each wave (in order):

### 4a. Display Wave Plan

```
-------------------------------------------------------
 GSD > CAPABILITY ORCHESTRATOR
-------------------------------------------------------

Capability: {CAPABILITY_SLUG}
Lens: {LENS}

Wave {N} of {total_waves}:
  - {feature_slug_1} (depends: none)
  - {feature_slug_2} (depends: feature_slug_1)
```

Use AskUserQuestion:
- header: "Wave {N}"
- question: "Ready to process Wave {N}? Features: {list}"
- options: "Proceed", "Skip this wave", "Abort orchestration"

### 4b. Process Each Feature in Wave

For each feature in the current wave:

1. **Check DISCOVERY-BRIEF.md existence:**
   ```bash
   # Check if .planning/capabilities/{cap}/features/{feat}/DISCOVERY-BRIEF.md exists
   ```
   If no brief exists and LENS requires discovery (new, debug, enhance, refactor):
   - Invoke framing-discovery.md for this feature first
   - Pass: LENS, CAPABILITY_SLUG (derived from feature directory path)

2. **Invoke framing-pipeline.md:**
   ```
   @{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md
   ```
   Pass:
   - FEATURE_SLUG: the current feature's slug
   - FEATURE_DIR: `.planning/capabilities/{cap}/features/{feat}/`
   - LENS: the active lens
   - ANCHOR_QUESTIONS_PATH: from lens config (if discovery needed)

   The pipeline derives CAPABILITY_SLUG from the feature directory path.

3. **Handle failure:**
   If the pipeline reports failure or the user aborts mid-feature:
   - Use AskUserQuestion:
     - header: "Pipeline Error"
     - question: "Feature '{slug}' encountered an issue. Continue with remaining features or abort?"
     - options: "Continue (skip this feature)", "Abort orchestration"
   - If continue: mark feature as failed, move to next
   - If abort: exit orchestrator

### 4c. Update Feature Status

After each feature completes successfully:
- Update the feature's status in CAPABILITY.md features table
- Status progression: exploring -> specified -> in-progress -> complete

## 5. Completion

After all waves processed:

1. **Update capability status** in CAPABILITY.md:
   - If all features complete: set capability status to `complete`
   - If some features complete: set to `in-progress`

2. **Update ROADMAP.md** focus group checklist if applicable:
   - Read ROADMAP.md for active focus groups
   - Check off completed features in the relevant focus group

3. **Display summary:**
```
-------------------------------------------------------
 GSD > ORCHESTRATION COMPLETE
-------------------------------------------------------

Capability: {CAPABILITY_SLUG}
Features processed: {count}
  - {feat_1}: complete
  - {feat_2}: complete
  - {feat_3}: skipped (already complete)
```

</process>

<success_criteria>
- [ ] CAPABILITY.md features table read and parsed
- [ ] DAG built from depends-on relationships
- [ ] Cycles detected and resolved with user input
- [ ] Features grouped into waves by topological sort
- [ ] Each feature dispatched to framing-pipeline.md
- [ ] Discovery brief created if missing (pre-pipeline)
- [ ] Feature and capability status updated after completion
- [ ] ROADMAP.md focus group checklist updated
</success_criteria>
