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

This is a design sequence, not just a verification pass — it starts from
*what to build* and only later checks whether each piece is legal and sound.
Copy this checklist and work it in order:

```
- [ ]  1. Starting point — strategy, specific Pokémon/core, or existing team
- [ ]  2. Regulation check + live meta scan
- [ ]  3. Speed-control plan
- [ ]  4. Archetype, and what that archetype requires
- [ ]  5. Per slot: declare the role, then 3-5 verified candidates, user picks
- [ ]  6. Moveset from the role template
- [ ]  7. Team-level gates: coverage, item spread, offense/support distribution
- [ ]  8. SP spreads — solve for the minimum
- [ ]  9. Pitfalls gate + validator
- [ ] 10. Ask before saving
```

**1. Establish the starting point.** A build begins from one of three places,
and each implies a different first question — read `reference/archetypes.md`'s
"Three starting points" section before doing anything else:

- **A strategy** (Trick Room, a weather, Tailwind) — what does it *require*,
  and can the roster supply it?
- **A specific Pokémon or core** — what does this piece do well, and where
  does it struggle?
- **An existing team** — why does it work, and which parts are load-bearing?

Get this right before the first exchange. Asking "what does this piece
struggle against" of someone who came in with a strategy, or "what does this
strategy require" of someone who came in with a favourite, wastes the
opening. **An existing team is a legitimate starting point to revise, not a
contract** — but `teams/` itself is read-only unless the user explicitly says
to write (full rule at step 10).

**2. Regulation check, fresh this session, then a live meta scan.**
`reference/regulation.md`, even if it was already read earlier in this
conversation. Roster availability and regulation legality are separate
checks — for Pokémon, items and abilities alike. Verify item legality with
`node tools/dex/cli.js legal --item "<Item>"`. Then pull the live meta with
the **vgc-meta-lookup** skill — all three Pikalytics surfaces, not per-mon
usage rank. A flat top-20 list has missed whole archetypes (Sun, rain)
before.

**3. Speed-control plan, before the archetype is locked in.** Read
`reference/speed-control.md`. Speed control is ranked ahead of the archetype
question because a dead Pokémon has no counterplay and moving first cuts out
an entire category of bad-luck outcomes — but it is *often* the most
important axis, not a mandatory centrepiece: a Good Stuff team still needs an
answer, just not necessarily a slot dedicated to owning it. Name three
things before moving on:

