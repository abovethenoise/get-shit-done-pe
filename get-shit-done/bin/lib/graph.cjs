/**
 * Graph — Dependency graph from composes[] edges
 *
 * Builds a DAG of capabilities and features from composes[] frontmatter.
 * Provides sequence, coupling, waves, downstream, upstream, upstream-gaps, and staleness queries.
 */

const fs = require('fs');
const path = require('path');
const { listAllFeaturesInternal, findCapabilityInternal, safeReadFile, output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');

// ─── Graph Build ──────────────────────────────────────────────────────────────

/**
 * Build the full project graph from capabilities and features.
 * Returns { nodes: [], edges: [] }
 */
function buildGraph(cwd) {
  const nodes = [];
  const edges = [];

  // Load capabilities
  const capsDir = path.join(cwd, '.planning', 'capabilities');
  try {
    const capEntries = fs.readdirSync(capsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();
    for (const slug of capEntries) {
      const capPath = path.join(capsDir, slug, 'CAPABILITY.md');
      const content = safeReadFile(capPath);
      if (!content) continue;
      const fm = extractFrontmatter(content);
      nodes.push({
        id: `cap:${slug}`,
        type: 'capability',
        slug,
        name: fm.name || slug,
        status: fm.status || 'unknown',
        ui_facing: fm.ui_facing === true || fm.ui_facing === 'true',
      });
    }
  } catch { /* no capabilities dir */ }

  // Load features (uses backfilled listAllFeaturesInternal with composes[])
  const features = listAllFeaturesInternal(cwd);
  for (const feat of features) {
    const featPath = path.join(cwd, '.planning', 'features', feat.feature_slug, 'FEATURE.md');
    const content = safeReadFile(featPath);
    const fm = content ? extractFrontmatter(content) : {};

    nodes.push({
      id: `feat:${feat.feature_slug}`,
      type: 'feature',
      slug: feat.feature_slug,
      status: fm.status || 'unknown',
      composes: feat.composes,
    });

    // Create edges for each composed capability
    for (const capSlug of feat.composes) {
      edges.push({
        from: `feat:${feat.feature_slug}`,
        to: `cap:${capSlug}`,
        type: 'composes',
      });
    }
  }

  return { nodes, edges };
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

function getCapNode(nodes, slug) {
  return nodes.find(n => n.id === `cap:${slug}`);
}

function isCapReady(nodes, capSlug) {
  const cap = getCapNode(nodes, capSlug);
  if (!cap) return false;
  const s = (cap.status || '').toLowerCase();
  return s === 'verified' || s === 'complete';
}

function querySequence(graph) {
  const { nodes, edges } = graph;
  const featureNodes = nodes.filter(n => n.type === 'feature');
  const capNodes = nodes.filter(n => n.type === 'capability');

  const executable = [];
  const blocked = [];

  for (const feat of featureNodes) {
    const composedCaps = feat.composes || [];
    if (composedCaps.length === 0) {
      executable.push({ slug: feat.slug, status: feat.status, composes: [], blockers: [], has_ui: false });
      continue;
    }

    const blockers = [];
    for (const capSlug of composedCaps) {
      if (!isCapReady(nodes, capSlug)) {
        const cap = getCapNode(nodes, capSlug);
        blockers.push({ cap: capSlug, status: cap ? cap.status : 'missing' });
      }
    }

    const hasUi = composedCaps.some(c => { const cn = getCapNode(nodes, c); return cn && cn.ui_facing; });
    if (blockers.length === 0) {
      executable.push({ slug: feat.slug, status: feat.status, composes: composedCaps, blockers: [], has_ui: hasUi });
    } else {
      blocked.push({ slug: feat.slug, status: feat.status, composes: composedCaps, blockers, has_ui: hasUi });
    }
  }

  // Branches: group features by disjoint composes[] sets
  const branches = computeBranches(featureNodes);

  // Coordinate points: features sharing a composed cap
  const coordinatePoints = computeCoordinatePoints(featureNodes);

  // Critical path: blocking caps sorted by # features they unblock
  const blockerCounts = {};
  for (const b of blocked) {
    for (const bl of b.blockers) {
      blockerCounts[bl.cap] = blockerCounts[bl.cap] || { cap: bl.cap, status: bl.status, unblocks: 0, features: [] };
      blockerCounts[bl.cap].unblocks++;
      blockerCounts[bl.cap].features.push(b.slug);
    }
  }
  const criticalPath = Object.values(blockerCounts).sort((a, b) => b.unblocks - a.unblocks);

  // Orphans: caps composed by nothing, features with empty composes[]
  const composedCapSlugs = new Set(edges.filter(e => e.type === 'composes').map(e => e.to.replace('cap:', '')));
  const orphanCaps = capNodes.filter(n => !composedCapSlugs.has(n.slug)).map(n => n.slug);
  const orphanFeatures = featureNodes.filter(n => !n.composes || n.composes.length === 0).map(n => n.slug);

  return {
    executable,
    blocked,
    branches,
    coordinate_points: coordinatePoints,
    critical_path: criticalPath,
    orphans: { capabilities: orphanCaps, features: orphanFeatures },
  };
}

function computeBranches(featureNodes) {
  // Union-Find to group features with overlapping composes[] sets
  const featuresWithCaps = featureNodes.filter(f => f.composes && f.composes.length > 0);
  if (featuresWithCaps.length === 0) return [];

  // Map cap -> features that compose it
  const capToFeats = {};
  for (const f of featuresWithCaps) {
    for (const c of f.composes) {
      capToFeats[c] = capToFeats[c] || [];
      capToFeats[c].push(f.slug);
    }
  }

  // Simple union-find
  const parent = {};
  const find = (x) => {
    if (!parent[x]) parent[x] = x;
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
  const union = (a, b) => { parent[find(a)] = find(b); };

  for (const feats of Object.values(capToFeats)) {
    for (let i = 1; i < feats.length; i++) {
      union(feats[0], feats[i]);
    }
  }

  // Group by root
  const groups = {};
  for (const f of featuresWithCaps) {
    const root = find(f.slug);
    groups[root] = groups[root] || [];
    groups[root].push(f.slug);
  }

  return Object.values(groups).filter(g => g.length > 0);
}

function computeCoordinatePoints(featureNodes) {
  const capToFeats = {};
  for (const f of featureNodes) {
    for (const c of (f.composes || [])) {
      capToFeats[c] = capToFeats[c] || [];
      capToFeats[c].push(f.slug);
    }
  }

  const points = [];
  for (const [cap, feats] of Object.entries(capToFeats)) {
    if (feats.length >= 2) {
      points.push({ shared_cap: cap, features: feats });
    }
  }
  return points;
}

function queryCoupling(graph) {
  const featureNodes = graph.nodes.filter(n => n.type === 'feature');
  const points = computeCoordinatePoints(featureNodes);
  return points.map(p => ({
    shared_cap: p.shared_cap,
    features: p.features,
    implication: `${p.features.length} features share cap:${p.shared_cap} — changes to this capability affect all`,
  }));
}

function queryWaves(graph, scopeCSV) {
  const { nodes } = graph;
  const scopeSlugs = scopeCSV.split(',').map(s => s.trim()).filter(Boolean);
  const scopedFeatures = nodes.filter(n => n.type === 'feature' && scopeSlugs.includes(n.slug));

  const wave1 = [];
  const blockedFeats = [];

  for (const feat of scopedFeatures) {
    const composedCaps = feat.composes || [];
    if (composedCaps.length === 0) {
      wave1.push({ slug: feat.slug, composes: [], has_ui: false });
      continue;
    }

    const hasUi = composedCaps.some(c => { const cn = getCapNode(nodes, c); return cn && cn.ui_facing; });
    const unready = composedCaps.filter(c => !isCapReady(nodes, c));
    if (unready.length === 0) {
      wave1.push({ slug: feat.slug, composes: composedCaps, has_ui: hasUi });
    } else {
      blockedFeats.push({ slug: feat.slug, composes: composedCaps, unready_caps: unready, has_ui: hasUi });
    }
  }

  // Coordinate flags for wave 1
  const capToWave1 = {};
  for (const f of wave1) {
    for (const c of f.composes) {
      capToWave1[c] = capToWave1[c] || [];
      capToWave1[c].push(f.slug);
    }
  }
  const coordinateFlags = Object.entries(capToWave1)
    .filter(([, feats]) => feats.length >= 2)
    .map(([cap, feats]) => ({ shared_cap: cap, features: feats }));

  return {
    wave_1: wave1,
    blocked: blockedFeats,
    coordinate_flags: coordinateFlags,
  };
}

function queryDownstream(graph, capSlug) {
  const featureNodes = graph.nodes.filter(n => n.type === 'feature');
  const downstream = featureNodes
    .filter(f => (f.composes || []).includes(capSlug))
    .map(f => f.slug);
  return { cap: capSlug, downstream_features: downstream };
}

function validateCapContract(cwd, capSlug) {
  const capPath = path.join(cwd, '.planning', 'capabilities', capSlug, 'CAPABILITY.md');
  const content = safeReadFile(capPath) || '';
  const requiredSections = ['### Receives', '### Returns', '### Rules'];
  const missing = requiredSections.filter(s => !content.includes(s));

  // ui_facing caps must also have Design References
  const fm = extractFrontmatter(content);
  if (fm && (fm.ui_facing === true || fm.ui_facing === 'true')) {
    if (!content.includes('## Design References')) {
      missing.push('## Design References');
    }
  }

  return { contract_complete: missing.length === 0, missing };
}

function queryUpstream(graph, slug, cwd) {
  const featNode = graph.nodes.find(n => n.id === `feat:${slug}`);
  if (!featNode) {
    return { slug, upstream_capabilities: [], error: 'feature not found in graph' };
  }

  const upstream = (featNode.composes || []).map(capSlug => {
    const cap = getCapNode(graph.nodes, capSlug);
    const contract = cwd ? validateCapContract(cwd, capSlug) : { contract_complete: false, missing: ['unknown'] };
    const isUiFacing = cap ? cap.ui_facing : false;
    return {
      cap: capSlug,
      status: cap ? cap.status : 'missing',
      ready: cap ? isCapReady(graph.nodes, capSlug) : false,
      contract_complete: contract.contract_complete,
      missing: contract.missing,
      ui_facing: isUiFacing,
    };
  });
  return { slug, upstream_capabilities: upstream };
}

function queryUpstreamGaps(graph, slug, cwd) {
  const result = queryUpstream(graph, slug, cwd);
  if (result.error) return result;
  const gaps = result.upstream_capabilities.filter(c => !c.ready || !c.contract_complete);
  return { slug, has_gaps: gaps.length > 0, gaps };
}

function querySequenceStale(cwd) {
  const planningDir = path.join(cwd, '.planning');
  if (!fs.existsSync(planningDir)) {
    return { stale: false, reason: 'no_planning_directory' };
  }

  const seqPath = path.join(planningDir, 'SEQUENCE.md');
  if (!fs.existsSync(seqPath)) {
    return { stale: true, reason: 'no_sequence_file' };
  }

  let seqMtime;
  try {
    seqMtime = fs.statSync(seqPath).mtimeMs;
  } catch {
    return { stale: true, reason: 'no_sequence_file' };
  }

  // Check if any CAPABILITY.md or FEATURE.md is newer
  const capsDir = path.join(planningDir, 'capabilities');
  const featsDir = path.join(planningDir, 'features');

  const checkDir = (dir, filename) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory());
      for (const e of entries) {
        const filePath = path.join(dir, e.name, filename);
        try {
          const mtime = fs.statSync(filePath).mtimeMs;
          if (mtime > seqMtime) return true;
        } catch { /* file doesn't exist */ }
      }
    } catch { /* dir doesn't exist */ }
    return false;
  };

  if (checkDir(capsDir, 'CAPABILITY.md') || checkDir(featsDir, 'FEATURE.md')) {
    return { stale: true, reason: 'planning_files_modified' };
  }

  return { stale: false, reason: 'up_to_date' };
}

// ─── CLI Commands ─────────────────────────────────────────────────────────────

function cmdGraphBuild(cwd, raw) {
  const graph = buildGraph(cwd);
  output(graph, raw);
}

function cmdGraphQuery(cwd, queryArgs, raw) {
  const queryType = queryArgs[0];

  if (!queryType) {
    error('Usage: graph-query <sequence|coupling|waves|downstream|upstream|upstream-gaps|sequence-stale> [args]');
  }

  switch (queryType) {
    case 'sequence': {
      const graph = buildGraph(cwd);
      const result = querySequence(graph);
      output(result, raw);
      break;
    }
    case 'coupling': {
      const graph = buildGraph(cwd);
      const result = queryCoupling(graph);
      output(result, raw);
      break;
    }
    case 'waves': {
      const scopeIdx = queryArgs.indexOf('--scope');
      if (scopeIdx === -1 || !queryArgs[scopeIdx + 1]) {
        error('waves requires --scope <csv>');
      }
      const graph = buildGraph(cwd);
      const result = queryWaves(graph, queryArgs[scopeIdx + 1]);
      output(result, raw);
      break;
    }
    case 'downstream': {
      const capSlug = queryArgs[1];
      if (!capSlug) {
        error('downstream requires <cap-slug>');
      }
      const graph = buildGraph(cwd);
      const result = queryDownstream(graph, capSlug);
      output(result, raw);
      break;
    }
    case 'upstream': {
      const featSlug = queryArgs[1];
      if (!featSlug) {
        error('upstream requires <feat-slug>');
      }
      const graph = buildGraph(cwd);
      const result = queryUpstream(graph, featSlug, cwd);
      output(result, raw);
      break;
    }
    case 'upstream-gaps': {
      const gapSlug = queryArgs[1];
      if (!gapSlug) {
        error('upstream-gaps requires <feat-slug>');
      }
      const graph = buildGraph(cwd);
      const result = queryUpstreamGaps(graph, gapSlug, cwd);
      output(result, raw);
      break;
    }
    case 'sequence-stale': {
      const result = querySequenceStale(cwd);
      output(result, raw);
      break;
    }
    default:
      error(`Unknown graph query: ${queryType}. Available: sequence, coupling, waves, downstream, upstream, upstream-gaps, sequence-stale`);
  }
}

module.exports = { buildGraph, cmdGraphBuild, cmdGraphQuery };
