<purpose>
Orchestrate the full documentation pipeline for a feature or capability: initialize context, locate artifacts, spawn a single doc-writer agent, verify output files exist, present generated docs to user one-at-a-time via Q&A review, commit on approval.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init doc-phase "${PHASE}" --raw)
```

Parse JSON for: `doc_agent_model`, `doc_agent_path`, `phase_dir`, `phase_number`, `phase_name`, `summary_files`, `documentation_dir`, `gate_docs_exist`, `feature_paths`, `capability_paths`, `commit_docs`, `state_path`, `roadmap_path`.

**If `phase_found` is false:** Error -- phase not found.

Create documentation output directory if it does not exist:
```bash
mkdir -p "${DOCUMENTATION_DIR}/modules"
mkdir -p "${DOCUMENTATION_DIR}/flows"
```

## 2. Context Assembly

Build context payload following Layers 1-3.

**Layer 1: Core Context (always)**
Read and include:
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/ROADMAP.md`

**Layer 2: Capability Context**
If `capability_paths` is non-empty, read each.

**Layer 3: Feature Context**
If `feature_paths` is non-empty, read each. Also include `.planning/REQUIREMENTS.md`.

Assemble payload:

```
<core_context>
{contents of PROJECT.md, STATE.md, ROADMAP.md}
</core_context>

<capability_context>
{contents of CAPABILITY.md files -- omit block if not applicable}
</capability_context>

<feature_context>
{contents of FEATURE.md files + requirements -- omit block if not applicable}
</feature_context>
```

## 3. Locate Phase Artifacts

Identify what was built in this phase. Read SUMMARY.md files from the phase directory to understand what files were created/modified:

```bash
ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null
```

Build a list of key files from all summaries -- these are the files the doc agent will read and document.

Supplement with git diff if available:
```bash
git diff --name-only <first-plan-commit>..HEAD -- .
```

Merge and deduplicate the file list.

## 4. Spawn Doc Agent

Display banner:
```
-------------------------------------------------------
 GSD > DOCUMENTING PHASE {X}
-------------------------------------------------------

* Spawning doc-writer agent...
```

Construct the doc agent prompt:

```
First, read {doc_agent_path} for your role and goal.

<subject>
Document Phase {phase_number}: {phase_name}
</subject>

{context_payload}

<task_context>
Phase artifacts to document (key files from summaries):
{list of key files created/modified in this phase}

Review artifacts (if available):
{phase_dir}/review/synthesis.md

Gate docs:
- Constraints: .documentation/gate/constraints.md (exists: {gate_docs_exist.constraints})
- Glossary: .documentation/gate/glossary.md (exists: {gate_docs_exist.glossary})
- State: .documentation/gate/state.md (exists: {gate_docs_exist.state})

Documentation directory: {documentation_dir}

Write module docs to: {documentation_dir}/modules/
Write flow docs to: {documentation_dir}/flows/
Write doc report to: {phase_dir}/doc-report.md

Processing order: modules first, then flows (dependencies-first).
</task_context>
```

Spawn the doc agent:

```
Task(
  prompt=doc_agent_prompt,
  subagent_type="general-purpose",
  model="{doc_agent_model}",
  description="Document Phase {phase_number}"
)
```

Wait for the agent to complete.

## 5. Verify Output

Check that the doc agent produced output files:

```bash
# Check for doc report
test -f "${PHASE_DIR}/doc-report.md" && test -s "${PHASE_DIR}/doc-report.md"

# List generated module docs
ls "${DOCUMENTATION_DIR}/modules/"*.md 2>/dev/null

# List generated flow docs
find "${DOCUMENTATION_DIR}/flows/" -name "*.md" 2>/dev/null
```

Build a manifest of generated doc files:
```
manifest:
  doc_report: exists|missing
  module_docs: [list of files]
  flow_docs: [list of files]
  total_docs: {count}
```

**If doc report is missing:** Error -- doc agent failed to produce output. Display error and abort.

**If zero module and flow docs generated:** Warning -- doc agent produced a report but no documentation files. Present report to user for review.

Display status:
```
Doc agent results:
  Report:      [OK | MISSING]
  Module docs: {count} files
  Flow docs:   {count} files

* Presenting docs for review...
```

## 6. Impact Discovery

Read the doc report for impact flags. The doc agent identifies existing flow docs that reference modified modules (one-hop discovery).

If impacted docs exist, collect them for presentation after the Q&A review loop.

## 7. Present Docs to User (Q&A Loop)

Display banner:
```
-------------------------------------------------------
 GSD > DOC REVIEW ({count} docs)
-------------------------------------------------------
```

For each generated doc file (one at a time, modules first then flows):

Display the doc:
```
[Type: {module|flow}] Doc {N}/{total}
File: {relative_path}

{doc content preview -- first 50 lines or full if short}
```

Use AskUserQuestion:
- header: "Doc {N}/{T}" (max 12 characters)
- question: "{doc file name}\n\nReview the generated documentation above.\n\nHow would you like to handle this doc?"
- options:
  - "Approve" -- Doc is correct, include in commit
  - "Edit" -- Doc needs changes (provide feedback for re-generation)
  - "Reject" -- Doc is not useful, exclude from commit

**Handle responses:**

- **Approve:** Add to `approved_docs`. Continue to next doc.
- **Edit:** Prompt user for feedback. Log feedback for manual follow-up. Add to `needs_edit_docs`. Continue to next doc.
- **Reject:** Add to `rejected_docs`. Log reason. Continue to next doc.

## 8. Present Impact Flags

If impacted docs were found in step 6, present them as a separate section after the doc review:

```
-------------------------------------------------------
 GSD > IMPACT FLAGS
-------------------------------------------------------

The following existing flow docs may reference modified modules.
Review them manually for accuracy:

- {path_to_impacted_doc}: references {module_name}
- ...
```

This is informational only -- no action required from the user during this step.

## 9. Commit Approved Docs

**Skip if:** No approved docs.

Stage and commit approved documentation files:

```bash
git add {each approved doc file}
git add "${PHASE_DIR}/doc-report.md"
git commit -m "docs(${PHASE}): add generated documentation for phase ${PHASE_NUMBER}

- {count} module docs
- {count} flow docs
"
```

## 10. Completion

Display:
```
-------------------------------------------------------
 GSD > PHASE {X} DOCUMENTED
-------------------------------------------------------

Phase {X}: {name}

Docs generated: {total}
  Approved: {count}
  Needs edit: {count}
  Rejected: {count}

Impact flags: {count} existing docs may need review

Documentation artifacts:
  {documentation_dir}/modules/
  {documentation_dir}/flows/
  {phase_dir}/doc-report.md
```

</process>

<key_constraints>
- This workflow uses a single-agent pipeline (NOT gather-synthesize). One doc-writer agent, not parallel gatherers.
- The doc agent processes modules before flows (dependencies-first ordering) for improved accuracy.
- Q&A interaction happens HERE in the workflow via AskUserQuestion -- NOT inside the doc agent.
- AskUserQuestion headers must stay within 12 characters (e.g., "Doc 1/3").
- Impact flags are presented as a separate section after doc review, not mixed into the Q&A loop.
- The doc agent writes files to disk. The workflow verifies file existence, then presents for Q&A.
- Gate docs are read-only validation inputs for the agent -- the workflow never modifies them.
- User approval is required before committing any generated documentation.
- Model allocation: doc agent uses role_type executor (Sonnet via doc_agent_model from init).
</key_constraints>
