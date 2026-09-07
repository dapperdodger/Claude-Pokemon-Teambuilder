# Case studies — the incidents behind the rules

Every rule in `reference/pitfalls.md`, `reference/methodology.md` and
`CLAUDE.md` exists because something concrete went wrong. This file holds
those incidents in full: what was claimed, what was actually true, how it was
caught, and what changed as a result.

**This file is deliberately not in the hot path.** It is history and
rationale, not a checklist — reading it at the moment of a decision costs
context without changing the answer. Read it when you want to understand
*why* a rule is phrased the way it is, when writing or revising a rule, or
when deciding whether a new mistake is a repeat of an old one.

The operational form of everything here lives in:

- `reference/pitfalls.md` — the traps, as a scannable checklist
- `reference/methodology.md` — the reasoning process
- `CLAUDE.md` — the non-negotiable gates
- `tools/dex/` — the type and Mega-ability errors, made mechanically
  unavailable rather than merely documented

## Contents

- [Process-lesson case studies](#process-lesson-case-studies)
- [Data-source misses](#data-source-misses)

## Process-lesson case studies

These are real corrections from a past team-building session (Whimsicott +
Gholdengo core), kept here as concrete examples of why "verify the real
chart, don't rely on recall" has to be a default step, not something that
only happens after a user catches a mistake:

- **Kingambit (Dark/Steel)** was initially suggested as a Farigiraf/Trick
  Room answer, but is actually a bad pick against that specific team —
  Dark/Steel is **4x weak to Fighting** (not "a bit weak"; both types are
  independently weak to Fighting, so it compounds), plus 2x Fire and 2x
  Ground, which would have stacked on top of that team's existing Fire
  weakness. This was only caught via user pushback.
- **Mega Aerodactyl (Rock/Flying)** was initially miscalculated as 4x weak
  to Ice — it's actually only **2x weak** (Ice is neutral against the Rock
  half, only super-effective against the Flying half). It's also **immune
  to Ground** entirely (Flying half cancels Ground's normal super-effective
  matchup against Rock). Both errors were caught only after the user
  demanded the real chart be pulled instead of relying on recall — see
  `vgc_type_chart_reference.md` for the verified chart.
- **Recommending "lean on priority moves (Fake Out, Aqua Jet, Prankster
  status) to disrupt Trick Room" without checking Farigiraf's ability
  first.** Farigiraf runs Armor Tail at ~99.9% usage (Pikalytics), which
  blocks any priority-boosted move — including Prankster-boosted Taunt/
  Encore — from hitting it or its ally that turn (see
  `mechanics.md`'s "Priority & turn order" section, which
  already documented this correctly before this mistake was made — the
  failure was not checking that file before giving priority-based advice).
  The good news buried in that same file: it doesn't matter, because
  Trick Room itself is -7 priority and always resolves last on the turn
  it's set — a normal-priority attack (Rock Slide, Wave Crash, Make It
  Rain, anything at 0 priority) still lands before the room goes up
  regardless of the attacker's Speed or whether Armor Tail is in play.
  Armor Tail only shuts down priority-based disruption on *later* turns
  while Farigiraf/its ally remains on the field — the real counter to a
  Farigiraf lead is raw damage that turn, not a priority trick.
- **Misread a usage-stat "Torrent 58.7% / Damp 46.4%" ability split as Mega
  Swampert's actual battle ability**, and recommended it as if Swift Swim
  were a rare minority tech pick rather than what it always is once
  evolved. Some Megas fix their ability on evolution, overriding whatever
  the base Pokémon had — see `mechanics.md`'s "Mega
  Evolution ability changes" section. The ironic part: this exact check
  (does the Mega fix the ability?) had already been applied correctly to
  Mega Raichu-Y two turns earlier in the same session — it just wasn't
  applied consistently to the next Mega that came up. Caught by the user,
  not proactively.
- **Quoted a spread move's single-target damage-calc output as the real
  in-game number, twice, without applying the doubles 0.75x spread-move
  reduction** documented in this same file's "Spread moves hit multiple
  targets but at reduced damage" bullet above — forgot it applies even
  when reasoning about damage *to* a Trick Room setter, not just the
  user's own spread moves. This made "just kill the Trick Room setter
  turn 1" look like a real answer; corrected math (0.75x applied) shows
  the best case — both attackers connect, zero Fake Out disruption —
  still leaves Farigiraf at 36-61 of 195 HP, and Sinistcha often survives
  too. Caught only after the user asked directly whether the setter
  actually dies.
  **Addendum (2026-07-14): git history shows `tools/damage-calc/calc.js`
  already hardcoded Doubles format (and therefore already applied the 0.75x
  spread reduction internally) from its very first commit (2026-07-09),
  before this entry was even written (2026-07-10) — meaning this entry's
  "corrected math (0.75x applied)" was almost certainly a double-reduction
  on an already-correct tool output, not a real fix. Do not treat this
  entry as a template to follow: never manually multiply
  `tools/damage-calc/cli.js`'s min/max by 0.75 for a spread move, the tool
  already did it (see the "Spread moves" bullet above, confirmed via a
  controlled Singles-vs-Doubles A/B test). This mistake likely propagated
  from this very file into at least one later session before being caught.**
