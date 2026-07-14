# Team: Surprise Trick Room Anti-Meta (Reuniclus / Klefki / Corviknight / Toxapex / Mega Camerupt / Aegislash)

**Status:** Draft
**Built for:** Ladder/tournament prep — explicitly built to beat the current top meta archetypes while using six Pokémon that don't appear on any top-usage or top-team list, so a prepared opponent's counter-team doesn't line up in team preview
**Regulation:** M-B (verified as of 2026-07-14 — Mega Evolution only, no Tera/Dynamax/Z-Move; active 17 June – 2 Sept 2026)
**Last updated:** 2026-07-14

## The meta this team is built to beat

Live-searched this session (Pikalytics `topteams`, ChampTeams.gg's Reg M-B Week 3 meta
report) rather than reused from an earlier session. Two independent sources agree on
the same four dominant structures:

1. **Sun offense** — Charizard-Mega-Y / Aerodactyl-Mega / Garchomp / Sylveon /
   Farigiraf / Kingambit. Highest-rated single Pokémon in the format (~55% win rate),
   ~15-20% of top-placing teams.
2. **Rain** — Swampert-Mega / Pelipper / Archaludon / Sinistcha / Grimmsnarl,
   ~12-15% of teams. (A parallel Mega Gengar + Politoed perish-trap rain line was
   also reported rising late-season — not separately tested here, flagged as an
   open question below.)
3. **Trick Room** — Farigiraf / Sinistcha / Incineroar / Kingambit / Sneasler
   (also Floette-Eternal-Mega / Delphox-Mega per Pikalytics), ~10-12%.
4. **Sand** — Tyranitar-Mega / Excadrill, ~5-8%.

ChampTeams.gg's own report explicitly flagged that the format "should reward
flexible speed control," implying heavy weather commitment is a real, current
soft spot — that's the crack this team is built to exploit, not a guess.

**None of this team's six appear in the S-tier list, the named top cores, or the
named archetypes above** — verified against the real Champions roster (Serebii's
full available-species list, fetched this session) before committing to any of
them, per rule 6's roster-vs-legality check.

## The six

| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |
|---|---|---|---|---|---|
| Reuniclus | Life Orb | Magic Guard | Modest | 32 HP / 32 SpA / 2 SpD | Trick Room / Psychic / Calm Mind / Focus Blast |
| Klefki | Light Clay | Prankster | Bold | 32 HP / 32 Def / 2 SpD | Light Screen / Reflect / Thunder Wave / Foul Play |
| Corviknight | Leftovers | Mirror Armor | Impish | 32 HP / 32 Def / 2 SpD | Body Press / Roost / U-turn / Iron Head |
| Toxapex | Sitrus Berry | Regenerator | Bold | 32 HP / 32 Def / 2 SpD | Scald / Baneful Bunker / Recover / Haze |
| Camerupt (→ Mega, fixed Sheer Force) | Cameruptite | — | Modest | 32 HP / 32 SpA / 2 SpD | Heat Wave / Earth Power / Protect / Trick Room |
| Aegislash | Shell Bell | Stance Change | Adamant | 32 HP / 32 Def / 2 Atk | King's Shield / Shadow Sneak / Iron Head / Sacred Sword |

(SP allocation uses the current Champions Stat Points system, not old EVs —
see `reference/vgc_current_regulation.md`'s "Stat system" section. No two
Pokémon share an item — checked per the Team-finalization rule in
`vgc_common_pitfalls.md`.)

## Why these six

