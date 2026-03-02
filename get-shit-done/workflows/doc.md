<purpose>
Orchestrate the full documentation pipeline for a feature: initialize context, locate artifacts, spawn a single doc-writer agent, verify output files exist, present generated docs to user one-at-a-time via Q&A review, commit on approval. Auto-chains from review when review is clean.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
The invoking workflow passes these as context:
- `CAPABILITY_SLUG`: The capability containing this feature
- `FEATURE_SLUG`: The feature being documented
- `LENS`: Primary lens identifier (debug | new | enhance | refactor)
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op "$CAPABILITY_SLUG" "$FEATURE_SLUG" doc --raw)
```

Parse JSON for: `commit_docs`, `capability_slug`, `capability_dir`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_context`, `has_plans`, `state_path`, `roadmap_path`.

**If `feature_found` is false:** Error -- feature not found.

Derive doc-specific context:
- `doc_agent_path`: agents/gsd-doc-writer.md
- `documentation_dir`: .documentation

Create documentation output directory if it does not exist:
```bash
mkdir -p "${DOCUMENTATION_DIR}/modules"
mkdir -p "${DOCUMENTATION_DIR}/flows"
mkdir -p "${DOCUMENTATION_DIR}/capabilities"
```

## 2. Context Assembly

Build context payload following Layers 1-3.

**Layer 1: Core Context (always)**
Read and include:
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/ROADMAP.md`

**Layer 2: Capability Context**
Read `${capability_dir}/CAPABILITY.md` if it exists.

**Layer 3: Feature Context**
Read `${feature_dir}/FEATURE.md`. This contains 3-layer requirements (EU/FN/TC) -- the primary source for understanding what was supposed to be built.

**Layer 4: Framing Context**
If `LENS` is provided, include lens-specific documentation focus guidance.

Assemble payload:

```
<core_context>
{contents of PROJECT.md, STATE.md, ROADMAP.md}
</core_context>

<capability_context>
{contents of CAPABILITY.md -- omit block if not applicable}
</capability_context>

<feature_context>
{contents of FEATURE.md with EU/FN/TC requirements}
</feature_context>

<framing_context>
Lens: {LENS}
Documentation focus:
- debug: Document the fix and root cause analysis
- new: Document the new capability end-to-end
- enhance: Document what changed and why, preserving existing docs
- refactor: Document structural changes with before/after comparison
</framing_context>
```

## 3. Locate Feature Artifacts

Identify what was built for this feature. Read SUMMARY.md files from the feature directory to understand what files were created/modified:

```bash
ls "${FEATURE_DIR}"/*-SUMMARY.md 2>/dev/null
```

Build a list of key files from all summaries -- these are the files the doc agent will read and document.

Also read review synthesis if available:
```bash
test -f "${FEATURE_DIR}/review/synthesis.md" && echo "Review synthesis available"
```

Supplement with git diff if available:
```bash
git diff --name-only <first-plan-commit>..HEAD -- .
```

Merge and deduplicate the file list.

## 4. Spawn Doc Agent

Display banner:
```
-------------------------------------------------------
 GSD > DOCUMENTING FEATURE: {capability_slug}/{feature_slug}
-------------------------------------------------------

* Spawning doc-writer agent...
```

Construct the doc agent prompt:

```
First, read {doc_agent_path} for your role and goal.

<subject>
Document Feature: {capability_slug}/{feature_slug}
</subject>

{context_payload}

<task_context>
Feature artifacts to document (key files from summaries):
{list of key files created/modified for this feature}

Review artifacts (if available):
{feature_dir}/review/synthesis.md

Gate docs:
- Constraints: .documentation/gate/constraints.md (exists: {gate_docs_exist.constraints})
- Glossary: .documentation/gate/glossary.md (exists: {gate_docs_exist.glossary})
- State: .documentation/gate/state.md (exists: {gate_docs_exist.state})

Documentation directory: {documentation_dir}

Section ownership model:
- [derived] sections: auto-regenerated from code inspection every doc pass
- [authored] sections: written with human judgment, preserved on subsequent passes

Processing order: modules first, then flows (dependencies-first).

Write module docs to: {documentation_dir}/modules/{capability_slug}-{feature_slug}.md
Write flow docs to: {documentation_dir}/flows/{capability_slug}-{feature_slug}.md
Write doc report to: {feature_dir}/doc-report.md

3-pass self-validation required:
- Pass 1 (Structural compliance): Verify all required heading templates exist per schema
- Pass 2 (Referential integrity): Every code reference points to a file that exists
- Pass 3 (Gate consistency): Doc content consistent with FEATURE.md requirements and review synthesis
</task_context>
```

Spawn the doc agent:

```
Task(
  prompt=doc_agent_prompt,
  subagent_type="general-purpose",
  description="Document Feature: {capability_slug}/{feature_slug}"
)
```

Wait for the agent to complete.

## 5. Verify Output

Check that the doc agent produced output files:

```bash
# Check for doc report
test -f "${FEATURE_DIR}/doc-report.md" && test -s "${FEATURE_DIR}/doc-report.md"

# List generated module docs
ls "${DOCUMENTATION_DIR}/modules/"*.md 2>/dev/null

# List generated flow docs
ls "${DOCUMENTATION_DIR}/flows/"*.md 2>/dev/null
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

## 9. Update FEATURE.md Trace Table

After doc completion, update the FEATURE.md Trace Table to mark the "Docs" column as complete for all requirements that have been documented.

## 10. Commit Approved Docs

**Skip if:** No approved docs.

Stage and commit approved documentation files:

```bash
git add {each approved doc file}
git add "${FEATURE_DIR}/doc-report.md"
git commit -m "docs(${CAPABILITY_SLUG}/${FEATURE_SLUG}): add generated documentation

- {count} module docs
- {count} flow docs
"
```

## 11. Output Path Targets

The doc agent should update these paths as appropriate:
- `.documentation/architecture.md`: update if architectural changes made
- `.documentation/domain.md`: update if domain model changed
- `.documentation/mapping.md`: update file-to-concept mappings
- `.documentation/modules/{capability_slug}-{feature_slug}.md`: module-level docs
- `.documentation/flows/{capability_slug}-{feature_slug}.md`: data flow docs
- `.documentation/capabilities/{capability_slug}.md`: update capability-level overview if needed

## 12. Completion

Display:
```
-------------------------------------------------------
 GSD > FEATURE DOCUMENTED: {capability_slug}/{feature_slug}
-------------------------------------------------------

Feature: {capability_slug}/{feature_slug}

Docs generated: {total}
  Approved: {count}
  Needs edit: {count}
  Rejected: {count}

Impact flags: {count} existing docs may need review

Documentation artifacts:
  {documentation_dir}/modules/
  {documentation_dir}/flows/
  {feature_dir}/doc-report.md
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
- Requirements sourced from FEATURE.md (3-layer EU/FN/TC), not a separate REQUIREMENTS.md.
- Review->Doc auto-chain: if review passes cleanly, doc stage starts automatically.
- FEATURE.md trace table updated after documentation completion.
- Section ownership model: [derived] sections regenerated, [authored] sections preserved.
</key_constraints>
