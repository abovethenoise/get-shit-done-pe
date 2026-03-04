---
phase: pipeline-execution/doc-writer-overhaul
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/doc.md
  - agents/gsd-doc-writer.md
autonomous: true
requirements: [EU-01, EU-03, FN-01, FN-02, FN-03, FN-05, FN-06, TC-01, TC-03]

must_haves:
  truths:
    - "doc.md Step 4 spawns 5 parallel explorer Task() blocks (one per focus area) then 1 synthesizer Task()"
    - "gsd-doc-writer agent handles both explorer role (focus-area investigation) and synthesizer role (dedup + prioritize) via prompt differentiation"
    - "doc.md Steps 7-8 iterate recommendations grouped by focus area, not per-generated-doc"
    - "LENS is embedded in each explorer Task() prompt"
    - "mkdir -p created for {feature_dir}/doc/ before explorer spawns"
    - "doc-report.md format is recommendation-based: target file, what, why, focus area, priority"
    - "Abort threshold stated: 3+ of 5 explorer failures = abort"
  artifacts:
    - path: "get-shit-done/workflows/doc.md"
      provides: "Restructured orchestration: 5 parallel explorers + synthesizer + updated Q&A loop"
    - path: "agents/gsd-doc-writer.md"
      provides: "Dual-role agent: explorer (focus-area investigation) + synthesizer (consolidate/prioritize)"
  key_links:
    - from: "doc.md Step 4"
      to: "agents/gsd-doc-writer.md"
      via: "subagent_type=gsd-doc-writer, model=sonnet (explorers), model=inherit (synthesizer)"
      pattern: "5 explorer Task() blocks + 1 synthesizer Task()"
    - from: "doc.md Step 5"
      to: "{feature_dir}/doc-report.md"
      via: "verify output exists after synthesizer completes"
      pattern: "check doc-report.md exists and is non-empty"
    - from: "doc.md Step 7"
      to: "doc-report.md recommendations"
      via: "AskUserQuestion per recommendation, grouped by focus area"
      pattern: "Approve/Edit/Reject per recommendation entry"
---

<objective>
Restructure doc.md from single-agent pipeline to gather->synthesize with 5 parallel explorers + synthesizer. Rewrite gsd-doc-writer.md to support both explorer and synthesizer roles via prompt differentiation. Update Q&A loop to iterate recommendations grouped by focus area.

Purpose: This is the core transformation — replaces the current single-agent doc write with parallel exploration across 5 focus areas, producing a unified doc-report.md with actionable recommendations covering the full impact surface (code comments, module/flow docs, standards/decisions, project config, friction reduction).

Output:
- get-shit-done/workflows/doc.md (restructured)
- agents/gsd-doc-writer.md (rewritten for dual-role)
</objective>

<execution_context>
@/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/doc-writer-overhaul/FEATURE.md
@/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/doc-writer-overhaul/RESEARCH.md
@/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md
@/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review.md

