# CyberOS

A personal, web-based operating system built for the Hack Club [webOS](https://jams.hackclub.com/batch/webOS) jam — cybersecurity-themed, vanilla HTML/CSS/JS, no build step, no frameworks.

**Live demo:** https://voidrubik.github.io/CyberOS/

## Desktop

- **Boot sequence** with a looping scramble-reveal ("decrypting") title animation, then a WELCOME, OPERATOR access screen.
- **Animated WebGL background** — a full-screen shader terminal effect running behind everything.
- **Floating node graph** — every app is a drifting bubble on the desktop, linked to related apps by faint lines. Click a bubble to open it.
- **Popup radial menu** — left-click any empty spot on the desktop to spawn a launcher ring at the cursor (clamped so it never renders off-screen). Shows all 5 apps.
- **Global search** (top bar, `Ctrl`/`Cmd`-K) — type an app name, hit Enter to launch.
- **Window manager** — drag by the header, close, minimize, maximize, and a taskbar to restore minimized windows.
- **Secure ID** — a webcam-driven "access card" welcome popup, with a graceful fallback (no crash, just no video) when no camera is available.

## Apps (5)

**Cryptography Lab** — four tabs:
- *Ciphers*: Caesar, Vigenère, Base64, XOR — encrypt or decrypt any text.
- *RSA*: a small-integer RSA visualization (BigInt, real primality/coprimality/modular-inverse math) — generates a keypair and walks through encrypting/decrypting a number step by step. Teaching demo, not production crypto.
- *Brute Force*: brute-forces Caesar ciphertext (all 26 shifts) and single-byte-XOR ciphertext (all 256 keys), highlighting the most English-like result.
- *Key Generator*: generates an RSA keypair or a random 128-bit symmetric key.

**Terminal** — a real command shell:
```
help            show this manual
ls | apps       list installed apps
open <app>      open an app window (e.g. open cryptolab)
close <app>     close an app window
clear           clear this screen
echo <text>     print text back
date            show current date/time
whoami          show the current operator
```

**Dashboard** — real browser-reported metrics (CPU core count, device memory, JS heap, live FPS) badged **real**, next to simulated CPU/RAM/GPU gauges badged **simulated** — a browser genuinely can't read real system telemetry, so nothing here pretends otherwise.

**Cyber Explorer** — a spinning WebGL globe of 12 curated cybersecurity resources (OWASP, CVE Database, NIST NVD, MITRE ATT&CK, HackTheBox, TryHackMe, Have I Been Pwned, Shodan, VirusTotal, CyberChef, Krebs on Security, Exploit-DB) — drag to spin, release on a tile to open its info card.

**Calculator** — a standard four-function calculator.

## Credits

- **[React Bits](https://reactbits.dev/)** and **[21st.dev](https://21st.dev/)** — inspiration for the background shader, the Cyber Explorer sphere menu, and the Secure ID access card. Everything here is a from-scratch **vanilla JavaScript** rebuild (no React, no framework in this project) — the background and explorer menu took the original designs as inspiration and were reworked; the Secure ID card followed its source design most closely, unmodified in concept.

## AI usage

Built with [Claude Code](https://claude.com/claude-code) (Anthropic) as a coding assistant. Breakdown of roles:

- **Bruno (human):** overall architecture and product direction — what CyberOS is, the app roster, the desktop concept, feature scope and cuts; reviewed and manually edited AI-written code throughout; made every structural/design call.
- **Claude:** implementation of features from that direction — writing and debugging code, porting the React Bits/21st.dev designs to vanilla JS, root-causing bugs, running an adversarial self-review pass before larger changes, and verifying features by driving the app in a real browser.

## Tech

Zero build tooling. Icons are drawn as Canvas2D vector paths; the popup menu and background shader are vanilla ports of React-based designs. The only external dependencies are two CDN scripts (`gl-matrix`, `ogl`) used by the WebGL views.

To run locally, serve the folder over HTTP (module imports and the webcam feature need `http(s)://`, not `file://`):

```bash
python -m http.server 8080
```

then open `http://localhost:8080/`.
