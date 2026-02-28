## Tech Constraints Findings

**Researched:** 2026-02-28
**Dimension:** Technical limits, dependencies, compatibility issues, and feasibility boundaries for Phase 5: Documentation
**Confidence:** HIGH (sourced from existing codebase, live workflow files, Phase 2/3/4 research, CONTEXT.md locked decisions, and observed runtime behavior)

---

### Hard Constraints

- **Doc agent is role_type: executor (Sonnet), NOT judge (Opus)** -- model-profiles.md explicitly assigns "Documentation writer (Phase 5): executor: Sonnet". This is consistent with the executor/judge pattern: the doc agent does the work (reads code, writes docs), it does not judge. This means the 3-pass self-validation must work within Sonnet's reasoning capability -- no Opus-tier judgment available inside the agent. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/model-profiles.md` line 80 -- "Documentation writer (Phase 5) | executor | Sonnet"]

- **Subagents cannot spawn subagents** -- The doc agent cannot spawn child agents for individual passes or per-module doc generation. All 3 validation passes must run sequentially within a single agent context. If the doc agent needs to generate docs for 5 modules + 2 flows, all generation + all 3 validation passes happen in one 200k context window. [Source: Phase 2 TECH-CONSTRAINTS.md -- "Task calls are one level deep"; gather-synthesize.md -- all spawning done by orchestrator]

- **File-based result collection only** -- The orchestrator cannot receive the doc agent's generated content in its context. The doc agent must write all generated docs to `.documentation/` on disk. The orchestrator verifies file existence, then presents results to the user for Q&A review. [Source: Phase 2 TECH-CONSTRAINTS.md -- "Orchestrator does NOT receive the agent's full output in its context"]

