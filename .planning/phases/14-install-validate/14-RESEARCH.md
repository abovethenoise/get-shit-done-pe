# Phase 14: Install & Validate - Research

**Researched:** 2026-03-02
**Domain:** Node.js installer script / file deployment / path resolution
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single tree under `~/.claude/get-shit-done/` with subdirs (workflows/, agents/, templates/, references/, framings/)
- Commands go to `commands/gsd/`
- Everything in source directories gets deployed -- keep non-installable files out of source dirs rather than filtering at install time
- Always overwrite on install -- rip and replace, delete old artifacts before deploying new
- Also clean deployed legacy artifacts (gsd-local-patches/, gsd-file-manifest.json)
- `{GSD_ROOT}` tokens resolved at install time (baked into files during copy)
- `{GSD_ROOT}` resolves to `~/.claude`
- Post-replacement validation: scan all installed files for remaining `{GSD_ROOT}` -- fail install if any found
- Strip install.js per requirements only (INST-05, INST-06)
- No version tracking beyond what's in the source -- manual install only
- Single command: `node install.js`
- Silent output -- no logs unless error
- Automated dev-only validation script (not shipped)
- Validation checks: expected files exist, no unresolved tokens, commands discoverable, gsd-tools.cjs runs, no refs to deleted files
- Existing project test uses this repo (get-shit-done-pe) as test case

### Claude's Discretion
- Additional path tokens beyond {GSD_ROOT} if source audit reveals need
- Install documentation location
- Exact directory layout within the single-tree structure

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | All v2 commands, workflows, agents, templates, references deploy via install | Source audit confirms 5 deploy targets: commands/gsd/ (13 files), get-shit-done/ (workflows/templates/references/framings/bin), agents/ (17 files), hooks/ (2 files), config.json template |
| INST-02 | Source files use `{GSD_ROOT}` path references, install.js resolves at install time | 70 occurrences of `~/.claude/` across 26 source files need conversion to `{GSD_ROOT}/`; install.js regex replacement already exists for this pattern |
| INST-03 | All v2 files follow `gsd-*` prefix convention | Agents: 17/17 files already prefixed. Hooks: 2/2 already prefixed. Commands: in `commands/gsd/` namespace (no prefix needed). Workflows/templates/references: no prefix (internal, not user-facing) |
| INST-04 | v2 files placed in correct install.js directories | Current install.js already targets correct dirs; framings missing from deploy list |
| INST-05 | install.js stripped to Claude Code only (remove Codex/Gemini/OpenCode) | Already done in Phase 12 -- 0 matches for codex/gemini/opencode in install.js |
| INST-06 | install.js: remove patch backup, manifest, changelog/version metadata | patch/manifest code already absent from install.js; VERSION file still deployed to ~/.claude/get-shit-done/VERSION; uninstall fn references gsd-check-update (dead hook) |
| INST-07 | Default config.json ships with package | config.json exists at get-shit-done/templates/config.json; needs deploy step in install.js |
| INST-08 | Framings directory deployed via install path | framings/ exists at get-shit-done/framings/ (4 dirs with anchor-questions.md); not currently in install.js deploy list |
| CMD-01 | 11-command surface works end-to-end | Already verified in Phase 12; re-validate post-install |
| VAL-01 | Smoke test: install, /init on fresh repo | Dev-only validation script; test file existence + token scan + command fire |
| VAL-02 | Smoke test: framing commands flow | Dev-only script; verify framing discovery -> pipeline files load |
| VAL-03 | Smoke test: /init on existing project (get-shit-done-pe) | Use this repo as brownfield test case |
</phase_requirements>

## Summary

Phase 14 is a focused packaging and validation phase. The codebase is fully v2-clean (confirmed Phase 13). The work is:

1. **Token conversion**: Replace 70 literal `~/.claude/` paths across 26 source files with `{GSD_ROOT}/` tokens
2. **Install.js updates**: Add framings + config.json deploy steps, add token replacement + post-install validation, strip remaining legacy artifacts (VERSION file, dead hook refs), make output silent
3. **Legacy cleanup**: Add cleanup for `gsd-local-patches/` and `gsd-file-manifest.json` on user machines
4. **Validation script**: Dev-only script that verifies the install is correct

