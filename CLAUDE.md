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
