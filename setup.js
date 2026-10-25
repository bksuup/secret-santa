// Run locally: node setup.js, then enter names comma-separated (e.g. Anna, John Smith, Kari).
// Writes data/assignments.json (encrypted, safe to publish) and prints each person's password.
// The pairings themselves are never printed.
import { mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { assign, encrypt, normalise, password } from "./santa.js";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const names = (await rl.question("Participants (comma-separated): ")).split(",").map((n) => n.trim()).filter(Boolean);
rl.close();
if (new Set(names.map(normalise)).size !== names.length) throw new Error("Names must be unique");

const data = {};
const logins = [];
// Sorted, because assign() order is the circle and would reveal who gets whom.
for (const [giver, receiver] of assign(names).sort(([a], [b]) => a.localeCompare(b))) {
  const pw = password();
  data[normalise(giver)] = { name: giver, ...(await encrypt(receiver, pw)) };
  logins.push(`${giver} (username: ${normalise(giver)}): ${pw}`);
}

mkdirSync("data", { recursive: true });
writeFileSync("data/assignments.json", JSON.stringify(data, null, 2));
console.log("Wrote data/assignments.json. Send each person their password:\n" + logins.join("\n"));
