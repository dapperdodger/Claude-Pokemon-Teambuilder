# Speed control

**The axis, not the archetype.** Speed control is *how a team moves first
when it matters* — the mechanism, independent of which of
`reference/archetypes.md`'s four archetypes (or none of them) a team is
built around. That file covers Tailwind and Trick Room as team-defining
strategies with their own setter counts and failure modes; this file covers
all seven ways a team can win the turn-order fight, including the two
archetypes use, plus the five that any team — Good Stuff included — can
reach for without committing to a field effect at all.

Built on `reference/sources/teambuilding-notes.md`'s "Speed control is
important, often the most important!" section — near-verbatim notes from
masterclass videos by a Pokémon world champion, vendored 2026-09-08 as a
frozen audit trail. That file is generic VGC; this one is localised to
Champions. **Do not edit the source file.** If this file turns out to be
wrong, diff it against that one.

**This file holds judgement and organisation, not facts a tool can settle.**
The Speed multipliers and Trick Room's priority already live in
`reference/mechanics.md` — this file links to them rather than restating
them, because a second copy of a number is a second place for it to go stale.
Every species, move, and ability named below was run through
`node tools/dex/cli.js` on 2026-09-09.

**Forward references.** This file links `reference/roles.md`,
`reference/team-evaluation.md`, and the generated
`reference/format-knowledge.md`. They are siblings created later in the same
piece of work; a link that does not resolve yet means "not written yet," not
"wrong path" (same convention `reference/archetypes.md` uses).

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
  `node tools/meta/cli.js usage` before leaning on it. Written by calendar
  month rather than by regulation code, because the regulation active while
  this file was written (M-B) ends the same day this file was created and a
  month-stamp does not need updating at every rollover the way a regulation
  name would.

## Contents

