/* ===== Dashboard — REAL browser-reported metrics + clearly-badged SIMULATED telemetry =====
 * Real values (feature-detected, never fabricated): navigator.hardwareConcurrency,
 * navigator.deviceMemory, performance.memory (JS heap), rAF-derived FPS. Real per-core CPU%,
 * real RAM%, and GPU/"TPU" usage are NOT available to a browser — those gauges are animated
 * simulations, always badged "simulated". Mirrors the graceful-degrade pattern already used for
 * the webcam (reflective.js) and WebGL2 (explorer.js) in this codebase. */

function addMetricRow(container, label, value, isReal) {
  const row = document.createElement("div");
  row.className = "row";
  row.style.justifyContent = "space-between";
  const l = document.createElement("span");
  l.textContent = label;
  const v = document.createElement("span");
  v.appendChild(document.createTextNode(value + " "));
  const badge = document.createElement("span");
  badge.className = isReal ? "badge-real" : "badge-sim";
  badge.textContent = isReal ? "real" : "unavailable";
  v.appendChild(badge);
  row.append(l, v);
  container.appendChild(row);
  return v.firstChild; // the text node, for live updates (e.g. FPS)
}

function startFPSMeter(textNode) {
  let last = performance.now();
  let frames = 0;
  function tick(t) {
    frames++;
    if (t - last >= 1000) {
      const fps = Math.round((frames * 1000) / (t - last));
      textNode.textContent = fps + " fps ";
      frames = 0;
      last = t;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderRealMetrics(container) {
  const heading = document.createElement("h3");
  heading.style.cssText = "margin:0 0 4px;font-size:0.8rem;color:var(--text-dim);";
  heading.textContent = "Real (browser-reported)";
  container.appendChild(heading);

  const hasCores = typeof navigator.hardwareConcurrency === "number";
  addMetricRow(container, "CPU cores", hasCores ? String(navigator.hardwareConcurrency) : "unavailable", hasCores);

  const hasDeviceMemory = typeof navigator.deviceMemory === "number";
  addMetricRow(
    container,
    "Device memory",
    hasDeviceMemory ? `${navigator.deviceMemory} GB (approx)` : "unavailable in this browser",
    hasDeviceMemory
  );

  const hasHeap = !!performance.memory;
  if (hasHeap) {
    const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
    const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0);
    addMetricRow(container, "JS heap", `${used} / ${limit} MB`, true);
  } else {
    addMetricRow(container, "JS heap", "unavailable in this browser", false);
  }

  const fpsNode = addMetricRow(container, "Frame rate", "measuring…", true);
  startFPSMeter(fpsNode);
}

function startSimGauges(container) {
  container.innerHTML = `
    <h3 style="margin:12px 0 6px;font-size:0.8rem;color:var(--text-dim);">
      Simulated telemetry <span class="badge-sim">simulated</span>
    </h3>
    <div class="meter"><div class="meter-label"><span>CPU</span><span id="gaugeCpuVal"></span></div>
      <div class="meter-track"><div class="meter-fill" id="gaugeCpu"></div></div></div>
    <div class="meter"><div class="meter-label"><span>RAM</span><span id="gaugeRamVal"></span></div>
      <div class="meter-track"><div class="meter-fill" id="gaugeRam"></div></div></div>
    <div class="meter"><div class="meter-label"><span>GPU / TPU</span><span id="gaugeGpuVal"></span></div>
      <div class="meter-track"><div class="meter-fill" id="gaugeGpu"></div></div></div>
  `;
  const cpuFill = container.querySelector("#gaugeCpu"), cpuVal = container.querySelector("#gaugeCpuVal");
  const ramFill = container.querySelector("#gaugeRam"), ramVal = container.querySelector("#gaugeRamVal");
  const gpuFill = container.querySelector("#gaugeGpu"), gpuVal = container.querySelector("#gaugeGpuVal");

  function clamp(n) { return Math.min(100, Math.max(0, Math.round(n))); }

  function tick(t) {
    const cpu = clamp(40 + 30 * Math.sin(t * 0.0006) + 10 * Math.random());
    const ram = clamp(50 + 15 * Math.sin(t * 0.0003 + 1) + 5 * Math.random());
    const gpu = clamp(20 + 25 * Math.sin(t * 0.0004 + 2) + 8 * Math.random());
    cpuFill.style.width = cpu + "%";
    ramFill.style.width = ram + "%";
    gpuFill.style.width = gpu + "%";
    cpuVal.textContent = cpu + "%";
    ramVal.textContent = ram + "%";
    gpuVal.textContent = gpu + "%";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initDashboard() {
  const body = document.getElementById("dashboardbody");
  body.innerHTML = `
    <div id="dashReal"></div>
    <div id="dashSimGauges"></div>
  `;
  renderRealMetrics(body.querySelector("#dashReal"));
  startSimGauges(body.querySelector("#dashSimGauges"));
}

initDashboard();
