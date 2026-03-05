---
phase: requirements-refinement/refinement-qa
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/bin/lib/refinement.cjs
  - get-shit-done/bin/gsd-tools.cjs
autonomous: true
requirements:
  - TC-02
  - FN-04
must_haves:
  truths:
    - "CHANGESET.md has a defined schema: YAML frontmatter (date, status, counts) + markdown sections per entry with structured fields (type, source, capabilities, action, reasoning)"
    - "`changeset-parse` CLI route reads CHANGESET.md and returns JSON array of entry objects"
    - "`changeset-parse` refuses to parse partial changesets (status: partial in frontmatter)"
    - "All 6 entry types are representable: ACCEPT, MODIFY, REJECT, RESEARCH_NEEDED, ASSUMPTION_OVERRIDE, USER_INITIATED"
    - "Entries sorted by type then severity in the markdown output"
    - "Summary section at top has counts by type"
  artifacts:
    - path: "get-shit-done/bin/lib/refinement.cjs"
      provides: "cmdChangesetParse and cmdChangesetWrite exports added to existing module"
    - path: "get-shit-done/bin/gsd-tools.cjs"
      provides: "changeset-parse and changeset-write case entries in main switch"
  key_links:
    - from: "get-shit-done/bin/gsd-tools.cjs"
      to: "get-shit-done/bin/lib/refinement.cjs"
      via: "require('./lib/refinement.cjs') in changeset-parse and changeset-write cases"
      pattern: "changeset-parse|changeset-write"
    - from: "cmdChangesetParse"
      to: ".planning/refinement/CHANGESET.md"
      via: "reads and parses CHANGESET.md into JSON entry array"
      pattern: "CHANGESET\\.md"
---

<objective>
Define the CHANGESET.md schema and build the CLI routes for writing and parsing it.

Purpose: The change set is the contract between refinement-qa (producer) and change-application (consumer). The schema must be defined precisely before the workflow writes it. The `changeset-parse` route lets change-application consume it as JSON. The `changeset-write` route lets the workflow write entries incrementally.
Output: Two new CLI commands in refinement.cjs + route wiring in gsd-tools.cjs.
</objective>

<execution_context>
@{GSD_ROOT}/get-shit-done/workflows/execute-plan.md
@{GSD_ROOT}/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/capabilities/requirements-refinement/features/refinement-qa/FEATURE.md
@.planning/capabilities/requirements-refinement/features/refinement-qa/RESEARCH.md
@.planning/capabilities/requirements-refinement/features/change-application/FEATURE.md

<interfaces>
<!-- Existing refinement.cjs module (created by refinement-artifact Plan 01) -->
Exports: cmdRefinementInit, cmdRefinementWrite, parseMarkdownTable, diffMaps, snapshotFindings, snapshotTable
Pattern: CJS module with const { output, error, safeReadFile } = require('./core.cjs');
Route wiring: case 'route-name': { const { fn } = require('./lib/refinement.cjs'); fn(cwd, args, raw); break; }

<!-- CHANGESET.md entry types (from FN-04) -->
6 types: ACCEPT | MODIFY | REJECT | RESEARCH_NEEDED | ASSUMPTION_OVERRIDE | USER_INITIATED
Each entry: type, source (finding ID or "user-initiated"), affected capabilities, action, reasoning

<!-- Downstream consumer: change-application -->
change-application FN-01 calls `changeset-parse` to get JSON, filters to actionable (ACCEPT, MODIFY, USER_INITIATED, ASSUMPTION_OVERRIDE), sorts into safe execution order.
REJECT and RESEARCH_NEEDED are logged but not executed.

