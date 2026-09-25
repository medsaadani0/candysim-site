// Shared by the giveaway functions: storage, validation and small helpers.
//
// Storage is one Netlify Blobs store per giveaway id. Every entry is its own
// set of keys, so two people entering at once never overwrite each other:
//   mc/<minecraft, lowercase>   the entry itself {mc, dc, at, net}   (the source of truth)
//   dc/<discord, lowercase>     which Minecraft name holds this Discord username
//   pub/<Minecraft as typed>    marker, listed for the public participant list
//   net/<network hash>/<mc>     marker, counts entries per network
// The mc/ and dc/ keys are written with onlyIfNew, so duplicates are refused
// by the store itself, not by a check that could race.
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import config from "../../giveaway.config.mjs";

export { config };

export function store() {
  return getStore({ name: `giveaway-${config.id}`, consistency: "strong" });
}

export function state(now = Date.now()) {
  if (!config.live) return "preview";
  return now >= Date.parse(config.endsAt) ? "ended" : "active";
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-content-type-options": "nosniff", "cache-control": "no-store", ...headers },
  });
}

export function fail(status, code, message, field) {
  return json({ ok: false, error: code, message, ...(field ? { field } : {}) }, status);
}

/* Names */
const MC = /^[A-Za-z0-9_]{3,16}$/;                      // Java Edition usernames
const DC = /^(?!.*\.\.)[a-z0-9_.]{2,32}$/;              // Discord usernames (the new, lowercase kind)
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", 9: "g", "@": "a", $: "s", "!": "i", "|": "i" };

export function clean(v) {
  return typeof v === "string" ? v.normalize("NFKC").trim() : "";
}
export function normDiscord(v) {
  return clean(v).replace(/^@/, "").toLowerCase();
}

function blocked(name) {
  const lower = name.toLowerCase();
  const bare = lower.replace(/[_.]/g, "");
  const noDigits = bare.replace(/\d+$/, "");
  if (config.reservedNames.some(r => r === bare || r === noDigits)) return true;
  const squashed = [...lower].map(c => LEET[c] ?? c).join("").replace(/[^a-z]/g, "");
  return config.blockedWords.some(w => squashed.includes(w));
}

// Returns null when both names are fine, else [field, code, message].
export function validate(mc, dc) {
  if (!mc) return ["mc", "mc_empty", "Enter your Minecraft username."];
  if (!MC.test(mc)) return ["mc", "mc_invalid", "That Minecraft username is not valid. Use 3 to 16 letters, numbers or underscores."];
  if (blocked(mc)) return ["mc", "mc_blocked", "That Minecraft username can't enter this giveaway."];
  if (!dc) return ["dc", "dc_empty", "Enter your Discord username."];
  if (!DC.test(dc)) return ["dc", "dc_invalid", "That Discord username is not valid. Use 2 to 32 letters, numbers, underscores or dots."];
  if (blocked(dc)) return ["dc", "dc_blocked", "That Discord username can't enter this giveaway."];
  return null;
}

/* Networks: entries remember a salted hash of the IP address, never the address. */
let salt = process.env.GIVEAWAY_SALT || null;
export async function networkId(s, ip) {
  if (!salt) {
    await s.set("meta/salt", randomBytes(24).toString("hex"), { onlyIfNew: true });
    salt = await s.get("meta/salt");
  }
  return createHash("sha256").update(`${salt}:${ip || "unknown"}`).digest("hex").slice(0, 16);
}

// Simple fixed window counters. Not atomic, which is fine for slowing down scripts.
export async function overLimit(s, key, max, windowMs) {
  const cur = await s.get(key, { type: "json" }).catch(() => null);
  return !!cur && Date.now() - cur.t <= windowMs && cur.n >= max;
}
export async function count(s, key, windowMs) {
  const now = Date.now();
  const cur = await s.get(key, { type: "json" }).catch(() => null);
  await s.setJSON(key, !cur || now - cur.t > windowMs ? { t: now, n: 1 } : { t: cur.t, n: cur.n + 1 });
}

export async function listKeys(s, prefix) {
  const { blobs } = await s.list({ prefix });
  return blobs.map(b => b.key.slice(prefix.length));
}

export async function publicNames(s) {
  return (await listKeys(s, "pub/")).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/* Admin */
export function adminKeyConfigured() {
  return (process.env.GIVEAWAY_ADMIN_KEY || "").length >= 16;
}
export function adminKeyMatches(given) {
  const a = createHash("sha256").update(String(given || "")).digest();
  const b = createHash("sha256").update(process.env.GIVEAWAY_ADMIN_KEY || "").digest();
  return timingSafeEqual(a, b);
}

export async function removeEntry(s, mcLower) {
  const e = await s.get(`mc/${mcLower}`, { type: "json" });
  if (!e) return false;
  await Promise.all([
    s.delete(`pub/${e.mc}`),
    s.delete(`dc/${e.dc}`),
    e.net ? s.delete(`net/${e.net}/${mcLower}`) : null,
  ]);
  await s.delete(`mc/${mcLower}`);
  return true;
}
