# Team: Palafin / Hisuian Arcanine / Sinistcha Core

**Status:** Testing — all six roster slots filled and solved
**Built for:** Ladder / tournament prep, built around a user-requested Palafin
favorite-mon core (Palafin, later swapped for Basculegion + Hisuian
Arcanine, later swapped for Incineroar + Sinistcha, Sinistcha later
swapped for Farigiraf, Aerodactyl later swapped for Dragonite, Incineroar
later swapped for Maushold — see Changelog)
**Regulation:** M-B (verified as of 2026-07-24 — Mega Evolution only, no
Tera/Dynamax/Z-Move)
**Last updated:** 2026-07-27 (Gallade Speed re-tuned vs. Maushold)

## The six

All six roster slots are filled and solved. The team carries two Megas
(Dragonite and Gengar) as situational bring-one-per-matchup picks — only
one Mega can be used per battle regardless — with Gallade as a third,
non-Mega breaker rounding out the roster.

| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |
|---|---|---|---|---|---|
| Basculegion | Mystic Water | Adaptability | Adamant | 32 HP / 32 Atk / 2 SpD | Last Respects / Aqua Jet / Wave Crash / Protect |
| Maushold | Chople Berry | Friend Guard | Impish | 32 HP / 31 Def / 3 SpD | Follow Me / Super Fang / Feint / Taunt |
| Farigiraf | Colbur Berry | Armor Tail | Bold | 29 HP / 32 Def / 5 SpD | Trick Room / Protect / Helping Hand / Psychic |
| Dragonite (→ Mega Dragonite) | Dragoninite | Multiscale | Modest | 29 HP / 20 SpD / 17 SpA | Dragon Pulse / Flamethrower / Tailwind / Protect |
| Gengar (→ Mega Gengar) | Gengarite | Shadow Tag | Timid | 15 HP / 27 SpA / 24 Spe | Protect / Shadow Ball / Sludge Bomb / Thunderbolt |
| Gallade | Focus Sash | Sharpness | Adamant | 4 HP / 32 Atk / 30 Spe | Sacred Sword / Leaf Blade / Psycho Cut / Protect |

