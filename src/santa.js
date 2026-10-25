// Shared by the browser (index.html) and the local setup script (setup.js).
const enc = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// Username: "John Smith" -> "john_smith". Used for both setup and login, so they always match.
export const normalise = (name) => name.trim().toLowerCase().replace(/\s+/g, "_");

async function key(password, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

// Every plaintext is zero-padded to SIZE bytes, so the public ciphertext length can't hint at the name.
const SIZE = 64;

export async function encrypt(text, password) {
  const bytes = enc.encode(text);
  if (bytes.length > SIZE) throw new Error(`Name longer than ${SIZE} bytes: ${text}`);
  const padded = new Uint8Array(SIZE);
  padded.set(bytes);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(password, salt), padded);
  return { salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

// Throws if the password is wrong (AES-GCM authentication fails).
export async function decrypt({ salt, iv, ct }, password) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(password, unb64(salt)), unb64(ct));
  return new TextDecoder().decode(pt).replace(/\0+$/, "");
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
