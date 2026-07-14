# Team: Gholdengo / Rotom-Wash Rain Core

**Status:** Testing
**Built for:** Ladder / tournament prep, built around a Whimsicott + Gholdengo + Rotom-Wash favorite core (Whimsicott was later swapped for Archaludon — see Changelog)
**Regulation:** M-B (verified as of 2026-07-09/07-10 — Mega Evolution only, no Tera/Dynamax/Z-Move)
**Last updated:** 2026-07-10

## The six

| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |
|---|---|---|---|---|---|
| Gholdengo | Metal Coat | Good as Gold | Modest | 32 HP / 2 SpA / 32 Spe | Make It Rain / Shadow Ball / Protect / Nasty Plot |
| Rotom-Wash | Sitrus Berry | Levitate | Bold | 32 HP / 32 Def / 2 SpA | Hydro Pump / Thunderbolt / Will-O-Wisp / Protect |
| Pelipper | Focus Sash | Drizzle | Modest | 32 HP / 32 SpA / 2 SpD | Hurricane / Weather Ball / Tailwind / Wide Guard |
| Swampert | Swampertite (→ Mega, fixed Swift Swim) | — | Adamant | 32 HP / 16 Atk / 18 Def | Wave Crash / Earthquake / Ice Punch / Protect |
| Grimmsnarl | Light Clay | Prankster | Bold | 32 HP / 32 Def / 2 SpD | Light Screen / Reflect / Parting Shot / Foul Play |
| Archaludon | Leftovers | Stamina | Modest | 32 HP / 2 Def / 32 SpA | Electro Shot / Flash Cannon / Protect / Dragon Pulse |

(SP allocation uses the current Champions Stat Points system, not old EVs
— see `reference/vgc_current_regulation.md`'s "Stat system" section.)

## Why these six

**Pelipper** is the engine, not just a support piece — Drizzle rain is what
makes Swampert and Archaludon function at their ceiling. Real, confirmed
teammate data (Pikalytics): Archaludon is Pelipper's #1 real teammate,
Swampert is #2 — this isn't an invented core, it's completing an
established real one. Wide Guard blocks the opposing team's spread
finishers regardless of Trick Room speed order, and it's immune to
Farigiraf's Armor Tail since it targets Pelipper's own side, not the
opponent. Real weakness: 4x to Electric, single point of failure for the
whole rain plan — no spread fixes this, only careful play does.

**Mega Swampert** is the rain payoff. Swift Swim is its *fixed* Mega
ability (confirmed — Torrent/Damp are pre-Mega only, a correction caught
mid-session), doubling its Speed to ~180 in rain. SP trimmed from a
default 32 Atk down to 16 after confirming Wave Crash was already
overkill on real bulky targets (Metagross) even at half investment — the
freed 16 points went into Def instead of sitting unused as excess power.

**Archaludon** — Electro Shot is a two-turn charge move that fires
immediately in rain while keeping its +1 SpA boost. Calculated: 260+
damage on Mega Staraptor, an outright kill regardless of its real (fixed)
Contrary ability. SP is 32 HP / 2 Def / 32 SpA — the 2 Def is a real,
tested breakpoint (not a guess) that fully survives a Sneasler Close
Combat using Sneasler's actual dominant real build (Unburden ability,
White Herb/Focus Sash — no power item at all in real usage), freeing the
other 30 points to stay in SpA at zero survival cost.

**Gholdengo** answers Mega Staraptor and Sneasler through typing alone —
Steel/Ghost is immune to Fighting (blocks Close Combat entirely) and
resists Flying. SP shifted from 2 HP/32 SpA to 32 HP/2 SpA (same Speed
tier, unchanged) after finding Ground-type damage doesn't care about SpA
investment — this doesn't guarantee survival against a real Life Orb
Garchomp's Earthquake (174-205 vs. 194 max HP, still lethal on high
rolls) but meaningfully improves the odds versus the original 2 HP spread.

**Rotom-Wash** is the bulky pivot and the real answer to Kingambit —
Will-O-Wisp both halves its physical output and denies Sucker Punch
outright (it only works if the target attacks). Bold/32 Def spread
comfortably tanks Mega Staraptor's Close Combat and Kingambit's Kowtow
Cleave using their real, verified items (Chople Berry/Black Glasses for
Kingambit) with large margins to spare — deliberately kept bulky rather
than maxing SpA, since the team already has three dedicated attackers
(Gholdengo, Swampert, Archaludon).

