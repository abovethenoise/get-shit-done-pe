## Tech Constraints Findings

**Phase:** 06-workflows-and-commands
**Dimension:** Tech Constraints
**Researched:** 2026-02-28

---

### Hard Constraints

- **CommonJS only (.cjs)** — All lib modules use `require()`/`module.exports`. No ESM `import`/`export`. New modules must follow this. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` line 1, all lib files]

- **stdout = JSON only** — `output()` in core.cjs calls `JSON.stringify()` then `process.stdout.write()`. Callers parse JSON. No plain-text output from gsd-tools except via `--raw` flag which emits a single scalar. New init commands must follow this contract exactly. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 41-57]

- **50KB Bash tool buffer limit** — `output()` already handles this: if `json.length > 50000`, it writes to a tmpfile and emits `@file:<path>`. Any new init commands that return large context payloads (e.g., `init` commands assembling multiple documents) must not assume the full JSON will arrive inline. Workflows that call gsd-tools must check for the `@file:` prefix. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 47-54]

- **`--cwd` flag honored by all commands** — The CLI router strips `--cwd` before command dispatch and sets `cwd` accordingly. Every new command receives `cwd` as a parameter. No command may use `process.cwd()` directly — it must use the passed `cwd`. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` lines 152-169]

- **No interactive stdin** — `gsd-tools.cjs` has no readline/stdin handling. All input via CLI args. Commands that need structured multi-field input use flag-per-field (`--field`, `--value`, `--data`). Workflows use `AskUserQuestion` for human interaction, not stdin. — [Source: entire `gsd-tools.cjs` — no stdin reads present]

- **`process.exit(0)` on success, `process.exit(1)` on error** — `output()` calls `process.exit(0)` and `error()` calls `process.exit(1)` after writing to stderr. This means gsd-tools is single-shot per invocation — no multi-command chaining in a single process. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 56, 61]

- **js-yaml@4.1.1 is the YAML library** — Available at `get-shit-done/bin/node_modules/js-yaml`. Frontmatter parsing uses `FAILSAFE_SCHEMA` (all scalars stay as strings). New code that reads YAML frontmatter must go through `extractFrontmatter()` in `frontmatter.cjs`, not roll its own parser. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/frontmatter.cjs` lines 1-31, `get-shit-done/bin/node_modules/js-yaml/package.json` version field]

- **`fillTemplate()` is the single source of truth for capability/feature content** — Any code that creates CAPABILITY.md or FEATURE.md files must call `fillTemplate()` from `template.cjs`. Template content lives in `get-shit-done/templates/capability.md` and `feature.md`. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/template.cjs` lines 263-296]

- **Framing question files path convention** — `gather-synthesize.md` references `get-shit-done/framings/{framing}/{role}-questions.md`. This directory structure does not yet exist on disk (the `framings/` directory was not found). Phase 6 must create it. Workflow code in `review-phase.md` already references it conditionally: "If framing files do not exist yet (Phase 6 creates them), proceed without framing context." — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` line 47, `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/review-phase.md` line 46-47]

- **Node.js >=16.7.0** — Engine requirement set in package.json. `fetch` is used in `cmdWebsearch` without a polyfill, which requires Node 18+. New code may use `fetch` natively but should note the de facto floor is Node 18. — [Source: `/Users/philliphall/get-shit-done-pe/package.json` engines field; `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/commands.cjs` line 345]

---

### Dependency Capabilities

- **`js-yaml@4.1.1`**: Supports `yaml.load(str, { schema })` with `FAILSAFE_SCHEMA` (all scalars as strings), `yaml.dump(obj)` for serialization. No streaming. No async. Sufficient for all frontmatter operations. Already vendored at `get-shit-done/bin/node_modules/js-yaml`. — [Source: `frontmatter.cjs` lines 23, 62-75]

- **`extractFrontmatter(content)` / `reconstructFrontmatter(obj)`**: Parses `---\n...\n---` blocks. Returns `{}` on parse failure (no throw). Serializes objects back to YAML with string coercion. These are the supported I/O primitives for all .md file frontmatter operations. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/frontmatter.cjs` lines 14-80]

