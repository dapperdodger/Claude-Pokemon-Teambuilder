# Team: Dual Speed-Control (Trick Room / Tailwind) — Drampa & Blastoise Sweepers

**Status:** Finalized
**Built for:** Exploring a concept — built around Mega Drampa as a favorite/chosen centerpiece, then generalized into a flexible dual-mode ladder team
**Regulation:** M-B (as of `reference/vgc_current_regulation.md`'s 2026-07-09 last-verified date)
**Last updated:** 2026-07-14

## The six

| Pokémon | Item | Ability | Stat Alignment | SP allocation | Moves |
|---|---|---|---|---|---|
| Mega Drampa (Normal/Dragon) | Drampanite | Berserk (Mega-fixed; base form is Cloud Nine) | Modest | HP 17 / Def 29 / SpA 20 | Calm Mind / Hyper Voice / Earth Power / Protect |
| Sinistcha (Grass/Ghost) | Kasib Berry | Hospitality | Calm | HP 32 / Def 3 / SpD 31 | Matcha Gotcha / Rage Powder / Trick Room / Protect |
| Maushold (Normal) | Chople Berry | Friend Guard | Calm | HP 32 / Def 4 / SpD 30 | Super Fang / Feint / Follow Me / Taunt |
| Tinkaton (Fairy/Steel) | Leftovers | Own Tempo | Adamant | HP 21 / Atk 32 / Def 13 | Gigaton Hammer / Fake Out / Encore / Protect |
| Talonflame (Fire/Flying) | Focus Sash | Gale Wings | Adamant | HP 27 / Atk 32 / Def 2 / SpD 5 | Tailwind / Protect / Flare Blitz / Brave Bird |
| Mega Blastoise (Water) | Blastoisinite | Mega Launcher (Mega-fixed) | Modest | HP 32 / SpA 32 / Def 2 | Shell Smash / Water Spout / Aura Sphere / Protect |

No Speed SP anywhere on the team — see "Why these six" below for why that's a deliberate choice, not an oversight.

## Why these six

**Mega Drampa** — the team's original centerpiece and reason it exists. The
initial plan was a Dragon-type Calm Mind sweeper built around Mega Altaria,
but Altaria turned out to not learn Calm Mind at all in Champions (verified
via direct Bulbapedia learnset fetch — it has no Special Attack-boosting
move in its kit whatsoever; real tournament Altaria is a Will-O-Wisp/
Tailwind support set, not a sweeper). Mega Drampa is the real, verified
substitute: 39.7% real Calm Mind usage in tournament data, not a fringe
pick. Its Mega-fixed ability Berserk (auto +1 SpA when dropped below half
HP by a hit) turns its very low 36 base Speed into a feature — it almost
always moves last and eats a hit before acting, which triggers Berserk for
free most turns, stacking with Calm Mind's own SpA boost. Real Earth Power
already OHKOs Kingambit and Archaludon post-Calm-Mind, and unboosted Earth
Power alone already OHKOs Archaludon and Sneasler. SP allocation: 20 SpA is
the verified minimum needed to guarantee Kingambit's Earth Power OHKO (not
a round default), remainder split 17 HP / 29 Def per the real bulk-rank
tool against the tracked threat list — this spread lets it survive every
hit in that list rather than the earlier Delphox build, which could not
survive any of them regardless of spread.

**Sinistcha** — real #2-ranked, 32%-usage Pokémon in the current meta, not
a niche support pick. Carries both Trick Room AND Rage Powder as separate
move slots, so it isn't locked into one role — it can set Trick Room to let
Drampa (and anything else slow) move first, or use Rage Powder purely for
redirection in a Tailwind-mode game without ever using Trick Room that
game. Also flatly immune to Fighting-type attacks (Ghost half), which
neutralizes Sneasler's Close Combat entirely. Real risk: it's OHKO'd by a
Sun-boosted Charizard-Y Heat Wave regardless of spread (Fire is a 2x
weakness) — it has to be played around that specific threat, not tanked.

