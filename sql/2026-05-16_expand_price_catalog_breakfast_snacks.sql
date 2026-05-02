-- Expand catalogue for breakfast/snack/pantry ingredients.
-- Safe to re-run.

INSERT INTO public.canonical_items (
  name, category, default_unit,
  is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
  common_allergens
)
VALUES
  ('greek yogurt', 'dairy', 'g', false, true, true, false, ARRAY['milk']::text[]),
  ('cottage cheese', 'dairy', 'g', false, true, true, false, ARRAY['milk']::text[]),
  ('mozzarella', 'dairy', 'g', false, true, true, false, ARRAY['milk']::text[]),
  ('cream cheese', 'dairy', 'g', false, true, true, false, ARRAY['milk']::text[]),
  ('almonds', 'nuts', 'g', true, true, true, true, ARRAY['tree nuts']::text[]),
  ('peanut butter', 'nuts', 'g', true, true, true, true, ARRAY['peanut']::text[]),
  ('chia seeds', 'seeds', 'g', true, true, true, true, ARRAY[]::text[]),
  ('blueberries', 'fruit', 'g', true, true, true, true, ARRAY[]::text[]),
  ('strawberries', 'fruit', 'g', true, true, true, true, ARRAY[]::text[]),
  ('bread', 'carb', 'slice', true, true, false, true, ARRAY['gluten','wheat']::text[]),
  ('wrap', 'carb', 'piece', true, true, false, true, ARRAY['gluten','wheat']::text[]),
  ('kidney beans', 'protein', 'g', true, true, true, true, ARRAY[]::text[]),
  ('black beans', 'protein', 'g', true, true, true, true, ARRAY[]::text[]),
  ('tomato puree', 'condiment', 'g', true, true, true, true, ARRAY[]::text[]),
  ('soy sauce', 'condiment', 'ml', true, true, false, true, ARRAY['soy','wheat']::text[]),
  ('honey', 'condiment', 'g', false, true, true, true, ARRAY[]::text[]),
  ('coconut milk', 'dairy alternative', 'ml', true, true, true, true, ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.canonical_aliases (canonical_item_id, alias_text, source)
SELECT ci.id, a.alias_text, 'expand_2026_05_16'
FROM (
  VALUES
    ('greek yogurt', 'greek yoghurt'),
    ('greek yogurt', 'fat free greek yogurt'),
    ('cottage cheese', 'low fat cottage cheese'),
    ('mozzarella', 'mozzarella cheese'),
    ('cream cheese', 'soft cheese'),
    ('almonds', 'flaked almonds'),
    ('peanut butter', 'smooth peanut butter'),
    ('chia seeds', 'chia'),
    ('blueberries', 'frozen blueberries'),
    ('strawberries', 'frozen strawberries'),
    ('bread', 'wholemeal bread'),
    ('bread', 'sliced bread'),
    ('wrap', 'tortilla wraps'),
    ('kidney beans', 'red kidney beans'),
    ('black beans', 'black bean'),
    ('tomato puree', 'tomato paste'),
    ('soy sauce', 'light soy sauce'),
    ('coconut milk', 'light coconut milk')
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
    ('greek yogurt','tesco','Tesco Greek Yogurt 500g',500,'g',1.89,'low',0.82),
    ('greek yogurt','asda','ASDA Greek Yogurt 500g',500,'g',1.69,'low',0.81),
    ('greek yogurt','aldi','Aldi Greek Yogurt 500g',500,'g',1.49,'low',0.80),

    ('cottage cheese','tesco','Tesco Cottage Cheese 300g',300,'g',1.55,'low',0.80),
    ('cottage cheese','asda','ASDA Cottage Cheese 300g',300,'g',1.45,'low',0.79),
    ('cottage cheese','aldi','Aldi Cottage Cheese 300g',300,'g',1.29,'low',0.78),

    ('mozzarella','tesco','Tesco Mozzarella 125g',125,'g',1.29,'low',0.81),
    ('mozzarella','asda','ASDA Mozzarella 125g',125,'g',1.19,'low',0.80),
    ('mozzarella','aldi','Aldi Mozzarella 125g',125,'g',1.05,'low',0.79),

    ('cream cheese','tesco','Tesco Cream Cheese 200g',200,'g',1.40,'low',0.81),
    ('cream cheese','asda','ASDA Cream Cheese 200g',200,'g',1.25,'low',0.80),
    ('cream cheese','aldi','Aldi Cream Cheese 200g',200,'g',1.10,'low',0.79),

    ('almonds','tesco','Tesco Almonds 200g',200,'g',3.00,'low',0.80),
    ('almonds','asda','ASDA Almonds 200g',200,'g',2.80,'low',0.79),
    ('almonds','aldi','Aldi Almonds 200g',200,'g',2.49,'low',0.78),

    ('peanut butter','tesco','Tesco Peanut Butter 340g',340,'g',1.95,'low',0.82),
    ('peanut butter','asda','ASDA Peanut Butter 340g',340,'g',1.79,'low',0.81),
    ('peanut butter','aldi','Aldi Peanut Butter 340g',340,'g',1.55,'low',0.80),

    ('chia seeds','tesco','Tesco Chia Seeds 200g',200,'g',2.80,'low',0.79),
    ('chia seeds','asda','ASDA Chia Seeds 200g',200,'g',2.50,'low',0.78),
    ('chia seeds','aldi','Aldi Chia Seeds 200g',200,'g',2.20,'low',0.77),

    ('blueberries','tesco','Tesco Blueberries 150g',150,'g',2.20,'high',0.76),
    ('blueberries','asda','ASDA Blueberries 150g',150,'g',2.00,'high',0.75),
    ('blueberries','aldi','Aldi Blueberries 150g',150,'g',1.80,'high',0.74),

    ('strawberries','tesco','Tesco Strawberries 400g',400,'g',2.30,'high',0.76),
    ('strawberries','asda','ASDA Strawberries 400g',400,'g',2.10,'high',0.75),
    ('strawberries','aldi','Aldi Strawberries 400g',400,'g',1.95,'high',0.74),

    ('bread','tesco','Tesco Wholemeal Bread 800g',20,'slice',1.35,'low',0.83),
    ('bread','asda','ASDA Wholemeal Bread 800g',20,'slice',1.25,'low',0.82),
    ('bread','aldi','Aldi Wholemeal Bread 800g',20,'slice',1.05,'low',0.81),

    ('wrap','tesco','Tesco Wraps 8 Pack',8,'piece',1.30,'low',0.82),
    ('wrap','asda','ASDA Wraps 8 Pack',8,'piece',1.15,'low',0.81),
    ('wrap','aldi','Aldi Wraps 8 Pack',8,'piece',0.99,'low',0.80),

    ('kidney beans','tesco','Tesco Kidney Beans 400g',400,'g',0.85,'low',0.82),
    ('kidney beans','asda','ASDA Kidney Beans 400g',400,'g',0.75,'low',0.81),
    ('kidney beans','aldi','Aldi Kidney Beans 400g',400,'g',0.69,'low',0.80),

    ('black beans','tesco','Tesco Black Beans 400g',400,'g',0.95,'low',0.81),
    ('black beans','asda','ASDA Black Beans 400g',400,'g',0.85,'low',0.80),
    ('black beans','aldi','Aldi Black Beans 400g',400,'g',0.75,'low',0.79),

    ('tomato puree','tesco','Tesco Tomato Puree 200g',200,'g',0.75,'low',0.83),
    ('tomato puree','asda','ASDA Tomato Puree 200g',200,'g',0.69,'low',0.82),
    ('tomato puree','aldi','Aldi Tomato Puree 200g',200,'g',0.59,'low',0.81),

    ('soy sauce','tesco','Tesco Soy Sauce 150ml',150,'ml',1.25,'low',0.81),
    ('soy sauce','asda','ASDA Soy Sauce 150ml',150,'ml',1.10,'low',0.80),
    ('soy sauce','aldi','Aldi Soy Sauce 150ml',150,'ml',0.95,'low',0.79),

    ('honey','tesco','Tesco Honey 340g',340,'g',2.00,'low',0.80),
    ('honey','asda','ASDA Honey 340g',340,'g',1.85,'low',0.79),
    ('honey','aldi','Aldi Honey 340g',340,'g',1.65,'low',0.78),

    ('coconut milk','tesco','Tesco Coconut Milk 400ml',400,'ml',1.10,'low',0.80),
    ('coconut milk','asda','ASDA Coconut Milk 400ml',400,'ml',0.99,'low',0.79),
    ('coconut milk','aldi','Aldi Coconut Milk 400ml',400,'ml',0.89,'low',0.78)
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
