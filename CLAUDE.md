# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Weather Chat: a static, client-only React 18 + Vite + TypeScript app. The user types plain-English questions ("weather in Paris", "what should I wear tomorrow?"), and the app answers with current conditions, an hourly chart and rule-based clothing advice. Data comes from Open-Meteo (geocoding + forecast), which needs no API key. There is no backend.

## Commands

```bash
npm run dev                                  # dev server (base path /Weather-app/)
npm test                                     # all unit tests (vitest, node environment)
npx vitest run src/__tests__/intent.test.ts  # one test file
npx vitest run -t "says snow"                # tests matching a name
npx tsc --noEmit                             # type-check only
npm run build                                # type-check, then production build into dist/
npm run preview                              # serve dist/ at http://localhost:4173/Weather-app/
npm audit --omit=dev --audit-level=high      # the audit CI runs (dev-tool advisories are expected and ignored)
```

There is no linter. Tests run in the `node` environment, so there are no component/DOM tests; UI behaviour is checked by driving `npm run preview` in a browser with the Open-Meteo hosts mocked.

## Architecture

**Request flow** (`src/App.tsx`, `answer()`): user text → `parseIntent` (`lib/intent.ts`) → `geocode` → `fetchForecast` (`lib/openMeteo.ts`) → `hoursFor` picks the hours (next 24h, or tomorrow's calendar day) → `setStage(...)` plus a chat message. If the text names no place, the last successfully loaded place is reused.

**Two surfaces, one state.** `App` owns `stage` (the forecast being shown) and `messages`.
- `components/Stage.tsx` renders the big weather view (temperature, stats, daylight arc, `HourlyChart`) from `stage`. It is keyed on place/time so it remounts and re-animates per answer.
- `components/ChatPanel.tsx` renders the conversation and the dock (chips + input).
- The sky theme is derived from `stage` via `lib/sky.ts` and set as `data-sky` on the root. All palettes and animated layers (cloud, rain, snow, stars, lightning) live in `src/styles.css` under `.sky[data-sky='…']`; `SkyBackdrop.tsx` is only empty decorative divs.

**Units are never baked into state.** Everything is stored in °C and km/h (`types.ts`). Chat messages hold `text`/`body` as functions of `units`, and components convert at render time with `lib/units.ts`. This is what makes the °C/°F toggle update earlier messages; do not store formatted strings or pre-rendered JSX in messages.

**Pure logic lives in `src/lib/` and is what the tests cover:** intent parsing, forecast mapping/validation, outfit rules (`outfit.ts`), chart geometry (`chart.ts` returns SVG path strings and label positions; `HourlyChart.tsx` only draws them), sky mapping, sun/daylight maths, stage copy.

**Times are local ISO strings from the API** (`timezone=auto`), compared as strings or sliced (`time.slice(11, 16)`). Do not convert them through `Date` in the viewer's time zone.

## Constraints that are easy to break

- **Content-Security-Policy.** `vite.config.ts` injects a strict CSP meta tag into production builds only: no inline scripts, `style-src 'self'`, `font-src 'self'`, and `connect-src` limited to the two Open-Meteo hosts. Any new network host, CDN asset or web font must be allowed there, and CSP problems only show up in `npm run build` + `npm run preview`, not in `npm run dev`.
- **Fonts are self-hosted** through `@fontsource/*` imports in `src/main.tsx` (import without the `.css` extension, e.g. `@fontsource/instrument-sans/latin-500`). Do not add Google Fonts links; that would break the CSP and the privacy note.
- **Base path.** `VITE_BASE_PATH`, else `/` when `VERCEL` is set, else `/Weather-app/` (GitHub Pages).
- **Input cap.** `MAX_INPUT` (200) in `lib/intent.ts` bounds regex work and is also the input's `maxLength`. Keep both, and keep the adversarial-input timing test passing when editing the regexes.
- **Privacy.** Coordinates are rounded to 2 decimals before being sent. The footer and README state exactly what leaves the browser (typed places, approximate coordinates) and that only the unit choice is stored; keep them true.
- **API payloads are untrusted.** `mapForecast` validates and skips bad hours rather than rendering `NaN`; optional fields (`daily`, `timezone_abbreviation`) must stay optional.
- **Motion.** Every animation must be disabled under `prefers-reduced-motion`. Entrance styles that hide content (e.g. the chart line's dash offset) are scoped to `prefers-reduced-motion: no-preference` so the page is complete without animation.
- **Stacked layout (≤900px).** The dock is `position: fixed`; `.chat` must not get `backdrop-filter` or `transform` there, or the dock stops being fixed to the screen.
- No secrets in `VITE_*` variables: they are bundled into the public JS. A keyed API would need a serverless function.

## CI and deploy

`.github/workflows/deploy.yml` runs on pull requests (install, test, build, production audit; no deploy) and on pushes to `main` (same, then deploy `dist/` to GitHub Pages at `/Weather-app/`).

**Deploy job failing within ~3 seconds with no steps and no log** (the `build` job is green) is not a code problem. The reason appears on the job's page: "Branch `main` is not allowed to deploy to github-pages due to environment protection rules". Fix it in GitHub settings, not in the repo: Settings → Environments → `github-pages` → Deployment branches and tags must allow `main` (No restriction, or a rule for `main`; "Protected branches only" does not work). Also keep the repo's default branch set to `main`. After fixing, re-run only the failed jobs; no new commit is needed. The job log returns HTTP 404 through the API, so ask the user for the message on the job page.

## Working in this repo

- Changes go to `main` through pull requests that the user merges (merge commits). Work happens on `claude/focused-gates-ldlier`; once its PR is merged, restart it from the latest main (`git fetch origin main && git checkout -B claude/focused-gates-ldlier origin/main`) before new work. Do not force-push.
- The user sometimes merges `main` into the branch on GitHub, so `git fetch` before pushing; if the push is rejected, merge `origin/claude/focused-gates-ldlier` into the local branch rather than rewriting history.
- Open-Meteo and `github.io` are not reachable from the Claude Code cloud sandbox. Verify UI changes by serving `npm run preview` and driving it with Playwright while routing `**/geocoding-api.open-meteo.com/**` and `**/api.open-meteo.com/**` to canned JSON (include `daily.sunrise`/`sunset` and `timezone_abbreviation`). Do this on the production build so the CSP is exercised, and watch for CSP console errors. Real-data behaviour can only be confirmed on the deployed site, so say so in PR descriptions.
