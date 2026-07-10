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
   assumptions without checking `reference/vgc_current_regulation.md` first
   — this includes stat mechanics: Champions replaced EVs/IVs with a Stat
   Points (SP) system entirely, see that file's "Stat system" section
   before using EV terminology or numbers.

2. **Two goals, not one**: ladder/tournament prep, AND building strong teams
   around a user-chosen favorite Pokémon. Don't default to "here's the top
   usage squad" when the user names a Pokémon they want to build around —
   that's the opposite of what this repo is for.

3. **Before any team or moveset suggestion, verify current data via live web
   search** (Pikalytics, Smogon VGC, Victory Road, or similar — see
   `reference/vgc_teambuilding_methodology.md`'s "Live meta lookup" section
   for the concrete Pikalytics URL pattern and its staleness trap). Do not
   rely on training data, and do not trust this repo's own files past their
   "Last verified" date where one is stamped (only
   `reference/vgc_current_regulation.md` currently carries one — check it
   first; other files fall back to their `## Changelog` dates).

4. **No cookie-cutter squads.** Any team-building help must show real
   reasoning: speed tiers/speed control (see
   `reference/vgc_ability_move_mechanics.md`'s Speed calculation section),
   damage rolls vs. relevant threats (see `reference/vgc_damage_calc.md` —
   run tools/damage-calc/cli.js for a real calculation rather than
   hand-computing one), current-mechanic strategy (Mega
   Evolution — see rule 5), redirection/support synergy, weather/terrain,
   how pieces cover each other's weaknesses. See
   `reference/vgc_teambuilding_methodology.md`.

5. **Check the current regulation every session**, even if it was already
   checked earlier in the same conversation — regulations have hard end
   dates. `reference/vgc_current_regulation.md` is the sole authority on
   which mechanics are active (as of its last verification: Mega Evolution
   only, no Tera/Dynamax/Z-Move) — read it fresh each session rather than
   assuming that stays true; it's the one fact in this repo most likely to
   flip.

6. **Roster availability and regulation legality are two separate checks.**
   A Pokémon can be unrestricted by the rules but not yet available in
   Champions' roster, or available but restricted this regulation. Check
   both — see `reference/vgc_current_regulation.md`.

7. **Evaluating a counter/answer/threat requires both typing AND actual
   current moveset**, not typing alone. See
   `reference/vgc_type_chart_reference.md` for raw effectiveness and
   `reference/vgc_teambuilding_methodology.md` for why typing alone is
   insufficient. This repo deliberately does NOT maintain a ranked "top
   meta picks" or "speed tier" list file — a static ranked list would bias
   toward whatever was already popular when it was written and go stale
   immediately. Look up a specific Pokémon's current moveset/speed spread
   live, on demand, when it's actually relevant to the team being built —
   not from a pre-baked ranking. The only things that get persisted are
   confirmed traps (`reference/vgc_common_pitfalls.md`) and formula-level
   mechanics that don't change with the meta
   (`reference/vgc_ability_move_mechanics.md`).

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

11. **Save a team once you've built it** to `teams/` (see
    `teams/_TEMPLATE.md` for the format). Capture not just the final six
    but the reasoning per pick and what was deliberately left out, so a
    later session can see *why*, not just *what*. Update a team's file in
    place as it evolves, with a changelog row, rather than creating a new
    file per iteration.
