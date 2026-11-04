(function () {
  "use strict";

  const LLK = window.LLK;
  const COLS = 10;
  const ROWS = 8;
  const MATCH_SECONDS = 60;
  const HINT_COOLDOWN_MS = 2300;

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

  const DIFFICULTIES = {
    easy: { label: "轻松", interval: 4400, short: "4.4 秒" },
    normal: { label: "标准", interval: 3000, short: "3.0 秒" },
    hard: { label: "挑战", interval: 1900, short: "1.9 秒" },
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    playerCard: $("playerCard"),
    aiCard: $("aiCard"),
    playerScore: $("playerScore"),
    aiScore: $("aiScore"),
    remaining: $("remaining"),
    timer: $("timer"),
    timerBar: $("timerBar"),
    clock: document.querySelector(".clock"),
    aiProgress: $("aiProgress"),
    board: $("board"),
    tileLayer: $("tileLayer"),
    pathLayer: $("pathLayer"),
    toast: $("toast"),
    statusText: $("statusText"),
    hintBtn: $("hintBtn"),
    pauseBtn: $("pauseBtn"),
    helpBtn: $("helpBtn"),
    startOverlay: $("startOverlay"),
    pauseOverlay: $("pauseOverlay"),
    helpOverlay: $("helpOverlay"),
    endOverlay: $("endOverlay"),
    startBtn: $("startBtn"),
    resumeBtn: $("resumeBtn"),
    pauseRestartBtn: $("pauseRestartBtn"),
    againBtn: $("againBtn"),
    changeDifficultyBtn: $("changeDifficultyBtn"),
    helpCloseBtn: $("helpCloseBtn"),
    helpOkBtn: $("helpOkBtn"),
    difficultyGroup: $("difficultyGroup"),
    difficultyButtons: Array.from(document.querySelectorAll("[data-difficulty]")),
    endModal: $("endModal"),
    resultBadge: $("resultBadge"),
    resultTitle: $("resultTitle"),
    resultSub: $("resultSub"),
    finalPlayerScore: $("finalPlayerScore"),
    finalAiScore: $("finalAiScore"),
    finalTime: $("finalTime"),
    finalDifficulty: $("finalDifficulty"),
    finalAiRate: $("finalAiRate"),
    statusWrap: $("statusText").parentElement,
  };

  const overlays = [
    els.startOverlay,
    els.pauseOverlay,
    els.helpOverlay,
    els.endOverlay,
  ];

  const state = {
    status: "idle", // idle | playing | paused | ending | ended
    board: [],
    selected: null,
    playerScore: 0,
    aiScore: 0,
    remaining: 0,
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
    hintCooldownTimer: null,
    hintCooldownUntil: 0,
    pathTimer: null,
    toastTimer: null,
    toastToken: 0,
    reshuffling: false,
    helpAutoPaused: false,
    endReason: null,
  };

  const tileEls = new Map();
  const keyOf = (row, col) => `${row}:${col}`;

  function setupBoardGeometry() {
    els.board.style.setProperty("--vcols", COLS + 2);
    els.board.style.setProperty("--vrows", ROWS + 2);
    els.pathLayer.setAttribute("viewBox", `0 0 ${(COLS + 2) * 100} ${(ROWS + 2) * 100}`);
    els.pathLayer.setAttribute("width", "100%");
    els.pathLayer.setAttribute("height", "100%");
  }

  function setDifficulty(key) {
    const next = DIFFICULTIES[key] ? key : "normal";
    state.difficulty = next;
    for (const button of els.difficultyButtons) {
      const active = button.dataset.difficulty === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function currentAiInterval() {
    return DIFFICULTIES[state.difficulty].interval;
  }

  function createBoard() {
    return LLK.createPlayableBoard(COLS, ROWS, COLORS.length);
  }

  function renderBoard(mode) {
    clearTimeout(state.pathTimer);
    els.pathLayer.innerHTML = "";
    els.tileLayer.innerHTML = "";
    tileEls.clear();
    state.selected = null;

    const fragment = document.createDocumentFragment();
    let order = 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const color = state.board[row][col];
        if (color === null || color === undefined) continue;
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "tile";
        if (mode === "shuffle") tile.classList.add("is-shuffled");
        tile.dataset.row = String(row);
        tile.dataset.col = String(col);
        tile.style.setProperty("--x", col + 1);
        tile.style.setProperty("--y", row + 1);
        tile.style.setProperty("--order", Math.min(order, 80));
        tile.style.setProperty("--tile-color", COLORS[color].hex);
        tile.setAttribute("aria-pressed", "false");
        tile.setAttribute(
          "aria-label",
          `第 ${row + 1} 行第 ${col + 1} 列，${COLORS[color].name}色色块`
        );
        tile.title = `${COLORS[color].name}色`;
        fragment.appendChild(tile);
        tileEls.set(keyOf(row, col), tile);
        order += 1;
      }
    }
    els.tileLayer.appendChild(fragment);
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
    const shown = state.status === "idle" ? state.timeLimit : state.timeLeft;
    els.timer.textContent = formatClock(shown);
    const ratio = Math.max(0, Math.min(1, shown / state.timeLimit));
    els.timerBar.style.width = `${ratio * 100}%`;
    const urgent =
      (state.status === "playing" || state.status === "paused") && state.timeLeft <= 10.5;
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
    const onCooldown = performance.now() < state.hintCooldownUntil;
    els.hintBtn.disabled =
      state.status !== "playing" || state.reshuffling || onCooldown;
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
    setStatus(`已选中${COLORS[color].name}色，再选一个同色块`, "info");
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
    tile.classList.remove("is-selected", "is-hint", "is-invalid");
    tile.setAttribute("aria-pressed", "false");
    tile.classList.add("is-matched");
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

    const selectedWasRemoved =
      state.selected &&
      ((state.selected.row === a.row && state.selected.col === a.col) ||
        (state.selected.row === b.row && state.selected.col === b.col));
    if (selectedWasRemoved) clearSelection();

    state.remaining = Math.max(0, state.remaining - 1);
    if (actor === "player") {
      state.playerScore += 1;
      pulseCard(els.playerCard);
      setStatus(
        state.remaining === 0
          ? "最后一对也消除了！"
          : `连接成功 +1 · 场上还剩 ${state.remaining} 对`,
        "info"
      );
    } else {
      state.aiScore += 1;
      pulseCard(els.aiCard);
      setStatus(
        state.remaining === 0
          ? "电脑消掉了最后一对！"
          : `电脑抢到一对 · 它已消除 ${state.aiScore} 对`,
        "warn"
      );
    }

    drawPath(path, actor);
    animateRemovedTile(a.row, a.col, actor);
    animateRemovedTile(b.row, b.col, actor);
    renderHud();
    queueBoardCheck();
    return true;
  }

  function queueBoardCheck() {
    clearTimeout(state.boardCheckTimer);
    state.boardCheckTimer = setTimeout(() => {
      state.boardCheckTimer = null;
      if (state.status !== "playing") return;
      if (state.remaining <= 0) {
        finishGame("cleared");
        return;
      }
      if (state.reshuffling) return;
      if (!LLK.hasMoves(state.board)) beginReshuffle();
    }, 480);
  }

  function beginReshuffle() {
    if (state.status !== "playing" || state.reshuffling) return;
    state.reshuffling = true;
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
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
        // 极端布局下，先把剩余色块收拢，再重排。
        const colors = [];
        for (let row = 0; row < ROWS; row += 1) {
          for (let col = 0; col < COLS; col += 1) {
            if (state.board[row][col] !== null) {
              colors.push(state.board[row][col]);
              state.board[row][col] = null;
            }
          }
        }
        let index = 0;
        for (let row = 0; row < ROWS && index < colors.length; row += 1) {
          for (let col = 0; col < COLS && index < colors.length; col += 1) {
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
    if (state.remaining <= 0) return;

    const moves = LLK.findAvailableMoves(state.board);
    if (moves.length === 0) {
      beginReshuffle();
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

  function onTileClick(event) {
    if (state.status !== "playing" || state.reshuffling) return;
    const tile = event.target.closest(".tile");
    if (!tile || !els.tileLayer.contains(tile)) return;

    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return;
    const color = state.board[row] && state.board[row][col];
    if (color === null || color === undefined) return;

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
      selectTile(row, col);
      showToast("要选两个相同颜色", "warn", 900);
      return;
    }

    const path = LLK.findPath(state.board, first, { row, col });
    if (!path) {
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

  function useHint() {
    if (state.status !== "playing" || state.reshuffling) return;
    if (performance.now() < state.hintCooldownUntil) return;
    const moves = LLK.findAvailableMoves(state.board);
    if (moves.length === 0) {
      beginReshuffle();
      return;
    }

    clearSelection();
    const move = moves[Math.floor(Math.random() * moves.length)];
    const first = tileEls.get(keyOf(move.a.row, move.a.col));
    const second = tileEls.get(keyOf(move.b.row, move.b.col));
    for (const element of [first, second]) {
      if (!element) continue;
      element.classList.remove("is-hint");
      void element.offsetWidth;
      element.classList.add("is-hint");
    }
    setTimeout(() => {
      for (const element of [first, second]) {
        if (element && element.isConnected) element.classList.remove("is-hint");
      }
    }, 1650);
    setStatus("提示：闪动的这一对可以连接", "info");
    showToast("提示已标记 · 再找找看", "ok", 1200);

    state.hintCooldownUntil = performance.now() + HINT_COOLDOWN_MS;
    updateControls();
    clearTimeout(state.hintCooldownTimer);
    state.hintCooldownTimer = setTimeout(updateControls, HINT_COOLDOWN_MS + 30);
  }

  function tick() {
    if (state.status !== "playing") return;
    const left = Math.max(0, (state.deadline - performance.now()) / 1000);
    state.timeLeft = left;
    updateClock();
    if (left <= 0.001) {
      finishGame("timeout");
    }
  }

  function finishGame(reason) {
    if (state.status !== "playing") return;
    state.status = "ending";
    state.endReason = reason;
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
    clearSelection();
    updateClock();
    renderHud();
    setStatus(
      reason === "timeout" ? "时间到，正在结算…" : "棋盘清空，正在结算…",
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

    els.endModal.dataset.result = result;
    els.resultBadge.textContent = result === "win" ? "胜" : result === "lose" ? "负" : "和";
    els.resultTitle.textContent =
      result === "win" ? "你赢了" : result === "lose" ? "电脑赢了" : "平局";
    if (result === "win") {
      els.resultSub.textContent =
        state.endReason === "timeout"
          ? `时间到，你以 ${player} : ${ai} 领先电脑。节奏拿捏得不错。`
          : `棋盘清空，你以 ${player} : ${ai} 抢下更多色块。`;
    } else if (result === "lose") {
      els.resultSub.textContent =
        state.endReason === "timeout"
          ? `时间到，电脑以 ${ai} : ${player} 领先。再来一局，把节奏抢回来。`
          : `电脑以 ${ai} : ${player} 赢下这局。下一把试试更快出手。`;
    } else {
      els.resultSub.textContent =
        state.endReason === "timeout"
          ? `时间到，双方都消除了 ${player} 对。加赛一局分胜负？`
          : `棋盘清空，双方都消除了 ${player} 对。势均力敌。`;
    }

    els.finalPlayerScore.textContent = String(player);
    els.finalAiScore.textContent = String(ai);
    els.finalTime.textContent = formatClock(
      state.endReason === "timeout" ? state.timeLimit : state.elapsed
    );
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
    clearTimeout(state.hintCooldownTimer);
    state.hintCooldownTimer = null;
    state.reshuffling = false;
    if (stopProgress !== false) stopAiProgress(true);
  }

  function resetStateForRound() {
    state.selected = null;
    state.playerScore = 0;
    state.aiScore = 0;
    state.timeLeft = MATCH_SECONDS;
    state.deadline = 0;
    state.elapsed = 0;
    state.endReason = null;
    state.helpAutoPaused = false;
    state.hintCooldownUntil = 0;
  }

  function startGame() {
    hideAllOverlays();
    clearRoundTimers(true);
    resetStateForRound();

    state.board = createBoard();
    state.remaining = LLK.countRemaining(state.board) / 2;
    state.status = "playing";
    state.deadline = performance.now() + state.timeLimit * 1000;
    state.timeLeft = state.timeLimit;
    state.reshuffling = false;

    renderBoard("deal");
    renderHud();
    setStatus("抢在电脑之前，消除同色色块！", "info");
    showToast(
      `${DIFFICULTIES[state.difficulty].label}难度 · 电脑每 ${DIFFICULTIES[state.difficulty].short} 出手`,
      "ok",
      1900
    );
    state.timerId = setInterval(tick, 100);
    scheduleAI(currentAiInterval() + 900);
    updateControls();
  }

  function preparePreview() {
    clearRoundTimers(true);
    resetStateForRound();
    state.status = "idle";
    state.board = createBoard();
    state.remaining = LLK.countRemaining(state.board) / 2;
    state.timeLeft = MATCH_SECONDS;
    renderBoard("deal");
    renderHud();
    setStatus("点击两个同色色块，把它们连起来", "info");
    stopAiProgress(true);
  }

  function pauseGame(options) {
    if (state.status !== "playing") return false;
    const silent = Boolean(options && options.silent);
    state.timeLeft = Math.max(0, (state.deadline - performance.now()) / 1000);
    state.status = "paused";
    clearInterval(state.timerId);
    state.timerId = null;
    clearTimeout(state.aiTimer);
    state.aiTimer = null;
    clearTimeout(state.boardCheckTimer);
    state.boardCheckTimer = null;
    els.aiProgress.style.animationPlayState = "paused";
    updateClock();
    updateControls();
    setStatus("已暂停 · 计时与电脑都已停下", "warn");
    if (!silent) showOverlay(els.pauseOverlay);
    return true;
  }

  function resumeGame() {
    if (state.status !== "paused") return;
    hideOverlay(els.pauseOverlay);
    state.status = "playing";
    state.deadline = performance.now() + Math.max(0, state.timeLeft) * 1000;
    state.timerId = setInterval(tick, 100);
    updateControls();
    setStatus("继续对战，抢在电脑前消除！", "info");
    if (state.remaining <= 0) {
      finishGame("cleared");
      return;
    }
    scheduleAI(currentAiInterval());
    queueBoardCheck();
  }

  function showStartScreen() {
    hideAllOverlays();
    preparePreview();
    showOverlay(els.startOverlay);
  }

  function openHelp() {
    state.helpAutoPaused = state.status === "playing";
    if (state.helpAutoPaused) pauseGame({ silent: true });
    showOverlay(els.helpOverlay);
  }

  function closeHelp() {
    const wasAutoPaused = state.helpAutoPaused;
    hideOverlay(els.helpOverlay);
    state.helpAutoPaused = false;
    if (wasAutoPaused && state.status === "paused") resumeGame();
  }

  function showOverlay(overlay) {
    for (const item of overlays) item.hidden = item !== overlay;
    overlay.hidden = false;
    const focusTarget = overlay.querySelector(
      ".primary-btn:not(:disabled), .segmented button.is-active, button:not(:disabled)"
    );
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

    if (!els.startOverlay.hidden || !els.endOverlay.hidden || !els.helpOverlay.hidden) {
      return;
    }

    if (key === "h") {
      useHint();
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

    els.startBtn.addEventListener("click", startGame);
    els.hintBtn.addEventListener("click", useHint);
    els.pauseBtn.addEventListener("click", () => {
      if (state.status === "playing") pauseGame();
      else if (state.status === "paused") resumeGame();
    });
    els.helpBtn.addEventListener("click", openHelp);
    els.resumeBtn.addEventListener("click", resumeGame);
    els.pauseRestartBtn.addEventListener("click", startGame);
    els.againBtn.addEventListener("click", startGame);
    els.changeDifficultyBtn.addEventListener("click", showStartScreen);
    els.helpCloseBtn.addEventListener("click", closeHelp);
    els.helpOkBtn.addEventListener("click", closeHelp);
    els.helpOverlay.addEventListener("click", (event) => {
      if (event.target === els.helpOverlay) closeHelp();
    });

    els.difficultyGroup.addEventListener("click", (event) => {
      const button = event.target.closest("[data-difficulty]");
      if (!button) return;
      setDifficulty(button.dataset.difficulty);
    });

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.status === "playing") pauseGame();
    });
  }

  function init() {
    setupBoardGeometry();
    bindEvents();
    setDifficulty("normal");
    preparePreview();
    showOverlay(els.startOverlay);
  }

  if (!LLK) {
    els.statusText.textContent = "核心脚本加载失败，请刷新页面";
    return;
  }

  init();
})();
