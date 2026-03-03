# Review Synthesis: package-identity

**Date:** 2026-03-03
**Reviewers:** end-user, functional, technical, quality

---

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | package.json:2,25; bin/install.js:38-40; README.md:21,715 all verified |
| functional | 4 | 4 | 0 | package.json:2,25,29; bin/install.js:40 all verified |
| technical | 3 | 3 | 0 | package.json:5-7; bin/install.js:30-40; line width claims verified |
| quality | 5 | 5 | 0 | README.md:9,21; package-lock.json:2,8; docs/context-monitor.md:63; assets/terminal.svg:41 all verified |

All reviewers have reliable citations. No demotions needed.

---

## Findings

### Finding 1: README.md ships 20+ stale `get-shit-done-cc` references including install commands

**Severity:** major
**Source:** end-user (EU-02), quality (Finding 1)
**Requirement:** EU-02 (attribution), quality (completeness)
**Verdict:** not met (proven)

**Evidence (from reviewers):**
- `/Users/philliphall/get-shit-done-pe/README.md:21` -- `npx get-shit-done-cc@latest` (install command pointing to upstream)
- `/Users/philliphall/get-shit-done-pe/README.md:9-10` -- npm badges linking to `get-shit-done-cc`
- `/Users/philliphall/get-shit-done-pe/README.md:79` -- another `npx get-shit-done-cc@latest`
- `/Users/philliphall/get-shit-done-pe/README.md:99-121` -- multiple install examples with old name
- `/Users/philliphall/get-shit-done-pe/README.md:635-663` -- troubleshooting/uninstall sections reference old name
- End-user: "22 occurrences of `get-shit-done-cc` in the README body... creates user confusion"
- Quality: "Users installing `get-shit-done-pe` will see instructions telling them to run `npx get-shit-done-cc@latest`"

**Spot-check:** verified -- README.md:21 confirmed as `npx get-shit-done-cc@latest`; README.md:9 confirmed as npm badge for `get-shit-done-cc`

**Context:** FEATURE.md scoped "Full README content beyond attribution section" as out of scope, and the plan spec said "append if content exists." Both reviewers acknowledge this was intentional. However, the README ships with the npm package by default. The shipped artifact actively directs users to install a different package. This is a gap between what was scoped and what produces a coherent user experience.

**Recommendation:** Replace or strip upstream README body before npm publish. This can be a separate feature but must happen before the package ships.

---

### Finding 2: package-lock.json still references `get-shit-done-cc`

**Severity:** major
**Source:** quality (Finding 2)
**Requirement:** quality (completeness)
**Verdict:** not met (proven)

**Evidence (from reviewer):**
- `/Users/philliphall/get-shit-done-pe/package-lock.json:2` -- `"name": "get-shit-done-cc"`
- `/Users/philliphall/get-shit-done-pe/package-lock.json:8` -- `"name": "get-shit-done-cc"`
- `/Users/philliphall/get-shit-done-pe/package-lock.json:12` -- `"get-shit-done-cc": "bin/install.js"`

**Spot-check:** verified -- package-lock.json:2 confirmed as `"name": "get-shit-done-cc"`

**Recommendation:** Run `npm install` to regenerate the lockfile from the updated package.json. One command, immediate fix.

---

### Finding 3: Install banner contains TACHES name despite AC saying "not upstream"

**Severity:** minor
**Source:** end-user (EU-01)
**Requirement:** EU-01 (package installs under new identity)
**Verdict:** partial

**Evidence (from reviewer):**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:40` -- `'  by abovethenoise — built on GSD by TÂCHES.\n';`
- End-user: "The AC wording 'not upstream (TACHES)' is stricter than what was delivered"
- Functional reviewer gave this **met**, reasoning the trailing attribution is consistent with the Decisions section ("show love and appreciation for upstream")

**Spot-check:** verified -- bin/install.js:40 confirmed as `by abovethenoise — built on GSD by TÂCHES.`

**Assessment:** The banner's primary identity is clearly abovethenoise. TACHES appears only as trailing attribution credit, not as the product owner. The functional reviewer's reading -- that this satisfies the intent while honoring the Decisions section -- is reasonable. The end-user reviewer's reading of the literal AC text is also valid. This is a spec ambiguity, not a code defect. See Conflicts section.

---

### Finding 4: docs/context-monitor.md references `get-shit-done-cc`

**Severity:** minor
**Source:** quality (Finding 3)
**Requirement:** quality (completeness)
**Verdict:** not met (suspected)

**Evidence (from reviewer):**
- `/Users/philliphall/get-shit-done-pe/docs/context-monitor.md:63` -- `Both hooks are automatically registered during \`npx get-shit-done-cc\` installation:`

**Spot-check:** verified

**Context:** `docs/` is not in the `files` array, so this does not ship to npm users. Contributor-facing only.

**Recommendation:** Fix when doing a broader stale-reference sweep. Low urgency.

---

### Finding 5: assets/terminal.svg references `get-shit-done-cc`

