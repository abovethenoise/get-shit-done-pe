# @file Resolution Findings

**Audited:** 2026-03-01
**Requirement:** INTG-03 — All @file references in commands/workflows/agents resolve to files that actually exist post-cleanup
**Related:** INST-02 — {GSD_ROOT} tokenization (Phase 12)

---

## 1. @file Reference Inventory

All `@~/.claude/` references in active toolchain files (commands/, get-shit-done/, agents/, hooks/).

### commands/gsd/

| Source File | @file Target | Exists |
|---|---|---|
| debug.md | workflows/framing-discovery.md | YES |
| debug.md | references/framing-lenses.md | YES |
| debug.md | references/ui-brand.md | YES |
| new.md | workflows/framing-discovery.md | YES |
| new.md | references/framing-lenses.md | YES |
| new.md | references/ui-brand.md | YES |
| enhance.md | workflows/framing-discovery.md | YES |
| enhance.md | references/framing-lenses.md | YES |
| enhance.md | references/ui-brand.md | YES |
| refactor.md | workflows/framing-discovery.md | YES |
| refactor.md | references/framing-lenses.md | YES |
| refactor.md | references/ui-brand.md | YES |
| init.md | workflows/init-project.md | YES |
| init.md | workflows/gather-synthesize.md | YES |
| init.md | references/questioning.md | YES |
| init.md | templates/project.md | YES |
| plan-phase.md | workflows/plan-phase.md | YES |
| plan-phase.md | references/ui-brand.md | YES |
| execute-phase.md | workflows/execute-phase.md | YES |
| execute-phase.md | references/ui-brand.md | YES |
| review-phase.md | workflows/review-phase.md | YES |
| review-phase.md | workflows/gather-synthesize.md | YES |
| review-phase.md | references/ui-brand.md | YES |
| doc-phase.md | workflows/doc-phase.md | YES |
| doc-phase.md | references/ui-brand.md | YES |
| research-phase.md | workflows/research-workflow.md | YES |
| discuss-capability.md | workflows/discuss-capability.md | YES |
| discuss-feature.md | workflows/discuss-feature.md | YES |
| resume-work.md | workflows/resume-work.md | YES |
| progress.md | workflows/progress.md | YES |

### get-shit-done/workflows/

| Source File | @file Target | Exists |
|---|---|---|
| framing-discovery.md | references/framing-lenses.md | YES |
| framing-discovery.md | references/ui-brand.md | YES |
| framing-discovery.md | workflows/framing-pipeline.md | YES |
| framing-pipeline.md | references/framing-lenses.md | YES |
| framing-pipeline.md | references/escalation-protocol.md | YES |
| framing-pipeline.md | references/ui-brand.md | YES |
| framing-pipeline.md | workflows/research-workflow.md | YES |
| framing-pipeline.md | workflows/plan-phase.md | YES |
| framing-pipeline.md | workflows/execute-phase.md | YES |
| framing-pipeline.md | workflows/review-phase.md | YES |
| framing-pipeline.md | workflows/doc-phase.md | YES |
| plan-phase.md | references/ui-brand.md | YES |
| plan-phase.md | workflows/research-workflow.md | YES |
| plan-phase.md | workflows/execute-phase.md | YES |
| plan-phase.md | references/checkpoints.md | YES |
| plan-phase.md | references/model-profile-resolution.md | YES |
| execute-phase.md | workflows/execute-plan.md | YES |
| execute-phase.md | templates/summary.md | YES |
| execute-phase.md | references/checkpoints.md | YES |
| execute-plan.md | references/git-integration.md | YES |
| review-phase.md | workflows/gather-synthesize.md | YES |
| review-phase.md | references/ui-brand.md | YES |
| research-workflow.md | workflows/gather-synthesize.md (x2) | YES |
| research-phase.md | references/phase-argument-parsing.md | YES |
| research-phase.md | workflows/research-workflow.md | YES |
| resume-work.md | references/continuation-format.md | YES |
| verify-phase.md | references/verification-patterns.md | YES |
| verify-phase.md | templates/verification-report.md | YES |
| doc-phase.md | references/ui-brand.md | YES |
| init-project.md | workflows/gather-synthesize.md (inline) | YES |

### get-shit-done/templates/

| Source File | @file Target | Exists |
|---|---|---|
| phase-prompt.md | workflows/execute-plan.md | YES |
| phase-prompt.md | templates/summary.md | YES |
| phase-prompt.md | references/checkpoints.md | YES |
| codebase/structure.md | (generic pattern example, not a real ref) | N/A |

### get-shit-done/references/

| Source File | @file Target | Exists |
|---|---|---|
| model-profile-resolution.md | references/model-profiles.md | YES |
| verification-patterns.md | references/checkpoints.md | YES |

### agents/

| Source File | @file Target | Exists |
|---|---|---|
| gsd-executor.md | references/checkpoints.md | YES |
| gsd-executor.md | templates/summary.md | YES |
| gsd-planner.md | workflows/execute-plan.md | YES |
| gsd-planner.md | templates/summary.md | YES |

### hooks/

No @file references found in hooks.

---

## 2. Broken References

**Total broken @file references: 0**

Every `@~/.claude/get-shit-done/...` reference in the active toolchain resolves to a file that currently exists. No references point to files deleted in Phase 8 or Phase 9.

---

## 3. Hardcoded Path Count

### Absolute paths (`/Users/philliphall/.claude/`)

**Total: 0** -- Zero hardcoded absolute paths exist in the active toolchain.

### Tilde paths (`@~/.claude/get-shit-done/...`)

