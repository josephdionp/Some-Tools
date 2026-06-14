const { LAYOUT } = require('../config');
const { htmlEscape, safeJson } = require('../path-utils');

function buildHtml(analysis, meta) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Import Flow Visualizer</title>
  <style>${buildCss()}</style>
</head>
<body>
  <div id="app"></div>
  <script>window.__IMPORT_FLOW__ = ${safeJson({ analysis, meta })};</script>
  <script>${buildClientScript()}</script>
</body>
</html>`;
}

function buildCss() {
  return `
    :root {
      --bg: #020617;
      --panel: rgba(15, 23, 42, .72);
      --panel-strong: #020617;
      --border: #1e293b;
      --border-soft: #334155;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --faint: #64748b;
      --hover: #1e293b;
      --yellow: #fde047;
      --orange: #fb923c;
      --blue: #60a5fa;
      --green: #34d399;
      --purple: #c084fc;
      --red: #f87171;
      --cyan: #22d3ee;
    }
    .light {
      --bg: #f3f6fb;
      --panel: rgba(255, 255, 255, .88);
      --panel-strong: #f8fafc;
      --border: #cbd5e1;
      --border-soft: #94a3b8;
      --text: #0f172a;
      --muted: #475569;
      --faint: #64748b;
      --hover: #e2e8f0;
      --yellow: #a16207;
      --orange: #c2410c;
      --blue: #2563eb;
      --green: #047857;
      --purple: #7e22ce;
      --red: #b91c1c;
      --cyan: #0891b2;
    }
    * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #475569 var(--panel-strong); }
    *::-webkit-scrollbar { width: 10px; height: 10px; }
    *::-webkit-scrollbar-track { background: var(--panel-strong); }
    *::-webkit-scrollbar-thumb { background: #64748b; border-radius: 999px; border: 2px solid var(--panel-strong); }
    *::-webkit-scrollbar-corner { background: var(--panel-strong); }
    html, body { height: 100%; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); overflow: hidden; }
    button, input { font: inherit; }
    button { cursor: pointer; color: inherit; }
    .app { height: 100vh; display: flex; flex-direction: column; }
    header { border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--bg) 91%, transparent); backdrop-filter: blur(12px); padding: 14px 18px; }
    .top { display: flex; gap: 16px; align-items: center; justify-content: space-between; }
    h1 { font-size: 20px; margin: 0; }
    .subtitle { margin-top: 4px; color: var(--muted); font-size: 13px; max-width: 780px; overflow-wrap: anywhere; }
    .controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: flex-end; }
    .btn, input { border: 1px solid var(--border-soft); background: var(--panel); color: var(--text); border-radius: 12px; padding: 8px 10px; }
    .btn:hover { background: var(--hover); }
    .btn.primary { border-color: var(--yellow); color: var(--yellow); }
    input { min-width: 250px; outline: none; }
    .shell { height: calc(100vh - 86px); display: grid; grid-template-columns: 390px minmax(0, 1fr); gap: 14px; padding: 14px; overflow: hidden; }
    .left { min-width: 0; overflow: auto; padding-right: 2px; display: flex; flex-direction: column; gap: 10px; }
    .left, .left * { min-width: 0; }
    .panel { border: 1px solid var(--border); background: var(--panel); border-radius: 18px; padding: 10px; min-width: 0; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .panel-title { display: flex; align-items: center; gap: 8px; min-width: 0; border: none; background: transparent; padding: 0; }
    .panel-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
    .toggle { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--border-soft); background: var(--hover); font-weight: 800; color: var(--text); }
    .badge { border: 1px solid var(--border-soft); color: var(--muted); border-radius: 999px; padding: 2px 8px; font-size: 12px; }
    .panel-body { margin-top: 8px; border: 1px solid var(--border); background: var(--panel-strong); border-radius: 14px; padding: 8px; overflow: auto; resize: vertical; min-height: 88px; max-height: 68vh; }
    .path, .path button, .path-wrap { overflow-wrap: anywhere; word-break: break-word; white-space: normal; user-select: text; }
    .row-btn { display: block; width: 100%; text-align: left; background: transparent; border: 0; color: var(--text); border-radius: 8px; padding: 5px 7px; font-size: 12px; }
    .row-btn:hover { background: var(--hover); }
    .file-row { display: flex; gap: 6px; align-items: flex-start; min-width: 0; }
    .file-row .kind { color: var(--faint); flex: 0 0 auto; }
    .file-row .name { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .selected-row { background: color-mix(in srgb, var(--yellow) 16%, transparent); color: var(--yellow); }
    .mini-label { margin-top: 12px; font-size: 11px; color: var(--faint); text-transform: uppercase; letter-spacing: .05em; }
    .pill { display: inline-flex; border-radius: 999px; padding: 4px 7px; margin: 2px; background: color-mix(in srgb, var(--purple) 18%, transparent); color: var(--purple); font-size: 12px; }
    .graph-card { min-width: 0; min-height: 0; border: 1px solid var(--border); background: var(--panel); border-radius: 18px; padding: 10px; display: flex; flex-direction: column; }
    .stats { color: var(--muted); font-size: 13px; margin-bottom: 8px; }
    .legend-row { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 8px; }
    .legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--muted); }
    .legend span { display: inline-flex; gap: 5px; align-items: center; }
    .dot { width: 8px; height: 8px; border-radius: 99px; display: inline-block; }
    .graph-scroll { flex: 1; min-height: 0; overflow: auto; border: 1px solid var(--border); background: var(--panel-strong); border-radius: 14px; padding: 14px; resize: vertical; }
    .graph-space { position: relative; }
    .graph-inner { position: absolute; left: 0; top: 0; transform-origin: top left; }
    .outside-band, .level-band, .folder-lane { position: absolute; z-index: 0; pointer-events: none; }
    .outside-band { border: 1px solid color-mix(in srgb, var(--orange) 42%, transparent); background: color-mix(in srgb, var(--orange) 10%, transparent); border-radius: 24px; }
    .band-title { padding: 8px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; color: var(--orange); }
    .level-band { border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent); background: color-mix(in srgb, var(--panel) 40%, transparent); }
    .level-label { position: sticky; left: 10px; display: inline-flex; margin-top: 4px; border: 1px solid var(--border-soft); background: color-mix(in srgb, var(--panel-strong) 92%, transparent); border-radius: 999px; padding: 4px 10px; color: var(--muted); font-size: 11px; }
    .folder-lane { z-index: 1; border-radius: 24px; border: 1px solid; backdrop-filter: blur(1px); }
    .folder-title { border-bottom: 1px solid; padding: 8px 14px; font-size: 12px; font-weight: 700; border-radius: 24px 24px 0 0; }
    svg { position: absolute; inset: 0; z-index: 10; pointer-events: none; overflow: visible; }
    .node { position: absolute; z-index: 20; width: ${LAYOUT.NODE_W}px; height: ${LAYOUT.NODE_H}px; border: 1px solid var(--border-soft); background: color-mix(in srgb, var(--panel) 92%, black 8%); border-radius: 18px; padding: 11px; text-align: left; box-shadow: 0 10px 24px rgba(0,0,0,.22); user-select: text; }
    .light .node { background: rgba(255,255,255,.96); box-shadow: 0 10px 24px rgba(15,23,42,.14); }
    .node:hover { background: var(--hover); }
    .node.active { outline: 2px solid var(--yellow); }
    .node.spotlight { animation: spotlightPulse 850ms ease-out 2; }
    @keyframes spotlightPulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--yellow) 70%, transparent); } 100% { box-shadow: 0 0 0 22px transparent; } }
    .node.dim { opacity: .25; }
    .node.loop { border-color: var(--red); }
    .node.imported { border-color: var(--blue); }
    .node.importer { border-color: var(--green); }
    .node.outside { border-color: var(--orange); }
    .side-stripe { position: absolute; left: 0; top: 14px; height: 68px; width: 4px; border-radius: 0 8px 8px 0; }
    .port-top, .port-bottom { position: absolute; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; border-radius: 999px; border: 1px solid var(--bg); background: #cbd5e1; }
    .port-top { top: -6px; }
    .port-bottom { bottom: -6px; }
    .node-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .node-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .node-folder { margin-top: 4px; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .node-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 8px; font-size: 11px; color: var(--muted); }
    .node-level { margin-top: 3px; font-size: 11px; color: var(--faint); }
    .small-dot { width: 11px; height: 11px; border-radius: 99px; flex: 0 0 auto; }
    @media (max-width: 1100px) { .shell { grid-template-columns: 1fr; overflow: auto; } body { overflow: auto; } .left { order: 2; max-height: none; } .graph-card { min-height: 75vh; } }
  `;
}

function buildClientScript() {
  return `
(function () {
  const NODE_W = ${LAYOUT.NODE_W};
  const NODE_H = ${LAYOUT.NODE_H};
  const EDGE_LIMIT = ${LAYOUT.EDGE_LIMIT};
  const data = window.__IMPORT_FLOW__;
  const analysis = data.analysis;
  const meta = data.meta;
  let state = {
    selected: analysis.nodes[0] || '',
    zoom: 0.82,
    search: '',
    focusOnly: false,
    edgeMode: 'direct',
    theme: 'dark',
    pendingReveal: null,
    graphScroll: { left: 0, top: 0 },
    openPanels: {
      files: true,
      selected: true,
      loops: true,
      roots: true,
      imported: true,
      unused: true,
    },
  };

  const app = document.getElementById('app');

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function folderOf(filePath) {
    const index = filePath.lastIndexOf('/');
    return index === -1 ? 'root' : filePath.slice(0, index);
  }

  function fileName(filePath) {
    return String(filePath).split('/').pop();
  }

  function outsideLabel(id) {
    return String(id).replace(/^pkg:/, 'node_modules: ').replace(/^link:/, 'link: ');
  }

  function isInCycle(filePath) {
    return analysis.cycles.some((cycle) => cycle.includes(filePath));
  }

  function relationSet(selected) {
    const related = new Set([selected]);
    (analysis.importsByFile[selected] || []).forEach((x) => related.add(x));
    (analysis.importedByFile[selected] || []).forEach((x) => related.add(x));
    (analysis.externalImports[selected] || []).forEach((x) => related.add(x));
    analysis.edges.forEach((edge) => {
      if (edge.to === selected) related.add(edge.from);
      if (edge.from === selected) related.add(edge.to);
    });
    return related;
  }

  function visibleSet() {
    const q = state.search.trim().toLowerCase();
    const set = new Set();
    const related = relationSet(state.selected);

    if (!q && !state.focusOnly) {
      analysis.nodes.forEach((node) => set.add(node));
      analysis.outsideList.forEach((node) => set.add(node.id));
      return set;
    }

    if (state.focusOnly && state.selected) related.forEach((node) => set.add(node));

    if (q) {
      analysis.nodes.forEach((node) => {
        if (node.toLowerCase().includes(q) || folderOf(node).toLowerCase().includes(q)) {
          set.add(node);
          (analysis.importsByFile[node] || []).forEach((x) => set.add(x));
          (analysis.importedByFile[node] || []).forEach((x) => set.add(x));
          (analysis.externalImports[node] || []).forEach((x) => set.add(x));
        }
      });
      analysis.outsideList.forEach((node) => {
        if (node.label.toLowerCase().includes(q)) {
          set.add(node.id);
          node.importedBy.forEach((file) => set.add(file));
        }
      });
    }
    return set;
  }

  function centerTop(pos) { return { x: pos.x + NODE_W / 2, y: pos.y }; }
  function centerBottom(pos) { return { x: pos.x + NODE_W / 2, y: pos.y + NODE_H }; }

  function edgePath(fromPos, toPos, index) {
    const start = centerTop(fromPos);
    const end = centerBottom(toPos);
    const bendOffset = ((index % 9) - 4) * 5;
    const midY = Math.round((start.y + end.y) / 2) + bendOffset;
    if (Math.abs(start.x - end.x) < 18) return 'M ' + start.x + ' ' + start.y + ' L ' + end.x + ' ' + end.y;
    return 'M ' + start.x + ' ' + start.y + ' L ' + start.x + ' ' + midY + ' L ' + end.x + ' ' + midY + ' L ' + end.x + ' ' + end.y;
  }

  function edgeColor(edge, active, loop) {
    if (loop) return 'var(--red)';
    if (active) return 'var(--yellow)';
    if (edge.kind === 'outside') return 'var(--orange)';
    if (folderOf(edge.from) === folderOf(edge.to)) return 'var(--cyan)';
    return '#94a3b8';
  }

  function captureGraphScroll() {
    const scroll = document.getElementById('graphScroll');
    if (!scroll) return state.graphScroll;
    state.graphScroll = { left: scroll.scrollLeft, top: scroll.scrollTop };
    return state.graphScroll;
  }

  function restoreGraphScroll(saved) {
    const scroll = document.getElementById('graphScroll');
    if (!scroll || !saved) return;
    const maxLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
    const maxTop = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    scroll.scrollLeft = Math.min(maxLeft, Math.max(0, saved.left || 0));
    scroll.scrollTop = Math.min(maxTop, Math.max(0, saved.top || 0));
  }

  function selectFile(id, revealMode) {
    captureGraphScroll();
    state.selected = id;
    state.pendingReveal = revealMode || null;
    render();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function revealSelectedNode(mode = 'nearest') {
    const pos = analysis.layout.positions[state.selected];
    const scroll = document.getElementById('graphScroll');
    if (!pos || !scroll) return;

    const pad = 84;
    const nodeLeft = pos.x * state.zoom;
    const nodeRight = (pos.x + NODE_W) * state.zoom;
    const nodeTop = pos.y * state.zoom;
    const nodeBottom = (pos.y + NODE_H) * state.zoom;
    const maxLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
    const maxTop = Math.max(0, scroll.scrollHeight - scroll.clientHeight);

    let targetLeft = scroll.scrollLeft;
    let targetTop = scroll.scrollTop;

    if (mode === 'center') {
      targetLeft = (pos.x + NODE_W / 2) * state.zoom - scroll.clientWidth / 2;
      targetTop = (pos.y + NODE_H / 2) * state.zoom - scroll.clientHeight / 2;
    } else {
      const viewLeft = scroll.scrollLeft;
      const viewRight = viewLeft + scroll.clientWidth;
      const viewTop = scroll.scrollTop;
      const viewBottom = viewTop + scroll.clientHeight;

      if (nodeLeft < viewLeft + pad) targetLeft = nodeLeft - pad;
      else if (nodeRight > viewRight - pad) targetLeft = nodeRight - scroll.clientWidth + pad;

      if (nodeTop < viewTop + pad) targetTop = nodeTop - pad;
      else if (nodeBottom > viewBottom - pad) targetTop = nodeBottom - scroll.clientHeight + pad;
    }

    scroll.scrollTo({
      left: clamp(targetLeft, 0, maxLeft),
      top: clamp(targetTop, 0, maxTop),
      behavior: 'smooth',
    });

    state.graphScroll = { left: clamp(targetLeft, 0, maxLeft), top: clamp(targetTop, 0, maxTop) };
    flashSelectedNode();
  }

  function lookSelectedNode() {
    revealSelectedNode('nearest');
  }

  function flashSelectedNode() {
    const node = document.querySelector('[data-active-node="true"]');
    if (!node) return;
    node.classList.remove('spotlight');
    void node.offsetWidth;
    node.classList.add('spotlight');
  }

  function panel(id, title, badge, body, height) {
    const open = state.openPanels[id];
    return '<section class="panel">' +
      '<div class="panel-head">' +
        '<button class="panel-title" data-panel="' + id + '"><span class="toggle">' + (open ? '−' : '+') + '</span><strong>' + escapeHtml(title) + '</strong></button>' +
        (badge !== undefined ? '<span class="badge">' + escapeHtml(badge) + '</span>' : '') +
      '</div>' +
      (open ? '<div class="panel-body" style="height:' + height + 'px">' + body + '</div>' : '') +
    '</section>';
  }

  function buildExplorerTree(paths) {
    const root = { name: 'root', path: '', folders: {}, files: [] };
    [...paths].sort().forEach((fullPath) => {
      const parts = fullPath.split('/');
      let current = root;
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        if (isFile) current.files.push({ name: part, path: fullPath });
        else {
          const folderPath = parts.slice(0, index + 1).join('/');
          current.folders[part] ||= { name: part, path: folderPath, folders: {}, files: [] };
          current = current.folders[part];
        }
      });
    });
    return root;
  }

  function renderExplorerFolder(folder, depth = 0) {
    const folders = Object.values(folder.folders).sort((a, b) => a.name.localeCompare(b.name));
    const files = folder.files.sort((a, b) => a.name.localeCompare(b.name));
    let html = '';

    if (folder.path) {
      html += '<div class="row-btn file-row" style="padding-left:' + (8 + depth * 14) + 'px"><span class="kind">folder</span><span class="name">' + escapeHtml(folder.name) + '</span></div>';
    }
    folders.forEach((child) => { html += renderExplorerFolder(child, folder.path ? depth + 1 : depth); });
    files.forEach((file) => {
      const selected = state.selected === file.path ? ' selected-row' : '';
      html += '<button class="row-btn file-row path' + selected + '" data-select="' + escapeHtml(file.path) + '" data-center-on-select="true" style="padding-left:' + (8 + (folder.path ? depth + 1 : depth) * 14) + 'px"><span class="kind">file</span><span class="name">' + escapeHtml(file.name) + '</span></button>';
    });
    return html;
  }

  function renderRows(paths, prefix) {
    if (!paths.length) return '<p style="color:var(--muted);font-size:13px;margin:0">None found.</p>';
    return paths.slice(0, 160).map((file) => '<button class="row-btn path-wrap" data-select="' + escapeHtml(file) + '" data-center-on-select="true">' + prefix + escapeHtml(file) + '</button>').join('');
  }

  function renderLeft() {
    const selected = state.selected;
    const selectedOutside = analysis.outsideNodes[selected];
    const selectedImports = analysis.importsByFile[selected] || [];
    const selectedImportedBy = analysis.importedByFile[selected] || [];
    const selectedExports = analysis.exportsByFile[selected] || [];
    const tree = buildExplorerTree(analysis.nodes);

    const filesPanel = panel('files', 'Files', analysis.nodes.length, renderExplorerFolder(tree), 260);

    let selectedBody = '<div class="path-wrap" style="font-weight:700;color:var(--yellow)">' + escapeHtml(selectedOutside ? selectedOutside.label : selected) + '</div>' +
      '<button class="btn primary" id="lookSelectedSide" style="margin-top:10px;width:100%">Look / find selected</button>';

    if (selectedOutside) {
      selectedBody += '<div class="mini-label">Imported by</div>' + renderRows(selectedOutside.importedBy, '↑ ');
    } else {
      selectedBody += '<div class="mini-label">Exports</div>' +
        (selectedExports.length ? selectedExports.map((name) => '<span class="pill">' + escapeHtml(name) + '</span>').join('') : '<div style="color:var(--muted);font-size:12px">No direct exports found</div>') +
        '<div class="mini-label">Imports from this file</div>' +
        (selectedImports.length ? renderRows(selectedImports, '↓ ') : '<div style="color:var(--muted);font-size:12px">No local imports</div>') +
        (analysis.externalImports[selected] || []).map((item) => '<button class="row-btn path-wrap" data-select="' + escapeHtml(item) + '" data-center-on-select="true">↗ ' + escapeHtml(outsideLabel(item)) + '</button>').join('') +
        '<div class="mini-label">Imported by</div>' +
        (selectedImportedBy.length ? renderRows(selectedImportedBy, '↑ ') : '<div style="color:var(--muted);font-size:12px">No local file imports this</div>');
    }

    const loopsBody = analysis.cycles.length
      ? analysis.cycles.map((cycle) => '<div class="path-wrap" style="border:1px solid color-mix(in srgb,var(--red) 50%,transparent);border-radius:12px;padding:8px;margin-bottom:8px;color:var(--red);font-size:12px">' + cycle.map((item) => '<button class="row-btn path-wrap" data-select="' + escapeHtml(item) + '" data-center-on-select="true">' + escapeHtml(item) + '</button>').join('→') + '</div>').join('')
      : '<p style="color:var(--muted);font-size:13px;margin:0">No loops found.</p>';

    return filesPanel +
      panel('selected', 'Selected', undefined, selectedBody, 330) +
      panel('loops', 'Import loops', analysis.cycles.length, loopsBody, 170) +
      panel('roots', 'Bottom importers', analysis.roots.length, '<p style="color:var(--muted);font-size:12px">Entry/root-like files.</p>' + renderRows(analysis.roots, ''), 190) +
      panel('imported', 'Imported-only / top dependencies', analysis.importedOnly.length, '<p style="color:var(--muted);font-size:12px">Imported by others but do not import local files.</p>' + renderRows(analysis.importedOnly, ''), 190) +
      panel('unused', 'Unused / isolated', analysis.unused.length, renderRows(analysis.unused, ''), 170);
  }

  function renderBands() {
    let html = '<div class="outside-band" style="left:28px;top:22px;width:' + (analysis.layout.width - 56) + 'px;height:152px"><div class="band-title">outside imports / node_modules / links</div></div>';
    analysis.layout.levelBands.forEach((band) => {
      const label = band.level === 0 ? '· imported-only/deep dependencies' : band.level === analysis.layout.maxLevel ? '· importer/entry side' : '· middle layer';
      html += '<div class="level-band" style="left:0;top:' + band.y + 'px;width:' + analysis.layout.width + 'px;height:' + band.height + 'px"><div class="level-label">Level ' + band.level + ' ' + label + '</div></div>';
    });
    analysis.layout.folders.forEach((folder) => {
      html += '<div class="folder-lane" style="left:' + folder.x + 'px;top:' + folder.y + 'px;width:' + folder.width + 'px;height:' + folder.height + 'px;border-color:' + folder.color.border + ';background:' + folder.color.bg + '"><div class="folder-title" style="border-color:' + folder.color.border + ';color:' + folder.color.text + ';background:' + folder.color.soft + '">/' + escapeHtml(folder.folder) + '</div></div>';
    });
    return html;
  }

  function renderEdges(vset) {
    const related = relationSet(state.selected);
    const directOnly = state.edgeMode === 'direct';
    const filtered = analysis.edges.filter((edge) => {
      if (!vset.has(edge.from) || !vset.has(edge.to)) return false;
      if (!directOnly) return true;
      return edge.from === state.selected || edge.to === state.selected;
    }).slice(0, EDGE_LIMIT);

    let html = '<svg width="' + analysis.layout.width + '" height="' + analysis.layout.height + '"><defs>' +
      '<marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="#94a3b8" /></marker>' +
      '</defs>';

    filtered.forEach((edge, index) => {
      const fromPos = analysis.layout.positions[edge.from];
      const toPos = analysis.layout.positions[edge.to];
      if (!fromPos || !toPos) return;
      const active = state.selected && (edge.from === state.selected || edge.to === state.selected || (related.has(edge.from) && related.has(edge.to)));
      const loop = edge.kind === 'local' && isInCycle(edge.from) && isInCycle(edge.to);
      const color = edgeColor(edge, active, loop);
      html += '<path d="' + edgePath(fromPos, toPos, index) + '" fill="none" stroke="' + color + '" stroke-width="' + (active ? 2.8 : state.edgeMode === 'all' ? 1.25 : 1.8) + '" stroke-opacity="' + (active ? 0.98 : state.edgeMode === 'all' ? 0.23 : 0.7) + '" marker-end="url(#arrow)" />';
    });

    return html + '</svg>';
  }

  function renderNode(path) {
    const pos = analysis.layout.positions[path];
    const imports = analysis.importsByFile[path] || [];
    const importedBy = analysis.importedByFile[path] || [];
    const external = analysis.externalImports[path] || [];
    const exports = analysis.exportsByFile[path] || [];
    const loop = isInCycle(path);
    const topDependency = importedBy.length > 0 && imports.length === 0;
    const bottomImporter = importedBy.length === 0 && imports.length > 0;
    const unused = importedBy.length === 0 && imports.length === 0;
    const active = state.selected === path;
    const related = relationSet(state.selected);
    const dim = state.focusOnly && !related.has(path);
    const color = pos.color || { text: 'var(--purple)' };
    const classes = ['node', active ? 'active' : '', dim ? 'dim' : '', loop ? 'loop' : '', topDependency ? 'imported' : '', bottomImporter ? 'importer' : ''].filter(Boolean).join(' ');
    const dotColor = loop ? 'var(--red)' : topDependency ? 'var(--blue)' : bottomImporter ? 'var(--green)' : unused ? 'var(--faint)' : 'var(--purple)';

    return '<button class="' + classes + '" data-select="' + escapeHtml(path) + '" data-center-on-select="false" ' + (active ? 'data-active-node="true"' : '') + ' style="left:' + pos.x + 'px;top:' + pos.y + 'px">' +
      '<span class="side-stripe" style="background:' + color.text + '"></span><span class="port-top"></span><span class="port-bottom"></span>' +
      '<div class="node-title"><span class="small-dot" style="background:' + dotColor + '"></span><strong>' + escapeHtml(fileName(path)) + '</strong></div>' +
      '<div class="node-folder" style="color:' + color.text + '">/' + escapeHtml(folderOf(path)) + '</div>' +
      '<div class="node-meta"><span>↓ ' + imports.length + '</span><span>↗ ' + external.length + '</span><span>↑ ' + importedBy.length + '</span><span>ex ' + exports.length + '</span></div>' +
      '<div class="node-level">level ' + (analysis.levels[path] || 0) + '</div>' +
    '</button>';
  }

  function renderOutsideNode(node) {
    const pos = analysis.layout.positions[node.id];
    const active = state.selected === node.id;
    const related = relationSet(state.selected);
    const dim = state.focusOnly && !related.has(node.id);
    return '<button class="node outside ' + (active ? 'active ' : '') + (dim ? 'dim' : '') + '" data-select="' + escapeHtml(node.id) + '" data-center-on-select="false" ' + (active ? 'data-active-node="true"' : '') + ' style="left:' + pos.x + 'px;top:' + pos.y + 'px">' +
      '<span class="port-bottom" style="background:var(--orange)"></span>' +
      '<div class="node-title"><span class="small-dot" style="background:var(--orange)"></span><strong>' + (node.type === 'link' ? 'external link' : 'node_modules') + '</strong></div>' +
      '<div class="node-folder" style="color:var(--orange)">' + escapeHtml(node.label) + '</div>' +
      '<div class="node-level">imported by ' + node.importedBy.length + ' files</div>' +
    '</button>';
  }

  function renderGraph() {
    const vset = visibleSet();
    let html = '<div class="stats">' + analysis.nodes.length + ' files · ' + analysis.edges.length + ' imports · ' + analysis.outsideList.length + ' outside · ' + analysis.cycles.length + ' loops · ' + analysis.unused.length + ' isolated</div>';
    html += '<div class="legend-row"><div class="legend"><span><i class="dot" style="background:var(--orange)"></i>outside</span><span><i class="dot" style="background:var(--blue)"></i>imported-only</span><span><i class="dot" style="background:var(--purple)"></i>middle</span><span><i class="dot" style="background:var(--green)"></i>importer-only</span><span><i class="dot" style="background:var(--red)"></i>loop</span><span><i class="dot" style="background:var(--cyan);width:20px"></i>same-folder edge</span></div><!--<button class="btn primary" id="lookSelectedGraph">Look / find selected</button>--></div>';
    if (analysis.edges.length > EDGE_LIMIT && state.edgeMode === 'all' && !state.focusOnly && !state.search) {
      html += '<div style="border:1px solid #854d0e;background:rgba(113,63,18,.25);color:var(--yellow);padding:8px 10px;border-radius:12px;margin-bottom:8px;font-size:13px">Large graph: showing first ' + EDGE_LIMIT + ' edges. Use direct lines, search, or Focus selected.</div>';
    }
    html += '<div id="graphScroll" class="graph-scroll"><div class="graph-space" style="width:' + (analysis.layout.width * state.zoom) + 'px;height:' + (analysis.layout.height * state.zoom) + 'px"><div class="graph-inner" style="transform:scale(' + state.zoom + ');width:' + analysis.layout.width + 'px;height:' + analysis.layout.height + 'px">';
    html += '<div style="position:relative;width:' + analysis.layout.width + 'px;height:' + analysis.layout.height + 'px">' + renderBands() + renderEdges(vset);
    analysis.outsideList.forEach((node) => { if (vset.has(node.id)) html += renderOutsideNode(node); });
    analysis.nodes.forEach((path) => { if (vset.has(path)) html += renderNode(path); });
    html += '</div></div></div></div>';
    return html;
  }

  function render() {
    const savedGraphScroll = captureGraphScroll();
    document.body.className = state.theme === 'light' ? 'light' : '';
    app.innerHTML = '<div class="app">' +
      '<header><div class="top"><div><h1>Import / Export Graph Navigator</h1><div class="subtitle">' + escapeHtml(meta.projectPath) + '</div></div>' +
      '<div class="controls">' +
        '<button class="btn" id="themeBtn">' + (state.theme === 'light' ? 'Dark mode' : 'Light mode') + '</button>' +
        '<button class="btn" id="focusBtn">Focus selected: ' + (state.focusOnly ? 'on' : 'off') + '</button>' +
        '<button class="btn" id="linesBtn">Lines: ' + state.edgeMode + '</button>' +
        '<button class="btn primary" id="lookSelectedTop">Look selected</button>' +
        '<button class="btn" id="zoomOut">−</button><span style="color:var(--muted);min-width:48px;text-align:center">' + Math.round(state.zoom * 100) + '%</span><button class="btn" id="zoomIn">+</button>' +
        '<input id="search" value="' + escapeHtml(state.search) + '" placeholder="Search path/folder/package..." />' +
      '</div></div></header>' +
      '<main class="shell"><aside class="left">' + renderLeft() + '</aside><section class="graph-card">' + renderGraph() + '</section></main>' +
    '</div>';
    attachEvents();
    const pendingReveal = state.pendingReveal;
    state.pendingReveal = null;
    requestAnimationFrame(() => {
      restoreGraphScroll(savedGraphScroll);
      if (pendingReveal) requestAnimationFrame(() => revealSelectedNode(pendingReveal));
    });
  }

  function attachEvents() {
    document.querySelectorAll('[data-select]').forEach((el) => {
      el.addEventListener('click', () => {
        const reveal = el.getAttribute('data-center-on-select') !== 'false' ? 'nearest' : null;
        selectFile(el.getAttribute('data-select'), reveal);
      });
    });
    document.querySelectorAll('[data-panel]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-panel');
        state.openPanels[id] = !state.openPanels[id];
        render();
      });
    });
    document.getElementById('themeBtn').onclick = () => { captureGraphScroll(); state.theme = state.theme === 'dark' ? 'light' : 'dark'; render(); };
    document.getElementById('focusBtn').onclick = () => { captureGraphScroll(); state.focusOnly = !state.focusOnly; render(); };
    document.getElementById('linesBtn').onclick = () => { captureGraphScroll(); state.edgeMode = state.edgeMode === 'direct' ? 'all' : 'direct'; render(); };
    document.getElementById('zoomOut').onclick = () => { captureGraphScroll(); state.zoom = Math.max(0.3, +(state.zoom - 0.1).toFixed(2)); state.pendingReveal = 'nearest'; render(); };
    document.getElementById('zoomIn').onclick = () => { captureGraphScroll(); state.zoom = Math.min(1.6, +(state.zoom + 0.1).toFixed(2)); state.pendingReveal = 'nearest'; render(); };
    document.getElementById('search').oninput = (event) => { captureGraphScroll(); state.search = event.target.value; render(); };
    ['lookSelectedGraph', 'lookSelectedSide'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.onclick = lookSelectedNode;
    });
  }

  render();
})();
  `;
}

module.exports = {
  buildHtml,
};
