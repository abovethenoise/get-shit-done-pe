# Edge Cases: Workflows and Commands

**Phase:** 06-workflows-and-commands
**Researched:** 2026-02-28
**Dimension:** Boundary conditions, failure modes, edge cases
**Confidence:** HIGH (grounded in actual CONTEXT.md decisions, existing codebase patterns from init.cjs, gather-synthesize.md, resume-project.md, and prior phase edge case analysis)

---

## Edge Cases Findings

### Failure Modes

| Failure | Likelihood | Severity | Mitigation | Source |
|---------|------------|----------|------------|--------|
| Lens misclassification not caught at upfront check — proceeds with wrong framing into full pipeline | common | blocking | Light upfront validation + anchor-question detection both required; neither alone sufficient | [06-CONTEXT.md: "Both upfront validation and mid-discovery pivot"] |
| Mid-pipeline lens pivot abandons partially-filled discovery brief — stale fields from wrong framing persist | common | blocking | Explicit brief reset on pivot: zero-out framing-specific Specification fields, preserve Meta and Context | [First principles: brief fields are framing-specific; wrong-lens data is worse than empty data] |
| MVU check passes but one required slot is empty — proceeds with a silent hole in the brief | common | degraded | Per-field mandatory check before MVU declaration, not just "did we discuss everything" heuristic | [06-CONTEXT.md: "MVU slot detection and saturation checking" is Claude's discretion — no enforcement specified] |
| Fuzzy resolution returns wrong capability — user doesn't catch it, entire pipeline executes on wrong target | common | blocking | Show resolved capability name prominently in first response; require explicit confirmation before starting discovery | [06-CONTEXT.md: "Multiple matches: present top 3, user picks"] |
| /new discovers existing capability mid-discovery and pivots to /enhance — but discovery brief is partially filled with /new Specification fields | common | blocking | Pivot wipes /new Specification section, re-fills with /enhance fields; partial /new data must not bleed into /enhance brief | [06-CONTEXT.md: "cross-framing detection: /new pivoting to /enhance"] |
| Discovery exits via "diminishing returns" signal but circling detection fails to fire — pipeline proceeds with under-specified brief | common | degraded | Circling detection requires explicit pattern matching (same question asked 2+ times, same answer repeated) not just "feels complete" | [06-CONTEXT.md: "Three exit signals: diminishing returns (circling detected)"] |
| User override exit with explicit assumptions — assumptions recorded in brief but downstream pipeline agents don't read them and proceed as if brief is complete | common | degraded | Assumptions section must appear in brief output with `[UNVERIFIED]` tag; planner must explicitly address each assumption | [06-CONTEXT.md: "user override (flags missing, proceeds with explicit assumptions)"] |
| /resume detects interrupted pipeline but cannot determine WHICH stage was interrupted — offers wrong resumption point | common | degraded | Stage-level state persistence: each stage writes a completion marker before exiting; /resume reads the last marker | [get-shit-done/workflows/resume-project.md: checks PLAN without SUMMARY — but no stage-level granularity] |
| /init detects ambiguous state (code exists, .planning exists) — asks clarifying question, user answers wrongly, existing project context is overwritten | rare | blocking | /init in "ambiguous" mode should ONLY ask one question; must not write any files until mode is confirmed | [06-CONTEXT.md: "Ambiguous → ask one question"] |
| /init existing-project automated scan misidentifies tech stack (e.g., reports "JavaScript" not "TypeScript") — user validation section catches it but user misses the prompt | common | degraded | Each section of validation is independent; tech stack section stands alone — user can correct without re-running full scan | [06-CONTEXT.md: "Independent sections (confirming stack doesn't depend on confirming architecture)"] |
| /init existing-project partial run: Phase 1 (scan) completed, Phase 2 (validation) never reached — re-run overwrites scan output without resuming | common | degraded | Re-run /init detects partial state: "Found scan output from [date]. Resume validation or re-scan?" | [06-CONTEXT.md: "Re-running /init detects partial run and offers resume"] |
| discuss-capability kills an idea but capability file remains with `status: killed` — user runs /new on it anyway, pipeline proceeds on a killed capability | rare | degraded | /new upfront check must read capability status; `killed` or `deferred` status blocks launch, surfaces reason | [06-CONTEXT.md: "discuss-capability can conclude 'don't build this' — mark as killed/deferred with reasoning"] |
| discuss-feature backward-routes to discuss-capability — but the capability discussion concludes "kill it" — pipeline state is now in an inconsistent forward+backward position | rare | blocking | Backward routing must surface state explicitly: "discuss-capability concluded: kill. Returning to feature — nothing to execute." | [06-CONTEXT.md: "Can route backward to replan or even back to discuss-capability"] |
| Escalation severity threshold misclassified: minor issue flagged as major, pipeline halts unnecessarily | common | degraded | Severity thresholds must be documented per-stage; "major" requires at least one of: data loss risk, fundamental requirement violation, architectural blocker | [06-CONTEXT.md: "Universal escalation protocol... What constitutes minor/moderate/major may differ per stage"] |
| Major escalation from Execute stage: user confirms return to Discovery — but discovery restarts without the current brief as context | rare | blocking | Auto-restart from stage X must inject the current brief as "prior context"; discovery should not start from scratch | [06-CONTEXT.md: "Propose and confirm. Pipeline recommends... User confirms, then auto-restarts from that stage"] |
| Compound work (primary + secondary lens): secondary lens requirements are not represented in the auto-generated 3-layer requirements — only primary lens requirements are drafted | common | degraded | Requirements generation must receive both lens labels; weight varies but all three layers are always present for both lenses | [06-CONTEXT.md: "Primary + secondary lens model... Single run, layered context"] |
| /status command returns stale pipeline state because stage-completion markers weren't written (agent crashed before writing) | common | degraded | /status reads file existence, not in-memory state; all stage outputs are files — crash before write = stage not registered | [First principles: file-system-as-state is GSD's persistence model; no write = no state] |
| /plan invoked explicitly on approved requirements, but planner agent expects research RESEARCH.md to exist — /plan has no research context, produces thin plan | common | degraded | /plan must check for RESEARCH.md; if absent, surface: "No research found. Run /gsd:research-phase first, or proceed knowing plan has no research backing." | [03-CONTEXT.md: "Planner requires RESEARCH.md to exist before starting"] |
| /review invoked manually but no brief exists (user ran execute without going through lens workflow) — brief input is empty, review has no intent signal | rare | degraded | /review must handle absent brief gracefully: review against requirements only, note "no discovery brief — intent check skipped" | [06-CONTEXT.md: "Review receives three inputs: requirements + lens metadata + brief"] |

