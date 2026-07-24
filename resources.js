/* ===== Cyber Explorer data (local, curated — no API/CORS dependency) ===== */

// ponytail: generated SVG thumbnails instead of shipping real image assets —
// zero external asset dependency, deterministic, offline-safe.
// Wraps the resource's own name across the tile so the sphere reads as
// labeled resource cards instead of cryptic single letters.
function wrapLabel(text, maxCharsPerLine = 8) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((w) => {
    if ((line + " " + w).trim().length > maxCharsPerLine && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

// SVG is XML — an unescaped "&" (e.g. "MITRE ATT&CK") breaks the markup, the
// data URI fails to decode, and the atlas load promise for that image never
// resolves — Promise.all then hangs forever and the whole sphere stays black.
function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cardSVG(name, hue) {
  const lines = wrapLabel(name);
  const lineHeight = 34;
  const startY = 128 - ((lines.length - 1) * lineHeight) / 2;
  const textEls = lines
    .map(
      (line, i) =>
        `<text x="128" y="${startY + i * lineHeight}" font-size="26" text-anchor="middle" dominant-baseline="middle" fill="hsl(${hue},90%,70%)" font-family="Consolas, monospace" font-weight="bold">${escapeXml(line)}</text>`
    )
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">` +
    `<rect width="256" height="256" fill="hsl(${hue},70%,10%)"/>` +
    `<rect x="6" y="6" width="244" height="244" fill="none" stroke="hsl(${hue},80%,55%)" stroke-width="3"/>` +
    textEls +
    `</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const CYBER_RESOURCES = [
  { title: "OWASP", tags: "web appsec top10", description: "Open Web Application Security Project — top 10 risks, cheat sheets.", link: "https://owasp.org/", image: cardSVG("OWASP", 170) },
  { title: "CVE Database", tags: "vulnerabilities cve", description: "Common Vulnerabilities and Exposures — the public vuln catalog.", link: "https://cve.org/", image: cardSVG("CVE Database", 200) },
  { title: "NIST NVD", tags: "vulnerabilities scoring", description: "National Vulnerability Database — CVSS scoring, NVD feeds.", link: "https://nvd.nist.gov/", image: cardSVG("NIST NVD", 210) },
  { title: "MITRE ATT&CK", tags: "threat intel ttps", description: "Adversary tactics & techniques knowledge base.", link: "https://attack.mitre.org/", image: cardSVG("MITRE ATT&CK", 20) },
  { title: "HackTheBox", tags: "practice ctf", description: "Hands-on penetration testing labs and CTF challenges.", link: "https://www.hackthebox.com/", image: cardSVG("HackTheBox", 140) },
  { title: "TryHackMe", tags: "practice learning", description: "Guided cybersecurity learning paths and rooms.", link: "https://tryhackme.com/", image: cardSVG("TryHackMe", 260) },
  { title: "Have I Been Pwned", tags: "breach lookup", description: "Check if an email/password has appeared in a data breach.", link: "https://haveibeenpwned.com/", image: cardSVG("Have I Been Pwned", 0) },
  { title: "Shodan", tags: "recon osint", description: "Search engine for internet-connected devices.", link: "https://www.shodan.io/", image: cardSVG("Shodan", 45) },
  { title: "VirusTotal", tags: "malware analysis", description: "Scan files/URLs against dozens of AV engines.", link: "https://www.virustotal.com/", image: cardSVG("VirusTotal", 300) },
  { title: "CyberChef", tags: "tools crypto encoding", description: "The Cyber Swiss Army Knife — browser-based data transforms.", link: "https://gchq.github.io/CyberChef/", image: cardSVG("CyberChef", 90) },
  { title: "Krebs on Security", tags: "news blog", description: "Investigative cybersecurity journalism.", link: "https://krebsonsecurity.com/", image: cardSVG("Krebs on Security", 320) },
  { title: "Exploit-DB", tags: "exploits research", description: "Archive of public exploits and vulnerable software.", link: "https://www.exploit-db.com/", image: cardSVG("Exploit-DB", 15) }
];
