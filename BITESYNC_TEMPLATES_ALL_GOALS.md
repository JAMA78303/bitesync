# BiteSync — Build Spec: Template Generator Across All Calorie Goals

The template-based generator (`BITESYNC_MEAL_TEMPLATES.md`) was verified for
COHERENCE across 4 diets — but NOT for macro-hitting across the three calorie
GOALS (lose weight / maintain / build muscle). Coherence is goal-independent and
holds. Macro-hitting diverges per goal and is currently unverified. This spec
closes that gap and handles the failure mode low-calorie goals expose.

## Why goals differ (the core issue)

Each template has ONE gram-scaled slot doing the portion adjustment. That single
slot can fail in OPPOSITE directions depending on the goal:

- **Build muscle (high target):** the scalable slot may MAX OUT before reaching a
  high kcal/protein number (you can only add so much rice). Risk: undershoot
  (the old assembler already came in ~5% under on build-muscle).
- **Weight loss (low target):** a template's REQUIRED roles (protein + base + veg
  + topping) have a minimum sensible portion. Their sum may ALREADY EXCEED a low
  calorie target. Risk: overshoot, or the template is unusable and falls back to
  the old assembler. A coherent multi-component meal has a calorie FLOOR.

## TASK 1 — Handle the low-target floor problem

1. **Pick templates appropriate to the target size.** For low per-meal targets,
   prefer lighter templates (salad, yogurt pot, simple scramble) over heavy ones
   (roast plate, curry, grain bowl). Tag templates with a rough calorie range or
   "weight class" and choose accordingly.
2. **Scale more than the single slot when needed.** If hitting a low target
   requires it, allow scaling down multiple slots (and/or dropping optional
   roles) rather than only the one gram slot — within sensible minimum portions
   so the meal stays realistic.
3. **For high targets**, ensure the scalable slot (or adding an optional
   calorie-dense role like a fat_topping) can reach the number; if a template
   can't reach the target even maxed, pick a different template rather than
   undershoot silently.
4. **If no template can sensibly hit a target**, get as close as possible and
   surface it (the day totals row) — never pad with filler or produce a silly
   portion. Honest miss over fake hit.

## TASK 2 — Verify across all three calorie goals with REAL numbers

The synthetic 48-meal test checked coherence across DIETS, not calorie GOALS, and
ran on mock data. This task verifies macro-hitting per goal against the real
nutrition DB.

Run live (Supabase env) generations and report the day-by-day kcal + protein grid
for each:

| Goal | What to confirm |
|---|---|
| **Lose weight** (low target) | Meals land AT or UNDER target — the meal floor does NOT force overshoot. Lighter templates chosen. No fallback-to-old-assembler. |
| **Maintain** (mid target) | Lands on band (expected easy case). |
| **Build muscle** (high target) | Scalable slot REACHES the high target — no silent undershoot like the old assembler. |

For each goal: generate a full week (or a "Fill My Library" batch), confirm
coherence still holds (no piles) AND the kcal/protein land in band, and paste the
real grids.

## Acceptance criteria
- Templates are chosen appropriately for target size (light templates for low
  targets, templates that can reach high targets for build-muscle).
- Low-calorie goals land at/under target without overshoot and without falling
  back to the old assembler; meals stay coherent and realistically portioned.
- Build-muscle reaches target without silent undershoot.
- Maintain lands on band.
- All three goals verified LIVE with real numbers (grids pasted), coherence
  intact across all of them.
- Any unavoidable miss is surfaced honestly, never padded with filler.

## Note
Coherence is already proven and is goal-independent — do not re-litigate it. This
is specifically about macro-hitting and template selection per calorie goal,
verified against real data.

## Suggested commits
1. `feat(generator): target-aware template selection + multi-slot scaling`
2. `test(generator): live macro verification across lose/maintain/build goals`
