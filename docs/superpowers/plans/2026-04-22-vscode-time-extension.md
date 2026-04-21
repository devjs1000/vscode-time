# VSCode Time Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VSCode sidebar extension with three modes — Clock (live time), Timer (countdown with title/description), and Stopwatch (count-up with title/description).

**Architecture:** A single Webview-based sidebar panel renders all three modes in vanilla TypeScript + HTML/CSS. The extension host activates on startup, registers the sidebar provider, and handles no server-side logic — all timer state lives in the webview. Mode switching is done via tab buttons inside the webview.

**Tech Stack:** TypeScript, VSCode Extension API (WebviewViewProvider), pnpm, esbuild (bundler), VSCode test runner (@vscode/test-electron)

---

## File Structure

```
vscode-time/
├── package.json                  # Extension manifest + scripts
├── pnpm-lock.yaml
├── tsconfig.json
├── esbuild.js                    # Build script
├── .vscodeignore
├── .gitignore
├── src/
│   ├── extension.ts              # Activate, register sidebar provider
│   ├── TimeViewProvider.ts       # WebviewViewProvider implementation
│   └── webview/
│       ├── main.ts               # Webview entry — wires up all three modes
│       ├── clock.ts              # Clock mode logic
│       ├── timer.ts              # Timer mode logic (title, desc, countdown)
│       ├── stopwatch.ts          # Stopwatch mode logic (title, desc, count-up)
│       └── styles.css            # All styles for the webview UI
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-04-22-vscode-time-extension.md
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.js`
- Create: `.vscodeignore`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "vscode-time",
  "displayName": "Time",
  "description": "Clock, Timer, and Stopwatch in the sidebar",
  "version": "0.0.1",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "time-sidebar",
          "title": "Time",
          "icon": "$(clock)"
        }
      ]
    },
    "views": {
      "time-sidebar": [
        {
          "type": "webview",
          "id": "timeView",
          "name": "Time"
        }
      ]
    }
  },
  "scripts": {
    "build": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "package": "pnpm build && vsce package --no-dependencies"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "esbuild": "^0.20.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create esbuild.js**

```js
const esbuild = require('esbuild');
const watch = process.argv.includes('--watch');

const baseConfig = {
  bundle: true,
  minify: !watch,
  sourcemap: watch,
};

// Extension host bundle
const extensionConfig = {
  ...baseConfig,
  platform: 'node',
  format: 'cjs',
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  external: ['vscode'],
};

// Webview bundle (runs in browser context)
const webviewConfig = {
  ...baseConfig,
  platform: 'browser',
  format: 'iife',
  entryPoints: ['src/webview/main.ts'],
  outfile: 'dist/webview.js',
};

if (watch) {
  Promise.all([
    esbuild.context(extensionConfig).then(ctx => ctx.watch()),
    esbuild.context(webviewConfig).then(ctx => ctx.watch()),
  ]).then(() => console.log('Watching...'));
} else {
  Promise.all([
    esbuild.build(extensionConfig),
    esbuild.build(webviewConfig),
  ]).then(() => console.log('Build complete'));
}
```

- [ ] **Step 4: Create .vscodeignore**

```
.vscode/**
src/**
node_modules/**
docs/**
esbuild.js
tsconfig.json
pnpm-lock.yaml
**/*.map
**/*.ts
!dist/**
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
*.vsix
```

- [ ] **Step 6: Install dependencies**

```bash
cd /Users/devjs1000/development/god/vscode-time
pnpm install
```

Expected: `node_modules/` created with typescript, esbuild, @types/vscode, @types/node.

- [ ] **Step 7: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git init
git add .
git commit -m "chore: scaffold vscode-time extension project"
```

---

### Task 2: Webview Styles

**Files:**
- Create: `src/webview/styles.css`

- [ ] **Step 1: Create styles.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--vscode-font-family);
  color: var(--vscode-foreground);
  background: var(--vscode-sideBar-background);
  padding: 12px;
  user-select: none;
}

/* Tab bar */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
  padding-bottom: 8px;
}

.tab-btn {
  flex: 1;
  padding: 6px 4px;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--vscode-foreground);
  cursor: pointer;
  font-size: 11px;
  font-family: var(--vscode-font-family);
  opacity: 0.6;
  transition: opacity 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  opacity: 0.85;
  border-color: var(--vscode-panel-border);
}

.tab-btn.active {
  opacity: 1;
  border-color: var(--vscode-focusBorder);
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
}

/* Panels */
.panel {
  display: none;
}

.panel.active {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Clock display */
.clock-time {
  font-size: 42px;
  font-weight: 300;
  letter-spacing: 2px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--vscode-foreground);
  padding: 16px 0;
}

.clock-date {
  font-size: 13px;
  text-align: center;
  opacity: 0.65;
}

/* Timer / Stopwatch shared */
.time-display {
  font-size: 48px;
  font-weight: 300;
  letter-spacing: 3px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  padding: 12px 0;
  color: var(--vscode-foreground);
}

.time-display.running {
  color: var(--vscode-terminal-ansiGreen);
}

.time-display.finished {
  color: var(--vscode-errorForeground);
}

/* Form fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 11px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field input,
.field textarea {
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 3px;
  padding: 6px 8px;
  font-family: var(--vscode-font-family);
  font-size: 13px;
  outline: none;
  resize: none;
}

.field input:focus,
.field textarea:focus {
  border-color: var(--vscode-focusBorder);
}

/* Duration input row */
.duration-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.duration-row input[type="number"] {
  width: 60px;
  text-align: center;
  -moz-appearance: textfield;
}

.duration-row input[type="number"]::-webkit-inner-spin-button,
.duration-row input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.duration-row span {
  font-size: 11px;
  opacity: 0.6;
}

/* Buttons */
.btn-row {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 7px 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--vscode-font-family);
  transition: opacity 0.15s;
}

.btn:hover {
  opacity: 0.85;
}

.btn-primary {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.btn-secondary {
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Meta info (title + desc display when running) */
.meta {
  text-align: center;
}

.meta-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.meta-desc {
  font-size: 12px;
  opacity: 0.65;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add src/webview/styles.css
git commit -m "feat: add webview styles for all three modes"
```

---

### Task 3: Clock Mode

**Files:**
- Create: `src/webview/clock.ts`

- [ ] **Step 1: Create clock.ts**

```typescript
export function initClock(container: HTMLElement): () => void {
  const timeEl = container.querySelector<HTMLElement>('.clock-time')!;
  const dateEl = container.querySelector<HTMLElement>('.clock-date')!;

  function tick() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    dateEl.textContent = now.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add src/webview/clock.ts
git commit -m "feat: implement clock mode logic"
```

---

### Task 4: Timer Mode

**Files:**
- Create: `src/webview/timer.ts`

- [ ] **Step 1: Create timer.ts**

```typescript
export function initTimer(container: HTMLElement): void {
  const display = container.querySelector<HTMLElement>('.timer-display')!;
  const titleInput = container.querySelector<HTMLInputElement>('#timer-title')!;
  const descInput = container.querySelector<HTMLTextAreaElement>('#timer-desc')!;
  const hoursInput = container.querySelector<HTMLInputElement>('#timer-hours')!;
  const minutesInput = container.querySelector<HTMLInputElement>('#timer-minutes')!;
  const secondsInput = container.querySelector<HTMLInputElement>('#timer-seconds')!;
  const startBtn = container.querySelector<HTMLButtonElement>('#timer-start')!;
  const pauseBtn = container.querySelector<HTMLButtonElement>('#timer-pause')!;
  const resetBtn = container.querySelector<HTMLButtonElement>('#timer-reset')!;
  const metaEl = container.querySelector<HTMLElement>('.timer-meta')!;
  const metaTitleEl = metaEl.querySelector<HTMLElement>('.meta-title')!;
  const metaDescEl = metaEl.querySelector<HTMLElement>('.meta-desc')!;
  const setupEl = container.querySelector<HTMLElement>('.timer-setup')!;

  let remaining = 0; // seconds
  let total = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let running = false;

  function formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  }

  function updateDisplay() {
    display.textContent = formatTime(remaining);
    display.classList.toggle('running', running && remaining > 0);
    display.classList.toggle('finished', remaining === 0 && total > 0 && !running);
  }

  function setButtonStates() {
    startBtn.disabled = running || remaining === 0;
    pauseBtn.disabled = !running;
    resetBtn.disabled = total === 0;
  }

  function tick() {
    if (remaining <= 0) {
      clearInterval(intervalId!);
      intervalId = null;
      running = false;
      updateDisplay();
      setButtonStates();
      return;
    }
    remaining--;
    updateDisplay();
  }

  startBtn.addEventListener('click', () => {
    if (remaining === 0) {
      // Fresh start: read inputs
      const h = parseInt(hoursInput.value || '0', 10);
      const m = parseInt(minutesInput.value || '0', 10);
      const s = parseInt(secondsInput.value || '0', 10);
      total = h * 3600 + m * 60 + s;
      remaining = total;
      if (total === 0) return;

      // Show meta, hide setup
      metaTitleEl.textContent = titleInput.value.trim() || 'Timer';
      metaDescEl.textContent = descInput.value.trim();
      metaDescEl.style.display = descInput.value.trim() ? '' : 'none';
      metaEl.style.display = '';
      setupEl.style.display = 'none';
    }

    running = true;
    intervalId = setInterval(tick, 1000);
    updateDisplay();
    setButtonStates();
  });

  pauseBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId!);
    intervalId = null;
    running = false;
    updateDisplay();
    setButtonStates();
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId!);
    intervalId = null;
    running = false;
    remaining = 0;
    total = 0;
    hoursInput.value = '0';
    minutesInput.value = '0';
    secondsInput.value = '0';
    titleInput.value = '';
    descInput.value = '';
    metaEl.style.display = 'none';
    setupEl.style.display = '';
    display.classList.remove('running', 'finished');
    updateDisplay();
    setButtonStates();
  });

  // Init
  metaEl.style.display = 'none';
  updateDisplay();
  setButtonStates();
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add src/webview/timer.ts
git commit -m "feat: implement timer mode with title, description, and countdown"
```

---

### Task 5: Stopwatch Mode

**Files:**
- Create: `src/webview/stopwatch.ts`

- [ ] **Step 1: Create stopwatch.ts**

```typescript
export function initStopwatch(container: HTMLElement): void {
  const display = container.querySelector<HTMLElement>('.sw-display')!;
  const titleInput = container.querySelector<HTMLInputElement>('#sw-title')!;
  const descInput = container.querySelector<HTMLTextAreaElement>('#sw-desc')!;
  const startBtn = container.querySelector<HTMLButtonElement>('#sw-start')!;
  const pauseBtn = container.querySelector<HTMLButtonElement>('#sw-pause')!;
  const resetBtn = container.querySelector<HTMLButtonElement>('#sw-reset')!;
  const metaEl = container.querySelector<HTMLElement>('.sw-meta')!;
  const metaTitleEl = metaEl.querySelector<HTMLElement>('.meta-title')!;
  const metaDescEl = metaEl.querySelector<HTMLElement>('.meta-desc')!;
  const setupEl = container.querySelector<HTMLElement>('.sw-setup')!;

  let elapsed = 0; // centiseconds (1/100 s) for precision display
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let running = false;
  let started = false;

  function formatTime(cs: number): string {
    const totalSec = Math.floor(cs / 100);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const hundredths = cs % 100;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function updateDisplay() {
    display.textContent = formatTime(elapsed);
    display.classList.toggle('running', running);
  }

  function setButtonStates() {
    startBtn.disabled = running;
    pauseBtn.disabled = !running;
    resetBtn.disabled = !started;
  }

  function tick() {
    elapsed++;
    updateDisplay();
  }

  startBtn.addEventListener('click', () => {
    if (!started) {
      metaTitleEl.textContent = titleInput.value.trim() || 'Stopwatch';
      metaDescEl.textContent = descInput.value.trim();
      metaDescEl.style.display = descInput.value.trim() ? '' : 'none';
      metaEl.style.display = '';
      setupEl.style.display = 'none';
      started = true;
    }
    running = true;
    intervalId = setInterval(tick, 10);
    updateDisplay();
    setButtonStates();
  });

  pauseBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId!);
    intervalId = null;
    running = false;
    updateDisplay();
    setButtonStates();
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId!);
    intervalId = null;
    running = false;
    started = false;
    elapsed = 0;
    titleInput.value = '';
    descInput.value = '';
    metaEl.style.display = 'none';
    setupEl.style.display = '';
    display.classList.remove('running');
    updateDisplay();
    setButtonStates();
  });

  // Init
  metaEl.style.display = 'none';
  updateDisplay();
  setButtonStates();
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add src/webview/stopwatch.ts
git commit -m "feat: implement stopwatch mode with title, description, and centisecond display"
```

---

### Task 6: Webview Entry Point (main.ts)

**Files:**
- Create: `src/webview/main.ts`

- [ ] **Step 1: Create main.ts**

```typescript
import { initClock } from './clock';
import { initTimer } from './timer';
import { initStopwatch } from './stopwatch';

// Inject CSS
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = (window as any).__cssUri__;
document.head.appendChild(style);

const html = `
<div class="tabs">
  <button class="tab-btn active" data-tab="clock">Clock</button>
  <button class="tab-btn" data-tab="timer">Timer</button>
  <button class="tab-btn" data-tab="stopwatch">Stopwatch</button>
</div>

<!-- CLOCK PANEL -->
<div class="panel active" id="panel-clock">
  <div class="clock-time">00:00:00</div>
  <div class="clock-date"></div>
</div>

<!-- TIMER PANEL -->
<div class="panel" id="panel-timer">
  <div class="time-display timer-display">00:00:00</div>
  <div class="meta timer-meta">
    <div class="meta-title"></div>
    <div class="meta-desc"></div>
  </div>
  <div class="timer-setup">
    <div class="field">
      <label>Title</label>
      <input type="text" id="timer-title" placeholder="e.g. Pomodoro" maxlength="60" />
    </div>
    <div class="field">
      <label>Description</label>
      <textarea id="timer-desc" rows="2" placeholder="Optional notes..."></textarea>
    </div>
    <div class="field">
      <label>Duration</label>
      <div class="duration-row">
        <input type="number" id="timer-hours" value="0" min="0" max="23" />
        <span>h</span>
        <input type="number" id="timer-minutes" value="25" min="0" max="59" />
        <span>m</span>
        <input type="number" id="timer-seconds" value="0" min="0" max="59" />
        <span>s</span>
      </div>
    </div>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" id="timer-start">Start</button>
    <button class="btn btn-secondary" id="timer-pause">Pause</button>
    <button class="btn btn-secondary" id="timer-reset">Reset</button>
  </div>
</div>

<!-- STOPWATCH PANEL -->
<div class="panel" id="panel-stopwatch">
  <div class="time-display sw-display">00:00.00</div>
  <div class="meta sw-meta">
    <div class="meta-title"></div>
    <div class="meta-desc"></div>
  </div>
  <div class="sw-setup">
    <div class="field">
      <label>Title</label>
      <input type="text" id="sw-title" placeholder="e.g. Sprint 1" maxlength="60" />
    </div>
    <div class="field">
      <label>Description</label>
      <textarea id="sw-desc" rows="2" placeholder="Optional notes..."></textarea>
    </div>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" id="sw-start">Start</button>
    <button class="btn btn-secondary" id="sw-pause">Pause</button>
    <button class="btn btn-secondary" id="sw-reset">Reset</button>
  </div>
</div>
`;

document.body.innerHTML = html;

// Tab switching
const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const panels = document.querySelectorAll<HTMLElement>('.panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${btn.dataset.tab}`)!.classList.add('active');
  });
});

