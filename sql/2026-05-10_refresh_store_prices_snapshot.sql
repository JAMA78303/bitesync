-- Refresh catalogue shelf prices after ~1 week of drift.
-- Method: category/name multipliers from a quick external snapshot (Trolley.co.uk + Tesco/ASDA/Aldi
-- listings, early May 2026). Still ESTIMATES — verify high-impact SKUs in admin before relying on £ totals.
-- Safe to re-run (idempotent-ish: recomputes from current row price_gbp).

WITH adjusted AS (
  SELECT
    sp.id,
    sp.size_value,
    sp.min_purchase_size,
    ci.name AS canonical_name,
    ROUND(
      (
        CASE
          WHEN ci.name = 'olive oil' THEN sp.price_gbp * 1.48
          WHEN ci.name = 'egg' THEN sp.price_gbp * 1.13
          WHEN ci.name IN ('chicken breast', 'salmon', 'shrimp', 'turkey breast', 'beef mince')
            THEN sp.price_gbp * 1.04
          WHEN ci.category = 'protein' THEN sp.price_gbp * 1.055
          WHEN ci.category IN ('dairy', 'dairy alternative') THEN sp.price_gbp * 1.065
          WHEN ci.category IN ('nuts', 'seeds') THEN sp.price_gbp * 1.05
          WHEN ci.category = 'fruit' THEN sp.price_gbp * 1.065
          WHEN ci.category = 'carb' THEN sp.price_gbp * 1.055
          WHEN ci.category = 'veg' THEN sp.price_gbp * 1.055
          WHEN ci.category = 'condiment' THEN sp.price_gbp * 1.055
          WHEN ci.category = 'fat' THEN sp.price_gbp * 1.05
          ELSE sp.price_gbp * 1.055
        END
      )::numeric,
      2
    ) AS new_price_gbp
  FROM public.store_products sp
  INNER JOIN public.canonical_items ci ON ci.id = sp.canonical_item_id
)
UPDATE public.store_products sp
SET
  price_gbp = a.new_price_gbp,
  unit_price_gbp = ROUND(
    (
      CASE
        WHEN a.canonical_name = 'egg' THEN a.new_price_gbp / 6.0
        ELSE a.new_price_gbp / NULLIF(a.size_value, 0)
      END
    )::numeric,
    4
  ),
  last_seen_at = timezone('utc', now()),
  min_purchase_price =
    CASE
      WHEN a.min_purchase_size IS NOT NULL THEN a.new_price_gbp
      ELSE sp.min_purchase_price
    END
FROM adjusted a
WHERE sp.id = a.id;
