# Cross-Reference Audit: Command-to-Workflow-to-Agent Chain Integrity

**Audited:** 2026-03-01
**Scope:** 9 commands, 14 workflows, 17 agents, 27 templates, 10 references

## 1. Command -> Workflow Chain

All 9 command files invoke valid workflows. No broken links.

| Command | Primary Workflow | Status |
|---------|-----------------|--------|
| debug.md | framing-discovery.md | OK |
| discuss-capability.md | discuss-capability.md | OK |
| discuss-feature.md | discuss-feature.md | OK |
| enhance.md | framing-discovery.md | OK |
| init.md | init-project.md, gather-synthesize.md | OK |
| new.md | framing-discovery.md | OK |
| progress.md | progress.md | OK |
| refactor.md | framing-discovery.md | OK |
| resume-work.md | resume-work.md | OK |

## 2. Workflow -> Downstream Chain

### Workflow -> Agent References

No workflow files contain direct `@~/.claude/agents/` references. Agents are invoked indirectly via the executor (gsd-executor.md) and pipeline orchestration, not via explicit @file refs in workflow files.

### Workflow -> Template References

| Workflow | Templates Referenced | Status |
|----------|---------------------|--------|
| execute.md | summary.md | OK |

### Workflow -> Reference References

| Workflow | References Used | Status |
|----------|----------------|--------|
| doc.md | ui-brand.md | OK |
| execute-plan.md | git-integration.md | OK |
| execute.md | checkpoints.md | OK |
| framing-discovery.md | framing-lenses.md, ui-brand.md | OK |
| framing-pipeline.md | escalation-protocol.md, framing-lenses.md, ui-brand.md | OK |
| plan.md | checkpoints.md, model-profile-resolution.md, ui-brand.md | OK |
| resume-work.md | continuation-format.md | OK |
| review.md | ui-brand.md | OK |

### Workflow -> Workflow References (Internal Chains)

| Source Workflow | Invokes | Status |
|----------------|---------|--------|
| framing-discovery.md | framing-pipeline.md | OK |
| framing-pipeline.md | research-workflow.md, plan.md, execute.md, review.md, doc.md | OK |
| init-project.md | gather-synthesize.md | OK |
| plan.md | research-workflow.md, execute.md | OK |
| research-workflow.md | gather-synthesize.md | OK |
| execute.md | execute-plan.md | OK |

## 3. Workflows Not Referenced by Commands (Pipeline-Internal)

These 7 workflows are invoked by other workflows, not directly by slash commands. This is by design.

| Workflow | Invoked By |
|----------|-----------|
| doc.md | framing-pipeline.md |
| execute-plan.md | execute.md |
| execute.md | framing-pipeline.md, plan.md |
| framing-pipeline.md | framing-discovery.md |
| plan.md | framing-pipeline.md |
| research-workflow.md | framing-pipeline.md, plan.md |
| review.md | framing-pipeline.md |

## 4. Dead Artifact References

| Source File | Line | Reference | Dead Artifact | Severity |
|-------------|------|-----------|---------------|----------|
| get-shit-done/templates/research.md | 21 | `/gsd:discuss-phase` | v1 discuss-phase command (deleted) | friction -- template mentions a command that no longer exists |
| commands/gsd/init.md | 34 | `/gsd:new-project` | No such command exists | friction -- after-text points user to nonexistent command |
| get-shit-done/workflows/init-project.md | 362 | `/gsd:new-project` | No such command exists | friction -- workflow output references nonexistent command |
| get-shit-done/workflows/plan.md | 25 | `/gsd:new-project` | No such command exists | friction -- error message references nonexistent command |
| get-shit-done/templates/UAT.md | 139 | `/gsd:verify-work` | v1 verify-work command (deleted) | cosmetic -- template for UAT (may be unused) |
| get-shit-done/templates/VALIDATION.md | 32 | `/gsd:verify-work` | v1 verify-work command (deleted) | cosmetic -- template for validation (may be unused) |

**Note:** `plan-phase` in `plan.md:18` is a CLI route identifier (`gsd-tools.cjs init plan-phase`), not a slash command reference. Per decision [10-08], CLI route names are functional identifiers and not stale refs.

**Note:** The word "transition" appears in many files but only as generic English (e.g., "state transitions", "transition to pipeline"). No references to a deleted `transition.md` workflow or `/gsd:transition` command were found.

## 5. Command Count Reconciliation

CMD-01 lists 11 commands. 9 command files exist in `commands/gsd/`.

| CMD-01 Name | Command File | Status |
|-------------|-------------|--------|
| init | init.md | exists |
| debug | debug.md | exists |
| new | new.md | exists |
| enhance | enhance.md | exists |
| refactor | refactor.md | exists |
| discuss-capability | discuss-capability.md | exists |
| discuss-feature | discuss-feature.md | exists |
| status | progress.md | exists (renamed) |
| resume | resume-work.md | exists (renamed) |
| plan | -- | no command file -- pipeline-internal stage (invoked by framing-pipeline.md) |
| review | -- | no command file -- pipeline-internal stage (invoked by framing-pipeline.md) |

**Finding:** `plan` and `review` are pipeline stages, not user-facing commands. They are invoked automatically by `framing-pipeline.md` during the build flow. CMD-01's count of 11 includes these internal stages; the actual user-invokable command count is 9. Severity: **cosmetic** -- CMD-01 documentation could be clarified but this is not a functional issue.

## Summary of Findings

| Severity | Count | Description |
|----------|-------|-------------|
| blocker | 0 | No blocking issues found |
| friction | 4 | Dead slash command refs (`/gsd:discuss-phase` x1, `/gsd:new-project` x3) |
| cosmetic | 3 | Dead refs in likely-unused templates (`/gsd:verify-work` x2), CMD-01 count mismatch (x1) |

**Overall chain integrity: GOOD.** All @file reference chains (command -> workflow -> template/reference) resolve correctly. The only issues are dead slash command text references in template content and after-text guidance.
