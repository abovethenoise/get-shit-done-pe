# Codebase Concerns

**Analysis Date:** 2026-02-28

## Tech Debt

**Custom YAML Parser Instead of a Real YAML Library:**
- Issue: `get-shit-done/bin/lib/frontmatter.cjs` contains a hand-rolled YAML parser (~80 lines) that handles key-value pairs, inline arrays, and nested objects via a stack-based approach.
- Files: `get-shit-done/bin/lib/frontmatter.cjs` (lines 11-84)
- Impact: Cannot handle multi-line strings, quoted values with colons inside, anchors, aliases, or complex nesting beyond 3 levels. The `parseMustHavesBlock` function (lines 159-222) is a second separate parser for a specific nested block format — two parsers for the same file type.
- Fix approach: Replace with `js-yaml` (already has zero-dependency Node.js builds). The hand-rolled parser would immediately handle edge cases like YAML values containing `:` or `#` characters without quoting hacks.

**Regex-Based Markdown State Machine:**
- Issue: All STATE.md operations in `get-shit-done/bin/lib/state.cjs` parse and write Markdown via regex pattern matching on `**Field:**` patterns. There is no data model — the file IS the model. This makes field reads, writes, and updates brittle.
- Files: `get-shit-done/bin/lib/state.cjs` (stateExtractField, stateReplaceField, throughout)
- Impact: Fields with similar names will match incorrectly (e.g., "Current Phase" vs "Current Phase Name" — both match `/Current Phase/` without careful ordering). Case-insensitive matching hides typos. Adding new fields requires updating regex patterns across multiple functions.
- Fix approach: Either enforce frontmatter-only state reads (the YAML frontmatter IS synced on every write via `buildStateFrontmatter`) and deprecate markdown-body parsing for reads, or define a canonical field registry.

**Phase Removal Renumbering is Destructive and Incomplete:**
- Issue: `cmdPhaseRemove` in `get-shit-done/bin/lib/phase.cjs` renames directories and files, then uses regex substitution on ROADMAP.md to renumber all subsequent phases. It uses a fixed upper bound of `99` phases and iterates down from 99, replacing each occurrence.
- Files: `get-shit-done/bin/lib/phase.cjs` (lines 622-663)
- Impact: The regex `(Phase\s+)${oldStr}([:\s])` will incorrectly renumber any text that says "Phase N" in free-text descriptions, comments, or examples — not just headings. Also, if phases > 99 ever exist, the ceiling fails silently. REQUIREMENTS.md references are not renumbered, only checkbox and table entries in ROADMAP.md.
- Fix approach: Scope replacements to known patterns (headings only for section renaming, don't touch body text), or track all cross-references as structured data.

**`isGitIgnored` Uses String Sanitization Instead of Argument Array:**
- Issue: `get-shit-done/bin/lib/core.cjs` line 127 calls `git check-ignore` via `execSync` with string concatenation, stripping non-alphanumeric characters from the path. This is a partial sanitization.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 125-135)
- Impact: Paths with legitimate characters like `+`, `[`, `]`, or space will be silently mangled, causing false negatives (reporting not-ignored when it is). The correct fix is `execFileSync` with an argument array.
- Fix approach: Replace with `execSync('git check-ignore -q', { input: targetPath })` or use `execFileSync` with args array like `execGit` does.

**`.bak` File Left in Commands Directory:**
- Issue: `commands/gsd/new-project.md.bak` is a backup file committed to the repository.
- Files: `commands/gsd/new-project.md.bak`
- Impact: Adds confusion about which file is authoritative; Claude Code may read both. No runtime impact but adds noise.
- Fix approach: Delete file and commit removal.

**Tmp File Leak from Large JSON Payloads:**
- Issue: `get-shit-done/bin/lib/core.cjs` output function (lines 41-44) writes JSON payloads over 50KB to `/tmp/gsd-{timestamp}.json`. These files are never cleaned up.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 41-47)
- Impact: On long-running systems or high-frequency usage, `/tmp/` accumulates JSON files. No security risk since they contain planning documents, not credentials.
- Fix approach: Either write to a fixed path (overwritten each call) or register a cleanup via `process.on('exit')`.

---

## Known Bugs