// Init modes
let stopClockTick: (() => void) | null = null;

function startClock() {
  if (stopClockTick) stopClockTick();
  stopClockTick = initClock(document.getElementById('panel-clock')!);
}

startClock();
initTimer(document.getElementById('panel-timer')!);
initStopwatch(document.getElementById('panel-stopwatch')!);
```

- [ ] **Step 2: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add src/webview/main.ts
git commit -m "feat: add webview entry point with tab switching and mode initialization"
```

---

### Task 7: Extension Host (TimeViewProvider + extension.ts)

**Files:**
- Create: `src/TimeViewProvider.ts`
- Create: `src/extension.ts`

- [ ] **Step 1: Create TimeViewProvider.ts**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class TimeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'timeView';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist')],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Time</title>
</head>
<body>
  <script nonce="${nonce}">window.__cssUri__ = "${cssUri}";</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

- [ ] **Step 2: Create extension.ts**

```typescript
import * as vscode from 'vscode';
import { TimeViewProvider } from './TimeViewProvider';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new TimeViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(TimeViewProvider.viewType, provider)
  );
}

export function deactivate(): void {}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add src/TimeViewProvider.ts src/extension.ts
git commit -m "feat: add extension host with TimeViewProvider sidebar registration"
```

---

### Task 8: Update esbuild to also emit CSS

