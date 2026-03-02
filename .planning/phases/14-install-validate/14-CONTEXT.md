# Phase 14: Install & Validate - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Running `node install.js` deploys all v2 artifacts to ~/.claude, resolves path tokens, cleans legacy artifacts, and the full pipeline works end-to-end on both fresh and existing projects. Manual install only (no npm registry).

</domain>

<decisions>
## Implementation Decisions

### Install target structure
- Single tree under `~/.claude/get-shit-done/` with subdirs (workflows/, agents/, templates/, references/, framings/)
- Commands go to their expected Claude Code locations (commands/gsd/)
- Everything in source directories gets deployed — keep non-installable files out of source dirs rather than filtering at install time

### Deploy behavior
- Always overwrite on install — config.json, framings, everything deploys fresh
- Rip and replace: clean install every time, delete old artifacts before deploying new
- Also clean deployed legacy artifacts from user machines (gsd-local-patches/, gsd-file-manifest.json)

### Path resolution
- `{GSD_ROOT}` tokens resolved at install time (baked into files during copy)
- `{GSD_ROOT}` resolves to `~/.claude`
- Post-replacement validation: scan all installed files for remaining `{GSD_ROOT}` strings — fail install if any found

### Cleanup scope
- Strip install.js per requirements only (INST-05, INST-06) — remove Codex/Gemini adapters, patch system, manifest, changelog/version metadata
- Don't refactor remaining install.js code beyond what's required
- No version tracking beyond what's in the source — manual install only, no npm versioning concerns

### Install UX
- Single command: `node install.js`
- Silent output — no logs unless there's an error
- Clear install instructions so user knows it replaces old GSD globally

### Validation
- Automated dev-only validation script (not shipped to users)
- Validation checks:
  1. Expected files exist at installed paths
  2. No unresolved `{GSD_ROOT}` tokens in installed files
  3. Commands are discoverable (/gsd:help equivalent)
  4. gsd-tools.cjs runs without error
  5. No references to deleted files or old phase paths
- Existing project test uses this repo (get-shit-done-pe) as test case

### Claude's Discretion
- Additional path tokens beyond {GSD_ROOT} if source audit reveals need
- Install documentation location
- Exact directory layout within the single-tree structure

</decisions>

<specifics>
## Specific Ideas

- User wants very clear instructions on how to install and confirmation it replaces old GSD globally
- "Rip and replace" — no incremental upgrades, full clean install every time

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-install-validate*
*Context gathered: 2026-03-02*
