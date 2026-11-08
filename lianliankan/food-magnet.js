"use strict";

/*
 * 吃过的食物：长按屏幕把已掉落的 emoji 吸到按住的位置，松手后重新落回底部。
 * 这是一个独立文件；如果不需要这个交互，删除 index.html 中的脚本引用即可。
 */
(function () {
  const overlay = document.getElementById("foodRecordOverlay");
  const layer = document.getElementById("foodDropLayer");
  if (!overlay || !layer) return;

  const HOLD_MS = 360;
  const MOVE_TOLERANCE = 8;
  const MAGNET_RADIUS = 54;

  let pressTimer = null;
  let pressStart = null;
  let active = false;
  let activePointerId = null;
  let pointerX = 0;
  let pointerY = 0;
  let magnetDrops = [];
  let moveFrame = 0;
  let suppressClickUntil = 0;

  function getDrops() {
    return Array.from(layer.querySelectorAll(".food-drop-emoji:not(.is-eaten)"));
  }

  function isInteractiveTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest(".food-drop-emoji")) return false;
    return Boolean(
      target.closest(
        "button, input, textarea, select, a, .food-record-actions, .close-btn"
      )
    );
  }

  function clearPressTimer() {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function cancelPress() {
    clearPressTimer();
    pressStart = null;
    activePointerId = null;
  }

  function updateAttraction() {
    moveFrame = 0;
    if (!active) return;
    for (const item of magnetDrops) {
      const tx =
        pointerX + item.offsetX - (item.left + item.width / 2);
      const ty =
        pointerY + item.offsetY - (item.top + item.height / 2);
      item.drop.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${
        item.rotation
      }deg)`;
    }
  }

  function activate(x, y) {
    pressTimer = null;
    const drops = getDrops();
    if (!drops.length) return;
    active = true;
    pointerX = x;
    pointerY = y;
    document.body.classList.add("food-magnet-active");

    magnetDrops = drops.map((drop, index) => {
      const rect = drop.getBoundingClientRect();
      drop.getAnimations().forEach((animation) => animation.cancel());
      drop.style.animation = "none";
      drop.style.opacity = "1";
      drop.style.transition = "none";
      drop.style.left = `${rect.left}px`;
      drop.style.top = `${rect.top}px`;
      drop.style.bottom = "auto";
      drop.style.transform = "none";
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * MAGNET_RADIUS;
      return {
        drop,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        offsetX: Math.cos(angle) * distance,
        offsetY: Math.sin(angle) * distance,
        rotation: Math.round(Math.random() * 360),
      };
    });

    requestAnimationFrame(() => {
      for (const item of magnetDrops) {
        item.drop.style.transition = "transform 0.16s ease-out";
      }
      updateAttraction();
    });
  }

  function flyUpThenDrop(drop) {
    if (!drop || !drop.isConnected) return;
    const rect = drop.getBoundingClientRect();
    const height = drop.offsetHeight || rect.height;
    const width = drop.offsetWidth || rect.width;
    const riseTarget = -height - 40 - Math.random() * 80;

    drop.style.transition = "none";
    drop.style.left = `${rect.left}px`;
    drop.style.top = `${rect.top}px`;
    drop.style.bottom = "auto";
    drop.style.transform = "none";
    void drop.offsetWidth;

    drop.style.transition =
      "top 0.42s ease-out, left 0.42s ease-out, transform 0.42s ease-out";
    drop.style.top = `${riseTarget}px`;
    drop.style.left = `${rect.left + Math.random() * 70 - 35}px`;
    drop.style.transform = `rotate(${Math.random() * 80 - 40}deg)`;

    setTimeout(() => {
      if (!drop.isConnected) return;
      const maxLeft = Math.max(4, window.innerWidth - width - 4);
      const randomLeft = 4 + Math.random() * Math.max(0, maxLeft - 4);
      const bottom = Math.max(2, window.innerHeight - height - 2);
      drop.style.transition = "none";
      drop.style.top = `${riseTarget}px`;
      drop.style.left = `${randomLeft}px`;
      drop.style.transform = "none";
      void drop.offsetWidth;

      drop.style.transition = `top ${0.65 + Math.random() * 0.25}s cubic-bezier(0.35, 0, 0.8, 0.5)`;
      drop.style.top = `${bottom}px`;
      setTimeout(() => {
        if (drop.isConnected) drop.style.transition = "";
      }, 1000);
    }, 420);
  }

  function releaseMagnet() {
    clearPressTimer();
    if (!active) {
      pressStart = null;
      activePointerId = null;
      return;
    }
    active = false;
    document.body.classList.remove("food-magnet-active");
    if (moveFrame) {
      cancelAnimationFrame(moveFrame);
      moveFrame = 0;
    }

    const items = magnetDrops;
    magnetDrops = [];
    for (const item of items) flyUpThenDrop(item.drop);

    suppressClickUntil = performance.now() + 700;
    pressStart = null;
    activePointerId = null;
  }

  function onPointerDown(event) {
    if (overlay.hidden || !getDrops().length) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;
    if (active) return;

    cancelPress();
    pressStart = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    activePointerId = event.pointerId;
    pressTimer = setTimeout(() => {
      activate(pressStart.x, pressStart.y);
    }, HOLD_MS);
  }

  function onPointerMove(event) {
    if (active) {
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!moveFrame) moveFrame = requestAnimationFrame(updateAttraction);
      return;
    }
    if (!pressStart) return;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    if (
      Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) >
      MOVE_TOLERANCE
    ) {
      cancelPress();
    }
  }

  function onPointerUp(event) {
    if (active) {
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      releaseMagnet();
      return;
    }
    if (pressStart) cancelPress();
  }

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointercancel", onPointerUp, true);
  window.addEventListener("blur", releaseMagnet);

  document.addEventListener(
    "click",
    (event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  overlay.addEventListener(
    "contextmenu",
    (event) => {
      if (active || pressTimer !== null) event.preventDefault();
    },
    true
  );
})();
