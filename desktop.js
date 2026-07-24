/* ===== CyberOS desktop shell — app manifest, floating node graph, CircleMenu, global search =====
 * Single source of truth for the launcher surfaces (graph nodes, CircleMenu ring, search, taskbar
 * labels via script.js). Each app window still self-initializes at the bottom of its own file
 * (same convention apps.js already used for Calculator) — the manifest only carries launcher
 * metadata (id/name/links), not init callbacks, so file load order never matters here.
 *
 * Icons are drawn as canvas vector paths (drawIcon, keyed by app.id) rather than emoji/SVG-image —
 * synchronous, no load race, no DPR/theme-cache mismatch (dropped an earlier SVG->Image design
 * after an adversarial review flagged exactly those failure modes). */

const APPS = [
  { id: "cryptolab", name: "Cryptography Lab", links: ["terminal"] },
  { id: "terminal", name: "Terminal", links: ["dashboard"] },
  { id: "dashboard", name: "Dashboard", links: ["explorer"] },
  { id: "explorer", name: "Cyber Explorer", links: ["calc"] },
  { id: "calc", name: "Calculator", links: ["cryptolab"] }
];
window.APPS = APPS;

const ACCENT_COLOR = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#4dfff0";

/* ---- vector-path app icons, one function per app id, stroked in the live theme accent ---- */
function drawIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = ACCENT_COLOR;
  ctx.fillStyle = ACCENT_COLOR;
  ctx.lineWidth = Math.max(1.2, r * 0.09);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (id === "terminal") {
    const s = r * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s * 0.7);
    ctx.lineTo(cx - s * 0.15, cy);
    ctx.lineTo(cx - s, cy + s * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.lineTo(cx + s * 0.8, cy + s * 0.9);
    ctx.stroke();
  } else if (id === "explorer") {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.22, r * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy);
    ctx.lineTo(cx + r * 0.55, cy);
    ctx.stroke();
  } else if (id === "calc") {
    const s = r * 0.22;
    const gap = r * 0.28;
    [cy - gap, cy, cy + gap].forEach((ry) => {
      [cx - gap, cx + gap].forEach((rx) => ctx.fillRect(rx - s / 2, ry - s / 2, s, s));
    });
  } else if (id === "dashboard") {
    const arcCy = cy + r * 0.1;
    ctx.beginPath();
    ctx.arc(cx, arcCy, r * 0.55, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();
    const angle = Math.PI * 1.35;
    ctx.beginPath();
    ctx.moveTo(cx, arcCy);
    ctx.lineTo(cx + Math.cos(angle) * r * 0.4, arcCy + Math.sin(angle) * r * 0.4);
    ctx.stroke();
  } else if (id === "cryptolab") {
    const w = r * 0.55, h = r * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + w, cy - h * 0.5);
    ctx.lineTo(cx + w, cy + h * 0.15);
    ctx.quadraticCurveTo(cx + w, cy + h, cx, cy + h);
    ctx.quadraticCurveTo(cx - w, cy + h, cx - w, cy + h * 0.15);
    ctx.lineTo(cx - w, cy - h * 0.5);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeRect(cx - r * 0.18, cy - r * 0.05, r * 0.36, r * 0.28);
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.05, r * 0.16, Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---- CircleMenu state — top-level (not nested) so the graph's click handler can open/close it ---- */
const RING_RADIUS = 90;
let menuOpen = false;
let menuRing = null;
let menuRoot = null;

function layoutMenuRing() {
  const n = APPS.length;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  [...menuRing.children].forEach((btn, i) => {
    const theta = (2 * Math.PI * i) / n - Math.PI / 2;
    const x = menuOpen ? RING_RADIUS * Math.cos(theta) : 0;
    const y = menuOpen ? RING_RADIUS * Math.sin(theta) : 0;
    btn.style.transitionDelay = reduceMotion ? "0s" : `${i * 0.02}s`;
    btn.style.transform = `translate(${x}px, ${y}px) scale(${menuOpen ? 1 : 0.4})`;
    btn.style.opacity = menuOpen ? "1" : "0";
    btn.tabIndex = menuOpen ? 0 : -1;
  });
}

function closeMenu() {
  menuOpen = false;
  menuRoot.classList.remove("open");
  layoutMenuRing();
}

// clamped so the ring can never render past a screen edge/corner (adversarial review finding)
function openMenuAt(x, y) {
  const margin = RING_RADIUS + 30;
  const topbarHeight = 40;
  const cx = Math.min(window.innerWidth - margin, Math.max(margin, x));
  const cy = Math.min(window.innerHeight - margin, Math.max(topbarHeight + margin, y));
  menuRoot.style.left = cx + "px";
  menuRoot.style.top = cy + "px";
  menuOpen = true;
  menuRoot.classList.add("open");
  layoutMenuRing();
}

/* ---- floating node graph (ambient desktop — click a node to open its app, empty space opens the menu) ---- */
function initGraph() {
  const canvas = document.getElementById("graphCanvas");
  const ctx = canvas.getContext("2d");
  const RADIUS = 34;
  let hoverIndex = -1;

  const nodes = APPS.map((app) => ({
    app,
    x: 0.15 + Math.random() * 0.7,
    y: 0.2 + Math.random() * 0.6,
    vx: (Math.random() - 0.5) * 0.00012,
    vy: (Math.random() - 0.5) * 0.00012,
    phase: Math.random() * Math.PI * 2
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function screenPos(n) {
    return { x: n.x * canvas.clientWidth, y: n.y * canvas.clientHeight };
  }

  function step(t) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    nodes.forEach((n) => {
      n.x += n.vx + Math.sin(t * 0.00015 + n.phase) * 0.00004;
      n.y += n.vy + Math.cos(t * 0.00012 + n.phase) * 0.00004;
      if (n.x < 0.06 || n.x > 0.94) n.vx *= -1;
      if (n.y < 0.1 || n.y > 0.88) n.vy *= -1;
      n.x = Math.min(0.94, Math.max(0.06, n.x));
      n.y = Math.min(0.88, Math.max(0.1, n.y));
    });

    ctx.strokeStyle = "rgba(77,255,240,0.15)";
    ctx.lineWidth = 1;
    nodes.forEach((n) => {
      n.app.links.forEach((linkId) => {
        const target = nodes.find((o) => o.app.id === linkId);
        if (!target) return;
        const a = screenPos(n), b = screenPos(target);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    });

    nodes.forEach((n, i) => {
      const p = screenPos(n);
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = i === hoverIndex ? "rgba(77,255,240,0.2)" : "rgba(18,26,36,0.6)";
      ctx.fill();
      ctx.strokeStyle = "rgba(77,255,240,0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawIcon(ctx, n.app.id, p.x, p.y, RADIUS);
      if (i === hoverIndex) {
        ctx.font = "11px Consolas, monospace";
        ctx.fillStyle = "#dff9f6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.app.name, p.x, p.y + RADIUS + 14);
      }
    });

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  function nodeAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    return nodes.findIndex((n) => {
      const p = screenPos(n);
      return Math.hypot(p.x - x, p.y - y) <= RADIUS;
    });
  }

  canvas.addEventListener("pointermove", (e) => {
    hoverIndex = nodeAt(e.clientX, e.clientY);
    canvas.style.cursor = hoverIndex >= 0 ? "pointer" : "default";
  });
  canvas.addEventListener("pointerleave", () => { hoverIndex = -1; });
  canvas.addEventListener("click", (e) => {
    const i = nodeAt(e.clientX, e.clientY);
    if (i >= 0) {
      if (menuOpen) closeMenu();
      openWindow(nodes[i].app.id);
      return;
    }
    if (menuOpen) closeMenu();
    else openMenuAt(e.clientX, e.clientY);
  });
}

/* ---- CircleMenu — vanilla port of the React Bits CircleMenu (framer-motion → CSS transitions) =====
 * No persistent trigger button (removed per Bruno's request pre-publish) — opened by left-clicking
 * empty desktop (wired in initGraph above); the topbar search bar remains the always-visible,
 * discoverable way to launch an app regardless of this menu. ---- */
function initCircleMenu() {
  menuRoot = document.getElementById("circleMenu");
  menuRing = document.createElement("div");
  menuRing.id = "circleMenuRing";
  menuRing.setAttribute("role", "menu");
  menuRoot.appendChild(menuRing);

  APPS.forEach((app) => {
    const btn = document.createElement("button");
    btn.className = "circle-menu-item";
    btn.setAttribute("role", "menuitem");
    btn.tabIndex = -1;
    btn.title = app.name;
    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = 32;
    iconCanvas.height = 32;
    drawIcon(iconCanvas.getContext("2d"), app.id, 16, 16, 14);
    btn.appendChild(iconCanvas);
    btn.addEventListener("click", () => {
      openWindow(app.id);
      closeMenu();
    });
    menuRing.appendChild(btn);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) closeMenu();
  });
  window.addEventListener("resize", layoutMenuRing);
  layoutMenuRing();
}

/* ---- global search — scoped to the app manifest only; Explorer keeps its own resource filter ---- */
function initSearch() {
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");

  function matchesFor(query) {
    const q = query.trim().toLowerCase();
    return q ? APPS.filter((a) => a.name.toLowerCase().includes(q)) : [];
  }

  function render(query) {
    const matches = matchesFor(query);
    results.innerHTML = "";
    matches.forEach((app) => {
      const item = document.createElement("div");
      item.className = "search-result";
      item.textContent = app.name;
      item.addEventListener("click", () => {
        openWindow(app.id);
        input.value = "";
        render("");
        input.blur();
      });
      results.appendChild(item);
    });
    results.classList.toggle("visible", matches.length > 0);
  }

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const hit = matchesFor(input.value)[0];
      if (hit) {
        openWindow(hit.id);
        input.value = "";
        render("");
        input.blur();
      }
    } else if (e.key === "Escape") {
      input.value = "";
      render("");
      input.blur();
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

function initDesktopShell() {
  initGraph();
  initCircleMenu();
  initSearch();
}
window.initDesktopShell = initDesktopShell;
