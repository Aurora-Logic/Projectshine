# QuickCart — Master Plan (single working doc)

**Updated:** 13 Jun 2026 (Sprints 0–1 landed: A0 complete, A1 complete) · Consolidates the full audit (142 verified findings), its fix roadmap, and the client's 12-feature brief. Work from this file only; tick items as they land.

**Effort tags:** S ≤ 1h · M = half-day · L = multi-day

---

## Where the app stands (one paragraph)

Strong design showcase with real B2B domain thinking (credit ledger, reorder cadence, GST framing), exemplary animation hygiene, idiomatic Radix, 0 npm vulns. The verified gaps cluster: (1) one **broken-at-HEAD** bug (`downloadInvoice` deleted but still called), (2) **money numbers disagreeing across surfaces** — deadly for a price-literal dealer audience, (3) **reward/credit loops that never close** (wheel/fest/streak promise discounts that never reach the bill; checkout never mentions credit), (4) **touch-only interaction layer** (zero keyboard path, 10/12 dialogs unsemantic, dead-tap band over the feed), (5) **system debt** (no design tokens, 5,600-line monolith, red lint, 510 kB chunk). Everything is fixable; most of it cheaply.

**Strengths to protect during refactors:** transform/opacity-only animations + `content-visibility`; guarded `JSON.parse` everywhere; rAF-throttled scroll; `memo(ProductCard)` + stable contexts; per-overlay back-gesture handling; zero emoji-as-chrome; honest demo labeling; consistent empty states; six reduced-motion blocks.

---

## TRACK A — Fixes (from the audit)

### A0 · Broken or actively self-sabotaging — do first (≈1 day)

- [x] **A0.1 S** Restore `downloadInvoice` (deleted in `0275feb`, two live call sites throw `ReferenceError`; recover from `12b6f4f`, share scaffold with `downloadLedger`, render from the bill snapshot once A1.4 lands).
- [x] **A0.2 S** Guard the cart popstate handler: `if (!qtyRef.current) setCartOpen(false)` — today, confirming a qty from the in-cart flash strip ejects the dealer from checkout.
- [x] **A0.3 S** Kill the dead-tap band: `.footer { pointer-events: none }` + `auto` on `.cartbar.show`/`.navrow` (mirror `.plp-cartwrap`). An invisible ~66px strip eats taps whenever the cart is empty.
- [ ] **A0.4 S–M** Utilities tab: currently a silent no-op. Resolution decided with the client brief → becomes **Find a Pro** (B8/B9). Interim if features ship later: aggregate Calculators + visit tools, or hide the tab.
- [x] **A0.5 S** Error boundary in `main.jsx` (branded reload card; optional `qc-*` clear). White-page → recoverable.
- [x] **A0.6 S** Remove/dev-gate the `window.onerror` title hook in `index.html` (visitors can currently see `ERR:…` as the tab title).
- [x] **A0.7 M** Lint to green: delete dead code (`ClearanceStore`, `OrderDetailSheet`, `LeaderCol`+`LEADERS`, `TimerIcon`, dead props), fix genuine hooks errors, downgrade compiler-prep rules to `warn`. Keep it green after.

### A1 · Money & trust coherence (dealer-credibility pass)

