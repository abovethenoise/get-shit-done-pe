## Existing System Findings

### Relevant Implementations

- **gather-synthesize pattern** is the existing parallel-agents-then-consolidator workflow. Coherence-report's single-pass synthesis is simpler (no parallel gatherers, just one agent), but the context assembly pattern (Layers 1-4 in XML blocks) and the "agent receives contents not paths" convention apply directly. -- `get-shit-done/workflows/gather-synthesize.md:50-68` (context payload format)

- **gsd-research-synthesizer agent** consolidates 6 research outputs into one RESEARCH.md with consensus/conflicts/gaps/constraints/recommendations. Structurally analogous to coherence-report's synthesis: multiple finding inputs -> single prioritized recommendations output. The quality gate pattern (check each input, abort if too many fail) is reusable for validating scan artifacts before synthesis. -- `agents/gsd-research-synthesizer.md:36-57`

- **landscape-scan Plan 02 defines the consumer contract** for coherence-report's inputs. Three files at `.planning/refinement/`: `matrix.md` (relationship matrix), `dependency-graph.md` (dependency table), and `findings/FINDING-{NNN}.md` (individual cards with YAML frontmatter). The finding card schema includes: id, type, severity, confidence, affected_capabilities, doc_sources, summary, recommendation, root_cause. -- `.planning/capabilities/requirements-refinement/features/landscape-scan/02-PLAN.md:73-84`

- **landscape-scan outputs do not yet exist** -- scan.cjs, landscape-scan.md workflow, and gsd-scan-pair.md template are all planned but not implemented. Coherence-report planning can proceed against the specified contracts, but testing will require either stub data or landscape-scan to be built first. -- verified via `ls` on `get-shit-done/bin/lib/scan.cjs`, `get-shit-done/workflows/landscape-scan.md`, `get-shit-done/templates/gsd-scan-pair.md` (all missing)

- **`safeReadFile(filePath)`** reads a file or returns null on error. Reusable for the orchestrator to load scan artifacts with graceful missing-file handling. -- `get-shit-done/bin/lib/core.cjs:51-57`

- **`extractFrontmatter(content)`** parses YAML frontmatter from markdown using js-yaml FAILSAFE_SCHEMA. Needed to parse finding card metadata (type, severity, root_cause) from FINDING-*.md files during context loading (FN-01). -- `get-shit-done/bin/lib/frontmatter.cjs:14-31`

- **`cmdCapabilityList`** returns all capability slugs with status and feature count. Useful for FN-01's requirement to load all capability files for reference. -- `get-shit-done/bin/lib/capability.cjs:49-84`

- **`listAllFeaturesInternal(cwd, capSlug)`** enumerates all features under a capability. Can enumerate all features across all capabilities for comprehensive context loading. -- `get-shit-done/bin/lib/core.cjs:476-500`

- **Agent frontmatter convention** uses `role_type` to determine model: `executor` -> sonnet, `judge` -> inherit (opus), `quick` -> haiku. TC-01 specifies the coherence synthesizer needs opus-level reasoning, so `role_type: judge` is required. -- `get-shit-done/bin/lib/core.cjs:18-22` (`ROLE_MODEL_MAP`)

- **gsd-doc-writer agent** demonstrates the dual-mode agent pattern (explorer/synthesizer selected by task_context). Coherence-report's agent is single-mode (synthesizer only), so this pattern is informational but not directly applicable. -- `agents/gsd-doc-writer.md:10-15`

### Constraints

- **50KB Bash buffer limit** -- `output()` in core.cjs writes JSON to a tmpfile when it exceeds 50KB, returning `@file:<path>`. The coherence-report orchestrator must handle this prefix when calling any CLI route that returns loaded file contents. The context bundle for synthesis (all findings + matrix + dependency-graph + all CAPABILITY.md files) will likely exceed 50KB for any non-trivial project. -- `get-shit-done/bin/lib/core.cjs:31-39`

- **Agents receive contents not paths** -- established pattern across gather-synthesize and landscape-scan. The coherence synthesizer agent (TC-01) must receive all scan artifacts + project context as injected content, not file paths. This means the orchestrator must read and assemble everything before spawning the agent. -- `get-shit-done/workflows/gather-synthesize.md:26-68`, coherence-report FEATURE.md TC-01 lines 106-109

- **Single output() call per CLI invocation** -- `output()` calls `process.exit(0)`, so a CLI route can only return one result. If a new CLI route is created for context loading (FN-01), it must bundle all loaded content into a single JSON payload. -- `get-shit-done/bin/lib/core.cjs:26-42`

- **CommonJS module system** -- all lib files use `require()`/`module.exports` with `.cjs` extension. Any new module for coherence-report must follow this pattern. -- `get-shit-done/bin/lib/*.cjs`

- **Zero runtime dependencies** -- only js-yaml is available. No templating engine, no markdown AST parser. RECOMMENDATIONS.md must be assembled via string concatenation in the agent or orchestrator. -- `package.json` (no runtime deps beyond js-yaml)

- **`.planning/refinement/` directory does not exist yet** -- no code currently reads from or writes to this path. It is greenfield. The orchestrator must create it (or rely on landscape-scan having created it). -- [First principles: grep for "refinement" in all lib modules returns zero hits in code files, confirmed by refinement-artifact existing-system-findings.md]

