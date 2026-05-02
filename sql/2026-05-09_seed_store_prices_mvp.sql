-- Minimal seed for AI grocery price comparison MVP.
-- Safe to run repeatedly due to ON CONFLICT usage.

INSERT INTO public.canonical_items (
  name, category, default_unit,
  is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
  common_allergens
)
VALUES
  ('chicken breast', 'protein', 'g', false, false, true, true, ARRAY[]::text[]),
  ('salmon', 'protein', 'g', false, false, true, true, ARRAY[]::text[]),
  ('egg', 'protein', 'piece', false, true, true, false, ARRAY['eggs']),
  ('greek yoghurt', 'dairy', 'g', false, true, true, false, ARRAY['milk']),
  ('white rice', 'carb', 'g', true, true, true, true, ARRAY[]::text[]),
  ('pasta', 'carb', 'g', true, true, false, true, ARRAY['gluten','wheat']),
  ('oats', 'carb', 'g', true, true, false, true, ARRAY['gluten']),
  ('broccoli', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('spinach', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('tomatoes', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('onion', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('banana', 'fruit', 'piece', true, true, true, true, ARRAY[]::text[]),
  ('apple', 'fruit', 'piece', true, true, true, true, ARRAY[]::text[]),
  ('olive oil', 'fat', 'ml', true, true, true, true, ARRAY[]::text[]),
  ('cheddar cheese', 'dairy', 'g', false, true, true, false, ARRAY['milk'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.canonical_aliases (canonical_item_id, alias_text, source)
SELECT ci.id, a.alias_text, 'seed'
FROM (
  VALUES
    ('white rice', 'rice'),
    ('tomatoes', 'tomato'),
    ('greek yoghurt', 'greek yogurt'),
    ('cheddar cheese', 'cheese'),
    ('olive oil', 'extra virgin olive oil')
) AS a(canonical_name, alias_text)
JOIN public.canonical_items ci ON ci.name = a.canonical_name
ON CONFLICT (canonical_item_id, alias_text) DO NOTHING;

INSERT INTO public.store_products (
  store, product_name, canonical_item_id, size_value, size_unit,
  price_gbp, unit_price_gbp, product_url, price_volatility, confidence, last_seen_at
)
SELECT *
FROM (
  SELECT
    'tesco'::text AS store,
    'Tesco Chicken Breast Fillets 650g'::text AS product_name,
    (SELECT id FROM public.canonical_items WHERE name = 'chicken breast') AS canonical_item_id,
    650::numeric AS size_value, 'g'::text AS size_unit,
    4.99::numeric(10,2) AS price_gbp, 0.0077::numeric(10,4) AS unit_price_gbp,
    NULL::text AS product_url, 'high'::text AS price_volatility,
    0.84::numeric(5,2) AS confidence, now() - interval '1 day' AS last_seen_at
  UNION ALL
  SELECT 'asda','ASDA Chicken Breast Fillets 600g',(SELECT id FROM public.canonical_items WHERE name='chicken breast'),600,'g',4.35,0.0073,NULL,'high',0.83,now()-interval '2 day'
  UNION ALL
  SELECT 'aldi','Aldi Chicken Breast Fillets 650g',(SELECT id FROM public.canonical_items WHERE name='chicken breast'),650,'g',4.29,0.0066,NULL,'high',0.82,now()-interval '2 day'
  UNION ALL
  SELECT 'tesco','Tesco White Rice 1kg',(SELECT id FROM public.canonical_items WHERE name='white rice'),1000,'g',1.55,0.0016,NULL,'low',0.88,now()-interval '1 day'
  UNION ALL
  SELECT 'asda','ASDA Easy Cook Rice 1kg',(SELECT id FROM public.canonical_items WHERE name='white rice'),1000,'g',1.35,0.0014,NULL,'low',0.88,now()-interval '2 day'
  UNION ALL
  SELECT 'aldi','Aldi Long Grain Rice 1kg',(SELECT id FROM public.canonical_items WHERE name='white rice'),1000,'g',1.25,0.0013,NULL,'low',0.87,now()-interval '3 day'
  UNION ALL
  SELECT 'tesco','Tesco Broccoli 360g',(SELECT id FROM public.canonical_items WHERE name='broccoli'),360,'g',0.89,0.0025,NULL,'medium',0.79,now()-interval '1 day'
  UNION ALL
  SELECT 'asda','ASDA Broccoli 335g',(SELECT id FROM public.canonical_items WHERE name='broccoli'),335,'g',0.79,0.0024,NULL,'medium',0.79,now()-interval '2 day'
  UNION ALL
  SELECT 'aldi','Aldi Broccoli 360g',(SELECT id FROM public.canonical_items WHERE name='broccoli'),360,'g',0.75,0.0021,NULL,'medium',0.78,now()-interval '3 day'
  UNION ALL
  SELECT 'tesco','Tesco Greek Yoghurt 500g',(SELECT id FROM public.canonical_items WHERE name='greek yoghurt'),500,'g',1.89,0.0038,NULL,'medium',0.8,now()-interval '1 day'
  UNION ALL
  SELECT 'asda','ASDA Greek Style Yogurt 500g',(SELECT id FROM public.canonical_items WHERE name='greek yoghurt'),500,'g',1.65,0.0033,NULL,'medium',0.79,now()-interval '2 day'
  UNION ALL
  SELECT 'aldi','Aldi Greek Yogurt 500g',(SELECT id FROM public.canonical_items WHERE name='greek yoghurt'),500,'g',1.49,0.0030,NULL,'medium',0.79,now()-interval '2 day'
) seeded
WHERE canonical_item_id IS NOT NULL;
