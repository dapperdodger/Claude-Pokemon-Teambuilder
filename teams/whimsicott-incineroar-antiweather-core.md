# Team: Whimsicott / Incineroar Anti-Weather Core

**Status:** Draft
**Built for:** Ladder / tournament prep, built around a user-required Whimsicott + Incineroar (Taunt) core with a dedicated weather-neutralizing piece
**Regulation:** M-B (verified as of 2026-07-10 — Mega Evolution only, no Tera/Dynamax/Z-Move)
**Last updated:** 2026-07-10

## The six

| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |
|---|---|---|---|---|---|
| Whimsicott | Focus Sash | Prankster | Bold | 32 HP / 32 Def / 2 SpD | Tailwind / Moonblast / Encore / Protect |
| Incineroar | Chople Berry | Intimidate | Impish | 32 HP / 16 Def / 18 SpD | Fake Out / Parting Shot / Flare Blitz / Taunt |
| Garchomp | Life Orb | Rough Skin | Jolly | 2 HP / 32 Atk / 32 Spe | Dragon Claw / Rock Slide / Earthquake / Protect |
| Gholdengo | Metal Coat | Good as Gold | Modest | 32 HP / 2 Def / 32 SpA | Make It Rain / Shadow Ball / Protect / Nasty Plot |
| Staraptor (→ Mega, fixed Contrary) | Staraptorite | — | Jolly | 2 HP / 32 Atk / 32 Spe | Close Combat / Protect / Brave Bird / Roost |
| Drampa | Silk Scarf | Cloud Nine | Bold | 32 HP / 32 Def / 2 SpA | Hyper Voice / Protect / Earth Power / Calm Mind |