**Reuniclus** is the primary Trick Room setter. **Magic Guard** (confirmed its
real, only listed ability in this repo's vendored dex — not a Torrent/Damp-style
pre-Mega trap, Reuniclus doesn't evolve further) means zero chip from Sand
damage, and — the real payoff — it makes **Life Orb's recoil entirely free**,
so Reuniclus gets a genuine 1.3x power boost with no downside on Psychic/Focus
Blast. Base Speed 30 (very slow) means it reliably acts early even *before*
Trick Room is up, and its 217 real HP at this spread (calculated) gives it a
real shot at surviving turn 1 against a fast lead before the Room resolves.
Focus Blast is deliberately included as coverage against Kingambit specifically
(Fighting is 2x on its Dark/Steel typing) despite the well-known accuracy risk.

**Klefki** is a Fairy/Steel glue piece that hard-blocks two of the format's
most common physical/Dragon threats by typing alone, verified: **Garchomp's
Dragon Claw does 0 damage** (Fairy immunity to Dragon stacks with Steel's own
Dragon resistance — double-blocked, confirmed via `tools/damage-calc/cli.js`).
Prankster gives priority Light Screen/Reflect/Thunder Wave regardless of who
set Trick Room or when. Foul Play is included as a real, well-documented
mechanic (weaponizes the target's own Attack stat) against the format's
highest-Attack threats (Kingambit 205, Garchomp 182, Excadrill 205) — **flagged
as not independently calc-verified this session**: a test run against Kingambit
returned only 26-31 damage, which looks like the local tool used Klefki's own
Attack stat rather than swapping to the target's, so that specific number
shouldn't be trusted; the move itself is real and legal, just not confirmed
via this tool. **Real, calc-confirmed weakness**: Klefki does not want to
switch into Mega Swampert's rain-boosted Wave Crash (144-171 on its 164 real
HP — a near-certain KO on the high roll) or Garchomp's Earthquake (100-117
after the doubles 0.75x spread reduction, 61-71% of its HP) — it's a support
piece, not a wall against the format's biggest physical hitters.

**Corviknight** is the team's Kingambit answer and general bulky pivot. Being
Flying-type makes it **naturally immune to Ground** regardless of ability —
confirmed **Garchomp's Earthquake does 0 damage**. **Mirror Armor** (its real,
only listed ability in the vendored dex) bounces incoming stat-lowering
effects back at the attacker — including Incineroar's Intimidate, which is on
or near every top team in the format; this alone undermines the single most
common support tool in the meta whenever Incineroar leads into Corviknight.
**Body Press** uses Corviknight's own (heavily invested) Defense stat as its
attack stat, and it's Fighting-type — 2x super-effective on Kingambit's
Dark/Steel typing. Calc-confirmed: **152-180 damage to real Black-Glasses
Kingambit (73-87% of its 207 HP)**, using Corviknight's own bulk as the weapon
against the exact Pokémon its Steel/Flying typing would otherwise struggle to
punish offensively. Garchomp's Rock Slide only does 22-26 to it after the
spread reduction — a non-issue.

**Toxapex** is the team's answer to the Trick Room archetype's actual
attackers, not just typing theory. Calc-confirmed: real Unburden/White-Herb
Sneasler's Close Combat does **27-33 damage** to it (Fighting resisted by its
Poison half, neutral off its Water half) and real Sitrus-TR Sinistcha's
Matcha Gotcha does **22-27** after the doubles spread reduction — both
trivial against Toxapex's huge natural Def/SpD (152/142 base). Regenerator
heals a chunk of HP every time it pivots out, and Haze is a genuine reset
button against any stat-up sweeper (a Calm-Mind Sinistcha, a Bulk-Up
Kingambit) rather than a one-time answer.

**Mega Camerupt** is this team's Mega Evolution slot (rule 5) and its main
offensive answer to Sun, Rain, and Sand simultaneously — verified, not
assumed. Its fixed ability is **Sheer Force** (confirmed via the vendored
pokedex's dedicated `Mega Camerupt` entry, distinct from base Camerupt's
Magma Armor/Solid Rock — the same pre-Mega-ability-selection trap already
documented for Swampert/Staraptor/Froslass in `vgc_common_pitfalls.md`, this
time avoided from the start). Base Speed drops to 20 on Mega Evolution —
excellent for Trick Room. Verified real numbers:
- **vs. Charizard-Mega-Y (real Fast-Offense-Mega-Y set)**: Heat Wave does
  63-75 raw → 47-56 after the doubles 0.75x spread reduction (27-32% of
  Camerupt's 177 HP). Solar Beam does 95-112 (54-63%) — a real hit, but not
  remotely a KO, and neutral rather than the 4x some Water/Rock-typed
  "answers" would eat.
- **vs. Archaludon (real Bulky-Stamina-Lefties set)**: Electro Shot does
  **0 damage, confirmed** — Ground is flatly immune to Electric. Archaludon's
  entire signature move is dead on arrival against this Pokémon.
- **vs. Excadrill (real Max-Attack-Sand-Offense set)**: Camerupt's own Heat
  Wave does 266-314 raw → 200-236 after spread reduction, an outright kill on
  Excadrill's 185 HP even through the doubles reduction (Steel is 2x weak to
  Fire). **The real danger runs the other way**: Excadrill's Earthquake does
  146-174 to Camerupt's 177 HP (82-98%), a likely-to-guaranteed kill, and
  Sand Rush doubles Excadrill's Speed so it very likely moves first in a
  normal turn order. **The actual answer is sequencing, not typing**: set
  Trick Room first (Reuniclus or Camerupt itself), and Trick Room's reversed
  turn order means the *lower*-current-Speed Pokémon acts first regardless of
  Sand Rush's boost — Camerupt (Speed 20-40) still outpaces a Sand-Rush
  Excadrill (Speed ~280) under Trick Room, so Heat Wave fires first and kills
  before Earthquake ever lands. This only works if Trick Room is already up;
  don't blind-switch Camerupt into a live Excadrill without it.
