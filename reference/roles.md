# Roles: what a Pokémon is *for*, before what it runs

**The order the whole file argues for:** decide the role, then the moveset,
then the SP spread — never the reverse. Read at `vgc-team-building` step 6
(fill each slot's moveset) and by `vgc-team-refining`'s role-fit check, which
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
M-C replaces it (`reference/regulation.md`). The item-legality facts below —
including two that surprised the sweep — come from the vendored M-B item
pool. Nothing here should be read as a permanent Champions rule; re-run the
`legal --item` checks after the M-C re-vendor before trusting this table
past today.

**Forward references.** This file links `reference/archetypes.md`,
`reference/speed-control.md`, `reference/methodology.md`,
`reference/mechanics.md`, `reference/team-evaluation.md` and the generated
`reference/format-knowledge.md`. The last two are siblings created later in
the same piece of work; a link that does not resolve yet means "not written
yet," not "wrong path" (same convention `reference/archetypes.md` and
`reference/speed-control.md` use).

**Two markers used throughout, inherited from `reference/archetypes.md`:**

- *(generic VGC — not Champions-verified)* — carried from the masterclass
  notes. True of VGC doubles broadly; **not** separately verified against
  Champions' roster or its current meta. Kept and marked rather than dropped,
  because dropping is distilling. **This is a scope marker, not a confidence
  marker** — it says *where a claim came from* (generic VGC vs. this file's
  own Champions-specific verification), which is a different question from
  *how well sourced* a claim is. It is written in italic parentheses,
  deliberately distinct from `reference/vgc-format.md`'s `[official]` /
  `[consensus]` / `[unresolved]` bracket tags (see that file's ["Confidence
  marking"](vgc-format.md#confidence-marking) section) so the two schemes are
  never mistaken for tiers of the same axis. A claim can legitimately carry
  both — a generic-VGC heuristic can also be `[consensus]` among third-party
  VGC sources while being unverified against Champions specifically.
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
moveset (and the matchups it has to survive) choose the SP spread**
*(generic VGC — not Champions-verified)*. Doing
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
stats as an end in themselves** *(generic VGC — not Champions-verified)*.
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
  has to pay for the turn it cost** *(generic VGC — not Champions-verified)*.
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

## Coverage without over-fixating

**You do not need a super-effective answer to everything** *(generic VGC —
not Champions-verified)*. Resistances matter, but half of a large number can
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
and what Champions currently ships** — see the footnotes. `reference/
mechanics.md` owns item mechanics generally (including exactly what Focus
Sash blocks); this table carries only the role-fit consequence.

*(The source also states a team-wide budget — "most teams run 1-3 offensive
items, format specific, i.e. fewer when megas are in." That is a constraint
on the whole team's item distribution, not a single Pokémon's role, so it
belongs in `reference/team-evaluation.md`'s team-wide distribution gates
(written later in this same body of work) rather than here — not yet present
as of this file's writing.)*

| Item class | Best on | Watch out for |
|---|---|---|
| Choice items[^1] | A Pokémon that wants the guarantee of ×1.5 Speed and is fine committing to one move per switch-in; spread moves pair well since the lock-in cost doesn't change with the number of targets. | Locked into the first move used until switching out. **A Choice item should not also carry Protect** — Protect used once locks the holder into Protect for the rest of its time on the field, which is usually a worse trade than the flexibility Protect exists to buy in the first place. |
| Life Orb | A Pokémon that wants every attack boosted rather than one item-matched type. | Recoil adds up over a game; **some abilities ignore it** — `reference/mechanics.md` owns ability interactions, check there before assuming a given holder takes the recoil. |
| Type-boosting items — Mystic Water, Charcoal, and the rest of the family (all verified Champions-legal) | A Pokémon running several moves of one type — the source's own example is Aqua Jet (40 BP, priority) and Wave Crash (120 BP) on the same Water attacker, both verified — or one that mostly clicks a single move, such as Torkoal running Charcoal for its own signature Eruption (150 BP spread Fire; Torkoal's learnset was re-verified for this file). | Narrower than Life Orb — it does nothing for a move of any other type, so it is a weaker pick on a Pokémon whose moveset is genuinely mixed-type. |
| Focus Sash | A frail Pokémon whose whole job is surviving to take exactly one action. | It is a one-action item, not a one-turn-of-safety item — the gap between those two is real and situational. Multi-hit-move mechanics: `reference/mechanics.md`'s Item mechanics section. Double-targeting risk: `reference/methodology.md`'s Focus-Sash-support case. Don't re-derive either here. |
| Super-effective-reducing berries — Chople, Occa, Shuca, and the rest of the family (all verified Champions-legal) | A Pokémon with one predictable, high-value weakness it expects to be attacked into. | Consumed on the first qualifying hit, and only helps against the one type it's keyed to — guessing the wrong type wastes the slot entirely, and it does nothing against any other attack. |
| Sitrus Berry | See the Sitrus-vs-Leftovers comparison below. | One-time use, and only triggers once the holder is already below half HP — it does not prevent the hit that brought it there. |
| Leftovers | See the Sitrus-vs-Leftovers comparison below. | Passive and slow relative to Sitrus — see below for the actual math. |

[^1]: The source's "Choice items" bullet describes the class generically as
"1.5x damage or speed, but stuck in move" — generic VGC has all three members
(Band, Specs, Scarf). **The sweep found only Choice Scarf in the Champions
item pool; Choice Band and Choice Specs are both `championsLegal: false`**
(verified 2026-09-09 via `dex legal --item`, checked directly against the
vendored item list rather than inferred). This is not a vendoring gap in the
sense a missing species is — the tool's own note is explicit that a `false`
here means genuinely unavailable, not merely un-vendored — but the pool is
per-regulation and M-C launches the same day this file was written, so
re-check before assuming this stays true. **Practically: in current
Champions, "a Choice item" means Choice Scarf specifically** — the ×1.5
*damage* half of the source's description does not currently have a legal
item behind it at all.

**Two items named in the source did not survive the sweep and are not in the
table above:**

- **Assault Vest** — the source lists it under "Defensive items" alongside
  Focus Sash, explicitly noting it "cannot run status moves." Verified
  2026-09-09 via `dex legal --item "Assault Vest"`: `championsLegal: false`.
  It is absent from the vendored Champions item pool entirely, not merely
  missing a vendoring update — the same tool call that confirmed Focus Sash,
  Life Orb, Leftovers and Sitrus Berry are all legal returned `false`
  specifically and only for this one of the five items the task brief named.
  Re-check after the M-C re-vendor; this file records the source named it and
  the correction it warrants, exactly as `reference/archetypes.md`'s
  substitution-footnote convention asks.
- **Terrain seeds** (Electric Seed, Grassy Seed, Misty Seed, Psychic Seed) —
  the source lists "Seeds (activate on terrain)" as a Defensive-items damage
  reduction option. **All four checked came back `championsLegal: false`.**
  No terrain seed currently exists in the Champions item pool, so the entire
  item class the source describes has no legal member right now. If a
  terrain-seed plan looks attractive from generic-VGC knowledge, re-run this
  check before building around it — the answer may simply be "not yet, wait
  for a later regulation."

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
abilities, and setup moves. **The underlying mechanics of screens, Intimidate,
Friend Guard and Multiscale — exact duration, reduction fraction, and
interaction edge cases — are not yet documented anywhere in this repo.**
`reference/mechanics.md` was checked directly and holds none of them (it does
document Focus Sash's multi-hit interaction, cited where that comes up
above). Verify any specific number live (Bulbapedia/Serebii) before relying
on it; this section states only why each belongs on a role checklist, at the
level of what it buys the role, not the numbers behind it.

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
  reduces damage the holder itself takes, but only from full HP. The exact
  reduction fraction for each is not yet documented in this repo — verify
  live before relying on a specific number.
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
4. **Examples that are not Champions-legal get replaced or removed**, the
   original stays in `reference/sources/`, and the correction is recorded as
   a footnote or a called-out paragraph — see the Items-by-role section above
   for both forms this took in this file.

**How this file was verified.** Every move, item and ability named above was
run through `node tools/dex/cli.js` on 2026-09-09: `move` for base power and
type, `legal --item` for item legality, `legal --ability` for ability
legality, and `learnset --move` for the one move-on-species claim this file
makes (Torkoal / Eruption). The one species named, Torkoal, was independently
confirmed present in the Champions roster via `dex mon`.

**Names that failed the sweep and therefore do not appear as recommendations
above:** Choice Band, Choice Specs, Assault Vest, Electric Seed, Grassy Seed,
Misty Seed and Psychic Seed are all real items the source names or implies
that are **not** in the Champions item pool as verified this session — see
the Items-by-role footnotes above for the detail on each. None of these are
missing-from-vendor cases the way an unreleased species would be; the tool's
own item-legality note is explicit that a `false` here means genuinely
unavailable now. Re-run the checks after the M-C re-vendor rather than
assuming this holds past the regulation this file was written in.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-09 | Created. The repo had no role framework at all — `vgc-team-building` step 6 and `vgc-team-refining`'s role-fit check both needed a target and found none. Covers the role-before-moveset-before-spread ordering, the Offensive/Defensive moveset templates, offensive capability (including the +2-setup-pays-for-its-turn rule), the ≥80 BP (preferably ≥90) base-power floor with Icy Wind (55 BP) vs. Blizzard (110 BP) as the real-number worked example, coverage without over-fixating, an items-by-role table, non-item damage reduction, and a two-sentence pointer to `methodology.md` for judging support picks rather than restating it. The item sweep found four items the source names or implies (Assault Vest, Choice Band, Choice Specs, all four terrain seeds) that are not in the Champions item pool at all — removed from the recommendation table and footnoted rather than presented as available, per the task's own verification requirement. Every move, item and ability verified via `tools/dex/cli.js`; none of the failures were vendoring gaps — all were `championsLegal: false` against the current M-B item pool. `npm test` — 318/318, unchanged. | `reference/sources/teambuilding-notes.md` ("Choosing the right moveset / Roles") and `reference/sources/teambuilding-notes-advanced.md` ("Offensive Capabilities", "Offensive Coverage", "Offensive Items", "Defensive Capabilites", "Defensive items", "Other ways to reduce damage"), both vendored from masterclass notes by a Pokémon world champion; `.superpowers/sdd/2026-09-08-teambuilding-philosophy/task-4-brief.md` |
| 2026-09-09 | Fix round 1 (review: spec ❌, 3 Important + 1 Minor). (1) Added a one-line provenance note near "Items by role" recording that the source's team-wide "1-3 offensive items" budget belongs in `reference/team-evaluation.md` (Task 5, not yet written) rather than here — a pointer, not a restated rule, per controller ruling. (2) "Damage reduction that is not an item" falsely claimed `reference/mechanics.md` "owns the mechanics" of screens/Intimidate/Friend Guard/Multiscale; verified directly that it holds none of them, and reworded both the section intro and the Friend-Guard/Multiscale bullet to say those mechanics are not yet documented anywhere in this repo and must be verified live, instead of sending the reader to an empty file. (3) The Focus Sash table cell restated two specific mechanics (blocks only the first hit of a multi-hit move; does nothing against double-targeting) and then said not to re-derive them — trimmed to the role-level consequence (a one-action item) plus two corrected pointers: the multi-hit fact to `reference/mechanics.md` (confirmed present, line 86) and the double-targeting fact to `reference/methodology.md` (confirmed present, line 178) rather than both going to `mechanics.md`, which only has the first. (4) Attached the `*(generic VGC — not Champions-verified)*` scope marker, which was defined but never used, to the four generic-VGC design-judgment claims the review named: role-determines-moveset ordering, "+2 is the same as attacking twice," "the best defense is a strong offense," and "you do not need a super-effective answer to everything" — none of the tool-verified facts (BP values, item/ability legality) were touched. `npm test` — 318/318, unchanged. | Code review of this file, round 1 |
