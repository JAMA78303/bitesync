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

### DEC-004: Nutrition Truth Lives With the Stored Ingredients
- **Date:** 2026-08-22
- **Status:** Accepted
- **Decision:** A recipe's stored macros are derived from the ingredient rows actually written to the database, never from the in-memory draft. `verify:nutrition-integrity` audits the two against each other.
- **Why:** A generated porridge stored 762 kcal while its saved ingredients came to 157 — ~100g of phantom almonds counted but never saved. Every calorie and protein target in the app is computed from these values.
- **Consequence:** Recipe saves cost their ingredients once and re-cost only when the stored rows differ. Nutrition bugs are found by an audit rather than by users spotting odd numbers.

### DEC-005: Unmeasured Nutrients Are Unknown, Not Zero
- **Date:** 2026-08-22
- **Status:** Accepted
- **Decision:** A food with no measured value for a nutrient is excluded from that nutrient's totals and from its coverage count. Never scored as zero.
- **Why:** The weekly analysis silently drops unmatched ingredients, so a coverage gap reads as a *deficiency*. Vitamin D showed 5%; buckwheat contributed no micronutrients for six commits after a rename.
- **Consequence:** Omega tracking reports `null` rather than a confident `0g` when nothing on a plan has data. `verify:micro-coverage` is a CI gate.

### DEC-006: CoFID Matching Needs Explicit Class Guards
- **Date:** 2026-08-22
- **Status:** Accepted
- **Decision:** The CoFID matcher is fuzzy by design and must be constrained by explicit mismatch guards for known traps: plant milks must resolve to a *drink* row, bare staples must not take fried/roast or raw-grain values, mince/breadcrumb/pasta classes are guarded individually.
- **Why:** "almond milk" resolved first to dairy (61 kcal/100g) and then, after a partial fix, to whole almonds (579 kcal/100g) — the fix made it ten times worse. "potato" resolved to fried chips, adding 14g of phantom fat.
- **Consequence:** Guards require the *right* class rather than blocking wrong ones — a blocklist only stops the cases you thought of. Each guard carries a regression test.

### DEC-007: Targets Scale With the Person
- **Date:** 2026-08-22
- **Status:** Accepted
- **Decision:** Protein scales by activity level against adjusted bodyweight above BMI 30; calorie goals are a percentage of TDEE, not a flat 500; fat is floored at 0.6 g/kg.
- **Why:** Flat figures meant different things to different bodies — a 140kg sedentary man was prescribed 308g of protein, and a 60kg woman got a 32% deficit from the same "lose weight" selection.
- **Consequence:** Athlete-level multipliers are reserved for users whose stated activity justifies them. Multipliers were agreed against PENG ranges and should not be changed without the same scrutiny.

### DEC-008: Pantry Matching Is Strict, Recipe Matching Is Fuzzy
- **Date:** 2026-08-22
- **Status:** Accepted
- **Decision:** "Do I already own this?" uses exact significant-word matching (`pantryCoversIngredient`); "what could I cook?" keeps fuzzy scoring. A pantry item with no quantity only suppresses a shopping line for store-cupboard staples.
- **Why:** Sharing the fuzzy CoFID matcher meant pantry "pepper" deleted red peppers from the shopping list, and "butter" deleted peanut butter. A missing ingredient found at the shop costs far more than a duplicate.
- **Consequence:** Two functions for two questions. Perishables stay on the list unless a quantity says otherwise.

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

> Reviewed 2026-08-22. The August work was nutrition integrity, target
> correctness, push notifications, and CI — none of it on this list. The items
> below predate that and have not been re-validated against current priorities.

### AGD-000: Template Calorie Undershoot - P0
- **Goal:** Templates reach the top of their calorie bands so a generated day sums to its target.
- **Why now:** Meal shares were over-allocating by 5-17% and accidentally compensating for templates that land at the low end of every band. Normalising the shares exposed a -8.3% shortfall on build-muscle weeks, so the normalisation is held (stashed) until this is fixed.
- **Blocked work:** meal-fraction normalisation.

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

