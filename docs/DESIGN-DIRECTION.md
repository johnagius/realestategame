# Property Empire — Design Direction (art direction brief)

This document exists because "make it look good" produces a tasteful default
and nothing more. An AI (or a person) only goes beyond the default when the
direction is **specific, opinionated, referenced and critiqued**. Everything
below is binding for any visual work on this game. If a screen could belong
to a generic admin dashboard, it is not finished.

---

## 1. The one sentence

**A Victorian ledger that grows into a glass skyline.** The whole game is the
family's book of accounts, kept for 180 years: ink, paper, gold leaf and
copperplate at the start; print, steel and neon by the end. The UI *is* the
ledger. The 3D city is the window on the desk.

Everything either reinforces that sentence or it goes.

## 2. Three pillars of the look

1. **Material, not flat.** Paper has grain; ink bleeds slightly; gold is a
   gradient with a highlight, not a flat hex; glass reflects. Flat colour
   fills are the default that we are leaving behind. Use subtle noise,
   embossed rules, deckled edges, foil stamps. Never drop shadows at 20%
   black on white cards: use paper layers with a 1px darker edge instead.
2. **Typography does the talking.** Display: a high-contrast serif with real
   italics (Playfair Display now; evaluate Fraunces or Instrument Serif for
   more character). Numerals: tabular, old-style in the ledger, lining in the
   HUD. Micro-labels: letter-spaced small caps. Body: Nunito stays for
   legibility. Rule: a screen with no display-serif moment is unfinished.
3. **Era is a colour script.** Each era has a palette, a paper, an ink and a
   light. The whole UI shifts when the era changes, not only the 3D city.

| Era | Paper | Ink | Accent | Light | Texture |
|---|---|---|---|---|---|
| Victorian 1850 | warm cream, foxed | sepia black | brass, oxblood | gaslight amber | laid paper, engraving hatching |
| Gilded 1900 | ivory | deep green-black | gold leaf, bottle green | electric warm white | marbled endpaper |
| Crisis 1930 | grey newsprint | hard black | signal red | cold daylight | halftone dots, rubber stamps |
| Boom 1950 | pale mint | navy | coral, mustard | bright noon | offset misregistration |
| Modern 1980 | off-white | charcoal | cobalt, chrome | fluorescent | fine grid, photocopy grain |
| Digital 2008 | near-black glass | white | cyan, magenta LED | screen glow | pixel grid, bloom |

The tokens in `css/tokens.css` must be era-driven (`[data-era]` on `<html>`),
not just light/dark.

## 3. Signature moments (the screenshots people share)

Design these first, as set-pieces, then let the rest of the UI serve them.

1. **The deal reveal.** Opening a listing feels like unfolding a surveyor's
   report: the estimate band draws itself, comps stamp in one by one, the
   seller's cue is a handwritten note pinned to the corner.
2. **The hammer.** Auctions are theatre: rival crests slide in, bids stamp
   onto a ledger column, the gavel strikes with a camera shake on the 3D city
   and a flag rising on the building when you win.
3. **The year turning.** The year report is a newspaper front page with the
   family in the headline, a hand-inked chart, and a cliffhanger line set in
   italic. The page turn is a real page turn.
4. **The crash.** When a depression hits, the paper goes grey newsprint, the
   skyline darkens, FOR SALE boards sprout across the city, and the advisor's
   bubble is the only warm colour on screen.
5. **Succession.** A family tree drawn in ink, the new head's portrait
   revealed by a wax seal breaking, the estate-tax line struck through when a
   trust was in place.
6. **The skyline at 2030.** Your towers with your crest, lit at night, with
   the 1850 terrace preserved among them. This is the share card.

## 4. The 3D city as the hero

- Buildings must read as *yours* from across the room: the family colour on
  roofline banners and lit windows, not just a thin ground ring.
- Landmarks must match the era (no Shard in 1850). Each landmark gets an
  `eras` list; cities grow outward by era with new blocks appearing.
- Weather and time of day: dusk by default (it is the most flattering light),
  rain during recessions, fog in Victorian winters, fireworks on era change.
- Camera language: slow push-in on your newest purchase after a deal, orbit
  on the start screen, a tilt-down on bankruptcy.
- Low-poly is fine; *lighting and silhouette* are what sell it. Rim light on
  prime buildings, warm window emissive, baked AO under buildings.

## 5. Iconography and illustration

- One stroke weight (1.75px at 24px), rounded joins, consistent 2px corner
  radius, in `assets/icons.svg`. No emoji anywhere.
- Illustrations are engravings: cross-hatched, two inks (paper + ink + one
  accent). Rival portraits, family crests, district vignettes, event scenes,
  achievements. Draw them as SVG so they recolour per era.
- Crests: each family and rival gets a real heraldic crest (shield, charge,
  motto ribbon) used on buildings, the leaderboard and the share card.

## 6. Motion

- Motion is information, never decoration: money moves along the path it
  travels (rent floats from the building to the cash figure), bars grow from
  their anchor, stamps land with a 60 ms overshoot.
- One easing family (`--ease`), three durations (120 / 240 / 480 ms). Nothing
  bounces unless it is a gavel or a stamp.
- Sound pairs with every motion: coin, stamp, page, gavel, rumble. Default on
  for new players with a first-run prompt.

## 7. The process that gets beyond the default (mandatory)

1. **Reference before pixels.** For each screen, collect 6 references from
   real products and write one line each on what to steal: Monument Valley
   (colour scripts), Two Point Hospital (readable isometric charm), Reigns
   (one-decision clarity), Civilization VI (era-shifting UI), Ledger apps and
   Victorian stock certificates (typography), Apple Weather (motion as
   information), Rusty Lake (hand-drawn menace), 80 Days (text as art).
2. **Three directions, then one.** Mock three visibly different takes on the
   screen (as HTML, screenshot them), pick one with reasons, kill the others.
3. **Side-by-side critique.** Put the screenshot next to the best reference
   at the same size and answer in writing: what does theirs have that ours
   does not? Hierarchy, contrast, texture, moment, wit. Fix the top three.
   Repeat until the comparison is not embarrassing.
4. **The squint test and the stranger test.** Blur the screenshot: does the
   most important thing still dominate? Show it to someone who has not seen
   the game: can they say what to tap in five seconds?
5. **Delight audit per screen.** List every empty state, loading state,
   error, first-time and success state. Each gets copy in character and one
   small moment.
6. **Never ship a default.** If any component looks like a framework's
   default (grey card, blue button, system toast), it is not done.

## 8. How to ask an AI for design that goes beyond

Prompts that produce defaults: "make it beautiful", "modern clean UI",
"polish the design". Prompts that produce something: a named direction (§1),
three references with what to take from each, hard constraints (palette,
type, texture rules), a signature moment to build first, and a critique loop
with screenshots. Always ask for three directions, always ask for the
side-by-side, always ask "what would make a designer at Supercell or
ustwo proud of this screen", and always reject the first answer once.
