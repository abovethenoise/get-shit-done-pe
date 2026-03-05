---
phase: requirements-refinement/landscape-scan
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/bin/lib/scan.cjs
  - get-shit-done/bin/gsd-tools.cjs
autonomous: true
requirements:
  - TC-01
  - TC-03
  - FN-01
  - FN-03
must_haves:
  truths:
    - "Running `node gsd-tools.cjs scan-discover` returns JSON with all capabilities, their artifact paths, loaded contents, and completeness status"
    - "Running `node gsd-tools.cjs scan-pairs` returns ordered list of capability pairs with tier detection"
    - "Running `node gsd-tools.cjs scan-checkpoint --pair A__B --action write` creates a checkpoint file, and `--action read` returns completed pairs"
    - "Capabilities without CAPABILITY.md are included in output with completeness: none (GAP flagging)"
  artifacts:
    - path: "get-shit-done/bin/lib/scan.cjs"
      provides: "cmdScanDiscover, cmdScanPairs, cmdScanCheckpoint exports"
    - path: "get-shit-done/bin/gsd-tools.cjs"
      provides: "scan-discover, scan-pairs, scan-checkpoint CLI routes"
  key_links:
    - from: "get-shit-done/bin/gsd-tools.cjs"
      to: "get-shit-done/bin/lib/scan.cjs"
      via: "require and case routing"
      pattern: "case 'scan-discover'"
    - from: "get-shit-done/bin/lib/scan.cjs"
      to: "get-shit-done/bin/lib/capability.cjs"
      via: "reuse findCapabilityInternal, listAllFeaturesInternal"
      pattern: "require.*capability"
---

<objective>
Create the scan.cjs library module with three CLI routes for landscape scan: discovery, pair enumeration, and checkpointing.

Purpose: Provide the data layer that the orchestrator workflow (Plan 02) will drive. All file I/O lives here so the scan-pair agent stays stateless.
Output: scan.cjs module + 3 new CLI routes in gsd-tools.cjs
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/landscape-scan/FEATURE.md
@.planning/capabilities/requirements-refinement/features/landscape-scan/RESEARCH.md

<interfaces>
<!-- Existing functions to reuse from capability.cjs -->
findCapabilityInternal(cwd, slug) -> { found, directory, capability_path }
listAllFeaturesInternal(cwd, capSlug) -> [{ slug, status, feature_path }]
safeReadFile(path) -> string | null
extractFrontmatter(content) -> object
output(result, raw) -> writes JSON to stdout (handles @file: for >50KB)

<!-- Existing route pattern in gsd-tools.cjs -->
case 'capability-list': { capability.cmdCapabilityList(cwd, raw); break; }