**`cmdPhaseNextDecimal` Only Handles One Level of Decimal Nesting:**
- Symptoms: `phase next-decimal 06.1` returns `06.1.1` correctly, but `phase next-decimal 06.1.1` would be incorrectly computed because the pattern only strips `basePhase.split('.')[1]`.
- Files: `get-shit-done/bin/lib/phase.cjs` (lines 132-135)
- Trigger: Inserting a phase into a decimal that is itself a decimal (e.g., after phase 06.1 you insert 06.1.1, then try to insert another at that level).
- Workaround: Manually specify the decimal phase number.

**`cmdPhaseRemove` Roadmap Regex Escapes `targetPhase` Not `normalized`:**
- Symptoms: When removing a phase by number like `6` (without zero-padding), the `escapeRegex(targetPhase)` call at line 607 escapes the un-normalized value. The ROADMAP pattern `Phase ${targetEscaped}` may not match if the roadmap uses zero-padded `06`.
- Files: `get-shit-done/bin/lib/phase.cjs` (lines 606-615)
- Trigger: Removing a phase by unpadded integer when the roadmap used padded format.
- Workaround: Use zero-padded phase numbers consistently in all arguments.

**`cmdStateResolveBlocker` Uses Substring Match for Deletion:**
- Symptoms: Resolving a blocker with text "auth" will also remove a blocker containing "authentication" or "re-auth issue".
- Files: `get-shit-done/bin/lib/state.cjs` (lines 353-358) — `line.toLowerCase().includes(text.toLowerCase())`
- Trigger: Any blocker text that is a substring of another.
- Workaround: Use unique, specific blocker text that won't match other entries.

---

## Security Considerations

**`isGitIgnored` Path Interpolation:**
- Risk: The stripped path is interpolated into a shell command string. The sanitization (`/[^a-zA-Z0-9._\-/]/g`) removes most injection vectors but allows `.` and `-` which could be used in relative traversal.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 125-135)
- Current mitigation: Character whitelist reduces surface. However, `execGit` (same file, lines 137-156) correctly uses argument arrays — `isGitIgnored` is the only outlier.
- Recommendations: Convert `isGitIgnored` to use `execFileSync` with argument array, matching `execGit`'s approach.

**`gsd-check-update.js` Spawns `npm view` Without Timeout Handling:**
- Risk: The update check spawns a background `npm view get-shit-done-cc version` process with a 10-second timeout. If npm is misconfigured and hangs, the child process lingers. Since the process is `detached: true` and `unref()`d, it becomes an orphan.
- Files: `hooks/gsd-check-update.js` (lines 25-62)
- Current mitigation: `detached: true` means it won't block the parent. Risk is minor (orphaned process, not a security issue).
- Recommendations: Use `maxBuffer` and `timeout` together, handle `SIGTERM` in the child string.

**Brave API Key Read from Environment:**
- Risk: `BRAVE_API_KEY` is read from `process.env` directly. No validation that the key format is correct before sending to the external API.
- Files: `get-shit-done/bin/lib/commands.cjs` (line 321)
- Current mitigation: The API call will fail gracefully with `available: false` if the key is wrong.
- Recommendations: Not a serious concern for a local CLI tool.

---

## Performance Bottlenecks

**`buildStateFrontmatter` Scans All Phase Directories on Every STATE.md Write:**
- Problem: Every call to `writeStateMd` triggers `syncStateFrontmatter` → `buildStateFrontmatter`, which reads the entire `.planning/phases/` directory tree and counts all PLAN.md and SUMMARY.md files to compute progress statistics.
- Files: `get-shit-done/bin/lib/state.cjs` (lines 548-569), called from `writeStateMd` (line 639)
- Cause: Progress recalculation is eager — happens on every write, not only when progress is requested.
- Improvement path: Separate progress recalculation into an explicit step (already possible via `state update-progress`). Make `writeStateMd` accept a flag to skip frontmatter sync, or cache the scan result within a single process invocation.

**`cmdHistoryDigest` Reads All Summary Files in All Phases:**
- Problem: Aggregates every SUMMARY.md across all phases and archived milestones by doing a full filesystem scan on each invocation.
- Files: `get-shit-done/bin/lib/commands.cjs` (lines 99-197)
- Cause: No caching; called fresh each time resume or context-loading workflows need history.
- Improvement path: Cache digest to `.planning/codebase/history-digest.json` and only invalidate when SUMMARY.md files change (via mtime comparison).

