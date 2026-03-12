<purpose>
Focus-level execution workflow. Executes all items in a focus group by wave with inter-wave checkpoints. Single review + doc pass at the end for the full scope. Supports resume from current_wave.
</purpose>

<required_reading>
@{GSD_ROOT}/get-shit-done/references/delegation.md
@{GSD_ROOT}/get-shit-done/references/context-assembly.md
@{GSD_ROOT}/get-shit-done/references/escalation-protocol.md
</required_reading>

<inputs>
- `FOCUS_SLUG`: Focus group slug (resolves to `.planning/focus/{slug}/FOCUS.md`)
</inputs>

<process>

## 1. Initialize

Read `.planning/focus/${FOCUS_SLUG}/FOCUS.md`. Extract frontmatter: `name`, `goal`, `scope[]`, `current_wave`, `status`.

Re-run focus-waves to recompute waves (handles spec changes since planning):

```bash
SCOPE_CSV=$(echo "${SCOPE_ARRAY}" | paste -sd,)
WAVES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" graph-query focus-waves --scope "$SCOPE_CSV")
```

Parse JSON for `waves[]`.

**Drift detection:** Compare recomputed wave plan against what was planned (wave count, item assignment). If the wave plan changed:

AskUserQuestion:
- header: "Wave Plan Changed"
- question: "The wave plan has changed since planning:\n\n{diff summary}\n\nThis may be due to spec changes or status updates."
- options: "Continue with new plan", "Abort (re-plan first)"

**Resume detection:** If `current_wave > 0`, skip items that already have SUMMARY.md. Start from `current_wave`.

Display banner:
```
-------------------------------------------------------
 GSD > FOCUS EXECUTION
-------------------------------------------------------

Focus: {name}
Goal: {goal}
Waves: {wave_count} ({resume_from} to {wave_count})
Items: {remaining_count} remaining
```

## 2. Execute Waves (Sequential)

For each wave from `current_wave` (or 1 if starting fresh):

### 2a. Wave Execution

For each item in the wave:
- **Skip** if SUMMARY.md already exists (resume case)
- Read the item's PLAN.md
- Spawn executor agent per item (parallel within wave where possible)
- Each executor reads its PLAN.md, writes SUMMARY.md + creates commits

Executor invocation per item type:
- **Capability**: invoke execute-plan.md with TARGET_SLUG={cap_slug}, TARGET_TYPE=capability
- **Feature**: invoke execute-plan.md with TARGET_SLUG={feat_slug}, TARGET_TYPE=feature

### 2b. Wave Checkpoint

After all items in a wave complete:

Update FOCUS.md frontmatter: `current_wave: {next_wave}`

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "feat: complete wave ${WAVE_NUM} of focus '${FOCUS_NAME}'" --files .planning/focus/${FOCUS_SLUG}/FOCUS.md
```

AskUserQuestion:
- header: "Wave {N} Complete"
- question: "Wave {N} of {total} complete. {remaining} items remaining in {remaining_waves} waves."
- options: "Continue to wave {N+1}", "Pause (save progress)", "Abort"

**If pause:**
- Update STATE.md session continuity:
  ```
  Stopped at: Focus '{name}' wave {N}/{total}
  Resume: /gsd:execute {FOCUS_SLUG}
  ```
- Display resume command and exit

**If abort:**
- Update STATE.md, exit

## 3. Review ONCE

After all waves complete, aggregate artifacts from all items in scope:

- Collect all SUMMARY.md files from capability and feature directories
- Collect all CAPABILITY.md and FEATURE.md specs

Invoke review.md workflow as a single invocation:
```
@{GSD_ROOT}/get-shit-done/workflows/review.md
```

Pass:
- `TARGET_TYPE`: 'focus-group'
- `TARGET_SLUG`: {FOCUS_SLUG}
- `ARTIFACT_PATHS`: aggregated list of all SUMMARY.md, spec files
- `LENS`: inferred from focus context (default 'enhance')

Review artifacts output → `.planning/focus/${FOCUS_SLUG}/review/`

## 4. Doc ONCE

After review completes, same aggregation pattern:

```
@{GSD_ROOT}/get-shit-done/workflows/doc.md
```

Pass:
- `TARGET_TYPE`: 'focus-group'
- `TARGET_SLUG`: {FOCUS_SLUG}
- `ARTIFACT_PATHS`: all SUMMARY.md, specs, review synthesis
- `LENS`: same as review

Output → `.planning/focus/${FOCUS_SLUG}/doc-report.md`

## 5. Complete

Update FOCUS.md:
```yaml
status: complete
```

Update STATE.md: mark focus group as complete.
Update ROADMAP.md: mark focus group items as complete.

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "feat: complete focus group '${FOCUS_NAME}'" --files .planning/focus/${FOCUS_SLUG}/FOCUS.md .planning/STATE.md .planning/ROADMAP.md
```

Display:
```
-------------------------------------------------------
 GSD > FOCUS COMPLETE
-------------------------------------------------------

Focus: {name}
Goal: {goal}
Items completed: {count}
Waves: {wave_count}

Review: .planning/focus/${FOCUS_SLUG}/review/
Docs: .planning/focus/${FOCUS_SLUG}/doc-report.md
```

</process>

<success_criteria>
- [ ] Wave plan recomputed via focus-waves (drift detection)
- [ ] Resume from current_wave (skip items with existing SUMMARY.md)
- [ ] Items executed per wave (parallel within wave, sequential across waves)
- [ ] Inter-wave checkpoints with continue/pause/abort
- [ ] Pause saves progress to STATE.md with resume command
- [ ] Single review pass for full scope after all waves
- [ ] Single doc pass for full scope after review
- [ ] FOCUS.md status updated to complete
- [ ] STATE.md and ROADMAP.md updated
</success_criteria>
