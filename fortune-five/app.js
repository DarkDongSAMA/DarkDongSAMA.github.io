(function () {
  'use strict';

  const Engine = window.SlotEngine;
  if (!Engine) {
    document.body.innerHTML = '<p style="padding:40px;color:#fff;font-family:sans-serif">游戏引擎加载失败，请刷新页面。</p>';
    return;
  }

  /* ------------------------------------------------------------------ *
   * Constants
   * ------------------------------------------------------------------ */
  const SAVE_KEY = 'fortuneFive.save.v1';
  const UNLOCK_KEY = 'fortuneFive.maintenance.v1';
  const SECRET_HASH = '14d6369458332bcf6a7e02e5951845f2960de51f72b7b6554270b7ffd53f1616';
  const MAX_COINS = 999999999999;
  const HISTORY_PAGE = 100;
  const SIGN = '\u2212';
  const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
  const multiplierFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ------------------------------------------------------------------ *
   * DOM
   * ------------------------------------------------------------------ */
  const el = {
    brand: $('#brand'),
    coinBalance: $('#coinBalance'),
    soundToggle: $('#soundToggle'),
    helpBtn: $('#helpBtn'),
    historyBtn: $('#historyBtn'),
    historyBtnSide: $('#historyBtnSide'),
    reelGrid: $('#reelGrid'),
    lineOverlay: $('#lineOverlay'),
    pityMeter: $('#pityMeter'),
    pityFill: $('#pityFill'),
    pityText: $('#pityText'),
    bigWin: $('#bigWin'),
    bigWinKicker: $('#bigWinKicker'),
    bigWinTitle: $('#bigWinTitle'),
    bigWinAmount: $('#bigWinAmount'),
    confettiLayer: $('#confettiLayer'),
    resultBar: $('#resultBar'),
    resultIcon: $('#resultIcon'),
    resultKicker: $('#resultKicker'),
    resultTitle: $('#resultTitle'),
    resultDetail: $('#resultDetail'),
    resultAmount: $('#resultAmount'),
    betPresets: $('#betPresets'),
    customBet: $('#customBet'),
    maxBet: $('#maxBet'),
    betMultiplierLabel: $('#betMultiplierLabel'),
    spinBtn: $('#spinBtn'),
    bailout: $('#bailout'),
    bailoutBtn: $('#bailoutBtn'),
    hourlyClaim: $('#hourlyClaim'),
    hourlyStatus: $('#hourlyStatus'),
    hourlyCountdown: $('#hourlyCountdown'),
    paytableGrid: $('#paytableGrid'),
    totalNet: $('#totalNet'),
    netCaption: $('#netCaption'),
    statHero: $('#statHero'),
    statSpins: $('#statSpins'),
    statHitRate: $('#statHitRate'),
    statBiggest: $('#statBiggest'),
    statWagered: $('#statWagered'),
    historyList: $('#historyList'),
    helpDialog: $('#helpDialog'),
    historyDialog: $('#historyDialog'),
    historyFullList: $('#historyFullList'),
    historyDialogSummary: $('#historyDialogSummary'),
    historyLimitNote: $('#historyLimitNote'),
    loadMoreHistory: $('#loadMoreHistory'),
    exportHistory: $('#exportHistory'),
    clearHistory: $('#clearHistory'),
    confirmDialog: $('#confirmDialog'),
    confirmTitle: $('#confirmTitle'),
    confirmText: $('#confirmText'),
    confirmOk: $('#confirmOk'),
    confirmCancel: $('#confirmCancel'),
    devAuth: $('#devAuth'),
    devAuthForm: $('#devAuthForm'),
    devPassword: $('#devPassword'),
    devAuthError: $('#devAuthError'),
    devAuthClose: $('#devAuthClose'),
    devPanel: $('#devPanel'),
    devClose: $('#devClose'),
    devCoinValue: $('#devCoinValue'),
    devSetCoins: $('#devSetCoins'),
    devApplyCoins: $('#devApplyCoins'),
    devForce: $('#devForce'),
    devMega: $('#devMega'),
    devClearHistory: $('#devClearHistory'),
    devResetAll: $('#devResetAll'),
    devMeta: $('#devMeta'),
    toastStack: $('#toastStack')
  };

  const reelWindow = el.reelGrid.closest('.reel-window');
  const cellMatrix = Array.from({ length: Engine.REELS }, () => Array(Engine.ROWS));
  const reels = [];

  const ui = {
    spinning: false,
    force: null,
    lastWins: [],
    version: 0,
    devUnlocked: false,
    historyShown: HISTORY_PAGE,
    confirmResolve: null,
    bigWinTimer: null,
    storageWarned: false,
    firstRun: false,
    hourlyReady: null
  };

  let state = loadState();

  /* ------------------------------------------------------------------ *
   * Persistence
   * ------------------------------------------------------------------ */
  function defaultState() {
    return {
      version: 1,
      coins: Engine.START_COINS,
      bet: Engine.MIN_BET,
      sound: true,
      history: [],
      stats: {
        spins: 0,
        winningSpins: 0,
        wagered: 0,
        won: 0,
        biggestWin: 0,
        bestMultiplier: 0
      },
      hourly: {
        lastClaimAt: 0,
        totalClaimed: 0
      },
      pity: {
        lossStreak: 0,
        totalTriggers: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function loadState() {
    const fallback = defaultState();
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) {
        ui.firstRun = true;
        return fallback;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return fallback;

      const merged = {
        ...fallback,
        ...parsed,
        stats: { ...fallback.stats, ...(parsed.stats || {}) },
        hourly: { ...fallback.hourly, ...(parsed.hourly || {}) },
        pity: { ...fallback.pity, ...(parsed.pity || {}) },
        history: Array.isArray(parsed.history) ? parsed.history.slice(-Engine.MAX_HISTORY) : []
      };

      merged.coins = clampInteger(merged.coins, 0, MAX_COINS, fallback.coins);
      merged.bet = clampInteger(merged.bet, Engine.MIN_BET, Engine.MAX_BET, Engine.MIN_BET);
      merged.sound = merged.sound !== false;
      merged.stats.spins = clampInteger(merged.stats.spins, 0, 1e12, 0);
      merged.stats.winningSpins = clampInteger(merged.stats.winningSpins, 0, merged.stats.spins, 0);
      merged.stats.wagered = clampInteger(merged.stats.wagered, 0, 1e15, 0);
      merged.stats.won = clampInteger(merged.stats.won, 0, 1e15, 0);
      merged.stats.biggestWin = clampInteger(merged.stats.biggestWin, 0, 1e15, 0);
      merged.stats.bestMultiplier = Number(merged.stats.bestMultiplier) || 0;
      merged.hourly.lastClaimAt = clampInteger(merged.hourly.lastClaimAt, 0, Date.now(), 0);
      merged.hourly.totalClaimed = clampInteger(merged.hourly.totalClaimed, 0, 1e15, 0);
      merged.pity.lossStreak = clampInteger(merged.pity.lossStreak, 0, Engine.PITY_GUARANTEE, 0);
      merged.pity.totalTriggers = clampInteger(merged.pity.totalTriggers, 0, 1e12, 0);

      if (merged.bet > merged.coins && merged.coins >= Engine.MIN_BET) {
        merged.bet = Math.max(Engine.MIN_BET, Math.min(merged.bet, Math.floor(merged.coins / 100) * 100 || Engine.MIN_BET));
      }
      return merged;
    } catch (error) {
      return fallback;
    }
  }

  function persist() {
    state.updatedAt = Date.now();
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (error) {
      if (!ui.storageWarned) {
        ui.storageWarned = true;
        toast('本地存储不可用，本局数据只在当前页面保留。', { type: 'error', duration: 4200 });
      }
    }
    updateDevMeta();
  }

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  function clampInteger(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(number)));
  }

  function formatNumber(value) {
    return numberFormatter.format(Number(value) || 0);
  }

  function formatSigned(value) {
    const number = Math.round(Number(value) || 0);
    if (number > 0) return `+ ${formatNumber(number)}`;
    if (number < 0) return `${SIGN} ${formatNumber(Math.abs(number))}`;
    return '0';
  }

  function formatNet(value) {
    const number = Math.round(Number(value) || 0);
    return number === 0 ? '0' : `${number > 0 ? '+' : SIGN} ${formatNumber(Math.abs(number))}`;
  }

  function formatPercent(value) {
    return `${(Number(value) * 100).toFixed(1)}%`;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function hexToRgba(hex, alpha) {
    let value = String(hex || '').replace('#', '');
    if (value.length === 3) value = value.split('').map((char) => char + char).join('');
    const number = Number.parseInt(value, 16);
    if (!Number.isFinite(number)) return `rgba(255, 209, 102, ${alpha})`;
    const r = (number >> 16) & 255;
    const g = (number >> 8) & 255;
    const b = number & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function formatHistoryTime(timestamp, full = false) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) return `今天 ${time}`;

    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    ) {
      return `昨天 ${time}`;
    }

    if (full) {
      return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${time}`;
    }
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${time}`;
  }

  function updateBalance(animate = false) {
    el.coinBalance.textContent = formatNumber(state.coins);
    el.devCoinValue.textContent = formatNumber(state.coins);
    if (animate) {
      el.coinBalance.classList.remove('bump');
      void el.coinBalance.offsetWidth;
      el.coinBalance.classList.add('bump');
    }
  }

  function updateDevMeta() {
    let bytes = 0;
    try {
      bytes = new TextEncoder().encode(JSON.stringify(state)).length;
    } catch (error) {
      bytes = 0;
    }
    el.devMeta.textContent =
      `BASE RTP ${(Engine.THEORETICAL_RTP * 100).toFixed(2)}% · ` +
      `记录 ${state.history.length}/${Engine.MAX_HISTORY} · ` +
      `存档 ${bytes ? formatBytes(bytes) : '—'}`;
  }

  /* ------------------------------------------------------------------ *
   * Sound
   * ------------------------------------------------------------------ */
  const sound = {
    ctx: null,
    enabled: state.sound,
    lastTick: 0,

    ensure() {
      if (!this.enabled) return null;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!this.ctx) this.ctx = new AudioContextClass();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    },

    tone(frequency, duration = 0.08, type = 'sine', volume = 0.025, offset = 0) {
      const ctx = this.ensure();
      if (!ctx) return;
      const start = ctx.currentTime + offset;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    },

    click() {
      this.tone(540, 0.045, 'triangle', 0.012);
    },

    spinStart() {
      this.tone(180, 0.18, 'sawtooth', 0.012);
      this.tone(260, 0.22, 'triangle', 0.013, 0.06);
    },

    tick() {
      const now = performance.now();
      if (now - this.lastTick < 78) return;
      this.lastTick = now;
      this.tone(150 + Math.random() * 90, 0.025, 'square', 0.0045);
    },

    reelStop(index) {
      this.tone(320 + index * 44, 0.07, 'triangle', 0.018);
      this.tone(640 + index * 55, 0.035, 'sine', 0.01, 0.018);
    },

    win(lines) {
      const base = 523.25;
      const notes = [1, 1.25, 1.5, 2];
      notes.slice(0, Math.min(notes.length, 2 + lines)).forEach((ratio, index) => {
        this.tone(base * ratio, 0.22, 'sine', 0.028, index * 0.09);
      });
    },

    bigWin() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((frequency, index) => {
        this.tone(frequency, 0.34, 'triangle', 0.03, index * 0.11);
        this.tone(frequency / 2, 0.2, 'sine', 0.015, index * 0.11);
      });
      this.tone(130.81, 0.7, 'sine', 0.02, 0.02);
    },

    lose() {
      this.tone(220, 0.14, 'sine', 0.012);
      this.tone(174.61, 0.2, 'sine', 0.01, 0.08);
    },

    claim() {
      this.tone(659.25, 0.12, 'sine', 0.022);
      this.tone(880, 0.16, 'triangle', 0.02, 0.09);
      this.tone(1318.5, 0.2, 'sine', 0.012, 0.18);
    }
  };

  function updateSoundUI() {
    const icon = state.sound ? 'fa-volume-high' : 'fa-volume-xmark';
    el.soundToggle.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i>`;
    el.soundToggle.setAttribute('aria-label', state.sound ? '关闭音效' : '开启音效');
    el.soundToggle.title = state.sound ? '关闭音效' : '开启音效';
    sound.enabled = state.sound;
  }

  /* ------------------------------------------------------------------ *
   * Reels
   * ------------------------------------------------------------------ */
  function buildReels() {
    el.reelGrid.innerHTML = '';
    for (let reelIndex = 0; reelIndex < Engine.REELS; reelIndex += 1) {
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.dataset.reel = String(reelIndex);

      for (let rowIndex = 0; rowIndex < Engine.ROWS; rowIndex += 1) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.reel = String(reelIndex);
        cell.dataset.row = String(rowIndex);

        const aura = document.createElement('span');
        aura.className = 'cell__aura';
        aura.setAttribute('aria-hidden', 'true');

        const symbol = document.createElement('span');
        symbol.className = 'symbol';
        const icon = document.createElement('i');
        icon.setAttribute('aria-hidden', 'true');
        symbol.append(icon);

        cell.append(aura, symbol);
        reel.append(cell);
        cellMatrix[reelIndex][rowIndex] = cell;
      }

      reels.push(reel);
      el.reelGrid.append(reel);
    }
  }

  function paintCell(cell, symbolId, reelIndex, rowIndex) {
    const symbol = Engine.SYMBOL_BY_ID[symbolId] || Engine.SYMBOLS[0];
    cell.dataset.symbol = symbol.id;
    cell.style.setProperty('--sym-color', symbol.color);
    cell.style.setProperty('--sym-glow', symbol.glow);
    cell.setAttribute('aria-label', `${symbol.name}，第 ${reelIndex + 1} 列第 ${rowIndex + 1} 行`);

    const icon = cell.querySelector('.symbol i');
    icon.className = `fa-solid ${symbol.icon}`;

    const symbolWrap = cell.querySelector('.symbol');
    symbolWrap.classList.toggle('symbol--seven', symbol.id === 'seven');
  }

  function renderGrid(grid) {
    for (let reelIndex = 0; reelIndex < Engine.REELS; reelIndex += 1) {
      for (let rowIndex = 0; rowIndex < Engine.ROWS; rowIndex += 1) {
        paintCell(cellMatrix[reelIndex][rowIndex], grid[reelIndex][rowIndex], reelIndex, rowIndex);
      }
    }
  }

  function paintInitialGrid() {
    let grid = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const candidate = Engine.generateGrid(Math.random);
      if (Engine.evaluate(candidate, Engine.MIN_BET).total === 0) {
        grid = candidate;
        break;
      }
    }
    renderGrid(grid || Engine.generateGrid(Math.random));
  }

  function clearBoardVisuals() {
    clearTimeout(ui.bigWinTimer);
    ui.bigWinTimer = null;
    el.bigWin.hidden = true;
    el.confettiLayer.innerHTML = '';
    el.lineOverlay.innerHTML = '';
    el.resultBar.classList.remove('is-win', 'is-loss', 'is-spinning');
    ui.lastWins = [];

    $$('.cell', el.reelGrid).forEach((cell) => {
      cell.classList.remove('is-winning', 'is-dimmed');
      cell.style.removeProperty('--win-color');
      cell.style.removeProperty('--win-soft');
    });
  }

  async function animateReels(finalGrid, version) {
    reels.forEach((reel) => {
      reel.classList.remove('just-landed');
      reel.classList.add('is-spinning');
    });

    if (reducedMotion.matches) {
      renderGrid(finalGrid);
      await delay(160);
      reels.forEach((reel) => reel.classList.remove('is-spinning'));
      return;
    }

    const stops = [500, 650, 800, 950, 1100];
    let stopped = 0;
    let ticker = null;

    try {
      ticker = window.setInterval(() => {
        if (version !== ui.version) return;
        const randomGrid = Engine.generateGrid(Math.random);
        for (let reelIndex = stopped; reelIndex < Engine.REELS; reelIndex += 1) {
          for (let rowIndex = 0; rowIndex < Engine.ROWS; rowIndex += 1) {
            paintCell(cellMatrix[reelIndex][rowIndex], randomGrid[reelIndex][rowIndex], reelIndex, rowIndex);
          }
        }
        sound.tick();
      }, 64);

      for (let reelIndex = 0; reelIndex < Engine.REELS; reelIndex += 1) {
        const wait = reelIndex === 0 ? stops[0] : stops[reelIndex] - stops[reelIndex - 1];
        await delay(wait);
        if (version !== ui.version) return;

        stopped = reelIndex + 1;
        for (let rowIndex = 0; rowIndex < Engine.ROWS; rowIndex += 1) {
          paintCell(cellMatrix[reelIndex][rowIndex], finalGrid[reelIndex][rowIndex], reelIndex, rowIndex);
        }

        const reel = reels[reelIndex];
        reel.classList.remove('is-spinning', 'just-landed');
        void reel.offsetWidth;
        reel.classList.add('just-landed');
        sound.reelStop(reelIndex);
      }

      renderGrid(finalGrid);
      await delay(130);
      reels.forEach((reel) => reel.classList.remove('is-spinning'));
    } finally {
      if (ticker !== null) window.clearInterval(ticker);
      reels.forEach((reel) => reel.classList.remove('is-spinning'));
    }
  }

  /* ------------------------------------------------------------------ *
   * Winning lines
   * ------------------------------------------------------------------ */
  function markWinningCells(wins) {
    const winning = new Set();
    const allCells = $$('.cell', el.reelGrid);

    wins.forEach((win) => {
      win.cells.forEach(({ reel, row }) => {
        winning.add(`${reel}-${row}`);
        const cell = cellMatrix[reel][row];
        if (!cell) return;
        cell.classList.add('is-winning');
        cell.style.setProperty('--win-color', win.lineColor);
        cell.style.setProperty('--win-soft', hexToRgba(win.lineColor, 0.16));
      });
    });

    allCells.forEach((cell) => {
      const key = `${cell.dataset.reel}-${cell.dataset.row}`;
      cell.classList.toggle('is-dimmed', !winning.has(key));
    });
  }

  function drawWinLines(wins, animate = true) {
    const svg = el.lineOverlay;
    svg.innerHTML = '';
    if (!wins || !wins.length) return;

    const windowRect = reelWindow.getBoundingClientRect();
    if (windowRect.width < 10 || windowRect.height < 10) return;

    svg.setAttribute('viewBox', `0 0 ${windowRect.width} ${windowRect.height}`);
    svg.setAttribute('preserveAspectRatio', 'none');

    wins.forEach((win, index) => {
      const points = win.cells.map(({ reel, row }) => {
        const rect = cellMatrix[reel][row].getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - windowRect.left,
          y: rect.top + rect.height / 2 - windowRect.top
        };
      });
      if (points.length < 2) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      path.setAttribute('points', points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '));
      path.setAttribute('pathLength', '1');
      path.setAttribute('class', 'line-path');
      path.style.stroke = win.lineColor;
      path.style.color = win.lineColor;
      if (animate) {
        path.style.animationDelay = `${index * 120}ms`;
      } else {
        path.style.animation = 'none';
        path.style.strokeDashoffset = '0';
      }
      svg.append(path);
    });
  }

  function scheduleWinLines(wins) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => drawWinLines(wins));
    });
  }

  /* ------------------------------------------------------------------ *
   * Big win + confetti
   * ------------------------------------------------------------------ */
  function spawnConfetti() {
    el.confettiLayer.innerHTML = '';
    if (reducedMotion.matches) return;

    const colors = ['#f6c85f', '#ffe6a3', '#5ee6a4', '#ff7185', '#b58cff', '#69c9ff', '#fff4d1'];
    for (let index = 0; index < 64; index += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.setProperty('--x', `${Math.random() * 100}%`);
      piece.style.setProperty('--w', `${3 + Math.random() * 5}px`);
      piece.style.setProperty('--h', `${5 + Math.random() * 9}px`);
      piece.style.setProperty('--c', colors[index % colors.length]);
      piece.style.setProperty('--d', `${1.7 + Math.random() * 1.9}s`);
      piece.style.setProperty('--delay', `${Math.random() * 0.55}s`);
      piece.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
      piece.style.setProperty('--rot', `${360 + Math.random() * 720}deg`);
      el.confettiLayer.append(piece);
    }
  }

  function showBigWin(result, bet, version) {
    if (version !== ui.version) return;
    const totalMultiple = result.total / bet;
    let title = 'BIG WIN';
    let kicker = '高倍中奖';

    if (result.maxCount >= 5 && result.lineCount >= 2) {
      title = 'MEGA WIN';
      kicker = '双线五连 · 超级大奖';
    } else if (result.maxCount >= 5) {
      title = 'FIVE OF A KIND';
      kicker = '五连大奖';
    } else if (totalMultiple >= 50) {
      title = 'MEGA WIN';
      kicker = '超级倍率';
    } else {
      kicker = `${totalMultiple.toFixed(0)}× 总下注`;
    }

    el.bigWinKicker.textContent = kicker;
    el.bigWinTitle.textContent = title;
    el.bigWinAmount.textContent = `+ ${formatNumber(result.total)}`;
    el.bigWin.hidden = false;
    spawnConfetti();
    sound.bigWin();

    clearTimeout(ui.bigWinTimer);
    ui.bigWinTimer = window.setTimeout(() => {
      el.bigWin.hidden = true;
      el.confettiLayer.innerHTML = '';
      ui.bigWinTimer = null;
    }, 3400);
  }

  /* ------------------------------------------------------------------ *
   * Betting / result UI
   * ------------------------------------------------------------------ */
  function setBet(value) {
    if (ui.spinning) return;
    const next = Math.floor(Number(value));
    const ceiling = Math.min(state.coins, Engine.MAX_BET);
    if (!Number.isFinite(next) || next < Engine.MIN_BET) {
      toast('最低下注为 100 金币。', { type: 'error' });
      refreshBetUI();
      return;
    }
    if (next > ceiling) {
      toast(`下注不能超过当前余额 ${formatNumber(state.coins)}。`, { type: 'error' });
      refreshBetUI();
      return;
    }
    const previousMultiplier = Engine.getBetMultiplier(state.bet);
    state.bet = next;
    const nextMultiplier = Engine.getBetMultiplier(state.bet);
    persist();
    refreshBetUI();

    if (nextMultiplier !== previousMultiplier) {
      toast(`下注倍率 ${nextMultiplier > previousMultiplier ? '提升至' : '变为'} ×${multiplierFormatter.format(nextMultiplier)}`, {
        duration: 1700
      });
    }
  }

  function applyCustomBet() {
    if (ui.spinning) return;
    const raw = el.customBet.value.trim();
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || !Number.isInteger(value)) {
      toast('请输入整数金币数。', { type: 'error' });
      refreshBetUI();
      return;
    }
    if (value < Engine.MIN_BET) {
      toast('最低下注为 100 金币。', { type: 'error' });
      refreshBetUI();
      return;
    }
    if (value > Engine.MAX_BET) {
      toast(`单局下注上限为 ${formatNumber(Engine.MAX_BET)}。`, { type: 'error' });
      refreshBetUI();
      return;
    }
    if (value > state.coins) {
      toast(`下注不能超过当前余额 ${formatNumber(state.coins)}。`, { type: 'error' });
      refreshBetUI();
      return;
    }
    setBet(value);
  }

  function refreshBetUI() {
    const canBet = !ui.spinning && state.coins >= Engine.MIN_BET;
    const activePreset = Array.from(el.betPresets.children).find(
      (chip) => Number(chip.dataset.bet) === state.bet
    );

    Array.from(el.betPresets.children).forEach((chip) => {
      const value = Number(chip.dataset.bet);
      chip.disabled = ui.spinning || value > state.coins;
      chip.classList.toggle('is-active', chip === activePreset && !ui.spinning);
      chip.setAttribute('aria-pressed', chip === activePreset ? 'true' : 'false');
    });

    if (document.activeElement !== el.customBet) {
      el.customBet.value = String(state.bet);
    }
    el.customBet.disabled = ui.spinning;
    el.customBet.max = String(Math.min(Math.max(state.coins, Engine.MIN_BET), Engine.MAX_BET));
    el.maxBet.disabled = !canBet;

    const betMultiplier = Engine.getBetMultiplier(state.bet);
    el.betMultiplierLabel.textContent = `×${multiplierFormatter.format(betMultiplier)}`;
    el.betMultiplierLabel.classList.toggle('is-boosted', betMultiplier > 1);
    el.betMultiplierLabel.title =
      betMultiplier > 1
        ? `当前下注倍率 ×${multiplierFormatter.format(betMultiplier)}`
        : '下注 500 起 ×1.5，1,000 起 ×2，5,000 起 ×3';

    const insufficient = state.bet > state.coins;
    el.spinBtn.disabled = !canBet || insufficient;
    el.bailout.hidden = !(state.coins < Engine.MIN_BET && !ui.spinning);

    if (!ui.spinning) {
      el.spinBtn.querySelector('.spin__text strong').textContent = '旋转';
      el.spinBtn.querySelector('.spin__text small').textContent = 'SPIN';
    }
  }

  function setSpinningUI(spinning) {
    ui.spinning = spinning;
    el.spinBtn.classList.toggle('is-spinning', spinning);
    el.spinBtn.disabled = spinning;

    if (spinning) {
      el.spinBtn.querySelector('.spin__text strong').textContent = '转动中';
      el.spinBtn.querySelector('.spin__text small').textContent = 'GOOD LUCK';
      Array.from(el.betPresets.children).forEach((chip) => {
        chip.disabled = true;
      });
      el.customBet.disabled = true;
      el.maxBet.disabled = true;
      el.bailout.hidden = true;
    } else {
      refreshBetUI();
    }
  }

  function setResultSpinning() {
    el.resultBar.classList.remove('is-win', 'is-loss');
    el.resultBar.classList.add('is-spinning');
    el.resultIcon.className = 'fa-solid fa-compass';
    el.resultKicker.textContent = 'SPINNING';
    el.resultTitle.textContent = '卷轴转动中…';
    el.resultDetail.textContent = '五条中奖线同时结算';
    el.resultAmount.textContent = '—';
  }

  function animateCount(element, from, to, duration, formatter, version) {
    const start = performance.now();
    function frame(now) {
      if (version !== ui.version) return;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      element.textContent = formatter(current);
      if (progress < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function showWinResult(result, bet, version) {
    const wins = result.wins;
    el.resultBar.classList.remove('is-spinning', 'is-loss');
    el.resultBar.classList.add('is-win');
    el.resultIcon.className = `fa-solid ${result.best ? result.best.symbolIcon : 'fa-star'}`;
    const boost = result.betMultiplier > 1 ? ` · BET ×${multiplierFormatter.format(result.betMultiplier)}` : '';
    const pityKicker = result.pityTriggered ? 'PITY · ' : '';
    el.resultKicker.textContent = `${pityKicker}LINE HIT · ${wins.length} LINE${wins.length > 1 ? 'S' : ''}${boost}`;

    const pityTitle = result.pityTriggered ? '保底命中 · ' : '';
    if (wins.length === 1) {
      el.resultTitle.textContent = `${pityTitle}${wins[0].lineName} · ${wins[0].symbolName} ${wins[0].count} 连`;
    } else {
      el.resultTitle.textContent = `${pityTitle}${wins.length} 条中奖线 · 最高 ${result.maxCount} 连`;
    }

    el.resultDetail.textContent = wins
      .map((win) => `${win.lineName} ${win.symbolName} ${win.count} 连`)
      .join(' · ');
    el.resultAmount.textContent = '0';
    animateCount(el.resultAmount, 0, result.total, 780, (value) => `+ ${formatNumber(value)}`, version);

    markWinningCells(wins);
    scheduleWinLines(wins);

    const totalMultiple = result.total / bet;
    if (result.maxCount >= 5 || totalMultiple >= 20) {
      clearTimeout(ui.bigWinTimer);
      ui.bigWinTimer = window.setTimeout(() => showBigWin(result, bet, version), 520);
    } else {
      sound.win(wins.length);
    }
  }

  function showLossResult(bet) {
    el.resultBar.classList.remove('is-spinning', 'is-win');
    el.resultBar.classList.add('is-loss');
    el.resultIcon.className = 'fa-solid fa-dice';
    el.resultKicker.textContent = 'NO LINE';
    el.resultTitle.textContent = '差一点，再转一次';
    el.resultDetail.textContent = '五条线都没能连成，下一转继续';
    el.resultAmount.textContent = `${SIGN} ${formatNumber(bet)}`;
    sound.lose();
  }

  /* ------------------------------------------------------------------ *
   * Spin
   * ------------------------------------------------------------------ */
  async function spin() {
    if (ui.spinning) return;

    if (state.coins < Engine.MIN_BET) {
      toast('金币不足 100，请先领取补给。', { type: 'error' });
      refreshBetUI();
      return;
    }

    if (!Number.isInteger(state.bet) || state.bet < Engine.MIN_BET) {
      toast('下注金额无效，请重新选择。', { type: 'error' });
      return;
    }

    if (state.bet > state.coins) {
      toast(`余额不足，当前最多可下注 ${formatNumber(state.coins)}。`, { type: 'error' });
      refreshBetUI();
      return;
    }

    sound.ensure();
    const version = ++ui.version;
    const bet = state.bet;
    const forced = ui.force;

    ui.force = null;
    el.devForce.value = '';
    clearTimeout(ui.bigWinTimer);
    ui.bigWinTimer = null;
    el.bigWin.hidden = true;
    el.confettiLayer.innerHTML = '';
    clearBoardVisuals();
    setResultSpinning();

    state.coins -= bet;
    updateBalance();
    setSpinningUI(true);
    sound.spinStart();

    let result;
    try {
      result = Engine.spin({ bet, forced, pityLossStreak: state.pity.lossStreak });
      await animateReels(result.grid, version);
    } catch (error) {
      state.coins += bet;
      updateBalance();
      setSpinningUI(false);
      refreshBetUI();
      toast('卷轴卡住了，下注已退回，请再试一次。', { type: 'error' });
      return;
    }

    if (version !== ui.version) return;

    renderGrid(result.grid);
    state.coins = Math.min(MAX_COINS, state.coins + result.total);

    const now = Date.now();
    const record = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      t: now,
      bet,
      betMultiplier: result.betMultiplier,
      win: result.total,
      net: result.total - bet,
      balanceAfter: state.coins,
      grid: result.grid.map((column) => column.slice()),
      wins: result.wins.map((win) => ({
        lineId: win.lineId,
        lineName: win.lineName,
        lineColor: win.lineColor,
        symbolId: win.symbolId,
        symbolName: win.symbolName,
        symbolIcon: win.symbolIcon,
        symbolColor: win.symbolColor,
        count: win.count,
        multiplier: win.multiplier,
        amount: win.amount,
        cells: win.cells.map((cell) => ({ ...cell }))
      })),
      maxCount: result.maxCount,
      pity: Boolean(result.pityTriggered),
      pityHard: Boolean(result.pityHard)
    };

    state.history.push(record);
    if (state.history.length > Engine.MAX_HISTORY) {
      state.history = state.history.slice(-Engine.MAX_HISTORY);
    }

    state.stats.spins += 1;
    if (result.total > 0) state.stats.winningSpins += 1;
    state.stats.wagered += bet;
    state.stats.won += result.total;
    state.stats.biggestWin = Math.max(state.stats.biggestWin, result.total);
    state.stats.bestMultiplier = Math.max(state.stats.bestMultiplier, result.total / bet);

    if (result.total > 0) {
      state.pity.lossStreak = 0;
    } else {
      state.pity.lossStreak = Math.min(Engine.PITY_GUARANTEE, state.pity.lossStreak + 1);
    }
    if (result.pityTriggered) state.pity.totalTriggers += 1;

    if (state.bet > state.coins && state.coins >= Engine.MIN_BET) {
      state.bet = Math.max(
        Engine.MIN_BET,
        Math.min(state.bet, Math.floor(state.coins / 100) * 100 || Engine.MIN_BET)
      );
    }

    persist();
    updateBalance(result.total > 0);
    renderStats();
    renderPity();
    renderHistory();
    if (el.historyDialog.open) renderFullHistory();
    setSpinningUI(false);
    ui.lastWins = result.wins;

    if (result.total > 0) {
      showWinResult(result, bet, version);
    } else {
      showLossResult(bet);
    }

    if (result.pityTriggered) {
      toast(result.pityHard ? '20 局硬保底触发：本局至少中一条线。' : '幸运保底触发：中奖率加成命中。', {
        type: 'success',
        duration: 2800
      });
    }

    if (forced) {
      const labels = {
        loss: '必输',
        triple: '三连皇冠',
        quad: '四连皇冠',
        five: '五连命运骰',
        mega: '双线五连大奖'
      };
      toast(`调试开奖已生效：${labels[forced] || forced}`, { type: 'success', duration: 2200 });
    }
  }

  /* ------------------------------------------------------------------ *
   * Stats / history rendering
   * ------------------------------------------------------------------ */
  function renderStats() {
    const stats = state.stats;
    const net = stats.won - stats.wagered;

    el.totalNet.textContent = formatNet(net);
    el.statHero.classList.toggle('is-positive', net > 0);
    el.statHero.classList.toggle('is-negative', net < 0);

    if (stats.spins === 0) {
      el.netCaption.textContent = '还没有开过局';
    } else {
      el.netCaption.textContent = `已下注 ${formatNumber(stats.wagered)} · 已赢 ${formatNumber(stats.won)}`;
    }

    el.statSpins.textContent = formatNumber(stats.spins);
    el.statHitRate.textContent = stats.spins > 0 ? formatPercent(stats.winningSpins / stats.spins) : '0%';
    el.statBiggest.textContent = formatNumber(stats.biggestWin);
    el.statWagered.textContent = formatNumber(stats.wagered);
  }

  function renderPity() {
    const info = Engine.getPityInfo(state.pity.lossStreak);
    el.pityFill.style.width = `${Math.round(info.progress * 100)}%`;
    el.pityMeter.classList.toggle('is-boosted', info.eligible && !info.guaranteed);
    el.pityMeter.classList.toggle('is-ready', info.guaranteed);

    if (info.guaranteed) {
      el.pityText.textContent = '保底就绪 · 下局必中';
      el.pityMeter.title = '连续 20 局未中，下一局至少中一条线。';
    } else if (info.eligible) {
      el.pityText.textContent = `加成 +${info.boostPercent}% · 再 ${info.toGuarantee} 局保底`;
      el.pityMeter.title = `已连续未中 ${info.streak} 局，中奖率获得额外提升；再 ${info.toGuarantee} 局触发硬保底。`;
    } else {
      el.pityText.textContent = `未中 ${info.streak} 局 · 再 ${info.toBoost} 局加成`;
      el.pityMeter.title = `再连续未中 ${info.toBoost} 局，将开始获得额外中奖概率；20 局触发硬保底。`;
    }
  }

  function createHistoryEmpty(full = false) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-clover';
    icon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('strong');
    title.textContent = full ? '还没有完整记录' : '牌桌还在等第一转';
    const text = document.createElement('span');
    text.textContent = full
      ? '每次旋转的图案与盈亏都会自动保存在这里。'
      : '旋转后，这里会显示图案、下注与盈亏。';
    empty.append(icon, title, text);
    return empty;
  }

  function createHistoryItem(entry, full = false) {
    const item = document.createElement('article');
    item.className = 'history-item';
    if (entry.net > 0) item.classList.add('is-win');
    else if (entry.net < 0) item.classList.add('is-loss');

    const top = document.createElement('div');
    top.className = 'history-item__top';

    const time = document.createElement('span');
    time.className = 'history-item__time';
    const clock = document.createElement('i');
    clock.className = 'fa-regular fa-clock';
    clock.setAttribute('aria-hidden', 'true');
    time.append(clock, document.createTextNode(formatHistoryTime(entry.t, full)));

    const net = document.createElement('strong');
    net.className = `history-item__net ${
      entry.net > 0 ? 'is-positive' : entry.net < 0 ? 'is-negative' : 'is-neutral'
    }`;
    net.textContent = formatNet(entry.net);

    top.append(time, net);

    const body = document.createElement('div');
    body.className = 'history-item__body';

    const miniGrid = document.createElement('div');
    miniGrid.className = 'history-grid';
    miniGrid.setAttribute('aria-hidden', 'true');

    const winningCells = new Set();
    (entry.wins || []).forEach((win) => {
      (win.cells || []).forEach((cell) => winningCells.add(`${cell.reel}-${cell.row}`));
    });

    for (let rowIndex = 0; rowIndex < Engine.ROWS; rowIndex += 1) {
      for (let reelIndex = 0; reelIndex < Engine.REELS; reelIndex += 1) {
        const cell = document.createElement('span');
        const symbolId = entry.grid && entry.grid[reelIndex] ? entry.grid[reelIndex][rowIndex] : null;
        const symbol = Engine.SYMBOL_BY_ID[symbolId] || Engine.SYMBOLS[0];
        cell.style.setProperty('--sym-color', symbol.color);
        cell.classList.toggle('is-win', winningCells.has(`${reelIndex}-${rowIndex}`));
        const icon = document.createElement('i');
        icon.className = `fa-solid ${symbol.icon}`;
        icon.setAttribute('aria-hidden', 'true');
        cell.append(icon);
        miniGrid.append(cell);
      }
    }

    const meta = document.createElement('div');
    meta.className = 'history-item__meta';
    const headline = document.createElement('strong');
    const entryMultiplier = entry.betMultiplier === undefined ? 1 : Number(entry.betMultiplier) || 1;
    const multiplierText = entryMultiplier > 1 ? ` ×${multiplierFormatter.format(entryMultiplier)}` : '';
    headline.textContent = `下注 ${formatNumber(entry.bet)}${multiplierText} · 中奖 ${formatNumber(entry.win)}`;
    const sub = document.createElement('span');
    if (entry.wins && entry.wins.length) {
      const maxCount = entry.wins.reduce((max, win) => Math.max(max, win.count), 0);
      sub.textContent = `${entry.wins.length} 条线命中 · 最高 ${maxCount} 连${
        entry.pity ? ' · 保底' : ''
      }${full ? ` · 余额 ${formatNumber(entry.balanceAfter)}` : ''}`;
    } else {
      sub.textContent = full ? `未中奖 · 余额 ${formatNumber(entry.balanceAfter)}` : '未中奖';
    }
    meta.append(headline, sub);

    body.append(miniGrid, meta);

    const winsRow = document.createElement('div');
    winsRow.className = 'history-item__wins';
    if (entry.pity) {
      const pityTag = document.createElement('span');
      pityTag.className = 'history-win-tag is-pity';
      pityTag.textContent = '幸运保底';
      winsRow.append(pityTag);
    }
    if (entry.wins && entry.wins.length) {
      entry.wins.forEach((win) => {
        const tag = document.createElement('span');
        tag.className = 'history-win-tag';
        tag.style.setProperty('--sym-color', win.symbolColor || '#f6c85f');
        tag.textContent = `${win.lineName} ${win.count} 连 +${formatNumber(win.amount)}`;
        winsRow.append(tag);
      });
    }

    item.append(top, body);
    if (winsRow.childElementCount) item.append(winsRow);
    return item;
  }

  function renderHistory() {
    el.historyList.innerHTML = '';
    if (!state.history.length) {
      el.historyList.append(createHistoryEmpty(false));
      return;
    }

    const entries = state.history.slice(-8).reverse();
    entries.forEach((entry) => el.historyList.append(createHistoryItem(entry, false)));
  }

  function renderFullHistory(reset = false) {
    if (reset) ui.historyShown = HISTORY_PAGE;
    el.historyFullList.innerHTML = '';

    const total = state.history.length;
    const net = state.stats.won - state.stats.wagered;
    const hitRate = state.stats.spins > 0 ? state.stats.winningSpins / state.stats.spins : 0;
    el.historyDialogSummary.textContent =
      `已保存 ${formatNumber(total)} 局 · 累计盈亏 ${formatNet(net)} · 中奖率 ${formatPercent(hitRate)}`;

    if (!total) {
      el.historyFullList.append(createHistoryEmpty(true));
    } else {
      const entries = state.history.slice().reverse().slice(0, ui.historyShown);
      entries.forEach((entry) => el.historyFullList.append(createHistoryItem(entry, true)));
    }

    el.loadMoreHistory.hidden = total <= ui.historyShown;
    el.loadMoreHistory.textContent = `再显示 ${Math.min(HISTORY_PAGE, Math.max(0, total - ui.historyShown))} 局`;
    el.loadMoreHistory.disabled = total <= ui.historyShown;
    el.loadMoreHistory.hidden = total <= ui.historyShown;

    el.historyLimitNote.textContent = total
      ? `当前显示 ${Math.min(ui.historyShown, total)} / ${formatNumber(total)} 局 · 本地最多保存 ${formatNumber(
          Engine.MAX_HISTORY
        )} 局`
      : '所有对局记录仅保存在此浏览器。';
  }

  /* ------------------------------------------------------------------ *
   * Paytable / static UI
   * ------------------------------------------------------------------ */
  function buildPaytable() {
    el.paytableGrid.innerHTML = '';
    Engine.SYMBOLS.forEach((symbol) => {
      const card = document.createElement('article');
      card.className = 'pay-card';
      card.style.setProperty('--sym-color', symbol.color);
      card.style.setProperty('--sym-glow', symbol.glow);

      const head = document.createElement('div');
      head.className = 'pay-card__head';

      const iconWrap = document.createElement('span');
      iconWrap.className = 'pay-card__icon';
      const icon = document.createElement('i');
      icon.className = `fa-solid ${symbol.icon}`;
      icon.setAttribute('aria-hidden', 'true');
      iconWrap.append(icon);

      const name = document.createElement('div');
      name.className = 'pay-card__name';
      const strong = document.createElement('strong');
      strong.textContent = symbol.name;
      const rarity = document.createElement('span');
      rarity.className = 'pay-card__rarity';
      rarity.textContent = symbol.rarity;
      name.append(strong, rarity);

      head.append(iconWrap, name);

      const rows = document.createElement('div');
      rows.className = 'pay-card__rows';
      [3, 4, 5].forEach((count) => {
        const row = document.createElement('div');
        row.className = 'pay-row';
        const label = document.createElement('span');
        label.textContent = `${count} 连`;
        const value = document.createElement('b');
        value.textContent = `×${multiplierFormatter.format(symbol.pays[count])}`;
        row.append(label, value);
        rows.append(row);
      });

      card.append(head, rows);
      card.setAttribute(
        'aria-label',
        `${symbol.name}，${symbol.rarity}，3 连 ${symbol.pays[3]} 倍，4 连 ${symbol.pays[4]} 倍，5 连 ${symbol.pays[5]} 倍`
      );
      el.paytableGrid.append(card);
    });
  }

  function renderAll() {
    updateBalance();
    updateSoundUI();
    refreshBetUI();
    renderStats();
    renderPity();
    renderHistory();
    renderHourly();
    updateDevMeta();
  }

  /* ------------------------------------------------------------------ *
   * Toasts / dialogs / confirmations
   * ------------------------------------------------------------------ */
  function toast(message, options = {}) {
    const { type = 'info', duration = 2700 } = options;
    const node = document.createElement('div');
    node.className = `toast is-${type}`;

    const icon = document.createElement('i');
    icon.setAttribute(
      'class',
      `fa-solid ${
        type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info'
      }`
    );
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = message;
    node.append(icon, text);
    el.toastStack.append(node);

    while (el.toastStack.childElementCount > 3) {
      el.toastStack.firstElementChild.remove();
    }

    window.setTimeout(() => {
      node.classList.add('is-leaving');
      window.setTimeout(() => node.remove(), 240);
    }, duration);
  }

  function syncModalLock() {
    const shouldLock = $$('dialog').some((dialog) => dialog.open);
    const locked = document.body.classList.contains('modal-open');

    if (shouldLock && !locked) {
      // Keep the layout width identical while the page scrollbar is hidden.
      const gap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      document.body.style.setProperty('--modal-scrollbar-gap', `${gap}px`);
      document.body.classList.add('modal-open');
    } else if (!shouldLock && locked) {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('--modal-scrollbar-gap');
    }
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    syncModalLock();
  }

  function askConfirm(title, text, options = {}) {
    const { okLabel = '确定' } = options;
    if (ui.confirmResolve) {
      ui.confirmResolve(false);
      ui.confirmResolve = null;
    }
    el.confirmTitle.textContent = title;
    el.confirmText.textContent = text;
    el.confirmOk.textContent = okLabel;
    openDialog(el.confirmDialog);

    return new Promise((resolve) => {
      ui.confirmResolve = resolve;
    });
  }

  function closeConfirm(value) {
    if (ui.confirmResolve) {
      const resolve = ui.confirmResolve;
      ui.confirmResolve = null;
      el.confirmDialog.close();
      resolve(value);
    } else if (el.confirmDialog.open) {
      el.confirmDialog.close();
    }
  }

  /* ------------------------------------------------------------------ *
   * Maintenance access
   * ------------------------------------------------------------------ */
  async function sha256(text) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto unavailable');
    }
    const bytes = new TextEncoder().encode(text);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function requireDevAccess() {
    if (ui.devUnlocked) return true;
    ui.force = null;
    el.devForce.value = '';
    toast('维护操作需要先通过口令验证。', { type: 'error' });
    return false;
  }

  function openDevPanel() {
    if (!requireDevAccess()) return;
    el.devPanel.hidden = false;
    updateDevMeta();
  }

  function closeDevPanel() {
    el.devPanel.hidden = true;
  }

  function openDevAuth() {
    el.devPassword.value = '';
    el.devAuthError.textContent = '';
    openDialog(el.devAuth);
    window.setTimeout(() => el.devPassword.focus(), 80);
  }

  async function handleDevAuth(event) {
    event.preventDefault();
    const password = el.devPassword.value.trim();
    if (!password) {
      el.devAuthError.textContent = '请输入维护口令。';
      return;
    }

    el.devAuthError.textContent = '';
    const submit = el.devAuthForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const hash = await sha256(password);
      if (hash === SECRET_HASH) {
        ui.devUnlocked = true;
        try {
          window.sessionStorage.setItem(UNLOCK_KEY, '1');
        } catch (error) {
          /* session storage is optional */
        }
        el.devAuth.close();
        openDevPanel();
        toast('维护模式已开启。', { type: 'success' });
      } else {
        el.devAuthError.textContent = '口令不正确。';
        el.devPassword.select();
        el.devAuth.classList.remove('is-shake');
        void el.devAuth.offsetWidth;
        el.devAuth.classList.add('is-shake');
      }
    } catch (error) {
      el.devAuthError.textContent = '安全校验不可用，请在支持 Web Crypto 的浏览器中打开。';
    } finally {
      submit.disabled = false;
    }
  }

  function handleBrandClicks() {
    const now = performance.now();
    if (!ui.brandClicks) ui.brandClicks = [];
    ui.brandClicks = ui.brandClicks.filter((time) => now - time < 6000);
    ui.brandClicks.push(now);
    if (ui.brandClicks.length < 7) return;
    ui.brandClicks = [];
    if (ui.devUnlocked) {
      if (el.devPanel.hidden) openDevPanel();
      else closeDevPanel();
    } else if (!el.devAuth.open) {
      openDevAuth();
    }
  }

  function addCoins(amount) {
    if (!requireDevAccess()) return;
    state.coins = Math.min(MAX_COINS, state.coins + amount);
    persist();
    updateBalance(true);
    refreshBetUI();
    updateDevMeta();
    toast(`已增加 ${formatNumber(amount)} 金币。`, { type: 'success' });
  }

  function setCoinsFromDebug() {
    if (!requireDevAccess()) return;
    const value = Number(el.devSetCoins.value);
    if (!Number.isFinite(value) || value < 0) {
      toast('请输入有效的金币数量。', { type: 'error' });
      return;
    }
    state.coins = clampInteger(value, 0, MAX_COINS, state.coins);
    if (state.coins < Engine.MIN_BET) state.bet = Engine.MIN_BET;
    el.devSetCoins.value = '';
    persist();
    updateBalance(true);
    refreshBetUI();
    updateDevMeta();
    toast(`金币已设置为 ${formatNumber(state.coins)}。`, { type: 'success' });
  }

  /* ------------------------------------------------------------------ *
   * History actions
   * ------------------------------------------------------------------ */
  async function clearHistory() {
    if (ui.spinning) {
      toast('请等待本局结算完成后再操作。');
      return;
    }
    if (!state.history.length) {
      toast('目前没有对局记录。');
      return;
    }
    const confirmed = await askConfirm(
      '清空历史记录？',
      '会删除全部对局明细，但保留金币、累计统计和当前下注。此操作无法撤销。',
      { okLabel: '清空记录' }
    );
    if (!confirmed) return;

    state.history = [];
    ui.historyShown = HISTORY_PAGE;
    persist();
    renderHistory();
    renderFullHistory(true);
    updateDevMeta();
    toast('历史记录已清空。', { type: 'success' });
  }

  async function resetAll() {
    if (ui.spinning) {
      toast('请等待本局结算完成后再操作。');
      return;
    }
    const confirmed = await askConfirm(
      '重置全部存档？',
      '金币、累计统计、历史记录和下注设置都会回到初始状态。此操作无法撤销。',
      { okLabel: '全部重置' }
    );
    if (!confirmed) return;

    state = defaultState();
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      /* ignore */
    }
    ui.force = null;
    el.devForce.value = '';
    ui.version += 1;
    clearBoardVisuals();
    paintInitialGrid();
    persist();
    renderAll();
    renderFullHistory(true);
    el.resultBar.classList.remove('is-win', 'is-loss', 'is-spinning');
    el.resultIcon.className = 'fa-solid fa-clover';
    el.resultKicker.textContent = 'READY TO SPIN';
    el.resultTitle.textContent = '好运，从第一转开始';
    el.resultDetail.textContent = '选择下注金额，点击旋转';
    el.resultAmount.textContent = '—';
    toast('存档已重置，欢迎重新开始。', { type: 'success' });
  }

  function exportHistory() {
    const payload = {
      game: 'DarkHell',
      exportedAt: new Date().toISOString(),
      coins: state.coins,
      bet: state.bet,
      stats: state.stats,
      hourly: state.hourly,
      pity: state.pity,
      history: state.history
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = url;
    link.download = `fortune-five-history-${stamp}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`已导出 ${formatNumber(state.history.length)} 局记录。`, { type: 'success' });
  }

  function bailout() {
    if (ui.spinning || state.coins >= Engine.MIN_BET) return;
    state.coins += 1000;
    if (state.bet < Engine.MIN_BET) state.bet = Engine.MIN_BET;
    persist();
    updateBalance(true);
    refreshBetUI();
    toast('补给已到账：+1,000 金币。', { type: 'success' });
  }

  function startOfHour(now = Date.now()) {
    const date = new Date(now);
    date.setMinutes(0, 0, 0);
    return date.getTime();
  }

  function nextHourStart(now = Date.now()) {
    const date = new Date(now);
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 1);
    return date.getTime();
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  function isHourlyReady() {
    return state.hourly.lastClaimAt < startOfHour();
  }

  function renderHourly() {
    const ready = isHourlyReady();
    const remaining = nextHourStart() - Date.now();
    const label = el.hourlyClaim.querySelector('span');
    const icon = el.hourlyClaim.querySelector('i');

    el.hourlyClaim.disabled = !ready;
    el.hourlyClaim.classList.toggle('is-ready', ready);
    el.hourlyStatus.textContent = ready ? '本小时可领取' : '本小时已领取';
    el.hourlyCountdown.textContent = `${ready ? '下次刷新' : '距离下次整点'} ${formatCountdown(remaining)}`;
    icon.className = `fa-solid ${ready ? 'fa-gift' : 'fa-check'}`;
    label.textContent = ready ? '领取 1,000' : '本小时已领';
    el.hourlyClaim.setAttribute('aria-label', ready ? '领取整点补给 1,000 金币' : '本小时整点补给已领取');
    ui.hourlyReady = ready;
  }

  function claimHourly() {
    if (!isHourlyReady()) {
      toast(`本小时已领取，下次整点 ${formatCountdown(nextHourStart() - Date.now())} 后再来。`);
      return;
    }

    const credited = Math.min(1000, MAX_COINS - state.coins);
    if (credited <= 0) {
      toast('金币已达上限，暂时无法领取。', { type: 'error' });
      return;
    }

    state.coins += credited;
    state.hourly.lastClaimAt = Date.now();
    state.hourly.totalClaimed += credited;
    persist();
    updateBalance(true);
    refreshBetUI();
    renderHourly();
    sound.claim();
    toast(`整点补给到账：+${formatNumber(credited)} 金币。`, { type: 'success', duration: 3000 });
  }

  /* ------------------------------------------------------------------ *
   * Event wiring
   * ------------------------------------------------------------------ */
  function bindEvents() {
    el.spinBtn.addEventListener('click', spin);
    el.betPresets.addEventListener('click', (event) => {
      const chip = event.target.closest('.bet-chip');
      if (!chip || chip.disabled) return;
      setBet(Number(chip.dataset.bet));
      sound.click();
    });

    el.customBet.addEventListener('change', applyCustomBet);
    el.customBet.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        el.customBet.blur();
      }
    });
    el.maxBet.addEventListener('click', () => {
      if (ui.spinning) return;
      setBet(Math.min(state.coins, Engine.MAX_BET));
    });

    el.bailoutBtn.addEventListener('click', bailout);
    el.hourlyClaim.addEventListener('click', claimHourly);
    el.soundToggle.addEventListener('click', () => {
      state.sound = !state.sound;
      updateSoundUI();
      persist();
      if (state.sound) {
        sound.enabled = true;
        sound.click();
        toast('音效已开启。');
      } else {
        sound.enabled = false;
        toast('音效已关闭。');
      }
    });

    el.helpBtn.addEventListener('click', () => openDialog(el.helpDialog));
    el.historyBtn.addEventListener('click', () => {
      renderFullHistory(true);
      openDialog(el.historyDialog);
    });
    el.historyBtnSide.addEventListener('click', () => {
      renderFullHistory(true);
      openDialog(el.historyDialog);
    });

    el.loadMoreHistory.addEventListener('click', () => {
      ui.historyShown += HISTORY_PAGE;
      renderFullHistory();
    });
    el.clearHistory.addEventListener('click', clearHistory);
    el.exportHistory.addEventListener('click', exportHistory);

    el.brand.addEventListener('click', handleBrandClicks);

    el.confirmOk.addEventListener('click', () => closeConfirm(true));
    el.confirmCancel.addEventListener('click', () => closeConfirm(false));
    el.confirmDialog.addEventListener('close', () => {
      if (!ui.confirmResolve) return;
      const resolve = ui.confirmResolve;
      ui.confirmResolve = null;
      resolve(false);
    });

    el.devAuthForm.addEventListener('submit', handleDevAuth);
    el.devAuthClose.addEventListener('click', () => el.devAuth.close());
    el.devClose.addEventListener('click', closeDevPanel);

    $$('[data-add-coins]').forEach((button) => {
      button.addEventListener('click', () => addCoins(Number(button.dataset.addCoins)));
    });
    el.devApplyCoins.addEventListener('click', setCoinsFromDebug);
    el.devSetCoins.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        setCoinsFromDebug();
      }
    });

    el.devForce.addEventListener('change', () => {
      if (!requireDevAccess()) return;
      ui.force = el.devForce.value || null;
      if (ui.force) {
        const label = el.devForce.options[el.devForce.selectedIndex].textContent;
        toast(`下一局指定为：${label}`, { duration: 2200 });
      }
    });
    el.devMega.addEventListener('click', () => {
      if (!requireDevAccess()) return;
      ui.force = 'mega';
      el.devForce.value = 'mega';
      toast('已装填双线五连大奖，下一局生效。', { type: 'success', duration: 2600 });
    });
    el.devClearHistory.addEventListener('click', clearHistory);
    el.devResetAll.addEventListener('click', resetAll);

    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = button.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    $$('dialog').forEach((dialog) => {
      dialog.addEventListener('close', syncModalLock);
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (outside) dialog.close();
      });
    });

    window.addEventListener('resize', () => {
      if (ui.lastWins.length) {
        window.clearTimeout(ui.resizeTimer);
        ui.resizeTimer = window.setTimeout(() => drawWinLines(ui.lastWins, false), 100);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return;
      if ($$('dialog').some((dialog) => dialog.open)) return;
      event.preventDefault();
      spin();
    });

    // Reopen the maintenance panel without re-entering the passphrase in the same tab.
    try {
      ui.devUnlocked = window.sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch (error) {
      ui.devUnlocked = false;
    }
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  buildReels();
  buildPaytable();
  bindEvents();
  paintInitialGrid();
  renderAll();
  if (ui.firstRun) persist();
  window.setInterval(() => {
    const wasReady = ui.hourlyReady;
    renderHourly();
    if (wasReady === false && ui.hourlyReady === true) {
      toast('整点到了，1,000 金币补给可以领取了。', { type: 'success', duration: 3400 });
    }
  }, 1000);

  if (ui.firstRun) {
    window.setTimeout(() => {
      toast('欢迎来到 DarkHell，已为你准备 10,000 金币。', { type: 'success', duration: 3600 });
    }, 700);
  }
})();