---

### Boundary Conditions

- **Empty fuzzy query** (`/debug` with no arguments): No natural language to resolve → must ask "What are you debugging?" before any resolution attempt — [First principles: empty string is a degenerate case for all fuzzy resolution logic]

- **Single character fuzzy query** (`/new x`): Too short to be meaningful but technically a valid string → fuzzy resolution returns no matches → trigger "no match" path, ask user to describe → [First principles: string distance matching degrades below ~4 characters]

- **Exact match conflict** (`/enhance auth`): Fuzzy resolution finds BOTH a capability called "auth" AND a feature called "auth" in the "login" capability → system must disambiguate level (capability vs feature) before proceeding → [First principles: same name at different artifact levels is valid and must be handled]

- **Brief with all fields present but one contradictory pair**: `/refactor` brief has `current_design` and `target_design` that are identical — no actual change specified → MVU check must catch semantic completeness, not just field presence → [06-CONTEXT.md: MVU per lens: "current design, target design, what breaks during transition"]

- **Discovery loop where user repeatedly re-frames the problem**: 3+ exchanges that each restart problem definition rather than narrowing it → circling signal fires, but user insists on continuing → system must honor user override exit while recording the instability in brief's Unknowns section → [06-CONTEXT.md: "Three exit signals... user override"]

