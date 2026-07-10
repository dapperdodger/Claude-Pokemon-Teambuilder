# Local Damage Calculator — Design

Date: 2026-07-09
Status: Approved

## 1. Problem

`reference/vgc_damage_calc.md` currently points at the Pikalytics damage
calculator and gives formula fundamentals for manual sanity-checks, but
neither is fully satisfying: Pikalytics is a client-side tool Claude Code
can't drive without a connected browser (rejected — see Section 3), and
hand-calculating damage rolls risks exactly the kind of recall error this
whole repo exists to prevent (wrong base stat, wrong move power, wrong
modifier, for the wrong Pokémon).

This design replaces that gap with a small, local, testable damage
calculator: real Pokémon/move/ability/item data (not recalled from
training data) driving a calculation Claude Code can run directly via
Bash and report on transparently.

## 2. Data source: the NCP VGC Damage Calculator

Investigated `https://github.com/nerd-of-now/NCP-VGC-Damage-Calculator`
this session:

- Lineage: the community "Honko" calculator (official Nuggetbridge calc
  2015-16 -> Trainer Tower 2017-20 -> Nimbasa City Post 2021-present).
  MIT licensed, 52 stars, actively maintained, **last pushed 2026-07-02**
  (one week before this design).
- **Confirmed Champions/Stat-Points-aware**: `script_res/stat_data.js`
  contains `CALC_STAT_CHAMP`/`CALC_HP_CHAMP` using the exact Stat Points
  formula independently verified earlier this session from champsdex.com
  et al. for `reference/vgc_current_regulation.md`. Two independent
  sources agreeing is a real cross-check, not a coincidence to ignore.
