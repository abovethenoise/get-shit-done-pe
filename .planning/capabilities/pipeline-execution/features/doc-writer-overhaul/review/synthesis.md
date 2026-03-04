---
type: review-synthesis
feature: pipeline-execution/doc-writer-overhaul
date: 2026-03-04
synthesizer: gsd-review-synthesizer
---

# Review Synthesis: Doc-Writer Overhaul

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All line references verified against source |
| functional | 5 | 5 | 0 | FN-04 git-log gap observation is accurate |
| technical | 5 | 5 | 0 | TC-03 REQ IDs gap confirmed; file path gap reasoning is sound |
| quality | 7 | 7 | 0 | All 6 not-met findings confirmed by source; framing_context mismatch is real |

### Spot-Check Detail

**end-user:**
- `get-shit-done/workflows/doc.md:64` — "Spawn all 5 explorers simultaneously" — VERIFIED
- `get-shit-done/workflows/doc.md:52-61` — `<doc_context>` block with Lens and lens emphasis — VERIFIED
- `agents/gsd-doc-writer.md:65-73` — explorer finding format with target_file etc. — VERIFIED (actual lines 64-73)
- `get-shit-done/workflows/review.md:166-167` — auto-chain passes LENS — VERIFIED (lines 166-167)
- `commands/gsd/doc.md:80-88` — three-tier LENS inference chain — VERIFIED

**functional:**
- `get-shit-done/workflows/doc.md:112-115` — retry + abort threshold logic — VERIFIED
- `get-shit-done/workflows/doc.md:126-133` — synthesizer Task() block — VERIFIED (lines 126-133)
- `agents/gsd-doc-writer.md:21-22` — synthesizer goal with dedup/ordering — VERIFIED
- `commands/gsd/doc.md:67-78` — no-arg STATE.md inference (git log not present) — VERIFIED
- `get-shit-done/workflows/doc.md:143-159` — Q&A loop grouped by focus area — VERIFIED

**technical:**
- `agents/gsd-doc-writer.md:40-48` — exclusive scope boundaries with negative guards — VERIFIED
- `agents/gsd-doc-writer.md:54-73` — YAML frontmatter + finding format (no req_ids field) — VERIFIED
- `get-shit-done/workflows/doc.md:192-193` — key_constraints with gather-synthesize pattern — VERIFIED
- `commands/gsd/doc.md:99-121` — capability-level inline iteration — VERIFIED (lines 98-121)
- `agents/gsd-doc-writer.md:1-7` — dual-role description in frontmatter — VERIFIED

**quality:**
- `get-shit-done/workflows/doc.md:5-7` — required_reading has only ui-brand.md (no gather-synthesize.md) — VERIFIED
- `get-shit-done/workflows/review.md:5-8` — review.md includes gather-synthesize.md in required_reading — VERIFIED
- `get-shit-done/workflows/gather-synthesize.md:65-68` — canonical tag is `<framing_context>` — VERIFIED
- `agents/gsd-doc-writer.md:124` — agent says "When framing_context is provided" but receives `<doc_context>` — VERIFIED
- `agents/gsd-doc-writer.md:130-138` — "Requirement Layer Awareness" section uses review-stage language ("When a finding says EU-03: NOT MET") — VERIFIED
- `get-shit-done/workflows/doc.md:128` — conflict priority `code-comments > module-flow-docs > ...` — VERIFIED
- `agents/gsd-doc-writer.md:42-43` vs `doc.md:68` — scope boundary duplication confirmed — VERIFIED

---

## Findings

---

#### Finding 1: "Requirement Layer Awareness" section in gsd-doc-writer.md is review-stage content

**Severity:** major
**Source:** quality
**Requirement:** quality
**Verdict:** not met

