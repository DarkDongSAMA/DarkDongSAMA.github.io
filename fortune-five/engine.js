/**
 * DarkHell — slot math engine.
 * Works in the browser (window.SlotEngine) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SlotEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MIN_BET = 100;
  const MAX_BET = 1000000;
  const START_COINS = 10000;
  const MAX_HISTORY = 2000;
  const REELS = 5;
  const ROWS = 3;

  // Weights sum to 100. Payouts are multiples of the TOTAL bet, per winning line.
  const SYMBOLS = [
    {
      id: 'cherry',
      name: '苹果',
      icon: 'fa-apple-whole',
      color: '#ff7185',
      glow: 'rgba(255, 113, 133, 0.42)',
      rarity: '普通',
      tier: 1,
      weight: 27,
      pays: { 3: 1.5, 4: 4, 5: 5 }
    },
    {
      id: 'lemon',
      name: '柠檬',
      icon: 'fa-lemon',
      color: '#ffe066',
      glow: 'rgba(255, 224, 102, 0.4)',
      rarity: '普通',
      tier: 1,
      weight: 24,
      pays: { 3: 2, 4: 5, 5: 6 }
    },
    {
      id: 'bell',
      name: '铃铛',
      icon: 'fa-bell',
      color: '#ffad54',
      glow: 'rgba(255, 173, 84, 0.42)',
      rarity: '少见',
      tier: 2,
      weight: 18,
      pays: { 3: 3, 4: 8, 5: 10 }
    },
    {
      id: 'clover',
      name: '四叶草',
      icon: 'fa-clover',
      color: '#5ce6a4',
      glow: 'rgba(92, 230, 164, 0.42)',
      rarity: '少见',
      tier: 2,
      weight: 13,
      pays: { 3: 5, 4: 14, 5: 17 }
    },
    {
      id: 'star',
      name: '星辰',
      icon: 'fa-star',
      color: '#69c9ff',
      glow: 'rgba(105, 201, 255, 0.45)',
      rarity: '稀有',
      tier: 3,
      weight: 8,
      pays: { 3: 8, 4: 22, 5: 27 }
    },
    {
      id: 'gem',
      name: '宝石',
      icon: 'fa-gem',
      color: '#b58cff',
      glow: 'rgba(181, 140, 255, 0.48)',
      rarity: '史诗',
      tier: 4,
      weight: 5,
      pays: { 3: 16, 4: 44, 5: 54 }
    },
    {
      id: 'crown',
      name: '皇冠',
      icon: 'fa-crown',
      color: '#ffc857',
      glow: 'rgba(255, 200, 87, 0.5)',
      rarity: '传说',
      tier: 5,
      weight: 3,
      pays: { 3: 30, 4: 88, 5: 108 }
    },
    {
      id: 'seven',
      name: '命运骰',
      icon: 'fa-dice',
      color: '#ff5378',
      glow: 'rgba(255, 83, 120, 0.55)',
      rarity: '神话',
      tier: 6,
      weight: 2,
      pays: { 3: 60, 4: 176, 5: 216 }
    }
  ];

  const SYMBOL_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));
  const TOTAL_WEIGHT = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);

  // Every line reads left to right. A win needs 3, 4 or 5 consecutive matching icons.
  const LINES = [
    { id: 'middle', name: '中线', short: 'MID', rows: [1, 1, 1, 1, 1], color: '#ffd166' },
    { id: 'top', name: '上线', short: 'TOP', rows: [0, 0, 0, 0, 0], color: '#5eead4' },
    { id: 'bottom', name: '下线', short: 'BOT', rows: [2, 2, 2, 2, 2], color: '#f9a8d4' },
    { id: 'v', name: 'V 线', short: 'V', rows: [0, 1, 2, 1, 0], color: '#7dd3fc' },
    { id: 'lambda', name: 'Λ 线', short: 'Λ', rows: [2, 1, 0, 1, 2], color: '#c4b5fd' }
  ];

  const LINE_BY_ID = Object.fromEntries(LINES.map((line) => [line.id, line]));

  function weightedSymbol(rng) {
    let roll = rng() * TOTAL_WEIGHT;
    for (const symbol of SYMBOLS) {
      roll -= symbol.weight;
      if (roll < 0) return symbol;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  }

  function randomSymbolExcept(rng, excludedId) {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const symbol = weightedSymbol(rng);
      if (symbol.id !== excludedId) return symbol;
    }
    return SYMBOLS.find((symbol) => symbol.id !== excludedId) || SYMBOLS[0];
  }

  /**
   * Grid is column-major: grid[reelIndex][rowIndex] => symbol id.
   */
  function generateGrid(rng) {
    const grid = [];
    for (let reel = 0; reel < REELS; reel += 1) {
      const column = [];
      for (let row = 0; row < ROWS; row += 1) {
        column.push(weightedSymbol(rng).id);
      }
      grid.push(column);
    }
    return grid;
  }

  function getBetMultiplier(bet) {
    const amount = Number(bet) || 0;
    if (amount >= 5000) return 3;
    if (amount >= 1000) return 2;
    if (amount >= 500) return 1.5;
    return 1;
  }

  function evaluate(grid, bet) {
    const wins = [];
    const betMultiplier = getBetMultiplier(bet);

    for (const line of LINES) {
      const cells = [];
      for (let reel = 0; reel < REELS; reel += 1) {
        cells.push({ reel, row: line.rows[reel], symbolId: grid[reel][line.rows[reel]] });
      }

      const firstId = cells[0].symbolId;
      let count = 1;
      while (count < REELS && cells[count].symbolId === firstId) count += 1;

      if (count < 3) continue;

      const symbol = SYMBOL_BY_ID[firstId];
      const multiplier = symbol.pays[count];
      const amount = Math.max(0, Math.floor(bet * multiplier * betMultiplier));

      wins.push({
        lineId: line.id,
        lineName: line.name,
        lineColor: line.color,
        symbolId: symbol.id,
        symbolName: symbol.name,
        symbolIcon: symbol.icon,
        symbolColor: symbol.color,
        count,
        multiplier,
        amount,
        cells: cells.slice(0, count)
      });
    }

    const total = wins.reduce((sum, win) => sum + win.amount, 0);
    const best = wins.reduce(
      (current, win) => (!current || win.multiplier > current.multiplier ? win : current),
      null
    );

    return {
      wins,
      total,
      lineCount: wins.length,
      best,
      betMultiplier,
      maxCount: wins.reduce((max, win) => Math.max(max, win.count), 0)
    };
  }

  function forceGrid(rng, forced) {
    if (!forced) return null;

    if (forced === 'loss') {
      for (let attempt = 0; attempt < 500; attempt += 1) {
        const grid = generateGrid(rng);
        if (evaluate(grid, MIN_BET).total === 0) return grid;
      }
      return generateGrid(rng);
    }

    if (forced === 'mega') {
      const grid = generateGrid(rng);
      for (let reel = 0; reel < REELS; reel += 1) {
        grid[reel][0] = 'seven';
        grid[reel][1] = 'seven';
      }
      return grid;
    }

    const config = typeof forced === 'string' ? { preset: forced } : forced;
    const presets = {
      triple: { symbolId: 'crown', count: 3 },
      quad: { symbolId: 'crown', count: 4 },
      five: { symbolId: 'seven', count: 5 }
    };
    const target = { ...(presets[config.preset] || {}), ...config };
    const symbolId = SYMBOL_BY_ID[target.symbolId] ? target.symbolId : 'crown';
    const count = Math.min(5, Math.max(3, Number(target.count) || 3));
    const line = LINE_BY_ID[target.lineId] || LINE_BY_ID.middle;

    const grid = generateGrid(rng);
    for (let reel = 0; reel < REELS; reel += 1) {
      grid[reel][line.rows[reel]] =
        reel < count ? symbolId : randomSymbolExcept(rng, symbolId).id;
    }
    return grid;
  }

  function spin(options = {}) {
    const rng = typeof options.rng === 'function' ? options.rng : Math.random;
    const bet = Math.max(MIN_BET, Math.floor(Number(options.bet) || MIN_BET));
    const grid = forceGrid(rng, options.forced) || generateGrid(rng);
    const result = evaluate(grid, bet);
    return { ...result, grid, bet, forced: options.forced || null };
  }

  // Theoretical return before rounding, assuming a fair RNG. Useful for the debug panel.
  const THEORETICAL_RTP = LINES.length * SYMBOLS.reduce((sum, symbol) => {
    const p = symbol.weight / TOTAL_WEIGHT;
    return (
      sum +
      Math.pow(p, 3) * (1 - p) * symbol.pays[3] +
      Math.pow(p, 4) * (1 - p) * symbol.pays[4] +
      Math.pow(p, 5) * symbol.pays[5]
    );
  }, 0);

  return {
    MIN_BET,
    MAX_BET,
    START_COINS,
    MAX_HISTORY,
    REELS,
    ROWS,
    SYMBOLS,
    SYMBOL_BY_ID,
    LINES,
    LINE_BY_ID,
    THEORETICAL_RTP,
    BASE_RTP: THEORETICAL_RTP,
    getBetMultiplier,
    generateGrid,
    evaluate,
    spin
  };
});
