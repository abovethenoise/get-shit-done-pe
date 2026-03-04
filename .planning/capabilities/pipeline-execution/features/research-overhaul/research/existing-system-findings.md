## Existing System Findings

### Relevant Implementations

- **plan.md Step 5 research skip gates** — `get-shit-done/workflows/plan.md:57–58`. Two gates protect research: (1) `--skip-research` CLI flag or `research_enabled` config false; (2) binary `has_research` check skips to Step 6 if RESEARCH.md already exists and `--research` override not passed. These are the gates the feature removes.

- **plan.md Step 5 ambiguous delegation** — `get-shit-done/workflows/plan.md:60`. Research delegation reads: `"Invoke @{GSD_ROOT}/get-shit-done/workflows/research-workflow.md with subject, context_paths..."`. No Task() pseudo-code; just an inline prose instruction. This is the root ambiguity: "Invoke @" could mean "read and interpret yourself" instead of "spawn a subagent."

- **plan.md Step 7 unambiguous delegation (working pattern)** — `get-shit-done/workflows/plan.md:108–114`. Planner is spawned with an explicit `Task(prompt=..., subagent_type="general-purpose", model="{planner_model}", description="...")` block. This is the working reference pattern the feature should replicate for research.

- **framing-pipeline.md Stage 1 ambiguous delegation** — `get-shit-done/workflows/framing-pipeline.md:83–106`. Uses a bare `@{GSD_ROOT}/get-shit-done/workflows/research-workflow.md` reference inside a fenced code block followed by pass-context prose. Same structural pattern as plan.md Step 5: no Task() call. Confirmed second instance of the anti-pattern.

- **framing-pipeline.md Stages 3–6 also use bare `@` delegation** — `get-shit-done/workflows/framing-pipeline.md:168–169, 201–202, 243–244, 285–286`. All four downstream stages (plan, execute, review, doc) follow the same pattern: bare `@{GSD_ROOT}/get-shit-done/workflows/{workflow}.md` in a code fence with context prose below. These may not be defective in the same way (they do not spawn parallel agents) but are architecturally inconsistent with how execute.md uses Task().

- **research-workflow.md Step 5 delegates to gather-synthesize via the same bare `@` pattern** — `get-shit-done/workflows/research-workflow.md:152`. Inside research-workflow itself: `@{GSD_ROOT}/get-shit-done/workflows/gather-synthesize.md` — no Task(). However, gather-synthesize.md is a pattern document rather than an agent, so the model is expected to read it and follow it inline. This is architecturally different from spawning agents; it may work correctly if the model reads it as instructions.

- **gather-synthesize.md Step 2 spawning instruction** — `get-shit-done/workflows/gather-synthesize.md:89`. Explicit: "Spawn ALL gatherers simultaneously using parallel Task calls. Do not wait for one to finish before spawning the next." This is unambiguous — but it is only reached if the model actually executes gather-synthesize rather than shortcutting.

- **`research_enabled` is read from config.json `workflow.research`** — `get-shit-done/bin/lib/core.cjs:66`, `get-shit-done/templates/config.json:5`. Default is `true`. The gate in plan.md:57 activates only if a project's `.planning/config.json` sets `workflow.research: false` (or the legacy flat key `research: false`). This means the skip gate is project-configurable, not just a CLI flag.

- **`has_research` is a binary file-existence check in init.cjs** — `get-shit-done/bin/lib/init.cjs:491`. Logic: `files.some(f => f === 'RESEARCH.md' || f.endsWith('-RESEARCH.md'))`. Returns true if any RESEARCH.md (or *-RESEARCH.md) file exists in the feature directory. No lens, no timestamp, no metadata — pure filesystem presence check.

- **`research_enabled` is surfaced to workflows via `init plan-feature`** — `get-shit-done/bin/lib/init.cjs:448`. The `research_enabled` key is populated as `config.research` in the JSON output of `gsd-tools init plan-feature`. Removing the gate from plan.md does NOT require changing init.cjs — the key can remain in the JSON; the workflow just stops consuming it.

- **capability-orchestrator.md delegates framing-pipeline via bare `@`** — `get-shit-done/workflows/capability-orchestrator.md:95`. Same pattern: `@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md` without Task(). This is a third caller of the delegation chain that runs research indirectly.

- **review.md auto-advances to doc via bare `@`** — `get-shit-done/workflows/review.md:120`. Inline text: "Auto-invoke doc workflow: `@{GSD_ROOT}/get-shit-done/workflows/doc.md`". No Task() call. Review is not part of the research delegation chain, but confirms the `@` reference pattern is systemic across all workflow-to-workflow calls.

- **framing-discovery.md delegates to framing-pipeline via bare `@`** — `get-shit-done/workflows/framing-discovery.md:259`. After brief finalization: `@{GSD_ROOT}/get-shit-done/workflows/framing-pipeline.md` — same pattern. This is the discovery entry point for the entire 6-stage pipeline.

- **execute.md uses Task() to spawn executor agents, but uses bare `@` inside the Task prompt** — `get-shit-done/workflows/execute.md:66–94`. The outer spawn is explicit Task() — correct. Inside the Task prompt, context files are listed as `@{GSD_ROOT}/...` references. This is a different usage (context file references, not workflow delegation) and is likely correct behavior.

---

