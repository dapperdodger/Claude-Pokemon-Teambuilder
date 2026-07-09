# VGC Reference Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the claude.ai memory + Google Drive setup described in the handoff doc with a real git-backed reference workflow in this repo: five reference files under `reference/`, a root `README.md` index, and a root `CLAUDE.md` carrying the behavioral rules.

**Architecture:** Plain markdown files, no build step, no tests-as-code. "Testing" for this plan means structural verification (required sections present, changelog table present, valid markdown table syntax) plus factual verification (claims backed by a cited source checked during this session). Each reference file ends in a `## Changelog` table of `Date | Change | Source` rows.

**Tech Stack:** Markdown, git. WebSearch tool for pulling a fresh usage snapshot in Task 4.

## Global Constraints

- Every file in `reference/` must end with a `## Changelog` section: a markdown table with columns `Date | Change | Source`.
- Today's date for all changelog entries and "last verified" stamps in this plan: **2026-07-09**.
- No Terastallization/Dynamax/Z-Move strategy content anywhere — current regulation (M-B) has Mega Evolution as the only active mechanic. This was verified via web search during design (see spec Section 4 sources).
- Precedence rule stated in `CLAUDE.md` must also be respected while writing these files: live web search > repo files > model training data. Task 4's usage snapshot must come from an actual WebSearch call this session, not from recalled/training-data numbers.
- `CLAUDE.md` rules must be short pointers into `reference/` files, not restated content (mirrors the discipline the old claude.ai memory system used — see spec Section 6).
- Commit after each task. Final task pushes to `origin/main`.

---

### Task 1: Migrate the type chart reference file

**Files:**
- Create: `reference/vgc_type_chart_reference.md`

