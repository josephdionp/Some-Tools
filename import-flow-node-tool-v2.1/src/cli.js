const path = require('path');
const childProcess = require('child_process');

function parseArgs(argv) {
  const args = {
    projectPath: '.',
    out: 'import-flow-report.html',
    open: false,
    maxFiles: 8000,
  };

  const rest = [...argv];
  while (rest.length) {
    const current = rest.shift();

    if (current === '--out') args.out = rest.shift() || args.out;
    else if (current === '--open') args.open = true;
    else if (current === '--max-files') args.maxFiles = Number(rest.shift()) || args.maxFiles;
    else if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    } else if (!current.startsWith('--')) {
      args.projectPath = current;
    }
  }

  args.projectPath = path.resolve(args.projectPath);
  args.out = path.resolve(process.cwd(), args.out);
  return args;
}

function printHelp() {
  console.log(`Import Flow Visualizer\n\nUsage:\n  node import-flow.js [projectPath] [--out report.html] [--open] [--max-files 8000]\n\nExamples:\n  node import-flow.js . --open\n  node import-flow.js ../my-app --out my-app-flow.html --open\n`);
}

function openFile(filePath) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      childProcess.spawn('open', [filePath], { detached: true, stdio: 'ignore' }).unref();
    } else if (platform === 'win32') {
      childProcess.spawn('cmd', ['/c', 'start', '', filePath], { detached: true, stdio: 'ignore' }).unref();
    } else {
      childProcess.spawn('xdg-open', [filePath], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    // Browser opening is convenience-only. Report file is still written.
  }
}

module.exports = {
  parseArgs,
  openFile,
};