- **Compound work with conflicting lenses**: User invokes `/enhance` on something, secondary lens detection fires `/refactor` — but "enhance" (add capability) and "refactor" (same behavior, better internals) have fundamentally conflicting behavioral invariants — primary lens wins, secondary lens notes invariant tension in brief → [06-CONTEXT.md: "One lens leads, the other informs"]

- **Capability file exists but has no content past the header** (zombie capability): Created by /init but never populated → fuzzy resolution finds it → discovery proceeds with empty capability context → must treat as "new" context level, not degrade silently → [First principles: empty CAPABILITY.md is worse than absent CAPABILITY.md because it suppresses the "context missing" warning]

- **/init run in a directory that has .planning/ but no ROADMAP.md** (partial prior init): Not "nothing there" (new) and not "codebase exists" (existing project) — edge of the auto-detect threshold → [06-CONTEXT.md: "Single command, auto-detects mode: Codebase exists → existing flow. Nothing there → new flow. Ambiguous → ask one question"]

- **Pipeline stage auto-generated requirements conflict with user's existing capability file invariants**: Auto-draft says "feature X may modify Y" but capability invariant says "Y is read-only" — requirements are presented to user before this is caught → review stage catches it, but it's expensive to surface a fundamental conflict this late → [First principles: requirements generation should validate against capability invariants before presenting to user]

- **MVU met signal fires immediately (user provides rich context upfront with skip/fast-track)**: Discovery runs 1 anchor question, MVU is met — system must proceed to brief summary playback even on fastest path; no silent auto-proceed → [06-CONTEXT.md: "Always summarize before transitioning — playback captures misunderstandings"]

---

### Integration Failure Scenarios

- **Fuzzy resolution depends on capability map from PROJECT.md** → if PROJECT.md is absent or capability map section is empty → fuzzy resolution fails silently → all 4 lens commands and both discuss commands become non-functional without PROJECT.md → [First principles: capability map is the resolution index; no index = no resolution]

- **Brief → Requirements handoff**: Discovery produces brief, requirements agent receives it → if brief has missing Specification section (user override exit) → requirements agent has no spec to draft from → must surface "requirements drafted from problem statement only — Specification was not completed" → [06-CONTEXT.md: "Auto-generate requirements, user reviews"]

- **Requirements → Plan handoff**: Plan stage receives 3-layer requirements → if end-user layer was not generated (e.g., /debug framing has "thin EU") → plan validator runs cross-layer check → no EU requirements = no EU tasks = plan passes validation but coverage table has empty EU column → [06-CONTEXT.md: "All 3 layers always present, but weight varies by lens"]

- **Review → Reflect handoff**: Review accepts, triggers Phase 5 doc agent → doc agent reads the brief to understand intent → if brief was lost or overwritten (e.g., second run of same capability) → doc agent has no intent signal → documentation reflects what was built, not why → [06-CONTEXT.md: "Reflect = Phase 5's doc agent... wired as the final pipeline step"]

- **Universal escalation: Execute stage halts and recommends returning to Discovery** → if Discovery artifacts have been overwritten by a subsequent run → auto-restart from Discovery finds no prior context → discovery starts blank → user loses all prior brief context → [06-CONTEXT.md: "Pipeline recommends: 'I suggest returning to discovery because X.' User confirms, then auto-restarts from that stage"]

- **discuss-capability feeds capability file** → lens workflow reads capability file as Layer 2 context → if discuss-capability session was interrupted and capability file is half-written → Layer 2 context is malformed → agents receive truncated context → [First principles: capability file is a shared mutable artifact; interrupted writes are a hazard]

- **/init existing-project Phase 3 (gap fill) depends on Phase 2 (validation) output** → if Phase 2 validation was skipped or partial → Phase 3 targets the wrong gaps → gap fill addresses issues the user already resolved during validation → [06-CONTEXT.md: "Three phases: 1. automated scan, 2. user validation, 3. gap fill"]

- **Incremental /init writes depend on file locks** → two /init sessions running simultaneously (unlikely but possible on shared machines) → both write to PROJECT.md → last write wins, first write is lost → [First principles: no explicit locking in file-system-as-state model; concurrent writes corrupt artifacts]