---

## Fragile Areas

**`cmdPhaseRemove` Renumbering ROADMAP.md:**
- Files: `get-shit-done/bin/lib/phase.cjs` (lines 602-664)
- Why fragile: Uses a loop from 99 down to `removedInt+1`, applying six separate regex replacements per iteration. If a user has custom text in ROADMAP.md that mentions phase numbers (e.g., "Phase 5 introduced caching"), those references are silently renumbered. The loop does not distinguish between structural references and prose.
- Safe modification: Test `phase remove` on a copy of the project first. Always review the ROADMAP.md diff after removal.
- Test coverage: `tests/phase.test.cjs` covers basic remove cases but not prose renumbering side effects.

**STATE.md Frontmatter Sync (Dual-Write Pattern):**
- Files: `get-shit-done/bin/lib/state.cjs` (lines 508-641)
- Why fragile: STATE.md has two sources of truth: the markdown body (human-readable `**Field:** value` format) and YAML frontmatter (machine-readable, auto-generated from body). Every write reconstructs the frontmatter from the body. If the body diverges from what the frontmatter was built from (e.g., manual edits to STATE.md), the next automated write will overwrite frontmatter with stale-body-derived values.
- Safe modification: When manually editing STATE.md, edit only the `**Field:**` lines in the body, not the frontmatter block. The frontmatter will be rebuilt correctly on the next automated state update.
- Test coverage: `tests/state.test.cjs` covers basic sync cases.

**`extractFrontmatter` Stack-Based YAML Parser:**
- Files: `get-shit-done/bin/lib/frontmatter.cjs` (lines 11-84)
- Why fragile: The stack-based parser uses indentation level to determine nesting. Tab characters (vs spaces) will break parsing silently. YAML values containing `:` are handled only if they match the `key: value` pattern — a value like `http://example.com` would be misinterpreted (`:` is always split). The logic for converting empty objects to arrays (lines 65-76) involves mutation via reference comparison, which is non-obvious.
- Safe modification: Always use `reconstructFrontmatter` (not hand-written YAML) to write frontmatter. Never use tab characters. Always quote values containing `:` or `#`.
- Test coverage: `tests/frontmatter.test.cjs` covers basic cases but not adversarial inputs.

**Workflow Markdown Files Are Context-Loaded at Agent Spawn Time:**
- Files: All `get-shit-done/workflows/*.md`, `get-shit-done/agents/*.md`
- Why fragile: Workflows reference each other via hardcoded `~/.claude/get-shit-done/` paths (e.g., `@~/.claude/get-shit-done/workflows/execute-plan.md`). If the installation path changes or differs (project-local install vs global), all `@`-references break silently — the agent will not receive the referenced content and may behave incorrectly without any error.
- Safe modification: When forking, update all hardcoded `~/.claude/get-shit-done/` references in workflow and agent files. A global find-replace will catch most cases.
- Test coverage: None — path resolution is tested in `cmdVerifyReferences` but workflows are not validated against that command.

---

## Scaling Limits

**Phase Removal Upper Bound:**
- Current capacity: Supports up to 99 integer phases in the ROADMAP renumbering loop.
- Limit: Phase count > 99 will leave phases 100+ unrenumbered after a remove operation.
- Files: `get-shit-done/bin/lib/phase.cjs` (line 627 — `const maxPhase = 99`)
- Scaling path: Replace fixed bound with a dynamic scan of all phase numbers in content before renumbering.

**Output Buffer Ceiling:**
- Current capacity: Outputs up to 50KB as inline JSON; above that writes to `/tmp`.
- Limit: Very large history digests (many phases, many summaries) will spill to `/tmp` files, requiring callers to handle `@file:` prefixed responses. Most workflow markdown does not handle this case.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 41-47)
- Scaling path: Workflows should check for `@file:` prefix and read file when present, or the limit should be raised.

---

## Dependencies at Risk