**Evidence (from reviewer):**
- `agents/gsd-doc-writer.md:130-138` — Section reads: "Review findings trace to three requirement layers... When a finding says 'EU-03: NOT MET'... When extracting WHY blocks from review citations..."
- Reasoning: The doc-writer operates as an explorer (scanning for documentation gaps) or synthesizer (consolidating findings into recommendations). Neither role receives review verdicts to interpret, nor produces "EU-03: NOT MET" findings. The framing of this section is entirely about reading review output — it is guidance for a review agent accidentally placed in a doc agent. It is dead guidance for the explorer role and actively misleading for the synthesizer (which should order by impact, not by requirement layer). The "WHY blocks from review citations" phrasing implies the doc-writer is processing review trace output — it is not.

**Spot-check:** verified — `agents/gsd-doc-writer.md:132-138` confirmed. The section uses language like "When a finding says 'EU-03: NOT MET'" and "When extracting WHY blocks from review citations" — unmistakably review-trace language in a doc agent.

---

#### Finding 2: `<doc_context>` / `<framing_context>` tag mismatch — agent activation condition never satisfied

**Severity:** major
**Source:** quality (Findings 2 and 7 — same root cause, two surfaces)
**Requirement:** quality
**Verdict:** not met

**Evidence (from reviewer):**
- `agents/gsd-doc-writer.md:124` — "When framing_context is provided by the orchestrator, adjust documentation emphasis accordingly:"
- `get-shit-done/workflows/doc.md:52-61` — LENS delivered inside `<doc_context>` tag, not `<framing_context>`
- `get-shit-done/workflows/gather-synthesize.md:65-68` — canonical gather-synthesize pattern uses `<framing_context>`
- `get-shit-done/workflows/review.md:53-58` — review.md uses `<review_context>` (also diverges from canonical, but not a new instance)
- Reasoning: The agent's "Framing Context" section says it activates when `framing_context` is provided. The orchestrator provides `<doc_context>`. The literal activation condition is never met. LLMs will likely still infer LENS from the `<doc_context>` content, but the specification is broken — the explicit condition in the agent definition does not match what it actually receives. doc.md introduces a third variant of the context tag (after `<framing_context>` and `<review_context>`), compounding an existing inconsistency.

**Spot-check:** verified — both sides of the mismatch confirmed. `agents/gsd-doc-writer.md:124` says "framing_context"; `doc.md:52` opens `<doc_context>`. `gather-synthesize.md:65` confirms canonical is `<framing_context>`.

**Note:** Quality reviewer presented this as two separate findings (Finding 2 from orchestrator side, Finding 7 from agent side). They share a single root cause and single fix surface. Merged here to avoid duplication while preserving both perspectives in the evidence.

---

#### Finding 3: doc.md missing gather-synthesize.md from required_reading

**Severity:** major
**Source:** quality (Finding 1)
**Requirement:** quality
**Verdict:** not met

**Evidence (from reviewer):**
- `get-shit-done/workflows/doc.md:5-7` — required_reading contains only `ui-brand.md`
- `get-shit-done/workflows/review.md:5-8` — review.md (which also implements gather-synthesize) includes `gather-synthesize.md` in required_reading
- Reasoning: Both doc.md and review.md implement the gather-synthesize pattern. review.md signals this by including `gather-synthesize.md` as required reading. doc.md omits it. The required_reading block is the mechanism for telling an orchestrating agent which reference patterns it must internalize before executing — this covers abort ratios, manifest handling, and retry logic. doc.md's gather-synthesize implementation was authored correctly by the plan author, but the convention of citing the reference pattern is missing.

**Spot-check:** verified — `doc.md:5-7` confirmed: only `ui-brand.md` present. `review.md:5-8` confirmed: `gather-synthesize.md` is listed first.

**Severity assessment:** This is major rather than blocker because the gather-synthesize behavior is correctly implemented inline in doc.md. The omission is an idiom violation (missing reference signal) that could cause confusion for future maintainers and leaves the orchestrator without its authoritative reference, but does not currently break functionality.

---

#### Finding 4: Conflict priority ordering is not semantically applicable to exclusive scope partitions

**Severity:** minor
**Source:** quality (Finding 4)
**Requirement:** quality
**Verdict:** not met