<!-- Output directory decision (resolves spec conflict flagged in RESEARCH.md) -->
Output dir: .planning/refinement/ (coherence-report's consumer contract is authoritative)
Checkpoint dir: .planning/refinement/pairs/
Findings dir: .planning/refinement/findings/

<!-- Pair checkpoint naming (resolves slug collision from RESEARCH.md) -->
Use double-underscore separator: {A}__{B}.complete (not {A}-{B} since slugs contain hyphens)

<!-- Tier boundaries from TC-03 -->
Small: <=20 caps -> full pairwise
Medium: 21-50 -> deferred (YAGNI per RESEARCH.md)
Large: 50+ -> deferred (YAGNI per RESEARCH.md)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Create scan.cjs with discovery, pair enumeration, and checkpoint commands</name>
  <reqs>TC-01, TC-03, FN-01</reqs>
  <files>get-shit-done/bin/lib/scan.cjs</files>
  <action>
  Create new CommonJS module `scan.cjs` with three exported functions:

  **cmdScanDiscover(cwd, raw):**
  - Read `.planning/capabilities/` directory entries (ALL entries, not just those with CAPABILITY.md)
  - For each directory:
    - Check for CAPABILITY.md -> load content, extract frontmatter
    - Check for features/ subdirectory -> list feature dirs, load each FEATURE.md
    - Check for .documentation/capabilities/{slug}.md -> load if exists
    - Compute completeness: "full" (CAPABILITY.md + at least 1 feature), "partial" (CAPABILITY.md but no features), "none" (directory exists but no CAPABILITY.md)
  - For capabilities with completeness "none": emit a GAP finding card object in the output (type: GAP, severity: HIGH, summary: "Capability directory exists with no specification")
  - Return JSON via output() matching TC-01 example schema:
    ```
    { capabilities: [{ slug, artifacts: { capability: {path, content}, features: [...], documentation: {path, content} }, completeness }], gap_findings: [...] }
    ```
  - Reuse safeReadFile, extractFrontmatter from core.cjs. Do NOT reuse cmdCapabilityList (it skips dirs without CAPABILITY.md, but we need those for GAP detection).

  **cmdScanPairs(cwd, raw):**
  - Call internal discovery logic to get capability slugs (all dirs, including those without CAPABILITY.md)
  - Sort alphabetically
  - Generate all unique pairs where A < B
  - Detect tier: count = slugs.length. If count <= 20: tier = "small". Else: tier = "medium" (emit warning that medium/large tiers are not yet implemented, falling back to full pairwise).
  - Return JSON: { tier, capability_count, pairs: [{ a, b }], total_pairs }

  **cmdScanCheckpoint(cwd, args, raw):**
  - args: --pair (required), --action (read|write|list), --output-dir (optional, default .planning/refinement)
  - action "write": create `{output-dir}/pairs/{A}__{B}.complete` file (empty marker)
  - action "read": return { completed: true/false } for the given pair
  - action "list": return { completed_pairs: [...] } listing all .complete files in pairs/
  - Create pairs/ directory if it doesn't exist on write
  - Use double-underscore separator to avoid slug collision

  All functions: CommonJS exports, pure Node.js (fs, path), no external deps.
  </action>
  <verify>
    <automated>cd get-shit-done/bin && node -e "const s = require('./lib/scan.cjs'); console.log(Object.keys(s))" | grep -q "cmdScanDiscover"</automated>
  </verify>
  <done>scan.cjs exports cmdScanDiscover, cmdScanPairs, cmdScanCheckpoint; module loads without error</done>
</task>

<task type="auto">
  <name>Wire scan CLI routes into gsd-tools.cjs router</name>
  <reqs>TC-01, FN-03</reqs>
  <files>get-shit-done/bin/gsd-tools.cjs</files>
  <action>
  Add three new cases to the CLI router in gsd-tools.cjs:

  1. At the top of the file, add require for scan module:
     `const scan = require('./lib/scan.cjs');`

  2. Add router cases (follow existing pattern from capability-list):
     ```
     case 'scan-discover': { scan.cmdScanDiscover(cwd, raw); break; }
     case 'scan-pairs': { scan.cmdScanPairs(cwd, raw); break; }
     case 'scan-checkpoint': { scan.cmdScanCheckpoint(cwd, args, raw); break; }
     ```

  3. Place these cases near the existing capability routes for logical grouping.

  4. Define the finding card frontmatter schema as a constant in scan.cjs (used by cmdScanDiscover for GAP findings and referenced by Plan 02's agent):
     - FINDING_TYPES: ['CONFLICT', 'GAP', 'OVERLAP', 'DEPENDS_ON', 'ASSUMPTION_MISMATCH', 'ALIGNMENT']
     - SEVERITY_LEVELS: ['HIGH', 'MEDIUM', 'LOW']
     - CONFIDENCE_LEVELS: ['HIGH', 'MEDIUM', 'LOW']
     - Template fields: id, type, severity, confidence, affected_capabilities, doc_sources, summary, recommendation, root_cause (nullable)
  </action>
  <verify>
    <automated>cd get-shit-done/bin && node gsd-tools.cjs scan-pairs 2>&1 | head -5</automated>
  </verify>
  <done>All three scan-* routes respond when invoked via gsd-tools.cjs; scan-pairs returns JSON with tier and pairs array for the current project</done>
</task>

</tasks>

<verification>
1. `node gsd-tools.cjs scan-discover` returns JSON with all capabilities from .planning/capabilities/ (including any without CAPABILITY.md as completeness: "none")
2. `node gsd-tools.cjs scan-pairs` returns tier: "small" with correct pair count for current project
3. `node gsd-tools.cjs scan-checkpoint --pair test-a__test-b --action write` creates checkpoint file, `--action read --pair test-a__test-b` returns completed: true
4. No external dependencies added; all logic is pure Node.js
</verification>

<success_criteria>
- Three CLI routes (scan-discover, scan-pairs, scan-checkpoint) operational
- Discovery includes GAP detection for capability dirs without CAPABILITY.md
- Pair enumeration includes tier detection (small <=20 implemented, medium/large deferred with warning)
- Checkpoint uses double-underscore separator for slug safety
- Finding card schema constants exported for reuse by orchestrator
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/landscape-scan/01-SUMMARY.md`
</output>
