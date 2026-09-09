# Team archetypes and starting points

The strategy layer: **what to build, before deciding who is on it.** Read at
steps 1 and 4 of the `vgc-team-building` skill — the checklist says "agree the
archetype with the user," and this is the file that says what the archetypes
are, what each one requires, and how each one fails.

Built on `reference/sources/teambuilding-notes.md` and
`reference/sources/teambuilding-notes-advanced.md` — near-verbatim notes from
masterclass videos by a Pokémon world champion, vendored 2026-09-08 as a
frozen audit trail. Those files are generic VGC; this one is localised to
Champions. **Do not edit the source files.** If this file turns out to be
wrong, diff it against them.

**This file holds judgement, not facts a tool can settle.** Nothing here
overrides a CLI. Type matchups, learnsets, Mega abilities and item legality
still come from `tools/dex/cli.js` at the moment they are stated, exactly as
`CLAUDE.md`'s lookup table requires. Every species, move and ability named
below was run through that CLI on 2026-09-08 — see
[Examples policy](#examples-policy).

**Forward references.** This file links `reference/speed-control.md`,
`reference/roles.md`, `reference/team-evaluation.md` and the generated
`reference/format-knowledge.md`. They are siblings created later in the same
piece of work; a link that does not resolve yet means "not written yet," not
"wrong path."

**Three marking schemes apply to claims in this file, and they are
orthogonal axes — a single claim can legitimately carry one mark from each
at once, and none of the three ranks or supersedes another:**

- **Sourcing strength** — `reference/vgc-format.md`'s `[official]` /
  `[consensus]` / `[unresolved]` bracket tags (see that file's ["Confidence
  marking"](vgc-format.md#confidence-marking) section). Answers *how well
  established* a claim is.
- **Scope** — *(generic VGC — not Champions-verified)*. Carried from the
  masterclass notes; true of VGC doubles broadly but **not** separately
  verified against Champions' roster or its current meta. Kept and marked
  rather than dropped, because dropping is distilling. Answers *where a
  claim came from* — generic VGC vs. this file's own Champions-specific
  verification. It is written in italic parentheses, deliberately distinct
  from the bracket tags above so the two schemes are never mistaken for
  tiers of the same axis.
- **Availability** — `*(not in the Champions pool as of <regulation id>,
  verified <date> — guidance holds for when it returns)*`. Answers *is the
  thing legal to use right now*. Attaches only to a species, item, or
  ability this file actually ran through `node tools/dex/cli.js mon` /
  `legal --item` / `legal --ability` and confirmed absent or
  `championsLegal: false` — never applied from recall. **Guidance is never
  deleted because the species, item, or ability it describes is currently
  unavailable.** The roster and item pool are regulation-specific, both grow
  and shrink at each transition, and revert; what the source says a role,
  item, or strategy is *for* stays true for the entire time the thing it
  names happens to be sitting outside the current pool. See
  [Examples policy](#examples-policy) below for where this plays out for
  this file's rejected-name sweep.

A claim can be *(generic VGC — not Champions-verified)*, `[consensus]` among
third-party sources, **and** carry an availability mark, all at the same
time — each axis is answering a different question, so none of them
substitutes for the others.

A fourth, narrower marker also appears below, answering a different question
again (current usage share, not sourcing, scope, or legality):

- `(as of 2026-09 — confirm with meta usage)` — the claim rests on what is
  currently played, and what is currently played changes. Re-check with
  `node tools/meta/cli.js usage` before leaning on it.

## Contents

- [Three starting points](#three-starting-points)
- [Choosing a strong starting point](#choosing-a-strong-starting-point)
- [The four archetypes](#the-four-archetypes)
  - [Tailwind](#tailwind)
  - [Trick Room](#trick-room)
  - [Good Stuff / Balance](#good-stuff--balance)
  - [Weather](#weather)
- [The weather whole-team rule](#the-weather-whole-team-rule)
- [Building around a specific Pokémon](#building-around-a-specific-pokémon)
- [Megas as a centrepiece](#megas-as-a-centrepiece)
- [Examples policy](#examples-policy)
- [Changelog](#changelog)

## Three starting points

A team build starts from one of three places, and **each implies a different
first question.** Establishing which one you are in is step 1, before any
lookup — asking "what does this piece struggle against" of someone who came in
with a strategy, or "what does this strategy require" of someone who came in
with a favourite Pokémon, wastes the first exchange.

| Starting point | Looks like | The first question |
|---|---|---|
| **A strategy** | Trick Room, a weather, Tailwind | What does this strategy *require*, and can the roster supply it? |
| **A specific Pokémon or core** | a Mega to build around; a two- or three-Pokémon core | What does this piece do well, and where does it struggle? |
| **An existing team** | your own previous build, or one lifted from someone else | Why does this team work, and which parts are load-bearing? |

**Strategy first** → [The four archetypes](#the-four-archetypes). The
archetype is a set of requirements, not a vibe; read what it needs before
agreeing to it.

**A specific Pokémon first** → [Building around a specific
Pokémon](#building-around-a-specific-pokémon). This is the repo's second
standing goal, not a lesser version of the first: never answer "build around
my favourite" with the top-usage squad (`CLAUDE.md`).

**An existing team is a legitimate and expected third option.** Using a team
someone else built is normal practice, not a shortcut and not a defect — and
**changing it is equally normal.** Swap moves, redo the spread, replace a
species outright if the original does not fit how you actually play. A lifted
team is a starting point, not a contract. The one thing worth doing before
changing it is asking why the original worked: a piece that looks like filler
is sometimes the reason the rest functions.

Two repo-specific consequences when the starting point is an existing team:

- **`teams/` is read-only unless the user explicitly says to write**
  (`CLAUDE.md`). Working a revision out in chat is not permission to persist
  it, and an existing team file is a historical record that stays wrong on
  purpose.
- **When a saved team is genuinely being revised, the six species decide where
  it goes** — same six, edit in place with a changelog row; any species
  swapped, a new `-v2.md` file. That rule is in `CLAUDE.md`; this file does not
  restate its detail.

The three are not exclusive, and a build often moves between them: a favourite
Pokémon turns out to want Trick Room, so the build becomes an archetype build;
a lifted team gets two slots replaced and becomes your own.

## Choosing a strong starting point

The advanced notes give one criterion — **strong matchups** — and then
immediately split it into two targets that pull in different directions:

1. **Maximise favourable matchups.** Pick the strategy that beats the largest
   slice of what you expect to face. This optimises the *average* result and
   accepts that some fraction of the field is close to unwinnable.
2. **Guarantee you always hold some tool to win with.** Pick so that no
   matchup leaves you with nothing on the table. This optimises the *worst
   case* and accepts a lower ceiling in the matchups you were already winning.

*(The source also asks whether a machine-usable tool exists for looking up
Pokémon by niche — e.g. "a fast pokemon that learns a certain move" — the way
Pokémon Showdown's own lookup does. That question is answered by
`node tools/dex/cli.js find`, built in a later task of this same body of work
— not yet present as of this file's writing.)*

**These are different goals, and the choice belongs to the user, not to the
assistant.** State the trade-off and ask which one is being built for. An
assistant that quietly optimises for the average will keep arguing against the
pick that fixes the user's worst matchup; one that quietly optimises for the
floor will keep watering down the pick that wins the most games. Neither is
wrong — but picking silently is.

One repo-verified input to that choice, worth surfacing rather than assuming:
**ladder is best-of-one and tournament top cut is best-of-three**
(`reference/vgc-format.md`). Bo1 rewards the average — you get one roll of the
matchup dice. Bo3 punishes a hole, because the opponent re-picks their four
after game one and will aim at whatever beat them; a Bo3 team needs a viable
*second* four. So "which target" is partly "which venue," and that is a
question to ask, not to infer.

## The four archetypes

Four archetypes, each answering the same four questions. The taxonomy is a set
of starting strategies, **not a partition** — a team can run rain *and*
Tailwind, and Good Stuff is defined partly by refusing to commit to one.

Read the archetype's requirements before agreeing to it. Every one of them has
a slot cost that is easy to underprice at the moment of agreeing and expensive
to discover at slot five.

### Tailwind

**What it needs.** A setter that lives long enough to set it, and attackers
whose damage actually converts the speed advantage into removed Pokémon.
Tailwind's multiplier and duration are in `reference/mechanics.md`, "Speed
calculation" — the archetype-relevant fact is that it is a fixed-length
window, not a permanent state, so the question is always *what happens inside
that window*.

**Saving Tailwind for a later turn is often crucial.** Setting it on turn 1
out of habit spends the window while the opponent still has every answer
available. Holding it until the turn it actually flips a KO race is frequently
the stronger line — and that has a build consequence, not just a play
consequence: **the setter has to have something worth doing on the turns it is
not setting Tailwind.**

**How many setters.** Usually one *(generic VGC — not Champions-verified)*. Tailwind is a side-wide
field effect, so a second setter does not stack — it buys the ability to
re-set after the four turns lapse, and insurance against the first setter
being removed. That is a redundancy purchase, not a power increase; price it
that way. See `reference/speed-control.md` for what to do when the setter is
removed before it acts.

**What kind of attackers.** Strong attackers with spread moves. The
compounding is the point: under Tailwind your whole side moves first, so a
spread move connects with *both* opposing Pokémon before either acts. A slow
turn-order advantage plus a single-target move is a much smaller purchase than
the same advantage plus a spread move. The source's own example is a
high-Attack Ground-type clicking Earthquake — Garchomp learns Earthquake
(verified via `dex learnset`), and Earthquake is a 100 BP spread Ground move
(verified via `dex move`). **Note the doubles cost that comes with it:**
Earthquake hits your own ally too unless the ally is immune or protected, and
every spread move deals 0.75× (`reference/pitfalls.md`, "Doubles-specific
traps" — and the damage CLI already applies that 0.75×; do not re-apply it).

**How it fails.**

- **The setter contributes nothing but Tailwind.** Four turns of doubled Speed
  bought with a roster slot that is dead weight on every other turn is a bad
  trade. Ask what the setter does on turns 2, 3 and 4 — if the answer is
  "Protect," the slot is underpaying.
- **The Fake Out support has the same problem.** Fake Out is a real way to buy
  the setup turn (40 BP, priority — verified via `dex move`), but **the Fake
  Out user must also be able to do more than Fake Out**, for exactly the same
  reason. Fake Out works once per switch-in; the rest of the game still has to
  be paid for.
- **The advantage is cancelled rather than beaten.** The opponent sets their
  own Tailwind and you are back to raw Speed; or Trick Room goes up and your
  doubled Speed becomes a liability rather than an asset.
- **The window lapses with nothing converted.** Four turns of moving first
  that produced no knockouts is four turns of nothing.

### Trick Room

**Scope: this section is about *hard* Trick Room — a team built to operate
inside the room — not about a single Pokémon carrying Trick Room as a fifth
option.** A lone Trick Room carrier on an otherwise fast team is a different
and much narrower thing: a panic button, judged on whether the one or two
turns it buys are worth the moveslot. The requirements below are for the team
whose attackers do not function without the room.

**What it needs.** A way to survive the setting turn. The setter must survive
the turn it sets Trick Room — the move resolves at -7 priority, last
regardless of its Speed, so the setter absorbs the turn's attacks before the
room exists to protect it. Full mechanic in `reference/mechanics.md`,
"Priority & turn order" — do not restate it from recall; that section is the
authority.

The practical consequence is that **setup is a slot cost you pay up front**:

- **Fake Out** — removes one opposing attacker's turn (priority, verified).
- **Redirection** — Follow Me or Rage Powder pulls the targeting off the
  setter. Champions-legal examples, verified 2026-09-08 via `dex learnset`:
  Maushold and Clefable learn Follow Me; Volcarona learns Rage Powder.
  **Rage Powder is a powder move and does nothing to Grass-types or Overcoat
  holders** (`reference/pitfalls.md`) — a redirection-based setup plan that
  ignores this fails outright against a Grass-type lead.
- **Bulk or screens** — the least slot-efficient option, but it does not
  depend on the opponent's typing.

**How many setters.** Usually two, sometimes one depending on the meta
*(generic VGC — not Champions-verified)* `(as of 2026-09 — confirm with meta usage)`. This is the
opposite call from Tailwind's one, and for a structural reason: Tailwind
upgrades attackers that already function, so losing the setter downgrades the
plan. Hard Trick Room's attackers are individually outsped by the field, so
losing the only setter does not downgrade the plan — it removes it. Two
setters also mean the room can be re-set when it lapses.

**What kind of attackers.** Slow, strong, with spread moves. Verified
Champions examples where the mechanic is durable rather than meta-dependent:
Torkoal at base 20 Speed with Eruption (150 BP spread Fire); Mega Camerupt at
base 20 Speed; Mega Abomasnow at base 30 Speed. Two cautions:

- **"Slow" is relative to the field, not an absolute.** A base-70 attacker is
  genuinely fast under Trick Room when the opposing team sits at base 100+.
  Check the actual tiers rather than assuming a number is low enough —
  `reference/speed-control.md` and the generated
  `reference/format-knowledge.md` hold where the tiers currently sit.
- **Slow relative to your *own* side matters too.** Inside the room your own
  Pokémon are also reordered against each other.

**How it fails.**

- **No plan for getting the sweeper in after the room is up.** The setter is
  usually not the sweeper, so the sweeper has to arrive — and the turn spent
  switching it in is spent out of a finite window. Plan the *sequence*
  (who leads, who sets, how the attacker arrives) at build time, not at
  Team Preview.
- **The setter dies before it sets.** The -7 priority problem, unsolved.
- **Priority-blocking cuts both ways.** Armor Tail (Farigiraf's ability;
  Farigiraf learns Trick Room, verified) blocks priority-boosted moves against
  its holder *and its ally* — which protects a Trick Room setup, and equally
  blanks *your* Fake-Out-based setup plan when the opponent has it. Details in
  `reference/mechanics.md`.
- **The team cannot play outside the room.** Same failure shape as the weather
  whole-team rule below: if every member is conditional on one field effect,
  one event turns the whole team off.

### Good Stuff / Balance

**What it needs.** Good Pokémon and real synergy — offensive *and* defensive.
Its defining property is that **no field effect has to go up for the team to
function**, which is what makes it flexible: it can play several different
game plans and switch between them mid-series.

That flexibility raises the selection standard rather than lowering it. With
no archetype to justify a pick, **every slot has to justify itself on its own
merits** — see `reference/team-evaluation.md` for the "is this Pokémon good"
rubric, the inherent-vs-relative-strength split, and the defensive-coverage
constraints (no more than two of the same type; a resistance to every type as
a rule of thumb).

**How many setters.** None required — that is the point. But "no required
setter" is not "no speed-control plan." A Good Stuff team still has to answer
how it moves first, whether through raw Speed, items, priority, or a
Speed-lowering move; see `reference/speed-control.md`. Flexibility is not a
licence to skip the question.

**What kind of attackers.** Whatever the synergy demands, which in practice
means a deliberate physical/special mix and deliberate avoidance of stacked
type weaknesses. The archetype's strength is that any four of the six is a
plausible bring, so the six should be chosen to make that true rather than to
make one specific four strong.

**Specific-matchup slots.** Typically **1-2 slots aimed at specific common
matchups** *(generic VGC — not Champions-verified)* `(as of 2026-09 — confirm with meta usage)`. This
is where a dedicated answer to one recurring problem lives, and it is
legitimate — there is a counter to every Pokémon, however strong, and if you
keep losing to one thing, building an answer to it is the correct response
rather than a concession. The slots have to be aimed at the *current* field,
which means a live meta pull, not recall (`vgc-meta-lookup`).

**How it fails.**

- **Six individually good Pokémon with no plan.** The archetype's failure mode
  is that "flexible" degrades into "no game plan against anything in
  particular." Every pick was defensible; the team beats nothing decisively.
- **The tech slots are aimed at yesterday's meta.** A specific-matchup slot is
  the most perishable thing on the roster, and its perishability is invisible
  — it keeps looking like a reasonable pick long after the matchup it answers
  stopped showing up.
- **Synergy asserted rather than checked.** Two Pokémon that appear together
  often are not thereby synergistic (`reference/pitfalls.md`, "Data source
  pitfalls").

### Weather

**What it needs.** A setter, and a plan for the turns when the weather is not
up.

- **Set by ability (most common) or by move** *(generic VGC — not Champions-verified)*
  `(as of 2026-09 — confirm with meta usage)`. An ability
  setter puts the weather up on switch-in for free; a move costs a turn and a
  moveslot, and can be Taunted or simply never get its turn.
- **Weather is overwritable.** An opposing setter switching in replaces yours
  instantly, and their team is built for theirs — so the weather war is not a
  side issue, it is the matchup. Have a plan for playing under *their*
  weather, not only under yours.
- **Bulky Pokémon help, specifically as re-setters.** A setter (or a bulky
  pivot alongside it) that can switch out and back in restores the weather for
  free — but only if it survives to do so. That is the mechanism behind "bulky
  mons help": the re-set is cheap only when the piece providing it is durable.
- **Weather changes damage in both directions.** Rain halves Fire and boosts
  Water ×1.5; Sun halves Water and boosts Fire ×1.5 — and this applies to the
  *opponent's* weather too. Always pass the realistic, exactly-capitalised
  `--weather` flag to the damage CLI; it silently no-ops on a lowercase
  mismatch (`reference/pitfalls.md`, "Weather effects on move power").

**How many setters.** Usually one *(generic VGC — not Champions-verified)* — for the same reason as
Tailwind: weather is a field effect that does not stack. A second setter is
insurance and a re-set, not a stronger effect.

**What kind of attackers.** Depends on the weather. All four sub-types below
are Champions-legal (setters and abilities verified 2026-09-08); which of them
is *good right now* is a meta question this file does not answer
`(as of 2026-09 — confirm with meta usage)`.

**Rain.** **Trends bulkier than the other weathers** *(generic VGC — not Champions-verified)*. Water
STAB at ×1.5 with Fire coverage halved is already a large swing, so rain teams
buy staying power rather than more damage. Drizzle setters in the Champions
roster include Pelipper (Water/Flying) and Politoed (Water) — both verified.
The Speed payoff is Swift Swim; Mega Swampert's ability is *fixed* to Swift
Swim by the Mega forme, which is a durable fact rather than a usage one
(verified via `dex mon`, and see `reference/mechanics.md` on Mega-fixed
abilities).

**Sun.** Usually about **one Chlorophyll abuser** *(generic VGC — not Champions-verified)* — one, not
three. Chlorophyll's Speed doubling is conditional on the sun, so each
additional Chlorophyll body increases how much of the team switches off at
once when the weather changes; that is the whole-team rule below, applied
early. Drought setters in the roster include Torkoal (Fire), Ninetales (Fire),
and Mega Charizard Y, whose Drought is Mega-fixed (all verified). Venusaur is
a verified roster Chlorophyll body — but note its Mega forme's ability is
fixed to Thick Fat, so Mega Venusaur is *not* a Chlorophyll abuser
(verified via `dex mon`; this is exactly the trap `CLAUDE.md` requires the
tool call for).

**Sand.** **The weakest payoff of the four, attached to the sturdiest
setter.** Sand's own benefits are thin next to rain's ×1.5 Water or sun's
×1.5 Fire; what buys sand a slot is the quality of the Pokémon setting it.
Tyranitar (Rock/Dark, Sand Stream, base 100/110/100 bulk behind 134 Attack —
verified) is a real Pokémon on its own terms whether or not the sand does
anything.

**But the sturdy setter itself needs support** — the source says so, and the
tools confirm why. Tyranitar is **base 61 Speed**, and its defensive profile
is one 4× weakness (Fighting) plus six 2× weaknesses (Water, Grass, Ground,
Bug, Steel, Fairy) — seven weaknesses against six resistances and one immunity
(verified: `node tools/dex/cli.js type --vs-mon "Tyranitar"`). A slow Pokémon
with a 4× weakness is a Pokémon that gets to act once. Budget the support —
redirection, Intimidate, a Fighting-resist partner — as part of the cost of
choosing sand, not as an optional extra.

**Snow.** **Earns its place through Aurora Veil or Blizzard**, not through the
weather's own chip effect *(generic VGC — not Champions-verified)*. Aurora Veil is one moveslot that
does what Reflect and Light Screen do together, and it requires the snow to be
up; Blizzard is 110 BP spread Ice (verified via `dex move`). *Unverified
locally:* the commonly-cited perfect-accuracy interaction between Blizzard and
snow is not settled by anything in this repo's vendored data — check a live
source before a plan depends on it.

**Snow is also good counter-weather, because its setters mostly stand alone.**
Snow Warning setters in the roster include Abomasnow / Mega Abomasnow
(Grass/Ice) and Ninetales-Alola (Ice/Fairy, base 109 Speed, learns both Aurora
Veil and Blizzard) — all verified. A setter that is a reasonable Pokémon
without its own weather can be dropped onto a *non*-snow team purely to
overwrite an opposing rain or sun. **Do not over-index on this.** A
counter-weather pick whose only job is cancellation is a slot spent on denial;
it has to be good at something in the games where the opponent brought no
weather at all.

**How it fails.**

- **The weather war is lost.** Their setter switches in, your team is playing
  without the thing it was built around, and their team is not.
- **The setter never gets to act** — Taunted, removed on turn 1, or a
  move-based setter that never finds a free turn.
- **The team cannot play outside the weather.** This one has its own section
  because it is the one hard constraint here.

## The weather whole-team rule

**A weather team must not be six Pokémon that all need the weather, or it
cannot play outside it.**

This is the one hard constraint in this file. Everything above is a heuristic
with real exceptions; this one has a failure mode with no recovery. If every
member's value is conditional on the weather being up, then a *single* event —
an opposing setter switching in, your setter fainting, a move-based set never
getting its turn — turns the entire team off at once. Weather is a field
effect the opponent can take away for free, so a team with no unconditional
members has one point of failure and no fallback behind it.

What compliance actually looks like:

- **Some members must contribute unconditionally.** An attacker whose STAB the
  weather does not boost; a support piece whose action does not care what the
  sky is doing; a defensive pivot that is bulky in any weather. The test is
  simple and worth applying slot by slot: *if the weather is gone on turn 2,
  what is this Pokémon still doing?*
- **The fallback has to be registered, not improvised.** Team Preview shows
  the opponent all six species, in every venue — so an opponent holding a
  counter-weather setter can see the plan and pick into it. And **everything
  except which four you bring is locked at registration**
  (`reference/vgc-format.md`): you cannot add a non-weather answer between
  games. The slot has to be spent during the build or it does not exist.
- **The Bo3 case is sharper.** The opponent re-picks their four after game
  one. A weather team that won game one by having its weather up will meet a
  team selected specifically to take it away in game two.

This rule is also the reason the sun sub-type wants *about one* Chlorophyll
abuser rather than as many as fit, and the reason a counter-weather snow
setter has to be good outside snow. It is the same constraint applied at
different scales.

## Building around a specific Pokémon

**Step 0: know the piece, in three dimensions.** All three are tool calls, not
recall:

- **Does it need speed control?** Base Speed against where the field actually
  sits — `node tools/dex/cli.js mon "<Species>"` for the stats,
  `reference/speed-control.md` for what to do about the answer.
- **What are its type weaknesses and strengths?** One call, whole profile:
  `node tools/dex/cli.js type --vs-mon "<Species>"`. Never from recall, never
  by reasoning from one half of a dual typing, and never as a shell loop over
  the 18 types (`CLAUDE.md`; `reference/pitfalls.md`).
- **Is it physical, special, or support?** This decides which of the team's
  problems are now yours to solve — a special attacker does not care about
  Intimidate, a support piece is not judged on damage at all
  (`reference/methodology.md`). See `reference/roles.md`.

Then the build itself:

- **Build one Pokémon at a time, and be intentional about the order.** Each
  choice constrains the next: the second pick is chosen against the first, the
  third against the pair, and by the fifth the constraints are tight enough to
  do most of the work for you. Filling five slots in one pass produces a list,
  not a team — and it skips exactly the decision points the user is supposed to
  be part of (`reference/methodology.md`, "Team-building is collaborative").
- **Know *why* each addition helps the core piece. Do not just add good
  Pokémon.** Every slot should come with a stated reason: "resists the Ground
  moves that kill the core", "supplies the speed control the core lacks",
  "removes the one Pokémon the core cannot beat". A pick with no such sentence
  is a pick that has not been made yet.
- **Prefer partners that tick several boxes.** Six slots, and more than six
  needs. A partner that resists two of the core's weaknesses *and* provides
  the speed control is worth strictly more than either of two partners doing
  one each — and it leaves a slot free.
- **A slot with more than one legitimate answer is a decision point, not a
  research task.** Present 3-5 verified candidates with their trade-offs and
  let the user choose, rather than researching one and presenting it as the
  answer (`CLAUDE.md`; `reference/methodology.md`).

## Megas as a centrepiece

**Megas are strong, and a Mega makes a good centrepiece.** The corollary is
the demanding part: if it is the centrepiece, **get full value out of it** —
the rest of the team should be arranged so it reliably gets to act, not merely
so it is present.

- **Cover its type weaknesses *and* its playstyle weaknesses — both.** Typing
  is a tool call: `node tools/dex/cli.js type --vs-mon "Mega <Species>"`.
  Playstyle is judgement: a slow bulky Mega and a fast frail Mega fail in
  completely different ways and want completely different partners. A team
  that covers the type chart and ignores the playstyle has done half the job.
- **A Mega's ability and typing are fixed by the Mega forme and often differ
  from the base.** `node tools/dex/cli.js mon "Mega <Species>"` — never a
  usage-percentage split, which reports the *pre-Mega* selection
  (`CLAUDE.md`; `reference/mechanics.md`). This has been got wrong repeatedly
  in this repo while the correct answer was already written down.
- **Do not feel obliged to build every game plan around the Mega. Leaving it
  behind is a real option** — and that is precisely what the bring-4 choice is
  for. A centrepiece is what the team is built around, not what it is required
  to bring in every game.
- **Two Mega Stones on a six is standard practice.** The one-Mega-per-battle
  limit and why registering two anyway is normal are stated in `CLAUDE.md` and
  detailed in `reference/vgc-format.md` — read them there. Do not present the
  limit as a flaw in a plan that registers two. The source's own guidance is
  the same in weaker form: two is fine, more probably is not, and at least one
  in a Mega-legal format *(generic VGC — not Champions-verified)*.

## Examples policy

The rules this file obeys, stated here so later edits inherit them:

1. **Every principle stands without its example.** The example illustrates; it
   never carries the claim. If deleting the species name would leave the
   sentence meaningless, the sentence is wrong.
2. **Prefer structurally durable examples.** "A slow, high-Attack Pokémon with
   a spread move" beats a species name. Keep a species only where the mechanic
   itself is durable — Torkoal's base-20 Speed and Eruption will not drift; its
   usage rate will.
3. **Any claim resting on current usage carries a date stamp and a verify
   marker**: `(as of 2026-09 — confirm with meta usage)`.
4. **Examples that are not Champions-legal get replaced**, the original stays
   in `reference/sources/`, and the substitution is recorded as a footnote in
   this form:

   ```markdown
   [^1]: The source notes used <Original> here. <Original> is not in the
         Champions roster (verified <date> via `dex mon`), so this file uses
         <Replacement>, which demonstrates the same point. The original
         wording is in `reference/sources/teambuilding-notes.md`.
   ```

**How this file was verified.** Every species, move and ability named above
was run through `node tools/dex/cli.js` on 2026-09-08 — `mon` for roster
legality, `move` for power/type/spread flags, `learnset --move` for move
legality, `legal --ability` for ability legality, `type --vs-mon` for the
Tyranitar profile. **No substitution footnote was needed**: the only species
the source names in the sections this file covers are Garchomp and Torkoal
(both roster-legal; the source's spellings "garchaop" and "torkal" are
typos, not different Pokémon) and Tyranitar.

**Names outside the current roster, not wrong.** Recorded so a sibling file
does not re-derive them: `Rillaboom`, `Amoonguss`, `Indeedee`, `Barraskewda`,
`Kingdra`, `Ludicolo`, `Lilligant`, `Sawsbuck`, `Shiftry` and `Togekiss`
*(not in the Champions pool as of M-B, verified 2026-09-09 — guidance holds
for when they return)* all exist in the broader dex but **not** in the
vendored Champions roster; `Urshifu` is absent from the vendored dex
entirely, a different and narrower case — it has never been vendored under
either name, rather than being a species currently sitting out a regulation.
Each of the other ten was a candidate example here for a real archetype
role — the standard generic-VGC redirector, Swift Swim body or Chlorophyll
body — and a verified Champions equivalent stood in for it on the page
instead. **The role these ten were reaching for is real; the species itself
was just outside the current pool, which is a regulation-specific and
reversible fact, not a verdict on the pick.** Rillaboom is the sharpest
illustration of exactly that: it launches with Regulation M-C the same day
this file was last re-verified, so its unavailability stops being true
within hours of this check rather than at some indefinite future rollover.
**If any of these ten returns to the roster, it is a candidate again with no
re-reasoning needed about whether the role fits — re-run
`node tools/dex/cli.js mon "<Species>"` first** to confirm it is actually
back and pull its current stats and ability before reusing it, rather than
assuming this note still applies verbatim. And note the converse, unchanged
from before: a species being absent locally right after a regulation
rollover means "not re-vendored yet," not "not legal" (`CLAUDE.md`).

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-09-08 | Created. The repo had no archetype taxonomy at all — `vgc-team-building` step 3 said "agree the archetype with the user" and nothing anywhere said what the archetypes were, what each required, or how to choose between them. Covers the three starting points, the two different targets for choosing one, the four archetypes with their requirements and failure modes, the weather whole-team rule, building around a single Pokémon, and Megas as centrepieces. Every named species/move/ability verified via `tools/dex/cli.js`; ten generic-VGC example candidates were rejected as not Champions-roster and replaced before publication | `reference/sources/teambuilding-notes.md` ("Team starting points", "Strategies", "Building Around Specific Pokémon", "Using an Existing Team", "Mega Pokémon Tips") and `reference/sources/teambuilding-notes-advanced.md` ("How to select a strong starting points?"), both vendored this session from masterclass notes by a Pokémon world champion; `docs/superpowers/specs/2026-09-08-teambuilding-philosophy-design.md` |
| 2026-09-09 | Fix round 1: replaced all `[generic VGC]` bracket-tag occurrences (10, including the definition) with the italic parenthetical `*(generic VGC — not Champions-verified)*` so the scope marker cannot be mistaken for a fourth tier of `vgc-format.md`'s `[official]`/`[consensus]`/`[unresolved]` confidence axis; rewrote the marker's definition block to state it is orthogonal to that axis and link to it. Trimmed the Trick Room -7-priority and Tailwind ×2/4-turn restatements down to the archetype-relevant consequence, deferring the mechanic itself to `reference/mechanics.md` instead of restating it right after telling the reader not to. Added a one-line note in "Choosing a strong starting point" recording that the source's "is there a machine-usable niche-lookup tool" question is answered by `node tools/dex/cli.js find`, built in a later task of this plan. | Code review of this file, round 1 |
| 2026-09-09 | Fix round 2 (user correction: mark availability, never delete evergreen guidance). The user flagged that removing Rillaboom-terrain-setting-style guidance for a currently-unavailable thing loses knowledge the roster will regain, and asked for a sweep of what had already been over-eagerly deleted, following `reference/roles.md`'s already-corrected precedent. Added **Availability** as a third orthogonal marking axis alongside Sourcing strength and Scope in the marker-definition block, copying `reference/roles.md`'s wording and structure: `*(not in the Champions pool as of <regulation id>, verified <date> — guidance holds for when it returns)*`, attached only after an actual `dex mon`/`legal --item`/`legal --ability` check, and never a reason to delete guidance. Reframed the "Names that failed the sweep" paragraph (Examples policy) to "Names outside the current roster, not wrong": re-ran `dex mon` fresh on all eleven names (`Rillaboom`, `Amoonguss`, `Indeedee`, `Barraskewda`, `Kingdra`, `Ludicolo`, `Lilligant`, `Sawsbuck`, `Shiftry`, `Togekiss`, `Urshifu`) — same verdicts as before, ten absent from the vendored roster and `Urshifu` never vendored under either name — and reframed the ten from "failed"/"rejected" to "outside the current pool," stating explicitly that the archetype role each was reaching for is real and that any of the ten is a candidate again with no re-reasoning needed if it returns, Rillaboom soonest since it launches with M-C the same day this file was last verified. The instruction to re-run `dex mon` before reintroducing one is kept, not removed. Swept the rest of the file (Edit 3) for the same class of error — anywhere something was dropped or called excluded for current illegality rather than marked — and found nothing else: Choice Scarf is the only item this file names and it is currently legal; no other mechanic figure or dropped guidance was found. Regulation used for the marker is **M-B**, read fresh from `reference/regulation.md`'s stamp block (still the active regulation as of this check; the vendored dex has not rolled over to M-C yet, confirmed by re-running `dex mon` on Rillaboom). `npm test` — 318/318, unchanged. | User correction on over-eager availability-based deletion |
