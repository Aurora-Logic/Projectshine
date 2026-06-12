# QuickCart — Backend Contract (v1)

The client app is a complete, demoable front end; every dynamic surface currently
runs on seeds in `src/data.js` plus `qc-*` localStorage keys. This document is the
handoff: each section lists the API that replaces a mock, the payload the UI
already renders, and the localStorage key it retires.

Conventions: REST + JSON, `Authorization: Bearer <jwt>`, money in **paise**
(integers; the UI divides by 100), timestamps in ISO-8601 IST, ids ULID.
`GET` list endpoints page with `?cursor=` and return `{ items, nextCursor }`.

---

## 1 · Auth & dealer profile

| Endpoint | Replaces |
|---|---|
| `POST /auth/otp` `{ phone }` → `{ requestId }` | demo "any 4 digits" gate |
| `POST /auth/verify` `{ requestId, code }` → `{ jwt, dealer }` | `qc-auth` |
| `GET /me` → dealer `{ id, firm, gstin, tier, region, rank: { pos, of, deltaWk } }` | `MY_RANK`, header strip |

`dealer.tier` drives the membership card; `rank` feeds the header chip and
leaderboard "You" row.

## 2 · Catalog

| Endpoint | Replaces |
|---|---|
| `GET /catalog/products?cat=&brand=&q=&cursor=` | `FEED_POOL` + client search |
| `GET /catalog/products/:id` | PDP fields |
| `GET /catalog/categories` | `CATEGORIES`, `CAT_RULES` |

Product shape the UI already consumes:

```json
{
  "id": "ba1", "name": "Ebco Telescopic Drawer Slide 450mm (pair)",
  "brand": "ebco", "cat": "Drawer Slides", "subcat": "Telescopic",
  "price": 38500, "mrp": 45000,
  "bulk": { "thr": 10, "price": 35000, "unit": "pc" },
  "stock": 64, "leadDays": 0,
  "specs": { "mat": "Steel", "load": 35, "size": 450, "doorThk": null, "carcassThk": null },
  "images": ["https://cdn.../ba1-1.jpg"]
}
```

- **A4.7**: `images[]` comes from this API (client currently uses Unsplash stand-ins).
- `bulk` arrives structured — the client's string-parsing (`money.js → bulkTier`)
  becomes a fallback only.
- Hinge `doorThk`/`carcassThk` power the B2 filters; closer `load`/`size` power
  the B3 selector. Server must index them.

## 3 · Cart, orders, invoices

| Endpoint | Replaces |
|---|---|
| `POST /orders/quote` `{ items: [{ id, n }], couponId?, express }` → priced bill | client-side bill math |
| `POST /orders` `{ quoteId, addressId, note? }` → order record | `qc-order`, `qc-bills` append |
| `GET /orders?from=&to=` | `PAST_ORDERS` |
| `GET /orders/:id` | order detail snapshot |
| `GET /orders/:id/invoice.pdf` | client-rendered invoice |
| `GET /orders/:id/track` → `{ stage, eta, rider? }` | demo 0/45/150/300s timeline |

The quote response **is** the bill snapshot the UI stores today:
`{ itemTotal, bulkSave, schemeOff, coupon: { label, off } | null, deliveryFee,
expressFee, toPay, dueTs, payMode }` plus `items[].unit` (effective unit price).
Server is the source of truth; the client renders, never recomputes.

### Proof of delivery (B7)

| Endpoint | Notes |
|---|---|
| `POST /orders/:id/pod` *(rider app)* multipart `{ photos[2..4], otp, receiverName, geo }` | upload lives in the rider app |
| `GET /orders/:id/pod` → `{ photos[], receiverName, role, verifiedBy: "otp", at, geo }` | dealer-side POD card (shipped) |

## 4 · Credit ledger

| Endpoint | Replaces |
|---|---|
| `GET /credit` → `{ limit, outstanding, bills: [{ id, amt, due, status }] }` | `CREDIT` + `qc-bills` − `qc-paid` (`creditState()`) |
| `POST /credit/payments` `{ billIds[], utr }` | `qc-paid` |

Placement adds the PO to `bills` server-side (today the client appends on
`onPlaced`).

## 5 · Rewards: coupons, wheel, quiz, streak

| Endpoint | Replaces |
|---|---|
| `GET /rewards/coupon` → active coupon or null | `qc-coupon` |
| `POST /rewards/wheel/spin` → `{ segment, coupon? }` | client RNG |
| `POST /rewards/quiz/answers` `{ day, answers[] }` → `{ correct, coupon? }` | client scoring |
| `POST /rewards/streak/checkin` → `{ days[], banked? }` | `qc-streak-days` |

Server validates one spin/quiz/check-in per day per dealer (client keys
`qc-spin-day`/`qc-quiz-day` are UX hints only). Coupon kinds the UI renders:
`pct`, `amt`, `freedel`.