**Primary recommendation:** This is a mechanical phase -- bulk find/replace for tokens, targeted install.js edits, and a validation script. No architectural decisions, no new abstractions.

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js fs | built-in | File copy, directory creation, path resolution | Already used by install.js |
| Node.js path | built-in | Cross-platform path joining | Already used by install.js |

### Supporting
No additional dependencies needed. install.js is zero-dependency by design.

## Architecture Patterns

### Current Source Tree (what gets deployed)
```
commands/gsd/           → ~/.claude/commands/gsd/           (13 .md files)
agents/                 → ~/.claude/agents/                  (17 gsd-*.md files)
get-shit-done/workflows → ~/.claude/get-shit-done/workflows  (16 .md files)
get-shit-done/templates → ~/.claude/get-shit-done/templates  (22 files + codebase/)
get-shit-done/references→ ~/.claude/get-shit-done/references (14 .md files)
get-shit-done/framings  → ~/.claude/get-shit-done/framings   (4 dirs, anchor-questions.md each)
get-shit-done/bin       → ~/.claude/get-shit-done/bin        (gsd-tools.cjs + lib/ + node_modules/)
hooks/                  → ~/.claude/hooks/                   (2 .js files)
```

### Pattern 1: Token Replacement
**What:** Source files contain `{GSD_ROOT}/` where they currently have `~/.claude/`. install.js replaces tokens with resolved absolute path at copy time.
**Current behavior:** install.js already does regex replacement of `~/.claude/` -> pathPrefix during copy. This must change to `{GSD_ROOT}/` -> pathPrefix.

```
Source file:  @{GSD_ROOT}/get-shit-done/workflows/plan.md
After install: @/Users/phil/.claude/get-shit-done/workflows/plan.md
```

**Key detail:** The existing `copyWithPathReplacement()` function replaces `~/.claude/` with pathPrefix. Change the regex to match `{GSD_ROOT}/` instead. The replacement target (pathPrefix) stays the same.

### Pattern 2: Rip and Replace Deploy
**What:** Delete entire target directories before copying new files. Prevents orphaned files from old versions.
**Current behavior:** `copyWithPathReplacement()` already calls `fs.rmSync(destDir, { recursive: true })` before copying. This pattern is already correct.

### Pattern 3: Post-Install Token Validation
**What:** After all files are copied, recursively scan installed .md files for any remaining `{GSD_ROOT}` strings. If found, install fails with error listing the files.
**Why:** Catches bugs where token replacement missed a file or a new token pattern was introduced.

### Anti-Patterns to Avoid
- **Don't add filtering logic to install.js:** Decision says "keep non-installable files out of source dirs" -- install copies everything in source dirs
- **Don't refactor install.js beyond requirements:** Strip only what INST-05/INST-06 require, leave remaining code alone
- **Don't add npm versioning:** Manual install only, no version tracking

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursive file scan | Custom walker | Existing `copyWithPathReplacement` pattern | Already handles recursive dir traversal |
| Path token replacement | New regex engine | Extend existing regex in `copyWithPathReplacement` | One-line change from `~/.claude/` to `{GSD_ROOT}/` |

**Key insight:** install.js already has 90% of the required machinery. The changes are surgical edits, not new systems.

## Common Pitfalls

### Pitfall 1: Missing Token in Non-.md Files
**What goes wrong:** `copyWithPathReplacement()` only does replacement on `.md` files. If `.js` or `.json` files contain `{GSD_ROOT}`, they'll be copied without replacement.
**Why it happens:** The function has `entry.name.endsWith('.md')` guard.
**How to avoid:** Audit all source files for `~/.claude/` paths -- if any appear in .js or .json files, extend the replacement to cover those extensions too.
**Warning signs:** Post-install token validation catches unresolved `{GSD_ROOT}` in any file type.
**Current status:** All 70 occurrences are in `.md` files (commands, workflows, references, templates). The `.js` files (gsd-tools.cjs, hooks) don't contain hardcoded paths -- they resolve at runtime. config.json template has no paths. **No extension change needed.**

### Pitfall 2: Breaking Installed Users' Legacy Artifacts
**What goes wrong:** Rip-and-replace removes user's old files, but legacy directories like `gsd-local-patches/` persist because install.js doesn't know about them.
**Why it happens:** Only directories that install.js copies get cleaned. Legacy dirs from v1 features need explicit cleanup.
**How to avoid:** Add explicit deletion of `gsd-local-patches/` dir and `gsd-file-manifest.json` file in the cleanup step.
**Warning signs:** Post-install validation should check these don't exist.

