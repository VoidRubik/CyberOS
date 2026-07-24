/* ===== CyberOS core engine ===== */

/* ---- scramble-reveal text effect (ported from React Bits DecryptedText, no React/motion needed) ---- */
const DECRYPT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

function stopDecrypt(el) {
  if (el._decryptTimers) {
    el._decryptTimers.forEach(clearInterval);
    el._decryptTimers.forEach(clearTimeout);
    el._decryptTimers = null;
  }
}

function decryptText(el, text, { speed = 70, revealDirection = "start", loop = false, holdMs = 1500 } = {}) {
  stopDecrypt(el); // never stack a second run on the same element
  el._decryptTimers = [];
  el.innerHTML = "";
  const spans = [...text].map((ch) => {
    const span = document.createElement("span");
    span.className = "decrypt-char encrypted";
    span.textContent = ch === " " ? " " : DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
    el.appendChild(span);
    return span;
  });

  const order = computeRevealOrder(text.length, revealDirection);
  let step = 0;

  const timer = setInterval(() => {
    if (step >= order.length) {
      clearInterval(timer);
      if (loop) {
        const holdTimer = setTimeout(() => decryptText(el, text, { speed, revealDirection, loop, holdMs }), holdMs);
        el._decryptTimers.push(holdTimer);
      }
      return;
    }
    const idx = order[step];
    const ch = text[idx];
    spans[idx].textContent = ch;
    spans[idx].className = "decrypt-char revealed";
    // keep unrevealed chars scrambling for a "decrypting" feel
    spans.forEach((s, i) => {
      if (!order.slice(0, step + 1).includes(i) && text[i] !== " ") {
        s.textContent = DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
      }
    });
    step++;
  }, speed);
  el._decryptTimers.push(timer);
}

function computeRevealOrder(len, direction) {
  const order = [];
  if (direction === "end") {
    for (let i = len - 1; i >= 0; i--) order.push(i);
  } else if (direction === "center") {
    const mid = Math.floor(len / 2);
    let offset = 0;
    while (order.length < len) {
      const idx = offset % 2 === 0 ? mid + offset / 2 : mid - Math.ceil(offset / 2);
      if (idx >= 0 && idx < len) order.push(idx);
      offset++;
    }
  } else {
    for (let i = 0; i < len; i++) order.push(i);
  }
  return order;
}

/* ---- boot sequence ---- */
function runBootSequence(steps, onDone) {
  const boot = document.getElementById("boot");
  const log = document.getElementById("bootLog");
  decryptText(document.getElementById("bootTitle"), "CyberOS", { speed: 60, loop: true });

  let i = 0;
  const next = () => {
    if (i >= steps.length) {
      boot.classList.add("hidden");
      setTimeout(onDone, 600);
      return;
    }
    log.textContent = steps[i];
    i++;
    setTimeout(next, 500);
  };
  setTimeout(next, 600);
}

/* ---- window engine ---- */
let zTop = 20;
const desktop = document.getElementById("desktop");
const taskbar = document.getElementById("taskbar");

function bringToFront(el) {
  zTop += 1;
  el.style.zIndex = zTop;
}

function openWindow(id) {
  const el = document.getElementById(id);
  el.classList.remove("minimized");
  el.classList.add("open");
  bringToFront(el);
  removeTaskChip(id);

  const titleEl = el.querySelector(".windowtitle");
  if (titleEl) decryptText(titleEl, titleEl.dataset.title || titleEl.textContent, { speed: 45, loop: true });

  // restart the webcam feed each time Secure ID reopens (closeWindow stops the prior stream)
  if (id === "welcome" && window.rebuildWelcomeCard) window.rebuildWelcomeCard();

  // ponytail: canvas has zero size while display:none, so the WebGL menu's
  // projection matrix is garbage until we force a resize on first real reveal.
  if (id === "explorer" && window.explorerMenu) {
    requestAnimationFrame(() => window.explorerMenu.resize());
  }
}

function closeWindow(id) {
  const el = document.getElementById(id);
  el.classList.remove("open", "minimized", "maximized");
  const titleEl = el.querySelector(".windowtitle");
  if (titleEl) stopDecrypt(titleEl);
  removeTaskChip(id);
  if (id === "welcome" && window.stopWelcomeCam) window.stopWelcomeCam();
}

function minimizeWindow(id) {
  const el = document.getElementById(id);
  el.classList.add("minimized");
  addTaskChip(id);
}

