# CLI Dead Code Audit — Research Findings

**Audited:** 2026-03-01
**Scope:** CLN-03 — Full audit of gsd-tools.cjs and all bin/lib/*.cjs modules
**Method:** grep for callers across surviving workflows, commands, agents, references, hooks, and templates

---

## 1. CLI Routes Audit

Every `case` in the `gsd-tools.cjs` switch router, checked for callers.

| Route | Callers Found | Verdict |
|-------|--------------|---------|
| `state` (load/json/update/get/patch) | `state load` in planning-config.md (ref only); `state json` in pipeline-invariants.md (ref only); `state update`/`get`/`patch` — zero workflow callers | **KEEP** (state load/json used by hooks/refs; update/get/patch are generic primitives) |
| `state advance-plan` | execute-plan.md | **KEEP** |
| `state record-metric` | execute-plan.md | **KEEP** |
| `state update-progress` | execute-plan.md | **KEEP** |
| `state add-decision` | execute-plan.md | **KEEP** |
| `state add-blocker` | execute-plan.md | **KEEP** |
| `state resolve-blocker` | **ZERO callers** | **REMOVE** |
| `state record-session` | execute-plan.md | **KEEP** |
| `resolve-model` | **ZERO workflow callers** (init commands resolve models internally) | **REMOVE** — model resolution happens inside init commands, not via CLI route |
| `find-phase` | execute-phase.md, phase-argument-parsing.md (ref) | **KEEP** |
| `commit` | 15+ workflow callers | **KEEP** |
| `verify-summary` | **ZERO callers** | **REMOVE** |
| `template select` | **ZERO callers** | **REMOVE** |
| `template fill` | framing-discovery.md (discovery-brief only) | **KEEP** (but audit template fill types — only discovery-brief is called) |
| `frontmatter get` | verify-phase.md | **KEEP** |
| `frontmatter set` | **ZERO callers** | **REMOVE** |
| `frontmatter merge` | **ZERO callers** | **REMOVE** |
| `frontmatter validate` | **ZERO callers** | **REMOVE** |
| `verify plan-structure` | **ZERO callers** | **REMOVE** |
| `verify phase-completeness` | **ZERO callers** | **REMOVE** |
| `verify references` | **ZERO callers** | **REMOVE** |
| `verify commits` | **ZERO callers** | **REMOVE** |
| `verify artifacts` | verify-phase.md | **KEEP** |
| `verify key-links` | verify-phase.md | **KEEP** |
| `generate-slug` | decimal-phase-calculation.md (ref only) | **REMOVE** — only ref caller, ref itself is likely dead |
| `current-timestamp` | **ZERO callers** | **REMOVE** |
| `verify-path-exists` | **ZERO callers** | **REMOVE** |
| `config-ensure-section` | **ZERO callers** | **REMOVE** |
| `config-set` | transition.md | **KEEP** |
| `config-get` | execute-phase.md, plan-phase.md, execute-plan.md | **KEEP** |
| `history-digest` | **ZERO callers** | **REMOVE** |
| `phases list` | execute-plan.md | **KEEP** |
| `roadmap get-phase` | verify-phase.md, plan-phase.md, research-phase.md | **KEEP** |
| `roadmap analyze` | transition.md, progress.md | **KEEP** |
| `roadmap update-plan-progress` | execute-plan.md | **KEEP** |
| `requirements mark-complete` | execute-plan.md | **KEEP** |
| `phase next-decimal` | decimal-phase-calculation.md (ref only) | **FLAG** — only ref caller; phase ops may be needed for roadmap modifications |
| `phase add` | **ZERO callers** | **REMOVE** |
| `phase insert` | **ZERO callers** | **REMOVE** |
| `phase remove` | **ZERO callers** | **REMOVE** |
| `phase complete` | execute-phase.md, transition.md | **KEEP** |
| `milestone complete` | **ZERO workflow callers** | **REMOVE** — milestone commands deleted in Phase 8 per 10-CONTEXT.md |
| `validate consistency` | **ZERO callers** | **REMOVE** |
| `progress` | transition.md (bar), progress.md | **KEEP** |
| `scaffold` | **ZERO callers** (framing-discovery uses `template fill`, not scaffold) | **REMOVE** |
| `init execute-phase` | execute-phase.md, execute-plan.md | **KEEP** |
| `init plan-phase` | plan-phase.md | **KEEP** |
| `init new-project` | **ZERO callers** | **REMOVE** — replaced by `init project` |
| `init new-milestone` | **ZERO callers** | **REMOVE** — milestone concept removed |
| `init quick` | **ZERO callers** | **REMOVE** |
| `init resume` | resume-work.md | **KEEP** |
| `init verify-work` | **ZERO callers** | **REMOVE** |
| `init phase-op` | verify-phase.md, research-phase.md | **KEEP** |
| `init milestone-op` | **ZERO callers** | **REMOVE** — milestone concept removed |
| `init map-codebase` | **ZERO callers** (only template ref to deleted `/gsd:map-codebase` command) | **REMOVE** |
| `init progress` | progress.md | **KEEP** |
| `init review-phase` | review-phase.md | **KEEP** |
| `init doc-phase` | doc-phase.md | **KEEP** |
| `init project` | init-project.md | **KEEP** |
| `init framing-discovery` | framing-discovery.md | **KEEP** |
| `init discuss-capability` | discuss-capability.md | **KEEP** |
| `init discuss-feature` | discuss-feature.md | **KEEP** |
| `init plan-feature` | **ZERO callers** | **FLAG** — v2 route with no workflow yet; likely needed for Phase 11/12 |
| `init execute-feature` | **ZERO callers** | **FLAG** — v2 route with no workflow yet; likely needed for Phase 11/12 |
| `init feature-op` | **ZERO callers** | **FLAG** — v2 route with no workflow yet |
| `init feature-progress` | **ZERO callers** | **FLAG** — v2 route with no workflow yet |
| `phase-plan-index` | execute-phase.md, pipeline-invariants.md (ref) | **KEEP** |
| `state-snapshot` | progress.md | **KEEP** |
| `summary-extract` | progress.md | **KEEP** |
| `websearch` | **ZERO workflow callers** | **REMOVE** — Brave Search API wrapper, agents use built-in WebSearch |
| `plan-validate` | plan-phase.md | **KEEP** |
| `capability-create` | init-project.md | **KEEP** |
| `capability-list` | discuss-capability.md | **KEEP** |
| `capability-status` | **ZERO callers** | **FLAG** — v2 command with no workflow caller yet |
| `feature-create` | **ZERO callers** | **FLAG** — likely used by discuss-feature implicitly, needs verification |
| `feature-list` | **ZERO callers** | **FLAG** — v2 command |
| `feature-status` | **ZERO callers** | **FLAG** — v2 command |

### Summary: Routes to REMOVE (18 dead routes)

1. `state resolve-blocker`
2. `resolve-model`
3. `verify-summary`
4. `template select`
5. `frontmatter set`
6. `frontmatter merge`
7. `frontmatter validate`
8. `verify plan-structure`
9. `verify phase-completeness`
10. `verify references`
11. `verify commits`
12. `generate-slug`
13. `current-timestamp`
14. `verify-path-exists`
15. `config-ensure-section`
16. `history-digest`
17. `phase add`
18. `phase insert`
19. `phase remove`
20. `milestone complete` (entire route + milestone.cjs cmdMilestoneComplete)
21. `validate consistency`
22. `scaffold`
23. `init new-project`
24. `init new-milestone`
25. `init quick`
26. `init verify-work`
27. `init milestone-op`
28. `init map-codebase`
29. `websearch`

### Routes to FLAG (keep for now, review at Phase 11)

- `init plan-feature`, `init execute-feature`, `init feature-op`, `init feature-progress` — v2 init routes with no consuming workflow yet. These were built in anticipation of v2 feature workflows. Keep until Phase 11 proves or disproves their need.
- `capability-status`, `feature-create`, `feature-list`, `feature-status` — v2 flat-verb commands with zero or indirect callers. Same reasoning.
- `phase next-decimal` — only called by decimal-phase-calculation.md reference. If that ref is removed, this has zero callers. But phase decimal operations may still be useful for roadmap modifications.

---

## 2. core.cjs Functions

| Export | Callers | Verdict |
|--------|---------|---------|
| `MODEL_PROFILES` | commands.cjs (cmdResolveModel), core.cjs (resolveModelInternal) | **FLAG** — v1 lookup table. If `resolve-model` route is removed, only used internally by resolveModelInternal. See Model Profile Gaps below. |
| `ROLE_MODEL_MAP` | core.cjs (resolveModelFromRole) | **KEEP** — v2 role-based resolution |
| `output` | All lib/*.cjs files | **KEEP** |
| `error` | All lib/*.cjs files, gsd-tools.cjs | **KEEP** |
| `safeReadFile` | core.cjs (resolveModelFromRole) | **KEEP** — used internally |
| `loadConfig` | commands.cjs, init.cjs, state.cjs | **KEEP** |
| `isGitIgnored` | commands.cjs (cmdCommit) | **KEEP** |
| `execGit` | commands.cjs (cmdCommit) | **KEEP** |
| `escapeRegex` | phase.cjs, roadmap.cjs, core.cjs | **KEEP** — internal utility |
| `normalizePhaseName` | phase.cjs, commands.cjs, template.cjs, verify.cjs, roadmap.cjs, init.cjs | **KEEP** |
| `comparePhaseNum` | phase.cjs, commands.cjs, core.cjs | **KEEP** |
| `searchPhaseInDir` | core.cjs (findPhaseInternal) — **not directly imported by anyone else** | **KEEP** — internal helper used by findPhaseInternal |
| `findPhaseInternal` | init.cjs, commands.cjs, template.cjs, verify.cjs, roadmap.cjs | **KEEP** |
| `getArchivedPhaseDirs` | phase.cjs, commands.cjs | **KEEP** |
| `getRoadmapPhaseInternal` | init.cjs | **KEEP** |
| `resolveModelInternal` | commands.cjs, init.cjs, core.cjs | **KEEP** (needed until MODEL_PROFILES is fully replaced by ROLE_MODEL_MAP) |
| `resolveModelFromRole` | **ZERO callers outside core.cjs** (exported but never imported) | **FLAG** — exported for v2 agents, but no code actually calls it yet. The function exists and is referenced in model-profiles.md docs, but no workflow/init command uses it. |
| `pathExistsInternal` | init.cjs | **KEEP** |
| `generateSlugInternal` | commands.cjs, core.cjs, phase.cjs, template.cjs | **KEEP** |
| `getMilestoneInfo` | commands.cjs, init.cjs, state.cjs | **KEEP** — extracts version/name from ROADMAP.md |
| `toPosixPath` | core.cjs, init.cjs | **KEEP** |
| `findCapabilityInternal` | core.cjs (findFeatureInternal), init.cjs | **KEEP** |
| `findFeatureInternal` | init.cjs | **KEEP** |

### Dead in core.cjs: 1 function

- `resolveModelFromRole` — exported but zero external callers. However, this is the **v2 model resolution** function. It should be wired in, not removed. See Model Profile Gaps.

---

## 3. init.cjs Functions

### v1 Functions (phase-based)

| Function | Route | Callers | Verdict |
|----------|-------|---------|---------|
| `cmdInitExecutePhase` | `init execute-phase` | execute-phase.md, execute-plan.md | **KEEP** |
| `cmdInitPlanPhase` | `init plan-phase` | plan-phase.md | **KEEP** |
| `cmdInitNewProject` | `init new-project` | **ZERO** | **REMOVE** |
| `cmdInitNewMilestone` | `init new-milestone` | **ZERO** | **REMOVE** |
| `cmdInitQuick` | `init quick` | **ZERO** | **REMOVE** |
| `cmdInitResume` | `init resume` | resume-work.md | **KEEP** |
| `cmdInitVerifyWork` | `init verify-work` | **ZERO** | **REMOVE** |
| `cmdInitPhaseOp` | `init phase-op` | verify-phase.md, research-phase.md | **KEEP** |
| `cmdInitMilestoneOp` | `init milestone-op` | **ZERO** | **REMOVE** |
| `cmdInitMapCodebase` | `init map-codebase` | **ZERO** | **REMOVE** |
| `cmdInitReviewPhase` | `init review-phase` | review-phase.md | **KEEP** |
| `cmdInitDocPhase` | `init doc-phase` | doc-phase.md | **KEEP** |
| `cmdInitProgress` | `init progress` | progress.md | **KEEP** |

### v2 Functions (capability/feature-based)

| Function | Route | Callers | Verdict |
|----------|-------|---------|---------|
| `cmdInitProject` | `init project` | init-project.md | **KEEP** |
| `cmdInitFramingDiscovery` | `init framing-discovery` | framing-discovery.md | **KEEP** |
| `cmdInitDiscussCapability` | `init discuss-capability` | discuss-capability.md | **KEEP** |
| `cmdInitDiscussFeature` | `init discuss-feature` | discuss-feature.md | **KEEP** |
| `cmdInitPlanFeature` | `init plan-feature` | **ZERO** | **FLAG** — v2 scaffolding, no workflow yet |
| `cmdInitExecuteFeature` | `init execute-feature` | **ZERO** | **FLAG** — v2 scaffolding, no workflow yet |
| `cmdInitFeatureOp` | `init feature-op` | **ZERO** | **FLAG** — v2 scaffolding, no workflow yet |
| `cmdInitFeatureProgress` | `init feature-progress` | **ZERO** | **FLAG** — v2 scaffolding, no workflow yet |

### Definite REMOVE (5 functions):
`cmdInitNewProject`, `cmdInitNewMilestone`, `cmdInitQuick`, `cmdInitVerifyWork`, `cmdInitMilestoneOp`, `cmdInitMapCodebase`

---

## 4. state.cjs Functions

| Export | Callers | Verdict |
|--------|---------|---------|
| `stateExtractField` | state.cjs internal only | **KEEP** — internal helper |
| `stateReplaceField` | state.cjs internal only | **KEEP** — internal helper |
| `writeStateMd` | state.cjs, milestone.cjs | **KEEP** |
| `cmdStateLoad` | gsd-tools.cjs (state default) | **KEEP** |
| `cmdStateGet` | gsd-tools.cjs (state get) | **KEEP** |
| `cmdStatePatch` | gsd-tools.cjs (state patch) | **KEEP** |
| `cmdStateUpdate` | gsd-tools.cjs (state update) | **KEEP** |
| `cmdStateAdvancePlan` | gsd-tools.cjs (state advance-plan) -> execute-plan.md | **KEEP** |
| `cmdStateRecordMetric` | gsd-tools.cjs (state record-metric) -> execute-plan.md | **KEEP** |
| `cmdStateUpdateProgress` | gsd-tools.cjs (state update-progress) -> execute-plan.md | **KEEP** |
| `cmdStateAddDecision` | gsd-tools.cjs (state add-decision) -> execute-plan.md | **KEEP** |
| `cmdStateAddBlocker` | gsd-tools.cjs (state add-blocker) -> execute-plan.md | **KEEP** |
| `cmdStateResolveBlocker` | gsd-tools.cjs (state resolve-blocker) -> **ZERO workflow callers** | **REMOVE** |
| `cmdStateRecordSession` | gsd-tools.cjs (state record-session) -> execute-plan.md | **KEEP** |
| `cmdStateSnapshot` | gsd-tools.cjs (state-snapshot) -> progress.md | **KEEP** |
| `cmdStateJson` | gsd-tools.cjs (state json) | **KEEP** |

### Dead in state.cjs: 1 function
- `cmdStateResolveBlocker` — zero workflow callers

---

## 5. Model Profile Gaps

### Current State

**core.cjs MODEL_PROFILES (v1):**
```
gsd-planner:              opus / opus / sonnet
gsd-roadmapper:           opus / sonnet / sonnet
gsd-executor:             opus / sonnet / sonnet
gsd-project-researcher:   opus / sonnet / haiku
gsd-research-synthesizer: sonnet / sonnet / haiku
gsd-debugger:             opus / sonnet / sonnet
gsd-codebase-mapper:      sonnet / haiku / haiku    <-- AGENT DELETED
gsd-verifier:             sonnet / sonnet / haiku
gsd-plan-checker:         sonnet / sonnet / haiku
gsd-integration-checker:  sonnet / sonnet / haiku
```

**core.cjs ROLE_MODEL_MAP (v2):**
```
executor: sonnet
judge:    inherit (opus)
```

### v2 Standard (from 10-CONTEXT.md)

| Role | Model | Assignment |
|------|-------|------------|
| Main/orchestrator | Opus | User session |
| Research/execution | Sonnet | executor role_type |
| Judge/review | Opus (inherit) | judge role_type |
| Quick tasks, no logic | Haiku | Not yet in ROLE_MODEL_MAP |

### Gaps to Fix

1. **`gsd-codebase-mapper` in MODEL_PROFILES** — agent was deleted in Phase 8. Remove from table.
2. **ROLE_MODEL_MAP missing `haiku` tier** — v2 standard defines a "quick tasks" tier but ROLE_MODEL_MAP only has executor/judge. Add a third role or handle haiku via override.
3. **`resolveModelFromRole` is exported but never called** — No init command or workflow uses it yet. v2 agents with `role_type` frontmatter should resolve via this function, but the wiring is incomplete.
4. **model-profiles.md** says "Phase 7 cleanup removes v1 table" at line 87 — this never happened. The v1 MODEL_PROFILES table is still in core.cjs and still used by init commands via `resolveModelInternal`. Needs reconciliation: either remove v1 table and switch init commands to `resolveModelFromRole`, or keep both with a clear deprecation plan.
5. **model-profiles.md Coexistence section** is stale — references "Phase 7 cleanup" which is done but didn't remove v1 table.
6. **model-profile-resolution.md** referenced by plan-phase.md — needs same update.

### Recommended Actions

- Remove `gsd-codebase-mapper` from MODEL_PROFILES
- Update model-profiles.md to remove "Phase 7 cleanup removes v1 table" claim
- Add `quick: 'haiku'` to ROLE_MODEL_MAP to match v2 standard
- Keep both resolution systems until all init commands are migrated to role-based resolution (deferred to Phase 12)

---

## 6. Dead State Fields

| Field | Where Used | Callers | Verdict |
|-------|-----------|---------|---------|
| `milestone_name` | state.cjs (buildStateFrontmatter line 649), init.cjs (5 occurrences), commands.cjs (line 404) | Written to STATE.md frontmatter and returned by init commands | **KEEP** — milestone_name comes from getMilestoneInfo() which reads ROADMAP.md heading. It's a computed field, not a tracked field. Still valid for v2. |
| `milestone` (version) | state.cjs (buildStateFrontmatter line 648) | Same as above | **KEEP** |
| `current_capability` / `current_feature` | state.cjs buildStateFrontmatter (lines 656-657) | Legacy field names alongside `active_capability`/`active_feature` | **FLAG** — dual naming: `current_*` and `active_*` both extracted. Consolidate to `active_*` only. |
| `gsd_state_version: '1.0'` | state.cjs buildStateFrontmatter (line 646) | Hardcoded in every frontmatter build | **FLAG** — review if version bump needed for v2 state format |

### Observations

- `milestone_name` is NOT dead. It's a derived field from the ROADMAP.md heading, used by multiple init commands and the progress renderer. The 10-CONTEXT.md says "remove if nothing reads/writes them" — things DO read it.
- The `current_capability`/`current_feature` vs `active_capability`/`active_feature` dual naming is messy. Should consolidate to one convention.

---

## 7. v1 Phase Command Safety

### Question: Do phases 11-12 depend on v1 phase CLI commands?

**ROADMAP.md Phase 11 (Automated Testing):**
- Tests every surviving command fires without error
- Tests @file references resolve
- No mention of phase CLI commands (`phase add`, `phase insert`, `phase remove`)

**ROADMAP.md Phase 12 (Install & Try New Project):**
- npm install -g deployment
- {GSD_ROOT} tokenization
- install.js cleanup
- Smoke tests on fresh/existing projects
- No mention of phase lifecycle CLI commands

**Verdict:** Phases 11-12 do NOT depend on v1 phase lifecycle commands (`phase add`, `phase insert`, `phase remove`). They are safe to remove.

**However:** The following v1 phase commands ARE still called by surviving workflows:
- `phase complete` — execute-phase.md, transition.md
- `find-phase` — execute-phase.md
- `phase-plan-index` — execute-phase.md
- `phases list` — execute-plan.md

These v1 phase operations support the phase-based execution workflows that still exist. They must be kept.

### Phase commands to REMOVE:
- `phase add`
- `phase insert`
- `phase remove`
- `phase next-decimal` (only ref caller is decimal-phase-calculation.md)

### Phase commands to KEEP:
- `phase complete`
- `find-phase`
- `phase-plan-index`
- `phases list`

---

## 8. Risk Flags

### HIGH RISK — Do Not Remove Without Verification

1. **v2 init commands (plan-feature, execute-feature, feature-op, feature-progress)** — These have zero callers TODAY but were explicitly built for the v2 pipeline. Removing them would require rebuilding them when v2 feature workflows are created. Recommend: keep, flag as "unused until v2 workflows wired".

2. **v2 flat-verb commands (capability-status, feature-create, feature-list, feature-status)** — Same reasoning. feature-create in particular may be used indirectly by discuss-feature workflow via user instruction to run the CLI command. Needs manual verification.

3. **resolveModelFromRole** — Zero callers but it's the v2 model resolution path. Don't remove — wire it in.

### MEDIUM RISK

4. **milestone.cjs cmdMilestoneComplete** — The `milestone complete` route has zero callers, but `cmdRequirementsMarkComplete` in the same file IS called (by execute-plan.md). Can remove `cmdMilestoneComplete` but must keep `cmdRequirementsMarkComplete`. Do NOT delete the entire milestone.cjs file.

5. **verify.cjs** — Multiple verify subcommands are dead (plan-structure, phase-completeness, references, commits), but `verify artifacts` and `verify key-links` are live. Must surgically remove dead functions, not the whole module.

6. **template.cjs** — `template select` is dead, but `template fill` is used (discovery-brief). Keep the fill path, remove select.

7. **frontmatter.cjs** — `frontmatter get` is used by verify-phase.md. `set`, `merge`, `validate` are dead CLI routes, but the underlying functions (`extractFrontmatter`, `reconstructFrontmatter`) are used extensively by state.cjs, commands.cjs, etc. Only remove the CLI route handlers, NOT the core parsing functions.

### LOW RISK

8. **model-profiles.md "Phase 7 cleanup removes v1 table"** — Stale documentation claim. Update text, no code impact.

9. **decimal-phase-calculation.md** — Only caller of `generate-slug` and `phase next-decimal` CLI routes. If this reference doc is removed in the CLN-05 reference audit, those routes become truly dead.

10. **gsd-codebase-mapper in MODEL_PROFILES** — Dead agent reference. Safe to remove from the table.

---

## Appendix: Files Requiring Changes

### Router (gsd-tools.cjs)
- Remove 29 dead routes listed in section 1
- Remove `require('./lib/milestone.cjs')` — BUT only if cmdRequirementsMarkComplete moves or the file is restructured. Currently milestone.cjs exports both dead (cmdMilestoneComplete) and live (cmdRequirementsMarkComplete) functions.

### Lib Modules
- **core.cjs**: Remove `gsd-codebase-mapper` from MODEL_PROFILES. Consider adding `quick: 'haiku'` to ROLE_MODEL_MAP.
- **init.cjs**: Remove 6 dead functions. Keep 4 flagged v2 functions.
- **state.cjs**: Remove cmdStateResolveBlocker.
- **milestone.cjs**: Remove cmdMilestoneComplete. Keep cmdRequirementsMarkComplete. Consider renaming file to `requirements.cjs` since milestone concept is removed.
- **commands.cjs**: Remove cmdGenerateSlug, cmdCurrentTimestamp, cmdVerifyPathExists, cmdHistoryDigest, cmdWebsearch, cmdScaffold. Keep cmdResolveModel only if the route is kept (recommend remove). Keep cmdCommit, cmdSummaryExtract, cmdProgressRender.
- **verify.cjs**: Remove cmdVerifySummary, cmdVerifyPlanStructure, cmdVerifyPhaseCompleteness, cmdVerifyReferences, cmdVerifyCommits, cmdValidateConsistency. Keep cmdVerifyArtifacts, cmdVerifyKeyLinks.
- **template.cjs**: Remove cmdTemplateSelect. Keep cmdTemplateFill.
- **frontmatter.cjs**: Remove cmdFrontmatterSet, cmdFrontmatterMerge, cmdFrontmatterValidate route handlers. Keep cmdFrontmatterGet and all internal parsing functions.
- **phase.cjs**: Remove cmdPhaseAdd, cmdPhaseInsert, cmdPhaseRemove, cmdPhaseNextDecimal. Keep cmdFindPhase, cmdPhaseComplete, cmdPhasePlanIndex, cmdPhasesList.

### References (flagged for CLN-05 pass)
- model-profiles.md: Update stale "Phase 7 cleanup" claim, remove gsd-codebase-mapper
- model-profile-resolution.md: Align with model-profiles.md updates
- decimal-phase-calculation.md: Likely dead ref — only caller of dead routes
- phase-argument-parsing.md: Still has live callers (find-phase)
- planning-config.md: Still has live callers (state load)
- pipeline-invariants.md: Still has live callers

---

*Research complete. Ready for planning.*
