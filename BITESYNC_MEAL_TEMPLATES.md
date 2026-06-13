# BiteSync — Build Spec: Template-Based Meal Generation (Replace Macro-Assembly)

## The problem

The meal generator assembles foods to hit macros, then rejects obviously-bad
combos via blocklist rules. This keeps producing incoherent meals (e.g. eggs +
oats + peanut butter) because blocklists stop *specific* bad combinations without
giving the generator any positive concept of what a meal IS. You can't blocklist
your way to coherence.

## The fix: compose from meal templates (archetypes), then fill roles

Flip the logic. Instead of "pick foods that sum to target, reject bad combos",
do: **pick a meal template appropriate to the meal type → fill each role with a
role-compatible ingredient → scale portions to hit the macro target.** Coherence
is guaranteed by the template structure; macros are hit by portioning within it.
Incoherent combos become structurally impossible, not caught after the fact.

## Part 1 — Ingredient → role mapping (the foundation; build first)

Every ingredient in the usable set needs to know which meal ROLES it can fill.
This mapping is the core work and is reusable (composition rules, pantry matching
want the same "what kind of food is this" knowledge — share it, don't duplicate).

Define roles, e.g.:

- `protein` (chicken, eggs, tofu, fish, beans, greek yogurt…)
- `base_carb` (rice, pasta, potato, bread, tortilla…)
- `breakfast_base` (oats, cereal, bread…)
- `vegetable` (broccoli, spinach, peppers, salad…)
- `fruit` (banana, berries, apple…)
- `dairy` (milk, yogurt, cheese…)
- `fat_topping` (nuts, seeds, nut butter, avocado, olive oil-as-dressing…)
- `cooking_fat` (oil/butter used IN cooking, not counted as a standalone item)
- `flavour` (herbs, spices, sauces, stock…)

Rules:

- An ingredient may map to multiple roles (greek yogurt = protein AND dairy AND
fat_topping depending on context).
- Mapping is data, easy to extend as the ingredient set grows.
- Reuse/extend existing food-category logic from the parser/CoFID/pantry work
rather than inventing a third taxonomy.

## Part 2 — Meal templates (archetypes)

Define a set of templates per meal type, each as a set of roles (required +
optional). Examples (author a sensible starting set — aim for variety):

- **Porridge bowl** (breakfast): breakfast_base + liquid(dairy) + fruit +
optional fat_topping.
- **Omelette / scramble** (breakfast): protein(eggs) + optional vegetable +
optional dairy(cheese) + optional base_carb(toast side).
- **Overnight oats** (breakfast/snack): breakfast_base + dairy + fruit +
optional fat_topping.
- **Grain bowl** (lunch/dinner): base_carb + protein + vegetable×1–2 + flavour.
- **Stir-fry** (lunch/dinner): protein + vegetable×2 + base_carb + flavour +
cooking_fat.
- **Yogurt/fruit/nut pot** (snack): dairy(yogurt) + fruit + fat_topping.
- **Roast/plate** (dinner): protein + vegetable×2 + base_carb + cooking_fat.

Each template:

- States which roles are required and which are optional.
- Limits each role to a sensible count (one protein, not three; 1–2 veg).
- Is tagged with which meal types and which diet labels it can satisfy (a
porridge bowl can be vegan if the liquid is plant milk, etc.).

## Part 3 — Generation flow

1. **Pick a template** valid for the requested meal type AND the user's dietary
  prefs AND any diet-label variety target (from bulk generation).
2. **Fill each role** with a role-compatible ingredient, respecting dietary
  constraints and avoiding ingredients already heavily used this week (variety).
3. **Scale portions** of the chosen ingredients to hit the meal's kcal/protein
  target within the band (this is where the existing tuning logic plugs in — it
   adjusts grams, not which foods).
4. **Name the meal** from the template + key ingredients ("Peanut Butter Overnight
  Oats", "Chicken & Broccoli Stir-fry") — real dish names, not ingredient lists.
5. **Compute nutrition** from the final ingredients via the existing CoFID path.
6. Respect the existing composition guards as a backstop (no two interchangeable
  proteins, etc.), but templates should make those rarely fire.

## Acceptance criteria

- Generated meals follow a recognisable dish structure — NO more eggs+oats+peanut
butter style piles. Generate 15 meals across breakfast/lunch/dinner/snack and
confirm each is a plausible dish.
- One protein per meal (unless a template explicitly allows a combo); 1–2 veg in
mains; fat_topping limited to its single role slot.
- Meals are named as dishes, not ingredient lists.
- Dietary prefs and diet-label variety respected; macros hit within band via
portion scaling.
- The ingredient→role mapping is shared with existing food-category logic, not a
new parallel taxonomy.
- Existing planner constraints still hold (no same-day duplicates, protein cap,
variety cap).

## Note

This replaces the macro-assembly SELECTION logic. The macro TUNING (portion
scaling to hit bands) is kept and plugged in at step 3 — it now scales within a
coherent template instead of assembling from scratch. Library-first reuse stays:
prefer a saved coherent recipe before generating a new one.

## Suggested commit breakdown

1. `feat(generator): ingredient→role mapping (shared food taxonomy)`
2. `feat(generator): meal templates/archetypes per meal type + diet label`
3. `feat(generator): template-fill generation + dish naming; macro tuning within template`