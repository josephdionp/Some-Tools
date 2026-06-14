const fs = require('fs');
const path = require('path');
const { VALID_EXTENSIONS, IGNORED_DIRS } = require('./config');
const { normalizePath } = require('./path-utils');

function shouldInclude(relativePath) {
  const clean = normalizePath(relativePath);
  const parts = clean.split('/');

  if (parts.some((part) => IGNORED_DIRS.has(part))) return false;
  return VALID_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

function scanFiles(rootDir, maxFiles = 8000) {
  const files = [];

  function walk(dir) {
    if (files.length >= maxFiles) return;

    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (files.length >= maxFiles) break;

      if (entry.name.startsWith('.') && entry.name !== '.storybook' && entry.name !== '.vscode') {
        continue;
      }

      const full = path.join(dir, entry.name);
      const rel = normalizePath(path.relative(rootDir, full));

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(full);
      } else if (entry.isFile() && shouldInclude(rel)) {
        let content = '';
        try {
          content = fs.readFileSync(full, 'utf8');
        } catch {
          content = '';
        }
        files.push({ path: rel, content });
      }
    }
  }

  walk(rootDir);
  return files;
}

module.exports = {
  scanFiles,
  shouldInclude,
};
