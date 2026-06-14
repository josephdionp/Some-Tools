function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, '/').replace(/^\.\//, '');
}

function dirname(filePath) {
  const clean = normalizePath(filePath);
  const index = clean.lastIndexOf('/');
  return index === -1 ? '' : clean.slice(0, index);
}

function folderOf(filePath) {
  const dir = dirname(filePath);
  return dir || 'root';
}

function fileName(filePath) {
  return String(filePath).split('/').pop();
}

function joinPath(base, target) {
  const parts = `${base}/${target}`.split('/');
  const out = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }

  return out.join('/');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

module.exports = {
  normalizePath,
  dirname,
  folderOf,
  fileName,
  joinPath,
  htmlEscape,
  safeJson,
};
