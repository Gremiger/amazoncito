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
    // Con `reason`, los trabajos que todavía no arrancaron se rechazan con ese error.
    pause(ms, reason) {
      pausedUntil = Math.max(pausedUntil, Date.now() + ms);
      if (reason) for (const w of waiting.splice(0)) w.reject(reason);
    },
    get pausedUntil() { return pausedUntil; },
  };
}
