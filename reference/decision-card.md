# Decision cards

**Usage can suggest a pick; it never justifies one.** Every species, move, or
threat answer — however popular — gets a decision card shown in chat before
the choice goes to the user.

This file is the full guidance. The skeleton below is copied byte-for-byte into
`vgc-team-building`, `vgc-team-refining` and `vgc-threat-evaluation`, and
`.claude/skills/tests/decision-card.test.js` fails if any copy drifts. Edit it
here and in all three skills in the same commit.

Why it exists: `docs/case-studies.md`, "A Mega Froslass build that verified
every fact and evaluated no pick" — and the design,
`docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`.

## Contents

- [The skeleton](#the-skeleton)
- [Which decisions get a card](#which-decisions-get-a-card)
- [Filling each field](#filling-each-field)
- [Worked example: a move card](#worked-example-a-move-card)
- [What a card is not](#what-a-card-is-not)
- [Changelog](#changelog)

## The skeleton

<!-- card-skeleton:start -->
**Decision card** — required before any species, move, or threat-answer choice
goes to the user. Full guidance: `reference/decision-card.md`.

1. **Decision** — what is being chosen.
2. **Role** — the job (`reference/roles.md`). On a centrepiece build, also what
   it does for the centrepiece's strengths, not only which weakness it covers.
3. **Gap is real** — current meta evidence the job matters
   (`reference/team-evaluation.md`, Meta awareness), or "no current threat found".
4. **Options from** — the exact `dex find` command (always, for species and
   threat answers) plus any meta source used. For moves: learnset + role template.
5. **Options table** — per option: usage rank (`meta rank`); source (find / meta /
   user); Q1 real matchups, with a calc wherever a counter is claimed; Q2 stats,
   moves, ability, tool-verified; Q3 role fit; Q4 is there a better legal option
   for this role. Moves also: base power and category.
6. **Recommendation** — the reason cites fields 2-5. Usage rank and co-occurrence
   are context, never the reason. If every option is top-10 usage, say so.
7. **Not verified** — anything claimed without a tool call this session.
<!-- card-skeleton:end -->

## Which decisions get a card

| Decision | Card | Options |
|---|---|---|
| A species, in any skill | Full card | 3-5 |
| A move — chosen, swapped, or flagged | Full card | The chosen move plus the alternatives its role template allows |
| An answer to "what beats X" | Full card | 3-5 |
| An item or ability | One line tying it to the role | — |
| An SP spread | No card — `reference/methodology.md`'s solve-for-the-minimum method | — |

The card goes **in the reply, immediately before the question** that asks the
user to choose. A card written after the choice, or only for the option that
was picked, is not a card.

## Filling each field

1. **Decision.** One line naming the slot, the move slot, or the threat —
   "slot 3", "Incineroar's 4th move", "answer to Kingambit".
2. **Role.** A job, not a label: "resists the Ground moves that kill the
   core", "sets speed control the core lacks". Name the `reference/roles.md`
   template it uses. On a build that started from a specific Pokémon, also
   say what this option does for the strengths written down at
   `vgc-team-building` step 1.
3. **Gap is real.** Evidence from this session's meta pull that the job
   matters now: a named threat and its usage, or a named archetype from
   `meta teams`. "No current threat found" is a valid answer and must be
   written out — it is `reference/team-evaluation.md`'s "a weakness nobody
   exploits is not a weakness", and it may end the decision there.
4. **Options from.** Paste the exact command. For species and threat answers
   `node tools/dex/cli.js find ...` always runs, even when a meta suggestion
   already looks strong; `--resists`, `--learns`, `--type` and stat bounds
   turn the role into a query (`--resists` is type-chart only: add ability- or
   item-based answers by hand). Meta suggestions (`meta mon` teammates,
   `meta usage`, `meta teams`) are welcome as extra rows — name the command
   they came from. For a move: the learnable moves that fit the role template
   (`dex learnset`).
5. **Options table.** One row per option:
   - **Usage** — species: `node tools/meta/cli.js rank "<A>" "<B>" ...` in one
     call; a Mega reports its base species' row. Move: its share on real sets
     from `meta mon`'s `moves` list.
   - **Source** — `find`, `meta`, `user`, or `find + meta`; for a move,
     `learnset` (or `learnset + meta`).
   - **Q1 real matchups** — against named threats from field 3. Any claim that
     it beats or survives something carries a `tools/damage-calc/cli.js` roll,
     with the opponent's real item and weather passed.
   - **Q2 stats, moves, ability** — from `dex mon`, `dex learnset`, `dex move`.
     A Mega's ability from `dex mon "Mega <Species>"`, never a usage split.
   - **Q3 role fit** — does it do the field-2 job; for a move, the template slot
     and the ≥80 BP floor or its stated non-damage job.
   - **Q4 better legal option** — does another row, or another `find` result
     not shown, do this exact job better? Say which, or "no".
6. **Recommendation.** Name the pick and the fields that decided it. If
   `meta rank` printed an `anchoring.message`, repeat it. A recommendation
   whose only reason is usage rank, win rate, or a teammate percentage is
   invalid.
7. **Not verified.** List every claim on the card that has no tool call behind
   it this session. An empty list is a claim too — only write "none" if it is
   true.

## Worked example: a move card

*(as of 2026-09 — confirm with meta usage; numbers below were recorded from the
commands listed on 2026-09-14)*

1. **Decision** — Incineroar's 4th move, with Fake Out, Parting Shot and Flare
   Blitz already set.
2. **Role** — defensive pivot: Fake Out and Parting Shot buy turns for a
   faster partner. `reference/roles.md` Defensive template (Support / Support /
   STAB / Support-Protect), so slot 4 is Support or Protect by default; a
   second attack is a deviation that needs a reason.
3. **Gap is real** — Incineroar is #3 by usage in M-C, so it is on the
   field often enough that its fourth slot gets clicked; the job (surviving to
   pivot again) is live in every game it is brought.
4. **Options from** — `node tools/dex/cli.js learnset "Incineroar" --move
   "<Move>"` for each row; suggestions from
   `node tools/meta/cli.js mon "Incineroar"`.
5. **Options table**

| Option | Share on real sets | Source | BP / category | Q1 | Q2 learnset | Q3 role fit | Q4 |
|---|---|---|---|---|---|---|---|
| Throat Chop | 13.755% | meta | 80 / Physical | Second Dark attack; blocks sound moves for two turns | legal | Deviation from Defensive template — needs a reason | Overlaps Darkest Lariat's type |
| Darkest Lariat | 15.438% | meta | 85 / Physical | Second Dark attack; ignores the target's stat boosts | legal | Deviation from Defensive template — needs a reason | Overlaps Throat Chop's type |
| Will-O-Wisp | 2.351% | learnset | — / Status | Burn halves a physical attacker's damage while it stays burned | legal | Fits slot 4 (Support) | No — Helping Hand, the other Support option, only pays off on turns the partner attacks |
| Helping Hand | 1.017% | learnset | — / Status | Boosts the partner's attack that turn | legal | Fits slot 4 (Support) | Only pays off on turns the partner attacks; does nothing on its own, unlike Will-O-Wisp |

6. **Recommendation** — Will-O-Wisp: it fills the template's Support slot
   (field 5, Q3), and its effect outlasts the turn it is used on, which a
   defensive pivot that switches in repeatedly is built to exploit (field 2).
   Throat Chop and Darkest Lariat are the most-run options, but a second Dark
   attack is a template deviation with no reason stated for this team — their
   share is context, not a reason.
7. **Not verified** — Throat Chop's sound-blocking duration is stated from a
   move description, not from a repo tool; Will-O-Wisp's damage halving is not
   measured by `tools/damage-calc` in this example.

## What a card is not

- **Not a score.** It records the rubric answers; judgement still decides.
  `reference/team-evaluation.md`'s counterweights apply to every field.
- **Not a ban on meta picks.** Meta Pokémon are often right. A card whose
  recommendation is the top-usage option is fine when fields 2-5 carry it.
- **Not enforced by a hook.** It is enforced by being visible to the user, by
  the skill-text test (which catches deletion, not skipping), and by
  `docs/regression-scenarios.md`. A blocking hook is the recorded escalation if
  cards are skipped anyway.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-14 | Created. The rule "usage can suggest a pick; it never justifies one", the seven-field card skeleton (copied byte-for-byte into `vgc-team-building`, `vgc-team-refining`, `vgc-threat-evaluation` and enforced by `.claude/skills/tests/decision-card.test.js`), which decisions get a card, field-by-field guidance, and a worked move-card example for Incineroar's 4th move recorded from `meta mon`, `dex learnset` and `dex move` output this session. | `docs/superpowers/specs/2026-09-14-binding-evaluation-design.md`; commands listed in the worked example |
