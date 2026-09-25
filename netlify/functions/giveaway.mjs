// Public giveaway API.
//   GET  /api/giveaway   state, participant count and public Minecraft names
//   POST /api/giveaway   {mc, dc} enters the giveaway
import { clean, config as giveaway, count, fail, json, overLimit, networkId, normDiscord, publicNames, state, store, validate, listKeys } from "../giveaway/core.mjs";

export default async (req, context) => {
  const s = store();
  if (req.method === "GET") {
    const names = await publicNames(s);
    return json({ ok: true, id: giveaway.id, state: state(), endsAt: giveaway.endsAt, count: names.length, names }, 200, {
      "cache-control": "public, max-age=0, must-revalidate",
      "netlify-cdn-cache-control": "public, s-maxage=10, stale-while-revalidate=30",
    });
  }
  if (req.method !== "POST") return fail(405, "method", "Not allowed.");

  const origin = req.headers.get("origin");
  if (origin && !sameHost(origin, req.url)) return fail(403, "origin", "Entries are only accepted from the CandySim website.");
  const st = state();
  if (st === "preview") return fail(403, "closed", "The giveaway is not open yet.");
  if (st === "ended") return fail(403, "ended", "This giveaway has ended.");

  const raw = await req.text();
  if (raw.length > 2000) return fail(413, "size", "That request is too large.");
  let body;
  try { body = JSON.parse(raw); } catch { return fail(400, "body", "Something went wrong. Please try again."); }
  if (!body || typeof body !== "object") return fail(400, "body", "Something went wrong. Please try again.");

  const net = await networkId(s, context.ip);
  const rl = `rl/enter/${net}`, span = 10 * 60 * 1000;
  if (await overLimit(s, rl, 15, span)) return fail(429, "rate", "Too many attempts. Wait a few minutes and try again.");
  await count(s, rl, span);
  // A filled hidden field means a bot filled every input it could find.
  if (clean(body.website)) return fail(400, "bot", "Something went wrong. Please try again.");

  const mc = clean(body.mc);
  const dc = normDiscord(body.dc);
  const bad = validate(mc, dc);
  if (bad) return fail(422, bad[1], bad[2], bad[0]);

  const mcKey = mc.toLowerCase();
  if (await s.get(`mc/${mcKey}`)) return fail(409, "mc_taken", "That username has already entered this giveaway.", "mc");
  if (await s.get(`dc/${dc}`)) return fail(409, "dc_taken", "That Discord username has already been used.", "dc");
  if ((await listKeys(s, `net/${net}/`)).length >= giveaway.maxEntriesPerNetwork) {
    return fail(429, "network", "Too many entries have come from your network.");
  }

  // Claim both names. The store refuses a key that already exists, so two
  // requests racing for the same name cannot both win.
  const dcClaim = await s.setJSON(`dc/${dc}`, { mc: mcKey }, { onlyIfNew: true });
  if (!dcClaim.modified) return fail(409, "dc_taken", "That Discord username has already been used.", "dc");
  const entry = { mc, dc, at: new Date().toISOString(), net };
  const mcClaim = await s.setJSON(`mc/${mcKey}`, entry, { onlyIfNew: true });
  if (!mcClaim.modified) {
    await s.delete(`dc/${dc}`);
    return fail(409, "mc_taken", "That username has already entered this giveaway.", "mc");
  }
  await Promise.all([s.set(`pub/${mc}`, "1"), s.set(`net/${net}/${mcKey}`, "1")]);
  const total = (await listKeys(s, "pub/")).length;
  return json({ ok: true, mc, count: total }, 201);
};

export const config = { path: "/api/giveaway" };

function sameHost(origin, url) {
  try { return new URL(origin).host === new URL(url).host; } catch { return false; }
}
