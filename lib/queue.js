export function createQueue({ concurrency }) {
  const inflight = new Map();
  const waiting = [];
  let active = 0;
  let pausedUntil = 0;

  const pump = () => {
    while (active < concurrency && waiting.length) {
      const delay = pausedUntil - Date.now();
      if (delay > 0) { setTimeout(pump, delay); return; }
      const { fn, resolve, reject } = waiting.shift();
      active++;
      fn().then(resolve, reject).finally(() => { active--; pump(); });
    }
  };

  return {
    run(key, fn) {
      if (inflight.has(key)) return inflight.get(key);
      const p = new Promise((resolve, reject) => waiting.push({ fn, resolve, reject }))
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
      pump();
      return p;
    },
    pause(ms) { pausedUntil = Math.max(pausedUntil, Date.now() + ms); },
    get pausedUntil() { return pausedUntil; },
  };
}
