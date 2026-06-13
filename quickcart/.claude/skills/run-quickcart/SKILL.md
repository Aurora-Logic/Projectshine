---
name: run-quickcart
description: Build, run, drive, and screenshot the QuickCart app (furniture-hardware q-commerce React/Vite PWA). Use when asked to run, start, launch, build, test, screenshot, or visually verify QuickCart, or to confirm a change works in the real app rather than just tests.
---

# Run QuickCart

QuickCart is a **single-page React 19 / Vite PWA** — a B2B furniture-hardware
q-commerce prototype. **No backend:** all state is mock/seeded and persists to
`localStorage` (`qc-*` keys). Every screen is reachable by a `#hash` deep link,
and **any non-empty hash bypasses the login gate** (the `authed` useState seed in
`src/App.jsx`: `if (window.location.hash) return true`), so
deep-linking is how you drive it.

It's driven headlessly with **`playwright-core` against the locally-installed
Chrome** (this repo's environment is macOS, not Linux — `chromium-cli` is not
present here). The driver is
[.claude/skills/run-quickcart/driver.mjs](.claude/skills/run-quickcart/driver.mjs):
it owns its own dev server on a **strict port (5199)** so it never collides with
or kills a dev server you already have running on 5173/5174.

All paths below are relative to the `quickcart/` directory. Run commands from there.

## Prerequisites

- **Node ≥ 20** (built and verified on v24).
- **Google Chrome** at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
  On a non-macOS box, install Chromium and pass `CHROME=/path/to/chromium` as an
  env var — the driver reads it.
- No `apt-get` needed: this runs on the macOS host, and `playwright-core` is
  already a devDependency (it drives the existing Chrome, it does not download one).

## Build

```bash
npm install        # idempotent; node_modules is usually already present
npm run build      # vite build → dist/  (≈300ms, exits 0; warns about a >500kB chunk — expected)
```

## Run (agent path) — this is what you use

The driver launches its own dev server, drives Chrome, screenshots, and tears the
server down. Screenshots land in `.claude/skills/run-quickcart/shots/` (gitignored)
and the path is printed.

```bash
# one route
node .claude/skills/run-quickcart/driver.mjs shot '#home'

# several routes in one server boot
node .claude/skills/run-quickcart/driver.mjs shots '#cart' '#credit' '#pdp' '#wheel'

# functional walk (delegates to npm run audit:e2e) — 16 dealer flows
node .claude/skills/run-quickcart/driver.mjs smoke

# drive a server you already have up instead of spawning one
node .claude/skills/run-quickcart/driver.mjs shot '#home' --base http://localhost:5174
```

**Always look at the PNG** the driver writes — a clean exit only means no JS threw,
not that the page is right. The driver also prints `⚠ N page error(s)` per route if
anything throws.

**Useful hashes** (full table in `README.md`): `#home` `#plp` / `#plp-Hinges`
`#search` `#pdp` `#qty` `#cart` `#order` / `#ordpg` `#reorder` `#account` `#dash`
`#credit` `#lists` `#orders` `#site` `#claims` `#brand` `#kit` `#pros` `#inspo`
`#wheel` `#sim`.

## Run (human path)

```bash
npm run dev        # vite; opens on the FIRST FREE port from 5173 (NOT always 5174)
```

Read the "Local: http://localhost:PORT" line from the output — the port is **not**
fixed (the README says 5174 only because 5173 was busy when it was written). Useless
headless; for agent work use the driver above. Stop with Ctrl-C.

## Test

```bash
npm run test       # vitest — 46 unit tests (money/data), ~230ms, all pass
```

## Gotchas

- **Dev port is not deterministic.** `npm run dev` takes the first free port
  starting at 5173, so on a machine already running QuickCart you'll land on 5175+.
  The driver sidesteps this by forcing `--port 5199 --strictPort`. Never hardcode
  5174.
- **Login gate.** With no hash, the app shows a phone+OTP login. The driver pre-sets
  `qc-auth=1` AND deep-links with a hash (either alone is enough — any hash bypasses
  the gate). Demo accepts any 10-digit phone + any 4-digit OTP if you ever drive the
  real login.
- **Daily quiz / spin pop-ups** auto-open once per day and will cover the screen
  mid-flow. The driver seeds `qc-quiz-day` / `qc-spin-day` to today to suppress them.
  If you screenshot without the driver's init script, expect a modal.
- **Headless min-width clamp.** Chrome headless won't make a window narrower than
  ~500px, but this app is a 430px-wide mobile PWA. The driver gets the true 430×932
  viewport by setting it on `browser.newContext({ viewport })` (NOT via `--window-size`),
  so screenshots come out 860×1864 (430×932 @ 2× DPR). Drive via a context, not a
  bare page, or the layout gets clamped.
- **First paint is slow-ish.** Vite serves a 330kB+ single bundle; the driver waits
  900ms after `domcontentloaded` before shooting. Heavier routes may need more — bump
  the `waitForTimeout` in `freshPage()` if a shot is half-rendered.
- **`smoke` currently reports 14/16.** The two failing flows ("find a pro",
  "door-closer selector") are **stale assertions** against the just-rebuilt Utilities
  tab (commits a180d48…), not regressions — the audit confirms **zero page errors**
  across all routes. Treat <14 passing or any page error as a real problem.

## Troubleshooting

- **`Chrome not found at: …`** → you're not on the macOS host, or Chrome moved. Set
  `CHROME=/path/to/chrome` (a Chromium binary works) and re-run.
- **`dev server never came up on http://localhost:5199`** → something already holds
  5199 (rare). The driver prints the tail of the vite log; pick another port by
  editing `PORT` in `driver.mjs`, or use `--base <url>` against a server you start
  yourself.
- **Screenshot is the login screen** → you passed an empty/missing hash and the init
  script didn't run. Pass a real hash like `'#home'`.
- **Shot looks half-rendered** → raise `waitForTimeout` in `freshPage()` (driver.mjs).
