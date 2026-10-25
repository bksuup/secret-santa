// Shared by the browser (index.html) and the local setup script (setup.js).
//
// Flow: each participant runs join() in their browser and sends the organiser the join code.
// The organiser runs draw() on all codes. Each receiver's name is locked with the giver's
// public key, so only the giver's password (which the organiser never sees) can open it.
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const RSA = { name: "RSA-OAEP", hash: "SHA-256" };

export const normalise = (name) => name.trim().toLowerCase();

async function key(password, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(password, salt), enc.encode(text));
  return { salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

// Throws if the password is wrong (AES-GCM authentication fails).
export async function decrypt({ salt, iv, ct }, password) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(password, unb64(salt)), unb64(ct));
  return dec.decode(pt);
}

// Participant, in the browser: a fresh password (shown only to them) and a join code for the organiser.
export async function join(name) {
  if (!normalise(name)) throw new Error("Name is required");
  const pw = password();
  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    { ...RSA, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ["encrypt", "decrypt"]);
  const pub = b64(new Uint8Array(await crypto.subtle.exportKey("spki", publicKey)));
  const priv = await encrypt(b64(new Uint8Array(await crypto.subtle.exportKey("pkcs8", privateKey))), pw);
  return { password: pw, code: b64(enc.encode(JSON.stringify({ name: name.trim(), pub, priv }))) };
}

function parseCode(code, i) {
  try {
    const p = JSON.parse(dec.decode(unb64(code.trim())));
    if (typeof p.name === "string" && normalise(p.name) && typeof p.pub === "string" && p.priv?.ct) return p;
  } catch {}
  throw new Error(`Join code ${i + 1} is not valid`);
}

// Organiser, locally: returns the contents of assignments.json. Never exposes the pairings.
export async function draw(codes) {
  const people = codes.map(parseCode);
  if (new Set(people.map((p) => normalise(p.name))).size !== people.length) throw new Error("Names must be unique");
  const data = {};
  // Sorted, because assign() order is the circle and would reveal who gets whom.
  for (const [giver, receiver] of assign(people).sort(([a], [b]) => a.name.localeCompare(b.name))) {
    const pub = await crypto.subtle.importKey("spki", unb64(giver.pub), RSA, false, ["encrypt"]);
    // RSA output is always 256 bytes, so its length doesn't give away the receiver's name.
    const gift = b64(new Uint8Array(await crypto.subtle.encrypt(RSA, pub, enc.encode(receiver.name))));
    data[normalise(giver.name)] = { name: giver.name, priv: giver.priv, gift };
  }
  return data;
}

// Participant, on login: unlock the private key with the password, then the receiver's name.
export async function reveal({ priv, gift }, password) {
  const pkcs8 = unb64(await decrypt(priv, password));
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, RSA, false, ["decrypt"]);
  return dec.decode(await crypto.subtle.decrypt(RSA, key, unb64(gift)));
}

// Shuffle, then each person gives to the next one in the circle: nobody can get themselves.
// shortcut: always one big circle (no small loops like A<->B), fine for a family draw.
export function assign(names) {
  if (names.length < 2) throw new Error("Need at least 2 participants");
  const a = [...names];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.map((giver, i) => [giver, a[(i + 1) % a.length]]);
}

// 32-letter alphabet without look-alikes (0/O, 1/l/I), so `byte % 32` has no bias.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789-";
export const password = (len = 12) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)), (b) => ALPHABET[b % 32]).join("");