(SP allocation uses the current Champions Stat Points system, not old EVs
— see `reference/vgc_current_regulation.md`'s "Stat system" section.)

## Why these six

**Whimsicott** is a required pick. Real current usage (Pikalytics,
`battledataregmbs3`): Tailwind 98.5%, Moonblast 92.0%, Encore 74.1%,
Protect 56.5%, Focus Sash 75.5%, Prankster 99.4%. Bold/32 HP/32 Def gives
it a real shot at surviving a physical hit even off Focus Sash (which only
guarantees survival from full HP against a single hit) so it can still
threaten Encore/Tailwind on a follow-up turn.

**Incineroar** is the other required pick, with **Taunt** specifically
requested. Real current usage shows Taunt at only 3.4% — it's a genuine
tech pick, not the standard 4th slot (which is usually Throat Chop 53.7%
or Darkest Lariat 29.4% for extra coverage). The trade-off is real:
running Taunt over Throat Chop/Darkest Lariat costs Incineroar its
second attacking option, but it buys a hard stop on setup — including
**opposing weather-setters, Trick Room, and screens**, all on Incineroar's
own turn, which is exactly the kind of "shut down before it starts"
tool the user asked for, layered on top of Altaria's after-the-fact
neutralization below. Item changed from Incineroar's real dominant
Sitrus Berry (59.8%) to its real second-most-common item, **Chople
Berry** (15.0%), only because Altaria (below) needed Sitrus Berry more
directly and no two Pokémon can hold the same item — verified real via
`tools/damage-calc/cli.js`: Chople-Berry Incineroar (32 HP/16 Def, Impish)
survives a real Sneasler Close Combat (Unburden/White Herb, no power
item — Sneasler's actual dominant real build) at 108-127 of 202 HP
(53-63%), with room to spare, and Impish's own Def boost (not modeled in
that test, which used a neutral-Def comparison nature) only improves that
margin further.

**Garchomp** is the single most-supported natural addition to this core,
not a guess: it's real teammate data's **#1 partner for Whimsicott**
(67.4% synergy) and **#2 real teammate for Incineroar**, and the
Garchomp+Whimsicott two-mon core is the single most common pairing in the
entire format (18.7% of sampled Reg M-B teams, 1,367 teams). Real build:
Dragon Claw 89.4% / Rock Slide 82.0% / Earthquake 80.7% / Protect 70.2%,
Life Orb 51.5%. A verified real 10-0 Reg M-B tournament team
("PASE GRATUITO NINTENDO SWITCH 2 reg MB") runs exactly Garchomp +
Whimsicott + Incineroar as its core three, which is the direct precedent
this build extends.

**Gholdengo** is real usage's #2 teammate for Incineroar and a top-5
teammate for both Whimsicott and Garchomp, and it's the piece from that
same real 10-0 tournament team. Steel/Ghost is fully **immune to
Fighting** (Ghost's Fighting-immunity isn't cancelled by Steel's own
Fighting weakness — immunity is absolute) — directly patching the
Fighting-weak spot that Incineroar, Garchomp, and Staraptor all share.
Real build: Make It Rain 99.0% / Shadow Ball 99.0% / Protect 70.9% /
Nasty Plot 58.5%, Good as Gold 100%. Item shifted from Gholdengo's real
top choice (Life Orb, 37.9%) to avoid a duplicate with Garchomp's Life
Orb; its real Choice Scarf alternative (27.1%) would force dropping
Protect/Nasty Plot entirely for an unverified different 4-move set, so
**Metal Coat** (11.3% real usage) was used instead specifically to keep
the confirmed Make It Rain/Shadow Ball/Protect/Nasty Plot kit intact.

**Mega Staraptor** is this team's Mega Evolution slot (Rule 5: Mega is
the only live mechanic this regulation) and the third member of that same
real 10-0 team. Real build shows Staraptorite at 94.5% usage — the
same pre-Mega-ability-selection trap already documented in
`vgc_common_pitfalls.md` (Swampert's Torrent/Damp) shows up again here:
Pikalytics reports "Intimidate 97.1%" for Staraptor, but that's the
pre-Mega ability choice — **Contrary is Mega Staraptor's real fixed
battle ability** once it evolves (confirmed via live search), turning
Close Combat's stat drop into a self-buff. Real moves: Close Combat
98.2% / Protect 90.2% / Brave Bird 81.2% / Roost 71.5%.

**Drampa** is the dedicated anti-weather piece, chosen over an
own-weather-overwrite plan per the user's explicit "don't want to rely
on weather myself" direction, and chosen as **non-Mega** Drampa
specifically. This needed a real correction mid-session: an initial plan
used Mega Altaria for this role, but **Mega Drampa's fixed ability is
Berserk, not Cloud Nine** (confirmed via a live Game8 Mega Drampa guide)
— identical to Mega Altaria's own fixed-Pixilate trap, and the same
pre-Mega-ability-selection pattern documented for Swampert/Staraptor/
Froslass elsewhere in this file: real Pikalytics data shows 80.5% of
Drampa builds hold Drampanite (the mega stone) while 81.4% show "Cloud
Nine" selected — that 81.4% is almost entirely the *pre-Mega* ability
pick, meaningless in battle for anyone who actually evolves. Running
Drampa **without** Drampanite is the only way Cloud Nine survives into
battle. Real non-Mega build: Hyper Voice 93.2% / Protect 84.7% / Earth
Power 60.2% / Calm Mind 47.5%; item shifted from Drampa's real top pick
(also Drampanite) to its real tied-second option **Silk Scarf** (5.1%,
tied with Focus Sash — which Whimsicott already holds).

Verified with `tools/damage-calc/cli.js` what Cloud Nine actually buys
here, against the format's real premier weather threat, **Mega Froslass**
(Snow Warning is its real fixed Mega ability, same pre-Mega-ability trap
— reported "Cursed Body/Snow Cloak" numbers are pre-Mega selections, not
the battle ability). Correcting an overclaim from the Altaria version of
this build: Cloud Nine does **not** reduce an Ice-move's raw damage if it
connects — Snow only grants Blizzard perfect accuracy and blocks Aurora
Veil, both confirmed via live search. The real, load-bearing benefit is
accuracy: without Cloud Nine, Blizzard is guaranteed to hit; with it,
Blizzard reverts to its unboosted, missable ~70% accuracy, and Aurora
Veil fails outright even while snow is technically still active in the
background.

This is exactly why non-Mega Drampa was chosen over Altaria for this
specific job, not just as a same-role swap: **Bold/32 HP/32 Def Drampa
survives a real Snow-boosted Blizzard at 122-146 of 185 HP (66-79%
remaining)**, while the same Blizzard was tested against an
equally-invested Altaria at **216-256 of 182 HP — a guaranteed kill even
when it connects**. Since Garchomp, Whimsicott, and Staraptor are all
independently weak to Ice too, having the anti-weather piece itself
actually *survive* the team's single scariest real threat (rather than
only reducing the odds it lands) is worth more here than Altaria's
stronger overall usage/teammate data. The trade-off is real, not free:
Drampa is 2x weak to **Fighting** (Sneasler's real Close Combat does
182-216 of 185 HP — a near-guaranteed kill of its own), where Altaria
actually *resisted* Fighting at 0.5x. That risk is judged acceptable here
because the team already has two real, separate Fighting answers
(Gholdengo's immunity, Incineroar's Chople-Berry survival, both above) —
nothing else on the team otherwise resists Blizzard the way Drampa now
does.

