---
phase: 06-workflows-and-commands
verified: 2026-02-28T00:00:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 6: Workflows and Commands Verification Report

**Phase Goal:** The full pipeline is orchestrated end-to-end through framing-aware workflows (debug/new/enhance/refactor) that share a common artifact pipeline, plus initialization commands that set up new and existing projects
**Verified:** 2026-02-28
**Status:** PASSED
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A Discovery Brief template exists with lens-specific Specification sections | VERIFIED | `get-shit-done/templates/discovery-brief.md` — YAML frontmatter `type: discovery-brief`, all 6 sections, 4 lens variants as commented blocks |
| 2 | Each framing has 3-5 anchor questions embodying its thinking mode | VERIFIED | All 4 files exist with exactly 5 questions each, annotated with Purpose and Branching hints, correct directional flows |
| 3 | A framing-lenses reference doc defines MVU completion conditions per lens | VERIFIED | `get-shit-done/references/framing-lenses.md` — 4 lens definitions, MVU slot tables with completion criteria, exit signals, cross-framing detection, compound work precedence, brief reset rules, summary playback |
| 4 | fillTemplate() scaffolds discovery briefs from the template | VERIFIED | `template.cjs` has `case 'discovery-brief'` in both `cmdTemplateFill` and `fillTemplate()` with variable substitution for capability, lens, date |
| 5 | Four slash commands invoke framing-discovery workflow with their lens identifier | VERIFIED | `commands/gsd/{debug,new,enhance,refactor}.md` all reference `@~/.claude/get-shit-done/workflows/framing-discovery.md` and pass `LENS={lens}` |
| 6 | Discovery workflow runs lens-specific Q&A, tracks MVU slots, produces a Discovery Brief | VERIFIED | `framing-discovery.md` has 10-step process: init -> fuzzy resolve -> status check -> scaffold brief -> lens check -> load questions -> Q&A loop with per-field MVU tracking -> mandatory summary playback -> finalize brief -> pipeline handoff |
| 7 | init framing-discovery returns lens metadata, capability context, question file paths, brief template path | VERIFIED | `cmdInitFramingDiscovery` in `init.cjs` returns: `lens`, `mvu_slots`, `anchor_questions_path`, `anchor_questions_exists`, `framing_lenses_path`, `brief_template_path`, `capability`, `capability_status`, `brief_path`, `capability_list`, `capability_count`, `commit_docs` |
| 8 | Lens misclassification checked at start and mid-discovery with pivot option | VERIFIED | Steps 5 (upfront) and 7 (mid, after Q3) in `framing-discovery.md`; pivot resets Specification section, re-runs init for new lens |
| 9 | Summary playback is mandatory before transitioning out of discovery | VERIFIED | Step 8 explicitly marked "This step is NOT optional." with AskUserQuestion for confirmation/corrections |
| 10 | After discovery, all framings converge to the same 6-stage pipeline | VERIFIED | `framing-pipeline.md` orchestrates: research -> requirements (lens-weighted EU/FN/TC) -> plan -> execute -> review (3-input model) -> reflect (doc-phase) |
| 11 | Every pipeline stage can escalate upstream via 3-tier escalation protocol | VERIFIED | `escalation-protocol.md` defines minor/moderate/major tiers with per-stage examples (2-3 per tier per stage), loop termination (1 backward reset max), propose-and-confirm for major |
| 12 | /init auto-detects new vs existing project mode and runs appropriate flow | VERIFIED | `init-project.md` — auto-detection in Step 1 via `gsd-tools init project`; new-project flow (Q&A -> PROJECT.md + capability map + .documentation/); existing-project flow (6-dimension parallel scan via gather-synthesize -> validation -> gap fill -> same outputs) |
| 13 | discuss-capability explores WHAT/WHY, enriches capability file, can kill/defer, detects cross-capability concerns | VERIFIED | `discuss-capability.md` 7-step workflow: fuzzy resolve -> status check -> cross-capability scan -> guided exploration (core idea/boundaries/open questions/suggested lens) -> kill/defer detection -> update `.documentation/capabilities/{slug}.md` |
| 14 | discuss-feature explores HOW with backward routing when feature reveals capability misconception | VERIFIED | `discuss-feature.md` has `backward_routing` step detecting 4 trigger conditions, offers route to discuss-capability or replan; feature notes target `.planning/capabilities/{cap}/features/{feat}/requirements/` |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/templates/discovery-brief.md` | Discovery Brief template with 6 sections, 4 lens variants | VERIFIED | All sections present, lens variants as commented blocks, correct YAML frontmatter |
| `get-shit-done/framings/debug/anchor-questions.md` | 5 detective-mode questions (symptom -> root cause) | VERIFIED | 5 questions, backward direction, MVU slots declared, branching hints |
| `get-shit-done/framings/new/anchor-questions.md` | 5 architect-mode questions (why -> shape) | VERIFIED | 5 questions, forward direction, problem/who/done_criteria/constraints coverage |
| `get-shit-done/framings/enhance/anchor-questions.md` | 5 editor-mode questions (current state -> fit) | VERIFIED | 5 questions, outward direction, current_behavior/desired_behavior/delta coverage |
| `get-shit-done/framings/refactor/anchor-questions.md` | 5 surgeon-mode questions (current design -> migration) | VERIFIED | 5 questions, underneath direction, current_design/target_design/breakage coverage |
| `get-shit-done/references/framing-lenses.md` | 4 lens definitions, MVU slots, exit signals, cross-framing rules | VERIFIED | All 4 lenses with MVU tables, 3 exit signals, cross-framing detection rules (upfront + mid), compound work table, brief reset rules, summary playback spec |
| `get-shit-done/bin/lib/template.cjs` | fillTemplate() with discovery-brief type support | VERIFIED | `case 'discovery-brief'` in both `cmdTemplateFill` and `fillTemplate()` inner switch |
| `get-shit-done/workflows/framing-discovery.md` | Shared discovery workflow with full Q&A engine | VERIFIED | 10 steps: init, fuzzy resolve (substring matching), status check, scaffold brief, upfront lens check, load questions, Q&A with MVU tracking + 3 exit signals, mandatory summary playback, finalize, pipeline handoff |
| `commands/gsd/debug.md` | /gsd:debug slash command, lens=debug | VERIFIED | Correct frontmatter, references framing-discovery.md, passes LENS=debug |
| `commands/gsd/new.md` | /gsd:new slash command, lens=new | VERIFIED | Correct frontmatter, references framing-discovery.md, passes LENS=new |
| `commands/gsd/enhance.md` | /gsd:enhance slash command, lens=enhance | VERIFIED | Correct frontmatter, references framing-discovery.md, passes LENS=enhance |
| `commands/gsd/refactor.md` | /gsd:refactor slash command, lens=refactor | VERIFIED | Correct frontmatter, references framing-discovery.md, passes LENS=refactor |
| `get-shit-done/bin/lib/init.cjs` (framing-discovery) | cmdInitFramingDiscovery returning lens metadata + capability context | VERIFIED | Function at line 899, validates lens, resolves capability, builds capability_list, returns all fields workflow expects |
| `get-shit-done/bin/gsd-tools.cjs` (framing-discovery) | Dispatcher case for init framing-discovery | VERIFIED | `case 'framing-discovery'` at line 564 dispatches to `cmdInitFramingDiscovery(cwd, args[2], args[3], raw)` |
| `get-shit-done/workflows/framing-pipeline.md` | Post-discovery 6-stage pipeline with lens-aware context injection | VERIFIED | 9 sections covering all 6 stages, lens-aware guidance per stage, requirements weighting table, 3-input review, escalation handling, propose-and-confirm for major issues |
| `get-shit-done/references/escalation-protocol.md` | 3-tier escalation with per-stage examples, loop termination, propose-and-confirm | VERIFIED | Minor/Moderate/Major tiers, 2-3 examples per tier per stage (Research, Requirements, Plan, Execute, Review), budget counter, propose-and-confirm flow diagram |
| `get-shit-done/workflows/init-project.md` | Init workflow with auto-detection, both flows, incremental writes | VERIFIED | Auto-detection via gsd-tools, new-project Q&A (3a-3f), existing-project scan via gather-synthesize (4a-4f), incremental writes to init-state.json at each step, partial-run resume |
| `commands/gsd/init.md` | /gsd:init slash command | VERIFIED | Correct frontmatter (name: gsd:init), references init-project.md, gather-synthesize.md, questioning.md |
| `get-shit-done/bin/lib/init.cjs` (project) | cmdInitProject: auto-detects mode, returns mode + project context + partial-run state | VERIFIED | Function at line 805, filesystem detection for code + .planning, partial-run detection via init-state.json, returns `detected_mode`, `planning_exists`, `code_exists`, `partial_run` |
| `get-shit-done/bin/gsd-tools.cjs` (project) | Dispatcher case for init project | VERIFIED | `case 'project'` at line 561 dispatches to `cmdInitProject(cwd, raw)` |
| `get-shit-done/workflows/discuss-capability.md` | Discuss workflow: fuzzy resolve, WHAT/WHY exploration, kill/defer, cross-capability awareness | VERIFIED | 7 named steps, cross-capability scan before exploration, kill/defer detection during discussion, updates `.documentation/capabilities/{slug}.md` |
| `commands/gsd/discuss-capability.md` | /gsd:discuss-capability slash command | VERIFIED | Correct frontmatter (name: gsd:discuss-capability), references discuss-capability.md workflow |
| `get-shit-done/workflows/discuss-feature.md` | Discuss workflow: fuzzy resolve, HOW exploration, backward routing, requirements target | VERIFIED | 7 named steps including `backward_routing` step, backward routing to discuss-capability or replan, targets `.planning/capabilities/{cap}/features/{feat}/requirements/` |
| `commands/gsd/discuss-feature.md` | /gsd:discuss-feature slash command | VERIFIED | Correct frontmatter (name: gsd:discuss-feature), references discuss-feature.md workflow |
| `get-shit-done/bin/lib/init.cjs` (discuss-capability) | cmdInitDiscussCapability returning capability context | VERIFIED | Function at line 1112, returns capability_list, doc_capabilities, documentation_dir, capabilities_dir, file existence flags |
| `get-shit-done/bin/lib/init.cjs` (discuss-feature) | cmdInitDiscussFeature returning feature context | VERIFIED | Function at line 1174, returns capability_list and feature_list for fuzzy matching |
| `get-shit-done/bin/gsd-tools.cjs` (discuss-*) | Dispatcher cases for discuss-capability and discuss-feature | VERIFIED | `case 'discuss-capability'` at line 567, `case 'discuss-feature'` at line 570 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `commands/gsd/debug.md` | `get-shit-done/workflows/framing-discovery.md` | `@-reference; passes lens=debug` | WIRED | `@~/.claude/get-shit-done/workflows/framing-discovery.md` in execution_context; `LENS=debug` in context block |
| `commands/gsd/new.md` | `get-shit-done/workflows/framing-discovery.md` | `@-reference; passes lens=new` | WIRED | Same pattern |
| `commands/gsd/enhance.md` | `get-shit-done/workflows/framing-discovery.md` | `@-reference; passes lens=enhance` | WIRED | Same pattern |
| `commands/gsd/refactor.md` | `get-shit-done/workflows/framing-discovery.md` | `@-reference; passes lens=refactor` | WIRED | Same pattern |
| `get-shit-done/workflows/framing-discovery.md` | `get-shit-done/framings/*/anchor-questions.md` | reads lens-specific anchor questions from path returned by init | WIRED | Step 6 reads `anchor_questions_path` from init output |
| `get-shit-done/workflows/framing-discovery.md` | `get-shit-done/references/framing-lenses.md` | `@-reference` in required_reading | WIRED | `@~/.claude/get-shit-done/references/framing-lenses.md` in `<required_reading>` |
| `get-shit-done/workflows/framing-discovery.md` | `get-shit-done/workflows/framing-pipeline.md` | pipeline handoff in Step 10 | WIRED | `@~/.claude/get-shit-done/workflows/framing-pipeline.md` in Step 10 with BRIEF_PATH + LENS passed as context |
| `get-shit-done/workflows/framing-pipeline.md` | `get-shit-done/references/escalation-protocol.md` | `@-reference` in required_reading | WIRED | `@~/.claude/get-shit-done/references/escalation-protocol.md` in `<required_reading>` and referenced in escalation-handling section |
| `get-shit-done/workflows/framing-pipeline.md` | `get-shit-done/workflows/review-phase.md` | review stage invokes review-phase with 3-input model | WIRED | `@~/.claude/get-shit-done/workflows/review-phase.md` in Stage 5 with `<framing_context>` block passing brief + lens |
| `commands/gsd/init.md` | `get-shit-done/workflows/init-project.md` | `@-reference` in execution_context | WIRED | `@~/.claude/get-shit-done/workflows/init-project.md` in execution_context |
| `get-shit-done/workflows/init-project.md` | `get-shit-done/workflows/gather-synthesize.md` | existing-project parallel scan | WIRED | `@~/.claude/get-shit-done/workflows/gather-synthesize.md` referenced in Step 4a |
| `get-shit-done/bin/lib/init.cjs` (cmdInitProject) | `.planning/` | auto-detection checks .planning/ existence | WIRED | `pathExistsInternal(cwd, '.planning')` and `pathExistsInternal(cwd, '.planning/PROJECT.md')` drive mode detection |
| `commands/gsd/discuss-capability.md` | `get-shit-done/workflows/discuss-capability.md` | `@-reference` in execution_context | WIRED | `@~/.claude/get-shit-done/workflows/discuss-capability.md` in execution_context |
| `commands/gsd/discuss-feature.md` | `get-shit-done/workflows/discuss-feature.md` | `@-reference` in execution_context | WIRED | `@~/.claude/get-shit-done/workflows/discuss-feature.md` in execution_context |
| `get-shit-done/workflows/discuss-capability.md` | `.documentation/capabilities/` | reads and writes capability lifecycle files | WIRED | Capability file location explicitly `.documentation/capabilities/{slug}.md` in load_capability and update_capability_file steps |
| `get-shit-done/workflows/discuss-feature.md` | `get-shit-done/workflows/discuss-capability.md` | backward routing when feature reveals capability misconception | WIRED | `backward_routing` step offers "Route to discuss-capability" with explicit `/gsd:discuss-capability {capability-slug}` instruction |
| `get-shit-done/workflows/discuss-feature.md` | `.planning/capabilities/{slug}/features/{slug}/requirements/` | feature discussion output feeds into EU/FN/TC files | WIRED | `update_feature_notes` step targets `.planning/capabilities/{cap-slug}/features/{feat-slug}/requirements/` explicitly |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| WKFL-01 | 06-01, 06-02 | Four framing commands as entry points: debug, new, enhance, refactor | SATISFIED | 4 slash commands exist in `commands/gsd/`, each referencing framing-discovery.md with correct lens |
| WKFL-02 | 06-01, 06-02 | Debug framing discovery: observe -> compare -> hypothesize -> root cause -> converge to pipeline | SATISFIED | debug anchor-questions.md follows backward flow (symptom -> timeline/change -> reproduction -> ruled out -> isolation); MVU slots: symptom, reproduction_path, hypothesis |
| WKFL-03 | 06-01, 06-02 | New framing discovery: explore -> brainstorm -> converge to pipeline | SATISFIED | new anchor-questions.md follows forward flow (problem/who -> done criteria -> constraints -> out of scope -> shape); MVU slots: problem, who, done_criteria, constraints |
| WKFL-04 | 06-01, 06-02 | Enhance framing discovery: assess working -> identify improvement -> align -> converge | SATISFIED | enhance anchor-questions.md follows outward flow (current state -> desired -> delta -> invariants -> fit); MVU slots: current_behavior, desired_behavior, delta |
| WKFL-05 | 06-01, 06-02 | Refactor framing discovery: reason for change -> new goal -> understand codebase -> options -> align -> converge | SATISFIED | refactor anchor-questions.md follows underneath flow (current design/why -> pressure -> target -> breakage -> behavioral contract); MVU slots: current_design, target_design, breakage |
| WKFL-06 | 06-03 | All framings converge to same artifact pipeline: requirements -> plan -> execute -> review -> documentation | SATISFIED | framing-pipeline.md implements 6 sequential stages; escalation-protocol.md provides universal escalation across all stages |
| WKFL-07 | 06-01, 06-03 | Framing context injection: same agents receive different question sets based on active framing | SATISFIED | framing-pipeline.md passes `<framing_context>` blocks to each stage with lens-specific behavior guidance; framing-lenses.md defines the behavioral spec; anchor questions provide the question set per lens |
| INIT-01 | 06-04 | New-project mode: Q&A about goals, tech stack opinions, architecture -> maps out capabilities | SATISFIED | init-project.md Steps 3a-3e: goals Q&A, tech stack opinions, architecture/constraints Q&A, PROJECT.md write, capability map creation |
| INIT-02 | 06-04 | Existing-project mode: understands goals + opinions -> parallel research -> Q&A to confirm/adjust -> identify capabilities | SATISFIED | init-project.md Steps 4a-4f: 6-dimension parallel scan via gather-synthesize, user validation of independent sections, gap fill Q&A, PROJECT.md + capability map write |
| INIT-03 | 06-05 | Discuss-capability command builds out features from a mapped capability | SATISFIED | discuss-capability.md + discuss-feature.md together handle WHAT/WHY (capability level) and HOW (feature level); both accept fuzzy references, can kill/defer, feed into downstream pipeline |

---

### Anti-Patterns Found

| File | Location | Pattern | Severity | Impact |
|------|----------|---------|----------|--------|
| `get-shit-done/workflows/framing-discovery.md` | Line 205, Step 9 | Empty bash block `# Write the brief` within code fence | Info | Code block is a comment placeholder -- prose instruction immediately following ("Use the Write tool to write the completed brief") is clear. No functional impact; AI agents follow the prose. |

---

### Human Verification Required

No items require human testing for this phase. All observable truths are verifiable through code inspection of workflow documents, slash command frontmatter, and gsd-tools dispatch table.

Items that would require human verification (but are explicitly deferred per plan 06-05's interfaces section):
- `/status`, `/resume`, `/plan`, `/review` -- deferred supporting commands; no requirement IDs assigned in Phase 6; explicitly noted as out of scope

---

### Gaps Summary

No gaps. All 14 observable truths verified, all 27 artifacts verified at all three levels (exists, substantive, wired), all 17 key links confirmed wired.

The one anti-pattern (empty bash code block in framing-discovery.md Step 9) is informational only — the workflow prose makes the intent unambiguous and AI agents follow prose instructions. It does not block goal achievement.

Phase goal fully achieved: the full pipeline is orchestrated end-to-end through framing-aware workflows that share a common artifact pipeline, plus initialization commands that set up new and existing projects.

---

_Verified: 2026-02-28_
_Verifier: Claude (gsd-verifier)_
