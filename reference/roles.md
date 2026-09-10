# Roles: what a Pokémon is *for*, before what it runs

**The order the whole file argues for:** decide the role, then the moveset,
then the SP spread — never the reverse. Read at `vgc-team-building`'s
moveset step (fill each slot's moveset) and by `vgc-team-refining`'s
role-fit check, which
applies the templates and the base-power floor below against an
already-mostly-decided team.

Built on `reference/sources/teambuilding-notes.md`'s "Choosing the right
moveset / Roles" section and `reference/sources/teambuilding-notes-advanced.md`'s
"Offensive Capabilities", "Offensive Coverage", "Offensive Items", "Defensive
Capabilites" (source spelling), "Defensive items" and "Other ways to reduce
damage" sections — near-verbatim notes from masterclass videos by a Pokémon
world champion, vendored 2026-09-08 as a frozen audit trail. Those files are
generic VGC; this one is localised to Champions. **Do not edit the source
files.** If this file turns out to be wrong, diff it against them.

**This file holds judgement and organisation, not facts a tool can settle.**
Item mechanics (including exactly what Focus Sash blocks), ability
interactions, and "a Pokémon's value isn't always damage" all already live
elsewhere and are linked, not restated. Every species, move, item and ability
named below was run through `node tools/dex/cli.js` on 2026-09-09 — see
[Examples policy](#examples-policy).

**A note on timing.** Regulation M-B ends the day this file was written and
M-C replaces it (`reference/regulation.md`). The item-availability facts
below — several items the source names are currently outside the pool —
come from the vendored M-B item pool as checked on 2026-09-09. **That is a
regulation-pool snapshot, not a verdict on the guidance itself**: an item
marked unavailable keeps its full row, because the item pool is
regulation-specific and reverts, while the reasoning about what the item
does for a role does not expire. Re-run the `legal --item` checks (or run
the `vgc-regulation-transition` skill) after the M-C re-vendor before
trusting any availability mark in this file past today.

**Forward references.** This file links `reference/archetypes.md`,
`reference/speed-control.md`, `reference/methodology.md`,
`reference/mechanics.md`, `reference/team-evaluation.md` and the generated
`reference/format-knowledge.md`. `reference/team-evaluation.md` is now
written; only `reference/format-knowledge.md` remains a forward reference —
a link that does not resolve yet means "not written yet," not "wrong path"
(same convention `reference/archetypes.md` and `reference/speed-control.md`
use).

**This file is general VGC doubles practice, drawn from the masterclass
notes in `reference/sources/`. It applies to Champions unless a note says
otherwise** — Champions is VGC doubles, and the notes were written
cross-format deliberately, not narrowed down to this platform. Where
Champions genuinely departs — a roster gap, an item outside the current
pool, a move a species cannot learn here — that departure is marked at the
claim, with the regulation it was checked against.

**Two marking schemes apply to claims in this file, and they are orthogonal
axes — a single claim can legitimately carry one mark from each at once, and
neither ranks or supersedes the other:**

- **Sourcing strength** — `reference/vgc-format.md`'s `[official]` /
  `[consensus]` / `[unresolved]` bracket tags (see that file's ["Confidence
  marking"](vgc-format.md#confidence-marking) section). Answers *how well
  established* a claim is.
- **Champions departure** — one marker family, inherited from
  `reference/archetypes.md`, for every place this file has actually checked
  and found Champions diverging from the general-VGC claim being made,
  covering item-pool gaps, roster gaps, and learnset gaps alike. An item or
  roster departure reads `*(not in the Champions pool as of <regulation id>,
  verified <date> — guidance holds for when it returns)*`; a learnset
  departure reads `*(cannot learn <Move> in Champions as of <regulation id>,
  verified <date> — guidance holds for when that changes)*`. Answers *does
  Champions' current item pool, roster, or learnsets actually differ from
  what the general-VGC source says here*. Attaches only to an item, ability,
  species, or move this file actually ran through `node tools/dex/cli.js
  legal --item` / `--ability` / `mon` / `learnset --move` and got back
  `championsLegal: false`, absent, or `illegal` — never applied from recall.
  **Guidance carrying this mark is never deleted.** The item pool and roster
  are regulation-specific and both revert, and a regulation cuts move pools
  as well as adding to them (`tools/dex/VENDOR_MANIFEST.md`); what a
  masterclass source says an item, species, or move is *for* stays true for
  the entire time the thing it names happens to be sitting out a regulation.
  **This mark is a snapshot pinned to the regulation named in it, not a
  permanent verdict — re-verify every instance at the next rollover**, with
  the same command that produced it. See the standing note under
  [Items by role](#items-by-role) for the re-check obligation this mark
  carries.

A claim can be `[consensus]` among third-party sources **and** carry a
Champions-departure mark at the same time — each axis is answering a
different question, so neither substitutes for the other.

A third, narrower marker also appears below, answering a different question
again (current usage share, not sourcing or departure status):

- `(as of 2026-09 — confirm with meta usage)` — the claim rests on what is
  currently played, and what is currently played changes. Re-check with
  `node tools/meta/cli.js usage` before leaning on it.

## Contents

- [Role before moveset before spread](#role-before-moveset-before-spread)
- [The two templates](#the-two-templates)
- [Offensive capability](#offensive-capability)
- [The base-power floor](#the-base-power-floor)
- [Coverage without over-fixating](#coverage-without-over-fixating)
- [Items by role](#items-by-role)
- [Damage reduction that is not an item](#damage-reduction-that-is-not-an-item)
- [Judging a support pick](#judging-a-support-pick)
- [Examples policy](#examples-policy)
- [Changelog](#changelog)

## Role before moveset before spread

**Decide the role first, then let the role choose the moveset, then let the
moveset (and the matchups it has to survive) choose the SP spread.** Doing
this in the other order — picking four moves that look good, or maximising a
spread before the set is settled — produces a Pokémon that is good at nothing
in particular, because "good" was never defined before the choices that
determine it.

Some Pokémon are flexible enough to fill more than one role well; some are
functionally locked into one by their stats, ability, or learnset. Either
way, the role is a decision to make *before* the moveset, not something read
off the moveset after the fact — and it is allowed to change mid-build if a
partner or a matchup makes a different role clearly better, exactly the way
`reference/archetypes.md`'s "Building around a specific Pokémon" section
treats the whole team.

## The two templates

The source gives two moveset shapes, one per broad role:

| Role | Slot 1 | Slot 2 | Slot 3 | Slot 4 |
|---|---|---|---|---|
| Offensive | STAB | STAB | Coverage / setup / support | Protect |
| Defensive | Support | Support | STAB | Support / Protect |

**These are starting shapes, not laws.** A deviation is fine — a second
coverage move instead of Protect, a Defensive set with two STAB moves because
both matter to the matchup — but it should have a reason attached, the same
discipline `reference/archetypes.md` asks of any deviation from an archetype's
usual shape. A set that deviates from its own template with no stated reason
is a set nobody actually decided.

What "Defensive" is optimising for, as the counterpart to
[Offensive capability](#offensive-capability) below: the source's own framing
is that **the best defense is a strong offense — don't obsess over defensive
stats as an end in themselves.**
A Defensive-template Pokémon still wants
high Def/SpD and hits that land as neutral or not-very-effective rather than
super-effective, but those stats exist to buy it turns to use its two Support
slots and its own STAB, not to make it unkillable. A defensive Pokémon that
never converts its survivability into an action taken is failing at its job
just as surely as an Offensive one that never gets to attack.

## Offensive capability

What actually makes a Pokémon hit hard, per the source:

- **High Attack or Special Attack.**
- **High base-power moves** — see [the base-power floor](#the-base-power-floor)
  below for the checkable threshold.
- **Neutral or super-effective hits.** `node tools/dex/cli.js type --vs <Type>
  --vs-mon "<Species>"` settles this; never from recall, and never by
  reasoning from half of a dual typing (`CLAUDE.md`).
- **Boosting items** — see [Items by role](#items-by-role).
- **Setup moves** — Swords Dance and Helping Hand for a partner are the
  source's own two examples (both verified legal Champions moves). **The
  source's rule: boosting to +2 is the same as attacking twice, so the setup
  has to pay for the turn it cost.**
  A setup move that gets no follow-up
  attack in — because the setter faints, gets Taunted, or the game ends
  first — bought nothing. This is the same accounting
  `reference/archetypes.md` applies to a Tailwind or Trick Room setter that
  contributes nothing on the turns it isn't setting: the question is always
  *what did this turn actually convert into*.
- **Other damage modifiers** — weather, terrain, and abilities. These
  multiply rather than add, which matters for how much a single one of them
  is worth: see [Coverage without over-fixating](#coverage-without-over-fixating)
  below and `reference/archetypes.md`'s Weather section for what a matching
  weather is worth to an attacker built around it.

## The base-power floor

**Base power matters as much as type.** The source's own contrast, with the
real numbers: Icy Wind is **55 base power** — it is a speed-control move, not
a damage move (`reference/speed-control.md`'s Speed-lowering-moves section
covers it in that role). Blizzard is **110 base power** — it is the damage
move (both verified via `node tools/dex/cli.js move`).

**The checkable rule this file states for `vgc-team-refining` to apply:**
an offensive move on a set should be **≥80 base power, preferably ≥90.** A
move below that line needs a specific, stated job that isn't damage —
priority, a guaranteed secondary effect, speed control, status, redirection —
to justify the slot. A sub-80-BP move with no such job stated is a moveset
gap, not a stylistic choice, and should be flagged as one.

This threshold is about **attacking moves specifically.** It says nothing
about Protect, a support move, or a Defensive-template Pokémon's Support
slots — those are judged on whether their action goes off, not on power (see
[Judging a support pick](#judging-a-support-pick)).

**This number is also stated inline in `vgc-team-building` and
`vgc-team-refining`** (both restate it as the checkable move-verification
step, not just a pointer back here) so a skill can act on it without a file
hop. That is intentional, not drift — but it means the two copies must move
in lockstep: if this floor ever changes, update both skills in the same
edit, not just this file.

## Coverage without over-fixating

**You do not need a super-effective answer to everything.** Resistances matter, but half of a large number can
still be a large number — a strong enough attacker clicking a neutral hit can
still remove the target. Coverage is a tool for closing specific gaps, not a
checklist to fill for its own sake.

**What actually matters: not being unable to hit the *key meta threats*
hard.** This is a live-meta question, not a design-time guess — pull current
usage (`vgc-meta-lookup`) before deciding which threats a coverage slot needs
to answer, rather than picking a type on general principle
`(as of 2026-09 — confirm with meta usage)`.

**Physical and Special coverage matters too.** A Pokémon whose coverage move
is the same damage category as its STAB duplicates what a status boost or a
screen already answers for it, and does nothing against a target that resists
the category rather than the type. Checking a coverage move's category
alongside its type is the same discipline as checking base power alongside
type: a single axis looked at alone misses half the picture.

## Items by role

The source names several item classes. Every one below was checked against
the Champions item pool with `node tools/dex/cli.js legal --item` on
2026-09-09, and **the sweep found real gaps between what the source assumes
and what Champions currently ships.** Every item class the source names is
still in this table regardless of what the sweep found — the ones the sweep
returned `championsLegal: false` for carry the availability mark defined
above rather than being cut. `reference/mechanics.md` owns item mechanics
generally (including exactly what Focus Sash blocks); this table carries
only the role-fit consequence.

**Standing note — re-check after every rollover.** The availability marks in
this table are a snapshot pinned to Regulation M-B, verified 2026-09-09.
They are not a permanent verdict on any item: the Champions item pool is
regulation-specific and both grows and shrinks at each transition, so an
item marked unavailable today can become legal again — silently, with no
flag beyond the regulation notes — the moment a new regulation launches. Do
not carry an availability mark forward past a rollover on the strength of
this file alone; re-run `node tools/dex/cli.js legal --item "<Item>"` for
anything marked here, or run the full `vgc-regulation-transition` skill,
which re-vendors the item pool as part of its normal handover.

*(The source also states a team-wide budget — "most teams run 1-3 offensive
items, format specific, i.e. fewer when megas are in." That is a constraint
on the whole team's item distribution, not a single Pokémon's role, so it
belongs in `reference/team-evaluation.md`'s [Design
constraints](team-evaluation.md#design-constraints) checklist rather than
here — see that file rather than re-deriving the budget in this one.)*

| Item class | Best on | Watch out for |
|---|---|---|
| Choice items — Choice Scarf, Choice Band, Choice Specs[^1] | A Pokémon that wants the guarantee of ×1.5 Speed (Scarf) or ×1.5 damage (Band on physical, Specs on special) and is fine committing to one move per switch-in; spread moves pair well since the lock-in cost doesn't change with the number of targets. | Locked into the first move used until switching out. **A Choice item should not also carry Protect** — Protect used once locks the holder into Protect for the rest of its time on the field, which is usually a worse trade than the flexibility Protect exists to buy in the first place. **Choice Band and Choice Specs** *(not in the Champions pool as of M-B, verified 2026-09-09 — guidance holds for when they return)* **— only Choice Scarf is currently legal**; see footnote. |
| Life Orb | A Pokémon that wants every attack boosted rather than one item-matched type. | Recoil adds up over a game; **some abilities ignore it** (Magic Guard is the standard example) — the exact interaction is not yet documented anywhere in this repo (`reference/mechanics.md` was checked directly and holds no Magic Guard content); verify live before assuming a given holder takes the recoil. |
| Type-boosting items — Mystic Water, Charcoal, and the rest of the family (all verified Champions-legal) | A Pokémon running several moves of one type — the source's own example is Aqua Jet (40 BP, priority) and Wave Crash (120 BP) on the same Water attacker, both verified — or one that mostly clicks a single move, such as Torkoal running Charcoal for its own signature Eruption (150 BP spread Fire; Torkoal's learnset was re-verified for this file). | Narrower than Life Orb — it does nothing for a move of any other type, so it is a weaker pick on a Pokémon whose moveset is genuinely mixed-type. |
| Focus Sash | A frail Pokémon whose whole job is surviving to take exactly one action. | It is a one-action item, not a one-turn-of-safety item — the gap between those two is real and situational. Multi-hit-move mechanics: `reference/mechanics.md`'s Item mechanics section. Double-targeting risk: `reference/methodology.md`'s Focus-Sash-support case. Don't re-derive either here. |
| **Assault Vest** *(not in the Champions pool as of M-B, verified 2026-09-09 — guidance holds for when it returns)* | The source lists it alongside Focus Sash under "Defensive items" damage reduction: a bulky Pokémon that plans to just absorb hits and doesn't need a status move on the turns it's doing so. | **Cannot run status moves at all** while holding it — the source's own caveat, and a hard one: a set that also wants Will-O-Wisp, Thunder Wave, Taunt, or a screen has picked an item that forecloses that plan entirely, not merely discourages it. |
| Super-effective-reducing berries — Chople, Occa, Shuca, and the rest of the family (all verified Champions-legal) | A Pokémon with one predictable, high-value weakness it expects to be attacked into. | Consumed on the first qualifying hit, and only helps against the one type it's keyed to — guessing the wrong type wastes the slot entirely, and it does nothing against any other attack. |
| **Terrain seeds** — Electric Seed, Grassy Seed, Misty Seed, Psychic Seed *(all four not in the Champions pool as of M-B, verified 2026-09-09 — guidance holds for when they return)* | The source lists this class as "Seeds (activate on terrain)" under Defensive-items damage reduction: a Pokémon on a team that is already committed to setting the matching terrain. | Each seed answers only its own terrain — an Electric Seed does nothing without Electric Terrain up, and so on for the other three. The exact stat boost and trigger timing aren't detailed in the source or documented elsewhere in this repo yet; verify live before building a set around a specific seed. |
| Sitrus Berry | See the Sitrus-vs-Leftovers comparison below. | One-time use, and only triggers once the holder is already below half HP — it does not prevent the hit that brought it there. |
| Leftovers | See the Sitrus-vs-Leftovers comparison below. | Passive and slow relative to Sitrus — see below for the actual math. |

[^1]: The source's "Choice items" bullet describes the class generically as
"1.5x damage or speed, but stuck in move" — generic VGC has all three members
(Band, Specs, Scarf). **The sweep found only Choice Scarf currently in the
Champions item pool; Choice Band and Choice Specs both came back
`championsLegal: false`** (verified 2026-09-09 via `dex legal --item`,
checked directly against the vendored item list rather than inferred). This
is not a vendoring gap in the sense a missing species is — the tool's own
note is explicit that a `false` here means genuinely unavailable right now,
not merely un-vendored — but the pool is per-regulation and reverts, and
M-C launches the same day this file was written, so re-check before trusting
this past today. **Practically: in current Champions, a legal Choice item
means Choice Scarf specifically** — the ×1.5 *damage* half of the source's
description (Band, Specs) is currently unavailable, not gone; their row
above keeps their full guidance for when the pool includes them again.

**Two item classes the source names are currently unavailable in their
entirety, and are marked as such directly in the table above rather than
excluded from it:**

- **Assault Vest** — the source lists it under "Defensive items" alongside
  Focus Sash, explicitly noting it "cannot run status moves." Verified
  2026-09-09 via `dex legal --item "Assault Vest"`: `championsLegal: false`.
  It is absent from the vendored Champions item pool entirely, not merely
  missing a vendoring update — the same tool call that confirmed Focus Sash,
  Life Orb, Leftovers and Sitrus Berry are all legal returned `false`
  specifically and only for this one of the five items the task brief named.
  Its row above is not cut for that: the guidance about what it does for a
  role is evergreen even though the item itself is sitting out this
  regulation. Re-check after the M-C re-vendor.
- **Terrain seeds** (Electric Seed, Grassy Seed, Misty Seed, Psychic Seed) —
  the source lists "Seeds (activate on terrain)" as a Defensive-items damage
  reduction option. **All four checked came back `championsLegal: false`.**
  No terrain seed currently exists in the Champions item pool, so the entire
  item class the source describes has no legal member right now — but the
  class stays in the table with an availability mark, not a removal, because
  a regulation change is exactly the kind of event that can bring it back.
  If a terrain-seed plan looks attractive from generic-VGC knowledge, re-run
  this check before building around it — the current answer is "not yet,"
  not "no."

**Sitrus Berry vs. Leftovers — a genuine trade-off, not a ranking.** The
source presents both, and this file does not pick a winner:

- **Sitrus Berry** heals when the holder drops below half HP, **often
  considered one of the best items** in the source's own words, and can turn
  what would be a 2HKO into a 3HKO by healing back above the threshold that
  made the second hit lethal. The healing is a one-time event, sized to when
  it's needed most.
- **Leftovers** heals a smaller amount every turn, unconditionally, for as
  long as the holder is on the field. The source's own comparison: it takes
  **five activations of Leftovers to out-heal one Sitrus proc**, so Leftovers
  is the better pick specifically when the game is going long enough for
  those five turns to happen, or when it's stacking with other passive
  healing (Grassy Terrain's per-turn heal, a Grassy Terrain-boosted move,
  Ingrain, and similar) rather than being asked to carry recovery alone.

Which one is right for a given set depends on how long the Pokémon expects to
stay on the field and whether anything else on the team already supplies slow
passive healing — not on one item being categorically stronger.

## Damage reduction that is not an item

The source's list, organised: screens, stat drops, Intimidate, other
abilities, and setup moves. **The measured multipliers for screens,
Intimidate, Friend Guard and Multiscale now live in
`reference/mechanics.md`'s ["Damage reduction: screens, Friend Guard,
Multiscale, and stat stages"](mechanics.md#damage-reduction-screens-friend-guard-multiscale-and-stat-stages)
section** — reduction fraction, the exact `tools/damage-calc/cli.js` command
for each, and the date measured. This section states only why each belongs
on a role checklist, at the level of what it buys the role; the numbers
themselves aren't restated here.

- **Screens** — Light Screen, Reflect, and Aurora Veil (all verified legal
  Champions status moves). One moveslot buys a side-wide damage reduction for
  a fixed duration, the same "buy a window" shape `reference/speed-control.md`
  describes for Tailwind. Aurora Veil additionally requires snow to be up —
  see `reference/archetypes.md`'s Weather section for that dependency.
- **Attack/Special Attack-reducing moves** — lowering the *attacker's*
  offensive stat stage instead of raising the target's defensive one. Same
  stat-stage mechanics as any other stage change: it has to land, and it
  clears if the affected Pokémon switches out.
- **Intimidate** (verified legal Champions ability) — an on-switch-in Attack
  drop that costs no moveslot and no turn, which is exactly why it is one of
  the most efficient damage-reduction tools available: the source's general
  point that stat drops reduce damage applies here for free.
- **Other abilities** — Friend Guard and Multiscale, the source's own two
  named examples (both verified legal Champions abilities). Friend Guard
  reduces damage a Pokémon's *ally* takes rather than its own; Multiscale
  reduces damage the holder itself takes, but only from full HP.
- **Setup moves** — a defensive stat boost is the mirror image of the
  offensive setup rule in [Offensive capability](#offensive-capability)
  above: a +2 Defense boost is worth roughly halving incoming damage for as
  long as it lasts, and it has to pay for the turn spent setting it up the
  same way an offensive boost does.

## Judging a support pick

A support pick's value is not measured in damage dealt or damage prevented —
it's measured in whether its actual job (redirection, screens, speed control,
status) reliably happens. `reference/methodology.md`'s "[A Pokémon's value
isn't always damage — evaluate the role it's actually filling](methodology.md#a-pokémons-value-isnt-always-damage--evaluate-the-role-its-actually-filling)"
section is the full treatment, including the worked Focus-Sash-support case;
this file does not restate it.

## Examples policy

The rules this file obeys, inherited from `reference/archetypes.md`:

1. **Every principle stands without its example.** The example illustrates;
   it never carries the claim.
2. **Prefer structurally durable examples.** A move's real base power and an
   item's real legality are durable; a species' current usage rate is not.
3. **Any claim resting on current usage carries a date stamp and a verify
   marker**: `(as of 2026-09 — confirm with meta usage)`.
4. **An item, ability, or species that fails a legality check is marked
   unavailable in place with the availability marker — never deleted or
   replaced.** The guidance about what it's for is evergreen even when the
   specific thing currently is not; only a genuinely illustrative example
   (not a role recommendation in its own right) would ever be swapped for a
   legal stand-in, with the swap recorded as a footnote and the original
   left in `reference/sources/`. See the Items-by-role section above for
   how this played out for this file's items.

**How this file was verified.** Every move, item and ability named above was
run through `node tools/dex/cli.js` on 2026-09-09: `move` for base power and
type, `legal --item` for item legality, `legal --ability` for ability
legality, and `learnset --move` for the one move-on-species claim this file
makes (Torkoal / Eruption). The one species named, Torkoal, was independently
confirmed present in the Champions roster via `dex mon`.

**Names the sweep marked unavailable rather than legal, and where they
appear:** Choice Band, Choice Specs, Assault Vest, Electric Seed, Grassy
Seed, Misty Seed and Psychic Seed are all real items the source names or
implies that are **not** in the Champions item pool as of Regulation M-B,
verified 2026-09-09 — see the Items-by-role table and footnotes above for
each one's full guidance and its availability mark. None of these are
missing-from-vendor cases the way an unreleased species would be; the tool's
own item-legality note is explicit that a `false` here means genuinely
unavailable now. **None of the seven were removed from this file** — the
user correction behind this round's edit is explicit that current
unavailability is not a reason to lose evergreen guidance, since the item
pool is regulation-specific and these items can become legal again with no
warning beyond the regulation notes. Re-run the checks after the M-C
re-vendor rather than assuming any availability mark holds past the
regulation this file names.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-09 | Created. The repo had no role framework at all — `vgc-team-building`'s moveset step and `vgc-team-refining`'s role-fit check both needed a target and found none. Covers the role-before-moveset-before-spread ordering, the Offensive/Defensive moveset templates, offensive capability (including the +2-setup-pays-for-its-turn rule), the ≥80 BP (preferably ≥90) base-power floor with Icy Wind (55 BP) vs. Blizzard (110 BP) as the real-number worked example, coverage without over-fixating, an items-by-role table, non-item damage reduction, and a two-sentence pointer to `methodology.md` for judging support picks rather than restating it. The item sweep found four items the source names or implies (Assault Vest, Choice Band, Choice Specs, all four terrain seeds) that are not in the Champions item pool at all — marked unavailable in the recommendation table and kept there with their full guidance, rather than presented as currently available, per the task's own verification requirement. Every move, item and ability verified via `tools/dex/cli.js`; none of the failures were vendoring gaps — all were `championsLegal: false` against the current M-B item pool. `npm test` — 318/318, unchanged. | `reference/sources/teambuilding-notes.md` ("Choosing the right moveset / Roles") and `reference/sources/teambuilding-notes-advanced.md` ("Offensive Capabilities", "Offensive Coverage", "Offensive Items", "Defensive Capabilites", "Defensive items", "Other ways to reduce damage"), both vendored from masterclass notes by a Pokémon world champion; `.superpowers/sdd/2026-09-08-teambuilding-philosophy/task-4-brief.md` |
| 2026-09-09 | Fix round 1 (review: spec ❌, 3 Important + 1 Minor). (1) Added a one-line provenance note near "Items by role" recording that the source's team-wide "1-3 offensive items" budget belongs in `reference/team-evaluation.md` (Task 5, not yet written) rather than here — a pointer, not a restated rule, per controller ruling. (2) "Damage reduction that is not an item" falsely claimed `reference/mechanics.md` "owns the mechanics" of screens/Intimidate/Friend Guard/Multiscale; verified directly that it holds none of them, and reworded both the section intro and the Friend-Guard/Multiscale bullet to say those mechanics are not yet documented anywhere in this repo and must be verified live, instead of sending the reader to an empty file. (3) The Focus Sash table cell restated two specific mechanics (blocks only the first hit of a multi-hit move; does nothing against double-targeting) and then said not to re-derive them — trimmed to the role-level consequence (a one-action item) plus two corrected pointers: the multi-hit fact to `reference/mechanics.md` (confirmed present, line 86) and the double-targeting fact to `reference/methodology.md` (confirmed present, line 178) rather than both going to `mechanics.md`, which only has the first. (4) Attached the `*(generic VGC — not Champions-verified)*` scope marker, which was defined but never used, to the four generic-VGC design-judgment claims the review named: role-determines-moveset ordering, "+2 is the same as attacking twice," "the best defense is a strong offense," and "you do not need a super-effective answer to everything" — none of the tool-verified facts (BP values, item/ability legality) were touched. `npm test` — 318/318, unchanged. | Code review of this file, round 1 |
| 2026-09-09 | Fix round 2 (user correction, overriding fix round 1's removal ruling). The user reviewed fix round 1's outcome and explicitly overrode the prior ruling that Assault Vest, Choice Band, Choice Specs and the four terrain seeds be removed from "Items by role" for failing `legal --item`: the item pool is regulation-specific and these items "will be available at some point," so "the guidance in general is evergreen even if specifics aren't." Restored all seven to the table itself (not as excluded call-outs), each keeping its full "Best on"/"Watch out for" guidance from the source's "Offensive Items" and "Defensive items" sections — Assault Vest's "cannot run status moves" caveat, the Choice-item ×1.5 damage/speed trade-off, terrain seeds keyed to their own terrain. Re-ran `legal --item` fresh for all 17 items on 2026-09-09: every verdict matched fix round 1's (10 legal; 7 `championsLegal: false` — Choice Band, Choice Specs, Assault Vest, and all four terrain seeds) — no legality changed, only the file's treatment of the failures did. Regulation used for the new marker is **M-B**, read fresh from `reference/regulation.md`'s stamp block, the still-active regulation as of this check (the vendored dex data has not rolled over to M-C yet). Added the availability marker `*(not in the Champions pool as of M-B, verified 2026-09-09 — guidance holds for when it returns)*` to the marker-definition block near the top as a third axis, orthogonal to the pre-existing scope marker and to `vgc-format.md`'s sourcing-strength tags — stated explicitly that a claim can carry one from each axis and that guidance is never deleted for current unavailability. Added a standing note under "Items by role" pointing at `legal --item` and the `vgc-regulation-transition` skill as the required post-rollover re-check. Reworded fix round 1's "did not survive the sweep" framing (footnote 1, the Assault-Vest/terrain-seed call-out, and the Examples-policy closing paragraph) from "removed/excluded" to "marked unavailable, guidance kept." Fix round 1's four corrections were left untouched; no BP value or ability verdict was changed. `npm test` — 318/318, unchanged. | User correction on fix round 1's controller ruling |
| 2026-09-09 | Cross-file cleanup ahead of `vgc-team-building`'s renumbering from 8 to 10 steps. Converted both cross-file step-number citations ("step 6" in the header pointer and in the Created changelog row) to "the moveset step," which survives renumbering. Corrected the Created row's item-sweep clause, which still said the seven unavailable items were "removed from the recommendation table and footnoted rather than presented as available" — true of that original round, but fix round 2 (above) restored all seven to the table under the availability marker; reworded to "marked unavailable in the recommendation table and kept there with their full guidance" to match the file's current state. Fixed the team-wide-item-budget forward pointer (below "Items by role"), which said `reference/team-evaluation.md`'s distribution gates were "not yet present" — that file now exists and carries them; pointed directly at its Design-constraints section. Also fixed the "Forward references" note: `reference/team-evaluation.md` is now written, so only `reference/format-knowledge.md` remains a genuine forward reference. `npm test` — 318/318, unchanged. | Batch cross-reference cleanup across `archetypes.md`, `speed-control.md`, `roles.md`, `team-evaluation.md` |
| 2026-09-09 | Task 16 (routing/wiring): fixed the Life Orb row's false pointer — it claimed `reference/mechanics.md` "owns ability interactions" for Magic Guard; verified via `grep -in "magic guard" reference/mechanics.md` that it holds none, and reworded to the same "not yet documented anywhere in this repo, verify live" treatment already used for screens/Intimidate/Friend Guard/Multiscale (fix round 1 above), rather than leaving a dangling pointer to an empty section. Added a lockstep note under the base-power floor recording that `vgc-team-building` and `vgc-team-refining` both restate the ≥80 BP number inline (by design, for skill-time action) and must be updated together with this file if the floor changes. No BP value, item verdict, or ability verdict was changed | `.superpowers/sdd/2026-09-08-teambuilding-philosophy/task-16-brief.md`; `dex legal --ability "Magic Guard"` confirmed it as a real legal Champions ability before naming it as the standard example |
| 2026-09-09 | Framing correction (user instruction, two parts). First: "*(generic VGC — not Champions-verified)* still sounds too negative... The source notes were for general VGC, they weren't ever supposed to be extremely narrowed down to Champions." Removed all 6 instances of the `*(generic VGC — not Champions-verified)*` marker (2 in the definition block, 4 on individual claims: role-before-moveset-before-spread ordering, "the best defense is a strong offense," the +2-setup-pays-for-its-turn rule, and "you do not need a super-effective answer to everything") without touching the claims themselves. Replaced the removed **Scope** axis with a preamble stating the file applies to Champions unless a note says otherwise. Second instruction: "these champions specific exceptions should be reevaluated on regulation change to see if it's still true." Collapsed **Scope** and **Availability** into one **Champions departure** axis, generalised to cover item-pool, roster, *and* learnset departures — the existing pool-absence instances (Choice Band, Choice Specs, Assault Vest, the four terrain seeds in the Items-by-role table) keep their exact prior wording; a learnset-departure marker shape was added to the definition alongside them. Stated the re-check obligation directly in the axis definition (this file's separate "Standing note — re-check after every rollover" under Items by role is unchanged and still applies). `npm test` — 356/356, unchanged. | User correction: over-marking of ordinary general-VGC provenance, and a request that Champions-departure marks be pinned to and re-checked at each regulation |
| 2026-09-09 | Missing-changelog fix: the prior commit (measuring screens/Friend Guard/Multiscale/stat-stages in `reference/mechanics.md`) rewrote this file's "Damage reduction that is not an item" section intro to point at that new `mechanics.md` section instead of stating the mechanics were "not yet documented anywhere in this repo" — a real content change that landed with no row here, because that task's brief scoped it out of touching this file further. That scope was too tight for a file that logs pointer fixes this small (see the 2026-09-09 "Task 16" row above, which corrected the same kind of dangling-pointer claim for the Life Orb/Magic Guard row). Recorded now: the section's "undocumented" claim became false once the measurements landed; it points at `mechanics.md#damage-reduction-screens-friend-guard-multiscale-and-stat-stages` instead. The Life Orb row's Magic Guard wording is untouched and still correct — Magic Guard blocks Life Orb recoil, which is self-damage the calculator does not model (verified: Life Orb 116-138 → 151-179; `--attacker-ability "Magic Guard"` changes nothing, since the calc only reports damage dealt to the defender), so that one genuinely cannot be settled with this tool and stays as its own documented gap. `npm test` — 371/371, unchanged. | `reference/mechanics.md`'s 2026-09-09 changelog row ("Added 'Damage reduction...' section"); this file's own "Damage reduction that is not an item" section, read directly |