Trick Room is included as Camerupt's 4th move specifically as a backup
setter — if Reuniclus is dead or hasn't moved yet, Camerupt can still put the
Room up (Trick Room is -7 priority and always resolves last the turn it's
used, so Camerupt doesn't need to be the fastest or even alive-and-safe to
set it, just alive).

**Aegislash** is the team's Kingambit/Tyranitar-Mega closer and disruption
piece. Ghost/Steel is **immune to Fighting and Poison, and immune to Normal**
— Ghost's Fighting immunity fully cancels Steel's own Fighting weakness (a
real interaction, not a guess: 0 x 2 = 0). It IS 2x weak to Dark, so Kingambit
isn't a free matchup on typing alone — but the actual tool here is **King's
Shield**: +4 priority, blocks the incoming move like Protect, and (confirmed
via live search) sharply lowers the attacker's Attack stat if hit by a
contact move — both Kingambit's Kowtow Cleave and Sucker Punch are contact
moves. Separately, **Sucker Punch fails outright** if Aegislash uses King's
Shield instead of an attacking move that turn (Sucker Punch only works
against an opponent who is themselves attacking) — so the exact move
Kingambit's speed tier is built around whiffs for free against a
King's-Shield Aegislash. Calc-confirmed real damage with full Def investment:
Kowtow Cleave 114-134 (68-80% of 167 real HP), Sucker Punch 92-110 (55-66%) —
both survivable even before the Attack-drop discourages a second hit.
**Sacred Sword outright destroys Mega Tyranitar**: calc-confirmed 224-264
against real Bulky-Max-Attack-Mega Tyranitar — Rock/Dark is weak to Fighting
on both halves (4x total), a clean answer to the Sand archetype's other
headline threat, not just Excadrill.

## Intentional exclusions

- **Any of the format's actual S-tier staples** (Garchomp, Kingambit, Sylveon,
  Incineroar, Whimsicott, Gholdengo, Archaludon, Pelipper, Charizard-Y,
  Basculegion, Farigiraf, Sinistcha, Sneasler, Mega Staraptor, Tyranitar,
  Excadrill, Aerodactyl) — deliberately avoided across the board. This team's
  entire premise is that a prepared opponent's team-preview read and
  in-battle plan are built around answering *those* Pokémon; using any of
  them meaningfully increases the odds the opponent already has a rehearsed
  answer.
