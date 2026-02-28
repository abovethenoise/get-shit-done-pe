## User Intent Findings

### Primary Goal

The user wants four framing-aware entry point commands (debug, new, enhance, refactor) that each run a distinct, lens-specific discovery conversation and then converge to the same artifact pipeline, plus an /init command that onboards both new and existing projects — so that every piece of work enters the system through the right thinking mode and exits through a consistent pipeline, with no stage skipping and no orphan tasks. -- [source: `.planning/ROADMAP.md` Phase 6 goal; `.planning/REQUIREMENTS.md` WKFL-01 through WKFL-07, INIT-01 through INIT-03; `06-CONTEXT.md` domain section]

---

### Acceptance Criteria

Derived from 06-CONTEXT.md decisions and REQUIREMENTS.md, each with a testable pass/fail condition:

**Framing Discovery (Lens System)**

- **AC-01: Four framing commands exist as distinct entry points** -- Pass: `/debug`, `/new`, `/enhance`, `/refactor` each exist as slash commands, each loads a distinct discovery workflow with framing-specific anchor questions. Fail: commands share a generic discovery flow or differ only in a flag/argument. -- [source: `REQUIREMENTS.md` WKFL-01; `06-CONTEXT.md` "Each lens has a distinct thinking mode"]

- **AC-02: Each lens has a distinct thinking mode, not just different questions** -- Pass: `/debug` operates in detective mode (convergent, narrowing, hypothesis elimination); `/new` in architect mode (exploratory, problem-space-first); `/enhance` in editor mode (pragmatic, surgical, seam-finding); `/refactor` in surgeon mode (risk-aware, load-bearing-walls-first). Fail: all four framings use identical cognitive flow with swapped question wording. -- [source: `06-CONTEXT.md` framing thinking modes section]

- **AC-03: Fixed anchor questions plus adaptive branching per lens** -- Pass: each lens has 3-5 non-negotiable anchor questions (the "skeleton") and branches adaptively based on answers (the "muscles"). Fail: all questions are static (no adaptation) or all questions are adaptive (no fixed skeleton). -- [source: `06-CONTEXT.md` "Fixed skeleton, adaptive muscles"; specifics section]

- **AC-04: Minimum Viable Understanding (MVU) completion conditions are lens-specific** -- Pass: `/debug` exits discovery when symptom + reproduction path + at least one falsifiable hypothesis are captured. `/new` exits when problem + who it's for + done criteria + key constraints are captured. `/enhance` exits when current behavior + desired behavior + delta are captured. `/refactor` exits when current design + target design + what breaks during transition are captured. Fail: discovery exits on a universal completion condition not tied to the specific lens. -- [source: `06-CONTEXT.md` MVU per lens section]

- **AC-05: Three exit signals with distinct handling** -- Pass: MVU met triggers system-proposed proceed; user override flags missing slots and proceeds with explicit assumptions; diminishing returns (circling detected) halts and offers pivot. Fail: only one exit path exists (e.g., always user-initiated, or always auto-proceed on MVU). -- [source: `06-CONTEXT.md` "Three exit signals" decision]

- **AC-06: Summary playback before transitioning** -- Pass: before handing off to requirements, the system produces a summary of what was understood and asks for confirmation. "Wait, I forgot..." moments are explicitly elicited. Fail: discovery transitions to requirements without a playback step. -- [source: `06-CONTEXT.md` "Always summarize before transitioning"]

- **AC-07: Skip/fast-track available** -- Pass: user can provide `--skip` argument or signal rich upfront context during Q&A to converge discovery quickly. Fail: skip/fast-track is not available, forcing full Q&A even when context is already clear. -- [source: `06-CONTEXT.md` "Skip/fast-track available as Q&A option or command argument"]

- **AC-08: Lens misclassification detection at start and mid-discovery** -- Pass: light classification check occurs at command invocation; anchor questions can surface misfit and offer to switch lens mid-discovery. Fail: no misclassification detection; lens is locked once the command is issued. -- [source: `06-CONTEXT.md` "Both upfront validation and mid-discovery pivot"]

