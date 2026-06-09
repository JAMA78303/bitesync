# BiteSync — Spec Index & Status Tracker

One place to track every build spec, merge order, and **verified-in-code** status.

Last updated: 2026-06-02

---

## How to use this file

Do not guess from screenshots. Ask Cursor to grep/read the repo, or run diagnostic scripts.

Status key: ✅ verified in code · 🟡 partial / needs run or phone QA · ❌ not in code

---

## The specs

| # | Spec file | Covers | Status |
|---|---|---|---|
| 1 | `BITESYNC_FIXES.md` | Parser, kcal outlier, planner cards, social import | ✅ code done; kcal outliers repaired via Spec 4 |
| 2 | `BITESYNC_RECIPE_MAKER.md` | CoFID ranking, context units, zero-qty block | ✅ verified in code |
| 3 | `BITESYNC_TARGET_MISMATCH.md` | 2027 vs 2227 calorie target | ✅ verified in code |
| 4 | `BITESYNC_MACRO_RECOMPUTE.md` | One-off macro repair migration | 🟡 real run reported ~646 kcal breakfast; run `npm run verify:recompute` to confirm stored rows |
| 5 | `BITESYNC_UI_UX.md` | Goals nav, grocery modal, TDEE, dashboard labels | ✅ verified in code |
| 6 | `BITESYNC_LANDING_DARKMODE.md` | Landing dark-mode contrast | ✅ verified in code |
| + | `BITESYNC_BUTTON_CONTRAST.md` | Generate grocery list invisible label | ✅ verified in code |
| + | `BITESYNC_PLANNER_NAMES.md` | Single-letter meal card titles | ✅ diagnosed + fixed (layout) |
| + | `BITESYNC_SERVING_CONVERSION.md` | Fajitas ~184 kcal/serving import bug | ✅ STEP 2B parsing fix shipped (`40da026`) |
| + | Pantry spec | Cook from what you have + shared matching | ✅ shipped (`2e53a8e`); SQL applied |
| + | Pantry-aware grocery | Exclude/subtract pantry stock when generating lists | ✅ shipped (`ed0b7ee`) |
| + | Micro-rich snacks | Goal-matched snack templates + eligibility | ✅ shipped (`76c2c0e`) |
| + | Micro-aware planner snacks | Bias AI heuristic snack picks toward deficient nutrients | ✅ shipped (`91b9d98`) |
| + | Generate snack for gap | One-click micro-focused snack draft from Nutrition view | ✅ shipped (`b1441bb`) |
| + | `BITESYNC_MOBILE_DARKMODE.md` | Mobile nav, dark mode, safe-area padding | 🟡 nav fix in code (5 tabs + More); dark mode token pass in code — **phone QA still required** |
| + | `BITESYNC_OVER_UNDER_COLOUR.md` | Distinct over/under macro colours | ✅ shipped (`f1d4325`) |
| + | `BITESYNC_DATE_ORDINALS.md` | Monday 1st date formatting | ✅ shipped (`92cf64a`) |
| + | `BITESYNC_PLANNER_TIP.md` | Breakfast empty-state tip repeats 7× | ✅ shipped (`b01982c`) |
| + | `BITESYNC_RECIPES_CONTRAST.md` | My Recipes header pill/search contrast | ✅ shipped |
| + | Fill My Library | Bulk recipe generator | ✅ shipped (`df5a9ea`) |
| + | `LANDING_UI_IMPROVEMENTS.md` | Landing hero, mockups, pricing, footer | ✅ verified in code |

---

## Merge / run order

1. **Spec 1** — parser + planner layout + import (foundation)
2. **Spec 2** — CoFID matching
3. **Spec 3** — target mismatch
4. **Spec 4** — macro recompute — run after Specs 1+2 + serving fix merged; `--dry-run` first
5. **Specs 5, 6, button, planner names** — UI/contrast (independent)
6. **Serving conversion fix** — import parser extensions
7. **Pantry** — independent feature
8. **Mobile / nutrition UI** — nav, dark mode, ordinals, macro colours (2026-06-04 batch)

---

## Stale grocery snapshots (separate from Spec 4)

**Verdict: `grocery_items` is a persisted snapshot. Macro recompute does not touch it.**

Regenerate in-app (**Grocery → Generate list**) or use the audit script:

```bash
npm run regenerate:grocery -- --dry-run    # list affected meal plans
npm run regenerate:grocery -- --apply     # rebuild from current recipes
```

Scope queries: `sql/2026-06-03_grocery_scope_and_recompute_checks.sql` (Part A).

| Scope query result | Action |
|---|---|
| One list, or a handful | Regenerate by hand or `--apply` for one `--meal-plan-id` |
| Many affected plans | `npm run regenerate:grocery -- --apply` (review dry-run first) |

---

## Spec 4 — MACRO_RECOMPUTE run log

| Step | Status | Notes |
|---|---|---|
| Dry-run #1 | 🟡 | Admin UI or `npm run recompute:macros -- --dry-run` |
| Real run | 🟡 | User reported via admin after CoFID banana fix; breakfast ~646 kcal |
| Stored-row verify | 🟡 | `npm run verify:recompute` — checks reference breakfast stored kcal (expect ~650–730, not ~910) |
| Dry-run #2 (expect 0 changes) | 🟡 | Admin → **Verify** or dry-run npm again |

**GitHub Actions:** add `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — see `.github/workflows/README.md`.

**Run locally** (`.env.local` with Supabase service role):

```bash
npm run verify:recompute
npm run recompute:macros -- --dry-run
npm run recompute:macros
npm run recompute:macros -- --dry-run   # expect 0 changes
```

---

## Mobile nav (Task 2)

Bottom bar: **Home · Plan · Recipes · Grocery · Nutrition · More**

**Settings tap path (390px):** bottom nav **More** → **Settings**

Pantry and Goals also live under **More**.

---

## Next actions

1. **Spec 4 verify** — `npm run verify:recompute` with `.env.local` (stored breakfast kcal)
2. **Phone QA** — Settings reachable via More; dark mode on all main screens
3. **Stale grocery** — `npm run regenerate:grocery -- --dry-run` then `--apply` if needed
4. **Fill library with snacks** — bulk fill or generate Snack goal-matched recipes
5. **Build: micronutrient DB coverage** — biggest remaining accuracy win for micro analysis

---

## Note

Parser + CoFID matcher fixes are highest leverage — bad output flows into grocery, planner totals, and dashboard. Macro recompute repairs **recipe** rows; **grocery** snapshots only refresh on regenerate.