(SP allocation uses the current Champions Stat Points system, not old EVs
— see `reference/vgc_current_regulation.md`'s "Stat system" section.)

## Why these six

**The starting idea**: Palafin, Hisuian Arcanine, and Sinistcha as a core —
user's pitch was that all three are strong-or-neutral into the main current
meta, function well as swap-in/swap-out pieces, and Palafin can bring Haze.
That last point didn't survive scrutiny (see below), but the core itself
held up under a real threat-by-threat check.

**Basculegion** replaced Palafin as the team's Water-type breaker (see
Intentional exclusions for Palafin's original build and why it was cut).
Real, verified build: **Adaptability (93.2% real usage)** / **Mystic
Water (19.6% real usage — a real, legitimate minority pick, not
theoretical)** / Adamant / **Last Respects (100%), Aqua Jet (94.9%), Wave
Crash (82.3%), Protect (53.8%)** — all four real, near-unanimous moves.
- **The swap came from a direct head-to-head re-check against Palafin,
  and the honest answer depends entirely on itemization.** With each
  running its own real, standard item (Palafin's Life Orb/Mystic Water vs.
  Basculegion's real-dominant Choice Scarf), Palafin hits harder in every
  matchup checked — that was the original, correct conclusion. But with
  *equal* items (both on Mystic Water), **Basculegion outdamages Palafin
  in every matchup instead** (e.g. vs. Incineroar: 204.6–241.4% vs.
  Palafin's 197.7–234.5%) — because once the item advantage is removed,
  Adaptability's 2.0x STAB multiplier is genuinely bigger than Palafin's
  normal 1.5x, outweighing Palafin's higher base Attack (160 vs. 112).
  User chose to lean into that: Basculegion on Mystic Water, accepting the
  real cost below.
- **Real cost: giving up Choice Scarf means giving up the fast-revenge-
  killer identity entirely.** Real Speed drops from 195–214 (Scarf) to
  **98** (Mystic Water, no Speed boost at all) — nowhere near the
  established fast tier. This is a genuinely different role than
  Basculegion's real, standard build: a slower, bulkier, harder-hitting
  attacker instead of a fast Scarf revenge-killer.
- **SP spread solved via binary search, not defaulted**: Attack's real
  minimum against the same 5-threat list used for Palafin (Garchomp,
  Kingambit, Mega Charizard Y, Incineroar, Mega Staraptor) is 31 SP
  (Mega Staraptor is the binding constraint; Charizard-Y/Incineroar need
  0, Garchomp/Kingambit never guarantee regardless) — rounds up to the
  **32 cap**. Speed confirmed wasted at any investment (max real 130
  Adamant / 143 Jolly, still far below the fast tier), so the remainder
  went to bulk instead of Speed. **Final: 32 HP / 32 Atk / 2 SpD, Adamant.**
  Real stats: 227 HP / 180 Atk / 85 Def / 90 SpA / 97 SpD / 98 Speed.
- **Accepted three Ghost-types on the roster** (Basculegion/Sinistcha/
  Gengar) as a real, known tradeoff of this swap — user's own call after
  weighing it against Basculegion's real damage advantage under matched
  items. A Mega Metagross-for-Gengar swap was seriously explored as an
  alternative fix (would have resolved the Ghost-stacking and fixed two of
  Gengar's confirmed-unfixable matchups) but ultimately not taken — Gengar
  was kept (see its own section, unchanged).

**Maushold** replaced Incineroar after the user noticed they kept not
bringing Incineroar to real games specifically because of **Defiant
Kingambit and Competitive Milotic** — both real, current, and both punish
Intimidate directly (any stat drop from an opponent converts into a free
+2 boost: Attack for Defiant, Special Attack for Competitive). Verified
this wasn't a misconception before acting on it: **Kingambit is 96.1%
real Defiant, Milotic is 99.1% real Competitive** — both near-universal
when either species is seen at all. The real cost was worse than "wasted
Intimidate": Kingambit's own real dominant move is **Sucker Punch at
99.5% usage, priority** — a free +2 Attack from Incineroar's automatic,
unavoidable switch-in trigger arms that exact move before the team can
react. Two of Incineroar's four kit pieces fed this (the passive
Intimidate itself, and Parting Shot, which also drops a stat) — only Fake
Out and Flare Blitz were unaffected.
- **Searched real current alternatives rather than picking on typing
  alone.** Checked Grimmsnarl (real Prankster screens support — Parting
  Shot and Spirit Break both trigger the same Defiant/Competitive problem,
  just avoidably rather than automatically) and **Maushold**, whose real
  dominant kit (Follow Me 95.4%, Friend Guard 73.2%) doesn't lower an
  opponent's stats at all — structurally immune to the whole Defiant/
  Competitive interaction, not just a smaller version of it. Also
  confirmed a side benefit of the swap itself: with no Intimidate
  anywhere on the roster anymore, the team no longer hands out a single
  free stat boost to either Pokémon under any circumstance.
- **User specified the exact moveset and explicitly ruled out
  Population Bomb** (the aggregate real 4th-most-common move at 31.5%,
  behind the actual real core): **Follow Me / Super Fang / Feint /
  Taunt**, deliberately **no Protect** — reasoned directly that Protect
  and Follow Me are mutually exclusive on the same turn anyway, so a
  dedicated redirect-and-disrupt Maushold gets little practical use out
  of carrying both. Super Fang (40.2% real usage) halves the target's
  current HP regardless of bulk investment — a real, clean tool against
  a bulky target like Milotic that doesn't trigger Competitive at all.
  Feint (20.8%) breaks through an opposing Protect, a real answer to
  something baiting around the Follow Me redirect. Taunt (21.8%) denies
  setup/status entirely.
- **Ability is Friend Guard (73.2% real usage, locked)** — reduces
  damage taken by allies by 25%, real passive team-wide support alongside
  the Follow Me redirect itself.
- **Defensive reality check surfaced one confirmed-unfixable threat, and
  a real item choice that fixes it anyway.** With no Protect and a
  redirect-first game plan, Maushold takes hits every relevant turn, so
  the bulk check used the same weighted real threat list this file has
  used throughout (Kingambit Kowtow Cleave/Sucker Punch, Garchomp Rock
  Slide, Mega Staraptor Close Combat, Mega Charizard Y Heat Wave in Sun)
  plus a Milotic Scald check given the user's specific concern. **Mega
  Staraptor's Close Combat is a guaranteed OHKO regardless of SP
  allocation** (236–278 vs. a max-HP 181, Fighting hitting Maushold's one
  real weakness for 2x with no resistances anywhere in its pure Normal
  typing to lean on) — a real "no spread fixes this" gap, same category
  as others in this file. **Chople Berry (real dominant item, 38.7%
  usage) fixes it directly rather than working around it**: halves that
  exact hit to 118–139, a comfortable survive (65–77% remaining).
  Considered Focus Sash (real 3rd-most-common item, 24.2%) first since it
  guarantees surviving any single hit from full HP — but rejected it once
  the actual role was accounted for: Focus Sash only ever saves the
  *first* hit, and with no Protect and a repeated-redirect job across a
  whole game, every subsequent turn would revert to the raw, un-mitigated
  numbers. Chople Berry's type-based reduction holds up on every relevant
  turn, not just the first.
- **Bulk spread solved with the full 66-SP budget** (none of the four
  moves need Attack or Special Attack investment — Super Fang's damage is
  HP-based, not stat-based) via `optimize-bulk-cli.js --mode rank` against
  the same weighted threat list, with Chople Berry applied: **32 HP / 31
  Def / 3 SpD**. Every real threat checked is now a comfortable survive:
  Kowtow Cleave 51.4% left, Sucker Punch 59.7% left, Rock Slide 75.1%
  left, Close Combat 29.8% left (the Chople-fixed matchup), Heat Wave
  15.5% left (tightest real margin), Milotic's Scald 63.0% left. Nature is
  Impish (Def+, a free cut — nothing in the kit uses Attack), matching
  Def being the dominant invested stat. Speed was left at 0 by explicit
  user priority (maximize survivability) rather than searched — worth
  noting Maushold going first matters for how much of a turn's incoming
  attacks Follow Me actually catches (a slower Follow Me only redirects
  moves the opponent hasn't already used that turn), a real trade-off
  accepted here, not one that was solved away. Final real stats: 181 HP /
  95 Atk / 133 Def / 76 SpA / 98 SpD / 131 Speed.

**Farigiraf** replaced Sinistcha once the user judged Sinistcha wasn't
pulling its weight as support anymore after the roster's other swaps —
this needed a real, current-data search across Champions' legal roster
rather than picking from memory, and the user set one hard requirement
beyond "good support": something that could **counter or reverse an
opposing Trick Room**, not just redirect and heal.
- **Broad real-usage search, not a top-usage default.** Pulled current
  Pikalytics data across the Trick-Room-capable support tier — Farigiraf,
  Whimsicott, Grimmsnarl, and Maushold were the real candidates that came
  up. Whimsicott and Grimmsnarl are both real Tailwind/redirect pieces but
  neither carries Trick Room itself in its real moveset (Whimsicott's
  already confirmed elsewhere in this file as an offensive Tailwind
  setter, not a Trick Room user); Maushold's real kit is offense-first
  (Population Bomb) with no Trick Room either. Farigiraf was the one
  option that actually combined a real support kit with Trick Room as a
  genuine, current-usage move.
- **Trick Room here is a reversal tool, not a setup tool — verified the
  actual mechanic before relying on it.** Using Trick Room while one is
  already active immediately cancels it, restoring normal turn order —
  confirmed via live search, not assumed. That matters specifically for
  this roster because the team is speed-split rather than uniformly fast:
  Basculegion (98 Spe) and Farigiraf itself (80 Spe) are slow, Gengar-Mega
  (191 Spe) is genuinely fast, and Dragonite-Mega (120 Spe, unboosted — see
  its own section, replacing the much-faster 202 Spe Aerodactyl this slot
  used to run), Gallade (130 Spe, deliberately set one point behind
  Maushold — see Gallade's own section), and Maushold (131 Spe, unboosted
  — replacing the much slower 80 Spe Incineroar, see its own section) sit
  in the middle-to-fast range. An opposing Trick Room would
  flip the fast half to the back of turn order —
  Farigiraf's own Trick Room cancels it back to normal, rather than
  doubling down on a room the team doesn't uniformly want.
- **Ability is Armor Tail (99.9% real usage, effectively locked)** —
  blocks priority moves against the whole side in doubles, real
  passive support value, no fork to check.
- **Item: caught and fixed a duplicate before it hit the file.** Real
  dominant item is Sitrus Berry (62.0% usage) — but Incineroar already
  holds Sitrus Berry on this roster, a hard duplicate-item violation.
  Switched to the real second-choice item, Colbur Berry (24.9% usage),
  and verified it's a genuine upgrade rather than just "the next legal
  option": Kingambit's Kowtow Cleave against Farigiraf drops from
  150–176 damage (Sitrus/no-berry baseline) to **75–88 (33.5–39.3%)**
  with Colbur Berry applied, against the team's single most recurring
  real threat.
- **Moveset: Trick Room / Protect / Helping Hand / Psychic.** Helping
  Hand isn't exposed through the standard calc API (it's a flat 1.5x
  move-power modifier, not a stat-stage boost) — verified directly
  against the vendored engine's `isHelpingHand` field instead. Real,
  concrete payoff: it turns Gengar's Thunderbolt vs. Mega Staraptor from
  a non-guaranteed 84.0–98.8% into a **guaranteed 202–238 (124.7–146.9%)
  OHKO**. Psychic was chosen over Thunderbolt for the 4th slot: real
  usage favors Psychic (60.7% vs. Thunderbolt's 30.3%), and it gives a
  guaranteed OHKO on **Sneasler** (231.8–275.2%) — a real, recurring
  threat to this roster, and the one guarantee the user explicitly asked
  to preserve while maximizing bulk (see below). Thunderbolt's own
  selling point (a guaranteed OHKO on Pelipper, 131.4–157.7%) wasn't
  chosen over that.
- **SP spread solved, not defaulted, once the user set the actual
  priority: maximize overall bulk, with the Sneasler OHKO as the one hard
  floor.** Binary-searched the real SpA breakpoint needed to keep Psychic
  a guaranteed Sneasler kill: **0 SpA SP**, meaning the full 66-SP budget
  could go entirely to bulk with no offense tax. Ran
  `optimize-bulk-cli.js --mode rank` against a real 5-threat weighted
  list (Kingambit Kowtow Cleave/Sucker Punch, Garchomp Earthquake, Mega
  Staraptor Close Combat, Mega Charizard Y Heat Wave in Sun) and got
  **29 HP / 32 Def / 5 SpD**. Verified every real threat survives
  comfortably at the final spread: Kowtow Cleave 33.5–39.3%, Sucker Punch
  a confirmed 0% (fails outright — same "no damaging move used this turn"
  interaction already documented for Gengar's Sucker Punch matchup),
  Earthquake 36.6–43.3%, Close Combat 48.2–56.7%, Heat Wave 59.4–70.1%.
  Psychic vs. Sneasler at this final spread still lands 268–316
  (170.7–201.3%) — the OHKO floor holds with zero SpA invested.
- **Nature is Bold (Def+/Atk−)** — Def is the dominant invested bulk stat
  at this spread (32 of 66 SP), matching the same pattern used for
  Incineroar and Metagross elsewhere on this roster: the nature boost
  lands on whichever bulk stat gets the most raw SP.
- **Real bonus found while checking Farigiraf against Sinistcha's old
  unfixable gap**: Sinistcha (Grass/Dark) was 2x weak to Mega Froslass's
  Blizzard and Shadow Ball with no spread able to fix it. Farigiraf
  (Normal/Psychic) is **immune to Ghost** (Normal's immunity holds
  regardless of the second type) and only neutral to Ice — confirmed
  directly: Shadow Ball does **0 damage**, Blizzard does 103–123
  (46.0–54.9%), comfortably survived. The swap closes a gap the roster
  had carried since Sinistcha was first built, not just a lateral move.

**The two Megas** (originally Aerodactyl and Gengar, Aerodactyl later
swapped for Dragonite — see below) were picked from a shortlist of 4 real,
verified M-B options (Aerodactyl, Gengar, Scizor, Metagross) after
checking each against the team's actual documented gaps — no Ground
answer at all (kills Arcanine outright), no Ice answer (Froslass
guaranteed a kill on the roster's support piece at the time — since
resolved by the Sinistcha→Farigiraf swap, see below), and Fighting/Solar
Beam pressure. Only
one Mega can be evolved per battle regardless, so these are situational
bring-one-per-matchup picks, not both-at-once teammates.

**Dragonite-Mega replaced Aerodactyl-Mega** after the user judged
Aerodactyl was underperforming. Working through *why* first: Aerodactyl's
own SP spread was fully offensive (2 HP / 32 Atk / 32 Spe) with zero bulk
ever checked, and its real STABs never actually hit the team's most
recurring threat, Garchomp, hard — Rock Slide was resisted (0.5x,
15.1–17.8%) and Dual Wingbeat only neutral (28.1–34.1%). Its entire real
value was the Ground immunity itself, not offense — a fast glass cannon
whose offense didn't back up its role. Dragon/Flying gives Dragonite the
same Ground immunity, but **real, current tournament data (multiple top
finishes on Limitless — 9-0, 8-1, 11-1 — for the same real build) confirmed
a genuinely different kit**: Dragoninite, **Multiscale** (halves damage
taken while at full HP — verified directly: Mega Froslass's Blizzard goes
from 268–324 without it to 134–162 with it, real doubled effective bulk
on the turn it switches in), and a special-attacking moveset — **Dragon
Pulse / Flamethrower / Tailwind / Protect** — a real shift from
Aerodactyl's physical Tough Claws set. Real teammate synergy: 84.7%
co-occurrence with Basculegion, already on this roster.
- **User's explicit ask: guarantee a Garchomp OHKO, preferably with Dragon
  Pulse.** Solved as a real breakpoint, not assumed from base stats. Pulled
  Garchomp's actual current spread data directly (JSON API, not the
  rendered page — its own "Best Moves" panel doesn't populate on this site
  even for a top-1 real Pokémon, a client-rendering limitation, not a
  usage signal; see `vgc_common_pitfalls.md`): real dominant set is Life
  Orb (51.5%), Rough Skin (98.5%), Jolly/Adamant split (60.5%/38.9%,
  neither touches SpD), and the real top individual spread (32.7% of all
  Garchomp) is **2 HP / 32 Atk / 32 Spe — 0 Def, 0 SpD**, giving it 185 real
  HP. Binary-searched the minimum SpA needed for Dragon Pulse to guarantee
  the kill against that real spread: **17 SpA SP** (186–218 damage, min
  roll clears 185 HP). Checked the format's own dominant STAB too —
  Garchomp's real #1 move is Dragon Claw (89.4%), not Dragon Pulse, so this
  guarantee is against its real physical set, not a strawman. Also checked
  the one bulkier real Garchomp spread in the data (32 HP / 4 SpD, a
  ~1.3%-usage Trick-Room-style outlier) — **not guaranteed even at max 32
  SpA** (192–228 vs. 215 HP); accepted as a real, low-presence gap rather
  than chased, consistent with how this file treats other "no spread fixes
  this" cases.
- **Bulk spread solved with the SpA requirement fixed, not defaulted.**
  With 17 SP locked to SpA, `optimize-bulk-cli.js --mode rank` against a
  real weighted threat list (Mega Froslass Blizzard, Sylveon Hyper Voice,
  Garchomp Rock Slide, Archaludon Dragon Pulse, Kingambit Kowtow Cleave)
  solved the remaining 49 SP to **29 HP / 0 Def / 20 SpD** — Def came back
  0 because Multiscale alone already keeps Rock Slide comfortable
  (36–44, 21.4–26.2%) even with zero Def invested. Worst case in the list
  is still Mega Froslass's Blizzard at a comfortable 28.2% HP remaining,
  4x weakness and all. Speed was fixed at 0 rather than searched: checked
  directly that even a maxed, Timid-natured Dragonite (167 real Speed)
  can't reach the real dominant Jolly Garchomp's 169, so there's no
  breakpoint there to chase — this was a judgment call to exclude Speed
  from the search rather than a result the optimizer itself ruled out, and
  is worth revisiting if a faster real threat becomes the concern. Nature
  is Modest, the efficient choice for the fixed SpA requirement (Modest's
  boost is why 17 SP suffices instead of more) — Atk is a free cut,
  nothing in the kit uses it. Final real stats: 195 HP / 129 Atk / 135
  Def / 200 SpA / 165 SpD / 120 Speed (unboosted; doubles under its own
  Tailwind).

**Mega Gengar** was rebuilt as a raw special attacker after the user
judged the original Perish Trap plan (Shadow Tag + Perish Song +
Protect/Disable or Substitute) had been leaned into too far. Shadow Tag
stays — it's still real value for a pure attacker, not just Perish Trap:
trapping the opponent means they can't switch away from Gengar's own
threatened kills, denying the "revenge-kill and retreat" pattern
entirely, independent of Perish Song. New real moveset (confirmed
Champions-legal via direct move-pool verification, not assumed): **Protect
/ Shadow Ball / Sludge Bomb / Thunderbolt** (originally Energy Ball, later
swapped — see below), Timid.
- **Focus Blast was seriously considered and rejected on accuracy, not
  power.** It's a real Champions-legal move and hit two of the team's
  most persistent problems hard — a clean guaranteed OHKO on both
  Kingambit (108.5–127.7%, 4x from Fighting hitting both the Dark and
  Steel halves) and Archaludon (119.8–141.1%, a Pokémon nothing else on
  the team has ever hit well). But it's **70% accuracy**, confirmed via
  live search — a 30% miss chance on what's supposed to be a guaranteed
  answer is a real liability for a Pokémon this fragile, which likely
  doesn't get a second turn against what it misses on. User ruled out
  low-accuracy moves on principle; dropped.
- **The three moves that replaced it are all 100% accuracy and each
  deliver a real, distinct, clean guaranteed OHKO** — checked directly
  rather than assumed from type theory alone:
  - **Sludge Bomb → Floette-Eternal: 100.7–120.5%.** The team's only
    answer to Fairy-types anywhere — nothing else (Palafin, Sinistcha,
    Aerodactyl, Incineroar) threatens Fairy at all; Incineroar's Dark
    typing is actually resisted by it.
  - **Energy Ball → Mega Swampert: 131.1–155.9% (4x, Water/Ground both
    hit) — originally the team's only Swampert answer**, a real,
    unexpected find at the time (Swampert has been one of the most
    dangerous threats across this whole build). **Superseded once Gallade
    joined the team**: Gallade's real Leaf Blade (also Sharpness-boosted)
    hits Swampert even harder (140.1–165.0% at Gallade's real item, Focus
    Sash), making Energy Ball fully redundant. Swapped for **Thunderbolt** instead, which answers a real,
    still-open gap — Mega Staraptor's Brave Bird has been a confirmed,
    unfixable weakness for Sinistcha with no answer anywhere else on the
    team. Thunderbolt (2x, Flying half) never reaches a mathematically
    guaranteed OHKO even at max SpA, but at the existing 27 SP (already
    needed for the Floette-Eternal breakpoint below) it does 84.0–98.8% —
    a real, substantial upgrade from zero coverage to a near-certain kill.
    No SP-spread changes were needed for the swap.
  - **Shadow Ball → Basculegion: needs only 16 SpA SP** (2x, Ghost-on-
    Ghost) — already comfortably covered by the spread below.
- **SP spread re-solved for the new moveset, not left at the old
  numbers.** Speed stayed at the previously-solved **24 SP** (191 real
  Speed — still cleanly beats Sneasler, Jolly Garchomp, Timid Charizard-Y,
  Adamant Staraptor; only a maxed Jolly Scarf Basculegion outpaces it).
  But **SpA's real minimum changed**: the old 16 SP was solved only for
  the Basculegion target under the previous moveset — checked all three
  new OHKO targets together and found **Sludge Bomb vs. Floette-Eternal
  is the actual binding constraint at 27 SP**, not 16 (Swampert needs 0,
  thanks to the 4x multiplier). **HP absorbed the difference: 15 SP**
  (down from 26), still just the leftover home for SP with nowhere more
  load-bearing to go — bulk remains unfixable against Kingambit's Kowtow
  Cleave and Farigiraf's Psychic regardless of investment (established
  before this rebuild, still true, since defensive stats didn't change).
  Final real stats: 150 HP / 217 SpA / 191 Speed.

**Gallade** fills the sixth and final slot, picked to answer the one
real, decisive gap left after everything else was built: **Archaludon**
(Steel/Dragon), which every other team member's best move topped out at
60–79% against — never a kill. A fresh `pikalytics.com/team-usage` pull
confirmed Archaludon is still a real, top-6-by-frequency Pokémon (30 of
the real top-100 team cores) anchoring one of the format's most common
archetypes, so this wasn't a theoretical hole.
- **Considered and rejected two alternatives first, on real evidence, not
  just theory.** Sneasler's Close Combat was briefly the pick (91.4–107.6%
  on Archaludon, very close to guaranteed) before being reconsidered.
  Unaware (Clefable/Skeledirge) was also checked as a mechanism to bypass
  Archaludon's Stamina entirely — real ability, but both real Champions
  users underperform (42–43% win rate, well below format average), neither
  has a pivot move, and Skeledirge's actual damage on Archaludon
  (48.2–57.4%) turned out *worse* than Sneasler's despite ignoring the
  Stamina boosts, since its raw offense wasn't enough to capitalize on the
  trick.
- **A critical correction happened mid-search: Archaludon's real SP spread
  is almost nothing but base stats made the first correction incomplete.**
  Every damage check this whole session had been run against a
  hypothetical 32 HP/32 Def dummy — a live search for Archaludon's actual
  real M-B spreads showed the top 4 real builds all put 0–1 SP into Def
  (`32/0/1/5/25/3`, `2/0/0/32/0/32`, `27/0/0/0/30/9`, `32/0/0/32/0/2`),
  investing in SpD instead (its real moveset, Electro Shot/Flash
  Cannon/Dragon Pulse, is entirely special). Recomputed everything against
  the real spread: physical Fighting attacks got *much* stronger (Palafin
  88.3–104.1%, Sneasler 91.4–107.6%, right at the OHKO line) while special
  attacks got *worse* (Gengar's Shadow Ball dropped from 58.4–69.0% to
  45.7–53.8%) — because base Def (130) is so much higher than base SpD
  (65) that even 1 SP of "real" Def investment still yields more raw bulk
  than 25 SP of SpD investment. This flipped the entire premise of
  "special damage helps here" that started this search.
- **Sacred Sword was the user's original technical idea — it ignores the
  target's Defense boosts, directly neutralizing Stamina** (confirmed via
  the vendored move data: `ignoresDefenseBoosts: true`, the same field
  Darkest Lariat carries). **Gallade is the real, verified user (94.7%
  real usage)**, and its real ability **Sharpness** (94.9% usage) boosts
  slicing moves 1.5x — Sacred Sword and Leaf Blade are both slicing moves.
  Against the real (corrected) Archaludon spread: **Sacred Sword hits
  100.5–118.8%, a clean guaranteed OHKO** at Focus Sash (see item note
  below) — the best number found in this entire search, ahead of
  Sneasler's near-guarantee.
- **Real moveset already matches what was tested — no fork needed.** Top 4
  real moves are Sacred Sword (94.7%), Psycho Cut (87.3%), Protect
  (65.5%), Leaf Blade (54.0%) — exactly Sacred Sword/Leaf Blade/Psycho
  Cut/Protect, near-unanimous.
- **Leaf Blade (also Sharpness-boosted) turned out to make Gengar's Energy
  Ball fully redundant** — checked directly: 140.1–165.0% on Mega
  Swampert (Focus Sash), an even bigger guaranteed OHKO than Energy
  Ball's. This freed Gengar's 4th slot for Thunderbolt instead (see above).
- **Item: Focus Sash, not Life Orb — caught as a real duplicate-item
  violation after the fact.** Palafin already holds Life Orb, and Gallade
  was initially given the same item, a hard rule violation (no two
  Pokémon on a team can hold the same item — already a documented pitfall
  in this repo that got missed anyway). Re-checked both guaranteed OHKOs
  with Focus Sash before just swapping blindly: **both hold** (Sacred
  Sword 100.5–118.8%, Leaf Blade 140.1–165.0%, margins shrink from losing
  Life Orb's 1.3x but stay above the kill threshold), and Focus Sash is
  also the real dominant item anyway (31.8% usage) — a strict upgrade,
  since it adds guaranteed one-hit survival Life Orb never provided.
- **Bonus real find: Sacred Sword also guarantee-kills Kingambit**
  (119.8–142.4%, same 4x Fighting-vs-Dark/Steel mechanism as Palafin's old
  Close Combat, boosted further by Sharpness). Not why Gallade was picked,
  but confirmed once Palafin's moveset changed and the team needed a real
  Kingambit answer again — Gallade fills that role as a situational
  bring-4 pick instead of Palafin carrying it directly.
- **Real cost, same as Palafin's and Sneasler's**: Sacred Sword is still a
  Fighting-type move, so it's flatly walled by any opposing Ghost-type,
  same blind spot as the rest of the team's Fighting coverage. No pivot
  move either — real Gallade set doesn't include one.
- **SP spread: 4 HP / 32 Atk / 30 Spe, Adamant.** Re-verified against
  Focus Sash specifically (the Life-Orb-based breakpoint doesn't
  automatically carry over): **Attack now genuinely needs the full 32 SP**
  to guarantee the Archaludon kill (Leaf Blade's Swampert kill still only
  needs 0, huge margin regardless) — a solved breakpoint, not just "no
  reason to lower it" as first written. Speed was originally dumped
  entirely into HP after confirming a full 32 SP investment still only
  reaches 132 real Speed — below the established fast tier (162–214+), so
  it can't win that race outright. **Revisited once Maushold joined the
  roster**: rather than treating Speed as fully wasted, solved for the
  exact breakpoint that puts Gallade one point *behind* Maushold's 131
  real Speed, so Gallade's own attacks resolve after Maushold's Super Fang
  lands (letting Gallade's damage output line up with the target already
  having had its current HP halved). **30 Spe SP = exactly 130 real
  Speed** — confirmed directly, not assumed from the formula. The 2 SP
  this displaced from HP (34→4) doesn't touch either of Gallade's
  guaranteed OHKOs (both solved at 0 Attack SP headroom to spare). Final
  real stats: 147 HP / 194 Atk / 85 Def / 135 SpD / 130 Speed.

## Intentional exclusions

- **Palafin (→ Hero Forme, Mystic Water / Zero to Hero / Adamant / 13
  HP-21 Atk-32 Spe / Flip Turn-Jet Punch-Wave Crash-Protect)** — the
  team's original Water-type pick, fully built out and solved (real
  guaranteed OHKOs on Mega Charizard Y, Incineroar, and Floette-Eternal
  via Wave Crash/Jet Punch). Basculegion was initially rejected as a
  replacement — with each running its own real, standard item, Palafin
  hit harder in every matchup checked. Revisited later with items
  equalized (both on Mystic Water), which reversed the conclusion —
  Adaptability's 2.0x STAB turned out to outweigh Palafin's higher base
  Attack once the item advantage was removed. Replaced once the user
  decided that raw power was worth three Ghost-types on the roster (see
  Basculegion's own section for the full numbers).
- **Hisuian Arcanine (Intimidate / Sitrus Berry / Adamant / 2 HP-32 Atk-32
  Spe / Flare Blitz-Extreme Speed-Protect-Rock Slide)** — the team's
  original third core member, fully built out and solved before being
  cut. Real, working glass-cannon breaker (guaranteed Kingambit OHKO via
  Flare Blitz, real 142 real Speed) but structurally fragile: Fire/Rock
  is 4x weak to both Water and Ground, and confirmed unfixable by any
  spread against Garchomp/Basculegion/Mega Swampert. Replaced by
  Incineroar once Aerodactyl's Ground immunity made Arcanine's Rock-type
  coverage redundant and real data showed Incineroar's Perish-Trap
  synergy with Mega Gengar (79.9% real co-occurrence) — something
  Arcanine's kit could never offer, plus a genuine pivot move (Parting
  Shot) Arcanine never had at all.
- **Sinistcha (Occa Berry / Hospitality / Bold / 32 HP-18 Def-16 SpD /
  Rage Powder-Matcha Gotcha-Trick Room-Protect)** — the team's original
  redirect/support core, fully built out and solved (Occa Berry closed
  Heat Wave and Flare Blitz; the 18/16 Def/SpD split closed Pelipper's
  Hurricane) before being cut once the user judged it wasn't pulling its
  weight as support after the roster's later swaps. Carried one
  confirmed, never-fixed gap the whole time it was on the roster: **Mega
  Froslass's Blizzard and Shadow Ball both guaranteed a kill regardless
  of SpD investment** (Ice/Ghost off a 140 base SpA gave it two separate
  super-effective STABs against Sinistcha's Grass/Dark typing). Replaced
  by Farigiraf, which closes that exact gap (see Farigiraf's own section)
  rather than just offering different support utility.
- **Aerodactyl-Mega (Aerodactylite / Tough Claws / Adamant / 2 HP-32
  Atk-32 Spe / Rock Slide-Dual Wingbeat-Tailwind-Protect)** — the team's
  original second Mega slot, fully built and solved (Adamant's 202 real
  Speed beat every real fast threat checked, and Rock Slide reached a
  near-certain 99.3–118.4% on Mega Froslass). Cut once the user judged it
  underperforming: its SP spread was fully offensive with zero bulk ever
  checked, and despite Tough Claws its own STABs didn't actually hit the
  team's most recurring real threat, Garchomp, hard (Rock Slide resisted,
  Dual Wingbeat only neutral) — its entire real value was the Ground
  immunity itself, not offense. Replaced by Dragonite-Mega, which keeps
  the same Ground immunity but adds Multiscale's real bulk and a solved
  guaranteed Garchomp OHKO via Dragon Pulse (see Dragonite's own section)
  — a genuine capability upgrade, not a lateral move, at the cost of
  Aerodactyl's much higher natural 202 Speed and physical offense.
- **Incineroar (Sitrus Berry / Intimidate / Impish / 32 HP-32 Def-2 SpD /
  Fake Out-Parting Shot-Protect-Flare Blitz)** — the team's original
  Fake Out/pivot/Kingambit-answer piece, fully built and solved (Flare
  Blitz a guaranteed Kingambit OHKO, 32 Def/2 SpD surviving every real
  threat except a coin-flip Mega Swampert Wave Crash). Cut once the user
  noticed they kept not bringing it in real games: **Kingambit (96.1%
  real Defiant) and Milotic (99.1% real Competitive) both convert
  Intimidate's automatic, unavoidable Attack-drop into a free +2 boost**
  — worse than neutral, since Kingambit's own real dominant move
  (Sucker Punch, 99.5% usage) is priority, meaning the boost lands before
  the team can react. Parting Shot fed the same interaction. Replaced by
  Maushold, whose real kit (Follow Me/Friend Guard) doesn't lower an
  opponent's stats at all, closing the gap structurally rather than just
  playing around it — at the cost of Incineroar's guaranteed Kingambit
  answer via Flare Blitz and its notably higher bulk.

## Known weaknesses / open questions

- **Basculegion doesn't carry a Kingambit or Garchomp answer either** —
  Wave Crash never reliably OHKOs either regardless of investment (same
  as Palafin's old problem). Gallade's Sacred Sword remains the team's
  real Kingambit answer. **Garchomp now has a real offensive answer**:
  Dragonite-Mega's Dragon Pulse guarantees a kill on Garchomp's real
  dominant spread (see Dragonite's own section) — previously the only
  answer anywhere on the team was Aerodactyl's Ground immunity, which was
  purely defensive.
- **Basculegion gave up its real, standard fast-revenge-killer role
  entirely** by running Mystic Water instead of Choice Scarf — real Speed
  drops from 195–214 to just 98, nowhere near the fast tier. It's now a
  slow, hard-hitting attacker, not a speed-control piece — expect it to
  act after almost everything relevant, not before.
- **Mega Charizard Y's Solar Beam OHKOs Basculegion just as it did
  Palafin** — Water's universal 2x Grass weakness plus a sun-boosted,
  no-charge-turn 120 BP hit. Not something the SP spread can fix; this was
  a shared weakness between the two Water-type options and swapping one
  for the other didn't remove it.
- **Three Ghost-types on the roster (Basculegion/Sinistcha/Gengar) share
  overlapping weaknesses** (Ghost, Dark) — a real, accepted tradeoff of
  the Palafin→Basculegion swap, not something worked around. A Mega
  Metagross-for-Gengar swap was seriously considered as a fix (see
  Gengar's section) but not taken.
- **Farigiraf closes both of Sinistcha's old unfixed gaps rather than
  trading them for new ones.** Normal/Psychic is immune to Ghost (Shadow
  Ball confirmed 0 damage) and only neutral to Ice (Blizzard 46.0–54.9%,
  comfortably survived) — Mega Froslass no longer guarantees a kill the
  way it did against Sinistcha's Grass/Dark typing. Mega Staraptor's real
  move against this roster is Close Combat, not Brave Bird, and it's a
  confirmed comfortable survive at Farigiraf's finalized spread
  (48.2–56.7%).
- **Farigiraf's real remaining weak point is Dark-type damage, only
  partially mitigated by Colbur Berry.** Psychic typing is 2x weak to
  Dark — Colbur halves that hit but doesn't remove the weakness, and
  Colbur is single-use (consumed on the first super-effective Dark hit
  taken). Kingambit's Kowtow Cleave is the team's most recurring real
  example of this and is a confirmed comfortable survive (33.5–39.3%)
  with the berry intact, but a second Dark-type attacker or a Kowtow
  Cleave taken after Colbur is already consumed would hit for roughly
  double.
- **Mega Gengar dies to Kingambit's Kowtow Cleave and an opposing
  Farigiraf's Psychic regardless of any SP allocation** — confirmed at the
  full 66-SP bulk ceiling, not just the finalized spread. Its real
  protection has to come from smart sequencing and its teammates' own
  redirect/support tools, not its own stats (the Sinistcha Rage Powder
  pairing this was originally written against no longer applies — see the
  Sinistcha→Farigiraf swap in Intentional exclusions). Also 2x weak to
  Ground, Psychic, Dark, and Ghost via Ghost/Poison typing — bringing
  Dragonite instead for Ground-heavy matchups is the situational
  mitigation, not a spread fix.
- **Dragonite-Mega's Speed was fixed at 0 by judgment call, not fully
  searched** — confirmed it can't reach the real dominant Jolly Garchomp's
  Speed (167 max for Dragonite vs. 169) so investing there looked wasted,
  but that conclusion was only checked against Garchomp specifically, not
  the team's full real fast-threat list the way Aerodactyl's Speed
  breakpoints once were. Worth revisiting if a faster real threat becomes
  the concern.
- **Dragonite-Mega's Flamethrower cannot guarantee a kill on Mega
  Froslass, confirmed unfixable even at the SP cap** — checked directly:
  maxing SpA all the way to 32 (the absolute per-stat cap, well beyond the
  17 the Garchomp OHKO needs) only reaches 124–146 against Froslass's real
  147 HP — the best possible roll still falls 1 short. No SP reallocation
  closes this; accepted as a real gap in the same category as this file's
  other confirmed-unfixable matchups. Separately verified Dragonite's
  defensive side of this matchup is fine as-is: Froslass's own Blizzard
  vs. the locked 20 SpD spread does 116–140 (59.5–71.8% HP remaining),
  identical in Snow or no weather — Snow only removes Blizzard's normal
  miss chance and boosts Ice-types' *physical* Defense, neither of which
  changes this special-attack matchup.
- **Maushold's Mega Staraptor gap is fixed by Chople Berry, not by SP —
  losing the berry reopens it entirely.** Chople Berry is single-use (it
  only blunts the first super-effective Fighting hit taken); once
  consumed, a second real Fighting-type attacker (Sneasler's Close Combat,
  already a recurring threat elsewhere in this file) would hit
  un-mitigated against a Pokémon with no Protect to fall back on. Worth
  tracking in-game whether the berry has already triggered before treating
  this matchup as safe.
- **Maushold is real fragile outside its one solved gap** — 181 real HP is
  the lowest max HP on the roster, and with no Protect it takes every hit
  the opponent lands on it (whether redirected via Follow Me or targeted
  directly). The build accepts this as the cost of the user's explicit
  choice to run Follow Me/Super Fang/Feint/Taunt with no safety-valve
  move.
- **Gallade's Sacred Sword/Leaf Blade are both Fighting/Grass physical
  moves with no defensive bulk investment behind them** (34 HP / 32 Atk /
  0 Spe) — it's a pure glass-cannon finisher, not built to take hits or
  survive long once it's in. No pivot move either, and Sacred Sword is
  flatly walled by any opposing Ghost-type (same blind spot every
  Fighting-move option considered this session has shared).
- **All six roster slots are now filled and solved.** Remaining open work
  is exploratory, not structural: real bring-6-pick-4 subsets per matchup
  haven't been worked out yet (see below).

## Bring-6-pick-4 notes

Not yet worked out — the roster is complete, but which 4-of-6 subset to
bring against each real archetype (Sun/Charizard-Y core, the
Swampert/Pelipper/Archaludon rain core, Kingambit-centric teams, etc.)
hasn't been reasoned through yet. Next real step once this file is
revisited.

## Changelog

| Date | Change | Reasoning |
|---|---|---|
| 2026-07-23 | Initial file — captured Palafin's build (moves, item, ability, and a solved SP spread) after a long threat-by-threat session. Hisuian Arcanine and Sinistcha confirmed as core members but not yet built out; 4th move slot deliberately left open pending more of the team | Full session reasoning — real Pikalytics per-Pokémon and team-usage/topteams data, tools/damage-calc/cli.js and custom breakpoint scripts for all damage/SP numbers above |
| 2026-07-23 | Added Hisuian Arcanine's full build (Intimidate over the real-dominant Rock Head, Sitrus Berry, Flare Blitz/Extreme Speed/Protect/Rock Slide, and a solved 2 HP / 32 Atk / 32 Spe spread). Found bulk investment cannot save it from Garchomp/Basculegion/Mega Swampert's real STABs regardless of amount (Fire/Rock is 4x weak to both Water and Ground) — user chose a fully offensive glass-cannon build over chasing the one matchup (Basculegion's Aqua Jet) that bulk could actually fix | tools/damage-calc/cli.js breakpoint searches this session; real Pikalytics battledataregmbs3 data for Arcanine-Hisui, Garchomp, Basculegion, Mega Swampert |
| 2026-07-23 | Added Sinistcha's full build (Hospitality, Occa Berry, Bold, 32 HP / 32 Def / 2 SpA, Rage Powder/Matcha Gotcha/Trick Room/Protect). Confirmed the team isn't a hard Trick Room build and worked out Trick Room's real justification (counters opposing Tailwind via post-modifier Speed inversion, not a vague "might come up"); checked and rejected Whimsicott-as-Taunt-denial since its real set is an offensive Tailwind setter, not a Taunt user. Bulk spread solved via `optimize-bulk.js --mode rank` against a real usage-weighted threat list rather than picked by hand; item chosen (Occa over Coba) after directly comparing which of two real lethal gaps (Heat Wave vs. Brave Bird) was worth closing | tools/damage-calc/optimize-bulk-cli.js rank-mode run + tools/damage-calc/cli.js follow-ups this session; real Pikalytics battledataregmbs3 data for Sinistcha and Whimsicott |
| 2026-07-23 | Re-solved Sinistcha's bulk spread (32 HP / 32 Def / 0 SpD → **32 HP / 18 Def / 16 SpD**) after user caught that the original threat list was almost entirely physical and asked directly whether real special attackers needed checking. Found Mega Froslass (Blizzard + Shadow Ball, both real top moves) guarantees a kill regardless of SpD investment, and Pelipper's Hurricane was a near-guaranteed kill the old spread never caught — now fixed. Re-verified Occa Berry is not just still good but load-bearing for the new, lower-Def spread: without it, both Heat Wave and Flare Blitz reopen as near-guaranteed kills | User-prompted re-check; tools/damage-calc/optimize-bulk-cli.js rank-mode re-run with 9 weighted threats; real Pikalytics battledataregmbs3 data for Mega Froslass and Pelipper |
| 2026-07-23 | Picked the team's two Mega slots (Aerodactyl and Gengar, situational bring-one-per-matchup) from a 4-option shortlist checked against real M-B viability and the team's documented gaps (no Ground or Ice answer). Locked Aerodactyl's real moveset (Tough Claws, not the earlier-assumed Unnerve; Rock Slide/Dual Wingbeat/Tailwind/Protect, all near-unanimous real usage) — SP spread still open. Built Gengar's full kit: real set turned out to be a Perish Trap piece (Shadow Tag, confirmed to trap both opposing Pokémon in doubles) rather than a dual-STAB attacker as first assumed; solved its SP spread in stages after user pushback caught an initial "leftover SP to HP" default — 24 SP Speed (real breakpoint beating the format's fast tier), 16 SP SpA (solved breakpoint: guarantees a Basculegion OHKO, not arbitrary), 26 SP HP (genuinely leftover, doesn't fix either of the two confirmed-unfixable matchups). Also caught and fixed a real bug in `optimize-bulk-cli.js` usage mid-session (`--budget` is additive to fixed SP, not a hard total) | User-prompted checks (Perish Trap fit question, SpA breakpoint pushback); tools/damage-calc/optimize-bulk-cli.js rank-mode runs; real Pikalytics battledataregmbs3 data for Aerodactyl-Mega, Gengar-Mega, Farigiraf; live search confirming Shadow Tag's doubles trapping behavior |
| 2026-07-23 | Solved Aerodactyl's SP spread (2 HP / 32 Atk / 32 Spe, Adamant). Checked its real offense against Garchomp first and found it's weak (Rock Slide resisted 0.5x, Dual Wingbeat only neutral) — confirmed Aerodactyl's whole value there is the Ground immunity, not damage. Compared Adamant vs. Jolly directly on real 2x targets: neither guarantees an OHKO anywhere, but Adamant gets Rock Slide to a near-certain 99.3–118.4% on Mega Froslass (the team's most severe documented threat) vs. Jolly's 89.8–106.1%, in exchange for only one real speed payoff (beating a specific, unconfirmed maxed-Jolly Scarf Basculegion build) — went with Adamant | tools/damage-calc/cli.js breakpoint checks this session; reference/vgc_type_chart_reference.md for the Garchomp resist/neutral confirmation |
| 2026-07-23 | Swapped Hisuian Arcanine for Incineroar once Aerodactyl's Ground immunity made Arcanine's Rock coverage redundant. Real teammate data made the case: Incineroar is Mega Gengar's #1 real teammate (79.9% co-occurrence), and Dark typing gives it a real answer (Psychic immunity) to one of Gengar's two confirmed-unfixable threats (Farigiraf). Pulled the actual 4 real Gengar-paired tournament teams and found the real archetype moveset differs from generic Incineroar — Fake Out/Parting Shot/Protect locked, no Flare Blitz in any of the 4 — but added Flare Blitz back as the 4th slot anyway after confirming it's a clean guaranteed OHKO on Kingambit (101.7–119.8%, vs. ~17–21% for the real alternatives Darkest Lariat/Throat Chop), giving the team a second independent answer to its most recurring threat. Item is Sitrus Berry (not the real-common Passho) to sustain Flare Blitz's own recoil, now a real cost since it's locked in rather than occasional. Confirmed honestly that the defensive upgrade (4x→2x Water/Ground weakness) softens but doesn't solve the team's persistent Garchomp/Basculegion problem — both still kill at max bulk. Also swapped Gengar's Disable for Substitute, following a real example build from the same Incineroar-paired archetype. Incineroar's SP spread not yet solved | User-prompted swap discussion; live search + direct Pikalytics fetch of the 4 real Mega-Gengar-paired tournament teams; tools/damage-calc/cli.js breakpoint checks this session |
| 2026-07-23 | Rebuilt Mega Gengar away from Perish Trap into a raw special attacker after the user judged the plan had been leaned into too far — Shadow Tag kept (still real value for a pure attacker: traps the opponent out of escaping a threatened kill, independent of Perish Song). New moveset **Protect / Shadow Ball / Sludge Bomb / Energy Ball**. Seriously considered Focus Blast first (clean guaranteed OHKOs on both Kingambit and Archaludon) but rejected it on user's stated no-low-accuracy principle once confirmed at 70% real accuracy — a real, serious risk for a Pokémon this fragile. The three 100%-accuracy replacements each deliver a distinct guaranteed OHKO on a real, previously-unanswered threat: Sludge Bomb → Floette-Eternal (the team's only Fairy answer anywhere), Energy Ball → Mega Swampert (4x, a real unexpected find given how dangerous Swampert has been all session), Shadow Ball → Basculegion. Re-solved the SP spread for the new moveset rather than reusing the old numbers — SpA's real binding constraint moved from 16 (old Basculegion-only target) to **27** (Sludge Bomb vs. Floette-Eternal, checked across all three new targets together); HP absorbed the difference, dropping from 26 to 15. Speed stayed at the previously-solved 24. Final real stats: 150 HP / 217 SpA / 191 Speed | User-prompted strategic reconsideration + accuracy objection; tools/damage-calc/cli.js breakpoint searches this session; live search confirming Focus Blast's 70% vs. Sludge Bomb's 100% accuracy |
| 2026-07-23 | Locked Palafin's 4th move as **Close Combat** (not Ice Punch) now that it's the team's primary Kingambit answer, and solved Incineroar's SP spread — after two real corrections caught mid-session. User first chose to drop Incineroar's Attack to 0 and max bulk instead, since Palafin's Close Combat made the redundant guaranteed Kingambit kill unnecessary (Flare Blitz still hits 75.4–89.1% on Kingambit even at 0 Atk SP). First bulk optimization only weighted physical threats plus one resisted special — user asked directly whether special attackers had been checked, surfacing Archaludon's Electro Shot (a real top-4 Pokémon never tested here) and flipping the "optimal" answer to a SpD-heavy extreme. That answer itself turned out wrong: every calculation had been run without Incineroar's own Intimidate applied to the attacking Pokémon (user caught this too) — once `boosts: {at: -1}` was correctly applied, Basculegion's Wave Crash flipped from a guaranteed 103–123% kill to a comfortable 69.3–83.2% survive, and the real optimal spread reverted to **32 HP / 0 Atk / 32 Def / 2 SpD, Impish**. Final real stats: 202 HP / 135 Atk / 156 Def / 112 SpD / 80 Speed. Only Mega Swampert's own Wave Crash remains a real coin-flip | User-prompted corrections (special-threat check, Intimidate reminder); tools/damage-calc/optimize-bulk-cli.js rank-mode re-runs; tools/damage-calc/cli.js direct calcs with boosts applied |
| 2026-07-23 | Filled the sixth and final roster slot with **Gallade** (Sacred Sword / Leaf Blade / Psycho Cut / Protect, Sharpness, Life Orb, Adamant, 34 HP / 32 Atk / 0 Spe) after a deep, user-prompted re-scan of the real ladder meta (fresh `team-usage` pull) identified Archaludon as the one decisive, unanswered gap — every other team member's best move topped out at 60–79% against it. Considered Sneasler (91.4–107.6%, close but not guaranteed) and Unaware (Clefable/Skeledirge — real ability, real users, but both underperform at 42–43% win rate and Skeledirge's actual damage was worse despite bypassing Stamina) before user's own idea, Sacred Sword, won out: it ignores Defense boosts (`ignoresDefenseBoosts: true`, directly neutralizes Stamina), and Gallade's real Sharpness ability boosts it further for a clean guaranteed 130.5–154.3% OHKO — the best number found. Mid-search, caught a major standing error: every Archaludon damage check all session had used a hypothetical 32 HP/32 Def dummy, when real M-B spreads invest almost nothing in Def (0–1 SP across all 4 real top spreads), favoring SpD instead — recomputing against the real spread flipped physical attacks stronger and special attacks weaker across the board. Gallade's Leaf Blade (also Sharpness-boosted) turned out to also make Gengar's Energy Ball fully redundant on Mega Swampert (181.9–214.7%, even bigger than Energy Ball's own number), so Energy Ball was swapped for Thunderbolt, covering a different real gap (Mega Staraptor, 84.0–98.8%, previously unanswered anywhere on the team) — no SP-spread changes needed for that swap. Both of Gallade's own guaranteed OHKOs need 0 Attack SP (Sharpness/Life Orb/base 125 Attack already overkill), and Speed was confirmed wasted (max 132 real Speed, below the entire established fast tier) — Attack kept at 32 anyway (no reason to reduce it) with the freed Speed budget going to HP. All six roster slots are now filled and solved | User-prompted deep meta re-scan + Sacred Sword/Unaware ideas; fresh Pikalytics `team-usage`/`topteams` pulls; live search for Archaludon's real M-B spreads (a major correction) and Gallade/Sneasler/Clefable/Skeledirge real usage data; tools/damage-calc/cli.js breakpoint checks throughout |
| 2026-07-23 | **Caught and fixed a duplicate-item violation**: Gallade was given Life Orb, which Palafin already holds — a hard rule (no two Pokémon on a team can hold the same item) that's already a documented pitfall in this repo and still got missed. Switched Gallade to Focus Sash (also its real dominant item, 31.8% usage) after re-verifying both guaranteed OHKOs survive the loss of Life Orb's 1.3x boost: Sacred Sword vs. Archaludon drops to 100.5–118.8% (still guaranteed) and Leaf Blade vs. Mega Swampert to 140.1–165.0% (still guaranteed). Attack's real breakpoint changed as a result — Sacred Sword's Archaludon kill now genuinely needs the full 32 Atk SP (was "0 needed" under Life Orb), so the existing 32 SP allocation is now a solved requirement rather than an arbitrary default; the numeric spread itself didn't need to change | User caught the duplicate directly; tools/damage-calc/cli.js re-verification with Focus Sash |
| 2026-07-24 | Palafin's 4th move changed from Close Combat to **Protect**, and item changed from Life Orb to **Mystic Water** — user's own calls. Verified before locking in: Gallade's Sacred Sword also guarantee-kills Kingambit (119.8–142.4%, same 4x Fighting-vs-Dark/Steel mechanism, boosted by Sharpness) — a real bonus, not why Gallade was picked, that makes Gallade a legitimate situational Kingambit answer so Palafin no longer needs to carry that job. Checked Mystic Water's real cost on the Water moveset: Wave Crash's OHKOs on Charizard-Y/Incineroar/Floette-Eternal all survive the smaller 1.2x boost, but **Wave Crash vs. Mega Staraptor drops from a guaranteed OHKO (101.2–118.5%) to not-guaranteed (92.6–109.3%)** — the exact breakpoint that originally set Palafin's Attack SP at 21. Tested whether maxing Attack could restore it: it can't, even at 32 Atk it's only 98.1–115.4%, better odds but still not guaranteed on the worst roll. Accepted as a real, known tradeoff (Mystic Water's no-recoil benefit judged worth it) rather than a solved gap. Also did the session's routine regulation re-verification (M-B still active, no change) since the file was flagged stale (>14 days) | User-driven changes; tools/damage-calc/cli.js verification of the Gallade/Kingambit and Mystic Water numbers this session; live search re-confirming Regulation M-B is still active |
| 2026-07-24 | Re-opened the Palafin-vs-Basculegion question from earlier in the project and reversed the original conclusion once items were equalized: with each running its own real, standard item, Palafin still hits harder (the original finding held) — but with both on Mystic Water, Basculegion outdamages Palafin in every matchup, since Adaptability's 2.0x STAB outweighs Palafin's higher base Attack once the item advantage is removed. User chose **Basculegion (Mystic Water / Adaptability / Adamant / 32 HP-32 Atk-2 SpD / Last Respects-Aqua Jet-Wave Crash-Protect) to replace Palafin**, accepting the real cost of giving up Choice Scarf's fast-revenge-killer role (Speed drops from 195–214 to 98) and stacking a third Ghost-type onto the roster (Basculegion/Sinistcha/Gengar). SP spread solved via binary search against the same 5-threat list used for Palafin: Attack's real minimum is 31 (rounds to the 32 cap), Speed confirmed wasted at any investment (max 130–143, still short of the fast tier). Also seriously explored a Mega Metagross-for-Gengar swap as a way to fix the Ghost-stacking (Metagross's real bulk would have resolved two of Gengar's confirmed-unfixable matchups, Kingambit's Kowtow Cleave and Farigiraf's Psychic, at the cost of losing Shadow Tag's unique trapping utility and the Fighting/Normal immunities) but the user ultimately kept Gengar unchanged | User-driven re-comparison and swap decision; tools/damage-calc/cli.js and optimize-bulk-cli.js verification of all Basculegion and Metagross numbers this session |
| 2026-07-27 | **Swapped Sinistcha for Farigiraf** after the user judged Sinistcha wasn't pulling its weight as support anymore post-swaps, with one hard requirement: the replacement had to counter/reverse an opposing Trick Room, not just redirect. Searched real current usage across the Trick-Room-capable support tier (Farigiraf, Whimsicott, Grimmsnarl, Maushold) rather than defaulting to top usage; Farigiraf was the only one combining real support utility with an actual Trick Room in its current moveset. Verified the reversal mechanic itself via live search (using Trick Room while one is already active cancels it) before relying on it, since this roster is now speed-split (Basculegion 98/Incineroar 80 slow vs. Aerodactyl-Mega 202/Gengar-Mega 191 fast) rather than uniformly fast or slow. Locked Armor Tail (99.9% real usage). **Caught a duplicate-item violation before writing it** — Farigiraf's real dominant item (Sitrus Berry) already belonged to Incineroar — and fixed it with the real second-choice item, Colbur Berry, verifying it as a genuine upgrade (Kingambit's Kowtow Cleave drops from 150–176 to 75–88 damage) rather than just a forced substitute. Built the moveset (Trick Room/Protect/Helping Hand/Psychic): confirmed Helping Hand via the vendored engine's `isHelpingHand` flag (not exposed through the standard calc API) with a concrete payoff — it turns Gengar's Thunderbolt vs. Mega Staraptor into a guaranteed OHKO; chose Psychic over Thunderbolt for the 4th slot on real usage (60.7% vs. 30.3%) and its own guaranteed Sneasler OHKO. User then set the explicit priority — maximize overall bulk, but the Sneasler OHKO is a hard floor — so the SpA breakpoint for that OHKO was solved first (0 SP needed), freeing the entire 66-SP budget for bulk; `optimize-bulk-cli.js --mode rank` against a real 5-threat list solved to **29 HP / 32 Def / 5 SpD, Bold**, verified comfortable against all 5 threats and the Sneasler floor re-confirmed at the final spread (170.7–201.3%). Confirmed as a real net gain, not a lateral move: Farigiraf's Normal/Psychic typing is immune to Ghost and only neutral to Ice, closing Sinistcha's old never-fixed Mega Froslass gap outright (Shadow Ball 0 damage, Blizzard 46.0–54.9%) | User-prompted broad roster search + explicit Trick-Room-counter and bulk-priority requirements; live search for Trick-Room-cancel mechanic and Whimsicott/Grimmsnarl/Maushold real usage; tools/damage-calc/cli.js and optimize-bulk-cli.js this session, plus a custom Side-construction script for Helping Hand's flat power modifier |
| 2026-07-27 | **Swapped Aerodactyl-Mega for Dragonite-Mega** after the user judged Aerodactyl underperforming. Root-caused it first: Aerodactyl's SP spread was fully offensive with zero bulk ever checked, and its own STABs never actually hit the team's most recurring real threat (Garchomp) hard — Rock Slide resisted, Dual Wingbeat only neutral — so its real value was purely the Ground immunity, not offense. Scouted real Mega Tailwind alternatives; found a Pikalytics data-source pitfall along the way (a per-Pokémon page's stat panels render empty for every Pokémon regardless of real usage — confirmed by checking Aerodactyl's own page, a known-heavy real pick, which was just as empty — the real signal is the page's curated "Champions Teams" section and its underlying JSON API, now documented in `vgc_common_pitfalls.md`). That method surfaced **Dragonite-Mega** as a real, currently-winning pick (multiple Limitless top finishes: 9-0/8-1/11-1, same real build each time) with a real 84.7% Basculegion teammate synergy, vs. Mega Pidgeot (a real M-A Tailwind Mega) which had zero curated real teams in M-B and was ruled out. User then set the explicit build target: guarantee a Garchomp OHKO, preferably with Dragon Pulse. Pulled Garchomp's real dominant spread directly via its JSON API (Life Orb 51.5%, Rough Skin 98.5%, top individual spread 2 HP/32 Atk/32 Spe at 32.7% usage, 185 real HP) and binary-searched the SpA breakpoint: **17 SpA SP guarantees the kill** (186–218 damage). A rare ~1.3%-usage bulkier Garchomp spread (32 HP/4 SpD) isn't covered even at max SpA — accepted as a known low-presence gap. Solved the remaining 49 SP via `optimize-bulk-cli.js --mode rank` against a real weighted threat list (Mega Froslass Blizzard, Sylveon Hyper Voice, Garchomp Rock Slide, Archaludon Dragon Pulse, Kingambit Kowtow Cleave) to **29 HP / 0 Def / 20 SpD** — Def landed at 0 because Multiscale (verified directly: halves Mega Froslass's Blizzard from 268–324 to 134–162) already covers physical hits without further investment. Speed fixed at 0 by judgment call after confirming even a maxed Timid Dragonite (167 Speed) can't reach the real dominant Jolly Garchomp's 169. Final real stats: 195 HP / 129 Atk / 135 Def / 200 SpA / 165 SpD / 120 Speed, Modest nature, Dragon Pulse/Flamethrower/Tailwind/Protect (real current moveset, confirmed via multiple curated tournament teams) | User-prompted scouting question + explicit Garchomp-OHKO requirement; Browser tool + Pikalytics JSON API for Dragonite/Pidgeot/Garchomp real data; tools/damage-calc/cli.js and optimize-bulk-cli.js this session |
| 2026-07-27 | **Swapped Incineroar for Maushold** after the user noticed they kept not bringing Incineroar because of real, current Defiant Kingambit and Competitive Milotic. Verified the mechanic before acting: Kingambit is 96.1% real Defiant, Milotic is 99.1% real Competitive, both converting any opponent-inflicted stat drop into a free +2 boost (Attack/SpA respectively) — worse than neutral since Kingambit's own real dominant move (Sucker Punch, 99.5%) is priority, meaning Incineroar's automatic, unavoidable Intimidate trigger arms it before the team can react; Parting Shot fed the same interaction. Searched real alternatives: Grimmsnarl's real kit (Parting Shot/Spirit Break) has the same avoidable-but-present problem, while Maushold's real dominant kit (Follow Me 95.4%, Friend Guard 73.2%) doesn't lower opponent stats at all, closing the issue structurally. User specified the exact moveset — **Follow Me / Super Fang / Feint / Taunt**, explicitly no Protect and no Population Bomb — reasoning that Protect and Follow Me are mutually exclusive on the same turn anyway. Locked Friend Guard (73.2% real). Bulk-checked against the same weighted real threat list used throughout this file plus a Milotic Scald check: found Mega Staraptor's Close Combat is a confirmed-unfixable OHKO via SP alone (236–278 vs. max 181 HP, Fighting 2x on pure Normal with zero resistances) — but real dominant item **Chople Berry (38.7% usage)** fixes it directly (118–139, comfortable survive), rejected Focus Sash (24.2%) after accounting for the no-Protect, repeated-exposure role since it only ever saves the first hit. Solved the full 66-SP budget (no move needs Atk/SpA) via `optimize-bulk-cli.js --mode rank` to **32 HP / 31 Def / 3 SpD, Impish** — every real threat now a comfortable survive. Final real stats: 181 HP / 95 Atk / 133 Def / 76 SpA / 98 SpD / 131 Speed | User-identified real pattern (kept not bringing Incineroar) + explicit moveset/no-Protect/max-survivability requirements; live search confirming Defiant/Competitive mechanics; Pikalytics JSON API for Kingambit/Milotic/Grimmsnarl/Maushold/Incineroar real data; tools/damage-calc/cli.js and optimize-bulk-cli.js this session |
| 2026-07-27 | **Re-tuned Gallade's SP spread from 34 HP / 32 Atk / 0 Spe to 4 HP / 32 Atk / 30 Spe** — user's own call, made once Maushold's real 131 Speed was known. Rather than leaving Speed fully wasted (32 SP only reached 132, still below the established fast tier), solved for the exact breakpoint that puts Gallade one point behind Maushold: **30 Spe SP = 130 real Speed**, confirmed directly rather than assumed, so Gallade's own attacks resolve after Maushold's Super Fang has already halved the target's current HP. The 2 SP displaced from HP (34→4) doesn't affect either of Gallade's guaranteed OHKOs (Sacred Sword vs. Archaludon, Leaf Blade vs. Mega Swampert), both already solved at 0 spare Attack SP. Final real stats: 147 HP / 194 Atk / 85 Def / 135 SpD / 130 Speed | User-driven change once Maushold's real Speed was solved; tools/damage-calc/cli.js verification of the exact Spe SP breakpoint |
