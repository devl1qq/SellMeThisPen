# Sell Me This Pen

Idle life-sim in the spirit of Progress Knight: start as a street pen seller, climb to megacorp overlord, die, and let your heir do it faster.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. The CrazyGames SDK runs in `local` mode on localhost (fake ad overlays, data stored in localStorage).

## Build for CrazyGames

```bash
npm run zip
```

Produces `sell-me-this-pen.zip` (contents of `dist/`, `index.html` at the zip root). Upload it at https://developer.crazygames.com → *Submit game* → HTML5, then use the **Preview** tool there to check ads and saves before submitting.

## Layout

| File | What it holds |
|---|---|
| `src/data.ts` | All content: careers, skills, shop items, perks, stock tickers |
| `src/game.ts` | State, formulas, tick loop, schemes, market, legacy, random events, save/load |
| `src/achievements.ts` | 46 dynasty-wide achievements, each with a small permanent bonus |
| `src/art.ts` | Hand-written SVG art: items, avatar, composed scene |
| `src/ui.ts` | DOM rendering, tabs, modals, toasts |
| `src/i18n.ts` | EN / UK strings |
| `src/sdk.ts` | CrazyGames SDK v3 wrapper (ads, gameplay events, cloud data) |

## CrazyGames integration

- `loadingStart/Stop` around boot, `gameplayStart/Stop` around play, modals and ads.
- Rewarded ads: +30 min Turbo, ×1.5 legacy points on inheritance, bail out of prison.
- Midgame ad: after starting a new generation (natural break).
- `happytime()` on inheritance.
- Saves go through the SDK Data module on CrazyGames (syncs for logged-in players), localStorage elsewhere.

## License

Copyright © 2026 Ivan Kovalenko. **All rights reserved.** The source is visible for reference only — copying, modifying, redistributing or publishing the game elsewhere is not permitted without written permission. See [LICENSE](LICENSE).