**Interfaces:**
- Produces: a file other tasks (README index, CLAUDE.md pointer #7) reference by path `reference/vgc_type_chart_reference.md`.

- [ ] **Step 1: Create the `reference/` directory and write the file**

Write `reference/vgc_type_chart_reference.md` with this exact content:

```markdown
# Type Effectiveness Reference (Gen 6+ chart, current for Champions/VGC)

Source: pokemondb.net/type (verified against Bulbapedia), pulled July 2026.
Cross-checked cell-by-cell against the standard Gen 6+ chart on 2026-07-09 — no errors found.

## Full chart — rows = attacking type, columns = defending type
2 = super effective, ½ = not very effective, 0 = no effect, blank = normal (1x)

| ATK \ DEF | Nor | Fir | Wat | Ele | Gra | Ice | Fig | Poi | Gro | Fly | Psy | Bug | Roc | Gho | Dra | Dar | Ste | Fai |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Normal   |   |   |   |   |   |   |   |   |   |   |   |   | ½ | 0 |   |   | ½ |   |
| Fire     |   | ½ | ½ |   | 2 | 2 |   |   |   |   |   | 2 | ½ |   | ½ |   | 2 |   |
| Water    |   | 2 | ½ |   | ½ |   |   |   | 2 |   |   |   | 2 |   | ½ |   |   |   |
| Electric |   |   | 2 | ½ | ½ |   |   |   | 0 | 2 |   |   |   |   | ½ |   |   |   |
| Grass    |   | ½ | 2 |   | ½ |   |   | ½ | 2 | ½ |   | ½ | 2 |   | ½ |   | ½ |   |
| Ice      |   | ½ | ½ |   | 2 | ½ |   |   | 2 | 2 |   |   |   |   | 2 |   | ½ |   |
| Fighting | 2 |   |   |   |   | 2 |   | ½ |   | ½ | ½ | ½ | 2 | 0 |   | 2 | 2 | ½ |
| Poison   |   |   |   |   | 2 |   |   | ½ | ½ |   |   |   | ½ | ½ |   |   | 0 | 2 |
| Ground   |   | 2 |   | 2 | ½ |   |   | 2 |   | 0 |   | ½ | 2 |   |   |   | 2 |   |
| Flying   |   |   |   | ½ | 2 |   | 2 |   |   |   |   | 2 | ½ |   |   |   | ½ |   |
| Psychic  |   |   |   |   |   |   | 2 | 2 |   |   | ½ |   |   |   |   | 0 | ½ |   |
| Bug      |   | ½ |   |   | 2 |   | ½ | ½ |   | ½ | 2 |   |   | ½ |   | 2 | ½ | ½ |
| Rock     |   | 2 |   |   |   | 2 | ½ |   | ½ | 2 |   | 2 |   |   |   |   | ½ |   |
| Ghost    | 0 |   |   |   |   |   |   |   |   |   | 2 |   |   | 2 |   | ½ |   |   |
| Dragon   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | 2 |   | ½ | 0 |
| Dark     |   |   |   |   |   |   | ½ |   |   |   | 2 |   |   | 2 |   | ½ |   | ½ |
| Steel    |   | ½ | ½ | ½ |   | 2 |   |   |   |   |   |   | 2 |   |   |   | ½ | 2 |
| Fairy    |   | ½ |   |   |   |   | 2 | ½ |   |   |   |   |   |   | 2 | 2 | ½ |   |

Dual-type defense = multiply both columns together (e.g. Fire vs Rock/Flying = ½ × 1 = ½, so Rock/Flying RESISTS Fire).

This file is type-effectiveness data only. Ability/move-specific mechanics (priority interactions, immunity-granting abilities, etc.) live in `vgc_ability_move_mechanics.md`. Teambuilding process/methodology notes live in `vgc_teambuilding_methodology.md`.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo; cross-checked every cell against the standard Gen 6+ chart, no errors found | pokemondb.net/type, Bulbapedia (verified during migration) |
```

- [ ] **Step 2: Verify structure**

Run: `grep -c "^## Changelog" reference/vgc_type_chart_reference.md`
Expected: `1`

Run: `grep -c "^|---|---|---|$" reference/vgc_type_chart_reference.md`
Expected: `1` (the changelog table's header separator)

- [ ] **Step 3: Commit**

```bash
git add reference/vgc_type_chart_reference.md
git commit -m "Add VGC type effectiveness reference file"
```

---

### Task 2: Migrate the ability/move mechanics file

**Files:**
- Create: `reference/vgc_ability_move_mechanics.md`

**Interfaces:**
- Produces: a file `CLAUDE.md` (Task 7) does not point to directly but is discoverable via the README index (Task 6).

- [ ] **Step 1: Write the file**

Write `reference/vgc_ability_move_mechanics.md` with this exact content:

```markdown
# Ability & Move Mechanics Notes (VGC / Pokémon Champions)

Separate from raw type effectiveness — this file is for ability- and move-specific rules that change how a matchup actually plays out, verified against Bulbapedia/Serebii as they come up.

## Priority & turn order
- **Trick Room** has -7 priority (the lowest priority value that exists) and therefore always resolves last in the turn it's used, regardless of the user's Speed stat. This means any normal-priority attack from either side lands before Trick Room takes effect on the turn it's set — you don't need to out-speed a Trick Room setter to hit it before the room goes up, you just need enough damage that turn.
- **Armor Tail** (Farigiraf's signature ability; functionally similar to Dazzling/Queenly Majesty) blocks any priority-boosted move — including Prankster-boosted status moves like Tailwind/Taunt/Encore/Fake Tears — from hitting the ability holder *or its ally* that turn. It does NOT affect moves at normal (0) priority, and it doesn't stop field/side effects (screens, hazards, Tailwind on the other side of the field).

## Type-immunity reminders (easy to forget when checking coverage)
- Ghost-type moves have no effect on Normal-types, and Normal-type moves have no effect on Ghost-types. Relevant any time a Ghost-STAB attacker (e.g. Gholdengo's Shadow Ball) is being counted on to threaten a Normal-type support Pokémon (e.g. Farigiraf) — it won't.

*Add further verified ability/move interactions here as they come up in team-building sessions, rather than folding them into the type chart file.*

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo, no content changes | Bulbapedia, Serebii (verified in original claude.ai session) |
```

- [ ] **Step 2: Verify structure**

Run: `grep -c "^## Changelog" reference/vgc_ability_move_mechanics.md`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add reference/vgc_ability_move_mechanics.md
git commit -m "Add VGC ability/move mechanics reference file"
```

---

### Task 3: Migrate the teambuilding methodology file

**Files:**
- Create: `reference/vgc_teambuilding_methodology.md`

**Interfaces:**
- Produces: file pointed to by `CLAUDE.md` rules #4 and #7 (Task 7).

- [ ] **Step 1: Write the file**

Write `reference/vgc_teambuilding_methodology.md` with this exact content:

```markdown
# Teambuilding Methodology Notes (VGC / Pokémon Champions)

Process rules for how to evaluate matchups and build teams — not reference data itself, but how to use the reference data correctly.

## Typing alone is not sufficient to call something a "counter"

A type chart only describes a Pokémon's own STAB and its defensive typing — it says nothing about the actual moves a given set is running. A Pokémon is regularly used as a "check" or "counter" to something specifically *because* of a coverage move outside its own type(s), not because of its typing.

Classic example: Garchomp isn't a Rock-type and gets no defensive benefit from Rock at all, but is one of the most common answers to Charizard in practice specifically because it commonly runs **Rock Slide** as coverage (Rock is 4x on Fire/Flying), combined with a Ground/Dragon-neutral matchup that lets it switch in safely. The type chart alone would never surface that.

**So evaluating any matchup requires two separate checks, not one:**
1. **Typing** — what does the type chart say about raw effectiveness in both directions?
2. **Actual moveset** — what coverage moves is this Pokémon *actually running* in the current meta (per usage data like Pikalytics/VGCPastes), and does that change the picture regardless of its base types?

Skipping step 2 and reasoning from typing alone is a common way to misjudge a matchup — a Pokémon can be a real answer to something despite bad "on paper" typing, or a bad answer to something despite good typing if it isn't actually running the relevant coverage move. Always check both before calling something a counter/answer/threat.

*Add further process rules here as they come up (e.g. how to weigh usage stats vs. actual reasoning, how to handle Tera strategy once/if it's activated in a future regulation), keeping this separate from the type chart and mechanics reference files.*

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo, no content changes | Original claude.ai session reasoning, no external source needed (process rule, not factual claim) |
```

- [ ] **Step 2: Verify structure**

Run: `grep -c "^## Changelog" reference/vgc_teambuilding_methodology.md`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add reference/vgc_teambuilding_methodology.md
git commit -m "Add VGC teambuilding methodology reference file"
```

---

### Task 4: Create the current regulation file

**Files:**
- Create: `reference/vgc_current_regulation.md`

**Interfaces:**
- Produces: file pointed to by `CLAUDE.md` rules #3, #5, #6 (Task 7) as the primary volatile-fact file.
- Consumes: WebSearch tool, called live in Step 1 — do not substitute cached/recalled numbers.

- [ ] **Step 1: Pull a fresh top-usage snapshot**

Run a WebSearch query: `Pikalytics Pokemon Champions VGC regulation M-B usage stats July 2026`

Read the results and extract the current top-usage Pokémon list (names only, no full sets) with whatever date Pikalytics shows for the snapshot. If the search does not return a clean rankable list, fall back to noting "usage snapshot not pulled this session — re-check Pikalytics directly" instead of inventing numbers.

- [ ] **Step 2: Write the file**

Write `reference/vgc_current_regulation.md`, substituting the usage list from Step 1 into the `<USAGE_SNAPSHOT>` block (replace the placeholder line with the actual list — do not leave it in the committed file):

```markdown
# Current Regulation — Pokémon Champions VGC

**Last verified: 2026-07-09**

This is the single most volatile fact set in this repo. Before relying on
anything below, re-check it if it's been more than a couple of weeks since
"Last verified," or if the regulation's end date (below) has passed.

## Active regulation

- **Regulation Set M-B**
- Active dates: **17 June 2026 – 2 September 2026** (covers Worlds 2026)
- Prior regulation was M-A (ended 17 June 2026)

## Active mechanics

- **Mega Evolution is the only active competitive mechanic.** All Mega
  Evolutions legal in M-A remain legal, plus 16 new Mega Evolutions added
  for M-B (e.g. Mega Sceptile, Mega Blaziken, Mega Swampert, Mega Mawile,
  Mega Staraptor).
- **Terastallization exists in the game files but is NOT active** in this
  regulation. Do not recommend Tera strategy for current-format teams — see
  `vgc_common_pitfalls.md` for the correction history on this point.
- **Dynamax and Z-Moves are not active.** Both have been teased for
  possible future regulations, not confirmed.

## Platform / version context

- Pokémon Champions replaced Scarlet/Violet as the official VGC platform
  starting **8 April 2026** (Nintendo Switch / Switch 2).
- iOS and Android versions launched **17 June 2026**, same day M-B began.
  Switch save data carries over via linked Nintendo Account.
- This is a full platform change, not a patch — older Scarlet/Violet-era
  Smogon/VGC content may not reflect current mechanics, roster, or balance.

## Roster vs. legality — two separate checks

Champions' available roster is a **subset** of the full historical Pokédex,
not the complete National Dex, and it grows via periodic updates. Being
"unrestricted" in a regulation's rules does not mean a Pokémon is actually
available in Champions yet. Before recommending any Pokémon:

1. Does it exist in Champions' roster at all (check current roster list)?
2. If yes, is it legal under the *current* regulation's specific rules
   (not banned/restricted this regulation)?

Both checks are required — skipping either produces a wrong recommendation.

## Usage snapshot

<USAGE_SNAPSHOT>

This list decays fast — re-pull from Pikalytics before leaning on it for a
specific recommendation, especially more than a few weeks after the date
above.

## Sources

- https://victoryroad.pro/champions-regulations/
- https://www.pokemon.com/us/pokemon-news/regulation-set-m-b-kicks-off-a-new-ranked-battles-season-and-battle-pass-in-pokemon-champions
- https://bulbagarden.net/threads/pokemon-champions-launches-new-ruleset-for-competitive-vgc-regulation-set-m-a-runs-until-june-17th-2026.310333/
- https://www.pokemon.com/us/pokemon-news/pokemon-champions-comes-to-android-and-ios-on-june-17

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file; verified M-B regulation dates, active-mechanics status (Mega only, no Tera/Dynamax/Z-Move), and platform launch dates via web search | See Sources section above |
```

- [ ] **Step 3: Verify structure and that the placeholder was replaced**

Run: `grep -c "USAGE_SNAPSHOT" reference/vgc_current_regulation.md`
Expected: `0` (placeholder tag must not remain in the committed file)

Run: `grep -c "^## Changelog" reference/vgc_current_regulation.md`
Expected: `1`

- [ ] **Step 4: Commit**

```bash
git add reference/vgc_current_regulation.md
git commit -m "Add current regulation reference file (Reg M-B)"
```

---

### Task 5: Create the common pitfalls file

**Files:**
- Create: `reference/vgc_common_pitfalls.md`

**Interfaces:**
- Produces: file pointed to by `CLAUDE.md` (Task 7) and README index (Task 6).
- Consumes: regulation facts from Task 4's `reference/vgc_current_regulation.md` (must stay consistent — Mega-only, no Tera).

- [ ] **Step 1: Write the file**

Write `reference/vgc_common_pitfalls.md` with this exact content:

```markdown
# Common Pitfalls (VGC / Pokémon Champions)

Domain-specific gotchas that have caused real mistakes in past team-building
sessions, or that are easy to get wrong by default. Check this file before
finalizing any team-building recommendation.

## Data source pitfalls

- **Ladder data vs. tournament (Bo3) data diverge.** Pikalytics-style usage
  stats are pulled from ranked ladder play (Bo1, fast-paced, less
  team-preview counter-teaming). Actual tournament results (Bo3, real
  Swiss/elimination brackets) can favor different picks — a Pokémon can be
  ladder-dominant and tournament-weak or vice versa. Don't treat ladder
  usage as a proxy for "what wins tournaments" without checking tournament
  results separately.
- **"Common teammate" co-occurrence stats show correlation, not proven
  synergy.** Two Pokémon appearing together often in usage data doesn't mean
  they mechanically synergize — it can just mean both are independently
  strong and get used a lot. Verify the actual synergy mechanism (redirection,
  speed control, type coverage, etc.) rather than citing co-occurrence rate
  as if it were evidence of a working game plan.

## Current-mechanic correction

- **Terastallization is NOT active in the current regulation.** See
  `vgc_current_regulation.md` for the authoritative status. This file exists
  partly because an earlier claude.ai session incorrectly implied Tera
  strategy should be considered for current-format teams — it was corrected
  after user pushback, not caught proactively. Don't recommend Tera-based
  game plans (Tera-blast coverage, defensive Tera typing swaps, etc.) unless
  `vgc_current_regulation.md` says Tera is active as of its "Last verified"
  date.

## Doubles-specific traps

- **Grass-type immunity to powder moves can break a redirection plan.**
  Moves like Rage Powder (a common redirection tool) are powder moves and
  have no effect on Grass-types or Overcoat holders — a redirection-based
  game plan that assumes it always draws the opposing attack will fail
  outright against a Grass-type or Overcoat opponent.
- **Spread moves hit multiple targets but at reduced damage**, and in a
  doubles/VGC format that reduction applies even if only one of the two
  possible targets is actually present — check the specific move's spread
  behavior (e.g. Rock Slide/Muddy Water hit both opposing Pokémon; Earthquake
  hits both opponents AND the user's own ally unless the ally is immune or
  protected) before assuming a spread move is "free" team-wide damage.
- **Bring-6-pick-4 team selection** means a 6-Pokémon team is not one unit
  that always acts together — two of the six sit out every game. "Team
  synergy" claims should specify which 4-Pokémon subset the synergy applies
  to, not assume all 6 are always on the field.

## Build assumption trap

- **Don't assume a "generic" EV/item/ability spread.** A Pokémon's typing
  and base stats don't tell you its actual competitive set. Check the
  current meta's actual common spread (item, ability, EVs, moves) via usage
  data before reasoning about bulk, speed tier, or damage rolls — an
  outdated or assumed spread produces wrong damage-roll math even if the
  typing-level reasoning is correct.

## Process-lesson case studies

These are real corrections from a past team-building session (Whimsicott +
Gholdengo core), kept here as concrete examples of why "verify the real
chart, don't rely on recall" has to be a default step, not something that
only happens after a user catches a mistake:

- **Kingambit (Dark/Steel)** was initially suggested as a Farigiraf/Trick
  Room answer, but is actually a bad pick against that specific team —
  Dark/Steel is **4x weak to Fighting** (not "a bit weak"; both types are
  independently weak to Fighting, so it compounds), plus 2x Fire and 2x
  Ground, which would have stacked on top of that team's existing Fire
  weakness. This was only caught via user pushback.
- **Mega Aerodactyl (Rock/Flying)** was initially miscalculated as 4x weak
  to Ice — it's actually only **2x weak** (Ice is neutral against the Rock
  half, only super-effective against the Flying half). It's also **immune
  to Ground** entirely (Flying half cancels Ground's normal super-effective
  matchup against Rock). Both errors were caught only after the user
  demanded the real chart be pulled instead of relying on recall — see
  `vgc_type_chart_reference.md` for the verified chart.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Created file, consolidating pitfalls and process-lesson case studies from the claude.ai handoff session | pokemon_vgc_project_handoff.md (prior session notes); Tera-inactive status cross-checked against reference/vgc_current_regulation.md |
```

- [ ] **Step 2: Verify structure and internal consistency**

Run: `grep -c "^## Changelog" reference/vgc_common_pitfalls.md`
Expected: `1`

Run: `grep -c "NOT active" reference/vgc_common_pitfalls.md reference/vgc_current_regulation.md`
Expected: both files report at least 1 match (confirms the Tera-inactive claim is stated consistently in both files)

- [ ] **Step 3: Commit**

```bash
git add reference/vgc_common_pitfalls.md
git commit -m "Add common pitfalls reference file"
```

---

### Task 6: Write the README index

**Files:**
- Modify: `README.md` (currently just `# Claude-Pokemon-Teambuilder`)

**Interfaces:**
- Consumes: file list from Tasks 1-5 (all five `reference/*.md` files must exist before this task, since it links to each by path).

- [ ] **Step 1: Overwrite README.md**

Replace the full contents of `README.md` with:

```markdown
# Claude-Pokemon-Teambuilder

Reference workflow for high-quality VGC (Pokémon Champions, official doubles
format) team-building help — built to force verification against current
sources instead of letting the model coast on stale training data, and to
support both ladder/tournament prep and building around user-chosen favorite
Pokémon rather than copy-pasting top-usage squads.

This repo is the **sole source of truth** for this project. It supersedes an
earlier claude.ai chat + Google Drive setup (see `docs/superpowers/specs/`
for the design history) that hit a hard limitation: claude.ai's Drive
connector can create files but not update or delete them, so there was no
real way to maintain files or version history there.

## How to use this repo

Start any team-building session by reading `CLAUDE.md` (behavioral rules)
and `reference/vgc_current_regulation.md` (is the regulation info still
current?). The behavioral rules in `CLAUDE.md` require re-verifying volatile
facts via live web search rather than trusting these files indefinitely —
each reference file's `## Changelog` section and "Last verified" stamp (where
present) show how fresh its content is.

## Reference files

| File | Contents |
|---|---|
| [`reference/vgc_current_regulation.md`](reference/vgc_current_regulation.md) | Active regulation set, dates, active mechanics, roster-vs-legality rules, usage snapshot. **Most volatile file — check first.** |
| [`reference/vgc_common_pitfalls.md`](reference/vgc_common_pitfalls.md) | Domain-specific gotchas: ladder vs. tournament data, co-occurrence vs. synergy, doubles-specific traps, past correction case studies. |
| [`reference/vgc_type_chart_reference.md`](reference/vgc_type_chart_reference.md) | Full 18×18 Gen 6+ type effectiveness chart. |
| [`reference/vgc_ability_move_mechanics.md`](reference/vgc_ability_move_mechanics.md) | Ability/move mechanics not captured by typing alone (Trick Room priority, Armor Tail, etc.). |
| [`reference/vgc_teambuilding_methodology.md`](reference/vgc_teambuilding_methodology.md) | Process rules for evaluating matchups — typing alone isn't enough to call something a counter. |

## Design history

`docs/superpowers/specs/` and `docs/superpowers/plans/` contain the design
spec and implementation plan for how this repo was built, including the
migration from the prior claude.ai-based workflow.
```

- [ ] **Step 2: Verify all linked files exist**

Run: `for f in reference/vgc_current_regulation.md reference/vgc_common_pitfalls.md reference/vgc_type_chart_reference.md reference/vgc_ability_move_mechanics.md reference/vgc_teambuilding_methodology.md; do test -f "$f" && echo "OK: $f" || echo "MISSING: $f"; done`
Expected: five `OK:` lines, no `MISSING:` lines

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Write README index for VGC reference workflow"
```

---

### Task 7: Write CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: file paths from Tasks 1-5 (all `reference/*.md` files must exist, since rules point to them by path).

- [ ] **Step 1: Write the file**

Write `CLAUDE.md` at the repo root with this exact content:

```markdown
# CLAUDE.md

Behavioral rules for any Claude Code session working in this repo. These
apply repo-wide, for any task — this repo's sole purpose is VGC
team-building support, so there's no meaningful case where they don't apply.

This repo supersedes the claude.ai memory entries and Google Drive files
from the prior workflow (see `docs/superpowers/specs/` for history). Do not
treat those as current — this repo is the source of truth going forward.

## Rules

1. **Format is VGC doubles, Pokémon Champions official rules** — not Smogon
   singles. Don't apply Smogon-style singles reasoning or Scarlet/Violet-era
   assumptions without checking `reference/vgc_current_regulation.md` first.

2. **Two goals, not one**: ladder/tournament prep, AND building strong teams
   around a user-chosen favorite Pokémon. Don't default to "here's the top
   usage squad" when the user names a Pokémon they want to build around —
   that's the opposite of what this repo is for.

3. **Before any team or moveset suggestion, verify current data via live web
   search** (Pikalytics, Smogon VGC, Victory Road, or similar). Do not rely
   on training data, and do not trust this repo's own files past their
   "Last verified" date — check `reference/vgc_current_regulation.md` first.

4. **No cookie-cutter squads.** Any team-building help must show real
   reasoning: speed tiers/speed control, damage rolls vs. relevant threats,
   current-mechanic strategy (Mega Evolution — see rule 5), redirection/
   support synergy, weather/terrain, how pieces cover each other's
   weaknesses. See `reference/vgc_teambuilding_methodology.md`.

5. **Check the current regulation every session**, even if it was already
   checked earlier in the same conversation — regulations have hard end
   dates. See `reference/vgc_current_regulation.md`. As of that file's last
   verification, Mega Evolution is the only active mechanic; do not suggest
   Tera/Dynamax/Z-Move strategy unless that file says otherwise.

6. **Roster availability and regulation legality are two separate checks.**
   A Pokémon can be unrestricted by the rules but not yet available in
   Champions' roster, or available but restricted this regulation. Check
   both — see `reference/vgc_current_regulation.md`.

7. **Evaluating a counter/answer/threat requires both typing AND actual
   current moveset**, not typing alone. See
   `reference/vgc_type_chart_reference.md` for raw effectiveness and
   `reference/vgc_teambuilding_methodology.md` for why typing alone is
   insufficient.

8. **Precedence on conflicts**: live web search > this repo's files > model
   training data/memory. If a repo file conflicts with a fresh search
   result, the search result wins — and the file should be corrected
   (rule 9), not just overridden in chat.

9. **When a correction or new pitfall is caught mid-session, fix the
   relevant file in the same session**, with a new `## Changelog` row
   (`Date | Change | Source`). Don't just give the correct answer in chat
   and leave the file stale — that's how the prior claude.ai workflow's
   files drifted from what was actually being told to the user.

10. **Check `reference/vgc_common_pitfalls.md`** before finalizing any
    team-building recommendation — it covers gotchas that have caused real
    past mistakes (ladder-vs-tournament data, co-occurrence-vs-synergy,
    doubles-specific traps).
```

- [ ] **Step 2: Verify structure and cross-references**

Run: `grep -o "reference/[a-z_]*\.md" CLAUDE.md | sort -u`
Expected output — four files (by design, `vgc_ability_move_mechanics.md` is
only discoverable via the README index, not pointed to directly from
`CLAUDE.md`):
```
reference/vgc_common_pitfalls.md
reference/vgc_current_regulation.md
reference/vgc_teambuilding_methodology.md
reference/vgc_type_chart_reference.md
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Add CLAUDE.md behavioral rules for VGC workflow"
```

---

### Task 8: Final verification and push

**Files:** none created/modified — verification and push only.

**Interfaces:** none (terminal task).

- [ ] **Step 1: Verify full repo structure**

Run: `find . -not -path './.git*' -not -path './docs*' -type f | sort`
Expected output:
```
./CLAUDE.md
./README.md
./reference/vgc_ability_move_mechanics.md
./reference/vgc_common_pitfalls.md
./reference/vgc_current_regulation.md
./reference/vgc_teambuilding_methodology.md
./reference/vgc_type_chart_reference.md
```

- [ ] **Step 2: Verify every reference file has a changelog**

Run: `grep -L "^## Changelog" reference/*.md`
Expected: no output (empty — every file matched, meaning none is missing the section)

- [ ] **Step 3: Verify git log shows one commit per task**

Run: `git log --oneline -10`
Expected: commits for type chart, ability/move mechanics, teambuilding methodology, current regulation, common pitfalls, README, CLAUDE.md, plus the earlier design-spec commit — 8 commits total on top of the initial commit.

- [ ] **Step 4: Push to origin/main**

```bash
git push origin main
```

Expected: push succeeds, `origin/main` now matches local `main`.

- [ ] **Step 5: Confirm clean working tree**

Run: `git status`
Expected: `nothing to commit, working tree clean` and `Your branch is up to date with 'origin/main'.`
