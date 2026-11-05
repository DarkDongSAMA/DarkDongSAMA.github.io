(function () {
  "use strict";

  const LLK = window.LLK;
  const LAYOUT_API = window.LLK_LAYOUTS;
  const COLS = LAYOUT_API ? LAYOUT_API.COLS : 12;
  const ROWS = LAYOUT_API ? LAYOUT_API.ROWS : 10;
  const LAYOUTS = LAYOUT_API ? LAYOUT_API.LAYOUTS : [];
  const MATCH_SECONDS = 60;
  const SKILL_CHARGE_SECONDS = 5;
  const BGM_VOLUME = 0.24;
  const BGM_PAUSE_FACTOR = 0.5;
  const COMBO_WINDOW_MS = 2000;
  const COPY_TILE_COUNT = 5;
  const COPY_ABILITY_MS = 5000;
  const AI_SKILL_MIN_SECONDS = 5;
  const AI_SKILL_MAX_SECONDS = 6.8;
  const AI_SKILL_TRIGGER_DELAY_MS = 60;
  const PLAYER_SPLIT_AI_GUARD_MS = 2500;
  const WEB_PAIR_COUNT = 3;
  const WEB_DURATION_MS = 3000;
  const AUTO_SKILL_STORAGE_KEY = "color-link-auto-skill";

  const COLORS = [
    { name: "红", hex: "#ff5a5f" },
    { name: "橙", hex: "#ff9f1c" },
    { name: "黄", hex: "#ffd60a" },
    { name: "绿", hex: "#2ecc71" },
    { name: "青", hex: "#22d3ee" },
    { name: "蓝", hex: "#4f7cff" },
    { name: "紫", hex: "#b388ff" },
    { name: "粉", hex: "#ff6fae" },
  ];

  const THEMES = {
    produce: {
      id: "produce",
      letter: "A",
      name: "蔬果",
      fullName: "蔬果乐园",
      description: "蔬菜和水果",
      items: [
        { food: "苹果", emoji: "🍎" },
        { food: "橙子", emoji: "🍊" },
        { food: "柠檬", emoji: "🍋" },
        { food: "西兰花", emoji: "🥦" },
        { food: "猕猴桃", emoji: "🥝" },
        { food: "蓝莓", emoji: "🫐" },
        { food: "葡萄", emoji: "🍇" },
        { food: "桃子", emoji: "🍑" },
      ],
    },
    bakery: {
      id: "bakery",
      letter: "B",
      name: "烘焙",
      fullName: "烘焙甜点",
      description: "面包和甜品",
      items: [
        { food: "草莓蛋糕", emoji: "🍰" },
        { food: "可颂", emoji: "🥐" },
        { food: "面包", emoji: "🍞" },
        { food: "纸杯蛋糕", emoji: "🧁" },
        { food: "冰淇淋", emoji: "🍦" },
        { food: "甜甜圈", emoji: "🍩" },
        { food: "苹果派", emoji: "🥧" },
        { food: "曲奇", emoji: "🍪" },
      ],
    },
    fastfood: {
      id: "fastfood",
      letter: "C",
      name: "快餐",
      fullName: "主食快餐",
      description: "主食和快餐",
      items: [
        { food: "披萨", emoji: "🍕" },
        { food: "汉堡", emoji: "🍔" },
        { food: "薯条", emoji: "🍟" },
        { food: "三明治", emoji: "🥪" },
        { food: "拉面", emoji: "🍜" },
        { food: "寿司", emoji: "🍣" },
        { food: "饺子", emoji: "🥟" },
        { food: "热狗", emoji: "🌭" },
      ],
    },
  };
  const THEME_IDS = Object.keys(THEMES);
  const UI_THEMES = {
    kirby: { name: "卡比", swatch: "#ff6fa5" },
    ddd: { name: "帝帝帝", swatch: "#ffd23f" },
    meta: { name: "魅塔骑士", swatch: "#7897ff" },
    magolor: { name: "魔噜酷", swatch: "#b99aff" },
    spider: { name: "塔狼蛛", swatch: "#4fc98a" },
  };
  const UI_THEME_IDS = Object.keys(UI_THEMES);
  const UI_THEME_STORAGE_KEY = "kirby-food-ui-theme";

  const CHARACTERS = {
    role1: {
      id: "role1",
      name: "卡比",
      avatar: "🍑",
      skillName: "超级吸入",
      effect: "消除3对同色",
      cardDescription: "自动消除最多 3 对同色食材",
      settingDescription: "5 秒充能 · 自动消除最多 3 对同色食材",
      accent: "#ff8ab4",
      accentSoft: "rgba(255, 138, 180, 0.3)",
    },
    role2: {
      id: "role2",
      name: "帝帝帝大王",
      avatar: "✌️",
      skillName: "锤子敲击",
      effect: "4对交换并列",
      cardDescription: "随机让 4 对同色块交换成并列",
      settingDescription: "5 秒充能 · 随机让 4 对同色块交换成并列",
      accent: "#ffd60a",
      accentSoft: "rgba(255, 214, 10, 0.28)",
    },
    role3: {
      id: "role3",
      name: "魅塔骑士",
      avatar: "🫐",
      skillName: "新月斩击",
      effect: "4块分裂成对",
      cardDescription: "最多 4 个方块分裂出相邻同色块",
      settingDescription: "5 秒充能 · 最多 4 个方块分裂出相邻同色块",
      accent: "#4f72e8",
      accentSoft: "rgba(79, 114, 232, 0.32)",
    },
    role4: {
      id: "role4",
      name: "塔狼蛛",
      avatar: "🕷️",
      skillName: "魔术蛛丝",
      effect: "3对结网3秒消",
      cardDescription: "随机让 3 对同色方块结网，3 秒后消除",
      settingDescription: "5 秒充能 · 3 对同色方块结网，3 秒后消除",
      accent: "#2f6b4f",
      accentSoft: "rgba(47, 107, 79, 0.34)",
    },
    role5: {
      id: "role5",
      name: "魔噜酷",
      avatar: "🤡",
      skillName: "黑洞吸收",
      effect: "吸入7-11块",
      cardDescription: "随机位置吸入 7-11 个紧挨在一起的方块，不要求成对",
      settingDescription: "5 秒充能 · 随机位置吸入 7-11 个相邻方块",
      accent: "#b79cff",
      accentSoft: "rgba(183, 156, 255, 0.34)",
    },
  };
  const CHARACTER_IDS = ["role1", "role2", "role3", "role5", "role4"];

  const DIFFICULTIES = {
    easy: { label: "春风", interval: 4400, short: "4.4 秒", skillChance: 0 },
    normal: { label: "标准", interval: 3000, short: "3.0 秒", skillChance: 0.5 },
    hard: { label: "狂野", interval: 1900, short: "1.9 秒", skillChance: 1 },
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    app: document.querySelector(".app"),
    app: document.querySelector(".app"),
    playerCard: $("playerCard"),
    playerAvatar: $("playerAvatar"),
    playerName: $("playerName"),
    aiCard: $("aiCard"),
    aiAvatar: $("aiAvatar"),
    aiName: $("aiName"),
    aiSkillBar: $("aiSkillBar"),
    playerScore: $("playerScore"),
    aiScore: $("aiScore"),
    remaining: $("remaining"),
    comboMeter: $("comboMeter"),
    comboCount: $("comboCount"),
    timer: $("timer"),
    timerBar: $("timerBar"),
    clockLabel: $("clockLabel"),
    clockTrack: $("clockTrack"),
    footerNote: $("footerNote"),
    modeGroup: $("modeGroup"),
    roundCountWrap: $("roundCountWrap"),
    roundCount: $("roundCount"),
    modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
    clock: document.querySelector(".clock"),
    aiProgress: $("aiProgress"),
    board: $("board"),
    tileLayer: $("tileLayer"),
    pathLayer: $("pathLayer"),
    toast: $("toast"),
    layoutLabel: $("layoutLabel"),
    boardMeta: $("boardMeta"),
    statusText: $("statusText"),
    skillBtn: $("skillBtn"),
    skillNameLabel: $("skillNameLabel"),
    skillBar: $("skillBar"),
    skillState: $("skillState"),
    skillBtn: $("skillBtn"),    pauseBtn: $("pauseBtn"),
    helpBtn: $("helpBtn"),
    settingsBtn: $("settingsBtn"),
    fxLayer: $("fxLayer"),
    skillVortex: $("skillVortex"),
    skillImpact: $("skillImpact"),
    skillSlash: $("skillSlash"),
    skillBlackhole: $("skillBlackhole"),
    fireLayer: $("fireLayer"),
    fireCross: $("fireCross"),
    copyAbilityBar: $("copyAbilityBar"),
    copyAbilityName: $("copyAbilityName"),
    copyAbilityTime: $("copyAbilityTime"),
    copyAbilityHint: $("copyAbilityHint"),
    aiCopyBadge: $("aiCopyBadge"),
    clickSound: $("clickSound"),
    pauseSound: $("pauseSound"),
    suikomiSound: $("suikomiSound"),
    markholeSound: $("markholeSound"),
    markwrSound: $("markwrSound"),
    bgMusic: $("bgMusic"),
    musicToggle: $("musicToggle"),
    sfxToggle: $("sfxToggle"),
    startOverlay: $("startOverlay"),
    pauseOverlay: $("pauseOverlay"),
    helpOverlay: $("helpOverlay"),
    settingsOverlay: $("settingsOverlay"),
    endOverlay: $("endOverlay"),
    startBtn: $("startBtn"),
    startHelpBtn: $("startHelpBtn"),
    resumeBtn: $("resumeBtn"),
    pauseRestartBtn: $("pauseRestartBtn"),
    pauseMenuBtn: $("pauseMenuBtn"),
    againBtn: $("againBtn"),
    changeDifficultyBtn: $("changeDifficultyBtn"),
    helpCloseBtn: $("helpCloseBtn"),
    helpOkBtn: $("helpOkBtn"),
    settingsCloseBtn: $("settingsCloseBtn"),
    settingsDoneBtn: $("settingsDoneBtn"),
    startSettingsBtn: $("startSettingsBtn"),
    startOptionsBtn: $("startOptionsBtn"),
    autoSkillToggle: $("autoSkillToggle"),
    difficultyGroup: $("difficultyGroup"),
    difficultyButtons: Array.from(document.querySelectorAll("[data-difficulty]")),
    layoutGroup: $("layoutGroup"),
    themeGroup: $("themeGroup"),
    uiThemeGroup: $("uiThemeGroup"),
    characterGroup: $("characterGroup"),
    characterEffects: $("characterEffects"),
    aiCharacterGroup: $("aiCharacterGroup"),
    settingCharacterAvatar: $("settingCharacterAvatar"),
    settingCharacterTitle: $("settingCharacterTitle"),
    settingCharacterDesc: $("settingCharacterDesc"),
    endModal: $("endModal"),
    resultBadge: $("resultBadge"),
    resultTitle: $("resultTitle"),
    resultSub: $("resultSub"),
    finalPlayerScore: $("finalPlayerScore"),
    finalAiScore: $("finalAiScore"),
    finalLayout: $("finalLayout"),
    finalTime: $("finalTime"),
    finalTimeLabel: $("finalTimeLabel"),
    finalDifficulty: $("finalDifficulty"),
    finalAiRate: $("finalAiRate"),
    statusWrap: $("statusText").parentElement,
  };

  const overlays = [
    els.startOverlay,
    els.pauseOverlay,
    els.helpOverlay,
    els.settingsOverlay,
    els.endOverlay,
  ];

  const state = {
    status: "idle", // idle | playing | paused | ending | ended
    board: [],
    selected: null,
    playerScore: 0,
    aiScore: 0,
    combo: 0,
    comboTimer: null,
    copyTileKeys: new Set(),
    copyAbility: null,
    aiCopyAbility: null,
    aiCopyUseTimer: null,
    fireTimer: null,
    remaining: 0,
    layoutChoice: "random",
    layout: null,
    previewLayout: null,
    lastLayoutId: null,
    theme: "produce",
    uiTheme: "kirby",
    modeChoice: "classic",
    roundCount: 3,
    mode: "classic",
    round: 1,
    totalRounds: 1,
    difficulty: "normal",
    timeLimit: MATCH_SECONDS,
    timeLeft: MATCH_SECONDS,
    deadline: 0,
    elapsed: 0,
    timerId: null,
    aiTimer: null,
    boardCheckTimer: null,
    reshuffleTimer: null,
    endTimer: null,
    pathTimer: null,
    toastTimer: null,
    toastToken: 0,
    character: "role1",
    aiCharacterChoice: "random",
    aiCharacter: "role1",
    autoSkill: false,
    skillCharge: 0,
    skillReady: false,
    castingSkill: false,
    lastSkillTick: 0,
    autoSkillTimer: null,
    castTimer: null,
    vortexTimer: null,
    impactTimer: null,
    shakeStartTimer: null,
    shakeTimer: null,
    slashTimer: null,
    blackholeTimer: null,
    bgFadeTimer: null,
    suikomiFadeTimer: null,
    suikomiFadeInterval: null,
    musicEnabled: true,
    sfxEnabled: true,
    splitGuards: new Map(),
    webbedCells: new Map(),
    webCellActors: new Map(),
    webGroups: [],
    webGroupSeq: 0,
    webCleanupTimer: null,
    aiLockUntil: 0,
    ignoreTileClicksUntil: 0,
    aiSkillCharge: 0,
    aiSkillDuration: AI_SKILL_MIN_SECONDS,
    aiSkillReady: false,
    aiCastingSkill: false,
    lastAiSkillTick: 0,
    aiAutoTimer: null,
    aiCastTimer: null,
    settingsAutoPaused: false,
    settingsFromStart: false,
    reshuffling: false,
    helpAutoPaused: false,
    helpFromStart: false,
    endReason: null,
  };

  const tileEls = new Map();
  const keyOf = (row, col) => `${row}:${col}`;
  let lastBoardTap = { time: 0, x: 0, y: 0, cell: "" };

  function setupBoardGeometry() {
    els.board.style.setProperty("--vcols", COLS + 2);
    els.board.style.setProperty("--vrows", ROWS + 2);
    els.pathLayer.setAttribute("viewBox", `0 0 ${(COLS + 2) * 100} ${(ROWS + 2) * 100}`);
    els.pathLayer.setAttribute("width", "100%");
    els.pathLayer.setAttribute("height", "100%");
  }

  function getLayoutById(id) {
    return LAYOUT_API ? LAYOUT_API.getLayout(id) : null;
  }

  function chooseLayout(choice, options) {
    const exclude = new Set((options && options.exclude) || []);
    if (choice && choice !== "random") {
      const selected = getLayoutById(choice);
      if (selected) return selected;
    }
    const pool = LAYOUTS.filter((layout) => !exclude.has(layout.id));
    const candidates = pool.length ? pool : LAYOUTS;
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function getTheme() {
    return THEMES[state.theme] || THEMES.produce;
  }

  function getThemeItem(color) {
    const theme = getTheme();
    return theme.items[color] || theme.items[0];
  }

  function buildThemeCards() {
    if (!els.themeGroup) return;
    const fragment = document.createDocumentFragment();
    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-card";
      button.dataset.theme = id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `主题${theme.letter}，${theme.fullName}`);
      button.title = `主题${theme.letter} · ${theme.fullName}：${theme.description}`;

      const letter = document.createElement("span");
      letter.className = "theme-letter";
      letter.textContent = theme.letter;
      const samples = document.createElement("span");
      samples.className = "theme-samples";
      samples.setAttribute("aria-hidden", "true");
      samples.textContent = `${theme.items[0].emoji}${theme.items[1].emoji}`;
      const name = document.createElement("span");
      name.className = "theme-name";
      name.textContent = theme.name;

      button.append(letter, samples, name);
      fragment.appendChild(button);
    }
    els.themeGroup.innerHTML = "";
    els.themeGroup.appendChild(fragment);
    updateThemeCards();
    updateLogoTheme();
  }

  function updateThemeCards() {
    if (!els.themeGroup) return;
    for (const card of els.themeGroup.querySelectorAll("[data-theme]")) {
      const active = card.dataset.theme === state.theme;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function applyUiTheme() {
    document.documentElement.dataset.uiTheme = state.uiTheme;
  }

  function buildUiThemeCards() {
    if (!els.uiThemeGroup) return;
    const fragment = document.createDocumentFragment();
    for (const id of UI_THEME_IDS) {
      const theme = UI_THEMES[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ui-theme-card";
      button.dataset.uiTheme = id;
      button.style.setProperty("--swatch", theme.swatch);
      button.setAttribute("aria-pressed", "false");
      const dot = document.createElement("i");
      const label = document.createElement("span");
      label.textContent = theme.name;
      button.append(dot, label);
      fragment.appendChild(button);
    }
    els.uiThemeGroup.innerHTML = "";
    els.uiThemeGroup.appendChild(fragment);
    updateUiThemeCards();
  }

  function updateUiThemeCards() {
    if (!els.uiThemeGroup) return;
    for (const card of els.uiThemeGroup.querySelectorAll("[data-ui-theme]")) {
      const active = card.dataset.uiTheme === state.uiTheme;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function saveUiTheme() {
    try {
      localStorage.setItem(UI_THEME_STORAGE_KEY, state.uiTheme);
    } catch (error) {
      // 忽略存储失败。
    }
  }

  function loadUiTheme() {
    try {
      const saved = localStorage.getItem(UI_THEME_STORAGE_KEY);
      if (saved && UI_THEMES[saved]) state.uiTheme = saved;
    } catch (error) {
      // 使用默认配色。
    }
    applyUiTheme();
  }

  function setUiTheme(id) {
    if (!UI_THEMES[id]) return;
    state.uiTheme = id;
    applyUiTheme();
    updateUiThemeCards();
    saveUiTheme();
  }

  function clampRoundCount(value) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return 3;
    return Math.min(20, Math.max(1, parsed));
  }

  function syncModeUI() {
    for (const button of els.modeButtons) {
      const active = button.dataset.mode === state.modeChoice;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
    if (els.roundCountWrap) {
      els.roundCountWrap.hidden = state.modeChoice !== "endless";
    }
    if (els.roundCount) els.roundCount.value = String(state.roundCount);
    if (els.footerNote) {
      els.footerNote.textContent =
        state.modeChoice === "endless"
          ? `无尽模式 · ${state.roundCount} 回合 · 玩家特技 5 秒充能 · 电脑特技 5–7 秒随机释放`
          : "60 秒限时 · 玩家特技 5 秒充能 · 电脑特技 5–7 秒随机释放";
    }
  }

  function setModeChoice(mode) {
    if (mode !== "classic" && mode !== "endless") return;
    state.modeChoice = mode;
    syncModeUI();
  }

  function setRoundCount(value) {
    state.roundCount = clampRoundCount(value);
    syncModeUI();
  }

  function updateLogoTheme() {
    const logoItems = document.querySelectorAll(".logo-tiles i");
    const theme = getTheme();
    const indices = [0, 2, 3, 5];
    logoItems.forEach((tile, index) => {
      const themeIndex = indices[index] === undefined ? index : indices[index];
      const item = theme.items[themeIndex];
      if (item) tile.textContent = item.emoji;
    });
  }

  function updateTileThemes() {
    for (const [key, tile] of tileEls) {
      const [row, col] = key.split(":").map(Number);
      const color = state.board[row] && state.board[row][col];
      if (color === null || color === undefined) continue;
      const item = getThemeItem(color);
      const emoji = tile.querySelector(".tile-emoji");
      if (emoji) emoji.textContent = item.emoji;
      tile.title = `${item.food} · ${COLORS[color].name}色`;
      tile.setAttribute(
        "aria-label",
        `${item.food}（${COLORS[color].name}色）色块，第 ${row + 1} 行第 ${col + 1} 列`
      );
    }
  }

  function setTheme(id) {
    if (!THEMES[id]) return;
    if (
      state.status === "playing" ||
      state.status === "paused" ||
      state.status === "ending"
    ) {
      return;
    }
    state.theme = id;
    updateThemeCards();
    updateLogoTheme();
    updateTileThemes();
  }

  function createLayoutMini(layout, isRandom) {
    const mini = document.createElement("span");
    mini.className = "layout-mini";
    if (isRandom) mini.classList.add("layout-mini--random");
    mini.setAttribute("aria-hidden", "true");
    const mask = isRandom ? LAYOUTS[0].mask : layout.mask;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const dot = document.createElement("i");
        const active = isRandom || Boolean(mask[row][col]);
        if (!active) {
          dot.className = "is-off";
        } else {
          const colorIndex = (row * 3 + col * 5 + (isRandom ? 4 : 0)) % COLORS.length;
          dot.style.background = COLORS[colorIndex].hex;
        }
        mini.appendChild(dot);
      }
    }
    return mini;
  }

  function buildLayoutCards() {
    if (!els.layoutGroup) return;
    const fragment = document.createDocumentFragment();
    const items = [
      {
        id: "random",
        name: "随机",
        note: "每局轮换",
        countLabel: "每局轮换",
        isRandom: true,
      },
      ...LAYOUTS.map((layout) => ({
        id: layout.id,
        name: layout.name,
        note: layout.note,
        countLabel: `${layout.count} 块`,
        layout,
        isRandom: false,
      })),
    ];

    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "layout-card";
      button.dataset.layout = item.id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute(
        "aria-label",
        item.isRandom
          ? "随机棋谱，每局轮换形状和色块数量"
          : `${item.name}，${item.layout.count} 个色块`
      );
      button.title = item.isRandom
        ? "每局随机抽取不同棋谱"
        : `${item.name} · ${item.note} · ${item.layout.count} 块`;
      button.appendChild(createLayoutMini(item.layout, item.isRandom));

      const name = document.createElement("strong");
      name.textContent = item.name;
      const count = document.createElement("small");
      count.textContent = item.countLabel;
      button.appendChild(name);
      button.appendChild(count);
      fragment.appendChild(button);
    }

    els.layoutGroup.innerHTML = "";
    els.layoutGroup.appendChild(fragment);
    updateLayoutCards();
  }

  function updateLayoutCards() {
    if (!els.layoutGroup) return;
    for (const card of els.layoutGroup.querySelectorAll("[data-layout]")) {
      const active = card.dataset.layout === state.layoutChoice;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function buildCharacterCards() {
    if (!els.characterGroup) return;
    const fragment = document.createDocumentFragment();
    for (const id of CHARACTER_IDS) {
      const character = CHARACTERS[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "character-card";
      button.dataset.character = id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute(
        "aria-label",
        `${character.name}，特技${character.skillName}：${character.cardDescription}`
      );
      button.title = `${character.name} · ${character.skillName}：${character.cardDescription}`;

      const avatar = document.createElement("span");
      avatar.className = "character-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = character.avatar;

      const info = document.createElement("span");
      info.className = "character-info";
      const name = document.createElement("strong");
      name.textContent = character.name;
      const skill = document.createElement("span");
      skill.textContent = character.skillName;
      const desc = document.createElement("small");
      desc.textContent = character.effect;
      info.append(name, skill, desc);

      const check = document.createElement("span");
      check.className = "character-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";

      button.append(avatar, info, check);
      fragment.appendChild(button);
    }
    els.characterGroup.innerHTML = "";
    els.characterGroup.appendChild(fragment);
    updateCharacterCards();
    updateCharacterUI();
  }

  function buildCharacterEffects() {
    if (!els.characterEffects) return;
    const fragment = document.createDocumentFragment();
    for (const id of CHARACTER_IDS) {
      const character = CHARACTERS[id];
      const item = document.createElement("span");
      item.dataset.character = id;
      item.setAttribute("role", "listitem");
      item.title = `${character.name} · ${character.skillName}：${character.cardDescription}`;
      item.textContent = character.effect;
      fragment.appendChild(item);
    }
    els.characterEffects.innerHTML = "";
    els.characterEffects.appendChild(fragment);
  }

  function updateCharacterCards() {
    if (!els.characterGroup) return;
    for (const card of els.characterGroup.querySelectorAll("[data-character]")) {
      const active = card.dataset.character === state.character;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function updateCharacterUI() {
    const character = CHARACTERS[state.character] || CHARACTERS.role1;
    if (els.playerAvatar) {
      els.playerAvatar.textContent = character.avatar;
      els.playerAvatar.dataset.role = character.id;
    }
    if (els.playerName) els.playerName.textContent = character.name;
    if (els.playerCard) {
      els.playerCard.style.setProperty("--player-accent", character.accent);
      els.playerCard.style.setProperty("--player-accent-soft", character.accentSoft);
    }
    if (els.skillNameLabel) els.skillNameLabel.textContent = character.skillName;
    if (els.settingCharacterAvatar) {
      els.settingCharacterAvatar.textContent = character.avatar;
      els.settingCharacterAvatar.dataset.role = character.id;
    }
    if (els.settingCharacterTitle) {
      els.settingCharacterTitle.textContent = `${character.name} · ${character.skillName}`;
    }
    if (els.settingCharacterDesc) {
      els.settingCharacterDesc.textContent = character.settingDescription;
    }
    updateControls();
  }

  function setCharacter(id) {
    if (!CHARACTERS[id]) return;
    if (
      state.status === "playing" ||
      state.status === "paused" ||
      state.status === "ending"
    ) {
      return;
    }
    state.character = id;
    updateCharacterCards();
    updateCharacterUI();
  }

  function buildAiCharacterCards() {
    if (!els.aiCharacterGroup) return;
    const fragment = document.createDocumentFragment();
    const items = [
      {
        id: "random",
        name: "随机",
        emoji: "🎲",
        accent: "#b8c5d9",
        soft: "rgba(184, 197, 217, 0.12)",
      },
      ...CHARACTER_IDS.map((id) => ({
        id,
        name: CHARACTERS[id].name,
        emoji: CHARACTERS[id].avatar,
        accent: CHARACTERS[id].accent,
        soft: CHARACTERS[id].accentSoft,
      })),
    ];

    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ai-role-chip";
      button.dataset.aiCharacter = item.id;
      button.style.setProperty("--role-accent", item.accent);
      button.style.setProperty("--role-soft", item.soft);
      button.setAttribute("aria-pressed", "false");
      button.setAttribute(
        "aria-label",
        item.id === "random"
          ? "电脑随机选择角色"
          : `电脑使用${item.name}`
      );
      button.title =
        item.id === "random"
          ? "每局随机选择电脑角色"
          : `${item.name} · ${CHARACTERS[item.id].skillName}：${CHARACTERS[item.id].cardDescription}`;
      const emoji = document.createElement("span");
      emoji.className = "chip-emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = item.emoji;
      const name = document.createElement("span");
      name.className = "chip-name";
      name.textContent = item.name;
      button.append(emoji, name);
      fragment.appendChild(button);
    }

    els.aiCharacterGroup.innerHTML = "";
    els.aiCharacterGroup.appendChild(fragment);
    updateAiCharacterChips();
    updateAiCharacterUI();
  }

  function updateAiCharacterChips() {
    if (!els.aiCharacterGroup) return;
    for (const chip of els.aiCharacterGroup.querySelectorAll("[data-ai-character]")) {
      const active = chip.dataset.aiCharacter === state.aiCharacterChoice;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function updateAiCharacterUI() {
    const ai = CHARACTERS[state.aiCharacter] || CHARACTERS.role1;
    if (els.aiAvatar) {
      els.aiAvatar.textContent = ai.avatar;
      els.aiAvatar.dataset.role = ai.id;
    }
    if (els.aiName) els.aiName.textContent = `电脑 · ${ai.name}`;
    if (els.aiCard) {
      els.aiCard.style.setProperty("--ai-accent", ai.accent);
      els.aiCard.style.setProperty("--ai-accent-soft", ai.accentSoft);
      els.aiCard.title = `电脑角色：${ai.name} · 特技${ai.skillName}`;
      els.aiCard.setAttribute(
        "aria-label",
        `电脑，${ai.name}，特技${ai.skillName}`
      );
    }
    updateAiSkillUI();
  }

  function setAiCharacterChoice(id) {
    if (id !== "random" && !CHARACTERS[id]) return;
    if (
      state.status === "playing" ||
      state.status === "paused" ||
      state.status === "ending"
    ) {
      return;
    }
    state.aiCharacterChoice = id;
    if (id !== "random") {
      state.aiCharacter = id;
      updateAiCharacterUI();
    }
    updateAiCharacterChips();
  }

  function resolveAiCharacter() {
    if (state.aiCharacterChoice === "random") {
      state.aiCharacter =
        CHARACTER_IDS[Math.floor(Math.random() * CHARACTER_IDS.length)];
    } else {
      state.aiCharacter = state.aiCharacterChoice;
    }
    updateAiCharacterUI();
  }

  function updateBoardLabels() {
    if (!state.layout) return;
    els.layoutLabel.textContent = `棋谱 · ${state.layout.name}`;
    els.boardMeta.textContent = `${state.layout.count} 块 · 最多 2 弯`;
  }

  function setLayoutChoice(id) {
    if (id !== "random" && !getLayoutById(id)) return;
    if (state.status === "playing" || state.status === "paused") return;
    state.layoutChoice = id;
    updateLayoutCards();
    preparePreview();
  }

  function setDifficulty(key) {
    const next = DIFFICULTIES[key] ? key : "normal";
    state.difficulty = next;
    for (const button of els.difficultyButtons) {
      const active = button.dataset.difficulty === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
    updateAiSkillUI();
  }

  function currentAiInterval() {
    return DIFFICULTIES[state.difficulty].interval;
  }

  function aiSkillChance() {
    return (DIFFICULTIES[state.difficulty] || DIFFICULTIES.normal).skillChance;
  }

  function aiSkillsEnabled() {
    return aiSkillChance() > 0;
  }

  function rollAiSkillDuration() {
    return (
      AI_SKILL_MIN_SECONDS +
      Math.random() * (AI_SKILL_MAX_SECONDS - AI_SKILL_MIN_SECONDS)
    );
  }

  function createBoard() {
    if (!state.layout) state.layout = chooseLayout(state.layoutChoice);
    return LLK.createPlayableBoardFromMask(state.layout.mask, COLORS.length);
  }

  function scheduleAnimationClassCleanup(tile, className, fallbackMs) {
    let timer = null;
    const cleanup = () => {
      tile.classList.remove(className);
      tile.removeEventListener("animationend", onEnd);
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const onEnd = (event) => {
      if (event.target === tile) cleanup();
    };
    tile.addEventListener("animationend", onEnd);
    timer = setTimeout(cleanup, fallbackMs);
  }

  function createTileElement(row, col, color, mode, order) {
    const tile = document.createElement("button");
    const item = getThemeItem(color);
    tile.type = "button";
    tile.className = "tile";
    if (mode === "deal") {
      tile.classList.add("is-dealt");
      scheduleAnimationClassCleanup(tile, "is-dealt", 1500);
    }
    if (mode === "shuffle") {
      tile.classList.add("is-shuffled");
      scheduleAnimationClassCleanup(tile, "is-shuffled", 1600);
    }
    if (mode === "rearrange") {
      tile.classList.add("is-rearranged");
      scheduleAnimationClassCleanup(tile, "is-rearranged", 800);
    }
    tile.dataset.row = String(row);
    tile.dataset.col = String(col);
    tile.style.setProperty("--x", col + 1);
    tile.style.setProperty("--y", row + 1);
    tile.style.setProperty("--order", Math.min(order || 0, 90));
    tile.style.setProperty("--tile-color", COLORS[color].hex);
    tile.setAttribute("aria-pressed", "false");
    tile.setAttribute(
      "aria-label",
      `${item.food}（${COLORS[color].name}色）色块，第 ${row + 1} 行第 ${col + 1} 列`
    );
    tile.title = `${item.food} · ${COLORS[color].name}色`;
    const emoji = document.createElement("span");
    emoji.className = "tile-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = item.emoji;
    tile.appendChild(emoji);
    if (state.copyTileKeys.has(keyOf(row, col))) {
      tile.classList.add("is-copy-tile");
      const marker = document.createElement("span");
      marker.className = "copy-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = "🔥";
      tile.appendChild(marker);
      tile.title = `${item.food} · 复制能力方块`;
      tile.setAttribute(
        "aria-label",
        `${item.food}（${COLORS[color].name}色）复制能力方块，第 ${row + 1} 行第 ${col + 1} 列`
      );
    }
    return tile;
  }

  function renderBoard(mode) {
    clearTimeout(state.pathTimer);
    els.pathLayer.innerHTML = "";
    els.tileLayer.innerHTML = "";
    tileEls.clear();
    state.selected = null;
    updateBoardLabels();

    const rows = state.board.length;
    const cols = state.board[0] ? state.board[0].length : 0;
    const fragment = document.createDocumentFragment();
    let order = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const color = state.board[row][col];
        if (color === null || color === undefined) continue;
        const tile = createTileElement(row, col, color, mode, order);
        fragment.appendChild(tile);
        tileEls.set(keyOf(row, col), tile);
        order += 1;
      }
    }
    els.tileLayer.appendChild(fragment);
    applyWebClasses();
  }

  function appendSplitTile(row, col, color) {
    const tile = createTileElement(row, col, color, "split", 0);
    tile.classList.add("is-split-new");
    scheduleAnimationClassCleanup(tile, "is-split-new", 700);
    els.tileLayer.appendChild(tile);
    tileEls.set(keyOf(row, col), tile);
    return tile;
  }

  function setStatus(text, tone) {
    els.statusText.textContent = text;
    els.statusWrap.classList.toggle("is-warn", tone === "warn");
    els.statusWrap.classList.toggle("is-error", tone === "error");
  }

  function showToast(text, tone, duration) {
    const token = ++state.toastToken;
    clearTimeout(state.toastTimer);
    els.toast.textContent = text;
    els.toast.dataset.tone = tone || "info";
    els.toast.hidden = false;
    // 强制一次重排，让连续提示也能重新播放入场过渡。
    void els.toast.offsetWidth;
    els.toast.classList.add("is-visible");
    state.toastTimer = setTimeout(() => {
      if (token !== state.toastToken) return;
      els.toast.classList.remove("is-visible");
      state.toastTimer = setTimeout(() => {
        if (token === state.toastToken) els.toast.hidden = true;
      }, 220);
    }, typeof duration === "number" ? duration : 1700);
  }

  function formatClock(seconds) {
    const total = Math.max(0, Math.ceil(seconds - 0.0001));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function updateClock() {
    if (state.mode === "endless") {
      els.clock.classList.remove("is-urgent");
      els.clock.classList.add("is-endless");
      els.clock.setAttribute(
        "aria-label",
        `回合 ${state.round}/${state.totalRounds}`
      );
      els.timer.textContent = `${state.round}/${state.totalRounds}`;
      els.clockLabel.textContent = "回合";
      els.clockTrack.hidden = true;
      return;
    }
    els.clock.classList.remove("is-endless");
    els.clock.classList.remove("is-urgent");
    els.clock.setAttribute("aria-label", "剩余时间");
    els.clockLabel.textContent = "剩余时间";
    els.clockTrack.hidden = false;
    const shown = state.status === "idle" ? state.timeLimit : state.timeLeft;
    els.timer.textContent = formatClock(shown);
    const ratio = Math.max(0, Math.min(1, shown / state.timeLimit));
    els.timerBar.style.width = `${ratio * 100}%`;
    const urgent =
      (state.status === "playing" || state.status === "paused") &&
      state.timeLeft <= 10.5;
    els.clock.classList.toggle("is-urgent", urgent);
  }

  function renderHud() {
    els.playerScore.textContent = String(state.playerScore);
    els.aiScore.textContent = String(state.aiScore);
    els.remaining.textContent = String(state.remaining);
    updateClock();
    updateControls();
  }

  function updateControls() {
    const canPause = state.status === "playing" || state.status === "paused";
    els.pauseBtn.disabled = !canPause;
    els.pauseBtn.textContent = state.status === "paused" ? "继续" : "暂停";
    updateSkillUI();
    updateAiSkillUI();
    updateCopyAbilityUI();
  }

  function loadAutoSkillSetting() {
    try {
      return window.localStorage.getItem(AUTO_SKILL_STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function saveAutoSkillSetting(enabled) {
    try {
      window.localStorage.setItem(AUTO_SKILL_STORAGE_KEY, enabled ? "1" : "0");
    } catch (error) {
      // 本地文件环境可能禁用 localStorage，忽略即可。
    }
  }

  function syncAutoSkillToggle() {
    if (els.autoSkillToggle) els.autoSkillToggle.checked = state.autoSkill;
    if (els.startSettingsBtn) {
      els.startSettingsBtn.textContent = state.autoSkill
        ? "特技自动：开"
        : "特技自动：关";
      els.startSettingsBtn.classList.toggle("is-auto", state.autoSkill);
      els.startSettingsBtn.setAttribute(
        "aria-pressed",
        state.autoSkill ? "true" : "false"
      );
      els.startSettingsBtn.title = state.autoSkill
        ? "点击关闭玩家特技自动释放"
        : "点击开启玩家特技自动释放";
    }
    if (els.settingsBtn) {
      els.settingsBtn.classList.toggle("is-auto", state.autoSkill);
      els.settingsBtn.title = state.autoSkill
        ? "特技自动释放已开启"
        : "打开设置";
    }
  }

  function updateSkillUI() {
    if (!els.skillBtn) return;
    const character = CHARACTERS[state.character] || CHARACTERS.role1;
    const ratio = state.skillReady
      ? 1
      : Math.max(0, Math.min(1, state.skillCharge / SKILL_CHARGE_SECONDS));
    els.skillBar.style.width = `${ratio * 100}%`;

    const ready = state.skillReady && !state.castingSkill;
    const canUse =
      state.status === "playing" &&
      state.skillReady &&
      !state.castingSkill &&
      !state.reshuffling;
    els.skillBtn.disabled = !canUse;
    els.skillBtn.classList.toggle("is-ready", ready);
    els.skillBtn.classList.toggle("is-casting", state.castingSkill);
    els.playerCard.classList.toggle("skill-ready", ready);

    let stateText;
    let label;
    if (state.castingSkill) {
      stateText = "释放中";
      label = `${character.skillName}正在释放`;
    } else if (state.skillReady) {
      stateText = state.autoSkill ? "自动" : "就绪";
      label = state.autoSkill
        ? `${character.skillName}已就绪，将自动释放`
        : `释放${character.name}特技${character.skillName}，快捷键 E`;
    } else {
      const left = Math.max(0, SKILL_CHARGE_SECONDS - state.skillCharge);
      stateText = `${left.toFixed(1)}s`;
      label = `${character.skillName}充能中，还剩 ${left.toFixed(1)} 秒`;
    }

    els.skillState.textContent = stateText;
    els.skillBtn.setAttribute("aria-label", label);
    els.skillBtn.title = label;
  }

  function updateAiSkillUI() {
    if (!els.aiSkillBar) return;
    const ai = CHARACTERS[state.aiCharacter] || CHARACTERS.role1;
    const chance = aiSkillChance();
    const disabled = chance <= 0;
    const duration = Math.max(
      AI_SKILL_MIN_SECONDS,
      state.aiSkillDuration || AI_SKILL_MIN_SECONDS
    );
    const ready = !disabled && state.aiSkillReady && !state.aiCastingSkill;
    const ratio = disabled
      ? 0
      : state.aiSkillReady
        ? 1
        : Math.max(0, Math.min(1, state.aiSkillCharge / duration));
    els.aiSkillBar.style.width = `${ratio * 100}%`;
    els.aiCard.classList.toggle("ai-skill-ready", ready);
    els.aiCard.classList.toggle("ai-skill-disabled", disabled);

    let skillState = "";
    if (disabled) {
      skillState = "春风模式：电脑不发动特技";
    } else if (state.aiCastingSkill) {
      skillState = "特技释放中";
    } else if (state.aiSkillReady) {
      skillState = "特技已就绪，即将自动释放";
    } else {
      const left = Math.max(0, duration - state.aiSkillCharge);
      const chanceText =
        chance < 1 ? ` · ${Math.round(chance * 100)}% 概率发动` : "";
      skillState = `特技充能 ${left.toFixed(1)} 秒${chanceText}`;
    }
    els.aiCard.title = `电脑角色：${ai.name} · ${ai.skillName} · ${skillState}`;
    els.aiCard.setAttribute(
      "aria-label",
      `电脑，${ai.name}，特技${ai.skillName}，${skillState}`
    );
  }

  function clearAiSkillTimer() {
    clearTimeout(state.aiAutoTimer);
    state.aiAutoTimer = null;
  }

  function scheduleAiSkill(delay) {
    clearAiSkillTimer();
    if (
      !aiSkillsEnabled() ||
      !state.aiSkillReady ||
      state.status !== "playing" ||
      state.aiCastingSkill ||
      state.reshuffling ||
      state.remaining <= 0
    ) {
      return;
    }
    state.aiAutoTimer = setTimeout(() => {
      state.aiAutoTimer = null;
      if (
        aiSkillsEnabled() &&
        state.aiSkillReady &&
        state.status === "playing" &&
        !state.aiCastingSkill &&
        !state.reshuffling
      ) {
        triggerAiSkill(true);
      }
    }, Math.max(60, typeof delay === "number" ? delay : AI_SKILL_TRIGGER_DELAY_MS));
  }

  function resetAiSkillCycle() {
    state.aiSkillReady = false;
    state.aiSkillCharge = 0;
    state.aiSkillDuration = rollAiSkillDuration();
    state.lastAiSkillTick = performance.now();
    updateAiSkillUI();
  }

  function onAiSkillReady() {
    const chance = aiSkillChance();
    if (chance <= 0) {
      resetAiSkillCycle();
      return;
    }
    if (chance < 1 && Math.random() >= chance) {
      // 标准模式：本次蓄力没有通过 50% 判定，等下一轮重新蓄力。
      resetAiSkillCycle();
      return;
    }
    updateAiSkillUI();
    scheduleAiSkill(AI_SKILL_TRIGGER_DELAY_MS);
  }

  function advanceAiSkill(deltaSeconds) {
    if (!aiSkillsEnabled()) {
      state.aiSkillCharge = 0;
      state.aiSkillReady = false;
      return;
    }
    if (state.aiCastingSkill || state.aiSkillReady) return;
    const duration = Math.max(
      AI_SKILL_MIN_SECONDS,
      state.aiSkillDuration || AI_SKILL_MIN_SECONDS
    );
    state.aiSkillCharge = Math.min(
      duration,
      state.aiSkillCharge + Math.max(0, deltaSeconds)
    );
    if (state.aiSkillCharge >= duration) {
      state.aiSkillCharge = duration;
      state.aiSkillReady = true;
      onAiSkillReady();
    }
  }

  function clearAutoSkillTimer() {
    clearTimeout(state.autoSkillTimer);
    state.autoSkillTimer = null;
  }

  function scheduleAutoSkill(delay) {
    clearAutoSkillTimer();
    if (
      !state.autoSkill ||
      !state.skillReady ||
      state.status !== "playing" ||
      state.castingSkill ||
      state.reshuffling ||
      state.remaining <= 0
    ) {
      return;
    }
    state.autoSkillTimer = setTimeout(() => {
      state.autoSkillTimer = null;
      if (
        state.autoSkill &&
        state.skillReady &&
        state.status === "playing" &&
        !state.castingSkill &&
        !state.reshuffling
      ) {
        triggerSkill(true);
      }
    }, Math.max(180, typeof delay === "number" ? delay : 430));
  }

  function onSkillReady() {
    const character = CHARACTERS[state.character] || CHARACTERS.role1;
    updateSkillUI();
    if (state.autoSkill) {
      scheduleAutoSkill(430);
    } else {
      setStatus(`${character.skillName}已就绪 · 点击「释放」或按 E`, "info");
      showToast(`${character.name}特技已就绪`, "ok", 1100);
    }
  }

  function advanceSkill(deltaSeconds) {
    if (state.castingSkill || state.skillReady) return;
    state.skillCharge = Math.min(
      SKILL_CHARGE_SECONDS,
      state.skillCharge + Math.max(0, deltaSeconds)
    );
    if (state.skillCharge >= SKILL_CHARGE_SECONDS) {
      state.skillCharge = SKILL_CHARGE_SECONDS;
      state.skillReady = true;
      onSkillReady();
    }
  }

  function skillCellKey(cell) {
    return `${cell.row}:${cell.col}`;
  }

  function getAiGuardedCells() {
    const now = performance.now();
    for (const [key, expiresAt] of state.splitGuards) {
      if (expiresAt <= now) state.splitGuards.delete(key);
    }
    return new Set(state.splitGuards.keys());
  }

  function guardPlayerSplit(result) {
    if (!result) return;
    const expiresAt = performance.now() + PLAYER_SPLIT_AI_GUARD_MS;
    for (const split of result.splits) {
      state.splitGuards.set(skillCellKey(split.source), expiresAt);
      state.splitGuards.set(skillCellKey(split.target), expiresAt);
    }
  }

  function filterMovesOutsideGuard(moves, guarded) {
    if (!guarded || !guarded.size) return moves;
    return moves.filter(
      (move) =>
        !guarded.has(skillCellKey(move.a)) && !guarded.has(skillCellKey(move.b))
    );
  }

  function setTileWebbed(tile, webbed, actor) {
    if (!tile) return;
    if (webbed) {
      if (!tile.dataset.webBaseTitle) {
        tile.dataset.webBaseTitle = tile.title || "";
      }
      tile.classList.add("is-webbed");
      tile.classList.toggle("is-own-web", actor === "player");
      if (actor === "player") {
        tile.removeAttribute("aria-disabled");
      } else {
        tile.setAttribute("aria-disabled", "true");
      }
      tile.title =
        actor === "player"
          ? "你布下的蛛网 · 可以点击消除"
          : "敌方蛛网 · 3 秒内不可点击";
      if (!tile.querySelector(".tile-web")) {
        const web = document.createElement("span");
        web.className = "tile-web";
        web.setAttribute("aria-hidden", "true");
        web.textContent = "🕸️";
        tile.appendChild(web);
      }
      return;
    }
    tile.classList.remove("is-webbed", "is-own-web");
    tile.removeAttribute("aria-disabled");
    const web = tile.querySelector(".tile-web");
    if (web) web.remove();
    if (tile.dataset.webBaseTitle !== undefined) {
      tile.title = tile.dataset.webBaseTitle;
      delete tile.dataset.webBaseTitle;
    }
  }

  function getWebbedCellKeys() {
    const now = performance.now();
    const keys = new Set();
    for (const [key, expiresAt] of state.webbedCells) {
      if (expiresAt > now) keys.add(key);
    }
    return keys;
  }

  function isCellWebbed(row, col) {
    const expiresAt = state.webbedCells.get(`${row}:${col}`);
    return Boolean(expiresAt && expiresAt > performance.now());
  }

  function getWebCellOwner(row, col) {
    const key = `${row}:${col}`;
    const expiresAt = state.webbedCells.get(key);
    if (!expiresAt || expiresAt <= performance.now()) return null;
    return state.webCellActors.get(key) || null;
  }

  function scheduleWebCleanup() {
    clearTimeout(state.webCleanupTimer);
    state.webCleanupTimer = null;
    if (!state.webGroups.length) return;
    const now = performance.now();
    const nextExpiry = state.webGroups.reduce(
      (next, group) => Math.min(next, group.expiresAt),
      Infinity
    );
    if (nextExpiry <= now) {
      cleanupExpiredWebGroups();
      return;
    }
    if (nextExpiry < Infinity) {
      state.webCleanupTimer = setTimeout(
        cleanupExpiredWebGroups,
        Math.max(30, nextExpiry - now + 20)
      );
    }
  }

  function cleanupExpiredWebGroups() {
    state.webCleanupTimer = null;
    const now = performance.now();
    const due = state.webGroups.filter((group) => group.expiresAt <= now);
    if (!due.length) {
      scheduleWebCleanup();
      return;
    }
    state.webGroups = state.webGroups.filter((group) => group.expiresAt > now);

    let removedTilesTotal = 0;
    let playerRemovedTiles = 0;
    let playerCopyHit = false;
    let aiCopyHit = false;
    let lastActor = "player";
    for (const group of due) {
      lastActor = group.actor;
      let removedTiles = 0;
      for (const cell of group.cells) {
        const key = skillCellKey(cell);
        state.webbedCells.delete(key);
        state.webCellActors.delete(key);
        const tile = tileEls.get(key);
        if (tile) {
          spawnStarBurst(tile.getBoundingClientRect(), 3);
          setTileWebbed(tile, false);
          tile.classList.add("is-web-fading");
          setTimeout(() => {
            if (tile.isConnected) tile.remove();
          }, 420);
        }
        tileEls.delete(key);
        if (
          state.board[cell.row] &&
          state.board[cell.row][cell.col] !== null &&
          state.board[cell.row][cell.col] !== undefined
        ) {
          state.board[cell.row][cell.col] = null;
          removedTiles += 1;
        }
      }
      if (removedTiles > 0) {
        removedTilesTotal += removedTiles;
        if (group.actor === "player") playerRemovedTiles += removedTiles;
        if (collectCopyTiles(group.cells)) {
          if (group.actor === "player") playerCopyHit = true;
          else aiCopyHit = true;
        }
        addActorScore(group.actor, removedTiles);
      }
    }

    if (removedTilesTotal > 0) {
      state.remaining = Math.max(0, state.remaining - removedTilesTotal);
      renderHud();
      if (playerRemovedTiles > 0) {
        registerPlayerCombo(Math.max(1, Math.floor(playerRemovedTiles / 2)));
      }
      if (state.status === "playing") {
        const who = lastActor === "ai" ? "电脑" : "你";
        setStatus(`蛛网消散 · ${who}消除了 ${removedTilesTotal} 块`, "warn");
        showToast(
          `蛛网消散 · ${removedTilesTotal} 块已消除`,
          lastActor === "ai" ? "warn" : "ok",
          1500
        );
        queueBoardCheck();
      }
    }
    if (playerCopyHit) grantCopyAbility("player");
    if (aiCopyHit) grantCopyAbility("ai");
    scheduleWebCleanup();
  }

  function markWebbedPairs(pairs, actor) {
    if (!pairs.length) return 0;
    const expiresAt = performance.now() + WEB_DURATION_MS;
    const cells = [];
    for (const pair of pairs) {
      for (const cell of pair.cells) {
        const key = skillCellKey(cell);
        state.webbedCells.set(key, expiresAt);
        state.webCellActors.set(key, actor);
        setTileWebbed(tileEls.get(key), true, actor);
        cells.push({ row: cell.row, col: cell.col });
      }
    }
    state.webGroupSeq += 1;
    state.webGroups.push({
      id: state.webGroupSeq,
      actor,
      pairCount: pairs.length,
      expiresAt,
      cells,
    });
    scheduleWebCleanup();
    return pairs.length;
  }

  function clearWebs() {
    clearTimeout(state.webCleanupTimer);
    state.webCleanupTimer = null;
    for (const key of state.webbedCells.keys()) {
      setTileWebbed(tileEls.get(key), false);
    }
    state.webbedCells.clear();
    state.webCellActors.clear();
    state.webGroups = [];
  }

  function applyWebClasses() {
    const activeKeys = getWebbedCellKeys();
    for (const key of state.webbedCells.keys()) {
      if (activeKeys.has(key)) {
        setTileWebbed(tileEls.get(key), true, state.webCellActors.get(key));
      }
    }
    if (state.webGroups.length) scheduleWebCleanup();
  }

  function getAiBlockedCells() {
    const blocked = new Set();
    for (const key of getWebbedCellKeys()) {
      if (state.webCellActors.get(key) !== "ai") blocked.add(key);
    }
    for (const key of getAiGuardedCells()) blocked.add(key);
    return blocked;
  }

  function chooseWebPairs() {
    const cellsByColor = new Map();
    const rows = state.board.length;
    const cols = state.board[0] ? state.board[0].length : 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const color = state.board[row][col];
        if (color === null || color === undefined) continue;
        if (isCellWebbed(row, col)) continue;
        if (!cellsByColor.has(color)) cellsByColor.set(color, []);
        cellsByColor.get(color).push({ row, col });
      }
    }
    const colors = LLK.shuffle([...cellsByColor.keys()]);
    const pairs = [];
    for (const color of colors) {
      const cells = LLK.shuffle(cellsByColor.get(color).slice());
      while (cells.length >= 2 && pairs.length < WEB_PAIR_COUNT) {
        const a = cells.pop();
        const b = cells.pop();
        pairs.push({ color, cells: [a, b] });
      }
      if (pairs.length >= WEB_PAIR_COUNT) break;
    }
    return pairs;
  }

  /**
   * 优先找同一花色的 3 对，且三对互不共用色块。
   * 如果同花色不足以凑 3 对，再用其他花色补齐。
   * excludedKeys 用于电脑行动时避开玩家刚分裂出的保护格。
   */
  function chooseSkillMoves(excludedKeys) {
    const allMoves = filterMovesOutsideGuard(
      LLK.findAvailableMoves(state.board),
      excludedKeys
    );
    if (!allMoves.length) return [];

    const groups = new Map();
    for (const move of allMoves) {
      if (!groups.has(move.color)) groups.set(move.color, []);
      groups.get(move.color).push(move);
    }
    const ordered = [...groups.values()].sort((a, b) => b.length - a.length);

    const takeDisjoint = (moves, limit, used) => {
      const picked = [];
      for (const move of LLK.shuffle(moves.slice())) {
        if (picked.length >= limit) break;
        const aKey = skillCellKey(move.a);
        const bKey = skillCellKey(move.b);
        if (used.has(aKey) || used.has(bKey)) continue;
        used.add(aKey);
        used.add(bKey);
        picked.push(move);
      }
      return picked;
    };

    let best = [];
    for (const group of ordered) {
      const used = new Set();
      const picked = takeDisjoint(group, 3, used);
      if (picked.length >= 3) return picked.slice(0, 3);
      if (picked.length > best.length) best = picked;
    }

    const used = new Set();
    for (const move of best) {
      used.add(skillCellKey(move.a));
      used.add(skillCellKey(move.b));
    }
    const picked = best.slice();
    for (const move of LLK.shuffle(allMoves.slice())) {
      if (picked.length >= 3) break;
      const aKey = skillCellKey(move.a);
      const bKey = skillCellKey(move.b);
      if (used.has(aKey) || used.has(bKey)) continue;
      used.add(aKey);
      used.add(bKey);
      picked.push(move);
    }
    return picked.slice(0, 3);
  }

  function showSkillVortex() {
    clearTimeout(state.vortexTimer);
    els.skillVortex.classList.remove("is-active");
    void els.skillVortex.offsetWidth;
    els.skillVortex.classList.add("is-active");
    state.vortexTimer = setTimeout(() => {
      state.vortexTimer = null;
      els.skillVortex.classList.remove("is-active");
    }, 1080);
  }

  function showBottomImpact() {
    clearTimeout(state.impactTimer);
    clearTimeout(state.shakeStartTimer);
    clearTimeout(state.shakeTimer);
    els.skillImpact.classList.remove("is-active");
    els.app.classList.remove("is-shaking");
    void els.skillImpact.offsetWidth;
    els.skillImpact.classList.add("is-active");
    state.impactTimer = setTimeout(() => {
      state.impactTimer = null;
      els.skillImpact.classList.remove("is-active");
    }, 950);

    // 先看到底部敲击，再让整个游戏区域震动。
    state.shakeStartTimer = setTimeout(() => {
      state.shakeStartTimer = null;
      els.app.classList.remove("is-shaking");
      void els.app.offsetWidth;
      els.app.classList.add("is-shaking");
      state.shakeTimer = setTimeout(() => {
        state.shakeTimer = null;
        els.app.classList.remove("is-shaking");
      }, 620);
    }, 90);
  }

  function showScreenSlash() {
    clearTimeout(state.slashTimer);
    els.skillSlash.classList.remove("is-active");
    void els.skillSlash.offsetWidth;
    els.skillSlash.classList.add("is-active");
    state.slashTimer = setTimeout(() => {
      state.slashTimer = null;
      els.skillSlash.classList.remove("is-active");
    }, 760);
  }

  function showBlackHole(x, y) {
    clearTimeout(state.blackholeTimer);
    els.skillBlackhole.style.setProperty("--hole-x", `${x}px`);
    els.skillBlackhole.style.setProperty("--hole-y", `${y}px`);
    els.skillBlackhole.classList.remove("is-active");
    void els.skillBlackhole.offsetWidth;
    els.skillBlackhole.classList.add("is-active");
    state.blackholeTimer = setTimeout(() => {
      state.blackholeTimer = null;
      els.skillBlackhole.classList.remove("is-active");
    }, 1100);
  }

  function clearSkillEffects() {
    clearTimeout(state.vortexTimer);
    state.vortexTimer = null;
    clearTimeout(state.impactTimer);
    state.impactTimer = null;
    clearTimeout(state.shakeStartTimer);
    state.shakeStartTimer = null;
    clearTimeout(state.shakeTimer);
    state.shakeTimer = null;
    clearTimeout(state.slashTimer);
    state.slashTimer = null;
    clearTimeout(state.blackholeTimer);
    state.blackholeTimer = null;
    if (els.skillVortex) els.skillVortex.classList.remove("is-active");
    if (els.skillImpact) els.skillImpact.classList.remove("is-active");
    if (els.skillSlash) els.skillSlash.classList.remove("is-active");
    if (els.skillBlackhole) els.skillBlackhole.classList.remove("is-active");
    if (els.app) els.app.classList.remove("is-shaking");
    if (els.fxLayer) els.fxLayer.innerHTML = "";
  }

  function spawnSuckClone(color, rect, index) {
    const clone = document.createElement("div");
    clone.className = "suck-clone";
    const targetX = window.innerWidth / 2 + (Math.random() * 90 - 45);
    const targetY = window.innerHeight + 130;
    const dx = targetX - (rect.left + rect.width / 2);
    const dy = targetY - (rect.top + rect.height / 2);
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.borderRadius = `${rect.width * 0.205}px`;
    clone.style.background = COLORS[color].hex;
    clone.style.setProperty("--suck-x", `${dx}px`);
    clone.style.setProperty("--suck-y", `${dy}px`);
    clone.style.setProperty("--suck-rot", `${Math.random() * 220 - 110}deg`);
    clone.style.setProperty("--suck-delay", `${index * 38}ms`);
    const emoji = document.createElement("span");
    emoji.textContent = getThemeItem(color).emoji;
    emoji.style.fontSize = `${Math.max(12, rect.width * 0.52)}px`;
    clone.appendChild(emoji);
    els.fxLayer.appendChild(clone);
    setTimeout(() => clone.remove(), 1020 + index * 38);
  }

  function spawnStarBurst(rect, amount) {
    if (!els.fxLayer || !rect) return;
    const count = amount || 3 + Math.floor(Math.random() * 3);
    const glyphs = ["✦", "✧", "★"];
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement("span");
      star.className = "star-particle";
      star.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      star.style.left = `${rect.left + rect.width / 2}px`;
      star.style.top = `${rect.top + rect.height / 2}px`;
      star.style.setProperty("--star-x", `${Math.random() * 34 - 17}px`);
      star.style.setProperty("--star-y", `${-12 - Math.random() * 28}px`);
      star.style.setProperty("--star-rot", `${Math.random() * 260 - 130}deg`);
      star.style.animationDelay = `${Math.random() * 80}ms`;
      els.fxLayer.appendChild(star);
      setTimeout(() => star.remove(), 820);
    }
  }

  function getCharacterForActor(actor) {
    return (
      CHARACTERS[actor === "ai" ? state.aiCharacter : state.character] ||
      CHARACTERS.role1
    );
  }

  function clearBoardFocus() {
    clearSelection();
    clearTimeout(state.pathTimer);
    els.pathLayer.innerHTML = "";
  }

  function beginActorSkill(actor) {
    const now = performance.now();
    if (actor === "ai") {
      clearAiSkillTimer();
      state.aiCastingSkill = true;
      state.aiSkillReady = false;
      state.aiSkillCharge = 0;
      state.lastAiSkillTick = now;
    } else {
      clearAutoSkillTimer();
      state.castingSkill = true;
      state.skillReady = false;
      state.skillCharge = 0;
      state.lastSkillTick = now;
    }
    updateControls();
  }

  function scheduleActorSkillEnd(actor) {
    const timerKey = actor === "ai" ? "aiCastTimer" : "castTimer";
    clearTimeout(state[timerKey]);
    state[timerKey] = setTimeout(() => {
      state[timerKey] = null;
      const now = performance.now();
      if (actor === "ai") {
        state.aiCastingSkill = false;
        state.aiSkillCharge = 0;
        state.aiSkillDuration = rollAiSkillDuration();
        state.lastAiSkillTick = now;
      } else {
        state.castingSkill = false;
        state.lastSkillTick = now;
      }
      updateControls();
      if (state.status === "playing") {
        queueBoardCheck();
      }
    }, 950);
  }

  function addActorScore(actor, amount) {
    if (actor === "ai") {
      state.aiScore += amount;
      pulseCard(els.aiCard);
    } else {
      state.playerScore += amount;
      pulseCard(els.playerCard);
    }
  }

  function updateComboUI(bump) {
    if (!els.comboMeter || !els.comboCount) return;
    els.comboCount.textContent = String(state.combo);
    els.comboMeter.hidden = state.combo <= 0;
    if (state.combo > 0 && bump) {
      els.comboMeter.classList.remove("is-bump");
      void els.comboMeter.offsetWidth;
      els.comboMeter.classList.add("is-bump");
      setTimeout(() => els.comboMeter?.classList.remove("is-bump"), 320);
    }
  }

  function registerPlayerCombo(amount) {
    if (state.status !== "playing") return;
    const step = Math.max(1, Math.floor(amount || 1));
    state.combo += step;
    clearTimeout(state.comboTimer);
    state.comboTimer = setTimeout(() => {
      state.comboTimer = null;
      state.combo = 0;
      updateComboUI(false);
    }, COMBO_WINDOW_MS);
    updateComboUI(true);
  }

  function breakCombo() {
    if (state.combo <= 0) return;
    state.combo = 0;
    clearTimeout(state.comboTimer);
    state.comboTimer = null;
    updateComboUI(false);
  }

  function resetCombo() {
    state.combo = 0;
    clearTimeout(state.comboTimer);
    state.comboTimer = null;
    updateComboUI(false);
  }

  function prepareCopyTiles() {
    state.copyTileKeys.clear();
    const cells = [];
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        if (state.board[row][col] !== null && state.board[row][col] !== undefined) {
          cells.push({ row, col });
        }
      }
    }
    LLK.shuffle(cells);
    for (let i = 0; i < Math.min(COPY_TILE_COUNT, cells.length); i += 1) {
      state.copyTileKeys.add(keyOf(cells[i].row, cells[i].col));
    }
  }

  function collectCopyTiles(cells) {
    let hit = false;
    for (const cell of cells) {
      if (state.copyTileKeys.delete(keyOf(cell.row, cell.col))) hit = true;
    }
    return hit;
  }

  function updateCopyAbilityUI() {
    const ability = state.copyAbility;
    if (els.copyAbilityBar) {
      els.copyAbilityBar.classList.toggle("is-active", Boolean(ability));
      els.copyAbilityBar.classList.toggle("is-empty", !ability);
    }
    if (els.copyAbilityName) {
      els.copyAbilityName.textContent = ability ? ability.name : "暂无";
    }
    if (els.copyAbilityTime) {
      els.copyAbilityTime.textContent = ability
        ? `${Math.max(0, ability.remainingMs / 1000).toFixed(1)}s`
        : "";
    }
    if (els.copyAbilityHint) {
      els.copyAbilityHint.textContent = ability ? "点击方块释放" : "";
    }
    if (els.aiCopyBadge) {
      els.aiCopyBadge.hidden = !state.aiCopyAbility;
      els.aiCopyBadge.title = state.aiCopyAbility
        ? `电脑复制能力：烈火 · ${Math.max(0, state.aiCopyAbility.remainingMs / 1000).toFixed(1)} 秒`
        : "电脑的复制能力";
    }
  }

  function grantCopyAbility(actor) {
    const target = actor === "ai" ? "ai" : "player";
    const ability = {
      name: "烈火",
      icon: "🔥",
      remainingMs: COPY_ABILITY_MS,
    };
    if (target === "ai") {
      state.aiCopyAbility = ability;
      scheduleAiCopyUse();
      setStatus("电脑获得复制能力：烈火", "warn");
      showToast("电脑获得复制能力 · 烈火 · 5 秒", "warn", 1500);
    } else {
      state.copyAbility = ability;
      setStatus("获得复制能力：烈火 · 5 秒内点击方块释放", "info");
      showToast("复制能力 · 烈火 · 5 秒内点击方块", "ok", 1600);
    }
    updateCopyAbilityUI();
  }

  function clearCopyAbility(actor) {
    if (actor === "ai") {
      state.aiCopyAbility = null;
      clearTimeout(state.aiCopyUseTimer);
      state.aiCopyUseTimer = null;
    } else {
      state.copyAbility = null;
    }
    updateCopyAbilityUI();
  }

  function clearAllCopyAbilities() {
    state.copyAbility = null;
    state.aiCopyAbility = null;
    clearTimeout(state.aiCopyUseTimer);
    state.aiCopyUseTimer = null;
    updateCopyAbilityUI();
  }

  function updateCopyAbilityTimer(deltaMs) {
    let playerExpired = false;
    let aiExpired = false;
    for (const actor of ["player", "ai"]) {
      const ability = actor === "ai" ? state.aiCopyAbility : state.copyAbility;
      if (!ability) continue;
      ability.remainingMs -= deltaMs;
      if (ability.remainingMs <= 0) {
        if (actor === "ai") {
          aiExpired = true;
          clearCopyAbility("ai");
        } else {
          playerExpired = true;
          clearCopyAbility("player");
        }
      }
    }
    if (playerExpired) {
      setStatus("烈火能力已消失", "warn");
      showToast("烈火能力已消失", "warn", 1200);
    } else if (aiExpired) {
      showToast("电脑的烈火能力已消失", "warn", 1200);
    }
    updateCopyAbilityUI();
  }

  function showFireCross(row, col) {
    if (!els.fireCross || !els.fireLayer) return;
    clearTimeout(state.fireTimer);
    const tile = tileEls.get(keyOf(row, col));
    const boardRect = els.board.getBoundingClientRect();
    const rect = tile ? tile.getBoundingClientRect() : null;
    const x = rect ? rect.left + rect.width / 2 - boardRect.left : boardRect.width / 2;
    const y = rect ? rect.top + rect.height / 2 - boardRect.top : boardRect.height / 2;
    els.fireCross.style.setProperty("--fire-x", `${x}px`);
    els.fireCross.style.setProperty("--fire-y", `${y}px`);
    els.fireCross.classList.remove("is-active");
    void els.fireCross.offsetWidth;
    els.fireCross.classList.add("is-active");
    state.fireTimer = setTimeout(() => {
      state.fireTimer = null;
      els.fireCross.classList.remove("is-active");
    }, 760);
  }

  function pickAiCopyCenter() {
    const cells = [];
    for (let row = 0; row < state.board.length; row += 1) {
      for (let col = 0; col < state.board[row].length; col += 1) {
        if (state.board[row][col] !== null && state.board[row][col] !== undefined) {
          cells.push({ row, col });
        }
      }
    }
    if (!cells.length) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  function scheduleAiCopyUse() {
    clearTimeout(state.aiCopyUseTimer);
    state.aiCopyUseTimer = null;
    if (!state.aiCopyAbility || state.status !== "playing") return;
    const chance = DIFFICULTIES[state.difficulty].skillChance;
    if (!chance) return;
    const delay = 650 + Math.random() * 650;
    state.aiCopyUseTimer = setTimeout(() => {
      state.aiCopyUseTimer = null;
      if (state.status !== "playing" || !state.aiCopyAbility) return;
      if (Math.random() >= chance) {
        scheduleAiCopyUse();
        return;
      }
      const center = pickAiCopyCenter();
      if (center) useCopyAbilityAt("ai", center.row, center.col);
      if (state.aiCopyAbility && state.status === "playing") {
        scheduleAiCopyUse();
      }
    }, delay);
  }

  function useCopyAbilityAt(actor, row, col) {
    const target = actor === "ai" ? "ai" : "player";
    const ability =
      target === "ai" ? state.aiCopyAbility : state.copyAbility;
    if (state.status !== "playing" || !ability || state.fireTimer) return false;
    clearSelection();
    showFireCross(row, col);
    const offsets = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    const cells = [];
    const seen = new Set();
    for (const [dr, dc] of offsets) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (!state.board[nextRow] || !state.board[nextRow][nextCol]) continue;
      if (state.board[nextRow][nextCol] === null) continue;
      const key = keyOf(nextRow, nextCol);
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ row: nextRow, col: nextCol });
    }
    const copyHit = collectCopyTiles(cells);
    let removed = 0;
    for (const cell of cells) {
      const key = keyOf(cell.row, cell.col);
      const tile = tileEls.get(key);
      state.board[cell.row][cell.col] = null;
      tileEls.delete(key);
      if (!tile) continue;
      spawnStarBurst(tile.getBoundingClientRect(), 3);
      tile.classList.add("is-burning");
      removed += 1;
      setTimeout(() => {
        if (tile.isConnected) tile.remove();
      }, 620);
    }
    if (removed > 0) {
      state.remaining = Math.max(0, state.remaining - removed);
      if (target === "ai") {
        state.aiScore += removed;
        pulseCard(els.aiCard);
        setStatus(`电脑发动烈火！烧毁了 ${removed} 个方块`, "warn");
        showToast(`电脑 · 烈火 · 烧毁 ${removed} 块`, "warn", 1700);
      } else {
        state.playerScore += removed;
        pulseCard(els.playerCard);
        registerPlayerCombo(1);
        setStatus(`烈火！十字火焰烧毁了 ${removed} 个方块`, "info");
        showToast(`烈火 · 十字火焰 · 烧毁 ${removed} 块`, "ok", 1700);
      }
      renderHud();
      queueBoardCheck();
    }
    if (copyHit) grantCopyAbility(target);
    return true;
  }

  function triggerSkill(automatic) {
    if (state.status !== "playing" || state.castingSkill || !state.skillReady) {
      return false;
    }
    if (state.remaining <= 0) return false;
    if (state.reshuffling) {
      if (!automatic) showToast("正在重排，稍后再释放特技", "warn", 1000);
      return false;
    }
    if (state.character === "role2") {
      return executeRearrangeSkill("player", automatic);
    }
    if (state.character === "role3") {
      return executeSplitSkill("player", automatic);
    }
    if (state.character === "role4") {
      return executeWebSkill("player", automatic);
    }
    if (state.character === "role5") {
      return executeBlackHoleSkill("player", automatic);
    }
    return executeEliminationSkill("player", automatic);
  }

  function triggerAiSkill() {
    if (
      !aiSkillsEnabled() ||
      state.status !== "playing" ||
      state.aiCastingSkill ||
      !state.aiSkillReady ||
      state.remaining <= 0
    ) {
      return false;
    }
    if (performance.now() < state.aiLockUntil) {
      scheduleAiSkill(Math.max(80, state.aiLockUntil - performance.now() + 40));
      return false;
    }
    if (state.reshuffling) {
      scheduleAiSkill(650);
      return false;
    }
    if (state.aiCharacter === "role2") {
      return executeRearrangeSkill("ai", true);
    }
    if (state.aiCharacter === "role3") {
      return executeSplitSkill("ai", true);
    }
    if (state.aiCharacter === "role4") {
      return executeWebSkill("ai", true);
    }
    if (state.aiCharacter === "role5") {
      return executeBlackHoleSkill("ai", true);
    }
    return executeEliminationSkill("ai", true);
  }

  function executeEliminationSkill(actor, automatic) {
    const character = getCharacterForActor(actor);
    const allMoves = LLK.findAvailableMoves(state.board);
    const blocked = new Set();
    for (const key of getWebbedCellKeys()) {
      if (state.webCellActors.get(key) !== actor) blocked.add(key);
    }
    if (actor === "ai") {
      for (const key of getAiGuardedCells()) blocked.add(key);
    }
    const moves = chooseSkillMoves(blocked);
    if (!moves.length) {
      if (allMoves.length) {
        if (actor === "ai") {
          scheduleAiSkill(650);
        } else if (automatic) {
          scheduleAutoSkill(900);
        } else {
          setStatus("蛛网封住了可消组合，等它消失再释放", "warn");
          showToast("被蛛网盖住的方块还不能消", "warn", 1000);
        }
        return false;
      }
      handleBoardEnd("deadlock");
      return false;
    }

    beginActorSkill(actor);
    clearBoardFocus();
    playSuikomiSound();
    state.remaining = Math.max(0, state.remaining - moves.length * 2);
    addActorScore(actor, moves.length * 2);
    if (actor === "player") registerPlayerCombo(moves.length);

    const targets = [];
    for (const move of moves) {
      for (const cell of [move.a, move.b]) {
        const color = state.board[cell.row] && state.board[cell.row][cell.col];
        const tile = tileEls.get(keyOf(cell.row, cell.col));
        if (color === null || color === undefined || !tile) continue;
        targets.push({
          color,
          tile,
          rect: tile.getBoundingClientRect(),
          key: keyOf(cell.row, cell.col),
        });
      }
      LLK.removePair(state.board, move.a, move.b);
    }
    const copyHit = collectCopyTiles(
      moves.flatMap((move) => [move.a, move.b])
    );

    showSkillVortex();
    targets.forEach((target, index) => {
      spawnStarBurst(target.rect, 3);
      spawnSuckClone(target.color, target.rect, index);
      if (target.tile.isConnected) target.tile.remove();
      tileEls.delete(target.key);
    });

    renderHud();
    if (actor === "ai") {
      setStatus(
        `电脑发动${character.skillName}，消除了 ${moves.length} 对食材（${moves.length * 2} 块）`,
        "warn"
      );
      showToast(
        `电脑 · ${character.name} · ${character.skillName} × ${moves.length}`,
        "warn",
        1600
      );
    } else {
      setStatus(
        `${character.skillName}！${automatic ? "自动" : ""}消除了 ${moves.length} 对同色食材（${moves.length * 2} 块）`,
        "info"
      );
      showToast(
        `${character.name}特技 · ${character.skillName} × ${moves.length}`,
        "ok",
        1500
      );
    }
    if (copyHit) grantCopyAbility(actor);
    scheduleActorSkillEnd(actor);
    return true;
  }

  function executeRearrangeSkill(actor, automatic) {
    const character = getCharacterForActor(actor);
    const result = LLK.swapPairsIntoAdjacent(
      state.board,
      state.layout.mask,
      { count: 4, blocked: getWebbedCellKeys() }
    );
    if (!result) {
      if (actor === "ai") {
        scheduleAiSkill(1300);
      } else if (automatic) {
        scheduleAutoSkill(1300);
      } else {
        showToast("场上可交换的相邻方块不足", "warn", 1200);
      }
      return false;
    }

    beginActorSkill(actor);
    clearBoardFocus();
    state.board = result.board;
    state.splitGuards.clear();
    if (actor === "player") {
      // 帝帝帝大王换位后，电脑短暂无法选择方块（不显示在界面上）。
      state.aiLockUntil = performance.now() + 1000;
    }

    showBottomImpact();
    renderBoard("rearrange");
    renderHud();
    if (actor === "ai") {
      setStatus(
        `电脑发动${character.skillName}！${result.pairCount} 对交换为并列`,
        "warn"
      );
      showToast(
        `电脑 · ${character.name} · ${character.skillName} · ${result.pairCount} 对并列`,
        "warn",
        1600
      );
    } else {
      setStatus(
        `${character.skillName}！随机 ${result.pairCount} 对已交换为并列`,
        "info"
      );
      showToast(
        `${character.name}特技 · ${character.skillName} · ${result.pairCount} 对并列`,
        "ok",
        1600
      );
    }
    scheduleActorSkillEnd(actor);
    return true;
  }

  function executeSplitSkill(actor, automatic) {
    const character = getCharacterForActor(actor);
    const result = LLK.splitTilesIntoAdjacentPairs(
      state.board,
      state.layout.mask,
      { count: 4, blocked: getWebbedCellKeys() }
    );
    if (!result) {
      if (actor === "ai") {
        scheduleAiSkill(1300);
      } else if (automatic) {
        scheduleAutoSkill(1300);
      } else {
        setStatus("周围没有空位，消掉一些方块后再释放新月斩击", "warn");
        showToast("没有足够空位让方块分裂", "warn", 1400);
      }
      return false;
    }

    beginActorSkill(actor);
    clearBoardFocus();
    state.board = result.board;
    state.remaining += result.addedTiles;
    if (actor === "player") guardPlayerSplit(result);

    showScreenSlash();
    for (const split of result.splits) {
      const source = tileEls.get(keyOf(split.source.row, split.source.col));
      if (source) {
        source.classList.remove("is-split-source");
        void source.offsetWidth;
        source.classList.add("is-split-source");
        scheduleAnimationClassCleanup(source, "is-split-source", 700);
      }
      appendSplitTile(split.target.row, split.target.col, split.color);
    }

    renderHud();
    if (actor === "ai") {
      setStatus(
        `电脑发动${character.skillName}！新增 ${result.addedTiles} 个方块`,
        "warn"
      );
      showToast(
        `电脑 · ${character.name} · ${character.skillName} · +${result.addedTiles} 块`,
        "warn",
        1600
      );
    } else {
      setStatus(
        `${character.skillName}！${result.addedTiles} 个方块分裂成并列双块（新方块 2.5 秒防吸）`,
        "info"
      );
      showToast(
        `${character.name}特技 · ${character.skillName} · +${result.addedTiles} 块 · 短暂防吸`,
        "ok",
        1800
      );
    }
    scheduleActorSkillEnd(actor);
    return true;
  }

  function executeWebSkill(actor, automatic) {
    const character = getCharacterForActor(actor);
    const pairs = chooseWebPairs();
    if (!pairs.length) {
      if (actor === "ai") {
        scheduleAiSkill(1300);
      } else if (automatic) {
        scheduleAutoSkill(1300);
      } else {
        setStatus("场上没有可以结网的方块对", "warn");
        showToast("没有可以结网的方块对", "warn", 1200);
      }
      return false;
    }

    beginActorSkill(actor);
    clearBoardFocus();
    const pairCount = markWebbedPairs(pairs, actor);
    renderHud();
    if (actor === "ai") {
      setStatus(
        `电脑发动${character.skillName}！${pairCount} 对结网；你不能点击，3 秒后自动消除`,
        "warn"
      );
      showToast(
        `电脑 · ${character.name} · ${character.skillName} · ${pairCount} 对（敌方蛛网不可点击）`,
        "warn",
        1600
      );
    } else {
      setStatus(
        `${character.skillName}！${pairCount} 对结网；你可以点击消除，3 秒后也会自动消除`,
        "info"
      );
      showToast(
        `${character.name}特技 · ${character.skillName} · ${pairCount} 对 · 你布下的蛛网可点击`,
        "ok",
        1600
      );
    }
    scheduleActorSkillEnd(actor);
    return true;
  }

  function executeBlackHoleSkill(actor, automatic) {
    const character = getCharacterForActor(actor);
    const result = LLK.suckAdjacentCluster(
      state.board,
      state.layout.mask,
      { min: 7, max: 11, blocked: getWebbedCellKeys() }
    );
    if (!result) {
      if (actor === "ai") {
        scheduleAiSkill(1300);
      } else if (automatic) {
        scheduleAutoSkill(1300);
      } else {
        setStatus("棋盘上可吸入的相邻方块不足", "warn");
        showToast("可吸入的相邻方块不足", "warn", 1200);
      }
      return false;
    }

    beginActorSkill(actor);
    clearBoardFocus();
    playMagolorSounds();
    const copyHit = collectCopyTiles(result.cells);
    const rects = [];
    for (const cell of result.cells) {
      const tile = tileEls.get(keyOf(cell.row, cell.col));
      if (!tile) continue;
      rects.push(tile.getBoundingClientRect());
    }
    const centerX = rects.length
      ? rects.reduce((sum, rect) => sum + rect.left + rect.width / 2, 0) / rects.length
      : window.innerWidth / 2;
    const centerY = rects.length
      ? rects.reduce((sum, rect) => sum + rect.top + rect.height / 2, 0) / rects.length
      : window.innerHeight / 2;
    const boardRect = els.board.getBoundingClientRect();
    const marginX = Math.min(82, boardRect.width / 2);
    const marginY = Math.min(82, boardRect.height / 2);
    const holeX = Math.max(
      marginX,
      Math.min(boardRect.width - marginX, centerX - boardRect.left)
    );
    const holeY = Math.max(
      marginY,
      Math.min(boardRect.height - marginY, centerY - boardRect.top)
    );
    const suctionX = boardRect.left + holeX;
    const suctionY = boardRect.top + holeY;
    showBlackHole(holeX, holeY);

    for (const cell of result.cells) {
      const key = keyOf(cell.row, cell.col);
      const tile = tileEls.get(key);
      state.board[cell.row][cell.col] = null;
      tileEls.delete(key);
      if (!tile) continue;
      const rect = tile.getBoundingClientRect();
      tile.style.setProperty(
        "--hole-dx",
        `${suctionX - (rect.left + rect.width / 2)}px`
      );
      tile.style.setProperty(
        "--hole-dy",
        `${suctionY - (rect.top + rect.height / 2)}px`
      );
      tile.classList.add("is-sucked");
      setTimeout(() => {
        if (tile.isConnected) tile.remove();
      }, 620);
    }

    state.remaining = Math.max(0, state.remaining - result.removedCount);
    addActorScore(actor, result.removedCount);
    if (actor === "player") registerPlayerCombo(1);
    renderHud();
    if (actor === "ai") {
      setStatus(
        `电脑发动${character.skillName}！吸入了 ${result.removedCount} 个方块`,
        "warn"
      );
      showToast(
        `电脑 · ${character.name} · ${character.skillName} · ${result.removedCount} 块`,
        "warn",
        1600
      );
    } else {
      setStatus(
        `${character.skillName}！随机吸入了 ${result.removedCount} 个相邻方块`,
        "info"
      );
      showToast(
        `${character.name}特技 · ${character.skillName} · ${result.removedCount} 块`,
        "ok",
        1600
      );
    }
    if (copyHit) grantCopyAbility(actor);
    scheduleActorSkillEnd(actor);
    return true;
  }

  function setAutoSkill(enabled, options) {
    state.autoSkill = Boolean(enabled);
    syncAutoSkillToggle();
    if (!state.autoSkill) clearAutoSkillTimer();
    if (options && options.persist !== false) saveAutoSkillSetting(state.autoSkill);
    if (
      state.autoSkill &&
      state.status === "playing" &&
      state.skillReady &&
      !state.castingSkill &&
      !state.reshuffling
    ) {
      scheduleAutoSkill(420);
    }
    updateControls();
  }

  function clearSelection() {
    if (!state.selected) return;
    const previous = tileEls.get(keyOf(state.selected.row, state.selected.col));
    if (previous) {
      previous.classList.remove("is-selected");
      previous.setAttribute("aria-pressed", "false");
    }
    state.selected = null;
  }

  function selectTile(row, col) {
    clearSelection();
    const tile = tileEls.get(keyOf(row, col));
    if (!tile) return;
    state.selected = { row, col };
    tile.classList.add("is-selected");
    tile.setAttribute("aria-pressed", "true");
    const color = state.board[row][col];
    const item = getThemeItem(color);
    setStatus(`已选中${item.food} ${item.emoji}，再选一个同色食材`, "info");
  }

  function pulseCard(card) {
    card.classList.remove("is-scoring");
    void card.offsetWidth;
    card.classList.add("is-scoring");
    setTimeout(() => card.classList.remove("is-scoring"), 460);
  }

  function drawPath(path, actor) {
    clearTimeout(state.pathTimer);
    els.pathLayer.innerHTML = "";
    if (!path || !path.points || path.points.length < 2) return;

    const points = path.points
      .map((point) => `${(point.x + 0.5) * 100},${(point.y + 0.5) * 100}`)
      .join(" ");
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", points);
    polyline.setAttribute("pathLength", "1");
    polyline.setAttribute("class", actor === "ai" ? "path-line is-ai" : "path-line");
    els.pathLayer.appendChild(polyline);

    state.pathTimer = setTimeout(() => {
      els.pathLayer.innerHTML = "";
    }, 760);
  }

  function animateRemovedTile(row, col, actor) {
    const key = keyOf(row, col);
    const tile = tileEls.get(key);
    if (!tile) {
      tileEls.delete(key);
      return;
    }
    tile.classList.remove("is-selected", "is-invalid");
    tile.setAttribute("aria-pressed", "false");
    tile.classList.add("is-matched");
    spawnStarBurst(tile.getBoundingClientRect(), 4);
    if (actor === "ai") tile.classList.add("is-ai");
    tile.setAttribute("aria-hidden", "true");
    tile.disabled = true;
    setTimeout(() => {
      if (tile.isConnected) tile.remove();
      tileEls.delete(key);
    }, 450);
  }

  /**
   * 完成一次消除。路径在棋盘数据被清空前已经算好。
   * actor: "player" | "ai"
   */
  function performMatch(a, b, path, actor) {
    if (state.status !== "playing" || state.reshuffling) return false;
    if (!LLK.removePair(state.board, a, b)) return false;
    const copyHit = collectCopyTiles([a, b]);

    const selectedWasRemoved =
      state.selected &&
      ((state.selected.row === a.row && state.selected.col === a.col) ||
        (state.selected.row === b.row && state.selected.col === b.col));
    if (selectedWasRemoved) clearSelection();

    state.remaining = Math.max(0, state.remaining - 2);
    if (actor === "player") {
      state.playerScore += 2;
      pulseCard(els.playerCard);
      registerPlayerCombo(1);
      setStatus(
        state.remaining === 0
          ? "最后两块也消除了！"
          : `连接成功 +2 · 场上还剩 ${state.remaining} 块`,
        "info"
      );
    } else {
      state.aiScore += 2;
      pulseCard(els.aiCard);
      setStatus(
        state.remaining === 0
          ? "电脑消掉了最后两块！"
          : `电脑抢到一对 · 它已消除 ${state.aiScore} 块`,
        "warn"
      );
    }

    drawPath(path, actor);
    animateRemovedTile(a.row, a.col, actor);
    animateRemovedTile(b.row, b.col, actor);
    renderHud();
    if (copyHit) grantCopyAbility(actor);
    queueBoardCheck();
    return true;
  }

  function handleBoardEnd(reason) {
    if (state.mode === "endless" && state.round < state.totalRounds) {
      state.round += 1;
      startEndlessRound();
      return;
    }
    finishGame(state.mode === "endless" ? "endless" : reason);
  }

  function startEndlessRound() {
    clearRoundTimers(true);
    stopAllSfx();
    resetStateForRound({ preserveScores: true });
    state.mode = "endless";
    state.timeLimit = 0;
    state.timeLeft = 0;
    state.deadline = 0;
    state.status = "playing";
    state.reshuffling = false;

    let layout;
    if (state.layoutChoice === "random") {
      layout = chooseLayout("random", {
        exclude: state.lastLayoutId ? [state.lastLayoutId] : [],
      });
    } else {
      layout = getLayoutById(state.layoutChoice) || chooseLayout("random");
    }
    state.layout = layout;
    state.previewLayout = layout;
    state.lastLayoutId = layout.id;
    updateLayoutCards();

    state.board = createBoard();
    state.remaining = LLK.countRemaining(state.board);
    prepareCopyTiles();
    state.lastSkillTick = performance.now();
    state.lastAiSkillTick = performance.now();
    renderBoard("deal");
    renderHud();
    updateClock();
    setStatus(
      `第 ${state.round}/${state.totalRounds} 回合开始 · 清空棋盘或无解进入下一回合`,
      "info"
    );
    showToast(
      `第 ${state.round}/${state.totalRounds} 回合 · ${layout.name} · 累计 ${state.playerScore}:${state.aiScore}`,
      "ok",
      2200
    );
    state.timerId = setInterval(tick, 100);
    scheduleAI(currentAiInterval() + 800);
    updateControls();
  }

  function queueBoardCheck() {
    clearTimeout(state.boardCheckTimer);
    state.boardCheckTimer = setTimeout(() => {
      state.boardCheckTimer = null;
      if (state.status !== "playing") return;
      if (state.remaining <= 0) {
        handleBoardEnd("cleared");
        return;
      }
      if (state.reshuffling) return;
      if (!LLK.hasMoves(state.board)) {
        handleBoardEnd("deadlock");
      }
    }, 480);
  }

  function beginReshuffle() {
    if (
      state.status !== "playing" ||
      state.reshuffling ||
      state.castingSkill ||
      state.aiCastingSkill ||
      state.remaining <= 0
    ) {
      return;
    }
    state.reshuffling = true;
    state.splitGuards.clear();
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
    clearAutoSkillTimer();
    clearAiSkillTimer();
    stopAiProgress();
    clearSelection();
    setStatus("没有可消除组合，正在重排色块…", "warn");
    showToast("无可消组合 · 自动重排", "warn", 1500);
    updateControls();

    clearTimeout(state.reshuffleTimer);
    state.reshuffleTimer = setTimeout(() => {
      state.reshuffleTimer = null;
      if (state.status !== "playing") {
        state.reshuffling = false;
        return;
      }

      let ok = LLK.reshuffleColors(state.board);
      if (!ok) {
        // 极端布局下，把剩余色块收拢到本棋谱的活动格内，再重排。
        const colors = [];
        const rows = state.board.length;
        const cols = state.board[0] ? state.board[0].length : 0;
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            if (state.board[row][col] !== null) {
              colors.push(state.board[row][col]);
              state.board[row][col] = null;
            }
          }
        }
        let index = 0;
        for (let row = 0; row < rows && index < colors.length; row += 1) {
          for (let col = 0; col < cols && index < colors.length; col += 1) {
            if (!state.layout.mask[row][col]) continue;
            state.board[row][col] = colors[index];
            index += 1;
          }
        }
        ok = LLK.reshuffleColors(state.board);
      }

      state.reshuffling = false;
      renderBoard("shuffle");
      renderHud();
      if (state.status !== "playing") return;
      setStatus("重排完成，继续抢分！", "info");
      showToast("重排完成 · 继续", "ok", 1200);
      if (!ok) {
        // 理论上不会发生；留一个兜底提示，不让游戏静默卡死。
        setStatus("重排失败，请重新开始本局", "error");
        return;
      }
      scheduleAI(currentAiInterval() * 0.85);
      if (state.autoSkill && state.skillReady) scheduleAutoSkill(500);
      if (state.aiSkillReady) scheduleAiSkill(500);
    }, 640);
  }

  function startAiProgress(duration) {
    const bar = els.aiProgress;
    bar.style.animation = "none";
    bar.style.animationPlayState = "running";
    void bar.offsetWidth;
    bar.style.animation = `aiFill ${duration}ms linear forwards`;
  }

  function stopAiProgress(resetWidth) {
    els.aiProgress.style.animation = "none";
    els.aiProgress.style.animationPlayState = "running";
    if (resetWidth) els.aiProgress.style.width = "0";
  }

  function scheduleAI(delay) {
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
    if (state.status !== "playing" || state.reshuffling) return;
    const duration = Math.max(300, delay);
    startAiProgress(duration);
    state.aiTimer = setTimeout(() => {
      state.aiTimer = null;
      aiTakeTurn();
    }, duration);
  }

  function aiTakeTurn() {
    if (state.status !== "playing" || state.reshuffling) return;
    if (performance.now() < state.aiLockUntil) {
      scheduleAI(Math.max(80, state.aiLockUntil - performance.now() + 40));
      return;
    }
    if (state.remaining <= 0) return;

    const allMoves = LLK.findAvailableMoves(state.board);
    if (allMoves.length === 0) {
      handleBoardEnd("deadlock");
      return;
    }

    const moves = filterMovesOutsideGuard(allMoves, getAiBlockedCells());
    if (!moves.length) {
      // 当前所有可消组合都含有分裂保护格或蛛网格，稍后再行动。
      scheduleAI(650);
      return;
    }

    const move = moves[Math.floor(Math.random() * moves.length)];
    const matched = performMatch(move.a, move.b, move.path, "ai");
    if (!matched) {
      scheduleAI(700);
      return;
    }
    if (state.status === "playing" && state.remaining > 0) {
      scheduleAI(currentAiInterval());
    }
  }

  function onAppPointerUp(event) {
    if (event.pointerType === "mouse") return;
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    if (
      event.target.closest(
        ".overlay, .topbar, .hud, button:not(.tile), a, input, label"
      )
    ) {
      lastBoardTap = { time: 0, x: 0, y: 0, cell: "" };
      return;
    }

    const now = performance.now();
    const tile = event.target.closest(".tile");
    const cellKey = tile
      ? `${tile.dataset.row || ""}:${tile.dataset.col || ""}`
      : "";
    const dx = event.clientX - lastBoardTap.x;
    const dy = event.clientY - lastBoardTap.y;
    const sameCell = cellKey && lastBoardTap.cell
      ? cellKey === lastBoardTap.cell
      : !cellKey && !lastBoardTap.cell && dx * dx + dy * dy <= 400;
    const isDoubleTap = now - lastBoardTap.time <= 330 && sameCell;
    if (!isDoubleTap) {
      lastBoardTap = {
        time: now,
        x: event.clientX,
        y: event.clientY,
        cell: cellKey,
      };
      return;
    }
    lastBoardTap = { time: 0, x: 0, y: 0, cell: "" };
    if (
      state.status !== "playing" ||
      state.castingSkill ||
      state.reshuffling
    ) {
      return;
    }
    event.preventDefault();
    if (!state.skillReady) {
      setStatus("特技还没充满，先继续消除", "warn");
      showToast("特技充能中，先继续消除", "warn", 900);
      return;
    }
    state.ignoreTileClicksUntil = performance.now() + 380;
    triggerSkill(false);
  }

  function playClickSound() {
    if (!state.sfxEnabled) return;
    const sound = els.clickSound;
    if (!sound) return;
    try {
      sound.currentTime = 0;
      const played = sound.play();
      if (played && typeof played.catch === "function") {
        played.catch(() => {});
      }
    } catch (error) {
      // 某些浏览器会阻止音频播放，不影响游戏。
    }
  }

  function playPauseSound() {
    if (!state.sfxEnabled) return;
    const sound = els.pauseSound;
    if (!sound) return;
    try {
      sound.currentTime = 0;
      sound.volume = 0.55;
      const played = sound.play();
      if (played && typeof played.catch === "function") {
        played.catch(() => {});
      }
    } catch (error) {
      // 忽略音频播放失败。
    }
  }

  function stopSoundElement(sound) {
    if (!sound) return;
    try {
      sound.pause();
      sound.currentTime = 0;
    } catch (error) {
      // 忽略。
    }
  }

  function stopAllSfx() {
    clearTimeout(state.suikomiFadeTimer);
    state.suikomiFadeTimer = null;
    clearInterval(state.suikomiFadeInterval);
    state.suikomiFadeInterval = null;
    for (const sound of [
      els.clickSound,
      els.pauseSound,
      els.suikomiSound,
      els.markholeSound,
      els.markwrSound,
    ]) {
      stopSoundElement(sound);
    }
  }

  function playSuikomiSound() {
    if (!state.sfxEnabled) return;
    const sound = els.suikomiSound;
    if (!sound) return;
    clearTimeout(state.suikomiFadeTimer);
    state.suikomiFadeTimer = null;
    clearInterval(state.suikomiFadeInterval);
    state.suikomiFadeInterval = null;
    try {
      sound.pause();
      sound.currentTime = 0;
      sound.volume = 0.5;
      const played = sound.play();
      if (played && typeof played.catch === "function") played.catch(() => {});
      state.suikomiFadeTimer = setTimeout(() => {
        state.suikomiFadeTimer = null;
        const startVolume = sound.volume;
        const startedAt = performance.now();
        clearInterval(state.suikomiFadeInterval);
        state.suikomiFadeInterval = setInterval(() => {
          const progress = Math.min(1, (performance.now() - startedAt) / 380);
          sound.volume = Math.max(0, startVolume * (1 - progress));
          if (progress >= 1) {
            clearInterval(state.suikomiFadeInterval);
            state.suikomiFadeInterval = null;
            stopSoundElement(sound);
            sound.volume = 0.5;
          }
        }, 40);
      }, 900);
    } catch (error) {
      // 忽略。
    }
  }

  function playMagolorSounds() {
    if (!state.sfxEnabled) return;
    for (const [sound, volume] of [
      [els.markholeSound, 0.48],
      [els.markwrSound, 0.42],
    ]) {
      if (!sound) continue;
      try {
        sound.pause();
        sound.currentTime = 0;
        sound.volume = volume;
        const played = sound.play();
        if (played && typeof played.catch === "function") played.catch(() => {});
      } catch (error) {
        // 忽略。
      }
    }
  }

  function cancelBackgroundFade() {
    clearInterval(state.bgFadeTimer);
    state.bgFadeTimer = null;
  }

  function playBackgroundMusic(restart) {
    if (!state.musicEnabled) return;
    const music = els.bgMusic;
    if (!music) return;
    cancelBackgroundFade();
    try {
      music.volume = BGM_VOLUME;
      if (restart) music.currentTime = 0;
      const played = music.play();
      if (played && typeof played.catch === "function") {
        played.catch(() => {});
      }
    } catch (error) {
      // 背景音乐被浏览器拦截时，游戏照常进行。
    }
  }

  function lowerBackgroundMusic() {
    if (!state.musicEnabled || !els.bgMusic) return;
    cancelBackgroundFade();
    els.bgMusic.volume = BGM_VOLUME * BGM_PAUSE_FACTOR;
  }

  function fadeBackgroundMusic(duration) {
    if (!state.musicEnabled) {
      stopBackgroundMusic();
      return;
    }
    const music = els.bgMusic;
    if (!music) return;
    cancelBackgroundFade();
    if (music.paused) {
      music.volume = BGM_VOLUME;
      return;
    }
    const startVolume = music.volume;
    const startedAt = performance.now();
    const length = Math.max(120, typeof duration === "number" ? duration : 900);
    state.bgFadeTimer = setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / length);
      music.volume = Math.max(0, startVolume * (1 - progress));
      if (progress >= 1) {
        cancelBackgroundFade();
        music.pause();
        music.volume = BGM_VOLUME;
      }
    }, 40);
  }

  function stopBackgroundMusic() {
    if (!els.bgMusic) return;
    cancelBackgroundFade();
    try {
      els.bgMusic.pause();
      els.bgMusic.currentTime = 0;
      els.bgMusic.volume = BGM_VOLUME;
    } catch (error) {
      // 忽略。
    }
  }

  function syncSoundToggles() {
    if (els.musicToggle) els.musicToggle.checked = state.musicEnabled;
    if (els.sfxToggle) els.sfxToggle.checked = state.sfxEnabled;
  }

  function saveSoundPreferences() {
    try {
      localStorage.setItem(
        "kirby-food-sound",
        JSON.stringify({ music: state.musicEnabled, sfx: state.sfxEnabled })
      );
    } catch (error) {
      // 忽略存储失败。
    }
  }

  function loadSoundPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem("kirby-food-sound") || "{}");
      if (typeof saved.music === "boolean") state.musicEnabled = saved.music;
      if (typeof saved.sfx === "boolean") state.sfxEnabled = saved.sfx;
    } catch (error) {
      // 使用默认值。
    }
  }

  function setMusicEnabled(enabled) {
    state.musicEnabled = Boolean(enabled);
    saveSoundPreferences();
    syncSoundToggles();
    if (!state.musicEnabled) {
      stopBackgroundMusic();
      return;
    }
    if (state.status === "playing") {
      playBackgroundMusic(false);
    } else if (state.status === "paused") {
      playBackgroundMusic(false);
      lowerBackgroundMusic();
    }
  }

  function setSfxEnabled(enabled) {
    state.sfxEnabled = Boolean(enabled);
    saveSoundPreferences();
    syncSoundToggles();
    if (!state.sfxEnabled) stopAllSfx();
  }

  function onTileClick(event) {
    if (state.status !== "playing" || state.reshuffling) return;
    if (performance.now() < state.ignoreTileClicksUntil) return;
    const tile = event.target.closest(".tile");
    if (!tile || !els.tileLayer.contains(tile)) return;

    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return;
    const color = state.board[row] && state.board[row][col];
    if (color === null || color === undefined) return;
    playClickSound();
    const webOwner = getWebCellOwner(row, col);
    if (webOwner && webOwner !== "player") {
      setStatus("敌方蛛网缠绕，这个方块暂时不能点击", "warn");
      showToast("等敌方蛛网消失后再点它", "warn", 900);
      return;
    }

    if (state.copyAbility && state.status === "playing") {
      useCopyAbilityAt("player", row, col);
      return;
    }

    if (!state.selected) {
      selectTile(row, col);
      return;
    }

    if (state.selected.row === row && state.selected.col === col) {
      clearSelection();
      setStatus("已取消选择，重新选两个同色块", "info");
      return;
    }

    const first = state.selected;
    const firstColor = state.board[first.row][first.col];
    if (firstColor === null || firstColor === undefined) {
      clearSelection();
      selectTile(row, col);
      return;
    }

    if (firstColor !== color) {
      // 点错颜色时直接把选择切到新色块，操作更顺手。
      breakCombo();
      selectTile(row, col);
      showToast("要选两个相同颜色", "warn", 900);
      return;
    }

    const path = LLK.findPath(state.board, first, { row, col });
    if (!path) {
      breakCombo();
      const firstEl = tileEls.get(keyOf(first.row, first.col));
      const secondEl = tileEls.get(keyOf(row, col));
      clearSelection();
      for (const element of [firstEl, secondEl]) {
        if (!element) continue;
        element.classList.remove("is-invalid");
        void element.offsetWidth;
        element.classList.add("is-invalid");
        setTimeout(() => {
          if (element.isConnected) element.classList.remove("is-invalid");
        }, 430);
      }
      setStatus("这两个同色块连不通：最多只能转弯 2 次", "error");
      showToast("连不通 · 可以从棋盘边缘外绕行", "warn", 1600);
      return;
    }

    clearSelection();
    performMatch(first, { row, col }, path, "player");
  }

  function tick() {
    if (state.status !== "playing") return;
    const now = performance.now();
    if (state.mode !== "endless") {
      const left = Math.max(0, (state.deadline - now) / 1000);
      state.timeLeft = left;
      updateClock();
      if (left <= 0.001) {
        finishGame("timeout");
        return;
      }
    } else {
      updateClock();
    }
    updateCopyAbilityTimer(100);

    const skillDelta = Math.max(0, (now - state.lastSkillTick) / 1000);
    state.lastSkillTick = now;
    advanceSkill(skillDelta);
    updateSkillUI();

    const aiSkillDelta = Math.max(0, (now - state.lastAiSkillTick) / 1000);
    state.lastAiSkillTick = now;
    advanceAiSkill(aiSkillDelta);
    updateAiSkillUI();
  }

  function finishGame(reason) {
    if (state.status !== "playing") return;
    state.status = "ending";
    state.endReason = reason;
    resetCombo();
    clearAllCopyAbilities();
    clearTimeout(state.fireTimer);
    state.fireTimer = null;
    if (els.fireCross) els.fireCross.classList.remove("is-active");
    if (reason === "timeout") {
      state.timeLeft = 0;
    } else {
      state.timeLeft = Math.max(0, (state.deadline - performance.now()) / 1000);
    }
    state.elapsed = Math.min(
      state.timeLimit,
      Math.max(0, state.timeLimit - state.timeLeft)
    );
    clearRoundTimers(false);
    stopAllSfx();
    fadeBackgroundMusic(900);
    state.castingSkill = false;
    state.aiCastingSkill = false;
    clearSelection();
    updateClock();
    renderHud();
    setStatus(
      reason === "timeout"
        ? "时间到，正在结算…"
        : reason === "deadlock"
          ? "没有可消除的组合，正在结算…"
          : reason === "endless"
            ? "全部回合结束，正在结算…"
            : "棋盘清空，正在结算…",
      "warn"
    );
    stopAiProgress(true);
    updateControls();
    clearTimeout(state.endTimer);
    state.endTimer = setTimeout(showResult, 620);
  }

  function showResult() {
    state.endTimer = null;
    state.status = "ended";
    const player = state.playerScore;
    const ai = state.aiScore;
    const result = player > ai ? "win" : player < ai ? "lose" : "draw";
    const reason = state.endReason;

    els.endModal.dataset.result = result;
    els.resultBadge.textContent = result === "win" ? "胜" : result === "lose" ? "负" : "和";
    els.resultTitle.textContent =
      result === "win" ? "你赢了" : result === "lose" ? "电脑赢了" : "平局";
    if (reason === "endless") {
      if (result === "win") {
        els.resultSub.textContent = `全部 ${state.totalRounds} 回合结束，你以 ${player} : ${ai} 领先电脑。`;
      } else if (result === "lose") {
        els.resultSub.textContent = `全部 ${state.totalRounds} 回合结束，电脑以 ${ai} : ${player} 领先。`;
      } else {
        els.resultSub.textContent = `全部 ${state.totalRounds} 回合结束，双方都消除了 ${player} 块。`;
      }
    } else if (reason === "deadlock") {
      if (result === "win") {
        els.resultSub.textContent = `棋盘上已没有可消除的组合，你以 ${player} : ${ai} 领先电脑。`;
      } else if (result === "lose") {
        els.resultSub.textContent = `棋盘上已没有可消除的组合，电脑以 ${ai} : ${player} 领先。`;
      } else {
        els.resultSub.textContent = `棋盘上已没有可消除的组合，双方都消除了 ${player} 块。`;
      }
    } else if (result === "win") {
      els.resultSub.textContent =
        reason === "timeout"
          ? `时间到，你以 ${player} : ${ai} 领先电脑。节奏拿捏得不错。`
          : `棋盘清空，你以 ${player} : ${ai} 抢下更多色块。`;
    } else if (result === "lose") {
      els.resultSub.textContent =
        reason === "timeout"
          ? `时间到，电脑以 ${ai} : ${player} 领先。再来一局，把节奏抢回来。`
          : `电脑以 ${ai} : ${player} 赢下这局。下一把试试更快出手。`;
    } else {
      els.resultSub.textContent =
        reason === "timeout"
          ? `时间到，双方都消除了 ${player} 块。加赛一局分胜负？`
          : `棋盘清空，双方都消除了 ${player} 块。势均力敌。`;
    }

    els.finalPlayerScore.textContent = String(player);
    els.finalAiScore.textContent = String(ai);
    els.finalLayout.textContent = state.layout ? state.layout.name : "—";
    if (state.mode === "endless") {
      if (els.finalTimeLabel) els.finalTimeLabel.textContent = "回合数";
      els.finalTime.textContent = `${state.totalRounds} 回合`;
    } else {
      if (els.finalTimeLabel) els.finalTimeLabel.textContent = "本局用时";
      els.finalTime.textContent = formatClock(
        state.endReason === "timeout" ? state.timeLimit : state.elapsed
      );
    }
    els.finalDifficulty.textContent = DIFFICULTIES[state.difficulty].label;
    els.finalAiRate.textContent = `${(currentAiInterval() / 1000).toFixed(1)} 秒/手`;

    hideAllOverlays();
    showOverlay(els.endOverlay);
    renderHud();
  }

  function clearRoundTimers(stopProgress) {
    clearInterval(state.timerId);
    state.timerId = null;
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
    clearTimeout(state.boardCheckTimer);
    state.boardCheckTimer = null;
    clearTimeout(state.reshuffleTimer);
    state.reshuffleTimer = null;
    clearTimeout(state.endTimer);
    state.endTimer = null;
    clearTimeout(state.castTimer);
    state.castTimer = null;
    clearTimeout(state.aiCastTimer);
    state.aiCastTimer = null;
    clearAutoSkillTimer();
    clearAiSkillTimer();
    clearTimeout(state.vortexTimer);
    state.vortexTimer = null;
    clearSkillEffects();
    clearWebs();
    state.reshuffling = false;
    if (stopProgress !== false) stopAiProgress(true);
  }

  function resetStateForRound(options) {
    const preserveScores = Boolean(options && options.preserveScores);
    state.selected = null;
    state.splitGuards.clear();
    clearWebs();
    resetCombo();
    state.copyTileKeys.clear();
    clearAllCopyAbilities();
    clearTimeout(state.fireTimer);
    state.fireTimer = null;
    if (els.fireCross) els.fireCross.classList.remove("is-active");
    state.aiLockUntil = 0;
    state.ignoreTileClicksUntil = 0;
    if (!preserveScores) {
      state.playerScore = 0;
      state.aiScore = 0;
    }
    state.skillCharge = 0;
    state.skillReady = false;
    state.castingSkill = false;
    state.lastSkillTick = 0;
    state.aiSkillCharge = 0;
    state.aiSkillDuration = rollAiSkillDuration();
    state.aiSkillReady = false;
    state.aiCastingSkill = false;
    state.lastAiSkillTick = 0;
    state.timeLeft = MATCH_SECONDS;
    state.deadline = 0;
    state.elapsed = 0;
    state.endReason = null;
    state.helpAutoPaused = false;
    state.helpFromStart = false;
    state.settingsAutoPaused = false;
    state.settingsFromStart = false;
  }

  function startGame(options) {
    const usePreview = Boolean(options && options.usePreview);
    const useCurrentLayout = Boolean(options && options.useCurrentLayout);
    hideAllOverlays();
    stopAllSfx();
    clearRoundTimers(true);
    resetStateForRound();

    const mode = state.modeChoice === "endless" ? "endless" : "classic";
    state.roundCount =
      mode === "endless"
        ? clampRoundCount(els.roundCount ? els.roundCount.value : state.roundCount)
        : state.roundCount;
    state.mode = mode;
    state.totalRounds = mode === "endless" ? state.roundCount : 1;
    state.round = 1;
    state.timeLimit = mode === "endless" ? 0 : MATCH_SECONDS;
    syncModeUI();

    let layout;
    if (state.layoutChoice === "random") {
      if (useCurrentLayout && state.layout) {
        layout = state.layout;
      } else if (usePreview && state.previewLayout) {
        layout = state.previewLayout;
      } else {
        layout = chooseLayout("random", {
          exclude: state.lastLayoutId ? [state.lastLayoutId] : [],
        });
      }
    } else {
      layout = getLayoutById(state.layoutChoice) || chooseLayout("random");
    }
    state.layout = layout;
    state.previewLayout = layout;
    state.lastLayoutId = layout.id;
    updateLayoutCards();
    resolveAiCharacter();

    state.board = createBoard();
    state.remaining = LLK.countRemaining(state.board);
    prepareCopyTiles();
    state.status = "playing";
    state.deadline =
      mode === "endless" ? 0 : performance.now() + state.timeLimit * 1000;
    state.timeLeft = mode === "endless" ? 0 : state.timeLimit;
    state.lastSkillTick = performance.now();
    state.lastAiSkillTick = performance.now();
    state.reshuffling = false;
    syncAutoSkillToggle();
    updateCharacterUI();
    updateAiCharacterUI();

    renderBoard("deal");
    renderHud();
    setStatus(
      mode === "endless"
        ? `无尽模式 · 第 1/${state.totalRounds} 回合开始`
        : "抢在电脑之前，消除同色色块！",
      "info"
    );
    showToast(
      mode === "endless"
        ? `第 1/${state.totalRounds} 回合 · ${layout.name} · 棋盘清空或无解进入下一回合`
        : `${layout.name} · ${layout.count} 块 · ${DIFFICULTIES[state.difficulty].label}难度`,
      "ok",
      mode === "endless" ? 2400 : 1900
    );
    state.timerId = setInterval(tick, 100);
    scheduleAI(currentAiInterval() + 900);
    updateControls();
    playBackgroundMusic(true);
  }

  function preparePreview() {
    clearRoundTimers(true);
    stopAllSfx();
    resetStateForRound();
    state.status = "idle";
    syncAutoSkillToggle();
    updateCharacterUI();
    updateAiCharacterUI();

    const exclude = [];
    if (state.lastLayoutId) exclude.push(state.lastLayoutId);
    if (state.previewLayout) exclude.push(state.previewLayout.id);
    const layout =
      state.layoutChoice === "random"
        ? chooseLayout("random", { exclude })
        : getLayoutById(state.layoutChoice) || chooseLayout("random");
    state.layout = layout;
    state.previewLayout = layout;
    updateLayoutCards();

    state.board = createBoard();
    state.remaining = LLK.countRemaining(state.board);
    prepareCopyTiles();
    state.mode = "classic";
    state.round = 1;
    state.totalRounds = 1;
    state.timeLimit = MATCH_SECONDS;
    state.timeLeft = MATCH_SECONDS;
    state.deadline = 0;
    renderBoard("deal");
    renderHud();
    setStatus("点击两个同色色块，把它们连起来", "info");
    stopAiProgress(true);
    stopBackgroundMusic();
  }

  function pauseGame(options) {
    if (state.status !== "playing") return false;
    const silent = Boolean(options && options.silent);
    if (state.mode !== "endless") {
      state.timeLeft = Math.max(0, (state.deadline - performance.now()) / 1000);
    }
    state.status = "paused";
    clearInterval(state.timerId);
    state.timerId = null;
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
    clearTimeout(state.boardCheckTimer);
    state.boardCheckTimer = null;
    clearAutoSkillTimer();
    clearAiSkillTimer();
    clearTimeout(state.aiCopyUseTimer);
    state.aiCopyUseTimer = null;
    els.aiProgress.style.animationPlayState = "paused";
    updateClock();
    updateControls();
    setStatus(
      state.mode === "endless"
        ? "已暂停 · 电脑已停下"
        : "已暂停 · 计时与电脑都已停下",
      "warn"
    );
    lowerBackgroundMusic();
    if (!silent) {
      playPauseSound();
      showOverlay(els.pauseOverlay);
    }
    return true;
  }

  function resumeGame() {
    if (state.status !== "paused") return;
    hideOverlay(els.pauseOverlay);
    state.status = "playing";
    if (state.mode !== "endless") {
      state.deadline = performance.now() + Math.max(0, state.timeLeft) * 1000;
    } else {
      state.deadline = 0;
    }
    state.lastSkillTick = performance.now();
    state.lastAiSkillTick = performance.now();
    state.timerId = setInterval(tick, 100);
    updateControls();
    setStatus("继续对战，抢在电脑前消除！", "info");
    playBackgroundMusic(false);
    if (state.remaining <= 0) {
      handleBoardEnd("cleared");
      return;
    }
    scheduleAI(currentAiInterval());
    if (state.autoSkill && state.skillReady) scheduleAutoSkill(430);
    if (state.aiSkillReady) scheduleAiSkill(AI_SKILL_TRIGGER_DELAY_MS);
    if (state.aiCopyAbility) scheduleAiCopyUse();
    queueBoardCheck();
  }

  function showStartScreen() {
    hideAllOverlays();
    preparePreview();
    showOverlay(els.startOverlay);
  }

  function returnToMenu() {
    if (state.status !== "paused") return;
    hideAllOverlays();
    showStartScreen();
  }

  function openHelp(options) {
    const fromStart =
      Boolean(options && options.fromStart) || !els.startOverlay.hidden;
    state.helpFromStart = fromStart;
    state.helpAutoPaused = !fromStart && state.status === "playing";
    if (state.helpAutoPaused) pauseGame({ silent: true });
    showOverlay(els.helpOverlay, { keepStart: fromStart });
  }

  function closeHelp() {
    const wasAutoPaused = state.helpAutoPaused;
    const fromStart = state.helpFromStart;
    hideOverlay(els.helpOverlay);
    state.helpAutoPaused = false;
    state.helpFromStart = false;
    if (fromStart) {
      showOverlay(els.startOverlay);
      return;
    }
    if (wasAutoPaused && state.status === "paused") resumeGame();
  }

  function openSettings(options) {
    const fromStart =
      Boolean(options && options.fromStart) || !els.startOverlay.hidden;
    if (fromStart) {
      state.settingsFromStart = true;
      state.settingsAutoPaused = false;
      syncAutoSkillToggle();
      syncSoundToggles();
      showOverlay(els.settingsOverlay, { keepStart: true });
      return;
    }
    if (state.status !== "playing") return;
    state.settingsFromStart = false;
    state.settingsAutoPaused = true;
    pauseGame({ silent: true });
    syncAutoSkillToggle();
    syncSoundToggles();
    showOverlay(els.settingsOverlay);
  }

  function closeSettings() {
    const fromStart = state.settingsFromStart;
    const wasAutoPaused = state.settingsAutoPaused;
    state.settingsFromStart = false;
    state.settingsAutoPaused = false;
    hideOverlay(els.settingsOverlay);
    if (fromStart) {
      showOverlay(els.startOverlay);
      return;
    }
    if (wasAutoPaused && state.status === "paused") {
      resumeGame();
    } else {
      updateControls();
    }
  }

  function showOverlay(overlay, options) {
    const keepStart =
      Boolean(options && options.keepStart) && !els.startOverlay.hidden;
    for (const item of overlays) {
      if (keepStart && item === els.startOverlay) continue;
      item.hidden = item !== overlay;
    }
    overlay.hidden = false;
    const focusTarget =
      overlay.querySelector(".primary-btn:not(:disabled)") ||
      overlay.querySelector("button:not(:disabled)");
    if (focusTarget) {
      setTimeout(() => {
        if (!overlay.hidden) {
          try {
            focusTarget.focus({ preventScroll: true });
          } catch (error) {
            focusTarget.focus();
          }
        }
      }, 70);
    }
  }

  function hideOverlay(overlay) {
    overlay.hidden = true;
  }

  function hideAllOverlays() {
    for (const overlay of overlays) overlay.hidden = true;
  }

  function onKeyDown(event) {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();

    if (key === "escape") {
      if (!els.settingsOverlay.hidden) {
        closeSettings();
        event.preventDefault();
        return;
      }
      if (!els.helpOverlay.hidden) {
        closeHelp();
        event.preventDefault();
        return;
      }
      if (!els.pauseOverlay.hidden) {
        resumeGame();
        event.preventDefault();
        return;
      }
      if (!els.startOverlay.hidden || !els.endOverlay.hidden) return;
      if (state.status === "playing") {
        pauseGame();
        event.preventDefault();
      } else if (state.status === "paused") {
        resumeGame();
        event.preventDefault();
      }
      return;
    }

    if (
      !els.startOverlay.hidden ||
      !els.endOverlay.hidden ||
      !els.helpOverlay.hidden ||
      !els.settingsOverlay.hidden
    ) {
      return;
    }

    if (key === "e") {
      if (state.status === "playing" && !state.castingSkill) {
        if (!state.skillReady) {
          const left = Math.max(0, SKILL_CHARGE_SECONDS - state.skillCharge);
          showToast(`特技充能中 · 还需 ${left.toFixed(1)} 秒`, "warn", 900);
          setStatus("特技还没充满，先继续消除食材", "warn");
        } else {
          triggerSkill(false);
        }
      }
      event.preventDefault();
      return;
    }

    if (key === "p") {
      if (state.status === "playing") {
        pauseGame();
        event.preventDefault();
      } else if (state.status === "paused") {
        resumeGame();
        event.preventDefault();
      }
    }
  }

  function bindEvents() {
    els.tileLayer.addEventListener("click", onTileClick);
    els.app.addEventListener("pointerup", onAppPointerUp);

    els.startBtn.addEventListener("click", () => startGame({ usePreview: true }));
    els.skillBtn.addEventListener("click", () => triggerSkill(false));
    els.pauseBtn.addEventListener("click", () => {
      if (state.status === "playing") pauseGame();
      else if (state.status === "paused") resumeGame();
    });
    els.helpBtn.addEventListener("click", openHelp);
    els.settingsBtn.addEventListener("click", () => openSettings());
    els.startHelpBtn.addEventListener("click", () =>
      openHelp({ fromStart: true })
    );
    els.startOptionsBtn.addEventListener("click", () =>
      openSettings({ fromStart: true })
    );
    els.resumeBtn.addEventListener("click", resumeGame);
    els.pauseRestartBtn.addEventListener("click", () =>
      startGame({ useCurrentLayout: true })
    );
    els.pauseMenuBtn.addEventListener("click", returnToMenu);
    els.againBtn.addEventListener("click", () => startGame());
    els.changeDifficultyBtn.addEventListener("click", showStartScreen);
    els.helpCloseBtn.addEventListener("click", closeHelp);
    els.helpOkBtn.addEventListener("click", closeHelp);
    els.helpOverlay.addEventListener("click", (event) => {
      if (event.target === els.helpOverlay) closeHelp();
    });
    els.settingsCloseBtn.addEventListener("click", closeSettings);
    els.settingsDoneBtn.addEventListener("click", closeSettings);
    els.settingsOverlay.addEventListener("click", (event) => {
      if (event.target === els.settingsOverlay) closeSettings();
    });
    els.startSettingsBtn.addEventListener("click", () => {
      setAutoSkill(!state.autoSkill);
    });
    els.autoSkillToggle.addEventListener("change", () => {
      setAutoSkill(els.autoSkillToggle.checked);
    });

    if (els.musicToggle) {
      els.musicToggle.addEventListener("change", () => {
        setMusicEnabled(els.musicToggle.checked);
      });
    }
    if (els.sfxToggle) {
      els.sfxToggle.addEventListener("change", () => {
        setSfxEnabled(els.sfxToggle.checked);
      });
    }

    els.difficultyGroup.addEventListener("click", (event) => {
      const button = event.target.closest("[data-difficulty]");
      if (!button) return;
      setDifficulty(button.dataset.difficulty);
    });

    els.layoutGroup.addEventListener("click", (event) => {
      const card = event.target.closest("[data-layout]");
      if (!card) return;
      setLayoutChoice(card.dataset.layout);
    });

    els.themeGroup.addEventListener("click", (event) => {
      const card = event.target.closest("[data-theme]");
      if (!card) return;
      setTheme(card.dataset.theme);
    });

    if (els.uiThemeGroup) {
      els.uiThemeGroup.addEventListener("click", (event) => {
        const card = event.target.closest("[data-ui-theme]");
        if (!card) return;
        setUiTheme(card.dataset.uiTheme);
      });
    }

    if (els.modeGroup) {
      els.modeGroup.addEventListener("click", (event) => {
        const button = event.target.closest("[data-mode]");
        if (!button) return;
        setModeChoice(button.dataset.mode);
      });
    }
    if (els.roundCount) {
      els.roundCount.addEventListener("input", () => {
        state.roundCount = clampRoundCount(els.roundCount.value);
      });
      els.roundCount.addEventListener("change", () => {
        setRoundCount(els.roundCount.value);
      });
    }

    els.characterGroup.addEventListener("click", (event) => {
      const card = event.target.closest("[data-character]");
      if (!card) return;
      setCharacter(card.dataset.character);
    });

    els.aiCharacterGroup.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-ai-character]");
      if (!chip) return;
      setAiCharacterChoice(chip.dataset.aiCharacter);
    });

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.status === "playing") pauseGame();
    });
  }

  function init() {
    setupBoardGeometry();
    if (els.clickSound) els.clickSound.volume = 0.45;
    if (els.pauseSound) els.pauseSound.volume = 0.55;
    if (els.bgMusic) els.bgMusic.volume = BGM_VOLUME;
    loadSoundPreferences();
    syncSoundToggles();
    loadUiTheme();
    buildUiThemeCards();
    syncModeUI();
    buildThemeCards();
    buildLayoutCards();
    buildCharacterCards();
    buildCharacterEffects();
    buildAiCharacterCards();
    bindEvents();
    setDifficulty("normal");
    state.autoSkill = loadAutoSkillSetting();
    syncAutoSkillToggle();
    updateCharacterUI();
    updateAiCharacterUI();
    preparePreview();
    showOverlay(els.startOverlay);
  }

  if (!LLK || !LAYOUT_API) {
    els.statusText.textContent = "核心脚本加载失败，请刷新页面";
    return;
  }

  init();
})();
