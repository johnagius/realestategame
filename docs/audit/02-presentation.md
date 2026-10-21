# Audit part 2 — Presentation layer (UI / UX / visual design)

Scope: `index.html`, `css/style.css` (2813 lines), `js/ui.js`, `js/app.js`, `js/graphics.js`, `js/intro.js`, `js/audio.js`, `js/ads.js`, `js/mosaic.js`, `js/city3d-engine.js`, plus 412×915 screenshots of every screen. Economy is covered in part 1.

## 1. Splash / Family select

**Works:** The canvas intro (`js/intro.js`) is the strongest visual in the game: parallax, stars, fireflies, chimney smoke, gold gradient title with Cinzel Decorative. Buttons have proper press/hover motion (`css/style.css:321-376`).

**Defects**
- Crown is a text glyph `♛` (`index.html:23`) rendered dark-on-dark; invisible on the splash despite the gold drop-shadow at `style.css:274-280`.
- `splash-version` (`style.css:378`, `index.html:38`) is laid out inside the centered flex column, so "v7.3" prints on top of the mansion roof and under family cards.
- Family select (`app.js:192-215`): heading "Choose Your Dynasty" has no horizontal padding and hugs the left edge. Cards (`style.css:394-412`) overlay the mansion with 10% white on a bright sunset band; mottos at `rgba(255,255,255,.5)` (`style.css:438`) are unreadable over the orange horizon.
- Family icons are ZWJ emoji sequences (`data.js:152-159`) that render as placeholder tiles on some devices; the four dynasties are visually indistinguishable except Vanderbilt's top hat.
- `GameGraphics.renderSplash()` (`graphics.js:9-11`) targets `#splash-scene`, which does not exist in `index.html`; ~630 lines of SVG splash code are dead but still shipped.
- No "Continue" affordance besides a hidden button; no family preview of era/starting city. `App.startNewGame` uses inline `onclick` string handlers (`app.js:201`).

**Why it feels cheap vs premium:** the moment the canvas is replaced by stacked translucent cards with 0.65–0.75rem text, the title screen collapses into a form. Card typography (Nunito 0.95/0.75/0.65rem) has no relationship to the Cinzel/Playfair title system.

## 2. Opening narrative + tutorial

**Works:** The narrative modal (`app.js:266-306`) gives a clear objective block and rival framing; "Begin" is a full-width primary.

**Defects**
- Title icon is 🎡 (London Eye) for "London, 1750" (`data.js:206`, used at `app.js:279`): anachronistic.
- Modal sits at `z-index:500` (`style.css:1842-1848`); HUD is 900, ticker 890, decision panel 850, tutorial 950. The HUD is fully live above the overlay: the player can press Next, change speed, open the leaderboard while a "modal" is open. Same for every `showModal` (sell confirm, historical events, campaign completion).
- `showCampaignOffer` (`app.js:308-393`) declares `var trait` twice (333) and builds its whole body as inline-styled strings with 20+ `style=""` attributes.
- Tutorial system `App.tutorialSteps/startTutorial` (`app.js:1121-1168`, `index.html:265-275`, `style.css:2615-2661`) is never invoked anywhere. Its text refers to "the green bar" for goals, which is `display:none !important` (`style.css:2765`). Dead UI plus stale copy.
- The campaign pill shows "✅ vs 🌍 €5K" before the player has done anything because the rival check is already satisfied; presentation surfaces a done tick on step one of the objective.

## 3. World map

**Works:** `mosaic.js` D3 Natural Earth map with coastal glow, rivers, compass and corner ornaments is genuinely attractive. Country colours for game nations give a board-game feel.

