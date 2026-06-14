# Import Flow Node Tool

Dependency-free local Node script for visualizing JS/TS import/export flow.

## Run

```bash
node import-flow.js /path/to/project --open
```

From inside the project you want to inspect:

```bash
node /path/to/import-flow-node-tool/import-flow.js . --open
```

Output defaults to:

```txt
import-flow-report.html
```

## Options

```bash
node import-flow.js [projectPath] [--out report.html] [--open] [--max-files 8000]
```

## What it does

- Scans `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, and `.css` files.
- Ignores `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`, `.turbo`, `.cache`, and `out`.
- Shows one node per file.
- Keeps same-folder files together in folder lanes.
- Puts external packages/links at the top.
- Puts imported-only/dependency files near the top.
- Puts importer/entry/root-like files near the bottom.
- Detects simple circular imports.
- Shows unused/isolated files.
- Includes dark/light mode, zoom, focus selected, direct/all edges, and file explorer.

## New in v0.2.0

- Refactored from one large script into modules under `src/`.
- Added **Look selected** / **Look find selected** controls.
- Selecting files from the left explorer or side panels now scrolls the graph to the selected node.
- Selected node flashes with a spotlight animation.
- Zoom keeps the selected node centered.

## Limits

- Import/export parsing uses regex, not a full AST parser.
- Relative imports are resolved.
- TypeScript path aliases like `@/components/Button` are currently treated as external packages unless they are configured in a future version.
- Dynamic/computed imports are not fully resolved.


## v2.1 minor update

- File selection from the left panel now reveals the selected node relative to the current graph viewport instead of effectively jumping from the graph origin.
- The current graph scroll position is preserved across selection, theme, line mode, focus, search, and zoom rerenders.
- Look / find selected now uses nearest-edge reveal behavior and flashes the node.
- Only `src/render/html.js` changed from v2.
