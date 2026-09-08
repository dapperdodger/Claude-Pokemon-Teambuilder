# VGC doubles format rules

How a VGC doubles **match and team** actually work. Everything here is
evergreen: it does not change when a regulation rolls over, and most of it
did not change when the platform moved from Scarlet/Violet to Champions.

This file exists because these rules were previously stored only as entries
in `pitfalls.md` — reachable only by recalling the mistake attached to them.
They are baseline format knowledge, needed at the *start* of a conversation
when someone asks "can I do X?", not at the end when a team is being audited.
State them directly; don't re-derive them and don't look them up per session.

**The three-way split this file completes:**

| File | Holds |
|---|---|
| `reference/regulation.md` | What changes every cycle — dates, active mechanics, banlist, usage slug |
| `reference/champions-format.md` | Champions **platform** facts — Stat Points, roster-vs-legality, vendored data coverage |
| **this file** | How a **match and a team** work — registration, clauses, Team Preview, clocks |

Doubles *battle* mechanics — spread damage, redirection, speed modifiers,
priority — are in `reference/mechanics.md`, not here.

## Contents

- [Confidence marking](#confidence-marking)
- [Team construction](#team-construction)
- [The team is locked; only the four you bring is a choice](#the-team-is-locked-only-the-four-you-bring-is-a-choice)
- [What the opponent knows before the first move](#what-the-opponent-knows-before-the-first-move)
- [Open Team Sheets are a tournament convention, not a game mode](#open-team-sheets-are-a-tournament-convention-not-a-game-mode)
- [Ladder and tournament differ in rules, not just data](#ladder-and-tournament-differ-in-rules-not-just-data)
- [Match structure and clocks](#match-structure-and-clocks)
- [Restricted Pokémon: the structure is evergreen, the list is not](#restricted-pokémon-the-structure-is-evergreen-the-list-is-not)
- [Sources](#sources)
- [Changelog](#changelog)

## Confidence marking

Not every line here is equally well established, and flattening that
distinction is how a plausible-sounding claim becomes a wrong one. Each fact
carries one of:

- **[official]** — from the Play! Pokémon VGC Tournament Handbook or
  pokemon.com. State it flatly.
- **[consensus]** — multiple independent third-party sources agree, no
  official confirmation found. Usable, but say "as far as I can confirm"
  when it is load-bearing for a decision.
- **[unresolved]** — genuinely not settled. Say so rather than picking a side.

Promoting a **[consensus]** line to **[official]** requires an actual official
source, not repetition.

## Team construction

- **Register 6, battle with 4.** Doubles teams register **four to six**
  Pokémon; four are selected per game. **[official]** Six is standard and
  effectively universal — a smaller team just removes your own options.
- **Species Clause.** No two Pokémon on a team may share a National Pokédex
  number. **[official]** This is by *number*, not by appearance: Rotom-Wash
  and Rotom-Heat are the same species and cannot coexist. Regional forms of
  the same species collide the same way.
- **Item Clause.** *"Each Pokémon may hold an item, though no two Pokémon may
  hold the same item."* **[official]** This is a hard rule, not a
  guideline — see [pitfalls.md](pitfalls.md#team-finalization-checks) for the
  two occasions it was violated mid-build here.
- **All battles are Level 50.** Pokémon above or below 50 are auto-levelled
  to 50 during battle. **[official]**
- **Battle Bond is banned outright**, in every regulation. **[official]** It
  is the one ability excluded by the handbook itself rather than by a
  regulation's banlist, so it does not appear on per-cycle ban lists.
- Otherwise a Pokémon may use any move or ability available to it through
  normal gameplay, **including Hidden Abilities** and event-distributed moves
  and abilities. **[official]**

## The team is locked; only the four you bring is a choice

> *"A competitor must register the Pokémon to be used for a competition in a
> Battle Team and keep the Battle Team unchanged from the beginning to the end
> of the competition."* — Play! Pokémon VGC Tournament Handbook §2.1
> **[official]**

Everything about a Pokémon — held item, moves, ability, Stat Point spread,
Stat Alignment — is fixed when the team is registered. It stays fixed for
every game of every round.

**The only per-matchup decision is which four of the six you bring, and the
order of the first two.** That is the entire surface area of in-match
adaptation.

So these are not real recommendations, and should never be phrased as though
they were:

- ❌ "Run Occa Berry into Fire matchups and Colbur Berry into Dark ones."
- ❌ "Carry both Mega Stones and pick whichever Mega the matchup wants."
  — legal (they are different items, so no Item Clause problem), but the
  *stones* are both on the team permanently; only which Pokémon you bring
  flexes.
- ❌ "Swap this move in against Trick Room teams."

A choice between two items is a **permanent trade-off** — which threat is more
likely and more costly across the whole field — and must be presented that
way. Bring-6-pick-4 flexibility is real and worth building around; it just
operates on *Pokémon*, never on their contents.

## What the opponent knows before the first move

This is the table that decides whether any "surprise factor" argument holds.

| Information | Ranked ladder | Tournament (Open Team Sheets) |
|---|---|---|
| All six species (and forms) | Visible **[official]** | Visible **[official]** |
| Held items, incl. Mega Stones | Visible **[consensus]** | Visible **[official]** |
| Abilities | **Hidden** **[consensus]** | Visible **[official]** |
| Moves | **Hidden** **[consensus]** | Visible **[official]** |
| Stat Alignment (nature) | **Hidden** **[consensus]** | Visible **[official]** |
| Stat Point spread / final stats | **Hidden** | **Hidden** **[official]** |

Two consequences worth carrying into every conversation:

1. **Nothing about your six is hidden at Team Preview except numbers, moves
   and abilities — and in a tournament, not even those.** The species are
   always public. Any plan whose value comes from the opponent not knowing
   *what you brought* is worth nothing in either venue.
2. **SP spreads are private everywhere**, including under Open Team Sheets.
   An unexpected bulk or Speed investment is the one genuinely hidden
   variable that survives into official tournament play.

The ladder rows are **[consensus]**: multiple Champions strategy resources
state that Team Preview shows every Pokémon's held item — including Mega
Stones, which confirms the Mega slot — while abilities, movesets and spreads
stay hidden. No official Pokémon Company source confirming the in-game
Team Preview display was found. Treat the shape as reliable and say so with
the hedge attached when it decides something.

## Open Team Sheets are a tournament convention, not a game mode

> *"The 2026 Pokémon VGC season will utilize an open team list format.
> Competitors are required to provide a legible and accurate list of the
> Pokémon that comprise their team... All Pokémon information provided on the
> team list will be made available to the opponent except [the stats]."*
> — Handbook §2.4 **[official]**

Mechanically: it is a **paper/RK9 process run by the Tournament Organizer**,
not a battle setting. Competitors exchange lists after connecting and may
reference them at any point during the match. The team list — not the in-game
team — is the source of truth; producing a team that doesn't match it is a
penalty. **[official]**

The list carries species and form, ability, held item, all known moves, all
stats, and Stat Alignment; **everything but the stats is shown to the
opponent**. **[official]**

**The in-game ranked ladder has no Open Team Sheets option at all.** There is
no setting to enable it, which is itself a standing player request to The
Pokémon Company. **[consensus]**

**The meta-rule this cost us twice:** when a rules source begins *"In
tournaments, ..."*, that qualifier is load-bearing. Carry the scope into the
claim instead of dropping it in the summary. Both times this was stated
wrongly here, the qualifier was present in the very source being quoted.

## Ladder and tournament differ in rules, not just data

The repo already warns that ladder *usage data* is not tournament *results*.
The **rules** diverge too, and one source often describes both without saying
which it means.

| | Ranked ladder | Official tournament |
|---|---|---|
| Match length | Best-of-one **[official]** | Swiss may be Bo1 or Bo3; **top cut must be Bo3** **[official]** |
| Team sheets | None **[consensus]** | Open team list, 2026 season **[official]** |
| Team between games | N/A (single game) | Unchanged for the whole competition **[official]** |
| Counter-teaming | Minimal — one game, no read | Real — Bo3 lets an opponent adjust their four |

The Bo3 difference is the one that changes team evaluation. On ladder, a team
gets one game and no chance to be re-read. In Bo3, your opponent sees your
four in game one and re-picks against them — so a team needs a **second
viable four**, not just one strong line. A six that only ever brings the same
four is a ladder team.

## Match structure and clocks

Enforced automatically at Championship Series competitions **[official]**:

| Clock | Limit |
|---|---|
| Team Preview | 90 seconds |
| Move selection | 45 seconds |
| Player time ("Your Time") | 7 minutes |
| Game time | 20 minutes |

There is **no round timer** — matches run their full course of up to three
games. **[official]**

Each player selects four Pokémon and an order; **the first two in that order
lead**, putting four Pokémon on the field at the start. **[official]** Lead
order is part of the Team Preview decision, not a separate step.

## Restricted Pokémon: the structure is evergreen, the list is not

The *structure* holds across every cycle: a regulation set names which
Pokémon are legal, which are restricted, and how many restricted Pokémon a
team may carry. Regulation sets last **one to three months**, and their
contents may be announced up to 30 days before the first legal competition.
**[official]**

The **contents** — this cycle's list and count — live in
`reference/regulation.md` and nowhere else. Never state a banlist from this
file or from recall.

Eligibility is also platform-gated: only Pokémon obtained in Champions,
transferred from Pokémon HOME, or received at an official distribution are
usable. **[official]** That is separate from regulation legality — see
`champions-format.md`'s roster-vs-legality section for why both checks are
required.

## Sources

- Play! Pokémon Video Game Championships Tournament Handbook, revision
  1 September 2026 — §2.1 Battle Team Setup, §2.2 Items, §2.3 Pokémon,
  §2.4 Team Lists, §4.1 Double Battle Format, §4.2 Number of Games,
  §4.3 Match Process, §4.3.1 Game Time Limits.
  https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-vgc-tournament-handbook-en.pdf
- https://victoryroad.pro/champions-regulations/ — clauses, Team Preview
  duration, level rule, open-team-list scope
- https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml —
  ranked ladder team sizes (Doubles 4-6), Bo1, ladder clocks
- https://champdex.com/guides/team-preview — ladder Team Preview contents
  (third-party, uncorroborated by an official source)
- https://community.pokemon.com/en-us/discussion/24588/open-team-sheet-in-champions
  — absence of an in-game OTS option (player report)

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-08 | Created. Evergreen VGC doubles rules previously existed only inside `pitfalls.md`, where they were framed as past mistakes and so were only reachable by recalling the mistake — twice they were stated wrongly in conversation while the correct answer sat in that file. Every rule here re-verified against the Play! Pokémon handbook (rev. 1 Sep 2026) rather than moved across on trust, which upgraded several from recall to quoted-official and exposed one repo error (regulation cadence, corrected in `regulation.md`) | Play! Pokémon VGC Tournament Handbook rev. 2026-09-01; victoryroad.pro; serebii.net; champdex.com |
| 2026-09-08 | Recorded the ladder Team Preview contents that `pitfalls.md` had left explicitly unresolved: third-party consensus is that held items **are** visible on ladder (Mega Stones included) while abilities, moves and spreads are not. Marked **[consensus]**, not promoted to fact — no official source found. This materially narrows what "surprise value" can mean on ladder: the hidden variables are abilities, moves and SP, never which Pokémon or which items | champdex.com/guides/team-preview and corroborating Champions strategy resources; no official confirmation located |
