# QuickCart — Furniture Hardware for Dealers

A B2B quick-commerce prototype: furniture **fittings** (drawer slides, hinges, locks, handles, kitchen & wardrobe systems, office fittings, lighting) for hardware **dealers** — benchmarked against Blinkit/Instamart, built dealer-first.

**Live:** https://quickcart-nine-iota.vercel.app · Installable as a PWA (Add to Home Screen).

## What's inside

- **Commerce:** category/brand IA, full filter system (incl. spec filters), bulk-tier pricing, qty sheet with dealer quantities, product pages with Zara-style swipe nav, cart with volume schemes + express delivery, order placement → live tracking → GST invoice download.
- **Dealer layer:** 30-day credit ledger (status-colored, pay bills, downloadable ledger), monthly/quarterly/yearly targets, tier journey, one-tap reorder with buying-cadence intelligence, project lists per job site, site/showroom visit booking with customer capture + tracking.
- **Engagement:** daily quiz & spin (game-night design, 7 daily felt themes), streaks, rotating hero palettes & layouts per open.

## Run it

```bash
npm install
npm run dev        # http://localhost:5174
```

## Demo behavior you should know

- **No hash → dealer login gate** (phone + OTP; *demo — any 10-digit number and any 4-digit OTP work*; guest path available). **Any `#hash` URL bypasses the gate** — intentional, for design review.
- Data is seeded/mock; orders, credit and requests persist to `localStorage` (`qc-*` keys). "Reset app data" lives on the error screen; or clear site data.
- Product photos are interior stand-ins; real packshots arrive from the backend.

### Review deep links

| Hash | Opens |
|---|---|
| `#home` | Home (skips gate) |
| `#login` | Login gate |
| `#plp` / `#plp-Hinges` | Category listing |
| `#search` | Search |
| `#pdp` | Product details |
| `#qty` | Bulk qty sheet |
| `#cart` | Cart (preloaded) |
| `#order` / `#ordpg` | Order tracking card / order detail page |
| `#reorder` / `#pastorder` | Reorder page / past-order edit sheet |
| `#account` `#dash` `#credit` `#lists` `#orders` `#site` | Account + sub-pages |
| `#wheel` | Spin & Win |
| `#sim` | Dev simulator (sky/quiz/hero variants) |
| `#fest-a`…`#fest-e` / `#hero-<palette>` | Pin a hero layout / palette |

## Stack

React 19 · Vite · Radix Themes (green accent) · single-file app by design for prototype speed (split planned — see `docs/PLAN.md`).

## Working docs

Everything tracked in **[docs/PLAN.md](docs/PLAN.md)** — audit-driven fix tracks (A0–A6) + client feature roadmap (B1–B12).