**Grimmsnarl** restores the team's only priority move (none of the other
five have one) via... actually not Fake Out — final moveset dropped Fake
Out *and* Protect in favor of the real meta-standard Light Screen/Reflect/
Parting Shot, plus Foul Play (weaponizes the attacker's own stat — real
numbers: 85-102 on Garchomp, 61-72 on Sneasler). Spread corrected from an
initial Careful/SpD build (wrong stat — it was defending against Farigiraf
Psychic and Sinistcha Ghost, both already blocked by typing regardless of
SpD) to Bold/32 Def, which is what actually matters against its real
2x weakness (Steel, from Kingambit/Metagross's Iron Head).

## Intentional exclusions

- **Whimsicott** — the original third anchor of this build. Cut for
  Archaludon after side-by-side threat comparison showed its two
  headline traits (Dragon immunity, a priority move via Pixilate-adjacent
  reasoning) were already duplicated by Grimmsnarl, while Archaludon
  offered genuinely new coverage (a guaranteed-kill answer to every
  Flying-type threat via rain-unlocked Electro Shot) that nothing else on
  the team had.
- **Incineroar / Raichu-Mega-Y** — the original team's Fake Out lead and
  glass-cannon special attacker. Both cut: Intimidate is actively harmful
  against two of the format's biggest threats (Kingambit's Defiant and
  Mega Staraptor's Contrary both turn a stat drop into a buff), and
  Raichu-Y's 60 HP / 55 Def bulk couldn't survive the current metagame's
  spread damage.
- **Garchomp** — the format's #1 most-used Pokémon, considered as
  weather-independent insurance against the whole team's rain dependency.
  Cut once its main selling points didn't hold up: it does NOT resist
  Mega Staraptor's Flying STAB (a real error caught and corrected
  mid-session — Ground doesn't get a defensive bonus against Flying,
  that immunity only runs the other direction), and its Ground/Steel
  breaking role is redundant with what Mega Swampert already brings.
- **Sylveon** — considered as a second Whimsicott-style pick to preserve
  Fairy-typing. Rejected after a threat-by-threat check showed it offered
  no super-effective coverage against any named top threat that Rotom-Wash
  didn't already have, while stacking the exact same new weaknesses
  (Poison, Steel) that Grimmsnarl already carries as part-Fairy.
- **Mega Tyranitar** — an earlier direction built around Sand Stream as a
  Trick Room/bulk answer. Dropped once real usage data showed Pelipper
  (rain) is a top-10 archetype that would simply overwrite Tyranitar's
  sand for free, undermining the entire rationale for running it as a
  "weather control" pick.

## Known weaknesses / open questions

- **Pelipper is a single point of failure.** 4x weak to Electric (a real
  Thunderbolt from a generic Raichu — genuinely #9 real usage in this
  format — does 324-384, several times its ~167 HP). If it dies before
  setting rain, Swampert reverts to a mediocre 90-Speed attacker and
  Archaludon's Electro Shot needs its charge turn back. No spread fixes
  this; it has to be protected by play, not itemization.
- **No true Trick Room answer.** The team's actual counter to Farigiraf/
  Sinistcha-led Trick Room is "deal real damage before Room resolves"
  (Trick Room is -7 priority, always last) rather than preventing it —
  verified this does NOT reliably kill either setter turn one, even in
  the best case with no Fake Out disruption (Farigiraf survives with
  36-61 HP left; Sinistcha often survives too). The real plan for
  surviving the reversed-order turns afterward is Rotom-Wash's bulk +
  Grimmsnarl's Armor-Tail-proof screens, not preventing the setup.
- **Gholdengo has four separate 2x weaknesses** (Fire, Ground, Ghost,
  Dark) and doesn't reliably survive a real Life Orb Garchomp's
  Earthquake (174-205 vs. 194 max HP) — it has to be piloted carefully,
  not treated as a wall.
- **Total rain dependency.** Two pieces (Swampert, Archaludon) have their
  entire ceiling gated on Pelipper's Drizzle staying up — an opposing
  weather-setter cancels both at once, not just one.
