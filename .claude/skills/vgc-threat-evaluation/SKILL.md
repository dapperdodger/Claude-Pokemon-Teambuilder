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

## Common mistakes
- Answering a type matchup from recall because it "feels obvious" — that
  feeling is the failure mode; every logged instance felt obvious
- Reasoning from one half of a dual type
- Citing a Mega's pre-Mega ability from a usage-percentage split
- Treating co-occurrence stats as proof a coverage move is being run
- Skipping the weather flag when the *opponent* sets the weather

## References
- `reference/methodology.md` — the reasoning process, live-lookup detail
- `reference/pitfalls.md` — the trap checklist
- `reference/mechanics.md` — priority, speed modifiers, item mechanics
- `docs/case-studies.md` — the incidents these rules came from
