-- Extra aliases so recipe ingredient wording maps to MVP canonical items (improves AI grocery pricing).
INSERT INTO public.canonical_aliases (canonical_item_id, alias_text, source)
SELECT ci.id, a.alias, 'expand_2026_05_12'
FROM public.canonical_items ci
INNER JOIN (
  VALUES
    ('chicken breast', 'chicken'),
    ('chicken breast', 'diced chicken'),
    ('chicken breast', 'skinless chicken breast'),
    ('white rice', 'brown rice'),
    ('white rice', 'basmati rice'),
    ('white rice', 'jasmine rice'),
    ('white rice', 'rice'),
    ('broccoli', 'broccoli florets'),
    ('tomatoes', 'cherry tomatoes'),
    ('tomatoes', 'chopped tomatoes'),
    ('onion', 'yellow onion'),
    ('onion', 'red onion'),
    ('egg', 'eggs'),
    ('egg', 'large eggs'),
    ('oats', 'rolled oats'),
    ('pasta', 'spaghetti'),
    ('pasta', 'penne'),
    ('spinach', 'baby spinach'),
    ('banana', 'bananas'),
    ('apple', 'apples')
) AS a(canonical_name, alias)
ON ci.name = a.canonical_name
ON CONFLICT (canonical_item_id, alias_text) DO NOTHING;
