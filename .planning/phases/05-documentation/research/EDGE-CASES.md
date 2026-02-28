# Edge Cases Findings: Phase 5 Documentation

**Phase:** 05-documentation
**Researched:** 2026-02-28
**Dimension:** Boundary conditions, failure modes, edge cases
**Confidence:** HIGH (grounded in 05-CONTEXT.md locked decisions, REQUIREMENTS.md DOCS-01 through DOCS-03, prior phase patterns from 02-agent-framework and 04-review-layer, existing plan definitions 05-01 through 05-03)

---

## Failure Modes

| Failure | Likelihood | Severity | Mitigation | Source |
|---------|------------|----------|------------|--------|
| Doc agent hallucinating function names or module relationships | common | blocking | Pass 2 self-validation (referential integrity) verifies exports actually exist and dependency references resolve; workflow verifies output files exist and are non-empty before Q&A | [05-CONTEXT.md: Pass 2 checks "module names match real code artifacts, listed exports actually exist, dependency references resolve"; First principles: LLMs hallucinate plausible-but-wrong identifiers -- same pattern as reviewer file:line citation in Phase 4] |
| Cold start: no existing docs, no gate docs, first run ever | common | degraded | Plan 05-01 scaffolds gate docs with universal seed content before agent runs; agent must handle empty `.documentation/modules/` and `.documentation/flows/` gracefully -- create, not update | [05-CONTEXT.md: "Gate docs are scaffolded with universal seed content as Phase 5 infrastructure"; 05-01-PLAN.md creates gate docs in wave 1 before workflow runs] |
| Review artifacts missing or malformed when doc agent triggers | rare | blocking | Workflow (05-03) locates artifacts via SUMMARY.md files; if no summaries exist or review synthesis is missing, workflow should error with "no reviewed work to document" before spawning agent | [05-CONTEXT.md: "Doc agent triggers automatically after review acceptance"; review-phase.md writes synthesis.md and review-decisions.md -- if review was skipped, these do not exist] |
| Doc agent output exceeds context window for large codebase | common | degraded | Discovery scope limits: primary (modified files only) + one-hop impact (grep existing flow docs for references); never full codebase scan; if modified file count exceeds reasonable limit (~15-20 files), workflow should chunk into multiple agent spawns | [05-CONTEXT.md: "Primary (always): files directly modified in the reviewed change"; "Never: full codebase scan or unrelated modules"] |
| [authored] section conflicts: code changed but WHY block contradicts new behavior | common | degraded | Agent preserves authored sections and flags conflicts; conflict flag surfaced during Q&A review with both the old WHY text and the new code behavior; user decides whether to update WHY or revert code | [05-CONTEXT.md: "[authored] sections -- written with intent, preserve and flag conflicts"; "Agent parses existing doc by heading anchors, regenerates derived sections, preserves authored sections, flags conflicts"] |
| Module renamed: existing module doc becomes orphaned | rare | degraded | Pass 2 referential integrity catches module docs that reference non-existent code files; one-hop impact discovery catches flow docs referencing the old module name; orphaned module doc flagged during Q&A, not auto-deleted | [05-CONTEXT.md: Pass 2 "module names match real code artifacts"; impact discovery "grep existing flow docs for references to modified modules -- flag for review, don't auto-rewrite"] |
| Module deleted: module doc exists for code that no longer exists | rare | degraded | Same as rename: Pass 2 catches docs referencing non-existent files; agent flags orphan during Q&A; user approves deletion | [05-CONTEXT.md: Pass 2 referential integrity; First principles: auto-deleting docs is dangerous -- user approval required] |
| Flow doc references module that was refactored | common | degraded | One-hop impact discovery greps existing flow docs for modified module names; impacted flows flagged but not auto-rewritten; agent outputs list of affected flow docs with what changed | [05-CONTEXT.md: "Impacted flow docs (one-hop discovery) are flagged only -- not auto-rewritten"] |
| Gate doc empty state: constraints.md has seed content but state.md has no project-specific entries | common | low | Pass 3 validates against whatever is in gate docs; if state.md is template-only (no entries), state reference checks produce zero violations -- this is correct behavior, not an error; agent should not flag "empty gate doc" as a problem | [05-CONTEXT.md: "state.md (template, populated as you build)"; First principles: empty gate doc means no constraints to violate -- vacuously true] |
| Self-validation Pass 2 fails: exports changed but code is valid | rare | degraded | Pass 2 checks that "listed exports actually exist" -- if an export was renamed in code but the doc lists the old name, this is a genuine doc error caught correctly; if the code refactored exports but the module is functionally equivalent, agent regenerates [derived] Exports section from current code | [05-CONTEXT.md: "[derived] sections -- regenerated from code + reviews, overwrite freely (Purpose, Exports, Depends-on)"] |
| Multiple features touching same module: doc update ordering | rare | degraded | Doc agent triggers per-feature after review acceptance; if feature A and feature B both modify `parser.md`, second run regenerates [derived] sections from latest code state; [authored] sections preserved across both runs; no merge conflict because [derived] is always overwritten | [05-CONTEXT.md: "[derived] overwrite freely"; "Agent parses existing doc by heading anchors"] |
| Agent fails to parse existing doc by heading anchors | rare | blocking | If doc file exists but has malformed headings (edited manually, corrupted), agent cannot distinguish [derived] from [authored]; mitigation: Pass 1 structural compliance catches malformed headings before content generation; if Pass 1 fails, agent reports structural error and asks user to fix manually | [05-CONTEXT.md: "Pass 1 -- Structural compliance: required headings present, ownership tags on every section, anchors match canonical format"] |
| Git SHA not available for built-from-code-at timestamp | rare | low | Workflow should capture current git SHA before spawning agent; if git is not initialized or HEAD is detached, use "unknown" as fallback; staleness detection degrades but docs are still generated | [05-CONTEXT.md success criteria: "built-from-code-at: git SHA timestamp for staleness detection"] |

