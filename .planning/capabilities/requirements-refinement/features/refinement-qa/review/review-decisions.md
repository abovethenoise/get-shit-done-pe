# Review Decisions: refinement-qa

## Summary

| Finding | Severity | Decision |
|---------|----------|----------|
| 1. source_finding/source field mismatch | major | Accept |
| 2. Missing secondary sort by severity | major | Accept |
| 3. FEATURE.md TC-01 stale route name | minor | Accept |
| 4. parseMarkdownTable boundary bug | minor | Accept |
| 5. Spec "no file I/O" claim stale | minor | Accept |
| 6. Banner style systemic drift | minor | Accept |
| 7. Checkpoint trigger implicit | minor | Accept |

## All accepted — fix list:

1. Fix source_finding/source field name consistency across write/parse boundary
2. Add secondary severity sort in changeset type groups
3. Update FEATURE.md TC-01 to say changeset-write
4. Change `continue` to `break` in parseMarkdownTable at table boundary
5. Update FEATURE.md TC-01 "no file I/O" to match actual design
6. Note banner style as systemic issue (not refinement-qa specific)
7. Add explicit checkpoint counter conditional in workflow body
