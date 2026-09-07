---
name: vgc-team-building
description: Use when building a new VGC doubles team from scratch, extending a partial team, or building a team around a specific favorite Pokémon. Not for optimizing an already-mostly-decided roster — see vgc-team-refining for that narrower job.
---

# VGC Team Building

## Overview
Pokémon Champions VGC doubles — not Smogon singles, and Champions uses Stat
Points, not EVs. Two goals apply, not one: ladder/tournament prep **and**
building a strong team around a user-named favourite. Never answer the second
with the top-usage squad.

This is a **collaborative** job. Research legwork needs no permission;
locking things in does.

## Process

Copy this checklist and work it in order:

```
- [ ] 1. Regulation check, fresh this session
- [ ] 2. Live meta scan (vgc-meta-lookup)
- [ ] 3. Agree the archetype with the user
- [ ] 4. Fill slots — 3-5 candidates per gap, user picks
- [ ] 5. Verify every counter claim (vgc-threat-evaluation)
- [ ] 6. Solve SP spreads for the minimum, via the CLIs
- [ ] 7. Pitfalls gate
- [ ] 8. Ask before saving
```

**1. Regulation check, fresh this session.** `reference/regulation.md`, even
if it was already read earlier in this conversation. Roster availability and
regulation legality are separate checks — for Pokémon, items and abilities
alike. Verify item legality with `node tools/dex/cli.js legal --item "<Item>"`.

**2. Live meta scan.** Use the **vgc-meta-lookup** skill — all three
Pikalytics surfaces, not per-mon usage rank. A flat top-20 list has missed
whole archetypes (Sun, rain) before.

**3. Agree the archetype before building on it.** Check in on the strategic
direction and any genuine judgment-call pick. Don't disappear and return with
a finished six.

**4. Filling a specific hole is its own decision point.** When the task is "we
need something that does X" for one slot — a type weakness, missing speed
control, no answer to a named threat — **present 3-5 real candidates with
their trade-offs and let the user choose.** Verify each first (roster and
legality, real current moveset) so the comparison is grounded. Researching one
option and presenting it as the answer is the documented failure here.

**5. Verify every counter claim** with the **vgc-threat-evaluation** skill.
Type matchups come from `node tools/dex/cli.js type <Type> --vs <A[,B]>`, and
any Mega's ability and typing from `node tools/dex/cli.js mon "Mega <Species>"`
— never from recall or a usage-percentage split.

**6. Solve the numbers, don't hand-calculate.**
- `tools/damage-calc/cli.js` for rolls and speed breakpoints
- `tools/damage-calc/optimize-bulk-cli.js` for HP/Def/SpD minimums
- Solve for the **minimum SP** each stat needs. Verifying that 32 survives a
  hit is *not* the same as finding the minimum that survives it — that
  substitution is exactly how a full six came out 32/32/2 once before.
- **Damage % is the right lens only for an attacker.** For a
  redirect/screens/speed-control/status pick, judge whether its action
  reliably happens (priority order, Focus Sash's one-hit-from-full guarantee,
  double-targeting risk), not how much punishment it absorbs.

**7. Pitfalls gate before finalising.** Run `reference/pitfalls.md`'s Quick
checklist. The recurring misses: duplicate items across the six (hard
illegal), assuming Tera is active, assuming a "generic" spread/ability/item
without checking the real preset, ladder usage ≠ tournament results.

**8. Ask before saving.** **Do not `Write` or `Edit` anything in `teams/`
until the user explicitly says to save it.** A fully discussed loadout is not
permission to persist it. When they do say so, use `teams/_TEMPLATE.md` —
reasoning per pick, intentional exclusions, bring-6-pick-4 notes — and update
an existing file in place with a changelog row rather than creating a new one
per iteration.

## Common mistakes
- Writing to `teams/` because a loadout felt finished — wait to be told
- Presenting one researched candidate for a gap instead of a comparison
- Building around a move or ability the Pokémon doesn't actually have this
  game (verify the learnset before committing to a role)
- Treating an empty Pikalytics "Best Moves" panel as a low-usage signal — it's
  a rendering artifact; check the curated Champions Teams section
- Forgetting the opponent's weather when it's their side setting it
- Judging a support pick by % HP lost, the way an attacker is judged

## References
- `reference/methodology.md` — full methodology and citations
- `reference/pitfalls.md` — the trap checklist
- `reference/regulation.md` — regulation authority
- `reference/damage-calc.md` — CLI usage and caveats
- `docs/case-studies.md` — the incidents these rules came from
