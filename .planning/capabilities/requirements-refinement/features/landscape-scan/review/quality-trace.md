# Quality Trace: landscape-scan

## Phase 1: Quality Standards

Evaluating a Node.js CLI data layer (`scan.cjs`), a markdown orchestrator workflow (`landscape-scan.md`), and a stateless agent template (`gsd-scan-pair.md`) against:

- **DRY:** Does scan.cjs duplicate logic already present in capability.cjs or core.cjs?
- **KISS:** Are the three artifacts minimal for the requirements they serve?
- **Earned Abstractions:** Do exported constants and schema structures justify their existence?
- **Robustness:** Are error paths and edge cases handled explicitly?
- **Idiomatic:** Does the CJS code follow established patterns in this codebase?

---

## Phase 2: Trace Against Code

### Finding 1: Exported schema constants are dead code

**Category:** Bloat

**Verdict:** not met (proven)

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:12-16` -- `const FINDING_TYPES = ['CONFLICT', 'GAP', 'OVERLAP', ...]; const SEVERITY_LEVELS = ...; const CONFIDENCE_LEVELS = ...; const FINDING_FIELDS = ...;`
- `get-shit-done/bin/lib/scan.cjs:184-187` -- All four constants are exported via `module.exports`.
- Grep across the entire `get-shit-done/` tree shows zero imports of `FINDING_TYPES`, `SEVERITY_LEVELS`, `CONFIDENCE_LEVELS`, or `FINDING_FIELDS` anywhere outside scan.cjs itself.
- These constants are not consumed by scan.cjs internally either -- they exist purely as exports.
- Reasoning: Exported symbols with zero consumers are speculative code. They add surface area to understand and maintain with no current value. YAGNI violation. If a future consumer needs them, they can be added at that time.

---

### Finding 2: Capability directory listing duplicated between scan.cjs and capability.cjs

**Category:** DRY

**Verdict:** not met (suspected)

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:20-31` -- `cmdScanDiscover` reads `.planning/capabilities/`, filters directories, sorts, iterates over slugs.
- `get-shit-done/bin/lib/scan.cjs:103-113` -- `cmdScanPairs` independently reads the same directory with the identical pattern.
- `get-shit-done/bin/lib/capability.cjs:50-61` -- `cmdCapabilityList` performs the same directory read, filter, sort pattern.
- Reasoning: The three-line pattern `fs.readdirSync(capabilitiesDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort()` appears at least 3 times across two files in the scan/capability domain. Within scan.cjs itself, `cmdScanDiscover` and `cmdScanPairs` both independently resolve the capabilities directory and list its subdirectories. `cmdScanPairs` could call `cmdScanDiscover` or share a helper, but instead duplicates the I/O. This is consistent with patterns across the broader codebase (the same snippet appears 10+ times in various lib files), so this is a codebase-wide pattern rather than a scan-specific regression. Flagging as suspected rather than proven since the broader codebase already has this pattern established.

---

### Finding 3: cmdScanDiscover skips `capability-list` per FN-01 requirement text

**Category:** Idiomatic Violation

**Verdict:** not met (suspected)

**Evidence:**
- FEATURE.md FN-01 states: "Read all capabilities via `gsd-tools.cjs capability-list`"
- `get-shit-done/bin/lib/scan.cjs:20-31` -- `cmdScanDiscover` directly reads the filesystem instead of reusing or delegating to `capability-list`.
- `get-shit-done/bin/lib/capability.cjs:49-84` -- `cmdCapabilityList` exists and lists capabilities, but skips directories without CAPABILITY.md (line 66: `if (!content) continue`).
- Reasoning: The implementation diverges from the requirement's stated approach. However, `cmdScanDiscover` intentionally includes directories without CAPABILITY.md (to emit GAP findings per FN-01's acceptance criteria), while `capability-list` silently skips them. This makes direct reuse impossible without changing `capability-list`. The divergence is functionally justified but the requirement text is now stale -- the spec says one thing, the code does another for valid reasons. This is a documentation/traceability gap rather than a code defect.

---

### Finding 4: Medium/large tier filtering is stubbed with no tracking mechanism

**Category:** Robustness

**Verdict:** met (with caveat)

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:117-119` -- `if (count > 20) { tier = 'medium'; process.stderr.write('Warning: Medium/large tier pair filtering not yet implemented. Falling back to full pairwise.\n'); }`
- TC-03 specifies three tiers: small (<=20), medium (21-50), large (50+). Only small is implemented.
- Reasoning: The stderr warning is appropriate and transparent -- the user knows filtering is not yet active. The code correctly falls back to full pairwise. This is a clean stub. The only concern is that for projects with 50 capabilities, full pairwise yields 1225 pairs, which would be expensive. The warning goes to stderr (not stdout), so it won't corrupt JSON output. The tier field is returned in the JSON output, which is correct for downstream awareness. Verdict: met. The stub is honest and safe.

---

### Finding 5: Hard-coded placeholder ID in GAP findings

**Category:** KISS

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:87` -- `id: 'FINDING-XXX'`
- `get-shit-done/workflows/landscape-scan.md:41-44` -- Orchestrator is responsible for assigning sequential FINDING-{NNN} IDs and replacing the placeholder.
- Reasoning: The division of responsibility is clean -- CLI emits placeholder, orchestrator assigns real IDs. This follows the same pattern used in the agent template (`gsd-scan-pair.md:25` -- `id: FINDING-XXX`). Consistent across both finding sources.

