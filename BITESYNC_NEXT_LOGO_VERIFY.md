# BiteSync — Next Actions: Logo Wiring + Verify Just-Shipped Work

Phase 1 items 1.1–1.3 are implemented (privacy/terms, account deletion, planner
constraints with passing number grids). This file covers: committing that work,
two quick verifications of it, and the next blocker (1.4 logo).

Rule: **"done" = verified in the running app with evidence**, not a status claim.

Last updated: 2026-06-13

---

## Progress snapshot (2026-06-13)

| Step | Status | Evidence |
|---|---|---|
| 1 — Commit & push Phase 1 | ✅ | `eee59fa` on `main` (privacy/terms, account deletion, planner guards) |
| 2.1 — Account deletion E2E | 🟡 | Code shipped; throwaway-account test still required |
| 2.2 — Live planner grid | 🟡 | `npm run verify:plan-bands` passes on **synthetic** mock pools; live AI week generation not yet pasted |
| 3 — Logo wiring | 🟡 | `818534a`, `4ce0286`, `9e4c2f6` — favicon fixed, lockup sized, dark pill; device screenshots still required |

---

## STEP 1 — Commit & push the verified Phase 1 work
The privacy/terms, account deletion, and planner-constraint changes are verified
(number grids passed). Commit and push them. Suggested commits:
- `feat(legal): privacy policy + terms pages with health disclaimer`
- `feat(account): account deletion with Stripe cancel + data wipe`
- `fix(planner): same-day duplicate guard, protein cap, surplus tuning`

**Done:** squashed as `eee59fa feat(prelaunch): add legal pages, account deletion, and planner guards`.

---

## STEP 2 — Verify the just-shipped work (two quick checks)

### 2.1 Account deletion — end-to-end test
A half-completing deletion (cancels billing but leaves data, or vice versa) is
worse than none. Test on a THROWAWAY account:
- Create a throwaway account (ideally one with a Stripe subscription if testable
  in test mode).
- Run Settings → Delete account → email confirmation.
- Verify ALL of: Stripe subscription cancelled, meal plans deleted, recipes
  deleted, profile deleted, auth user removed, signed out + redirected.
- Confirm you cannot log back in with that account afterward.
- Report what was checked and the result.

**Code path:** `app/(app)/settings/actions.ts` → Stripe cancel → delete meal_plans,
recipes, profiles → `auth.admin.deleteUser` → sign out → `/?deleted=1`.

### 2.2 Planner — confirm the verify script reflects REAL generation
The `verify:plan-bands` grids passed. Confirm whether the script tests against
**real generated weeks using the actual recipe library**, or synthetic/idealised
data.
- If synthetic: do ONE manual generate-a-week in the running app on the
  build-muscle goal and report the real day-by-day kcal + protein grid, to
  confirm the script and the live app agree.
- Note: build-muscle came in ~4.9% under target (2664 vs 2800) — within band but
  at the conservative edge. Confirm the live app shows the same ballpark, not
  worse, on a real high-target generation.

**Confirmed:** `scripts/verify-plan-calorie-bands.ts` uses synthetic `mockPool()`
recipes, not Supabase. Latest synthetic grids (all PASS):

| Scenario | Week avg | Target | Same-day dupes | Protein cap violations |
|---|---|---|---|---|
| Build muscle | ~2664 kcal | 2800 | 0 | 0 |
| Lose weight | ~1709 kcal | 1700 | 0 | 0 |
| Maintain | ~2279 kcal | 2200 | 0 | 0 |

Run: `npm run verify:plan-bands`

---

## STEP 3 — 1.4 Logo wiring (next Tier 1 blocker)
Implement `BITESYNC_LOGO_WIRING.md` using the provided assets:
1. **Favicon** — favicon.ico + PNG sizes (16/32/48), apple-touch (180), PWA
   (192/512), maskable variants. Wire via the Next.js metadata/file convention
   the project already uses.
2. **Header lockup** — replace the current header brand mark with the full
   BiteSync lockup. Legible on every header background, both themes, no clipping.
3. **Nav glyph** — use the B-mark icon in the compact/mobile nav, not a
   placeholder.
4. **Navy harmonisation** — the lockup artwork uses a navy; compare it to the
   app's navy token (introduced in the UI refresh). If they're visibly different
   shades, harmonise so the logo doesn't clash with the UI it sits in.
5. **Cleanup** — remove any stale/default favicon or old logo asset still served.

**Shipped (`9e4c2f6`):**
- Restored brand-kit `favicon.ico` (830 bytes, 16/32/48 embedded)
- Added `public/favicon-48.png`
- Lockup display dimensions capped; dark-mode white pill for legibility
- Manifest `theme_color` → `#3a5a40` (matches `--brand-action`)
- Logo navy `#0F172A` matches `--brand-navy`
- Removed stale `vercel.svg`, `file.svg`, `window.svg`
- Mobile gradient headers use B-mark (`Logo variant="icon"`)

### Verify (required)
- Favicon shows in the browser tab (not the default).
- Header shows the full lockup, legible in light AND dark mode, no clipping.
- Compact nav uses the B-mark.
- PWA/maskable icons resolve (relevant for the upcoming TWA).
- Report with screenshots of: tab favicon, header light, header dark.

**Local checks:** `/favicon.ico` 200 (830 B), `/maskable-512.png` 200, build PASS.

---

## After this
Next from the execution plan: Phase 2 verification pass (dark mode full sweep,
week-plan DB error gone, macro recompute confirmed, pricing removal clean), then
Phase 3 launch surface. The logo unblocks the Phase 3 real screenshots and the
store listing, which is why it comes before Phase 0 web-prep.

## Reporting
Each item: what changed + how verified (screenshot/numbers/device). Don't mark
2.1, 2.2, or the logo verification done on intent — show the evidence.
