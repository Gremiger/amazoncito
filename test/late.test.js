import { test } from "node:test";
import assert from "node:assert/strict";
import { raceWithLate } from "../lib/late.js";

const after = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));

test("si llega a tiempo devuelve el valor y no llama a onLate", async () => {
  let late = null;
  assert.equal(await raceWithLate(after(5, 1), 50, (v) => { late = v; }), 1);
  await after(20);
  assert.equal(late, null);
});

test("si tarda devuelve null y después llama a onLate con el valor", async () => {
  let late = null;
  assert.equal(await raceWithLate(after(40, 2), 5, (v) => { late = v; }), null);
  await after(60);
  assert.equal(late, 2);
});

test("si tarda y termina en null o error no llama a onLate", async () => {
  let calls = 0;
  await raceWithLate(after(20, null), 5, () => calls++);
  await raceWithLate(after(20).then(() => { throw new Error("x"); }), 5, () => calls++);
  await after(40);
  assert.equal(calls, 0);
});
