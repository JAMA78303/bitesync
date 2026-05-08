-- Add lighter meal ingredients to improve healthy planning and pricing coverage.
-- Safe to re-run.

INSERT INTO public.canonical_items (
  name, category, default_unit,
  is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
  common_allergens
)
VALUES
  ('lettuce', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('rocket', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('courgette', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('cauliflower rice', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('quinoa', 'carb', 'g', true, true, true, true, ARRAY[]::text[]),
  ('lentils', 'protein', 'g', true, true, true, true, ARRAY[]::text[]),
  ('chickpeas', 'protein', 'g', true, true, true, true, ARRAY[]::text[]),
  ('feta cheese', 'dairy', 'g', false, true, true, false, ARRAY['milk']::text[])
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.canonical_aliases (canonical_item_id, alias_text, source)
SELECT ci.id, a.alias_text, 'expand_2026_05_18_light'
FROM (
  VALUES
    ('lettuce', 'romaine lettuce'),
    ('lettuce', 'cos lettuce'),
    ('rocket', 'arugula'),
    ('courgette', 'zucchini'),
    ('cauliflower rice', 'cauli rice'),
    ('cauliflower rice', 'riced cauliflower'),
    ('quinoa', 'quinoa grains'),
    ('lentils', 'red lentils'),
    ('lentils', 'green lentils'),
    ('chickpeas', 'garbanzo beans'),
    ('feta cheese', 'feta')
) AS a(canonical_name, alias_text)
JOIN public.canonical_items ci
  ON ci.name = a.canonical_name
ON CONFLICT (canonical_item_id, alias_text) DO NOTHING;

INSERT INTO public.store_products (
  store, product_name, canonical_item_id, size_value, size_unit,
  price_gbp, unit_price_gbp, price_volatility, confidence, last_seen_at
)
SELECT
  v.store,
  v.product_name,
  ci.id,
  v.size_value,
  v.size_unit,
  v.price_gbp,
  ROUND((v.price_gbp / NULLIF(v.size_value, 0))::numeric, 4),
  v.price_volatility,
  v.confidence,
  now() - interval '1 day'
FROM public.canonical_items ci
JOIN (
  VALUES
    ('lettuce','tesco','Tesco Romaine Lettuce 200g',200,'g',1.10,'medium',0.80),
    ('lettuce','asda','ASDA Romaine Lettuce 200g',200,'g',0.99,'medium',0.79),
    ('lettuce','aldi','Aldi Lettuce 200g',200,'g',0.89,'medium',0.78),

    ('rocket','tesco','Tesco Rocket 60g',60,'g',0.85,'medium',0.79),
    ('rocket','asda','ASDA Rocket 60g',60,'g',0.75,'medium',0.78),
    ('rocket','aldi','Aldi Rocket 60g',60,'g',0.69,'medium',0.77),

    ('courgette','tesco','Tesco Courgettes 500g',500,'g',1.35,'medium',0.80),
    ('courgette','asda','ASDA Courgettes 500g',500,'g',1.25,'medium',0.79),
    ('courgette','aldi','Aldi Courgettes 500g',500,'g',1.09,'medium',0.78),

    ('cauliflower rice','tesco','Tesco Cauliflower Rice 400g',400,'g',1.70,'medium',0.77),
    ('cauliflower rice','asda','ASDA Cauliflower Rice 400g',400,'g',1.55,'medium',0.76),
    ('cauliflower rice','aldi','Aldi Cauliflower Rice 400g',400,'g',1.35,'medium',0.75),

    ('quinoa','tesco','Tesco Quinoa 300g',300,'g',2.40,'low',0.81),
    ('quinoa','asda','ASDA Quinoa 300g',300,'g',2.20,'low',0.80),
    ('quinoa','aldi','Aldi Quinoa 300g',300,'g',1.99,'low',0.79),

    ('lentils','tesco','Tesco Red Lentils 500g',500,'g',1.45,'low',0.82),
    ('lentils','asda','ASDA Red Lentils 500g',500,'g',1.30,'low',0.81),
    ('lentils','aldi','Aldi Red Lentils 500g',500,'g',1.15,'low',0.80),

    ('chickpeas','tesco','Tesco Chickpeas 400g',400,'g',0.85,'low',0.83),
    ('chickpeas','asda','ASDA Chickpeas 400g',400,'g',0.75,'low',0.82),
    ('chickpeas','aldi','Aldi Chickpeas 400g',400,'g',0.69,'low',0.81),

    ('feta cheese','tesco','Tesco Feta Cheese 200g',200,'g',2.25,'medium',0.80),
    ('feta cheese','asda','ASDA Feta Cheese 200g',200,'g',2.10,'medium',0.79),
    ('feta cheese','aldi','Aldi Feta Cheese 200g',200,'g',1.89,'medium',0.78)
) AS v(
  canonical_name,
  store,
  product_name,
  size_value,
  size_unit,
  price_gbp,
  price_volatility,
  confidence
)
  ON ci.name = v.canonical_name
WHERE NOT EXISTS (
  SELECT 1
  FROM public.store_products sp
  WHERE sp.store = v.store
    AND sp.product_name = v.product_name
);

UPDATE public.store_products sp
SET
  min_purchase_size = v.min_sz::numeric,
  min_purchase_unit = v.min_ut::text,
  min_purchase_price = sp.price_gbp
FROM public.canonical_items ci
JOIN (
  VALUES
    ('lettuce', 200, 'g'),
    ('rocket', 60, 'g'),
    ('courgette', 500, 'g'),
    ('cauliflower rice', 400, 'g'),
    ('quinoa', 300, 'g'),
    ('lentils', 500, 'g'),
    ('chickpeas', 400, 'g'),
    ('feta cheese', 200, 'g')
) AS v(item_name, min_sz, min_ut) ON ci.name = v.item_name
WHERE sp.canonical_item_id = ci.id
  AND (sp.min_purchase_size IS NULL OR sp.min_purchase_unit IS NULL OR sp.min_purchase_price IS NULL);