**Defects**
- 19 locked cities render identical 🔒 labels in black boxes (`ui.js:1880`), no name, no hint: the map is an unreadable field of padlocks. Only London is labelled.
- Pin hit area: 8px dot + 4px padding = 16px (`style.css:2222-2236`); labels are 0.55rem = 8.8px (`style.css:2269-2283`).
- `renderWorldMap()` (`ui.js:1852-1901`) rebuilds all pins via `innerHTML` on every `renderMap()`, which runs every month on the Cities tab (`app.js:517`), and calls `getCitySummary` once per city here and again in the card loop (`ui.js:352`).
- Map toggle label mismatch: HTML says "📋 List" (`index.html:97`) but toggling writes "Hide Map / Show Map" (`ui.js:1847`); the list is never hidden.
- Map requires `cdn.jsdelivr.net/.../countries-110m.json` at runtime (`mosaic.js:195`); the service worker only caches same-origin, so offline the PWA shows "World map requires internet connection" (`mosaic.js:290-292`).
- Ocean scan lines (~75 `<line>` elements) and 220 particle circles animate with CSS `shimmer` infinitely plus `gborder` and `cpulse` (`style.css:2176-2184`): persistent compositor work on an idle tab.
- City cards: investment badge is a bare coloured number "2.3" (`ui.js:285, 373-379`) with meaning only in a `title` tooltip. Four chips label three of four values by emoji alone (`ui.js:369-372`). Locked cards show "Ready · 100% there" for every campaign at game start.
- Card grid collapses to 1 column ≤480px (`style.css:2098`) so each city card is ~340px tall under a 370px map.
- `city-card:hover { transform: translateY(-3px) }` (`style.css:933`) with no `@media (hover:hover)` guard: sticky lifted cards after tap on touch.

## 4. City screen (incl. 3D view)

**Works:** The Three.js isometric city is a real differentiator: low-poly landmarks, water, trees, shadows, drag-rotate, touch handlers with `passive:true`, a clean `destroy()` (`city3d-engine.js:780-805`).

**Defects**
- Header overflow: Back, flag+name, Insight, City View in one flex row (`index.html:121-127`, `style.css:820-836`). At 412px Back and Show City View both wrap to two lines; at 360px worse.
- Campaign pill (`style.css:2773-2792`) wraps to two lines and overlaps the header row (`style.css:2798-2802`) on every game screen.
- Info chips wrap to 2 rows; two full-width stacked selects (`style.css:2089-2090`) consume ~130px before the first property card.
- `.property-badge` (`style.css:1173-1182`) and `.compare-btn` (`style.css:1299-1315`) occupy the same corner, so the ⚖️ circle sits on top of NEW/OWNED on every card.
- `property-card` has an inline `animation-delay` (`ui.js:591`) but no `animation` on `.property-card`: dead stagger.
- 3D canvas is not paused when scrolled out of view; `animate()` iterates the whole grid every frame and allocates new `Box3/Vector3` per frame (`city3d-engine.js:724-770`). Random fire/flood/earthquake FX fire every 4.5–9.5s unrelated to engine state.
- No legend: nothing distinguishes for-sale vs owned vs landmark buildings; landmark labels are ~7px tags. Clicking a non-property building only toasts its type name (`ui.js:2335-2337`).
- `renderCity()` (`ui.js:386-465`) runs every month on this screen, rebuilding chips, manager bar, forcing a reflow (448) and re-rendering the grid via `innerHTML` (561).
- Businesses tab is hidden via `style.display` (`ui.js:393-397`) so the segmented control jumps between 2 and 3 segments.
- Manager bar buttons ⚙️/✕ are ~16px tall (`ui.js:430-431`), no labels.

**Cheap signal:** three competing visual languages in one viewport: SVG property thumbs, emoji chips, and a shaded 3D canvas with a gold frame.

## 5. Property detail

**Works:** Clear hero → stats → condition → actions ordering; the "YOURS" stamp animation on purchase (`app.js:543-553`) is a nice beat.

