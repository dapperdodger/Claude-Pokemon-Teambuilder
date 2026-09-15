---
name: vgc-threat-evaluation
description: Use when evaluating whether a specific Pokémon, moveset, or team counters, answers, or beats another — before calling something a counter based on typing alone, or when checking a threat's coverage move.
---

# VGC Threat Evaluation

## Overview
Typing alone doesn't make something a counter. The type chart covers only a
Pokémon's own STAB and defensive typing, not the coverage moves its real set
is running. A matchup call needs both — and the typing half is a tool call,
not a recall.

## When to use
- Calling a Pokémon a "counter," "check," or "answer" to something
- Asked "what beats X" or "does X counter Y"
- Reasoning about a threat's coverage before it's confirmed via live data
- Invoked from vgc-team-building or vgc-team-refining whenever a counter
  claim comes up mid-task

## The two checks (both required)

**1. Typing — query it, never recall it.**

```bash
node tools/dex/cli.js type <AttackingType> --vs <Def1[,Def2]>
```

Pass **both** of a dual type's halves in one call; the tool multiplies them
and applies the rule that an immune half zeroes the product. Reasoning from
one half is a documented recurring error, and so is reading the direction
backwards — the tool takes the attacking type first, so the direction is
structural rather than something to keep straight.

For the defender's own typing and stats, and for any Mega:

```bash
node tools/dex/cli.js mon "Mega <Species>"
```

A Mega's `ability` from this tool is its **fixed battle ability**. The
`baseFormeAbility` field is what usage pages report — never cite that as what
it fights with. Some Megas also retype (Mega Staraptor is Fighting/Flying,
not the base Normal/Flying), which changes the matchup independently of the
ability.

**2. Actual moveset — pull it live.**
What coverage is this Pokémon really running in the current meta (Pikalytics
per-mon page)? A Pokémon can be a real answer despite bad on-paper typing via
a coverage move, or a bad answer despite good typing if it isn't running the
relevant move. Non-Mega Pokémon have 2-3 legal abilities — check the real
preset for the set in question, not the dex default.

If `meta mon` reports an ability the species cannot have, the parsed data is
broken — say so and do not cite that split.

## Verify the number, don't hand-calculate

```bash
node tools/damage-calc/cli.js --attacker … --defender … --move … --weather Sun
```

- `--weather` is **case-sensitive and silently no-ops on a mismatch**. Pass
  the exact capitalised string, and pass the *opponent's* weather when they
  are the ones setting it — omitting it has produced 30-50% swings.
- Don't apply a 0.75x spread-move reduction yourself; the CLI already has it.
- For a multi-hit move, `min`/`max` is one hit. Check `isVariableMultiHit`.

## Not every "does X answer Y" is a damage question

A redirector, screens-setter or Trick Room setter is countered by denying its
*action* — Taunt, faster priority, a target it can't legally hit — not by
out-damaging it. A Focus Sash support pick is built to take exactly one hit,
so 150% and 300% are the same outcome for it; the real question is whether
its action goes off. Don't lead with a damage comparison for a support
Pokémon on either side of the matchup.

## What beats X

"What beats X", "what answers X", and "what do I bring into X" are candidate
questions, not type-chart questions. Popular answers are welcome as options;
none of them skips the checks.

**1. Pull X's real set.** `node tools/meta/cli.js mon "<X>"` for its moves and
item, and `node tools/dex/cli.js mon "<X>"` for typing and Speed. Note
anything that changes the matchup: priority, a berry that halves a
super-effective hit, setup. For a Mega threat the two tools want opposite
names — `meta mon "X-Mega"`, `dex mon "Mega X"` (see CLAUDE.md's naming note).

**2. Generate options from the tools, not from recall.**

```bash
node tools/dex/cli.js find --resists <X's STAB type> --resists <X's other STAB type>
node tools/dex/cli.js find --resists <X's STAB type> --learns "<a move that hits X hard>"
```

`--resists` reads the type chart only — a Pokémon that is immune or resistant
through its ability or held item will not appear, so look for those answers
separately and add them as rows.

Add meta suggestions as extra rows; they get the same checks.

**3. Put every option on a decision card**, with usage ranks from
`node tools/meta/cli.js rank "<Option A>" "<Option B>" ...`:

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

**4. Back Q1 with calcs both ways**, passing X's real item and any weather:
does the option survive X's best hit into it, and does the option's attack
threaten X through that item? A resisted STAB is not an answer until the calc
says the option lives, and a super-effective hit is not an answer until the
calc says it lands through the berry.

## Common mistakes
- Answering a type matchup from recall because it "feels obvious" — that
  feeling is the failure mode; every logged instance felt obvious
- Reasoning from one half of a dual type
- Citing a Mega's pre-Mega ability from a usage-percentage split
- Treating co-occurrence stats as proof a coverage move is being run
- Skipping the weather flag when the *opponent* sets the weather
- Answering "what beats X" from the type chart or from what is popular, with no
  `find` run and no calc in both directions
- Ignoring X's item — a super-effective-reducing berry turns a clean KO into a
  survived hit

## References
- `reference/methodology.md` — the reasoning process, live-lookup detail
- `reference/pitfalls.md` — the trap checklist
- `reference/mechanics.md` — priority, speed modifiers, item mechanics
- `docs/case-studies.md` — the incidents these rules came from
- `reference/decision-card.md` — the card every "what beats X" option goes on