## 6 · Claims Centre (B6)

| Endpoint | Replaces |
|---|---|
| `POST /claims` multipart `{ orderId, type, items: [{ id, n }], photos[], notes }` | `qc-claims` |
| `GET /claims` | claims list + stage dots |
| `PATCH /claims/:id` *(ops console)* `{ status }` | timed demo stages |

`type ∈ { pending_cn, material_return, wrong_delivery, damaged }`. Terminal
statuses per type (UI copy already matches): `cn_issued`, `pickup_scheduled`,
`replacement_dispatched`. CN settlement must post into the credit ledger (§4).

## 7 · Brand support (B4)

| Endpoint | Replaces |
|---|---|
| `POST /marketing/requests` `{ type, qty?, date?, notes }` | `qc-mkt` |
| `GET /marketing/requests` | request list + stages |

`type ∈ { branding_kit, inshop_demo, carpenter_meet, promo_items }`; demo/meet
carry `date`, kit/promo carry `qty`. Stages: `received → approved →
dispatched | scheduled`.

## 8 · Site visits & display requests

| Endpoint | Replaces |
|---|---|
| `POST /visits` `{ kind: site|display, customer, address, slot }` | `qc-visits-*` |
| `GET /visits` | request hub stages |

## 9 · Project lists & kits (B1)

| Endpoint | Replaces |
|---|---|
| `GET/POST/PATCH/DELETE /lists` | `qc-lists` |
| `GET /kits` → kit recipes | `KITS` seed |

Kit recipes are content (merchandising tunes them) — same shape as the seed:
`{ key, label, counts: [[key, label, default]], items: [[sku, perKey|fixed, qtyPer]] }`.

## 10 · Find a Pro & referrals (B8/B9)

| Endpoint | Replaces |
|---|---|
| `GET /pros?type=carpenter|designer&area=` | `PROS` seed |
| `POST /pros/referrals` `{ name, phone, type }` | `qc-refs` |

Referral conversion events feed scorecard factor E (§12).

## 11 · Inspiration CMS (B10/B11)

| Endpoint | Replaces |
|---|---|
| `GET /inspo?room=&cursor=` | `INSPO` seed |
| `GET /inspo/:id` | look detail + product ids |

Admin CMS owns creation; `fresh` flag = published within 7 days ("UPDATED
WEEKLY" strip). Looks reference live SKU ids — validate on publish (the client
test suite enforces this for seeds).

## 12 · Dealer scorecard (B12) — **server-side only**

- `GET /scorecard` → `{ score, band, factors: [{ key, label, status: ok|push }] }`
- **Weights and formula never ship to the client.** The bundle is public; the
  group's agreed weights (continuity / range / payments / targets / referrals /
  engagement) live in the scoring job only. The API returns computed
  score + qualitative nudges, nothing reverse-engineerable.
- Inputs: order events, payment timeliness (§4), referral conversions (§10),
  session-day events (§13). Nightly batch; history retained for trend.

## 13 · Events

`POST /events` batched `[{ type, ts, props }]` — minimum set:
`session_start`, `order_placed`, `payment_made`, `feature_used`
(`{ feature: kit|inspo|pros|claims|brand|calculator }`), `referral_sent`.
Powers B12 factor F (session-days/week + feature breadth — **not** raw minutes,
which are gameable) and the dashboard insights.

## 14 · Targets & schemes

| Endpoint | Replaces |
|---|---|
| `GET /targets` → `{ monthly, quarterly, yearly: { goal, done, endsAt, incentive } }` | `TARGETS` |
| `GET /schemes` → volume slabs + fest campaigns | `SCHEMES`, `FEST` |

---

## Migration map (client keys → API)

| localStorage key | Section |
|---|---|
| `qc-auth` | §1 |
| `qc-order`, `qc-bills`, `qc-paid` | §3, §4 |
| `qc-coupon`, `qc-streak-days`, `qc-quiz-day`, `qc-spin-day` | §5 |
| `qc-claims` | §6 |
| `qc-mkt` | §7 |
| `qc-visits-site`, `qc-visits-display` | §8 |
| `qc-lists` | §9 |
| `qc-refs` | §10 |
| `qc-addr`, `qc-addr-sel`, `qc-note` | §3 (`/addresses` CRUD, order note) |
| `qc-geo` | stays client-side (theme opt-in) |
| `qc-hero-idx`, `qc-streak-day`, `qc-coins` | stay client-side (presentation) |

## Non-functional

- p95 < 300 ms on catalog/quote (the UI animates at 60fps against optimistic
  state; slow quotes break the "instant" feel).
- Images: WebP/AVIF via CDN, `?w=` resizing like the current Unsplash URLs so
  `img(id, w)` maps 1:1.
- Idempotency keys on `POST /orders`, `/claims`, `/credit/payments`.
- Webhooks or polling for claim/visit/marketing stage changes; the UI already
  renders stage dots from status fields.
