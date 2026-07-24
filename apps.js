/* ===== CyberOS apps ===== */

/* ---- shared cipher logic (used by cryptolab.js's Cryptography Lab) ----
 * Caesar/Vigenere: classic letter-only ciphers — non-letters pass through untouched,
 * so Unicode text survives for free (no byte-encoding needed for these two).
 * Base64/XOR: operate on UTF-8 bytes explicitly and Base64-wrap output, so they
 * round-trip non-ASCII text correctly (adversarial review finding #4). */
const Ciphers = {
  caesarEncode(text, shift) {
    shift = ((Number(shift) || 0) % 26 + 26) % 26;
    return [...text].map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return ch;
    }).join("");
  },
  caesarDecode(text, shift) { return Ciphers.caesarEncode(text, -(Number(shift) || 0)); },
  caesarBruteForce(text) {
    return Array.from({ length: 26 }, (_, shift) => ({ shift, text: Ciphers.caesarDecode(text, shift) }));
  },

  base64Encode(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  },
  base64Decode(b64) {
    const bin = atob(b64); // throws on invalid input — caller shows the error
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  },

  requireKey(key) {
    if (!key) throw new Error("Key required");
    return key;
  },

  xorEncode(text, key) {
    Ciphers.requireKey(key);
    const bytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(key);
    const out = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
    let bin = "";
    out.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  },
  xorDecode(cipherB64, key) {
    Ciphers.requireKey(key);
    const bin = atob(cipherB64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(key);
    const out = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
    return new TextDecoder().decode(out);
  },

  vigenereShift(text, key, sign) {
    Ciphers.requireKey(key);
    const keyLetters = [...key.toUpperCase()].filter((c) => c >= "A" && c <= "Z");
    if (keyLetters.length === 0) throw new Error("Key must contain letters");
    let ki = 0;
    return [...text].map((ch) => {
      const code = ch.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const isLower = code >= 97 && code <= 122;
      if (!isUpper && !isLower) return ch;
      const base = isUpper ? 65 : 97;
      const keyShift = keyLetters[ki % keyLetters.length].charCodeAt(0) - 65;
      ki++;
      const shifted = ((code - base + sign * keyShift) % 26 + 26) % 26;
      return String.fromCharCode(shifted + base);
    }).join("");
  },
  vigenereEncode(text, key) { return Ciphers.vigenereShift(text, key, 1); },
  vigenereDecode(text, key) { return Ciphers.vigenereShift(text, key, -1); },

  async sha256Hash(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
};

// ponytail: one runnable self-check for the non-trivial cipher logic, per ponytail rule.
// Ceiling: ASCII + common UTF-8 (e.g. accented letters) verified; astral-plane/emoji
// surrogate pairs are not — upgrade to a full byte-aware Vigenere/Caesar if that's needed.
window.__testCiphers = function () {
  const cases = ["Hello, World!", "", "café über déjà vu"];
  for (const text of cases) {
    console.assert(Ciphers.caesarDecode(Ciphers.caesarEncode(text, 7), 7) === text, "Caesar round-trip failed", text);
    console.assert(Ciphers.base64Decode(Ciphers.base64Encode(text)) === text, "Base64 round-trip failed", text);
    console.assert(Ciphers.xorDecode(Ciphers.xorEncode(text, "key"), "key") === text, "XOR round-trip failed", text);
    console.assert(Ciphers.vigenereDecode(Ciphers.vigenereEncode(text, "lemon"), "lemon") === text, "Vigenere round-trip failed", text);
  }
  let threw = false;
  try { Ciphers.xorEncode("x", ""); } catch (e) { threw = true; }
  console.assert(threw, "XOR should reject empty key");
  console.log("__testCiphers: done, check above for failed assertions");
};

/* ---- Calculator ---- */
function initCalculator() {
  const body = document.getElementById("calcbody");
  body.innerHTML = `
    <div id="calcDisplay">0</div>
    <div class="calc-grid">
      <button class="calc-key op" data-key="clear">C</button>
      <button class="calc-key op" data-key="sign">&#177;</button>
      <button class="calc-key op" data-key="%">%</button>
      <button class="calc-key op" data-key="/">&#247;</button>
      <button class="calc-key" data-key="7">7</button>
      <button class="calc-key" data-key="8">8</button>
      <button class="calc-key" data-key="9">9</button>
      <button class="calc-key op" data-key="*">&#215;</button>
      <button class="calc-key" data-key="4">4</button>
      <button class="calc-key" data-key="5">5</button>
      <button class="calc-key" data-key="6">6</button>
      <button class="calc-key op" data-key="-">&#8722;</button>
      <button class="calc-key" data-key="1">1</button>
      <button class="calc-key" data-key="2">2</button>
      <button class="calc-key" data-key="3">3</button>
      <button class="calc-key op" data-key="+">+</button>
      <button class="calc-key" data-key="0" style="grid-column: span 2;">0</button>
      <button class="calc-key" data-key=".">.</button>
      <button class="calc-key op" data-key="=">=</button>
    </div>
  `;

  const display = document.getElementById("calcDisplay");
  let acc = null, operator = null, current = "0", justEvaluated = false;

  const apply = (a, b, op) => {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;
    if (op === "/") return b === 0 ? NaN : a / b;
    return b;
  };

  body.querySelectorAll(".calc-key").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      if (key === "clear") { acc = null; operator = null; current = "0"; justEvaluated = false; }
      else if (key === "sign") { current = String(parseFloat(current) * -1); }
      else if (key === "%") { current = String(parseFloat(current) / 100); }
      else if (key === ".") { if (!current.includes(".")) current += "."; }
      else if (["+", "-", "*", "/"].includes(key)) {
        if (acc !== null && operator && !justEvaluated) current = String(apply(acc, parseFloat(current), operator));
        acc = parseFloat(current);
        operator = key;
        current = "0";
        justEvaluated = false;
      } else if (key === "=") {
        if (acc !== null && operator) {
          current = String(apply(acc, parseFloat(current), operator));
          acc = null; operator = null; justEvaluated = true;
        }
      } else {
        current = justEvaluated || current === "0" ? key : current + key;
        justEvaluated = false;
      }
      display.textContent = current;
    });
  });
}

/* ---- boot ---- */
initCalculator();
