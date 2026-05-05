-- Run manually in Supabase SQL editor after review.
-- Aligns default units for whole/countable canonical items and common pack metadata.

UPDATE canonical_items
SET default_unit = 'piece'
WHERE name IN (
  'banana',
  'apple',
  'orange',
  'pear',
  'peach',
  'kiwi',
  'avocado',
  'lemon',
  'lime',
  'egg',
  'eggs',
  'onion',
  'red onion',
  'pepper',
  'red pepper',
  'green pepper',
  'yellow pepper',
  'courgette',
  'cucumber',
  'carrot',
  'potato',
  'sweet potato',
  'garlic',
  'tortilla wrap',
  'pitta bread',
  'stock cube'
);

UPDATE store_products
SET
  size_value = 6,
  size_unit = 'piece',
  min_purchase_size = 6,
  min_purchase_unit = 'piece'
WHERE canonical_item_id IN (
  SELECT id FROM canonical_items WHERE name IN ('eggs', 'egg')
);

UPDATE store_products
SET
  size_value = 5,
  size_unit = 'piece',
  min_purchase_size = 5,
  min_purchase_unit = 'piece'
WHERE canonical_item_id IN (
  SELECT id FROM canonical_items WHERE name = 'banana'
);

UPDATE store_products
SET
  size_value = 6,
  size_unit = 'piece',
  min_purchase_size = 6,
  min_purchase_unit = 'piece'
WHERE canonical_item_id IN (
  SELECT id FROM canonical_items WHERE name = 'apple'
);

UPDATE store_products
SET
  size_value = 3,
  size_unit = 'piece',
  min_purchase_size = 3,
  min_purchase_unit = 'piece'
WHERE canonical_item_id IN (
  SELECT id
  FROM canonical_items
  WHERE name IN ('peppers', 'red pepper', 'green pepper', 'yellow pepper')
);

UPDATE store_products
SET
  size_value = 1,
  size_unit = 'piece',
  min_purchase_size = 1,
  min_purchase_unit = 'piece'
WHERE canonical_item_id IN (
  SELECT id FROM canonical_items WHERE name = 'avocado'
);

UPDATE store_products
SET
  size_value = 1000,
  size_unit = 'g',
  min_purchase_size = 1000,
  min_purchase_unit = 'g'
WHERE canonical_item_id IN (
  SELECT id FROM canonical_items WHERE name IN ('onion', 'red onion')
);
