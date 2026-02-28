## User Intent Findings

### Primary Goal

The user wants documentation that serves as a lookup tool for AI agents and humans during future work -- not prose, not tutorials, not a rehash of the spec. After review acceptance, a doc agent reads the actual built code and produces reference docs structured for grep and fast navigation: "what does this module do" and "how does this flow work end-to-end." -- [source: `ROADMAP.md` Phase 5 goal; `REQUIREMENTS.md` DOCS-01, DOCS-03; `05-CONTEXT.md` "optimized for future lookup"]

### Acceptance Criteria

Derived from CONTEXT.md decisions and REQUIREMENTS.md, each with a testable pass/fail condition:

- **AC-01: Agent reads actual source code, not spec** -- Pass: doc agent opens real file paths, reads real function names, real exports, real data flows from the codebase after review acceptance. Fail: agent generates docs from memory, from the plan, or from requirement descriptions. -- [source: `REQUIREMENTS.md` DOCS-01; `ROADMAP.md` success criterion 1: "reads actual source files (real file paths, function names, data flows)"]

- **AC-02: Two documentation layers** -- Pass: module index docs (flat, 1:1 with code files, navigation-weight) AND flow narrative docs (cross-module, capability-grouped, primary value) are both generated. Fail: only one layer exists, or modules and flows are merged into a single doc type. -- [source: `05-CONTEXT.md` "Two documentation layers: module index (navigation, lightweight) and flow narratives (primary docs, where the value lives)"]

- **AC-03: Docs live in .documentation/ with git SHA timestamp** -- Pass: generated docs are written to `.documentation/modules/` and `.documentation/flows/`, each stamped with `built-from-code-at:` git SHA. Fail: docs live elsewhere, or no staleness detection mechanism exists. -- [source: `ROADMAP.md` success criterion 2; `05-CONTEXT.md` directory structure]

- **AC-04: Strict heading templates for grep consistency** -- Pass: module docs use `## Module:`, `## Purpose:`, `## Exports:`, `## Depends-on:`, `## Constraints:`, `## WHY:`. Flow docs use `## Flow:`, `## Trigger:`, `## Input:`, `## Steps:`, `## Output:`, `## Side-effects:`, `## WHY:`. Fail: headings deviate from canonical format or are inconsistent across docs. -- [source: `05-CONTEXT.md` heading templates section; `REQUIREMENTS.md` DOCS-03 "mgrep searches"]

- **AC-05: Flow docs include ASCII diagram first, then structured steps** -- Pass: every flow doc opens with an ASCII data flow diagram, followed by numbered steps with module ownership, then side effects. Fail: diagram is missing, or steps come before diagram, or steps reference functions instead of modules. -- [source: `05-CONTEXT.md` "Each flow gets an ASCII diagram first"; specifics section example]

- **AC-06: Module-level granularity in flows, not function-level** -- Pass: flow steps reference modules by name (e.g., "parser -> extracts actions"). Fail: flow steps reference individual functions (e.g., "parser.parseHand()"). -- [source: `05-CONTEXT.md` "Flow steps reference modules by name, not individual functions"]

- **AC-07: Section ownership tags on every section** -- Pass: every section in every generated doc is tagged either `[derived]` or `[authored]`. Derived sections are overwritten freely on regeneration; authored sections are preserved and conflicts flagged. Fail: sections lack ownership tags, or authored sections are silently overwritten. -- [source: `05-CONTEXT.md` "Section-level ownership model"]

- **AC-08: One-way cross-referencing** -- Pass: flow docs reference modules in Steps sections. Module docs do NOT link back to flows. Fail: modules contain flow references, or flows fail to reference their constituent modules. -- [source: `05-CONTEXT.md` "One-way: flows reference modules in Steps. Modules don't link back to flows."]

- **AC-09: Three-source input contract** -- Pass: doc agent reads code (for "what does this do"), review findings (for "why is it this way"), and FEATURE.md requirements (for "what was it supposed to do"). Fail: agent reads only code, or only spec, or lacks access to review findings. -- [source: `05-CONTEXT.md` input contract section]

- **AC-10: Scoped discovery -- modified files plus one hop** -- Pass: agent documents files directly modified in the reviewed change, then greps existing flow docs for references to modified modules and flags them for review. Fail: agent scans entire codebase, or ignores impact on existing flow docs. -- [source: `05-CONTEXT.md` discovery scope: "Primary (always): files directly modified"; "Impact discovery (one hop)"]

- **AC-11: Impact flags only, no auto-rewrite of existing docs** -- Pass: impacted flow docs (one-hop discovery) produce a list of affected docs with what changed -- presented to user. Fail: agent silently rewrites existing flow docs without user review. -- [source: `05-CONTEXT.md` "Impacted flow docs are flagged only -- not auto-rewritten"]

- **AC-12: 3-pass self-validation** -- Pass: agent runs structural compliance (headings, tags, anchors), referential integrity (module names match code, exports exist, dependencies resolve), and gate doc consistency (glossary terms, constraints, state references) before presenting docs. Fail: any pass is skipped, or validation runs after user approval. -- [source: `05-CONTEXT.md` self-validation section]

