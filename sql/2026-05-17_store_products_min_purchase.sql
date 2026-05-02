-- Minimum purchasable pack metadata for realistic basket totals.
-- min_purchase_price defaults to the row shelf price (one pack) when set from seed.

ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS min_purchase_size NUMERIC,
  ADD COLUMN IF NOT EXISTS min_purchase_unit TEXT,
  ADD COLUMN IF NOT EXISTS min_purchase_price NUMERIC;

UPDATE public.store_products sp
SET
  min_purchase_size = v.min_sz::numeric,
  min_purchase_unit = v.min_ut::text,
  min_purchase_price = sp.price_gbp
FROM public.canonical_items ci
JOIN (
  VALUES
    ('chicken breast', 500, 'g'),
    ('salmon', 300, 'g'),
    ('egg', 6, 'piece'),
    ('greek yoghurt', 500, 'g'),
    ('greek yogurt', 500, 'g'),
    ('white rice', 1000, 'g'),
    ('pasta', 500, 'g'),
    ('oats', 1000, 'g'),
    ('broccoli', 400, 'g'),
    ('spinach', 200, 'g'),
    ('tomatoes', 500, 'g'),
    ('onion', 1000, 'g'),
    ('banana', 5, 'piece'),
    ('apple', 6, 'piece'),
    ('olive oil', 500, 'ml'),
    ('cheddar cheese', 400, 'g'),
    ('turkey breast', 500, 'g'),
    ('beef mince', 500, 'g'),
    ('tuna', 145, 'g'),
    ('shrimp', 200, 'g'),
    ('sweet potato', 1000, 'g'),
    ('bell pepper', 450, 'g'),
    ('carrot', 1000, 'g'),
    ('green beans', 220, 'g'),
    ('asparagus', 250, 'g'),
    ('peas', 900, 'g'),
    ('cucumber', 300, 'g'),
    ('avocado', 1, 'piece'),
    ('potato', 2000, 'g'),
    ('garlic', 3, 'piece'),
    ('mushroom', 400, 'g'),
    ('cottage cheese', 300, 'g'),
    ('mozzarella', 125, 'g'),
    ('cream cheese', 200, 'g'),
    ('almonds', 200, 'g'),
    ('peanut butter', 340, 'g'),
    ('chia seeds', 200, 'g'),
    ('blueberries', 150, 'g'),
    ('strawberries', 400, 'g'),
    ('bread', 20, 'slice'),
    ('wrap', 8, 'piece'),
    ('kidney beans', 400, 'g'),
    ('black beans', 400, 'g'),
    ('tomato puree', 200, 'g'),
    ('soy sauce', 150, 'ml'),
    ('honey', 340, 'g'),
    ('coconut milk', 400, 'ml')
) AS v(item_name, min_sz, min_ut) ON ci.name = v.item_name
WHERE sp.canonical_item_id = ci.id;
