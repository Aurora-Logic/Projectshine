# QuickCart — Improvement Plan

Companion to **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** (§ references point there). Items are grouped into phases ordered by leverage: each phase makes the next one safer. Effort: **S** ≤ 1 hour, **M** = half a day, **L** = multi-day.

---

## P0 — Broken or actively misleading. Do these first (≈ 1 day total)

| # | Fix | Effort | Ref |
|---|---|---|---|
| 0.1 | **Restore `downloadInvoice`** — deleted in `0275feb`, still called from the order-detail page and orders list; both Invoice buttons throw `ReferenceError`. Recover from `12b6f4f`, share the HTML scaffold with `downloadLedger`. | S | §1.1 |
| 0.2 | **Guard the cart's popstate handler** — `if (!qtyRef.current) setCartOpen(false)`. Today, confirming a quantity from the in-cart flash-deals strip closes the entire checkout. One line. | S | §7.1 |
| 0.3 | **Kill the dead-tap band** — `.footer { pointer-events: none }` + `pointer-events: auto` on `.cartbar.show` and `.navrow` (copy the existing `.plp-cartwrap` fix). A ~66px invisible strip above the navbar eats taps whenever the cart is empty — the default state for every new visitor. | S | §4.1 |
| 0.4 | **Wire or remove the Utilities tab** — currently a silent no-op on a primary nav item. Cheapest real fix: a Utilities page aggregating the Calculators + site/display-visit tools that already exist in Account. | S–M | §3.1 |
| 0.5 | **Add an error boundary** in `main.jsx` — branded "Something went wrong — Reload" card, optional `qc-*` clear on retry. Turns the worst failure mode (white page) into a recoverable one. | S | §11.2 |
| 0.6 | **Remove (or dev-gate) the `window.onerror` title hook** in `index.html` — with 0.1 live, real visitors can currently see `ERR:downloadInvoice is not defined` as the tab title. | S | §10.5 |
| 0.7 | **Make lint green** — delete the 8 dead exports/components (`ClearanceStore`, `OrderDetailSheet`, `LeaderCol`, `LEADERS`, `TimerIcon`, dead props); fix the genuine hooks errors that overlap P1/P2 items; downgrade the remaining compiler-prep rules to `warn`. From then on, red lint means something. | M | §10.1 |

---

## P1 — Money & trust coherence (the dealer-credibility pass)

The audit's strongest theme: a price-literal B2B audience sees numbers that disagree with each other. Fix in this order — the first two are the structural causes of most of the rest.

