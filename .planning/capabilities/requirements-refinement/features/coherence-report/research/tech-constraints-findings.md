## Tech Constraints Findings

### Hard Constraints

- **Zero runtime dependencies** -- All code must use Node.js stdlib only (fs, path, os) + vendored js-yaml 4.1.1. No external NLP, templating, or analysis libraries. -- source: `package.json` (no `dependencies` block), `.planning/PROJECT.md:77`

- **Claude Code model resolution: no direct "opus" specification** -- The `ROLE_MODEL_MAP` maps `judge` role to `"inherit"`, which inherits the user's session model (Opus). TC-01 specifies "model: inherit (opus-level reasoning needed)" -- this maps correctly to `role_type: judge` in the agent frontmatter. Cannot request Opus explicitly; must use `inherit`. -- source: `get-shit-done/bin/lib/core.cjs:18-22`, `get-shit-done/references/model-profile-resolution.md:7-14`

- **refinement-write is the only disk write path** -- TC-01 mandates "orchestrator handles disk write" and the agent outputs content only. The `refinement-write --type recommendations --content-file <path>` route is the designated write mechanism. This route does not yet exist (Wave 1 plans not executed). -- source: `refinement-artifact/01-PLAN.md:100-113` (planned, type `recommendations` included in valid types)

- **Agent must receive contents, not paths** -- TC-01 states "Agent receives: all scan artifacts + project context files (contents, not paths)" and "No file I/O in agent." This means the orchestrator must load all files and inject them into the Task prompt. -- source: `coherence-report/FEATURE.md:106-109`

- **Single Claude invocation** -- FN-02 mandates single-pass synthesis: "Single Claude invocation synthesizes the full report." No staged pipeline, no iterative refinement within this feature. -- source: `coherence-report/FEATURE.md:69`

- **Claude Code subagent context window: ~200K tokens (~800KB text)** -- The synthesis agent receives everything in one prompt. Total context must fit. -- [First principles: 200K tokens at ~4 chars/token = ~800KB]

### Dependency Capabilities

- **refinement-write --type recommendations**: Planned in `refinement-artifact/01-PLAN.md`. Writes content to `.planning/refinement/RECOMMENDATIONS.md`. Accepts `--content-file <path>` pointing to a tmpfile containing the agent's output. This is the coherence-report's only write mechanism. NOT YET BUILT -- depends on Wave 1 execution of refinement-artifact Plan 01. -- source: `refinement-artifact/01-PLAN.md:100-113`

- **Upstream scan artifacts (landscape-scan output)**: The coherence-report reads `matrix.md`, `dependency-graph.md`, and `findings/FINDING-*.md` from `.planning/refinement/`. These are written by the landscape-scan workflow (Plan 02, Stage 5). Also NOT YET BUILT. Contract is stable (defined in both landscape-scan and refinement-artifact plans). -- source: `landscape-scan/02-PLAN.md:83-84`, `refinement-artifact/02-PLAN.md:72-80`

- **gather-synthesize.md orchestration pattern**: Reusable pattern for spawning agents with context injection. Coherence-report uses a single-agent spawn (not gather/synthesize), but the Task() syntax, context payload XML format, and model resolution are directly reusable. -- source: `get-shit-done/workflows/gather-synthesize.md:72-87`

- **core.cjs output() with @file: fallback**: If the synthesis agent's output exceeds 50KB as JSON, the tmpfile pattern triggers. RECOMMENDATIONS.md content may exceed this for projects with many findings. The orchestrator must handle `@file:` responses when reading agent output. -- source: `get-shit-done/bin/lib/core.cjs:26-42`

- **core.cjs safeReadFile()**: Available for reading scan artifacts. Returns file contents or empty string if missing. -- source: `get-shit-done/bin/lib/core.cjs:49-50` (function exists in core.cjs)

- **frontmatter.cjs extractFrontmatter()**: Needed if finding cards use YAML frontmatter (they do per the scan-pair agent template spec). Parses with FAILSAFE_SCHEMA. -- source: `get-shit-done/bin/lib/frontmatter.cjs:14-31`

### Compatibility Issues

- **Wave 1 execution dependency** -- Both `refinement-write` and `scan.cjs` routes are planned but unbuilt. coherence-report cannot be executed until:
  1. refinement-artifact Plan 01 executes (creates `refinement-write` route)
  2. landscape-scan Plans 01+02 execute (creates scan artifacts)
  This is a sequencing dependency, not a blocker to planning. -- source: `refinement-artifact/01-PLAN.md`, `landscape-scan/01-PLAN.md`, `landscape-scan/02-PLAN.md`

- **Context size budget for synthesis prompt** -- Measured sizes for the current 8-capability project:
  - PROJECT.md + STATE.md + ROADMAP.md: ~29KB
  - All CAPABILITY.md files (8 caps): ~16KB
  - matrix.md: estimated ~2-5KB (8x8 grid)
  - dependency-graph.md: estimated ~2-5KB
  - Finding cards: variable. At 28 pairs with 0-5 findings each, worst case ~140 findings x ~500 bytes = ~70KB. Realistic case ~20-40 findings x ~500 bytes = ~10-20KB
  - Agent definition file: ~2-3KB
  - **Total estimated: ~60-120KB** for current project. Well within the ~800KB context window (~7-15% utilization).
  - For a 20-cap project: ~190 pairs, potentially 200+ findings = ~100-150KB findings alone. Total ~150-220KB. Still viable (~20-27%).
  - [First principles: measured PROJECT.md=6.2KB, STATE.md=13.3KB, ROADMAP.md=9.9KB, CAPABILITY.md total=15.8KB; findings estimated from landscape-scan research]

