## Review Synthesis

### Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 4 | 4 | 0 | Reliable. Line references to refinement-qa.md and refinement.cjs confirmed. |
| functional | 5 | 5 | 0 | Reliable. All line references verified against source files. |
| technical | 5 | 5 | 0 | Reliable. Spec-vs-reality gaps well documented with accurate citations. |
| quality | 5 | 5 | 0 | Reliable. Regression finding (source_finding/source mismatch) confirmed at lines 524 and 600. |

All 19 spot-checked citations matched quoted content. No reliability concerns for any reviewer.

---

### Findings

#### Finding 1: source_finding/source field name mismatch in changeset write/parse round-trip

**Severity:** major
**Source:** quality
**Requirement:** TC-02 / FN-04
**Verdict:** regression (proven)

**Evidence (from reviewer):**
- `refinement.cjs:524` -- `lines.push(\`- **Source:** ${entry.source_finding || 'user-initiated'}\`);`
- `refinement.cjs:600` -- `source: sourceMatch ? sourceMatch[1].trim() : '',`
- Reasoning: Writer reads `entry.source_finding`, renders as `**Source:**`. Parser deserializes `**Source:**` back as `entry.source` (not `source_finding`). Silent field rename during round-trip. Any downstream consumer expecting `source_finding` after parsing gets `undefined`.

**Spot-check:** verified -- confirmed writer uses `source_finding` at line 524, parser outputs `source` at line 600.

---

#### Finding 2: Missing secondary sort by severity within type groups (FN-04)

**Severity:** major
**Source:** quality, technical (cross-layer note)
**Requirement:** FN-04
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `FEATURE.md:127` -- "Entries sorted by type, then by finding severity"
- `refinement.cjs:481-483` -- sort only compares `TYPE_ORDER[a.type]` vs `TYPE_ORDER[b.type]`; no secondary comparator for severity.
- Reasoning: FN-04 requires two-level sort. Only type-level sort is implemented. Entries within a type group retain insertion order.

**Spot-check:** verified -- confirmed sort at line 481-483 has no secondary key.

---

#### Finding 3: TC-01 requirement text references stale route name and module

**Severity:** minor
**Source:** quality, technical
**Requirement:** TC-01
**Verdict:** not met (proven) -- documentation drift, implementation is correct

**Evidence (from reviewer):**
- `FEATURE.md:145` -- "Change set writing uses `refinement-write` CLI route from refinement-artifact"
- `refinement-qa.md:134` -- actual route is `changeset-write`
- `gsd-tools.cjs:455` -- registered route is `changeset-write`
- Reasoning: The implementation correctly uses `changeset-write`. The FEATURE.md requirement text was never updated to match. Misleads future contributors but does not affect runtime behavior.

**Spot-check:** verified -- FEATURE.md:145 says `refinement-write`, code uses `changeset-write`.

---

#### Finding 4: parseMarkdownTable does not stop at table boundary

**Severity:** minor
**Source:** quality
**Requirement:** quality (robustness)
**Verdict:** not met (suspected) -- latent bug

**Evidence (from reviewer):**
- `refinement.cjs:44-46` -- loop `continue`s past non-pipe lines instead of `break`ing, so multiple tables in one file would merge into a single result.
- Reasoning: Currently used only for files that likely contain single tables (matrix.md, dependency-graph.md). Latent bug, not active. Trivial fix: `break` instead of `continue`.

**Spot-check:** verified -- confirmed `continue` at line 46 instead of `break`.

---

#### Finding 5: Workflow reads files directly instead of receiving orchestrator-loaded content (TC-01)

**Severity:** minor
**Source:** technical
**Requirement:** TC-01
**Verdict:** met (spec-vs-reality gap, by design)

**Evidence (from reviewer):**
- `FEATURE.md:144` -- "No file I/O for scan artifacts -- orchestrator loads and passes contents"
- `refinement-qa.md:16` -- `Read .planning/refinement/RECOMMENDATIONS.md` (direct file read)
- Reasoning: The workflow is a prompt consumed by the LLM agent, which uses its Read tool to access files. There is no separate orchestrator pre-loading content. The `<inputs>` block at line 9-10 confirms: "No explicit inputs -- reads from .planning/refinement/ directory." This is a pragmatic and correct design choice for the agent execution model.

**Spot-check:** verified.

---

#### Finding 6: Banner style uses dashes instead of heavy lines from ui-brand.md

**Severity:** minor
**Source:** technical, quality
**Requirement:** TC-01
**Verdict:** met (systemic, not a regression)

**Evidence (from reviewer):**
- `refinement-qa.md:42-44` -- uses `-------` dashes with `GSD >` prefix
- `ui-brand.md:10-12` -- specifies heavy lines with different prefix
- Quality reviewer notes all other workflows in the codebase use the same dash style, making this a systemic brand-guide drift, not a refinement-qa-specific issue.

**Spot-check:** not checked (cosmetic, low priority).

---

#### Finding 7: Checkpoint trigger condition not explicitly stated in workflow body

**Severity:** minor
**Source:** functional
**Requirement:** FN-02
**Verdict:** met (minor instruction precision gap)

