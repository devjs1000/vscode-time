import { initClock } from './clock';
import { initTimer } from './timer';
import { initStopwatch } from './stopwatch';

// Inject CSS via vscode URI injected before this script runs
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = (window as any).__cssUri__;
document.head.appendChild(style);

document.body.innerHTML = `
<div class="tabs">
  <button class="tab-btn active" data-tab="clock">Clock</button>
  <button class="tab-btn" data-tab="timer">Timer</button>
  <button class="tab-btn" data-tab="stopwatch">Stopwatch</button>
</div>

<div class="panel active" id="panel-clock">
  <div class="clock-time">00:00:00</div>
  <div class="clock-date"></div>
</div>

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

let stopClockTick: (() => void) | null = null;

function startClock() {
  if (stopClockTick) stopClockTick();
  stopClockTick = initClock(document.getElementById('panel-clock')!);
}

const vscodeApi = typeof (window as any).acquireVsCodeApi === 'function'
  ? (window as any).acquireVsCodeApi()
  : null;

startClock();
initTimer(document.getElementById('panel-timer')!, vscodeApi);
initStopwatch(document.getElementById('panel-stopwatch')!);
