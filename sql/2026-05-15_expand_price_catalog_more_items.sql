-- Expand price catalogue coverage so AI grocery can price more ingredient names.
-- Safe to re-run (ON CONFLICT / NOT EXISTS checks).

INSERT INTO public.canonical_items (
  name, category, default_unit,
  is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
  common_allergens
)
VALUES
  ('turkey breast', 'protein', 'g', false, false, true, true, ARRAY[]::text[]),
  ('beef mince', 'protein', 'g', false, false, true, true, ARRAY[]::text[]),
  ('tuna', 'protein', 'g', false, false, true, true, ARRAY['fish']::text[]),
  ('shrimp', 'protein', 'g', false, false, true, true, ARRAY['shellfish']::text[]),
  ('sweet potato', 'carb', 'g', true, true, true, true, ARRAY[]::text[]),
  ('bell pepper', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('carrot', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('green beans', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('asparagus', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('peas', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('cucumber', 'veg', 'g', true, true, true, true, ARRAY[]::text[]),
  ('avocado', 'fruit', 'piece', true, true, true, true, ARRAY[]::text[]),
  ('potato', 'carb', 'g', true, true, true, true, ARRAY[]::text[]),
  ('garlic', 'veg', 'piece', true, true, true, true, ARRAY[]::text[]),
  ('mushroom', 'veg', 'g', true, true, true, true, ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.canonical_aliases (canonical_item_id, alias_text, source)
SELECT ci.id, a.alias_text, 'expand_2026_05_15'
FROM (
  VALUES
    ('turkey breast', 'turkey'),
    ('beef mince', 'minced beef'),
    ('beef mince', 'ground beef'),
    ('tuna', 'canned tuna'),
    ('shrimp', 'prawns'),
    ('sweet potato', 'sweet potatoes'),
    ('bell pepper', 'peppers'),
    ('bell pepper', 'red pepper'),
    ('carrot', 'carrots'),
    ('green beans', 'green bean'),
    ('asparagus', 'asparagus spears'),
    ('peas', 'garden peas'),
    ('cucumber', 'cucumbers'),
    ('avocado', 'avocados'),
    ('potato', 'potatoes'),
    ('garlic', 'garlic cloves'),
    ('mushroom', 'mushrooms'),
    ('tomatoes', 'tomato'),
    ('greek yoghurt', 'greek yogurt'),
    ('egg', 'eggs')
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
    ('turkey breast','tesco','Tesco Turkey Breast Fillets 500g',500,'g',4.50,'medium',0.82),
    ('turkey breast','asda','ASDA Turkey Breast 500g',500,'g',4.20,'medium',0.81),
    ('turkey breast','aldi','Aldi Turkey Breast 500g',500,'g',3.99,'medium',0.80),

    ('beef mince','tesco','Tesco 5% Fat Beef Mince 500g',500,'g',4.20,'high',0.81),
    ('beef mince','asda','ASDA Lean Beef Mince 500g',500,'g',3.95,'high',0.80),
    ('beef mince','aldi','Aldi Lean Beef Mince 500g',500,'g',3.79,'high',0.79),

    ('tuna','tesco','Tesco Tuna Chunks in Spring Water 145g',145,'g',1.15,'low',0.83),
    ('tuna','asda','ASDA Tuna Chunks in Spring Water 145g',145,'g',1.00,'low',0.82),
    ('tuna','aldi','Aldi Tuna Chunks 145g',145,'g',0.89,'low',0.81),

    ('shrimp','tesco','Tesco King Prawns 225g',225,'g',3.99,'medium',0.78),
    ('shrimp','asda','ASDA King Prawns 210g',210,'g',3.75,'medium',0.77),
    ('shrimp','aldi','Aldi King Prawns 180g',180,'g',3.39,'medium',0.76),

    ('sweet potato','tesco','Tesco Sweet Potatoes 1kg',1000,'g',1.80,'medium',0.82),
    ('sweet potato','asda','ASDA Sweet Potatoes 1kg',1000,'g',1.65,'medium',0.81),
    ('sweet potato','aldi','Aldi Sweet Potatoes 1kg',1000,'g',1.49,'medium',0.80),

    ('bell pepper','tesco','Tesco Mixed Peppers 3 Pack',450,'g',1.55,'medium',0.80),
    ('bell pepper','asda','ASDA Mixed Peppers 3 Pack',450,'g',1.45,'medium',0.79),
    ('bell pepper','aldi','Aldi Mixed Peppers 3 Pack',450,'g',1.25,'medium',0.78),

    ('carrot','tesco','Tesco Carrots 1kg',1000,'g',0.89,'low',0.85),
    ('carrot','asda','ASDA Carrots 1kg',1000,'g',0.79,'low',0.84),
    ('carrot','aldi','Aldi Carrots 1kg',1000,'g',0.69,'low',0.83),

    ('green beans','tesco','Tesco Fine Green Beans 220g',220,'g',1.35,'medium',0.78),
    ('green beans','asda','ASDA Fine Green Beans 220g',220,'g',1.20,'medium',0.77),
    ('green beans','aldi','Aldi Green Beans 220g',220,'g',1.05,'medium',0.76),

    ('asparagus','tesco','Tesco Asparagus 250g',250,'g',2.20,'high',0.74),
    ('asparagus','asda','ASDA Asparagus 250g',250,'g',1.99,'high',0.73),
    ('asparagus','aldi','Aldi Asparagus 250g',250,'g',1.79,'high',0.72),

    ('peas','tesco','Tesco Garden Peas 900g',900,'g',1.45,'low',0.84),
    ('peas','asda','ASDA Garden Peas 900g',900,'g',1.35,'low',0.83),
    ('peas','aldi','Aldi Garden Peas 900g',900,'g',1.19,'low',0.82),

    ('cucumber','tesco','Tesco Cucumber Each',300,'g',0.75,'medium',0.79),
    ('cucumber','asda','ASDA Cucumber Each',300,'g',0.69,'medium',0.78),
    ('cucumber','aldi','Aldi Cucumber Each',300,'g',0.59,'medium',0.77),

    ('avocado','tesco','Tesco Avocado Each',1,'piece',0.89,'high',0.75),
    ('avocado','asda','ASDA Avocado Each',1,'piece',0.85,'high',0.74),
    ('avocado','aldi','Aldi Avocado Each',1,'piece',0.75,'high',0.73),

    ('potato','tesco','Tesco White Potatoes 2kg',2000,'g',2.10,'medium',0.82),
    ('potato','asda','ASDA White Potatoes 2kg',2000,'g',1.95,'medium',0.81),
    ('potato','aldi','Aldi White Potatoes 2kg',2000,'g',1.75,'medium',0.80),

    ('garlic','tesco','Tesco Garlic 3 Pack',3,'piece',0.79,'low',0.80),
    ('garlic','asda','ASDA Garlic 3 Pack',3,'piece',0.69,'low',0.79),
    ('garlic','aldi','Aldi Garlic 3 Pack',3,'piece',0.59,'low',0.78),

    ('mushroom','tesco','Tesco Closed Cup Mushrooms 300g',300,'g',1.20,'medium',0.81),
    ('mushroom','asda','ASDA Closed Cup Mushrooms 300g',300,'g',1.10,'medium',0.80),
    ('mushroom','aldi','Aldi Closed Cup Mushrooms 300g',300,'g',0.95,'medium',0.79)
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
