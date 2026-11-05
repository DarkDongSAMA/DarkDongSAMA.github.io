/*
 * 卡比的美食比赛 · 核心逻辑
 * 不依赖 DOM，可在浏览器（window.LLK）或 Node.js（module.exports）中使用。
 *
 * 棋盘坐标：row 从 0 开始，col 从 0 开始。
 * 寻路坐标在棋盘外增加一圈虚拟边框，因此路径可以绕到棋盘外面。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.LLK = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_SIZE = Object.freeze({ cols: 12, rows: 10, colors: 8 });

  function shuffle(items, rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function createBoard(cols, rows, colorCount, rng) {
    const width = Number.isInteger(cols) ? cols : DEFAULT_SIZE.cols;
    const height = Number.isInteger(rows) ? rows : DEFAULT_SIZE.rows;
    const paletteSize = Number.isInteger(colorCount) ? colorCount : DEFAULT_SIZE.colors;

    if (width < 2 || height < 2) throw new Error("棋盘至少需要 2×2。");
    if (paletteSize < 1) throw new Error("至少需要一种颜色。");
    if ((width * height) % 2 !== 0) throw new Error("棋盘格子数必须是偶数。");

    const bag = [];
    const pairCount = (width * height) / 2;
    for (let i = 0; i < pairCount; i += 1) {
      const color = i % paletteSize;
      bag.push(color, color);
    }
    shuffle(bag, rng);

    const board = [];
    let index = 0;
    for (let row = 0; row < height; row += 1) {
      const line = [];
      for (let col = 0; col < width; col += 1) {
        line.push(bag[index]);
        index += 1;
      }
      board.push(line);
    }
    return board;
  }

  function boardSize(board) {
    return {
      rows: board.length,
      cols: board[0] ? board[0].length : 0,
    };
  }

  /**
   * 按棋谱蒙版生成棋盘。蒙版中的 1 为色块格，0 为空洞。
   * 空洞不生成色块，但寻路时可以作为空格通过。
   */
  function createBoardFromMask(mask, colorCount, rng) {
    if (!Array.isArray(mask) || mask.length < 2 || !Array.isArray(mask[0])) {
      throw new Error("棋谱蒙版格式不正确。");
    }
    const rows = mask.length;
    const cols = mask[0].length;
    if (cols < 2) throw new Error("棋谱至少需要 2 列。");
    for (const row of mask) {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new Error("棋谱每一行的长度必须一致。");
      }
    }

    const positions = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (mask[row][col]) positions.push({ row, col });
      }
    }
    if (positions.length < 2) throw new Error("棋谱至少需要两个色块。");
    if (positions.length % 2 !== 0) throw new Error("棋谱的色块数必须是偶数。");

    const paletteSize = Number.isInteger(colorCount) ? colorCount : DEFAULT_SIZE.colors;
    if (paletteSize < 1) throw new Error("至少需要一种颜色。");

    const bag = [];
    const pairCount = positions.length / 2;
    for (let i = 0; i < pairCount; i += 1) {
      const color = i % paletteSize;
      bag.push(color, color);
    }
    shuffle(bag, rng);

    const board = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (let i = 0; i < positions.length; i += 1) {
      const position = positions[i];
      board[position.row][position.col] = bag[i];
    }
    return board;
  }

  function isInside(board, row, col) {
    return (
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      col >= 0 &&
      row < board.length &&
      col < board[row].length
    );
  }

  function countRemaining(board) {
    let remaining = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell !== null && cell !== undefined) remaining += 1;
      }
    }
    return remaining;
  }

  function colorCounts(board) {
    const counts = new Map();
    for (const row of board) {
      for (const cell of row) {
        if (cell === null || cell === undefined) continue;
        counts.set(cell, (counts.get(cell) || 0) + 1);
      }
    }
    return counts;
  }

  /**
   * 返回一条最多两个转弯的路径；找不到则返回 null。
   * 返回结构：{ points: [{x,y}...], turns, length }
   */
  function findPath(board, a, b, options) {
    const opts = options || {};
    if (!isInside(board, a.row, a.col) || !isInside(board, b.row, b.col)) return null;
    if (a.row === b.row && a.col === b.col) return null;

    const colorA = board[a.row][a.col];
    const colorB = board[b.row][b.col];
    if (colorA === null || colorA === undefined) return null;
    if (colorB === null || colorB === undefined) return null;
    if (!opts.ignoreColor && colorA !== colorB) return null;

    const rows = board.length;
    const cols = board[0].length;
    const virtualWidth = cols + 2;
    const virtualHeight = rows + 2;

    const isBorder = (x, y) =>
      x === 0 || y === 0 || x === virtualWidth - 1 || y === virtualHeight - 1;

    const isEmptyAt = (x, y) => {
      if (x < 0 || y < 0 || x >= virtualWidth || y >= virtualHeight) return false;
      if (isBorder(x, y)) return true;
      const value = board[y - 1][x - 1];
      return value === null || value === undefined;
    };

    const lineClear = (x1, y1, x2, y2) => {
      if (x1 !== x2 && y1 !== y2) return false;
      const dx = Math.sign(x2 - x1);
      const dy = Math.sign(y2 - y1);
      let x = x1 + dx;
      let y = y1 + dy;
      while (x !== x2 || y !== y2) {
        if (!isEmptyAt(x, y)) return false;
        x += dx;
        y += dy;
      }
      return true;
    };

    const stripCollinear = (rawPoints) => {
      const points = [];
      for (const point of rawPoints) {
        const last = points[points.length - 1];
        if (last && last.x === point.x && last.y === point.y) continue;
        while (points.length >= 2) {
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          const sameLine =
            (p1.x === p2.x && p2.x === point.x) ||
            (p1.y === p2.y && p2.y === point.y);
          if (!sameLine) break;
          points.pop();
        }
        points.push({ x: point.x, y: point.y });
      }
      return points;
    };

    const pathLength = (points) => {
      let total = 0;
      for (let i = 1; i < points.length; i += 1) {
        total +=
          Math.abs(points[i].x - points[i - 1].x) +
          Math.abs(points[i].y - points[i - 1].y);
      }
      return total;
    };

    const makeResult = (rawPoints) => {
      const points = stripCollinear(rawPoints);
      const turns = points.length - 2;
      if (turns > 2) return null;
      return { points, turns, length: pathLength(points) };
    };

    const start = { x: a.col + 1, y: a.row + 1 };
    const end = { x: b.col + 1, y: b.row + 1 };

    // 一条直线。
    if (
      (start.x === end.x || start.y === end.y) &&
      lineClear(start.x, start.y, end.x, end.y)
    ) {
      return makeResult([start, end]);
    }

    // 一次转弯的两个候选直角。
    const oneTurnPaths = (from, to) => {
      const candidates = [];
      if (
        (from.x === to.x || from.y === to.y) &&
        lineClear(from.x, from.y, to.x, to.y)
      ) {
        candidates.push([from, to]);
      }

      const corners = [
        { x: from.x, y: to.y },
        { x: to.x, y: from.y },
      ];
      for (const corner of corners) {
        if (
          (corner.x === from.x && corner.y === from.y) ||
          (corner.x === to.x && corner.y === to.y)
        ) {
          continue;
        }
        if (!isEmptyAt(corner.x, corner.y)) continue;
        if (!lineClear(from.x, from.y, corner.x, corner.y)) continue;
        if (!lineClear(corner.x, corner.y, to.x, to.y)) continue;
        candidates.push([from, corner, to]);
      }
      return candidates;
    };

    let best = null;
    const consider = (candidate) => {
      if (!candidate) return;
      if (
        !best ||
        candidate.length < best.length ||
        (candidate.length === best.length && candidate.turns < best.turns)
      ) {
        best = candidate;
      }
    };

    for (const points of oneTurnPaths(start, end)) {
      consider(makeResult(points));
    }
    // 直线或一个转弯已经是最短量级，不必继续找两个转弯。
    if (best) return best;

    // 两个转弯：枚举第一段直线到达的空格，再接一段最多一个转弯的路径。
    for (let y = 0; y < virtualHeight; y += 1) {
      for (let x = 0; x < virtualWidth; x += 1) {
        if ((x === start.x && y === start.y) || (x === end.x && y === end.y)) {
          continue;
        }
        if (!isEmptyAt(x, y)) continue;
        if (!lineClear(start.x, start.y, x, y)) continue;
        const pivot = { x, y };
        const tails = oneTurnPaths(pivot, end);
        for (const tail of tails) {
          // tail[0] 是 pivot，必须一起保留，否则 start→下一个点可能变成斜线。
          consider(makeResult([start, ...tail]));
        }
      }
    }

    return best;
  }

  function getAllPositions(board) {
    const positions = [];
    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        const color = board[row][col];
        if (color !== null && color !== undefined) {
          positions.push({ row, col, color });
        }
      }
    }
    return positions;
  }

  /** 找出全部当前可消除的同色对。 */
  function findAvailableMoves(board) {
    const byColor = new Map();
    for (const position of getAllPositions(board)) {
      if (!byColor.has(position.color)) byColor.set(position.color, []);
      byColor.get(position.color).push(position);
    }

    const moves = [];
    for (const positions of byColor.values()) {
      for (let i = 0; i < positions.length; i += 1) {
        for (let j = i + 1; j < positions.length; j += 1) {
          const path = findPath(board, positions[i], positions[j]);
          if (path) {
            moves.push({
              a: { row: positions[i].row, col: positions[i].col },
              b: { row: positions[j].row, col: positions[j].col },
              color: positions[i].color,
              path,
            });
          }
        }
      }
    }
    return moves;
  }

  function hasMoves(board) {
    return findAvailableMoves(board).length > 0;
  }

  /**
   * 找一对“位置上能连通”的格子（忽略颜色）。
   * 用于重排时先锚定一对同色块，保证重排后一定有解。
   */
  function findConnectablePositionPair(board, rng) {
    const positions = getAllPositions(board).map(({ row, col }) => ({ row, col }));
    shuffle(positions, rng);

    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const path = findPath(board, positions[i], positions[j], { ignoreColor: true });
        if (path) return [positions[i], positions[j], path];
      }
    }
    return null;
  }

  /**
   * 重排剩余色块的颜色：先把一对可连通位置固定成同色，再随机分配其余颜色。
   * 只要棋盘上还有至少一对可连位置，重排后就一定存在可消除对。
   */
  function reshuffleColors(board, rng) {
    const positions = getAllPositions(board);
    if (positions.length < 2) return true;

    const anchor = findConnectablePositionPair(board, rng);
    if (!anchor) return false;

    const [first, second] = anchor;
    const counts = colorCounts(board);
    const availableColors = [];
    for (const [color, count] of counts) {
      if (count >= 2) availableColors.push(color);
    }
    if (availableColors.length === 0) return false;

    const random = typeof rng === "function" ? rng : Math.random;
    const anchorColor = availableColors[Math.floor(random() * availableColors.length)];

    const remainingColors = [];
    for (const [color, count] of counts) {
      for (let i = 0; i < count; i += 1) remainingColors.push(color);
    }
    for (let i = 0; i < 2; i += 1) {
      const index = remainingColors.indexOf(anchorColor);
      if (index >= 0) remainingColors.splice(index, 1);
    }
    shuffle(remainingColors, rng);

    const restPositions = positions.filter(
      (position) =>
        !(position.row === first.row && position.col === first.col) &&
        !(position.row === second.row && position.col === second.col)
    );

    board[first.row][first.col] = anchorColor;
    board[second.row][second.col] = anchorColor;
    for (let i = 0; i < restPositions.length; i += 1) {
      board[restPositions[i].row][restPositions[i].col] = remainingColors[i];
    }
    return true;
  }

  /** 随机生成初始棋盘，并保证开局至少有一对可消除。 */
  function createPlayableBoard(cols, rows, colorCount, rng) {
    const board = createBoard(cols, rows, colorCount, rng);
    if (!hasMoves(board)) {
      if (!reshuffleColors(board, rng)) {
        throw new Error("无法生成可解棋盘。");
      }
    }
    return board;
  }

  /** 按棋谱蒙版生成初始棋盘，并保证开局至少有一对可消除。 */
  function createPlayableBoardFromMask(mask, colorCount, rng) {
    const board = createBoardFromMask(mask, colorCount, rng);
    if (!hasMoves(board)) {
      if (!reshuffleColors(board, rng)) {
        throw new Error("无法生成可解棋谱。");
      }
    }
    return board;
  }

  /**
   * 重排剩余色块，并让约 1/4 的色块组成“同色并列对”。
   * 优先使用水平相邻格，水平不够时用垂直相邻格补齐。
   * 返回新棋盘、实际并列对数量和被重排的色块总数。
   */
  function rearrangeWithAdjacentPairs(board, mask, options) {
    const opts = options || {};
    const random = typeof opts.rng === "function" ? opts.rng : Math.random;
    const ratio = typeof opts.ratio === "number" ? opts.ratio : 0.25;

    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    if (!Array.isArray(mask) || mask.length !== rows) {
      throw new Error("重排蒙版与棋盘行数不一致。");
    }
    for (const row of mask) {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new Error("重排蒙版与棋盘列数不一致。");
      }
    }

    const tileCount = countRemaining(board);
    if (tileCount < 2) return null;

    const activeCells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (mask[row][col]) activeCells.push({ row, col });
      }
    }
    if (activeCells.length < tileCount) {
      throw new Error("重排蒙版的活动格不足。");
    }

    const counts = colorCounts(board);
    const pairColors = [];
    for (const [color, count] of counts) {
      for (let i = 0; i < Math.floor(count / 2); i += 1) pairColors.push(color);
    }
    if (!pairColors.length) return null;

    const desiredPairs = Math.max(1, Math.floor((tileCount * ratio) / 2));
    const targetPairs = Math.min(
      pairColors.length,
      desiredPairs,
      Math.floor(activeCells.length / 2)
    );

    // 先尝试水平并列；不够时再用垂直相邻格补齐。
    const horizontal = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols - 1; col += 1) {
        if (mask[row][col] && mask[row][col + 1]) {
          horizontal.push({
            a: { row, col },
            b: { row, col: col + 1 },
          });
        }
      }
    }
    shuffle(horizontal, random);

    const selectedPairs = [];
    const usedCells = new Set();
    const takePair = (pair) => {
      const aKey = `${pair.a.row}:${pair.a.col}`;
      const bKey = `${pair.b.row}:${pair.b.col}`;
      if (usedCells.has(aKey) || usedCells.has(bKey)) return false;
      usedCells.add(aKey);
      usedCells.add(bKey);
      selectedPairs.push(pair);
      return true;
    };

    for (const pair of horizontal) {
      if (selectedPairs.length >= targetPairs) break;
      takePair(pair);
    }

    if (selectedPairs.length < targetPairs) {
      const vertical = [];
      for (let row = 0; row < rows - 1; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (mask[row][col] && mask[row + 1][col]) {
            vertical.push({
              a: { row, col },
              b: { row: row + 1, col },
            });
          }
        }
      }
      shuffle(vertical, random);
      for (const pair of vertical) {
        if (selectedPairs.length >= targetPairs) break;
        takePair(pair);
      }
    }

    if (!selectedPairs.length) return null;

    shuffle(pairColors, random);
    const pairedColors = pairColors.slice(0, selectedPairs.length);

    const remainingColors = [];
    for (const [color, count] of counts) {
      for (let i = 0; i < count; i += 1) remainingColors.push(color);
    }
    for (const color of pairedColors) {
      for (let removed = 0; removed < 2; removed += 1) {
        const index = remainingColors.indexOf(color);
        if (index >= 0) remainingColors.splice(index, 1);
      }
    }
    shuffle(remainingColors, random);

    const restCells = shuffle(
      activeCells.filter(
        (cell) => !usedCells.has(`${cell.row}:${cell.col}`)
      ),
      random
    );
    const restNeeded = tileCount - selectedPairs.length * 2;
    if (remainingColors.length !== restNeeded || restCells.length < restNeeded) {
      throw new Error("重排时色块数量不一致。");
    }

    const nextBoard = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (let i = 0; i < selectedPairs.length; i += 1) {
      const pair = selectedPairs[i];
      const color = pairedColors[i];
      nextBoard[pair.a.row][pair.a.col] = color;
      nextBoard[pair.b.row][pair.b.col] = color;
    }
    for (let i = 0; i < restNeeded; i += 1) {
      const cell = restCells[i];
      nextBoard[cell.row][cell.col] = remainingColors[i];
    }

    if (countRemaining(nextBoard) !== tileCount) {
      throw new Error("重排后色块数量不守恒。");
    }
    if (!hasMoves(nextBoard)) {
      reshuffleColors(nextBoard, random);
    }

    return {
      board: nextBoard,
      pairCount: selectedPairs.length,
      targetPairCount: targetPairs,
      tileCount,
    };
  }

  /**
   * 随机挑选最多 count 个方块，让它们各自在原地旁边的一个空格生成同色方块。
   * 为保持每种颜色数量仍为偶数，同一种颜色只会分裂偶数次（2 或 4 次）。
   * 返回新棋盘和分裂信息；没有可用空间时返回 null。
   */
  function splitTilesIntoAdjacentPairs(board, mask, options) {
    const opts = options || {};
    const random = typeof opts.rng === "function" ? opts.rng : Math.random;
    const desiredSplits = Number.isInteger(opts.count) ? opts.count : 4;
    const blocked = new Set(opts.blocked || []);

    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    if (!Array.isArray(mask) || mask.length !== rows) {
      throw new Error("分裂蒙版与棋盘行数不一致。");
    }
    for (const row of mask) {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new Error("分裂蒙版与棋盘列数不一致。");
      }
    }
    if (desiredSplits < 2) return null;

    const emptyAt = (row, col) =>
      row >= 0 &&
      row < rows &&
      col >= 0 &&
      col < cols &&
      Boolean(mask[row][col]) &&
      board[row][col] === null &&
      !blocked.has(`${row}:${col}`);

    const groups = new Map();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const color = board[row][col];
        if (color === null || color === undefined) continue;
        if (blocked.has(`${row}:${col}`)) continue;
        const emptyNeighbors = [];
        for (const [dy, dx] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          const nextRow = row + dy;
          const nextCol = col + dx;
          if (emptyAt(nextRow, nextCol)) {
            emptyNeighbors.push({ row: nextRow, col: nextCol });
          }
        }
        if (!emptyNeighbors.length) continue;
        if (!groups.has(color)) groups.set(color, []);
        groups.get(color).push({ row, col, color, emptyNeighbors });
      }
    }
    if (!groups.size) return null;

    const cellKey = (cell) => `${cell.row}:${cell.col}`;

    const buildPlan = (color, count, reserved, usedSources) => {
      const cells = shuffle(groups.get(color).slice(), random);
      const placements = [];
      for (const cell of cells) {
        if (placements.length >= count) break;
        const sourceKey = cellKey(cell);
        if (usedSources.has(sourceKey)) continue;
        const targets = shuffle(cell.emptyNeighbors.slice(), random).filter(
          (target) => !reserved.has(cellKey(target))
        );
        if (!targets.length) continue;
        const target = targets[0];
        reserved.add(cellKey(target));
        usedSources.add(sourceKey);
        placements.push({
          source: { row: cell.row, col: cell.col },
          target,
          color,
        });
      }
      return placements;
    };

    const colors = shuffle([...groups.keys()], random);
    let chosen = [];

    // 优先让同一种颜色分裂 4 次。
    if (desiredSplits >= 4) {
      for (const color of colors) {
        const reserved = new Set();
        const used = new Set();
        const placements = buildPlan(color, 4, reserved, used);
        if (placements.length === 4) {
          chosen = placements;
          break;
        }
      }
    }

    // 否则选两种颜色，各分裂 2 次。
    if (!chosen.length && desiredSplits >= 4) {
      for (let i = 0; i < colors.length && !chosen.length; i += 1) {
        for (let j = i + 1; j < colors.length; j += 1) {
          const reserved = new Set();
          const used = new Set();
          const first = buildPlan(colors[i], 2, reserved, used);
          if (first.length !== 2) continue;
          const second = buildPlan(colors[j], 2, reserved, used);
          if (second.length !== 2) continue;
          chosen = [...first, ...second];
          break;
        }
      }
    }

    // 最后退而求其次，只分裂 2 次。
    if (!chosen.length) {
      for (const color of colors) {
        const reserved = new Set();
        const used = new Set();
        const placements = buildPlan(color, 2, reserved, used);
        if (placements.length === 2) {
          chosen = placements;
          break;
        }
      }
    }

    if (!chosen.length) return null;

    const nextBoard = board.map((row) => row.slice());
    for (const split of chosen) {
      nextBoard[split.target.row][split.target.col] = split.color;
    }

    return {
      board: nextBoard,
      splits: chosen,
      addedTiles: chosen.length,
      tileCount: countRemaining(nextBoard),
    };
  }

  /**
   * 随机选择若干对同色方块，与棋盘上已有的相邻格对交换位置，
   * 让每个被选中的色对最终落在相邻的两个活动格里。
   * 不增删方块，只交换颜色。
   */
  function swapPairsIntoAdjacent(board, mask, options) {
    const opts = options || {};
    const random = typeof opts.rng === "function" ? opts.rng : Math.random;
    const requested = Math.max(1, Math.floor(opts.count || 4));
    const blocked = new Set(opts.blocked || []);
    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    if (!Array.isArray(mask) || mask.length !== rows) {
      throw new Error("换位蒙版与棋盘行数不一致。");
    }
    for (const row of mask) {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new Error("换位蒙版与棋盘列数不一致。");
      }
    }

    const cellsByColor = new Map();
    const activeCells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (!mask[row][col]) continue;
        const color = board[row][col];
        if (color === null || color === undefined) continue;
        if (blocked.has(`${row}:${col}`)) continue;
        if (!cellsByColor.has(color)) cellsByColor.set(color, []);
        cellsByColor.get(color).push({ row, col });
        activeCells.push({ row, col });
      }
    }
    if (activeCells.length < 2) return null;

    const colorCandidates = shuffle(
      [...cellsByColor.entries()].filter(([, cells]) => cells.length >= 2),
      random
    );
    const sourcePairs = [];
    for (const [color, cells] of colorCandidates) {
      if (sourcePairs.length >= requested) break;
      const picked = shuffle(cells.slice(), random).slice(0, 2);
      sourcePairs.push({ color, cells: picked });
    }
    if (!sourcePairs.length) return null;
    const sourceKeys = new Set();
    for (const pair of sourcePairs) {
      for (const cell of pair.cells) sourceKeys.add(`${cell.row}:${cell.col}`);
    }

    const adjacentPairs = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (!mask[row][col] || board[row][col] === null) continue;
        if (blocked.has(`${row}:${col}`)) continue;
        if (col + 1 < cols && mask[row][col + 1] && board[row][col + 1] !== null) {
          if (!blocked.has(`${row}:${col + 1}`)) {
            adjacentPairs.push({
              a: { row, col },
              b: { row, col: col + 1 },
            });
          }
        }
        if (row + 1 < rows && mask[row + 1][col] && board[row + 1][col] !== null) {
          if (!blocked.has(`${row + 1}:${col}`)) {
            adjacentPairs.push({
              a: { row, col },
              b: { row: row + 1, col },
            });
          }
        }
      }
    }
    shuffle(adjacentPairs, random);

    const targetPairs = [];
    const usedTargetCells = new Set();
    for (const pair of adjacentPairs) {
      if (targetPairs.length >= sourcePairs.length) break;
      const aKey = `${pair.a.row}:${pair.a.col}`;
      const bKey = `${pair.b.row}:${pair.b.col}`;
      if (
        sourceKeys.has(aKey) ||
        sourceKeys.has(bKey) ||
        usedTargetCells.has(aKey) ||
        usedTargetCells.has(bKey)
      ) {
        continue;
      }
      usedTargetCells.add(aKey);
      usedTargetCells.add(bKey);
      targetPairs.push(pair);
    }
    if (!targetPairs.length) return null;

    const pairCount = Math.min(sourcePairs.length, targetPairs.length, requested);
    const nextBoard = board.map((row) => row.slice());
    const swaps = [];
    for (let i = 0; i < pairCount; i += 1) {
      const source = sourcePairs[i];
      const target = targetPairs[i];
      const oldA = board[target.a.row][target.a.col];
      const oldB = board[target.b.row][target.b.col];
      nextBoard[target.a.row][target.a.col] = source.color;
      nextBoard[target.b.row][target.b.col] = source.color;
      nextBoard[source.cells[0].row][source.cells[0].col] = oldA;
      nextBoard[source.cells[1].row][source.cells[1].col] = oldB;
      swaps.push({
        color: source.color,
        source: source.cells,
        target: target,
      });
    }

    if (countRemaining(nextBoard) !== countRemaining(board)) {
      throw new Error("换位后色块数量不守恒。");
    }

    return {
      board: nextBoard,
      swaps,
      pairCount,
      targetPairCount: requested,
      tileCount: countRemaining(nextBoard),
    };
  }

  /**
   * 从一个随机位置长出一团相邻方块，并把这团方块全部吸入。
   * 默认数量为 7～11 个，不要求颜色成对。
   */
  function suckAdjacentCluster(board, mask, options) {
    const opts = options || {};
    const random = typeof opts.rng === "function" ? opts.rng : Math.random;
    const minCount = Math.max(2, Math.floor(opts.min || 7));
    const maxCount = Math.max(minCount, Math.floor(opts.max || 11));
    const blocked = new Set(opts.blocked || []);
    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    if (!Array.isArray(mask) || mask.length !== rows) {
      throw new Error("吸入蒙版与棋盘行数不一致。");
    }
    for (const row of mask) {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new Error("吸入蒙版与棋盘列数不一致。");
      }
    }

    const active = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (!mask[row][col]) continue;
        if (board[row][col] === null || board[row][col] === undefined) continue;
        if (blocked.has(`${row}:${col}`)) continue;
        active.push({ row, col });
      }
    }
    if (active.length < minCount) return null;

    const maxAvailable = active.length;
    const targets = [];
    for (let count = minCount; count <= maxCount; count += 1) {
      if (count <= maxAvailable) targets.push(count);
    }
    if (!targets.length) return null;

    const neighbors = (cell) => [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ];
    const isOpen = (cell) =>
      cell.row >= 0 &&
      cell.row < rows &&
      cell.col >= 0 &&
      cell.col < cols &&
      Boolean(mask[cell.row][cell.col]) &&
      board[cell.row][cell.col] !== null &&
      !blocked.has(`${cell.row}:${cell.col}`);

    let best = null;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const starts = shuffle(active.slice(), random);
      const start = starts[0];
      const target = targets[Math.floor(random() * targets.length)];
      const cluster = [start];
      const clusterKeys = new Set([`${start.row}:${start.col}`]);
      let frontier = neighbors(start).filter(isOpen);

      while (cluster.length < target && frontier.length) {
        const index = Math.floor(random() * frontier.length);
        const cell = frontier.splice(index, 1)[0];
        const key = `${cell.row}:${cell.col}`;
        if (clusterKeys.has(key)) continue;
        clusterKeys.add(key);
        cluster.push(cell);
        for (const next of neighbors(cell)) {
          if (!isOpen(next)) continue;
          const nextKey = `${next.row}:${next.col}`;
          if (clusterKeys.has(nextKey)) continue;
          frontier.push(next);
        }
      }

      if (cluster.length >= minCount) {
        if (cluster.length > (best ? best.length : 0)) best = cluster;
        if (cluster.length === target) break;
      }
    }

    if (!best || best.length < minCount) return null;
    const nextBoard = board.map((row) => row.slice());
    for (const cell of best) nextBoard[cell.row][cell.col] = null;
    return {
      board: nextBoard,
      cells: best,
      removedCount: best.length,
      tileCount: countRemaining(nextBoard),
    };
  }

  function removePair(board, a, b) {
    if (!isInside(board, a.row, a.col) || !isInside(board, b.row, b.col)) {
      return false;
    }
    const colorA = board[a.row][a.col];
    const colorB = board[b.row][b.col];
    if (colorA === null || colorB === null || colorA !== colorB) return false;
    board[a.row][a.col] = null;
    board[b.row][b.col] = null;
    return true;
  }

  return {
    DEFAULT_SIZE,
    shuffle,
    createBoard,
    createBoardFromMask,
    createPlayableBoard,
    createPlayableBoardFromMask,
    rearrangeWithAdjacentPairs,
    swapPairsIntoAdjacent,
    splitTilesIntoAdjacentPairs,
    suckAdjacentCluster,
    boardSize,
    countRemaining,
    colorCounts,
    findPath,
    findAvailableMoves,
    hasMoves,
    findConnectablePositionPair,
    reshuffleColors,
    removePair,
  };
});
