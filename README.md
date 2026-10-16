# Cabo Score Tracker — Web 🦄

A web port of the [SwiftUI Cabo score tracker](https://github.com/patricebender/cabo).
Track scores for the card game **Cabo**: add players, enter round scores with the
special-combo and Cabo-call rules, and keep running totals — all in the browser.

- **Zero backend.** Game state lives in `localStorage`, so it survives reloads and
  costs nothing to host.
- **Deploys as static files** to Firebase Hosting's free tier (≈ $0 for this app).
- **Full scoring engine ported 1:1** from the iOS `GameViewModel`, with the complete
  test suite ported from Swift Testing to Vitest.

## Stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 |
| Tests | Vitest 3 (jsdom) |
| Hosting | Firebase Hosting (static) |

## Features (parity with the iOS app)

- Add up to **6 players**; players added mid-game don't affect past scores (dummy rounds).
- Enter round scores with **single-select special combo** (2×12 & 2×13) and **Cabo call**.
- Scoring rules, all recomputed from raw inputs so **editing a past round is correct**:
  - Cabo caller who isn't lowest → **+5 penalty** (ties are safe).
  - Optional setting: Cabo caller who *wins* scores **0** (`caboWinnerGetsZero`).
  - Special combo → winner scores **0**, everyone else **+50**.
  - Hitting **exactly 100** total resets to **50** (repeatable).
- **Round overview** with per-round scores, running totals, edit and delete.
- Edit / delete / rename players, reset game, settings — all with confirmation dialogs.
- Responsive, touch-friendly, dark-mode aware, installable as a home-screen web app.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Test

```bash
npm test           # run the scoring-engine suite once
npm run test:watch # watch mode
```

The engine tests live in `src/game/engine.test.ts` and mirror the Swift
`caboTests/CaboTests.swift` case-for-case.

## Build

```bash
npm run build      # typecheck + production build into dist/
npm run preview    # serve the built dist/ locally
```

## Deploy to Firebase Hosting (cheapest option)

One-time setup:

```bash
npm install -g firebase-tools   # or: npx firebase-tools ...
firebase login
```

Point the project at your Firebase project. Either edit `.firebaserc` and replace
`REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`, or run:

```bash
firebase use --add            # pick/create a project interactively
```

Then build and deploy:

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` is already configured to serve `dist/` as a single-page app
(all routes rewrite to `index.html`) with long-lived caching for hashed assets
and `no-cache` for `index.html`.

### Why this is essentially free

The app is pure static files with no server, database, or auth. Firebase Hosting's
free (Spark) tier includes 10 GB storage and 360 MB/day of transfer with global CDN
and automatic HTTPS — far more than this app needs. Nothing scales with usage beyond
static file serving.

## Project layout

```
src/
  game/
    types.ts        # domain types (Player, PlayerSummary, RoundSummary)
    engine.ts       # scoring engine, ported from GameViewModel.swift
    round.ts        # build a round from per-player entry (RoundEntryView logic)
    engine.test.ts  # Vitest suite, ported from CaboTests.swift
  components/        # Modal, ScoreBadge, icons
  screens/           # Home, Overview, RoundForm
  useGame.ts         # React hook: engine + localStorage persistence
  App.tsx            # navigation + modals
```
