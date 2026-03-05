## Tech Constraints Findings

### Hard Constraints

- **AskUserQuestion header max 12 characters** -- Hard limit; validation rejects longer headers. Source: `get-shit-done/references/questioning.md:110` ("Headers longer than 12 characters (hard limit -- validation will reject them)")

- **AskUserQuestion only available in orchestrator context** -- Cannot be called from inside Task() subagents. Source: `.planning/phases/04-review-layer/research/tech-constraints-findings.md:41` ("Available in the main orchestrator conversation (not inside Task subagents)")

- **`refinement-write` valid types: matrix, dependency-graph, finding, delta, checkpoint, recommendations** -- "changeset" is NOT a valid type. Source: `refinement-artifact/01-PLAN.md:102`. Adding a new type requires modifying `lib/refinement.cjs` (cmdRefinementWrite) and possibly gsd-tools.cjs routing.

- **Zero runtime dependencies** -- All parsing must use Node.js stdlib or vendored js-yaml 4.1.1. No external markdown parsing, YAML parsing, or diff libraries. Source: `.planning/PROJECT.md:77` ("Zero runtime dependencies -- Node.js stdlib + vendored js-yaml 4.1.1 + argparse")

- **Node.js >= 16.7.0** -- Minimum runtime version. Source: `package.json:37` (engines field)

- **`refinement.cjs` does not exist yet** -- Planned in refinement-artifact plans but not yet built (no file at `get-shit-done/bin/lib/refinement.cjs`). All CLI routes (refinement-init, refinement-write, refinement-report, refinement-delta) are unbuilt. Source: filesystem check, `ls` returned no file.

### Dependency Capabilities

- **AskUserQuestion options: 2-4 guidance, not hard limit** -- The questioning.md reference says "2-4 is ideal" (guidance), and plan-presentation/03-SUMMARY.md claims "AskUserQuestion has a max of 4 options" (treated as tool constraint). However, the review workflow (`get-shit-done/workflows/review.md:127-132`) successfully uses 5 options (Accept, Accept+Edit, Research, Defer, Dismiss). Later, plan-presentation review itself switched to multiSelect with 5 flat options (`plan-workflow.md:91`). **Conclusion:** 3 options as specified in FN-02 is well within bounds. No constraint here.

- **AskUserQuestion supports multiSelect mode** -- Demonstrated in plan workflow deep-dive (`get-shit-done/workflows/plan.md:297`, `multiSelect: true`). Not needed for refinement-qa's 3-option per-item pattern, but available if needed for batch operations.