### Boundary Conditions

- **First module ever documented**: `.documentation/modules/` directory does not exist. Agent must create directory, not assume it exists. The init doc-phase command (Plan 05-02) should ensure `documentation_dir` exists, but the agent should also handle `mkdir -p` gracefully if the workflow missed it. -- [05-02-PLAN.md: "documentation_dir = .documentation"; First principles: defensive directory creation costs nothing]

- **Flow with single step**: A flow that involves only one module (e.g., "config-load → reads config.yaml"). Flow narrative template still applies (Trigger, Input, Steps, Output, Side-effects) but ASCII diagram is trivial. Agent should still produce the full template -- single-step flows are valid. -- [05-CONTEXT.md: "Flow narrative template per flow: Trigger -> Input -> Steps -> Output -> Side effects"; Claude's Discretion: "ASCII diagram style and complexity per flow"]

- **Module with no exports**: A module that only has side effects (e.g., a migration script, a CLI entry point). The `## Exports:` section should document "None -- side-effect only module" rather than being empty or omitted. Pass 2 should not flag this as a referential integrity error. -- [05-CONTEXT.md: heading template includes "## Exports:"; First principles: absence of exports is a valid state that should be documented, not an error]

- **Module with no dependencies**: A leaf module that imports nothing project-internal. `## Depends-on:` should document "None" explicitly. -- [Same rationale as no-exports case]

- **WHY block on a derived section**: If someone accidentally adds a WHY annotation inside an Exports section (which is [derived]), the agent would overwrite it. The heading template separates WHY as its own section, but inline rationale could be lost if placed in derived sections. Mitigation: Pass 1 structural compliance should flag WHY content inside [derived] sections as misplaced. -- [05-CONTEXT.md: "## WHY: (only if non-obvious)" is a separate heading; "[derived] sections -- regenerated from code + reviews, overwrite freely"]

- **Cross-referencing boundary: flow references module that has no module doc**: A flow narrative references `parser` in Steps, but `.documentation/modules/parser.md` does not exist yet (maybe parser was built in a different feature that was not yet documented). Pass 2 referential integrity checks "flow step module references match docs/modules/ filenames" -- this would fail. The agent should flag this as "missing module doc" not "invalid reference." -- [05-CONTEXT.md: Pass 2 "flow step module references match docs/modules/ filenames"]

- **Gate doc with project-specific entries added by human**: After scaffold, user adds `## Constraint: no-orm [manual]`. Agent reads this during Pass 3 and must validate against it. If generated docs contain ORM references, Pass 3 should flag the violation. Edge: what if the constraint is vague or contradictory with existing code? Agent flags the violation; user resolves. -- [05-CONTEXT.md: "constraints.md -> agent checks generated docs don't reference banned patterns"]

- **Zero files modified in reviewed change**: Review accepted but no code files were actually changed (maybe only config or docs were updated). Discovery scope finds no primary files. Agent should produce no module docs, possibly no flow docs, and report "no code changes to document." -- [05-CONTEXT.md: "Primary (always): files directly modified in the reviewed change"]

- **Glossary term collision**: Code uses "module" in a domain-specific way that differs from the universal glossary definition. Pass 3 cannot detect semantic differences -- it only checks spelling consistency. If the code uses "module" correctly per glossary but means something different in context, this passes silently. -- [05-CONTEXT.md: "glossary.md -> agent enforces naming consistency in all generated docs"; First principles: string matching cannot detect semantic drift]

### Integration Failure Scenarios

- **Upstream: review-phase wrote synthesis.md but not review-decisions.md** -> The doc agent reads review findings for WHY blocks. If review-decisions.md is missing (e.g., zero findings, all met), the agent has no review rationale to draw from. WHY blocks would be derived from code alone, which is acceptable but produces thinner rationale. The agent should not error on missing review-decisions.md -- absence of findings is a valid state. -- [05-CONTEXT.md input contract: "Review findings -> 'why is it this way' (WHY blocks, rationale)"; review-phase.md Step 7: "If zero findings (all requirements met, no issues): display success and skip to step 10"]

- **Upstream: review-phase synthesis has malformed section headings** -> Doc agent cannot parse reviewer verdicts. Mitigation: doc agent should read synthesis.md as context but not depend on specific section heading structure -- it is supplementary input, not the primary source (code is primary). If synthesis parsing fails, log warning and proceed with code-only documentation. -- [05-CONTEXT.md input contract: code is "what does this do" (primary), review findings are "why" (supplementary)]

- **Upstream: FEATURE.md requirements were modified after review acceptance** -> Doc agent reads FEATURE.md for "what was it supposed to do" but requirements may have drifted since review. The doc should reflect the reviewed code, not the current requirements. Mitigation: doc agent should prioritize code (actual state) over FEATURE.md (intended state) when they conflict. -- [05-CONTEXT.md: "Agent reads actual built code" is the primary mandate; FEATURE.md is supplementary for intent tracing]

- **Upstream: execution summary files missing from phase directory** -> The workflow (Plan 05-03 Step 3) locates artifacts via `*-SUMMARY.md` files. If summaries are missing, the workflow cannot determine what files were built. This is a hard block -- without knowing what was built, the agent has no discovery scope. Workflow should error with "no execution summaries found." -- [05-03-PLAN.md: "locate artifacts" step; 05-CONTEXT.md: discovery scope depends on "files directly modified in the reviewed change"]

- **Downstream: generated docs consumed by future planning/research agents** -> If doc headings drift from the canonical format (e.g., "## Module: parser" becomes "## Module - parser"), future mgrep searches break. Pass 1 structural compliance is the prevention. If a bug in the agent produces non-canonical headings that pass a faulty self-validation, all downstream consumers are affected. -- [05-CONTEXT.md: "Heading templates (strict, for grep consistency)"; DOCS-03: "optimized for quick lookups and mgrep searches"]

- **Downstream: doc-phase workflow called but Phase 4 review was never run** -> Pipeline order is execute -> review -> accept -> document. If someone runs `/gsd:doc-phase` without having run review, there is no review acceptance to trigger from. Init doc-phase should check for review artifacts existence and warn. It should still proceed (documentation from code alone is valid) but note that WHY blocks will be thin. -- [05-CONTEXT.md: trigger model "after review acceptance"; First principles: docs from code alone are still valuable, just missing review rationale]

- **Integration: init doc-phase returns gate_docs_exist=false on first run before Plan 05-01 executes** -> Plans 05-01 (agent + gate docs) and 05-02 (init command) are wave 1 (parallel). If the workflow (Plan 05-03, wave 2) runs before gate docs are scaffolded, Pass 3 has nothing to validate against. This is handled by wave ordering -- 05-03 depends on 05-01 and 05-02. But if someone manually triggers doc-phase before Phase 5 plans are executed, gate docs would not exist. Agent should treat missing gate docs as "no constraints to violate" and log a warning. -- [05-01-PLAN.md wave 1, 05-03-PLAN.md wave 2 depends_on: [05-01, 05-02]]

### Existing Error Handling (gaps)

- `get-shit-done/templates/docs.md`: Uses v1 structure (design.md + features.md + lessons.md per capability). Phase 5 requires v2 structure (modules/ flat 1:1, flows/ capability-grouped, gate/ human-maintained). Template must be rewritten (addressed by Plan 05-02 Task 2). -- `get-shit-done/templates/docs.md:1-59`

- No doc agent definition exists yet. `agents/gsd-doc-writer.md` must be created from scratch (addressed by Plan 05-01 Task 1). No existing error handling to evaluate. -- [Glob search: `agents/gsd-doc*` returned no results]

- No `.documentation/` directory exists yet. All directory creation, gate doc scaffolding, and module/flow doc generation is net-new work. -- [Glob search: `.documentation/` returned "Directory does not exist"]

- No `cmdInitDocPhase` function exists in `init.cjs`. The existing `cmdInitReviewPhase` is the template, but doc-phase init needs additional fields: `documentation_dir`, `gate_docs_exist`, `summary_files` (addressed by Plan 05-02 Task 1). -- [05-02-PLAN.md task 1 inputs reference cmdInitReviewPhase pattern]

- No doc-phase workflow exists. `get-shit-done/workflows/doc-phase.md` must be created (addressed by Plan 05-03 Task 1). The review-phase workflow is the structural template but doc-phase is single-agent (not gather-synthesize). -- [05-03-PLAN.md: "single-agent pipeline (NOT gather-synthesize)"]

### Known Issues in Ecosystem

- **LLM identifier hallucination in documentation**: LLMs generate plausible function names and module relationships that do not exist in the actual codebase. This is the same pattern as file:line citation hallucination in Phase 4 review, but worse for docs because the output IS the documentation -- there is no separate spot-check step. Pass 2 self-validation is the only defense. If Pass 2 itself is unreliable (agent hallucinates that its own hallucinated exports exist), the Q&A review with the user is the final safety net. -- [First principles: self-validation by the same LLM that generated the content has inherent reliability limits; user Q&A is the true verification step]

- **Section ownership parsing fragility**: The [derived]/[authored] tag parsing depends on exact text markers in existing docs. If tags are accidentally modified, deleted, or misspelled by a human editor, the agent loses track of which sections it can overwrite. One typo in an [authored] tag means the agent may overwrite a WHY block. -- [05-CONTEXT.md: "Ownership tags [derived]/[authored] per section -- not per heading convention but explicit markers"; First principles: text-marker-based ownership is fragile to human editing]

- **One-hop discovery false positives**: Grepping existing flow docs for a modified module name may match in contexts unrelated to the actual change. For example, modifying `parser` might match a flow doc that mentions "parser" in a WHY block discussing why the parser was NOT used for this flow. The impact flag would be a false positive, but since impact flags are advisory-only (not auto-rewritten), this is low severity. -- [05-CONTEXT.md: "grep existing flow docs for references to modified modules -- flag for review, don't auto-rewrite"]

- **Context window pressure for doc generation**: The doc agent reads code, review findings, and requirements as input, then generates module docs and flow docs as output. For a feature touching 10+ files with detailed review findings, input alone could consume 40-50% of context. Output (multiple doc files) adds more. Unlike reviewers (which produce one trace report), the doc agent produces multiple output files in a single run. Chunking strategy needed for large features. -- [05-CONTEXT.md: agent reads "code, review findings, requirements" and writes "module docs + flow docs"; First principles: generation tasks consume more context than analysis tasks because output is verbose]

- **Staleness detection is advisory only**: The `built-from-code-at: {git-sha}` timestamp enables staleness detection, but nothing in the system actively checks it. If code changes without re-running doc-phase, docs become stale silently. The staleness timestamp is useful for human inspection but there is no automated guard. -- [ROADMAP.md success criteria 2: "built-from-code-at: git SHA timestamp for staleness detection"; 05-CONTEXT.md deferred: "On-demand doc regeneration command -- possible future enhancement"]

---

## Risk Matrix

| Edge Case | Severity | Likelihood | Priority |
|-----------|----------|------------|----------|
| Doc agent hallucinating function names | High -- false docs worse than no docs | High -- LLM hallucination pattern | P1 -- Pass 2 self-validation + Q&A review |
| Cold start (no existing docs) | Low -- expected first-run state | High -- every new project | P1 -- agent must create not update |
| Review artifacts missing | High -- agent has no discovery scope | Low -- pipeline ordering prevents | P1 -- workflow pre-check before spawn |
| Large codebase context overflow | Medium -- degraded quality | Medium -- depends on feature scope | P2 -- discovery scope limits + chunking |
| [authored] conflict with changed code | Low -- advisory flag only | Medium -- common during refactors | P2 -- flag during Q&A, user resolves |
| Module renamed/deleted orphan docs | Medium -- stale docs persist | Low -- less common than modifications | P2 -- Pass 2 catches, Q&A surfaces |
| Flow referencing refactored module | Low -- impact flag only | Medium -- common during refactors | P2 -- one-hop discovery flags |
| Gate doc empty state | None -- vacuously correct | High -- first project run | None -- no action needed |
| Pass 2 with changed exports | Low -- [derived] section regenerated | Medium -- normal code evolution | None -- designed behavior |
| Multiple features same module | Low -- [derived] overwrite is idempotent | Low -- rare in practice | P3 -- second run overwrites correctly |
| Malformed existing doc headings | High -- cannot distinguish owned sections | Low -- requires manual corruption | P1 -- Pass 1 structural check |
| Git SHA unavailable | Low -- staleness degrades gracefully | Rare -- unusual environment | P3 -- fallback to "unknown" |
| Section ownership tag corruption | High -- agent may overwrite WHY blocks | Low -- requires human edit error | P1 -- Pass 1 should validate tag presence |
| One-hop discovery false positives | Low -- flags are advisory only | Medium -- grep matches broadly | P3 -- accept false positives, user filters |
| Execution summaries missing | High -- no discovery scope | Low -- pipeline ordering prevents | P1 -- workflow pre-check |
| Upstream review never run | Medium -- thin WHY blocks | Low -- pipeline ordering | P2 -- warn and proceed with code-only |
| Downstream heading drift | High -- breaks future mgrep | Low -- Pass 1 prevents | P1 -- structural compliance is critical |
| Self-validation unreliable (same LLM) | Medium -- hallucination validates hallucination | Medium -- inherent LLM limitation | P2 -- Q&A review is the true safety net |
| Context window pressure for generation | Medium -- output quality degrades | Medium -- large features | P2 -- chunking strategy for >15 files |
| Staleness detection advisory only | Low -- no automated guard | High -- every code change without doc-phase | P3 -- accept, future enhancement |

**Priority Key:**
- P1: Must be resolved before implementation. Blocking.
- P2: Should be resolved during implementation. Important.
- P3: Can be deferred. Nice-to-have or document-only fix.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Cold start behavior | HIGH | 05-01-PLAN.md explicitly scaffolds gate docs in wave 1; directory creation is standard |
| Section ownership model | HIGH | 05-CONTEXT.md locks [derived]/[authored] semantics with explicit rules |
| Self-validation 3-pass design | HIGH | 05-CONTEXT.md specifies exact checks per pass |
| Discovery scope limits | HIGH | 05-CONTEXT.md explicitly defines primary + one-hop + never boundaries |
| Hallucination risk | HIGH | Well-established LLM behavior; Phase 4 edge cases document same pattern for reviewers |
| Context window pressure | MEDIUM | Extrapolated from Phase 4 EC analysis; no actual doc generation measurements |
| Chunking strategy for large features | MEDIUM | 05-CONTEXT.md does not address chunking explicitly; inferred from "never full codebase scan" |
| Gate doc validation effectiveness | MEDIUM | Pass 3 design is clear, but string-matching against gate docs may miss semantic violations |
| Staleness detection utility | MEDIUM | Timestamp exists per ROADMAP.md, but no consumer is defined; advisory value only |
| Self-validation reliability | MEDIUM | Same-LLM validation has inherent limits; Q&A is the backstop, but its effectiveness depends on user diligence |
