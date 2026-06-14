#!/usr/bin/env node
/*
  Import Flow Visualizer
  Dependency-free local Node script that scans a JS/TS project and writes an interactive HTML graph.

  Usage:
    node import-flow.js /path/to/project --open
    node import-flow.js . --out import-flow-report.html
*/

const fs = require('fs');
const { parseArgs, openFile } = require('./src/cli');
const { scanFiles } = require('./src/scanner');
const { buildAnalysis } = require('./src/analyzer');
const { buildHtml } = require('./src/render/html');

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.projectPath) || !fs.statSync(args.projectPath).isDirectory()) {
    console.error(`Project path is not a directory: ${args.projectPath}`);
    process.exit(1);
  }

  console.log(`Scanning: ${args.projectPath}`);
  const files = scanFiles(args.projectPath, args.maxFiles);
  console.log(`Found ${files.length} supported files.`);

  const analysis = buildAnalysis(files);
  const html = buildHtml(analysis, {
    projectPath: args.projectPath,
    generatedAt: new Date().toISOString(),
    maxFiles: args.maxFiles,
  });

  fs.writeFileSync(args.out, html, 'utf8');
  console.log(`Wrote: ${args.out}`);
  console.log(`Stats: ${analysis.nodes.length} files, ${analysis.edges.length} imports, ${analysis.outsideList.length} outside, ${analysis.cycles.length} loops, ${analysis.unused.length} isolated.`);

  if (args.open) openFile(args.out);
}

main();
