const { LAYOUT } = require('./config');
const { fileName, folderOf } = require('./path-utils');

function folderColor(folder) {
  let hash = 0;
  for (let i = 0; i < folder.length; i += 1) hash = (hash * 31 + folder.charCodeAt(i)) % 360;
  const hue = (hash + 170) % 360;
  return {
    border: `hsla(${hue}, 72%, 58%, 0.42)`,
    bg: `hsla(${hue}, 72%, 48%, 0.08)`,
    soft: `hsla(${hue}, 72%, 58%, 0.16)`,
    text: `hsl(${hue}, 90%, 78%)`,
  };
}

function buildLayout(nodes, outsideNodes, levels) {
  const positions = new Map();
  const folderLevelMap = new Map();
  let maxLevel = 0;

  for (const node of nodes) {
    const folder = folderOf(node);
    const level = levels.get(node) || 0;
    maxLevel = Math.max(maxLevel, level);

    if (!folderLevelMap.has(folder)) folderLevelMap.set(folder, new Map());
    if (!folderLevelMap.get(folder).has(level)) folderLevelMap.get(folder).set(level, []);
    folderLevelMap.get(folder).get(level).push(node);
  }

  const folders = [...folderLevelMap.keys()].sort((a, b) => {
    const depthDiff = a.split('/').length - b.split('/').length;
    return depthDiff || a.localeCompare(b);
  });

  const folderBoxes = [];
  let x = 48;

  for (const folder of folders) {
    const levelsInFolder = folderLevelMap.get(folder);
    let maxCount = 1;
    for (const files of levelsInFolder.values()) maxCount = Math.max(maxCount, files.length);

    const width = Math.max(
      290,
      LAYOUT.FOLDER_PAD * 2 + maxCount * LAYOUT.NODE_W + Math.max(0, maxCount - 1) * LAYOUT.NODE_X_GAP
    );
    const color = folderColor(folder);

    folderBoxes.push({
      folder,
      x,
      y: LAYOUT.TOP_PROJECT_Y - 62,
      width,
      height: (maxLevel + 1) * LAYOUT.Y_GAP + LAYOUT.NODE_H + 90,
      color,
    });

    for (const [level, files] of levelsInFolder.entries()) {
      files.sort((a, b) => fileName(a).localeCompare(fileName(b)));
      files.forEach((file, index) => {
        positions.set(file, {
          id: file,
          x: x + LAYOUT.FOLDER_PAD + index * (LAYOUT.NODE_W + LAYOUT.NODE_X_GAP),
          y: LAYOUT.TOP_PROJECT_Y + level * LAYOUT.Y_GAP,
          kind: 'file',
          folder,
          color,
        });
      });
    }

    x += width + LAYOUT.FOLDER_GAP;
  }

  const projectWidth = Math.max(1180, x + 48);
  const outsideSorted = outsideNodes.sort((a, b) => a.label.localeCompare(b.label));
  outsideSorted.forEach((node, index) => {
    positions.set(node.id, {
      id: node.id,
      x: 48 + index * (LAYOUT.NODE_W + LAYOUT.NODE_X_GAP),
      y: LAYOUT.TOP_EXTERNAL_Y,
      kind: 'outside',
    });
  });

  const outsideWidth = outsideSorted.length ? 96 + outsideSorted.length * (LAYOUT.NODE_W + LAYOUT.NODE_X_GAP) : 1180;
  const width = Math.max(projectWidth, outsideWidth);
  const height = LAYOUT.TOP_PROJECT_Y + (maxLevel + 1) * LAYOUT.Y_GAP + LAYOUT.NODE_H + 150;

  const levelBands = Array.from({ length: maxLevel + 1 }, (_, level) => ({
    level,
    y: LAYOUT.TOP_PROJECT_Y + level * LAYOUT.Y_GAP - 28,
    height: LAYOUT.Y_GAP - 20,
  }));

  return { positions: Object.fromEntries(positions), width, height, folders: folderBoxes, levelBands, maxLevel };
}

module.exports = {
  buildLayout,
  folderColor,
};