**Defects**
- Negotiation buttons "85% · ~30%" / "93% · ~65%" / "Buy €6,420" (`ui.js:768-770`): offer-% and success-% are never explained; the first is `btn-ghost` so it reads as a caption.
- Hero icon is the emoji at 4rem (`ui.js:892`) while the list card used an SVG thumb: two icon systems for the same property. Screen title is "🏢 Details".
- Risk chips "🌊 0.30% 🔥 0.20% 🔓 0.40%" (`ui.js:940-975`): monthly probabilities to two decimals with emoji-only labels.
- Tenant stats "🔒 85% 🧹 80% 😊 85%" (`ui.js:787-790`) rely on `title` attributes.
- Evict button shows "Evict (costs €45)" (`ui.js:796`) but the engine charges `Math.max(500, rent)` (`game.js:528`): wrong number for every early-game property.
- Luxury renovation label omits the engine's 10% fail chance and 4-month duration (`ui.js:820` vs `game.js:555`).
- Shell Company, auto-sell, mitigation accordion and demolish are stacked as same-weight buttons; no hierarchy between "Rent Out" and "Demolish".
- Rent-level buttons at ≤480px are ~22px tall (`style.css:2109`).
- Build-on-land uses a UI-only era whitelist (`ui.js:833`).

## 6. Portfolio

- `formatMoney` renders negatives as "€-13" (`data.js:1051-1062`) while finance rows prepend their own minus: inconsistent sign formatting.
- `.portfolio-summary-value` declared twice (`style.css:1687`, `1701`).
- Managers block appended with `innerHTML +=` (`ui.js:1043`); Dismiss/Hire buttons ~16px.
- Page size 6 (`ui.js:12`) with Prev/Next instead of scrolling; no per-city grouping or totals.

## 7. Finances

- Net-worth "chart" (`ui.js:1112-1122`): four equal-height bars with no axis, values or time labels.
- 12-Month Forecast reads `state.savings` with a hardcoded 2% (`ui.js:1256`) but the engine field is `savingsBalance`: the forecast always ignores savings.
- Net cashflow recomputed in the UI (`ui.js:1132`).
- Forecast and Lifetime Stats collapsed by default with a text-only ▾ toggle.
- Wealth-over-time chart is ~80 inline-styled divs with opacity as the only encoding.

## 8. Bank

- Fixed deposit buttons "€50K / €100K / €500K" when the player has €7,877: every button fails with a toast. No disabled state, no "max".
- Open-bank threshold duplicated (`ui.js:2020` vs `game.js:2419`); remaining interest is a simple-interest estimate (`ui.js:2033`) vs amortised in the engine (`game.js:2113`).
- Investment buy buttons ~20px; investments list is a hidden accordion.
- Two "Take a Loan" sections opened back-to-back (`ui.js:2055-2066`, `2075-2077`) leaving an orphan heading.

## 9. Businesses

- Cards show "Available 35%", "Performance ▬ 92%", "Staff 12" as same-weight stats; buy buttons compute affordability in the UI; dividends formula copied verbatim from the engine (`ui.js:2171` vs `game.js:2335`).
- Merger flow (`app.js:994-1021`) is a modal of clickable divs with no button semantics.

## 10. Settings / More

- Speed control reuses the HUD's white `.speed-btn` on the cream card: three of four buttons invisible.
- "New Game — Start fresh with €500,000" (`ui.js:1316`) is stale copy.
- Debug Recording section ships to players (`ui.js:1318-1323`).
- Sound is default-muted (`audio.js:8`) and the only toggle is buried here.

## 11. HUD / ticker / goals bar

- `#hud` is 48px (`style.css:33, 720-735`); the right column stacks label + value + a 22px button row, so "NET WORTH" is clipped at the top in every screenshot.
- "▶ Next", the single most important control, is ~20×50px (`style.css:471-480`). Speed buttons ~24px, 🏆 ~22px. All below 44px.
- `updateHUD()` rewrites the speed controls' `innerHTML` (`ui.js:66`) several times per month.
- Ticker packs three unrelated things in a 24px bar: event text, growth/goal, and a tip; all truncate. `setTicker` auto-clears after 8s and overwrites, so a month with degradation + tenant problem + cycle change shows only the last.
- Disasters and city events are routed to this ticker (`ui.js:1469-1488`): a flood that costs money is 8 seconds of 9.6px text. The `#event-overlay` popup is dead code.
- Campaign pill uses `var(--text-dark)` which is never defined (11 uses across `ui.js`/`app.js`).
- `theme-color` is green (`index.html:12`) while the HUD is brown: Android status bar mismatch.

## 12. Month-results feedback (toasts / floats / confetti)

