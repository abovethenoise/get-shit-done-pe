## Existing System Findings

### Relevant Implementations

- **AskUserQuestion pattern in discuss-feature**: The guided Q&A round loop (ask -> write state -> assess -> loop or exit) is the established GSD interactive pattern. Every question must go through AskUserQuestion; zero narrative text between rounds. Exit signal is "I think I have what I need... Anything else?" -- `get-shit-done/workflows/discuss-feature.md:112-141` (`guided_exploration` step)

- **AskUserQuestion anti-hallucination rules**: Mandatory rules that apply to all discussion workflows -- never output a question as plain text, never narrate between tool calls, immediately write results to state after every AskUserQuestion return. -- `get-shit-done/references/questioning.md:1-29` (`anti_hallucination` block)

- **Q&A Agenda format defined in coherence-report 01-PLAN**: The RECOMMENDATIONS.md Q&A Agenda section is a markdown table with columns: `#`, `Category`, `Topic`, `Recommended Resolution`, `Confidence`. Categories: `decision`, `informational`, `auto-resolve`. Confidence: `HIGH`, `MEDIUM`, `LOW`. -- `.planning/capabilities/requirements-refinement/features/coherence-report/01-PLAN.md:192-210`

- **RECOMMENDATIONS.md fixed section ordering**: 7 sections in immutable order; Q&A Agenda is section 7 (final). This is a parsing contract between coherence-report and refinement-qa. -- `.planning/capabilities/requirements-refinement/features/coherence-report/01-PLAN.md:70-77`

- **refinement-write CLI route**: Accepts `--type <type> --content-file <path>`. Valid types: `matrix`, `dependency-graph`, `finding`, `delta`, `checkpoint`, `recommendations`. Note: `changeset` is NOT a valid type. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/01-PLAN.md:101-102`

- **UI brand patterns**: Stage banners (`GSD > STAGE NAME`), checkpoint boxes (3 types: verification, decision, action), status symbols, progress displays. -- `get-shit-done/references/ui-brand.md:1-182`

- **parseMarkdownTable utility**: Parses pipe-delimited markdown table from a string, returns array of row objects keyed by column names. Planned for `get-shit-done/bin/lib/refinement.cjs`. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/01-PLAN.md:117-123`

- **Frontmatter parsing**: `extractFrontmatter(content)` parses YAML frontmatter from markdown files, returns object. `spliceFrontmatter(content, newObj)` replaces frontmatter. -- `get-shit-done/bin/lib/frontmatter.cjs:14-85` (`extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter`)

### Constraints

- **refinement-write type list does not include `changeset`**: TC-01 says "Change set writing uses `refinement-write` CLI route from refinement-artifact" but the planned type list is `matrix|dependency-graph|finding|delta|checkpoint|recommendations`. CHANGESET.md writing will require either adding `changeset` as a new type to `refinement-write`, or writing directly with the Write tool. -- `.planning/capabilities/requirements-refinement/features/refinement-artifact/01-PLAN.md:102` (blocks the TC-01 constraint that refinement-qa uses refinement-write for output)

- **gsd-coherence-synthesizer agent does not yet exist**: The agent file `agents/gsd-coherence-synthesizer.md` is planned (coherence-report 01-PLAN) but not yet built. The Q&A Agenda table format is defined only in plan documents, not in executable code. Refinement-qa's FN-01 agenda parser cannot be tested until this agent produces real output. -- `agents/` directory listing shows no `gsd-coherence-synthesizer.md`

- **changeset-parse CLI route does not exist**: TC-02 requires a `changeset-parse` CLI route (reads CHANGESET.md, returns JSON). This route is not in `gsd-tools.cjs` and not planned in any refinement-artifact plan file. It must be created as part of refinement-qa or as a prerequisite. -- `get-shit-done/bin/gsd-tools.cjs:126-406` (route not present in switch statement)

- **gsd-tools.cjs CLI router uses lazy require pattern**: New routes must follow the `case 'route-name': { const { fn } = require('./lib/module.cjs'); fn(cwd, args, raw); break; }` pattern. Cannot add routes without modifying the switch statement. -- `get-shit-done/bin/gsd-tools.cjs:370-402`

- **50KB Bash buffer limit**: `output()` in core.cjs writes large payloads to tmpfile with `@file:` prefix. Workflows must handle this when reading CLI output. CHANGESET.md could exceed this if many entries exist. -- `get-shit-done/bin/lib/core.cjs:31-39`

### Reuse Opportunities

- **AskUserQuestion round loop pattern**: The structured loop (ask -> write -> assess -> loop/exit) from discuss-feature.md can be directly adapted for the structured Q&A phase. The exit signal pattern ("I think I have what I need... Anything else?") maps to FN-03's "Does this look good or is there anything else to discuss?" -- `get-shit-done/workflows/discuss-feature.md:131-141`

