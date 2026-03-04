## User Intent Findings

### Primary Goal

Replace the doc stage's single-agent write with parallel focused exploration so that documentation recommendations cover every artifact that could drift — not just .documentation files — and so the stage can be invoked standalone without re-running the full pipeline. — source: BRIEF.md §Desired Behavior, FEATURE.md §Goal

---

### Acceptance Criteria

- **AC-01: Full-surface recommendations produced** — Doc output contains at least one recommendation entry in each of the 5 focus areas (code comments, module/flow docs, standards/decisions, project config, friction reduction), OR an explicit "nothing found" entry per area. A report with only .documentation entries FAILS. — source: FEATURE.md EU-01, BRIEF.md §Desired Behavior item 4

- **AC-02: Each recommendation is actionable** — Every recommendation identifies: (a) target file path, (b) what to change, (c) why. A recommendation with vague language ("consider updating docs") with no file target FAILS. — source: FEATURE.md EU-01 AC bullet 2

- **AC-03: Recommendations grouped by focus area** — doc-report.md presents recommendations sectioned by focus area so the user can scan by category. A flat unsorted list FAILS. — source: FEATURE.md EU-01 AC bullet 3

- **AC-04: `/gsd:doc` works standalone** — The command can be run after `/gsd:review` completes, without invoking the full framing pipeline. It reads committed artifacts (SUMMARYs, review synthesis, git diff) and produces the same doc-report.md. FAILS if it requires a running pipeline context or re-executes prior stages. — source: FEATURE.md EU-02, BRIEF.md §Desired Behavior item 5

- **AC-05: `/gsd:doc {cap/feat}` and `/gsd:doc {cap}` both work** — Feature-level runs doc for one feature; capability-level iterates all features with review artifacts. Invoked with no arg: infers target from STATE.md or recent git activity. FAILS if capability-level arg is rejected or silently treats it as feature-level. — source: FEATURE.md EU-02 AC bullet 3, FN-04

- **AC-06: Standalone and pipeline output are identical** — The doc-report.md format is the same regardless of invocation path. The Q&A loop downstream is unchanged. FAILS if standalone produces a different format or skips the Q&A loop. — source: FEATURE.md EU-02 AC bullet 4, FN-03, FN-06

- **AC-07: LENS propagates to each explorer** — When invoked via pipeline, the lens value reaches every parallel explorer and shapes their investigation emphasis per EU-03 mapping (new/enhance/debug/refactor). FAILS if explorers receive no lens or all receive the same generic prompt regardless of lens. — source: FEATURE.md EU-03, FN-01

- **AC-08: Standalone LENS defaults to "enhance"** — When `/gsd:doc` is invoked with no pipeline context and no determinable lens from FEATURE.md/RESEARCH.md frontmatter, LENS defaults to "enhance". FAILS if it errors, prompts the user, or defaults to another lens. — source: FEATURE.md EU-03 AC final bullet, FN-04, TC-02

- **AC-09: 5 parallel explorers spawn via Task() blocks** — doc.md Step 4 spawns exactly 5 parallel Task() blocks (one per focus area) and then a synthesizer. FAILS if it spawns fewer explorers, runs them sequentially, or uses a single agent. — source: FEATURE.md FN-01, TC-01

- **AC-10: Explorer failure is non-fatal** — If one or more explorer tasks fail or return empty, the synthesizer still runs and produces a doc-report.md from whichever findings arrived. FAILS if a single explorer failure aborts the entire doc stage. — source: FEATURE.md FN-01 final bullet

- **AC-11: Each explorer writes a scoped findings file** — Output per explorer: `{feature_dir}/doc/{focus-area}-findings.md` with YAML frontmatter (focus_area, feature, date) and structured finding entries. FAILS if explorers write to a single shared file or omit frontmatter. — source: FEATURE.md TC-03

- **AC-12: Explorers do not overlap in scope** — Code comments explorer reads actual source files; standards/decisions and project config explorers read .documentation/ and CLAUDE.md. No two explorers investigate the same artifact class. FAILS if, for example, both code-comments and module-docs explorers scan source files with identical prompts. — source: FEATURE.md TC-03 constraints

- **AC-13: `/gsd:doc` skill follows existing command pattern** — The skill file lives at the correct commands path (equivalent to `/Users/philliphall/get-shit-done-pe/commands/gsd/`), uses slug-resolve, routes capability vs feature, follows the same structure as plan.md and review.md skills. FAILS if it invents a novel invocation pattern or bypasses slug-resolve. — source: FEATURE.md TC-02, observed pattern in `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md` and `review.md`