All references use the `@~/.claude/` tilde convention. Counts by directory:

| Directory | Files with refs | Total refs |
|---|---|---|
| commands/gsd/ | 14 | 41 |
| get-shit-done/workflows/ | 13 | 33 |
| get-shit-done/templates/ | 2 | 8 |
| get-shit-done/references/ | 2 | 2 |
| agents/ | 2 | 4 |
| hooks/ | 0 | 0 |
| **Total** | **33** | **86** (note: codebase/structure.md and codebase/conventions.md have generic examples, not real refs) |

---

## 4. install.js Convention

**Location:** `/bin/install.js`

### Current behavior

- install.js copies files from source to `~/.claude/` (or runtime-equivalent) directories
- For hooks (`.js` files only), it templates `'.claude'` -> runtime-specific config dir via string replacement: `content.replace(/'\.claude'/g, configDirReplacement)`
- For markdown files (commands, workflows, agents, templates, references), install.js does **no path templating** -- files are copied as-is
- The `@~/.claude/` prefix in markdown is a **Claude Code runtime convention** -- Claude Code resolves `@~/` at invocation time to the user's home directory

### Key variables

- `configDirReplacement` via `getConfigDirFromHome(runtime, isGlobal)` -- only used for hooks
- `targetDir` -- the resolved install directory (e.g., `~/.claude/` for Claude global)
- No `{GSD_ROOT}` token exists anywhere in install.js today

### What {GSD_ROOT} would mean

Per INST-02: "Source files use `{GSD_ROOT}` path references -- install.js resolves at install time."

This means:
1. Source markdown files would contain `{GSD_ROOT}` instead of `@~/.claude/`
2. install.js would do a string replacement during copy (like it already does for hooks)
3. The replacement value would be the resolved install path

### Recommendation

- The `@~/.claude/` convention works correctly today because Claude Code resolves `~` at runtime
- `{GSD_ROOT}` tokenization is a Phase 12 concern (INST-02) for multi-runtime support
- For Phase 10 (INTG-03): **no tokenization needed** -- just verify all @file targets exist (done above)
- When Phase 12 implements INST-02, extend the existing hooks templating pattern to also template `.md` files

---

## 5. Tokenization Plan (Phase 12 scope, documented here for handoff)

### Scope

- 86 `@~/.claude/` references across 33 files
- Zero absolute paths (no `/Users/philliphall/` anywhere)

### Conversion pattern

```
Before: @~/.claude/get-shit-done/workflows/framing-discovery.md
After:  @{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
```

### install.js change needed (Phase 12)

Extend the existing templating in the file-copy loop to also process `.md` files:

```javascript
// Current: only templates .js files
if (entry.endsWith('.js')) {
  let content = fs.readFileSync(srcFile, 'utf8');
  content = content.replace(/'\.claude'/g, configDirReplacement);
  fs.writeFileSync(destFile, content);
}

// Phase 12: also template .md files
if (entry.endsWith('.js') || entry.endsWith('.md')) {
  let content = fs.readFileSync(srcFile, 'utf8');
  content = content.replace(/\{GSD_ROOT\}/g, resolvedRoot);
  // ... plus existing .js-specific replacements
}
```

### Files requiring conversion by directory

| Directory | Count | Files |
|---|---|---|
| commands/gsd/ | 14 | debug.md, new.md, enhance.md, refactor.md, init.md, plan-phase.md, execute-phase.md, review-phase.md, doc-phase.md, research-phase.md, discuss-capability.md, discuss-feature.md, resume-work.md, progress.md |
| workflows/ | 13 | framing-discovery.md, framing-pipeline.md, plan-phase.md, execute-phase.md, execute-plan.md, review-phase.md, research-workflow.md, research-phase.md, resume-work.md, verify-phase.md, doc-phase.md, init-project.md |
| templates/ | 2 | phase-prompt.md, codebase/structure.md |
| references/ | 2 | model-profile-resolution.md, verification-patterns.md |
| agents/ | 2 | gsd-executor.md, gsd-planner.md |

---

## 6. Risk Flags

### No risks for Phase 10 (INTG-03)

- All 86 @file references resolve to existing files
- Zero broken references
- Zero hardcoded absolute paths
- INTG-03 can be marked **PASS** -- no fixes needed

### Risks for Phase 12 (INST-02 tokenization)

1. **`@~/.claude/` is a Claude Code convention, not a generic path.** Claude Code interprets `@~/` as a file reference. If `{GSD_ROOT}` is introduced, the replacement must produce a valid `@~/...` path for Claude Code, or the `@` prefix handling needs to change.

2. **codebase/conventions.md false positives.** Lines 55, 64, 180, 190 contain `@/` patterns that are template examples for user projects (e.g., `@/ maps to src/`), not GSD @file references. Any automated tokenization must skip these.

3. **codebase/structure.md line 219** is a documentation example (`Reference from command with @~/.claude/get-shit-done/workflows/{name}.md`), not a real @file reference. Tokenization should still convert it since it documents the convention.

4. **phase-prompt.md has 7 refs** -- highest concentration. Some appear in both frontmatter-style blocks and inline markdown. Verify both patterns are caught by the replacement regex.

5. **Multi-runtime question.** The `@~/.claude/` prefix is Claude Code-specific. For OpenCode/Gemini/Codex runtimes, the equivalent file-reference syntax may differ. Phase 12 needs to determine: does `{GSD_ROOT}` resolve to a path with or without the `@` prefix?

---

*Audit complete. INTG-03 status: all references resolve. No action required for Phase 10.*