- [x] **A1.1 M** Single source of truth for cart: store only `items`; derive `count/total/photos`; steppers read `cart.items[p.id]?.n` via context — delete local `useState(0)` in ProductCard/FlashCard/ComboCard. (Fixes stale steppers + count/total corruption.)
- [x] **A1.2 S** `EndlessFeed` must stop rewriting product ids (`f0-`+id) — batch goes in the React `key`; same SKU merges into one cart line so bulk tiers aggregate.
- [x] **A1.3 S** One bulk-price story: chip, CTA, cart row, bill must agree (effective price + struck full price, or explicit "−₹X on invoice" everywhere).
- [x] **A1.4 M** Snapshot the bill on the order record (`itemTotal, bulkSave, schemeOff, deliveryFee, expressFee, toPay`); render order detail + GST invoice from the snapshot. Kills ₹5,240-paid vs ₹5,660-invoiced.
- [x] **A1.5 M** Close the reward loop: persist `qc-coupon` on wheel win → bill line → consume on placement; fest "₹150 OFF" becomes a real threshold mechanic or honest copy; streak derives from stored check-ins.
- [x] **A1.6 M** Credit at checkout: "BILLED TO CREDIT · due 12 Jul · ₹3.96L left after this order" card + GST split in bill; echo on order-placed; append PO to open bills in the ledger.
- [x] **A1.7 S–M** *(complete incl. PAST_ORDERS price snapshots)* Reconcile seeds: QC-446102 bill ↔ its order; drop the `+12 / +₹10.4L` orders-header padding; delete stored `tag` (compute %); derive weekday labels from `ts`; snapshot prices into `PAST_ORDERS`.
- [x] **A1.8 S** One delivery-speed promise across hero/login/checkout/tracking; store on the order, echo it.
- [x] **A1.9 S** Search: tokenize + AND-match, normalize hyphens/plurals, include `brand`/`mat`; fallback only after token match fails.
- [x] **A1.10 S×5** Honest fixes: slide calculator must use selected length; visit "Visited" gated on booked datetime; clamp qty to stock (fix ba2/dl1 seeds); truthful "Add to this order" copy; `en-IN` format in CartBar.

### A2 · Mobile & native-feel polish

- [x] **A2.1 S** 16px inputs (`.cp-input/.cp-note/.nav-search input`) — kills iOS focus-zoom.
- [ ] **A2.2 M** Lock background scroll under sheets; implement or remove grab-handle drag-to-dismiss.
- [ ] **A2.3 S** `overscroll-behavior: contain` on `.plp-main`/`.plp-rail`.
- [ ] **A2.4 S** `safe-area-inset-top` on fixed headers; bottom inset on `.plp-cartwrap`.
- [ ] **A2.5 M** Hit-target pass: steppers ≥32px (reuse `.qs-sbtn`), whole-row address select + confirmed delete, ≥40px dialog closes, reco-toast spacing, preserve `.mini` navbar hit areas.
- [ ] **A2.6 S** Drop `touch-action: pan-x` on PDP hero (tap-to-cycle suffices; vertical scroll must scroll).
- [ ] **A2.7 S** SwipeRow pointer-events fallback (or visible ✕) for desktop + one-time hint.
- [ ] **A2.8 M** Desktop rails: drag-to-scroll or hover scrollbars.
- [ ] **A2.9 S** Tap-highlight + `user-select` guards on cards/nav/steppers.
- [ ] **A2.10 S** Qty sheet: numeric input + per-SKU presets derived from the bulk tier (not global 10/50/100).
- [ ] **A2.11 S** Autofill semantics: `type="tel"`, `autoComplete="tel"`/`"one-time-code"`, address tokens, `enterKeyHint="search"`.

### A3 · Accessibility (mechanical, high leverage)

- [ ] **A3.1 M** Button-ify the 37 clickable divs/spans (or role+tabIndex+keys); nav as `<nav>` of buttons. Purchase loop becomes keyboard-operable.
- [ ] **A3.2 M** Wrap the 10 hand-rolled sheets in Radix `Dialog` (focus trap, Escape, aria-modal free; keep CSS).
- [ ] **A3.3 S** Label every input; `aria-valuetext` on the load slider; label the two AddControl IconButtons.
- [x] **A3.4 S** Contrast tokens: text-bearing green-9 → green-11; `#FFD43B` header text → white/dark chip; sub-12px gray-9/10 → gray-11.
- [ ] **A3.5 S** One polite `aria-live` for cart mutations/toasts; `aria-hidden` ticking timers.
- [ ] **A3.6 S×5** Heading levels (`as=`), search field as real button, `<s>` + hidden "MRP", reduced-motion for wheel spin + shimmer, `:focus-within` on `.nav-search`.

### A4 · Design-system consolidation (before more visual iteration)