- **AC-09: Cross-framing detection** -- Pass: `/new` detects when user is describing existing functionality and offers to pivot to `/enhance`. Similar cross-framing triggers exist for other combinations. Fail: framings are siloed and never suggest switching even when user's description clearly fits a different lens. -- [source: `06-CONTEXT.md` "Cross-framing detection: /new pivoting to /enhance when user describes overlapping existing capability"]

- **AC-10: Compound work handled with primary + secondary lens model** -- Pass: when work spans two framings (e.g., enhance with a refactor component), primary lens leads the discovery and secondary lens informs it. Both are captured in the Discovery Brief. Fail: compound work either forces the user to run two separate commands or flattens to a single lens without acknowledging the secondary. -- [source: `06-CONTEXT.md` "Primary + secondary lens model"]

**Discovery Brief**

- **AC-11: Discovery produces a structured Discovery Brief** -- Pass: every completed discovery produces a brief with all required sections: Meta (lens, secondary lens, completion type, timestamp), Problem Statement (one sentence), Context, Specification (shape varies by lens), Unknowns & Assumptions, Scope Boundary. Fail: discovery produces unstructured notes or a partial brief missing any required section. -- [source: `06-CONTEXT.md` Discovery Brief schema; `REQUIREMENTS.md` WKFL-06 "converge to same artifact pipeline"]

- **AC-12: Problem Statement is one sentence or discovery is not done** -- Pass: the Problem Statement field in every brief contains exactly one sentence. Fail: the Problem Statement is a paragraph, a list, or is marked "TBD." -- [source: `06-CONTEXT.md` "One sentence. If you can't, discovery isn't done."]

- **AC-13: Specification section shape varies by lens** -- Pass: `/debug` spec contains symptom, reproduction_path, hypothesis, evidence fields. `/new` spec contains capability_definition, boundaries, constraints, success_criteria. `/enhance` spec contains current_behavior, desired_behavior, delta, invariants. `/refactor` spec contains current_design, target_design, migration_risk, behavioral_invariants. Fail: all lenses produce the same specification structure. -- [source: `06-CONTEXT.md` Discovery Brief specification section schema]

**Pipeline Convergence**

- **AC-14: All framings converge to the same pipeline after discovery** -- Pass: requirements → plan → execute → review → documentation runs identically regardless of which framing entered. Fail: any framing has a shortened pipeline, skips a stage, or uses a different artifact format. -- [source: `REQUIREMENTS.md` WKFL-06; `06-CONTEXT.md` "Always full pipeline: Every run goes through all stages"]

- **AC-15: Research agents are lens-aware** -- Pass: after discovery, research agents receive the lens metadata from the brief and adjust focus accordingly (debug prioritizes reproduction environment; refactor prioritizes dependency mapping). Fail: research agents receive only the problem statement with no lens context. -- [source: `06-CONTEXT.md` "Research agents still run... lens-aware — they receive lens metadata"]

- **AC-16: Auto-generated requirements with user review** -- Pass: after discovery, system drafts 3-layer requirements (end-user, functional, technical) from the brief. User reviews before finalization. Fail: user must write requirements from scratch, or requirements are auto-finalized without review. -- [source: `06-CONTEXT.md` "Auto-generate requirements, user reviews"]

- **AC-17: Requirements weight varies by lens** -- Pass: `/debug` requirements are thin on end-user and rich on technical. `/new` requirements are rich on end-user and thin on technical. Weight difference is visible in generated requirements. Fail: all framings produce uniform-weight 3-layer requirements. -- [source: `06-CONTEXT.md` "weight varies by lens (/debug has thin EU and rich TC; /new has rich EU and thin TC)"]

- **AC-18: Framing shapes pipeline behavior at every stage** -- Pass: plan stage uses lens risk posture and decomposition strategy; execute stage uses lens solution approach and aggressiveness; review stage uses lens-specific definition of done and regression watchpoints. Fail: framing is consumed only during discovery and has no influence on downstream stages. -- [source: `06-CONTEXT.md` "Lens-aware pipeline — framing shapes behavior at every stage"]

