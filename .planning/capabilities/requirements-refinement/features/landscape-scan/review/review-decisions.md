# Review Decisions: landscape-scan

## Summary

| Finding | Severity | Decision |
|---------|----------|----------|
| 1. TC-03 — tiered scaling unimplemented | major | Accept (MUST FIX) |
| 2. TC-02 — agent file location + model | major | Accept (fix spec — templates/ is correct for prompt-template pattern) |
| 3. Sonnet model not enforced | minor | Accept — enforce sonnet for executor agents, inherit for judge roles |
| 4. scan-discover doesn't use capability-list | minor | Accept (update spec) |
| 5. Dead schema constant exports | minor | Accept (remove) |
| 6. Dead extractFrontmatter import | minor | Accept (remove) |
| 7. DRY — dir listing duplication | minor | Accept (refactor) |
| 8. --pair path sanitization missing | minor | Accept (add validation) |
| 9. Layer 3 format deviation | minor | Accept (update spec) |
| 10. Consolidation inline in orchestrator | minor | Accept (note for future) |
| 11. Completeness edge case | minor | Accept (fix logic) |
| 12. Checkpoint path spec staleness | minor | Accept (update spec) |

## Key Principle Established

Model selection rule: **sonnet for executor agents, inherit (opus) for judge roles.** Applies across all GSD agents.