- **The form** — priority, paralysis, a Speed-lowering move, a Speed-boosting
  ability or item, Tailwind, Trick Room, or raw Speed (`reference/
  speed-control.md`'s "The seven forms").
- **The Pokémon providing it.**
- **The fallback if that Pokémon is removed** — a second setter, setup
  support that buys a second attempt, or a plan that does not depend on the
  field effect at all. A team with exactly one source of speed control and no
  answer to "it's Taunted or KO'd on turn 1" has a single point of failure,
  not a finished plan.

**4. Agree the archetype — now backed by what it actually requires.** Read
`reference/archetypes.md`'s "The four archetypes" section before checking in
with the user, not after: Tailwind, Trick Room, Good Stuff/Balance, and
Weather each have a stated setter count, a required supporting cast, and a
documented way they fail. Two things to surface explicitly rather than
assume:

- **Maximise average matchups, or guarantee a floor?** The source's own
  split — these pull in different directions, and the choice belongs to the
  user, not to the assistant. Whether the venue is ladder (Bo1, rewards the
  average) or tournament top cut (Bo3, punishes a hole) is a real input to
  that choice.
- **If the archetype is Weather, the whole-team rule is non-negotiable**: not
  every member may depend on the weather being up, or one opposing setter
  switching in turns the whole team off at once.

Don't disappear and return with a finished six — this is a checkpoint, not a
formality.

**5. Per slot: declare the role, then generate 3-5 verified candidates, user
picks.** Two decisions, in order, per open slot:

- **Declare the role first** — offensive, defensive/support, or a specific
  job ("resists the Ground moves that kill the core", "supplies the speed
  control the core lacks"). `reference/roles.md`'s "Role before moveset
  before spread" section owns this ordering. A slot filled by picking a
  Pokémon that "looks good" with no stated role is a slot nobody has actually
  decided.
- **Generate the candidate list with `find`; do not recall it.** This is the
  standing rule and it changes real behaviour: until now the facts about a
  candidate were verified while the candidate *list itself* came from model
  recall — the exact failure this repo exists to prevent. `dex find` closes
  it:

  ```bash
  node tools/dex/cli.js find --type <Type> --learns "<Move>" --min-spe <N>
  ```

  Note `--min-spe`, never `--min-sp` — `SP` means Stat Points in this repo,
  and the CLI rejects `sp` deliberately. **If a `--learns` query returns a
  `STALE LEARNSET PIN` caveat, say so to the user before presenting the
  candidates** — the list may include species whose move pools the current
  regulation has since cut.

Then verify every name `find` returns before presenting it:

- **Roster and legality.** `node tools/dex/cli.js mon "<Species>"` for stats
  and ability, `legal --item` / `legal --ability` for anything under
  consideration. Most non-Mega Pokémon carry 2-3 legal abilities — check the
  real preset for the role being built, not the one ability the dex surfaces
  first.
- **The role-defining move's learnset**, before building a plan around it.
  `node tools/dex/cli.js learnset "<Species>" --move "<Move>"` for a
  sweeper's boosting move, a support's Tailwind/Trick Room, or a coverage
  answer. `illegal` is a hard stop. `unknown` means the species is not in the
  vendored table — verify live, and do not read it as permission. A whole
  team premise has been built on an unlearnable move before.
- **Every counter claim**, with the **vgc-threat-evaluation** skill. Type
  matchups from `node tools/dex/cli.js type <Type> --vs <A[,B]>` for one
  matchup or `type --vs-mon "<Species>"` for the candidate's whole defensive
  profile, and any Mega's ability/typing from
  `node tools/dex/cli.js mon "Mega <Species>"` — never from recall or a
  usage-percentage split, which reports the pre-Mega selection.
- **`reference/team-evaluation.md`'s "Is this Pokémon good?" rubric** —
  matchups, stats/moves/ability, the role it's filling, and whether a better
  legal Pokémon exists for that exact job. Run it against every candidate,
  not just the one that ends up picked.

**Present 3-5 real candidates with their trade-offs and let the user
choose.** Researching one option and presenting it as the answer is the
documented failure here, whether the slot came from a strategy gap or from
building around a favourite.

**6. Moveset from the role template.** `reference/roles.md`'s two starting
shapes:

| Role | Slot 1 | Slot 2 | Slot 3 | Slot 4 |
|---|---|---|---|---|
| Offensive | STAB | STAB | Coverage / setup / support | Protect |
| Defensive | Support | Support | STAB | Support / Protect |

These are starting shapes, not laws — a deviation is fine with a stated
reason; a set that deviates with no reason is a set nobody actually decided.
Two checkable gates on top of the template:

- **The base-power floor.** An attacking move should be **≥80 base power,
  preferably ≥90** (`node tools/dex/cli.js move "<Move>"`). A move below that
  line needs a specific, stated non-damage job — priority, a guaranteed
  secondary effect, speed control, status, redirection — or it's a moveset
  gap, not a stylistic choice.
- **Verify the learnset for every move actually chosen**, the same call as
  step 5: `node tools/dex/cli.js learnset "<Species>" --move "<Move>"`. Step 5
  checked the move that defined the pick; this step checks the rest of the
  set before it's finalised.

Coverage does not need to be super-effective everywhere — a strong attacker's
neutral hit still removes things — but check what it needs to answer against
the *current* meta (`vgc-meta-lookup`), and check a coverage move's damage
category (physical/special) alongside its type, not just its type alone.

**7. Team-level gates: coverage, item spread, offense/support distribution.**
Apply `reference/team-evaluation.md`'s Design-constraints checklist to the
six as a whole:

```markdown
- [ ] No more than 2 Pokémon of the same type. Exceptions are rare and need a stated purpose.
- [ ] At least one resistance to every type — a rule of thumb, not a requirement. More than one against common threats.
- [ ] 1-2 support slots; the rest offensive or hybrid.
- [ ] 1-3 offensive items, fewer when Megas are in the format.
- [ ] Speed control present, and a fallback if its setter is removed.
```

**Then apply that file's counterweights — the checklist is a prompt, not a
scoring system.** A shared weakness nobody in the current meta actually
exploits is not a real finding (`vgc-meta-lookup` before flagging it); the
best defence is often a strong offence rather than more coverage; resistances
don't compensate for bad stats; and half of a big number can still knock a
Pokémon out. Run the checklist, then ask whether each flagged item is a real
problem against what the team will actually face — don't stop at the
checklist itself.

**8. Solve the numbers for SP, don't hand-calculate.**
- `tools/damage-calc/cli.js` for rolls and speed breakpoints
- `tools/damage-calc/optimize-bulk-cli.js` for HP/Def/SpD minimums
- Solve for the **minimum SP** each stat needs. Verifying that 32 survives a
  hit is *not* the same as finding the minimum that survives it — that
  substitution is exactly how a full six came out 32/32/2 once before.
- **Damage % is the right lens only for an attacker.** For a
  redirect/screens/speed-control/status pick, judge whether its action
  reliably happens (priority order, Focus Sash's one-hit-from-full guarantee,
  double-targeting risk), not how much punishment it absorbs.

**9. Pitfalls gate before finalising.** Run `reference/pitfalls.md`'s Quick
checklist for the judgement-shaped traps (assuming Tera is active, assuming a
"generic" spread/ability/item, ladder usage ≠ tournament results). Everything
mechanically checkable is now a command instead — once the six exist in a
file, run:

```bash
node tools/dex/cli.js team teams/<file>.md
```

That catches duplicate items (hard illegal), SP budget and cap violations,
roster/item/ability legality, and any Mega listed with its pre-Mega ability.
It exits non-zero on an error. It does **not** check move legality.

**10. Ask before saving.** **Do not `Write` or `Edit` anything in `teams/`
until the user explicitly says to save it.** A fully discussed loadout is not
permission to persist it. When they do say so, use `teams/_TEMPLATE.md` —
reasoning per pick, intentional exclusions, bring-6-pick-4 notes.

**Revising an existing team: the six species decide.** Same six — edit in
place, changelog row per change recording the old value. Any species swapped,
or ported to a new regulation — new file `<original-basename>-v2.md` with a
`**Supersedes:**` stamp, predecessor untouched. Ambiguous — ask first. See
`.claude/rules/teams.md`.

## Common mistakes
- Writing to `teams/` because a loadout felt finished — wait to be told
- Presenting one researched candidate for a gap instead of a comparison
- Building around a move the Pokémon cannot learn — run `dex learnset`; treat
  an `unknown` verdict as "go verify", not as a pass
- Treating an empty Pikalytics "Best Moves" panel as a low-usage signal — it's
  a rendering artifact; check the curated Champions Teams section
- Forgetting the opponent's weather when it's their side setting it
- Judging a support pick by % HP lost, the way an attacker is judged
- Skipping straight to picks without a speed-control plan
- Presenting a candidate list generated from recall instead of `dex find`
- Choosing a moveset before the role is named
- Treating `team-evaluation.md`'s checklist as a score rather than a prompt

## References
- `reference/archetypes.md` — the three starting points and the four
  archetypes with their requirements and failure modes; read at the
  starting-point step and the archetype step
- `reference/speed-control.md` — the seven forms of speed control, how they
  compose or conflict, and the backup-when-the-setter-is-removed question;
  read at the speed-control step
- `reference/roles.md` — role-before-moveset-before-spread, the two moveset
  templates, and the base-power floor; read at the role and moveset steps
- `reference/team-evaluation.md` — the "is this Pokémon good" rubric and the
  team-level design-constraints checklist plus its counterweights; read at
  the per-slot candidate step and the team-level gates step
- `reference/methodology.md` — full methodology and citations
- `reference/vgc-format.md` — clauses, Team Preview, OTS scope, Bo1 vs Bo3
- `reference/pitfalls.md` — the trap checklist
- `reference/regulation.md` — regulation authority
- `reference/damage-calc.md` — CLI usage and caveats
- `docs/case-studies.md` — the incidents these rules came from