- **Claimed Garchomp (Ground/Dragon) was "immune to Mega Staraptor's Flying
  STAB,"** inverting a real mechanic: Ground-type *moves* have no effect on
  Flying-types (why Earthquake whiffs on Pelipper), not the reverse —
  Flying-type moves hit Ground-types completely normally. Calc confirmed
  Dual Wingbeat does 42-51 per hit to Garchomp, not zero. Direction matters:
  always check "attacking type row vs. defending type column" in
  `vgc_type_chart_reference.md`, not the mirrored cell, before claiming a
  one-way immunity.
- **Claimed Tinkaton (Steel/Fairy) shared Altaria's weakness to Poison-type
  coverage** by checking only the Fairy half's effectiveness (Poison vs.
  Fairy = 2x weak) and never multiplying it against the Steel half —
  Poison vs. Steel is 0 (immune), and immunity always wins in the
  multiplicative chain (2 × 0 = 0), so Tinkaton is flatly immune to Poison
  overall, not weak to it. For any dual-type Pokémon, compute BOTH halves'
  effectiveness against the incoming type and multiply them together —
  don't reason from a single half and assume it holds for the combined
  typing, especially when one half might be an immunity that overrides
  the other. Caught by the user, not proactively.
- **Grouped two different moves from the same attacker under one blanket
  matchup claim ("Solar Beam / Weather Ball: both resisted") because they're
  both a sun-setter's special options, without checking that they're
  different types.** Weather Ball genuinely does become Fire-type in Sun
  (correctly established earlier in the same session) and is resisted by a
  Water-type like Milotic — but Solar Beam is plain Grass-type regardless of
  weather, and Grass is Milotic's one real weakness, already correctly
  logged as "weak" in an audit table three messages earlier in the *same*
  conversation. The error wasn't missing data — the correct number (Solar
  Beam 132-156 vs. Milotic's 170 HP, from `damage-calc.md`'s tool) was
  already sitting in context — it was re-deriving a matchup claim from a
  vague "these are both the sun-setter's moves" pattern-match instead of
  checking each move's actual type independently, and not cross-referencing
  a conclusion already reached earlier in the same session before restating
  it. **Two things to actually do differently: (1) never bundle multiple
  moves into one matchup claim without listing each move's type and
  checking it separately — shared attacker or shared boost mechanism
  (e.g. "both benefit from Sun") does not imply shared defensive
  interaction; (2) before asserting a matchup claim, check whether it was
  already computed earlier in the conversation and would contradict a
  number already given** — this is the same shape of failure as the Mega
  Swampert/Mega Raichu-Y ability-fix case above (a check applied correctly
  once, then skipped on the very next similar claim), just for type
  interactions instead of ability fixes. Caught by the user, not
  proactively.

- **Passed `--defender Staraptor --defender-item Staraptorite` to
  `tools/damage-calc/cli.js` expecting it to compute as Mega Staraptor, and
  got base Staraptor (Normal/Flying, Intimidate) instead** — the tool does
  NOT auto-apply a Mega's typing/ability just because the matching Mega
  Stone is held; it only evolves when the species string itself is the
  Mega's own name (`"Mega Staraptor"`, confirmed via
  `POKEDEX_CHAMPIONS["Mega Staraptor"]`: Fighting/Flying, ability fixed to
  **Contrary**, not the Normal/Flying/Intimidate-or-Reckless base form).
  This produced a real, wrong conclusion stated to the user: "Ceruledge's
  Ghost-type moves (Shadow Sneak, Poltergeist) both deal 0 to Staraptor,
  since Ghost can't touch Normal-types" — true only for the base form
  nobody actually fields in a real match. Re-run with species `"Mega
  Staraptor"` gave a real, neutral 97-115 for Poltergeist, not 0. **Any
  damage-calc call involving a Mega-capable defender/attacker must pass the
  exact `"Mega <Species>"` string, not the base name plus the Mega Stone
  item**, or the calc silently runs against the wrong typing and ability —
  same underlying trap as the Torrent/Damp-vs-Swift-Swim ability case above,
  but at the tool-invocation level rather than a usage-stat misread. Caught
  only when the user's follow-up question required re-deriving Staraptor's
  real Mega ability from scratch, not proactively.
