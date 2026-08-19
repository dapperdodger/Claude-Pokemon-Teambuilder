# Team: Sand / Trick Room / Tailwind Hybrid (Tyranitar-Mega + Excadrill core)

**Status:** Finalized
**Built for:** Ladder — user brought a pre-built six, this session covered matchup verification and SP-spread optimization
**Regulation:** M-B (as of `reference/vgc_current_regulation.md`'s 2026-07-09 last-verified date)
**Last updated:** 2026-07-17

## The six

| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |
|---|---|---|---|---|---|
| Excadrill (Ground/Steel) | Focus Sash | Sand Rush | Adamant | Atk 32 / HP 32 / Def 2 | High Horsepower / Protect / Rock Slide / Iron Head |
| Mega Tyranitar (Rock/Dark) | Tyranitarite | Sand Stream (fixed on Mega) | Adamant | Atk 32 / HP 31 / Def 3 | Knock Off / Low Kick / Protect / Rock Slide |
| Sinistcha (Grass/Ghost) | Sitrus Berry | Hospitality | Relaxed | HP 32 / Def 14 / SpD 20 | Matcha Gotcha / Rage Powder / Trick Room / Protect |
| Milotic (Water) | Leftovers | Competitive | Modest | SpA 30 / SpD 32 / HP 4 | Scald / Ice Beam / Icy Wind / Protect |
| Gholdengo (Steel/Ghost) | Life Orb | Good as Gold | Modest | SpA 32 / SpD 26 / HP 8 | Make It Rain / Nasty Plot / Shadow Ball / Protect |
| Mega Staraptor (Fighting/Flying) | Staraptite | Contrary (fixed on Mega — see below) | Jolly | Atk 32 / HP 13 / SpD 21 | Brave Bird / Close Combat / Tailwind / Protect |

(SP allocation uses the current Champions Stat Points system, 66 total per
Pokémon, hard-capped at 32 in any single stat — see
`reference/vgc_current_regulation.md`'s "Stat system" section.)

## Why these six

**This core is a near-match for a real, verified top archetype**: Pikalytics'
`/team-usage` page lists **Tyranitar-Mega / Excadrill / Incineroar / Sinistcha
/ Sylveon / Staraptor-Mega** at a 65.33% win rate (49-26 record, 9 teams) —
this build swaps Milotic and Gholdengo in for Incineroar and Sylveon, but the
sand-into-Trick-Room-into-Tailwind chassis is real and already proven, not a
theorycrafted structure.

**Mega Tyranitar** — sets Sand (enables Excadrill's Sand Rush and its own
Sand Stream SpD boost), and the real bulk workhorse of the team. Verified via
`optimize-bulk.js` (rank mode) that Atk 32 / HP 31 / Def 3 survives all four
tracked real threats (Garchomp Earthquake, Sylveon Hyper Voice, Whimsicott
Moonblast, Kingambit Iron Head) with 27-50% HP left — the Sand Stream SpD
boost specifically is what makes it comfortably tank Sylveon's real, common
Hyper Voice (92-110 damage) rather than the much scarier 138-164 it takes
with no weather accounted for.

**Excadrill** — the team's Sand Rush sweeper, doubling to ~216 effective
Speed under its own team's Sand (comfortably clears the real threat list,
including Scarf Basculegion). Its bulk allocation is genuinely unconstrained,
verified rather than assumed: `optimize-bulk.js` solve mode against
Kingambit's Kowtow Cleave (its only real, *survivable* named threat) returns
**minTotal: 0** — base bulk already survives it (148-175 damage vs. 185 HP,
~5% left) with zero extra SP, so there's no breakpoint to spend up to. Its
two genuinely dangerous threats (Garchomp's Earthquake, Scarf Basculegion's
Wave Crash — both 2x its Ground/Steel typing) are unconditionally lethal at
*any* HP/Def/SpD split per the same tool (`solvable: false`), so bulk
investment buys nothing against them either. With no breakpoint on either
end, the leftover 34 SP (after Atk 32) is a free allocation, not a solved
one — Focus Sash (74.4% real usage) is what actually keeps it alive for one
real hit per game regardless of spread, and the leftover SP is dumped into
HP/Def (32/2, capped at the 32/stat limit) purely as a generic buffer against
the wider metagame beyond these three named threats. Kept **High Horsepower
over the more common Earthquake** (63.7% real usage) deliberately: Earthquake
is stronger and more common, but as a spread move it would also hit
Tyranitar-Mega; since neither move changes the "dies to Garchomp/Basculegion
regardless" finding, this is a real ally-safety tradeoff, not an error.

**Sinistcha** — Trick Room setter and secondary redirector (Rage Powder),
same real, high-usage pick (32%+ usage in prior-session research) as the
team's other saved build. Relaxed nature (kept as given, not swapped to Calm)
does double duty: lowers Speed (helps go first once Trick Room is up) and
boosts physical Def, which matters because one of its two unconditional
death threats (Kingambit's Kowtow Cleave) is physical. HP 32 / Def 14 / SpD
20 survives its real secondary threats (Garchomp Dragon Claw, Sylveon Hyper
Voice) at ~46-49% HP left.

**Milotic** — the team's dedicated Garchomp answer. Real calc: **Ice Beam
does 216-256 to Garchomp's ~215 max realistic HP — a near-guaranteed OHKO on
the single most-played Pokémon in the current format** (anchor of the most
common 2-mon core at 19.5% of teams). This is why Ice Beam/Icy Wind was kept
over the more common real Milotic build (Scald/Protect/Recover/Muddy Water,
a bulkier attrition set) — it trades some longevity for a hard answer to the
format's most common threat. SpA 32 / SpD 32 / HP 2 survives Whimsicott
Moonblast and Sylveon Hyper Voice comfortably (62-65% HP left), but is
unconditionally OHKO'd by Archaludon's Electro Shot regardless of spread —
a real, accepted gap (see below), not something SP can patch.

**Gholdengo** — the team's Nasty Plot special breaker. Real threat: this is
the team's most exposed member. `optimize-bulk.js` confirmed **three
separate unconditional OHKOs** — Charizard-Y's Sun Heat Wave, Kingambit's
Kowtow Cleave, and Garchomp's Earthquake — against three of the most
commonly-played Pokémon in the format. It also can't trade back into
Kingambit (Shadow Ball is quad-resisted, only 57-68 damage). SpA 32 / SpD 26
/ HP 8 is the best available leftover allocation against what it *can*
survive (Sylveon, Whimsicott, ~75-77% HP left) — there's no spread that
meaningfully changes its exposure to the top-3 threats above.

**Mega Staraptor** — real correction made this session: Mega Staraptor is
**Fighting/Flying** (not Normal/Flying) with a **fixed Contrary ability**
(not Intimidate — Intimidate only fires on the initial pre-Mega switch-in,
then locks to Contrary once Mega Evolved, the same "pre-Mega ability split"
trap already documented for Mega Swampert). Confirmed via the vendored
Champions dex directly (`"Mega Staraptor": { "ab": "Contrary", "t1":
"Fighting", "t2": "Flying" }`) and cross-checked against an independent
article. Contrary turns Close Combat's own Def/SpD drop into a buff, and the
real payoff for this team specifically: **Close Combat does 372-444 to
Kingambit** (max ~207 HP) — a clean OHKO on the exact threat that
unconditionally kills both Gholdengo and Sinistcha. Tailwind was kept
(user's call) even though real usage barely runs it (Close Combat/Protect/
Brave Bird/Roost is the near-universal real set) — this team already has
Trick Room and Sand Rush covering its fast/slow modes, so Tailwind isn't
load-bearing, but it's a legitimate extra tool. The retype does cost real
defensive coverage: Fairy and Electric are now both 2x weaknesses (were
neutral pre-Mega), and `optimize-bulk.js` confirmed Sylveon's Hyper Voice
and Archaludon's Electro Shot both OHKO regardless of spread. Atk 32 / HP 13
/ SpD 21 is the best available spread against what's survivable (Whimsicott
Moonblast, Kingambit Sucker Punch).

## Intentional exclusions

- **Incineroar and Sylveon** — the real archetype this team is based on
  (`/team-usage`'s 65.33%-winrate Tyranitar-Mega/Excadrill/Incineroar/
  Sinistcha/Sylveon/Staraptor-Mega) runs these two; this build swaps in
  Milotic and Gholdengo instead. Not independently re-verified this session
  which is strictly better — noted here as a real, deliberate deviation from
  a proven archetype, not a mistake.

## Known weaknesses / open questions

- **Gholdengo and Sinistcha are both unconditionally OHKO'd by Charizard-Y's
  Sun Heat Wave and Kingambit's Kowtow Cleave**, regardless of SP spread
  (confirmed via `optimize-bulk.js` solve mode, `solvable: false`).
  Gholdengo additionally dies unconditionally to Garchomp's Earthquake. All
  three are among the most commonly-played Pokémon in the format — this is
  a real structural exposure, not a spread-fixable gap. See "Bring-6-pick-4
  notes" for how this shapes team-sheet decisions.
- **Mega Staraptor is unconditionally OHKO'd by Sylveon's Hyper Voice and
  Archaludon's Electro Shot** — a direct cost of the Mega's Fighting/Flying
  retype picking up fresh Fairy/Electric weaknesses that base Staraptor
  didn't have.
- **Milotic is unconditionally OHKO'd by Archaludon's Electro Shot.**
- **Excadrill is unconditionally OHKO'd by Garchomp's Earthquake and Scarf
  Basculegion's Wave Crash** (both 2x its Ground/Steel typing) — Focus Sash
  covers the first instance per game, but not a second hit or prior chip.
- Not yet tested: Mega Swampert under Rain (Wave Crash massively overkills
  Excadrill specifically — 564-666 vs. its ~217 max HP — and Rain overrides
  Sand, so Excadrill also loses its Speed doubling in that matchup).
  Archaludon/Pelipper Rain cores are real (15% of teams run Archaludon/
  Pelipper together) and this team doesn't have a clean answer worked out.
- Not yet tested against an opposing Trick Room team (mirror-TR
  interactions).

## Bring-6-pick-4 notes

- **Default/Sand line**: Mega Tyranitar + Excadrill + Mega Staraptor +
  (Gholdengo or Sinistcha, whichever the matchup favors). Sand-into-sweep
  with Staraptor's Kingambit answer and Tailwind as backup speed control.
- **vs. a scouted Charizard-Y or Kingambit**: bench *both* Gholdengo and
  Sinistcha — each dies to one or both of those unconditionally. Bring Mega
  Tyranitar + Excadrill + Milotic + Mega Staraptor instead; Milotic still
  answers Garchomp if it's also present, and Staraptor's Close Combat
  answers Kingambit directly.
- **vs. a scouted Archaludon/Pelipper Rain core**: both Milotic and Mega
  Staraptor die unconditionally to Archaludon's Electro Shot — lean on
  Gholdengo/Sinistcha instead here, accepting their own Charizard-Y/Kingambit
  exposure isn't relevant if neither is on that particular team.
- Mega Tyranitar and Excadrill are the flex pieces common to every line —
  the Sand engine doesn't depend on which second half is brought.

## Changelog

| Date | Change | Reasoning |
|---|---|---|
| 2026-07-17 | Initial save. User brought a pre-built six; this session corrected Mega Staraptor's ability (Contrary, not Intimidate — Intimidate is only the pre-Mega switch-in ability) and typing (Fighting/Flying, not Normal/Flying), pulled real current threat data via Pikalytics topteams/team-usage/pokedex-cores, ran real damage-calc matchups against the top ~8 threats, and solved SP spreads via `optimize-bulk.js`. Found three unconditional (spread-proof) OHKO threats against Gholdengo and two each against Sinistcha/Staraptor/Milotic/Excadrill — see "Known weaknesses" | Pikalytics (topteams/team-usage/pokedex live fetches), vendored Champions pokedex.js (Mega Staraptor ability/type), tools/damage-calc/cli.js and optimize-bulk-cli.js runs this session |
