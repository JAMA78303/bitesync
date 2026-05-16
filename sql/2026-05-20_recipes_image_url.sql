-- Optional recipe hero image for today view / meal cards
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN recipes.image_url IS 'Optional URL for recipe photo; emoji fallback when null';
