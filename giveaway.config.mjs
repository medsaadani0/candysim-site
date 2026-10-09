// CandySim giveaway settings. This one file drives the giveaway page, the entry
// API and the homepage link. Edit it, run `python3 build.py`, and deploy.
//
// Player facing text: no hyphens or dashes (house style).
export default {
  // Entries are stored per id. Give a new giveaway a new id to start fresh.
  id: "aquarium-slots-oct-2026",

  // false: the page works as a private preview, entries are closed and the
  // homepage does not link to it. true: entries open until endsAt.
  live: true,
  // While live, link the giveaway from the homepage nav and hero.
  promote: true,

  kicker: "CandySim giveaway",
  title: "Aquarium Giveaway",
  intro: "The newest gamepass is up for grabs. One winner gets +2 Aquarium Slots, room for 2 more fish, forever.",

  prize: "+2 Aquarium Slots",
  // A short line under the prize name, and a small teaser after it.
  prizeTease: "The newest gamepass, worth 1,200 Gems",
  prizeTeaseSmall: "",
  prizeDetail: "A permanent gamepass: your aquarium gets 2 extra slots on top of the normal 10, so you can keep 2 more fish.",
  // Optional list shown as chips on the prize card.
  prizeItems: [],
  // Optional picture shown above the prize name (pixel art is scaled up sharp).
  prizeImage: "",
  prizeImageAlt: "",
  winners: 1,

  // When entries close, in UTC. Visitors see it in their own time zone.
  endsAt: "2026-10-11T06:00:00Z",

  rules: [
    "One entry per Minecraft account and per Discord account.",
    "Type your Minecraft username exactly, so the prize reaches the right account. Prizes are given out on the Season 3 release.",
    "Entries using fake names or alt accounts can be removed.",
    "The winner is drawn at random from all entries after entries close.",
  ],
  announcement: "The winner will be announced in the CandySim Discord.",

  // After entries close: the Minecraft names of the winners, exactly as they
  // entered. Once filled in, the prize card shows them and the intro and note
  // below switch to the texts here. Leave empty until you have picked them.
  winnerNames: [],
  // Optional, one per winner: what that winner got, shown on their card instead of the prize name.
  winnerPrizes: [],
  winnersIntro: "Entries are closed and the winner is in. Congratulations!",
  winnersNote: "The winner has been announced in the CandySim Discord.",

  // Anti abuse. Entries allowed from one network (one IP address), so a single
  // person cannot flood the list. Households share an address, so keep this above 1.
  maxEntriesPerNetwork: 5,
  // Rejected as a whole name, ignoring case, underscores, dots and trailing digits.
  reservedNames: ["test", "tester", "testing", "admin", "administrator", "owner", "moderator", "staff",
    "console", "server", "candysim", "null", "undefined", "username", "minecraft", "discord", "example"],
  // Rejected anywhere inside a name (also catches 1→i, 0→o style swaps).
  blockedWords: ["nigga", "nigger", "faggot"],
};
