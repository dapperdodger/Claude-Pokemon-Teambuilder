# Champions format fundamentals

Rules of the Pokémon Champions platform that hold **across** regulations —
the stat system, the platform context, and the roster-vs-legality discipline.
Nothing here changes when a regulation rolls over.

Anything that *does* change every cycle — active dates, active mechanics, the
current roster additions, the restricted list — lives in
`reference/regulation.md`, which is replaced wholesale at each transition.
That split is deliberate: a transition should mean swapping one small file,
not surgically editing a large mixed one.

## Contents

- [Platform / version context](#platform--version-context)
- [Stat system: Stat Points (SP), not EVs/IVs](#stat-system-stat-points-sp-not-evsivs)
- [Roster vs. legality — two separate checks](#roster-vs-legality--two-separate-checks)
- [What the local vendored data does and does not cover](#what-the-local-vendored-data-does-and-does-not-cover)
- [Changelog](#changelog)

## Platform / version context


- Pokémon Champions replaced Scarlet/Violet as the official VGC platform
  starting **8 April 2026** (Nintendo Switch / Switch 2).
- iOS and Android versions launched **17 June 2026**, same day M-B began.
  Switch save data carries over via linked Nintendo Account.
- This is a full platform change, not a patch — older Scarlet/Violet-era
  Smogon/VGC content may not reflect current mechanics, roster, or balance.

## Stat system: Stat Points (SP), not EVs/IVs


Pokémon Champions replaced the classic EV/IV system entirely — this is a
structural change, not a rebalance, and it's easy to default to old
Scarlet/Violet-era EV terminology without noticing it no longer applies.

- **IVs are gone.** Every Pokémon is automatically treated as having
  perfect 31 IVs in every stat (including via Pokémon HOME transfers).
- **EVs are replaced by Stat Points (SP).** 66 SP total per Pokémon, spent
  freely across the six stats, with a hard cap of 32 SP in any single
  stat. Each SP costs 5 VP to assign (330 VP to max a single stat from
  scratch).
- **SP-to-stat conversion is 1:1** (not 1 point per 4, like old EVs) —
  each SP assigned adds exactly +1 to that stat at Level 50.
- **Natures are renamed "Stat Alignments"** but work the same way (~10%
  boost to one stat, ~10% cut to another). 21 options exist (down from
  25); "Serious" is the only neutral one.
- **All Champions battles are Level 50.**

**Stat formula (Level 50, Champions SP system):**
- Non-HP: `floor((floor(((2 × Base + 31) × 50) / 100) + 5 + SP) × Alignment modifier)`
- HP: `floor(((2 × Base + 31) × 50) / 100) + 50 + 10 + SP`

Old EV numbers from Smogon/SV-era sets do NOT map 1:1 onto SP — don't
assume "252 EVs" means "32 SP" or try to convert by formula; work from a
set's actual current SP allocation instead. See
`pitfalls.md`'s "Build assumption trap" for the pitfall this
causes.

## Roster vs. legality — two separate checks


Champions' available roster is a **subset** of the full historical Pokédex,
not the complete National Dex, and it grows via periodic updates. Being
"unrestricted" in a regulation's rules does not mean a Pokémon is actually
available in Champions yet. Before recommending any Pokémon:

1. Does it exist in Champions' roster at all (check current roster list)?
2. If yes, is it legal under the *current* regulation's specific rules
   (not banned/restricted this regulation)?

Both checks are required — skipping either produces a wrong recommendation.

**This applies to items and abilities too, not just Pokémon.** Champions
launched with a deliberately curated, restricted item pool — confirmed this
session that several historically-standard competitive items (Choice Band,
Choice Specs, Assault Vest, Safety Goggles, Covert Cloak, Clear Amulet,
Loaded Dice, Power Herb) are genuinely NOT available right now, not just
missing from a reference source. The pool grows via regulation updates the
same way the Pokémon roster does — Life Orb, for example, was added
specifically in the Regulation M-B item-pool expansion after being
unavailable in M-A. Before assuming an item or ability is usable:

1. Does it exist in Champions' current item/ability pool at all?
2. Don't assume "this was a staple in Scarlet/Violet" or "this is common in
   general Pokémon knowledge" means it's available now — verify per-regulation,
   the same discipline as roster checks above.

`tools/damage-calc/cli.js` (see `damage-calc.md`) surfaces this
automatically via `itemChampionsLegal`/`abilityChampionsLegal` flags on its
output, backed by the same vendored data this file's roster checks rely on
— but that vendored data itself needs the same "re-verify, don't assume
it's still current" discipline as everything else in this file.


## What the local vendored data does and does not cover

`tools/damage-calc/vendor/` is the backing data for both `tools/dex/` and the
damage calculator. Knowing its edges prevents both false confidence and
pointless searching.

**It covers** (query these locally, never from recall):

| Data | Where | Query |
|---|---|---|
| Typing, base stats, weight | `POKEDEX_CHAMPIONS` | `dex mon <Species>` |
| A Mega's **fixed** ability | `POKEDEX_CHAMPIONS[...].ab` | `dex mon "Mega <Species>"` |
| Type effectiveness | `TYPE_CHART_SV` | `dex type <T> --vs <A[,B]>` |
| Move power/type/category/spread | `MOVES_CHAMPIONS` | `dex move <Move>` |
| Item and ability legality | `ITEMS_CHAMPIONS`, `ABILITIES_CHAMPIONS` | `dex legal --item/--ability` |
| Move legality (learnsets) | `CHAMPIONS_LEARNSETS` | `dex learnset <Species> --move <Move>` |
| Stat Alignments (natures) | `NATURES` | — |

**It does NOT cover.** These need a live lookup every time:

- **Usage, common sets, threat rankings.** Meta-dependent by definition — use
  the `vgc-meta-lookup` skill.
- **Current-regulation roster and mechanics.** The vendored dex is a snapshot
  taken at a point in time and lags a regulation change; see
  `reference/regulation.md` and the re-vendoring step in the
  `vgc-regulation-transition` skill.

**Partial coverage — treat absence as "unknown", not "no":**

- **Learnsets** are vendored from a separate upstream with its own pin
  (`tools/dex/VENDOR_MANIFEST.md`) and are **regulation-variant** — a
  regulation adds species and cuts existing move pools. A species absent from
  the table returns `unknown`, never `illegal`. A pin from a previous
  regulation serves normal-looking wrong data rather than failing.
- `SETDEX_GEN10` presets exist for roughly **77 of 315** roster species
  (~24%). A species having no preset is expected and normal, not a signal
  that it is unused.
- `MOVES_CHAMPIONS` does not reliably flag priority. `isPriority: true` is
  trustworthy when present but its **absence proves nothing** — Follow Me
  genuinely has +2 priority and carries no flag. Cross-check live whenever
  priority decides something.
- A non-Mega's `.ab` field is one legal option, not the only one. Most
  non-Mega Pokémon have 2-3 legal abilities; check the real preset for the
  set being built.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-07 | Created by splitting the format-invariant sections (platform context, Stat Points system, roster-vs-legality discipline) out of `regulation.md`, so a regulation rollover replaces one small per-cycle file instead of editing a large mixed one. No content changed in the moved sections | docs/specs/2026-09-07-workflow-audit.md |
| 2026-09-07 | Added "What the local vendored data does and does not cover" — in particular that learnsets are absent entirely and must be verified live, which the repo previously implied only in a changelog row | Direct inspection of the vendored `POKEDEX_CHAMPIONS`/`SETDEX_GEN10`/`MOVES_CHAMPIONS` tables this session |
| 2026-09-07 | Learnsets moved from "does NOT cover" to "It covers" — vendored from smogon/pokemon-showdown's Champions mod behind its own pin. Added the regulation-variance caveat: upstream changed +2019/-353 lines at the M-B boundary, so a stale pin can report a move as legal that the current regulation removed | docs/superpowers/specs/2026-09-07-learnset-vendoring-design.md |