- **AC-19: Review receives three inputs including the brief** -- Pass: review stage receives requirements (the contract), lens metadata (the disposition), and the original brief (the intent). Fail: review receives only requirements, losing the intent dimension needed to catch spec-complete-but-problem-incomplete work. -- [source: `06-CONTEXT.md` "Review receives three inputs"; specifics: "Does this actually solve the original problem?"]

- **AC-20: Reflect = Phase 5 doc agent, no new stage** -- Pass: after review acceptance, Phase 5's doc-phase workflow runs as the final pipeline step. No separate "reflect" command exists. Fail: a new reflect stage is added that duplicates or competes with the doc agent. -- [source: `06-CONTEXT.md` "Reflect = Phase 5's doc agent... Not a new stage — it's Phase 5 wired as the final pipeline step"]

**Universal Escalation**

- **AC-21: Every pipeline stage can push back upstream** -- Pass: every stage (discovery, requirements, plan, execute, review, documentation) has a mechanism to escalate issues back upstream using the 3-tier severity model. Fail: escalation only exists at one or two stages. -- [source: `06-CONTEXT.md` Universal Escalation Protocol section; `REQUIREMENTS.md` WKFL-06 by implication]

- **AC-22: Three-tier severity model is consistent across all stages** -- Pass: minor = flag + continue; moderate = pause + surface to user + propose amendment; major = halt + recommend return to specific stage. Same mechanism regardless of which stage triggers it. Fail: severity tiers differ per stage, or stages use different escalation vocabulary. -- [source: `06-CONTEXT.md` Universal Escalation Protocol schema]

- **AC-23: Major escalation is propose-and-confirm, not auto-return** -- Pass: when a major issue is detected, the system proposes returning to a specific stage and waits for user confirmation before restarting. Fail: system auto-returns without user confirmation, or presents the return as a question without recommending a specific target stage. -- [source: `06-CONTEXT.md` "Major issue handling: Propose and confirm"]

**Project Initialization (/init)**

- **AC-24: Single /init command auto-detects new vs existing** -- Pass: running `/init` in a directory with an existing codebase triggers existing-project flow. Running it in an empty directory triggers new-project flow. Ambiguous cases ask one clarifying question. Fail: separate commands exist for new vs existing, or mode must be passed as an argument. -- [source: `06-CONTEXT.md` "Single command, auto-detects mode"]

- **AC-25: New-project flow: deep Q&A then capability mapping** -- Pass: new-project mode runs deep upfront discovery (goals, opinions, constraints, architecture approach) and outputs PROJECT.md + capability map. Stops at capability level (no features yet). Fail: new-project mode produces features directly, or skips capability mapping, or produces only PROJECT.md with no capability structure. -- [source: `REQUIREMENTS.md` INIT-01; `06-CONTEXT.md` new-project flow]

- **AC-26: Existing-project flow runs three sequential phases** -- Pass: Phase 1 automated scan produces System Understanding Draft. Phase 2 user validation presents findings section-by-section for confirmation. Phase 3 fills gaps scan couldn't determine. All three run in order. Fail: phases are collapsed, skipped, or presented all-at-once. -- [source: `06-CONTEXT.md` "Existing-project — three phases"]

- **AC-27: Existing-project validation sections are independent** -- Pass: confirming tech stack does not depend on confirming architecture; user can confirm sections in any order. Fail: validation requires sequential section completion or presents sections as dependent. -- [source: `06-CONTEXT.md` "Init validation sections are independent"; specifics section]

- **AC-28: /init writes incrementally, supports resume** -- Pass: each phase writes its output as it completes (not all-at-once). Partial /init runs can be detected and resumed. Fail: /init writes only at completion, losing work on interruption. -- [source: `06-CONTEXT.md` "Incremental writes: Each phase writes output as it goes"; "Re-running /init detects partial run and offers resume"]

- **AC-29: /init outputs PROJECT.md + capability map + .documentation/ files** -- Pass: /init produces at minimum PROJECT.md, a capability map (structured list of identified capabilities), and seeds the .documentation/ structure. Fail: /init produces only PROJECT.md with no capability or documentation structure. -- [source: `06-CONTEXT.md` "/init output" section]

**Discussion Commands**

