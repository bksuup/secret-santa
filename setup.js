// Run locally: node setup.js joins.txt
// joins.txt holds one join code per line, as sent by each participant from the website.
// Writes assignments.json (safe to publish). The pairings are never printed, and the
// organiser never has anyone's password, so they can't look them up either.
import { readFileSync, writeFileSync } from "node:fs";
import { draw } from "./santa.js";

if (!process.argv[2]) throw new Error("Usage: node setup.js joins.txt");
const codes = readFileSync(process.argv[2], "utf8").split("\n").filter((l) => l.trim());
const data = await draw(codes);

writeFileSync("assignments.json", JSON.stringify(data, null, 2));
console.log(`Wrote assignments.json for ${codes.length} people: ${Object.values(data).map((p) => p.name).join(", ")}`);
