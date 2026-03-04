## Existing System Findings

### Relevant Implementations

- **Step 8.3 current implementation: flat per-finding AskUserQuestion loop** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:238–251`. Each finding (validation error or planner self-critique) is surfaced one-at-a-time with header "Finding {N}/{total}", a question string of `[{category}] {description}\n\nSuggestion: {suggestion}\nAffected REQs: {reqs_affected}`, and four options: Accept / Edit / Provide guidance / Dismiss. No narrative context, no ordering rationale, no architecture diagram. This is the primary target for the 3-layer justification replacement.

- **Step 8.6 current implementation: flat summary table + single approve question** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:264–274`. Presents: feature/plan count/task count/waves as a bullet list, validation status, key decisions from Q&A. Uses AskUserQuestion with header "Finalize" and question "Finalize this plan?" with options: "Yes, finalize" / "I want changes" / "Abort". No ASCII flow, no ordering justification, no surfaced self-critique decisions with rationale.

- **Planner "PLANNING COMPLETE" return format** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:380–400`. The structured return includes: Phase name, N plans in M waves, a wave table (Wave | Plans | Autonomous), a plans table (Plan | Objective | Tasks | Files), and a Findings section from Round 2 self-critique. This is the exact data that feeds into steps 8.3 and 8.6 — and it already contains the wave structure and objective descriptions that could drive an ASCII flow.

- **Planner self-critique Round 2 findings format** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:268–276`. Findings are structured as `{ category: "coverage_gap|assumption|ambiguity", description, suggestion, reqs_affected }`. This is the data model for what step 8.3 currently processes per-finding. The feature needs to present these as a surfaced layer rather than a serial interrogation.

- **Plan checker "ISSUES FOUND" return format** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/checker-reference.md:299–324`. Issues come back as: phase name, N plans checked, X blockers / Y warnings / Z info, followed by grouped "Blockers (must fix)" and "Warnings (should fix)" sections with structured YAML. Step 8.8 currently surfaces these with "same Q&A format as 8.3". The feature would also apply the 3-layer presentation here.

- **Plan checker "VERIFICATION PASSED" return format** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/checker-reference.md:279–296`. On pass: Coverage Summary table (Requirement | Plans | Status) and Plan Summary table (Plan | Tasks | Files | Wave | Status). This structured data is available for the approval presentation layer even when issues are zero.

- **CLI validation output schema** — `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/plan-validate.cjs:182–194`. Returns JSON: `{ passed: bool, errors: [{type, task, plan, message}], warnings: [{type, req, message}], summary: {total_tasks, total_reqs, covered, uncovered, errors, warnings} }`. When `--raw` flag is set, the workflow receives this JSON directly. This is a third data source available at checkpoint time alongside planner findings and checker issues.

- **ui-brand.md defines the visual primitives available** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md`. Available elements: stage banners (`━━━ GSD ► STAGE ━━━`), checkpoint boxes (`╔═══ CHECKPOINT: Type ╗`), status symbols (✓ ✗ ◆ ○ ⚡ ⚠), progress bars (`████████░░ 80%`), tables, Next Up blocks, spawning indicators. These are the building blocks for the richer 3-layer presentation. ASCII flows/diagrams are NOT currently defined here — that is an extension point.

- **AskUserQuestion is the only sanctioned interaction primitive in plan.md** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:244, 271`. Both 8.3 and 8.6 use AskUserQuestion exclusively. This is the tool available for all user-facing checkpoints throughout the planning workflow. The feature must work within this tool's interface: header, question (markdown body), options array.

- **PLAN.md frontmatter schema contains all wave/dependency/objective data** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:9–26`. Fields: phase, plan, wave, depends_on, files_modified, autonomous, requirements (EU/FN/TC IDs), must_haves (truths, artifacts, key_links). This data is in every PLAN.md file at checkpoint time and is the raw material for an ASCII architecture flow showing wave structure, dependencies, and file ownership.

- **must_haves schema provides user-observable truths ready for narrative** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:183–199`. `must_haves.truths` are explicitly outcome-shaped ("User can see existing messages") not implementation-shaped. These are pre-written justification language: "This plan's approach achieves: {truth list}" — directly usable in the narrative layer.

---

### Constraints

- **AskUserQuestion has no free-form markdown rendering guarantee outside question field** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:244, 271` (how it constrains: header is a single string, options is a list — only the question body can carry multi-line markdown content including ASCII diagrams). The architecture flow and narrative must fit within the question body, not span multiple fields.

- **Step 8.3 loop must not be eliminated, only restructured** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:253–262`. Steps 8.4 and 8.5 (collect feedback, re-spawn planner if guidance given) depend on 8.3 having gathered user responses per finding. The feature replaces the per-finding serial presentation, but the outcome — a list of accepted/edited/dismissed findings — must still feed 8.4. Any restructuring must preserve this output contract.

- **Max 3 loop iterations is a hard cap baked into plan.md** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:262`. The 8.1–8.5 loop enforces `max 3 iterations`. The new presentation format in 8.3 must not extend the loop mechanics — it changes how findings are displayed, not how iteration is counted or limited.

- **Step 8.7 plan checker is conditionally enabled via `plan_checker_enabled`** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:276–287`. The checker runs only if config enables it. Step 8.8 says checker findings use "same Q&A format as 8.3." If 8.3 changes presentation format, the feature must specify whether 8.8 also changes or explicitly inherits the new format.

