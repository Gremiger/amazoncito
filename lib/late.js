// Espera `promise` hasta `ms`. Si no llegó, devuelve null y, cuando llegue un valor, llama a onLate.
export function raceWithLate(promise, ms, onLate) {
  let settled = false;
  const safe = promise.catch(() => null);
  safe.then((v) => { if (settled && v != null) onLate(v); });
  return Promise.race([
    safe,
    new Promise((r) => setTimeout(() => { settled = true; r(null); }, ms)),
  ]);
}
