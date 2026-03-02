# Phase 13: Multi-Scenario E2E Testing & Cleanup - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Test all v2 flows end-to-end across 13 realistic scenarios. Fix simple breaks inline, log broader friction. Triage all findings with human review. Do a targeted sweep for remaining dead references. Phase exits with everything working AND polished — Phase 14 is strictly install packaging.

</domain>

<decisions>
## Implementation Decisions

### Test scenario design
- All scenarios grounded in a single roleplay: building a "personal workout app" for someone who wants balanced cardio + strength training, no gym/weights/machines
- Single narrative across all framings — the workout app is the "new" project, then enhance/debug/refactor layer onto it
- 13 scenarios total:
  1. **Greenfield new project (full capability):** init → discuss capability → full pipeline. "Personal workout app."
  2. **Single feature (not full capability):** Pipeline for one feature within the workout app, not a whole capability. Tests granularity.
  3. **Enhance framing:** "Add a weekly progress tracker" to the existing workout app.
  4. **Debug framing:** "The workout timer isn't counting down correctly."
  5. **Refactor framing:** "Reorganize the workout data model."
  6. **Brownfield init:** Strip `.planning/` and `.documentation/` from the built workout app, re-run init. Tests auto-detection of existing code and capability discovery.
  7. **Mid-pipeline: plan:** Pre-stage artifacts through discuss, jump straight to plan.
  8. **Mid-pipeline: execute:** Pre-stage artifacts through plan, jump straight to execute.
  9. **Mid-pipeline: review:** Pre-stage artifacts through execute, jump straight to review.
  10. **Milestone/roadmap sequencing:** Create milestone, add capabilities/features, verify state tracking.
  11. **Create focus:** Simulate setting a focus to guide work priority.
  12. **Conflicting focus:** Set a focus that conflicts with current work. Test how GSD handles the conflict.
  13. **Parallel focus:** Multiple focuses running in parallel. Test that work streams don't collide.
- Scenarios can run in parallel where independent (like separate terminal windows)

### Failure handling
- Fix simple issues inline (syntax bugs, easy replacements) — keep the scenario moving
- Log broader workflow friction, potential awkwardness, and risks to a central `13-FINDINGS.md`
- All findings triaged in a human Q&A pass: each item marked "fix" or "ignore" — nothing unexamined
- Flag cross-scenario impacts during parallel runs (fixes in one scenario could affect another mid-run)
- Sequential fixes are low risk and can proceed without re-runs

### Evidence & artifacts
- Per-scenario reports in `.planning/phases/13-multi-scenario-e2e-testing-cleanup/scenarios/`
- Each report includes: scenario goal, steps taken, simulated user interactions (what was asked/chosen), result, findings
- No summary rollup needed — individual reports + findings doc tell the full story

### Cleanup scope
- Test-driven fixes first: fix what the 13 scenarios reveal
- Then a targeted sweep for known problem patterns (v1 remnants, dead refs, etc.) — Claude's discretion on specific patterns
- Sweep findings go into the same `13-FINDINGS.md` and same triage Q&A pass
- Phase 13 exit criteria: flows work correctly AND feel polished (good error messages, clean output, no rough edges)
- Phase 14 is strictly install mechanics (npm install, path tokens, deploy artifacts)

### Claude's Discretion
- Specific grep patterns for the targeted sweep (based on what prior phases cleaned up)
- How to mock/pre-stage artifacts for mid-pipeline entry scenarios
- Scenario execution order and parallelization strategy
- Level of detail in scenario reports

</decisions>

<specifics>
## Specific Ideas

- Workout app persona: "wants a balance of cardio and strength training, but doesn't have a gym membership, weights, or machines" — ground all scenarios in this context
- Brownfield test: mock deleting all planning docs and documentation, then walk through fresh init as if discovering the codebase for the first time
- Mid-pipeline entry: define what the user would "see" at each entry point, mock that state, then test from there
- Run parallel scenarios like parallel terminal windows in real life

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-multi-scenario-e2e-testing-cleanup*
*Context gathered: 2026-03-02*
