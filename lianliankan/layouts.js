/*
 * 棋谱模板：不同形状、不同色块数量。
 * 所有棋谱共用 12 × 10 的坐标网格，空洞（0）只作为空位，不生成色块。
 * 每个模板的活动格数必须为偶数，才能全部成对。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.LLK_LAYOUTS = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLS = 12;
  const ROWS = 10;

  function parseMask(rows) {
    if (!Array.isArray(rows) || rows.length !== ROWS) {
      throw new Error(`棋谱必须包含 ${ROWS} 行。`);
    }
    return rows.map((line) => {
      if (typeof line !== "string" || line.length !== COLS) {
        throw new Error(`棋谱每行必须包含 ${COLS} 格。`);
      }
      return Array.from(line, (char) => (char === "#" ? 1 : 0));
    });
  }

  function countMask(mask) {
    let count = 0;
    for (const row of mask) {
      for (const cell of row) count += cell ? 1 : 0;
    }
    return count;
  }

  const RAW_LAYOUTS = [
    {
      id: "full",
      name: "满堂阵",
      note: "铺满全盘",
      rows: [
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
      ],
    },
    {
      id: "arch",
      name: "拱门阵",
      note: "上密下疏",
      rows: [
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
        "#####..#####",
        "#####..#####",
        "#####..#####",
        "#####..#####",
      ],
    },
    {
      id: "diamond",
      name: "菱形阵",
      note: "中间宽两头收",
      rows: [
        "..########..",
        ".##########.",
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
        ".##########.",
        "..########..",
      ],
    },
    {
      id: "towers",
      name: "双塔阵",
      note: "左右双塔",
      rows: [
        "#####..#####",
        "#####..#####",
        "#####..#####",
        "#####..#####",
        "#####..#####",
        "#####..#####",
        "#####..#####",
        "#####..#####",
        "############",
        "############",
      ],
    },
    {
      id: "stairs",
      name: "阶梯阵",
      note: "逐级收窄",
      rows: [
        "############",
        "############",
        ".###########",
        ".###########",
        "..##########",
        "..##########",
        "...#########",
        "...#########",
        "....########",
        "....########",
      ],
    },
    {
      id: "cross",
      name: "十字阵",
      note: "四通八达",
      rows: [
        "...######...",
        "...######...",
        "############",
        "############",
        "############",
        "############",
        "############",
        "############",
        "...######...",
        "...######...",
      ],
    },
  ];

  const LAYOUTS = RAW_LAYOUTS.map((layout) => {
    const mask = parseMask(layout.rows);
    const count = countMask(mask);
    if (count % 2 !== 0) {
      throw new Error(`棋谱「${layout.name}」的色块数必须为偶数。`);
    }
    return Object.freeze({
      id: layout.id,
      name: layout.name,
      note: layout.note,
      count,
      pairs: count / 2,
      mask,
    });
  });

  const LAYOUT_MAP = new Map(LAYOUTS.map((layout) => [layout.id, layout]));

  function getLayout(id) {
    return LAYOUT_MAP.get(id) || null;
  }

  return {
    COLS,
    ROWS,
    RANDOM_ID: "random",
    LAYOUTS,
    getLayout,
    countMask,
  };
});
