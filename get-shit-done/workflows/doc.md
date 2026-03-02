<purpose>
Orchestrate the documentation pipeline for a feature: locate artifacts, spawn doc-writer agent, verify output, present docs for Q&A review, commit on approval. Auto-chains from review when review is clean.
</purpose>

<required_reading>
@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<inputs>
- `CAPABILITY_SLUG`: The capability containing this feature
- `FEATURE_SLUG`: The feature being documented
- `LENS`: Primary lens (debug | new | enhance | refactor)
</inputs>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init feature-op "$CAPABILITY_SLUG" "$FEATURE_SLUG" doc --raw)
```

Parse: `commit_docs`, `capability_slug`, `capability_dir`, `feature_found`, `feature_slug`, `feature_dir`, `has_research`, `has_context`, `has_plans`, `state_path`, `roadmap_path`.

**If `feature_found` is false:** Error.

```bash
mkdir -p .documentation/modules .documentation/flows .documentation/capabilities
```

## 2. Context Assembly

Build payload (Layers 1-4):
- **Layer 1:** PROJECT.md, STATE.md, ROADMAP.md
- **Layer 2:** `${capability_dir}/CAPABILITY.md` (if exists)
- **Layer 3:** `${feature_dir}/FEATURE.md` (EU/FN/TC requirements)
- **Layer 4:** Lens-specific doc focus (debug=root cause, new=end-to-end, enhance=what changed, refactor=before/after)

## 3. Locate Feature Artifacts

Read SUMMARY.md files for key files list. Check for review synthesis (`${FEATURE_DIR}/review/synthesis.md`). Supplement with git diff. Deduplicate.

## 4. Spawn Doc Agent

Prompt includes: agent path, subject, context payload, feature artifacts, review artifacts, gate docs (constraints/glossary/state), documentation directory, section ownership model ([derived]/[authored]), processing order (modules first then flows), output paths, 3-pass self-validation requirement (structural compliance, referential integrity, gate consistency).

```
Task(
  prompt=doc_agent_prompt,
  subagent_type="general-purpose",
  description="Document Feature: {capability_slug}/{feature_slug}"
)
```

## 5. Verify Output

Check doc-report.md exists. List generated module and flow docs. Build manifest. If report missing: error. If zero docs: warning, present report.

## 6. Impact Discovery

Read doc report for impact flags -- existing flow docs referencing modified modules. Collect for presentation after Q&A.

## 7. Present Docs (Q&A Loop)

For each doc (modules first, then flows):

Display content preview. Options via AskUserQuestion (header max 12 chars):
- **Approve** -- include in commit
- **Edit** -- provide feedback for re-generation
- **Reject** -- exclude from commit

## 8. Present Impact Flags

If impacted docs found: present as informational section (no action required).

## 9. Update FEATURE.md Trace Table

Mark "Docs" column complete for documented requirements.

## 10. Commit Approved Docs

Stage and commit approved files:
```bash
git commit -m "docs(${CAPABILITY_SLUG}/${FEATURE_SLUG}): add generated documentation"
```

## 11. Output Path Targets

- `.documentation/architecture.md`: if architectural changes
- `.documentation/domain.md`: if domain model changed
- `.documentation/mapping.md`: file-to-concept mappings
- `.documentation/modules/{cap}-{feat}.md`: module-level docs
- `.documentation/flows/{cap}-{feat}.md`: data flow docs
- `.documentation/capabilities/{cap}.md`: capability overview

## 12. Completion

```
GSD > FEATURE DOCUMENTED: {capability_slug}/{feature_slug}

Docs: {total} (Approved: {N}, Needs edit: {N}, Rejected: {N})
Impact flags: {count} existing docs may need review

Artifacts: {documentation_dir}/, {feature_dir}/doc-report.md
```

</process>

<key_constraints>
- Single-agent pipeline (NOT gather-synthesize) -- one doc-writer, not parallel gatherers
- Modules before flows (dependencies-first ordering)
- Q&A happens HERE via AskUserQuestion -- NOT inside doc agent
- Impact flags presented separately after doc review
- Gate docs are read-only validation inputs
- User approval required before committing
- Requirements from FEATURE.md (EU/FN/TC)
- Review->Doc auto-chain when review passes cleanly
- Section ownership: [derived] regenerated, [authored] preserved
</key_constraints>