- **AC-30: discuss-capability sets WHAT and WHY, is optional and repeatable** -- Pass: discuss-capability can be invoked before any lens command, multiple times, and enriches the capability file in .documentation/capabilities/. It does not trigger the pipeline. Fail: discuss-capability auto-triggers the pipeline or is restricted to one invocation per capability. -- [source: `06-CONTEXT.md` discuss-capability role: "Optional and repeatable"]

- **AC-31: discuss-capability can kill ideas** -- Pass: discuss-capability can conclude "don't build this" and mark the capability as killed/deferred with reasoning. Fail: discuss-capability always ends with a suggestion to proceed; it cannot kill ideas. -- [source: `REQUIREMENTS.md` INIT-03 partial; `06-CONTEXT.md` "Can kill ideas... Not just refinement"]

- **AC-32: discuss-capability raises cross-cutting concerns naturally** -- Pass: the command intuits cross-capability concerns from the capability map and raises them without a separate command being needed. Fail: cross-capability concerns are only surfaced if the user explicitly asks. -- [source: `06-CONTEXT.md` "Cross-capability awareness: Intuits cross-cutting concerns from the capability map"]

- **AC-33: discuss-feature can route backward as well as forward** -- Pass: discuss-feature can route backward to the plan stage (if feature doesn't make sense) or all the way back to discuss-capability (if the feature reveals capability misconception). Fail: discuss-feature is a one-way gate that always leads to execute. -- [source: `06-CONTEXT.md` "Backward routing: Usually → execute. Sometimes → back to plan or discuss-capability"]

**Fuzzy Resolution**

- **AC-34: All commands accept natural language references** -- Pass: `/debug the drill timing thing` resolves to the correct capability/feature from the project model without requiring exact IDs. Fail: commands require exact capability or feature IDs. -- [source: `06-CONTEXT.md` Fuzzy Resolution section]

- **AC-35: Ambiguous matches present top 3 options** -- Pass: when input matches multiple capabilities/features, system presents the top 3 candidates and user picks. Fail: system picks a match silently, or errors on ambiguity, or presents all matches without ranking. -- [source: `06-CONTEXT.md` "Multiple matches: present top 3, user picks"]

- **AC-36: No match creates or clarifies** -- Pass: when no match exists, system asks user to clarify or create new. Fail: no-match silently fails or auto-creates without user confirmation. -- [source: `06-CONTEXT.md` "No match: ask user to clarify or create new"]

**Supporting Commands**

- **AC-37: /status provides project-wide dashboard** -- Pass: /status shows current capability, current feature, pipeline position, and cross-feature dependencies. Fail: /status shows only the current feature in progress. -- [source: `06-CONTEXT.md` Command Inventory table; `REQUIREMENTS.md` FOUND-02 extended by v2 decisions]

- **AC-38: /resume detects interrupted state without arguments** -- Pass: /resume reads STATE.md and picks up from the correct pipeline stage without user needing to specify where they were. Fail: /resume requires the user to specify a stage, capability, or feature. -- [source: `06-CONTEXT.md` Command Inventory: "/resume — detects state — input: None"]

- **AC-39: /plan and /review are available as explicit manual triggers** -- Pass: /plan can be invoked directly with approved requirements; /review can be invoked with completed work. Both are available outside the auto-pipeline for cases where the user wants direct control. Fail: planning and review can only be triggered via the full pipeline; no direct entry points exist. -- [source: `06-CONTEXT.md` Command Inventory: /plan and /review entries]

**End-to-End Integration**

- **AC-40: Full end-to-end test passes** -- Pass: one capability, one feature, completes the full path: discovery (any framing) → requirements → plan → execute → review → documentation. All artifacts are present and correctly linked. Fail: any stage fails, produces an artifact incompatible with the next stage, or the pipeline breaks at handoff. -- [source: `ROADMAP.md` Phase 6 success criterion 5]

---

### Implicit Requirements

- **Discovery is a conversation, not a form** -- The 06-CONTEXT.md describes "adaptive muscles" that branch based on answers. This implies the system conducts real Q&A (asking one question, receiving an answer, adapting the next question) rather than presenting a static form for the user to fill in. The implementation must use conversational Q&A patterns consistent with Phase 3's self-critique loop and Phase 4's finding presentation — not a batch questionnaire. -- [First principles: the user has consistently required Q&A patterns over form patterns across all prior phases; "AskUserQuestion" is the established mechanism; adaptive branching requires seeing the answer before choosing the next question]

- **Framing context must propagate through the entire pipeline, not just discovery** -- AC-18 captures that framing shapes pipeline behavior. But the underlying implicit requirement is that the Discovery Brief must travel with the work as a live artifact, not be consumed and discarded after discovery. Every downstream stage (requirements, plan, review) needs to read the brief. The brief is the framing's persistent carrier. -- [First principles: if framing shapes behavior at every stage but is only captured in discovery, downstream stages cannot act on it without re-reading the original brief; the brief schema's `primary_lens` and `secondary_lens` fields exist exactly for this propagation]

