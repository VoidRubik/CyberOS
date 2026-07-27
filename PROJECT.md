# CyberOS — Project Card

**What:** A personal, web-based "operating system" built for the Hack Club [webOS](https://jams.hackclub.com/batch/webOS) jam — cybersecurity-themed. Vanilla HTML/CSS/JS, **no build step, no frameworks, no dependencies**.

**Status:** v3 — feature-complete for the jam, 5-app roster, verified live in a real browser. **Live:** https://voidrubik.github.io/CyberOS/

**Grade:** Built. Shipped and publicly demoable.

## Stack

Vanilla everything. No React, no Tailwind, no TypeScript, no bundler — a deliberate constraint held across the whole build, including five separate ports of React-based components down to plain JS + CSS transitions.

## Desktop

- **Boot sequence** — looping scramble-reveal "decrypting" title animation → `WELCOME, OPERATOR` access screen.
- **Animated WebGL background** — full-screen shader terminal effect behind everything.
- **Floating node graph** — each app is a drifting bubble linked to related apps; click to open.
- **Popup radial menu** — left-click any empty desktop spot spawns a launcher ring at the cursor, edge-clamped so it can never render off-screen. A second click closes it.
- **Global search** — top bar, `Ctrl`/`Cmd`-K, type an app name and hit Enter.
- **Window manager** — drag by header, close/minimize/maximize, taskbar restore.
- **Secure ID** — webcam-driven "access card" welcome popup with a graceful no-camera fallback.
- **Hand-drawn canvas vector icons** — no emoji glyphs anywhere (terminal `>_`, globe, keypad, gauge, shield+lock).

## Apps (5)

- **Cryptography Lab** — 4 tabs: *Ciphers* (Caesar, Vigenère, Base64, XOR) · *RSA* (small-integer BigInt visualization with real primality / coprimality / modular-inverse math — a teaching demo, explicitly not production crypto) · *Brute Force* (all 26 Caesar shifts, all 256 single-byte XOR keys, highlights the most English-like result) · *Key Generator*.
- **Terminal** — real command shell: `help`, `ls`, `open`, `close`, `scan`, `clear`, `echo`, `date`, `whoami`; drives the other apps through the shared app manifest.
- **Dashboard** — real `navigator`/`performance` metrics badged **"real"**; fabricated CPU/RAM/GPU gauges badged **"simulated"**. The labelling is deliberate and load-bearing.
- **Cyber Explorer** — MITRE ATT&CK-style explorer with a WebGL texture-atlas sphere.
- **Calculator.**

## Self-checks

`window.__testCiphers()` · `__testRSA()` · `__testCryptoLabTab()` — run in console, all pass.

## Design notes

Every app is driven by a single `APPS` manifest — removing or merging an app never breaks the desktop, terminal, search, or radial menu, because all four read the same source. That manifest was built *first*, specifically because a review predicted the hardcoded-roster failure mode.

## Known / deferred

- **Cyber Explorer visual redesign** — deferred by Bruno ("we'll do that later").
- **No touch/no-left-click affordance** for discovering the radial menu now that the persistent trigger button is gone — the topbar search is the fallback discoverable launcher. Accepted gap.
- `annimation.txt`'s exact letter-frequency scramble spec never reconciled with the shipped effect.
- DevLog text still says "7 apps"; shipped roster is 5. Needs updating before posting.
- Icons are an approved placeholder vector set — swap if Bruno's real designs arrive.

## How it was built

Plan → hostile review (findings folded before building) → build → **live browser verification of every change**, using real state checks rather than screenshots alone. Two real bugs were root-caused this way: an unescaped `&` in a label producing invalid SVG that silently blanked the WebGL sphere, and a radial-menu z-order/`pointer-events` bug that ate every trigger click.

Memory node: `second-brain/Knowledge/projects/cyberos.md`.
