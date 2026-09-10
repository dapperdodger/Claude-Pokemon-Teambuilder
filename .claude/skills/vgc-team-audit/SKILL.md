---
name: vgc-team-audit
description: Use when the user has an existing team and wants to know what's wrong with it — what it loses to, where its coverage gaps and shared weaknesses are, whether it's legal, or which four to bring against a specific opponent. Not for building a new team (vgc-team-building), not for the narrower move-and-SP pass (vgc-team-refining), and not for triaging a specific game that was just lost — that is vgc-post-game.
---

# VGC Team Audit

## Overview
Three jobs live here that the other team skills deliberately exclude:
**"what does my team lose to"**, **"is this team legal"**, and
**"what four do I bring against this"**. `vgc-team-refining`'s scope fence
rules out critiquing synergy, and `vgc-team-building` is for construction —
so evaluating a team you already have has no other home.

This skill diagnoses. It does not rebuild. Report what you find and let the
user decide what to change; if they want changes made, that's
`vgc-team-building` (roster) or `vgc-team-refining` (moves and spreads).

## Checklist

```
- [ ] 1. Legality pass (run the validator)
- [ ] 2. Regulation currency
- [ ] 3. Defensive profile
- [ ] 4. Offensive coverage
- [ ] 5. Speed and speed control
- [ ] 6. Threat matchups
- [ ] 6b. Counterweights
- [ ] 7. Report
```

**1. Legality pass — run this first, before any analysis.**

```bash
node tools/dex/cli.js team teams/<file>.md
```

Catches duplicate items (hard illegal), SP budget and cap violations,
roster/item/ability legality, and Megas listed with their pre-Mega ability.
Fix-worthy findings here outrank everything else — there is no point
analysing the matchup spread of an illegal team. Move legality **is** checked,
against the vendored learnset table. Read the `notChecked` field: it now
lists only species the learnset vendor does not cover, and those still need a
live check.

**2. Regulation currency.** If the team was built for a past regulation, say
so up front and treat its reasoning as historical. Mechanics, roster and item
pool may all have moved — see `reference/regulations/` for what was true then.

**3. Defensive profile.** For each of the six, get typing from
`node tools/dex/cli.js mon <Species>` (the **Mega** forme if it holds a
stone — the typing can differ, e.g. Mega Staraptor is Fighting/Flying, not
Normal/Flying). Then, for each attacking type, count how many of the six take
super-effective damage:

```bash
node tools/dex/cli.js type <AttackingType> --vs <Def1[,Def2]>
```

A type that hits 3+ of the six for 2x or more is a real shared weakness, not
a quirk. Report the count, not an impression.

Two thresholds from `reference/team-evaluation.md`'s design-constraints
checklist attach here, and **they are different in kind — do not flatten them
into two equally-weighted list items**:
- **No more than 2 Pokémon of the same type.** This is close to a hard rule —
  exceptions are rare and need a stated purpose, because a third Pokémon of a
  shared type usually means a shared weakness got tripled rather than
  covered.
- **Aim for at least one resistance to every type**, as a rule of thumb, not
  a requirement. Some real, strong sixes simply don't clear it, and forcing a
  weaker pick into a slot solely to plug the last uncovered type is its own
  mistake — see the counterweights step below.

**4. Offensive coverage.** What can the team not meaningfully damage? Collect
the actual attacking types across all six movesets and find the defensive
typings that resist or wall the lot. Remember an unused coverage move is not
coverage — check the moves actually listed.

Also check the team-wide distribution, from the same design-constraints
checklist:
- **Offense/support split** — **1-2** support slots, the rest offensive or
  hybrid.
- **Offensive-item count** — **1-3** across the six, fewer when Megas are
  registered (a Mega Stone occupies an item slot without being an "offensive
  item" in this budget's sense).

**5. Speed and speed control.** Compute real Speed stats from the listed SP
spreads (`reference/champions-format.md` has the formula; the damage CLI
reports `rawStats`). Identify where the team sits relative to the current
meta's common speed tiers, and whether it has Tailwind/Trick Room.

**Name the fallback.** `reference/speed-control.md`'s "Backup when the setter
is removed" section has the audit-shaped question: *if this setter is
removed or Taunted on turn 1, what does the team do instead, and does that
still lead somewhere?* A team with exactly one source of speed control and no
answer to that question has a single point of failure — report that as a
**finding**, not an observation.

**6. Threat matchups.** Derive the current threat list with the
**vgc-meta-lookup** skill — never from a previous session's list or from
another `teams/` file. Per-Pokémon usage alone answers "what's individually
common," not "what shows up together" — for a bring-6-pick-4 or "what will I
face" answer, also run `node tools/meta/cli.js cores` for the real 2/3/4-mon
groupings a flat usage list can't show, and `node tools/meta/cli.js teams`
for concrete real builds to test against (surface its straddle warning to
the user if the output carries one). For each top threat, use
**vgc-threat-evaluation**. Run real numbers rather than estimating:

```bash
node tools/damage-calc/cli.js --attacker <Threat> --defender <Yours> --move <Move> --weather <Weather>
```

Pass the *opponent's* weather when they set it. Judge support Pokémon on
whether their action goes off, not on damage taken.

**Bring-6-pick-4.** If the user names a specific opposing team, the question
changes from "is this team good" to "which four". Work it as: which of their
six are the actual win conditions; which two of yours are dead weight in this
matchup; which four cover the win conditions while keeping speed control; and
what the opponent's likely lead is. Name the four *and* the two you're sitting,
with the reason for each.

**6b. Apply the counterweights before writing the report.** This skill
computes type multipliers precisely, and precision is not the same as
importance. From `reference/team-evaluation.md`:
- A weakness nobody in the current meta exploits is not a real finding.
- Resistances do not compensate for bad stats.
- Half of a big number is still a big number — a resisted hit from a real
  threat can still be a 2HKO. Check the roll rather than assuming the
  resistance settles it.
Rank findings by what actually loses games, not by what the type chart
counted.

**7. Report.** Lead with anything illegal, then the biggest real
vulnerability, then the rest. Be specific and quantified — "four of six take
2x from Ground, and the two that don't are both Focus Sash" beats "weak to
Ground". Say plainly what you could not verify.

## Scope fence
- **Diagnose, don't rebuild.** Don't redesign the roster mid-audit.
- **Don't write to `teams/`.** Findings go in the reply. Only save if the user
  explicitly asks (see `.claude/rules/teams.md`).
- Don't relitigate a pick the user has said is fixed — note the consequence
  and move on.

## Common mistakes
- Analysing before running the validator, then reporting on an illegal team
- Reading a Mega's base forme typing instead of the Mega's
- Calling a weakness "shared" without counting how many of the six it hits
- Reusing a threat list from an earlier session instead of re-deriving it
- Treating a listed move as coverage without checking it's actually run
- Reporting every 2x multiplier as a finding without asking whether anything
  in the current meta actually exploits it

## References
- `reference/vgc-format.md` — clauses, Team Preview, OTS scope, Bo1 vs Bo3
- `reference/pitfalls.md` — the trap checklist
- `reference/methodology.md` — matchup reasoning, when damage isn't the lens
- `reference/champions-format.md` — SP/stat formulas, local-data limits
- `reference/regulations/` — what was true when an older team was built
- `reference/team-evaluation.md` — design-constraints thresholds and the
  counterweights that keep them from over-fixating
- `reference/speed-control.md` — the seven forms and the backup-setter
  audit question
