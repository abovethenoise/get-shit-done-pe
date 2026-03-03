---
phase: install-and-deploy/package-identity
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - bin/install.js
  - README.md
autonomous: true
requirements:
  - EU-01
  - EU-02
  - FN-01
  - FN-02
  - TC-01

must_haves:
  truths:
    - "Running `npx get-shit-done-pe@latest --global` installs the fork (not get-shit-done-cc)"
    - "The install banner says 'by abovethenoise', not 'by TÂCHES'"
    - "README credits TÂCHES as upstream and asserts the product-management pivot"
    - "`npm publish` will not crash (prepublishOnly no longer references deleted build:hooks)"
    - "Published package ships hooks/ source directory (not missing hooks/dist)"
  artifacts:
    - path: "package.json"
      provides: "Fork identity (name, bin, author, description, repo, keywords) and valid publish configuration"
    - path: "bin/install.js"
      provides: "Updated banner reflecting abovethenoise fork identity"
    - path: "README.md"
      provides: "Attribution section crediting TÂCHES upstream and asserting product-management pivot"
  key_links:
    - from: "package.json bin key"
      to: "bin/install.js"
      via: "npm binary registration"
      pattern: "\"get-shit-done-pe\": \"bin/install.js\""
    - from: "package.json files array"
      to: "hooks/ directory"
      via: "npm pack inclusion"
      pattern: "\"hooks\"  (not \"hooks/dist\")"
    - from: "bin/install.js banner"
      to: "install output"
      via: "console.log(banner) at line 64"
      pattern: "by abovethenoise"
---

<objective>
Rename the package from get-shit-done-cc identity to get-shit-done-pe, fix the broken publish pipeline, and update install-visible text to reflect fork authorship.

Purpose: Prerequisite for npm publish and for all downstream features (cc-replacement, auto-latest) that depend on correct package identity.
Output: Updated package.json, updated install.js banner, new README attribution section.
</objective>

<execution_context>
@/Users/philliphall/.claude/get-shit-done/workflows/execute-plan.md
@/Users/philliphall/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/capabilities/install-and-deploy/CAPABILITY.md
@.planning/capabilities/install-and-deploy/features/package-identity/FEATURE.md

<interfaces>
<!-- Current package.json (read before editing):
  name: "get-shit-done-cc"
  bin: { "get-shit-done-cc": "bin/install.js" }
  files: [..., "hooks/dist", ...]          <-- must become "hooks"
  scripts.prepublishOnly: "npm run build:hooks"  <-- build:hooks script does not exist; must remove or replace
  author: "TÂCHES"
  repository.url: "git+https://github.com/glittercowboy/get-shit-done.git"

Current bin/install.js banner (lines 24-34):
  const banner = '\n' +
    cyan + '   ██████╗ ... (GSD ASCII art) ...' + reset + '\n' +
    '\n' +
    '  Get Shit Done ' + dim + 'v' + pkg.version + reset + '\n' +
    '  A meta-prompting, context engineering and spec-driven\n' +
    '  development system for Claude Code by TÂCHES.\n';
-->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Update package.json identity fields and fix broken publish pipeline</name>
  <reqs>FN-01, TC-01</reqs>
  <files>package.json</files>
  <action>
  Edit package.json with the following specific changes. Read the file first, then apply exactly:

  1. `name`: change from `"get-shit-done-cc"` to `"get-shit-done-pe"`

  2. `bin`: change from `{ "get-shit-done-cc": "bin/install.js" }` to `{ "get-shit-done-pe": "bin/install.js" }`

  3. `author`: change from `"TÂCHES"` to `"abovethenoise"`

  4. `description`: change to `"A meta-prompting system optimized for product management insight and detailed capabilities — enhanced AI automation and agentic development. Focus on getting it right, not just advancing the project forward. Built on GSD by TÂCHES."`

  5. `repository.url`: change to `"git+https://github.com/abovethenoise/get-shit-done-pe.git"`

  6. `homepage`: change to `"https://github.com/abovethenoise/get-shit-done-pe"`

  7. `bugs.url`: change to `"https://github.com/abovethenoise/get-shit-done-pe/issues"`

  8. `files` array: change `"hooks/dist"` to `"hooks"` — the hooks/dist directory does not exist; install.js reads from hooks/ source directly; hooks are plain CommonJS with no build step needed.

  9. `scripts.prepublishOnly`: remove this entry entirely — it references `build:hooks` which calls `scripts/build-hooks.js`, a file that does not exist. Removing it unblocks `npm publish`. The `build:hooks` script entry can also be removed since it has no working implementation.

  10. `keywords`: replace with `["claude", "claude-code", "ai", "meta-prompting", "context-engineering", "product-management", "spec-driven-development"]`

  Result must be valid JSON. Run `node -e "require('./package.json')"` to verify.
  </action>
  <verify>
    <automated>node -e "const p = require('./package.json'); console.log(p.name, p.bin, p.author); if (p.name !== 'get-shit-done-pe') throw new Error('name wrong'); if (!p.bin['get-shit-done-pe']) throw new Error('bin key wrong'); if (p.files.includes('hooks/dist')) throw new Error('hooks/dist still present'); if (p.scripts && p.scripts.prepublishOnly) throw new Error('prepublishOnly still present'); console.log('PASS')"</automated>
  </verify>
  <done>node verification command prints PASS with no errors. package.json is valid JSON with all 10 field changes applied.</done>