<!-- CHANGESET.md schema (defined by this plan -- the authoritative spec) -->
See Task 1 action for the full schema definition.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Add changeset-write command to refinement.cjs</name>
  <reqs>TC-02, FN-04</reqs>
  <files>get-shit-done/bin/lib/refinement.cjs</files>
  <action>
  Add `cmdChangesetWrite(cwd, args, raw)` to `lib/refinement.cjs`.

  **Purpose:** Write or update CHANGESET.md with proper schema. Supports both full-write and incremental checkpoint modes.

  **CHANGESET.md schema (authoritative definition):**

  ```markdown
  ---
  date: 2026-03-05
  status: complete        # "complete" or "partial" (for checkpoints)
  source: .planning/refinement/RECOMMENDATIONS.md
  total_items: 12
  counts:
    accept: 5
    modify: 2
    reject: 1
    research_needed: 2
    assumption_override: 1
    user_initiated: 1
  ---

  # Refinement Change Set

  ## Summary

  | Type | Count |
  |------|-------|
  | ACCEPT | 5 |
  | MODIFY | 2 |
  | REJECT | 1 |
  | RESEARCH_NEEDED | 2 |
  | ASSUMPTION_OVERRIDE | 1 |
  | USER_INITIATED | 1 |

  ## Entries

  ### CS-01: {topic from Q&A agenda}
  - **Type:** ACCEPT
  - **Source:** FINDING-003
  - **Capabilities:** capability-a, capability-b
  - **Action:** {recommendation text or user-modified action}
  - **Reasoning:** {recommendation text for accept, user reasoning for reject/modify/override}

  ### CS-02: {topic}
  - **Type:** REJECT
  - **Source:** FINDING-007
  - **Capabilities:** capability-c
  - **Action:** No action
  - **Reasoning:** {user's rejection reasoning}

  ### CS-03: {user-raised concern}
  - **Type:** USER_INITIATED
  - **Source:** user-initiated
  - **Capabilities:** capability-d
  - **Action:** {user-specified action}
  - **Reasoning:** {user-provided reasoning}
  ```

  **Accepts args:**
  - `--content-file <path>` -- path to JSON file with changeset data
  - `--checkpoint` -- optional flag; if present, writes with `status: partial`

  **Content file JSON schema:**
  ```json
  {
    "source": ".planning/refinement/RECOMMENDATIONS.md",
    "entries": [
      {
        "id": "CS-01",
        "topic": "...",
        "type": "ACCEPT",
        "source_finding": "FINDING-003",
        "capabilities": ["capability-a", "capability-b"],
        "action": "...",
        "reasoning": "..."
      }
    ]
  }
  ```

  **Behavior:**
  1. Read JSON from `--content-file`
  2. Validate: each entry must have id, topic, type, capabilities, action, reasoning. Type must be one of the 6 valid types.
  3. Sort entries: by type (ACCEPT, MODIFY, REJECT, RESEARCH_NEEDED, ASSUMPTION_OVERRIDE, USER_INITIATED), then within each type group maintain original order (no severity sort -- user-initiated items have no severity, and maintaining resolution order is more useful).
  4. Compute counts per type
  5. Render frontmatter with date, status (complete or partial based on --checkpoint flag), source, total_items, counts
  6. Render Summary table
  7. Render each entry as a markdown section: `### {id}: {topic}` with bullet fields
  8. Write to `.planning/refinement/CHANGESET.md`
  9. Output `{ written: true, path: ".planning/refinement/CHANGESET.md", status: "complete"|"partial", total: N }`

  **Path sanitization:** reject any `--content-file` containing `..` segments.

  Add to module.exports.
  </action>
  <verify>
    <automated>node -e "const r = require('./get-shit-done/bin/lib/refinement.cjs'); if (typeof r.cmdChangesetWrite !== 'function') throw new Error('cmdChangesetWrite not exported'); console.log('OK')"</automated>
  </verify>
  <done>cmdChangesetWrite exported from refinement.cjs. Writes CHANGESET.md with proper schema: YAML frontmatter (date, status, counts), Summary table, entry sections with structured fields. Supports both complete and partial (checkpoint) modes.</done>
</task>