- **The /init existing-project scan must be a parallel research operation** -- The three-phase existing-project flow (scan → validate → gap fill) implies Phase 1 is automated. Given the project's established gather-synthesize pattern (Phase 2 agent framework) and the scope of what must be discovered (structure, stack, entry points, dependency graph, data models, patterns), this scan should use the gather-synthesize workflow from Phase 2, not a sequential single-agent scan. The CONTEXT.md says "automated scan" but doesn't specify single vs parallel. -- [First principles: a single agent scanning all of structure + stack + entry points + dependency graph + data models + patterns sequentially would exceed context window; the gather-synthesize pattern is the established solution for parallel information gathering; REQUIREMENTS.md INIT-02 says "parallel research discovers existing capabilities/features"]

- **Capability files are progressive — sections fill in over time** -- The discuss-capability output schema shows sections marked (empty) that fill in as the capability moves through the pipeline. This means capability files are not created complete; they are seeded at capability-mapping time and grown. The /init command must create capability file shells with correct empty structure, not wait until features are planned to create capability files. -- [source: `06-CONTEXT.md` "Capability files grow progressively — sections fill in as the capability moves through the pipeline"; specifics section]

- **WKFL-07 ("framing context injection") is a workflow responsibility, not an agent responsibility** -- The requirement says "same agents receive different question sets based on active framing." This means agent definitions must NOT be duplicated per framing. The workflow layer is responsible for injecting the framing-specific question sets at spawn time. This architectural constraint has an implementation implication: agent definitions need injection slots (placeholder sections that workflows populate), not hardcoded framing logic. -- [source: `REQUIREMENTS.md` WKFL-07; `06-CONTEXT.md` "Claude's Discretion" section preserves agent uniformity; `06-CONTEXT.md` "same agents receive different question sets"]

- **The 11 commands must share a coherent naming and invocation convention** -- The CONTEXT.md lists 11 commands. Given the existing naming pattern (`gsd:<command>`) and the KISS principle, all 11 should follow the same invocation convention. Commands that are workflow entry points (debug, new, enhance, refactor) share the pattern `/gsd:<verb> [fuzzy-reference]`; discussion commands share `/gsd:discuss-<noun> [fuzzy-reference]`; utility commands share `/gsd:<noun>`. No command should require different argument syntax from its category peers. -- [First principles: inconsistent invocation patterns create friction for a non-engineering user; the existing codebase uses consistent `gsd:<command>` naming]

- **State persistence between pipeline stages requires STATE.md discipline** -- The pipeline (discovery → requirements → plan → execute → review → documentation) spans multiple context resets. Between each stage, the system must write enough state to STATE.md that /resume can detect exactly where work is and what artifacts exist. "Incremental writes" in the /init context applies to the full pipeline too. -- [source: `REQUIREMENTS.md` FOUND-02 "STATE.md tracks current capability, current feature, and cross-feature state"; `06-CONTEXT.md` /init incremental writes; `PROJECT.md` "STATE.md for persistent project memory across context resets"]