- **Zero Fake Out** — Grimmsnarl's final moveset (Light Screen/Reflect/
  Parting Shot/Foul Play) means the team's only priority tool from the
  post-Whimsicott build was traded away too. Priority-based disruption is
  gone entirely; the team leans on bulk, screens, and Parting Shot
  pivots instead.
- **Charizard-Y's real (95.4% usage) moveset is Heat Wave/Solar Beam/
  Weather Ball/Protect — an entirely special Drought set, not the
  physical Flare Blitz set an earlier check in this file wrongly assumed.**
  Solar Beam fires with no charge turn in Sun (same trick as our own
  Electro Shot in rain) and is Grass-type — which is a genuine problem
  since Grass hits both Water and Ground for weakness:
  - **Swampert is 4x weak to it: 324-384 damage on 207 HP.** This is a
    guaranteed kill under any circumstance, screens included (still
    104-124% even with Light Screen's ~1/3 doubles reduction). Swampert
    must never be sent in against a live Sun-active Charizard-Y — this is
    a hard rule, not a preference.
  - **Rotom-Wash is 2x weak: 166-196 on 157 HP** (also a guaranteed kill
    unscreened) **but survives at 111-131 (71-83%) once Grimmsnarl's
    Light Screen is up.**
  - **Gholdengo takes Heat Wave (spread) for a real 191-225** (after
    correctly applying the doubles 0.75x spread reduction, which an
    earlier draft of this note forgot) **but survives at 127-150
    (65-77%) once Light Screen is up.**
  - **Archaludon quad-resists Solar Beam (31-36 damage, trivial)** and
    takes Heat Wave close to neutrally — the team's one Pokémon that can
    sit across from this Charizard indefinitely, screens or not.
  - **The real plan**: lead Grimmsnarl (Prankster Light Screen, gets up
    almost regardless of speed) + Archaludon against any predicted Sun
    team. Bring Rotom-Wash/Gholdengo in only after screens are up, not
    blind. Bench Swampert entirely for this specific matchup.
  - **Checked the team's other three pieces too, not just Charizard**:
    Sylveon's Hyper Voice is a real threat to Grimmsnarl (155-185 of 202
    HP after the doubles spread reduction, 77-92%) — but its priority
    option (Quick Attack) only does 42-50 since real Sylveon sets are
    SpA-focused with low Atk, so Grimmsnarl's own Prankster Light Screen
    still reliably beats Hyper Voice to the punch. Garchomp's Life Orb
    Earthquake does a real 133-156 (68-79%) to Archaludon — survivable,
    not a clean wall. Aerodactyl is very likely running its non-Mega
    Focus Sash build (34.7% real usage) rather than the Mega (95.7%
    overall usage), since this archetype's Mega slot is already spent on
    Charizard-Y and a team can only Mega Evolve one Pokémon per battle.
  - **Tech worth using**: bring Pelipper in the back (not leading) and
    swap it in after Light Screen is up, ideally once Charizard has
    already Mega Evolved. Pelipper's Drizzle overwrites their Sun with
    Rain, which (a) strips Solar Beam's no-charge-turn trick entirely,
    forcing a telegraphed charge turn again, and (b) cuts Heat Wave's
    real damage to Gholdengo from a guaranteed kill (191-225) down to a
    manageable 84-98 raw (~63-74 after spread adjustment, 32-38% of HP).
    Real cost: Garchomp or the likely-Focus-Sash Aerodactyl can hit the
    swapped-in Pelipper with Rock Slide for 84-102 (50-61% of ~167 HP) —
    a real dent, not fatal, and Pelipper's other big weakness (4x
    Electric) doesn't apply since none of this archetype's four
    real pieces carry Electric coverage.

## Bring-6-pick-4 notes