- **AC-13: Gate docs scaffolded with seed content** -- Pass: `constraints.md`, `glossary.md`, and `state.md` are created in `.documentation/gate/` with the universal seed entries from CONTEXT.md specifics. All entries tagged `[manual]`. Fail: gate docs are empty templates, or agent generates gate doc content beyond seeds. -- [source: `05-CONTEXT.md` "scaffolded with universal seed content"; specifics section seed entries]

- **AC-14: Gate docs are read-only validation inputs** -- Pass: doc agent reads gate docs to check generated docs against constraints, glossary, and state inventory. Violations are surfaced as flags. Fail: agent writes to gate docs, or ignores gate docs during validation. -- [source: `05-CONTEXT.md` "Gate docs are validation inputs, not agent outputs"; "Output: violations surfaced as flags, not fixes"]

- **AC-15: Q&A review before commit** -- Pass: agent presents generated docs to user for review (same pattern as plan-phase and review-phase Q&A). User approves before docs are committed. Fail: docs are auto-committed, or presentation skips user confirmation. -- [source: `05-CONTEXT.md` "Agent presents generated docs for user Q&A review"]

- **AC-16: WHY blocks only for non-obvious decisions** -- Pass: WHY blocks appear inline only when a design decision is non-obvious, sourced from review findings or code context. Most sections have no WHY block. Fail: WHY blocks appear on every section (noise), or are never present (missing rationale for genuinely non-obvious choices). -- [source: `05-CONTEXT.md` "non-obvious 'why' decisions as inline rationale (WHY blocks)"]

- **AC-17: Doc agent triggers after review acceptance** -- Pass: documentation runs as the final pipeline stage (execute -> review -> accept -> document). Fail: doc agent runs before review acceptance, or requires manual trigger outside the pipeline. -- [source: `05-CONTEXT.md` "Doc agent triggers automatically after review acceptance"]

### Implicit Requirements

- **Function-level reference stays in code, not in docs** -- The user explicitly separated concerns: types, naming conventions, and function-level detail belong in the code itself. Docs capture module-level purpose and cross-module flows. This means the doc agent must resist the natural tendency to enumerate every function in a module doc. Exports section lists what a module exposes, not how each export works internally. -- [source: `05-CONTEXT.md` "Function-level reference stays in the code itself (types, naming)"]

- **"What it does" is primary, "why" is secondary and conditional** -- Most documentation systems over-index on rationale. The user wants docs that answer "what does this module/flow do" in under 10 seconds. WHY blocks are exceptions, not the rule. If the doc agent produces WHY blocks on >30% of sections, it is generating noise. -- [source: `05-CONTEXT.md` "Docs capture 'what it does' primarily"; user profile: "concise, no walls of text"]

- **The doc agent has two distinct jobs that should not be conflated** -- Job 1: generate module index + flow narratives from code (post-review, ongoing). Job 2: scaffold gate doc infrastructure (one-time setup). These are different activities with different triggers, different ownership models, and different update patterns. Conflating them risks the agent treating gate docs as generated content. -- [First principles: gate docs are `[manual]` with human ownership; generated docs are `[derived]` with agent ownership. Mixing ownership models in a single pass invites overwrite bugs.]

- **ASCII diagrams are the user's primary navigation entry point** -- The user provided a specific flow doc example where the ASCII diagram sits at the top, before any structured content. For this user (data professional, thinks in flows, prefers visual), the diagram IS the doc -- the structured steps are supporting detail. The diagram must be accurate enough to serve as a standalone overview. -- [source: `05-CONTEXT.md` specifics section; user profile: "Think in flows", "Use ASCII data flow diagrams"]

- **Docs must survive regeneration without losing human contributions** -- The `[derived]`/`[authored]` ownership model means the doc agent must parse existing docs by heading anchors on every run, preserve authored sections, and only regenerate derived sections. This is a merge operation, not a full overwrite. If the agent cannot reliably distinguish derived from authored sections, it will destroy human work. -- [source: `05-CONTEXT.md` update strategy; First principles: the user explicitly designed ownership tags because they intend to add authored content that must persist]

- **The 3-pass validation is the doc agent's substitute for external review** -- Unlike the review layer (Phase 4) which has 4 external specialist reviewers, the doc agent validates its own output. The 3-pass structure (structural, referential, gate consistency) is the user's mechanism for catching hallucinated references, naming drift, and malformed docs without spawning additional agents. This means validation must be rigorous and not a rubber stamp. -- [First principles: the doc agent is the last stage before commit; there is no downstream checker]

### Scope Boundaries

