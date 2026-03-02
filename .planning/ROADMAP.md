# Roadmap: GSD v2

## Overview

Milestone v2.0 "Install-Ready Launch" takes everything built in milestone 1 (phases 1-7) and makes it real: installable via `npm install -g`, clean of dead code, with all components wired together and verified on actual projects. The sequence is deliberate: safe deletions first (low-risk cleanup), then establish the v2 directory model and wire orphaned components (structure/integration), then harder cleanup that depends on knowing what survived (remaining cleanup), then automated verification (testing), and finally install and end-to-end validation on a real project.

## Milestones

- Milestone 1 (Phases 1-7): Design and build v2 pipeline -- COMPLETE
- Milestone 2 (Phases 8-14): Install-Ready Launch -- IN PROGRESS

## Phases

**Phase Numbering:**
- Phases 1-7: Milestone 1 (complete)
- Phases 8-14: Milestone 2 (current)
- Decimal phases (e.g., 8.1): Urgent insertions if needed

- [x] **Phase 8: Low Risk Cleanup** - Remove things we obviously won't use: dead commands, orphaned workflows/agents, dropped hooks and metadata files (completed 2026-03-01)
- [x] **Phase 9: Structure & Integration** - Establish v2 directory model and wire orphaned components (research gatherers, hooks) into the surviving chain (completed 2026-03-01)
- [x] **Phase 10: Remaining Cleanup & Polish** - Harder cleanup that depends on knowing the v2 structure: CLI audit, template/reference audits, file reference validation (completed 2026-03-01)
- [x] **Phase 11: Automated Testing** - Verify every surviving command fires without error and all file references resolve before attempting install (completed 2026-03-01)
- [x] **Phase 12: Workflow Optimization & Wiring** - Fix B1-B3 blockers, wire all v2 flows (new/brownfield/after-start), establish capability→feature lifecycle, simplify ROADMAP.md model (completed 2026-03-02)
- [ ] **Phase 13: Multi-Scenario E2E Testing & Cleanup** - Test all flows end-to-end across multiple scenarios, fix what breaks, final cleanup pass
- [ ] **Phase 14: Install & Validate** - Make it installable via npm install -g, then prove it works end-to-end on real projects

## Phase Details

### Phase 8: Low Risk Cleanup
**Goal**: The codebase is free of obviously dead artifacts -- deleted commands, orphaned workflows, orphaned agents, dropped hooks, and metadata files that no longer serve a purpose
**Depends on**: Phase 7 (milestone 1 cleanup audit identified what to remove)
**Requirements**: CMD-02, CLN-01, CLN-02, CLN-06, CLN-07
**Success Criteria** (what must be TRUE):
  1. The 26 unused commands identified in milestone 1 audit are deleted from the commands directory
  2. The 20 orphaned workflows are deleted
  3. Orphaned agents (gsd-codebase-mapper, etc.) are deleted
  4. `gsd-check-update.js` hook is removed
  5. VERSION, CHANGELOG.md, and other dropped metadata/infrastructure files are removed
**Plans**: TBD

### Phase 9: Structure & Integration
**Goal**: v2 directory conventions are established in all artifacts, and orphaned pipeline components (research gatherers, hooks) are wired into the surviving command chain
**Depends on**: Phase 8 (must remove dead weight before wiring survivors)
**Requirements**: DIR-01, DIR-02, DIR-03, INTG-01, INTG-02
**Success Criteria** (what must be TRUE):
  1. New projects created via /init produce `.planning/capabilities/` directory structure with no `phases/` directory
  2. `.documentation/` directory structure is defined with architecture.md, domain.md, mapping.md, capabilities/, and decisions/ subdirectories
  3. All path references in surviving commands, workflows, and agents use capability/feature model (no phase model references remain)
  4. The 6 research gatherers are invoked by the framing pipeline workflow (not orphaned)
  5. Hooks audit complete: context monitor + statusline confirmed working, update check removed, remaining hooks verified effective for v2
**Plans**: TBD

### Phase 10: Remaining Cleanup & Polish
**Goal**: The harder cleanup work that requires knowing the final v2 structure is done -- CLI tool is lean, templates serve v2 artifact types, references are accurate, and all file pointers resolve
**Depends on**: Phase 9 (must know v2 structure before auditing templates/references/CLI against it)
**Requirements**: CLN-03, CLN-04, CLN-05, INTG-03
**Success Criteria** (what must be TRUE):
  1. `gsd-tools.cjs` contains no dead modules -- every exported function is called by at least one surviving command/workflow/agent, and v1-only concepts (milestone, phase CLI commands) are removed
  2. Every template in the templates directory serves a v2 artifact type (capability/feature model, not phase model); stale templates are removed
  3. Every reference document is accurate for v2; unused references are removed
  4. All `@file` references in commands/workflows/agents resolve to files that actually exist post-cleanup
