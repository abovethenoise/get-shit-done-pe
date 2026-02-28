# Existing System Findings: Phase 4 Review Layer

**Researched:** 2026-02-28
**Confidence:** HIGH -- direct source inspection of all referenced files
**Dimension:** Existing System (what works, what constrains, what can be reused)

---

## Relevant Implementations

- **Gather-synthesize workflow** -- `get-shit-done/workflows/gather-synthesize.md` (full file). Parameterized orchestration pattern already designed for review reuse. Accepts `gatherers[]` array (agent_path, dimension_name, output_path), `synthesizer` object, `context` payload, and `subject` string. The `<reuse_examples>` section explicitly calls out review with "Gatherers: Correctness, Completeness, Security, Performance (4 agents)" -- though CONTEXT.md redefines the 4 reviewers as end-user, functional, technical, code quality.

- **v2 research agent definitions (6 gatherers)** -- `agents/gsd-research-*.md`. Each follows the v2 goal-driven schema: ~1,500 tokens, YAML frontmatter with `role_type: executor`, reads/writes declarations, goal, success criteria, scope, tool guidance, citation requirement, output format. These are the template for reviewer agent definitions. [Source: `agents/gsd-research-system.md`, `agents/gsd-research-synthesizer.md`]

- **Research synthesizer** -- `agents/gsd-research-synthesizer.md` (`role_type: judge`). Produces 5 exact-named sections: Consensus, Conflicts, Gaps, Constraints Discovered, Recommended Scope. Quality gate: gatherer output missing or < 50 words = failed; abort if > 3 of 6 fail. The review synthesizer needs a different output structure (trace reports, severity, conflicts section) but the agent skeleton is directly reusable.

- **Plan-phase Q&A presentation pattern** -- `get-shit-done/workflows/plan-phase.md` step 9.5 (lines 346-377). Findings presented one-at-a-time with 3 response options (Accept / Provide feedback / Research guidance). This is the closest existing pattern to REVW-08's "findings presented to user for decision." Phase 4 extends to 5 options per CONTEXT.md.

- **ROLE_MODEL_MAP** -- `get-shit-done/bin/lib/core.cjs:34-37`. Two-entry dispatch: `executor: 'sonnet'`, `judge: 'inherit'`. Reviewers are executors (Sonnet), synthesizer is judge (Opus/inherit). Already implemented and working.

- **Review template** -- `get-shit-done/templates/review.md`. Existing v1 template with YAML frontmatter (`type: review`, `feature`, `capability`, `status`, `verdict`), per-requirement trace section with verdict/evidence/gap analysis/fix scope, and reviewer notes sections (Domain, Code, Integration). Structure needs updating: v1 uses PASS/PARTIAL/FAIL/BLOCKED verdicts; CONTEXT.md specifies met/not met/regression.

- **Plan-validate CLI** -- `get-shit-done/bin/lib/plan-validate.cjs` (`parsePlanTasks`, `parseReqSource`). Parses PLAN.md task XML to extract `<reqs>` references and parses REQUIREMENTS.md/FEATURE.md for valid REQ IDs. Reviewers need to trace executed work back to these same REQ IDs -- the parsing functions are directly reusable for extracting what REQs a task was supposed to address.

- **Verifier agent** -- `agents/gsd-verifier.md`. Goal-backward verification of phase goals against codebase. Uses 3-level artifact verification (exists, substantive, wired), key link verification, requirements coverage check, anti-pattern scanning. This is the *phase-level* verifier. Review agents (Phase 4) operate at *feature-level* per-requirement granularity -- different scope but shared verification primitives.

- **gsd-tools init pattern** -- `get-shit-done/bin/gsd-tools.cjs` (lines 510-551). Each workflow has a dedicated `init` subcommand (`init plan-phase`, `init execute-phase`) that returns JSON context (model assignments, file paths, workflow flags). Phase 4 will need `init review-phase` to resolve reviewer/synthesizer models, locate feature artifacts, and check config flags.

