# QuickCart — Client Requirements Plan (13 Jun 2026)

Mapping of the 12 requested capabilities → what exists today → what to build, in phases.

## Status legend
✅ already live · 🟡 pattern exists, needs a new page/extension · 🔴 net-new build · ⚙️ needs real backend

---

## The 12 requirements

| # | Requirement | Status | Where it stands / what's needed |
|---|------------|--------|--------------------------------|
| 1 | Product suggestions per project (wardrobe / kitchen / …) | 🟡 | "Buy it with" + recommendations + Combo kits + Project Lists exist. Build a **Project Kit Builder**: pick Kitchen/Wardrobe/Office → curated checklist (slides, hinges, locks, handles, lighting) with suggested quantities → one tap saves to a Project List or adds all to cart. |
| 2 | Hinge filters: door thickness, carcass thickness | 🟡 | Filter system (subcat/brand/material/load/size/deals/sort) is shared across PLP + search. Add `doorThk` / `carcassThk` fields to hinge SKUs and category-aware filter groups (filters appear only where the category has the spec). |
| 3 | Door-closer selector (door W×D×H + material → suggestion) | 🟡 | Calculators already do exactly this pattern (slide-load, hinges-per-door, each recommending a real SKU with ADD). Add a third calculator: **Door closer selector**. |
| 4 | Requests: branding / demo / carpenter activity / promo items | 🟡 | The visit-request system (customer details, date/slot, tracked stages) is the template. Add **Marketing & Support Requests** with type chips (Branding kit · In-shop demo · Carpenter meet · Promo material), quantity/notes, and the same tracked list. |
| 5 | Repeat order — 1-click | ✅ | Done three ways: Reorder page (usual-qty one-tap + "Add all due"), Repeat on every past order, Reorder on the delivered-order card. |
| 6 | Claims: pending CN / material return / wrong delivery | 🔴 | New **Claims Centre** in Account: pick an order → claim type → affected items + photos + notes → tracked status (Raised → Under review → CN issued / Pickup scheduled). UI is buildable now on the request pattern; settlement needs backend. |
| 7 | Delivery image upload (POD) | ⚙️ | Upload happens in the **rider app** (separate surface). Dealer app side: show a **Proof of Delivery** section on delivered orders (photos, receiver name, time). Mock display can be built now. |
| 8 | Find a carpenter | 🔴 | New directory. Natural home: the **Utilities tab** finally becomes "Find a Pro". Cards: name, skills, area, jobs done, rating, Call/WhatsApp. |
| 9 | Find an architect / designer | 🔴 | Second tab of the same directory. |
| 10 | Gallery for inspiration | 🔴 | **Inspiration** grid (kitchens/wardrobes/offices), tap → full view + "products used in this design" → ADD/save to list. |
| 11 | Design library, regularly updated | 🔴⚙️ | Same surface as #10 with collections; "regularly uploaded" implies an **admin CMS feed** (backend). App ships the viewer now; content pipeline later. |
| 12 | Secret dealer scorecard (weighted) | 🟡⚙️ | Tier/percentile/“ahead of 75%” already visible. The weighted engine (order continuity, range selling, prompt payments, target achievement, referrals, time-in-app) must be **computed server-side only** — anything in the app bundle is readable by anyone. App displays only the resulting score band. See below. |

---

## Scorecard #12 — handling the secrecy correctly

- Weights & formula live **only in the backend** (and in this private doc). The client app receives a single computed score / band — never the components.
- ⚠️ If this GitHub repo is ever made public, move this section out.
- Draft model (tune with the group):

| Component | Signal | Draft weight |
|---|---|---|
| A. Order continuity | weeks with ≥1 order (rolling 12w) | 25% |
| B. Range selling | distinct categories + brands billed / quarter | 20% |
| C. Prompt payments | avg days-to-pay vs credit terms, overdue count | 20% |
| D. Target achievement | monthly/quarterly target % | 20% |
| E. Referrals to NDC | converted referrals | 10% |
| F. App engagement | session days/week, feature breadth (not raw minutes — gameable) | 5% |

- Needs: backend event tracking (orders, payments, sessions), nightly score job, score → tier mapping. "Time in app" requires an analytics SDK decision.

---

## Phasing

**Phase 1 — this week, frontend on existing patterns (no backend):**
- #3 Door-closer selector (calculator #3)
- #2 Thickness filters on hinges (data fields + filter groups)
- #4 Marketing & support requests page
- #6 Claims Centre UI (order picker → claim → tracked status)
- #7 POD section on delivered orders (mock images)

**Phase 2 — new surfaces:**
- #1 Project Kit Builder (feeds Project Lists / cart)
- #8 + #9 Find-a-Pro directory (becomes the Utilities tab)
- #10 + #11 Inspiration gallery + design library viewer

**Phase 3 — backend/ops (with the API build):**
- #12 scoring engine + events (incl. time-in-app), admin CMS for designs/schemes, rider-app POD upload, claims settlement flow, referral capture.

---

*Everything in Phases 1–2 is demoable with mock data the same way the rest of the prototype works; Phase 3 items are listed in the backend contract.*
