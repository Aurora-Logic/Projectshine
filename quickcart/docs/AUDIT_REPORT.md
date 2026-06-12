# QuickCart — Full UI/UX, Code & Best-Practices Audit

**Date:** 12 June 2026
**Scope:** the entire `quickcart/` app — visual design, UX flows, mobile ergonomics, accessibility, React architecture & correctness, CSS architecture, data layer & business logic, tooling/build, security & robustness.
**Method:** 21-agent review — 10 specialist reviewers (working from code + 18 live screenshots of every screen), each followed by an independent adversarial verifier that re-checked every claim against the actual code and pixels, plus a completeness critic that hunted for blind spots. **142 findings survived verification (22 high, 58 medium, 62 low; 0 were refuted, 23 had severity corrected).**

> **Line-number caveat:** the repo received new commits *while the audit ran* (`91dfd09` → `68c91bd`). Line numbers below are accurate to within ~±30 lines; anchor by the quoted symbol/class names, which are stable.

---

## Executive summary

QuickCart is a genuinely strong design showcase. The reviewers — primed to be harsh against a Blinkit/Instamart bar — independently called out real strengths: a coherent card system, confident Radix usage (400+ token references, zero `.rt-*` hacks), zero emoji-as-chrome, exemplary animation hygiene (all 33 keyframes animate transform/opacity, `content-visibility: auto`, zero `will-change`), per-overlay back-gesture handling, guarded `JSON.parse` on every persisted key, alt text on product images, six `prefers-reduced-motion` blocks, 0 npm vulnerabilities, and B2B flows (credit ledger, reorder cadence, GST framing) that show real domain thinking.

The gaps cluster into five themes:

1. **One thing is broken right now.** Commit `0275feb` deleted `downloadInvoice` but left two call sites — the Invoice buttons throw `ReferenceError` (§1).
2. **Money numbers don't agree with each other.** The qty sheet shows two totals for one selection; cart line totals contradict their own labels; the order detail page and GST invoice bill a different amount than was paid; a credit bill is 4× its own order; the orders header fabricates "+12 orders / +₹10.4L". For a price-literal dealer audience, this is the most damaging class of issue.
3. **The reward and credit loops never close.** Wheel prizes, the fest "₹150 OFF", and streak vouchers are promised and never reach the bill; checkout never mentions the trade credit the entire app is sold on.
4. **The interaction layer is touch/mouse-only and partly self-blocking.** An invisible dead-tap band sits above the navbar on home; a back-gesture on the qty sheet closes the whole cart; the Utilities tab does nothing; the entire app is unreachable by keyboard.
5. **System discipline lags the craft.** No design tokens (86+ distinct hex colors, ~25 font sizes, 13 radii, z-index 70…80 minted per page), a 5,600-line single-file app, red ESLint (40 errors), a template README, and a 510 kB single JS chunk.

Everything found is fixable, most of it cheaply — see the companion **[IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)** for the prioritized roadmap.

### Scorecard

| Dimension | Verdict |
|---|---|
| Visual design | **Strong baseline**; imagery is the one big gap, plus palette/type/radius sprawl |
| UX flows | **Individually excellent, seams broken** — dead nav tab, rewards never land, cart dead-ends |
| Mobile ergonomics | **Good fundamentals**, several real traps (dead-tap band, iOS zoom, scroll bleed) |
| Accessibility | **Touch-only** — zero keyboard path, 10/12 dialogs unsemantic, no labels, CTA contrast fails AA |
| React architecture | **Monolith with clean seams**; state duplication causes real bugs |
| React correctness | **Better than it looks**; 2 high bugs in cart/back-gesture interplay |
| CSS architecture | **Well-crafted, structurally indebted** — no tokens, append-only patch layers, ~27 dead selectors |
| Data & business logic | **Mostly reconciles**; bulk pricing as strings, totals not snapshotted |
| Tooling & build | **Builds clean, lints red**; template README, no tests/CI, no code splitting |
| Security & robustness | **Clean for a demo** (no XSS vectors, 0 vulns); geolocation prompt + no error boundary are the real risks |

---

## 1. Broken at HEAD — fix before anything else

### 1.1 `downloadInvoice` is called but no longer defined — Invoice buttons throw `ReferenceError` 🔴 CRITICAL
Commit `0275feb` ("Dashboard 3D pass") deleted the `downloadInvoice` function (apparently along with the dead `OrderDetailSheet`), but two live call sites remain — the order-detail page (`App.jsx:2976`) and the orders list (`App.jsx:3094`). Tapping **Invoice** now throws `ReferenceError: downloadInvoice is not defined`: the button silently does nothing, and the debug hook in `index.html` rewrites the tab title to `ERR:…`. The downloadable GST invoice is a pillar of the B2B pitch ("GST input credit on every invoice").
**Fix:** restore `downloadInvoice` from git (`12b6f4f` introduced it), ideally refactored to share scaffold with `downloadLedger` — and have it render from a snapshotted bill (see §9.2).