**Maushold** — the team's primary redirector via Follow Me (confirmed +2
priority, unlike Rage Powder's Grass/Overcoat-immunity limitation, Follow
Me has no typing exception). This exists specifically to protect Mega
Blastoise's Shell Smash turn (Shell Smash's own Def/SpD drop makes that
turn genuinely risky) and, in a Trick-Room game, to back up Sinistcha's
redirection. Real ability is Friend Guard (not the vendored dex's default
Technician field — that field is a real trap, see
`reference/vgc_common_pitfalls.md`'s multi-ability bullet) paired with a
real Chople Berry set (weakens the first Fighting hit it takes, its one
real shared weakness with Drampa).

**Tinkaton** — the team's only clean answer to Sylveon (confirmed immune
to Poison-type coverage via Steel-half immunity overriding the Fairy
half's weakness — 2×0=0, not "a bit weak"). Also the team's defensive
patch for Drampa specifically: Fairy/Steel typing is flatly immune to
Dragon-type attacks and resists Fairy and Ice — three of Drampa's four
real weaknesses (Dragon/Fairy/Ice/Fighting), a complementary pairing that
didn't exist under the old Altaria-centered plan.

**Talonflame** — the real, verified Tailwind setter for this team (96.4%
real Tailwind usage; Grimmsnarl was considered and ruled out here — real
data shows it doesn't actually run Tailwind, it's a dual-screens setter
instead). Its Fire/Flying typing was chosen specifically to fix a weakness-
stacking problem: an earlier Whimsicott+Gyarados version of this team had
Fire-type threats hitting four of six members and Electric hitting a
severe 4x weakness (Gyarados). Talonflame *resists* Fire instead of adding
to the pile, and doesn't carry the old Electric 4x liability. Gale Wings
gives Flying-type moves (including Tailwind itself) +1 priority at full
HP, so it doesn't need Speed investment to reliably move first on the
turn that matters. Focus Sash over Sharp Beak: real calc showed the
Sharp Beak damage boost didn't flip any tracked KO outcome (Brave Bird vs.
Sneasler is already a massive overkill OHKO either way), while Talonflame's
real 4x Rock weakness makes the guaranteed-survival insurance the better
trade. Caveat: if Sash triggers, Talonflame drops off full HP and loses
Gale Wings' priority for the rest of the game — and neither item stops a
Fake Out flinch from denying its Tailwind turn outright, since Gale Wings'
+1 priority is still lower than Fake Out's +3.

