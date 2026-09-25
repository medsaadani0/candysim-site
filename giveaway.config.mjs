// CandySim giveaway settings. This one file drives the giveaway page, the entry
// API and the homepage link. Edit it, run `python3 build.py`, and deploy.
//
// Player facing text: no hyphens or dashes (house style).
export default {
  // Entries are stored per id. Give a new giveaway a new id to start fresh.
  id: "website-launch-2026",

  // false: the page works as a private preview, entries are closed and the
  // homepage does not link to it. true: entries open until endsAt.
  live: false,
  // While live, link the giveaway from the homepage nav and hero.
  promote: true,

  kicker: "CandySim website launch",
  title: "Website Launch Giveaway",
  intro: "The new CandySim website is live. We're celebrating with a giveaway, and one player takes the prize.",

  // PLACEHOLDERS: set the real prize before going live.
  prize: "Prize to be announced",
  prizeDetail: "The prize is revealed here before entries open.",
  winners: 1,

  // When entries close, in UTC. Visitors see it in their own time zone.
  endsAt: "2026-10-09T20:00:00Z",

  rules: [
    "One entry per Minecraft account and per Discord account.",
    "Type your Minecraft username exactly, so the prize reaches the right account.",
    "Entries using fake names or alt accounts can be removed.",
    "The winner is chosen by the CandySim team after entries close.",
  ],
  announcement: "The winner will be announced in the CandySim Discord.",

  // Anti abuse. Entries allowed from one network (one IP address), so a single
  // person cannot flood the list. Households share an address, so keep this above 1.
  maxEntriesPerNetwork: 5,
  // Rejected as a whole name, ignoring case, underscores, dots and trailing digits.
  reservedNames: ["test", "tester", "testing", "admin", "administrator", "owner", "moderator", "staff",
    "console", "server", "candysim", "null", "undefined", "username", "minecraft", "discord", "example"],
  // Rejected anywhere inside a name (also catches 1→i, 0→o style swaps).
  blockedWords: ["nigga", "nigger", "faggot"],
};