- [ ] **A4.1 L** Token block in `:root`: color ramps, radius scale, shadows, z-scale (`--z-header/nav/page/overlay/gate`), type scale with 10px floor; replace top ~20 hexes, 13 radii, per-page z-integers.
- [ ] **A4.2 M** Fold append-only patch layers into one section per component; delete ~27 dead selectors, dead media query, empty `App.css`.
- [ ] **A4.3 M** One `.page` primitive + one `.progress-fill` replaces 10 page blocks / 8 bars.
- [ ] **A4.4 M** Promote top repeated inline styles to utilities; keep inline only for dynamic values (469 inline styles today).
- [ ] **A4.5 M** Palette discipline: collapse 8 yellows → one gold ramp; promos onto 2–3 sanctioned accents.
- [ ] **A4.6 M** Honest names (`.pdp-head`→`.page-head`, `.cp-card`→`.card`) + prefix legend; single reduced-motion block.
- [ ] **A4.7 L** Imagery program (biggest visual lift): per-SKU packshots (client/backend supplies), localize to `public/img/`, `onError` fallback in `Img`. *Backend dependency noted by client: images come from backend.*

### A5 · Architecture refactor (sequence matters; no features mid-split)

- [ ] **A5.1 L** Split App.jsx along its section banners → `lib/ hooks/ components/ screens/ games/ orders/`. No logic changes.
- [ ] **A5.2 M** Cart provider (`CartStateCtx` + stable dispatch); delete cart prop-drilling from ~30 signatures.
- [ ] **A5.3 M** One `useHistoryLayer` + overlay stack replaces 9 pushState copies + render-time ref mutation; unwind entries on cross-navigation.
- [ ] **A5.4 M** `route.js` with `parseRoute()`; parameterize `#pdp-<id>`.
- [ ] **A5.5 M** `lib/storage.js`: KEYS enum + `safeStorage` (fixes storage-blocked white screen + `qc-addr-sel` format split); persist cart; `qc-version`.
- [ ] **A5.6 M** Structured data: `bulk: {thr, price, unit}`; real `cat/subcat` fields (CAT_RULES → dev check); config out of components.
- [ ] **A5.7 M** `orders.js` (hydrate/history/stats + one `downloadDoc`); extract `ListingScreen` from CategoryPage/SearchSheet.
- [ ] **A5.8 M** Correctness leftovers: tick `now` in OrderDetailPage; stop OrderCard interval post-delivery; clear quiz/spin timeouts; no storage writes in useState initializers; memo theme `T`; single day-source; rename one-letter props during split.

### A6 · Tooling, distribution, presentation

- [x] **A6.1 S** Real README (pitch, port 5174, hash deep-link table incl. *no-hash = login gate*, demo limits).
- [x] **A6.2 S** OG/meta tags (reuse manifest copy + 1200×630 image).
- [ ] **A6.3 S** `vercel.json` → `npm ci`; `engines` field; security headers/CSP.
- [ ] **A6.4 M** Tests + CI after lint green: vitest on cart/bulk/scheme math + render-smoke per hash; GitHub Actions.
- [ ] **A6.5 M** Code-split after A5.1 (lazy wheel/quiz/account/orders/login).
- [ ] **A6.6 S** Self-host Plus Jakarta Sans.
- [ ] **A6.7 S** Geolocation behind explicit affordance (time-theme default).
- [ ] **A6.8 S** PWA: `start_url` → home hash (skip gate), separate maskable icon, SW only if offline matters.
- [ ] **A6.9 S** Repo hygiene: rm duplicate root PNGs, stray root `node_modules`, template leftovers; first-screen "Demo — no SMS"; confirm/undo Delete-list; GSTIN strict regex + "Valid format"; `jsconfig` checkJs.

---

## TRACK B — Client features (the 12-point brief)

✅ done · 🟡 pattern exists · 🔴 net-new · ⚙️ backend