The webview CSS needs to be copied to `dist/` so the webview can load it via URI. Update `esbuild.js` to copy `src/webview/styles.css` to `dist/webview.css`.

**Files:**
- Modify: `esbuild.js`

- [ ] **Step 1: Update esbuild.js to copy CSS**

Replace the contents of `esbuild.js` with:

```js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const watch = process.argv.includes('--watch');

function copyCSS() {
  fs.mkdirSync('dist', { recursive: true });
  fs.copyFileSync(
    path.join('src', 'webview', 'styles.css'),
    path.join('dist', 'webview.css')
  );
}

const baseConfig = {
  bundle: true,
  minify: !watch,
  sourcemap: watch,
};

const extensionConfig = {
  ...baseConfig,
  platform: 'node',
  format: 'cjs',
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  external: ['vscode'],
};

const webviewConfig = {
  ...baseConfig,
  platform: 'browser',
  format: 'iife',
  entryPoints: ['src/webview/main.ts'],
  outfile: 'dist/webview.js',
};

if (watch) {
  copyCSS();
  Promise.all([
    esbuild.context(extensionConfig).then(ctx => ctx.watch()),
    esbuild.context(webviewConfig).then(ctx => ctx.watch()),
  ]).then(() => console.log('Watching...'));
} else {
  copyCSS();
  Promise.all([
    esbuild.build(extensionConfig),
    esbuild.build(webviewConfig),
  ]).then(() => console.log('Build complete'));
}
```

