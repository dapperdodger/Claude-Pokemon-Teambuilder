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
- [Two Megas on a six is standard practice — do not flag it](#two-megas-on-a-six-is-standard-practice--do-not-flag-it)
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
- **[consensus]** — multiple **independent** third-party sources agree, no
  official confirmation found. Usable, but say "as far as I can confirm"
  when it is load-bearing for a decision.
- **[unresolved]** — genuinely not settled. Say so rather than picking a side.

**Every promotion needs new evidence, not repetition.** [consensus] →
[official] requires an actual official source. [unresolved] → [consensus]
requires sources that are genuinely independent — so **count them, and check
whether the later ones are quoting the first**. A search summary derived from
a page you already read is that page again, not a second source. This rule
exists because ladder item visibility was promoted to [consensus] on one
guide echoed by its own search summaries, and had to be reverted the same day.

An **[unresolved]** entry is a finished answer, not a gap to fill with the
most plausible option. Being wrong in one direction is not a reason to lean
the other way — the ladder/tournament entries below have now erred in both.

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
- ❌ "Swap this move in against Trick Room teams."

Note what is *not* on that list: registering two Mega Stones and choosing
which Mega to bring per matchup. That is a bring-4 decision, which is exactly
the thing the format does let you flex — see the next section.

A choice between two items is a **permanent trade-off** — which threat is more
likely and more costly across the whole field — and must be presented that
way. Bring-6-pick-4 flexibility is real and worth building around; it just
operates on *Pokémon*, never on their contents.

## Two Megas on a six is standard practice — do not flag it

**Only one Pokémon may Mega Evolve per battle**, team-wide, no matter how many
Mega Stones the six carry; if the Mega faints, no second one may evolve.
**[consensus]** — universally reported across Champions resources and
described as an official clause, though it is enforced in-game rather than by
the tournament handbook, which does not mention Mega Evolution at all.

**That limit is a reason to build two Megas, not a reason not to.** Different
stones are different items, so the Item Clause is satisfied; you register
both and choose which to bring in Team Preview. It is one of the few genuine
per-matchup levers the format offers, and the field uses it heavily.

Pikalytics M-B S3 tournament team usage, top six archetypes by team count —
**four of the six register two Megas**, about 66% weighted by team count:

| Archetype (abbreviated) | Megas registered | Teams | Win rate |
|---|---|---|---|
| Tyranitar-Mega / Staraptor-Mega / Excadrill / Milotic / Sinistcha / Gholdengo | 2 | 572 | 52.77% |
| Garchomp / Kingambit / Whimsicott / Basculegion / Floette-E / Charizard-Mega-Y | 1 | 381 | 57.46% |
| Charizard-Mega-Y / Grimmsnarl / Pelipper / Archaludon / Basculegion / Venusaur | 1 | 377 | 48.64% |
| Aerodactyl-Mega / Charizard-Mega-Y / Farigiraf / Kingambit / Sylveon / Garchomp | 2 | 353 | 50.69% |
| Staraptor-Mega / Delphox-Mega / Garchomp / Whimsicott / Glimmora / Kingambit | 2 | 288 | 53.37% |
| Blastoise-Mega / Delphox-Mega / Sneasler / Kingambit / Incineroar / Sinistcha | 2 | 253 | 53.72% |

The *Common Team Cores* data adds the nuance: two Megas rarely appear together
in the recurring 2- and 3-Pokémon cores. That is consistent rather than
contradictory — the second Mega is typically the **flex slot**, not part of
the core, which is precisely how a bring-4 lever is supposed to look.

**So treat it as an option with trade-offs, the way you would any other slot.**
The honest cost is that the unbrought Mega's base forme is usually much
weaker, so the slot only pays off in the games where you bring it. Whether the
stone itself is visible at Team Preview is **unresolved on ladder** and
certain under tournament OTS — so how much surprise the second stone buys
depends on the venue. Say that once if it is relevant to the specific build,
then move on. Do **not** present the one-Mega-per-battle
limit as though it breaks a two-Mega plan — it is the ordinary condition
every team in the table above is built under.

## What the opponent knows before the first move

This is the table that decides whether any "surprise factor" argument holds.

| Information | Ranked ladder | Tournament (Open Team Sheets) |
|---|---|---|
| All six species (and forms) | Visible **[official]** | Visible **[official]** |
| **Held items, incl. Mega Stones** | **[unresolved]** — see below | Visible **[official]** |
| Abilities | **Hidden** **[consensus]** | Visible **[official]** |
| Moves | **Hidden** **[consensus]** | Visible **[official]** |
| Stat Alignment (nature) | **Hidden** **[consensus]** | Visible **[official]** |
| Stat Point spread / final stats | **Hidden** | **Hidden** **[official]** |

Two things are settled and worth carrying into every conversation:

1. **The six species are always public, in both venues.** Any plan whose
   value comes from the opponent not knowing *what you brought* is worth
   nothing anywhere.
2. **SP spreads are private everywhere**, including under Open Team Sheets.
   An unexpected bulk or Speed investment is the one genuinely hidden
   variable that survives into official tournament play.

### Ladder item visibility is unresolved — don't assert it either way

**Do not state that held items are visible on the ladder.** This file briefly
did, marked **[consensus]**, and that marking was wrong:

- The evidence was **one** third-party strategy guide plus search summaries
  derived from that same guide — repetition, not independent agreement. The
  confidence rules at the top of this file exist to prevent exactly that.
- **That guide is scope-ambiguous in the specific way this repo keeps getting
  burned by.** Its Team Preview page also says open team lists mean you see
  the whole six — i.e. parts of it describe the *tournament* OTS context, so
  its item-visibility line may never have been about ladder at all. That is
  the third instance of the same scope-drop.
- Serebii's Ranked Battle pages describe ranks, regulations and clocks but
  say nothing about Team Preview contents. No official source found.
- **The user, who plays the ladder, reports items are not visible** — better
  evidence than a fan guide, though stated as belief rather than certainty.
- The structural argument points the same way: Open Team Sheets exist as a
  tournament convention *because* the game does not reveal items and moves.
  If ladder Team Preview showed items, OTS would be largely redundant on that
  axis.

So: treat it as genuinely open. When it is load-bearing — pricing the surprise
value of a tech item, or whether a second Mega Stone telegraphs anything — say
it is unresolved and ask, rather than picking the convenient side. Settling it
needs an official rules source or a direct in-game observation, not another
strategy site.

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
| 2026-09-08 | Added the two-Megas section and removed a bullet added earlier the same day that wrongly listed "carry both Mega Stones and pick whichever Mega the matchup wants" alongside genuinely impossible advice like per-matchup item flexing. The two are opposites: item flexing is not permitted, while choosing which Mega to bring is a bring-4 decision and one of the format's few real per-matchup levers. Recorded the one-Mega-per-battle limit as the ordinary condition such teams are built under, with M-B usage showing four of the top six archetypes registering two | User correction; Pikalytics M-B S3 `/team-usage` and `/pokedex` Common Team Cores, format label verified; one-per-battle rule corroborated across Champions resources, absent from the Play! Pokemon handbook (in-game mechanic, not a tournament clause) |
| 2026-09-08 | Reverted ladder held-item visibility from **[consensus]** back to **[unresolved]**, and replaced the table row with an explicit "don't assert it either way" section. The [consensus] marking rested on one third-party guide echoed by search summaries, and that guide mixes ladder and tournament-OTS description on the same page. User reports items are not visible on ladder; the structural argument agrees, since OTS exists as a tournament convention precisely because the game does not reveal items and moves. Also softened the two-Megas section, which had asserted the stone is visible "in either venue" | User correction; champdex.com/guides/team-preview re-read, serebii.net Champions ranked-battle and preview pages (silent on Team Preview contents), no official source located |
