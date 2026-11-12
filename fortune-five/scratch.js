/**
 * DarkHell — scratch card engine.
 * Works in the browser (window.ScratchEngine) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScratchEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SYMBOLS = [
    { id: 'cherry', name: '苹果', icon: 'fa-apple-whole', color: '#ff7185', weight: 27, pay: 1.5 },
    { id: 'lemon', name: '柠檬', icon: 'fa-lemon', color: '#ffe066', weight: 24, pay: 2 },
    { id: 'bell', name: '铃铛', icon: 'fa-bell', color: '#ffad54', weight: 18, pay: 3 },
    { id: 'clover', name: '四叶草', icon: 'fa-clover', color: '#5ce6a4', weight: 13, pay: 5 },
    { id: 'star', name: '星辰', icon: 'fa-star', color: '#69c9ff', weight: 8, pay: 10 },
    { id: 'gem', name: '宝石', icon: 'fa-gem', color: '#b58cff', weight: 5, pay: 20 },
    { id: 'crown', name: '皇冠', icon: 'fa-crown', color: '#ffc857', weight: 3, pay: 50 },
    { id: 'seven', name: '命运骰', icon: 'fa-dice', color: '#ff5378', weight: 2, pay: 100 }
  ];
  const SYMBOL_BY_ID = Object.fromEntries(SYMBOLS.map((symbol) => [symbol.id, symbol]));
  const TOTAL_WEIGHT = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);

  const LINES = [
    { id: 'r0', name: '第一行', cells: [0, 1, 2] },
    { id: 'r1', name: '第二行', cells: [3, 4, 5] },
    { id: 'r2', name: '第三行', cells: [6, 7, 8] },
    { id: 'c0', name: '第一列', cells: [0, 3, 6] },
    { id: 'c1', name: '第二列', cells: [1, 4, 7] },
    { id: 'c2', name: '第三列', cells: [2, 5, 8] },
    { id: 'd0', name: '主对角线', cells: [0, 4, 8] },
    { id: 'd1', name: '副对角线', cells: [2, 4, 6] }
  ];

  const TICKETS = [
    {
      id: 'match3',
      name: '三连金',
      price: 100,
      multiplier: 1,
      icon: 'fa-grip',
      color: '#f6c85f',
      tagline: '九宫格 · 连线即中',
      rule: '刮开 3×3 图案，任意一行/列/对角线连成 3 个相同图案即中奖，多线叠加。单线：苹果 1.5×、柠檬 2×、铃铛 3×、四叶草 5×、星辰 10×、宝石 20×、皇冠 50×、骰 100×。',
      maxPrize: 100
    },
    {
      id: 'lucky',
      name: '幸运数字',
      price: 500,
      multiplier: 1.5,
      icon: 'fa-hashtag',
      color: '#7dd3fc',
      tagline: '找中奖号码 · 越多越赚',
      rule: '刮开 9 个号码，与“中奖号码”相同的个数决定奖金：1 个 1×、2 个 3×、3 个 8×、4 个 20×、5 个 50×。',
      maxPrize: 75
    },
    {
      id: 'crown',
      name: '皇冠猎手',
      price: 1000,
      multiplier: 2,
      icon: 'fa-crown',
      color: '#ffb054',
      tagline: '数皇冠 · 3 个起中',
      rule: '刮开 3×3 图案并数出皇冠：3 个 1.5×、4 个 4×、5 个 12×、6 个 30×、7 个 80×。',
      maxPrize: 160
    }
  ];
  const TICKET_BY_ID = Object.fromEntries(TICKETS.map((ticket) => [ticket.id, ticket]));

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

  function weightedPick(rng, entries, weightKey = 'weight') {
    const total = entries.reduce((sum, entry) => sum + entry[weightKey], 0);
    let roll = rng() * total;
    for (const entry of entries) {
      roll -= entry[weightKey];
      if (roll < 0) return entry;
    }
    return entries[entries.length - 1];
  }

  function money(price, ticketMultiplier, baseMultiplier) {
    return Math.max(0, Math.floor(price * ticketMultiplier * baseMultiplier));
  }

  function evaluateMatch3(cells) {
    const lines = [];
    let totalMultiplier = 0;

    for (const line of LINES) {
      const first = cells[line.cells[0]];
      if (!first) continue;
      if (cells[line.cells[1]] === first && cells[line.cells[2]] === first) {
        const symbol = SYMBOL_BY_ID[first];
        const pay = symbol.pay;
        totalMultiplier += pay;
        lines.push({ ...line, symbolId: first, pay });
      }
    }

    return { lines, totalMultiplier };
  }

  function makeLossCells(rng) {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const cells = Array.from({ length: 9 }, () => weightedSymbol(rng).id);
      if (evaluateMatch3(cells).lines.length === 0) return cells;
    }
    // Extremely unlikely fallback: alternate symbols so no line can be complete.
    return Array.from({ length: 9 }, (_, index) => SYMBOLS[index % SYMBOLS.length].id);
  }

  function generateMatch3(rng, ticket) {
    const outcomes = [
      { weight: 76, symbolId: null },
      { weight: 14, symbolId: 'cherry' },
      { weight: 5, symbolId: 'lemon' },
      { weight: 2.5, symbolId: 'bell' },
      { weight: 1.2, symbolId: 'clover' },
      { weight: 0.6, symbolId: 'star' },
      { weight: 0.3, symbolId: 'gem' },
      { weight: 0.25, symbolId: 'crown' },
      { weight: 0.15, symbolId: 'seven' }
    ];
    const outcome = weightedPick(rng, outcomes);

    if (!outcome.symbolId) {
      const cells = makeLossCells(rng);
      return {
        data: { cells, lines: [] },
        win: 0,
        prizeMultiplier: 0,
        outcomeLabel: '未中奖'
      };
    }

    const line = LINES[Math.floor(rng() * LINES.length)];
    const cells = Array.from({ length: 9 }, () => weightedSymbol(rng).id);
    for (const index of line.cells) cells[index] = outcome.symbolId;
    // Make sure there is no accidental four-like extension concept; 3×3 has none.
    const evaluated = evaluateMatch3(cells);
    const totalMultiplier = evaluated.totalMultiplier;

    return {
      data: { cells, lines: evaluated.lines },
      win: money(ticket.price, ticket.multiplier, totalMultiplier),
      prizeMultiplier: totalMultiplier,
      outcomeLabel: evaluated.lines.length
        ? `${evaluated.lines.length} 条连线 · ${evaluated.lines[0].name}`
        : '未中奖'
    };
  }

  function generateLucky(rng, ticket) {
    const matchOutcome = weightedPick(rng, [
      { weight: 75, count: 0, pay: 0 },
      { weight: 17, count: 1, pay: 1 },
      { weight: 6, count: 2, pay: 3 },
      { weight: 1.6, count: 3, pay: 8 },
      { weight: 0.35, count: 4, pay: 20 },
      { weight: 0.05, count: 5, pay: 50 }
    ]);
    const luckyNumber = 1 + Math.floor(rng() * 20);
    const numbers = [];

    for (let index = 0; index < 9; index += 1) {
      numbers.push(index < matchOutcome.count ? luckyNumber : 1 + Math.floor(rng() * 20));
    }

    // Ensure non-matches never accidentally equal the lucky number.
    for (let index = matchOutcome.count; index < 9; index += 1) {
      while (numbers[index] === luckyNumber) {
        numbers[index] = 1 + Math.floor(rng() * 20);
      }
    }

    // Shuffle so matches are not always at the front.
    for (let index = numbers.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1));
      [numbers[index], numbers[swap]] = [numbers[swap], numbers[index]];
    }

    const winningIndices = numbers
      .map((number, index) => (number === luckyNumber ? index : -1))
      .filter((index) => index >= 0);

    return {
      data: { luckyNumber, numbers, winningIndices, matchCount: winningIndices.length },
      win: money(ticket.price, ticket.multiplier, matchOutcome.pay),
      prizeMultiplier: matchOutcome.pay,
      outcomeLabel:
        winningIndices.length > 0 ? `命中 ${winningIndices.length} 个号码` : '未中奖'
    };
  }

  function makeCrownCells(rng, count) {
    const cells = Array.from({ length: 9 }, () => randomSymbolExcept(rng, 'crown').id);
    const positions = Array.from({ length: 9 }, (_, index) => index);
    for (let index = positions.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1));
      [positions[index], positions[swap]] = [positions[swap], positions[index]];
    }
    for (let index = 0; index < count; index += 1) {
      cells[positions[index]] = 'crown';
    }
    return cells;
  }

  function generateCrown(rng, ticket) {
    const outcome = weightedPick(rng, [
      { weight: 84, count: 0, pay: 0 },
      { weight: 0, count: 1, pay: 0 },
      { weight: 0, count: 2, pay: 0 },
      { weight: 12, count: 3, pay: 1.5 },
      { weight: 3, count: 4, pay: 4 },
      { weight: 0.8, count: 5, pay: 12 },
      { weight: 0.15, count: 6, pay: 30 },
      { weight: 0.05, count: 7, pay: 80 }
    ]);

    let count = outcome.count;
    if (outcome.pay === 0) {
      const roll = rng();
      count = roll < 0.54 ? 0 : roll < 0.84 ? 1 : 2;
    }

    const cells = makeCrownCells(rng, count);
    const crownIndices = cells
      .map((symbolId, index) => (symbolId === 'crown' ? index : -1))
      .filter((index) => index >= 0);

    return {
      data: { cells, crownIndices, crownCount: crownIndices.length },
      win: money(ticket.price, ticket.multiplier, outcome.pay),
      prizeMultiplier: outcome.pay,
      outcomeLabel: crownIndices.length >= 3 ? `刮出 ${crownIndices.length} 个皇冠` : '未中奖'
    };
  }

  function purchase(ticketId, rng = Math.random) {
    const ticket = TICKET_BY_ID[ticketId];
    if (!ticket) throw new Error(`Unknown scratch ticket: ${ticketId}`);
    const result =
      ticket.id === 'match3'
        ? generateMatch3(rng, ticket)
        : ticket.id === 'lucky'
          ? generateLucky(rng, ticket)
          : generateCrown(rng, ticket);

    return {
      ...ticket,
      ...result,
      ticketId: ticket.id,
      purchasedAt: Date.now()
    };
  }

  return {
    TICKETS,
    TICKET_BY_ID,
    SYMBOLS,
    SYMBOL_BY_ID,
    purchase
  };
});
