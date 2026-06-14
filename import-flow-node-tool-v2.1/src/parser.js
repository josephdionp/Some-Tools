const { VALID_EXTENSIONS } = require('./config');
const { dirname, joinPath, normalizePath } = require('./path-utils');

function extractImports(content) {
  const imports = [];
  const patterns = [
    /import\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)?["'`]([^"'`]+)["'`]/g,
    /export\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)["'`]([^"'`]+)["'`]/g,
    /import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
    /require\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) imports.push(match[1]);
  }

  return [...new Set(imports)];
}

function extractExports(content) {
  const names = [];
  const patterns = [
    /export\s+default\s+/g,
    /export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g,
    /export\s*\{([^}]+)\}/g,
  ];

  let match;
  while ((match = patterns[0].exec(content))) names.push('default');
  while ((match = patterns[1].exec(content))) names.push(match[1]);
  while ((match = patterns[2].exec(content))) {
    match[1]
      .split(',')
      .map((part) => part.trim().split(/\s+as\s+/)[1] || part.trim().split(/\s+as\s+/)[0])
      .filter(Boolean)
      .forEach((name) => names.push(name));
  }

  return [...new Set(names)];
}

function resolveImport(fromPath, specifier, fileMap) {
  if (!specifier.startsWith('.')) return null;

  const base = dirname(fromPath);
  const raw = joinPath(base, specifier);
  const candidates = [
    raw,
    ...VALID_EXTENSIONS.map((ext) => raw + ext),
    ...VALID_EXTENSIONS.map((ext) => `${raw}/index${ext}`),
  ].map(normalizePath);

  return candidates.find((candidate) => fileMap.has(candidate)) || null;
}

function outsideImportId(specifier) {
  if (/^https?:\/\//.test(specifier)) return `link:${specifier}`;
  if (specifier.startsWith('@')) return `pkg:${specifier.split('/').slice(0, 2).join('/')}`;
  return `pkg:${specifier.split('/')[0]}`;
}

function outsideLabel(id) {
  return id.replace(/^pkg:/, 'node_modules: ').replace(/^link:/, 'link: ');
}

module.exports = {
  extractImports,
  extractExports,
  resolveImport,
  outsideImportId,
  outsideLabel,
};
