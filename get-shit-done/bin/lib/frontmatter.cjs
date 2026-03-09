/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 *
 * Backed by js-yaml@4.1.1 for reliable YAML parsing and serialization.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { safeReadFile, output, error } = require('./core.cjs');

// ─── Parsing engine (js-yaml backed) ─────────────────────────────────────────

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return {};

  const yamlStr = match[1];
  try {
    // FAILSAFE_SCHEMA: all scalars stay as strings (preserves leading zeros like '01',
    // keeps yes/no/true/false as strings). This matches v1 hand-rolled parser behavior
    // where all values were strings, while gaining correct nested structure parsing.
    const result = yaml.load(yamlStr, { schema: yaml.FAILSAFE_SCHEMA });
    // yaml.load returns undefined/null for empty YAML; normalize to {}
    if (result == null || typeof result !== 'object') return {};
    return result;
  } catch (err) {
    process.stderr.write(`Warning: YAML parse error: ${err.message}\n`);
    return {};
  }
}

/**
 * Recursively convert all leaf values to strings before dumping.
 * This ensures yaml.dump won't add defensive quotes for numeric-looking strings
 * (like '01' or '1.0') since they'll be actual strings, and we parse with
 * FAILSAFE_SCHEMA which keeps everything as strings anyway.
 */
function stringifyForDump(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stringifyForDump);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = stringifyForDump(v);
    }
    return out;
  }
  return String(value);
}

function reconstructFrontmatter(obj) {
  // Filter out null/undefined entries before serializing
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  if (Object.keys(cleaned).length === 0) return '';

  // Convert all leaves to strings, then dump with FAILSAFE_SCHEMA
  // (which only knows str/seq/map and won't add defensive quotes for
  // numeric-looking strings like '01' or '1.0')
  const stringified = stringifyForDump(cleaned);
  const result = yaml.dump(stringified, {
    schema: yaml.FAILSAFE_SCHEMA,
    lineWidth: -1,
    quotingType: "'",
    forceQuotes: false,
    sortKeys: false,
    noRefs: true,
  });
  // yaml.dump adds a trailing newline; trim it for compatibility
  return result.replace(/\n$/, '');
}

function spliceFrontmatter(content, newObj) {
  const yamlStr = reconstructFrontmatter(newObj);
  const match = content.match(/^---\n[\s\S]+?\n---/);
  if (match) {
    return `---\n${yamlStr}\n---` + content.slice(match[0].length);
  }
  return `---\n${yamlStr}\n---\n\n` + content;
}

function parseMustHavesBlock(content, blockName) {
  // Extract a specific block from must_haves in raw frontmatter YAML
  // Handles 3-level nesting: must_haves > artifacts/key_links > [{path, provides, ...}]
  const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (!fmMatch) return [];

  const yaml = fmMatch[1];
  // Find the block (e.g., "truths:", "artifacts:", "key_links:")
  const blockPattern = new RegExp(`^\\s{4}${blockName}:\\s*$`, 'm');
  const blockStart = yaml.search(blockPattern);
  if (blockStart === -1) return [];

  const afterBlock = yaml.slice(blockStart);
  const blockLines = afterBlock.split('\n').slice(1); // skip the header line

  const items = [];
  let current = null;

  for (const line of blockLines) {
    // Stop at same or lower indent level (non-continuation)
    if (line.trim() === '') continue;
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent <= 4 && line.trim() !== '') break; // back to must_haves level or higher

    if (line.match(/^\s{6}-\s+/)) {
      // New list item at 6-space indent
      if (current) items.push(current);
      current = {};
      // Check if it's a simple string item
      const simpleMatch = line.match(/^\s{6}-\s+"?([^"]+)"?\s*$/);
      if (simpleMatch && !line.includes(':')) {
        current = simpleMatch[1];
      } else {
        // Key-value on same line as dash: "- path: value"
        const kvMatch = line.match(/^\s{6}-\s+(\w+):\s*"?([^"]*)"?\s*$/);
        if (kvMatch) {
          current = {};
          current[kvMatch[1]] = kvMatch[2];
        }
      }
    } else if (current && typeof current === 'object') {
      // Continuation key-value at 8+ space indent
      const kvMatch = line.match(/^\s{8,}(\w+):\s*"?([^"]*)"?\s*$/);
      if (kvMatch) {
        const val = kvMatch[2];
        // Try to parse as number
        current[kvMatch[1]] = /^\d+$/.test(val) ? parseInt(val, 10) : val;
      }
      // Array items under a key
      const arrMatch = line.match(/^\s{10,}-\s+"?([^"]+)"?\s*$/);
      if (arrMatch) {
        // Find the last key added and convert to array
        const keys = Object.keys(current);
        const lastKey = keys[keys.length - 1];
        if (lastKey && !Array.isArray(current[lastKey])) {
          current[lastKey] = current[lastKey] ? [current[lastKey]] : [];
        }
        if (lastKey) current[lastKey].push(arrMatch[1]);
      }
    }
  }
  if (current) items.push(current);

  return items;
}

// ─── Frontmatter CRUD commands ────────────────────────────────────────────────

const FRONTMATTER_SCHEMAS = {
  plan: { required: ['plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'] },
  summary: { required: ['plan', 'subsystem', 'tags', 'duration', 'completed'] },
  verification: { required: ['verified', 'status', 'score'] },
  review: { required: ['type', 'feature', 'capability', 'reviewer', 'status'] },
};

function cmdFrontmatterGet(cwd, filePath, field, raw) {
  if (!filePath) { error('file path required'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }
  const fm = extractFrontmatter(content);
  if (field) {
    const value = fm[field];
    if (value === undefined) { output({ error: 'Field not found', field }, raw); return; }
    output({ [field]: value }, raw, JSON.stringify(value));
  } else {
    output(fm, raw);
  }
}

module.exports = {
  extractFrontmatter,
  reconstructFrontmatter,
  spliceFrontmatter,
  parseMustHavesBlock,
  FRONTMATTER_SCHEMAS,
  cmdFrontmatterGet,
};
