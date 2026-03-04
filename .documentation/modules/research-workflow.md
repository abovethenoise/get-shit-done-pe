---
type: module-doc
built-from-code-at: 2210b16
last-verified: 2026-03-04
---

## Module: research-workflow.md

## Purpose: [derived]

Reference documentation for the research gather-synthesize pattern. Describes the 6 specialist research gatherers, context assembly layers, and output structure. Not an orchestration workflow -- callers (plan.md Step 5, framing-pipeline.md Stage 1) own the actual Task() spawns. Located at `get-shit-done/workflows/research-workflow.md`.

**Delta (research-overhaul):** Reframed from orchestration workflow to reference documentation. Purpose block updated to state callers own Task() spawns. Step 5 rewritten from imperative "execute gather-synthesize" to descriptive "when callers spawn the 6 gatherers, the execution follows..." No longer a delegation target.

## Exports: [derived]

This is a reference document (not an orchestration workflow). It documents the following:

- **Inputs (documented interface for callers):** `subject`, `context_paths` (project, state, roadmap, requirements), `output_dir`, `capability_path` (optional), `feature_path` (optional), `framing_context` (optional: brief_path, lens, secondary_lens, direction, focus)
- **Context assembly layers:**
  - Layer 1: Core (PROJECT.md, STATE.md, ROADMAP.md)
  - Layer 2: Capability (CAPABILITY.md)
  - Layer 3: Scope (feature-level FEATURE.md or capability-level scan of all features)
  - Layer 4: Framing (brief, lens metadata -- when framing_context provided)
- **Gatherer definitions (6):**
  - `gsd-research-domain` -- Domain Truth (`domain-truth-findings.md`)
  - `gsd-research-system` -- Existing System (`existing-system-findings.md`)
  - `gsd-research-intent` -- User Intent (`user-intent-findings.md`)
  - `gsd-research-tech` -- Tech Constraints (`tech-constraints-findings.md`)
  - `gsd-research-edges` -- Edge Cases (`edge-cases-findings.md`)
  - `gsd-research-prior-art` -- Prior Art (`prior-art-findings.md`)
- **Synthesizer:** `gsd-research-synthesizer` -- writes `{output_dir}/RESEARCH.md`
- **Output structure:** `{output_dir}/RESEARCH.md` (consolidated) + `{output_dir}/research/{dimension}-findings.md` (6 individual files) + manifest

## Depends-on: [derived]

- `workflows/gather-synthesize.md` -- Pattern description (required_reading, category-3)
- `agents/gsd-research-domain.md` -- Domain Truth gatherer agent definition
- `agents/gsd-research-system.md` -- Existing System gatherer agent definition
- `agents/gsd-research-intent.md` -- User Intent gatherer agent definition
- `agents/gsd-research-tech.md` -- Tech Constraints gatherer agent definition
- `agents/gsd-research-edges.md` -- Edge Cases gatherer agent definition
- `agents/gsd-research-prior-art.md` -- Prior Art gatherer agent definition
- `agents/gsd-research-synthesizer.md` -- Research synthesizer agent definition

## Constraints: [authored]

- This is reference documentation. Callers own the actual Task() spawns.
- All 6 gatherers always run regardless of framing type. Framing shapes focus, not inclusion.
- Gatherers use sonnet (executor role). Synthesizer uses inherit/opus (judge role).
- Orchestrator passes PATHS not content. Each gatherer reads files in its own context window.
- Framing-agnostic: framing changes Layer 4 context, not workflow mechanics.

## WHY: [authored]

**Reframed from orchestration to reference (review finding, FN-07):** research-workflow.md previously used imperative language ("Invoke", "Delegate to") for gather-synthesize.md, making it a delegation target that models could misinterpret. After plan.md and framing-pipeline.md took ownership of Task() spawns, this file's orchestration role was redundant. Reframed to document what the research pattern is (gatherer dimensions, context layers, output structure) rather than commanding execution. Existing content about gatherers and context assembly preserved -- only imperative delegation language changed.
