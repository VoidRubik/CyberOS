/* ===== Terminal — standalone command line that drives the other apps =====
 * Reads window.APPS (desktop.js) for ls/open/close; calls the existing openWindow/closeWindow
 * (script.js) directly — no new window-management logic. Output is always textContent, never
 * innerHTML, matching the XSS discipline already established elsewhere in this codebase. */

function initTerminal() {
  const body = document.getElementById("terminalbody");
  body.innerHTML = `
    <div class="terminal-output" id="termOutput"></div>
    <div class="terminal-input-row">
      <span class="terminal-prompt">cyberos&gt;</span>
      <input type="text" id="termInput" autocomplete="off" spellcheck="false" />
    </div>
  `;
  const output = body.querySelector("#termOutput");
  const input = body.querySelector("#termInput");
  const history = [];
  let historyIndex = -1;

  function printLine(text, cls) {
    const line = document.createElement("p");
    line.className = "terminal-line" + (cls ? " " + cls : "");
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  const HELP_TEXT = [
    "CyberOS terminal — quick manual",
    "  help            show this manual",
    "  ls | apps       list installed apps",
    "  open <app>      open an app window (e.g. open cryptolab)",
    "  close <app>     close an app window",
    "  clear           clear this screen",
    "  echo <text>     print text back",
    "  date            show current date/time",
    "  whoami          show the current operator"
  ];

  function findApp(name) {
    const q = name.trim().toLowerCase();
    return (window.APPS || []).find(
      (a) => a.id === q || a.name.toLowerCase() === q || a.name.toLowerCase().replace(/\s+/g, "") === q
    );
  }

  const COMMANDS = {
    help() { HELP_TEXT.forEach((l) => printLine(l)); },
    ls() { (window.APPS || []).forEach((a) => printLine(`  ${a.id.padEnd(12)} ${a.name}`)); },
    apps() { COMMANDS.ls(); },
    open(args) {
      const app = findApp(args.join(" "));
      if (!app) { printLine(`no such app: ${args.join(" ")}`, "err"); return; }
      openWindow(app.id);
      printLine(`opened ${app.name}`);
    },
    close(args) {
      const app = findApp(args.join(" "));
      if (!app) { printLine(`no such app: ${args.join(" ")}`, "err"); return; }
      closeWindow(app.id);
      printLine(`closed ${app.name}`);
    },
    clear() { output.innerHTML = ""; },
    echo(args) { printLine(args.join(" ")); },
    date() { printLine(new Date().toString()); },
    whoami() { printLine("operator"); }
  };

  function run(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    printLine("cyberos> " + trimmed, "cmd");
    history.push(trimmed);
    historyIndex = history.length;
    const [cmd, ...args] = trimmed.split(/\s+/);
    const fn = COMMANDS[cmd.toLowerCase()];
    if (fn) fn(args);
    else printLine(`command not found: ${cmd} (try 'help')`, "err");
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      run(input.value);
      input.value = "";
    } else if (e.key === "ArrowUp") {
      if (historyIndex > 0) { historyIndex--; input.value = history[historyIndex]; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (historyIndex < history.length - 1) { historyIndex++; input.value = history[historyIndex]; }
      else { historyIndex = history.length; input.value = ""; }
      e.preventDefault();
    }
  });

  body.addEventListener("click", () => input.focus());

  printLine("CyberOS terminal ready. Type 'help' for a manual.");
}

initTerminal();