- **AskUserQuestion empty response bug (GH #29547)** -- Known issue where the tool returns empty on first call in a session. Defense-in-depth hook exists at `hooks/gsd-askuserquestion-guard.js` that detects empty responses and instructs Claude to fall back to text chat. Source: hook file and `.planning/PROJECT.md:56` (listed as active known issue).

- **frontmatter.cjs: extractFrontmatter / reconstructFrontmatter / spliceFrontmatter** -- Available for CHANGESET.md frontmatter. Uses js-yaml FAILSAFE_SCHEMA (all values as strings). Source: `get-shit-done/bin/lib/frontmatter.cjs:14-85`

- **parseMarkdownTable (planned in refinement.cjs)** -- Will parse pipe-delimited markdown tables into row objects. Planned for Q&A agenda parsing from RECOMMENDATIONS.md. Source: `refinement-artifact/01-PLAN.md:117-123`. Not yet built.

- **Existing Q&A loop pattern** -- The questioning.md reference (`get-shit-done/references/questioning.md:17-28`) defines the round loop: AskUserQuestion -> write state -> assess gaps -> confirm or continue. Review workflow (`review.md:122-134`) demonstrates the per-finding iteration pattern with resolution options. Both are directly applicable precedents.

### Compatibility Issues

- **Build order dependency: refinement.cjs must exist before refinement-qa can use `refinement-write`** -- TC-01 specifies change set writing via `refinement-write` CLI route. That route is defined in refinement-artifact (01-PLAN) but not yet built. refinement-qa depends on coherence-report (which depends on landscape-scan), and refinement-artifact is listed as P2 with no dependencies. **Risk:** if refinement-artifact's Plan 01 hasn't been executed when refinement-qa is built, the `refinement-write` route won't exist. Source: `CAPABILITY.md:88-91` (feature table with priority/dependency), `refinement-artifact/01-PLAN.md`

- **"changeset" not a valid `refinement-write` type** -- TC-02 specifies CHANGESET.md written via `refinement-write`. But the current type list is: matrix, dependency-graph, finding, delta, checkpoint, recommendations. Either: (a) add "changeset" as a new type to refinement-write in refinement.cjs, or (b) write CHANGESET.md directly via Node fs. Source: `refinement-artifact/01-PLAN.md:102`, `refinement-qa/FEATURE.md:145`

- **Q&A agenda table format is a contract between coherence-report and refinement-qa** -- The table columns are defined in coherence-report 01-PLAN as: `| # | Category | Topic | Recommended Resolution | Confidence |`. FN-01 must parse this exact structure. Any change to column names/ordering in the synthesizer agent breaks parsing. Source: `coherence-report/01-PLAN.md:192-197`

- **`changeset-parse` CLI route does not exist** -- TC-02 specifies a new `changeset-parse` route in gsd-tools.cjs that reads CHANGESET.md and returns JSON. This requires: new function in refinement.cjs (or a new module), new case in gsd-tools.cjs switch statement. Source: `refinement-qa/FEATURE.md:160`

### Feasibility Assessment

| Design Option | Feasibility | Blocker / Notes |
|---------------|-------------|-----------------|
| Parse Q&A agenda via regex/string splitting (FN-01) | viable | Table format is well-defined: pipe-delimited markdown. `parseMarkdownTable` utility (planned in refinement.cjs) handles this exact pattern. If refinement.cjs not yet built, inline ~20 lines of table parsing is trivial with Node stdlib. Source: `refinement-artifact/01-PLAN.md:117-123` |
| 3 options per AskUserQuestion (FN-02: accept/research/reject) | viable | Within the 2-4 ideal range. Review workflow proves 5 works; 3 is safe. Source: `review.md:127-132`, `questioning.md:109` |
| "Research needed" with follow-up text input | constrained | AskUserQuestion returns the selected option text, not free-form input. Pattern from review workflow: "Accept+Edit" and "Research" options record the selection, then the workflow can use a follow-up AskUserQuestion with an open-ended question ("Describe what needs research") OR rely on the user typing context directly in chat after selecting. The review workflow does not show explicit follow-up for freeform text -- it just records the resolution type. Source: `review.md:128-132`. **Recommendation:** After user selects "Research needed" or "Reject/Modify", ask a follow-up AskUserQuestion with open-ended question field and a single "Done" option, or use the conversational text pattern. |
| "Reject/Modify" with user reasoning capture | constrained | Same constraint as above. AskUserQuestion options are selections, not text fields. Follow-up question needed. See recommendation above. |
| CHANGESET.md with frontmatter + markdown sections | viable | frontmatter.cjs provides extractFrontmatter/spliceFrontmatter for the YAML header (date, counts). Markdown body with structured sections is plain string concatenation. Source: `frontmatter.cjs:14-85` |
| `changeset-parse` CLI route (TC-02) | viable | Follows established pattern: new function in lib module + case in gsd-tools.cjs switch. parseMarkdownTable (from refinement.cjs, when built) handles the section-level table parsing. Frontmatter via extractFrontmatter. ~50-80 lines of new code. Source: pattern from `capability.cjs`, `frontmatter.cjs` |
| Adding "changeset" to refinement-write types | viable | ~5 lines: add case in cmdRefinementWrite's type switch mapping "changeset" to `.planning/refinement/CHANGESET.md`. Source: `refinement-artifact/01-PLAN.md:102-113` (existing type mapping pattern) |
| Writing CHANGESET.md directly (bypass refinement-write) | viable | Fallback if refinement-write not built yet. Direct `fs.writeFileSync` in the workflow. Precedent: coherence-report workflow includes this fallback pattern (`coherence-report/02-PLAN.md:170`). |
| Open-ended phase via "Does this look good?" loop (FN-03) | viable | Exact pattern documented in `questioning.md:17-28`. Used in init-project, discuss-capability, discuss-feature workflows. Well-established GSD convention. |
| Workflow file at workflows/refinement-qa.md (TC-01) | viable | Standard location. 16 workflows already exist in this directory. Source: `ls get-shit-done/workflows/` |

### Alternatives

- **AskUserQuestion cannot capture free-form text inline with option selection** -> **Two-step pattern: selection AskUserQuestion followed by text-capture AskUserQuestion.** After "Research needed" or "Reject/Modify" is selected, fire a second AskUserQuestion: question = "Describe what research is needed / your reasoning for rejection", options = ["Continue" or "Let me type"]. The user's answer text comes through the question response field, not the option selection. Alternatively, after selection, Claude can prompt conversationally and the user types directly in chat (no AskUserQuestion needed for the text capture step). [First principles: AskUserQuestion is for structured choices; free-form text flows through normal chat interaction. The review workflow's "Accept+Edit" and "Research" options don't show explicit text capture -- they record the type and let the re-review cycle handle details.]

- **`refinement-write --type changeset` not available (type not in current spec)** -> **Option A:** Add "changeset" type to refinement-write (5 lines in refinement.cjs). **Option B:** Direct file write with `fs.writeFileSync` to `.planning/refinement/CHANGESET.md` (no CLI route needed). **Option C:** Use `refinement-write --type delta` repurposed (not recommended -- semantic confusion). Source: `coherence-report/02-PLAN.md:170` (fallback pattern precedent).

- **`refinement.cjs` not yet built (parseMarkdownTable unavailable)** -> **Inline the table parser (~20 lines)** in the workflow or changeset-parse module. The logic is: find header row, extract column names, skip separator, parse data rows by splitting on `|`. Alternatively, wait for refinement-artifact execution and depend on its exports. [First principles: table parsing is deterministic string splitting; duplicating 20 lines is acceptable if it removes a build-order dependency.]

- **`changeset-parse` route doesn't exist yet** -> **Build it as part of refinement-qa execution.** New function `cmdChangesetParse(cwd, args, raw)` in refinement.cjs (or standalone). Reads CHANGESET.md, extracts frontmatter + parses each entry section into JSON. Wire as `changeset-parse` case in gsd-tools.cjs. This is new code, not a constraint -- just needs to be in the plan.