**Mega Blastoise** — the team's proactive burst sweeper, filling the "own
backup Mega for when the main plan doesn't fit" role that bring-6-pick-4
allows. Shell Smash / Water Spout / Aura Sphere / Protect, all confirmed
directly against Blastoise's real Champions learnset (not just generic
move-legality). Water Spout was chosen over the initially-picked Water
Pulse — despite Water Pulse getting a 1.5x boost from Mega Launcher, its
low 60 base power still loses to Water Spout's unboosted 150 base power,
which also has better accuracy (100% vs. Hydro Pump's 80%) and hits both
opponents as a spread move. Real post-Shell-Smash numbers: OHKOs Kingambit
(241-285 vs. 207 HP) and Sneasler (259-306 vs. 157 HP) cleanly, and nearly
OHKOs Archaludon (153-180 vs. 167 — a likely-but-not-guaranteed kill).
Shell Smash + Tailwind stack multiplicatively (both ×2 Speed) rather than
conflicting — this is why Blastoise pairs with the Tailwind half of the
team, not the Trick Room half (Shell Smash's own Speed boost would work
directly against Trick Room's reversed turn order).

**No Speed SP anywhere**: verified directly rather than assumed. Under
Tailwind, every relevant team member (Talonflame 292, Blastoise 196,
Maushold 234, Tinkaton 228, all at 0 Speed SP) comfortably clears the real
tracked threats' max speeds (Sneasler 189, Charizard-Y 167, Archaludon
150) — investing SP into Speed anywhere would have been wasted budget once
Tailwind is accounted for. Trick Room doesn't care about anyone's actual
Speed stat at all. Both Follow Me and Rage Powder carry +2 priority
(confirmed live — the vendored move data was missing the priority flag
for both, a real gap now documented in
`reference/vgc_ability_move_mechanics.md`), so neither redirector needs
Speed investment to act before an incoming threat either.

## Intentional exclusions

- **Mega Altaria** — the team's original planned centerpiece. Dropped
  entirely once verified that it cannot learn Calm Mind in Champions and
  has no Special Attack-boosting move at all; its real tournament role
  (Will-O-Wisp/Protect/Tailwind/Perish Song support) didn't fit the
  sweeper role it was picked for.
- **Mega Delphox** — a real, verified Nasty Plot special sweeper
  (confirmed Levitate as its Mega-fixed ability, not Blaze) that was
  briefly the centerpiece before Mega Drampa replaced it. Hit hard and
  fast (204 Speed, real OHKOs on Kingambit/Archaludon/Sneasler) but was
  fragile to the point that it could not survive a single hit from
  Kingambit or Mega Swampert regardless of SP spread — Drampa's tankier,
  Berserk-driven playstyle was judged the better fit once that was found.
- **Mega Gardevoir, Mega Slowbro, Mega Floette** — all considered as
  alternative Calm Mind Megas. Real data ruled them out: Gardevoir and
  Slowbro don't actually run Calm Mind in the current meta (Gardevoir's
  real top moves are Protect/Hyper Voice/Psychic/Psyshock; Slowbro's are
  Slack Off/Body Press/Scald/Trick Room) despite being classic Calm Mind
  users in mainline games, and Floette is a confirmed rare/fringe pick
  (0% usage, #113 rank, losing record).
- **Mamoswine** — cut specifically to reduce Fire-weakness stacking once
  Sinistcha and Whimsicott (see below) were both added and both carried a
  Fire weakness. Tinkaton was kept over it because Tinkaton's typing
  directly patches three of Drampa's four weaknesses (Dragon immunity,
  Fairy/Ice resist) and it remains the team's only Sylveon answer — a
  real, acknowledged tradeoff is that the team lost its only anti-Dragon
  *offensive* coverage (Mamoswine's Ice STAB) in the process.
- **Gyarados** — cut when Talonflame replaced it as the Tailwind setter;
  Gyarados's own Electric 4x weakness was part of the weakness-stacking
  problem Talonflame was chosen to fix.
- **Whimsicott** — a real, verified Tailwind setter (26% usage, #6 rank)
  that was in this team briefly before being swapped for Maushold +
  Talonflame. Two real problems drove the swap: (1) Whimsicott's Grass/
  Fairy typing stacked directly onto the team's existing Fire and Ice
  weaknesses rather than covering for them, at one point pushing Fire
  weakness to four of seven considered members; (2) it doesn't carry
  redirection itself, so Blastoise's Shell Smash turn had no protection
  in a pure Tailwind-mode pick without also forcing Sinistcha into every
  such game.
- **Grimmsnarl** — considered as a second Tailwind option; ruled out
  because real tournament data shows it doesn't actually run Tailwind at
  all (Reflect/Parting Shot/Light Screen/Spirit Break — a dual-screens
  role, different from what was needed here).
- **Tornadus, Murkrow, Suicune** — real, well-known Tailwind setters in
  mainline VGC, but none are actually in the Pokémon Champions roster
  (checked directly against the vendored dex before considering them
  further — roster availability is a separate check from move/strategy
  legality, and these failed at the roster step).

## Known weaknesses / open questions

- **Mega Swampert (Rain, Swift Swim) is the team's least-answered real
  threat.** Under Rain it reaches 244 Speed, comfortably outspeeding even
  the Tailwind-mode side pre-Tailwind, and its Wave Crash hit hard enough
  in testing to threaten a one-shot on some team members (e.g. it OHKO'd
  an earlier Mega Delphox build outright). The Tailwind-mode four
  (Talonflame/Blastoise/Maushold/Tinkaton) only has typing-neutral trades
  against it, no hard counter — Blastoise resists its Water STAB, which
  helps, but this matchup leans on prediction/Protect more than a clean
  answer.
- **Talonflame is 4x weak to Rock** — a real, severe single-point
  vulnerability. Focus Sash covers the first hit, but a sustained Rock
  attacker is a genuine problem for it specifically.
- **Charizard-Y under Sun OHKOs both Sinistcha and Whimsicott-tier bulk
  regardless of spread** (confirmed via calc: 218-260 vs. Sinistcha's 178
  HP). Both real support pieces have to be played around this threat via
  Protect/prediction rather than tanked.
- **Fire is still a shared weakness for Sinistcha and Tinkaton** (reduced
  from a four-way stack earlier this session, but not eliminated).
- Not yet tested: how this team's Trick-Room half performs against an
  opposing Trick Room team (mirror-TR interactions weren't explored this
  session).

## Bring-6-pick-4 notes

- **Trick Room mode**: Sinistcha + Mega Drampa + Tinkaton + Maushold.
  Leaves Talonflame and Mega Blastoise home — this specifically avoids
  using Shell Smash under Trick Room, since Shell Smash's own +2 Speed
  boost works directly against Trick Room's reversed turn order.
- **Tailwind mode (verified against the tracked "major threats" list —
  Charizard-Y/Sun, Sneasler, Kingambit, Archaludon, Mega Swampert/Rain)**:
  Talonflame + Mega Blastoise + Maushold + Tinkaton. Under Tailwind every
  member of this four clears the real threats' max Speed by a wide margin
  (292/196/234/228 vs. a 150-189 threat ceiling) with zero Speed SP
  invested. Talonflame resists the Charizard-Y matchup and crushes
  Sneasler with Brave Bird; Shell Smash Blastoise cleanly OHKOs Kingambit
  and Sneasler and nearly OHKOs Archaludon; Maushold's Follow Me protects
  Blastoise's setup turn from anything trying to snipe it, including
  Kingambit's priority Sucker Punch; Tinkaton adds Dragon immunity, Fake
  Out tempo, and Encore. Mega Swampert is this four's weak point (see
  "Known weaknesses" above).
- Maushold and Tinkaton are the flex pieces common to both modes — Follow
  Me and Encore/Fake Out don't depend on which speed-control tool is
  active that game.

## Changelog

| Date | Change | Reasoning |
|---|---|---|
| 2026-07-14 | Initial build, saved after extensive collaborative session covering Altaria→Delphox→Drampa centerpiece pivots, Whimsicott→Maushold+Talonflame support restructuring, full learnset verification pass, and real speed-tier/bulk-optimization checks | See "Why these six" and "Intentional exclusions" for full reasoning chain and sources |
