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
        depends_on: fm.depends_on || [],
      });
    }
  } catch { /* no capabilities dir */ }

  // Create cap→cap edges from depends_on[]
  for (const node of nodes.filter(n => n.type === 'capability')) {
    for (const depSlug of node.depends_on) {
      edges.push({ from: `cap:${node.slug}`, to: `cap:${depSlug}`, type: 'depends_on' });
    }
  }

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
  // Try feature first (composes[])
  const featNode = graph.nodes.find(n => n.id === `feat:${slug}`);
  if (featNode) {
    const upstream = (featNode.composes || []).map(capSlug => {
      const cap = getCapNode(graph.nodes, capSlug);
      const contract = cwd ? validateCapContract(cwd, capSlug) : { contract_complete: false, missing: ['unknown'] };
      return {
        cap: capSlug,
        status: cap ? cap.status : 'missing',
        ready: cap ? isCapReady(graph.nodes, capSlug) : false,
        contract_complete: contract.contract_complete,
        missing: contract.missing,
        ui_facing: cap ? cap.ui_facing : false,
      };
    });
    return { slug, type: 'feature', upstream_capabilities: upstream };
  }

  // Try capability (depends_on[])
  const capNode = graph.nodes.find(n => n.id === `cap:${slug}`);
  if (capNode) {
    const upstream = (capNode.depends_on || []).map(depSlug => {
      const dep = getCapNode(graph.nodes, depSlug);
      const contract = cwd ? validateCapContract(cwd, depSlug) : { contract_complete: false, missing: ['unknown'] };
      return {
        cap: depSlug,
        status: dep ? dep.status : 'missing',
        ready: dep ? isCapReady(graph.nodes, depSlug) : false,
        contract_complete: contract.contract_complete,
        missing: contract.missing,
        ui_facing: dep ? dep.ui_facing : false,
      };
    });
    return { slug, type: 'capability', upstream_capabilities: upstream };
  }

  return { slug, upstream_capabilities: [], error: 'not found in graph' };
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

// ─── Route-Check + Execute-Preflight Helpers ─────────────────────────────────

function capStatusToStage(status) {
  const s = (status || 'missing').toLowerCase();
  switch (s) {
    case 'exploring':
    case 'missing':
      return { stage: 'discuss', cmd: '/gsd:discuss-capability' };
    case 'specified':
    case 'planning':
      return { stage: 'plan', cmd: '/gsd:plan' };
    case 'in-progress':
      return { stage: 'execute', cmd: '/gsd:execute' };
    case 'verified':
    case 'complete':
      return { stage: 'complete', cmd: null };
    default:
      return { stage: 'discuss', cmd: '/gsd:discuss-capability' };
  }
}

function detectFeatureStage(cwd, slug) {
  const dir = path.join(cwd, '.planning', 'features', slug);
  try { fs.readdirSync(dir); } catch { return { stage: 'discuss', cmd: '/gsd:discuss-feature' }; }

  // Check FEATURE.md status
  const featPath = path.join(dir, 'FEATURE.md');
  const content = safeReadFile(featPath);
  if (content) {
    const fm = extractFrontmatter(content);
    if ((fm.status || '').toLowerCase() === 'exploring') {
      return { stage: 'discuss', cmd: '/gsd:discuss-feature' };
    }
  }

  const files = fs.readdirSync(dir);
  const hasPlans = files.some(f => f.endsWith('-PLAN.md'));
  const hasSummaries = files.some(f => f.endsWith('-SUMMARY.md'));
  const hasReview = files.includes('review');
  const hasDocReport = files.includes('doc-report.md');

  if (!hasPlans) return { stage: 'plan', cmd: '/gsd:plan' };
  if (!hasSummaries) return { stage: 'execute', cmd: '/gsd:execute' };
  if (!hasReview) return { stage: 'review', cmd: '/gsd:review' };
  if (!hasDocReport) return { stage: 'doc', cmd: '/gsd:doc' };
  return { stage: 'complete', cmd: null };
}

function collectTransitiveUpstream(nodes, featureSlugs) {
  const visited = new Set();
  const queue = [];

  // Start from features — collect their composed caps
  for (const slug of featureSlugs) {
    const feat = nodes.find(n => n.id === `feat:${slug}`);
    if (feat && feat.composes) {
      for (const capSlug of feat.composes) {
        if (!visited.has(capSlug)) {
          visited.add(capSlug);
          queue.push(capSlug);
        }
      }
    }
  }

  // BFS through cap→cap depends_on
  while (queue.length > 0) {
    const capSlug = queue.shift();
    const cap = nodes.find(n => n.id === `cap:${capSlug}`);
    if (!cap || !cap.depends_on) continue;
    for (const depSlug of cap.depends_on) {
      if (!visited.has(depSlug)) {
        visited.add(depSlug);
        queue.push(depSlug);
      }
    }
  }

  return [...visited];
}