- **AC-14: Q&A loop is unchanged** — The AskUserQuestion loop in doc.md Steps 7-8 is not modified. Approve/Edit/Reject per recommendation still works. Only the input source changes (synthesized report vs single-agent report). FAILS if Q&A mechanics change or recommendations are auto-applied. — source: FEATURE.md FN-06, EU-01 Out of Scope

- **AC-15: `key_constraints` note removed** — The doc.md `<key_constraints>` section no longer contains "Single-agent pipeline (NOT gather-synthesize)" because that constraint is reversed by this feature. FAILS if the contradictory note remains. — source: FEATURE.md FN-05

- **AC-16: doc-report.md format is the contract** — The synthesized doc-report.md must be consumable by the existing Step 5 (verify output) and Step 7 (Q&A loop) without modification to those steps. FAILS if the synthesizer invents a new format that breaks downstream steps. — source: FEATURE.md FN-03, FN-05

---

### Implicit Requirements

- **The doc stage is currently ceremonial for many features** — The single-agent writer only touches .documentation files, misses CLAUDE.md drift, misses friction patterns, and has no standalone entry. The user experiences this as the doc stage producing output that doesn't reflect the real impact surface. Any implementation that merely restructures internal plumbing without visibly expanding the recommendation surface fails the intent even if it satisfies the structural AC. — [First principles: BRIEF.md §Existing State "Doc-writer scope limited to code comments and .documentation directory"; the user's problem statement names "lacks parallel exploration" and "no standalone entry point" as the concrete gaps — the expanded scope is the primary value, not the parallel architecture per se]

- **The gsd-doc-writer agent must handle two distinct roles via prompt differentiation** — The decision is to not create new agent files unless a single agent truly cannot handle both explorer and synthesizer modes. The planner must verify that the existing agent definition's success criteria, scope, and output format are compatible with both modes (focused explorer vs judge/synthesizer), and expand the agent definition accordingly — not create a second agent file. — source: FEATURE.md Decisions bullet 3, TC-01 constraints

- **CLAUDE.md and hooks/skills recommendations are first-class, not an afterthought** — The user explicitly listed "CLAUDE.md fixes" and "hooks or skills that could reduce friction" in the desired behavior before the parallel-exploration restructure. These are the highest-novelty additions — the code comments and .documentation areas already existed. An implementation that adds these areas as thin stubs without real investigation logic fails the intent. — source: BRIEF.md §Desired Behavior item 4, FEATURE.md FN-02 focus areas 4 and 5

- **Recommendations must be ordered by impact, highest first** — The synthesizer's output is not a flat dump; it prioritizes. This affects usability: the user sees the most important recommendations first in the Q&A loop. An implementation that preserves recommendations in explorer-arrival order FAILS usability even if it satisfies structural AC. — source: FEATURE.md FN-03 "Recommendations ordered by impact (highest first)"

- **The user will not re-run the full pipeline just to refresh docs** — The entire motivation for `/gsd:doc` standalone is that the pipeline is heavyweight. The skill must infer everything it needs from committed artifacts alone. Any design that requires the user to pass artifact paths manually or re-trigger earlier stages defeats the purpose. — [First principles: BRIEF.md §Existing State "no standalone entry point"; EU-02 explicitly says "without re-running the full pipeline"]

- **Lens inference from frontmatter is a fallback, not the primary path** — When invoked standalone, the skill should attempt to read FEATURE.md or RESEARCH.md frontmatter for lens. But "enhance" default must be immediate and automatic when frontmatter is absent or ambiguous — not a prompt to the user. — source: FEATURE.md FN-04 "infers LENS from FEATURE.md or RESEARCH.md frontmatter if available, defaults to 'enhance' if not determinable"

---

### Scope Boundaries

**In scope:**
- Restructuring doc.md Step 4 from single-agent Task() to 5 parallel explorer Task() blocks + 1 synthesizer Task()
- Defining 5 focus areas with scoped investigation prompts: code comments, module/flow docs, standards/decisions, project config (CLAUDE.md), friction reduction (hooks/skills)
- Adding `/gsd:doc` skill at `commands/gsd/doc.md` following the slug-resolve -> route -> workflow pattern
- Capability-level doc invocation (iterates all features with review artifacts)
- LENS propagation from pipeline context, or inference + default from standalone context
- Expanding gsd-doc-writer agent definition to support explorer and synthesizer roles via prompt differentiation
- Updating doc.md `key_constraints` to remove the now-false "Single-agent pipeline" note
- Preserving Steps 1-3 and Steps 5-12 of doc.md exactly as-is