| # | Fix | Effort | Ref |
|---|---|---|---|
| 1.1 | **Single source of truth for cart state.** Store only `items`; derive `count`, `total`, `photos` (useMemo). Drive every card stepper from `cart.items[p.id]?.n` via context — delete the local `useState(0)` in `ProductCard`/`FlashCard`/`ComboCard`. Fixes: stale steppers, count/total corruption, lingering thumbnails. | M | §6.1, §7.2, §9.1 |
| 1.2 | **Stop `EndlessFeed` rewriting product ids.** Batch belongs in the React `key`, not the data — same SKU must merge into one cart line so bulk tiers aggregate and PDPs stop showing `F0-BA1` item codes. | S | §6.2 |
| 1.3 | **One bulk-price story.** Chip, CTA, cart row and bill must agree: show the effective price with the full price struck through (or an explicit "− ₹350 off on invoice" on the CTA). | S | §2.2, §3.6 |
| 1.4 | **Snapshot the bill on the order record** (`itemTotal, bulkSave, schemeOff, deliveryFee, expressFee, toPay`) and render order detail + GST invoice from the snapshot, with discount/fee lines. Kills the ₹5,240-paid vs ₹5,660-invoiced split. | M | §9.2 |
| 1.5 | **Close the reward loop.** Persist a `qc-coupon` on wheel win, render it as a bill line, consume on placement. Reword the fest hero to a real mechanic (or honor ₹150 above a threshold); derive the streak from stored check-ins or drop its voucher copy. | M | §3.3, §9.4 |
| 1.6 | **Put credit at checkout.** A "BILLED TO CREDIT" card in the cart ("₹5,240 on 30-day credit · due 12 Jul · ₹3.96L left after this order") + a GST line in bill details; echo on the order-placed dialog; append the PO to open bills. This is the app's flagship differentiator, currently invisible at the decision point. | M | §3.2 |
| 1.7 | **Reconcile the seeded numbers:** credit bill QC-446102 → ₹11,050 (or pad its order); drop the `+12 / +₹10.4L` orders-header padding (derive from `hist`, or label "incl. earlier invoices"); delete the stored `tag` field and compute discount % (fixes ba2's 7%-vs-6%); derive weekday labels from `ts`; snapshot prices into `PAST_ORDERS` items. | S–M | §9.6, §3.9, §9.7 |
| 1.8 | **One speed promise.** Pick a ladder (e.g. free "within 90 min" / paid "Priority ~30 min"), use it on hero, login, checkout and tracking; store the chosen promise on the order and echo it. | S | §12.4 |
| 1.9 | **Fix search matching** — tokenize the query, AND across tokens, normalize hyphens/plurals, include `brand` and `mat` in the haystack; keep the show-everything fallback only after token match fails. | S | §12.1 |
| 1.10 | **Honest small fixes:** use the calculator's selected slide length in its recommendation (`p.size === sz`); gate visit status "Visited" on the booked datetime; clamp qty to stock (and fix ba2/dl1 seeds so tiers are reachable); "Add to this order" copy → something true; format `CartBar` totals with `en-IN`. | S each | §12.2, §12.3, §9.5, §3.8 |

---

## P2 — Mobile & interaction polish (the "feels native" pass)

| # | Fix | Effort | Ref |
|---|---|---|---|
| 2.1 | **16px form inputs** (`.cp-input`, `.cp-note`, `.nav-search input`) — kills iOS focus-zoom; the login form already shows the pattern. | S | §4.2 |
| 2.2 | **Lock background scroll under sheets** — body `overflow: hidden` on open (or `touch-action: none; overscroll-behavior: contain` on overlays); implement or remove the grab-handle's implied drag-to-dismiss. | M | §4.3 |
| 2.3 | **`overscroll-behavior: contain` on `.plp-main`/`.plp-rail`** (pattern already used on `.pdp-body`/`.cp-body`). | S | §4.8 |
| 2.4 | **`safe-area-inset-top`** on `.topbar`, `.sheet-head`, `.pdp-head` and fixed page headers; add the bottom inset to `.plp-cartwrap`. | S | §4.4 |
| 2.5 | **Hit-target pass:** cart/reorder steppers to ≥32px visual / 44px effective (reuse `.qs-sbtn`); whole-row address selection + confirmed/undoable delete (copy `AddressSheet`); ≥40px dialog close buttons; gap between reco-toast ADD and its dismiss; preserve navbar hit areas in `.mini` (scale an inner wrapper). | M | §4.5–4.6, low items |
| 2.6 | **Remove `touch-action: pan-x` from the PDP hero** — tap-to-cycle already covers crop cycling; vertical scroll must always scroll. | S | §4.7 |
| 2.7 | **Pointer-events for `SwipeRow`** (or a visible ✕ per row) so desktop reviewers can remove cart lines; add a one-time swipe hint. | S | §3 low |
| 2.8 | **Desktop rails:** mouse-drag-to-scroll handler or `@media (hover: hover)` thin scrollbars — portfolio traffic is mostly laptops and currently sees 3 cards per rail. | M | §4 low |
| 2.9 | **Touch feedback consistency:** `-webkit-tap-highlight-color: transparent` at the app root; `user-select: none; -webkit-touch-callout: none` on cards/nav/steppers (keep selection in inputs and descriptions). | S | §4 low |
| 2.10 | **Quantity entry:** editable numeric qty (`inputMode="numeric"`) in the qty sheet; per-SKU presets derived from the bulk tier instead of global 10/50/100. | S | §3.10 |
| 2.11 | **Autofill semantics:** `type="tel" autoComplete="tel"` on phone, `autoComplete="one-time-code"` on OTP, address autocomplete tokens, `enterKeyHint="search"`. | S | §12.6 |

---

## P3 — Accessibility (mechanical, high-leverage)

| # | Fix | Effort | Ref |
|---|---|---|---|
| 3.1 | **Button-ify the 37 clickable divs/spans** (or `role="button" tabIndex={0}` + Enter/Space). Bottom nav as `<nav>` of buttons; the cart avatar's existing `aria-label` starts working once it has a role. The entire purchase loop becomes keyboard-operable. | M | §5.1 |
| 3.2 | **Wrap the 10 hand-rolled sheets in Radix `Dialog`** — focus trap, Escape, `aria-modal`, restoration for free; keep the existing classes for styling. | M | §5.2 |
| 3.3 | **Label every input** (aria-label or `<label htmlFor>`); `aria-valuetext` on the load slider; label the two `AddControl` IconButtons (the app's only unlabeled ones). | S | §5.3 |
| 3.4 | **Contrast token swap:** text-bearing green-9 fills → green-11 (4.72:1); `#FFD43B` header target text → white or a dark chip; sub-12px gray-9/10 text → gray-11. Visual difference is subtle; AA passes. | S | §5.4, §2.5 |
| 3.5 | One polite `aria-live` region announcing cart mutations and toasts; `aria-hidden` the ticking timers with a static label. | S | §5 med |
| 3.6 | `as="h2"/"h3"` on Radix Headings (one h1 per screen); fake search field → real `<button>`; `<s>` + hidden "MRP" prefix on struck prices; reduced-motion rules for the wheel spin + skeleton shimmer; `:focus-within` ring on `.nav-search`. | S each | §5 med/low |

---

## P4 — Design-system consolidation (do before more visual iteration)

| # | Fix | Effort | Ref |
|---|---|---|---|
| 4.1 | **Token block in `:root`:** brand colors (`--brand-green-deep`, `--fest-gold`…), radius scale (`--r-s/m/l/xl/full`), 3-step shadow scale, z-scale (`--z-header:30, --z-nav:40, --z-page:70, --z-overlay:90, --z-gate:200`), type scale with a 10px floor. Mechanically replace the top ~20 repeated hexes, 13 radii, per-page z-integers, and sub-10px font sizes. | L | §8.1, §8.4, §2.3–2.5 |
| 4.2 | **Fold the append-only patch layers** ("refinement pass", "v2", "v3", "joy") back into each component's single section, deleting superseded rules — one section = one component's truth. Then delete the ~27 dead selectors (incl. login v1, `deco-*` + its data.js field, `.fab.*` variants), the dead width media query, and empty `App.css` + its import. | M | §8.2–8.3 |
| 4.3 | **One `.page` primitive** (fixed shell, max-width, flex column) + background modifiers replaces the 10 copy-pasted page blocks; one `.progress-fill` for the 8 bars. | M | §8.4 |
| 4.4 | **Promote the top ~10 repeated inline styles** to utilities (`.microlabel`, `.min0`, `.flexnone`) or Radix `<Text>` props; keep inline only for dynamic values. | M | §8.5 |
| 4.5 | **Palette discipline:** collapse 8 yellows into one gold ramp; re-skin Flash sale / Quiz / Product-of-the-Day onto 2–3 sanctioned accent ramps. | M | §2.3 |
| 4.6 | Honest names for shared primitives (`.pdp-head` → `.page-head`, `.cp-card` → `.card`) + a prefix legend comment; consolidate reduced-motion into one block. | M | §8.6 |
| 4.7 | **Imagery program** (the single biggest visual lift): per-SKU-unique, subject-correct packshot-style photos; dedupe assert at module load; tone-normalize; lifestyle shots only for heroes. Localize into `public/img/` with an `onError` fallback in `Img` — also removes the Unsplash single point of failure. | L | §2.1, §11.4 |

---

## P5 — Architecture refactor (mechanical; the file's own comments are the map)

Sequence matters: 5.1 unlocks everything else; don't add features mid-split.

| # | Fix | Effort | Ref |
|---|---|---|---|
| 5.1 | **Split App.jsx along its existing section banners** → `lib/` (img, format, bulk, storage, sparkle), `hooks/` (usePersisted, useSkyTheme, useNextFrame, useHistoryLayer), `components/`, `screens/` (incl. `account/`), `games/`, `orders/`. No logic changes. | L | §6.3 |
| 5.2 | **Cart provider:** `CartStateCtx` + stable `CartDispatchCtx`; delete `onChange`/`cart` props from ~30 signatures; `noReco` becomes an explicit API. (Pairs with 1.1.) | M | §6.7, §6.11 |
| 5.3 | **One `useHistoryLayer(key, isOpen, onBack)` + overlay stack** replaces the 9 pushState/popstate copies and all render-time ref mutation; popstate closes the top entry; unwind entries on cross-navigation (fixes the dead back-presses). | M | §6.4, §7.4 |
| 5.4 | **`route.js`:** `parseRoute(hash)` consumed once; children get `initialView` props; parameterize `#pdp-<id>` like `#plp-<cat>`. | M | §6.5, §12.7 |
| 5.5 | **`lib/storage.js`:** KEYS enum + `safeStorage` (try/catch get/set — also fixes the storage-blocked white screen) + one accessor per key (fixes the `qc-addr-sel` raw-vs-JSON split); persist the cart to `qc-cart`; add a `qc-version` boot check. | M | §6.10, §7.3, §11.3, §9.8 |
| 5.6 | **Structured data:** `bulk: { thr, price, unit }` (derive the display string, delete both regexes — fixes the '/pc' unit errors); `cat`/`subcat` fields on products (CAT_RULES becomes a dev-time check); move SUBCATS/RECO_RULES/CAT_SHELVES/BESTS/account-menu config into data files. | M | §6.9, §6.8, §9.3 |
| 5.7 | **`orders.js`:** shared `hydrateOrder`/`orderHistory`/`orderStats` + one `downloadDoc(title, body)` for invoice & ledger (pairs with 0.1/1.4). Extract `ListingScreen` from CategoryPage/SearchSheet. | M | §6.12, §6.6 |
| 5.8 | Correctness leftovers: tick `now` state in OrderDetailPage (stop `Date.now()` in render); stop OrderCard's interval after delivery; clear quiz/spin timeouts; move localStorage writes out of useState initializers; `useMemo` the theme object `T` and shelf arrays; single day-source for daily gating; rename one-letter props during the split (`p`→`product`, `n`→`count`, `product.qty`→`packLabel`). | M | §7 low, §6 low |

---

## P6 — Tooling, distribution & presentation

| # | Fix | Effort | Ref |
|---|---|---|---|
| 6.1 | **Real README:** screenshot, pitch, `npm i && npm run dev` (port 5174), the hash deep-link table **including the no-hash = login-gate rule**, demo limitations. One-line root README pointing into `quickcart/`. | S | §10.3 |
| 6.2 | **OG/meta tags:** description (reuse manifest copy), `og:title/description/image` (1200×630 home export), `twitter:card`. Shared links stop rendering blank. | S | §10.4 |
| 6.3 | `vercel.json` → `npm ci && npm run build`; add `"engines": { "node": ">=20.19" }`; a 10-line security-headers block (nosniff, frame-ancestors, CSP pinning the four known origins). | S | §10/§11 low |
| 6.4 | **Tests + CI** (after lint is green): vitest unit tests on cart/bulk/scheme math and data.js shape; one render-smoke per hash entry point; 15-line GitHub Actions running `npm ci && lint && build && test`. | M | §10 low |
| 6.5 | **Code-split after 5.1:** `React.lazy` the wheel/quiz, account, orders, login. Target: home interactive without the 510 kB monolith. | M | §10.2 |
| 6.6 | Self-host Plus Jakarta Sans (`@fontsource`, 4 weights) — removes the render-blocking third-party CSS. | S | §11 low |
| 6.7 | Geolocation behind an explicit "Use local weather" affordance; time-based theme by default. | S | §11.1 |
| 6.8 | PWA touch-ups: `start_url` → a home hash so installs skip the login gate; separate `any` and padded `maskable` icons; service worker only if offline demos matter (vite-plugin-pwa). | S | §10 low |
| 6.9 | Repo hygiene: `git rm` the 5 duplicate root PNGs; delete root `node_modules`, `react.svg`/`vite.svg`/`hero.png`/`icons.svg`. Demo-honesty: first-screen "Demo — no SMS sent" on login; confirm/undo on Delete list; GSTIN regex + "Valid format" relabel; `jsconfig.json` with `checkJs` (start with data.js). | S | §10–§12 low |

---

## Suggested sequence

1. **Today:** P0 (one sitting — seven small items, app stops being broken/self-sabotaging).
2. **Week 1:** P1.1–1.4 (money coherence core), then 1.5–1.10. The demo now survives a skeptical dealer walking every flow with a calculator.
3. **Week 2:** P2 + P3 (polish + a11y passes — mostly mechanical CSS/attribute work, big perceived-quality jump on real phones).
4. **Week 3:** P4 (tokens + dead-CSS purge) — do *before* the next visual iteration so it lands on a stable system.
5. **Week 4+:** P5 (the split — schedule it between feature pushes, not during), then P6 alongside.

### Quick wins (under 2 hours combined, disproportionate payoff)
`downloadInvoice` restore · cart-popstate guard · dead-tap band · error boundary · index.html hook removal · 16px inputs · `en-IN` in CartBar · credit-bill seed fix · orders-header padding · contrast token swaps · OG tags · README.