**Plans**: TBD

### Phase 11: Automated Testing
**Goal**: Every surviving command and file reference is verified to work before attempting install -- problems caught here, not during smoke test
**Depends on**: Phase 10 (all cleanup and wiring must be complete before verification)
**Requirements**: CMD-03
**Success Criteria** (what must be TRUE):
  1. Every surviving command (11 total) fires without error when invoked
  2. All `@file` references across the entire artifact set resolve to existing files (automated scan)
  3. No command references a deleted workflow, agent, or template
**Plans**: 3 plans
Plans:
- [ ] 11-01-PLAN.md -- @file reference scan + cross-reference audit + auto-fix obvious renames
- [ ] 11-02-PLAN.md -- CLI route smoke tests against synthetic fixtures
- [ ] 11-03-PLAN.md -- E2E simulation + friction log consolidation + user Q&A + fix agreed items

### Phase 12: Workflow Optimization & Wiring
**Goal**: All v2 flows work end-to-end — new project, brownfield, and after-start (capability/feature execution). B1-B3 blockers resolved. Pipeline speaks v2 throughout.
**Depends on**: Phase 11 (must know what's broken before fixing)
**Requirements**: INTG-01, INTG-02, INTG-03, CMD-01
**Success Criteria** (what must be TRUE):
  1. `/gsd:init` handles both new and brownfield via 3-step detect/branch/converge — new projects get full Q&A + scaffolding, brownfield gets research + discovery of existing capabilities/features
  2. Pipeline workflows (plan, execute, review, doc) call v2 feature routes, not v1 phase routes (B1 resolved)
  3. STATE.md and simplified ROADMAP.md are bootstrapped during init (B2 resolved)
  4. Capability → feature decomposition exists in the pipeline — capabilities break into features before plan/execute (B3 resolved)
  5. After-start flow works: discuss capability → discovery → requirements → research → plan (with Q&A) → execute → review → document
  6. Feature-level entry works: discuss feature → discovery → research → plan → execute → review → document
  7. Milestone/roadmap is light sequencing scaffold — informs resume/state, execution happens at capability/feature level
  8. Can jump into pipeline at any point (not forced to start from discovery)
**Plans**: TBD

### Phase 13: Multi-Scenario E2E Testing & Cleanup
**Goal**: Every flow is tested across realistic scenarios. Anything that breaks gets fixed. Final cleanup before install packaging.
**Depends on**: Phase 12 (must wire everything before testing it)
**Success Criteria** (what must be TRUE):
  1. New project flow tested: init → discuss capability → full pipeline through to documentation
  2. Brownfield flow tested: init on existing repo → detect existing code → capability/feature discovery → pipeline
  3. All 4 framings tested (new/enhance/debug/refactor) on at least one scenario each
  4. Mid-pipeline entry tested: jump into plan, execute, or review without running prior stages
  5. Milestone/roadmap sequencing tested: create milestone, add capabilities/features, verify state tracking
  6. All failures found during testing are fixed
  7. No dead references, broken routes, or v1 remnants in any exercised path
**Plans**: TBD

### Phase 14: Install & Validate
**Goal**: Running `npm install -g` deploys all v2 artifacts, and the full pipeline works end-to-end on both fresh and existing projects
**Depends on**: Phase 13 (must verify all flows work before packaging for install)
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, INST-08, CMD-01, VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. `npm install -g` copies all v2 commands, workflows, agents, templates, references, and framings to their correct install.js target directories
  2. Source files contain `{GSD_ROOT}` path tokens (no hardcoded absolute paths) and install.js resolves them at install time
  3. install.js contains no Codex/Gemini/OpenCode adapter code, no patch backup system, no manifest, no changelog/version metadata
  4. Default config.json and framings directory deploy alongside other artifacts
  5. After install, `/init` on a fresh repo creates project scaffolding and framing commands launch discovery that flows into the pipeline
  6. After install, `/init` on an existing project triggers auto-detect (existing mode) and discovers existing capabilities
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 → 12 → 13 → 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 8. Low Risk Cleanup | 5/5 | Complete | 2026-03-01 |
| 9. Structure & Integration | 3/3 | Complete | 2026-03-01 |
| 10. Remaining Cleanup & Polish | 8/8 | Complete | 2026-03-01 |
| 11. Automated Testing | 3/3 | Complete | 2026-03-01 |
| 12. Workflow Optimization & Wiring | 9/9 | Complete    | 2026-03-02 |
| 13. Multi-Scenario E2E Testing & Cleanup | 5/6 | In Progress|  |
| 14. Install & Validate | 0/TBD | Not started | - |
