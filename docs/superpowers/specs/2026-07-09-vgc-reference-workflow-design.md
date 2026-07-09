# VGC Team-Building Reference Workflow — Design

Date: 2026-07-09
Status: Approved

## 1. Problem

Team-building help for Pokémon VGC (Pokémon Champions, doubles) needs to stay
correct against a meta and ruleset that shift constantly, and against a game
that itself changed platforms (Scarlet/Violet → Pokémon Champions) in 2026.
LLM training data and cached chat memory go stale fast in this domain.

This work was previously being done in claude.ai chat, backed by claude.ai's
built-in memory (10 short pointer entries) and three reference files in a
Google Drive folder. That setup hit a hard technical wall: claude.ai's
first-party Drive connector is read/create-only — there is no update, delete,
or move tool — so every "edit" required creating a new file and manually
trashing the old one, with no real version history. Full context on that
prior session is in `pokemon_vgc_project_handoff.md` (handoff doc, not part
of this repo).

This repo replaces that setup with real files, real git history, and a
`CLAUDE.md` that gives Claude Code the same behavioral rules the claude.ai
memory entries encoded — without the Drive limitation.

## 2. Goals

- Format: VGC doubles, official Pokémon Champions rules — not Smogon singles.
- Support two goals at once: ladder/tournament prep, and building strong teams
  around a user-chosen favorite Pokémon — not just copying top-usage squads.
- Any team-building help must show real reasoning: speed tiers/speed control,
  damage rolls vs. relevant threats, current-mechanic strategy (Mega
  Evolution — see Section 4 correction), redirection/support synergy,
  weather/terrain, how team pieces cover each other's weaknesses.
- No cookie-cutter "here's the top usage set" answers.
- Force verification against current sources (web search) rather than let the
  model coast on training data or stale cached facts, especially for the two
  most volatile fact sets: current regulation, and current usage/meta data.

## 3. Repo structure

```
README.md                              — index: what's here, how to use it
CLAUDE.md                              — behavioral rules, repo-wide, always active
reference/
  vgc_type_chart_reference.md          — full 18x18 type chart (migrated from Drive)
  vgc_ability_move_mechanics.md        — ability/move mechanics notes (migrated from Drive)
  vgc_teambuilding_methodology.md      — typing+moveset methodology (migrated from Drive)
  vgc_current_regulation.md            — NEW: active regulation, dates, active mechanics, roster notes
  vgc_common_pitfalls.md               — NEW: domain gotchas (see Section 5)
```

`README.md` at root lists each reference file with a one-line description of
its contents and scope, so a fresh session (or a human) can see at a glance
what exists without opening every file.

### Changelog convention

Every file in `reference/` ends with a `## Changelog` section: a table with
columns `Date | Change | Source`. Edits append a row rather than silently
overwriting history — this gives the "what changed, when, why, verified how"
record the handoff doc flagged as missing (handoff Section 3, item 1).

## 4. Content: migrated files

The three files pasted in from the claude.ai session's Drive folder are
migrated into `reference/` with a changelog footer added to each, content
otherwise unchanged:

- `vgc_type_chart_reference.md` — full Gen 6+ 18×18 type effectiveness chart.
  **Verified during this design session**: cross-checked every row against
  the standard Gen 6+ chart; no errors found.
- `vgc_ability_move_mechanics.md` — Trick Room (-7 priority, always resolves
  last), Armor Tail (blocks priority-boosted moves incl. Prankster status
  against holder/ally), Ghost/Normal mutual immunity.
- `vgc_teambuilding_methodology.md` — typing alone is insufficient to call
  something a counter; must also check actual current moveset/coverage
  (Garchomp/Rock Slide vs. Charizard example).

**Correction applied during migration**: the handoff doc flagged that Claude
incorrectly implied Terastallization was active in an earlier claude.ai
session. Verified via web search during this design session (Victory Road,
Pokemon.com, Bulbagarden, sources below): **Regulation M-B (active 17 June –
2 September 2026, through Worlds 2026) has Mega Evolution as the only active
competitive mechanic.** Terastallization exists in game files but is not
active; Dynamax and Z-Moves are not active. This correction is baked into
`vgc_current_regulation.md` and `vgc_common_pitfalls.md` from the start, not
retrofitted.

Sources verified this session:
- https://victoryroad.pro/champions-regulations/
- https://www.pokemon.com/us/pokemon-news/regulation-set-m-b-kicks-off-a-new-ranked-battles-season-and-battle-pass-in-pokemon-champions
- https://bulbagarden.net/threads/pokemon-champions-launches-new-ruleset-for-competitive-vgc-regulation-set-m-a-runs-until-june-17th-2026.310333/
- https://www.pokemon.com/us/pokemon-news/pokemon-champions-comes-to-android-and-ios-on-june-17