- **Dismissed Whimsicott as a team-building candidate by comparing its % HP
  lost to three real top threats (Charizard-Mega-Y's Heat Wave 194-229%,
  Mega Froslass's Blizzard 135-162%, Sneasler's Dire Claw 230-274%) against
  two attacker candidates being evaluated the same way** — treating "how
  much overkill damage does it take" as the deciding metric for a Pokémon
  whose real, ~75.5%-usage build (Focus Sash + Prankster, confirmed via live
  Pikalytics) is specifically designed to take exactly one hit and guarantee
  its Tailwind/Encore goes off regardless of how much that hit would have
  overkilled by — 150% and 300% are the same outcome once Sash is factored
  in. The framing wasn't factually wrong (the % numbers were real, correctly
  calculated), it was the wrong question for what this Pokémon's kit is
  actually for. See `methodology.md`'s "A Pokémon's value
  isn't always damage" section for the corrected process (evaluate a
  support pick against whether its action reliably happens — priority order
  vs. Fake Out, double-targeting risk to Sash — not against how much
  punishment it absorbs). Caught by the user directly, who named the
  specific gap: "damage isn't always a pokemon's value."
- **Claimed Mega Raichu Y's real competitive ability is Lightning Rod (~93.7%
  usage) and dismissed No Guard as a rare ~2.7% tech pick** — this is the
  exact "usage-stat ability breakdown is showing the pre-Mega selection, not
  the fixed Mega ability" trap `mechanics.md`'s "Mega
  Evolution ability changes" section already documents, and that section
  already names this precise case by species: "Mega Raichu-Y is always **No
  Guard** (Lightning Rod is pre-Mega only)." The 93.7%/2.7% split was base
  Raichu's own pre-Mega ability selection (Static/Lightning Rod are its real
  options), not Mega Raichu Y's ability at all — confirmed directly via
  `tools/damage-calc/vendor/pokedex.js`'s `POKEDEX_CHAMPIONS["Mega Raichu
  Y"]` entry, which has a single `"ab":"No Guard"` field with no
  alternative, the same shape as every other confirmed Mega-fixed-ability
  entry (Staraptor→Contrary, Delphox→Levitate, etc.). This is the fourth
  time this exact class of mistake has been logged (Swampert 2026-07-10,
  Delphox/Blastoise/Charizard-Y 2026-07-17, Staraptor 2026-09-04, now
  Raichu-Y again 2026-09-07) — and the most striking part is that **this
  specific Pokémon's fixed ability was already spelled out by name in
  `mechanics.md` before this mistake was made**, including
  a 2026-07-10 changelog note that the check had already been applied
  correctly to Mega Raichu-Y once, two sessions earlier. Having the fact
  written down (even written down twice) did not prevent restating the
  opposite of it from a plausible-looking web search percentage. **The
  actual fix has to be procedural, not another documentation pass: before
  stating any Mega Evolution's ability, grep
  `tools/damage-calc/vendor/pokedex.js` for the exact `"Mega <Species>"`
  entry's `.ab` field (or check `mechanics.md`'s list of
  confirmed fixes) BEFORE citing any web usage-percentage split for that
  Mega's ability** — a percentage split can only ever describe pre-Mega
  ability selection for a fixed-ability Mega, never the real in-battle
  ability, no matter how authoritative the source looks. Caught by the user
  directly, who also asked what should change structurally to stop this
  recurring — see `CLAUDE.md` rule 13, added the same session.
- **Claimed Rillaboom (pure Grass) doesn't resist Electric while evaluating a
  Milotic/Rillaboom/Incineroar core** — stated "neither Rillaboom nor
  Incineroar resists Electric" as a real gap in the core, when
  `vgc_type_chart_reference.md`'s Electric section lists Grass under its
  0.5x column. Rillaboom actually covers Milotic's Electric weakness
  directly, so the "gap" didn't exist — the opposite of the intended
  conclusion. This is the same failure mode as the other type-chart
  entries in this section (Kingambit, Mega Aerodactyl, Garchomp/Staraptor,
  Tinkaton, Solar Beam/Weather Ball): stating a matchup from memory/recall
  instead of opening the reference file. **Always open
  `vgc_type_chart_reference.md` and look up the actual attacking type's
  section before stating any resistance/weakness/immunity claim** — this
  needs to be the default action, not a check reserved for matchups that
  feel uncertain, since this exact mistake keeps recurring on matchups that
  felt obvious enough not to check. Caught by the user, not proactively.
