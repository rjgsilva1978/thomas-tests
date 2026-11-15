// Deadline-based countdown. Background tabs throttle setInterval, so the remaining
// time is always computed from a fixed deadline rather than by counting ticks.

export function countdown(seconds, { onTick, onEnd }) {
  const deadline = Date.now() + seconds * 1000;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    const remaining = Math.max(0, deadline - Date.now());
    onTick?.(remaining);
    if (remaining <= 0) {
      stop();
      onEnd?.();
    }
  };

  const id = setInterval(tick, 200);
  const onVisible = () => document.visibilityState === 'visible' && tick();
  document.addEventListener('visibilitychange', onVisible);

  function stop() {
    stopped = true;
    clearInterval(id);
    document.removeEventListener('visibilitychange', onVisible);
  }

  tick();
  return { stop, remaining: () => Math.max(0, deadline - Date.now()) };
}

/** Simple elapsed-time ticker (used by untimed tests). */
export function stopwatch(onTick) {
  const start = Date.now();
  const id = setInterval(() => onTick(Date.now() - start), 500);
  onTick(0);
  return { stop: () => clearInterval(id), elapsed: () => Date.now() - start };
}