- **parseMarkdownTable for Q&A Agenda parsing**: FN-01 needs to parse the Q&A Agenda table from RECOMMENDATIONS.md. `parseMarkdownTable` (planned in `refinement.cjs`) returns row objects with column names as keys -- directly usable for extracting `#`, `Category`, `Topic`, `Recommended Resolution`, `Confidence` fields. -- `get-shit-done/bin/lib/refinement.cjs` (`parseMarkdownTable`)

- **extractFrontmatter for CHANGESET.md**: FN-04 specifies CHANGESET.md with frontmatter (date, finding count, resolution counts). The existing `extractFrontmatter` + `spliceFrontmatter` functions handle YAML frontmatter read/write. -- `get-shit-done/bin/lib/frontmatter.cjs:14-85`

- **safeReadFile for artifact loading**: FN-01 loads RECOMMENDATIONS.md and supporting artifacts (findings/, matrix.md, dependency-graph.md). `safeReadFile` returns content or null gracefully. -- `get-shit-done/bin/lib/core.cjs:51-57`

- **UI brand checkpoint box for resolution options**: The "CHECKPOINT: Decision Required" pattern with selectable options maps directly to presenting resolution options (accept/research needed/reject-modify) per agenda item. -- `get-shit-done/references/ui-brand.md:43-47`

### Integration Points

- **Upstream: RECOMMENDATIONS.md at `.planning/refinement/RECOMMENDATIONS.md`**: Written by coherence-report workflow. Q&A Agenda is the final section, formatted as a markdown table with 5 columns. Refinement-qa must parse this section to drive the structured phase. -- `.planning/capabilities/requirements-refinement/features/coherence-report/01-PLAN.md:192-198`

- **Upstream: Supporting artifacts in `.planning/refinement/`**: FN-01 specifies loading finding cards from `findings/`, matrix from `matrix.md`, dependency graph from `dependency-graph.md` for context during Q&A. These are read-only during Q&A. -- `.planning/capabilities/requirements-refinement/features/refinement-qa/FEATURE.md:72`

- **Downstream: CHANGESET.md at `.planning/refinement/CHANGESET.md`**: Consumed by change-application (FN-01 of that feature). Must be parseable by a `changeset-parse` CLI route (not yet built). 6 entry types: ACCEPT, MODIFY, REJECT, RESEARCH_NEEDED, ASSUMPTION_OVERRIDE, USER_INITIATED. -- `.planning/capabilities/requirements-refinement/features/change-application/FEATURE.md:63-71`

- **Workflow file location**: TC-01 specifies `workflows/refinement-qa.md` (or embedded in main refinement workflow). Must follow existing workflow file conventions -- markdown with `<purpose>`, `<process>` with `<step>` elements, `<success_criteria>`. -- `get-shit-done/workflows/discuss-feature.md` (pattern reference)

- **gsd-tools.cjs route registration**: Any new CLI routes (e.g., `changeset-parse`, `changeset-write`) must be added to the main switch in `gsd-tools.cjs` with matching module in `get-shit-done/bin/lib/`. -- `get-shit-done/bin/gsd-tools.cjs:126-406`

### Undocumented Assumptions

- **Q&A Agenda table format is a contract but not yet validated**: Both coherence-report and refinement-qa specs reference the same 5-column table format, but no code enforces it yet. If the coherence-synthesizer agent deviates from this format, refinement-qa's parser will fail silently or produce garbage. -- `.planning/capabilities/requirements-refinement/features/coherence-report/01-PLAN.md:192-198`

- **CHANGESET.md format is specified in FEATURE.md but has no parsing spec**: FN-04 describes 6 entry types with structured fields (type, source, capabilities, action, reasoning) but does not specify the exact markdown structure (heading levels, field delimiters, section separators) that `changeset-parse` would need. -- `.planning/capabilities/requirements-refinement/features/refinement-qa/FEATURE.md:120-128`

- **Contradictions are "paired items" in Q&A but the pairing mechanism is unspecified**: FN-02 says "Contradictions are presented as paired items -- user resolves which direction to take" but the Q&A Agenda table has no pairing column. The workflow must infer pairs from the Contradictions section of RECOMMENDATIONS.md (section 6). -- `.planning/capabilities/requirements-refinement/features/refinement-qa/FEATURE.md:92`

- **"No file I/O" pattern assumes orchestrator pre-loads everything**: TC-01 says "No file I/O for scan artifacts -- orchestrator loads and passes contents." This means the workflow file must read all artifacts before entering the Q&A loop, not lazily during conversation. Matches coherence-report's pattern. -- `.planning/capabilities/requirements-refinement/features/refinement-qa/FEATURE.md:144`
