# Ability & Move Mechanics Notes (VGC / Pokémon Champions)

Separate from raw type effectiveness — this file is for ability- and move-specific rules that change how a matchup actually plays out, verified against Bulbapedia/Serebii as they come up.

## Priority & turn order
- **Trick Room** has -7 priority (the lowest priority value that exists) and therefore always resolves last in the turn it's used, regardless of the user's Speed stat. This means any normal-priority attack from either side lands before Trick Room takes effect on the turn it's set — you don't need to out-speed a Trick Room setter to hit it before the room goes up, you just need enough damage that turn. On subsequent turns while Trick Room is active, turn order within the same priority bracket is reversed — the *lowest*-Speed Pokémon acts first — priority moves still go before non-priority moves as usual, only the Speed comparison within a bracket flips.
- **Armor Tail** (Farigiraf's signature ability; functionally similar to Dazzling/Queenly Majesty) blocks any priority-boosted move — including Prankster-boosted status moves like Taunt/Encore/Fake Tears — from hitting the ability holder *or its ally* that turn. It does NOT affect moves at normal (0) priority, and it doesn't stop field/side effects (screens, hazards, Tailwind on the other side of the field).

## Vendored data gaps
- **`tools/damage-calc/vendor/`'s `MOVES_CHAMPIONS` table doesn't reliably flag every priority move.** Confirmed: `isPriority: true` is present and correct for Sucker Punch, but **absent** for Follow Me even though Follow Me genuinely has +2 priority in Champions (confirmed via Bulbapedia/Serebii). Treat `isPriority: true` as trustworthy when present, but do NOT treat its *absence* as proof a move has no priority — cross-check any move whose priority status actually matters for a real decision (e.g. whether a redirector needs Speed investment to reliably act before the threat) against a live source before relying on the vendored field alone.

## Speed calculation

Base Speed at Level 50 comes from the Champions Stat Points (SP) formula
in `regulation.md`'s "Stat system" section — don't use the old
EV-based formula, Champions replaced it entirely and the two don't
convert cleanly (see that file for why this matters).

Once you have a Pokémon's raw Speed stat, these modifiers commonly decide
who actually moves first — check for them before assuming raw Speed
settles a matchup:
- **Choice Scarf**: ×1.5 to Speed.
- **Tailwind**: ×2 to Speed for every Pokémon on the affected side, lasts
  4 turns.
- **Paralysis**: cuts Speed by 50% (×0.5). This multiplier is confirmed
  unchanged in Champions. Separately, the *chance* of full paralysis
  (being unable to act at all that turn) is reported inconsistently
  across current sources as of this writing — 25% per one source vs. a
  claimed Champions-specific nerf to 12.5% per another — verify that
  number before relying on it specifically; this note only vouches for
  the Speed multiplier.
- **Trick Room**: does not modify anyone's Speed stat at all — see the
  Trick Room bullet above for what it actually does (reverses turn order,
  doesn't touch the stat itself).

For the strategy layer built on these modifiers — which form of speed
control to run, how they compose or conflict, and the fallback question if
the setter is removed — see `reference/speed-control.md`.

## Mega Evolution ability changes
**Check this section (or grep `tools/damage-calc/vendor/pokedex.js` for the
exact `"Mega <Species>"` entry's `.ab` field) BEFORE stating any Mega
Evolution's ability — do not cite a web usage-percentage split instead.**
This list already named Mega Raichu Y's fixed ability by species once
before (2026-07-10) and it was still misreported as a different ability on
2026-09-07 by trusting a plausible-looking usage-split search result instead
of checking here first — see `pitfalls.md`'s matching case study
and `CLAUDE.md`'s lookup table. Writing the fact down does not substitute for
opening the file at the moment of stating it.

- **Some Mega Evolutions have an ability fixed by the Mega itself, overriding whatever ability the base Pokémon had selected before evolving.** Confirmed examples: Mega Swampert is always **Swift Swim** once evolved (Torrent/Damp are only its pre-Mega options and stop mattering the instant it Mega Evolves); Mega Raichu-Y is always **No Guard** (Lightning Rod is pre-Mega only); Mega Delphox is always **Levitate** (Blaze/Magician are pre-Mega only — the payoff is real: Levitate cancels Fire/Psychic's normal 2x Ground weakness, so Garchomp's Earthquake, the single most-used move in the M-B metagame, goes from a guaranteed OHKO to 0 damage); Mega Blastoise is always **Mega Launcher** (Torrent/Rain Dish are pre-Mega only — Mega Launcher boosts pulse/aura moves 1.5x, directly buffing a real Dark Pulse/Aura Sphere set, see the "ability's power-boosted move category" bullet in `pitfalls.md`); Mega Charizard Y is always **Drought** (Blaze/Solar Power are pre-Mega only — sets real Sun, which also boosts its own Fire STAB 1.5x on top of the Mega's own bulk-behind-Sun playstyle). Mega Tyranitar is a case where this doesn't change anything visibly — it keeps Sand Stream either way — which is a coincidence, not a rule that Megas keep their ability by default. Mega Staraptor is always **Contrary** (Intimidate/Reckless are pre-Mega only) — confirmed via `POKEDEX_CHAMPIONS["Mega Staraptor"].ab`; also changes typing to **Fighting/Flying** (base Staraptor is Normal/Flying), which matters independently of the ability fix — e.g. Ghost-type moves whiff on the Normal-typed base form but hit the Fighting/Flying Mega normally, see `pitfalls.md`'s 2026-09-04 case study.
- **Don't trust a usage-stat page's "ability" breakdown at face value for a Mega-capable species** — it may be reporting the pre-evolution ability selection (what % of players picked Torrent vs Damp before evolving), not the fixed battle-time ability the Mega actually has. Check whether the specific Mega fixes its ability before reading a Torrent/Damp/Swift-Swim-style percentage split as "the ability it fights with." Confirmed recurring in practice: live Pikalytics/WebFetch summaries for Mega Delphox and Mega Blastoise both reported the pre-Mega ability (Blaze, Rain Dish) as "the actual ability used" across real champion teams — the page is showing the team-sheet's pre-Mega selection, not the fixed post-Mega battle ability. Cross-check the vendored `POKEDEX_CHAMPIONS["Mega <Species>"].ab` field (or a source that explicitly discusses the Mega's fixed ability) rather than trusting a usage-stat page's per-Mega ability column directly.

## Terrain mechanics

- **Grassy Terrain** (Rillaboom's Grassy Surge, or the move) — Rillaboom
  itself launched with Regulation M-C and is Champions-roster-legal again
  (re-verified 2026-09-09 via `dex mon`; it is currently the meta's #1 most-
  used species, 36.64% — see `reference/regulation.md`). The terrain numbers
  below were measured against it and stay valid regardless — the setter's
  availability is regulation-specific, the mechanics are not. Verified
  2026-09-07 against the vendored calc via `--terrain "Grassy"` (exact
  capitalisation, same silent-no-op risk as `--weather`):
  - Grass-type moves **+30%** in Gen 9 — down from 50% in earlier gens, so
    don't quote the old number.
  - Earthquake / Bulldoze / Magnitude **halved** against grounded targets.
    Measured: Adamant 32 Atk Garchomp Earthquake vs 32 HP / 16 Def Incineroar
    goes 134-158 (66-78% of 202 HP) → **66-80 (33-40%)** under Grassy Terrain.
  - End-of-turn heal of **1/16 max HP** to every grounded Pokémon — including
    the **opponent's**. On a slow, low-damage core this is a real cost, not a
    pure upside.
  - **The +30% applies to both sides too.** Measured: Modest 32 SpA Sinistcha
    Matcha Gotcha vs 32 HP / 12 SpD Milotic goes 74-90 (37-45%) → **98-116
    (49-57%)** under your own Grassy Terrain — a 3HKO becomes a 2HKO. Setting
    terrain next to a Water-type deepens its worst weakness.

## Ability interactions (non-Mega)

- **No Guard does NOT help your ally.** "All moves used by or against the
  ability holder cannot miss" means exactly that: in doubles the effect covers
  the No Guard Pokemon and anything targeting it, and nothing else. Verified
  2026-09-07. So pairing Mega Raichu Y (No Guard, Mega-fixed) with an ally
  running a shaky-accuracy move — Hypnosis, Focus Blast, Stone Edge — does
  **not** make the ally's move hit. It is also symmetrical and therefore a
  real liability on a frail holder: every opposing low-accuracy move becomes
  guaranteed against it.
- **Coil's accuracy boost applies to status moves, including Hypnosis.**
  Accuracy stages use `(3 + stage) / 3` from Gen 5 on, so Hypnosis' 60% goes
  to **80% at +1** and **100% at +2**. That accuracy engine, not the Attack
  boost, is what a Coil set on a special attacker is actually buying — Coil
  raises Atk/Def/accuracy and touches **no** special stat, so it does nothing
  about special threats.

## Damage reduction: screens, Friend Guard, Multiscale, and stat stages

Closes the gap `reference/roles.md`'s "Damage reduction that is not an item"
section named — screens, Intimidate, Friend Guard and Multiscale used to be
unmeasurable because `tools/damage-calc/cli.js` had no way to express side
conditions or stat stages. It now does (`--reflect`, `--light-screen`,
`--aurora-veil`, `--friend-guard`, `--attacker-boosts`/`--defender-boosts`),
so the numbers below are measured against the vendored Champions calc rather
than cited from a mainline source. All measured 2026-09-09 against the same
two neutral-nature, 0-SP baselines so the reduction shows up as a clean
ratio (the multiplier itself doesn't depend on the SP spread used to reveal
it):

- **Physical baseline**: 0 Atk Garchomp Earthquake vs. 0 HP / 0 Def
  Incineroar → **116-138**.
  ```
  node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake"
  ```
- **Special baseline**: 0 SpA Gholdengo Shadow Ball vs. 0 HP / 0 SpD
  Incineroar → **31-37**.
  ```
  node tools/damage-calc/cli.js --attacker Gholdengo --defender Incineroar --move "Shadow Ball"
  ```

### Screens — Reflect, Light Screen, Aurora Veil

**Reflect** cuts incoming *physical* damage to **×0.667 (2/3) — a ~33%
reduction, not the 50% a singles intuition would expect.** Doubles screens
are genuinely weaker than the singles number most players carry in their
heads; this is the actual doubles value, not a Champions-specific one (see
the departure-marker note below).
Measured 116-138 → **77-92**, 2026-09-09:
```
node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake" --reflect
```

**Light Screen** is the special-side counterpart, same ×0.667 multiplier,
and correctly has zero effect on a physical move — verified both ways:
Measured Shadow Ball 31-37 → **21-25**; Earthquake 116-138 stays **116-138**
under `--light-screen` (no effect), 2026-09-09:
```
node tools/damage-calc/cli.js --attacker Gholdengo --defender Incineroar --move "Shadow Ball" --light-screen
node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake" --light-screen
```

**Aurora Veil** covers both categories at the **same ×0.667 multiplier** as
the single-category screens — it is both Reflect and Light Screen at once,
not a stronger version of either (still requires Snow to be up; see
`reference/archetypes.md`'s Weather section for that dependency).
Measured Earthquake 116-138 → **77-92**, Shadow Ball 31-37 → **21-25**,
2026-09-09:
```
node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake" --aurora-veil
node tools/damage-calc/cli.js --attacker Gholdengo --defender Incineroar --move "Shadow Ball" --aurora-veil
```

This ×2/3 figure is a **doubles-vs-singles** fact, not a Champions-vs-
general-VGC one — it holds in any Gen 8/9 doubles format, this repo had
simply never measured it before. It does **not** get the Champions-departure
marker defined in `reference/archetypes.md`/`reference/roles.md`, because
that marker is reserved for places Champions' own item pool, roster, or
learnsets have been checked and found diverging from a general-VGC claim;
nothing about *this* number is Champions-specific, so it's recorded as a
plain measured fact instead.

### Friend Guard

Friend Guard reduces damage the holder's **ally** takes (never its own) to
**×0.75 — a 25% reduction.**
Measured Earthquake 116-138 → **87-103**, 2026-09-09:
```
node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake" --friend-guard
```

### Multiscale

Multiscale halves damage taken (**×0.5**) while the holder is at full HP —
the reduction stops applying the instant it has taken any damage.
Measured Earthquake 116-138 → **58-69**, 2026-09-09:
```
node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --defender-ability Multiscale --move "Earthquake"
```

### Stat stages, including Intimidate

Stat-stage multipliers follow the standard formula — `(2+n)/2` for a boost of
`+n`, `2/(2+|n|)` for a drop of `-n` — and the measured numbers below match
it exactly:

- **Attacker +2 Attack → ×2, essentially exact.** This is the measured
  confirmation of `reference/roles.md`'s "boosting to +2 is the same as
  attacking twice": not a heuristic here, it's what the calc actually
  produces.
  Measured 116-138 → **230-272**, 2026-09-09:
  ```
  node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake" --attacker-boosts "at:2"
  ```
- **Intimidate is modelled as `at:-1` on the attacker, not as an ability
  flag** — there is no `--attacker-ability Intimidate` handling that applies
  its drop for you; represent Intimidate's effect as the stage change it
  causes. One stage down is **×0.667 (2/3)**, the same fraction as a
  screen — but the ranges are not bit-identical (78-92 here vs. 77-92 for a
  screen): a stat stage is baked into the attacker's stat before the calc
  runs, while a screen multiplies the finished damage number afterward, so
  the two ×2/3 paths round differently at the edges.
  Measured 116-138 → **78-92**, 2026-09-09:
  ```
  node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake" --attacker-boosts "at:-1"
  ```
- **Defender +2 Defense → close to, but *not*, an exact ×0.5 halving** —
  `reference/roles.md`'s "a +2 Defense boost is worth roughly halving
  incoming damage" is a rough equivalence, not a measured exact figure.
  Exact half of the 138 max is 69; the measured max is **72, 4.3% high.**
  Contrast the Attack side: +2 Attack above measures 1.4% *below* an exact
  double. That asymmetry isn't noise. Post-calc multipliers (screens, Friend Guard,
  Multiscale) are exact to rounding because they scale the finished damage
  number. Stat stages are not, because they act on the Attack/Defense ratio
  *inside* the damage formula, which carries a trailing additive `+2`
  constant that doesn't scale with the division — doubling the defender's
  Defense halves the division term but leaves that `+2` untouched, pushing
  the result above half. (The −1 Attack row above landing at exactly 0.0%
  off is a rounding coincidence, not a counterexample to this pattern.)
  **Practical consequence: a screen or ability multiplier can be applied by
  hand to a known damage number; a stat-stage change cannot — re-run the
  calc instead.**
  Measured 116-138 → **60-72**, 2026-09-09:
  ```
  node tools/damage-calc/cli.js --attacker Garchomp --defender Incineroar --move "Earthquake" --defender-boosts "df:2"
  ```

**SP naming collision:** this repo's own vocabulary uses **SP for Stat
Points** (`--attacker-sp`/`--defender-sp`), but the vendored dex's stat key
`sp` means **Speed**, and `--attacker-boosts`/`--defender-boosts` inherits
that same vendor convention — a `--attacker-boosts "sp:2"` example boosts
Speed, not this repo's Stat Points. The two flag families are spelled
differently (`-sp` vs `-boosts`) but both accept an `sp:` key inside their
value string with two different meanings; don't read one as the other.

**Vendor-currency caveat:** every number above comes from the vendored
Champions damage-calc engine (`tools/damage-calc/VENDOR_MANIFEST.md`, pinned
2026-07-09, Regulation M-B) — the right source for this format, but only as
current as that pin, and the pin is behind upstream as of this writing
(Regulation M-B ends 2026-09-09, the day this section was written — see
`reference/regulation.md`). A re-vendor for the next regulation could move
any of these multipliers if the underlying engine's screen/ability/stat-stage
constants change; re-run the commands above rather than trusting the numbers
past the next re-vendor.

## Item mechanics
- **Focus Sash only protects against the first hit of a multi-hit move.** Sash (and Sturdy) check "would this hit knock the holder from full HP to 0" independently per strike — after the first strike of a 2-5 hit move (or a fixed-2-hit move like Dual Wingbeat) brings the holder to 1 HP, the holder is no longer at full HP, so the second strike faints it normally. A Focus Sash holder does NOT reliably survive a multi-hit spread move the way it survives a single-target nuke — relevant any time a Focus Sash set (e.g. Whimsicott) is being counted on to tank a hit from something running a 2-hit move like Dual Wingbeat (Mega Staraptor).

## Type-immunity reminders (easy to forget when checking coverage)
- Ghost-type moves have no effect on Normal-types, and Normal-type moves have no effect on Ghost-types. Relevant any time a Ghost-STAB attacker (e.g. Gholdengo's Shadow Ball) is being counted on to threaten a Normal-type support Pokémon (e.g. Farigiraf) — it won't.

*Add further verified ability/move interactions here as they come up in team-building sessions, rather than folding them into the type chart file.*

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo, no content changes | Bulbapedia, Serebii (verified in original claude.ai session) |
| 2026-07-09 | Fixed Armor Tail bullet: removed Tailwind from blocked-moves example (Tailwind is a field effect, not a direct-target move) | Task review |
| 2026-07-09 | Added Speed calculation section (Champions SP-formula pointer + Choice Scarf/Tailwind/Paralysis modifiers) and expanded Trick Room bullet with the ascending-Speed turn-order note for while Trick Room is active | champsdex.com status conditions guide (paralysis); Trick Room turn-order reversal is standard, unchanged mechanic across generations |
| 2026-07-10 | Added Item mechanics section: Focus Sash only blocks the first hit of a multi-hit move (Sturdy same), so it doesn't save a mon from a 2-hit move like Dual Wingbeat. Caught while checking whether Focus Sash Whimsicott actually survives Mega Staraptor | Bulbapedia (Focus Sash, Multi-strike move pages), verified this session |
| 2026-07-10 | Added Mega Evolution ability changes section after misreading a usage-stat "Torrent 58.7% / Damp 46.4%" split as Mega Swampert's actual battle ability — it's always Swift Swim once evolved, that split was pre-Mega ability selection. User caught this after I'd correctly applied the same logic to Mega Raichu-Y two turns earlier but not to Swampert | User correction; confirmed via web search this session |
| 2026-07-14 | Added "Vendored data gaps" section — `MOVES_CHAMPIONS`'s `isPriority` field is missing for Follow Me despite it genuinely having +2 priority, discovered while deciding whether Maushold needed Speed SP investment to reliably redirect | Bulbapedia, Serebii (Follow Me priority +2 confirmed live); tools/damage-calc/vendor/ MOVES_CHAMPIONS inspected directly this session |
| 2026-07-17 | Added four more confirmed Mega-fixes-ability examples (Delphox→Levitate, Blastoise→Mega Launcher, Charizard Y→Drought, Raichu-Y→No Guard) while refining a user-built team that listed Blaze/Rain Dish for Mega Delphox/Mega Blastoise. Also confirmed the "usage page shows pre-Mega ability" trap recurs on live Pikalytics WebFetch summaries specifically, not just static usage tables | `tools/damage-calc/vendor/pokedex.js` POKEDEX_CHAMPIONS `.ab` fields (direct read); live Pikalytics WebFetch for Mega Delphox/Mega Blastoise (both showed the pre-Mega ability as "the ability used"); cross-checked Mega Delphox/Blastoise ability via WebSearch |
| 2026-09-04 | Added Mega Staraptor (→Contrary, also retypes to Fighting/Flying from base Normal/Flying) after a damage-calc call that fed the base species name plus its Mega Stone item silently computed the base form instead, producing a wrong "Ghost moves whiff on Staraptor" claim | `POKEDEX_CHAMPIONS["Mega Staraptor"]` direct read (`ab: "Contrary"`, `t1/t2: Fighting/Flying`); live WebSearch cross-check; see `pitfalls.md`'s matching 2026-09-04 case study |
| 2026-09-07 | Added a "check this before stating any Mega's ability" lead-in after misreporting Mega Raichu Y's ability as Lightning Rod (93.7% usage split) when this section already named it as fixed to No Guard since 2026-07-10 — the web usage split was pre-Mega base Raichu's ability selection, not the Mega's. Confirmed again via direct vendor read. User asked what should change structurally, not just factually, since the correct fact being already written here didn't prevent the mistake | `tools/damage-calc/vendor/pokedex.js` direct read (`POKEDEX_CHAMPIONS["Mega Raichu Y"]`: `ab: "No Guard"`); see `pitfalls.md`'s matching 2026-09-07 case study and `CLAUDE.md` rule 13 |
| 2026-09-07 | "Mega Evolution ability changes" is no longer the primary lookup path — `node tools/dex/cli.js mon "Mega <Species>"` returns the fixed ability plus the pre-Mega ability the usage pages report, and a PostToolUse hook injects the same on any WebFetch/WebSearch showing a Mega beside ability percentages. The list below stays as the record of confirmed cases and their real payoffs; the grep instruction it used to carry was removed because it did not work cleanly against the pretty-printed vendor JSON | docs/specs/2026-09-07-repo-reorganization.md |
| 2026-09-07 | Replaced a dangling `CLAUDE.md rule 13` reference with a named pointer to CLAUDE.md's lookup table | docs/specs/2026-09-07-workflow-audit.md |
| 2026-09-07 | Added a "Terrain mechanics" section with Grassy Terrain's verified numbers (Gen 9 Grass boost is +30%, not the older 50%; EQ/Bulldoze/Magnitude halved; 1/16 end-of-turn heal to *both* sides; the Grass boost also applies to the opponent). Prompted by evaluating a Milotic/Rillaboom/Incineroar core, where the terrain both halves Garchomp Earthquake into Incineroar and turns Sinistcha Matcha Gotcha into Milotic from a 3HKO into a 2HKO — the file had no terrain entry at all | `tools/damage-calc/cli.js --terrain "Grassy"` before/after runs this session; Bulbapedia Grassy Terrain (move) and Pokemon Database for the Gen 9 +30% figure |
| 2026-09-07 | Added an "Ability interactions (non-Mega)" section recording that No Guard covers only its holder and moves targeting it — allies get no benefit — and that Coil's accuracy boost does apply to Hypnosis (60% -> 80% at +1, 100% at +2, via the Gen 5+ (3+stage)/3 accuracy formula). Both came up evaluating a Coil/Hypnosis Milotic alongside Mega Raichu Y, where the tempting inference is that the Mega's No Guard makes the ally's Hypnosis reliable. It does not | Bulbapedia No Guard (Ability) and Accuracy/Stat modifier pages via live search; `dex mon "Mega Raichu Y"` for the Mega-fixed No Guard |
| 2026-09-09 | Added a cross-link from "Speed calculation" to `reference/speed-control.md` for the strategy layer (which form to run, composition/conflict, the removed-setter fallback) — no modifier numbers moved. Also marked the Grassy Terrain section's Rillaboom example with the availability marker after confirming via `dex mon "Rillaboom"` that it is not in the vendored Champions roster; the measured terrain numbers were computed against that example and stay valid, only the setter's availability is regulation-specific — per prior user correction (see `roles.md`/`archetypes.md` changelogs), the example is marked, not deleted or substituted | `dex mon "Rillaboom"` (exists in the broader dex, absent from `POKEDEX_CHAMPIONS`); `reference/regulation.md`'s stamp block for the live regulation id (M-B); `.superpowers/sdd/2026-09-08-teambuilding-philosophy/task-16-brief.md` |
| 2026-09-09 | Added "Damage reduction: screens, Friend Guard, Multiscale, and stat stages" section, measuring the four mechanics `reference/roles.md` had flagged as undocumented — now measurable now that `tools/damage-calc/cli.js` supports `--reflect`/`--light-screen`/`--aurora-veil`/`--friend-guard`/`--attacker-boosts`/`--defender-boosts`. Reflect/Light Screen/Aurora Veil all measured at ×0.667 (2/3) in doubles, not the singles ×0.5; Friend Guard at ×0.75; Multiscale at ×0.5 from full HP; stat stages confirmed the standard `(2+n)/2` formula exactly, including that a +2 boost is a measured ×2 (not just a heuristic) and that Intimidate is modelled as `--attacker-boosts "at:-1"`, not an ability flag. The screens ×2/3 value is noted as a doubles-vs-singles fact, not a Champions-departure — general VGC doubles has the same number, so it does not carry the Champions-departure marker. Flagged the SP-vs-Speed `sp:` key collision on `--*-boosts`. Updated `reference/roles.md`'s "Damage reduction that is not an item" section to point here instead of saying the mechanics are undocumented, and broadened `.claude/skills/vgc-regulation-transition/SKILL.md`'s rollover-sweep prose to name all of `reference/` rather than four specific files, since this file now also carries a Champions-departure mark (Rillaboom) beyond the four already named. `npm test` — 369/369, unchanged | `tools/damage-calc/cli.js` direct runs, all commands in this section reproduced exactly against numbers supplied for verification; `tools/damage-calc/VENDOR_MANIFEST.md` for the pin date/commit |
| 2026-09-09 | Review correction: the prior row's defender +2 Defense bullet stated "×0.5 ... an exact figure, not an approximation," which is backwards — exact half of the 138 max is 69, the measured max is 72 (4.3% high), while the +2 Attack bullet above it is the one that's genuinely close to exact (272 vs. an exact 276, 1.4% low) and was already hedged as "essentially exact." Reworded the Defense bullet to state the real figure and added the mechanism: post-calc multipliers (screens, Friend Guard, Multiscale) scale the finished damage number so they round exactly; stat stages act on the Attack/Defense ratio inside the damage formula, which carries a trailing additive `+2` constant that doesn't scale with the division, so a defensive stage change lands off-exact while the −1 Attack row's 0.0% match is a rounding coincidence, not a counterexample. Added the practical consequence: a screen/ability multiplier can be applied by hand to a known number, a stat-stage change can't — re-run the calc. Also softened the −1 Attack bullet's "identical fraction to a screen" (78-92 vs. a screen's 77-92 — same fraction, not the same range) to "the same fraction," with the before/after-the-calc reason for the one-point gap. Re-ran every command in the section; all reproduce their documented numbers unchanged. `npm test` — 371/371, unchanged | Review of this section against `node tools/damage-calc/cli.js` output for all six measurements re-run this session |
| 2026-09-09 | Regulation-transition step 5e: re-verified this file's one live Champions-departure marker (Grassy Terrain section) against the freshly re-vendored M-C dex. `dex mon "Rillaboom"` now resolves — it launched with M-C the same day the marker was written and is already the meta's #1 species at 36.64% usage. Removed the availability marker entirely rather than restamping it, per the rule that a departure which no longer holds gets unmarked, not just re-dated — the section now states plainly that Rillaboom is roster-legal. The measured terrain numbers (+30% Grass moves, halved EQ/Bulldoze/Magnitude, 1/16 heal both sides) were computed against Rillaboom as the example setter and were left untouched, as instructed — they describe the mechanic, not the setter's availability. `npm test` — 371/371, unchanged | `node tools/dex/cli.js mon "Rillaboom"`; `reference/regulation.md`'s M-C usage snapshot |
