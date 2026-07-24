/* ===== Cryptography Lab — merges the old Cryptography + Decryption windows into one tabbed app.
 * Reuses `Ciphers` from apps.js (Caesar/Vigenere/Base64/XOR + caesarBruteForce). SHA-256 and the
 * step-strip tab were dropped in the pre-publish polish pass — decryptText itself is untouched,
 * still used by the looping window-title scramble in script.js.
 * RSA here is a small-integer teaching demo (BigInt) — NOT production crypto; encrypts/decrypts a
 * single integer < n, not free text, per the plan's honesty requirement. */

/* ---- small-number RSA helpers (BigInt) ---- */
function isPrime(n) {
  n = Number(n);
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

// extended Euclidean algorithm — modular inverse of e mod phi (BigInt)
function modInverse(e, phi) {
  e = BigInt(e); phi = BigInt(phi);
  let [old_r, r] = [e, phi];
  let [old_s, s] = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  if (old_r !== 1n) throw new Error("e has no inverse mod phi — pick a different e");
  return ((old_s % phi) + phi) % phi;
}

function modPow(base, exp, mod) {
  base = BigInt(base); exp = BigInt(exp); mod = BigInt(mod);
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

const SMALL_PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 79, 83, 89, 97];

function pickDistinctPrimes() {
  const p = SMALL_PRIMES[Math.floor(Math.random() * SMALL_PRIMES.length)];
  let q = SMALL_PRIMES[Math.floor(Math.random() * SMALL_PRIMES.length)];
  while (q === p) q = SMALL_PRIMES[Math.floor(Math.random() * SMALL_PRIMES.length)];
  return { p, q };
}

// smallest e > 1 with gcd(e, phi) === 1
function pickPublicExponent(phi) {
  for (let e = 3; e < phi; e += 2) if (gcd(e, phi) === 1) return e;
  throw new Error("no valid public exponent found for this phi");
}

function buildRsaKeypair(p, q) {
  if (!isPrime(p) || !isPrime(q)) throw new Error("p and q must both be prime");
  if (p === q) throw new Error("p and q must be distinct");
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  const e = pickPublicExponent(phi);
  const d = Number(modInverse(e, phi));
  return { p, q, n, phi, e, d };
}

// ponytail: one runnable self-check for the non-trivial RSA math.
window.__testRSA = function () {
  const { n, e, d } = buildRsaKeypair(61, 53);
  for (const m of [0, 1, 42, 1000]) {
    if (m >= n) continue;
    const c = modPow(m, e, n);
    const back = Number(modPow(c, d, n));
    console.assert(back === m, "RSA round-trip failed", m, back);
  }
  console.assert(!isPrime(1) && isPrime(2) && isPrime(97) && !isPrime(100), "isPrime failed");
  console.log("__testRSA: done, check above for failed assertions");
};

/* ---- Ciphers tab (consolidated Encrypt/Decrypt UI, reuses window Ciphers) ---- */
function buildCiphersTab(panel) {
  panel.innerHTML = `
    <div class="row">
      <select id="labCipher">
        <option value="caesar">Caesar</option>
        <option value="vigenere">Vigenère</option>
        <option value="base64">Base64</option>
        <option value="xor">XOR</option>
      </select>
      <select id="labDirection">
        <option value="encrypt">Encrypt</option>
        <option value="decrypt">Decrypt</option>
      </select>
    </div>
    <input type="text" id="labKey" placeholder="key / Caesar shift (blank = brute-force Caesar on decrypt)" />
    <textarea id="labInput" placeholder="text"></textarea>
    <button class="run-btn" id="labRun">Run</button>
    <div class="error-text" id="labError"></div>
    <div class="output-box" id="labOutput"></div>
  `;

  const cipherSel = panel.querySelector("#labCipher");
  const dirSel = panel.querySelector("#labDirection");
  const keyInput = panel.querySelector("#labKey");
  const textInput = panel.querySelector("#labInput");
  const errorEl = panel.querySelector("#labError");
  const outputEl = panel.querySelector("#labOutput");

  panel.querySelector("#labRun").addEventListener("click", () => {
    errorEl.textContent = "";
    outputEl.textContent = "";
    const cipher = cipherSel.value;
    const dir = dirSel.value;
    const key = keyInput.value;
    const text = textInput.value;

    try {
      if (dir === "encrypt") {
        if (cipher === "caesar") outputEl.textContent = Ciphers.caesarEncode(text, key || 3);
        else if (cipher === "vigenere") outputEl.textContent = Ciphers.vigenereEncode(text, key);
        else if (cipher === "base64") outputEl.textContent = Ciphers.base64Encode(text);
        else if (cipher === "xor") outputEl.textContent = Ciphers.xorEncode(text, key);
      } else {
        if (cipher === "caesar") {
          if (key === "") {
            outputEl.innerHTML = "";
            const list = document.createElement("div");
            list.className = "brute-list";
            Ciphers.caesarBruteForce(text).forEach((r) => {
              const line = document.createElement("div");
              line.textContent = `shift ${r.shift}: ${r.text}`;
              list.appendChild(line);
            });
            outputEl.appendChild(list);
          } else {
            outputEl.textContent = Ciphers.caesarDecode(text, key);
          }
        } else if (cipher === "vigenere") outputEl.textContent = Ciphers.vigenereDecode(text, key);
        else if (cipher === "base64") outputEl.textContent = Ciphers.base64Decode(text);
        else if (cipher === "xor") outputEl.textContent = Ciphers.xorDecode(text, key);
      }
    } catch (err) {
      errorEl.textContent = err.message || "Could not process input.";
    }
  });
}

/* ---- RSA visualization tab ---- */
function buildRsaTab(panel) {
  panel.innerHTML = `
    <p class="error-text" style="color: var(--text-dim);">Teaching demo only — tiny primes, encrypts a single integer, not production crypto.</p>
    <div class="row">
      <input type="number" id="rsaP" placeholder="p (prime)" value="61" />
      <input type="number" id="rsaQ" placeholder="q (prime)" value="53" />
      <button class="run-btn" id="rsaRandom">Random primes</button>
    </div>
    <button class="run-btn" id="rsaKeygen">Generate keypair</button>
    <div class="output-box" id="rsaKeyOut"></div>
    <div class="row">
      <input type="number" id="rsaMessage" placeholder="message (integer &lt; n)" value="42" />
      <button class="run-btn" id="rsaEncrypt">Encrypt</button>
      <button class="run-btn" id="rsaDecrypt">Decrypt</button>
    </div>
    <div class="error-text" id="rsaError"></div>
    <div class="output-box" id="rsaStepOut"></div>
  `;

  let keys = null;
  let lastCipher = null;
  const keyOut = panel.querySelector("#rsaKeyOut");
  const errorEl = panel.querySelector("#rsaError");
  const stepOut = panel.querySelector("#rsaStepOut");

  function renderKeys() {
    keyOut.textContent = keys
      ? `n = ${keys.p}×${keys.q} = ${keys.n}   φ(n) = ${keys.phi}   public e = ${keys.e}   private d = ${keys.d}`
      : "";
  }

  panel.querySelector("#rsaRandom").addEventListener("click", () => {
    const { p, q } = pickDistinctPrimes();
    panel.querySelector("#rsaP").value = p;
    panel.querySelector("#rsaQ").value = q;
  });

  panel.querySelector("#rsaKeygen").addEventListener("click", () => {
    errorEl.textContent = "";
    try {
      const p = Number(panel.querySelector("#rsaP").value);
      const q = Number(panel.querySelector("#rsaQ").value);
      keys = buildRsaKeypair(p, q);
      renderKeys();
    } catch (err) {
      keys = null;
      renderKeys();
      errorEl.textContent = err.message;
    }
  });

  panel.querySelector("#rsaEncrypt").addEventListener("click", () => {
    errorEl.textContent = "";
    stepOut.textContent = "";
    if (!keys) { errorEl.textContent = "Generate a keypair first."; return; }
    const m = Number(panel.querySelector("#rsaMessage").value);
    if (!Number.isInteger(m) || m < 0 || m >= keys.n) {
      errorEl.textContent = `message must be an integer with 0 ≤ m < n (${keys.n})`;
      return;
    }
    const c = modPow(m, keys.e, keys.n);
    lastCipher = c;
    stepOut.textContent = `c = m^e mod n = ${m}^${keys.e} mod ${keys.n} = ${c}`;
  });

  panel.querySelector("#rsaDecrypt").addEventListener("click", () => {
    errorEl.textContent = "";
    if (!keys) { errorEl.textContent = "Generate a keypair first."; return; }
    if (lastCipher === null) { errorEl.textContent = "Encrypt a message first."; return; }
    const m2 = modPow(lastCipher, keys.d, keys.n);
    stepOut.textContent += `\nm = c^d mod n = ${lastCipher}^${keys.d} mod ${keys.n} = ${m2}`;
  });
}

/* ---- Brute force tab ---- */
function buildBruteTab(panel) {
  panel.innerHTML = `
    <p style="font-size:0.75rem;color:var(--text-dim);">Caesar (26 shifts) and single-byte XOR (256 keys) brute force. Likely plaintext is highlighted by an English-word heuristic.</p>
    <textarea id="bruteCaesarInput" placeholder="Caesar ciphertext"></textarea>
    <button class="run-btn" id="bruteCaesarRun">Brute-force Caesar</button>
    <div class="output-box" id="bruteCaesarOut"></div>
    <textarea id="bruteXorInput" placeholder="Base64 single-byte-XOR ciphertext"></textarea>
    <button class="run-btn" id="bruteXorRun">Brute-force XOR (single byte)</button>
    <div class="output-box" id="bruteXorOut"></div>
  `;

  const COMMON_WORDS = [" the ", " and ", " is ", " of ", " to ", " in ", " a ", " you ", " it "];
  function englishScore(text) {
    const padded = ` ${text.toLowerCase()} `;
    let score = 0;
    COMMON_WORDS.forEach((w) => { if (padded.includes(w)) score++; });
    return score;
  }

  panel.querySelector("#bruteCaesarRun").addEventListener("click", () => {
    const text = panel.querySelector("#bruteCaesarInput").value;
    const results = Ciphers.caesarBruteForce(text).map((r) => ({ ...r, score: englishScore(r.text) }));
    const best = Math.max(...results.map((r) => r.score));
    const out = panel.querySelector("#bruteCaesarOut");
    out.innerHTML = "";
    const list = document.createElement("div");
    list.className = "brute-list";
    results.forEach((r) => {
      const line = document.createElement("div");
      if (r.score === best && best > 0) line.className = "list-entry active";
      line.textContent = `shift ${r.shift}: ${r.text}`;
      list.appendChild(line);
    });
    out.appendChild(list);
  });

  panel.querySelector("#bruteXorRun").addEventListener("click", () => {
    const errorEl = panel.querySelector("#bruteXorOut");
    errorEl.innerHTML = "";
    let bytes;
    try {
      bytes = Uint8Array.from(atob(panel.querySelector("#bruteXorInput").value), (c) => c.charCodeAt(0));
    } catch {
      errorEl.textContent = "Invalid Base64 input.";
      return;
    }
    const candidates = [];
    for (let key = 0; key < 256; key++) {
      const out = bytes.map((b) => b ^ key);
      let printable = 0;
      out.forEach((b) => { if (b >= 32 && b < 127) printable++; });
      const text = new TextDecoder().decode(out).replace(/[^\x20-\x7e]/g, "�");
      candidates.push({ key, text, score: printable / bytes.length + englishScore(text) });
    }
    candidates.sort((a, b) => b.score - a.score);
    const list = document.createElement("div");
    list.className = "brute-list";
    candidates.slice(0, 20).forEach((c, i) => {
      const line = document.createElement("div");
      if (i === 0) line.className = "list-entry active";
      line.textContent = `key 0x${c.key.toString(16).padStart(2, "0")}: ${c.text}`;
      list.appendChild(line);
    });
    errorEl.appendChild(list);
  });
}

/* ---- Key generator tab ---- */
function buildKeygenTab(panel) {
  panel.innerHTML = `
    <button class="run-btn" id="keygenRsa">Generate RSA keypair</button>
    <div class="output-box" id="keygenRsaOut"></div>
    <button class="run-btn" id="keygenSym">Generate symmetric key (128-bit)</button>
    <div class="output-box" id="keygenSymOut"></div>
  `;

  panel.querySelector("#keygenRsa").addEventListener("click", () => {
    const { p, q } = pickDistinctPrimes();
    const keys = buildRsaKeypair(p, q);
    panel.querySelector("#keygenRsaOut").textContent =
      `public key: (e=${keys.e}, n=${keys.n})\nprivate key: (d=${keys.d}, n=${keys.n})`;
  });

  panel.querySelector("#keygenSym").addEventListener("click", () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    panel.querySelector("#keygenSymOut").textContent = hex;
  });
}

