export function initTimer(container: HTMLElement, vscodeApi: { postMessage(msg: unknown): void } | null): void {
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

  function getInputTotal(): number {
    const h = parseInt(hoursInput.value || '0', 10) || 0;
    const m = parseInt(minutesInput.value || '0', 10) || 0;
    const s = parseInt(secondsInput.value || '0', 10) || 0;
    return h * 3600 + m * 60 + s;
  }

  function setButtonStates() {
    const hasInput = total > 0 ? remaining > 0 : getInputTotal() > 0;
    startBtn.disabled = running || !hasInput;
    pauseBtn.disabled = !running;
    resetBtn.disabled = total === 0;
  }

  function postStatus() {
    vscodeApi?.postMessage({
      type: 'timerStatus',
      running,
      display: formatTime(remaining),
    });
  }

  function notifyComplete() {
    vscodeApi?.postMessage({
      type: 'timerComplete',
      title: metaTitleEl.textContent || 'Timer',
      desc: metaDescEl.textContent || '',
    });
  }

  function tick() {
    if (remaining <= 0) {
      clearInterval(intervalId!);
      intervalId = null;
      running = false;
      updateDisplay();
      setButtonStates();
      vscodeApi?.postMessage({ type: 'timerReset' });
      notifyComplete();
      return;
    }
    remaining--;
    updateDisplay();
    postStatus();
  }

  startBtn.addEventListener('click', () => {
    if (remaining === 0) {
      const h = parseInt(hoursInput.value || '0', 10);
      const m = parseInt(minutesInput.value || '0', 10);
      const s = parseInt(secondsInput.value || '0', 10);
      total = h * 3600 + m * 60 + s;
      remaining = total;
      if (total === 0) return;

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
    postStatus();
  });

  pauseBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId!);
    intervalId = null;
    running = false;
    updateDisplay();
    setButtonStates();
    postStatus();
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
    vscodeApi?.postMessage({ type: 'timerReset' });
  });

  [hoursInput, minutesInput, secondsInput].forEach(input => {
    input.addEventListener('input', () => { if (total === 0) setButtonStates(); });
  });

  metaEl.style.display = 'none';
  updateDisplay();
  setButtonStates();
}