---

## 2. Visual design

**Summary:** coherent card system, disciplined Plus Jakarta Sans voice, polished B2B surfaces, zero emoji-as-chrome. The single largest gap to Blinkit grade is product imagery; second tier is token discipline.

### High
- **2.1 Product imagery never depicts the actual product, and photos are reused across unrelated SKUs** (`data.js` `ph:` fields). `data.js:10` admits it: interiors stand in for packshots. A "Glass Door Hinge" shows a living room; "Ebco Cam Lock" shows a vault door; one kitchen photo (`1595428774223`) simultaneously backs a drawer slide, an aldrop set, a sensor light, a category tile, a banner and a FEST tile — adjacent cards render identical photos for different products. In an image-led commerce UI this is the #1 gap. **Fix:** packshot-style, subject-correct, per-SKU-unique images; lifestyle shots only in hero/banner slots.

### Medium
- **2.2 Qty sheet shows two conflicting totals for one selection** — selected "10" chip says **₹3,500** (bulk price, "9% OFF") while the CTA below says **"Add 10 pieces ₹3,850"** (`n * p.price`). A money amount contradicting itself at the commit point. One number must win.
- **2.3 Every feed module invents a palette** — 8 distinct yellow/gold hexes (`#FFD43B` ×12, `#F5C242`, `#C9A44A`, `#FFE9A8`…), green → yellow → blue → red → cream → olive → casino bands down one feed. Blinkit constrains promos to one tight brand palette. **Fix:** 2–3 accent ramps as CSS custom properties.
- **2.4 No type scale** — ~25 distinct font sizes including 8/8.5/9/9.5px (15 rules below 10px) and half-pixel sizes that indicate per-component eyeballing. 8–9.5px is below the mobile legibility floor. **Fix:** fixed scale, 10px floor.
- **2.5 Persistent header target text fails contrast** — `#FFD43B` on the green pill measures **2.75:1** (needs 4.5:1) at ~12px bold (`App.jsx:364`); dashboard chart labels are 8px white at 65% opacity. The number a dealer most wants to read is the hardest to read.
- **2.6 index.css carries dead, mutually-contradicting iteration layers that already cause defects** — `.topbar`'s theme cross-fade transition is dead (overwritten on the next line, `index.css:38–39`); `.navrow` flip-flops across three blocks; ~80 lines of `.fab.*`/`.nav-search` match nothing; the old orange wheel skin is fully overridden by the casino skin.

### Low
- Flash/deal cards truncate at one line, cutting the spec (450mm vs 500mm) that differentiates hardware SKUs — feed cards already use `clamp2`.
- Brand logo lockups at 13–16px render as illegible smudges (login footer, PDP header).
- Dealer-tier indicator is a bare flat gray dot (`#98A2B3`) that reads as a failed avatar — for the app's main retention mechanic.
- Raw `'✓'` text glyphs in order timeline/streak dots vs `CheckIcon` elsewhere (platform-inconsistent rendering).
- Corner-radius sprawl: 13 distinct radii 5–22px; full-rounding written three ways (99/999/100px).
- Default blue Chrome focus ring on the quiz/wheel close button on keyboard/deep-link opens (`.quiz-close` has no `:focus-visible` style while `.seg-b` does).

---

## 3. UX flows

**Summary:** individual flows are unusually well-crafted (reorder, credit ledger, PDP dealer pricing, back-gesture handling, empty states everywhere). Nearly all problems are *seams between flows*.

### High
- **3.1 The Utilities tab is a dead no-op** — `onUtilities={() => { /* Utilities page comes later */ }}`. One of five primary nav tabs does literally nothing: no page, no toast. Meanwhile real utility content (Calculators, site/display visits) already exists buried in Account. The single most visible defect in the navigation. **Fix:** wire it to a Utilities page aggregating the existing tools, or drop to 4 tabs.
- **3.2 Checkout never states how the dealer pays** — no payment method, no "on 30-day credit · due 12 Jul", no remaining-credit readout, no GST split in the bill. Login sells "30-day credit" as the core benefit; `AcctCredit` tracks ₹4.02L available; placed orders never appear in open bills. The flagship B2B differentiator is invisible exactly at the decision point.
- **3.3 Promised discounts never reach the cart** — wheel prize says "auto-applies on your next order" but only `qc-spin-day` is persisted; no coupon line exists in the bill; Hinge Fest promises "₹150 OFF" but its CTA just opens the Hinges PLP; the streak promises a ₹100 voucher with no voucher system. Anyone walking spin → win → cart catches the app breaking its own promise.
- **3.4 Add-to-cart dead-ends in Search and Account** — `CartBar` renders on PLP, Reorder and home, but not in `SearchSheet` or `AccountPage` (whose overlays cover the global footer). After ADD in search, "Repeat" on a past order, or "Add all to cart" on a list, the only feedback is a sparkle; reaching checkout requires backing out to home. Search is the highest-intent surface. The `.plp-cartwrap` pattern already exists — reuse it.