- **The Discovery Brief format must be a template, not free-form** -- Given that the Discovery Brief is the contract between discovery and the rest of the pipeline, and that downstream stages (requirements generation, review, documentation) must read it programmatically, the brief format must be a canonical template written to a known file path with known field names. The CONTEXT.md shows the schema but does not specify the file name or location. The implementation must define a stable path (e.g., `DISCOVERY-BRIEF.md` within the capability directory). -- [First principles: structured data feeding downstream stages requires predictable format; the PLAN.md format precedent shows this project uses canonical templates for all pipeline artifacts]

---

### Scope Boundaries

**In scope:**
- Four framing commands: `/gsd:debug`, `/gsd:new`, `/gsd:enhance`, `/gsd:refactor` -- [source: `REQUIREMENTS.md` WKFL-01]
- Framing-specific discovery workflows for each command -- [source: `REQUIREMENTS.md` WKFL-02 through WKFL-05]
- Discovery Brief artifact and its lens-specific specification schemas -- [source: `06-CONTEXT.md` Discovery Brief section]
- Pipeline convergence wiring: discovery → requirements auto-draft → plan → execute → review → documentation -- [source: `REQUIREMENTS.md` WKFL-06]
- Framing context injection mechanism (workflow-level, not agent-level) -- [source: `REQUIREMENTS.md` WKFL-07]
- Universal escalation protocol (3-tier severity, propose-and-confirm for major) -- [source: `06-CONTEXT.md` Universal Escalation Protocol]
- `/gsd:init` command with auto-detection and both new-project and existing-project flows -- [source: `REQUIREMENTS.md` INIT-01, INIT-02]
- Existing-project scan using gather-synthesize pattern -- [source: `REQUIREMENTS.md` INIT-02]
- discuss-capability command building out capability files -- [source: `REQUIREMENTS.md` INIT-03]
- discuss-feature command with backward routing capability -- [source: `06-CONTEXT.md` discuss-feature decisions]
- Supporting commands: /status, /resume, /plan, /review -- [source: `06-CONTEXT.md` Command Inventory]
- Fuzzy resolution: natural language → capability/feature from project model -- [source: `06-CONTEXT.md` Fuzzy Resolution section]
- End-to-end integration test: one capability, one feature, full pipeline -- [source: `ROADMAP.md` Phase 6 success criterion 5]

**Out of scope:**
- Auto-advance through pipeline stages without user confirmation -- [source: `REQUIREMENTS.md` out of scope table]
- Real-time collaboration or multi-user support -- [source: `REQUIREMENTS.md` out of scope table]
- New agent definitions (agents were defined in Phase 2; this phase wires them into workflows) -- [First principles: WKFL-07 requires framing injection at workflow level, not new agents]
- Framing-specific question wording (Claude's discretion per 06-CONTEXT.md) -- [source: `06-CONTEXT.md` Claude's Discretion section]
- Exact MVU slot detection and saturation checking algorithms (Claude's discretion) -- [source: `06-CONTEXT.md` Claude's Discretion section]
- Multi-runtime support (Gemini CLI, OpenCode, Codex) -- [source: `REQUIREMENTS.md` v2 out of scope; `PROJECT.md` "Claude Code as primary target"]
- v1 command cleanup and dead-code removal (Phase 7) -- [source: `ROADMAP.md` Phase 7]
- gsd migrate command (v2 requirements, separate scope) -- [source: `REQUIREMENTS.md` MIGR-01]

**Ambiguous:**
- How many plans does Phase 6 require? ROADMAP.md says "Plans: TBD" with placeholders for 06-01, 06-02, 06-03. The scope (11 commands, 4 framing workflows, /init with 3-phase flow, 2 discussion commands, 5 supporting commands, end-to-end integration) suggests more than 3 plans. The planner must decompose carefully.
- Does /plan (the command) trigger the gather-synthesize research step, or does it go directly to the planner? The 06-CONTEXT.md specifies research agents still run after discovery, but /plan is also listed as a direct trigger with "approved requirements" as input. If requirements are already approved, has research already run?
- Does /status read live from .planning/ artifacts or from STATE.md? The CONTEXT.md says "project-wide dashboard" but doesn't specify the data source. Reading from STATE.md would be fast but stale; reading from .planning/ directly would be accurate but slow.
- Who owns framing injection for the review stage? Phase 4 built injection slots; Phase 6 was supposed to populate them (per the Phase 4 user intent findings). The Phase 6 CONTEXT.md confirms framing shapes review behavior, but does not explicitly assign the populate-injection-slots task to Phase 6. This needs explicit confirmation during planning.
- How does the pipeline handle the transition from the discuss-feature command back to execute? Is /plan re-invoked explicitly, or does discuss-feature produce output that auto-triggers plan re-run?