**In scope:**
- Doc agent definition (reflect-and-write pattern, reads code + reviews + requirements) -- [source: `REQUIREMENTS.md` DOCS-01]
- Module doc generation (flat, 1:1 with source files) -- [source: `05-CONTEXT.md` directory structure]
- Flow narrative generation (capability-grouped, cross-module) -- [source: `05-CONTEXT.md` directory structure]
- Gate doc scaffolding with seed content (constraints, glossary, state) -- [source: `05-CONTEXT.md` gate docs role]
- 3-pass self-validation -- [source: `05-CONTEXT.md` self-validation section]
- Section ownership model (`[derived]`/`[authored]`) -- [source: `05-CONTEXT.md` update strategy]
- Discovery scoping (modified files + one-hop impact flagging) -- [source: `05-CONTEXT.md` discovery scope]
- Q&A review before commit -- [source: `05-CONTEXT.md` review gate]
- Doc-phase workflow: trigger after review acceptance, generate, validate, present, commit -- [source: `05-CONTEXT.md` trigger model]

**Out of scope:**
- Emergent docs (error taxonomy, change protocol, dependency manifest) -- explicitly deferred -- [source: `05-CONTEXT.md` deferred ideas]
- On-demand doc regeneration command -- possible future enhancement -- [source: `05-CONTEXT.md` deferred ideas]
- Gate doc content authoring beyond seed entries -- human responsibility -- [source: `05-CONTEXT.md` "human-maintained content"]
- Function-level API reference -- belongs in code -- [source: `05-CONTEXT.md` "Function-level reference stays in the code itself"]
- Full codebase scan -- never -- [source: `05-CONTEXT.md` discovery scope: "Never: full codebase scan"]

**Ambiguous:**
- How does the Q&A review work for docs? Phase 4's Q&A presents findings one-at-a-time with 5 response options. Does the doc Q&A follow the same pattern (one doc section at a time)? Or is it a full-doc approval (approve/reject per generated doc)? The user says "same pattern as plan-phase and review-phase" but doc output is structurally different from review findings.
- What happens when an authored section conflicts with regenerated derived sections? The CONTEXT.md says "flag conflicts" but does not specify the resolution workflow. Does the user get a Q&A prompt per conflict? Is it a blocking gate?
- How granular is "module"? Is it 1:1 with source files, or 1:1 with logical modules (which may span files)? The directory structure says "flat, 1:1 with code" but complex modules sometimes span multiple files. The user likely means 1:1 with files given their KISS preference.
- Does the doc agent run once (for the initial feature) or incrementally (each reviewed change updates existing docs)? The update strategy implies incremental, but the trigger model ("after review acceptance") could mean either. Given the `[derived]`/`[authored]` ownership model, incremental is the intended mode.

### Risk: Misalignment

- **ROADMAP.md says "per capability/feature" but CONTEXT.md says "modules/ and flows/"** -- The roadmap success criterion 2 says docs are "organized per capability/feature." But the CONTEXT.md directory structure organizes by `modules/` (flat, code-parallel) and `flows/` (capability-grouped). These are different organization schemes. The CONTEXT.md structure is more detailed and was decided later, so it should take precedence. The roadmap should be updated. -- [source: `ROADMAP.md` success criterion 2 vs `05-CONTEXT.md` directory structure]

- **DOCS-03 undersells the grep-optimization requirement** -- REQUIREMENTS.md DOCS-03 says "optimized for quick lookups and mgrep searches." The CONTEXT.md decisions go much further: strict heading templates, canonical anchor formats, ownership tags on every section, consistent naming. DOCS-03 as written could be satisfied by well-organized prose; the CONTEXT.md decisions demand a highly structured, machine-parseable format. Implementation should target the CONTEXT.md specificity. -- [source: `REQUIREMENTS.md` DOCS-03 vs `05-CONTEXT.md` heading templates, structural compliance]

- **Gate doc seeds may drift from CONTEXT.md if not implemented verbatim** -- The user provided exact seed content for constraints.md, glossary.md, and state.md template. These are not suggestions -- they are the initial content. If the implementation paraphrases or restructures these seeds, the gate docs will not match the user's expectation. Copy verbatim. -- [source: `05-CONTEXT.md` specifics section seed content]

- **"Same Q&A pattern" may not map cleanly to doc output** -- The plan-phase Q&A presents self-critique findings one at a time. The review-phase Q&A presents review findings one at a time. Doc output is fundamentally different: it is generated content, not findings. Presenting an entire module doc for yes/no approval is a different interaction than presenting a specific finding for accept/dismiss. The Q&A pattern may need adaptation rather than direct reuse. -- [First principles: the user wants control over doc commits, but the interaction shape differs from previous Q&A phases]

- **3-pass validation may be expensive in context window** -- Pass 2 (referential integrity) requires the agent to verify that module names match real code artifacts, exports actually exist, and dependencies resolve. Pass 3 requires reading gate docs. Combined with the generated docs themselves and the source code that was read for generation, this is a significant context window load. The agent definition needs to account for this -- either by running passes sequentially with targeted reads, or by accepting that validation is a separate agent invocation. -- [First principles: the user has been careful about token budgets in prior phases (AC-14 in Phase 4 capped agents at ~1500 tokens)]