<interfaces>
<!-- Pattern reference: review.md uses 4 parallel Task() blocks each with subagent_type="gsd-review-{dim}" -->
<!-- Explorer Task() format follows the same pattern with subagent_type="gsd-doc-writer" -->
<!-- gather-synthesize.md abort threshold: failed_count / total > 0.50 -->
<!-- With 5 explorers: 3+ failures = abort (60%), 2 or fewer = proceed -->
<!-- doc-report.md downstream consumers: doc.md Step 5 (verify), Step 6 (impact), Steps 7-8 (Q&A) -->
<!-- current doc.md Step 7 iterates "each doc (modules first, then flows)" -- must change to recommendations grouped by focus area -->
<!-- LENS values: debug | new | enhance | refactor -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Restructure doc.md: replace single Task() with 5 parallel explorer + synthesizer Task() blocks, add mkdir, update Q&A loop</name>
  <reqs>FN-01, FN-02, FN-03, FN-05, FN-06</reqs>
  <files>get-shit-done/workflows/doc.md</files>
  <action>
  Read get-shit-done/workflows/doc.md (current content) in full before editing.

  Make the following changes:

  **Step 1 (Initialize) — add mkdir for doc directory:**
  After the existing `mkdir -p .documentation/modules .documentation/flows .documentation/capabilities` line, add:
  ```bash
  mkdir -p "${FEATURE_DIR}/doc"
  ```
  This must appear before Step 4 (explorer spawns). Step 1 is the correct location.

  **Step 4 — Replace "Spawn Doc Agent" entirely:**
  Remove the current Step 4 content (single Task() call with subagent_type="general-purpose").
  Replace with:

  ```
  ## 4. Spawn Explorers in Parallel

  Assemble context payload (read each path, embed content):
  ```
  <core_context>{contents of PROJECT.md, STATE.md, ROADMAP.md}</core_context>
  <capability_context>{contents of CAPABILITY.md}</capability_context>
  <feature_context>{contents of FEATURE.md with EU/FN/TC requirements}</feature_context>
  <doc_context>
  Lens: {LENS}
  Lens emphasis:
    - new: emphasis on end-to-end docs, architecture additions, new capability docs
    - enhance: emphasis on what changed, updated modules/flows, decision rationale
    - debug: emphasis on root cause documentation, failure modes, known issues
    - refactor: emphasis on before/after architecture, migration notes, updated mappings
  Feature artifacts: {artifact list from Step 3}
  Review synthesis: {feature_dir}/review/synthesis.md (if exists)
  </doc_context>
  ```

  Spawn all 5 explorers simultaneously (parallel Task calls — do NOT wait for one before spawning the next):

  ```
  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: code-comments\nScope: Scan modified source files for missing or stale inline documentation. Check: function docstrings, inline explanations of non-obvious logic, parameter descriptions, return value notes. Do NOT cover .documentation/ files or config files — those are other focus areas.\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/code-comments-findings.md\nWrite something even if you find no opportunities (e.g., 'No inline documentation gaps identified in modified files.').</task_context>",
    subagent_type="gsd-doc-writer",
    model="sonnet",
    description="Doc Explore: code-comments for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: module-flow-docs\nScope: Identify .documentation/ module and flow docs that need creation or update based on what was built/changed. Check: missing module docs for new files, stale module docs for modified files, missing/stale flow docs for changed data paths. Do NOT check inline code comments or config files — those are other focus areas.\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/module-flow-docs-findings.md\nWrite something even if you find no opportunities (e.g., 'No module/flow doc gaps identified.').</task_context>",
    subagent_type="gsd-doc-writer",
    model="sonnet",
    description="Doc Explore: module-flow-docs for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: standards-decisions\nScope: Identify new patterns, conventions, or architectural decisions introduced by this change that are worth codifying. Read existing .documentation/ for drift. Check CLAUDE.md for stale architectural guidance this change supersedes. Do NOT check config drift (that is project-config focus area).\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/standards-decisions-findings.md\nWrite something even if you find no opportunities (e.g., 'No new standards or decisions identified.').</task_context>",
    subagent_type="gsd-doc-writer",
    model="sonnet",
    description="Doc Explore: standards-decisions for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: project-config\nScope: Detect CLAUDE.md fixes, config drift, or stale project instructions caused by this change. Read CLAUDE.md for instructions that are now incorrect, outdated, or missing given what was built. Do NOT look for new patterns or architectural decisions — that is standards-decisions focus area.\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/project-config-findings.md\nWrite something even if you find no opportunities (e.g., 'No CLAUDE.md or config drift identified.').</task_context>",
    subagent_type="gsd-doc-writer",
    model="sonnet",
    description="Doc Explore: project-config for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )

  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: explorer\nFocus area: friction-reduction\nScope: Recommend hooks, skills, or automation that could streamline repeated workflows exposed by this change. Look for: repetitive manual steps in related workflows, patterns that could become a skill command, setup steps that could be automated via hooks. Do NOT recommend changes to the implemented feature itself.\nFeature artifacts: {artifact_list}\nWrite your findings to: {feature_dir}/doc/friction-reduction-findings.md\nWrite something even if you find no opportunities (e.g., 'No friction reduction opportunities identified.').</task_context>",
    subagent_type="gsd-doc-writer",
    model="sonnet",
    description="Doc Explore: friction-reduction for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )
  ```

  Wait for ALL 5 explorers to complete.

  **After the 5 Task() blocks — add failure handling:**
  ```
  After all explorers complete, check each output:
  - {feature_dir}/doc/code-comments-findings.md
  - {feature_dir}/doc/module-flow-docs-findings.md
  - {feature_dir}/doc/standards-decisions-findings.md
  - {feature_dir}/doc/project-config-findings.md
  - {feature_dir}/doc/friction-reduction-findings.md

  For each missing or empty file: retry that explorer ONCE with the same prompt.
  After retry, if still missing/empty: status = "failed".

  Abort threshold: if 3 or more explorers fail (failed_count >= 3), abort — do NOT proceed to synthesis.
  Display error:
  ```
  GSD > DOC EXPLORE FAILED: {N}/5 explorers failed
  Failed: {list of failed focus areas}
  Action: Check agent definitions and context assembly before retrying.
  ```
  If 2 or fewer fail: proceed to synthesis with partial results.
  ```

  **After failure handling — add synthesizer Task():**
  ```
  Task(
    prompt="First, read {GSD_ROOT}/agents/gsd-doc-writer.md for your role.\n\n<subject>{CAPABILITY_SLUG}/{FEATURE_SLUG}</subject>\n\n{context_payload}\n\n<task_context>Role: synthesizer\nExplorer findings to consolidate:\n- code-comments: {feature_dir}/doc/code-comments-findings.md [{status}]\n- module-flow-docs: {feature_dir}/doc/module-flow-docs-findings.md [{status}]\n- standards-decisions: {feature_dir}/doc/standards-decisions-findings.md [{status}]\n- project-config: {feature_dir}/doc/project-config-findings.md [{status}]\n- friction-reduction: {feature_dir}/doc/friction-reduction-findings.md [{status}]\n\nConflict priority: code-comments > module-flow-docs > standards-decisions > project-config > friction-reduction\n\nFor any explorer with status 'failed': document the gap — do not fabricate findings.\n\nWrite consolidated doc-report.md to: {feature_dir}/doc-report.md</task_context>",
    subagent_type="gsd-doc-writer",
    model="inherit",
    description="Doc Synthesize for {CAPABILITY_SLUG}/{FEATURE_SLUG}"
  )
  ```

  **Step 5 (Verify Output) — update check:**
  Change the current "Check doc-report.md exists. List generated module and flow docs." to:
  "Check doc-report.md exists and is non-empty. If missing or empty: error."
  Remove references to listing "generated module and flow docs" (that is now in recommendations, not auto-generated files).

  **Step 6 (Impact Discovery) — update:**
  Change "Read doc report for impact flags -- existing flow docs referencing modified modules." to:
  "Read doc-report.md. Collect impact flags: recommendations referencing existing .documentation/ files. Present after Q&A."

  **Steps 7-8 — replace Q&A loop:**
  Replace the current Step 7 content ("For each doc (modules first, then flows)...") with:

  ```
  ## 7. Present Recommendations (Q&A Loop)

  For each focus area group in doc-report.md (in priority order: code-comments, module-flow-docs, standards-decisions, project-config, friction-reduction):

  For each recommendation in the group:

  Display:
  - Focus area: {area}
  - Target file: {target_file}
  - What to change: {change}
  - Why: {rationale}

  Options via AskUserQuestion (header: "Rec {N}/{total}"):
  - **Approve** -- include in commit
  - **Edit** -- provide feedback, re-generate this recommendation
  - **Reject** -- exclude from commit
  ```

  Replace current Step 8 ("Present Impact Flags") with:

  ```
  ## 8. Present Impact Flags

  If impacted existing docs found in doc-report.md: display as informational section (no Q&A action required).
  ```

  **key_constraints — update:**
  Remove the line: `- Single-agent pipeline (NOT gather-synthesize) -- one doc-writer, not parallel gatherers`
  Add: `- Gather-synthesize pattern: 5 parallel explorers (sonnet) + 1 synthesizer (inherit)`
  Add: `- Abort threshold: 3+ of 5 explorer failures = abort`
  Add: `- mkdir -p "{FEATURE_DIR}/doc" required before explorer spawns`

  **Step 11 Output Path Targets — update:**
  Replace the current Step 11 "Output Path Targets" list of `.documentation/` file paths with:
  "Approved recommendations are applied to the paths identified in each recommendation's `target_file` field. No fixed output paths — outputs depend on user approvals in Step 7."
  Remove the static list of .documentation/ paths from Step 11 (those are now surfaced through recommendations, not auto-generated).

  **Step 12 Completion message — update artifacts line:**
  Change: `Artifacts: {documentation_dir}/, {feature_dir}/doc-report.md`
  To: `Artifacts: {feature_dir}/doc/, {feature_dir}/doc-report.md`
  </action>
  <verify>
    <automated>grep -n "mkdir.*FEATURE_DIR.*doc" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md</automated>
    <automated>grep -c "subagent_type=\"gsd-doc-writer\"" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md</automated>
    <automated>grep -n "model=\"inherit\"" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md</automated>
    <automated>grep -n "Single-agent pipeline" /Users/philliphall/get-shit-done-pe/get-shit-done/workflows/doc.md</automated>
  </verify>
  <done>
  - doc.md contains `mkdir -p "${FEATURE_DIR}/doc"` in Step 1
  - doc.md Step 4 contains exactly 5 explorer Task() blocks with subagent_type="gsd-doc-writer" model="sonnet" and 1 synthesizer Task() with model="inherit"
  - doc.md Steps 7-8 iterate recommendations grouped by focus area (not per-generated-doc)
  - grep for "Single-agent pipeline" returns no matches in doc.md
  - grep for "subagent_type=\"gsd-doc-writer\"" returns 6 matches (5 explorers + 1 synthesizer)
  </done>
</task>

<task type="auto">
  <name>Rewrite gsd-doc-writer.md to support explorer and synthesizer dual roles via prompt differentiation</name>
  <reqs>FN-01, FN-02, FN-03, TC-01, TC-03</reqs>
  <files>agents/gsd-doc-writer.md</files>
  <action>
  Read agents/gsd-doc-writer.md (current content) in full before editing.

  Rewrite the agent definition. The new agent must cleanly handle two roles — it determines which role to perform from the `Role:` field in its `<task_context>`.

  **Preserve from current definition:**
  - YAML frontmatter (name, description, tools, role_type, reads, writes)
  - Framing Context section (lens-specific emphasis per debug/new/enhance/refactor)
  - Requirement Layer Awareness section (EU/FN/TC explanation)
  - Section Ownership Model ([derived]/[authored]) — preserved for synthesizer use when it writes module/flow doc recommendations
  - Tool Guidance

  **Update frontmatter:**
  - description: `Parallel focus-area explorer and recommendation synthesizer for the doc stage. Explorer investigates one focus area and writes findings. Synthesizer consolidates findings into prioritized recommendations.`
  - reads: `[feature-artifacts, review-synthesis, feature-requirements, existing-docs, source-code]`
  - writes: `[focus-area-findings, doc-report]`

  **Replace Role section with:**
  ```
  ## Role

  You operate in one of two modes determined by `Role:` in your task_context:

  - **explorer**: Investigate one focus area. Write findings as structured entries to your assigned output path.
  - **synthesizer**: Read all explorer findings files. Consolidate, deduplicate, resolve conflicts, prioritize. Write doc-report.md.
  ```

  **Replace Goal section with:**
  ```
  ## Goal

  **Explorer goal:** Produce actionable findings for your assigned focus area. Every finding must identify: target file, current state, recommended change, rationale. Do not speculate outside your assigned scope. Write something even if you find nothing (explain what you checked and why there are no gaps).

  **Synthesizer goal:** Produce a unified doc-report.md from explorer findings. Deduplicate overlapping recommendations. Resolve conflicts using priority order (provided in your task_context). Order all recommendations by impact (highest first within each focus area group).
  ```

  **Replace Success Criteria section with:**
  ```
  ## Success Criteria

  **Explorer:**
  - Findings file is non-empty (even if findings say "nothing identified")
  - Every finding entry has: target_file, current_state, recommended_change, rationale
  - Scope is confined to assigned focus area — no cross-area overlap
  - Source files read directly for code-comments focus area; SUMMARYs and review artifacts used for all other areas

  **Synthesizer:**
  - doc-report.md exists and is non-empty
  - All recommendations grouped by focus area
  - Each recommendation has: focus_area, target_file, what_to_change, why, priority (high/medium/low)
  - Conflicts resolved using provided priority order
  - Failed explorer dimensions documented as gaps (not fabricated)
  ```

  **Replace Scope section with:**
  ```
  ## Explorer Scope Boundaries

  Focus area assignments are exclusive — each explorer owns exactly one domain:

  - **code-comments**: Source files modified in this change. Reads actual source files. Checks: function docstrings, inline explanations, parameter notes.
  - **module-flow-docs**: .documentation/ module and flow docs. Works from SUMMARYs and review synthesis. Checks: missing docs for new files, stale docs for changed files.
  - **standards-decisions**: New patterns or architectural decisions worth codifying. Reads existing .documentation/ and CLAUDE.md for drift. Does NOT check config freshness (that is project-config).
  - **project-config**: CLAUDE.md fixes, config drift, stale instructions. Does NOT look for new patterns (that is standards-decisions).
  - **friction-reduction**: Hooks, skills, automation opportunities. Analyzes workflow patterns from SUMMARYs. Does NOT recommend changes to the implemented feature itself.

  Never scan outside your assigned scope. Overlap causes duplicate recommendations the synthesizer cannot cleanly resolve.
  ```

  **Add Explorer Output Format section:**
  ```
  ## Explorer Output Format

  Write to your assigned `{feature_dir}/doc/{focus-area}-findings.md` path.

  File structure:
  ```yaml
  ---
  focus_area: {focus-area-name}
  feature: {capability_slug}/{feature_slug}
  date: {YYYY-MM-DD}
  ---
  ```

  Then for each finding:
  ```
  ## Finding: {brief title}

  - **target_file**: {path to file that needs the change}
  - **current_state**: {what exists now — be specific}
  - **recommended_change**: {what to do — be actionable}
  - **rationale**: {why this matters}
  ```

  If no findings: write the frontmatter plus one line explaining what you checked and why no gaps were found.
  ```

  **Add Synthesizer Output Format section:**
  ```
  ## Synthesizer Output Format

  Write to `{feature_dir}/doc-report.md`.

  File structure:
  ```yaml
  ---
  type: doc-report
  feature: {capability_slug}/{feature_slug}
  date: {YYYY-MM-DD}
  explorer_manifest:
    code-comments: success | failed
    module-flow-docs: success | failed
    standards-decisions: success | failed
    project-config: success | failed
    friction-reduction: success | failed
  ---
  ```

  Then for each focus area group (in priority order: code-comments, module-flow-docs, standards-decisions, project-config, friction-reduction):

  ```
  ## {Focus Area Name}

  ### Recommendation: {brief title}

  - **target_file**: {path}
  - **what_to_change**: {actionable description}
  - **why**: {rationale}
  - **priority**: high | medium | low
  ```

  If an explorer failed: write `## {Focus Area Name}\n\n*Explorer failed — dimension not covered.*`

  If an explorer found nothing: write `## {Focus Area Name}\n\n*No recommendations identified.*`

  Impact flags (for Step 6 in doc.md): at the end of doc-report.md, add:
  ```
  ## Impact Flags

  {List existing .documentation/ files referenced by recommendations, if any. Format: "- {file}: {reason for flag}"}
  ```
  ```

  **Remove from current definition:**
  - Input Contract section (replaced by Explorer Scope Boundaries)
  - Processing Order section (modules before flows — no longer applies; focus areas define order)
  - Heading Templates section (module/flow heading templates — now recommendations format, not generated docs)
  - Cross-Referencing section
  - Doc Frontmatter section
  - 3-Pass Self-Validation section (replaced by Success Criteria per role)

  **Keep Framing Context section intact** — it applies to both explorer and synthesizer roles. Explorers use it to shape their investigation emphasis; synthesizer uses it for priority weighting.

  **Keep Requirement Layer Awareness section intact** — synthesizer needs it to connect findings to EU/FN/TC when writing rationale.

  **Keep Section Ownership Model section** — relevant when synthesizer recommends changes to existing .documentation/ files.

  **Keep Tool Guidance section** — same tools apply (Read source files for code-comments explorer, Glob/Grep for locating files).
  </action>
  <verify>
    <automated>grep -n "Role: explorer\|Role: synthesizer\|## Role" /Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md</automated>
    <automated>grep -n "focus_area\|target_file\|recommended_change" /Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md</automated>
    <automated>grep -n "3-Pass Self-Validation\|Single-agent\|Processing Order\|Heading Templates" /Users/philliphall/get-shit-done-pe/agents/gsd-doc-writer.md</automated>
  </verify>
  <done>
  - gsd-doc-writer.md contains "## Role" section with explorer and synthesizer mode descriptions
  - gsd-doc-writer.md contains "Explorer Output Format" section with YAML frontmatter + Finding entry template
  - gsd-doc-writer.md contains "Synthesizer Output Format" section with doc-report.md structure
  - gsd-doc-writer.md contains "Explorer Scope Boundaries" section with 5 focus areas and their exclusive domains
  - grep for "3-Pass Self-Validation" returns no matches
  - grep for "Heading Templates" returns no matches
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. doc.md structural check:
   - `grep -c "subagent_type=\"gsd-doc-writer\"" get-shit-done/workflows/doc.md` returns 6
   - `grep -n "model=\"inherit\"" get-shit-done/workflows/doc.md` returns 1 match (synthesizer)
   - `grep -n "mkdir.*FEATURE_DIR.*doc" get-shit-done/workflows/doc.md` returns 1 match
   - `grep -n "Single-agent pipeline" get-shit-done/workflows/doc.md` returns 0 matches
   - `grep -n "Rec {N}" get-shit-done/workflows/doc.md` returns 1 match (updated Q&A header)

2. gsd-doc-writer.md structural check:
   - `grep -n "## Role" agents/gsd-doc-writer.md` returns 1 match
   - `grep -c "focus_area" agents/gsd-doc-writer.md` > 0
   - `grep -n "3-Pass Self-Validation\|Heading Templates" agents/gsd-doc-writer.md` returns 0 matches

3. Atomicity check: both files edited in this plan — no partial deploy state.
</verification>

<success_criteria>
- doc.md Step 4 is a gather-synthesize block with 5 parallel explorer Task() blocks + 1 synthesizer Task() (FN-01, TC-01)
- Each explorer Task() has a non-overlapping focus area scope in its prompt (FN-02, TC-03)
- Synthesizer Task() uses model="inherit" and writes doc-report.md with all 5 focus area groups (FN-03)
- doc.md Step 1 includes `mkdir -p "${FEATURE_DIR}/doc"` before Step 4 (TC-01 hard constraint)
- Abort threshold of 3/5 failures stated in doc.md (FN-01)
- Q&A loop in doc.md Steps 7-8 iterates recommendations grouped by focus area with target_file/what/why (FN-06, EU-01)
- LENS propagated to each explorer Task() prompt via doc_context block (EU-03, FN-01)
- gsd-doc-writer.md supports both explorer and synthesizer roles via Role: field in task_context (TC-01, TC-03)
- Explorer output format: YAML frontmatter + Finding entries with target_file/current_state/recommended_change/rationale (TC-03)
- Synthesizer output format: doc-report.md with focus area groups, priority ordering, impact flags section (FN-03)
- key_constraints in doc.md updated: "Single-agent pipeline" note removed, gather-synthesize constraints added (FN-05)
</success_criteria>

<output>
After completion, create `.planning/capabilities/pipeline-execution/features/doc-writer-overhaul/01-SUMMARY.md`
</output>