| # | Feature | Status | Build |
|---|---------|--------|-------|
| B1 | Project suggestions (wardrobe/kitchen/…) | 🟡 | **Project Kit Builder**: pick room → curated checklist w/ suggested qtys (scales by cabinets/doors count) → save to Project List or add-all. Entry: home card + lists empty-state. |
| B2 | Hinge filters (door/carcass thickness) | ✅ | `doorThk/carcassThk` on hinge SKUs; FilterSheet shows mm-chip groups only in Hinges category. |
| B3 | Door-closer selector (W×D×H + material) | ✅ | Calculator "Door closer" tab: W×H×T + material → est. kg → recommends rated closer (3 SKUs seeded: DC-60/85/120) with ADD. |
| B4 | Branding/demo/carpenter/promo requests | ✅ | **Brand Support** (#brand): 4 type chips, qty-or-CalPicker form, tracked stages (Received → Approved → Dispatched/Scheduled), persisted `qc-mkt`. |
| B5 | Repeat order, 1-click | ✅ | Live ×3: Reorder page (usual-qty, Add-all-due), Repeat on past orders, Reorder on delivered card. |
| B6 | Claims (pending CN / return / wrong delivery) | ✅ | **Claims Centre** (#claims): order picker → type → affected items w/ steppers → photo attach + notes → tracked (Raised → Under review → CN issued / Pickup scheduled / Replacement dispatched), persisted `qc-claims`. Settlement = backend. |
| B7 | Delivery image upload (POD) | ✅⚙️ | Dealer-side shipped: "Proof of Delivery" card on delivered order details (photos, OTP-verified chip, receiver, geo-tag line). Rider-app upload = backend. |
| B8 | Find a carpenter | 🔴 | **Find a Pro** directory — becomes the Utilities tab (resolves A0.4). Cards: skills, area, jobs, rating, Call/WhatsApp. |
| B9 | Find architect/designer | 🔴 | Second tab of B8. + "Refer a pro" mini-form (feeds B12-E referrals). |
| B10 | Inspiration gallery | 🔴 | **Inspiration** grid (room filters) → detail view with "products used" → ADD / save-to-list. |
| B11 | Design library (regularly updated) | 🔴⚙️ | Same surface as B10 with collections; content pipeline = admin CMS (backend). Viewer ships now. |
| B12 | Secret weighted dealer scorecard | 🟡⚙️ | See below. App already shows tier/percentile; engine is backend-only. |

### B12 scorecard — secrecy handled correctly

- Weights/formula live **server-side only** — anything in the client bundle is readable by anyone. App receives only the computed score/band.
- ⚠️ Move this section out if the repo ever goes public.
- Draft weights (tune in the group): A continuity 25% (weeks with ≥1 order, rolling 12w) · B range selling 20% (distinct categories+brands/qtr) · C prompt payments 20% (days-to-pay vs terms, overdues) · D target achievement 20% · E referrals converted 10% · F app engagement 5% (**session-days/week + feature breadth — not raw minutes; minutes are gameable**).
- Needs: event tracking (orders, payments, sessions), nightly job, score→tier mapping.

---

## Unified sequence

| Sprint | Contents | Outcome |
|---|---|---|
| **0 (today)** | A0.1–A0.7 | Nothing broken, lint green, no self-sabotage |
| **1** | A1.1–A1.4 then A1.5–A1.10 | Survives a skeptical dealer with a calculator |
| **2** | B3 + B2 + B4 + B6 + B7-display *(Phase-1 features; all mock-data demoable)* | Client sees their brief landing |
| **3** | A2 + A3 | Feels native on phones; keyboard + AA pass |
| **4** | B1 + B8/B9 (closes A0.4) + B10/B11 viewer | All client surfaces demoable |
| **5** | A4 then A5 (tokens before split; no features mid-split) | Stable system, modular codebase |
| **6** | A6 + `docs/BACKEND_CONTRACT.md` (APIs incl. B12 engine, POD upload, claims settlement, CMS, events) | Ship-ready + backend handoff |

**Quick wins (<2h combined):** invoice restore · cart popstate guard · dead-tap band · error boundary · title-hook removal · 16px inputs · `en-IN` CartBar · credit-seed fix · header-padding removal · contrast swaps · OG tags · README.

**Ops note:** Vercel free tier = 100 deploys/day (hit it on 12 Jun). Deploy once per work batch, not per tweak.
