/* ===== Secure ID welcome card — vanilla-JS port of React Bits ReflectiveCard =====
 * SVG filter graph (feTurbulence/feDisplacementMap/feSpecularLighting/...) and CSS
 * layers below are the source component's design, unchanged; only the React wrapper
 * (props/refs/useEffect) was stripped for plain DOM + getUserMedia wiring. */

let welcomeStream = null;

function buildReflectiveCard(container) {
  container.innerHTML = `
    <div class="reflective-card-container">
      <svg class="reflective-svg-filters" aria-hidden="true">
        <defs>
          <filter id="metallic-displacement" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" result="rippled" />
            <feSpecularLighting in="noiseAlpha" surfaceScale="25" specularConstant="2.0" specularExponent="20" lightingColor="#ffffff" result="light">
              <fePointLight x="0" y="0" z="300" />
            </feSpecularLighting>
            <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
            <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="solidAlpha" />
            <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
            <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
            <feComponentTransfer in="blurredMap" result="glassMap">
              <feFuncA type="linear" slope="0.5" intercept="0" />
            </feComponentTransfer>
            <feDisplacementMap in="metallic-result" in2="glassMap" scale="15" xChannelSelector="A" yChannelSelector="A" result="final" />
          </filter>
        </defs>
      </svg>

      <video autoplay playsinline muted class="reflective-video"></video>

      <div class="reflective-noise"></div>
      <div class="reflective-sheen"></div>
      <div class="reflective-border"></div>

      <div class="reflective-content">
        <div class="card-header">
          <div class="security-badge">
            <svg class="security-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>SECURE ACCESS</span>
          </div>
          <svg class="status-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>

        <div class="card-body">
          <div class="user-info">
            <h2 class="user-name">WELCOME, OPERATOR</h2>
            <p class="user-role">CYBEROS ACCESS GRANTED</p>
          </div>
        </div>

        <div class="card-footer">
          <div class="id-section">
            <span class="label">SESSION ID</span>
            <span class="value">${sessionIdValue()}</span>
          </div>
          <div class="fingerprint-section">
            <svg class="fingerprint-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 12a10 10 0 0 0 5.5 8.94"/><path d="M8 21a10 10 0 0 0 8.7-4.2"/><path d="M12 12a4 4 0 0 1 8 0c0 1.5-.5 2.5-.6 4"/><path d="M12 8a4 4 0 0 0-4 4c0 1.5.4 2 .5 3.5"/></svg>
          </div>
        </div>
      </div>
    </div>
  `;

  startWelcomeCam(container.querySelector(".reflective-video"));
}

function sessionIdValue() {
  const rnd = () => Math.floor(1000 + Math.random() * 9000);
  return `${rnd()}-${rnd()}-${rnd()}`;
}

async function startWelcomeCam(videoEl) {
  try {
    welcomeStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
    });
    videoEl.srcObject = welcomeStream;
  } catch (err) {
    // ponytail: no camera / permission denied / file:// — card still renders, just without the feed
    videoEl.remove();
    console.warn("Secure ID: webcam unavailable —", err.message);
  }
}

function stopWelcomeCam() {
  if (welcomeStream) {
    welcomeStream.getTracks().forEach((t) => t.stop());
    welcomeStream = null;
  }
}
window.stopWelcomeCam = stopWelcomeCam;
// built lazily by script.js's openWindow("welcome") — not at page load — so the
// camera permission prompt only appears once boot finishes and the card is shown.
window.rebuildWelcomeCard = () => buildReflectiveCard(document.getElementById("welcomebody"));