- Architecture: static site, no build step, data cleanly split from UI
  (`pokedex.js`, `move_data.js`, `ability_data.js`, `item_data.js`,
  `type_data.js`, `nature_data.js`, `stat_data.js` vs. the calculation
  files and `index.html`'s markup).
- The catch: the calculation functions (`damage_MASTER.js`, 2,600+ lines)
  read/write real DOM elements via jQuery — not plain callable functions.

## 3. Approaches considered

**A — Full port, aim for parity with `damage_MASTER.js`.** Rejected:
porting 2,600+ lines of someone else's DOM-coupled logic, across every
generation back to RBY, is exactly the kind of large hand-transcription
where Claude Code could introduce a subtle bug — undermining the entire
point of wanting verified results instead of recalled arithmetic.

**C — Vendor the whole site, drive it headless with Playwright for every
query.** Rejected as the primary path: heavier (bundled headless
Chromium), and results come back as page text to parse rather than
structured data. Repurposed instead as an **offline validator** (Section
6) — exactly the use it's well-suited for, since it doesn't need to be
fast or run on every query.

**B — Vendor NCP's data, write our own thin calc layer, scoped to current
gen only. (Chosen.)** The "right stats for the right Pokémon" problem is
already solved by NCP's actively-maintained data files — vendor those
unmodified rather than re-deriving our own copy of the same information.
Write a small, our-own, pure calculation function (no DOM/jQuery) scoped
to current Champions/Gen 9 mechanics, validated against known-correct
results.

## 4. Components

```
tools/damage-calc/
  vendor/                 — NCP's data files, copied verbatim:
                             pokedex.js, move_data.js, ability_data.js,
                             item_data.js, type_data.js, nature_data.js,
                             stat_data.js
  VENDOR_MANIFEST.md       — source repo URL, exact commit SHA vendored,
                             sync date. Same changelog discipline as
                             reference/*.md.
  calc.js                  — pure function: (attacker, defender, move,
                             field) -> {min, max, rolls, koChance}.
                             Current-gen (Champions SP-based) mechanics
                             only, no DOM/jQuery dependency.
  cli.js                   — Bash-invokable wrapper: takes Pokémon/move
                             names as CLI args, looks them up in
                             vendor/ data, prints structured JSON
                             including which exact stat/move/ability/item
                             record it matched (not just the final
                             number) so a bad name match is visible.
  tests/                   — fixed test cases with expected output
                             (see Section 6)
```

## 5. Data flow

Example: "how much does Garchomp's Rock Slide do to Charizard?"

1. Claude Code runs `node tools/damage-calc/cli.js --attacker Garchomp
   --move "Rock Slide" --defender Charizard [--field ...]` via Bash.
2. `cli.js` looks up Garchomp/Charizard/Rock Slide in `vendor/` data,
   resolves current SP allocation/nature/item/ability inputs (passed as
   flags or defaulted to the vendored current common set — exact flag
   design is a plan-time detail, not a spec-time one), and calls `calc.js`.
3. Output is structured JSON: the damage range, KO-chance breakdown, AND
   the exact matched records (base stats used, move power/type used,
   ability/item used) so the human-readable report shown to the user
   makes the inputs inspectable, not just the answer.
4. Claude Code reports the result in chat, including those matched
   inputs, so a wrong match is visible immediately rather than hidden.

## 6. Safety net — three layers

Two different failure modes need two different defenses, plus a
transparency layer so failures are visible rather than silent:

1. **Data freshness** (balance patches, new Pokémon, changed base
   power/move data): extends the existing `scripts/check_regulation_staleness.sh`
   SessionStart-hook pattern with a sibling check comparing
   `VENDOR_MANIFEST.md`'s recorded commit SHA against NCP's current
   upstream HEAD (GitHub API, unauthenticated, public repo) — warns if
   behind. Re-vendoring stays a deliberate, explicit step (copy the files
   again, update the manifest), not automatic — a data change can't
   silently shift results mid-session.
2. **Logic correctness** (Claude Code's own porting mistakes in
   `calc.js`): a test suite of known damage scenarios with expected
   output (`tools/damage-calc/tests/`). Periodically — when `calc.js`
   changes, or on an occasional cadence, not every query — the *real*
   NCP calculator is driven headlessly via Playwright (one-off, not part
   of the normal query path) to regenerate ground-truth fixtures and
   confirm `calc.js` still matches. This is where the rejected Approach C
   earns its keep: as an offline validator, not a runtime dependency.
3. **Per-query transparency** (wrong Pokémon/move/ability matched): every
   `cli.js` invocation's output includes the exact matched data (Section
   5, step 3), so a bad match is visible in the reported result, not
   hidden inside an opaque number.

## 7. Scope boundaries

Current-gen (Champions/SP) mechanics only. Explicitly NOT porting the
RBY/GSC/ADV/DPP/RSE/LGPE legacy branches `damage_MASTER.js` also
supports — this repo only cares about the current format. Common
abilities/items/weather/terrain/spread-move handling relevant to VGC
doubles; anything with genuinely bespoke, hardcoded-in-the-original-calc
logic (a handful of moves/abilities have special-cased mechanics) is
flagged as "not modeled — verify manually or via the NCP calculator
directly" rather than silently approximated.

## 8. Known risk, explicitly not designed around

NCP is a single-maintainer, volunteer-run project. It could go stale or
unmaintained in the future — this repo would then be vendoring an
increasingly outdated data source without a freshness signal beyond "no
new commits to compare against," which the Layer 1 staleness check alone
wouldn't catch (no new upstream commits looks identical whether the
project stopped being needed or stopped being maintained).

Per explicit user decision, this is **not** being designed around now —
building a second independent data-verification source, or a
plan for what happens if NCP goes dark, would be speculative
engineering for a problem that doesn't exist yet (YAGNI). The concrete
trigger to revisit: if damage-calc results start looking consistently
off, or NCP's commit history goes quiet for an extended stretch relative
to the game's patch cadence, that's the signal to reassess — not before.

## 9. Out of scope for this pass

- A UI or interactive mode — this is a Bash-invokable CLI only.
- Automatic re-vendoring — staying a deliberate, explicit step (Section 6).
- Full parity with `damage_MASTER.js` across all historical generations.
- A second independent data source as a cross-check against NCP (Section 8).
