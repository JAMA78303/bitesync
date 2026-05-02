-- Fill store_products for MVP canonicals that had no prices (matching worked but £ estimates were empty).
-- Adds plant proteins used by goal-matched / vegan recipes. Safe to re-run (skips duplicate store+product_name).

INSERT INTO public.canonical_items (
  name, category, default_unit,
  is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
  common_allergens
)
VALUES
  ('tofu', 'protein', 'g', true, true, true, true, ARRAY['soy']::text[]),
  ('lentils', 'protein', 'g', true, true, true, true, ARRAY[]::text[]),
  ('quinoa', 'carb', 'g', true, true, true, true, ARRAY[]::text[]),
  ('chickpeas', 'protein', 'g', true, true, true, true, ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.canonical_aliases (canonical_item_id, alias_text, source)
SELECT ci.id, a.alias_text, 'expand_store_2026_05_13'
FROM (
  VALUES
    ('tofu', 'firm tofu'),
    ('lentils', 'red lentils'),
    ('lentils', 'green lentils'),
    ('quinoa', 'white quinoa'),
    ('chickpeas', 'chick peas'),
    ('chickpeas', 'garbanzo beans')
) AS a(canonical_name, alias_text)
JOIN public.canonical_items ci ON ci.name = a.canonical_name
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
  ROUND(
    (
      CASE
        WHEN v.canonical_name = 'egg' THEN v.price_gbp / 6.0
        ELSE v.price_gbp / NULLIF(v.size_value, 0)
      END
    )::numeric,
    4
  ) AS unit_price_gbp,
  v.price_volatility,
  v.confidence,
  now() - interval '1 day'
FROM public.canonical_items ci
INNER JOIN (
  VALUES
    ('salmon', 'tesco'::text, 'Tesco Salmon Fillets 280g'::text, 280::numeric, 'g'::text, 5.75::numeric, 'medium'::text, 0.78::numeric),
    ('salmon', 'asda', 'ASDA Salmon Fillets 250g', 250, 'g', 5.25, 'medium', 0.77),
    ('salmon', 'aldi', 'Aldi Salmon Fillets 240g', 240, 'g', 4.99, 'medium', 0.76),
    ('pasta', 'tesco', 'Tesco Spaghetti 500g', 500, 'g', 0.95, 'low', 0.85),
    ('pasta', 'asda', 'ASDA Penne 500g', 500, 'g', 0.85, 'low', 0.84),
    ('pasta', 'aldi', 'Aldi Pasta 500g', 500, 'g', 0.75, 'low', 0.83),
    ('oats', 'tesco', 'Tesco Porridge Oats 1kg', 1000, 'g', 1.45, 'low', 0.86),
    ('oats', 'asda', 'ASDA Rolled Oats 1kg', 1000, 'g', 1.25, 'low', 0.85),
    ('oats', 'aldi', 'Aldi Oats 1kg', 1000, 'g', 1.15, 'low', 0.84),
    ('spinach', 'tesco', 'Tesco Spinach 260g', 260, 'g', 1.20, 'medium', 0.8),
    ('spinach', 'asda', 'ASDA Spinach 200g', 200, 'g', 1.00, 'medium', 0.79),
    ('spinach', 'aldi', 'Aldi Spinach 250g', 250, 'g', 0.95, 'medium', 0.78),
    ('tomatoes', 'tesco', 'Tesco Tomatoes 400g', 400, 'g', 1.10, 'medium', 0.8),
    ('tomatoes', 'asda', 'ASDA Tomatoes 400g', 400, 'g', 0.99, 'medium', 0.79),
    ('tomatoes', 'aldi', 'Aldi Tomatoes 400g', 400, 'g', 0.89, 'medium', 0.78),
    ('onion', 'tesco', 'Tesco Brown Onions 1kg', 1000, 'g', 1.10, 'low', 0.82),
    ('onion', 'asda', 'ASDA Onions 1kg', 1000, 'g', 0.99, 'low', 0.81),
    ('onion', 'aldi', 'Aldi Onions 1kg', 1000, 'g', 0.89, 'low', 0.8),
    ('banana', 'tesco', 'Tesco Bananas 5 Pack ~650g', 650, 'g', 1.00, 'low', 0.75),
    ('banana', 'asda', 'ASDA Bananas 5 Pack ~650g', 650, 'g', 0.95, 'low', 0.74),
    ('banana', 'aldi', 'Aldi Bananas 5 Pack ~650g', 650, 'g', 0.89, 'low', 0.73),
    ('apple', 'tesco', 'Tesco Apples 6 Pack ~480g', 480, 'g', 1.80, 'low', 0.76),
    ('apple', 'asda', 'ASDA Apples 6 Pack ~480g', 480, 'g', 1.65, 'low', 0.75),
    ('apple', 'aldi', 'Aldi Apples 6 Pack ~480g', 480, 'g', 1.49, 'low', 0.74),
    ('olive oil', 'tesco', 'Tesco Olive Oil 500ml', 500, 'ml', 3.50, 'medium', 0.82),
    ('olive oil', 'asda', 'ASDA Olive Oil 500ml', 500, 'ml', 3.20, 'medium', 0.81),
    ('olive oil', 'aldi', 'Aldi Olive Oil 500ml', 500, 'ml', 2.99, 'medium', 0.8),
    ('cheddar cheese', 'tesco', 'Tesco Mature Cheddar 400g', 400, 'g', 3.25, 'medium', 0.8),
    ('cheddar cheese', 'asda', 'ASDA Mature Cheddar 400g', 400, 'g', 2.99, 'medium', 0.79),
    ('cheddar cheese', 'aldi', 'Aldi Mature Cheddar 400g', 400, 'g', 2.79, 'medium', 0.78),
    ('egg', 'tesco', 'Tesco Free Range Eggs 6', 6, 'piece', 1.85, 'medium', 0.8),
    ('egg', 'asda', 'ASDA Free Range Eggs 6', 6, 'piece', 1.65, 'medium', 0.79),
    ('egg', 'aldi', 'Aldi Free Range Eggs 6', 6, 'piece', 1.49, 'medium', 0.78),
    ('tofu', 'tesco', 'Tesco Firm Tofu 400g', 400, 'g', 1.95, 'medium', 0.78),
    ('tofu', 'asda', 'ASDA Firm Tofu 400g', 400, 'g', 1.75, 'medium', 0.77),
    ('tofu', 'aldi', 'Aldi Firm Tofu 400g', 400, 'g', 1.59, 'medium', 0.76),
    ('lentils', 'tesco', 'Tesco Red Lentils 500g', 500, 'g', 1.40, 'low', 0.82),
    ('lentils', 'asda', 'ASDA Red Lentils 500g', 500, 'g', 1.25, 'low', 0.81),
    ('lentils', 'aldi', 'Aldi Red Lentils 500g', 500, 'g', 1.09, 'low', 0.8),
    ('quinoa', 'tesco', 'Tesco Quinoa 300g', 300, 'g', 2.20, 'medium', 0.78),
    ('quinoa', 'asda', 'ASDA Quinoa 300g', 300, 'g', 1.99, 'medium', 0.77),
    ('quinoa', 'aldi', 'Aldi Quinoa 300g', 300, 'g', 1.79, 'medium', 0.76),
    ('chickpeas', 'tesco', 'Tesco Chickpeas 400g', 400, 'g', 0.85, 'low', 0.8),
    ('chickpeas', 'asda', 'ASDA Chickpeas 400g', 400, 'g', 0.75, 'low', 0.79),
    ('chickpeas', 'aldi', 'Aldi Chickpeas 400g', 400, 'g', 0.69, 'low', 0.78)
) AS v(
  canonical_name text,
  store text,
  product_name text,
  size_value numeric,
  size_unit text,
  price_gbp numeric,
  price_volatility text,
  confidence numeric
)
  ON ci.name = v.canonical_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_products sp
  WHERE sp.store = v.store AND sp.product_name = v.product_name
);
