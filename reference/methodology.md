# Teambuilding Methodology Notes (VGC / Pokémon Champions)

Process rules for how to evaluate matchups and build teams — not reference data itself, but how to use the reference data correctly.

## Contents

- [Typing alone is not sufficient to call something a "counter"](#typing-alone-is-not-sufficient-to-call-something-a-counter)
- [SP spread allocation: solve for the breakpoint, don't default to 32/32/2](#sp-spread-allocation-solve-for-the-breakpoint-dont-default-to-32322)
- [A Pokémon's value isn't always damage — evaluate the role it's actually filling](#a-pokémons-value-isnt-always-damage-evaluate-the-role-its-actually-filling)
- [Team-building is collaborative, not a solo deliverable](#team-building-is-collaborative-not-a-solo-deliverable)
- [Live meta lookup: Pikalytics per-Pokémon pages](#live-meta-lookup-pikalytics-per-pokémon-pages)
- [Changelog](#changelog)

## Typing alone is not sufficient to call something a "counter"

A type chart only describes a Pokémon's own STAB and its defensive typing — it says nothing about the actual moves a given set is running. A Pokémon is regularly used as a "check" or "counter" to something specifically *because* of a coverage move outside its own type(s), not because of its typing.

Classic example: Garchomp has no Rock-type STAB itself — it isn't a Rock-type — so the offensive threat it poses to Charizard comes entirely from the coverage move **Rock Slide** (Rock is 4x on Fire/Flying), not from typing. Defensively it's a separate, genuinely favorable matchup: Garchomp's Ground typing resists Rock-type moves (½x), and against Charizard specifically its Dragon typing also resists Charizard's Fire STAB (½x), with only Charizard's Flying STAB landing neutrally — letting Garchomp switch in safely. The type chart alone would never surface the offensive half of that.

**So evaluating any matchup requires two separate checks, not one:**
1. **Typing** — what does the type chart say about raw effectiveness in both directions?
2. **Actual moveset** — what coverage moves is this Pokémon *actually running* in the current meta (per usage data like Pikalytics/VGCPastes), and does that change the picture regardless of its base types?

Skipping step 2 and reasoning from typing alone is a common way to misjudge a matchup — a Pokémon can be a real answer to something despite bad "on paper" typing, or a bad answer to something despite good typing if it isn't actually running the relevant coverage move. Always check both before calling something a counter/answer/threat.

## SP spread allocation: solve for the breakpoint, don't default to 32/32/2

The 66-point SP budget (see `regulation.md`'s "Stat system" section)
can be split across all six stats in any combination, capped at 32/stat — it
does not have to be spent as an even 32/32/2 split. When a spread is meant to
answer a specific attack or speed tier, solve for the actual minimum SP
needed and put the leftover points into whatever else matters (more offense,
a different bulk stat, Speed), rather than maxing a stat by default.

- **Converting an inherited EV spread (Smogon/SV-era, or a guide that hasn't
  updated its notation) into a starting SP spread: scale it proportionally
  onto the 66-point budget, don't discard the set idea just because its
  numbers are in the wrong unit.** Steps: (1) sum the EVs; (2) multiply each
  stat by `66 / sum` and round; (3) if any stat rounds above the 32/stat cap,
  clamp it to 32 and re-split the freed points across the remaining stats
  using *their* relative ratio, then re-round; (4) nudge the least-important
  stat by ±1 if rounding leaves the total off 66. Real example (Milotic
  Coil/Hypnosis set, 2026-09-07): 252 HP / 104 Def / 88 SpD / 64 Spe (sum
  508) → ×(66/508) → 32.7 / 13.5 / 11.4 / 8.3 → HP clamps to 32 → remaining
  34 points re-split 104:88:64 → 14 / 12 / 8 → final **32 HP / 14 Def / 12
  SpD / 8 Spe**. This is a *reasonable starting point that preserves the
  original set's relative emphasis*, not a verified breakpoint — always run
  it through `optimize-bulk.js`/a Speed-breakpoint search afterward like any
  other spread, rather than treating the scaled numbers as final. This is
  different from the mistake `pitfalls.md`'s "Build assumption
  trap" section warns against (assuming a fixed EV→SP conversion factor,
  e.g. "252 EVs = 32 SP") — proportional scaling re-derives a fresh
  66-point spread from the ratio, it doesn't assume any constant factor.

- **Speed breakpoints**: binary-search via `tools/damage-calc/cli.js` (check
  the resulting `rawStats.sp` against the real threshold you're trying to
  clear — see the Noivern-vs-Sneasler example worked through in a past
  session: 30 Speed SP, not 32, was the real minimum to guarantee beating a
  real 189-Speed Sneasler).
- **HP vs. Def/SpD breakpoints (surviving a specific attack): use
  `tools/damage-calc/optimize-bulk.js`, don't hand-split.** This is NOT the
  same kind of search as Speed. The damage formula makes damage proportional
  to `Attack / Defense`, so Defense (and SpD) has *diminishing returns* —
  each point matters less as the stat grows — while HP is flat/linear (every
  point always absorbs exactly one more point of damage, no nature
  multiplier ever applies to it). That means the right split between HP and
  Def/SpD depends on the defender's own base stats and the attacker's
  specific power, not a fixed ratio (not 50/50, not "always max the relevant
  Def stat"). Real example: Aegislash-Shield's true minimum-SP spread to
  survive Kingambit's Kowtow Cleave is 24 HP / 1 Def, not an even split —
  its base Def (150) is already so high that further Def investment barely
  reduces incoming damage, while its base HP (60) is comparatively low.
  `optimize-bulk.js` brute-forces every legal (HP, Def, SpD) combination
  against the real engine (also handles the "must survive both a physical
  AND a special threat" case jointly) and returns the true minimum — see
  `damage-calc.md`'s "Bulk optimization" section for usage. This is also
  what `.claude/hooks/check_sp_spread_optimization.js`'s hook expects a round
  (0/2/32) HP/Def/SpD spread to have actually been run through before being
  presented as justified.

- **The continuous-math "starting neighborhood" — and why it's only a
  starting point.** Credit: Jenkins (VGC player/theorist), "How to Optimize
  Defensive Spreads in Pokemon Champions Using Math"
  (https://www.youtube.com/watch?v=FxfI7I_sSnM) and his companion tool
  (https://jenkinsvgc.github.io/damage-rounding-calc/). Treating damage as
  continuously proportional to `Attack/Defense` (ignoring integer
  floors/rounding) turns "minimize damage taken" into a classic fixed-budget
  optimization: for a single physical-or-special threat, the optimum is
  `HP = Def` (or `HP = SpD`) — the same shape as the "maximize a rectangle's
  area for a fixed perimeter" calculus problem. For the real VGC case of
  needing to survive a physical AND a special hit the same turn (no
  switching), the optimum becomes **HP = Def + SpD** — and if physical and
  special threats matter equally, that means Def = SpD, so HP ends up
  roughly *twice* either individual stat (matches this file's own
  Aegislash/Noivern findings: HP is more valuable than either single
  Def/SpD stat precisely because it's "counted twice," once for each
  category). A bias term generalizes this to weighting one category more:
  weighting physical `B` times more than special gives `(Def/SpD)² = B`
  while HP still equals their sum.
  **But — Jenkins' own central finding — this continuous math is a
  genuinely unreliable guide to the real, integer/floor-rounded optimum.**
  Real damage calculation applies a *chain* of modifiers (weather, crit,
  STAB, spread-move, type effectiveness, item/ability mods...), each
  rounded down at every step, which turns the true damage-vs-Defense
  relationship into a jagged step function with irregular "jumps" (not the
  smooth curve continuous math assumes) — his own worked example found the
  *real* optimal Pelipper spread nowhere near where continuous math placed
  it, with 3x the swing between best- and worst-case integer spreads that
  the smooth approximation predicted. **This is exactly why
  `tools/damage-calc/optimize-bulk.js` brute-forces the real engine across
  every integer combination instead of applying a formula** — it was never
  at risk of this trap, since it never computes a recommendation from the
  continuous approximation, only from the real, discrete calc output. Use
  `HP ≈ Def + SpD` (weighted by a bias term if one category matters more)
  as a rough mental *starting neighborhood* when reasoning about a spread
  by hand, never as the actual answer for a real recommendation.
  **Also confirmed by this source**: there is no universal "always want an
  odd/even defensive stat" property — the specific favorable breakpoints
  depend entirely on the exact modifier chain (weather/crit/STAB/spread/
  multi-hit) of the specific attack being checked, not a fixed parity rule.
  And multi-hit moves amplify this further — a 1-point Defense increase
  that shaves 1 off a 5-hit move's per-hit damage saves 5 total, which is
  why `optimize-bulk.js` treating multi-hit moves as out-of-scope (see
  `damage-calc.md`'s multi-hit caveat) is a real gap worth closing, not
  just a permanent limitation.

Traps caught while doing this for real:
- **Check the attacker's realistic held item before trusting a "safe"
  breakpoint.** A no-item test can understate the true worst case — e.g. a
  Garchomp Earthquake calc without Life Orb looked survivable at max HP
  investment; adding Life Orb (its real, common item) pushed the max roll
  past even a fully-invested HP pool.
- **Some worst cases have no SP-allocation fix at all** (a 4x weakness, or an
  attacker that's both boosted and favorably matched up) — recognize that and
  say so, rather than forcing a spread to "solve" an unsolvable matchup.
  `optimize-bulk.js` surfaces this as `{ solvable: false, closest: [...] }`
  rather than silently returning something that still loses.
- **Never manually multiply a spread move's damage by 0.75x again** —
  `tools/damage-calc/cli.js` already applies the doubles spread-move
  reduction internally (confirmed via a controlled A/B test — see
  `damage-calc.md`'s damage-formula section and `pitfalls.md`'s
  "Spread moves" entry for the full story). Manually reducing it again
  understates real damage by ~25% and has already caused this exact mistake
  more than once across sessions.

*Add further process rules here as they come up (e.g. how to weigh usage stats vs. actual reasoning, how to handle Tera strategy once/if it's activated in a future regulation), keeping this separate from the type chart and mechanics reference files.*

## A Pokémon's value isn't always damage — evaluate the role it's actually filling

`tools/damage-calc` makes it easy to default every comparison to "how much %
HP does it deal/take," but a support Pokémon's real job is often not to
trade hits at all. Before running (or leading with) a damage/bulk
percentage comparison, first ask what the Pokémon's real kit is *for* —
redirection (Follow Me/Rage Powder), speed control (Tailwind/Trick Room),
screens (Light Screen/Reflect), status/disruption (Taunt/Encore/Spore),
healing, or a one-shot guaranteed action — and evaluate it against that job,
not against "does it survive combat."

**Concrete case**: comparing Whimsicott against Basculegion/Sylveon by
% HP lost to Charizard-Mega-Y's Heat Wave, Mega Froslass's Blizzard, and
Sneasler's Dire Claw (194–229%, 135–162%, 230–274% respectively) made
Whimsicott look like a liability. That framing was wrong for what Whimsicott
actually is: a **real, ~75.5%-usage Focus Sash + Prankster** Tailwind/Encore
bot. Its entire design is to take exactly one hit — Focus Sash guarantees
survival at 1 HP from full health regardless of how much the hit would have
overkilled by, so 150% and 300% are the same outcome for it. The "damage %"
metric was measuring something Whimsicott was never built to survive long
enough to need.

**What actually matters for a Focus-Sash-support pick like this instead:**
- **Does it get its key action off at all?** Prankster gives status moves
  +1 priority, but Fake Out is +3 — a real Fake Out lead (Sneasler runs one
  at 94.4% usage) flinches Whimsicott before its own Tailwind resolves,
  costing a turn (not the game — it can act next turn) even though Sash
  would still save it from any damage that turn.
- **Focus Sash only blocks one hit total, and only from exactly full HP**
  (see `mechanics.md`'s Item mechanics section) — a real
  doubles-specific risk is being double-targeted by two separate attackers
  the same turn, which burns the Sash on the first hit and kills on the
  second. A single spread move (e.g. Heat Wave hitting both of a side's
  Pokémon) does NOT count as two hits against one target, so that specific
  case is fine — the risk is two *different* attackers choosing the same
  target.
- **Its usefulness afterward is genuinely one turn.** Once Sash is
  consumed (essentially always, turn 1), Whimsicott has no more defensive
  answer and folds to nearly anything — that's an accepted, intentional
  trade-off for the role, not a flaw to fix with a bulkier spread.

None of this means damage checks are wrong for an attacker (Basculegion,
Kingambit, Garchomp) — it's specifically that a redirect/screens/speed-
control Pokémon's viability question is "does its support action reliably
happen," not "how much punishment can it take." Ask which question actually
applies before reaching for the damage-calc tool.

## Team-building is collaborative, not a solo deliverable

Even for a "just build me something" request (e.g. an off-meta/anti-meta
team with no named favorite), don't research, build all six picks, and save
the finished file in one uninterrupted pass. Check in at real decision
points — the strategic angle/archetype to build around, and any pick that's
a genuine judgment call — before finalizing and saving to `teams/`. Treat
`teams/_TEMPLATE.md`'s sections as things to work out *with* the user, not
just document after the fact for them to read.

This doesn't mean asking permission for every lookup or calc — the research
and verification legwork (live meta lookup, roster/legality, threat
evaluation, the pitfalls checklist) is still something to just go
do. It means not treating "build a team" as license to disappear and come
back with a finished, saved six.

**Filling a specific hole in the roster is its own kind of decision
point — present 3-5 real candidates, don't lock in one.** "We need
something that resists X" or "we need speed control" or "we need an answer
to [named threat]" is a gap with more than one legitimate answer. Verify
each candidate via live data first (roster/legality per
`reference/champions-format.md`, real current moveset via a live lookup) so
the comparison is grounded, then hand over
the trade-offs and let the user choose — the same collaborative-checkpoint
principle as the strategic archetype itself, applied to an individual slot
instead of the whole six. Real example (2026-09-07): asked for a Flying
Tailwind setter to plug a Ground/Fighting-weakness hole; researching and
presenting only Noivern would have skipped real, legitimately different
alternatives (Pelipper, Staraptor) with their own trade-offs (Electric
4x-weak vs. Fighting-neutral-not-resisted vs. new Ice 4x-weak) that the user
should get to weigh.

## Live meta lookup: Pikalytics per-Pokémon pages

CLAUDE.md requires live verification before any moveset/build
suggestion — this is the concrete "how" for Pikalytics specifically. This
section is also packaged as the `vgc-meta-lookup` skill (`.claude/skills/vgc-meta-lookup/`)
for standalone "what's the meta" questions with no specific Pokémon/team
named yet, and invoked from `vgc-team-building`/`vgc-team-refining` for
their own meta scans — this file remains the full-detail source both defer
to.

URL pattern: `https://www.pikalytics.com/pokedex/{format-slug}/{Pokemon}`
(e.g. `.../pokedex/battledataregmbs3/Garchomp`). Fetchable via WebFetch —
confirmed server-rendered, gives real top-moves/items/abilities/teammates
with usage %, plus a regulation-specific text summary.

**The `{format-slug}` includes a season number that increments within a
regulation** (M-B is currently on its 3rd season slug, `regmbs3`) — do
not hardcode a slug as if it's permanent. Check
`https://www.pikalytics.com/pokedex` first (or a live search) to find the
current one before using it.

**What this does NOT give you**: the actual structured EV/SP-spread and
nature breakdown renders client-side (empty in the raw HTML, populated by
JS after page load) — WebFetch can't reach it. Usage-percentage summaries
only; treat as directional signal for what's common, not a ready-to-use
build. Combine with `damage-calc.md`'s tool for actually testing a
build's numbers.

**Do this every session before reasoning about "top meta threats," not just
once**: per-Pokémon usage rank (`/pokedex/{slug}`) tells you individual
strength, but it does not tell you what actually shows up *together* across
the net. Also check `https://www.pikalytics.com/topteams` (or the
tournament-teams equivalent) for real team-level cores/archetypes before
giving bring-6-pick-4 or "what beats the meta" advice — a team-level
archetype (e.g. a Sun core built around Charizard-Mega-Y + Sylveon +
Aerodactyl-Mega) surfaces real threats and interactions (weather wars,
which Pokémon actually pair together) that a flat top-20 usage list won't
show on its own. Caught mid-session: gave a round of bring-6-pick-4
recommendations per-threat without checking this page first, and missed an
entire common archetype (Sun) that directly conflicts with a rain-based
team — only surfaced once the top-teams page was actually pulled.

**"What's the meta / how do I counter it" needs three Pikalytics surfaces
together, not one** — each answers a different question and none
substitutes for the others:

1. `https://www.pikalytics.com/topteams` — real six-Pokémon tournament
   teams as actually brought by real players. Good for "here's a concrete
   team I might face," but each entry is one specific build, not a
   frequency signal.
2. `https://www.pikalytics.com/team-usage` — full six-Pokémon *archetypes*
   ranked by win rate and team count/match record (W-L-D), i.e. how well
   an archetype actually performs, not just that it exists. This is the
   "is this team good" check that `/topteams` alone doesn't give you.
3. `/pokedex`'s **"Common Team Cores" section** (distinct from the
   per-Pokémon teammates list) — dedicated 2/3/4-Pokémon core groupings
   ranked by how many teams feature them, sitting between the Top 20
   individual-usage table and the Recent Top Teams listing. This is what
   surfaces a popular sub-core (e.g. a specific 3-mon rain or Trick Room
   piece) that's common across *many different* six-mon teams, even when
   no single full team dominates raw usage — `/topteams`/`/team-usage`
   alone can miss this if the core gets paired with a long tail of
   different last-two-picks.

When asked to counter "the meta" (as opposed to one named Pokémon or one
named team), pull all three before answering: cores tell you what to
expect to see paired together, team-usage tells you which full archetypes
actually win, topteams gives concrete real builds to test against.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-07-09 | Migrated from claude.ai Drive folder into this repo, no content changes | Original claude.ai session reasoning, no external source needed (process rule, not factual claim) |
| 2026-07-09 | Corrected a factual error in the Garchomp/Charizard example: it previously claimed Garchomp "gets no defensive benefit from Rock at all," but Garchomp's Ground typing actually resists Rock (½x). Also corrected "Ground/Dragon-neutral matchup" to note Dragon resists Charizard's Fire STAB (½x) — only the Flying half of Charizard's STAB is neutral. | Cross-checked against the type chart (now `node tools/dex/cli.js type`); caught during task review |
| 2026-07-09 | Added "Live meta lookup" section documenting the Pikalytics per-Pokémon URL pattern, what WebFetch can/can't reach on it, and the season-slug staleness trap | Verified by fetching https://www.pikalytics.com/pokedex/battledataregmbs3/garchomp and https://www.pikalytics.com/pokedex directly this session |
| 2026-07-10 | Added "SP spread allocation" section after repeatedly defaulting to round 32/32/2 SP splits instead of solving for the actual minimum needed per stat. User asked this be remembered going forward | tools/damage-calc/cli.js breakpoint searches this session (Archaludon vs. Sneasler Close Combat, Gholdengo vs. Life Orb Garchomp Earthquake) |
| 2026-09-04 | Added "A Pokémon's value isn't always damage" section after dismissing Whimsicott as a team-building candidate based on % HP lost to three real threats (Charizard-Mega-Y, Mega Froslass, Sneasler), without accounting for its real ~75.5%-usage Focus Sash + Prankster build being designed to take exactly one hit regardless of overkill. User flagged that the tooling/instructions were biasing analysis toward damage numbers over a support Pokémon's actual job (redirection/speed-control/screens/disruption) | User correction; Whimsicott's real Pikalytics set (Tailwind 98.5%, Focus Sash 75.5%, Prankster 99.4%) confirmed this session; Fake-Out-vs-Prankster-priority and Focus-Sash-double-target mechanics cross-checked against `mechanics.md` |
| 2026-07-10 | Added "Do this every session" note under Live meta lookup — check Pikalytics' top-teams/cores page, not just per-Pokémon usage rank, before giving bring-6-pick-4 or top-threat advice. Missed the Sun archetype (Charizard-Mega-Y/Sylveon/Aerodactyl-Mega) entirely on a first pass because only individual usage rankings had been checked | https://www.pikalytics.com/topteams fetched this session; user asked this be made a standing habit |
| 2026-09-07 | Added "Converting an inherited EV spread into a starting SP spread" bullet — a Milotic Coil/Hypnosis guide gave 252 HP/104 Def/88 SpD/64 Spe (sum 508, not a legal SP total). User asked for a standing proportional-scaling method rather than treating the set as unusable: scale by 66/sum, clamp any stat over 32 and re-split the freed points by the remaining ratio | User instruction ("just spread out the 66 SP at the same ratio"); worked example verified by hand (252/104/88/64 → 32/14/12/8, sums to 66) |
| 2026-09-07 | Added "Filling a specific hole in the roster is its own kind of decision point — present 3-5 candidates" bullet under Team-building is collaborative, and matching step 3 addendum in the vgc-team-building skill. Had presented only Noivern as the Flying/Tailwind answer to a Ground+Fighting-weakness hole before the user asked for the standing rule; real alternatives (Pelipper, Staraptor) had genuinely different trade-offs worth putting in front of the user | User instruction ("suggest 3-5 options, instead of locking in one right away") |
| 2026-07-14 | Added "Team-building is collaborative, not a solo deliverable" section — built and saved a full anti-meta team (`teams/surprise-trick-room-anti-meta.md`) in one uninterrupted pass without checking in on the strategic direction or individual picks first. User said this isn't how they want to work | User correction, same session as the surprise-trick-room-anti-meta build |
| 2026-07-14 | Rewrote "SP spread allocation" to split Speed breakpoints (still a `cli.js` binary search) from HP-vs-Def/SpD breakpoints (now `tools/damage-calc/optimize-bulk.js`, a brute-force tool built this session after finding no single equation reliably gives the optimal split — Def/SpD have diminishing returns, HP is linear, and the right ratio depends on the defender's own base stats). Also added the "never manually multiply by 0.75x again" trap after discovering a real double-reduction error | User asked "are you figuring out optimal HP/Def/SpD spreads" then asked for the real damage-calc math to be investigated and turned into a tool; brute-force verification this session (Aegislash-Shield vs. Kingambit Kowtow Cleave: true minimum 24 HP/1 Def) |
| 2026-07-14 | Added citation/credit for Jenkins' "How to Optimize Defensive Spreads in Pokemon Champions Using Math" video and damage-rounding-calc tool — confirmed our own from-scratch Lagrangian derivation (HP = Def + SpD at the equal-weighting optimum) independently matches his, and documented his key finding that continuous math is a poor guide to the real integer-rounded optimum (motivating why `optimize-bulk.js` brute-forces the real engine instead of applying a formula). Also flagged that `optimize-bulk.js`'s current multi-hit-move exclusion is a real gap worth closing, not a permanent limitation, since multi-hit moves amplify exactly this rounding effect | User-provided video transcript and tool link this session |
| 2026-07-17 | Added "three Pikalytics surfaces together" note under Live meta lookup — `/topteams` (concrete real teams), `/team-usage` (full six-mon archetypes ranked by win rate/W-L-D), and `/pokedex`'s "Common Team Cores" section (2/3/4-mon groupings by team count) each answer a different question about "the meta," and a general meta/counter-the-meta question needs all three, not just `/topteams`. User flagged that team-usage and cores were missing from the existing process | User correction; confirmed page contents via WebFetch on pikalytics.com/team-usage and pikalytics.com/pokedex this session |
| 2026-08-19 | Added a pointer from "Live meta lookup" to the new `vgc-meta-lookup` skill, which packages this section's process for standalone meta questions (previously only reachable via `vgc-team-building`/`vgc-team-refining`, so a bare "what's popular right now" question with no team on the table wouldn't reliably trigger this section's process) | Skill-triggering audit this session (tested vgc-team-building/vgc-team-refining/vgc-threat-evaluation against realistic phrasing, found the standalone-meta-question gap) |
| 2026-09-07 | Added a Contents list. Type-matchup steps now point at `node tools/dex/cli.js type` (the markdown type chart was deleted after all 324 cells were confirmed identical to the vendored chart, which is now guarded by `tools/dex/tests/type-chart-invariant.test.js`). Hook paths updated for the move to `.claude/hooks/` | docs/specs/2026-09-07-repo-reorganization.md |
| 2026-09-07 | Replaced dangling `CLAUDE.md rule N` cross-references with named pointers — CLAUDE.md stopped being a numbered rule list in the reorganization and every number became dead. Named pointers survive restructuring; numbers do not | docs/specs/2026-09-07-workflow-audit.md |
| 2026-09-07 | Live meta lookup now requires verifying the fetched page's own format label names the current regulation, not just picking a slug — a previous regulation's slug keeps returning complete, correctly-labelled data instead of failing, so a stale slug is silently wrong rather than obviously broken | Live Pikalytics fetches this session; see reference/regulation.md's "Live usage data" section |
