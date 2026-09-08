# CLAUDE.md

This repo is VGC team-building support for **Pokémon Champions** official
doubles — not Smogon singles, not Scarlet/Violet. Champions replaced EVs/IVs
with Stat Points (SP) entirely: never use EV numbers, and never assume an
EV→SP conversion factor. These rules apply to every session here.

## Format rules that are always true — state these directly

Baseline rules of VGC doubles. They do not change between regulations, they
need no tool call and no web lookup, and answering "let me check" to one of
them is the wrong answer. Full detail and sourcing in
`reference/vgc-format.md`.

- **Register 6 (4-6 legal), bring 4.** The first two of the four lead.
- **Item Clause:** no two Pokémon on a team may hold the same item. Hard rule.
- **Species Clause:** no two may share a National Pokédex number — Rotom-Wash
  and Rotom-Heat collide.
- **Everything but which four you bring is locked at registration** — item,
  moves, ability, SP, Stat Alignment. Never suggest flexing an item or move
  per matchup; present it as a permanent trade-off instead.
- **Team Preview always shows the opponent all six species.** No plan gets
  value from hiding *what you brought*.
- **Whether the ladder's Team Preview shows held items is UNRESOLVED — never
  assert it either way.** Abilities, moves and spreads are hidden there. If
  item visibility decides something, say it's unresolved and ask.
- **Open Team Sheets are a tournament convention, not a game mode.** The
  ladder has no OTS option. Under OTS the opponent gets ability, item, moves
  and Stat Alignment — **never the stats**.
- **A rules source that opens "In tournaments, ..." means it.** That scope is
  load-bearing; carry it into the claim. Dropping it has caused this exact
  error twice.
- **SP spreads are private in every venue**, OTS included — the one genuinely
  hidden variable left.
- **Only one Pokémon Mega Evolves per battle — and registering two Mega
  Stones anyway is standard, not a flaw.** Four of M-B's top six archetypes
  by team count do it. Treat the second Mega as the bring-4 flex slot it is;
  never present the one-per-battle limit as though it breaks the plan.
- **Ladder is best-of-one; tournament top cut is best-of-three.** A Bo3 team
  needs a viable *second* four, because the opponent re-picks after game one.
- **All battles are Level 50.** Hidden Abilities are legal; **Battle Bond is
  banned in every regulation.**
- **Clocks:** Team Preview 90s, move 45s, player time 7 min, game 20 min.

## Never state these from recall — run the command

| Claim | Command |
|---|---|
| Type effectiveness: one attacker vs one defender | `node tools/dex/cli.js type <Type> --vs <Def1[,Def2]>` |
| **What is X weak to** — the whole defensive profile | `node tools/dex/cli.js type --vs-mon "<Species>"` |
| A Mega's ability, typing, or base stats | `node tools/dex/cli.js mon "Mega <Species>"` |
| Item or ability legality in Champions | `node tools/dex/cli.js legal --item "<Item>"` |
| Move power, type, spread/priority flags | `node tools/dex/cli.js move "<Move>"` |
| Whether a Pokémon can learn a move | `node tools/dex/cli.js learnset "<Species>" --move "<Move>"` |
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
- **Never loop this CLI over a list of types and grep its JSON.** Ask the
  profile question in one call instead. In a shell loop a bad type prints a
  blank line and the pipeline still exits 0, so an error looks like "nothing
  notable" — and the 18-type list is yours to get wrong. `--vs-mon` also reads
  the defender's typing from the dex rather than taking it from your recall,
  which matters most for Megas that retype.

Non-Mega Pokémon usually have 2-3 legal abilities. `dex mon` returns one
option, not the only one — check the real preset for the specific set being
built.

## Learnsets are local now — but read the verdict, not just the exit code

Move legality is answerable locally: `dex learnset` reads a vendored snapshot
of Pokémon Showdown's Champions learnsets, and `dex team` enforces it.

It returns **three** verdicts, and the third is not a failure mode to paper over:

- `legal` / `illegal` — hard answers. Trust them.
- `unknown` — the species is not in the vendored table. This is **not**
  evidence the move is illegal. Verify live, and check whether
  `tools/dex/VENDOR_MANIFEST.md` needs re-vendoring.

**The pin expires.** Learnsets are regulation-variant: at the M-B rollover
upstream changed by +2019/-353 lines, so regulations add species *and cut
existing move pools*. A pin from a previous regulation keeps serving complete,
normal-looking, wrong data rather than failing — the same trap as a stale
Pikalytics slug. The session-start hook reports regulation drift; when it
does, re-vendor before trusting a legality answer.

This closes the worst failure in this repo's history — a whole team premise
built on Mega Altaria running Calm Mind, which it cannot learn, unnoticed
until a final audit. That exact case is now a permanent regression test.

Scope: legality only. The data carries no level-up/TM/egg distinction.

## Every session, before giving advice

1. **Regulation** — read `reference/regulation.md` fresh, even if it was
   already checked earlier in this same conversation. It is the sole
   authority on which mechanics are active, and the fact here most likely
   to have flipped. Regulations turn over every one to three months; the
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
- **`teams/` is read-only unless the user explicitly says to write.** No
  implicit exceptions, in either direction:
  - **New teams** — working a full loadout out in chat is not permission to
    persist it. Saving is a separate step the user gates.
  - **Existing teams** — they are historical records of what was true when
    they were built, and stay wrong on purpose. Do **not** edit one to fix a
    legality error, refresh a spread, apply an audit finding, re-verify it
    against the current regulation, or add a note that it predates one. A
    rollover is not permission. Finding a genuine error is not permission.
    Being mid-audit of that exact file is not permission.
  - Report what you found in chat and leave the file alone. If the change
    seems worth making, *ask* — one line, then drop it if the answer is no.
  - **When told to revise a team, the six species decide where it goes.**
    Same six — edit in place, with a changelog row recording each **old
    value**. Any species swapped, or ported to a new regulation — new file
    `<original-basename>-v2.md` with a `**Supersedes:**` stamp, predecessor
    left untouched. Not sure which? Ask in one line first. "It's a small
    tweak" is not the test; the species list is.
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
| Match/team rules — clauses, Team Preview, OTS, Bo1 vs Bo3, clocks | `reference/vgc-format.md` |
| Active regulation, active mechanics, what's incoming | `reference/regulation.md` |
| SP system, platform, roster-vs-legality, what the local data covers | `reference/champions-format.md` |
| Past regulations (for reading old team files) | `reference/regulations/` |
| Known traps — check before finalising any recommendation | `reference/pitfalls.md` |
| Process and reasoning rules | `reference/methodology.md` |
| Priority, speed modifiers, item and ability mechanics | `reference/mechanics.md` |
| Damage-calc CLI usage and its caveats | `reference/damage-calc.md` |
| Why a rule exists — the incident behind it | `docs/case-studies.md` |