<task type="auto">
  <name>Add changeset-parse command and wire both routes into gsd-tools.cjs</name>
  <reqs>TC-02, FN-04</reqs>
  <files>get-shit-done/bin/lib/refinement.cjs, get-shit-done/bin/gsd-tools.cjs</files>
  <action>
  **Part A: Add `cmdChangesetParse(cwd, raw)` to `lib/refinement.cjs`.**

  **Purpose:** Read CHANGESET.md and return JSON for change-application consumption.

  **Behavior:**
  1. Read `.planning/refinement/CHANGESET.md`
  2. If file does not exist: error "CHANGESET.md not found. Run refinement-qa first."
  3. Parse YAML frontmatter (use the existing js-yaml vendored dependency or manual parsing matching other refinement.cjs patterns)
  4. **Refuse partial:** If frontmatter `status` is `partial`: error "CHANGESET.md is partial (incomplete Q&A session). Cannot parse for execution. Complete the Q&A session first."
  5. Parse entry sections:
     - Find all `### CS-{NNN}:` headings
     - For each: extract fields from `- **Field:** value` bullet lines
     - Fields: type, source (mapped from source_finding), capabilities (split on `, `), action, reasoning
  6. Return JSON array of entry objects:
     ```json
     {
       "meta": { "date": "...", "source": "...", "total": N, "counts": {...} },
       "entries": [
         { "id": "CS-01", "topic": "...", "type": "ACCEPT", "source": "FINDING-003", "capabilities": [...], "action": "...", "reasoning": "..." }
       ]
     }
     ```
  7. Output via `output(result, raw)`

  **Parsing approach:**
  - Split content on `### CS-` to get entry blocks
  - For each block: regex extract `- \*\*Type:\*\* (.+)`, `- \*\*Source:\*\* (.+)`, etc.
  - Trim whitespace from all values
  - Capabilities: split on `, ` to get array

  Add to module.exports.

  **Part B: Wire both routes in `gsd-tools.cjs`.**

  Add after existing refinement routes in the switch statement:
  ```
  case 'changeset-write': {
    const { cmdChangesetWrite } = require('./lib/refinement.cjs');
    cmdChangesetWrite(cwd, args.slice(1), raw);
    break;
  }
  case 'changeset-parse': {
    const { cmdChangesetParse } = require('./lib/refinement.cjs');
    cmdChangesetParse(cwd, raw);
    break;
  }
  ```

  Add to CLI header comment under the "Refinement:" section:
  ```
   *   changeset-write --content-file P [--checkpoint]  Write CHANGESET.md from JSON
   *   changeset-parse                                   Parse CHANGESET.md to JSON
  ```
  </action>
  <verify>
    <automated>node -e "const r = require('./get-shit-done/bin/lib/refinement.cjs'); ['cmdChangesetWrite','cmdChangesetParse'].forEach(f => { if (typeof r[f] !== 'function') throw new Error(f + ' not exported'); }); console.log('Both exported')" && grep -q "changeset-parse" get-shit-done/bin/gsd-tools.cjs && grep -q "changeset-write" get-shit-done/bin/gsd-tools.cjs && echo "Routes wired"</automated>
  </verify>
  <done>cmdChangesetParse exported and correctly parses CHANGESET.md entry sections into JSON. Refuses partial changesets. Both changeset-write and changeset-parse routes wired in gsd-tools.cjs and appearing in CLI header comment.</done>
</task>

</tasks>

<verification>
1. `node -e "..."` confirms cmdChangesetWrite and cmdChangesetParse are exported from refinement.cjs
2. grep confirms both changeset-write and changeset-parse cases exist in gsd-tools.cjs switch
3. cmdChangesetWrite produces CHANGESET.md with correct frontmatter schema (date, status, counts)
4. cmdChangesetWrite produces correct markdown body (Summary table + entry sections)
5. cmdChangesetParse reads the written CHANGESET.md and returns matching JSON
6. cmdChangesetParse rejects partial changesets with actionable error
7. All 6 entry types are representable and parseable round-trip
</verification>

<success_criteria>
- CHANGESET.md schema is authoritative and defined in code (not implicit)
- changeset-write produces valid CHANGESET.md from JSON input
- changeset-parse reads CHANGESET.md and returns JSON consumable by change-application
- Partial changesets are refused by changeset-parse (safety gate)
- Both routes wired in gsd-tools.cjs
- Entry sorting: by type group, then original order within group
- Round-trip: write -> parse produces equivalent data
</success_criteria>

<output>
After completion, create `.planning/capabilities/requirements-refinement/features/refinement-qa/01-SUMMARY.md`
</output>