### Medium
- **3.5 The bottom tab bar vanishes inside every tab** — Categories/Reorder/Account open full-screen overlays (z 70–80) above the footer (z 40), so tabs exist only on home and the computed `active` state is unreachable dead code. Either keep the bar mounted above section overlays or drop the tab metaphor.
- **3.6 Bulk pricing tells three different stories** — chip ₹3,500 → CTA ₹3,850 → cart row "₹385 · 9% bulk off applied" with total at full price, savings reappearing only in bill details. Charge the discounted price on CTA and rows, or strike-through "was/now".
- **3.7 Topbar address is a dead affordance with a wrong label** — `cursor: pointer` + chevron but no `onClick`; hardcoded "Home · HSR Layout" while the same address is labeled "Shop" in the cart. Wire it to the existing `AddressSheet`.
- **3.8 "Forgot something? Add to this order" lies** — it scrolls to the deals band; anything added becomes a *new* order whose placement overwrites the tracked one (`qc-order` is a single slot) mid-delivery.
- **3.9 Orders header contradicts its list** — `{hist.length + 12}` orders / `totalVal + 1040000` billed renders "16 orders · ₹11.28L" directly above "Showing 3 invoices" with the FY filter active.
- **3.10 One-size 10/50/100 qty presets for every SKU; "set a custom quantity" has no numeric input** — a ₹95 cam lock and a ₹3,250 wardrobe system get identical chips (one tap on "100" = ₹3.25L), and 10 → 37 is 27 stepper taps.

### Low
- Spin & Win contradicts itself ("house always pays" vs a TRY AGAIN segment) and casino idioms sit oddly next to GST invoices.
- Swipe-to-remove is touch-only (`onTouchStart/Move/End`) and hinted nowhere — desktop reviewers can never remove a cart line except by minus-tapping n times.
- `CartBar` prints `₹{cart.total}` unformatted while every other surface uses `toLocaleString('en-IN')`.
- "Continue as guest" lands in a fully authenticated named dealer account with a credit ledger — while the gate pitches differentiated registered-dealer benefits.
- Home surfaces three engagement blocks but never the dealer's two most actionable signals (items due for reorder, overdue bill) — both live two taps deep.

---

## 4. Mobile ergonomics

**Summary:** correct viewport meta, dvh shell, bottom safe-area insets nearly everywhere, good collapsing header, rich `:active` feedback. The serious gaps are systemic.

### High
- **4.1 Invisible dead-tap band above the bottom navbar** — `.footer` (fixed, z 40, full-width) has no `pointer-events: none`; the empty-state `CartBar` inside it is hidden only visually (`translateY/opacity`), so its ~58px box + margin silently swallows taps (and mouse clicks) on feed content in a full-width ~66px strip whenever the cart is empty — the default state for every new visitor. The team already solved exactly this on PLP (`.plp-cartwrap { pointer-events: none }`). **Fix:** mirror that, or unmount CartBar at count 0.
- **4.2 Form inputs at 12.5–14px trigger iOS Safari focus-zoom** — `.cp-input/.cp-note` (≈20 inputs: address, GSTIN, visit forms, two `autoFocus`-in-sheet fields) and `.nav-search input` at 14px. Every focus zooms the page ~25–30%, misaligning the fixed shell, often staying zoomed after blur. The login form already does it right (16px) — match it.

### Medium
- **4.3 Bottom sheets never lock background scroll** — no `overscroll-behavior`/`touch-action` on `.qsheet-overlay`, no body scroll lock anywhere; drags on the sheet or backdrop scroll the dimmed home feed behind. The `.qsheet-grab` handle also advertises a drag-to-dismiss that doesn't exist.
- **4.4 `viewport-fit=cover` + standalone PWA but zero `safe-area-inset-top`** — 9 uses of the bottom inset, none of the top; installed to a notched iPhone, headers underlap the status bar/Dynamic Island.
- **4.5 26×26px ± steppers on cart/reorder rows** — opposite actions ~26px apart on the money path; the in-house `.qs-sbtn` (34px) is the better pattern to reuse.
- **4.6 Account address management: an 18px radio is the only select target, with an unconfirmed 26px delete beside it** — mis-tap permanently deletes an address, no undo. The cart's `AddressSheet` does whole-row selection correctly.
- **4.7 PDP hero is a 300px vertical-scroll trap** — `touch-action: pan-x` hands vertical drags to a hidden photo-crop-cycling gesture across ~40% of the initial viewport; the page feels stuck. Tap-to-cycle already covers the feature.
- **4.8 PLP/search scrollers lack `overscroll-behavior: contain`** (the codebase sets it on `.pdp-body`/`.cp-body`/`.sheet`) — over-scroll moves the home feed behind, breaking scroll restoration on back.

