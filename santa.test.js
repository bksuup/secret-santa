// Run: node --test
import test from "node:test";
import assert from "node:assert/strict";
import { assign, decrypt, draw, encrypt, join, password, reveal } from "./santa.js";

test("nobody gets themselves and everyone receives once", () => {
  for (let n = 2; n < 12; n++) {
    const names = Array.from({ length: n }, (_, i) => `p${i}`);
    const pairs = assign(names);
    assert.ok(pairs.every(([g, r]) => g !== r));
    assert.deepEqual(pairs.map(([, r]) => r).sort(), [...names].sort());
  }
});

test("encrypt/decrypt round trip, wrong password fails", async () => {
  const pw = password();
  const box = await encrypt("Erik", pw);
  assert.equal(await decrypt(box, pw), "Erik");
  await assert.rejects(decrypt(box, password()));
});

test("join -> draw -> reveal, and the published file leaks nothing", async () => {
  const names = ["Bk", "Hamza", "dennis", "seb"];
  const joins = await Promise.all(names.map(join));
  const data = await draw(joins.map((j) => j.code));

  const got = [];
  for (const [i, name] of names.entries()) {
    const entry = data[name.toLowerCase()];
    const receiver = await reveal(entry, joins[i].password);
    assert.notEqual(receiver, name);
    got.push(receiver);
    await assert.rejects(reveal(entry, joins[(i + 1) % 4].password));
  }
  assert.deepEqual(got.sort(), [...names].sort());

  // Same size for every receiver, so name length can't give the pairing away.
  assert.equal(new Set(Object.values(data).map((e) => e.gift.length)).size, 1);
  // Keys sorted by name, not in draw-circle order.
  assert.deepEqual(Object.keys(data), ["bk", "dennis", "hamza", "seb"]);
});

test("draw rejects duplicate names and bad codes", async () => {
  const [a, b] = await Promise.all(["Anna", " anna "].map(join));
  await assert.rejects(draw([a.code, b.code]), /unique/);
  await assert.rejects(draw([a.code, "garbage"]), /Join code 2/);
  await assert.rejects(join("  "), /required/);
});
