## Prior Art Findings

Context: change-application executes confirmed changes from CHANGESET.md against project capability/feature files. Key constraints: zero runtime deps, Node.js CommonJS, workflow-file orchestration (not a standalone script), must halt on failure with user choice (fix/skip/abort), must produce DELTA.md execution log, uses gsd-tools CLI routes where available (currently: `capability-create`, `feature-create`; missing: kill, defer, move, reinstate, modify-metadata).

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| Git rebase/cherry-pick sequencer | Sequential apply with halt-on-conflict; user chooses --continue, --skip, or --abort | proven | high | [git-rebase docs](https://git-scm.com/docs/git-rebase/2.25.0), [git-cherry-pick docs](https://git-scm.com/docs/git-cherry-pick) |
| Database migration runner (Knex/Flyway pattern) | Ordered migrations with version tracking, halt on error, transaction-per-step | proven | medium | [Knex migrations](https://knexjs.org/guide/migrations), [Flyway transaction handling](https://documentation.red-gate.com/fd/migration-transaction-handling-273973399.html) |
| Ansible block/rescue/always | Task-by-task execution with per-task failure handling and rescue blocks | proven | medium | [Ansible error handling](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_error_handling.html) |
| Terraform plan-then-apply | Separate plan phase (dry run) from apply phase (execution) with structured execution log | proven | low | [Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan) |
| GSD execute-plan task-by-task | Per-task execution with commit, checkpoint protocol for decisions, halt on failure | proven (in-project) | high | `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-plan.md` |

### Detailed Analysis

#### 1. Git Rebase/Cherry-Pick Sequencer (Highest Structural Fit)

**How it works:**

```
for each commit in sequence:
  apply commit
  if conflict:
    HALT -> show state -> user chooses:
      --continue  (fix applied, resume from current)
      --skip      (skip this commit, move to next)
      --abort     (undo everything, restore original state)
```

State is persisted in `.git/sequencer/` so the operation survives process restarts.

Source: [git-cherry-pick docs](https://git-scm.com/docs/git-cherry-pick), [git-rebase docs](https://git-scm.com/docs/git-rebase/2.25.0)

**Why it's the best structural match:**

1. **Identical failure model.** Git's three options (continue/skip/abort) map exactly to FEATURE.md FN-03's three options (fix-and-resume/skip-and-continue/abort). This is not a coincidence -- both solve the same problem: sequential application of discrete changes where any step can fail. [First principles: the solution space for "sequential apply with failure" converges on these three options because they are exhaustive -- you either fix the current item, skip it, or stop]

2. **Execution state tracking.** Git persists which commits have been applied, which failed, and which are pending. DELTA.md serves exactly this purpose -- it's the sequencer state file. The structural mapping: git's "applied commits" = DELTA.md APPLIED entries, git's "current conflict" = DELTA.md FAILED entry, git's "remaining commits" = DELTA.md PENDING entries. [Source: FEATURE.md FN-04 DELTA.md format]

3. **No rollback needed.** Git rebase/cherry-pick supports `--abort` which undoes all applied commits. FEATURE.md's "abort" does NOT undo applied changes -- it just stops processing remaining entries. This is simpler than git's model and correct for this context: applied file mutations (creating a capability directory) should persist even if later mutations fail. [Source: FEATURE.md EU-02 -- "applied entries (safe to keep)"]

4. **Sequential ordering is fixed.** Both git and change-application process entries in a predetermined order. There's no dependency resolution at runtime -- the order is established before execution begins (by git's commit history / by FN-01's safe execution order). [Source: FEATURE.md FN-01 sort order]

**Key adaptation:** Git's sequencer state is persisted to disk for process restart. change-application runs within a single Claude Code session, so in-memory state suffices. DELTA.md is written for downstream consumption (refinement-artifact), not for resume-after-crash.

#### 2. Database Migration Runner (Knex/Flyway Pattern)

**How it works:**

```
load pending migrations (sorted by timestamp/version)
for each migration:
  begin transaction
  run migration.up()
  if success: commit, record in migrations table
  if failure: rollback transaction, HALT
```

Source: [Knex migrations guide](https://knexjs.org/guide/migrations), [Flyway transaction handling](https://documentation.red-gate.com/fd/migration-transaction-handling-273973399.html)

**Fit assessment:**

- **Version tracking (useful concept, different implementation):** Migration runners track which migrations have been applied via a database table. DELTA.md serves the same role -- recording which changes were applied. But migration runners use this for idempotent re-runs (skip already-applied migrations). change-application is single-run (DELTA.md is overwritten each refinement pass per FEATURE.md TC-02). So the version-tracking mechanism is simpler.

- **Transaction-per-step (partially applicable):** Flyway wraps each migration in a transaction for atomicity. change-application's equivalent is "each mutation is atomic at the file level" (TC-01). File operations in Node.js aren't transactional, but individual `fs.writeFileSync` calls are atomic enough for markdown files. The key insight from migration runners: don't batch multiple file writes into a single "transaction" -- keep each mutation self-contained. [Source: FEATURE.md TC-01 "each mutation is atomic at the file level"]

- **Rollback (not applicable):** Migration runners provide `down()` functions for rollback. FEATURE.md explicitly excludes automatic rollback -- applied changes persist. This simplifies implementation significantly. [Source: FEATURE.md EU-02 "applied entries (safe to keep)"]

- **No skip option:** Traditional migration runners halt on failure with no "skip and continue" option (because migrations typically have sequential dependencies). change-application needs skip because mutations are mostly independent (creating capability A doesn't depend on killing feature B). [First principles: migration ordering reflects data dependencies; change-application ordering reflects safety ordering (creates before deletes), not data dependencies]

**Verdict:** The "sorted list + sequential execution + per-step result tracking" pattern is directly applicable. The transaction/rollback machinery is not needed. The migration runner adds complexity (version tracking, rollback functions) that change-application doesn't need.

#### 3. Ansible Block/Rescue/Always

**How it works:**

```yaml
- block:
    - task1  # runs first
    - task2  # runs if task1 succeeds
  rescue:
    - recovery_task  # runs if any block task fails
  always:
    - cleanup_task   # always runs
```

Default behavior: task failure halts execution on that host. `any_errors_fatal` halts execution everywhere.

Source: [Ansible error handling](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_error_handling.html), [Ansible blocks](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_blocks.html)

**Fit assessment:**

- **Rescue blocks (useful pattern):** The concept of "on failure, run a recovery action before deciding what to do" maps to change-application's failure handling. But change-application's "recovery" is user-driven (FN-03: user fixes externally, then resumes), not automated. The rescue block pattern is overkill.

- **always blocks (useful):** The concept of "always write state regardless of outcome" applies to DELTA.md. change-application must write DELTA.md whether execution completes, fails, or is aborted. This "always" guarantee should be explicit in the workflow.

- **Declarative task definition (not applicable):** Ansible's power comes from declarative tasks (desired state, not procedural steps). change-application's mutations are procedural (create this directory, write this file). The declarative layer would add abstraction without benefit.

**Verdict:** The "always write state" pattern from Ansible's `always` block is worth adopting. The rest of Ansible's machinery (handlers, fact gathering, host targeting) is irrelevant to single-machine file mutations.

#### 4. Terraform Plan-Then-Apply

**How it works:**

```
terraform plan -> execution plan (what will change)
  user reviews plan
terraform apply -> executes the plan
  creates execution log
```

Source: [Terraform plan docs](https://developer.hashicorp.com/terraform/cli/commands/plan), [Spacelift Terraform plan guide](https://spacelift.io/blog/terraform-plan)

**Fit assessment:**

The plan-then-apply separation is already built into the requirements-refinement pipeline: coherence-report generates recommendations (plan), refinement-qa confirms them (review), change-application executes them (apply). Terraform's pattern validates the overall architecture but doesn't inform the change-application implementation specifically.

Terraform's execution log (resource-level status tracking) maps to DELTA.md's entry-level status tracking.

**Verdict:** Architecture-level validation, not implementation-level guidance. The pipeline already embodies this pattern.

#### 5. GSD Execute-Plan (In-Project Prior Art)

**How it works (from execute-plan.md):**

```
for each task in plan:
  if type="auto": implement, verify done criteria, commit
  if type="checkpoint": HALT -> checkpoint protocol -> wait -> continue
  on failure: report to user (unplanned_work step)
```

Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-plan.md` steps "execute" and "unplanned_work"

**Fit assessment:**

- **Task-by-task with commit (partially applicable):** Execute-plan commits after each task. change-application should NOT commit after each mutation -- the entire change-application run is a single logical operation. Commits happen at the refinement-artifact level, not per-mutation. [First principles: individual mutations are not meaningful commit units; the refinement delta as a whole is]

- **Checkpoint protocol (applicable for failure case):** Execute-plan's checkpoint protocol (HALT -> display state -> wait for user signal) maps directly to FN-03's failure handling. The difference: execute-plan checkpoints are planned (embedded in the plan file); change-application "checkpoints" are unplanned (triggered by failure). [Source: execute-plan.md "checkpoint_protocol" step vs FEATURE.md FN-03]

- **AskUserQuestion for user decisions (directly applicable):** Execute-plan uses AskUserQuestion for checkpoint decisions. change-application should use the same tool for FN-03 failure handling. This is proven in the same runtime. [Source: execute-plan.md uses AskUserQuestion; same runtime constraint]

- **Progress tracking (applicable):** Execute-plan tracks "task N/total" progress. change-application should track "mutation N/total" progress in its output to the user during execution. [Source: execute-plan.md "task_commit" step]

**Verdict:** The checkpoint protocol pattern and AskUserQuestion usage are directly reusable. The commit-per-task pattern is not applicable.

### Recommended Starting Point

**Git rebase/cherry-pick sequencer pattern adapted with GSD execute-plan's checkpoint protocol for the failure case.** Rationale:

1. The sequencer's state model (applied/current/pending) maps 1:1 to DELTA.md's entry statuses (APPLIED/FAILED/PENDING/SKIPPED). No translation needed.

2. The three-option failure handling (continue/skip/abort) maps exactly to FN-03's user options (fix-and-resume/skip-and-continue/abort). This is the proven exhaustive set.

3. The execute-plan workflow's AskUserQuestion + checkpoint protocol is the proven way to implement halt-and-ask in the Claude Code runtime. No new interaction patterns needed.

4. The migration runner's "always track state" principle (via Ansible's `always` block concept) ensures DELTA.md is written regardless of outcome.

Implementation sketch:

```
parse CHANGESET.md -> sorted entries (FN-01)
state = { applied: [], failed: null, pending: [...entries], skipped: [] }

for each entry in state.pending:
  remove from pending
  result = execute_mutation(entry)  // FN-02
  if success:
    add to state.applied
    continue
  if failure:
    state.failed = { entry, error }
    ALWAYS: write DELTA.md from state  // Ansible "always" pattern
    ask user via AskUserQuestion:     // GSD checkpoint protocol
      fix-and-resume -> retry current entry
      skip-and-continue -> add to state.skipped, continue
      abort -> break

ALWAYS: write DELTA.md from state  // final write
```

Sources: [git-cherry-pick docs](https://git-scm.com/docs/git-cherry-pick), `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/execute-plan.md` checkpoint_protocol step, [Ansible error handling](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_error_handling.html) always blocks

### Anti-Patterns

- **Rollback on failure (migration-runner transplant):** Tempting to undo all applied mutations when one fails, like a database migration rollback. This is wrong for file-based mutations: (a) FEATURE.md EU-02 explicitly says "applied entries (safe to keep)"; (b) file mutations like "create capability directory" are not easily reversible (what if the user already has files in that directory?); (c) rollback adds implementation complexity (every mutation needs a reverse function) with no user value -- the user explicitly chose these changes. -- [Source: FEATURE.md EU-02; First principles: rollback is essential for transactional systems where partial state is dangerous; GSD file mutations are individually valid -- a created capability is a valid state even if a later kill-feature fails]

- **Parallel mutation execution:** Running independent mutations concurrently to speed execution. This breaks the safe execution order (FN-01) and makes failure reporting ambiguous (which mutation failed? what state are we in?). The execution order exists precisely because later mutations may depend on earlier ones (e.g., "create feature" depends on "create capability"). Serial execution is not a performance bottleneck here -- these are file writes, not network calls. -- [Source: FEATURE.md FN-01 safe execution order; First principles: parallel execution of 7 ordered mutation types creates race conditions and invalidates the safety ordering]

- **Dry-run/preview before apply (Terraform transplant):** Adding a "preview what will happen" step before executing. The entire refinement pipeline IS the preview: coherence-report shows what's wrong, refinement-qa confirms each change, and the user has already approved everything in CHANGESET.md. Adding another preview layer is redundant and violates YAGNI. -- [First principles: the plan-review-apply separation already exists across the pipeline features; adding it again within change-application duplicates what refinement-qa already does]

- **Per-mutation commits:** Committing each mutation to git individually (like execute-plan commits per task). This fragments the refinement into N tiny commits instead of one cohesive "applied refinement changes" commit. The change-application output is consumed by refinement-artifact, which should make the single commit after producing REFINEMENT-REPORT.md. -- [First principles: individual mutations are not meaningful code review units; the refinement as a whole is; execute-plan commits per task because each task is a meaningful unit of code change -- mutations are not]

- **Building a generic "mutation engine" abstraction:** Creating a reusable framework for applying arbitrary mutations with pluggable handlers, middleware, etc. This is a zero-runtime-deps workflow for 7 specific mutation types. A switch statement with 7 cases is simpler, more debuggable, and more maintainable than a plugin architecture. -- [First principles: YAGNI + KISS; 7 mutation types is a small, stable set defined in FEATURE.md FN-02; abstraction adds indirection without reducing complexity]

### Libraries / Tools

No external libraries. The implementation uses existing GSD infrastructure:

- **`gsd-tools capability-create <slug>`:** Validated route for creating capability directories + CAPABILITY.md. Already exists. -- [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/capability.cjs` cmdCapabilityCreate]
- **`gsd-tools feature-create <cap> <slug>`:** Validated route for creating feature stubs. Already exists. -- [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/feature.cjs` cmdFeatureCreate]
- **Missing CLI routes (fall back to direct edit with UNVALIDATED flag):**
  - Kill feature/capability (set status to `killed` + reasoning)
  - Defer feature (set status to `deferred` + reasoning)
  - Move feature (relocate directory between capabilities)
  - Modify metadata (update frontmatter fields)
  - Reinstate feature (reset to `exploring`, clear kill/defer reasoning)
  - `changeset-parse` (parse CHANGESET.md to JSON)
  - `delta-parse` (parse DELTA.md to JSON, per TC-02)
- **`gsd-tools frontmatter`:** Existing frontmatter extraction utility. Useful for reading/modifying status fields in cap/feature files when doing direct edits. -- [Source: `/Users/philliphall/get-shit-done-pe/get-shit-done/bin/lib/frontmatter.cjs`]

### Canonical Patterns

- **Sequencer state machine (git rebase model):** Maintain a state object with four buckets: applied[], failed (singular), skipped[], pending[]. Each entry moves through exactly one transition: pending -> applied | pending -> failed -> (skipped | retry -> applied/failed). This state object IS the DELTA.md content -- serialize it at any point to get the execution log. -- [Source: [git-cherry-pick docs](https://git-scm.com/docs/git-cherry-pick) sequencer state in `.git/sequencer/`; FEATURE.md FN-04 DELTA.md format]

- **CLI-first routing with fallback (strategy pattern):** For each mutation, check if a CLI route exists. If yes, execute via CLI (validated path). If no, execute via direct file edit (Read/Edit tools), and flag as UNVALIDATED. This is a simple if/else per mutation type, not a plugin system. The UNVALIDATED flag creates a natural backlog: each flag is a signal that a CLI route should be built. -- [Source: FEATURE.md FN-02 route selection; TC-01 constraints]

- **Always-write state (Ansible always-block):** Write DELTA.md at every exit point: after successful completion, after failure-and-abort, after failure-and-skip. Never leave execution without a written state file. Implement by placing the write in a finally-equivalent position in the workflow logic. -- [Source: [Ansible error handling - always blocks](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_blocks.html); FEATURE.md FN-04 "Write current state to DELTA.md regardless of choice"]

- **Safe execution ordering (topological sort, simplified):** Sort mutations into a fixed tier order (creates -> moves -> metadata -> reinstate -> defer -> kill) before execution. This is not a dynamic dependency graph -- it's a static priority list. Within a tier, order doesn't matter. This is simpler than a full topological sort and sufficient because the tier ordering guarantees that dependencies are satisfied (you can't move a feature to a capability that hasn't been created yet). -- [Source: FEATURE.md FN-01 8-tier sort order; First principles: the tiers encode a partial order that satisfies all inter-mutation dependencies]