function computeMaxDepth(nodes, edges) {
  if (nodes.length === 0) return 0;
  const nodeIds = new Set(nodes.map(n => n.id));
  const filteredEdges = edges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));

  // Build adjacency (from → [to]) and in-degree
  const adj = {};
  const inDeg = {};
  for (const n of nodes) { adj[n.id] = []; inDeg[n.id] = 0; }
  for (const e of filteredEdges) {
    adj[e.from].push(e.to);
    inDeg[e.to]++;
  }

  // BFS relaxation from in-degree-0 nodes, with visit cap for cycle safety
  const depth = {};
  const visits = {};
  const queue = [];
  const maxVisits = nodes.length;
  for (const n of nodes) {
    depth[n.id] = 0;
    visits[n.id] = 0;
    if (inDeg[n.id] === 0) queue.push(n.id);
  }

  while (queue.length > 0) {
    const id = queue.shift();
    for (const neighbor of adj[id]) {
      const newDepth = depth[id] + 1;
      if (newDepth > depth[neighbor] && visits[neighbor] < maxVisits) {
        depth[neighbor] = newDepth;
        visits[neighbor]++;
        queue.push(neighbor);
      }
    }
  }

  return Math.max(0, ...Object.values(depth));
}

// ─── Route-Check + Execute-Preflight Queries ─────────────────────────────────

function queryRouteCheck(graph, cwd, scopeSlugs) {
  const { nodes, edges } = graph;

  // 1. Scope filtering
  let scopedNodes = nodes;
  if (scopeSlugs) {
    const scopeIds = new Set();
    for (const s of scopeSlugs) {
      scopeIds.add(`cap:${s}`);
      scopeIds.add(`feat:${s}`);
    }
    // Add transitive upstream caps
    const featSlugs = scopeSlugs.filter(s => nodes.find(n => n.id === `feat:${s}`));
    const upstreamCaps = collectTransitiveUpstream(nodes, featSlugs);
    for (const c of upstreamCaps) scopeIds.add(`cap:${c}`);
    scopedNodes = nodes.filter(n => scopeIds.has(n.id));
  }

  // 2. Assign stage per node
  const nodeStages = scopedNodes.map(n => {
    const stageInfo = n.type === 'capability'
      ? capStatusToStage(n.status)
      : detectFeatureStage(cwd, n.slug);
    return { ...n, ...stageInfo };
  });

  // 3. Work items = not complete
  const workItems = nodeStages.filter(n => n.stage !== 'complete');
  if (workItems.length === 0) {
    return { complexity: 'simple', signals: [], chain: [], suggested_scope: [] };
  }

  // 4. Complexity signals
  const signals = [];
  const featWorkItems = workItems.filter(n => n.type === 'feature');

  // a. Branching + shared caps
  const branches = computeBranches(featWorkItems);
  const coordPoints = computeCoordinatePoints(featWorkItems)
    .filter(p => !isCapReady(nodes, p.shared_cap));
  if (branches.length > 1 && coordPoints.length > 0) {
    signals.push('branching_shared_caps');
  }

  // b. High unready upstream
  const featSlugs = featWorkItems.map(n => n.slug);
  const unreadyCaps = collectTransitiveUpstream(nodes, featSlugs)
    .filter(c => !isCapReady(nodes, c));
  if (unreadyCaps.length >= 3) {
    signals.push('high_unready_upstream');
  }

  // c. Shared cap contention
  const capToFeats = {};
  for (const f of featWorkItems) {
    for (const c of (f.composes || [])) {
      capToFeats[c] = capToFeats[c] || [];
      capToFeats[c].push(f.slug);
    }
  }
  const hasContention = Object.entries(capToFeats)
    .some(([cap, feats]) => feats.length >= 2 && !isCapReady(nodes, cap));
  if (hasContention) {
    signals.push('shared_cap_contention');
  }

  // d. Deep branching
  const depth = computeMaxDepth(workItems, edges);
  if (depth >= 3 && branches.length > 1) {
    signals.push('deep_branching');
  }

  const complexity = signals.length > 0 ? 'complex' : 'simple';

  // 6. Kahn's topological sort (reversed edges: dependency before dependent)
  // Graph edges go FROM dependent TO dependency (feat→cap, cap→dep_cap).
  // Reverse so Kahn's outputs dependencies first (correct execution order).
  const workIds = new Set(workItems.map(n => n.id));
  const workEdges = edges.filter(e => workIds.has(e.from) && workIds.has(e.to));
  const adj = {};
  const inDeg = {};
  for (const n of workItems) { adj[n.id] = []; inDeg[n.id] = 0; }
  for (const e of workEdges) {
    adj[e.to].push(e.from);
    inDeg[e.from]++;
  }

  const queue = [];
  for (const n of workItems) {
    if (inDeg[n.id] === 0) queue.push(n.id);
  }
  const sorted = [];
  while (queue.length > 0) {
    const id = queue.shift();
    sorted.push(id);
    for (const neighbor of adj[id]) {
      inDeg[neighbor]--;
      if (inDeg[neighbor] === 0) queue.push(neighbor);
    }
  }

  if (sorted.length < workItems.length) {
    signals.push('cycle');
  }

  const chain = sorted.map(id => {
    const n = workItems.find(w => w.id === id);
    return { slug: n.slug, type: n.type, status: n.status, stage: n.stage, command: n.cmd };
  });

  const suggested_scope = complexity === 'complex' ? chain.map(c => c.slug) : [];

  return { complexity, signals, chain, suggested_scope };
}

