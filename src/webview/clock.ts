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