**Out of scope:**
- Auto-applying any recommendation (user approves each one via Q&A) — source: FEATURE.md EU-01 Out of Scope
- Changing .documentation directory structure — source: FEATURE.md EU-01 Out of Scope
- Running `/gsd:doc` when no prior execution/review artifacts exist — source: FEATURE.md EU-02 Out of Scope
- Changing which focus areas run based on lens (lens shapes emphasis within areas, not which areas run) — source: FEATURE.md EU-03 Out of Scope
- Creating new agent files unless single agent cannot handle both explorer and synthesizer roles — source: FEATURE.md TC-01
- Changing PLAN.md artifact format, planner logic, plan-checker logic, or other pipeline stages — source: BRIEF.md §Invariants

**Ambiguous:**
- **Explorer agent type in Task() blocks** — TC-01 specifies `subagent_type="gsd-doc-writer"` for explorers and `subagent_type="gsd-doc-writer"` + `model="inherit"` for synthesizer. The current gsd-doc-writer agent is defined as an executor that writes code documentation — not as a focused investigator for CLAUDE.md or hooks/skills. The planner must decide how to differentiate explorer vs synthesizer prompts within the single agent definition without breaking the agent's existing success criteria (3-pass self-validation is executor-centric, not explorer-centric).

- **Capability-level doc orchestration pattern** — TC-02 says "iterates reviewed features via capability-orchestrator pattern (same as execute/review)". The capability-orchestrator.md exists but its exact invocation pattern for the doc stage needs to be confirmed against the current orchestrator workflow to ensure it can dispatch doc.md per feature.

- **What counts as "review artifacts exist" for capability-level invocation** — FN-04 says capability-level runs doc for "all features with review artifacts." It is not specified whether the check is for `review/synthesis.md` existence, a state flag, or SUMMARY.md presence. The planner needs to define this gate condition precisely.

- **doc-report.md format vs current format** — The current doc.md produces a doc-report.md from a single-agent 3-pass validation run (structural, referential, gate consistency). The new synthesizer produces a doc-report.md with prioritized recommendations grouped by focus area. FN-03 says "Synthesizer produces the same doc-report.md format the current single-agent produces." This is a tension: the current format is validation-oriented (pass/fail checks, impact flags); the new format must also be recommendation-oriented (target file, what to change, why, focus area). The planner must resolve whether these are the same format extended, or whether "same format" means same downstream contract (Q&A consumable) rather than identical schema.

---

### Risk: Misalignment

- **"Same format as current single-agent" may be impossible to satisfy literally** — The current doc-report.md is a 3-pass validation report (structural compliance, referential integrity, gate consistency). The new synthesized doc-report.md is a recommendations report (target file, change, rationale, focus area, priority). These serve different purposes. FN-03 says the format is "preserved as the contract between explorers/synthesizer and Q&A loop." The intent is clearly that the Q&A loop receives the same consumable input — not that the validation schema is preserved. The planner should treat "same format" as "Q&A-compatible format" rather than "identical schema." — source: FEATURE.md FN-03, doc.md Step 7 (Q&A loop expects doc content preview per item), Decisions bullet 4

- **Focus area 4 (project config) is the riskiest explorer** — The CLAUDE.md file is user-authored global configuration. An explorer that recommends CLAUDE.md changes is making a judgment call about the user's personal workflow preferences. The user explicitly wants this (BRIEF.md item 4: "relevant project or sub CLAUDE.md fixes"), but an over-eager explorer could produce noise. The agent prompt for this focus area must be scoped to detecting drift or staleness relative to actual code state — not proposing workflow redesign. — [First principles: user values KISS and "no complexity for complexity's sake"; recommending CLAUDE.md changes that don't trace to real drift would be ceremonial noise]

- **Explorer non-failure semantics must be explicit in the workflow** — FN-01 says "Explorer failure is non-fatal — synthesizer works with whatever findings arrive." But doc.md Step 5 (verify output) currently errors if doc-report.md is missing. If the synthesizer is instructed to always produce doc-report.md even with partial findings, Step 5 will pass. But if the synthesizer itself fails (e.g., all 5 explorers timeout), the workflow has no graceful path defined. The planner should specify the synthesizer's behavior when zero findings files arrive. — source: FEATURE.md FN-01, doc.md Step 5
