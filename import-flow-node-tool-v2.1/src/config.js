const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css'];
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  '.cache',
  'out',
]);

const LAYOUT = {
  NODE_W: 232,
  NODE_H: 96,
  NODE_X_GAP: 30,
  FOLDER_PAD: 28,
  FOLDER_GAP: 58,
  Y_GAP: 168,
  TOP_EXTERNAL_Y: 58,
  TOP_PROJECT_Y: 245,
  EDGE_LIMIT: 4000,
};

module.exports = {
  VALID_EXTENSIONS,
  IGNORED_DIRS,
  LAYOUT,
};