- Toasts cap at 5, 3.2s lifetime (`ui.js:196-209`). Two quick Next presses stack 5 toasts covering ~300px including exact duplicates ("Property tax: -€3" ×3). No coalescing.
- Toasts (z 600) cover the ticker, campaign pill and header, and block taps underneath.
- `@keyframes floatUp` defined twice (`style.css:172`, `1511`); the later wins so income/expense floats shift 50% left and lose their scale curve. `shimmer` likewise overridden (`165` vs `2179`).
- `showFloatingIncome` is hard-positioned over the ticker/campaign pill (`ui.js:142-143`).
- Confetti: 30 fixed divs on every goal, milestone, tier, unlock, prestige; no reduced-motion path.
- No HUD cash count-up or delta.

## 13. Decision cards and AI interaction cards

- Panel is non-modal (z 850, no scrim) and persists across every tab. Nothing prevents `advanceMonth` while it is open (`app.js:458-530`), so the card can go stale.
- Escape calls `hideDecision()` (`app.js:174`) without resolving: the decision silently disappears and auto-play resumes.
- Choice `data` is serialised into `onclick` strings (`ui.js:1738`). Labels wrap at 412px.

## 14. Modals

- `.modal` is `max-height:80vh; overflow-y:auto`; City Insight, loan offers and manager hire nest another scroll container: double scrollbars and scroll-chaining traps on iOS.
- `.modal-close` overlaps the header h3.
- `showCompareModal` builds a whole grid (`ui.js:658-697`) then discards it (`ui.js:700`).
- No focus trap, no `aria-modal`, no return-focus.

## 15. Ads overlay

- `#ad-interstitial` is `z-index:9999` above the pending decision card: the player returns from the ad to an un-dismissed decision.
- Web fallback uses `window.confirm` for the purchase (`ads.js:198`).
- Native path has a 60s safety timeout (`ads.js:103`) that can re-resume auto-play after a real ad closed earlier.
- The ad shows immediately after toasts/confetti fire, covering the celebration.

## CSS architecture

- Tokens exist (`style.css:6-39`) but are bypassed: 208 inline `style=""` in `ui.js`, hardcoded hex in ~60 places, undefined tokens `--text-dark` and `--border-light`. No spacing scale (15 distinct pixel values) and no type scale (16 distinct rem values between 0.5 and 0.95).
- Duplicate/conflicting declarations: `.game-screen` (131 vs 2798), `.portfolio-summary-value`, `floatUp`, `shimmer`. A "fix scrolling" block at 2796-2808 patches earlier rules.
- 10 `!important`s. 8 media queries, desktop-first with mobile overrides at ≤480; nothing between 480 and 600 targets the 412px phone.
- No `env(safe-area-inset-*)`, no `viewport-fit=cover`; with `black-translucent` status bar the HUD sits under the iOS status bar.
- No dark mode, no `prefers-reduced-motion`, no `@media (hover:hover)`.
- Nested scroll regions (`html,body overflow:hidden` + fixed screens + scrolling grid).
- Emoji used as icons in nav, tabs, headers, chips, badges, HUD; font fallbacks differ per component.

## Font loading

- Render-blocking Google Fonts link for 4 families / 8 weights; Cinzel Decorative used only for the splash h1. No preload, no self-hosting, not in the service worker precache, so offline the whole look changes. `display=swap` causes a visible FOUT on the title.
- CSS cache-busted at `?v=7.2` while scripts are `?v=7.3`.

## Animation / rendering performance

- Every month on the active tab the full screen is rebuilt with `innerHTML` (`app.js:516-523`), plus `updateHUD` rebuilds the speed controls. At speed 3 that is a full DOM teardown every 0.8s; `renderMap` additionally regenerates all pins and runs the investment formula twice for 20 cities.
- Inline `onclick` handlers: 86 in `ui.js`, 19 in `app.js`.
- The intro loop rebuilds every gradient (sky, moon, 36 firefly gradients, vignette) each frame (`intro.js:144-237`).
- Three.js (~600KB), d3 (~280KB), topojson, 20 city defs, `graphics.js` (180KB, mostly dead) all load synchronously before `ui.js`; no `defer`, no lazy-load of the 3D engine.
- 3D view keeps rendering soft shadows while the player scrolls the list beneath it.

