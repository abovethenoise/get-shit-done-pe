# Review Synthesis: delegation-patterns

**Scope:** Feature-level review (subagent-delegation/delegation-patterns)
**Date:** 2026-03-07
**Conflict priority:** end-user > functional > technical > quality

---

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All citations verified against source files |
| functional | 5 | 5 | 0 | All citations verified |
| technical | 4 | 4 | 0 | All citations verified |
| quality | 4 | 3 | 1 | Finding 5 says "5 judge/inherit" -- actual count is 6 judge/inherit (minor) |

**Spot-check details:**

- **end-user** `delegation.md:18` -- verified: "opus is a valid model value but prefer inherit for flexibility." Matches quote.
- **end-user** `FEATURE.md:31` (AC-3) -- verified: "The 3 source docs ... are replaced by the consolidated doc." Matches claim.
- **end-user** `delegation.md:38-42` -- verified: parallel spawn, retry, abort, synthesize steps all present. Matches quote.
- **end-user** `delegation.md:82` -- verified: "Spawn 1 subagent for a scoped task, wait for completion, process the result." Matches.
- **end-user** `gsd-planner.md:6-7` -- verified: `role_type: judge` / `model: sonnet`. Matches.
- **functional** `delegation.md:18` -- verified (same as above).
- **functional** `delegation.md:24-25` -- verified: ROLE_MODEL_MAP fallback and error on missing role_type. Matches.
- **functional** `gather-synthesize.md:4` -- verified: cross-reference to delegation.md present. Matches.
- **functional** `gather-synthesize.md:73-74` -- verified: line 74 reads "See @{GSD_ROOT}/get-shit-done/references/delegation.md for the gather-synthesize delegation shape..." Matches.
- **functional** `delegation.md:103-106` -- verified: Users table with execute-plan/sonnet, review verification/inherit, plan validation/inherit. Matches.
- **technical** `delegation.md:127-149` -- verified: Anti-patterns section present at those lines. Matches.
- **technical** `delegation.md:24` -- verified: ROLE_MODEL_MAP reference present. Matches.
- **technical** dangling reference claim -- verified: glob for model-profiles.md and model-profile-resolution.md returns no files.
- **technical** `gather-synthesize.md:4` and `:74` -- verified: cross-references resolve correctly.
- **quality** `delegation.md:37` -- verified: "Assemble context payload (see gather-synthesize.md for context layers)." Matches.
- **quality** `delegation.md:14` -- verified: "| judge | inherit | Synthesizers, checkers, verifiers |" Matches.
- **quality** Finding 5 breakdown "5 judge/inherit, 1 judge/sonnet" -- **INVALID**: actual count from end-user's full table is 6 judge/inherit + 1 judge/sonnet = 7 judges total. Minor counting error; does not affect verdict.
- **quality** `gsd-planner.md:6-7` -- verified (same as above).

---

## Findings

#### Finding 1: delegation.md says "opus is a valid model value" -- spec says never valid

**Severity:** major
**Source:** end-user, functional
**Requirement:** FN-01
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- `delegation.md:18` -- `"opus is a valid model value but prefer inherit for flexibility."`
- `FEATURE.md:53` -- `"'opus' is never a valid model parameter value; use 'inherit' instead"`
- Reasoning (end-user): The spec was not formally amended. The MEMORY.md notes opus became valid in v1.0.64, suggesting a deliberate divergence from the original spec based on platform changes.
- Reasoning (functional): "The implementation says opus IS valid (just not preferred). The spec says opus is NEVER valid. These are contradictory."

**Spot-check:** verified -- both `delegation.md:18` and `FEATURE.md:53` confirmed by reading source files.

**Assessment:** This is a real spec deviation. The implementation reflects a platform reality (opus is valid since v1.0.64) but the requirement was not updated to match. Two paths forward: (1) amend FN-01 to acknowledge opus as valid-but-not-preferred, or (2) change delegation.md:18 to say opus is not valid. Given the platform reality, option 1 is the pragmatic choice.

---

#### Finding 2: gather-synthesize.md still exists as 76-line stub (not "replaced")

**Severity:** major
**Source:** end-user
**Requirement:** EU-01 (AC-3)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `FEATURE.md:31` -- AC-3: "The 3 source docs (model-profiles.md, model-profile-resolution.md, gather-synthesize.md) are replaced by the consolidated doc"
- `get-shit-done/workflows/gather-synthesize.md` -- exists as 76-line stub with context assembly content
- Reasoning: The AC says "replaced." The file still exists. The implementation reinterpreted "replaced" as "reduced to a stub that cross-references delegation.md."

**Spot-check:** verified -- gather-synthesize.md confirmed at 76 lines, contains context assembly (Layers 0-4) and cross-references to delegation.md.