- **The planner "Planning Complete" return is a workflow convention, not a tool contract** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:380–400`. The structured return format exists as a reference doc instruction, not enforced by code. The orchestrator reads planner output and interprets it. If the feature needs specific data (e.g., objective summaries for a narrative), it relies on the planner following its reference spec.

- **ASCII diagram syntax is not in ui-brand.md** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md`. The brand file defines boxes, banners, tables, progress bars — but no flow/diagram conventions. Any ASCII architecture flow the feature introduces becomes a new pattern without an existing style to align to.

---

### Reuse Opportunities

- **Planner wave table (Wave | Plans | Autonomous) is directly available** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:387–388`. The planner already returns this table in its "PLANNING COMPLETE" block. It can be embedded verbatim in the new narrative layer as the "what executes when" visualization without any new computation.

- **`must_haves.truths` as pre-written outcome narrative** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:184–186`. The truths array is already user-observable language ("User can see existing messages"). The narrative layer can quote these directly as "This approach achieves: {truth}" without requiring new prose generation.

- **Planner findings categories (coverage_gap | assumption | ambiguity)** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:272`. The three categories are already structured. The surfaced self-critique layer can group findings by category with a header per group, giving more context than the current "Finding 3/7" serial format.

- **Checker coverage table (Requirement | Plans | Status)** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/checker-reference.md:284–288`. When the checker passes, it returns a coverage summary table. This table is richer than the current step 8.6 presentation and can be reused directly in the approval layer to show requirement traceability at a glance.

- **ui-brand.md checkpoint box format for the deep-dive interactive layer** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/ui-brand.md:30–48`. The `╔═══ CHECKPOINT: {Type} ╗` format with `→ YOUR ACTION:` footer is the established pattern for "user, you must do something here." The 3rd layer (interactive deep-dive) should use this exact box format to signal it is an optional but always-offered interaction.

- **Checker issue severity levels as grouping keys** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/checker-reference.md:259–270`. `blocker | warning | info` severity levels are already defined. The new surfaced-critique layer can group checker findings by severity (blockers first, with red-flag framing) rather than presenting them serially without priority signal.

---

### Integration Points

- **plan.md Step 8.3 is the primary target** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:238–251`. The entire block from "Present everything to user via AskUserQuestion" through the options list is replaced by the new 3-layer justification presentation. The output of 8.3 (user response per finding) must still feed step 8.4 unchanged.

- **plan.md Step 8.6 is the secondary target** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:264–274`. The "Present final plan summary" block is replaced by the richer approval presentation. Must preserve the AskUserQuestion with "Finalize this plan?" and its three options — only the surrounding narrative and visual context changes.

- **plan.md Step 8.8 inherits the 8.3 format (needs explicit spec)** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:289–295`. Currently says "same Q&A format as 8.3." If 8.3 changes, 8.8 must either be updated to reference the new format explicitly or explicitly declare it uses the old per-finding format for checker issues (which differ structurally from planner findings).

- **planner-reference.md "Planning Complete" section shapes data available at 8.3** — `/Users/philliphall/get-shit-done-pe/get-shit-done/references/planner-reference.md:380–413`. The narrative and architecture layers consume planner output. If specific new fields or structure are needed for the narrative (e.g., explicit ordering rationale per plan), the planner reference must be updated to require that output. Otherwise, the new presentation must be derived from existing planner output fields only.

- **ui-brand.md must be read by plan.md** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:7`. Already listed in `<required_reading>`. Any new visual pattern introduced by the feature will be available to the orchestrator automatically without adding a new `@` reference.

---

### Undocumented Assumptions

- **The orchestrator is expected to derive an ASCII architecture flow from PLAN.md frontmatter at runtime** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:264–270`. Step 8.6 currently lists "plan count, task count, waves" from planner output. There is no instruction for how to construct a visual flow. The assumption baked in is that the orchestrator can synthesize a wave diagram from depends_on and files_modified fields — this is reasonable but undocumented.

- **Step 8.3 fires even when there are zero findings** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:241–242`. The instruction reads "For each finding... Use AskUserQuestion". If findings list is empty (planner self-critique found nothing, CLI validation passed clean), the loop fires zero times and the workflow silently proceeds to 8.4. The new presentation format must handle the zero-findings case explicitly — it should still show the plan summary rather than skipping to 8.6 silently.

- **"Key decisions made during Q&A" in step 8.6 has no source definition** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:269`. There is no data structure for "decisions made during Q&A" — the orchestrator is expected to synthesize this from 8.3 Q&A responses. The new approval presentation layer should make this either explicit (derive from accepted/edited findings) or optional.

- **The planner deep-dives offered in step 8.6 ("also: cat {feature_dir}/*-PLAN.md") bypass the orchestrator** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:319`. The final status block tells users to `cat` PLAN.md files directly, bypassing any presentation. The new interactive deep-dive layer replaces this raw-file suggestion with a structured in-workflow option, but existing users already rely on the cat suggestion. This is a behavioral change that should be acknowledged.

- **AskUserQuestion "deep-dive" is an option within the approval step, not a separate step** — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/plan.md:271–274`. Currently step 8.6 has exactly three options (Yes / I want changes / Abort). Adding "Show me more detail" as a 4th option changes the step structure. The assumption is that AskUserQuestion supports arbitrary option counts — this is true in practice but is not documented as a constraint anywhere in the codebase.