### Reuse Opportunities

- **Context assembly XML block pattern** from gather-synthesize.md -- the `<core_context>`, `<capability_context>`, `<feature_context>` XML wrapping convention is directly reusable for injecting project context into the synthesis agent. Add a `<scan_artifacts>` block for the landscape-scan outputs. -- `get-shit-done/workflows/gather-synthesize.md:52-68`

- **Research synthesizer's quality gate pattern** -- check each input, count failures, abort if threshold exceeded. Reusable for validating that required scan artifacts (matrix.md, findings/) exist before synthesis. -- `agents/gsd-research-synthesizer.md:36-57`

- **`safeReadFile()`** -- for loading all scan artifacts with null-on-missing semantics. -- `get-shit-done/bin/lib/core.cjs:51-57`

- **`extractFrontmatter()`** -- for parsing finding card YAML frontmatter to extract structured metadata before passing to agent. -- `get-shit-done/bin/lib/frontmatter.cjs:14-31`

- **`cmdCapabilityList()` + `findCapabilityInternal()`** -- to enumerate and locate all CAPABILITY.md files for the "load all capability files for reference" requirement in FN-01. -- `get-shit-done/bin/lib/capability.cjs:49-84`, `get-shit-done/bin/lib/core.cjs:504-549`

- **`output()` with @file: fallback** -- mandatory for any new CLI route returning large payloads. -- `get-shit-done/bin/lib/core.cjs:26-42`

### Integration Points

- **Orchestrator workflow file** -- needs a new `get-shit-done/workflows/coherence-report.md` (or could be a stage within a broader `refinement.md` orchestrator). Must follow the workflow convention: purpose block, required_reading, process steps. -- `get-shit-done/workflows/landscape-scan.md` (planned analog for the upstream feature)

- **Agent file: `agents/gsd-coherence-synthesizer.md`** -- TC-01 specifies this path. Must follow frontmatter convention: name, description, tools, role_type (judge for opus), reads, writes. Tools should be minimal: Read, Write (for the orchestrator to delegate disk write, or no tools if orchestrator handles all I/O). -- `agents/gsd-executor.md:1-9` (frontmatter pattern), `agents/gsd-research-synthesizer.md:1-8` (judge role_type pattern)

- **Optional: new CLI route for context loading** -- FN-01 describes loading project context + scan artifacts + all capability files. This could be a new `gsd-tools.cjs` route (e.g., `refinement-context`) or done entirely in the workflow. If a CLI route, it joins the flat switch at `get-shit-done/bin/gsd-tools.cjs:126-406`. If workflow-only, no CLI change needed.

- **RECOMMENDATIONS.md output path** -- must be written to `.planning/refinement/RECOMMENDATIONS.md`. This is the consumer contract for both refinement-qa (reads it for Q&A agenda) and refinement-artifact (manages delta). -- coherence-report FEATURE.md FN-02 line 64, refinement-artifact FEATURE.md EU-01 line 30, refinement-qa FEATURE.md EU-01 line 31

- **Downstream consumer: refinement-qa** -- reads the Q&A agenda section from RECOMMENDATIONS.md. The agenda format (items classified as decision/informational/auto-resolvable) must be parseable by a downstream agent. -- `refinement-qa/FEATURE.md:31-34` (EU-01 acceptance criteria)

### Undocumented Assumptions

- **Finding card root_cause field may be null** -- landscape-scan's consolidation pass (FN-04) sets root_cause on findings, but only if consolidation runs successfully. The coherence synthesizer must handle findings with no root_cause (treat each as its own root cause for grouping). -- `.planning/capabilities/requirements-refinement/features/landscape-scan/02-PLAN.md:186-189` (consolidation is a post-processing step)

- **PROJECT.md structure for goal alignment is not formalized** -- TC-02 requires assessing each root cause against PROJECT.md goals ("blocks", "risks", "irrelevant"). The FEATURE.md assumes PROJECT.md has a "validated requirements list" but there is no standardized section name or format for this in the project template. The agent must parse goals heuristically. -- `get-shit-done/templates/project.md` (provides template structure), coherence-report FEATURE.md TC-02 lines 115-127

- **Zero-findings case must still produce full RECOMMENDATIONS.md** -- FN-02 specifies a "clean bill of health" report when landscape-scan finds nothing. The orchestrator must not short-circuit before spawning the agent; the agent should receive empty findings context and produce the clean report. -- coherence-report FEATURE.md FN-02 line 76

- **`cmdCapabilityList` silently skips directories without CAPABILITY.md** -- if FN-01's context loading uses this function, capabilities with no CAPABILITY.md won't appear. For coherence-report this is acceptable (landscape-scan already flagged them as GAP findings), but worth noting. -- `get-shit-done/bin/lib/capability.cjs:66` (skips dirs without CAPABILITY.md)

- **Context window budget for synthesis is unconstrained** -- the single-pass synthesis (FN-02) receives ALL scan artifacts + ALL capability files + project context in one prompt. For projects with many capabilities and many findings, this could approach context limits. No existing GSD mechanism handles context truncation for synthesis agents. -- [First principles: gather-synthesize handles this by splitting into parallel gatherers; coherence-report explicitly rejects splitting per FEATURE.md decision]
