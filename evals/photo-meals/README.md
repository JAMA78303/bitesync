# Photo meal eval

Photo logging stays switched off (`PHOTO_MEAL_LOGGING` unset; admins only) until this eval meets every target on at least 30 weighed meals. Run it again after any change to the prompt in `lib/photoMeal/identify.ts`, a change of model, or a change to food matching.

| Measure | Target |
|---|---|
| Foods named correctly | at least 85% |
| Energy (kcal), median error | 20% or less |
| Protein, median error | 20% or less |
| True energy inside the range shown | at least 70% |

## Making the cases

1. Weigh each food before it goes on the plate (or weigh the plate before and after each addition). Write the grams down.
2. Take the photo the way a user would: phone, from above or at a slight angle, whole plate in view.
3. Put the photo in `evals/photo-meals/photos/`.
4. Add the meal to `evals/photo-meals/cases.json` (copy the shape from `cases.example.json`):
   - `foods`: each food with its CoFID-style name and grams. The script works out the true calories and protein from these with the same food data the app uses, so the eval measures the photo reading, not the food tables.
   - `accept`: words that count as the AI naming that food correctly, if the first word of the name isn't enough (`"biryani"`, `"yogurt"`/`"yoghurt"`).
   - `kcal` and `protein`: only for packaged food, from the label for the whole item. These override the worked-out values.

Aim for a spread, as the spec asks: home-cooked plates, a takeaway, a sandwich, a bowl, mixed dishes (curry, biryani, stew), a snack and a drink.

Photos, `cases.json` and results are kept out of git (`.gitignore` here).

## Running it

```bash
node --env-file=.env.local --import tsx evals/photo-meals/run.ts
```

Options: `--model claude-sonnet-5-5` to try another model, `--cases path/to/cases.json`, `--limit 5` for a quick check.

Each meal is one paid call to the Claude API (one photo in, a short list of foods out). Try `--limit 3` first to check the cases file before a full run.

The script prints a line per meal, then the four measures with PASS or FAIL, and saves the full results in `evals/photo-meals/results/`. It exits non-zero when a target is missed.

## How it scores

- **Named correctly**: a true food counts if one of its `accept` words appears in any food the AI listed. Extra foods the AI adds don't count against it here, but they do move the calorie error.
- **Estimate**: what the review screen would add if the user changed nothing: each food at the middle of the AI's weight range, hidden extras (oil, butter) off.
- **Range**: the low and high ends the review screen shows before any edits.
- A photo that comes back as "not food" or fails counts as 100% off for energy and protein.

## Choosing the model

The app uses `PHOTO_MEAL_MODEL` if set, otherwise Claude Opus 5.5. The spec says to use the cheapest model that meets the targets: run the eval with `--model` for each candidate, then set `PHOTO_MEAL_MODEL` in Vercel to the cheapest one that passes.
