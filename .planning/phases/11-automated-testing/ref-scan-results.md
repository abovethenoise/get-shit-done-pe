# @file Reference Scan Results

**Scanned:** 2026-03-01
**Scope:** commands/gsd/, get-shit-done/workflows/, get-shit-done/templates/, get-shit-done/references/, agents/

## Summary

| Metric | Count |
|--------|-------|
| Total @~/.claude/ refs scanned | 66 |
| Resolved (real refs) | 64 |
| False positives | 2 |
| Truly unresolved | 0 |
| Auto-fixed | 0 |
| Absolute path refs (@/Users/...) | 0 |

## False Positives (Not Real Breaks)

| Source File | Line | Reference | Reason |
|-------------|------|-----------|--------|
| get-shit-done/templates/codebase/structure.md | 219 | `@~/.claude/get-shit-done/workflows/{name}.md` | Template placeholder -- `{name}` is a variable, not a literal path |
| agents/gsd-executor.md | 170 | `@~/.claude/get-shit-done/references/checkpoints.md**` | Markdown bold `**` suffix captured by regex -- actual file `checkpoints.md` exists and resolves |

## Unresolved References

None -- all 64 real @file references resolve to existing source files.

## Notes

- Only `@~/.claude/` prefix references were scanned (source repo paths)
- Install-path (`~/.claude/`) validation is deferred to Phase 12
- Absolute `@/Users/...` paths are used in plan execution contexts and are not auto-fixed