## Responsiveness

- 360px: HUD cannot fit its contents; city header wraps to 3 lines; campaign pill wraps to 3 lines and covers the header.
- 412px: overlaps listed above.
- Tablet/desktop: content caps at 960px but HUD and nav span the full width; four-column card grid with phone-sized text; no keyboard focus styles anywhere.

## UI ↔ engine logic duplication

| UI location | Engine source | Risk |
|---|---|---|
| Investment score formula ×3 (`ui.js:230-237`, `356-361`, `2224-2228`) | not in engine | three copies |
| Shell-company cost `ui.js:858` | `game.js:2808` | |
| Demolish 10% `ui.js:852`, `app.js:608` | `game.js:655` | |
| Sale proceeds/agent fee `ui.js:847-848` | `game.js:457` | |
| Refurb tiers `ui.js:816-820` | `game.js:548-560` | UI omits fail chance and durations |
| Build cost + era whitelist `ui.js:830-841` | `game.js:615-623` | |
| Eviction cost `ui.js:796` | `game.js:528` | wrong number shown |
| Disaster probability `ui.js:946-962` | `game.js:934-948` | |
| Degradation "12% each January" `ui.js:929-934` | `game.js:1301` | hardcoded string |
| Loan remaining interest `ui.js:2033` | `game.js:2113` | approximation |
| Open-bank threshold `ui.js:2020` | `game.js:2419` | |
| Dividends `ui.js:2171` | `game.js:2335` | |
| Portfolio synergy `ui.js:1354-1358` | `game.js:1092-1099` | |
| Forecast savings `ui.js:1256` | `savingsBalance` | wrong field |

## Accessibility

- `user-scalable=no, maximum-scale=1.0` blocks pinch zoom.
- Zero `aria-*`/`role` attributes. Icon-only buttons have no accessible names; toasts have no `aria-live`; modals no `role="dialog"`; collapsible headers are `div onclick`.
- Contrast: `--text-muted #99A3A8` on white = 2.6:1 (every stat label); white on `--warning` = 2.0:1; white on gold = 2.1:1; `.loan-rate` = 3.0:1.
- Type sizes 8–11px throughout.
- Colour-only state on condition bars, badges, risk chips.
- No `prefers-reduced-motion`; infinite animations on splash, map, NEXT badge.
- No `:focus-visible`; cards are divs with click delegation, not keyboard reachable.

## Top 15 presentation changes (prioritised)

1. Fix the z-index stack so modals block; scrim on decision cards; block Next while a decision is pending. (S)
2. Rebuild the HUD: 56–64px, Next as a ≥44px primary pill, safe-area insets, fix NET WORTH clipping. (M)
3. Replace the toast stack with one per-turn summary; coalesce duplicates; move disasters/events out of the 8s ticker. (M)
4. Give the campaign pill and ticker one status band under the HUD. (S)
5. World map legibility: named labels for locked cities, ≥32px pins, ≥11px labels, stop infinite ocean animations. (M)
6. Property card corner collision between badge and compare toggle. (S)
7. Negotiation UI: offer price, success chance bar, savings, three real buttons. (S)
8. Single icon system: SVG sprite replacing emoji; fix crown, London icon, family icons. (L)
9. Design tokens + type/spacing scale; consolidate duplicates; remove inline hex/`style=""`. (L)
10. Stat chips with words, not emoji. (S)
11. Settings speed control rendering and stale copy; hide debug recording. (S)
12. Correct wrong numbers shown (evict cost, luxury fail %, forecast field, bank threshold/interest) by routing through engine getters. (S)
13. Stop full-screen `innerHTML` rebuilds per turn; pause 3D when off-screen. (M)
14. Accessibility baseline: pinch zoom, aria labels, dialog roles, contrast, reduced motion, focus styles. (M)
15. Desktop/tablet layout: constrain HUD/nav to the content column; two-pane city screen ≥1024px; hover guard. (M)
