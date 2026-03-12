/**
 * Core — Shared utilities, constants, and internal helpers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Path helpers ────────────────────────────────────────────────────────────

/** Normalize a relative path to always use forward slashes (cross-platform). */
function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

// ─── Model Resolution ────────────────────────────────────────────────────────

// ─── Output helpers ───────────────────────────────────────────────────────────

function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    // Large payloads exceed Claude Code's Bash tool buffer (~50KB).
    // Write to tmpfile and output the path prefixed with @file: so callers can detect it.
    if (json.length > 50000) {
      const tmpPath = path.join(require('os').tmpdir(), `gsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}

function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

// ─── File & Config utilities ──────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function loadConfig(cwd) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const defaults = {
    model_profile: 'balanced',
    commit_docs: true,
    search_gitignored: false,
    branching_strategy: 'none',
    research: true,
    plan_checker: true,
    verifier: true,
    parallelization: true,
    brave_search: false,
  };

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);

    const get = (key, nested) => {
      if (parsed[key] !== undefined) return parsed[key];
      if (nested && parsed[nested.section] && parsed[nested.section][nested.field] !== undefined) {
        return parsed[nested.section][nested.field];
      }
      return undefined;
    };

    const parallelization = (() => {
      const val = get('parallelization');
      if (typeof val === 'boolean') return val;
      if (typeof val === 'object' && val !== null && 'enabled' in val) return val.enabled;
      return defaults.parallelization;
    })();

    return {
      model_profile: get('model_profile') ?? defaults.model_profile,
      commit_docs: get('commit_docs', { section: 'planning', field: 'commit_docs' }) ?? defaults.commit_docs,
      search_gitignored: get('search_gitignored', { section: 'planning', field: 'search_gitignored' }) ?? defaults.search_gitignored,
      branching_strategy: get('branching_strategy', { section: 'git', field: 'branching_strategy' }) ?? defaults.branching_strategy,
      research: get('research', { section: 'workflow', field: 'research' }) ?? defaults.research,
      plan_checker: get('plan_checker', { section: 'workflow', field: 'plan_check' }) ?? defaults.plan_checker,
      verifier: get('verifier', { section: 'workflow', field: 'verifier' }) ?? defaults.verifier,
      parallelization,
      brave_search: get('brave_search') ?? defaults.brave_search,
      model_overrides: parsed.model_overrides || null,
    };
  } catch {
    return defaults;
  }
}

// ─── Git utilities ────────────────────────────────────────────────────────────

function isGitIgnored(cwd, targetPath) {
  try {
    execSync('git check-ignore -q -- ' + targetPath.replace(/[^a-zA-Z0-9._\-/]/g, ''), {
      cwd,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function execGit(cwd, args) {
  try {
    const escaped = args.map(a => {
      if (/^[a-zA-Z0-9._\-/=:@]+$/.test(a)) return a;
      return "'" + a.replace(/'/g, "'\\''") + "'";
    });
    const stdout = execSync('git ' + escaped.join(' '), {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: (err.stdout ?? '').toString().trim(),
      stderr: (err.stderr ?? '').toString().trim(),
    };
  }
}

// ─── Model utilities ─────────────────────────────────────────────────────────

function resolveModelInternal(cwd, agentType) {
  const config = loadConfig(cwd);

  // Check per-agent override first
  const override = config.model_overrides?.[agentType];
  if (override) {
    return override;
  }

  // Default: sonnet for all agents (config overrides checked above)
  return 'sonnet';
}

function resolveModelFromFrontmatter(cwd, agentPath) {
  // Read agent file and parse frontmatter to get model field
  // Inline require to avoid circular dependency: frontmatter.cjs requires core.cjs
  const { extractFrontmatter } = require('./frontmatter.cjs');
  const content = safeReadFile(agentPath);
  if (!content) {
    // Agent file not found — fall through to config-based resolution
    const agentName = path.basename(agentPath, '.md');
    return resolveModelInternal(cwd, agentName);
  }

  const fm = extractFrontmatter(content);
  // model field is the single source of truth (Claude Code reads it natively)
  return fm.model || 'sonnet';
}

// ─── Misc utilities ───────────────────────────────────────────────────────────

function pathExistsInternal(cwd, targetPath) {
  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
  try {
    fs.statSync(fullPath);
    return true;
  } catch {
    return false;
  }
}

function generateSlugInternal(text) {
  if (!text) return null;
  // Reject input containing path separators before slugification
  if (text.includes('/') || text.includes('\\')) return '';
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  // Return empty string (not null) when sanitization produces nothing
  return slug;
}


// ─── Slug Resolution (3-tier: exact -> fuzzy -> fall-through) ────────────────

function resolveSlugInternal(cwd, input, typeHint) {
  if (!input || !input.trim()) {
    return { resolved: false, tier: 0, type: null, slug: null, full_path: null, candidates: [], reason: 'empty_input' };
  }

  const trimmed = input.trim().toLowerCase();

  // ── Tier 1: Exact match ──
  // Single slug — try capability first (unless type hint says feature)
  if (typeHint !== 'feature') {
    const capResult = findCapabilityInternal(cwd, trimmed);
    if (capResult.found) {
      return { resolved: true, tier: 1, type: 'capability', slug: capResult.slug, full_path: capResult.slug, candidates: [], reason: 'exact' };
    }
  }
  // Try as feature (if not capability-only)
  if (typeHint !== 'capability') {
    const featResult = findFeatureInternal(cwd, trimmed);
    if (featResult.found) {
      return { resolved: true, tier: 1, type: 'feature', slug: featResult.slug, full_path: featResult.slug, candidates: [], reason: 'exact' };
    }
  }

  // Try as focus-group (after cap/feature to preserve priority)
  const focusResult = findFocusGroupInternal(cwd, trimmed);
  if (focusResult.found) {
    return { resolved: true, tier: 1, type: 'focus-group', slug: focusResult.slug, full_path: focusResult.slug, candidates: [], reason: 'exact' };
  }

  // ── Tier 2: BM25 fuzzy match ──
  const tokenize = s => s.split('-').filter(Boolean);
  const tokenMatch = (qt, dt) => dt.startsWith(qt) || qt.startsWith(dt);
  const queryTokens = tokenize(trimmed);

  const corpus = [];

  if (typeHint !== 'feature') {
    const capabilitiesDir = path.join(cwd, '.planning', 'capabilities');
    try {
      const capEntries = fs.readdirSync(capabilitiesDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && fs.existsSync(path.join(capabilitiesDir, e.name, 'CAPABILITY.md')))
        .map(e => e.name);
      for (const slug of capEntries) {
        corpus.push({ type: 'capability', slug, full_path: slug, tokens: tokenize(slug) });
      }
    } catch { /* no capabilities dir */ }
  }

  if (typeHint !== 'capability') {
    const allFeatures = listAllFeaturesInternal(cwd);
    for (const f of allFeatures) {
      corpus.push({ type: 'feature', slug: f.feature_slug, full_path: f.feature_slug, tokens: tokenize(f.feature_slug) });
    }
  }

  // Focus groups
  const focusDir = path.join(cwd, '.planning', 'focus');
  try {
    const focusEntries = fs.readdirSync(focusDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && fs.existsSync(path.join(focusDir, e.name, 'FOCUS.md')))
      .map(e => e.name);
    for (const slug of focusEntries) {
      corpus.push({ type: 'focus-group', slug, full_path: slug, tokens: tokenize(slug) });
    }
  } catch { /* no focus dir */ }

  // BM25 scoring
  const N = corpus.length;
  const avgdl = N > 0 ? corpus.reduce((sum, d) => sum + d.tokens.length, 0) / N : 1;
  const k1 = 1.2, b = 0.75;

  const idf = {};
  for (const qt of queryTokens) {
    const n = corpus.filter(d => d.tokens.some(dt => tokenMatch(qt, dt))).length;
    idf[qt] = Math.log((N - n + 0.5) / (n + 0.5) + 1);
  }

  const scored = [];
  for (const doc of corpus) {
    let score = 0;
    let matchedTokens = 0;
    const dl = doc.tokens.length;
    for (const qt of queryTokens) {
      const tf = doc.tokens.filter(dt => tokenMatch(qt, dt)).length;
      if (tf > 0) matchedTokens++;
      score += idf[qt] * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgdl));
    }
    if (matchedTokens >= Math.ceil(queryTokens.length / 2) && score > 0) {
      scored.push({ ...doc, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);

  const candidates = scored.map(({ tokens, score, ...rest }) => rest);

  if (candidates.length === 1) {
    const c = candidates[0];
    return { resolved: true, tier: 2, type: c.type, slug: c.slug, full_path: c.full_path, candidates: [], reason: 'fuzzy_unique' };
  }

  if (candidates.length > 1) {
    return { resolved: false, tier: 2, type: null, slug: null, full_path: null, candidates, reason: 'ambiguous' };
  }

  // ── Tier 3: Fall-through (no match) ──
  return { resolved: false, tier: 3, type: null, slug: null, full_path: null, candidates: [], reason: 'no_match' };
}

/** List all features. Returns [{feature_slug, composes}] */
function listAllFeaturesInternal(cwd) {
  // Inline require to avoid circular dependency: frontmatter.cjs requires core.cjs
  const { extractFrontmatter } = require('./frontmatter.cjs');
  const results = [];
  const featuresDir = path.join(cwd, '.planning', 'features');
  try {
    const entries = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();
    for (const slug of entries) {
      const featurePath = path.join(featuresDir, slug, 'FEATURE.md');
      if (fs.existsSync(featurePath)) {
        const content = safeReadFile(featurePath);
        const fm = content ? extractFrontmatter(content) : {};
        const composes = Array.isArray(fm.composes) ? fm.composes : [];
        results.push({ feature_slug: slug, composes });
      }
    }
  } catch { /* no features dir */ }
  return results;
}

// ─── Capability & Feature utilities ──────────────────────────────────────────

function findCapabilityInternal(cwd, capabilityInput) {
  const slug = generateSlugInternal(capabilityInput);
  if (!slug) return { found: false, reason: 'empty_slug' };

  const directory = path.join(cwd, '.planning', 'capabilities', slug);

  try {
    const stat = fs.statSync(directory);
    if (!stat.isDirectory()) return { found: false, slug, reason: 'not_a_directory' };
  } catch {
    return { found: false, slug, reason: 'directory_not_found' };
  }

  const capabilityPath = path.join(directory, 'CAPABILITY.md');
  if (!fs.existsSync(capabilityPath)) {
    return { found: false, slug, reason: 'no_capability_file' };
  }

  return { found: true, directory, slug, capability_path: capabilityPath };
}

function findFeatureInternal(cwd, featureInput) {
  const featureSlug = generateSlugInternal(featureInput);
  if (!featureSlug) return { found: false, reason: 'empty_slug' };

  const directory = path.join(cwd, '.planning', 'features', featureSlug);

  try {
    const stat = fs.statSync(directory);
    if (!stat.isDirectory()) return { found: false, slug: featureSlug, reason: 'not_a_directory' };
  } catch {
    return { found: false, slug: featureSlug, reason: 'directory_not_found' };
  }

  const featurePath = path.join(directory, 'FEATURE.md');
  if (!fs.existsSync(featurePath)) {
    return { found: false, slug: featureSlug, reason: 'no_feature_file' };
  }

  return { found: true, directory, slug: featureSlug, feature_path: featurePath };
}

function findFocusGroupInternal(cwd, focusInput) {
  const slug = generateSlugInternal(focusInput);
  if (!slug) return { found: false, reason: 'empty_slug' };

  const focusPath = path.join(cwd, '.planning', 'focus', slug, 'FOCUS.md');
  if (!fs.existsSync(focusPath)) {
    return { found: false, slug, reason: 'not_found' };
  }

  return { found: true, slug, focus_path: focusPath };
}

module.exports = {
  output,
  error,
  safeReadFile,
  loadConfig,
  isGitIgnored,
  execGit,
  resolveModelInternal,
  resolveModelFromFrontmatter,
  pathExistsInternal,
  generateSlugInternal,
  toPosixPath,
  findCapabilityInternal,
  findFeatureInternal,
  findFocusGroupInternal,
  resolveSlugInternal,
  listAllFeaturesInternal,
};
