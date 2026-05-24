# CoFID import — run in Supabase SQL editor

Prerequisite: `sql/2026-05-24_cofid_foods.sql` (table already created).

**Easiest:** open **`index.html`** in this folder in your browser → 15 **Copy SQL** buttons → paste each into Supabase in order.

Or run each `.sql` file below **in order** (01 → 15).
Do not use the old single `2026-05-24_cofid_foods_import.sql` (too large for the editor).

After all parts: `SELECT COUNT(*) FROM cofid_foods;` → expect ~2886

Then run: `sql/2026-05-24_cofid_overrides_seed.sql`

- [ ] `part_01.sql` (200 rows)
- [ ] `part_02.sql` (200 rows)
- [ ] `part_03.sql` (200 rows)
- [ ] `part_04.sql` (200 rows)
- [ ] `part_05.sql` (200 rows)
- [ ] `part_06.sql` (200 rows)
- [ ] `part_07.sql` (200 rows)
- [ ] `part_08.sql` (200 rows)
- [ ] `part_09.sql` (200 rows)
- [ ] `part_10.sql` (200 rows)
- [ ] `part_11.sql` (200 rows)
- [ ] `part_12.sql` (200 rows)
- [ ] `part_13.sql` (200 rows)
- [ ] `part_14.sql` (200 rows)
- [ ] `part_15.sql` (86 rows)