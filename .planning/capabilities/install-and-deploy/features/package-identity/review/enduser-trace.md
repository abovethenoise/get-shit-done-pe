# End-User Trace: package-identity

**Reviewed:** 2026-03-03
**Scope:** EU-01, EU-02

---

## Phase 1: Internalize Requirements

### EU-01: Package installs under new identity
- `npx get-shit-done-pe --global` installs and deploys to ~/.claude
- `npm install -g get-shit-done-pe` works identically
- The `get-shit-done-pe` binary is available after global install
- Install banner shows fork identity (abovethenoise), not upstream (TÂCHES)

### EU-02: Attribution credits original and fork author
- README credits TÂCHES/GSD as the upstream inspiration with appreciation
- README asserts the product-management pivot and abovethenoise's vision
- package.json author field shows abovethenoise
- License file present (MIT)

---

## Phase 2: Trace Against Code

### EU-01: Package installs under new identity

**Verdict:** PARTIAL

**Evidence:**

1. **`npx get-shit-done-pe --global` installs and deploys** -- MET
   - `/Users/philliphall/get-shit-done-pe/package.json:2` -- `"name": "get-shit-done-pe",`
   - `/Users/philliphall/get-shit-done-pe/package.json:6` -- `"get-shit-done-pe": "bin/install.js"`
   - The bin field maps the correct command name to the install script. When published and installed via npx/npm, this will register the `get-shit-done-pe` binary.

2. **`npm install -g get-shit-done-pe` works identically** -- MET (structurally)
   - Same bin entry governs both npx and npm global install paths. Actual npm publish is out of scope per FEATURE.md.

3. **`get-shit-done-pe` binary is available after global install** -- MET (structurally)
   - `/Users/philliphall/get-shit-done-pe/package.json:5-7` -- `"bin": { "get-shit-done-pe": "bin/install.js" }`
   - Correct bin mapping ensures the binary name matches the package name.

4. **Install banner shows fork identity (abovethenoise), not upstream (TÂCHES)** -- PARTIAL
   - `/Users/philliphall/get-shit-done-pe/bin/install.js:38` -- `'  get-shit-done-pe ' + dim + 'v' + pkg.version + reset + '\n' +`
   - `/Users/philliphall/get-shit-done-pe/bin/install.js:39` -- `'  Product management insight for Claude Code.\n' +`
   - `/Users/philliphall/get-shit-done-pe/bin/install.js:40` -- `'  by abovethenoise — built on GSD by TÂCHES.\n';`
   - The banner does show "by abovethenoise" as the primary identity. However, "TÂCHES" still appears in the subtitle line. The acceptance criterion says "shows fork identity (abovethenoise), not upstream (TÂCHES)." The literal reading is that TÂCHES should not appear in the banner. The execution summary notes this was a deliberate decision ("Banner retains 'by TÂCHES' in trailing attribution per plan spec"), but this deviates from the acceptance criterion as written in FEATURE.md. The feature spec's Decisions section (line 125) does say "needs updating from 'by TÂCHES' to reflect fork identity" -- which was done -- but the AC wording "not upstream (TÂCHES)" is stricter than what was delivered. Flagging as a spec deviation; may be intentional but the AC text is unambiguous.

### EU-02: Attribution credits original and fork author

**Verdict:** PARTIAL

**Evidence:**

1. **README credits TÂCHES/GSD as the upstream inspiration with appreciation** -- PARTIAL
   - `/Users/philliphall/get-shit-done-pe/README.md:715` -- `Built on [GSD by TÂCHES](https://github.com/glittercowboy/get-shit-done) — thank you for the foundational work.`
   - The attribution section (lines 709-722) does credit TÂCHES with appreciation. However, the upstream README content (lines 1-706) was preserved verbatim, including all `get-shit-done-cc` references throughout (badges, install commands, troubleshooting). There are 22 occurrences of `get-shit-done-cc` in the README body. This creates user confusion: the README instructs users to run `npx get-shit-done-cc@latest` (line 21, 79, 99) which would install the upstream package, not the fork. The attribution section itself is correct, but the surrounding content actively contradicts the fork identity.

2. **README asserts the product-management pivot and abovethenoise's vision** -- MET
   - `/Users/philliphall/get-shit-done-pe/README.md:711` -- `A meta-prompting system optimized for product management insight...`
   - `/Users/philliphall/get-shit-done-pe/README.md:719-720` -- Clearly differentiates upstream (project management) from fork (product management, capability/feature model, requirement traceability).

3. **package.json author field shows abovethenoise** -- MET
   - `/Users/philliphall/get-shit-done-pe/package.json:25` -- `"author": "abovethenoise",`

4. **License file present (MIT)** -- MET
   - LICENSE file exists at repository root.

**Cross-layer observations:**
- The README body (lines 1-706) is the original upstream content with zero modifications. It contains 22 references to `get-shit-done-cc`, links to `glittercowboy/get-shit-done` GitHub repo, upstream npm badges, and upstream Discord/Twitter links. While the FEATURE.md notes "Full README content beyond attribution section" is out of scope, the current state means a user reading the README would see instructions to install the wrong package. This does not violate EU-02 directly (the attribution section is present and correct), but it creates a confusing user experience that undermines EU-01's identity goal.

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01 | PARTIAL | package.json and bin correctly set to `get-shit-done-pe`. Banner shows abovethenoise but also contains TÂCHES, which the AC says should not appear. |
| EU-02 | PARTIAL | Attribution section (README:709-722) credits TÂCHES with appreciation and asserts PM pivot. package.json author correct. LICENSE present. However, upstream README body retains 22 `get-shit-done-cc` references including install commands pointing users to the wrong package. |