function queryExecutePreflight(graph, cwd, slug) {
  // 1. Resolve node
  const featNode = graph.nodes.find(n => n.id === `feat:${slug}`);
  const capNode = graph.nodes.find(n => n.id === `cap:${slug}`);

  if (!featNode && !capNode) {
    return { ready: false, reason: 'not_found' };
  }

  if (featNode) {
    const featDir = path.join(cwd, '.planning', 'features', slug);

    // a. Check PLAN exists
    let hasPlan = false;
    let planMtime = 0;
    try {
      const files = fs.readdirSync(featDir);
      const planFile = files.find(f => f.endsWith('-PLAN.md'));
      if (planFile) {
        hasPlan = true;
        planMtime = fs.statSync(path.join(featDir, planFile)).mtimeMs;
      }
    } catch { /* dir doesn't exist */ }

    if (!hasPlan) {
      return { ready: false, reason: 'no_plan', route: `/gsd:plan ${slug}` };
    }

    // b. Check plan freshness vs FEATURE.md
    const featPath = path.join(featDir, 'FEATURE.md');
    try {
      const featMtime = fs.statSync(featPath).mtimeMs;
      if (planMtime < featMtime) {
        return { ready: false, reason: 'stale_plan', route: `/gsd:plan ${slug}` };
      }
    } catch { /* no FEATURE.md — unusual but not a plan staleness issue */ }

    // c. Check upstream gaps
    const gaps = queryUpstreamGaps(graph, slug, cwd);
    if (gaps.has_gaps) {
      return { ready: false, reason: 'upstream_gaps', gaps: gaps.gaps, route: `/gsd:plan ${slug}` };
    }

    return { ready: true };
  }

  // Capability: aggregate feature preflights
  if (capNode) {
    const composingFeats = graph.nodes
      .filter(n => n.type === 'feature' && (n.composes || []).includes(slug));
    const features = composingFeats.map(f => ({
      slug: f.slug,
      ...queryExecutePreflight(graph, cwd, f.slug),
    }));
    const allReady = features.length > 0 && features.every(f => f.ready);
    return { ready: allReady, features };
  }
}

// ─── CLI Commands ─────────────────────────────────────────────────────────────

function cmdGraphBuild(cwd, raw) {
  const graph = buildGraph(cwd);
  output(graph, raw);
}

function cmdGraphQuery(cwd, queryArgs, raw) {
  const queryType = queryArgs[0];

  if (!queryType) {
    error('Usage: graph-query <sequence|coupling|waves|downstream|upstream|upstream-gaps|sequence-stale|route-check|execute-preflight> [args]');
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
        error('upstream requires <slug>');
      }
      const graph = buildGraph(cwd);
      const result = queryUpstream(graph, featSlug, cwd);
      output(result, raw);
      break;
    }
    case 'upstream-gaps': {
      const gapSlug = queryArgs[1];
      if (!gapSlug) {
        error('upstream-gaps requires <slug>');
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
    case 'route-check': {
      const scopeIdx = queryArgs.indexOf('--scope');
      const scopeSlugs = (scopeIdx !== -1 && queryArgs[scopeIdx + 1])
        ? queryArgs[scopeIdx + 1].split(',').map(s => s.trim()).filter(Boolean)
        : null;
      const graph = buildGraph(cwd);
      output(queryRouteCheck(graph, cwd, scopeSlugs), raw);
      break;
    }
    case 'execute-preflight': {
      const slug = queryArgs[1];
      if (!slug) error('execute-preflight requires <slug>');
      const graph = buildGraph(cwd);
      output(queryExecutePreflight(graph, cwd, slug), raw);
      break;
    }
    default:
      error(`Unknown graph query: ${queryType}. Available: sequence, coupling, waves, downstream, upstream, upstream-gaps, sequence-stale, route-check, execute-preflight`);
  }
}

module.exports = { buildGraph, cmdGraphBuild, cmdGraphQuery };