## Intentional exclusions

- **A Drought/Drizzle own-weather-overwrite plan** — considered per the
  brainstorming discussion, but rejected because the user explicitly said
  they don't want the team's own game plan to depend on weather. Cloud
  Nine achieves the "shut down their weather" goal without creating a new
  single point of failure the way the existing `gholdengo-rotomwash-rain-core`
  team's Pelipper does.
- **Sylveon** — the real 10-0 reference team's sixth member, and a real
  top-5 teammate for both Whimsicott and Garchomp. Cut for the anti-weather
  slot because its role (Fairy-type special attacker/priority via
  Pixilate, some Fighting/Dark resistance) overlaps with what Whimsicott
  and Gholdengo's Fighting immunity already bring, while a Cloud Nine
  piece fills a gap nothing else on the team could.
- **Altaria (Cloud Nine)** — the first real candidate tried for this slot,
  and genuinely a stronger *overall* real pick (better usage, a real
  top-5 teammate fit with Garchomp, resists Fighting at 0.5x). Swapped for
  Drampa specifically because Altaria's own 4x Ice weakness meant it was
  guaranteed-killed by the exact Snow-boosted Blizzard it was meant to
  answer (216-256 of 182 HP, verified via `tools/damage-calc/cli.js`),
  while Drampa's weaker overall stats/usage are offset by actually
  surviving that same hit (122-146 of 185 HP). See "Why these six" above
  for the full trade-off (Drampa gives up Altaria's Fighting resistance to
  gain Blizzard survivability) — this is a real judgment call, not a
  strict upgrade, and worth revisiting if real games show the Fighting
  exposure is the bigger problem in practice.
- **A Cloud Nine Golduck/Lickilicky-style alternative** — not pursued;
  Drampa (like Altaria before it) has real, confirmed current-format
  presence in Champions team data, unlike more obscure Cloud Nine holders.
- **Air Lock (Rayquaza)** — not seriously considered; Rayquaza is a
  Restricted Legendary and this build wasn't scoped as a Restricted team.

## Known weaknesses / open questions

- **Shared Ice weakness across four of six members** (Whimsicott/Grass,
  Garchomp/Dragon, Staraptor/Flying, Drampa/Normal-Dragon — all 2x, none
  4x now that Altaria's gone). Cloud Nine specifically strips
  *Snow-Warning-enabled* Blizzard's guaranteed accuracy and blocks Aurora
  Veil entirely as long as Drampa is alive and on the field — but it does
  **not** reduce Blizzard's raw damage if it connects, and does **not**
  help at all against a plain Ice-coverage move from a non-weather
  attacker (e.g., an Ice Punch/Ice Beam tech on something that isn't
  itself weather-dependent). Real, only-partially-solved risk, not a
  fully closed gap — see the Drampa vs. Altaria Blizzard-survival numbers
  in "Why these six."
- **Fighting weakness got worse in the anti-weather slot, better
  elsewhere.** Gholdengo is fully immune and Incineroar's Chople Berry
  buys real survival margin (53-63% HP remaining vs. a real Sneasler Close
  Combat) — unchanged. But **Drampa is 2x weak to Fighting** (unlike
  Altaria, which resisted it at 0.5x): verified 182-216 of 185 HP from the
  same real Sneasler Close Combat, a near-guaranteed kill. Don't switch
  Drampa into a predicted Fighting attacker; it's here for the Ice/Snow
  matchup specifically, not as a general-purpose wall. Garchomp and
  Staraptor remain exposed too if Gholdengo/Incineroar aren't the ones
  taking the hit.
- **`tools/damage-calc/cli.js`'s vendored item list appears to be missing
  Mega Staraptor's mega stone** (tested both "Staraptorite" and
  "Staraptonite" — both returned `itemChampionsLegal: false` with no
  broader-dex match either, unlike the tool's species/move lookups which
  distinguish "confirmed restricted" from "not in vendored data yet").
  Real Pikalytics usage (94.5% Staraptite adoption) makes it near-certain
  this is a vendored-data gap, not a genuine in-game restriction — trusted
  the live search per this repo's stated precedence (live search > repo
  tooling). Worth a follow-up re-vendor of the tool's item list, not
  addressed in this session.