### Constraints

- **gather-synthesize.md and research-workflow.md are declared invariants** — `get-shit-done/workflows/gather-synthesize.md`, `get-shit-done/workflows/research-workflow.md`. The BRIEF.md explicitly states these must not change (`BRIEF.md:67–68`). Any fix must work by changing callers only, not the orchestration core.

- **`research_enabled` is in the config.json schema and in init.cjs output** — `get-shit-done/templates/config.json:5`, `get-shit-done/bin/lib/init.cjs:448`. If the gate is removed from plan.md, existing projects with `research: false` in their config will silently ignore that setting. Users who intentionally set it will lose the opt-out capability. This is a design decision (gate removal is the stated goal), but it breaks backward compatibility for that config key.

- **`has_research` is returned by both `init plan-feature` and `init feature-op`** — `get-shit-done/bin/lib/init.cjs:491, 638`. Both init routes return this key. If the binary check is replaced with lens-aware logic, that logic must live in the workflow (not in init.cjs) since init.cjs has no lens context. The init.cjs output key may remain but its semantics change from "gate" to "metadata."

- **framing-pipeline.md `<key_constraints>` declares "All 6 stages run in sequence. No stage skipping."** — `get-shit-done/workflows/framing-pipeline.md:413`. Research (Stage 1) has no skip mechanism defined here. The binary `has_research` skip lives only in plan.md. Fixing plan.md does not create inconsistency with framing-pipeline because framing-pipeline never had a skip gate to begin with.

---

### Reuse Opportunities

- **plan.md Step 7 Task() block as the delegation template** — `get-shit-done/workflows/plan.md:108–114`. The exact structure (Task prompt with role-read preamble, subagent_type, model, description) is the working pattern. Step 5 research delegation should adopt this same structure, substituting `subagent_type="general-purpose"` and passing the research-workflow.md path plus all inputs.

- **gather-synthesize.md Task prompt template** — `get-shit-done/workflows/gather-synthesize.md:74–87`. The gatherer Task prompt template (`First, read {agent_path}... <subject>... {context_payload}... <task_context>...`) is already defined. The research-workflow.md already uses this correctly once the model executes gather-synthesize. No changes needed there.

- **BRIEF.md option list for lens-aware reuse** — `.planning/capabilities/pipeline-execution/BRIEF.md:60`. Three candidate approaches are documented: (a) single Q&A asking user, (b) automatic lens comparison, (c) hybrid. The planner can select from these directly rather than re-deriving the option space.

---

### Integration Points

- **plan.md Step 5 → research-workflow.md**: The delegation point to fix. Must produce an explicit Task() or equivalent unambiguous spawning instruction that results in the model invoking research-workflow.md as a subagent context, not reading it inline. `get-shit-done/workflows/plan.md:60`

- **framing-pipeline.md Stage 1 → research-workflow.md**: Second delegation point with the same fix needed. `get-shit-done/workflows/framing-pipeline.md:83–86`

- **plan.md Step 1 init JSON → `research_enabled` and `has_research` keys**: The workflow reads these from init output. After removing the gates, these keys can stay in the JSON (no init.cjs change needed) but the workflow logic that branches on them must be removed or replaced. `get-shit-done/workflows/plan.md:25, 57–58`

- **All `@{GSD_ROOT}/workflows/*.md` delegation sites for audit**: Based on the grep, the full list of bare `@` workflow-to-workflow references is: framing-pipeline→research-workflow (line 86), framing-pipeline→plan (169), framing-pipeline→execute (202), framing-pipeline→review (244), framing-pipeline→doc (286), capability-orchestrator→framing-pipeline (95), review→doc (120), framing-discovery→framing-pipeline (259), research-workflow→gather-synthesize (152). All are candidates for the audit the feature requires.

---

### Undocumented Assumptions

- **The model is expected to treat `@{GSD_ROOT}/workflows/gather-synthesize.md` as "read and execute inline" rather than "spawn a subagent"** — `get-shit-done/workflows/research-workflow.md:152`. There is no explicit instruction telling the model which interpretation to use. The distinction between "follow this pattern" vs "delegate to this workflow" is entirely implicit, and this is the root ambiguity that causes shortcutting.

- **framing-pipeline.md assumes it IS an agent context (not a delegated workflow), so bare `@` references work for sequential sub-workflows** — `get-shit-done/workflows/framing-pipeline.md:168–286`. The working assumption is that the model executing framing-pipeline.md reads the downstream workflow files (`@plan.md`, `@execute.md`, etc.) as sub-context and steps through them. This works for sequential single-agent invocations but breaks for parallel multi-agent spawns like research gatherers.

- **`--skip-research` is documented as a CLI flag but there is no CLI argument parser in gsd-tools.cjs** — `get-shit-done/workflows/plan.md:31`. The flag is extracted by the model itself via text parsing of the invocation prompt, not by the Node.js binary. This means the "flag" is entirely a model convention with no enforcement layer.

- **`has_research` returning true on `*-RESEARCH.md` filenames enables legacy path compatibility** — `get-shit-done/bin/lib/init.cjs:491`. The `f.endsWith('-RESEARCH.md')` branch suggests an older naming convention (`{phase}-RESEARCH.md`) was once used. Any lens-aware reuse logic must account for this filename variation when inspecting existing research files.
