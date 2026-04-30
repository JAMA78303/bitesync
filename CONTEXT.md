# BITESYNC Context

This file is the working context for implementation decisions, API contracts, and delivery notes.
Update this file whenever behavior, architecture, or UX choices change.

## Decisions Log

### DEC-001: Recipe Picker Uses Responsive Modal Pattern
- **Date:** 2026-04-27
- **Status:** Accepted
- **Decision:** Use `Dialog` on desktop and `Drawer` on mobile for recipe picking.
- **Why:** Mobile interaction is better with thumb-friendly bottom-sheet behavior; desktop is faster with centered dialog selection.
- **Consequence:** Maintain a single picker API with presentation selected by viewport to avoid feature drift across platforms.

### DEC-002: Website-First Delivery
- **Date:** 2026-04-27
- **Status:** Accepted
- **Decision:** Build BiteSync as a responsive web app first (Next.js), defer native packaging.
- **Why:** Fastest path to MVP, easiest Stripe setup, and immediate cross-device testing.
- **Consequence:** Prioritize mobile web UX quality (tap targets, sticky controls, safe-area behavior).

### DEC-003: Middleware/Auth Safety
- **Date:** 2026-04-27
- **Status:** Accepted
- **Decision:** Middleware/session logic uses validated-user flow and excludes webhook/static paths.
- **Why:** Reduces auth spoofing risk and avoids middleware over-triggering.
- **Consequence:** Keep protected-route and webhook matcher rules in sync with route additions.

## API Contract

All server actions should return one shared result union where possible.

```ts
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { error: string; code?: string };
```

### Contract Rules
- Use human-readable `error` strings safe for direct UI display.
- Prefer generic auth failures for login (`Incorrect email or password`).
- Include optional `code` for telemetry/debugging, not for user messaging.
- Keep success payload in `data` to avoid response-shape drift.
- Do not throw for expected user-path failures; return `ActionResult` instead.

## Nutrition Lookup Seed Notes

- `lib/nutrition/lookup.ts` contains starter ingredient data with `per_100g` metrics.
- Seed list is intentionally small to bootstrap the feature quickly.
- Expand by appending normalized ingredient keys (lowercase, trimmed).
- Track lookup quality with `coverage_pct` in computed recipe nutrition.

## Product Agenda (Next Features)

### AGD-001: Feeling Adventurous (AI Suggestion) - P1
- **Goal:** One-tap inspiration with minimal complexity.
- **Scope (MVP):** Button in planner -> suggest 1-3 meals -> user picks one -> assign to slot.
- **Out of scope (MVP):** Full recommendation ranking, personalization profiles, long chat UX.

**Implementation backlog**
- Add planner action `getMealSuggestions(day, mealType, weekStart)` that returns 1-3 recipe IDs.
- Start simple: random from user recipe library, filtered by meal type if tags exist.
- Add planner UI button near slot add action: `Feeling adventurous`.
- Show lightweight modal with 1-3 suggestions and quick-assign buttons.
- On selection, reuse existing `assignRecipeToSlot` flow (no duplicate logic).

**Acceptance criteria**
- User can get suggestions in under 1 second on normal data sizes.
- Selecting suggestion fills slot and closes modal.
- Failure state shows friendly retry message.

---

### AGD-002: Leftover Suggestions - Signature Feature - P1
- **Goal:** Reduce food waste and shopping cost by reusing ingredients already bought.
- **Core promise:** "You already have X ingredients this week. Here are meals to use them."

**Implementation backlog**
- Build ingredient frequency map from current week `grocery_items`.
- For each recipe, compute overlap score against unchecked grocery items.
- Return top N recipes with `uses X of your ingredients` explanation.
- Add `Use leftovers` suggestion entry point in planner and/or grocery page.
- Optionally exclude recipes already used > 2 times this week.

**Acceptance criteria**
- Suggestions visibly reference known ingredients from grocery list.
- At least one suggestion appears when overlap exists.
- Empty state when no overlap: fallback to adventurous suggestions.

---

### AGD-003: Dietary Filters (Basic) - P2
- **Goal:** Keep filtering simple and useful.
- **Initial filters:** `vegetarian`, `vegan`, `gluten-free`.

**Implementation backlog**
- DB migration: add `tags text[]` column to `recipes` with GIN index.
- Recipe form: allow selecting 0..n dietary tags.
- Recipe library + picker modal: filter chips for the three tags.
- Planner suggestion flows (AGD-001/002): respect active dietary filters.

**Acceptance criteria**
- Filters work in both recipe list and planner picker modal.
- Recipes can have multiple tags.
- Clearing filters restores full list.

---

## Delivery Order (Recommended)
1. AGD-003 data foundation (recipe tags + filter UI baseline).
2. AGD-001 adventurous suggestions (fastest user-visible value).
3. AGD-002 leftover suggestions (differentiation feature).

