// Run: node --test
import test from "node:test";
import assert from "node:assert/strict";
import { assign, decrypt, encrypt, password } from "./santa.js";

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