### Low
- `.navbar.mini { transform: scale(.8) }` shrinks hit targets to ~30px tall exactly while the user is scrolling.
- `.plp-cartwrap` skips the bottom safe-area inset (home-indicator overlap) while every sibling bar includes it.
- Hidden-scrollbar horizontal rails have no mouse fallback — desktop reviewers (most portfolio traffic) see only the first ~3 cards of every rail.
- Tap-highlight removed only for `<button>`; high-traffic clickable divs keep the Android gray flash; no `user-select` guard, so long-press selects card text.
- 30px close button on quiz/wheel dialogs; 26px reco-toast dismiss sits right next to an ADD button (missing it adds an item).

---

## 5. Accessibility

**Summary:** unusually good in places — `alt={p.name}` on product images, ~25 aria-labels on icon buttons, `role="switch"` on the hand-rolled toggle, six reduced-motion blocks, no global outline removal, zoom not blocked. But the interaction layer is mouse/touch-only.

### High
- **5.1 Entire core flow is keyboard-inaccessible** — 35 `<div onClick>` + 2 `<span onClick>`; **zero** `tabIndex` or `onKeyDown` in the whole app. Bottom nav, product cards, category tiles, the header cart button (a div whose `aria-label` is ignored without a role) — the purchase loop cannot be operated by keyboard at all.
- **5.2 10 of 12 modal surfaces are hand-rolled divs** — no `role="dialog"`, no `aria-modal`, no focus trap, no Escape (zero key listeners in the app). Only the quiz and wheel use Radix Dialog. **Fix:** wrap the existing sheet markup in Radix `Dialog` — already imported, keeps the CSS.
- **5.3 Zero form labels** — 0 `<label>` elements, 0 input `aria-label`s across ~23 inputs (login phone, OTP announcing as "••••", address, GSTIN, the load-rating slider whose visible caption isn't associated).
- **5.4 Primary CTA fails AA: white on green-9 (`#30A46C`) = 3.16:1** — on every add/checkout control (`.qs-cta`, `.cartbar`, pills; 28 `var(--green-9)` fills). White on green-11 (`#218358`) = 4.72:1 passes; the existing green-9→green-11 gradients prove the darker end fits the palette.

### Medium
- The `AddControl` stepper — the most-repeated control in the app — has the only two unlabeled IconButtons in the codebase, plus a clickable qty `<Text>` opening a hidden bulk sheet (equivalent steppers elsewhere *are* labeled).
- No live regions anywhere: ADD gives zero SR feedback, toasts/wheel results/timers are silent.
- All 24 Radix `<Heading>`s omit `as` → every heading is an `<h1>`; no hierarchy on a long feed.
- The home search field is a `readOnly` input that blurs itself on focus and swaps the screen (WCAG 3.2.1 On Focus) — render it as a button styled like a field.
- Sub-12px muted text on gray-9/gray-10 tokens measures 3.3–3.8:1 (pack prices, MRP, order stats) — token swap to gray-11 fixes it invisibly.

### Low
- Strike-through MRP is style-only — SRs read two indistinguishable prices (6 instances).
- Reduced-motion misses the 4s wheel spin (`transition`, untouched by `animation: none` rules) and the skeleton shimmer.
- `.nav-search input { outline: none }` with no `:focus-within` replacement (the login group pattern exists to copy).

---

## 6. React architecture

**Summary:** a 5,600-line monolith whose own section comments already define clean module boundaries — extraction is mechanical, not a redesign. The consequential issues are behavioral: duplicated state causing real bugs.

### High
- **6.1 Cart quantities have no single source of truth** — `ProductCard`, `FlashCard`, `ComboCard` each hold local `useState(0)` incremented alongside `onChange(1, p)` but never read back from the cart. Swipe-removing in cart, placing an order, or a PLP filter remount leaves every stepper stale; the same SKU in two shelves shows two counts. (Corruption consequences in §7.2.)
- **6.2 `EndlessFeed` rewrites product ids** — clones with `id: 'f0-' + p.id` flow into a cart keyed by `p.id`: the same SKU becomes multiple cart lines that never merge, bulk tiers never aggregate (6+6 pieces ≠ 10+ tier), and the PDP shows fake item codes ("F0-BA1"). Put the batch in the React `key`, never in the data.
- **6.3 The monolith itself** — ~70 components, 21+ root `useState`, helpers interleaved between screens (`fmtL` defined 400 lines after first use). The file's own banners (`/* Header */`, `/* Cart page */`, …) are the ready-made `lib/ hooks/ components/ screens/` split. Do it before further feature work compounds it.
- **6.4 Nine hand-rolled copies of the pushState/popstate overlay pattern, glued with render-time ref mutation** — six mirror refs assigned during render, a module-level `ordPgRef` mailbox written during render, a mutated `subRef` prop. Each new overlay must know about every other; one missed guard breaks back for all (see §7.1 — it already happened). Replace with one `useHistoryLayer` hook + overlay stack.

### Medium
- **6.5 Hash pseudo-routing**: 30 scattered `location.hash` reads across 8+ components with no route table; one deep link (#ordpg) needs three components to agree. A single `parseRoute()` consumed once keeps the hash scheme without the sprawl.
- **6.6 `CategoryPage` and `SearchSheet` are parallel reimplementations** of the same listing screen (byte-identical empty states, same skeletons, same FilterSheet calls) that have already drifted. Extract a `ListingScreen`.
- **6.7 Cart state is prop-drilled through ~30 signatures** while open-intents use context — promote cart to `CartStateCtx` + stable `CartDispatchCtx`.
- **6.8 Catalog taxonomy is regex-inferred from product names at render time** (`CAT_RULES`, `SUBCATS`, `RECO_RULES`, …) — renaming a product silently re-categorizes it across PLP/PDP/recos. Categories belong in `data.js`.
- **6.9 Bulk tiers stored as display strings** (`'10+ @ ₹350/pc'`) regex-parsed by two divergent helpers at render time in five places — a copy edit silently kills pricing. Store `{ thr, price, unit }`, derive the string.
- **6.10 31+ direct `localStorage` references across 17 ad-hoc keys**; `usePersisted` exists but address persistence alone has three independent code paths.
- **6.11 Root App holds 21+ `useState`** — every cart tap re-renders the whole tree with per-render catalog filtering inline (memoized leaves bail out; section chrome doesn't). Bounded today; the structural perf ceiling.
- **6.12 Order hydration duplicated three times; invoice/ledger HTML templates duplicated** — the today/past merge has already drifted between copies.

### Low
- ~170 lines of dead code: `ClearanceStore`, `OrderDetailSheet`, `LeaderCol` + `LEADERS` import, `TimerIcon`, dead `weather` prop (all flagged by the failing lint).
- One-letter props throughout (`p, n, b, f, q, m`) and the actively misleading pair: `product.qty` is a *pack label string* while cart `n` is the quantity.
- Demo figures encoded 2–3 independent ways (tier/target in TopBar vs Account vs Leaderboard) that currently agree but can drift; swipe gesture constants duplicated between JS (−84) and CSS (78px reveal).
- Render-impurity set: component defined inside render (`Sugg` — remounts on every keystroke), module-global `PDP_DIR` mailbox, `Date.now()`/localStorage in render paths. Latent until StrictMode returns; several are the lint errors.

---

## 7. React correctness

**Summary:** fundamentals are stronger than the layout suggests — every interval/listener/observer traced has cleanup, all persisted-state parses are guarded, scroll handling is rAF-throttled, and the memo strategy genuinely works. Two high bugs sit in the cart/history interplay.

### High
- **7.1 Back/close of the bulk-qty sheet opened from inside the cart also closes the entire cart** — the cart's popstate handler is the only one with no topmost-overlay guard (`const onPop = () => setCartOpen(false)`). QtySheet opens above the cart ("Flash deals before you checkout", PDP "Add more"); both `closeQty()` and `confirmQty()` route through `history.back()`, whose single popstate fires both listeners. **Confirming a quantity ejects the dealer from checkout.** Fix is one line: `if (!qtyRef.current) setCartOpen(false)`.
- **7.2 Stale card steppers corrupt cart count/total** — consequence of §6.1: tapping minus on a stale stepper runs `changeCart(-1, p)` where `items[p.id]` is absent; the line delete is a no-op but `count`/`total` still decrement → the bill's "Item total" disagrees with the visible lines. Reachable via the *core demo flow* (add → checkout → place order → return home → touch a stepper).

### Medium
- **7.3 `qc-addr-sel` written in two incompatible formats** — CartPage stores raw `a2`; AcctAddr (via `usePersisted`) stores `"a2"` JSON. Each side fails to read the other and silently falls back to the first address: a default set in Account is ignored by checkout, and vice versa.
- **7.4 Cross-navigation orphans history entries** — Account → Schemes → category closes overlays via setState without unwinding their pushed entries; users then hit 2 dead back-presses on home before the third leaves the app.

### Low
- Order-detail timeline computes progress from `Date.now()` during render with no ticker — frozen while viewed, jumps on unrelated re-renders (home `OrderCard` does it right with a 1s interval).
- That same `OrderCard` interval never stops after delivery — a permanent 1Hz re-render on home for as long as a past order exists.
- Quiz advance `setTimeout(900ms)` is never cleared (close mid-question → setState on unmounted tree; can mark the daily quiz played from a dead timer).
- Spin timeout uncleaned; full-page reload mid-spin burns the daily spin with the prize unpersisted.
- localStorage *writes* inside `useState` initializers (`qc-hero-idx`, `qc-fest-idx`, `qc-deal-end`) — double-run under StrictMode, which `main.jsx` says will return.
- Theme object `T` rebuilt every render defeats its effect dep → 4 root CSS custom properties rewritten on every cart tap.
- Module-level `DAY` constant freezes "today" at load while `quizSkin` recomputes `Date.now()` per render — two clocks for daily gating; sessions crossing midnight desync.

---

## 8. CSS architecture

**Summary:** better-crafted than its size suggests — animation hygiene near-exemplary, Radix embraced not fought, only 13 `!important` (mostly principled), 73+ named sections with genuinely useful comments. The debt is structural.

### High
- **8.1 No project token layer** — 277+ hex literals (86+ distinct), 64 distinct `rgba()`, 62 distinct box-shadows, 20 radius values; the *only* custom properties defined are 2 font vars. A comment even claims "one radius scale" enforced by a late override list instead of a token. One gradient mixes both worlds: `linear-gradient(160deg, #14633F 0%, var(--green-9) 55%, #0E4A2F 100%)`.
- **8.2 Append-only "pass" sections scatter one component across 3–6 cascade-dependent locations** — `.cp-card`'s final rendering merges six rules spanning 1,260 lines; section history reads "Account page" → "refinement pass" → "Account v3" → "Account joy"; the refinement pass restyles classes that no longer exist in the JSX. Reordering the file would silently change the UI.

### Medium
- **8.3 ~27 verified dead selectors (~200 lines)** including five whole sections: the Utilities sheet, the quiz `deco-*` family (whose `deco:` field in data.js is also never read), login v1, the superseded `.fab.*`/`.nav-search` nav iteration, `.coin-pop` — and the reduced-motion block still enumerates some of them.
- **8.4 Full-page panel boilerplate duplicated ~10×** with hand-incremented z-indexes (70, 72, 73, 75, 76, 77, 78, 80 — stacking order encodes commit history, not intent). One `.page` primitive + 5 z-tokens (`--z-header/nav/page/overlay/gate`) replaces all of it.
- **8.5 469 inline `style={{}}` in App.jsx** — the de-facto "micro label" style exists as 32 scattered copies in two prop orderings; 24× `minWidth: 0`; 22× `flex: 'none'`; 65 hex literals inside JSX. Inline styles also bypass the reduced-motion overrides the CSS carefully sets up.
- **8.6 Naming is consistent but cryptic and leaky** — 2–3-letter prefixes (`cz`, `qs`, `cp`, `oc`, `tj`); `.pdp-head` is actually the generic header of five non-PDP pages; `.cp-*` (cart page) styles account sub-pages. Rename the shared primitives honestly (`.page-head`, `.card`) and add a prefix legend.

### Low
- The app's *single* width media query targets only a dead class — the entire responsive layer is one dead rule (the centered 480px column is the real strategy and it works).
- Reduced-motion is split across 6 blocks that each enumerate class lists — new animations will be missed (czshake already is).
- The wheel CTA uses `!important` to out-rank earlier rules in the same file (the other 10 uses are principled).
- Brand dark-greens hardcoded inside live gradients next to tokens — visible seams if the accent or dark mode ever changes.
- `App.css` is an empty file still imported.

---

## 9. Data layer & business logic

**Summary:** unusually disciplined in parts — every persisted `JSON.parse` is guarded, most seed numbers reconcile when recomputed by hand (two of three credit bills match their orders exactly). The structural weaknesses: money state isn't single-sourced, and business rules are encoded as display strings.

### High
- **9.1 Cart count/total are stored aggregates, not derived** — `count: c.count + delta` instead of deriving from `items`; combined with stale card state this produces a wrong "To pay" (worked example: bill says ₹1,735 against a single visible ₹2,120 line). `photos` is append-only, so removed items' thumbnails linger in the CartBar. **Fix:** store only `items`; derive count/total/photos.
- **9.2 Order total disagrees across surfaces** — checkout stores the *paid* `amt` (₹5,240 with bulk savings) but order detail and the GST invoice recompute **full price** (₹5,660), and the ₹200 express fee never appears on any invoice. **Fix:** snapshot the full bill breakdown (`itemTotal, bulkSave, schemeOff, fees, toPay`) on the order record; render detail + invoice from the snapshot. (Currently moot-but-worse: the invoice button throws — §1.1.)

### Medium
- **9.3 Bulk tiers as display strings with unit errors** — `'10+ @ ₹350/pc'` on a product sold *per pair*; a third SKU uses '/set'. Three unit vocabularies, regex-parsed in two places, hardcoded '/pc' in the qty sheet.
- **9.4 Wheel/streak/fest/scheme promises are decorative** — no `qc-coupon` is ever written; the streak count itself is hardcoded `claimed ? 6 : 5`. (UX impact in §3.3.)
- **9.5 No stock enforcement and self-contradicting seeds** — stock-0 items addable in any quantity; ba2 has stock 8 with a "20+" bulk tier; the cart nudge invites adding past stock.
- **9.6 Credit bill QC-446102 (₹41,250) is 4× its own order's line value (₹11,050)** — the other two bills reconcile exactly, proving intent; this one was missed. The discrepancy sits on the *overdue, red-highlighted* bill a reviewer checks first.
- **9.7 Past orders don't snapshot prices** — history totals derive from the live catalog (`FEED_POOL.find`), so editing a price silently rewrites every historical invoice. New orders already snapshot correctly; seeds bypass the pattern.
- **9.8 Cart is the only meaningful state not persisted** — refresh mid-order wipes it while the delivery note survives. No `qc-version` key for the 17-key schema.

### Low
- Volume-scheme slab and free-delivery threshold computed on pre-discount total (internally consistent, but a generous stacking rule no real ledger would use).
- ba2's stored tag "7% OFF" vs computed 6% — both visible on one PDP (hero badge prefers the tag, price pill computes). Delete the derivable `tag` field.
- All four PAST_ORDERS weekday labels are wrong for their own timestamps (2025 weekdays on 2026 dates) — stored alongside `ts` instead of derived.
- Orders-page KPI fudge (`+12`/`+₹10.4L`) ignores the active date filter too.
- `LEADERS` is imported but never rendered (data.js documents why it was replaced — keep the note, drop the export).

---

## 10. Tooling, build & project hygiene

**Summary:** `vite build` succeeds in ~190ms; hygiene around it lags the app's polish.

### High
- **10.1 `npm run lint` fails: 40 errors + 1 warning** — 8 dead-code `no-unused-vars` plus 32 react-hooks v7 compiler-rule hits, several of which are the genuine render bugs cited above (`Date.now()` in render, `Sugg` created during render, refs written during render). The repo's only quality gate is red, so new errors are invisible. **Fix:** delete the dead code, fix the genuine hooks issues, downgrade the purely compiler-prep rules to `warn` — then keep it green.

### Medium
- **10.2 No code splitting** — one 510 kB JS chunk (150 kB gzip) + 764 kB CSS (97 kB gzip, dominated by the monolithic Radix import); Vite prints its own oversize warning. ~248 kB gzipped on the critical path of a mobile-first app. Splitting requires §6.3 first.
- **10.3 README is the untouched Vite template** — no pitch, no port, and crucially no documentation of the *no-hash = login gate / any-hash bypasses it* behavior, which a visitor cannot discover. The front door of a portfolio repo.
- **10.4 No meta description / OG / twitter tags** — sharing the Vercel URL produces a blank card. The manifest already has good copy to reuse; ~10 lines.
- **10.5 Debug error hook ships in production HTML** (`index.html:18`) — runtime errors rewrite the tab title to raw error text (and §1.1 currently triggers it). Gate it to dev or delete.

### Low
- Vercel `buildCommand` uses `npm install` (works with a synced lockfile, but `npm ci` + an `engines` field is the right hardening for a React 19/Vite 8/ESLint 10 bleeding-edge stack).
- No tests/CI — for *this* repo the minimal set is: vitest unit tests on cart/bulk math + a render-smoke per hash entry point, and a 15-line Actions workflow (after lint is green).
- Repo root litter: 5 stray committed PNGs that are md5-identical duplicates of `src/assets/brands/*`, plus a stray root `node_modules` with only a Vite dep-cache.
- PWA: valid manifest, but no service worker; `start_url: "/"` lands installs on the login gate every launch; the single un-padded icon declares `purpose: "any maskable"` (will be circle-cropped).
- Template leftovers: unused `react.svg`/`vite.svg`/`hero.png`/`public/icons.svg`, empty `App.css` still imported.
- No TypeScript on an untyped monolith; `@types/react` installed but inert. Minimal step: `jsconfig.json` with `checkJs`, fix `data.js` first.
- StrictMode deliberately off (documented) — fine for demos, but make it toggleable so dev gets purity checks back.

---

## 11. Security & robustness

**Summary:** genuinely clean for a no-backend demo — zero `dangerouslySetInnerHTML`/`innerHTML`/`javascript:`, zero `console.*`, `npm audit --omit=dev`: **0 vulnerabilities**, no secrets, `rel="noreferrer"` on the one external link, honest demo labeling on the fake login. The real risks are robustness and first impressions.

### Medium
- **11.1 Geolocation permission prompt fires on first paint — on the login screen** — `useSkyTheme`'s mount effect calls `getCurrentPosition` before the user sees any value, then sends precise coordinates to `api.open-meteo.com` (benign, keyless, but undisclosed). Reads sketchy as a first impression. **Fix:** start with the time-based theme (already the fallback) and request location only behind an explicit affordance.
- **11.2 No error boundary** — one render error anywhere in the 5,600-line tree = blank white page (with only the §10.5 title hook as feedback). A ~20-line branded boundary with "Reload" (optionally clearing `qc-*` keys) is the single cheapest robustness win.
- **11.3 Unguarded raw `localStorage` in render-path initializers** — `qc-auth`, `qc-hero-idx` (read **and write** during render), `dealSecsLeft` — throws `SecurityError` where storage is blocked (Chrome "block all cookies", some in-app webviews/embeds) → white page on first render. Notably every `JSON.parse` *is* guarded; only raw get/set calls sit outside. A 5-line `safeStorage` wrapper fixes all ~30 call sites.
- **11.4 All catalog imagery hotlinks `images.unsplash.com` with no `onError`** — a rate-limit, hotlink block, or offline session degrades the entire catalog to permanent gray boxes (`.fadeimg` stays at opacity 0). Localize the ~40 images into `public/img/` and add an `onError` fallback.

### Low
- Dev hash backdoors (`#sim`, `#dash`, `#theme-*`, cart preloads) ship to production and any hash bypasses the login gate — harmless with fake data, but gate behind `import.meta.env.DEV` or document them in the README as intentional review tooling.
- The login gate asks for a real phone number implying an SMS, admitting "demo — any 4 digits work" only on the next screen. Surface the disclosure on screen one.
- Google Fonts render-blocking + third-party (self-host via `@fontsource` to remove the failure mode).
- No security headers/CSP on the Vercel deploy — a 10-line `headers` block pinning the four known origins is cheap defense-in-depth.

---

## 12. Cross-surface coherence (completeness-critic findings)

These were caught only by examining *between* the screens the other reviewers audited individually:

- **12.1 Search is a single contiguous-substring match over `name + qty`** — "hinges" (plural) matches nothing, "soft close" misses "Soft-Close", "ebco hinge" fails (non-contiguous), brand and material fields are never searched, "450 mm" fails while "450mm" works — and the failure is masked by a silent "showing everything" fallback. The placeholder promises "Search fittings, brands, sizes…". **Fix (small):** tokenize, AND-match tokens, normalize hyphens/plurals, include `brand`/`mat` in the haystack. *(medium)*
- **12.2 The drawer-slide calculator's "Slide length" selector is dead** — the recommendation filters by load only; `sz` appears nowhere, so it confidently recommends a wrong-length part while the products carry a `size` field it could use. *(medium)*
- **12.3 Visit bookings fake-advance to "Visited" 4 minutes after submission** even when the booked slot is days in the future — the same row shows "19 Jun · 4 PM" and a green "Visited" simultaneously. Gate terminal stages on the booked datetime, as the order timeline gates "Delivered". *(medium)*
- **12.4 The core speed promise mutates across surfaces** — hero "90 min" → login "1-hour" → checkout default "today by 6 PM" (1 hour costs +₹200) → tracking "~15 min". Pick one ladder and echo the chosen promise from the order record. *(medium)*
- **12.5 "Delete list" permanently destroys a persisted project list with no confirmation or undo** — bigger blast radius than the already-flagged address delete (a list is a job's bill of materials). *(low)*
- **12.6 No autofill/keyboard semantics anywhere** — phone inputs lack `type="tel"`/`autoComplete="tel"`, OTP lacks `autoComplete="one-time-code"` (the signature interaction of real q-commerce logins), addresses lack autocomplete tokens, search lacks `enterKeyHint="search"`. Exactly the invisible polish separating Blinkit-grade forms from demos. *(low)*
- **12.7 `#pdp` deep link isn't parameterized** — refresh while on any PDP silently swaps to `FEED_POOL[0]`; `#plp-<cat>` proves the pattern exists. *(low)*
- **12.8 GST "Verified" badge from a loose regex** — `/^[0-9]{2}[A-Z0-9]{13}$/` accepts garbage and labels it "Verified", a strong compliance word for a format sniff. Tighten to the real GSTIN shape and relabel "Valid format". *(low)*

---

## Verified strengths (keep these)

Worth recording so refactors don't regress them:

- Zero emoji-as-chrome (grep-verified — only `✓`/`→` text glyphs, and those are flagged for icon swaps).
- All 33+ keyframes animate transform/opacity only; `content-visibility: auto` on offscreen feed; zero `will-change`; documented micro-motion layer.
- Every persisted-state `JSON.parse` is try/catch-guarded with shape checks; the deal timer self-heals from garbage.
- rAF-throttled scroll handling with hysteresis; every traced interval/listener/observer has cleanup (the exceptions are listed in §7).
- `memo(ProductCard)` + stable `useCallback` contexts genuinely prevent card re-renders on cart changes.
- Per-overlay browser-back integration (the ambition is right; the implementation needs the §6.4 consolidation).
- Radix Themes used idiomatically: 400+ scale-token references, theme accent matches usage, fonts via Radix's own hook, zero internal-class overrides.
- `npm audit`: 0 vulnerabilities; no secrets; `.gitignore` correct (dist/.vercel/node_modules untracked; 33 tracked files, all legitimate).
- Honest demo labeling on the OTP screen and a guest path; nothing misrepresented as real security.
- Empty states present consistently across surfaces; six `prefers-reduced-motion` blocks; viewport zoom never blocked.

---

*Companion document: **[IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)** — every issue above mapped to a prioritized, effort-tagged work plan.*