**Evidence (from reviewer):**
- `get-shit-done/workflows/doc.md:128` — "Conflict priority: code-comments > module-flow-docs > standards-decisions > project-config > friction-reduction"
- `agents/gsd-doc-writer.md:21` — "Resolve conflicts using priority order (provided in your task_context)."
- Reasoning: The review pipeline's conflict priority (end-user > functional > technical > quality) reflects genuine adjudication between overlapping dimensions that can disagree on the same finding. The doc explorer focus areas are exclusive scope partitions — TC-03 mandates no overlap. If scope boundaries hold (by design and dual enforcement), there are no inter-dimension conflicts to resolve. The only legitimate scenario is deduplication of findings about the same target file from different explorers, which is already handled by the dedup instruction separately. Passing a conflict priority implies a dispute model that should not arise given the partition design. The complexity is not earned.

**Spot-check:** verified — `doc.md:128` confirmed. `agents/gsd-doc-writer.md:21` confirmed.

**Severity assessment:** Minor rather than major. The conflict priority causes no harm — the synthesizer can simply never invoke it if there are no conflicts. It does add conceptual noise and implies architecture that was deliberately avoided. Worth removing for clarity.

---

#### Finding 5: Scope boundaries defined twice — inline Task() prompts and agent definition

**Severity:** minor
**Source:** quality (Finding 5)
**Requirement:** quality
**Verdict:** not met (suspected)

**Evidence (from reviewer):**
- `get-shit-done/workflows/doc.md:68` — code-comments Task() inline: "Scope: Scan modified source files... Check: function docstrings, inline explanations of non-obvious logic, parameter descriptions, return value notes. Do NOT cover .documentation/ files or config files..."
- `agents/gsd-doc-writer.md:42-43` — agent definition: "code-comments: Source files modified in this change. Reads actual source files. Checks: function docstrings, inline explanations, parameter notes."
- Reasoning: The inline Task() prompts contain scope language not present in the agent definition (specifically the "Do NOT cover X — those are other focus areas" negative guards). The agent definition is the canonical home for role and scope in GSD. review.md does not inline scope definitions for reviewer dimensions — each reviewer's agent file owns its scope. This duplication creates two sources of truth: scope must be updated in both doc.md Task() prompts and gsd-doc-writer.md when focus areas change.

**Spot-check:** verified — the duplication is real. The "Do NOT" negative guard language in `doc.md:68` does not appear in `gsd-doc-writer.md:42-43`. The agent has "Never scan outside your assigned scope" (line 48) as a general rule, but the per-area negative guards are only in the workflow prompts.

**Severity assessment:** Minor rather than major. The duplication creates maintenance overhead but is not currently broken — the inline scope is more specific than the agent definition and serves as a real-time reminder. "Suspected" verdict retained because it is a DRY violation but not a correctness issue.

---

#### Finding 6: REQ IDs field absent from explorer output format (TC-03 spec gap)

**Severity:** minor
**Source:** technical (TC-03 gap)
**Requirement:** TC-03
**Verdict:** not met (gap from spec)

**Evidence (from reviewer):**
- `agents/gsd-doc-writer.md:63-73` — Explorer finding format defines: target_file, current_state, recommended_change, rationale. No req_ids field.
- TC-03 spec: "Each finding: target_file, current_state, recommended_change, rationale, REQ IDs if applicable"
- Reasoning: TC-03 explicitly specified "REQ IDs if applicable" as a finding field. It is absent from both the explorer format and the synthesizer output format. The agent does include Requirement Layer Awareness context (lines 132-138) but this context is review-stage content (see Finding 1) — it cannot compensate for the absent field. The synthesizer format uses `priority` (high/medium/low) not REQ IDs for ordering.

**Spot-check:** verified — `gsd-doc-writer.md:64-73` confirmed: four fields defined, no req_ids. The finding is accurate.

**Severity assessment:** Minor. REQ IDs in doc explorer output would be useful for traceability but the doc stage operates on committed artifacts — the synthesizer can reference requirements in rationale prose without a dedicated structured field. The omission is consistent throughout all output formats, which is a deliberate (if undocumented) simplification.