---

### Existing Error Handling (gaps)

- **`get-shit-done/workflows/resume-project.md`**: handles interrupted agents (checks `current-agent-id.txt`) and incomplete plans (PLAN without SUMMARY) — but does NOT handle the case where a lens discovery was interrupted mid-conversation (no file artifact to detect) — [resume-project.md:62-96]

- **`get-shit-done/bin/lib/init.cjs` `cmdInitNewProject`**: handles `project_exists` (errors if already initialized) — but does NOT detect partially-initialized state (`.planning/` exists, `PROJECT.md` absent) — falls through to new-project flow which would overwrite any existing artifacts — [init.cjs:195-199]

- **`get-shit-done/workflows/gather-synthesize.md`**: handles gatherer failure with retry-once and 50% abort threshold — but does NOT handle the case where the synthesizer produces an empty output (exists but under word threshold) — only `test -f` and `test -s` (non-empty) are checked; synthesizer with 10-word output is treated as success — [gather-synthesize.md:96-143]

- **`get-shit-done/workflows/gather-synthesize.md` Layer 4 framing context**: workflow checks layer existence before inclusion — but framings/debug/, framings/enhance/, framings/new/, framings/refactor/ directories exist but are EMPTY (no files inside) — any framing-specific question file inclusion will silently omit since files don't exist yet — [get-shit-done/framings/* directories confirmed empty via `ls`]

- **`get-shit-done/workflows/resume-project.md` Step 3 `check_incomplete_work`**: scans for `.continue-here*.md` files and PLAN-without-SUMMARY — but has no awareness of partial /init state (scan done, validation not done) — /init partial state is invisible to /resume — [resume-project.md:62-96]

- **`get-shit-done/workflows/discovery-phase.md`**: handles discovery depth levels — but does NOT handle the lens pivot case (calling workflow is /new, discovery reveals /enhance territory) — discovery-phase.md has no mechanism to signal "change the lens before continuing" to the calling workflow — [discovery-phase.md: entire process section]

- No existing handling for `discuss-capability` killed status preventing downstream lens commands from launching — the kill/defer signal exists in the capability file spec but no enforcement mechanism is defined in any current workflow.

---

### Known Issues in Ecosystem

- **LLM circling detection**: Detecting when a conversation is "diminishing returns / circling" is a known hard problem for LLM-based systems. The system relies on Claude's judgment to detect circling — there is no mechanical pattern match. This is a known failure mode in conversational AI orchestration: circling tends to be declared too late (after 5+ repetitions) rather than too early. The 06-CONTEXT.md flags this as Claude's discretion ("MVU slot detection and saturation checking") which increases risk that exit conditions are subjective and inconsistent across sessions. [First principles: LLM circling detection without explicit pattern rules degrades to "vibes-based" exit criteria]

- **Natural language to artifact resolution ambiguity**: "Fix the timing bug" could resolve to a capability, a feature, or an open debug session. Systems that rely purely on LLM-based fuzzy matching (rather than explicit ranking heuristics) exhibit inconsistent resolution behavior across sessions, especially when artifact names are short or generic. Top-3 presentation mitigates but does not eliminate the issue. [First principles: fuzzy matching quality degrades with short names and high artifact density]

- **Pipeline state machines without explicit state persistence**: Multi-stage pipelines that store state only in the file system (PLAN.md, SUMMARY.md, brief files) have a known failure mode: interrupted stages produce partial file writes that appear complete to file-existence checks. GSD's file-as-state model is sound for completed stages but has no protection for mid-write interruptions. This is a structural property of the design, not a bug — but it means file-existence checks are necessary but not sufficient for "stage complete" detection. [First principles: file write is not atomic in the OS; partial writes are possible under crash/interrupt conditions]

- **Compound lens ambiguity at discovery boundary**: Systems with a "primary + secondary lens" model face a known challenge: when does a secondary lens become primary? If a /enhance session reveals the change is 80% refactoring, the secondary lens dominates but the pipeline still runs under /enhance framing. There is no threshold defined for "secondary lens exceeds primary lens weight — consider re-framing." [06-CONTEXT.md: "One lens leads, the other informs" — no threshold defined]