- **Frontmatter CRUD** -- `get-shit-done/bin/lib/frontmatter.cjs`. `extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter` for parsing/updating YAML frontmatter in markdown files. Review output files (REVIEW.md) use frontmatter for verdict, status, reviewer data. These functions handle all read/write operations.

## Constraints

- **Agent token budget: ~1,500 tokens max** -- `04-CONTEXT.md` decision. All 4 reviewer agents + synthesizer must fit within this budget. Research agents (`agents/gsd-research-*.md`) demonstrate this is achievable -- they are lean identity documents with role/goal/success criteria/scope/output format. [Constrains: agent definition size; no embedded templates or encyclopedic content]

- **Gather-synthesize workflow is a markdown pattern, not code** -- `get-shit-done/workflows/gather-synthesize.md`. The workflow describes steps for an AI orchestrator to follow. There is no executable code abstraction. Phase 4 cannot "call" gather-synthesize programmatically -- it must follow the pattern in its own review-phase workflow. [Source: `02-CONTEXT.md` decision: "Gather-synthesize is a workflow pattern, not code"]

- **Verdict scale: met / not met / regression only** -- `04-CONTEXT.md` decision. No "partially met." This is a hard constraint on reviewer output format. The existing review template (`templates/review.md`) uses PASS/PARTIAL/FAIL/BLOCKED -- must be updated. [Constrains: review template schema and reviewer agent output format]

- **Reviewers do NOT assign severity** -- `04-CONTEXT.md` decision. Verdicts only. Synthesizer assigns severity (blocker/major/minor) after seeing all 4 reports. This is a structural constraint on the reviewer-synthesizer interface: reviewer outputs contain verdicts + evidence; severity is synthesizer-only. [Constrains: reviewer output schema, synthesizer input expectations]

- **One-at-a-time presentation with 5 options** -- `04-CONTEXT.md` decision. Accept / Accept w/ Edit / Research / Defer / Dismiss. The plan-phase Q&A pattern (step 9.5) uses 3 options. Phase 4 extends this to 5. The "Accept" or "Accept w/ Edit" options trigger re-review (max 2 cycles). [Constrains: review-phase workflow UX and re-review loop design]

- **Max 2 re-review cycles** -- `04-CONTEXT.md` decision. After fixes applied from accepted findings, affected areas get re-reviewed. Max 2 rounds, then surface remaining issues for manual resolution. [Constrains: review-phase workflow loop logic]

- **Framing-specific review prompts injected by workflow, not baked into agents** -- `04-CONTEXT.md` decision. Reviewer agents stay lean (~1,500 tokens). The review-phase workflow injects framing-aware question sets from `get-shit-done/framings/{framing}/reviewer-questions.md`. These framing files don't exist yet (Phase 6 scope) but the injection point must be designed now. [Constrains: agent definitions must not contain framing-specific logic]

- **Cross-layer check exemption** -- `STATE.md` decision from Phase 3. Project-level IDs (PLAN-xx, REQS-xx) are exempt from EU/FN/TC layer rules. Only EU/FN/TC are layered. Reviewers must respect this when tracing requirements. [Source: `plan-validate.cjs:75-78` `getLayerPrefix` function]

## Reuse Opportunities

- **Gather-synthesize.md -- direct reuse as review orchestration pattern** -- `get-shit-done/workflows/gather-synthesize.md`. The workflow is explicitly parameterized for this. Review-phase workflow passes 4 reviewer agents as `gatherers[]` and review synthesizer as `synthesizer`. Context assembly (Layers 0-4) and failure handling (retry once, abort if >50% fail) work unchanged. The abort threshold maps well: 2 of 4 reviewers failing = 50% = abort synthesis.

- **v2 agent definition skeleton -- reuse as reviewer template** -- `agents/gsd-research-system.md` (or any research gatherer). Same structure: YAML frontmatter (`name`, `description`, `tools`, `role_type: executor`, `reads`, `writes`), then Role/Goal/Success Criteria/Scope/Tool Guidance/Citation Requirement/Output Format sections. Reviewer agents follow identical structure with different content.