---

#### Finding 7: No-arg path omits git log fallback (spec-vs-reality gap)

**Severity:** minor
**Source:** functional (FN-04 observation), technical (TC-02 gap)
**Requirement:** FN-04, TC-02
**Verdict:** not met (gap from spec — both reviewers noted, consistent)

**Evidence (from reviewers):**
- `commands/gsd/doc.md:67-78` — No-arg path reads STATE.md only. When STATE.md is non-deterministic, falls back to AskUserQuestion for free text.
- Spec (TC-02): "reads STATE.md session continuity or recent git commits to infer target"
- Reasoning: The spec listed "or recent git commits" as a second inference source. The implementation skips git log and goes directly to user prompt. Both reviewers agree this is a minor gap — STATE.md is sufficient for the primary use case, and the user prompt handles the failure case adequately.

**Spot-check:** verified — `commands/gsd/doc.md:67-78` confirmed: STATE.md is the only automated inference source. No git log call present.

**Severity assessment:** Minor. The user prompt fallback is a reasonable substitute for git log inference. The gap is real but has no practical impact on the common use case.

---

## Conflicts

### Disagreements

None. All four reviewers reached compatible verdicts on all shared requirements. The quality reviewer found not-met findings that the other three reviewers did not assess (quality focuses on idioms and DRY, which are outside the scope of EU/FN/TC traces) — these are non-overlapping perspectives, not disagreements.

### Tensions

**Conflict priority ordering (Finding 4 vs functional/technical reviewer acceptance):**
- Quality reviewer: conflict priority is unnecessary abstraction — exclusive partitions cannot produce review-style conflicts, so the priority order is dead logic
- Functional reviewer (FN-03): noted the conflict priority order in the synthesizer prompt without flagging it as a problem — treated it as functional
- Technical reviewer (TC-01): noted the synthesizer Task() structure without flagging conflict priority
- Assessment: Quality has the stronger argument here. The functional and technical reviewers assessed whether the conflict priority was present and correctly formatted — they did not assess whether it was semantically appropriate. These perspectives do not contradict each other; they address different questions. Quality's finding stands.

**Scope boundary duplication (Finding 5 vs functional/technical acceptance):**
- Quality reviewer: inline scope in Task() prompts duplicates agent definition — two sources of truth
- Functional reviewer (FN-02): flagged "dual enforcement: both the workflow prompt and the agent definition carry the boundary constraints" as a positive (belt-and-suspenders safety)
- Assessment: This is a genuine tension. Functional sees dual enforcement as a feature (reduces explorer scope drift); Quality sees it as a DRY violation (creates maintenance burden). Both are correct on their own terms. Priority ordering: technical > quality applies here since functional is flagging correctness, quality is flagging maintainability. However, the finding remains valid as a minor quality observation — the dual-enforcement framing mitigates severity but does not eliminate the DRY concern. The finding is retained at minor severity with the tension documented.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 3     |
| Minor    | 4     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01  | met | — | end-user |
| EU-02  | met | — | end-user |
| EU-03  | met | — | end-user |
| FN-01  | met | — | functional |
| FN-02  | met | — | functional |
| FN-03  | met | — | functional |
| FN-04  | met (gap: git log fallback absent) | minor | functional, technical |
| FN-05  | met | — | functional |
| FN-06  | met | — | functional |
| TC-01  | met | — | technical |
| TC-02  | met (gaps: file path hedge applies; git log absent; orchestrator deviation intentional) | minor | technical |
| TC-03  | met (gap: REQ IDs field absent) | minor | technical |
| quality: gather-synthesize required_reading | not met | major | quality |
| quality: framing_context tag mismatch | not met | major | quality |
| quality: Requirement Layer Awareness bloat | not met | major | quality |
| quality: conflict priority abstraction | not met | minor | quality |
| quality: scope boundary DRY | not met (suspected) | minor | quality |