## 5. Content: new files

### `vgc_current_regulation.md`

The single most volatile, most consequential fact set, given its own file
per the handoff's explicit recommendation (handoff Section 3, item 4):

- Active regulation name and exact date range.
- Active mechanics list (currently: Mega Evolution only).
- Platform/version notes (Champions replaced Scarlet/Violet; Switch launch
  April 8, 2026; iOS/Android launch June 17, 2026 — relevant because it
  explains why older Smogon/SV-era content doesn't apply).
- Roster note: Champions' available roster is a subset of the full dex, not
  the full National Dex — being unrestricted doesn't mean available. Check
  both "does this Pokémon exist in Champions" and "is it legal this
  regulation."
- A fresh top-usage snapshot pulled from Pikalytics during implementation
  (dated, explicitly marked as decaying — re-check before relying on it).
- "Last verified" date at the top of the file, separate from the changelog,
  so staleness is visible without reading the whole changelog table.

### `vgc_common_pitfalls.md`

Domain-specific gotchas, per handoff Section 3 item 3:
- Ladder data (Pikalytics) vs. actual tournament (Bo3) data diverge.
- "Common teammate" co-occurrence stats show correlation, not proven synergy.
- Current mechanic status: Mega Evolution only, Tera/Z-Move/Dynamax not
  active — don't recommend Tera strategy for current-format teams.
- Doubles-specific traps: Grass-type immunity to powder moves can break a
  redirection plan; spread moves take reduced damage but hit both
  opponents including potential ally splash; bring-6-pick-4 team-select
  means "team synergy" shouldn't assume all 6 Pokémon are always on the
  field together.
- Don't assume a "generic" build — check the actual current EV/item/ability
  spread in use before reasoning about a matchup.

Also folds in the process-lesson takeaways from the handoff's Whimsicott/
Gholdengo practice exercise (handoff Section 5): Kingambit's real Dark/Steel
weaknesses (4x Fighting, not "a bit weak"), Mega Aerodactyl's real Ice
weakness (2x via Rock/Flying, not 4x) and Ground immunity — both framed as
"verify the real chart, don't rely on recall" examples, since that's the
actual lesson (these were only caught after user pushback in the original
session).

## 6. `CLAUDE.md`

Repo-wide, always active (not conditional on task type — team-building is
essentially the only purpose of this repo). Mirrors the 10 claude.ai memory
entries as short rules with pointers into `reference/`, not restated content
— same discipline the memory system used, to avoid the file/rule content
drifting out of sync with itself:

1. Format = VGC doubles, Pokémon Champions rules, not Smogon singles.
2. Goals = ladder/tournament prep + building around user-chosen favorite
   Pokémon, not top-usage copy-paste.
3. Before any team/moveset suggestion: web search current data (Pikalytics,
   Smogon VGC, Victory Road) — don't rely on training data or on this repo's
   files past their "last verified" date.
4. No cookie-cutter squads — show real reasoning (speed, damage rolls,
   current mechanics, synergy, weakness coverage). See
   `reference/vgc_teambuilding_methodology.md`.
5. Check current regulation before helping, every session — see
   `reference/vgc_current_regulation.md` — even if it was checked earlier in
   the same conversation; regulations have hard end dates.
6. Roster availability and regulation legality are two separate checks, not
   one — see `reference/vgc_current_regulation.md`.
7. Counter/answer/threat evaluation needs both typing (
   `reference/vgc_type_chart_reference.md`) and actual current moveset check
   — see `reference/vgc_teambuilding_methodology.md`.
8. Precedence on conflicts: live web search > this repo's files > model
   memory/training data.
9. When a correction or new pitfall is caught mid-session, fix the relevant
   file in this same session with a changelog row — don't just answer
   correctly in chat and leave the file stale.
10. This repo is the sole source of truth going forward. The claude.ai
    memory entries and Drive files described in the handoff doc are
    superseded and should not be maintained in parallel.

## 7. Out of scope

- No automated update/scraping pipeline — updates happen when a Claude Code
  session does team-building work and hits stale/wrong data, per the trigger
  in CLAUDE.md rule 9.
- No migration of claude.ai's memory entries into any tool other than
  `CLAUDE.md` — there's no ongoing claude.ai-side sync to build.
- Not building actual team recommendations/sets in this pass — this is
  infrastructure only.