- **RECOMMENDATIONS.md output size vs refinement-write content-file path** -- The synthesis agent outputs RECOMMENDATIONS.md content (6 sections + Q&A agenda). For a project with 20+ findings, this could be 10-30KB. The orchestrator captures agent output, writes to tmpfile, then calls `refinement-write --type recommendations --content-file <tmpfile>`. No size blocker here. -- [First principles: markdown output bounded by finding count; 30KB is well within fs limits]

- **Q&A agenda section format contract with refinement-qa** -- refinement-qa (FN-01) reads RECOMMENDATIONS.md and parses the Q&A agenda section. The format of this section is defined in coherence-report (FN-03) but consumed by refinement-qa (FN-01). This is an implicit contract -- no schema or parser exists yet. Both features must agree on the section structure: item categories (decision/informational/auto-resolvable), item fields (what to discuss, recommended resolution, confidence level). -- source: `coherence-report/FEATURE.md:86-91`, `refinement-qa/FEATURE.md:69-73`

- **Zero-findings edge case** -- FN-02 specifies "Zero findings: write clean bill of health." The orchestrator must detect an empty `findings/` directory before spawning the synthesis agent and adjust the prompt accordingly. The agent still runs (produces a coherence assessment) but the prompt context changes significantly. -- source: `coherence-report/FEATURE.md:76`

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| Dedicated agent file (gsd-coherence-synthesizer.md) | viable | Follows existing agent pattern (17 agents already exist with YAML frontmatter + role sections). role_type=judge maps to model=inherit (Opus). -- source: `agents/gsd-research-synthesizer.md` pattern, `core.cjs:18-22` |
| Single-pass synthesis via one Task() call | viable | Context budget ~60-120KB for current project, well within 800KB window. Agent receives all context in prompt, outputs RECOMMENDATIONS.md content. Matches how gather-synthesize spawns its synthesizer. -- source: measured file sizes, `gather-synthesize.md:145-173` |
| Orchestrator loads all files + passes as XML blocks | viable | Same pattern used by framing-pipeline.md research stage. XML block injection (`<core_context>`, `<scan_artifacts>`, etc.) is proven. -- source: `framing-pipeline.md:89-103` |
| Write via refinement-write --type recommendations | viable (pending Wave 1) | Route is planned with `recommendations` type included. Orchestrator writes agent output to tmpfile, calls CLI route. Standard pattern. -- source: `refinement-artifact/01-PLAN.md:102,111` |
| Categorical goal alignment (blocks/risks/irrelevant) | viable | Pure reasoning task for the agent. No computation needed -- agent reads PROJECT.md requirements and classifies each root cause. -- [First principles: classification is within LLM capabilities; no external tooling needed] |
| New workflow file for coherence-report orchestrator | viable | Could be standalone `workflows/coherence-report.md` or a stage within a larger refinement orchestrator workflow. Both patterns exist (standalone: `discuss-capability.md`; stage-in-pipeline: research stage in `framing-pipeline.md`). Decision is architectural, not constrained. -- source: `get-shit-done/workflows/` directory |
| Embedded Q&A agenda in RECOMMENDATIONS.md | viable | Single artifact design. refinement-qa parses the final section. No separate file needed. Risk: parsing the section boundary requires a stable heading convention (e.g., `## Q&A Agenda`). -- source: `coherence-report/FEATURE.md:82-91` |
| Context scaling to 50+ cap projects | constrained | At 50 caps (1225 pairs), finding count could reach 500+. Finding cards alone: ~250KB. Total context could approach 400-500KB. Still within 800KB window but leaves limited headroom for agent reasoning. May need finding summarization for very large projects. -- [First principles: 500 findings x 500 bytes = 250KB; total with project context ~350-500KB] |

### Alternatives

- **Wave 1 not yet executed (refinement-write missing)** -> Plan coherence-report implementation assuming the refinement-write route will exist per its spec. Implementation is sequenced after Wave 1 in the capability feature table. No alternative needed -- this is a build-order dependency, not a design blocker. -- source: `CAPABILITY.md` feature table (coherence-report depends on landscape-scan)

- **Context too large for 50+ cap projects** -> Summarize finding cards before passing to synthesis agent. Pass finding frontmatter (id, type, severity, summary line) instead of full cards. Full cards can be loaded on-demand if the agent needs deeper context for specific findings. -- [First principles: frontmatter-only reduces per-finding size from ~500 bytes to ~150 bytes, cutting finding context by 70%]

- **Q&A agenda format contract fragile (no schema)** -> Define the Q&A agenda section format explicitly in the agent prompt (heading, markdown table columns, item categories). refinement-qa parses against the same known structure. Alternative: write Q&A agenda as a separate file (`.planning/refinement/QA-AGENDA.md`) with strict format. Decision in coherence-report spec already chose embedded format. -- source: `coherence-report/FEATURE.md:134` (decision: "Q&A agenda embedded in RECOMMENDATIONS.md as final section")

- **Orchestrator workflow location unclear** -> Two viable options: (a) standalone `workflows/coherence-report.md` triggered by a future refinement orchestrator, or (b) inline stage in a `workflows/refinement.md` master workflow. Option (a) is more modular and testable independently. Option (b) reduces file count. Either works -- no technical constraint differentiates them. -- [First principles: workflow files are prompt documents, not compiled code; splitting or merging is a organizational choice]