- **`resolveModelFromRole(cwd, agentPath)`**: v2 model resolution — reads agent frontmatter `role_type`, maps to `ROLE_MODEL_MAP`. `executor` → `'sonnet'`, `judge` → `'inherit'`. New agents for Phase 6 (framing workflows, init commands) should declare `role_type` in frontmatter and will resolve correctly without changes to core.cjs. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 34-37, 378-405]

- **`loadConfig(cwd)`**: Returns a flat config object from `.planning/config.json`. Already includes `brave_search`, `parallelization`, `research`, `plan_checker`, `verifier`, `model_profile`, branching config. Adding new config keys requires changes here only — no other file needs updating for config propagation. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 74-128]

- **`findCapabilityInternal(cwd, capabilityInput)` / `findFeatureInternal(cwd, capabilitySlug, featureInput)`**: Exact slug-based lookup only. Requires pre-slugified input. Returns `{ found: bool, ... }`. These do NOT do fuzzy matching — fuzzy resolution for Phase 6 commands must be implemented at the workflow level (in markdown), not in gsd-tools. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 454-499]

- **`generateSlugInternal(text)`**: Converts text to kebab-case slug. Rejects path separators. Returns empty string (not null) for sanitized-empty input. Used for capability/feature slug creation. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/core.cjs` lines 419-426]

- **`AskUserQuestion`**: Available to slash command workflows for interactive user prompts. Used by `debug.md`, `discovery-phase.md`. Supports `header`, `question`, `options` fields. This is the correct mechanism for lens-specific Q&A, not stdin or inline conversation. — [Source: `/Users/philliphall/get-shit-done-pe/commands/gsd/debug.md` lines 51-61; `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/discovery-phase.md` line 218]

- **`gather-synthesize.md` pattern**: Reusable orchestration for N parallel gatherers + 1 synthesizer. Already handles: context assembly (4 layers), parallel spawning, failure thresholds (>50% fail = abort), partial synthesis. Phase 6 workflows can use this directly. Takes `gatherers[]`, `synthesizer`, `context`, `subject` parameters. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/gather-synthesize.md` entire file]