---

### Risk: Misalignment

- **WKFL-02 through WKFL-05 describe discovery but not the full pipeline** -- REQUIREMENTS.md WKFL-02 through WKFL-05 describe only the discovery phase for each framing (e.g., "Enhance framing discovery: assess what's working → identify what needs improvement → align → converge to pipeline"). WKFL-06 covers convergence. But the requirements do not capture the framing's influence on the pipeline after discovery -- which the CONTEXT.md decisions explicitly require (AC-18). The CONTEXT.md decisions are more complete than the requirements. Implementation should follow CONTEXT.md. -- [source: `REQUIREMENTS.md` WKFL-02 through WKFL-05 vs `06-CONTEXT.md` "Lens-aware pipeline — framing shapes behavior at every stage"]

- **"All framings converge to same pipeline" could be read as "identical pipeline"** -- WKFL-06 says "All framings converge to same artifact pipeline." The CONTEXT.md clarifies that the pipeline stages are the same but behavior within each stage differs by framing (risk posture in plan, aggressiveness in execute, definition of done in review). If this distinction is lost, Phase 6 will wire a uniform pipeline where framing is irrelevant after discovery -- which is not what the user wants. -- [source: `REQUIREMENTS.md` WKFL-06 vs `06-CONTEXT.md` "Lens-aware pipeline" subsection]

- **INIT-03 describes discuss-capability narrowly** -- REQUIREMENTS.md INIT-03 says "Discuss-capability command builds out features from a mapped capability." But the CONTEXT.md decisions expand discuss-capability significantly: it can kill ideas, it has cross-capability awareness, it operates on the WHAT and WHY level (not feature definition), and it is upstream of lens workflows. The requirement undersells the command's role. Implementation must target CONTEXT.md scope. -- [source: `REQUIREMENTS.md` INIT-03 vs `06-CONTEXT.md` discuss-capability decisions]

- **The "full pipeline" for existing-project /init is unclear** -- REQUIREMENTS.md INIT-02 says "understands goals + opinions → parallel research discovers existing capabilities/features → Q&A to confirm/adjust → identify new capabilities/features/improvements." The CONTEXT.md describes the three phases in more detail. But neither source specifies how existing capabilities are distinguished from new ones, or whether the output is a flat list of capabilities or a structured capability map with statuses. If the output format is not specified, the planner may produce an artifact incompatible with what downstream commands (discuss-capability, framing commands) expect to read. -- [First principles: downstream commands fuzzy-resolve from "the project model"; /init must produce a project model with a known format for fuzzy resolution to work]

- **Plan-to-execute handoff format assumed from Phase 3** -- The CONTEXT.md says "Plan format carries forward from Phase 3: 5-field task structure with wave ordering and YAML frontmatter." Phase 3 is listed as complete in ROADMAP.md. But Phase 3 plans are marked as not-started in the roadmap progress table. If Phase 3 has not been executed yet, the plan format may differ from what Phase 6 expects. Phase 6 planning must verify Phase 3's actual output format before assuming the 5-field task structure. -- [source: `ROADMAP.md` progress table showing Phase 3 "Not started"; `06-CONTEXT.md` "Plan-to-execute handoff" section]

- **Discuss-feature's backward routing to plan could create a loop** -- The CONTEXT.md says discuss-feature can route backward to the plan stage or discuss-capability. If discuss-feature routes to plan, and plan produces new features, and a feature triggers discuss-feature, the system could loop indefinitely. The escalation protocol's major-issue handling ("propose and confirm") is the intended circuit breaker, but this interaction between discuss-feature and the universal escalation protocol is not explicitly defined. -- [source: `06-CONTEXT.md` discuss-feature "Backward routing" vs Universal Escalation Protocol — no explicit loop termination rule]