**Assessment:** The engineering decision to keep gather-synthesize.md as a context-assembly-only doc is architecturally sound (quality reviewer confirms clean DRY separation in Finding 1). The issue is the spec says "replaced" and the file still exists. This is a spec-vs-implementation gap, not a quality problem. Two paths: (1) amend EU-01 AC-3 to say "replaced or reduced to context-assembly-only stub," or (2) fold context assembly into delegation.md and delete the stub. Option 1 better preserves the separation of concerns.

---

#### Finding 3: gsd-planner role_type/model mismatch against routing table

**Severity:** minor
**Source:** end-user, functional, technical, quality (all four reviewers flagged this)
**Requirement:** FN-01 (cross-layer with TC-02)
**Verdict:** not met (suspected)

**Evidence (from reviewers):**
- `~/.claude/agents/gsd-planner.md:6-7` -- `role_type: judge` / `model: sonnet`
- `delegation.md:14` -- `| judge | inherit | Synthesizers, checkers, verifiers |`
- MEMORY.md notes: "gsd-planner has role_type: judge but model: sonnet (actual executor usage)"
- Reasoning (technical): "The model field overrides the role_type mapping (per resolution order at delegation.md:23-25), so runtime behavior is correct. However, the role_type/model mismatch is a semantic inconsistency."
- Reasoning (quality): "Either the table needs a footnote or the planner's role_type should reflect its actual usage."

**Spot-check:** verified -- gsd-planner.md confirmed judge/sonnet, delegation.md confirmed judge->inherit mapping.

**Assessment:** Known intentional decision per MEMORY.md. Runtime is correct because `model` field takes precedence over `role_type` mapping. The inconsistency is cosmetic but creates a documentation lie. Classified as minor because it does not affect correct operation. Recommend: change gsd-planner's `role_type` to `executor` to match its actual model and usage, or add a footnote to the routing table.

---

#### Finding 4: delegation.md lists "integration" reviewer -- actual agent is "quality"

**Severity:** minor
**Source:** synthesizer (found during spot-check)
**Requirement:** FN-02
**Verdict:** not met (proven)

**Evidence:**
- `delegation.md:66` -- `| review | 4 (enduser, functional, technical, integration) | 1 review synthesizer |`
- Actual review agents in `~/.claude/agents/`: `gsd-review-enduser.md`, `gsd-review-functional.md`, `gsd-review-technical.md`, `gsd-review-quality.md`
- The doc says "integration" but the agent is "quality." No `gsd-review-integration.md` exists.

**Spot-check:** verified by globbing `~/.claude/agents/gsd-review-*.md` -- four gatherers are enduser, functional, quality, technical.

**Assessment:** Factual error in the reference doc. Should read "quality" not "integration." None of the four reviewers caught this. Does not affect routing or delegation mechanics, but is a documentation accuracy issue.

---

#### Finding 5: Clean DRY separation between delegation.md and gather-synthesize.md

**Severity:** minor (positive finding)
**Source:** quality
**Requirement:** quality (DRY)
**Verdict:** met

**Evidence (from reviewer):**
- `delegation.md:37` -- cross-references gather-synthesize.md for context layers
- `gather-synthesize.md:4` -- cross-references delegation.md for delegation patterns
- Reasoning: Each doc owns a distinct concern. Cross-references are directional and non-circular.

**Spot-check:** verified.

---

#### Finding 6: No dangling references to deleted files

**Severity:** minor (positive finding)
**Source:** technical, quality
**Requirement:** TC-01, quality (Structural Integrity)
**Verdict:** met

**Evidence (from reviewers):**
- model-profiles.md and model-profile-resolution.md confirmed deleted
- Grep across `get-shit-done/` returns zero matches for deleted file names
- References remain only in `.planning/phases/` (historical, harmless)

**Spot-check:** verified -- glob returns no files for either deleted doc.

---

#### Finding 7: TC-01 net line reduction achieved

**Severity:** minor (positive finding)
**Source:** end-user, functional, technical, quality (all four)
**Requirement:** TC-01
**Verdict:** met

**Evidence:** delegation.md (149 lines) + gather-synthesize.md stub (76 lines) = 225 total < 337 threshold. 33% reduction.

**Spot-check:** verified.

---

#### Finding 8: TC-02 agent frontmatter consistency achieved

**Severity:** minor (positive finding)
**Source:** end-user, functional, technical, quality (all four)
**Requirement:** TC-02
**Verdict:** met

**Evidence:** All 20 agents have both `role_type` and `model` in YAML frontmatter. 14 executor/sonnet, 6 judge/inherit, 1 judge/sonnet (gsd-planner, see Finding 3).