**No Production Dependencies — Only `devDependencies`:**
- Risk: `get-shit-done/bin/gsd-tools.cjs` and all lib files are pure Node.js CommonJS with zero npm runtime dependencies (only `devDependencies`: `c8`, `esbuild`). This is intentional for portability but means all complex parsing (YAML, Markdown) is hand-rolled.
- Files: `package.json`
- Impact: Custom parsers create ongoing maintenance burden and edge-case bugs. Adding a dependency like `js-yaml` (MIT, stable, no transitive deps) would eliminate the frontmatter parser risk.
- Migration plan: Low risk to add — `js-yaml` is a single-file bundle option. The `extractFrontmatter` and `reconstructFrontmatter` functions are the only replacement targets.

**Node.js `>=16.7.0` Engine Requirement:**
- Risk: The declared minimum is Node 16.7.0 (released 2021). The code uses `fs.rmSync` with `recursive` (added in v14.14), `fetch` via the `websearch` command which requires Node 18+.
- Files: `package.json` (engines field), `get-shit-done/bin/lib/commands.cjs` (line 347 — `await fetch(...)`)
- Impact: On Node 16 or 17, `cmdWebsearch` will throw `ReferenceError: fetch is not defined`. The rest of the codebase works on Node 16.
- Migration plan: Either bump engine requirement to `>=18` or add a polyfill guard around the `fetch` call.

---

## Missing Critical Features

**No Atomic File Writes:**
- Problem: All file writes use `fs.writeFileSync` directly. If the process is interrupted mid-write (e.g., Ctrl+C during a phase remove renaming sequence), files can be left in a partial state.
- Files: Throughout `get-shit-done/bin/lib/` — all `fs.writeFileSync` calls
- Blocks: Data integrity guarantees. A crash during `cmdPhaseRemove` could leave ROADMAP.md half-renumbered with directories already renamed.
- Mitigation path: Write to `.tmp` file then `fs.renameSync` (atomic on most POSIX systems). Not critical for typical usage but relevant when scripting.

**No Config Schema Validation:**
- Problem: `loadConfig` in `get-shit-done/bin/lib/core.cjs` silently falls back to defaults on any JSON parse error or missing key. Invalid config values (e.g., `"model_profile": "ultra"`) are accepted without warning.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 67-121)
- Blocks: Users who misconfigure `.planning/config.json` get no feedback — the system silently uses defaults.
- Mitigation path: Add a `validate-config` command or warn when unknown keys are present.

---

## Test Coverage Gaps

**Workflow Markdown Files Have Zero Test Coverage:**
- What's not tested: The 20+ workflow `.md` files in `get-shit-done/workflows/` that orchestrate agent behavior. These files contain embedded bash commands, argument parsing logic, and cross-references.
- Files: `get-shit-done/workflows/*.md`, `commands/gsd/*.md`
- Risk: Workflow logic bugs (wrong bash command, broken path reference, incorrect argument parsing) only surface at runtime when an agent executes the workflow.
- Priority: Medium — runtime errors in workflows are visible but hard to reproduce.

**`parseMustHavesBlock` Is Lightly Tested:**
- What's not tested: The secondary YAML parser in `get-shit-done/bin/lib/frontmatter.cjs` (lines 159-222) handles deeply nested `must_haves` blocks. Edge cases like empty artifacts lists, array items with embedded quotes, or missing `path` keys are not covered.
- Files: `tests/frontmatter.test.cjs`
- Risk: Malformed PLAN.md frontmatter silently produces empty artifact lists, causing `verify artifacts` to report "no artifacts" instead of a parse error.
- Priority: Low — only affects verification subcommand.

**Phase Remove Renumbering Prose Side-Effects Untested:**
- What's not tested: Whether `cmdPhaseRemove` correctly avoids renumbering phase numbers in free-text ROADMAP.md body content (e.g., "Based on Phase 5 design decisions...").
- Files: `tests/phase.test.cjs`
- Risk: After removing a phase, prose descriptions in ROADMAP.md may reference wrong phase numbers, corrupting project context for future planning sessions.
- Priority: Medium.

**Hooks Are Not Tested:**
- What's not tested: `hooks/gsd-context-monitor.js`, `hooks/gsd-statusline.js`, `hooks/gsd-check-update.js` have no test files.
- Files: No test file for hooks exists.
- Risk: Regressions in hook behavior (context monitoring thresholds, statusline rendering, update detection) are invisible until manually observed in a session.
- Priority: Low — hooks are additive and fail silently by design.

---

*Concerns audit: 2026-02-28*