- **`init` compound commands** — The pattern is established: `gsd-tools init <workflow-name> [phase]` returns a flat JSON object with everything a workflow needs. Adding new init commands requires: (1) new function in `init.cjs`, (2) new `case` in `gsd-tools.cjs` init switch, (3) update to error message listing available workflows. — [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/gsd-tools.cjs` lines 512-558]

---

### Compatibility Issues

- **Fuzzy resolution is not in gsd-tools** — The CONTEXT.md decision requires fuzzy capability/feature resolution for all 11 commands. `findCapabilityInternal` only does exact slug matching. Fuzzy matching (top-3 suggestions, no-match handling) must live in workflow markdown files or a new gsd-tools command must be added. The workflow approach is consistent with existing patterns (workflows handle user interaction, tools handle data). No blocker, but the design split must be explicit. — [Source: `core.cjs` lines 454-499; `/Users/philliphall/get-shit-done-pe/.planning/phases/06-workflows-and-commands/06-CONTEXT.md` Fuzzy Resolution section]

- **Discovery brief schema must be a new file type** — The CONTEXT.md defines a rich discovery brief schema (meta, problem statement, context, specification, unknowns, scope boundary). No existing file type maps to this. It will need a new template and a new `fillTemplate()` case. The current `fillTemplate()` only handles `'capability'` and `'feature'`. — [Source: `template.cjs` lines 273-296; CONTEXT.md Discovery Brief section]

- **Framing question files referenced but not yet created** — `gather-synthesize.md` Layer 4 references `get-shit-done/framings/{framing}/{role}-questions.md`. The `framings/` directory does not exist in the codebase. The `references/` directory has `debug`, `enhance`, `new`, `refactor` as files (not directories), which are likely the precursor content. Phase 6 must create the `framings/` directory structure and populate the question files. Existing workflows conditionally skip this layer if files are absent, so no backward break. — [Source: Bash ls output showing `references/` contains `debug`, `enhance`, `new`, `refactor` as items; `gather-synthesize.md` line 47; `review-phase.md` lines 46-47]

- **`init` command naming collision risk** — The existing init switch handles 14 workflows. Phase 6 needs new init variants for: `init debug`, `init new`, `init enhance`, `init refactor`, `init discuss-capability`, `init discuss-feature`, `init status`, `init resume-pipeline` (different from existing `init resume` which handles interrupted agents), `init plan`, `init review`. The `resume` name conflicts with existing `init resume`. New init commands should use unambiguous names like `init lens-debug`, `init discuss-cap`, or the calling workflows can reuse `init phase-op` with flags. — [Source: `gsd-tools.cjs` lines 514-558; CONTEXT.md Command Inventory section]

- **`state` command naming: `resume` collision** — Existing `init resume` detects interrupted agents and returns session state. Phase 6's `/resume` command picks up an interrupted pipeline at a stage boundary. These are different semantics. The new `/resume` workflow should use `init phase-op` or `init resume-pipeline` (new) to avoid ambiguity. — [Source: `init.cjs` lines 303-333; CONTEXT.md Command Inventory]

- **`.planning/capabilities/` vs `.documentation/capabilities/`** — Existing infrastructure (capability.cjs, core.cjs, template.cjs) stores capability files in `.planning/capabilities/{slug}/CAPABILITY.md`. The CONTEXT.md calls for `.documentation/capabilities/` for per-capability lifecycle files. This is a path conflict: existing code writes to `.planning/capabilities/`, but the v2 spec calls for `.documentation/capabilities/`. The Phase 6 implementation must reconcile this or explicitly route the two stores (`.planning/capabilities/` for planning artifacts, `.documentation/capabilities/` for documentation outputs from the doc agent). — [Source: `core.cjs` lines 454-473; `capability.cjs` line 24; CONTEXT.md Documentation Structure section]

---

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---|---|---|
| New slash commands (`/debug`, `/new`, `/enhance`, `/refactor`, `/init`, `/discuss-capability`, `/discuss-feature`, `/status`, `/resume`, `/plan`, `/review`) as markdown files in `commands/gsd/` | viable | Established pattern: `commands/gsd/debug.md` already exists as a standalone debug command. Phase 6 replaces or wraps it with the framing-aware version. |
| New `init` compound commands in `init.cjs` for each framing workflow | viable | Clear extension path. New function + new case in switch. 14 existing variants prove the pattern scales. Risk: naming collision with `init resume` (see above). |
| Framing question files in `get-shit-done/framings/{framing}/{role}-questions.md` | viable | Directory does not exist yet but creating it is trivial. Existing workflows already reference this path and skip gracefully when absent. No library dependency. |
| Discovery brief as a new CAPABILITY.md-style flat markdown template | viable | `fillTemplate()` is easily extended with a `'brief'` case. Requires a new template file in `get-shit-done/templates/brief.md`. The capability file lifecycle pattern (sections fill progressively) maps directly to the brief schema. |
| Fuzzy resolution in gsd-tools as a new `capability-fuzzy-find` command | viable | Would require reading all CAPABILITY.md files, scoring against input. `cmdCapabilityList` already enumerates them. String similarity scoring can be done in plain JS without new dependencies. Output: `{ matches: [{slug, score, name}], exact: bool }`. |
| Fuzzy resolution implemented entirely in workflow markdown | viable | Simpler, no new gsd-tools code. Workflow does `gsd-tools capability-list`, inspects slugs/names, applies judgment. Consistent with how other ambiguity is handled (e.g., `debug.md` handles multiple active sessions in workflow markdown). Recommended over adding a gsd-tools command. |
| `/init` command auto-detecting new vs existing project | viable | `cmdInitNewProject` in `init.cjs` already detects `is_brownfield`, `has_existing_code`, `has_package_file`, `project_exists`. Phase 6's `/init` workflow can use this data to branch. New-project and existing-project flows become conditional branches in a single workflow file. |
| `/init` incremental writes with partial-run detection | viable | Pattern established by existing `init resume` (checks for `current-agent-id.txt`). Partial run state can be persisted as a file (e.g., `.planning/init-state.json`) and checked on re-entry. No new infrastructure needed. |
| Using `gather-synthesize.md` for discovery research agents | viable | The pattern accepts arbitrary gatherer agents. Phase 6's research agents (tech constraints, domain truth, etc.) are already consumed this way in plan-phase research. Discovery brief agents would receive lens-specific framing context via Layer 4. |
| Discovery brief schema using existing CAPABILITY.md frontmatter | constrained | CAPABILITY.md frontmatter is minimal (name, slug, status). The brief schema is richer (primary_lens, completion, hypothesis, evidence, etc.). Reusing the same file would require extending the frontmatter schema. Cleaner: brief gets its own file type at `.planning/capabilities/{slug}/BRIEF.md` or within the pipeline run directory. |
| Storing discovery brief inside capability directory | viable | `.planning/capabilities/{slug}/BRIEF.md` is a clean path consistent with existing layout. Multiple briefs per capability (one per pipeline run) would need slug-based naming: `{date}-{lens}-BRIEF.md`. |
| Escalation protocol requiring stage-to-stage backward routing | viable | Escalation is a workflow-level concern, not a gsd-tools concern. Workflows already handle error returns and user confirmation (see `review-phase.md` Q&A loop). The 3-tier severity model maps to: minor = continue flag in synthesis output, moderate = `AskUserQuestion` with proceed/amend options, major = `AskUserQuestion` with halt/redirect option. No new infrastructure needed. |
| `discuss-capability` and `discuss-feature` as standalone commands that update capability/feature files | viable | `cmdCapabilityStatus` and `cmdFeatureStatus` already read these files. `frontmatter merge` command already supports updating frontmatter fields. Discussion output can be written via `gsd-tools frontmatter merge` on the capability/feature file. |
| `/status` command reading from `.planning/capabilities/` | viable | `cmdCapabilityList` + `cmdCapabilityStatus` already provide the data. `/status` workflow assembles it into a dashboard. No new gsd-tools commands needed. |

---

### Alternatives

- **`framings/` path conflicts with `references/` content** — The `references/` directory contains items named `debug`, `enhance`, `new`, `refactor` (visible in `ls` output). These appear to be files or subdirectories. If they are files, they may contain early draft question content. If they are directories, they are the precursor structure. Either way, Phase 6 should: (a) read their contents before creating `framings/`, (b) decide whether to move content from `references/` to `framings/` or keep both. — [First principles: the naming collision between `references/{debug,enhance,new,refactor}` and the proposed `framings/{debug,enhance,new,refactor}` will cause confusion if both exist. One canonical location is better.]

- **Discovery brief storage collision with `.documentation/capabilities/`** — CONTEXT.md calls for `.documentation/capabilities/` for capability lifecycle files, but existing infrastructure uses `.planning/capabilities/`. Alternative: keep `.planning/capabilities/` as the working store for all pipeline artifacts (briefs, plans, requirements); use `.documentation/capabilities/` only for final doc-agent outputs (the human-readable capability docs). This preserves backward compatibility with all existing code. — [First principles: `.planning/` is the artifact workspace; `.documentation/` is the published output. Keeping these roles distinct avoids gsd-tools code changes.]

- **`init resume` naming collision** — Alternative naming for new pipeline resume init: `init pipeline-resume` or `init resume-pipeline`. Existing `init resume` handles agent interruption recovery; new one handles pipeline stage recovery. Both can coexist under different names. The existing `/gsd:resume-work.md` slash command provides a template for the workflow structure. — [Source: `gsd-tools.cjs` line 529; `init.cjs` lines 303-333]

- **Fuzzy resolution without new gsd-tools code** — The recommended path is workflow-level fuzzy matching using `capability-list` output. The workflow reads all capability slugs and names, applies string similarity logic (substring match, slug match, keyword overlap), and uses `AskUserQuestion` to present top candidates. This avoids adding a scoring library dependency and keeps the matching behavior visible to contributors. — [First principles: fuzzy matching semantics are UX decisions better owned by the workflow author than buried in a CLI command.]
