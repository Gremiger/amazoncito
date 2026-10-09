import { test } from "node:test";
import assert from "node:assert/strict";
import { createQueue } from "../lib/queue.js";

const tick = () => new Promise((r) => setTimeout(r, 5));

test("respeta concurrencia", async () => {
  const q = createQueue({ concurrency: 2 });
  let running = 0, max = 0;
  const job = async () => { running++; max = Math.max(max, running); await tick(); running--; return 1; };
  await Promise.all(["a", "b", "c", "d", "e"].map((k) => q.run(k, job)));
  assert.equal(max, 2);
});

test("deduplica por key en vuelo", async () => {
  const q = createQueue({ concurrency: 2 });
  let calls = 0;
  const job = async () => { calls++; await tick(); return calls; };
  const [a, b] = await Promise.all([q.run("x", job), q.run("x", job)]);
  assert.equal(calls, 1);
  assert.equal(a, b);
});

test("pausa difiere trabajos nuevos", async () => {
  const q = createQueue({ concurrency: 1 });
  q.pause(40);
  const t0 = Date.now();
  await q.run("k", async () => 1);
  assert.ok(Date.now() - t0 >= 35);
});

test("error se propaga y libera la key", async () => {
  const q = createQueue({ concurrency: 1 });
  await assert.rejects(q.run("k", async () => { throw new Error("boom"); }), /boom/);
  assert.equal(await q.run("k", async () => 2), 2);
});