function toggleMaximize(id) {
  const el = document.getElementById(id);
  if (el.classList.contains("maximized")) {
    el.classList.remove("maximized");
    el.style.left = el.dataset.restoreLeft || "";
    el.style.top = el.dataset.restoreTop || "";
    el.style.transform = el.dataset.restoreTransform || "";
  } else {
    el.dataset.restoreLeft = el.style.left || "";
    el.dataset.restoreTop = el.style.top || "";
    el.dataset.restoreTransform = el.style.transform || "";
    el.classList.add("maximized");
  }
  bringToFront(el);
}

function addTaskChip(id) {
  if (taskbar.querySelector(`[data-task="${id}"]`)) return;
  const win = document.getElementById(id);
  const label = win.querySelector(".windowtitle").dataset.title || win.querySelector(".windowtitle").textContent;
  const chip = document.createElement("button");
  chip.className = "task-chip";
  chip.dataset.task = id;
  chip.textContent = label;
  chip.addEventListener("click", () => openWindow(id));
  taskbar.appendChild(chip);
}

function removeTaskChip(id) {
  const chip = taskbar.querySelector(`[data-task="${id}"]`);
  if (chip) chip.remove();
}

// ponytail: pointer-capture single-active-drag model (adversarial review finding #3) —
// avoids the classic document-level onmousemove clobber/stuck-drag bug.
function dragElement(win) {
  const header = document.getElementById(win.id + "header");
  if (!header) return;

  header.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return; // let close/min/max receive their click
    if (win.classList.contains("maximized")) return; // don't drag a maximized window

    bringToFront(win);

    if (!win.dataset.positioned) {
      const rect = win.getBoundingClientRect();
      const parentRect = desktop.getBoundingClientRect();
      win.style.left = rect.left - parentRect.left + "px";
      win.style.top = rect.top - parentRect.top + "px";
      win.style.transform = "none";
      win.dataset.positioned = "1";
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseFloat(win.style.left);
    const startTop = parseFloat(win.style.top);

    header.setPointerCapture(e.pointerId);

    const move = (ev) => {
      win.style.left = startLeft + (ev.clientX - startX) + "px";
      win.style.top = startTop + (ev.clientY - startY) + "px";
    };
    const up = (ev) => {
      header.releasePointerCapture(ev.pointerId);
      header.removeEventListener("pointermove", move);
      header.removeEventListener("pointerup", up);
    };
    header.addEventListener("pointermove", move);
    header.addEventListener("pointerup", up);
  });
}

function initializeWindow(id) {
  const icon = document.getElementById(id + "icon");
  const win = document.getElementById(id);
  const closeBtn = win.querySelector(".closebutton");
  const minBtn = win.querySelector(".minbutton");
  const maxBtn = win.querySelector(".maxbutton");
  const titleEl = win.querySelector(".windowtitle");
  if (titleEl) titleEl.dataset.title = titleEl.textContent;

  if (icon) icon.addEventListener("click", () => openWindow(id));
  closeBtn.addEventListener("click", () => closeWindow(id));
  minBtn.addEventListener("click", () => minimizeWindow(id));
  maxBtn.addEventListener("click", () => toggleMaximize(id));
  win.addEventListener("pointerdown", () => bringToFront(win));
  dragElement(win);
}

/* ---- clock (Part 2 spec) ---- */
function startClock() {
  const timeEl = document.getElementById("timeElement");
  const update = () => { timeEl.textContent = new Date().toLocaleString(); };
  update();
  setInterval(update, 1000);
}

/* ---- boot ---- */
runBootSequence(
  [
    "initializing kernel...",
    "mounting filesystem...",
    "loading cyber toolkit...",
    "welcome, operator."
  ],
  () => {
    startClock();
    decryptText(document.getElementById("osName"), "CyberOS", { speed: 55, loop: true });
    // manifest-driven roster (window.APPS, defined in desktop.js) + the one special-cased
    // system window (Secure ID) that sits outside the 7-app roster
    (window.APPS || []).map((app) => app.id).concat(["welcome"]).forEach(initializeWindow);
    document.getElementById("welcomeReopen").addEventListener("click", () => openWindow("welcome"));
    if (window.initExplorer) window.initExplorer();
    if (window.initDesktopShell) window.initDesktopShell();
    openWindow("welcome");
  }
);