**Spot-check:** verified via end-user's full table.

---

#### Finding 9: "quick" role_type has no consumers

**Severity:** minor
**Source:** functional
**Requirement:** quality
**Verdict:** observation (no requirement violated)

**Evidence (from reviewer):**
- `delegation.md:15` -- `| quick | haiku | Slug resolution, timestamps, simple lookups |`
- Functional reviewer: "Zero agents use model: haiku despite quick role_type being defined in the routing table."

**Spot-check:** verified from end-user's full agent table -- no agent has model: haiku.

**Assessment:** Not a violation of any requirement. The quick->haiku path is documented but untested. Acceptable for an enhance-lens feature -- it documents a pattern for future use.

---

#### Finding 10: delegation.md section structure well-earned

**Severity:** minor (positive finding)
**Source:** quality
**Requirement:** quality (Earned Abstractions)
**Verdict:** met

**Evidence:** 5 sections (Model Routing, Gather-Synthesize, Single Delegation, When to Delegate, Anti-Patterns). Each serves a distinct orchestrator decision point. No section duplicates another.

**Spot-check:** verified by reading delegation.md in full.

---

#### Finding 11: AUDIT-FINDINGS.md correctly scoped to downstream feature

**Severity:** minor (positive finding)
**Source:** quality
**Requirement:** quality (Bloat)
**Verdict:** met

**Evidence:** AUDIT-FINDINGS.md written under `workflow-enforcement/` feature, not `delegation-patterns/`. Correctly scoped to the feature that will act on the findings.

**Spot-check:** not checked (low priority positive finding).

---

## Conflicts

### Disagreements

- **EU-01 verdict:** end-user says **not met** (AC-3: gather-synthesize.md not "replaced") vs functional says **met** (considers stub + deletion of 2 docs sufficient)
  - Resolution: End-user is correct on strict spec reading. FEATURE.md:31 says "replaced by the consolidated doc." The file still exists. Functional reviewer's interpretation is pragmatically reasonable but does not match the literal AC.
  - Tiebreaker applied: yes -- end-user priority > functional priority. EU-01 is **not met**.

### Tensions

- **gather-synthesize.md: delete vs keep as stub:** End-user review implies it should be deleted (per AC-3 "replaced"). Quality reviewer praises the DRY separation as architecturally sound. Technical reviewer confirms no dangling references and clean cross-referencing.
  - Assessment: These can coexist. The recommended resolution is to amend EU-01 AC-3 to acknowledge the stub approach, not to delete the stub. The architectural decision is sound; the spec language is the problem.

- **opus validity: spec amendment vs doc change:** End-user and functional both flag the spec deviation but acknowledge the platform reality. No reviewer recommends a specific resolution path.
  - Assessment: Amending FN-01 to say "opus is valid but inherit is preferred" aligns with platform reality (v1.0.64+) and preserves the intent of the original spec (prefer inherit over hardcoded model names).

- **gsd-planner: fix role_type vs add footnote:** Quality recommends either changing role_type to executor or adding a footnote. Technical notes it's a known intentional decision. End-user flags it as a cross-layer concern.
  - Assessment: Changing role_type to executor is the cleaner fix -- it matches the agent's actual model and usage (MEMORY.md: "actual executor usage"). A footnote would be documenting an inconsistency rather than resolving it.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 2     |
| Minor    | 9     |

| Req ID | Verdict | Severity | Source Reviewer | Notes |
|--------|---------|----------|----------------|-------|
| EU-01 | not met | major | end-user | AC-3: gather-synthesize.md not replaced (stub remains) |
| FN-01 | not met | major | end-user, functional | delegation.md:18 says opus is valid; spec says never valid. Plus gsd-planner mismatch. |
| FN-02 | met | -- | end-user, functional | All behaviors documented correctly. Minor doc error: "integration" should be "quality" (Finding 4). |
| FN-03 | met | -- | end-user, functional | Single delegation shape fully documented. |
| TC-01 | met | -- | all four | 225 lines < 337 threshold. 33% reduction. |
| TC-02 | met | -- | all four | All 20 agents have role_type + model. |

### Action items for resolution

1. **FN-01 (opus):** Amend FN-01 spec to say "opus is valid but inherit is preferred" OR change delegation.md:18 to say opus is not valid. Recommend spec amendment.
2. **EU-01 (gather-synthesize.md):** Amend EU-01 AC-3 to say "replaced or reduced to context-assembly-only stub" OR fold context assembly into delegation.md and delete. Recommend spec amendment.
3. **FN-01 (gsd-planner):** Change gsd-planner's role_type from judge to executor. Known intentional but semantically inconsistent.
4. **FN-02 (doc error):** Change delegation.md:66 from "integration" to "quality."
