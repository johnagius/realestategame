# Claude Code Instructions for Property Empire

## Version Bumping
**ALWAYS bump the game version with every push to main.**
Update these 3 places:
1. `index.html` — splash screen `<p class="splash-version">vX.Y</p>`
2. `index.html` — nav bar `<span id="game-version"...>vX.Y</span>`
3. `sw.js` — cache name `const CACHE_NAME = 'property-empire-vX.Y';`

Current version: v5.6

## Game Recording Analysis
**ALWAYS check for the latest game recording JSON file in the repo root.**
Look for files matching `property-empire-recording-*.json` — the higher the number in the filename, the newer the recording. Analyze these recordings to find bugs, balance issues, and exploits before the user has to report them.

## Deployment
- Push to `main` branch deploys to GitHub Pages automatically
- Service worker is network-first — updates reach players within 5 minutes
- Game state is in localStorage — safe across updates

## Testing
- Run `node js/simulate.js` for automated test suite
- Run simulations before pushing economy changes
- Test all 4 families: silva (Hard), chen (Normal), armstrong (Easy), vanderbilt (Sandbox)

## Key Files
- `js/game.js` — game engine (all economy, logic)
- `js/data.js` — city/property/business data, families, events
- `js/ui.js` — all UI rendering
- `js/app.js` — event handlers, navigation, modals
- `js/simulate.js` — headless test suite
- `sw.js` — service worker (cache version must match game version)