- **Agent definitions are identity documents, not execution scripts** -- The doc agent definition must not contain "Step 1: read code, Step 2: generate module doc, Step 3: validate..." execution flow. The workflow controls execution order; the agent declares role/goal/success/scope. [Source: Phase 2 TECH-CONSTRAINTS.md hard constraint #9]

- **Context provided by orchestrator, not fetched by agent** -- The doc agent receives file paths, review artifacts, and FEATURE.md references in its prompt at spawn time. The agent definition must NOT say "read the review synthesis" or "find FEATURE.md" -- the orchestrator assembles this context. [Source: AGNT-02 requirement; Phase 2 TECH-CONSTRAINTS.md hard constraint #10]

- **CommonJS only** -- Any CLI tooling for doc generation (e.g., `init doc-phase`, heading validation, staleness checks) must be CommonJS `.cjs` with `require()`. [Source: Phase 2 TECH-CONSTRAINTS.md hard constraint #1]

- **Model parameter values: only "sonnet", "haiku", "inherit"** -- Doc agent spawns with `model: "sonnet"` per ROLE_MODEL_MAP[executor]. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 34-37]

- **AskUserQuestion header max 12 characters** -- The Q&A review gate for generated docs must use abbreviated headers. Pattern from review-phase: "Find 1/7". For docs: "Doc 1/3" or similar. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/references/questioning.md` line 82]

- **Q&A happens in orchestrator, not in subagent** -- The doc agent cannot interact with the user. It generates docs and writes them to disk. The doc-phase workflow (orchestrator) reads the generated docs and presents them for user Q&A review via AskUserQuestion. [Source: Phase 4 research -- "Task subagents cannot interact with the user"; review-phase.md pattern]

- **Heading templates are strict and locked** -- Module docs require exactly: `## Module: <exact_code_name>`, `## Purpose:`, `## Exports:`, `## Depends-on:`, `## Constraints:`, `## WHY:`. Flow docs require exactly: `## Flow: <capability>/<flow_name>`, `## Trigger:`, `## Input:`, `## Steps:`, `## Output:`, `## Side-effects:`, `## WHY:`. Gate docs require: `## Constraint: <scope> [manual]`, `## Glossary: <term> [manual]`, `## State: <store_name> [manual]`. These are chosen for grep consistency -- deviation breaks downstream search. [Source: 05-CONTEXT.md lines 44-46]

- **Section ownership tags are mandatory** -- Every section in generated docs must be tagged `[derived]` or `[authored]`. `[derived]` sections are regenerated from code and overwritten freely. `[authored]` sections are preserved and conflicts flagged. The doc agent parses existing docs by heading anchors before regeneration. [Source: 05-CONTEXT.md lines 73-75]

- **One-way cross-referencing only** -- Flows reference modules in Steps sections. Modules do NOT link back to flows. Flow steps reference modules by name, not individual functions. [Source: 05-CONTEXT.md lines 57-59]

- **Gate docs are validation inputs, not agent outputs** -- The doc agent reads `constraints.md`, `glossary.md`, and `state.md` in Pass 3 to check consistency. It does NOT generate gate doc content. Gate docs are `[manual]` -- human-maintained. The agent scaffolds templates with seed content, but content is human-owned. [Source: 05-CONTEXT.md lines 49-54]

### Dependency Capabilities

- **SUMMARY.md frontmatter provides file discovery** -- The `key-files` frontmatter field in SUMMARY.md files lists `created:` and `modified:` file paths per plan. The doc agent's orchestrator can parse these to determine which files were modified in the reviewed change. This is the primary discovery mechanism -- no full codebase scan needed. [Source: Summary template -- `key-files: created: [...], modified: [...]`; 04-01-SUMMARY.md lines 22-28 showing the exact format]

- **Git SHA retrieval is trivial** -- `git rev-parse --short HEAD` is already used throughout the codebase (commands.cjs line 258, execute-plan.md line 258, quick.md line 400). The `execGit(cwd, ['rev-parse', '--short', 'HEAD'])` helper in core.cjs handles this cleanly. The doc agent's orchestrator can capture this for the `built-from-code-at:` staleness field. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/commands.cjs` line 258; `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` execGit function]

- **Review artifacts are available at known paths** -- After review-phase completes, trace reports and synthesis live at `{phase_dir}/review/synthesis.md`, `{phase_dir}/review/review-decisions.md`, and individual trace files. The doc agent can read these for WHY blocks and rationale. The orchestrator passes these paths in the prompt. [Source: review-phase.md step 11 -- artifact paths listed explicitly]

- **init CLI pattern established** -- `init review-phase` and `init plan-phase` provide a proven pattern for bootstrapping workflow context. An `init doc-phase` command can follow the same shape: resolve phase info, discover files, resolve agent model, return JSON. [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs` -- cmdInitReviewPhase function at line 599]

- **Gather-synthesize pattern available but likely unnecessary** -- The doc agent is a single writer, not a parallel analysis task. Unlike review (4 parallel specialists) or research (6 parallel gatherers), documentation is inherently sequential -- you must read code, understand it, then write about it. Using gather-synthesize for doc generation would add orchestration complexity without the parallelism benefit. A single doc agent spawn is simpler and sufficient. [Source: gather-synthesize.md purpose statement -- "parallel analysis followed by consolidation"; 05-CONTEXT.md -- no mention of parallel doc generation]

- **js-yaml / frontmatter.cjs available** -- Can parse doc file frontmatter (e.g., `built-from-code-at:` SHA, `last-verified:` timestamp) using existing extractFrontmatter(). FAILSAFE_SCHEMA means all values are strings. [Source: Phase 2 TECH-CONSTRAINTS.md YAML section]

- **Grep tool available for one-hop impact discovery** -- The doc agent can use the built-in Grep tool to search existing flow docs for references to modified modules. Pattern: `grep "module_name" .documentation/flows/` to find impacted flow docs. This is the one-hop discovery mechanism from CONTEXT.md line 68. [Source: Phase 2 TECH-CONSTRAINTS.md tools section]

### Compatibility Issues

- **No doc-phase workflow exists yet** -- Unlike review-phase.md (built in Phase 4), there is no doc-phase.md workflow. Phase 5 must create both the agent definition AND the orchestration workflow. The workflow follows the same pattern as review-phase but simpler: single agent spawn, no parallel gather, Q&A review gate, then commit. [Source: Glob search for `*doc*` in workflows -- no matches]

- **No `init doc-phase` CLI command exists** -- The init module has no doc-phase handler. Phase 5 must add one to init.cjs and register it in gsd-tools.cjs. It should return: doc agent path/model, phase directory, list of modified files (from SUMMARY.md key-files), review artifact paths, feature/capability paths, git SHA. [Source: init.cjs -- no doc-phase case; gsd-tools.cjs line 554 -- doc-phase not in the available workflows list]

- **SUMMARY.md key-files may not list ALL modified files** -- The `key-files` frontmatter lists "important" files, not exhaustively all files. For complete file discovery, the orchestrator may need to supplement with `git diff --name-only` between the pre-execution and post-execution commits. This is already done in execute-plan.md (line 409). [Source: Summary template -- "key-files: created: [important files created], modified: [important files modified]" -- emphasis on "important"]

- **3-pass validation in a single Sonnet context window** -- All 3 validation passes must run within one agent's 200k context. For a large feature touching 10+ modules and 3+ flows, the agent must: (1) read all source code files, (2) generate module/flow docs, (3) run structural compliance, (4) run referential integrity checks, (5) run gate doc consistency checks. This could consume 50-100k tokens on a large feature. Sonnet can handle this, but the agent needs clear output structure to avoid losing track across passes. [First principles: Each module doc is ~300-500 tokens. Each flow doc is ~500-1000 tokens. 10 modules + 3 flows = ~8k tokens of output. Reading source files for 10 modules at ~200-500 lines each = ~30-50k tokens. Gate docs = ~2k tokens. Total context usage: ~50-70k tokens -- well within 200k.]

- **Section-level doc updates require heading parsing** -- The doc agent must parse existing `.documentation/` files by heading anchors to determine which sections are `[derived]` vs `[authored]`. This is string manipulation within the agent's capabilities (Read file, find headings, check tags). But if existing docs have inconsistent formatting (missing tags, malformed headings), the agent must handle gracefully -- flag issues rather than corrupt the file. [First principles: The first generation creates all sections with proper tags. Subsequent updates parse by heading. The failure mode is a manually-edited doc where someone removed a tag -- agent should default to treating untagged sections as `[authored]` to avoid overwriting human work.]

- **ROADMAP.md success criteria #2 mentions capability/feature organization** -- "Generated docs live in `.documentation/` organized per capability/feature." But the CONTEXT.md directory structure uses `modules/` (flat, 1:1 with code) and `flows/` (capability-grouped). These are NOT organized per capability/feature in the traditional sense. The modules directory is flat. Flows are grouped by capability name, which aligns with the requirement. The roadmap wording and the CONTEXT.md structure are compatible but not identical terminology. [Source: ROADMAP.md line 97 vs 05-CONTEXT.md lines 25-39]

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| Single doc agent (executor/Sonnet) for all generation | Viable | Doc generation is sequential -- read code, write about it. Sonnet follows structured templates well. No judgment required. The agent reads code + review artifacts, writes docs following strict templates. This is classic executor work. [Source: model-profiles.md -- "executor: Does the work: gathering, planning, executing, documenting"] |
| 3-pass self-validation within single agent context | Viable | All 3 passes are deterministic checks, not creative judgment. Pass 1 (structural): check headings exist, tags present. Pass 2 (referential): grep for module names in code. Pass 3 (gate doc consistency): compare against glossary/constraints. Each pass is a scan-and-report task. Sonnet handles structured verification well. Total context overhead for validation: ~5-10k tokens beyond generation. [First principles: validation is pattern matching, not reasoning. Sonnet excels at this.] |
| One-hop impact discovery via Grep | Viable | Agent uses Grep tool to search `.documentation/flows/` for references to modified module names. If a flow doc mentions "parser" and parser.js was modified, that flow is flagged. Output: list of impacted docs with what changed. Agent does NOT auto-rewrite -- flags only. This is a simple grep operation. [Source: 05-CONTEXT.md lines 67-69, 77-78] |
| Git SHA capture for built-from-code-at field | Viable | `execGit(cwd, ['rev-parse', '--short', 'HEAD'])` already works in the codebase. The orchestrator captures this before spawning the doc agent and passes it in the prompt. Agent writes it into doc frontmatter. Trivially implementable. [Source: core.cjs execGit; commands.cjs line 258] |
| Section-level updates (parse by heading, regenerate [derived], preserve [authored]) | Constrained | The agent must Read existing doc, identify section boundaries by heading anchors, check ownership tags, regenerate `[derived]` sections while preserving `[authored]` sections. This is string parsing within Sonnet's capability. The constraint is: if existing docs are malformed (missing tags or headings), the agent must detect this in Pass 1 and flag it rather than silently corrupting. First-generation docs don't have this problem -- only subsequent updates. [First principles: heading-based section parsing is reliable because headings are strict/fixed. The tag is the differentiation mechanism.] |
| Q&A review gate with user approval before commit | Viable | Identical pattern to review-phase.md and plan-phase.md. Orchestrator reads generated docs, presents to user via AskUserQuestion, user approves or requests changes. Pattern proven in 2 prior phases. [Source: review-phase.md steps 7-8; 05-CONTEXT.md line 84] |
| Gate doc scaffolding with universal seed content | Viable | The doc agent (or init command) creates `constraints.md`, `glossary.md`, `state.md` with the seed content from CONTEXT.md. These are write-once templates. The agent tags all entries `[manual]`. Subsequent runs read them for validation but never modify them. [Source: 05-CONTEXT.md lines 122-180 -- full seed content provided] |
| Doc agent receiving file list from SUMMARY.md key-files | Constrained | `key-files` lists "important" files, not all files. For most features this is sufficient (5-15 files). For features with many small files, supplementing with `git diff --name-only` between known commits provides completeness. The orchestrator (not the agent) should compute the merged file list. [Source: Summary template -- "important files created/modified"] |
| Large feature doc generation (20+ files) | Constrained | A 20-file feature at 300 lines average = ~90k tokens of source code. Plus agent overhead (~10k), doc output (~10k), validation passes (~5k) = ~115k tokens. Within 200k but leaves only ~85k for reasoning. The agent should use targeted Read (specific files from the file list) rather than broad scanning. For features >30 files, the orchestrator could split into batches -- module docs in one spawn, flow docs in another -- but this adds complexity. Recommend: handle >20 files as a soft limit warning, not a hard block. [First principles: 200k - 115k = 85k for reasoning is adequate for structured template-filling. This is not creative writing; it's pattern extraction.] |

### Alternatives

- **If 3-pass validation is too slow or context-heavy** -> Split validation into a separate agent spawn. Doc agent generates docs in spawn 1. Validation agent (could be Sonnet or Haiku) checks structural/referential/gate consistency in spawn 2. This doubles the agent spawns but keeps each context window leaner. Trade-off: orchestrator complexity vs per-agent context budget. -- [First principles: validation is simpler than generation. A dedicated validator could use Haiku at lower cost. But this adds orchestrator coordination that may not be justified for <10k token validation overhead.]

- **If SUMMARY.md key-files is insufficient for file discovery** -> The orchestrator can run `git diff --name-only {pre_execution_sha}..{post_execution_sha}` to get the complete list of modified files. The pre-execution SHA can be captured before the execute-phase runs, or extracted from the first task commit in SUMMARY.md. -- [Source: execute-plan.md line 408-409 -- already uses `git diff --name-only` for this purpose]

- **If section-level updates are too fragile** -> Full-file regeneration as fallback. Instead of parsing existing docs by heading, regenerate the entire file. `[authored]` sections would be lost unless the orchestrator backs them up first and re-injects after generation. This is simpler but loses human edits without explicit backup. Recommend: section-level as primary, full-regen as fallback with backup. -- [First principles: section-level is more elegant and preserves work. Full-regen is safer when parsing fails. Both should be available.]

- **If single-agent spawn can't handle very large features** -> Split into per-module and per-flow spawns. Orchestrator spawns one doc agent per module file, then one per flow. Each agent has a tiny scope (one file in, one doc out). Then a consolidation pass checks cross-references. This scales to any feature size but adds N+1 agent spawns. -- [First principles: parallelism is the standard scaling answer. But for Phase 5 MVP, single-agent is simpler and handles 90%+ of features.]

---

### Phase 5 Specific Technical Analysis

#### Doc Agent vs Reviewer Agent Pattern Differences

The doc agent follows a fundamentally different pattern from the review agents:

| Dimension | Review (Phase 4) | Documentation (Phase 5) |
|-----------|-------------------|-------------------------|
| Agent count | 4 parallel + 1 synthesizer (5 total) | 1 doc agent (no synthesizer) |
| Agent role_type | judge (Opus via inherit) | executor (Sonnet) |
| Pattern | gather-synthesize | Single spawn |
| Input | Code + requirements | Code + review findings + requirements |
| Output | Trace reports (per-requirement verdicts) | Markdown docs (per-module, per-flow) |
| Self-validation | None (synthesizer handles quality) | 3-pass self-validation within agent |
| Q&A gate | Orchestrator presents findings | Orchestrator presents generated docs |
| Orchestrator role | Spawn, collect, synthesize, present | Spawn, collect, present |

[First principles: Documentation is write-heavy, review is read-heavy. Parallelism helps review because 4 reviewers read different requirements simultaneously. Documentation doesn't benefit from parallelism because modules/flows are written sequentially from the same code understanding.]

#### Context Budget for Doc Agent

The doc agent's 200k context window must hold:

| Component | Estimated Tokens | Notes |
|-----------|-----------------|-------|
| System prompt (Claude Code runtime) | 1-3k | Unobservable, estimated |
| Tool definitions | 2-4k | Read, Write, Bash, Grep, Glob |
| Agent definition (via first-read) | ~1.5k | The doc agent .md file |
| Orchestrator prompt + context layers | 3-5k | File paths, review artifacts, feature context |
| Source code (via Read tool) | 10-100k | Variable -- agent reads files on demand |
| Review artifacts (synthesis.md) | 2-5k | WHY block source material |
| FEATURE.md (requirements/intent) | 2-5k | Intent tracing source |
| Gate docs (constraints, glossary, state) | 2-3k | Read for Pass 3 validation |
| Generated doc output (written to disk) | 3-10k | Module + flow docs |
| 3-pass validation reasoning | 5-15k | Structural + referential + consistency |
| Reasoning + working memory | 20-50k | Agent's internal processing |
| **Total used** | **50-200k** | **Fits for features up to ~20 files** |

The bottleneck is source code reading. A 5-file feature uses ~15k tokens for code, leaving 175k for everything else (comfortable). A 20-file feature uses ~60k tokens for code, leaving 130k (still comfortable). A 40-file feature uses ~120k tokens, leaving only ~70k for reasoning and output (tight but workable).

[First principles: The doc agent reads selectively via tool calls. It doesn't load all files at once -- it reads one module at a time, generates the doc, then moves to the next. This is incremental context consumption, not batch loading.]

#### 3-Pass Self-Validation Detail

Each pass is a deterministic check with structured output:

**Pass 1 -- Structural Compliance (~2k token overhead):**
- Check each generated doc for required headings (hardcoded list per doc type)
- Check every section has `[derived]` or `[authored]` tag
- Check anchors match canonical format (`## Module: exact_name` not `## module: ExactName`)
- Check `last-verified:` timestamp is present and updated
- Output: list of violations, zero tolerance (must fix before continuing)

**Pass 2 -- Referential Integrity (~3-5k token overhead):**
- For each module doc: verify listed exports actually exist in source code (Grep for function/class names)
- For each module doc: verify Depends-on references resolve to real module docs in `.documentation/modules/`
- For each flow doc: verify Step module references match `.documentation/modules/` filenames
- Output: list of hallucinated references with evidence

**Pass 3 -- Gate Doc Consistency (~2-3k token overhead):**
- Read `constraints.md`: verify no banned patterns appear in generated doc examples
- Read `glossary.md`: verify domain terms in generated docs match glossary spellings
- Read `state.md`: verify state references in module/flow docs match state.md entries
- Output: list of naming inconsistencies and constraint violations

Total validation overhead: ~7-10k tokens. This is <5% of the 200k context window. Feasibility: HIGH.

[Source: 05-CONTEXT.md lines 87-89 -- 3-pass definition; First principles: each pass is a scan-and-compare operation, not creative reasoning]

#### File Discovery Flow

The doc agent needs to know which files were modified. The flow:

```
SUMMARY.md (key-files.created + key-files.modified)
  |
  +-- Parse frontmatter with extractFrontmatter()
  |   Returns: { "key-files": { created: [...], modified: [...] } }
  |
  +-- Supplement with git diff (optional)
  |   execGit(cwd, ['diff', '--name-only', pre_sha + '..' + post_sha])
  |
  +-- Merge and deduplicate file lists
  |
  +-- Pass merged list to doc agent in prompt
  |
  +-- Doc agent reads each file via Read tool
  |   Generates module doc per .js/.cjs/.ts file
  |   Generates flow doc per capability
  |
  +-- One-hop impact discovery:
      Agent greps .documentation/flows/ for module names
      Flags impacted flow docs (does NOT auto-rewrite)
```

**Key constraint:** The orchestrator does the file discovery (parsing SUMMARY.md, running git diff). The agent receives the file list -- it does not discover files itself (AGNT-02 compliance).

[Source: 05-CONTEXT.md lines 66-69 (discovery scope); summary template key-files section; AGNT-02 requirement]

#### Gate Doc Scaffolding Timing

Gate docs (`constraints.md`, `glossary.md`, `state.md`) must exist BEFORE the doc agent runs Pass 3 validation. Two options:

1. **Scaffold in init doc-phase** -- The CLI command creates `.documentation/gate/` with seed content from CONTEXT.md on first run. Subsequent runs skip if files exist.
2. **Scaffold in doc-phase workflow** -- The workflow checks for gate docs before spawning the agent, creates them if missing.

Option 1 is cleaner (single responsibility -- init handles setup, workflow handles execution). The init pattern is already established in init review-phase.

[Source: 05-CONTEXT.md lines 40-41 -- "scaffolded by agent, human-maintained content"; lines 122-180 -- seed content]

#### Doc-Phase Workflow Shape

Based on existing workflow patterns (review-phase.md, plan-phase.md), the doc-phase workflow should follow:

```
Orchestrator
  |
  +-- Init: node gsd-tools.cjs init doc-phase {PHASE}
  |     Returns: doc_agent_path, phase_dir, modified_files[],
  |              review_artifact_paths, feature_paths,
  |              git_sha, gate_doc_status
  |
  +-- Scaffold gate docs if missing
  |
  +-- Context Assembly (Layers 1-3, no Layer 4 framing)
  |
  +-- Spawn doc agent (single Task, model: "sonnet")
  |     Prompt includes: file list, review paths, feature paths,
  |                      git SHA, gate doc paths
  |     Agent writes to: .documentation/modules/, .documentation/flows/
  |     Agent writes to: {phase_dir}/doc-report.md (impact flags, validation results)
  |
  +-- Check output files exist
  |
  +-- Read doc-report.md for validation results and impact flags
  |
  +-- Present generated docs for Q&A review (AskUserQuestion)
  |     One doc at a time, user approves or requests changes
  |     Header: "Doc N/T" (within 12 chars)
  |
  +-- If changes requested: re-spawn doc agent with feedback
  |     (Simpler than review's re-review loop -- just regenerate)
  |
  +-- Commit approved docs
  |
  +-- Display completion banner
```

This is simpler than review-phase because there's one agent spawn (not 5) and no synthesizer. The Q&A loop is also simpler -- approve/reject per doc, not 5 response options.

[First principles: doc-phase pattern is closer to plan-phase (one agent, Q&A loop) than review-phase (parallel agents, synthesis, re-review cycles)]

---

### Sources

- `/Users/philliphall/get-shit-done-pe/.planning/phases/05-documentation/05-CONTEXT.md` -- All locked implementation decisions for Phase 5
- `/Users/philliphall/get-shit-done-pe/.planning/REQUIREMENTS.md` -- DOCS-01 through DOCS-03 requirement definitions
- `/Users/philliphall/get-shit-done-pe/.planning/ROADMAP.md` -- Phase 5 success criteria and dependencies
- `/Users/philliphall/get-shit-done-pe/.planning/phases/02-agent-framework/research/TECH-CONSTRAINTS.md` -- Agent SDK constraints, parallel spawning, context windows, model values
- `/Users/philliphall/get-shit-done-pe/.planning/phases/04-review-layer/research/tech-constraints-findings.md` -- Review-layer constraints (reference format)
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` -- Reusable pattern (applicable but likely unnecessary for docs)
- `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review-phase.md` -- Review workflow pattern (doc workflow predecessor)
- `/Users/philliphall/get-shit-done-pe/get-shit-done/references/model-profiles.md` -- Role-based model resolution, doc writer as executor
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` -- ROLE_MODEL_MAP, execGit, resolveModelFromRole
- `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/init.cjs` -- init review-phase pattern for init doc-phase
- `/Users/philliphall/get-shit-done-pe/get-shit-done/templates/summary.md` -- SUMMARY.md key-files format for file discovery
- `/Users/philliphall/get-shit-done-pe/.planning/phases/04-review-layer/04-01-SUMMARY.md` -- key-files frontmatter example
- `/Users/philliphall/get-shit-done-pe/.planning/STATE.md` -- Current project state and decisions
