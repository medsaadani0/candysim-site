// Owner only. Needs the GIVEAWAY_ADMIN_KEY environment variable (Netlify site
// settings), sent as "Authorization: Bearer <key>" by /giveaway/admin/.
//   GET    /api/giveaway/admin            every entry with its Discord username and time
//   DELETE /api/giveaway/admin?mc=<name>  removes one entry
import { adminKeyConfigured, adminKeyMatches, config as giveaway, count, fail, json, overLimit, listKeys, networkId, removeEntry, state, store } from "../giveaway/core.mjs";

export default async (req, context) => {
  if (!adminKeyConfigured()) return fail(503, "not_configured", "Set GIVEAWAY_ADMIN_KEY (16 characters or more) in the Netlify environment variables, then redeploy.");
  const s = store();
  const net = await networkId(s, context.ip);
  const key = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  // Wrong keys are counted per network and checked before the key, so it cannot be guessed at speed.
  const rl = `rl/admin/${net}`, span = 15 * 60 * 1000;
  if (await overLimit(s, rl, 8, span)) return fail(429, "rate", "Too many wrong keys. Try again in 15 minutes.");
  if (!adminKeyMatches(key)) {
    await count(s, rl, span);
    await new Promise(r => setTimeout(r, 400));
    return fail(401, "key", "That key is not right.");
  }

  if (req.method === "GET") {
    const keys = await listKeys(s, "mc/");
    const entries = [];
    for (let i = 0; i < keys.length; i += 50) {
      const batch = await Promise.all(keys.slice(i, i + 50).map(k => s.get(`mc/${k}`, { type: "json" })));
      entries.push(...batch.filter(Boolean));
    }
    // How many entries share each network, so alts are easy to spot. The hash itself stays private.
    const perNet = {};
    entries.forEach(e => { perNet[e.net] = (perNet[e.net] || 0) + 1; });
    const nets = Object.keys(perNet).filter(n => perNet[n] > 1);
    const out = entries
      .map(e => ({ mc: e.mc, dc: e.dc, at: e.at, shared: perNet[e.net] > 1 ? { group: nets.indexOf(e.net) + 1, size: perNet[e.net] } : null }))
      .sort((a, b) => a.at.localeCompare(b.at));
    return json({ ok: true, id: giveaway.id, state: state(), endsAt: giveaway.endsAt, winners: giveaway.winners, count: out.length, entries: out });
  }
  if (req.method === "DELETE") {
    const mc = new URL(req.url).searchParams.get("mc") || "";
    if (!/^[A-Za-z0-9_]{1,16}$/.test(mc)) return fail(400, "mc", "No entry named.");
    const removed = await removeEntry(s, mc.toLowerCase());
    return removed ? json({ ok: true, removed: mc }) : fail(404, "missing", "No entry with that username.");
  }
  return fail(405, "method", "Not allowed.");
};

export const config = { path: "/api/giveaway/admin" };
