# Team evaluation: is this Pokémon good, and does the team fit together?

**The rubric for a single candidate, and the thresholds for the six as a
whole.** Read at `vgc-team-building`'s per-slot candidate step (filling a
slot with 3-5 candidates) — this file supplies the rubric each candidate
gets run through before they're compared — and by `vgc-team-audit`, which
judges an existing six directly against this file's [Design
constraints](#design-constraints)
checklist. This is the fourth and last of the strategy-layer files this body
of work adds; the other three (`reference/archetypes.md`,
`reference/speed-control.md`, `reference/roles.md`) answer "what to build"
and "what a slot is for" — this one answers "is the thing I'm about to put in
that slot actually good, on its own terms and against this team."

Built on `reference/sources/teambuilding-notes.md`'s "Other Rules" → "Use
'Good' Pokémon" section and `reference/sources/teambuilding-notes-advanced.md`'s
"Inherent Strength vs Relative Strength", "Types", "Defensive Coverage",
"Offensive Capabilities Distribution", "Format Specific Teambuilding",
"Relative Strength" and "Stats/Damage Calculation re:Teambuilding" sections —
near-verbatim notes from masterclass videos by a Pokémon world champion,
vendored 2026-09-08 as a frozen audit trail. Those files are generic VGC;
this one is localised to Champions. **Do not edit the source files.** If this
file turns out to be wrong, diff it against them.

**This file holds judgement and organisation, not facts a tool can settle —
with one deliberate exception.** Type matchups and species/item/ability
legality still come from `tools/dex/cli.js` at the moment they are stated.
The one thing this file explicitly does **not** do is restate the SP-spread
optimisation procedure: the source's "Stats/Damage Calculation
re:Teambuilding" section overlaps `reference/methodology.md`'s much longer
["SP spread allocation"](methodology.md#sp-spread-allocation-solve-for-the-breakpoint-dont-default-to-32322)
section almost entirely, and only the judgement half of it belongs here — see
[The counterweights](#the-counterweights) below, which carries that half and
links out for the method. It also does not restate any mechanic figure
`reference/mechanics.md` owns (Choice Scarf ×1.5, Tailwind's multiplier and
duration, paralysis's ×0.5, Trick Room's -7 priority) — and it does not claim
`mechanics.md` documents screens' duration/reduction, Intimidate, Friend
Guard, or Multiscale, because it does not; those numbers are not yet
documented anywhere in this repo and need a live check if a build depends on
one. Every species, move, and ability named below was run through
`node tools/dex/cli.js` on 2026-09-09.

**Forward references.** This file links `reference/archetypes.md`,
`reference/speed-control.md`, `reference/roles.md`, `reference/methodology.md`,
`reference/mechanics.md`, `reference/pitfalls.md` and the generated
`reference/format-knowledge.md`. The last one is a sibling built later in the
same piece of work (Task 10); a link that does not resolve yet means "not
written yet," not "wrong path" — the convention `reference/archetypes.md` and
`reference/roles.md` both already use.

**Three marking schemes apply to claims in this file, inherited from
`reference/archetypes.md` and `reference/roles.md` and orthogonal to each
other — a single claim can legitimately carry one mark from each at once, and
none of the three ranks or supersedes another:**

- **Sourcing strength** — `reference/vgc-format.md`'s `[official]` /
  `[consensus]` / `[unresolved]` bracket tags (see that file's ["Confidence
  marking"](vgc-format.md#confidence-marking) section). Answers *how well
  established* a claim is.
- **Scope** — *(generic VGC — not Champions-verified)*, inherited from
  `reference/archetypes.md`. Carried from the masterclass notes; true of VGC
  doubles broadly but **not** separately verified against Champions' roster
  or its current meta. Kept and marked rather than dropped, because dropping
  is distilling. Answers *where a claim came from* — generic VGC vs. this
  file's own Champions-specific verification.
- **Availability** — `*(not in the Champions pool as of <regulation id>,
  verified <date> — guidance holds for when it returns)*`. Answers *is the
  thing legal to use right now*. Attaches only to a species, item, or
  ability this file actually ran through `node tools/dex/cli.js mon` /
  `legal --item` / `legal --ability` and confirmed absent or
  `championsLegal: false` — never applied from recall. **Guidance is never
  deleted because the species, item, or ability it describes is currently
  unavailable** — the roster and item pool are regulation-specific, both grow
  and shrink at each transition, and revert. **No claim in this file
  currently carries this mark.** Every species this file names (Grimmsnarl,
  Whimsicott, Aegislash, Hydreigon) was checked and came back present in the
  vendored Champions roster; the one name the source raises that is genuinely
  absent (Urshifu) is a different, narrower case — see the footnote under
  [Is this Pokémon good?](#is-this-pokémon-good) — and this file does not
  name any item or ability at all. The axis is defined here so a future
  addition to this file marks correctly rather than being silently dropped.

A claim can be *(generic VGC — not Champions-verified)*, `[consensus]` among
third-party sources, **and** carry an availability mark, all at the same
time — each axis is answering a different question, so none of them
substitutes for the others.

A fourth, narrower marker also appears below, answering a different question
again (current usage share, not sourcing, scope, or legality):

- `(as of 2026-09 — confirm with meta usage)` — the claim rests on what is
  currently played, and what is currently played changes. Re-check with
  `node tools/meta/cli.js usage` (the `vgc-meta-lookup` skill) before leaning
  on it.

## Contents

- [Is this Pokémon good?](#is-this-pokémon-good)
- [Inherent vs relative strength](#inherent-vs-relative-strength)
- [Types are not equal](#types-are-not-equal)
- [Design constraints](#design-constraints)
- [Multiplicative scaling](#multiplicative-scaling)
- [The counterweights](#the-counterweights)
- [Meta awareness](#meta-awareness)
- [Changelog](#changelog)

## Is this Pokémon good?

A rubric, not a one-time check — apply it to **every** candidate for a slot,
not just the one that gets picked. `reference/archetypes.md`'s "Building
around a specific Pokémon" section runs its own "know the piece" triage
against a single centrepiece already chosen — a related but narrower
question set (speed-control fit, type profile, and
physical/special/support classification) for a piece that's already locked
in, not a subset of this rubric. This rubric is the general form — matchups,
stats/moves/ability, role, and whether a better legal Pokémon exists — meant
to be run per candidate while a slot is still open.

1. **How does it fare against common Pokémon?** Not a vibe — pull the
   current threat list (`vgc-meta-lookup`) and check real matchups
   (`vgc-threat-evaluation`) rather than reasoning from typing alone
   (`reference/methodology.md`'s "Typing alone is not sufficient" section).
2. **What are its stats, moves, and ability?** `node tools/dex/cli.js mon
   "<Species>"` for stats and the one ability the vendored dex surfaces
   (never the only option — most non-Mega Pokémon have 2-3 legal abilities;
   check the actual preset for the role being built), `move` for real base
   power, `legal --ability` for anything else under consideration.
3. **What role is it filling?** Decide this before the moveset, not after —
   `reference/roles.md`'s "Role before moveset before spread" section owns
   that ordering and the two moveset templates; this question is upstream of
   both.
4. **Is there another legal Pokémon that fills that role better?** This is
   the sharp edge of the whole rubric — the question most likely to change a
   build, because the first three questions can all come back favourable for
   a pick that is nonetheless the *second-best* legal option for the exact
   job it's being asked to do. It costs nothing to ask and it is very easy to
   skip, because a Pokémon that passes questions 1-3 already looks finished.

   A verified, durable illustration:[^1] Grimmsnarl and Whimsicott are both
   Champions-legal, both pure Prankster, and both real candidates for a
   "Prankster dual-screens setter" slot. But `dex learnset` settles which one
   can actually do the job asked: Grimmsnarl can learn both Light Screen and
   Reflect (both `legal`); Whimsicott's vendored learnset includes Light
   Screen but returns `illegal` for Reflect. For a slot that specifically
   needs *both* screens from one Prankster user, the better legal Pokémon for
   that role isn't a judgment call at all — it's a learnset check with one
   answer. Whimsicott is not a bad Pokémon; it fails this specific version of
   question 4, for this specific role, because of a fact a tool call settles
   rather than one recall would.

Three qualifiers the source attaches to this whole rubric, each load-bearing
enough to state on its own:

**A "bad" Pokémon is not banned — it is harder, and it takes more work.**
Nothing in this rubric says a pick that scores poorly on questions 1-4 is
off the table. It means the build has to earn what a stronger pick would
have supplied for free: better play, tighter team support, or a narrower
role where the weakness doesn't come up.

**Usage and win rate are a good easy signal and not authoritative — both
halves matter.** A low-usage Pokémon is sometimes an undiscovered gem, not
proof of weakness; a high-usage Pokémon is sometimes just popular, not
proof of strength for *your* build. `reference/pitfalls.md`'s "Data source
pitfalls" section documents concrete ways usage data misleads on its own
(ladder-vs-tournament divergence, co-occurrence read as synergy) — this file
does not restate those, only the general caution that usage is a signal to
weigh, not a verdict to defer to. Neither "trust the usage number" nor
"ignore the usage number" is the right read.

**Whether a Pokémon is "good" or "bad" is meta-relative and changes.** A
Pokémon surrounded by hard counters in the current field is worse right now
than the same Pokémon a month earlier or later — see
[Meta awareness](#meta-awareness) below and
[Inherent vs relative strength](#inherent-vs-relative-strength) next, which
is the more general version of this same point.

## Inherent vs relative strength

**Inherent strength** is how good a Pokémon is in a vacuum, independent of
what anyone else is running. The source's own emphasis: Speed and power
dominate this axis — can it move before the things it needs to beat, and can
it do real damage consistently once it acts. `reference/speed-control.md`'s
"Raw Speed" section and `reference/roles.md`'s "Offensive capability" section
cover each half in detail; this file does not re-derive either.

**Relative strength** is how good that same Pokémon is against the *current*
meta specifically — a different question, answered by
[Meta awareness](#meta-awareness) below and the live `vgc-meta-lookup` pull,
not by the Pokémon's own stat sheet.

**A team can be inherently strong and relatively weak.** The clearest version
of this already lives in `reference/archetypes.md`'s weather sections: a
Chlorophyll sweeper is a genuinely strong Pokémon in a vacuum — the Speed
doubling under sun is real and large — but its relative strength depends
entirely on whether the opponent is carrying a counter-weather setter that
switches sun off before the sweeper gets to act. Nothing about the Pokémon
changed; what it is worth against a specific field did.

**The reverse — high relative strength from low inherent strength — is
unlikely, but possible.** A Pokémon that is unremarkable in a vacuum can
still be worth a slot if its exact resistance profile happens to wall
whatever the field is currently running, or if it fills a role
(redirection, a specific speed-control answer) that the current meta makes
unusually valuable. This is rarer precisely because inherent strength — raw
Speed and power — tends to matter regardless of what the opponent brings,
while a purely relative advantage evaporates the moment the meta that created
it shifts.

## Types are not equal

**Some types are simply better than others, and offensively-good is not the
same as defensively-good** — two different axes, and a type can sit anywhere
on each independently.

**Offensively**, the gap can be large. Verified via `dex type`: Dragon-type
attacks are resisted by exactly one type (Steel, at 0.5×) and blocked
outright by exactly one (Fairy, immune) — every other type in the game takes
neutral damage or worse from Dragon, i.e. Dragon STAB is rarely a wasted
click. Bug-type attacks, by contrast, are resisted by **seven** types (Fire,
Fighting, Poison, Flying, Ghost, Steel, Fairy, all confirmed 0.5× via `dex
type Bug --vs <Type>`) and are only super-effective against three (Grass,
Psychic, Dark) — a Bug-STAB attacker spends much more of the match clicking
into a wall than a Dragon-STAB attacker does, independent of either
Pokémon's own stats.

**Defensively**, the same kind of gap exists on the other side of the chart.
Steel's own defensive profile (`dex type --vs Steel`) resists **ten** types
at 0.5× and is immune to a further one (Poison), while taking super-effective
damage from only three (Fire, Fighting, Ground) — a genuinely strong
defensive typing on raw numbers alone, before any of the Pokémon wearing it
is considered. Dragon's own defensive profile is far more middling by
comparison (three weaknesses, three or four resistances, no immunity,
depending on the exact secondary type) — the same type that is excellent
offensively is only ordinary on defense. **Neither Dragon nor Steel is "the
best type" in general; each is the strong option on a different one of the
two axes**, which is exactly the source's point and the reason "is this
typing good" always has to specify offense or defense before it can be
answered.

## Design constraints

The checkable half of this file — written as a literal checklist so
`vgc-team-audit` can apply it directly against a real six, not just cite it
as a principle:

```markdown
- [ ] No more than **2** Pokémon of the same type. Exceptions are rare and need a stated purpose.
- [ ] At least one resistance to every type — a rule of thumb, not a requirement. More than one against common threats.
- [ ] **1-2** support slots; the rest offensive or hybrid.
- [ ] **1-3** offensive items, fewer when Megas are in the format.
- [ ] Speed control present, **and** a fallback if its setter is removed.
```

**These five numbers are also stated inline in `vgc-team-audit`** (the
checklist-application skill this section names above), not just pointed at
from there. That is intentional — the audit needs the numbers inline to act
on a real six without a file hop — but it means the two copies drift
silently if only one gets edited: if any of these five numbers change,
update `vgc-team-audit`'s SKILL.md in the same edit as this file.

**These five checks do not carry equal force, and treating them as
interchangeable is a mistake in itself.** The first — no more than two of
the same type — is close to a hard rule: the source states it flatly and
allows only rare, purpose-stated exceptions, because a third Pokémon of a
shared type usually means a shared weakness got tripled rather than covered.
The second — a resistance to every type — is explicitly a rule of thumb, not
a requirement: some real, strong sixes simply don't clear it, and forcing a
weaker pick into a slot solely to fill the last uncovered type is its own
mistake (see [The counterweights](#the-counterweights) below). Don't flatten
these into one line of equal weight; they fail differently and should be
weighed differently.

**The last two checks are explicitly format-specific**, per the source: how
many support slots a team can afford and how many offensive items it can run
both depend on what the rest of the format looks like — a Restricted-legal
format where one or two Pokémon can carry the offense on their own changes
the right support ratio, and a Mega-heavy format changes the right item
count (below). Neither number is a constant to memorize once.

**The `1-3` offensive-item figure is a team-wide budget, not a per-Pokémon
one — and this is the section `reference/roles.md`'s "Items by role" table
explicitly pointed at rather than restating.** The source's own wording:
"most teams run 1-3 offensive items, format specific, i.e. fewer items when
megas are in." A Mega Stone already occupies an item slot without being an
"offensive item" in the sense this budget means (a Choice item, Life Orb, a
type-boosting item) — so a team running two Mega-capable Pokémon has, in
practice, less room left for additional offensive items than the raw count
of six item slots suggests. This is a distribution constraint across the
whole six, checked once at the end of a build, not a per-slot question.

**Type and resistance coverage matter more the more a team wants to switch
Pokémon in and out.** A team that plans to sit its Pokémon and trade hits
head-on cares less about a shared weakness than a team built around pivoting,
because the pivoting team is deliberately exposing more of its own six to
whatever is on the field at a given moment. The source's own example of what
strong defensive type synergy looks like is Aegislash and Hydreigon
together — worth checking rather than repeating verbatim, because the exact
claim as written ("resists all types in the game") overstates it for either
Pokémon individually. `dex type --vs-mon` on each: Aegislash (Steel/Ghost)
takes 2× or worse from Fire, Ground, Ghost and Dark; Hydreigon (Dark/Dragon)
is **4×** weak to Fairy alone, plus 2× weak to Ice, Fighting, Bug and Dragon.
Neither is close to resisting everything. **What the pair actually
demonstrates, verified in both directions:** every type that hits Aegislash
for 2× or more is neutral or resisted for Hydreigon, and every type that
hits Hydreigon for 2× or more is neutral, resisted, or blocked outright for
Aegislash. That — not either Pokémon individually walling the chart — is
what "defensive type synergy" means in practice, and it's the property the
`≤2`-same-type and resistance-rule-of-thumb checks above are both trying to
approximate at the whole-team level.

## Multiplicative scaling

**STAB, weather, terrain, item, and ability modifiers compound rather than
add**, which is why combining offensive tools scales a Pokémon's output
faster than the count of tools would suggest — the actual multiplier values
for any specific case live in `reference/mechanics.md` and
`reference/archetypes.md`'s Weather section (this file states the shape, not
the numbers). **Combining two threats that each beat the other's usual
counters is disproportionately powerful for the same reason** — the
opponent's answer to one opens the door for the other, and the team's
overall win rate against a given counter-strategy compounds rather than
merely adding the two threats' individual win rates.

**Building the whole team around setting up one Pokémon can work, but it
concentrates risk onto a single point of failure.** A team whose plan is
"get this one Pokémon to +2 and it wins the game" loses that plan to a
single misplay, a single crit taken at the wrong moment, or a single
Pokémon lost to a 20% roll it didn't need to take. **A more balanced spread
of offensive capability across the six is the default recommendation** for
exactly this reason — not because concentrated setup can't work, but because
it trades a higher ceiling for a lower floor, and that trade should be made
on purpose rather than by accident.

## The counterweights

**These get their own section, not a bullet buried inside the checklist
above, because this file's own checklist is exactly what they counterweight.**
Applied without judgment, "no more than 2 of a type," "a resistance to every
type," and "1-3 offensive items" can each turn into a rule followed for its
own sake rather than in service of a winning team. The source states these
as strongly as anything else in it, and they are stated here with the same
weight:

- **The best defence is a strong offence.** `reference/roles.md`'s "The two
  templates" section already makes this point about a single Defensive-slot
  Pokémon; it applies at the team level too — a team that removes the
  opponent's Pokémon before they act needs less defensive coverage than one
  planning to out-survive them, and over-investing in the Design-constraints
  checklist above at the expense of raw damage is a real way to build a
  worse team.
- **Resistances do not compensate for bad stats.** A Pokémon with a perfect
  defensive typing and mediocre bulk still folds to a real attack; the type
  chart changes the multiplier, not the base numbers it's multiplying.
- **Half of a big number is still a big number.** A resisted hit from a
  genuinely strong attacker can still knock a Pokémon out. Coverage is a
  tool for closing specific gaps against specific threats, not a guarantee
  that a "resisted" label means safe.
- **Do not hyper-fixate on spreads to the point of losing what made the
  Pokémon good.** This is where this file's share of the source's
  "Stats/Damage Calculation re:Teambuilding" section lives — the method for
  actually solving a spread is
  [`reference/methodology.md`'s "SP spread allocation" section](methodology.md#sp-spread-allocation-solve-for-the-breakpoint-dont-default-to-32322),
  not restated here. What belongs here is the judgement the source attaches
  to that method: **a default, unoptimised split can still win games** — a
  polished spread helps and is worth doing, but it is not a precondition for
  a Pokémon to function. **Where the points go changes which scenarios the
  Pokémon survives** — HP versus Def/SpD is not a cosmetic choice, and
  neither is Speed versus bulk. **The scenarios worth checking are the ones
  actually likely to occur** — after the opponent's Intimidate has already
  landed, with the relevant weather or terrain up, against the real current
  speed tier — not just the single named threat that prompted the spread in
  the first place. And **dumping every spare point into bulk on a Pokémon
  whose job is offense is usually a waste** — the spread exists to serve the
  role the Pokémon was picked for, and a spread that maximises survivability
  at the cost of the damage or Speed that made the pick worth making has
  optimised the wrong thing.
- **You do not need super-effective coverage on everything.** Restated from
  [Coverage without over-fixating](roles.md#coverage-without-over-fixating)
  in `reference/roles.md`, which owns the per-Pokémon version of this point
  in more depth; here it applies at the team level — a six does not need a
  super-effective answer to every type on the chart, only to the threats
  that actually show up.

## Meta awareness

**A weakness nobody exploits is not a weakness.** The Design-constraints
checklist above is a set of heuristics for a team that has to survive
*whatever shows up* — but what actually shows up is a live-meta question,
not a design-time one. The source's own example: a shared physical-Psychic
weakness across the whole six does not matter if nothing in the current meta
is running a physical Psychic attacker. **Never build coverage against a
threat that isn't real right now** without checking first (`vgc-meta-lookup`)
— a coverage slot spent on a theoretical threat is a coverage slot not spent
on a real one.

**Think about who the team will actually face, not just what the team itself
looks like.** This means three separate things the source names:

- **Which Pokémon commonly run together, and why.** A real synergy claim
  needs a stated mechanism (redirection, speed control, shared weather),
  not just a co-occurrence rate — `reference/pitfalls.md`'s "Data source
  pitfalls" section covers exactly this trap for a team being *built*; the
  same caution applies when reading the *opponent's* likely cores off usage
  data.
- **Ladder and tournament results both matter, and can diverge.** A Pokémon
  can be ladder-dominant and tournament-weak or the reverse
  (`reference/pitfalls.md`, "Ladder rules are not tournament rules") —
  weigh both rather than treating either alone as the full picture of "what
  people play."
- **The field changes over a regulation's life**, which is exactly why
  [Is this Pokémon good?](#is-this-pokémon-good) states that "good" and
  "bad" are meta-relative rather than fixed properties of a species.

**There is a counter to every Pokémon, however strong — and building a
dedicated answer to one is a legitimate response, not a concession.** If a
team keeps losing to the same specific threat, a slot spent answering it
directly is the correct move rather than a sign the rest of the team is
weak. `reference/archetypes.md`'s Good Stuff section already names this as
one of its typical 1-2 specific-matchup slots; the same logic applies to any
archetype, and the slot only has to be re-justified when the threat it
answers stops showing up (the same file's "How it fails" list for exactly
that archetype names a *stale* tech slot, aimed at a threat that has already
left the meta, as the actual failure mode — not the tech slot itself).

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-09 | Created. The repo had no "is this Pokémon good" rubric and no team-wide design-constraints checklist anywhere — `vgc-team-building`'s per-slot candidate step and `vgc-team-audit`'s coverage/distribution checks both needed a target and found none. Covers the four-question good-Pokémon rubric (including the "is there a better legal Pokémon for this role" question, illustrated with a verified Grimmsnarl-vs-Whimsicott learnset check after Urshifu — the source's own example — turned out to be absent from the vendored dex entirely, footnoted per the substitution convention), inherent vs. relative strength, real verified numbers for "types are not equal" (Dragon offense resisted by 1 type vs. Bug offense resisted by 7; Steel defense resisting 10 types plus one immunity), a literal checkable Design-constraints list (closing the pointer `reference/roles.md` left open for the team-wide 1-3 offensive-item budget), multiplicative scaling, a dedicated Counterweights section carrying the judgement half of the source's "Stats/Damage Calculation re:Teambuilding" section (method left in `reference/methodology.md`, not duplicated here), and Meta awareness. One source claim was corrected rather than restated: "Aegislash/Hydreigon resists all types in the game" is false for either Pokémon individually (verified via `dex type --vs-mon` — Aegislash takes 2x+ from four types, Hydreigon is 4x weak to Fairy) but true as a *pair* in the sense that matters — every type that hits one hard is neutral-or-better for the other, verified in both directions. Every species named (Grimmsnarl, Whimsicott, Aegislash, Hydreigon, plus the rejected Urshifu) was checked via `dex mon`/`dex learnset`; none currently carry the availability mark — all are present in the vendored Champions roster. `npm test` — 318/318, unchanged. | `reference/sources/teambuilding-notes.md` ("Other Rules" → "Use 'Good' Pokémon") and `reference/sources/teambuilding-notes-advanced.md` ("Inherent Strength vs Relative Strength", "Types", "Defensive Coverage", "Offensive Capabilities Distribution", "Format Specific Teambuilding", "Relative Strength", "Stats/Damage Calculation re:Teambuilding"), both vendored from masterclass notes by a Pokémon world champion; `.superpowers/sdd/2026-09-08-teambuilding-philosophy/task-5-brief.md` |
| 2026-09-09 | Cross-file cleanup ahead of `vgc-team-building`'s renumbering from 8 to 10 steps. Converted both cross-file step-number citations ("step 4" in the header pointer and in the Created changelog row) to "the per-slot candidate step," which survives renumbering. Reworded the "Is this Pokémon good?" intro's parallel to `reference/archetypes.md`'s "Building around a specific Pokémon" step-0 triage, which also cited that step by number and additionally overstated the parallel as "a narrower three-question version of this rubric" — the two question sets only loosely overlap (on "role"); that triage asks about speed-control fit, type profile, and physical/special/support classification for a piece already locked in, while this file's rubric asks about matchups, stats/moves/ability, role, and whether a better legal Pokémon exists for a slot still open. Reworded to describe it as a related but narrower question set, not a subset. No verified fact (BP, type-chart result, item/ability/learnset verdict) was touched. `npm test` — 318/318, unchanged. | Batch cross-reference cleanup across `archetypes.md`, `speed-control.md`, `roles.md`, `team-evaluation.md` |
| 2026-09-09 | Task 16 (routing/wiring): added a lockstep note directly under the Design-constraints checklist recording that all five numbers are also restated inline in `vgc-team-audit`'s SKILL.md (by design, so the skill can act on a real six without a file hop) and must be updated together with this file if any of the five change. Ran `grep -rln "80 BP\|design-constraint\|Design constraints" .claude/skills/` to find the real consumer rather than guessing; confirmed all five numbers (≤2 same-type, resistance rule of thumb, 1-2 support, 1-3 offensive items, speed control + fallback) appear in that skill's coverage/distribution/speed steps. No design-constraint number itself was changed | `.superpowers/sdd/2026-09-08-teambuilding-philosophy/task-16-brief.md`; `.claude/skills/vgc-team-audit/SKILL.md` |

[^1]: The source's own example for this question is "Urshifu is mostly just
      a better Palafin." Urshifu is absent from the vendored dex entirely —
      not a species currently sitting out a regulation, but one that has
      never been vendored under either forme name at all (verified
      2026-09-09: `node tools/dex/cli.js mon "Urshifu"` returns "not found in
      any vendored dex," the same "never vendored" case
      `reference/archetypes.md`'s Examples-policy section already logged for
      this exact species). This file substitutes Grimmsnarl vs. Whimsicott, a
      pair of real Champions-legal Prankster Fairy-type support Pokémon that
      demonstrates the same point — the better legal option for a specific
      role is sometimes settled by a learnset fact rather than a judgment
      call — verified via `dex mon` and `dex learnset` for both species. The
      original wording is in `reference/sources/teambuilding-notes.md`
      ("Other Rules" → "Use 'Good' Pokémon").