- **Research synthesizer skeleton -- reuse as review synthesizer template** -- `agents/gsd-research-synthesizer.md`. Same structure but `role_type: judge`. Quality filtering, manifest handling, section headings (exact strings for downstream reference). Review synthesizer changes the output sections but preserves the pattern.

- **Plan-phase Q&A loop -- extend for review presentation** -- `get-shit-done/workflows/plan-phase.md` step 9.5. The one-at-a-time finding presentation with user response options is the base pattern. Phase 4 adds 2 more response options (Accept w/ Edit, Defer) and adds re-review cycling. The loop structure (present finding -> get response -> mark resolved or queue revision) is reusable.

- **parseReqSource and parsePlanTasks -- reuse for requirement tracing** -- `get-shit-done/bin/lib/plan-validate.cjs` (`parseReqSource` function, `parsePlanTasks` function). Reviewers need to map executed code back to REQ IDs. `parseReqSource` extracts all valid REQ IDs from FEATURE.md/REQUIREMENTS.md. `parsePlanTasks` extracts which REQs each plan task claimed to address. Both are exported and callable.

- **gsd-tools verify commands -- reuse for reviewer evidence gathering** -- `get-shit-done/bin/gsd-tools.cjs` (`verify artifacts`, `verify key-links`, `verify commits`, `verify plan-structure`). Reviewers can invoke these CLI tools to gather evidence for their verdicts. The technical reviewer benefits most from `verify artifacts` and `verify key-links`. The code quality reviewer benefits from `verify plan-structure`.

- **FRONTMATTER_SCHEMAS -- extend for review output** -- `get-shit-done/bin/lib/frontmatter.cjs` (`FRONTMATTER_SCHEMAS`). Existing schemas for `plan`, `summary`, `verification`. Phase 4 adds a `review` schema for validating REVIEW.md frontmatter (verdict, reviewer traces, severity assignments).

- **Context layering system** -- `get-shit-done/workflows/gather-synthesize.md` step 1. Layer 0-4 context assembly already documented. Review agents receive the same layered context as research agents. No new context machinery needed.

- **Structured return headers** -- pattern across all agents (`## RESEARCH COMPLETE`, `## VERIFICATION PASSED`, `## ISSUES FOUND`). Review agents and synthesizer should follow this: `## REVIEW COMPLETE`, `## SYNTHESIS COMPLETE`. Orchestrator pattern-matches on headers for routing.

## Integration Points

- **review-phase workflow must plug into execute-phase workflow** -- `get-shit-done/workflows/execute-phase.md` step `verify_phase_goal`. Currently spawns `gsd-verifier`. Phase 4 adds review as a separate step AFTER execution, BEFORE phase verification. The review-phase workflow is a new command (`/gsd:review-phase`) invoked between execute-phase and verify-phase. [Integration: new workflow + command definition]

- **Review output consumed by documentation agent (Phase 5)** -- `ROADMAP.md` Phase 5 description. The docs agent reads actual built code "after review acceptance." REVIEW.md's verdict and accepted findings feed into what the documentation agent considers "accepted state." The review output format must be machine-readable enough for Phase 5 consumption.

- **REQUIREMENTS.md traceability table** -- `.planning/REQUIREMENTS.md` (lines 107-157). Traceability maps every REQ ID through plan -> execution -> review -> documentation. Phase 4 fills the "review" column. This requires updating the traceability table after review completes -- likely via `gsd-tools requirements` commands.

- **Config flags for review workflow** -- `get-shit-done/bin/lib/core.cjs` (`loadConfig`). Phase 4 likely needs config flags analogous to `research: true`, `plan_checker: true` -- e.g., `reviewer: true`, `review_synthesizer: true`. These go in `.planning/config.json` and are read by `init review-phase`.

- **MODEL_PROFILES needs reviewer entries** -- `get-shit-done/bin/lib/core.cjs:18-30`. v1 MODEL_PROFILES maps agent names to quality/balanced/budget tiers. v2 agents use ROLE_MODEL_MAP instead (executor/judge). New reviewer agents need `role_type: executor` in their frontmatter; synthesizer needs `role_type: judge`. The `resolveModelFromRole` function in `core.cjs:378-405` handles this -- no code changes needed, just correct frontmatter in new agent definitions.