- **Universal escalation severity calibration drift**: Systems where each stage independently classifies issue severity (minor/moderate/major) tend to develop inconsistent calibration over time — what one stage calls "minor," another calls "moderate." Without a shared severity rubric with concrete examples per stage, the 3-tier model becomes arbitrary. [06-CONTEXT.md: "What constitutes minor/moderate/major may differ per stage" — acknowledged but left to Claude's discretion]

---

## Risk Matrix

| Edge Case | Severity | Likelihood | Priority |
|-----------|----------|------------|----------|
| Wrong lens, silent brief field bleed on pivot | blocking | common | P1 — explicit brief reset on pivot |
| Fuzzy resolution resolves to wrong target silently | blocking | common | P1 — explicit confirmation before discovery starts |
| /new pivots to /enhance, partial /new brief bleeds through | blocking | common | P1 — lens pivot spec must include field reset protocol |
| MVU met with empty field (silent hole in brief) | degraded | common | P1 — per-field mandatory check before MVU declaration |
| User override exit: assumptions not surfaced to downstream agents | degraded | common | P2 — brief assumptions section tagged [UNVERIFIED], planner must address |
| discuss-capability kills idea, /new launches anyway | degraded | rare | P2 — capability status check in /new upfront validation |
| Major escalation: auto-restart from discovery without prior brief | blocking | rare | P1 — inject current brief as prior context on restart |
| /init partial run overwrites Phase 1 scan on re-run | degraded | common | P2 — re-run detects partial state, offers resume |
| /plan invoked without RESEARCH.md | degraded | common | P2 — explicit gate check in /plan upfront |
| /review invoked without brief | degraded | rare | P3 — graceful fallback to requirements-only review |
| Compound work: secondary lens requirements not drafted | degraded | common | P2 — requirements generation receives both lens labels |
| Circling detection fires late or not at all | degraded | common | P2 — concrete pattern rules (same Q asked 2x) not just judgment |
| Pipeline state invisible to /resume after discovery interrupt | degraded | common | P2 — stage-level completion markers in persistent state |
| discuss-feature backward-route lands on killed capability | blocking | rare | P2 — backward routing checks destination status before redirecting |
| Empty fuzzy query / too-short query | degraded | common | P3 — standard input validation before fuzzy resolution |
| /init ambiguous mode writes files before mode confirmed | blocking | rare | P1 — /init must not write any file until mode confirmed by user |
| Capability file empty (zombie) — Layer 2 context omits warning | degraded | common | P2 — word-count check on capability file before injecting as context |
| Gather-synthesize framing context always empty (Phase 6 not built yet) | degraded | high (current state) | P2 — Layer 4 guard already designed; verify it handles empty directory not just missing file |
| Concurrent /init writes corrupting PROJECT.md | blocking | theoretical | P3 — document limitation; single-user tool assumption |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Lens pivot failure modes | HIGH | Directly grounded in 06-CONTEXT.md decisions on pivot detection and compound work |
| Fuzzy resolution edge cases | HIGH | 06-CONTEXT.md defines resolution algorithm; boundary conditions follow from that spec |
| /init auto-detect boundary | HIGH | Decision is explicitly stated; ambiguous cases are enumerated in codebase (init.cjs:171-218) |
| MVU boundary conditions | MEDIUM | MVU is defined per lens but "saturation checking" is Claude's discretion — enforcement is unspecified |
| Universal escalation severity | MEDIUM | 3-tier model is specified; per-stage thresholds are Claude's discretion — calibration consistency is a known LLM risk |
| Brief persistence under pipeline restarts | HIGH | Resume workflow codebase confirms file-as-state model; no stage-level markers currently exist |
| Circling detection reliability | MEDIUM | First principles + known LLM behavioral pattern; no mechanical rules are defined in the spec |
| discuss-* backward routing | HIGH | 06-CONTEXT.md explicitly defines backward routing; failure modes follow from the routing logic |
