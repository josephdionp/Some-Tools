const { shouldInclude } = require('./scanner');
const { normalizePath } = require('./path-utils');
const { extractImports, extractExports, resolveImport, outsideImportId, outsideLabel } = require('./parser');
const { buildLayout } = require('./layout');

function pushUnique(map, key, value) {
  const list = map.get(key) || [];
  if (!list.includes(value)) list.push(value);
  map.set(key, list);
}

function findCycles(nodes, graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const seen = new Set();

  function dfs(node) {
    visiting.add(node);
    stack.push(node);

    for (const next of graph.get(node) || []) {
      if (visiting.has(next)) {
        const start = stack.indexOf(next);
        const cycle = [...stack.slice(start), next];
        const key = cycle.join(' -> ');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
      } else if (!visited.has(next)) {
        dfs(next);
      }
    }

    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  nodes.forEach((node) => {
    if (!visited.has(node)) dfs(node);
  });

  return cycles;
}

function assignDependencyLevels(nodes, importsByFile) {
  const memo = new Map();

  function depth(node, stack = new Set()) {
    if (memo.has(node)) return memo.get(node);
    if (stack.has(node)) return 0;

    stack.add(node);
    const imports = importsByFile.get(node) || [];
    const value = imports.length ? 1 + Math.max(...imports.map((child) => depth(child, new Set(stack)))) : 0;
    stack.delete(node);
    memo.set(node, value);
    return value;
  }

  nodes.forEach((node) => depth(node));
  return memo;
}

function buildAnalysis(files) {
  const normalizedFiles = files
    .map((file) => ({ path: normalizePath(file.path), content: file.content || '' }))
    .filter((file) => shouldInclude(file.path));

  const fileMap = new Map(normalizedFiles.map((file) => [file.path, file]));
  const nodes = normalizedFiles.map((file) => file.path);
  const importsByFile = new Map(nodes.map((node) => [node, []]));
  const importedByFile = new Map(nodes.map((node) => [node, []]));
  const externalImports = new Map(nodes.map((node) => [node, []]));
  const exportsByFile = new Map(nodes.map((node) => [node, []]));
  const edges = [];
  const outsideNodes = new Map();
  const seenEdges = new Set();

  for (const file of normalizedFiles) {
    exportsByFile.set(file.path, extractExports(file.content));
    const specs = extractImports(file.content);

    for (const specifier of specs) {
      const resolved = resolveImport(file.path, specifier, fileMap);
      if (resolved) {
        pushUnique(importsByFile, file.path, resolved);
        pushUnique(importedByFile, resolved, file.path);
        const key = `${file.path}->${resolved}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({ from: file.path, to: resolved, kind: 'local', specifier });
        }
      } else {
        const outsideId = outsideImportId(specifier);
        if (!outsideNodes.has(outsideId)) {
          outsideNodes.set(outsideId, {
            id: outsideId,
            label: outsideLabel(outsideId),
            raw: specifier,
            importedBy: [],
            type: outsideId.startsWith('link:') ? 'link' : 'package',
          });
        }
        if (!outsideNodes.get(outsideId).importedBy.includes(file.path)) {
          outsideNodes.get(outsideId).importedBy.push(file.path);
        }
        pushUnique(externalImports, file.path, outsideId);
        const key = `${file.path}->${outsideId}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({ from: file.path, to: outsideId, kind: 'outside', specifier });
        }
      }
    }
  }

  const cycles = findCycles(nodes, importsByFile);
  const levels = assignDependencyLevels(nodes, importsByFile);
  const roots = nodes.filter((node) => importedByFile.get(node).length === 0 && importsByFile.get(node).length > 0);
  const importedOnly = nodes.filter((node) => importedByFile.get(node).length > 0 && importsByFile.get(node).length === 0);
  const unused = nodes.filter((node) => importedByFile.get(node).length === 0 && importsByFile.get(node).length === 0);
  const outsideList = [...outsideNodes.values()];
  const layout = buildLayout(nodes, outsideList, levels);

  return {
    nodes,
    importsByFile: Object.fromEntries(importsByFile),
    importedByFile: Object.fromEntries(importedByFile),
    externalImports: Object.fromEntries(externalImports),
    exportsByFile: Object.fromEntries(exportsByFile),
    edges,
    outsideNodes: Object.fromEntries(outsideNodes),
    outsideList,
    roots,
    importedOnly,
    unused,
    cycles,
    levels: Object.fromEntries(levels),
    layout,
  };
}

module.exports = {
  buildAnalysis,
  findCycles,
  assignDependencyLevels,
};
