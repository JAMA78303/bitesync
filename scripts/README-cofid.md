# CoFID import data

McCance & Widdowson's Composition of Foods Integrated Dataset 2021 (Open Government Licence v3.0).

## Download

**Preferred (full macros + micronutrients, multi-sheet Excel):**

https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx

Save as `scripts/cofid_2021.xlsx`.

**Alternative (macros only, CSV):**

- [Kaggle](https://www.kaggle.com/datasets/akprodromou/composition-of-foods-integrated-dataset-cofid) → save as `scripts/cofid_2021.csv`, or
- Gov.uk publication page → integrated dataset spreadsheet (export/save as CSV if needed).

## Import (order matters)

1. Run `sql/2026-05-24_cofid_foods.sql` in Supabase SQL editor.
2. Import rows (pick one):

**Option A — SQL files** (no API keys; run in Supabase SQL editor):

```bash
npm run export:cofid-sql   # writes sql/cofid_import/part_01.sql … part_N.sql
```

Open `sql/cofid_import/README.md` and run each `part_XX.sql` **in order** (one file per query — the editor chokes on a single 600KB script).

**Option B — API script:**

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run import:cofid
```

3. Run `sql/2026-05-24_cofid_overrides.sql` (creates overrides table).
4. Run `sql/2026-05-24_cofid_overrides_seed.sql` **only after step 2** (needs FK targets in `cofid_foods`).

Re-running the import is safe (upsert on `food_code`).

Verify import: `SELECT COUNT(*) FROM cofid_foods;` should be ~2887.