- **No dedicated Trick Room answer** — same structural gap as the
  existing rain-core team; not evaluated in depth this session.

## Bring-6-pick-4 notes

- **vs. Snow/Mega Froslass teams**: Lead or bring in Drampa as early as
  safely possible — while it's on the field, Blizzard loses its
  never-miss accuracy and Aurora Veil cannot be used at all (verified via
  live search + `tools/damage-calc/cli.js`), and unlike Altaria in the
  prior draft of this build, Drampa actually survives a connecting
  Blizzard (122-146 of 185 HP) rather than being guaranteed-killed by it.
  Garchomp remains the team's biggest liability here (guaranteed OHKO from
  Snow-boosted Blizzard) and should not be sent in blind against a live,
  un-neutralized Froslass. Keep Drampa away from any predicted Fighting
  attacker on the same Snow team (Sneasler is a common real Froslass
  teammate) — see Known Weaknesses.
- **vs. Sun/Charizard-Y teams**: Taunt-Incineroar can deny the Drought
  setter its follow-up support move (e.g. Tailwind/screens) the turn it
  switches in. Drampa's Cloud Nine blocks Sun's damage boost to
  Charizard-Y's real Fire-type moves (Heat Wave) specifically — not yet
  damage-tested against Charizard-Y's actual kit this session, flagged as
  a follow-up rather than asserted from the Ice-focused tests above.
- **vs. Trick Room**: Untested this session — flagged as an open question
  above, not resolved.

## Changelog

| Date | Change | Reasoning |
|---|---|---|
| 2026-07-10 | Initial build — required Whimsicott + Incineroar (with Taunt) core, plus a dedicated Cloud Nine Altaria anti-weather piece (chosen over an own-weather-overwrite plan per user preference). Completed with Garchomp/Gholdengo/Mega Staraptor, extending a real, verified 10-0 Reg M-B tournament team (Garchomp/Whimsicott/Incineroar/Gholdengo/Sylveon/Staraptor) by swapping Sylveon for Altaria | Pikalytics `battledataregmbs3` real usage data for all six; live search confirming Mega Staraptor's real fixed Contrary ability and Mega Froslass's real fixed Snow Warning ability (both pre-Mega-ability-selection traps, same pattern as the Swampert case in `vgc_common_pitfalls.md`); `tools/damage-calc/cli.js` for the Sneasler-vs-Incineroar and Blizzard-vs-Cloud-Nine verifications |
| 2026-07-10 | Swapped Altaria → non-Mega Drampa for the anti-weather slot, at user request to consider Mega Drampa. Caught mid-check that Mega Drampa's fixed ability is Berserk, not Cloud Nine (same trap as Mega Altaria/Pixilate) — Drampa only works for this role non-Mega. Damage-calc comparison found Drampa actually survives a connecting Snow-boosted Blizzard (122-146 of 185 HP) where Altaria was guaranteed-killed by it (216-256 of 182 HP) despite Cloud Nine being active on both, at the cost of Drampa being 2x weak to Fighting where Altaria resisted it (0.5x). Also corrected an overclaim in the original Altaria writeup: Cloud Nine blocks weather's accuracy/move-legality effects (Blizzard accuracy, Aurora Veil), it does not reduce a connecting attack's raw damage | Game8 Mega Drampa guide (fixed Berserk ability); Pikalytics `battledataregmbs3` Drampa page (80.5% Drampanite vs. 81.4% "Cloud Nine" selected — the same pre-Mega-ability-selection mismatch as Staraptor/Froslass); `tools/damage-calc/cli.js` Blizzard/Close Combat comparisons vs. both Drampa and Altaria |
