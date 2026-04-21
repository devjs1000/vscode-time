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

  let elapsed = 0; // centiseconds (1/100 s)
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

  metaEl.style.display = 'none';
  updateDisplay();
  setButtonStates();
}