**Evidence (from reviewer):**
- `refinement-qa.md:131` -- heading says "Checkpoint write (every 7 items)" but body lacks explicit `if checkpoint_counter === 7` conditional.
- Reasoning: The heading + success_criteria line 214 together make intent unambiguous. Claude will likely follow the heading. Verdict: met.

**Spot-check:** verified -- confirmed heading at line 131 and body at lines 132-137.

---

#### Finding 8: EU-01 -- Guided refinement discussion

**Severity:** n/a (pass)
**Source:** end-user
**Requirement:** EU-01
**Verdict:** met

All 6 acceptance criteria verified: full agenda walk, 3 options per item, deeper questions support, open-ended phase, GSD exit pattern, changeset output. No issues found.

**Spot-check:** verified (lines 84, 98, 125-129, 140-148, 170-178).

---

#### Finding 9: EU-02 -- User-initiated changes during Q&A

**Severity:** n/a (pass)
**Source:** end-user
**Requirement:** EU-02
**Verdict:** met

All 4 acceptance criteria verified: new concerns via USER_INITIATED, assumption overrides, identical entry structure, mandatory reasoning persistence.

**Spot-check:** verified (lines 155-162, refinement.cjs:450, 471-478).

---

#### Finding 10: FN-01 -- Agenda loading

**Severity:** n/a (pass)
**Source:** functional
**Requirement:** FN-01
**Verdict:** met

Complete load/parse instructions present. Abort guard for missing RECOMMENDATIONS.md. Supporting utilities in refinement.cjs.

---

#### Finding 11: FN-02 -- Structured Q&A phase

**Severity:** n/a (pass)
**Source:** functional
**Requirement:** FN-02
**Verdict:** met

All sub-behaviors specified: priority-order walk, 3 options, follow-ups, contradiction adjacency, auto-resolve batching, empty response guard, checkpoints.

---

#### Finding 12: FN-03 -- Open-ended phase

**Severity:** n/a (pass)
**Source:** functional
**Requirement:** FN-03
**Verdict:** met

USER_INITIATED, ASSUMPTION_OVERRIDE, revisit decisions, and exit loop all properly specified.

---

#### Finding 13: TC-02 -- Change set format

**Severity:** n/a (pass)
**Source:** technical, functional
**Requirement:** TC-02
**Verdict:** met

Markdown+frontmatter format, all 6 entry types, changeset-parse compatible, checkpoint support with partial-status guard.

---

### Conflicts

#### Disagreements

- **TC-01 "no file I/O" constraint:** Technical reviewer flags this as a spec-vs-reality gap (workflow reads files directly). No other reviewer raises it as an issue.
  - Resolution: The technical reviewer correctly identifies the gap but also correctly explains why it is by design. The FEATURE.md constraint assumed a pre-loading orchestrator that does not exist in the agent model. Implementation is correct; spec text is aspirational/stale. No action needed on the workflow; FEATURE.md could be updated for clarity.
  - Tiebreaker applied: no -- judgment sufficient.

- **Banner style:** Technical reviewer flags as a deviation from ui-brand.md. Quality reviewer says it matches codebase convention and is not a regression.
  - Resolution: Quality reviewer is correct -- this is systemic brand-guide drift affecting all workflows, not a refinement-qa-specific issue. Should not block this feature.
  - Tiebreaker applied: no -- judgment sufficient.

#### Tensions

- **Checkpoint trigger precision:** Functional reviewer notes the checkpoint conditional is implicit (heading only). Quality reviewer does not flag this. End-user reviewer treats checkpoints as fully specified.
  - Assessment: The functional reviewer's observation is valid but low-impact. The heading "every 7 items" plus the success criteria make intent clear enough for Claude to follow. Could be made more explicit in a future pass but is not blocking.

- **FN-04 sort scope:** Technical reviewer defers the missing severity sort to functional layer as "not a TC-02 gap." Quality reviewer raises it directly as a proven not-met. Both agree the gap exists.
  - Assessment: No conflict -- both agree. Quality reviewer appropriately owns the finding. Technical reviewer correctly scoped it as outside TC-02.

---

### Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 2     |
| Minor    | 5     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01  | met | -- | end-user |
| EU-02  | met | -- | end-user |
| FN-01  | met | -- | functional |
| FN-02  | met | minor (checkpoint precision) | functional |
| FN-03  | met | -- | functional |
| FN-04  | not met | major (missing severity sort) | quality, technical |
| TC-01  | met (with gaps) | minor (stale spec text, banner) | technical, quality |
| TC-02  | met | major (field name mismatch in round-trip) | quality |

**Action items (ordered by priority):**

1. **Fix source_finding/source field mismatch** (major) -- Either rename parser output from `source` to `source_finding`, or update workflow/writer to use `source`. Must be consistent across write/parse boundary.
2. **Add secondary sort by severity** (major) -- `refinement.cjs:481-483` needs a secondary comparator within type groups per FN-04.
3. **Update FEATURE.md TC-01** (minor) -- Change `refinement-write` to `changeset-write` and remove `refinement-artifact` module reference.
4. **parseMarkdownTable boundary** (minor) -- Change `continue` to `break` at `refinement.cjs:46` to stop at first non-table line.
5. **Checkpoint trigger condition** (minor) -- Add explicit `if checkpoint_counter === 7` to workflow body for instruction precision.