/* ---- shell: tab bar + panel wiring ---- */
function initCryptoLab() {
  const body = document.getElementById("cryptolabbody");
  body.innerHTML = `
    <div class="tab-bar" id="labTabBar">
      <button class="tab-btn active" data-tab="ciphers">Ciphers</button>
      <button class="tab-btn" data-tab="rsa">RSA</button>
      <button class="tab-btn" data-tab="brute">Brute Force</button>
      <button class="tab-btn" data-tab="keygen">Key Generator</button>
    </div>
    <div class="tab-panel active" data-panel="ciphers"></div>
    <div class="tab-panel" data-panel="rsa"></div>
    <div class="tab-panel" data-panel="brute"></div>
    <div class="tab-panel" data-panel="keygen"></div>
  `;

  buildCiphersTab(body.querySelector('[data-panel="ciphers"]'));
  buildRsaTab(body.querySelector('[data-panel="rsa"]'));
  buildBruteTab(body.querySelector('[data-panel="brute"]'));
  buildKeygenTab(body.querySelector('[data-panel="keygen"]'));

  body.querySelector("#labTabBar").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    body.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    body.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    body.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add("active");
  });
}

initCryptoLab();

// ponytail: DOM-level check for the Ciphers TAB specifically (not just the Ciphers object) —
// catches wiring regressions like the SHA-256 option removal breaking the select/run handler.
window.__testCryptoLabTab = function () {
  const body = document.getElementById("cryptolabbody");
  const cipherSel = body.querySelector("#labCipher");
  const noSha256 = ![...cipherSel.options].some((o) => o.value === "sha256");
  console.assert(noSha256, "SHA-256 option should have been removed from the Ciphers tab");
  console.assert(!body.querySelector('[data-tab="strip"]'), "Step Strip tab button should be gone");

  body.querySelector("#labKey").value = "5";
  body.querySelector("#labInput").value = "Hello";
  body.querySelector("#labRun").click();
  console.assert(body.querySelector("#labOutput").textContent === "Mjqqt", "Caesar tab run failed");
  console.log("__testCryptoLabTab: done, check above for failed assertions");
};
