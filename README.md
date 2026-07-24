# CyberOS

A personal, web-based operating system built for the Hack Club [webOS](https://jams.hackclub.com/batch/webOS) jam — cybersecurity-themed, vanilla HTML/CSS/JS, no build step, no frameworks.

**Live demo:** https://voidrubik.github.io/CyberOS/

## Desktop

- **Boot sequence** with a looping scramble-reveal ("decrypting") title animation.
- **FaultyTerminal** animated WebGL background (ported from React Bits, no React added).
- **Floating node graph** — every app is a drifting bubble on the desktop, linked to related apps by faint lines. Click a bubble to open it.
- **Popup radial menu** — left-click any empty spot on the desktop to spawn a launcher ring at the cursor (edge-clamped so it never renders off-screen).
- **Global search** (top bar, `Ctrl`/`Cmd`-K) to find and launch apps by name.
- **Window manager** — drag, close, minimize, maximize, and a taskbar to restore minimized windows.
- **Secure ID** — a webcam-driven "access card" welcome popup (ported from React Bits' ReflectiveCard), with a graceful fallback when no camera is available.

## Apps

- **Cryptography Lab** — Caesar / Vigenère / Base64 / XOR ciphers, a small-integer RSA teaching visualization (BigInt, fully validated — not production crypto), Caesar and single-byte-XOR brute forcing, and an RSA/symmetric key generator.
- **Terminal** — a real command shell (`help`, `ls`/`apps`, `open <app>`, `close <app>`, `clear`, `echo`, `date`, `whoami`) that can open and close every other app.
- **Dashboard** — real browser-reported metrics (CPU core count, device memory, JS heap, live FPS) clearly badged "real", next to simulated CPU/RAM/GPU gauges clearly badged "simulated" — a browser genuinely can't read real system telemetry, so nothing here pretends otherwise.
- **Cyber Explorer** — a WebGL globe of curated cybersecurity resources (OWASP, MITRE ATT&CK, HackTheBox, CyberChef, and more), spin to browse.
- **Calculator** — a standard four-function calculator.

## Tech

Zero build tooling. Every "component" is hand-ported to plain JavaScript — icons are drawn as Canvas2D vector paths, the popup menu and background shader are vanilla ports of React Bits components, and the only external dependencies are two CDN scripts (`gl-matrix`, `ogl`) used by the WebGL views.

To run locally, serve the folder over HTTP (module imports and the webcam feature need `http(s)://`, not `file://`):

```bash
python -m http.server 8080
```

then open `http://localhost:8080/`.