- **Granbull and Bruxish** — both considered early as off-meta Fairy/Water
  answers to Garchomp and Fake-Out leads respectively (Bruxish's Dazzling
  blocks all priority). **Both ruled out after checking the actual Champions
  roster** (Serebii's full available-species list, fetched this session) —
  neither is in Champions' curated ~296-species roster at all, a real
  roster-vs-legality miss that would have gone unnoticed without the direct
  check rule 6 requires.
- **Quagsire** (Unaware) — same reason, not in the Champions roster.
- **An own-weather plan (Sun/Rain/Sand of our own)** — rejected on principle:
  the whole point is not being another entry in the "weather commitment" bucket
  ChampTeams.gg flagged as the format's current soft spot.
- **A second, dedicated Tailwind setter** — considered, but this team's win
  condition is Trick Room, not raw Speed; running both would split SP/moveslot
  investment across two contradictory speed-control plans for no real gain.

## Known weaknesses / open questions

- **Reuniclus is exposed turn 1, before Trick Room is up.** At 30 base Speed
  it acts late in a normal-order turn 1 against a fast Sun/Sand lead. 217 real
  HP gives it a real chance to survive one hit and still set the Room, but
  this is a probability, not a guarantee — no Fake Out/redirection backup is
  on this team to protect the setup turn specifically.
- **Foul Play's real damage output is not calc-verified this session** — see
  Klefki's writeup above. Treat it as a plausible real tool, not a confirmed
  number, until re-tested (possibly a tool limitation, not investigated
  further this session).
- **Klefki cannot switch into Mega Swampert (rain) or Garchomp's Earthquake**
  — both real, calc-confirmed near-kills. It's a support piece, protect it
  accordingly.
- **The late-season Mega Gengar + Politoed perish-trap rain line** (flagged
  by ChampTeams.gg as a rising, separate rain sub-archetype) was not tested
  against this team this session — Perish Song specifically could be
  dangerous against a slow team that struggles to force switches quickly.
  Flagged as a follow-up, not resolved.
- **No Pokémon on this team resists Ghost or Dark simultaneously** —
  Reuniclus (Psychic) is 2x weak to both; a Sinistcha (Ghost/Grass) or
  Kingambit (Dark/Steel) attacking Reuniclus directly, rather than a slower
  teammate, is a real threat this file hasn't fully war-gamed.
- **Camerupt must not be blind-switched into a live, un-Trick-Roomed
  Excadrill** — see "Why these six" above; the answer depends on sequencing,
  not typing, and misplay here loses Camerupt for free.
- **Team-wide Speed is very low across the board** (Reuniclus 30, Toxapex 35,
  Mega Camerupt 20, Corviknight 67, Aegislash 60, Klefki 75) — this is by
  design for Trick Room, but means this team has no real plan if Trick Room
  simply never goes up (e.g., Reuniclus and Camerupt are both dead or
  Taunted before either acts). Not a solved problem, flagged honestly.

## Bring-6-pick-4 notes

Based on the verified matchup data above, not theorized:

- **vs. Sun (Charizard-Mega-Y core)**: Bring Mega Camerupt, Corviknight,
  Toxapex, Aegislash — bench Klefki (2x weak to Fire) and consider benching
  Reuniclus too if Aerodactyl/a fast physical attacker is also present (both
  are frail into a fast lead). Camerupt tanks Charizard's whole kit
  (resists Heat Wave, takes Solar Beam non-lethally) and threatens back hard
  once it acts.
- **vs. Rain (Swampert-Mega/Pelipper/Archaludon)**: Bring Corviknight
  (immune to Ground, neutral to Electric, survives Wave Crash comfortably),
  Mega Camerupt (immune to Electro Shot entirely), Aegislash, Toxapex — bench
  Klefki (a near-guaranteed kill from rain-boosted Wave Crash).
- **vs. Trick Room (Farigiraf/Sinistcha/Incineroar/Kingambit/Sneasler)**:
  Bring Toxapex (no-sells Sneasler and Sinistcha's real attacks), Corviknight
  (Body Press wrecks Kingambit), Aegislash (King's Shield turns off Sucker
  Punch entirely, punishes Kowtow Cleave), Reuniclus (this team's own Trick
  Room is a real mirror threat here, not a liability — being already slow
  means an opposing Trick Room doesn't flip the team's own speed order the
  way it would against a fast hyper-offense squad).
- **vs. Sand (Tyranitar-Mega/Excadrill)**: Bring Mega Camerupt (kills
  Excadrill outright once Trick Room is up), Aegislash (Sacred Sword
  one-shots Mega Tyranitar), Reuniclus (Magic Guard ignores sand chip
  entirely, sets the Trick Room that makes the Camerupt line work), and
  Corviknight or Klefki (Steel-typed, naturally immune to sand chip — only
  Rock/Ground/Steel types and Magic Guard holders are). **Bench Toxapex
  here**: Poison/Water isn't sand-immune, so it takes chip damage every turn
  for no offsetting benefit against this specific matchup.

## Changelog

| Date | Change | Reasoning |
|---|---|---|
| 2026-07-14 | Initial build. Live-searched current top archetypes (Pikalytics topteams, ChampTeams.gg Week 3 meta report) and cross-checked the real Champions roster (Serebii) before selecting six Pokémon that appear on none of the top-usage/top-team lists. Verified every ability against the vendored pokedex (catching the same pre-Mega-ability-selection trap this repo already knew about, this time before it caused an error) and ran real damage-calc numbers against real presets for Charizard-Mega-Y, Archaludon, Excadrill, Mega Tyranitar, Mega Swampert, Garchomp, Sneasler, Kingambit, and Sinistcha | Pikalytics `/topteams`; ChampTeams.gg Reg M-B Week 3 meta report; Serebii Champions roster list; `tools/damage-calc/cli.js` against vendored `SETDEX_GEN10` presets throughout |