### Pitfall 3: Silent Failures During Token Replacement
**What goes wrong:** A source file has `{GSD_ROOT}` but install.js doesn't process that file type, so the token survives into the install.
**How to avoid:** Post-install scan is the safety net. The validation step catches this. Make validation run as part of install (not just dev script).

### Pitfall 4: hooks/dist/ Build Step Missing
**What goes wrong:** install.js references `hooks/dist/` for bundled hooks, but dist/ doesn't exist -- hooks are now plain files in `hooks/`.
**Why it happens:** Phase 12 removed the build system but install.js still looks for `hooks/dist/`.
**How to avoid:** Update install.js to copy from `hooks/` directly (just the 2 .js files), not from `hooks/dist/`.
**Current evidence:** `hooks/dist/` does not exist. `hooks/` contains `gsd-context-monitor.js` and `gsd-statusline.js` directly.

### Pitfall 5: VERSION File Still Deployed
**What goes wrong:** `~/.claude/get-shit-done/VERSION` file exists from v1 install. The new `copyWithPathReplacement` for `get-shit-done/` will clean the dir, but VERSION is in the repo's installed tree, not the source tree.
**How to avoid:** The rip-and-replace pattern for `get-shit-done/` will naturally remove it since the new source tree doesn't have a VERSION file. Confirm source tree has no VERSION file.
**Current status:** Source `get-shit-done/` has no VERSION file. Rip-and-replace handles this automatically.

## Code Examples

### Token Replacement in Source Files
```bash
# Convert all ~/. claude/ to {GSD_ROOT}/ in deployable source files
# Target: commands/gsd/*.md, agents/*.md, get-shit-done/**/*.md

# Pattern (in each .md file):
# Before: @~/.claude/get-shit-done/workflows/plan.md
# After:  @{GSD_ROOT}/get-shit-done/workflows/plan.md
```

### Install.js Token Replacement Change
```javascript
// Current (line ~184-186 of install.js):
const globalClaudeRegex = /~\/\.claude\//g;
content = content.replace(globalClaudeRegex, pathPrefix);

// New:
const gsdRootRegex = /\{GSD_ROOT\}\//g;
content = content.replace(gsdRootRegex, pathPrefix);
// Remove the old ~/.claude/ replacement -- tokens handle it now
```

### Post-Install Token Scan
```javascript
function validateNoUnresolvedTokens(dir) {
  const failures = [];
  function scan(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) scan(full);
      else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('{GSD_ROOT}')) failures.push(full);
      }
    }
  }
  scan(dir);
  return failures;
}
```

### Legacy Cleanup Addition
```javascript
// Add to cleanupOrphanedFiles() or similar:
const legacyPaths = [
  path.join(configDir, 'gsd-local-patches'),
  path.join(configDir, 'gsd-file-manifest.json'),
  path.join(configDir, 'get-shit-done', 'VERSION'),
];
for (const p of legacyPaths) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true });
  }
}
```

### Framings Deploy Addition
```javascript
// Framings are inside get-shit-done/ which copyWithPathReplacement already handles
// as long as get-shit-done/framings/ is in the source tree (it is)
// No separate deploy step needed -- copyWithPathReplacement(skillSrc, skillDest, pathPrefix)
// already copies the entire get-shit-done/ tree recursively
```