## Undocumented Assumptions

- **Gather-synthesize reuse examples use different reviewer names** -- `get-shit-done/workflows/gather-synthesize.md:203-205`. Lists "Correctness, Completeness, Security, Performance" as review gatherers, but CONTEXT.md specifies "end-user, functional, technical, code quality." The workflow's reuse example is illustrative, not prescriptive -- but downstream consumers reading gather-synthesize.md may be confused by the mismatch.

- **Review template assumes per-feature scope** -- `get-shit-done/templates/review.md:2-4`. Frontmatter has `feature: "{slug}"` and `capability: "{slug}"`. But the ROADMAP Phase 4 description talks about reviewing "executed work" at the phase level, and CONTEXT.md discusses per-requirement verdicts without specifying whether review is per-feature or per-phase. The v2 review template scope needs explicit definition.

- **Plan-phase Q&A loop assumes findings are sequentially resolvable** -- `get-shit-done/workflows/plan-phase.md` step 9.5. Each finding is presented, user responds, finding is marked resolved or queued for revision. Review findings may have dependencies (finding A's resolution changes finding B's verdict). The one-at-a-time pattern works for independent findings but CONTEXT.md's "overlapping findings from different reviewers presented separately" suggests cross-reviewer dependencies exist.

- **No existing command for `gsd review-phase`** -- `commands/gsd/` directory has `plan-phase.md`, `execute-phase.md`, `discuss-phase.md` but no review command. The review-phase command and workflow are entirely new artifacts. However, the structural pattern for creating them is well-established: command .md file references workflow .md file, workflow contains step-by-step process with init/spawn/handle-return/present/commit pattern.

- **Synthesizer section headings are exact strings for downstream reference** -- `agents/gsd-research-synthesizer.md` decision from Phase 2. Research synthesizer outputs exactly 5 sections (Consensus, Conflicts, Gaps, Constraints Discovered, Recommended Scope). Review synthesizer needs its own exact section headings. Downstream agents (documentation, workflow routing) will reference these by name.

- **gsd-tools `init` assumes one workflow type per init** -- `get-shit-done/bin/gsd-tools.cjs:510-551`. Each `init` subcommand is a dedicated switch case. Adding `init review-phase` requires a new case in the switch statement that returns reviewer models, feature/capability paths, review config flags, and phase artifact locations. The pattern is: read config, resolve models, find phase directory, check existing artifacts, return JSON.

---

## Requirement Coverage Map

How existing system components map to each REVW requirement:

| REQ | What It Needs | What Exists | Gap |
|-----|--------------|-------------|-----|
| REVW-01 | 4 parallel specialist reviewers | gather-synthesize.md handles parallel spawning; no reviewer agent definitions exist | Agent definitions (4 new .md files) |
| REVW-02 | Trace report per reviewer: verdict + evidence | review.md template exists but uses wrong verdict scale (PASS/PARTIAL/FAIL vs met/not met/regression) | Updated template + output format spec |
| REVW-03 | End-user reviewer traces story + acceptance | No agent definition | New agent: gsd-review-enduser.md |
| REVW-04 | Functional reviewer traces behavior specs | No agent definition | New agent: gsd-review-functional.md |
| REVW-05 | Technical reviewer traces implementation specs | No agent definition; gsd-verifier is closest but phase-level not feature-level | New agent: gsd-review-technical.md |
| REVW-06 | Code quality reviewer: DRY/KISS/bloat/obsolete | No agent definition; anti-pattern scan in gsd-verifier is closest | New agent: gsd-review-quality.md |
| REVW-07 | Synthesizer consolidates with priority ordering | gsd-research-synthesizer skeleton reusable; priority ordering (user > functional > technical > quality) is new | New agent: gsd-review-synthesizer.md |
| REVW-08 | User presentation of recommendations | plan-phase Q&A pattern (step 9.5) is base; needs 5 options + re-review cycling | New workflow: review-phase.md + command |

---

*Researched: 2026-02-28*
*Agent: gsd-research-system*
*Confidence: HIGH -- all findings sourced from direct file inspection*
