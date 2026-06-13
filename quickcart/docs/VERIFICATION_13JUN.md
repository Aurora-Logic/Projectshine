# Verification audit — 13 Jun 2026

Two-part audit after the overnight run: a **functional pass** (real Chrome,
real clicks, every dealer flow) and a **UI-quality pass** (every surface
reviewed at 2× against the Blinkit/Instamart bar).

## Functional — 16/16 flows pass, zero page errors

Run it anytime: `npm run audit:e2e` (drives installed Chrome over the dev
server; exit code = failed flows).

| Flow | Verdict |
|---|---|
| Home renders (navbar, hero, bestsellers, kit banner, inspo strip) | ✅ |
| Add to cart: card → qty sheet → confirm → cart bar count | ✅ |
| Qty sheet: typed quantity drives CTA + bulk meter | ✅ |
| Bill math: item − scheme − coupon + fee = to-pay (parsed from DOM) | ✅ |
| Place order: PO dialog, credit due echo, PO lands in ledger | ✅ |
| POD card on delivered order (photos + OTP chip + receiver) | ✅ |
| Claims: order pick → items → submit → tracked stages | ✅ |
| Brand support: type-dependent validation → tracked row | ✅ |
| Kit builder: steppers rescale list; add-all reaches cart | ✅ |
| Find a Pro: tabs, `tel:`/`wa.me` actions, referral validation | ✅ |
| Inspiration: grid → look → shop rows → add full look | ✅ |
| Hinge thickness filter narrows the PLP | ✅ |
| Door-closer selector recommends a rated SKU | ✅ |
| Tokenized search finds the right SKUs | ✅ |
| Back gesture: closes qty, keeps PDP, then closes PDP | ✅ |
| Keyboard: Enter opens focused card, Escape closes | ✅ |

Notes: first audit run scored 8/16 — every failure was a bug in the test
script (missing route hashes, bill parser assuming label+amount share a line,
ledger asserted before the dialog's Done). The app needed zero functional
fixes.

## UI quality — findings & fixes (shipped)

Reviewed: home (full scroll), kit, pros, inspo grid + look, claims (form
open), brand (form open), qty sheet, cart, orders, credit, login, dash.

| Finding | Severity | Fix |
|---|---|---|
| **Kit banner read as a flat gray slab** between two designed cards (quiz, brand-day) — placeholder energy | High | Rebuilt as an image-led campaign card: full-bleed kitchen photo, left scrim, gold eyebrow `KITCHEN · WARDROBE · OFFICE`, white title/sub, white pill CTA |
| **Brand support hero** was one cramped icon+line; claims got a structured hero | Med | Structured hero (eyebrow / title / sub) via new `.sub-hero.stack` variant — flex kept for icon-row usages |
| **Brand support field labels** in sentence case (`Preferred date`) while the app convention is 10.5px caps | Med | `BOARDS / STANDEES NEEDED`, `APPROX. PIECES NEEDED`, `PREFERRED DATE` |
| Office kit tile photo read as audio gear | Low | Swapped to the verified office-interior shot (fixed during build) |
| POD second photo was a dark mechanic shot — off the clean-&-bright bar | Low | Swapped to box-handover photo (fixed during build) |

False alarms (no action): blank bands in full-page home captures are a
`content-visibility: auto` screenshot artifact — sections paint normally when
scrolled; Brand-Day card verified rich at viewport.

## Status after audit

Lint 0 errors · vitest 24/24 · e2e 16/16 · zero console errors.