**Severity:** minor
**Source:** quality (Finding 4)
**Requirement:** quality (completeness)
**Verdict:** not met (suspected)

**Evidence (from reviewer):**
- `/Users/philliphall/get-shit-done-pe/assets/terminal.svg:41` -- `<text class="text command" font-size="15" x="36" y="0">npx get-shit-done-cc</text>`

**Spot-check:** verified

**Context:** `assets/` is not in the `files` array. Visible on GitHub repo page only, not in npm package.

**Recommendation:** Fix when doing a broader stale-reference sweep. Low urgency.

---

### Finding 6: package.json field updates -- all 9 fields correct

**Severity:** n/a (positive)
**Source:** functional (FN-01), technical (TC-01)
**Requirement:** FN-01, TC-01
**Verdict:** met

**Evidence (from reviewers):**
- `/Users/philliphall/get-shit-done-pe/package.json:2` -- `"name": "get-shit-done-pe"`
- `/Users/philliphall/get-shit-done-pe/package.json:25` -- `"author": "abovethenoise"`
- `/Users/philliphall/get-shit-done-pe/package.json:5-7` -- bin key matches CLI command name
- All 9 fields (name, author, description, repository.url, homepage, bugs.url, bin, keywords, license) match spec

**Spot-check:** verified -- package.json:2, :25, :5-7 all confirmed

---

### Finding 7: Install banner update -- correct identity, dynamic version, updated description

**Severity:** n/a (positive)
**Source:** functional (FN-02), technical (TC-01)
**Requirement:** FN-02, TC-01
**Verdict:** met

**Evidence (from reviewers):**
- `/Users/philliphall/get-shit-done-pe/bin/install.js:38` -- `get-shit-done-pe` with dynamic version
- `/Users/philliphall/get-shit-done-pe/bin/install.js:39` -- `Product management insight for Claude Code.`
- All banner lines under 80 chars (longest: 45 chars)

---

### Finding 8: Code changes are clean -- no unnecessary complexity

**Severity:** n/a (positive)
**Source:** quality (Finding 5, Finding 6)
**Requirement:** quality (KISS, no unnecessary abstraction)
**Verdict:** met

**Evidence (from reviewer):**
- All changes are direct string substitutions. No new functions, patterns, or abstractions.
- Publish pipeline fix (removing broken `build:hooks` script, fixing `files` array) is justified scope.

---

## Conflicts

### Disagreements

- **Banner TACHES reference (EU-01):** End-user says **partial** (AC literally says "not upstream (TACHES)") vs functional says **met** (trailing attribution consistent with Decisions section "show love and appreciation for upstream").
  - Resolution: The Decisions section in FEATURE.md explicitly called for upstream attribution. The AC text is ambiguous -- "not upstream" could mean "not branded as upstream's product" rather than "the string TACHES must not appear." The banner clearly presents abovethenoise as the owner. Ruling: **met with notation** -- the AC wording should be tightened, but the implementation matches the feature's stated Decisions.
  - Tiebreaker applied: No -- resolved on judgment. End-user priority would have applied if the AC were unambiguous, but the Decisions section creates genuine ambiguity.

- **EU-02 verdict:** End-user says **partial** (README body contradicts attribution) vs functional says **met** (all specified fields correct, attribution section present).
  - Resolution: Both are correct at their own layer. The attribution section itself is complete and correct (functional's scope). The README as a whole creates a contradictory user experience (end-user's scope). Ruling: EU-02 is **met** at the requirement level (attribution section does what it says), but Finding 1 captures the shipped-content problem as a separate major finding.
  - Tiebreaker applied: No -- not a true conflict, different scopes.

### Tensions

- **Scope boundary on README cleanup:** Quality recommends treating stale README references as a completeness failure of this feature. The FEATURE.md explicitly scoped "Full README content beyond attribution section" as out of scope. Both positions are valid -- the feature delivered what it scoped, but the scope was too narrow for a coherent shipped artifact.
  - Assessment: The README cleanup should be tracked as a separate feature or pre-publish checklist item. It is not a regression of this feature (it was pre-existing upstream content), but it blocks a usable npm publish.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 2     |
| Minor    | 3     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01 | met (with notation) | minor | end-user, functional |
| EU-02 | met | n/a | end-user, functional |
| FN-01 | met | n/a | functional |
| FN-02 | met | n/a | functional |
| TC-01 | met | n/a | technical |
| quality: README stale refs | not met | major | end-user, quality |
| quality: lockfile stale | not met | major | quality |
| quality: docs stale ref | not met (suspected) | minor | quality |
| quality: SVG stale ref | not met (suspected) | minor | quality |
| quality: KISS | met | n/a | quality |

**Bottom line:** The core identity swap (package.json + banner) is clean and correct. Two major gaps remain before npm publish: (1) README body ships 20+ stale upstream references including install commands for the wrong package, and (2) package-lock.json was not regenerated. Neither is a blocker for the feature as scoped, but both block a coherent published package.
