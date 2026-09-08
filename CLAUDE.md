# CLAUDE.md

This repo is VGC team-building support for **Pokémon Champions** official
doubles — not Smogon singles, not Scarlet/Violet. Champions replaced EVs/IVs
with Stat Points (SP) entirely: never use EV numbers, and never assume an
EV→SP conversion factor. These rules apply to every session here.

## Never state these from recall — run the command

| Claim | Command |
|---|---|
| Type effectiveness: resistance, weakness, immunity, coverage | `node tools/dex/cli.js type <Type> --vs <Def1[,Def2]>` |
| A Mega's ability, typing, or base stats | `node tools/dex/cli.js mon "Mega <Species>"` |
| Item or ability legality in Champions | `node tools/dex/cli.js legal --item "<Item>"` |
| Move power, type, spread/priority flags | `node tools/dex/cli.js move "<Move>"` |
| Damage rolls | `node tools/damage-calc/cli.js …` — see `reference/damage-calc.md` |
| Minimum SP to survive a named attack | `node tools/damage-calc/optimize-bulk-cli.js …` |
| Is this team legal? (items, SP, abilities, regulation) | `node tools/dex/cli.js team teams/<file>.md` |

Every claim in that table has been stated wrong from recall in this repo
**while the correct answer was already written down here**. The command costs
less than being wrong, so run it every time — including for matchups that
feel too obvious to check. That feeling is the failure mode, not a signal.

Two specifics the tool exists to settle:

- A usage page's ability percentages for a Mega-capable species report the
  **pre-Mega** selection, never the Mega's fixed battle ability. `dex mon`
  labels which is which.
- For a dual-type defender, pass both types in one call and let the tool
  multiply. Reasoning from one half is how a 0x immunity gets missed.

Non-Mega Pokémon usually have 2-3 legal abilities. `dex mon` returns one
option, not the only one — check the real preset for the specific set being
built.

## Learnsets are NOT in the local data — verify them live

There is no move-legality data in the vendored dex at all. `dex move` tells
you a move exists and what it does; **nothing local tells you whether a given
Pokémon can learn it.**

Before committing to any role that depends on a specific move, check the
species' Champions learnset live (Bulbapedia's learnset for the species, or a
real usage page's move list). This is not optional diligence — the worst
failure in this repo's history was an entire team premise built on Mega
Altaria running Calm Mind, which it cannot learn, unnoticed until a final
audit. See `reference/champions-format.md` for the full list of what the
local data does and does not cover.

## Every session, before giving advice

1. **Regulation** — read `reference/regulation.md` fresh, even if it was
   already checked earlier in this same conversation. It is the sole
   authority on which mechanics are active, and the fact here most likely
   to have flipped. Regulations turn over every ~3-4 months; the
   session-start hook reports which **phase** the current one is in
   (`EARLY` / `FORMING` / `SETTLED` / `ROLLOVER IMMINENT` / `ENDED`) and the
   correct behaviour differs by phase — act on what it says.
2. **Live meta** — pull current data before any team or moveset suggestion
   (the `vgc-meta-lookup` skill). Never rely on training data, and never
   cite `teams/` files as current meta. Early in a regulation there *is* no
   usage data — that's a normal phase, not a reason to present thin numbers
   as settled. **Whenever you fetch a usage page, read its format label and
   confirm it names the current regulation** — a previous regulation's
   Pikalytics URL keeps serving complete, normal-looking, wrong data instead
   of failing.
3. **Roster availability and regulation legality are separate checks.** Both
   are required, for Pokémon, items, and abilities alike — and the vendored
   data lags a regulation change until it is re-vendored, so a species being
   absent locally right after a rollover means "not updated yet", not
   "not legal".

## How to work

- **Two goals, not one:** ladder/tournament prep, *and* building around a
  user-named favourite. Never answer the second with the top-usage squad.
- **Collaborative, not a solo deliverable.** Research legwork needs no
  permission; locking things in does. Check in at real decision points, and
  when filling a single roster slot present 3-5 verified candidates with
  their trade-offs rather than one researched answer.
- **Never `Write` or `Edit` anything in `teams/` until the user explicitly
  says to save.** Working a full loadout out in chat is not permission to
  persist it — that is a separate step the user gates.
- **Solve for the minimum SP** each stat actually needs; don't default to a
  round 32/32/2 split. Verifying that 32 survives a hit is not the same as
  finding the minimum that survives it.
- **No cookie-cutter squads.** Show the reasoning: speed control, real
  damage rolls, redirection/weather synergy, how the pieces cover each
  other's weaknesses.
- **A support pick isn't judged on damage.** Redirection, screens, speed
  control and status are judged on whether the action actually goes off.
- **Precedence on conflicts:** live web search > this repo's files > recall.
  When a repo file turns out to be wrong, fix it in the same session with a
  new `## Changelog` row — don't just correct it in chat and move on.

## Where things live

| Need | Go to |
|---|---|
| Building a team | `vgc-team-building` skill |
| Auditing a team you already have | `vgc-team-audit` skill |
| Refining an already-decided team | `vgc-team-refining` skill |
| "Does X counter/answer/beat Y" | `vgc-threat-evaluation` skill |
| "What's the meta / what will I face" | `vgc-meta-lookup` skill |
| A regulation just ended or is about to | `vgc-regulation-transition` skill |
| Active regulation, active mechanics, what's incoming | `reference/regulation.md` |
| SP system, platform, roster-vs-legality, what the local data covers | `reference/champions-format.md` |
| Past regulations (for reading old team files) | `reference/regulations/` |
| Known traps — check before finalising any recommendation | `reference/pitfalls.md` |
| Process and reasoning rules | `reference/methodology.md` |
| Priority, speed modifiers, item and ability mechanics | `reference/mechanics.md` |
| Damage-calc CLI usage and its caveats | `reference/damage-calc.md` |
| Why a rule exists — the incident behind it | `docs/case-studies.md` |