- [ ] **Step 2: Run the build**

```bash
cd /Users/devjs1000/development/god/vscode-time
pnpm build
```

Expected output:
```
Build complete
```

Verify:
```bash
ls dist/
```
Expected: `extension.js  webview.js  webview.css`

- [ ] **Step 3: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add esbuild.js dist/
git commit -m "build: copy webview CSS to dist on build"
```

---

### Task 9: Fix CSS loading in main.ts (inline instead of dynamic link)

Since esbuild bundles everything and we're loading CSS via a vscode URI injected as `window.__cssUri__`, we need to ensure the `<link>` tag is appended correctly. Update `main.ts` to use `document.head.appendChild` properly with the correct URI set before the script runs (already handled by the inline script in the HTML template).

No code changes needed — the existing `main.ts` already reads `window.__cssUri__`. This task verifies it works end-to-end.

- [ ] **Step 1: Verify HTML template injects __cssUri__ before webview.js executes**

Open `src/TimeViewProvider.ts` and confirm the `<script nonce="...">window.__cssUri__ = "...";</script>` line appears **before** the `<script src="${scriptUri}">` line. This is already the case from Task 7.

- [ ] **Step 2: Manual verification in VSCode**

Press `F5` in VSCode with the project open to launch the Extension Development Host.

In the new VSCode window, click the clock icon in the Activity Bar. You should see:
- Three tabs: Clock, Timer, Stopwatch
- Clock tab shows current time and date updating every second
- Timer tab shows input fields for title, description, hours/minutes/seconds, and Start/Pause/Reset buttons
- Stopwatch tab shows title, description fields and Start/Pause/Reset buttons

- [ ] **Step 3: Test Timer flow**

1. Click Timer tab
2. Enter title "Pomodoro", description "Focus session", set 0h 0m 5s
3. Click Start — countdown begins, setup form is hidden, meta title/desc appear
4. Click Pause — countdown stops
5. Click Start again — resumes from where it paused
6. Wait for it to reach 00:00:00 — display turns red (finished state)
7. Click Reset — all fields clear, form reappears

- [ ] **Step 4: Test Stopwatch flow**

1. Click Stopwatch tab
2. Enter title "Sprint", description "Code review"
3. Click Start — centisecond timer starts (MM:SS.cc format)
4. Click Pause — timer stops
5. Click Start again — resumes
6. Click Reset — clears everything

- [ ] **Step 5: Commit**

```bash
cd /Users/devjs1000/development/god/vscode-time
git add .
git commit -m "feat: complete vscode-time extension with clock, timer, and stopwatch"
```

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| VSCode sidebar extension | Task 1 (package.json contributes.viewsContainers), Task 7 |
| Clock mode — shows current time | Task 3 |
| Timer mode — title + description + countdown | Task 4 |
| Stopwatch mode — title + description + count-up | Task 5 |
| Three tab modes switchable | Task 6 (main.ts tab switching) |
| pnpm for all dependencies | Task 1 Step 6 |
| Built with TypeScript | Task 1 (tsconfig.json), all src files |

All requirements covered. No gaps found.