---

### Finding 6: Checkpoint uses empty files as completion markers

**Category:** KISS

**Verdict:** met

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:152-153` -- `fs.writeFileSync(filePath, '', 'utf-8')`
- Reasoning: Empty sentinel files are the simplest possible checkpoint mechanism. No serialization, no schema, no parsing. The list action (line 168-172) simply checks for `.complete` file existence. This is appropriately minimal for the requirement (EU-02).

---

### Finding 7: Agent template placed in templates/ but TC-02 spec says agents/

**Category:** Idiomatic Violation

**Verdict:** not met (proven)

**Evidence:**
- FEATURE.md TC-02: "Agent file: `agents/gsd-scan-pair.md`"
- Actual location: `get-shit-done/templates/gsd-scan-pair.md`
- `get-shit-done/workflows/landscape-scan.md:78` -- `cat "$HOME/.claude/get-shit-done/templates/gsd-scan-pair.md"`
- Reasoning: The spec says `agents/`, the implementation uses `templates/`. The orchestrator correctly references `templates/`, so the system works. But the requirement text is now inaccurate. This is a traceability gap -- if someone reads TC-02 and looks in `agents/`, they will not find the file.

---

### Finding 8: No validation of --pair argument format in checkpoint command

**Category:** Robustness

**Verdict:** not met (suspected)

**Evidence:**
- `get-shit-done/bin/lib/scan.cjs:138` -- `const pair = pairIdx !== -1 ? args[pairIdx + 1] : null;`
- The pair value is used directly in a file path: `scan.cjs:152` -- `const filePath = path.join(pairsDir, '${pair}.complete')`
- No validation that `pair` matches the expected `{A}__{B}` format, no sanitization for path traversal characters.
- Reasoning: While this is an internal tool (not user-facing), a `--pair` value containing `../` could write checkpoint files outside the intended directory. The risk is low since this is orchestrator-called, but other CLI commands in this codebase (e.g., `generateSlugInternal` in core.cjs:361-362) explicitly reject path separators. The scan checkpoint command does not follow this established defensive pattern.

---

### Finding 9: Orchestrator handles @file: protocol for large output

**Category:** Robustness

**Verdict:** met

**Evidence:**
- `get-shit-done/workflows/landscape-scan.md:31-34` -- Explicit handling of `@file:` prefix for large JSON output.
- `get-shit-done/bin/lib/core.cjs:33-37` -- `output()` function writes to tmpfile when JSON exceeds 50KB.
- Reasoning: With `scan-discover` returning full file contents for all capabilities, the payload can easily exceed the 50KB buffer limit. The orchestrator correctly documents and handles this edge case. Clean integration with the existing core.cjs pattern.

---

### Finding 10: Consolidation step is underspecified for automation

**Category:** Unnecessary Abstraction

**Verdict:** not met (suspected)

**Evidence:**
- `get-shit-done/workflows/landscape-scan.md:106-119` -- The consolidation step instructs the orchestrator to "Analyze all finding cards together and identify root causes" and "Group N symptoms into M root causes."
- This is a reasoning task embedded in the orchestrator workflow, not delegated to an agent or a deterministic algorithm.
- Reasoning: The orchestrator is an LLM workflow prompt, so it can perform reasoning. However, this conflates two responsibilities: the orchestrator is both a control-flow coordinator (discover, enumerate, spawn agents, write files) and a reasoning engine (consolidation analysis). The pair analysis is correctly delegated to a dedicated agent template, but consolidation -- which is arguably a harder analytical task (cross-pair pattern recognition) -- is left inline. For the current scale (small projects, few findings), this is likely fine. For larger projects with dozens of findings, a dedicated consolidation agent would provide better separation. Flagging as suspected because the current scope may not justify a separate agent, but the asymmetry in delegation is worth noting.

---

## Summary

| # | Title | Category | Verdict |
|---|-------|----------|---------|
| 1 | Exported schema constants are dead code | Bloat | not met (proven) |
| 2 | Capability directory listing duplicated | DRY | not met (suspected) |
| 3 | cmdScanDiscover skips capability-list | Idiomatic | not met (suspected) |
| 4 | Medium/large tier filtering stubbed | Robustness | met |
| 5 | Hard-coded placeholder ID in GAP findings | KISS | met |
| 6 | Checkpoint uses empty sentinel files | KISS | met |
| 7 | Agent template in templates/ vs spec agents/ | Idiomatic | not met (proven) |
| 8 | No pair argument validation in checkpoint | Robustness | not met (suspected) |
| 9 | @file: protocol handling for large output | Robustness | met |
| 10 | Consolidation reasoning inline in orchestrator | Unnecessary Abstraction | not met (suspected) |

**Proven issues (2):** Dead exported constants (Finding 1), spec/implementation path mismatch (Finding 7).

**Suspected issues (4):** DRY violation in directory listing (Finding 2), stale requirement reference (Finding 3), missing input sanitization (Finding 8), asymmetric delegation of reasoning tasks (Finding 10).

**Met (4):** Tier stub transparency (Finding 4), placeholder ID pattern (Finding 5), checkpoint simplicity (Finding 6), large output handling (Finding 9).