- [Why this comes first](#why-this-comes-first)
- [The seven forms](#the-seven-forms)
  - [Priority moves](#priority-moves)
  - [Paralysis](#paralysis)
  - [Speed-lowering moves](#speed-lowering-moves)
  - [Raw Speed](#raw-speed)
- [Choosing between them](#choosing-between-them)
- [Backup when the setter is removed](#backup-when-the-setter-is-removed)
- [Where the numbers live](#where-the-numbers-live)
- [Changelog](#changelog)

## Why this comes first

The source ranks speed control above the other axes for two separable
reasons, and both survive translation to Champions untouched:

- **Knocking out an opponent's Pokémon before it can act at all is one of
  the strongest results available in a doubles turn.** A dead Pokémon has no
  counterplay — no chance to attack back, no chance for its own move to
  matter that turn.
- **Moving first also matters below the KO threshold, by reducing exposure
  to bad luck.** A move that could flinch, miss, or inflict a disabling
  status only gets the chance to do any of that if its user is still around
  and un-disabled when the turn resolves. Acting first removes an entire
  category of ways a turn can go wrong for you.

**The qualifier the source states matters as much as the ranking: this is
*often* the most important axis and a common starting point for a build —
not a mandatory centrepiece.** Every team needs an answer to "how does this
team move first when it needs to," but that answer does not have to be the
thing the team is built around. `reference/archetypes.md`'s Good Stuff
archetype makes exactly this point from the other direction: no field effect
is required to go up for a Good Stuff team to function, but "no required
setter" is not "no speed-control plan" — the team still has to answer the
question, just without committing a slot to owning it outright.

**Which of the seven forms is worth a given slot also depends on the role
that slot is filling** — a dedicated support Pokémon and a wallbreaker do
not weigh a Speed investment the same way. See `reference/roles.md` (not
yet written) for that split.

## The seven forms

| Form | Mechanism | What it costs you |
|---|---|---|
| Priority moves | A fixed priority bracket above 0 acts before normal-priority moves regardless of Speed, for that one move only | Usually low, fixed base power in exchange for the guarantee; the guarantee itself can be switched off, and it only ever covers the single move used |
| Items — Choice Scarf | Boosts the holder's Speed by a fixed multiplier (`reference/mechanics.md`, "Speed calculation") | One Item Clause slot spent here instead of on a bulk or damage item; the Choice family locks its holder into the first move used until it switches out, so the Speed gain is bought with move flexibility |
| Paralysis | Cuts the target's Speed by a fixed fraction, applied to *their* Pokémon rather than boosting yours (`reference/mechanics.md`, "Speed calculation") | Has to land first — via a status move or a damaging move's secondary chance — so it is never guaranteed; once it lands it persists until cured, unlike a stat-stage drop |
| Abilities — Chlorophyll, Swift Swim | Multiplies the holder's Speed while the matching weather (Sun / Rain) is active | Entirely conditional on that weather being up; gone the instant it lapses or the opponent overwrites it — full treatment in `reference/archetypes.md`'s Weather section |
| Speed-lowering moves — Icy Wind, Cotton Spore | Drops the target's Speed by a stat stage instead of raising yours | A stat stage, not a guarantee — a large enough Speed gap survives it, it has to land, and it clears the instant the target switches out |
| Turn-order changers — Trick Room, Tailwind | Field-wide effects that change turn order itself: Tailwind raises Speed side-wide for a fixed window, Trick Room reverses the Speed comparison entirely (`reference/mechanics.md`, "Speed calculation" and "Priority & turn order") | The full requirements and failure modes are archetype-level — `reference/archetypes.md`'s Tailwind and Trick Room sections — including that the two conflict with each other; see [Choosing between them](#choosing-between-them) |
| Raw Speed | Base Speed plus invested Stat Points, no item/ability/move/field effect required | Locked at registration with everything else about the set; only relative to the field, not absolute; and it actively backfires under an opposing Trick Room |

### Priority moves

Fake Out is the standard Champions doubles example: 40 base power with
priority (verified via `dex move`). It illustrates the whole category's
shape, not just its own case:

- **It buys one turn, not a state.** Fake Out specifically only works on a
  Pokémon's first turn on the field — it fails if the user was already out
  last turn — so the user needs a second job for the rest of the game. This
  is the same requirement `reference/archetypes.md` states for Fake Out
  support on a Tailwind or Trick Room setup team: the slot is not paid for
  by one priority move alone.
- **Priority can be blocked outright.** Armor Tail (Farigiraf's ability)
  blocks any priority-boosted move against its holder *and its ally*
  (`reference/mechanics.md`, "Priority & turn order") — a priority-dependent
  setup plan is not unconditional, and the same file's "How it fails" list
  for Trick Room already flags this cutting both ways.
- **As a class, priority moves trade power for the guarantee.** A fixed,
  usually modest base power is the standard price of a move that does not
  care what either side's Speed stat says.

### Paralysis

**Do not assert a full-paralysis percentage.** `reference/mechanics.md`
records that sources disagree on the chance of full paralysis (being unable
to act at all that turn) and vouches only for the Speed-cutting multiplier
itself — see that file's "Speed calculation" section for the actual numbers
on both. That uncertainty is carried forward here unresolved, not narrowed
by a second guess.

What is settled, and what it means as a build tool:

- **It has to land first.** Either through a status move — Thunder Wave,
  Nuzzle, or Glare (all verified via `dex move`) — or a secondary chance on
  a damaging move — Body Slam or Discharge (also verified) — so paralysis
  depends on that move's own accuracy or proc chance. It is never a
  guarantee the way a fixed-priority move or a field effect is.
- **Once it lands, it is more durable than a stat drop, not less.** Paralysis
  is a status condition, not a stat stage: it stays on the target until
  cured (a Persim/Lum Berry, a cleric move, or Rest) rather than clearing the
  moment the target switches out, which is the opposite behaviour from
  [Speed-lowering moves](#speed-lowering-moves) below.
- **It does not stack with the field effects.** Paralysis is the target's
  own status, independent of Tailwind or Trick Room being up on either side.
- *(generic VGC — not Champions-verified)* Electric-types cannot be
  paralyzed by any method, mainline-series-wide since it became a
  type-based status immunity — the same shape as Fire-types and burn, or
  Poison/Steel-types and poison. This is not re-verified against Champions'
  specific implementation in this session; treat an Electric-type target as
  a hole in a paralysis-based plan until confirmed otherwise.
- **A spread paralysis move can catch your own side.** `reference/
  archetypes.md`'s Tailwind section already documents the general doubles
  trap that a spread move hits an ally too unless immune or protected
  (using Earthquake as the example); Discharge is the same shape applied to
  a paralysis-inducing move. Check the target before clicking it.

### Speed-lowering moves

Icy Wind (55 base power, Ice, a secondary Speed-drop effect) and Cotton
Spore (pure status, Grass) are the source's own examples and both verified
via `dex move` as legal, spread (`isSpread: true` in the vendored data)
moves.

- **A stat stage, not a fixed multiplier.** Unlike Choice Scarf's or
  paralysis's flat multipliers (`reference/mechanics.md`), a Speed drop from
  these moves is relative to the target's own stat — a large enough
  pre-existing Speed gap survives it untouched.
- **It clears on switch, unlike paralysis.** Stat stages reset when the
  affected Pokémon leaves the field, so the effect buys at most the turns
  before the opponent rotates the slowed Pokémon out — it is not a durable
  removal of Speed the way landing paralysis is.
- **It still has to land.** Icy Wind's Speed drop is a secondary effect on
  an attack that can miss or be avoided by immunity/Protect; Cotton Spore is
  a status move with the same dependency.
- **Spread cuts both ways here too.** Hitting both opposing Pokémon's Speed
  in one move is a real doubles upside unique to this form (paralysis and
  Choice Scarf only ever affect one target at a time), but a damaging spread
  move still takes the 0.75× doubles spread penalty documented in
  `reference/pitfalls.md` — that multiplier is not re-derived here.

### Raw Speed

Verified Champions examples of the source's own "really fast Pokémon" form —
Aerodactyl (base 130 Speed) and Dragapult (base 142 Speed), both confirmed
via `dex mon` — illustrate the mechanism; the cost is structural, not
species-specific:

- **It is locked at registration, along with everything else about the set**
  (`CLAUDE.md`). The Stat Points that decide whether a Pokémon wins a given
  Speed comparison are committed before the opponent's team, or even the
  regulation's actual Speed tiers for the session, are fully known. There is
  no adjusting it mid-tournament the way a player can choose whether to set
  Tailwind this turn or not.
- **It is relative, not absolute — and every other form on this table exists
  specifically to beat it for less investment.** A Pokémon built to outrun
  the current fast tier is still outrun by anything faster than that tier,
  and a Scarf, a single paralysis proc, or an opposing Tailwind can each
  convert what looked like a Speed win back into a loss without the raw
  stat changing at all.
- **It actively backfires under Trick Room.** The faster a Pokémon's raw
  Speed, the further back in turn order Trick Room sends it — the same
  investment that wins the Speed race outside the room loses it hardest
  inside one.
- **It costs Stat Points that did not go to bulk or power.** The same SP
  budget spent winning a Speed comparison is SP not spent surviving a hit or
  securing a KO — see `reference/team-evaluation.md` (not yet written) for
  the fuller inherent-vs-relative-strength trade-off this sits inside.

## Choosing between them

**Some forms compose.** Priority moves care about none of the others — Fake
Out works identically whether your side is under Tailwind, under Trick Room,
or under neither, which is exactly why it recurs as setup support for both
archetypes in `reference/archetypes.md`. Raw Speed and Tailwind compose in
the direction that matters most: a team that is already reasonably fast on
its own becomes overwhelming for the fixed window Tailwind buys, and —
unlike a team that was slow everywhere and depended entirely on that
window — it degrades gracefully rather than collapsing once Tailwind lapses
or the setter is gone.

**Tailwind and Trick Room on the same team is a real tension, not a free
hedge.** Tailwind raises your side's Speed; Trick Room reverses which side
of the Speed comparison goes first (`reference/mechanics.md`). Set both in
the same game and Trick Room turns your own Tailwind-boosted Pokémon into
the *last* to act on your own side — the two effects actively fight each
other rather than stacking.
Carrying both setters on one roster is not "covered for both game plans" by
default: the team has to decide, per game, which one it is actually running,
and whichever way it decides, the unused setter and its dedicated support
(a Fake Out user, a redirector) sit dead weight for that game. That is a
real slot cost, and it belongs in the build-time accounting, not discovered
at Team Preview.

## Backup when the setter is removed

This is the question `reference/vgc-team-audit`'s Speed-and-speed-control
step asks directly, so it needs to be concrete enough to check against an
actual six, not just stated as a principle.

**A team with exactly one source of speed control and no fallback has a
single point of failure.** If the one Tailwind or Trick Room setter is
knocked out or Taunted before it acts, and nothing else on the team answers
the turn-order question, the team's entire plan for that game is gone —
not weakened, gone.

What counts as a real backup (any one is sufficient; more than one is
better, priced as insurance rather than as extra power, same as
`reference/archetypes.md` treats a second setter):

1. **A second setter for the same effect.** `reference/archetypes.md`'s own
   guidance on how many to run — usually one for Tailwind, since it is
   already an upgrade to attackers that function on their own; usually two
   for hard Trick Room, since its attackers do not function without the
   room and losing the only setter removes the plan rather than merely
   downgrading it.
2. **Setup support that buys the setter a second attempt**, rather than
   just the one turn it takes to set the effect the first time — a Fake Out
   user or a redirector (Follow Me / Rage Powder) that lets the same setter
   survive to try again the following turn.
3. **A fallback plan that does not depend on the field effect existing at
   all** — attackers with enough raw Speed, their own priority, or their
   own Choice Scarf to keep functioning if the window never opens. This is
   the same property that makes a Good Stuff team resilient by construction
   (`reference/archetypes.md`), and any archetype can buy a piece of it.

**What is not a backup:** a second copy of the same setup on a Pokémon that
dies to the same thing the first one dies to — same 4× weakness, same low
bulk, same lack of a way to survive the opponent's lead. Redundancy that
shares its predecessor's single point of failure is not redundancy.

**The audit question, stated so it is directly checkable against a real
six:** *if this setter is removed or Taunted on turn 1, what does the team
do instead on turn 1, and does that still lead somewhere?* If the honest
answer is "nothing changes, the plan is just gone," that is a real gap
regardless of how strong the rest of the six are individually.

## Where the numbers live

This file states no Speed multiplier and no priority value directly — the
numbers live elsewhere, and drift gets fixed there:

- **`reference/mechanics.md`** — Choice Scarf's Speed multiplier, Tailwind's
  multiplier and duration, paralysis's Speed multiplier (and the unresolved
  full-paralysis-chance dispute), and Trick Room's priority value plus its
  turn-order reversal. If one of these numbers looks wrong, correct it there
  with its own changelog row — never by adding a second, possibly-diverging
  copy in this file.
- **`reference/format-knowledge.md`** (generated by a later task in this
  same body of work; not yet present) — where the current meta's Speed tiers
  actually sit: what raw Speed number counts as "fast enough" this
  regulation, and roughly how much of the field is running Scarf. A link
  that does not resolve yet means "not built yet," not "wrong path."
- **`tools/damage-calc/cli.js` and `tools/damage-calc/optimize-bulk-cli.js`**
  — for an actual breakpoint against a named threat, under a named field
  state (Tailwind up, Trick Room up, paralyzed, Scarf'd). Compute it; don't
  estimate it (`CLAUDE.md`).

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-09 | Created. The repo had the Speed modifiers in `mechanics.md` and no strategy layer anywhere covering speed control as a build axis — `vgc-team-building` step 3 and `vgc-team-audit`'s speed step both referenced it without a target. Covers why speed control is ranked first (with the source's own "not mandatory" qualifier), all seven forms from the source with a cost for each, which forms compose vs. conflict (Tailwind/Trick Room named explicitly per the source), the backup-when-the-setter-is-removed audit question, and pointers to where the actual numbers live. Confirmed via `grep` that `mechanics.md` already carries Choice Scarf ×1.5, Tailwind ×2/4-turn, paralysis ×0.5, and Trick Room's -7 priority — no mechanic restated here, nothing added to `mechanics.md`. Every species, move, and item named was verified via `tools/dex/cli.js` on 2026-09-09; none failed. One generic-VGC claim (Electric-types immune to paralysis) is flagged unverified against Champions specifically rather than asserted or dropped. | `reference/sources/teambuilding-notes.md` ("Speed control is important, often the most important!"), vendored from masterclass notes by a Pokémon world champion; `.superpowers/sdd/2026-09-08-teambuilding-philosophy/task-3-brief.md` |