</task>

<task type="auto">
  <name>Update install.js banner and add README attribution section</name>
  <reqs>EU-01, EU-02, FN-02</reqs>
  <files>bin/install.js, README.md</files>
  <action>
  **bin/install.js banner update:**

  Read bin/install.js. Find the `banner` constant (lines ~24-34). Replace only the subtitle lines — the ASCII art block (5 lines of box-drawing chars) may remain unchanged. Change the two description lines:

  From:
  ```
  '  Get Shit Done ' + dim + 'v' + pkg.version + reset + '\n' +
  '  A meta-prompting, context engineering and spec-driven\n' +
  '  development system for Claude Code by TÂCHES.\n';
  ```

  To:
  ```
  '  get-shit-done-pe ' + dim + 'v' + pkg.version + reset + '\n' +
  '  Product management insight for Claude Code.\n' +
  '  by abovethenoise — built on GSD by TÂCHES.\n';
  ```

  Constraint: each display line must fit within 80 characters including leading spaces. Verify line lengths mentally. The three lines above are 20, 46, and 44 chars respectively — all within limit.

  Also update the help text string in the `hasHelp` block (line ~68). Find all occurrences of `get-shit-done-cc` in the file and replace with `get-shit-done-pe`. Find `by TÂCHES` and replace with `by abovethenoise`.

  **README.md attribution section:**

  Check if README.md exists. If it does not exist, create it. If it exists, read it first.

  Add (or write) the following attribution section. If README.md already has content, append this section. If it is empty or does not exist, write it as the full file content:

  ```markdown
  # get-shit-done-pe

  A meta-prompting system optimized for product management insight — enhanced AI automation and agentic development. Focus on getting it right, not just advancing the project forward.

  ## Attribution

  Built on [GSD by TÂCHES](https://github.com/glittercowboy/get-shit-done) — thank you for the foundational work.

  GSD (the upstream project) is a spec-driven development system for Claude Code with strong project management foundations. This fork reimagines GSD with a product management lens: the capability/feature model replaces phases, requirements carry EU/FN/TC traceability, and the planning pipeline is optimized for insight and correctness over forward momentum.

  **Upstream (GSD by TÂCHES):** Project management — structured phases, step-by-step delivery.
  **This fork (get-shit-done-pe):** Product management — capability/feature model, requirement traceability, getting it right.

  **Author:** abovethenoise
  **License:** MIT (matching upstream)
  ```
  </action>
  <verify>
    <automated>node -c bin/install.js && node -e "const fs = require('fs'); const content = fs.readFileSync('bin/install.js', 'utf8'); if (content.includes('by TÂCHES') && !content.includes('by abovethenoise')) throw new Error('banner not updated'); if (content.includes('get-shit-done-cc')) throw new Error('old package name still in file'); console.log('PASS')" && node -e "const fs = require('fs'); if (!fs.existsSync('README.md')) throw new Error('README.md missing'); const r = fs.readFileSync('README.md', 'utf8'); if (!r.includes('abovethenoise')) throw new Error('no abovethenoise in README'); if (!r.includes('TÂCHES')) throw new Error('no TÂCHES attribution in README'); console.log('README PASS')"</automated>
  </verify>
  <done>bin/install.js passes node -c syntax check; banner contains "by abovethenoise" and no "get-shit-done-cc" references remain. README.md exists with both "abovethenoise" and "TÂCHES" attribution text present.</done>
</task>

</tasks>

<verification>
After both tasks complete, run the following end-to-end checks:

1. Valid JSON: `node -e "require('./package.json'); console.log('JSON valid')"`
2. Identity fields: `node -e "const p = require('./package.json'); console.log(p.name, Object.keys(p.bin)[0], p.author)"`
   Expected output: `get-shit-done-pe get-shit-done-pe abovethenoise`
3. Publish safety: `node -e "const p = require('./package.json'); if (p.scripts && p.scripts.prepublishOnly) throw new Error('FAIL: prepublishOnly still present')"`
4. Hooks file path: `node -e "const p = require('./package.json'); if (p.files.includes('hooks/dist')) throw new Error('FAIL: hooks/dist in files'); if (!p.files.includes('hooks')) throw new Error('FAIL: hooks not in files')"`
5. Banner: `node -e "const s = require('fs').readFileSync('bin/install.js','utf8'); if (!s.includes('abovethenoise')) throw new Error('FAIL')"`
6. README: `test -f README.md && grep -q 'abovethenoise' README.md && grep -q 'TÂCHES' README.md && echo 'README PASS'`
</verification>

<success_criteria>
- package.json name, bin key, author, description, repository, homepage, bugs, keywords all reflect get-shit-done-pe / abovethenoise identity
- hooks/dist replaced with hooks in files array
- prepublishOnly and build:hooks scripts removed (npm publish no longer crashes)
- bin/install.js banner displays "by abovethenoise" with version line remaining dynamic
- No remaining "get-shit-done-cc" or "by TÂCHES" references in the banner or help text of bin/install.js
- README.md exists with attribution section crediting TÂCHES upstream and asserting product-management pivot
- All 6 verification checks pass with no errors
</success_criteria>

<output>
After completion, create `.planning/capabilities/install-and-deploy/features/package-identity/01-SUMMARY.md` with:
- Tasks completed and files modified
- Verification results
- Any deviations from the plan
</output>