### Config.json Deploy
```javascript
// config.json lives at get-shit-done/templates/config.json
// It's already deployed as part of get-shit-done/ tree copy
// But user decision says it should deploy alongside other artifacts
// Need to verify: does config.json need to go to a specific location?
// Current: deployed inside ~/.claude/get-shit-done/templates/config.json
// This is correct -- init-project workflow reads it from there
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `hooks/dist/` bundled hooks | Plain `hooks/*.js` files | Phase 12 | install.js hook copy path must change |
| `~/.claude/` literal paths in source | `{GSD_ROOT}/` tokens (this phase) | Phase 14 | Enables clean path resolution at install time |
| Patch backup system (gsd-local-patches/) | Rip-and-replace, no patches | Phase 12 decision | Legacy dirs need cleanup |
| Multi-runtime adapters in install.js | Claude Code only | Phase 12 | Already stripped |
| Version tracking (VERSION, CHANGELOG) | No version tracking | Phase 12 decision | VERSION file cleanup needed |

**Deprecated/outdated:**
- `hooks/dist/` directory: removed, hooks are plain files now
- `gsd-check-update.js` hook: removed in Phase 8, but uninstall function still references it (harmless, cleanup optional)
- `build-hooks.js` script: no longer needed (hooks not bundled)
- `prepublishOnly` npm script: references removed build step

## Findings Detail

### Source File Audit: {GSD_ROOT} Conversion Scope

**commands/gsd/ (13 files, 35 occurrences)**
All 12 command files that reference `~/.claude/` (all except `status.md` which has 0). Pattern is `@~/.claude/get-shit-done/...` file references.

**agents/ (17 files, 0 occurrences)**
No `~/.claude/` paths in agent files. They receive context from callers.

**get-shit-done/ (14 files, 35 occurrences)**
Workflows (12 files), references (2 files), templates (1 file). Pattern is `@~/.claude/get-shit-done/...` file references.

**hooks/ (2 files, 0 occurrences)**
Hooks resolve paths at runtime, no hardcoded paths.

**Total: 26 files, 70 occurrences to convert.**

### Install.js Current State Assessment

| Feature | Status | Action Needed |
|---------|--------|---------------|
| copyWithPathReplacement() | Works, uses `~/.claude/` regex | Change regex to `{GSD_ROOT}/` |
| commands/gsd/ deploy | Working | None |
| get-shit-done/ deploy | Working (includes framings) | None -- framings already inside this tree |
| agents/ deploy | Working | None |
| hooks/ deploy | References hooks/dist/ (doesn't exist) | Change to copy from hooks/ directly |
| config.json deploy | Inside get-shit-done/templates/ | Already deployed via tree copy |
| VERSION file | Not in source, will be cleaned by rip-replace | Explicit cleanup of legacy VERSION in ~/.claude |
| gsd-local-patches cleanup | Not in install.js | Add to cleanup |
| gsd-file-manifest.json cleanup | Not in install.js | Add to cleanup |
| Post-install token scan | Not implemented | Add |
| Silent output | Currently verbose with checkmarks | Change to silent (errors only) |
| pkg.version reference | Line 17, used for banner | Review -- banner itself may need to stay or go per UX decision |

### Framings Verification

Framings directory structure in source:
```
get-shit-done/framings/
  debug/anchor-questions.md
  enhance/anchor-questions.md
  new/anchor-questions.md
  refactor/anchor-questions.md
```
This is already inside the `get-shit-done/` tree that `copyWithPathReplacement()` recursively copies. **INST-08 is already satisfied by existing copy logic** -- no new deploy step needed.

### Additional Token Analysis

Only `{GSD_ROOT}` is needed. No other path tokens required. The `./. claude/` local path pattern (line 187 of install.js) handles local install mode and doesn't need tokenization.

## Open Questions

1. **Banner and version display**
   - What we know: install.js shows a banner with version number from package.json
   - What's unclear: Should the banner stay for "node install.js" manual install? User decision says "silent output -- no logs unless error"
   - Recommendation: Keep banner (it's the entry point UX), make file copy operations silent. The "silent" decision likely means no per-file checkmark output, not "no output at all"

2. **Interactive prompts (global/local, statusline)**
   - What we know: install.js has interactive prompts for install location and statusline config
   - What's unclear: Should these stay for manual "node install.js" usage?
   - Recommendation: Keep interactive flow -- it's still useful for manual install. The user said "node install.js" as the command, which implies the existing interactive flow is fine. Just suppress per-file verbose output.

3. **package.json scripts referencing removed tooling**
   - What we know: `prepublishOnly` references `build:hooks` which references `scripts/build-hooks.js` (may not exist)
   - What's unclear: Should these be cleaned up in this phase?
   - Recommendation: Clean up if build-hooks.js doesn't exist. Minimal effort, prevents confusion.

## Sources

### Primary (HIGH confidence)
- Direct source tree audit via Glob/Grep/Read tools
- install.js (771 lines) -- full read and analysis
- All source directories enumerated and file-counted

### Secondary (MEDIUM confidence)
- STATE.md Phase 12/13 decisions -- context for what was already done

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no external dependencies, pure Node.js fs operations
- Architecture: HIGH -- install.js already exists and works; changes are surgical
- Pitfalls: HIGH -- direct source audit identified all edge cases

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- no external dependencies that could change)