Checked against real top-team archetypes from Pikalytics' top-teams/cores
page (not just individual usage rankings — see the "Do this every
session" note in `vgc_teambuilding_methodology.md`), not theorized.

- **vs. Trick Room (Farigiraf+Kingambit or Sinistcha+Incineroar/Staraptor)**:
  Bring Grimmsnarl, Rotom-Wash, Gholdengo, Pelipper — bench Swampert and
  Archaludon. Lead Grimmsnarl (screens immediately, Armor-Tail-proof since
  they target your own side) + Rotom-Wash (Will-O-Wisp cripples their
  physical lead; that hit lands before Room resolves regardless of speed,
  since Trick Room is always -7 priority). Back with Gholdengo (immune to
  Farigiraf's Psychic) and Pelipper for Wide Guard — none of the real
  Trick Room partners found are Electric, so Pelipper's one real weakness
  barely applies here. Archaludon's 2-turn charge move is a liability in
  a slow grindy game; Swampert's whole identity (speed) is the wrong axis.
- **vs. Mega Staraptor teams**: Bring Pelipper, Archaludon, Gholdengo,
  Rotom-Wash — bench Grimmsnarl and Swampert. Rain-boosted Electro Shot
  is a same-turn guaranteed kill (260+ calculated) on Staraptor; Gholdengo
  is separately immune to its whole kit if Electro Shot isn't up yet.
  Probably the team's best matchup on paper.
- **vs. Sneasler teams**: Bring Gholdengo, Archaludon, Rotom-Wash,
  Grimmsnarl — bench Pelipper (easy Fake Out target, rain doesn't help)
  and Swampert. Gholdengo is immune to both its real STABs (Close Combat
  + Dire Claw) simultaneously — nothing else on the team can claim that.
  Archaludon's 2 Def breakpoint was verified against Sneasler's actual
  dominant build (Unburden/White Herb — no power item in real usage).
- **vs. Kingambit-centric teams**: Bring Grimmsnarl, Rotom-Wash, Gholdengo,
  Swampert — bench Pelipper and Archaludon. Grimmsnarl quad-resists its
  Dark STAB and Foul Play punishes its Attack stat directly; Rotom-Wash
  resists Iron Head and shuts it down with Will-O-Wisp. Don't lead
  Gholdengo here — it's 2x weak to Kingambit's main STAB.
- **vs. Metagross teams**: Bring Grimmsnarl, Rotom-Wash, Swampert,
  Gholdengo — bench Pelipper and Archaludon. Grimmsnarl is flatly immune
  to its real most-common move (Psychic Fangs, 86.7% usage, confirmed via
  Pikalytics); Rotom-Wash quad-resists its Steel options.
- **vs. Sun teams (Charizard-Mega-Y / Sylveon / Garchomp / Aerodactyl-Mega)**
  — a real top archetype missed on the first pass, only surfaced by
  checking the top-teams page directly. Revised after checking
  Charizard-Y's *actual* real moveset (Heat Wave/Solar Beam/Weather Ball —
  an earlier draft of this note wrongly assumed a physical Flare Blitz
  set): **bring Grimmsnarl, Archaludon, Rotom-Wash, Gholdengo — bench
  Swampert entirely**, it's a guaranteed kill to Solar Beam's 4x weakness
  even through Light Screen. Lead **Grimmsnarl + Archaludon** — Grimmsnarl
  gets Light Screen up almost regardless of speed (Prankster), Archaludon
  quad-resists Solar Beam and takes Heat Wave near-neutrally, so this pair
  can sit across from Charizard indefinitely. Only bring Rotom-Wash or
  Gholdengo in *after* Light Screen is up — unscreened, Solar Beam and
  Heat Wave each guarantee a kill on them too; screened, both survive
  comfortably (see Known Weaknesses for the full numbers). Rotom-Wash's
  Thunderbolt (98-116, weather-unaffected) is the team's real offensive
  answer once it's safe to bring in. Sylveon resists both our Steel and
  Dark options; expect a neutral trade, not a clean answer.
- **vs. Fire-focused teams (Floette-Eternal-Mega / Mega Delphox / Incineroar
  / Sinistcha / Kingambit)**: Bring Gholdengo, Archaludon, Rotom-Wash,
  Grimmsnarl. Steel is super-effective on Floette-Eternal (calculated:
  Gholdengo's Make It Rain does 138-164 to it directly) and Mega Delphox
  (confirmed Levitate, Ground-immune) is resisted broadly. Real but modest
  cost: this archetype's Incineroar will Intimidate Swampert if it leads,
  cutting its physical output by a stage.
- **vs. a rain mirror (the real core is Swampert-Mega + Pelipper +
  Archaludon + Sinistcha + Grimmsnarl, confirmed via Pikalytics — not a
  guess)**: genuinely unresolved. Archaludon's Electro Shot benefits from
  *either* side's rain, so you don't strictly need to win the weather race
  first. The confirmed presence of Sinistcha in this core means some rain
  teams may pivot into Trick Room mid-game — this matchup needs actual
  practice reps, not just theory.

## Changelog

| Date | Change | Reasoning |
|---|---|---|
| 2026-07-10 | Initial build — rebuilt around a user-requested Whimsicott/Gholdengo/Rotom-Wash favorite core, replacing an earlier Garchomp/Whimsicott/Basculegion/Gholdengo/Incineroar/Raichu-Mega-Y team that struggled vs. Trick Room and lacked weather control | Full session reasoning — see "Why these six" and "Intentional exclusions" above |
| 2026-07-10 | Swapped Whimsicott → Archaludon after threat-by-threat comparison showed Sylveon (the other candidate) was redundant with Grimmsnarl, while Archaludon patched a real gap (rain-unlocked Electro Shot vs. Flying-types) | Real Pikalytics teammate data (Archaludon = Pelipper's #1 real teammate) + tools/damage-calc/cli.js |
| 2026-07-10 | Revised Grimmsnarl moveset (dropped Fake Out + Protect for the real meta-standard Light Screen/Reflect/Parting Shot, added Foul Play) and corrected its SP spread from Careful/SpD to Bold/Def after finding the SpD investment was defending against attacks already blocked by typing | Real Pikalytics usage data + tools/damage-calc/cli.js breakpoint search |
| 2026-07-10 | Re-optimized all six SP spreads via breakpoint search (minimum SP needed per threshold) instead of default 32/32/2 splits, verified against real opponent items/abilities rather than idealized minimums | tools/damage-calc/cli.js, cross-checked against real Pikalytics builds for Garchomp, Sneasler, Kingambit, Metagross, Mega Staraptor |
| 2026-07-10 | Filled in Bring-6-pick-4 notes against real top-team archetypes (not just individual Pokémon) — Trick Room, Mega Staraptor, Sneasler, Kingambit, Metagross, Sun, Fire-focused, and rain-mirror cores. Found a real gap on the first pass (missed the Sun archetype entirely using only per-Pokémon usage rank) and a real weakness once Sun was checked properly (halves Hydro Pump/Wave Crash; Gholdengo can't face a Sun-boosted Charizard-Y at all) | https://www.pikalytics.com/topteams fetched this session; tools/damage-calc/cli.js for the Sun-weather damage checks |
| 2026-07-10 | Corrected the Sun/Charizard-Y matchup entirely — the prior entry used Flare Blitz, a physical move that isn't in Charizard-Y's real set at all (95.4% usage is Heat Wave/Solar Beam/Weather Ball, a special Drought set). Real check found Solar Beam (fires without a charge turn in Sun) is 4x on Swampert (guaranteed kill, screens don't help) and 2x on Rotom-Wash (guaranteed kill unscreened, survives with Grimmsnarl's Light Screen). Archaludon quad-resists it. User pushed back that "we don't have a real plan" against Charizard, which is what triggered re-checking the actual moveset instead of reusing the earlier assumption | tools/damage-calc/cli.js; Pikalytics real Charizard-Y moveset; doubles screen-reduction mechanic (~1/3, confirmed via web search) applied to the results |
| 2026-07-10 | Checked the Sun archetype's other three real pieces (Sylveon, Garchomp, Aerodactyl) with the same rigor, and validated a user-proposed tech: swapping Pelipper in after Light Screen is up to overwrite their Sun with Rain, stripping Solar Beam's no-charge-turn trick and cutting Heat Wave's real damage roughly in half | tools/damage-calc/cli.js; real Pikalytics movesets for Sylveon/Garchomp/Aerodactyl |
| 2026-07-10 | Fixed a duplicate item — Rotom-Wash and Archaludon both had Leftovers, which isn't legal (no two Pokémon on a team can hold the same item). Archaludon kept Leftovers (its real 88.6% dominant item); Rotom-Wash switched to Sitrus Berry, its actual real second-most-common item (39.1%) rather than an arbitrary replacement | User caught it directly; logged as a standing "Team-finalization check" in reference/vgc_common_pitfalls.md |
