/*
 * 纯色连连看 · 核心逻辑
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

  const DEFAULT_SIZE = Object.freeze({ cols: 10, rows: 8, colors: 8 });

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
    createPlayableBoard,
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