- **Built an entire team's strategic premise ("Mega Altaria Calm Mind sweeper
  core") around a move the Pokémon cannot actually learn in Champions,**
  without ever running a learnset check until asked to "deeply examine each
  move" at the very end of a long build. Calm Mind does not appear anywhere
  in Altaria's Champions learnset (confirmed via direct Bulbapedia fetch),
  and Altaria has **no Special Attack-boosting move at all** in its kit
  (Dragon Dance boosts Attack/Speed, Agility boosts Speed only — nothing
  touches SpA). Real tournament data confirms the actual role: Pikalytics
  shows Altaria's top moves are Will-O-Wisp (63%), Protect (63%), Tailwind
  (47%), Brave Bird (42%), Perish Song (26%), Roost (26%) — a support/
  utility set, not a self-setup special sweeper — and Cloud Nine (89.5%)
  outweighs Pixilate as the actual common ability, meaning most real
  Altaria isn't even the Mega/Pixilate build at all. Several other picks
  (a Follow-Me support Pokémon framed as "protecting Altaria's setup turn,"
  a second Mega framed as "backup sweeper for when Altaria's matchup is
  bad") were reasoned from this false premise. **Lesson: verify a
  Pokémon's actual learnset for its intended role-defining move BEFORE
  building team strategy around that role, not after the roster is
  finalized** — a name-recognition move ("Altaria runs Calm Mind" from
  general Pokémon knowledge/mainline-game memory) is not a substitute for
  checking the specific game's learnset, and this is a more severe version
  of the same trap as the Gyarados/Rock Slide and Blastoise/Water Pulse
  cases below: those were single-move corrections, this was a whole team's
  win condition. Caught only because the user asked for a full move-by-move
  audit at the end, not proactively during the build.

## Data-source misses

Moved out of `reference/pitfalls.md`'s "Data source pitfalls" section, which
now carries the short operational form of both.

- **Generic WebSearch snippets mentioning "top Pokémon" are NOT the same as
  actually pulling Pikalytics' team-level pages, and built a 5-Pokémon
  "threat list" from the former without ever fetching the latter** — a
  repeat of a mistake `methodology.md`'s own "Live meta
  lookup" section already documents being caught and fixed once before
  (2026-07-10 changelog entry, missing the Sun archetype core on a first
  pass). That section explicitly says to check
  `https://www.pikalytics.com/topteams` and
  `https://www.pikalytics.com/team-usage` for real team-level archetypes
  before giving "what beats the meta" advice, not just per-Pokémon usage
  rank — but a later session still built threat-coverage advice (Palafin
  moveset calcs) from WebSearch snippets off individual Pokémon pages alone,
  never fetching either URL. When actually fetched, `team-usage` surfaced
  real top-10-by-frequency Pokémon across the top 100 team cores
  (Charizard-Mega-Y, Garchomp, Basculegion, **Archaludon, Swampert-Mega,
  Sinistcha, Pelipper**, Incineroar, Floette-Eternal, Kingambit) that the
  WebSearch-only pass had entirely missed — Archaludon, Swampert-Mega, and
  Pelipper never came up once, despite the Swampert-Mega/Pelipper/Archaludon
  rain core appearing dozens of times in the top-100 list, meaning the
  format's single most common weather archetype (highly relevant to a
  Water-type-heavy team, since rain doubles the size of the "does this OHKO"
  question already being calculated) was absent from the threat list being
  used for real moveset decisions. Caught only because the user asked
  directly whether `team-usage` should have been checked, not proactively.
  **Lesson: having the correct instruction written down once in one file is
  not sufficient — re-read `methodology.md`'s "Live meta
  lookup" section and actually fetch both team-level URLs at the start of
  any threat-list-building work, every session, not just recall that a
  search was already done.**
- **A Pikalytics per-Pokémon page's "Best Moves/Items/Abilities" panel
  rendering empty or `NaN%`/`undefined%` is a client-side loading
  artifact, not proof the Pokémon has no real presence.** Confirmed by
  fetching the same page for a Pokémon already known to have heavy real
  usage (Aerodactyl-Mega) via WebFetch/the Browser tool — its own
  moves/items/abilities panels were just as empty, even though it's a
  documented top-20 real pick. The plain-text-only `WebFetch` tool in
  particular can't trigger this site's client-side data loading at all;
  even the in-app Browser tool's rendered DOM leaves these specific panels
  empty. **The reliable real-data source on this same page is the
  "[Species] Pokemon Champions Teams" section** (curated real tournament
  results from Limitless/Twitter/VGCPastes) — when it lists real teams
  with records, the Pokémon has confirmed real tournament presence; when
  it's entirely absent (checked directly this session: Mega Pidgeot had
  zero curated teams, Mega Dragonite and Mega Aerodactyl each had several
  with real records like 9-0, 11-1), that's the actual signal, not the
  empty stat panels above it. For the full real moveset/item/ability of a
  specific curated team entry, read the underlying JSON API directly
  (`https://www.pikalytics.com/api/p/<date>/<format>-<id>/<species>`,
  found via the Browser tool's network-request log after loading the
  page) rather than trying to parse the rendered panels.
