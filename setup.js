// Run locally: node setup.js Anna Erik Ola Kari
// Writes assignments.json (encrypted, safe to publish) and prints each person's password.
// The pairings themselves are never printed.
import { writeFileSync } from "node:fs";
import { assign, encrypt, normalise, password } from "./santa.js";

const names = process.argv.slice(2);
if (new Set(names.map(normalise)).size !== names.length) throw new Error("Names must be unique");

const data = {};
const logins = [];
// Sorted, because assign() order is the circle and would reveal who gets whom.
for (const [giver, receiver] of assign(names).sort(([a], [b]) => a.localeCompare(b))) {
  const pw = password();
  data[normalise(giver)] = { name: giver, ...(await encrypt(receiver, pw)) };
  logins.push(`${giver}: ${pw}`);
}

writeFileSync("assignments.json", JSON.stringify(data, null, 2));
console.log("Wrote assignments.json. Send each person their password:\n" + logins.join("\n"));
