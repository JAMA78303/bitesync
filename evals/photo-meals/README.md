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

## No scale? Use Nutrition5k

[Nutrition5k](https://github.com/google-research-datasets/Nutrition5k) (Google, CVPR 2021, CC BY 4.0) has about 5,000 cafeteria plates photographed from above, with every ingredient weighed. `nutrition5k.ts` picks 40 whole plates from its test split and turns them into cases:

```bash
mkdir -p evals/photo-meals/nutrition5k && cd evals/photo-meals/nutrition5k
B=https://storage.googleapis.com/nutrition5k_dataset/nutrition5k_dataset
curl -O "$B/metadata/dish_metadata_cafe1.csv" -O "$B/metadata/dish_metadata_cafe2.csv" -O "$B/dish_ids/splits/rgb_test_ids.txt"
cd - && node --import tsx evals/photo-meals/nutrition5k.ts --count 40
node --env-file=.env.local --import tsx evals/photo-meals/run.ts --cases evals/photo-meals/nutrition5k/cases.json
```

What it does and doesn't tell you:
- It's food from California cafeterias (salads, roast veg, meat, rice), not UK curries or biryani, and the photos come from a fixed overhead camera, not a phone.
- Its true calories and protein come from US (USDA) data; the app's come from CoFID, so a little of the error is the two tables disagreeing. Real users see that difference too.
- Foods under 20 g (oil, salt, herbs) count towards the true totals but aren't expected to be named.
- US names are matched to UK ones (arugula = rocket, zucchini = courgette, mixed greens = salad leaves).

Good for checking that the photo reading works and for comparing models. Add some UK meals (labelled packs, chain menu items with published calories) before relying on it alone.

## Running it

```bash
node --env-file=.env.local --import tsx evals/photo-meals/run.ts
```

Options: `--model claude-sonnet-5-5` to try another model, `--cases path/to/cases.json`, `--limit 5` for a quick check, `--concurrency 4` photos at a time. It needs `ANTHROPIC_API_KEY` in `.env.local`, and prints the tokens used and what the run cost.

Each meal is one paid call to the Claude API (one photo in, a short list of foods out). Try `--limit 3` first to check the cases file before a full run.

The script prints a line per meal, then the four measures with PASS or FAIL, and saves the full results in `evals/photo-meals/results/`. It exits non-zero when a target is missed.

## How it scores

- **Named correctly**: a true food counts if one of its `accept` words appears in any food the AI listed. Extra foods the AI adds don't count against it here, but they do move the calorie error.
- **Estimate**: what the review screen would add if the user changed nothing: each food at the middle of the AI's weight range, hidden extras (oil, butter) off.
- **Range**: the low and high ends the review screen shows before any edits.
- A photo that comes back as "not food" or fails counts as 100% off for energy and protein.

## Choosing the model

The app uses `PHOTO_MEAL_MODEL` if set, otherwise Claude Opus 5.5. The spec says to use the cheapest model that meets the targets: run the eval with `--model` for each candidate, then set `PHOTO_MEAL_MODEL` in Vercel to the cheapest one that passes.
